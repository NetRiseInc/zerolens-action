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

module.exports = { uploadBinary, getStatus, pollUntilCompleted }; 