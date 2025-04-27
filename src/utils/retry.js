'use strict';

/**
 * Simple async retry helper with exponential back-off.
 * @template T
 * @param {() => Promise<T>} fn function to execute
 * @param {object} [opts]
 * @param {number} [opts.attempts=3] max attempts
 * @param {number} [opts.delayMs=500] initial delay (ms)
 * @returns {Promise<T>}
 */
async function retry(fn, opts = {}) {
  const { attempts = 3, delayMs = 500 } = opts;
  let lastErr;
  let backoff = delayMs;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1) break;
      await new Promise((r) => setTimeout(r, backoff));
      backoff *= 2;
    }
  }
  throw lastErr;
}

module.exports = { retry }; 