const crypto = require('crypto');
const fs = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipe = promisify(pipeline);

async function sha256(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(file);
    stream.on('error', reject);
    hash.on('error', reject);
    hash.setEncoding('hex');
    stream.pipe(hash).on('finish', () => {
      resolve(hash.read());
    });
  });
}

async function hashFiles(paths) {
  const out = {};
  for (const p of paths) {
    out[p] = await sha256(p);
  }
  return out;
}

module.exports = { sha256, hashFiles }; 