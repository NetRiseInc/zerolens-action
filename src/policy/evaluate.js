'use strict';

/**
 * @typedef {Object} Violation
 * @property {'BLOCKING_CWE'|'WARNING_CWE'|'FINDING_LIMIT'|'TIMEOUT'} type
 * @property {string} [cweId]
 * @property {number} [count]
 * @property {string} message
 */

/**
 * @typedef {Object} PolicyOutcome
 * @property {'ok'|'warn'|'fail'} status
 * @property {Violation[]} violations
 * @property {{blocking:number,warnings:number}} counts
 */

/**
 * Evaluate findings against user policy configuration.
 * @param {Array<Object>} findings - Raw flattened finding sets across all binaries.
 * @param {Object} cfg Configuration
 * @param {string[]} cfg.failCWE Blocking CWE IDs
 * @param {string[]} cfg.warnCWE Warning CWE IDs
 * @param {number} cfg.maxFindings Max total findings allowed (0 disables check)
 * @param {boolean} cfg.timeout Whether a timeout occurred during processing
 * @returns {PolicyOutcome}
 */
function evaluatePolicy(findings, { failCWE = [], warnCWE = [], maxFindings = 0, timeout = false }) {
  /** @type {Violation[]} */
  const violations = [];

  // Map CWE->count
  const countsByCwe = findings.reduce((acc, f) => {
    const id = f.cwe_id || f.cweId || f.cweID || f.cwe; // tolerate various casings/props
    if (!id) return acc;
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  // Blocking CWEs
  for (const id of failCWE) {
    if (countsByCwe[id]) {
      violations.push({
        type: 'BLOCKING_CWE',
        cweId: id,
        count: countsByCwe[id],
        message: `CWE-${id} appears ${countsByCwe[id]}× (configured as blocking)`,
      });
    }
  }

  // Warning CWEs
  for (const id of warnCWE) {
    if (countsByCwe[id]) {
      violations.push({
        type: 'WARNING_CWE',
        cweId: id,
        count: countsByCwe[id],
        message: `CWE-${id} appears ${countsByCwe[id]}× (configured as warning)`,
      });
    }
  }

  // Finding limit
  if (maxFindings > 0 && findings.length > maxFindings) {
    violations.push({
      type: 'FINDING_LIMIT',
      count: findings.length,
      message: `Total findings ${findings.length} exceed limit ${maxFindings}`,
    });
  }

  // Timeout
  if (timeout) {
    violations.push({
      type: 'TIMEOUT',
      message: 'Processing timeout exceeded',
    });
  }

  // Determine status and counts
  let status = 'ok';
  const blocking = violations.filter((v) => v.type === 'BLOCKING_CWE').length;
  const warnings = violations.filter((v) => v.type === 'WARNING_CWE').length;

  const hasFail = violations.some(
    (v) => v.type === 'BLOCKING_CWE' || v.type === 'FINDING_LIMIT' || v.type === 'TIMEOUT',
  );
  if (hasFail) status = 'fail';
  else if (violations.length > 0) status = 'warn';

  return { status, violations, counts: { blocking, warnings } };
}

module.exports = { evaluatePolicy }; 