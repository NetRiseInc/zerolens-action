const { decideExitCode } = require('../src/policy/exit-code');

describe('decideExitCode', () => {
  it('returns 0 for ok', () => {
    expect(decideExitCode('ok', false)).toBe(0);
  });
  it('returns 78 for warn', () => {
    expect(decideExitCode('warn', false)).toBe(78);
  });
  it('returns 1 for fail when continueOnError false', () => {
    expect(decideExitCode('fail', false)).toBe(1);
  });
  it('returns 78 for fail when continueOnError true', () => {
    expect(decideExitCode('fail', true)).toBe(78);
  });
}); 