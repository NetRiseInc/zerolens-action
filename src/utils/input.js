const core = require('@actions/core');
const fg = require('fast-glob');
const fs = require('fs');

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

function getInputs() {
  const token = core.getInput('token', { required: true });
  const binaryPattern = core.getInput('binary', { required: true });
  const wait = core.getBooleanInput('wait');
  const pollInterval = core.getInput('poll_interval') || '5s';
  const timeout = core.getInput('timeout') || '10m';
  const ai = core.getBooleanInput('ai_analysis');

  const paths = fg.sync(binaryPattern);
  if (paths.length === 0) {
    core.setFailed(`No files matched pattern: ${binaryPattern}`);
    process.exit(1);
  }

  paths.forEach((p) => {
    const s = fs.statSync(p);
    if (s.size > MAX_SIZE) {
      core.setFailed(`File ${p} exceeds 100 MB limit`);
      process.exit(1);
    }
  });

  return { token, paths, wait, pollInterval, timeout, ai };
}

module.exports = { getInputs }; 