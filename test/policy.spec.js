const { evaluatePolicy } = require('../src/policy/evaluate');

describe('evaluatePolicy', () => {
  const finding = (cwe) => ({ cwe_id: cwe });

  it('fails on blocking cwe', () => {
    const out = evaluatePolicy([finding('CWE-119')], {
      failCWE: ['CWE-119'],
      warnCWE: [],
      maxFindings: 0,
      timeout: false,
    });
    expect(out.status).toBe('fail');
    expect(out.violations).toHaveLength(1);
    expect(out.counts.blocking).toBe(1);
  });

  it('warns on warning cwe', () => {
    const out = evaluatePolicy([finding('CWE-242')], {
      failCWE: [],
      warnCWE: ['CWE-242'],
      maxFindings: 0,
      timeout: false,
    });
    expect(out.status).toBe('warn');
    expect(out.violations[0].type).toBe('WARNING_CWE');
    expect(out.counts.warnings).toBe(1);
  });

  it('fails on finding limit', () => {
    const out = evaluatePolicy([finding('CWE-1'), finding('CWE-2')], {
      failCWE: [],
      warnCWE: [],
      maxFindings: 1,
      timeout: false,
    });
    expect(out.status).toBe('fail');
    expect(out.violations.find((v) => v.type === 'FINDING_LIMIT')).toBeTruthy();
  });

  it('fails on timeout', () => {
    const out = evaluatePolicy([], {
      failCWE: [],
      warnCWE: [],
      maxFindings: 0,
      timeout: true,
    });
    expect(out.status).toBe('fail');
    expect(out.violations[0].type).toBe('TIMEOUT');
  });
}); 