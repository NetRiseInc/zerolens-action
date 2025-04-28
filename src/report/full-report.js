const fs = require('fs');
const path = require('path');

function buildReport(findingsAgg, aiResults, hashes, policy, aiEnabled = false) {
  let md = '# NetRise ZeroLens Security Report\n\n';
  md += '[https://www.netrise.io](https://www.netrise.io)\n\n';
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
    if (!arr || arr.length === 0) {
      md += '_No issues found for this CWE._\n\n';
    } else {
      arr.slice(0, 10).forEach((f, idx) => {
        md += `**Finding ${idx + 1}:** \`${f.code}\`  \n`;
      });
      md += '\n';
    }
  });

  if (aiEnabled && aiResults && Object.keys(aiResults).length) {
    md += '\n## AI Analysis\n';
    Object.values(aiResults).forEach((ai) => {
      if (!ai || !ai.analysis || !Array.isArray(ai.analysis.results)) return;
      ai.analysis.results.forEach((r) => {
        if (!r || !Array.isArray(r.analyses)) return;
        r.analyses.forEach((an) => {
          if (!an) return;
          md += `\n> **${an.code || ''}**\n\n${an.analysis || ''}\n`;
        });
      });
    });
  } else if (aiEnabled) {
    md += '\n## AI Analysis\n\n_AI summary could not be retrieved. If you are participating in the Early-Adopter program, please ensure your token has AI access or contact NetRise at https://www.netrise.io._\n';
  }

  return md;
}

function writeFullReport(filePath, markdown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, markdown);
}

module.exports = { buildReport, writeFullReport }; 