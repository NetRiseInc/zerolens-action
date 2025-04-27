const fs = require('fs');
const path = require('path');

function buildReport(findingsAgg, aiResults, hashes, policy) {
  let md = '# ZeroLens Security Report\n\n';
  md += `**Generated:** ${new Date().toISOString()}  \n`;
  md += `**Binaries:** ${hashes.join(', ')}\n\n`;

  md += '## Summary\n\n';
  Object.entries(findingsAgg.summary)
    .filter(([, c]) => c > 0)
    .forEach(([cwe, cnt]) => {
      md += `- **${cwe}**: ${cnt} findings\n`;
    });
  if (policy.blocking === 0 && policy.warnings === 0)
    md += '\n✅ No policy violations\n';

  md += '\n---\n';

  findingsAgg.findings.forEach((set) => {
    md += `### ${set.cwe_id} – ${set.description} (v${set.version})\n\n`;
    const arr = Array.isArray(set.findings.findings)
      ? set.findings.findings
      : set.findings;
    arr.slice(0, 10).forEach((f, idx) => {
      md += `**Finding ${idx + 1}:** \`${f.code}\`  \n`;
    });
    md += '\n';
  });

  if (aiResults) {
    md += '\n## AI Analysis\n';
    Object.values(aiResults).forEach((ai) => {
      ai.analysis.results.forEach((r) => {
        r.analyses.forEach((an) => {
          md += `\n> **${an.code}**\n\n${an.analysis}\n`;
        });
      });
    });
  }

  return md;
}

function writeFullReport(filePath, markdown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, markdown);
}

module.exports = { buildReport, writeFullReport }; 