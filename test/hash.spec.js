const { vol } = require('memfs');
const fs = require('fs');
const { sha256, hashFiles } = require('../src/utils/hash');

jest.mock('fs', () => require('memfs').fs);

describe('sha256 helper', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({ '/a.txt': 'hello', '/b.txt': 'world' });
  });

  it('computes deterministic hash', async () => {
    const h1 = await sha256('/a.txt');
    const h2 = await sha256('/a.txt');
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it('hashFiles returns map', async () => {
    const res = await hashFiles(['/a.txt', '/b.txt']);
    expect(Object.keys(res)).toHaveLength(2);
    expect(res['/a.txt']).toHaveLength(64);
  });
}); 