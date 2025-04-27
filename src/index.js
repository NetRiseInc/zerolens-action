/**
 * NetRise ZeroLens GitHub Action – entrypoint (placeholder)
 * Real logic will be implemented in subsequent tasks.
 */

const { getInputs } = require('./utils/input.js');
const { hashFiles } = require('./utils/hash');
const { uploadBinary, pollUntilCompleted } = require('./api/client');
const { parseDuration } = require('./utils/parse-duration');

const inputs = getInputs();
console.log('Inputs parsed', inputs);

let aiResults = {};

(async () => {
  const hashes = await hashFiles(inputs.paths);
  console.log('Hashes', hashes);

  for (const p of inputs.paths) {
    console.log(`Uploading ${p}...`);
    const status = await uploadBinary(p, inputs.token);
    console.log('Upload response', status);
    if (inputs.wait) {
      const intervalMs = parseDuration(inputs.pollInterval);
      const timeoutMs = parseDuration(inputs.timeout);
      const final = await pollUntilCompleted(status.hash, inputs.token, intervalMs, timeoutMs);
      console.log('Completed', final.status);
    }
  }

  // CF-05: fetch findings once all binaries processed (or skip if wait=false)
  if (inputs.wait) {
    const hashList = Object.values(hashes);
    const { getFindingsForHashes } = require('./api/client');
    const findingsAgg = await getFindingsForHashes(hashList, inputs.token);
    console.log('Findings summary', findingsAgg.summary);

    // RP-01 console summary
    const { printConsoleSummary } = require('./report/console-summary');
    // placeholder policy counts
    printConsoleSummary({ blocking: 0, warnings: 0 }, findingsAgg.summary);

    const { writeStepSummary } = require('./report/step-summary');
    writeStepSummary({ blocking: 0, warnings: 0 }, findingsAgg.summary, inputs.ai);

    if (inputs.ai) {
      const { getAIForHashes } = require('./api/client');
      aiResults = await getAIForHashes(hashList, inputs.token);
      console.log('AI analysis retrieved for', Object.keys(aiResults).length, 'binaries');
      const { buildReport, writeFullReport } = require('./report/full-report');
      const md = buildReport(findingsAgg, aiResults, hashList, { blocking: 0, warnings: 0 });
      writeFullReport(inputs.reportPath, md);
      console.log('Report written to', inputs.reportPath);
    }

    // RP-04: SARIF emitter
    if (inputs.sarifPath) {
      const { buildSarif, writeSarif } = require('./report/sarif');
      const sarif = buildSarif(findingsAgg);
      writeSarif(inputs.sarifPath, sarif);
      console.log('SARIF written to', inputs.sarifPath);
    }

    // RP-05: set action outputs
    const core = require('@actions/core');
    const outputs = {
      hashes: JSON.stringify(hashList),
      findings_json: JSON.stringify(findingsAgg.binaries),
      ai_json: inputs.ai ? JSON.stringify(aiResults || {}) : '',
      report: inputs.reportPath || '',
      sarif: inputs.sarifPath || '',
      violations: JSON.stringify([]), // placeholder until policy engine implemented
    };
    Object.entries(outputs).forEach(([k, v]) => core.setOutput(k, v));
    console.log('[ZeroLens] Outputs set:', Object.keys(outputs).join(', '));
  }
})(); 