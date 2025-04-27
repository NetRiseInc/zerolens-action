'use strict';

/**
 * Decide exit code per policy status and continueOnError flag.
 * @param {'ok'|'warn'|'fail'} status
 * @param {boolean} continueOnError
 * @returns {number} exit code
 */
function decideExitCode(status, continueOnError) {
  if (status === 'ok') return 0;
  if (status === 'warn') return 78; // neutral
  // status === 'fail'
  return continueOnError ? 78 : 1;
}

module.exports = { decideExitCode }; 