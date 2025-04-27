const { buildMarkdown } = require('../src/report/step-summary');

describe('step summary markdown', () => {
  it('includes metrics and top CWE', () => {
    const md = buildMarkdown({ blocking: 1, warnings: 2 }, { 'CWE-119': 5, 'CWE-242': 1 }, true);
    expect(md).toMatch(/Blocking\s+\| 1/);
    expect(md).toMatch(/AI analysis/);
    expect(md).toMatch(/CWE-119/);
  });
}); 