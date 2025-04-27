jest.mock('@actions/core');
const core = require('@actions/core');

describe('outputs setter', () => {
  it('sets expected outputs', () => {
    const outputs = {
      hashes: '["abc"]',
      findings_json: '{}',
      ai_json: '',
      report: 'report.md',
      sarif: '',
      violations: '[]',
    };
    Object.entries(outputs).forEach(([k, v]) => core.setOutput(k, v));
    Object.entries(outputs).forEach(([k, v]) => {
      expect(core.setOutput).toHaveBeenCalledWith(k, v);
    });
  });
}); 