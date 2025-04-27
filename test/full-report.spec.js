const { buildReport } = require('../src/report/full-report');

describe('full report generator', () => {
  it('renders markdown with CWE and AI', () => {
    const findingsAgg = {
      summary: { 'CWE-121': 2 },
      findings: [
        {
          cwe_id: 'CWE-121',
          description: 'overflow',
          version: 1,
          findings: { findings: [{ code: 'memcpy(x)' }, { code: 'memcpy(y)' }] },
        },
      ],
    };
    const aiResults = {
      hash: {
        analysis: {
          results: [
            {
              analyses: [
                { code: 'memcpy(x)', analysis: 'bad' },
              ],
            },
          ],
        },
      },
    };
    const md = buildReport(findingsAgg, aiResults, ['hash'], { blocking: 0, warnings: 0 });
    expect(md).toMatch(/CWE-121/);
    expect(md).toMatch(/memcpy/);
    expect(md).toMatch(/AI Analysis/);
  });
}); 