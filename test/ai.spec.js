jest.mock('undici', () => {
  const responses = {
    existing: {
      hash: 'existing',
      status: 'completed',
      analysis: { generated_at: 'now' },
    },
  };
  let getCalls = 0;
  return {
    FormData: class {},
    Blob: class {},
    request: jest.fn(async (url, opts = {}) => {
      const match = /\/binaries\/(.+?)\/ai/.exec(url);
      if (!match) throw new Error(`Unexpected URL ${url}`);
      const hash = match[1];
      if (opts.method === 'GET') {
        getCalls += 1;
        if (responses[hash]) {
          return {
            statusCode: 200,
            body: { json: async () => responses[hash] },
          };
        }
        return { statusCode: 404 };
      }
      // POST path – create analysis synchronously
      responses[hash] = {
        hash,
        status: 'completed',
        analysis: { generated_at: 'now' },
      };
      return {
        statusCode: 200,
        body: { json: async () => responses[hash] },
      };
    }),
  };
});

const {
  getAIAnalysis,
  ensureAIAnalysis,
  getAIForHashes,
} = require('../src/api/client');

describe('AI analysis helpers', () => {
  const token = 't';

  it('returns null when no analysis (404)', async () => {
    const res = await getAIAnalysis('new', token);
    expect(res).toBeNull();
  });

  it('ensureAIAnalysis triggers POST when missing', async () => {
    const data = await ensureAIAnalysis('new2', token);
    expect(data.hash).toBe('new2');
  });

  it('getAIForHashes aggregates', async () => {
    const agg = await getAIForHashes(['existing', 'new3'], token);
    expect(Object.keys(agg)).toHaveLength(2);
    expect(agg.existing || agg['existing']).toBeDefined();
  });
}); 