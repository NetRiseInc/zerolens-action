/**
 * NetRise ZeroLens GitHub Action – entrypoint (placeholder)
 * Real logic will be implemented in subsequent tasks.
 */

const { getInputs } = require('./utils/input.js');
const { hashFiles } = require('./utils/hash');

const inputs = getInputs();
console.log('Inputs parsed', inputs);

(async () => {
  const hashes = await hashFiles(inputs.paths);
  console.log('Hashes', hashes);
})(); 