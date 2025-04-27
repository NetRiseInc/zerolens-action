const { request, FormData } = require('undici');
const fs = require('fs');
const BASE = 'https://zerolens.netrise.io';

async function uploadBinary(filePath, token) {
  const fd = new FormData();
  fd.append('binary', fs.createReadStream(filePath), {
    filename: filePath.split('/').pop(),
    contentType: 'application/octet-stream',
  });

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

module.exports = { uploadBinary }; 