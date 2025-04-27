const fs = require('fs');

function buildMarkdown(policy, findingsSummary, aiIncluded) {
  const totalFindings = Object.values(findingsSummary).reduce((a, b) => a + b, 0);
  const rows = [
    ['Blocking', policy.blocking],
    ['Warnings', policy.warnings],
    ['Total findings', totalFindings],
  ];
  if (aiIncluded) rows.push(['AI analysis', '✅']);

  let md = '### ZeroLens Scan Summary\n\n';
  md += '| Metric | Value |\n|---|---|\n';
  rows.forEach(([k, v]) => {
    md += `| ${k} | ${v} |\n`;
  });
  md += '\n';

  // Top 5 CWE counts
  const sorted = Object.entries(findingsSummary)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  if (sorted.length) {
    md += '#### Top CWEs\n\n| CWE | Count |\n|---|---|\n';
    sorted.forEach(([cwe, cnt]) => {
      md += `| ${cwe} | ${cnt} |\n`;
    });
    md += '\n';
  }
  return md;
}

function writeStepSummary(policy, findingsSummary, aiIncluded) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  const md = buildMarkdown(policy, findingsSummary, aiIncluded);
  if (path) {
    fs.appendFileSync(path, md);
  } else {
    console.log('[ZeroLens] GITHUB_STEP_SUMMARY not set; printing summary:\n' + md);
  }
}

module.exports = { writeStepSummary, buildMarkdown }; 