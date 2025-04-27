const { request, FormData } = require('undici');
const fs = require('fs');
const BASE = 'https://zerolens.netrise.io';

async function uploadBinary(filePath, token) {
  const fd = new FormData();
  const data = fs.readFileSync(filePath);
  const blob = new Blob([data], { type: 'application/octet-stream' });
  fd.append('binary', blob, filePath.split('/').pop());

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
        // Count number of low-level findings for this CWE in this binary
        const count = Array.isArray(set.findings) ? set.findings.length : 0;
        combined.summary[set.cwe_id] = (combined.summary[set.cwe_id] || 0) + count;
        combined.findings.push({ hash, ...set });
      }
    }
  }
  return combined;
}

module.exports = {
  uploadBinary,
  getStatus,
  pollUntilCompleted,
  getFindings,
  getFindingsForHashes,
}; 