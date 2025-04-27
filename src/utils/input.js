const core = require('@actions/core');
const fg = require('fast-glob');
const fs = require('fs');

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

function getInputs() {
  const token = core.getInput('token');
  const binaryPattern = core.getInput('binary');
  // Fallback to CLI flags when running outside GitHub Actions
  const argv = require('node:process').argv.slice(2);
  function flag(name) {
    const idx = argv.indexOf(`--${name}`);
    if (idx !== -1) return argv[idx + 1] || true;
    return undefined;
  }
  const tToken = token || flag('token') || process.env.ZEROLENS_TOKEN;
  const tBinary = binaryPattern || flag('binary');
  if (!tToken) throw new Error('token is required (input or --token or ZEROLENS_TOKEN env)');
  if (!tBinary) throw new Error('binary path/glob required (input or --binary)');

  function parseBool(str) {
    if (str === undefined || str === null || str === '') return undefined;
    return /^(true|True|TRUE)$/.test(str);
  }

  const wait =
    parseBool(core.getInput('wait')) ??
    (flag('wait') === true || flag('wait') === 'true' ? true : false);

  const pollInterval = core.getInput('poll_interval') || flag('poll_interval') || '5s';
  const timeout = core.getInput('timeout') || flag('timeout') || '10m';

  const ai =
    parseBool(core.getInput('ai_analysis')) ??
    (flag('ai_analysis') === true || flag('ai_analysis') === 'true' ? true : false);

  const paths = fg.sync(tBinary);
  if (paths.length === 0) {
    core.setFailed(`No files matched pattern: ${tBinary}`);
    process.exit(1);
  }

  paths.forEach((p) => {
    const s = fs.statSync(p);
    if (s.size > MAX_SIZE) {
      core.setFailed(`File ${p} exceeds 100 MB limit`);
      process.exit(1);
    }
  });

  return { token: tToken, paths, wait, pollInterval, timeout, ai };
}

module.exports = { getInputs }; 