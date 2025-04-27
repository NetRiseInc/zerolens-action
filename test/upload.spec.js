require('dotenv').config();
jest.mock('undici', () => {
  const { Blob } = require('buffer');
  return {
    FormData: class {
      constructor() { this.entries = []; }
      append(name, blob) { this.entries.push({ name, blob }); }
    },
    Blob,
    request: jest.fn(async (url, _opts) => {
      if (url.endsWith('/binaries')) {
        return {
          statusCode: 200,
          body: { json: async () => ({ hash: 'abc', status: 'queued' }) },
        };
      }
      return {
        statusCode: 200,
        body: { json: async () => ({ status: 'completed' }) },
      };
    }),
  };
});

const { uploadBinary, pollUntilCompleted } = require('../src/api/client');
const { request } = require('undici');

describe('upload + polling', () => {
  const token = process.env.ZEROLENS_TOKEN || 'dummy-token';

  it('uploads and polls', async () => {
    // ensure our mock will produce queued then completed
    request.mockClear();
    const uploadRes = await uploadBinary(__filename, token);
    expect(uploadRes.hash).toBe('abc');

    const final = await pollUntilCompleted('abc', token, 0, 1000);
    expect(final.status).toBe('completed');
  });
});
