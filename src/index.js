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
  }
})(); 