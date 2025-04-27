const core = require('@actions/core');

function colour(text, colourCode) {
  // Basic colour wrap for console (GitHub supports)
  return `\u001b[${colourCode}m${text}\u001b[0m`;
}

function emojiStatus(blocking, warnings) {
  if (blocking > 0) return '🚫';
  if (warnings > 0) return '⚠';
  return '✔';
}

/**
 * Print concise console summary.
 * @param {object} policyResult - {blocking:number, warnings:number}
 * @param {object} findingsAgg - summary map CWE->count
 */
function printConsoleSummary(policyResult, findingsAgg) {
  const total = Object.values(findingsAgg).reduce((a, b) => a + b, 0);
  const statusEmoji = emojiStatus(policyResult.blocking, policyResult.warnings);
  let lineText = `${policyResult.blocking} blocking • ${policyResult.warnings} warnings • ${total} findings`;
  if (policyResult.blocking > 0) lineText = colour(lineText, 31); // red
  else if (policyResult.warnings > 0) lineText = colour(lineText, 33); // yellow
  else lineText = colour(lineText, 32); // green
  const line = `${statusEmoji} ${lineText}`;
  core.startGroup('ZeroLens Summary');
  console.log(line);
  Object.entries(findingsAgg).forEach(([cwe, count]) => {
    if (count > 0) {
      console.log(`  ${cwe}: ${count}`);
    }
  });
  core.endGroup();
}

module.exports = { printConsoleSummary }; 