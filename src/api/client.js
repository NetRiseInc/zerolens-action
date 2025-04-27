const { request, FormData } = require('undici');
const fs = require('fs');
const BASE = 'https://zerolens.netrise.io';
const { retry } = require('../utils/retry');

async function uploadBinary(filePath, token) {
  const fd = new FormData();
  const data = fs.readFileSync(filePath);
  const blob = new Blob([data], { type: 'application/octet-stream' });
  fd.append('binary', blob, filePath.split('/').pop());

  return retry(async () => {
    const res = await request(`${BASE}/binaries`, {
      method: 'POST',
      headers: {
        'X-Authorization': token,
      },
      body: fd,
    });

    if (res.statusCode !== 200) {
      const text = await res.body.text();
      throw new Error(`Upload failed (${res.statusCode}): ${text}`);
    }
    return res.body.json();
  });
}

async function getStatus(hash, token) {
  const res = await request(`${BASE}/binaries/${hash}`, {
    method: 'GET',
    headers: { 'X-Authorization': token },
  });
  if (res.statusCode !== 200) throw new Error(`Status error ${res.statusCode}`);
  return res.body.json();
}

async function pollUntilCompleted(hash, token, intervalMs, timeoutMs) {
  const start = Date.now();
  while (true) {
    const status = await getStatus(hash, token);
    if (status.status === 'completed') return status;
    if (Date.now() - start > timeoutMs) throw new Error('Polling timeout');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

async function getFindings(hash, token) {
  const res = await request(`${BASE}/binaries/${hash}/findings`, {
    method: 'GET',
    headers: { 'X-Authorization': token },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Findings error ${res.statusCode}`);
  }
  return res.body.json();
}

/**
 * Fetch findings for an array of hashes and aggregate results.
 * The returned object contains:
 *  - binaries: raw FindingsResponse per hash
 *  - summary: map of CWE ID -> total finding count across all binaries
 *  - findings: flattened list of FindingSet with added hash field
 */
async function getFindingsForHashes(hashes, token) {
  const combined = { binaries: {}, summary: {}, findings: [] };
  for (const hash of hashes) {
    const data = await getFindings(hash, token);
    combined.binaries[hash] = data;

    if (Array.isArray(data.findings)) {
      for (const set of data.findings) {
        // Determine count intelligently
        let count = 0;
        if (Array.isArray(set.findings)) {
          count = set.findings.length;
        } else if (set.findings && Array.isArray(set.findings.findings)) {
          count = set.findings.findings.length;
        }
        if (count === 0 && set.metadata) {
          const metaCount =
            set.metadata.total_findings ||
            set.metadata.overflow_count ||
            set.metadata.vulnerable_calls ||
            set.metadata.total_weak_crypto_calls ||
            set.metadata.total_weak_hash_calls ||
            set.metadata.total_format_calls ||
            set.metadata.total_calls ||
            0;
          count = metaCount;
        }
        combined.summary[set.cwe_id] = (combined.summary[set.cwe_id] || 0) + count;
        combined.findings.push({ hash, ...set });
      }
    }
  }
  return combined;
}

async function getAIAnalysis(hash, token) {
  const res = await request(`${BASE}/binaries/${hash}/ai`, {
    method: 'GET',
    headers: { 'X-Authorization': token },
  });
  if (res.statusCode === 404) return null; // no analysis yet
  if (res.statusCode !== 200) throw new Error(`AI GET error ${res.statusCode}`);
  return res.body.json();
}

async function requestAIAnalysis(hash, token) {
  const res = await request(`${BASE}/binaries/${hash}/ai`, {
    method: 'POST',
    headers: { 'X-Authorization': token },
  });
  if (res.statusCode !== 200) throw new Error(`AI POST error ${res.statusCode}`);
  return res.body.json();
}

/**
 * Ensure AI analysis exists for given hash (per Early-Adopter synchronous behaviour).
 * Returns AIAnalysisResponse.
 */
async function ensureAIAnalysis(hash, token) {
  const existing = await getAIAnalysis(hash, token);
  if (existing) return existing;
  return requestAIAnalysis(hash, token);
}

async function getAIForHashes(hashes, token) {
  const out = {};
  for (const h of hashes) {
    out[h] = await ensureAIAnalysis(h, token);
  }
  return out;
}

module.exports = {
  uploadBinary,
  getStatus,
  pollUntilCompleted,
  getFindings,
  getFindingsForHashes,
  getAIAnalysis,
  requestAIAnalysis,
  ensureAIAnalysis,
  getAIForHashes,
}; 