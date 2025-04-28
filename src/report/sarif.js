const fs = require('fs');
const path = require('path');
const { version: TOOL_VERSION } = require('../../package.json');

/**
 * Build minimal SARIF v2.1.0 document from aggregated findings.
 * @param {object} findingsAgg - output of getFindingsForHashes
 */
function buildSarif(findingsAgg) {
  const rulesMap = {};
  const results = [];

  findingsAgg.findings.forEach((set) => {
    const ruleId = set.cwe_id;
    if (!rulesMap[ruleId]) {
      const ruleObj = {
        id: ruleId,
        shortDescription: { text: set.description || ruleId },
        fullDescription: { text: `Findings for ${ruleId}` },
        help: { text: `Refer to ${ruleId} documentation`, markdown: `**${ruleId}**` },
        properties: { tags: [ruleId] },
      };
      // Add a human-friendly name only if it differs from id to satisfy SARIF1001
      if (set.description && set.description !== ruleId) {
        ruleObj.name = set.description;
      }
      rulesMap[ruleId] = ruleObj;
    }

    // Each finding location is not yet mapped to source code; we attach one per finding index
    const arr = Array.isArray(set.findings.findings)
      ? set.findings.findings
      : set.findings;
    arr.forEach((f) => {
      const res = {
        ruleId,
        message: { text: f.code || 'Finding' },
        level: 'warning',
      };
      if (typeof f.call_addr === 'number') {
        res.locations = [
          {
            physicalLocation: {
              artifactLocation: { uri: (set.hash || 'binary'), index: 0 },
              address: { absoluteAddress: f.call_addr, kind: 'instruction' },
            },
          },
        ];
      } else {
        // Provide minimal artifact location even without address to satisfy SARIF1006
        res.locations = [
          {
            physicalLocation: {
              artifactLocation: { uri: (set.hash || 'binary'), index: 0 },
            },
          },
        ];
      }
      results.push(res);
    });
  });

  const sarif = {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'NetRise ZeroLens',
            fullName: 'NetRise ZeroLens GitHub Action',
            informationUri: 'https://zerolens.netrise.io',
            version: TOOL_VERSION,
            rules: Object.values(rulesMap),
          },
        },
        artifacts: [
          {
            location: { uri: 'binary', index: 0 },
            description: { text: 'Scanned binary file' },
          },
        ],
        results,
      },
    ],
  };
  return sarif;
}

function writeSarif(filePath, sarifObj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(sarifObj, null, 2));
}

module.exports = { buildSarif, writeSarif }; 