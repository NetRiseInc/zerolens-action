const { buildSarif } = require('../src/report/sarif');

describe('SARIF builder', () => {
  it('creates rules and results', () => {
    const findingsAgg = {
      findings: [
        {
          cwe_id: 'CWE-119',
          description: 'Buffer Overflow',
          findings: [{ code: 'overflow', call_addr: 4096 }],
        },
      ],
    };
    const sarif = buildSarif(findingsAgg);
    expect(sarif.version).toBe('2.1.0');
    const driver = sarif.runs[0].tool.driver;
    expect(driver.rules[0].id).toBe('CWE-119');
    expect(driver.version).toBeDefined();
    const result = sarif.runs[0].results[0];
    expect(result.ruleId).toBe('CWE-119');
    expect(result.locations[0].physicalLocation.address.absoluteAddress).toBe(4096);
  });
}); 