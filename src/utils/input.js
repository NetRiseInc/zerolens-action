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

  const reportPath = core.getInput('report_path') || flag('report_path') || 'zerolens-report.md';

  const sarifPath = core.getInput('sarif_path') || flag('sarif_path') || '';

  // Policy related inputs
  function parseList(str) {
    if (!str) return [];
    try {
      // if JSON array provided
      const arr = JSON.parse(str);
      if (Array.isArray(arr)) return arr.map(String);
    } catch {
      /* fallthrough */
    }
    return String(str)
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const failOnCwe = parseList(core.getInput('fail_on_cwe') || flag('fail_on_cwe') || '');
  const warnOnCwe = parseList(core.getInput('warn_on_cwe') || flag('warn_on_cwe') || '');

  const maxFindings = Number(core.getInput('max_findings') || flag('max_findings') || 0);

  const continueOnError =
    parseBool(core.getInput('continue_on_error')) ??
    (flag('continue_on_error') === true || flag('continue_on_error') === 'true' ? true : false);

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

  return {
    token: tToken,
    paths,
    wait,
    pollInterval,
    timeout,
    ai,
    reportPath,
    sarifPath,
    failOnCwe,
    warnOnCwe,
    maxFindings,
    continueOnError,
  };
}

module.exports = { getInputs }; 