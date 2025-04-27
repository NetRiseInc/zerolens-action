jest.mock('undici', () => {
  const { Blob } = require('buffer');
  const responses = {
    'h1': {
      hash: 'h1',
      status: 'completed',
      findings: [
        {
          cwe_id: 'CWE-119',
          version: 1,
          description: 'Buffer Overflow',
          findings: [{ code: 'overflow1' }, { code: 'overflow2' }],
        },
      ],
    },
    'h2': {
      hash: 'h2',
      status: 'completed',
      findings: [
        {
          cwe_id: 'CWE-242',
          version: 1,
          description: 'Use of Inherently Dangerous Function',
          findings: [{ code: 'danger1' }],
        },
        {
          cwe_id: 'CWE-119',
          version: 1,
          description: 'Buffer Overflow',
          findings: [{ code: 'overflow3' }],
        },
      ],
    },
    'meta': {
      hash: 'meta',
      status: 'completed',
      findings: [
        {
          cwe_id: 'CWE-242',
          version: 1,
          description: 'Danger funcs',
          findings: {},
          metadata: { total_findings: 4 },
        },
      ],
    },
  };

  return {
    FormData: class {},
    Blob,
    request: jest.fn(async (url) => {
      const match = /\/binaries\/(.+?)\/findings/.exec(url);
      if (match) {
        const h = match[1];
        return {
          statusCode: 200,
          body: { json: async () => responses[h] },
        };
      }
      throw new Error(`Unexpected URL ${url}`);
    }),
  };
});

const { getFindings, getFindingsForHashes } = require('../src/api/client');

describe('findings fetcher', () => {
  const token = 'dummy-token';

  it('fetches findings for one hash', async () => {
    const data = await getFindings('h1', token);
    expect(data.hash).toBe('h1');
    expect(data.findings[0].cwe_id).toBe('CWE-119');
  });

  it('aggregates findings across hashes', async () => {
    const result = await getFindingsForHashes(['h1', 'h2', 'meta'], token);
    expect(Object.keys(result.binaries)).toHaveLength(3);
    expect(result.summary).toEqual({ 'CWE-119': 3, 'CWE-242': 5 });
    expect(result.findings.length).toBe(4);
  });
}); 