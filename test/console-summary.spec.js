jest.mock('@actions/core');
const core = require('@actions/core');
const { printConsoleSummary } = require('../src/report/console-summary');

describe('console summary', () => {
  it('prints green check when no issues', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printConsoleSummary({ blocking: 0, warnings: 0 }, { 'CWE-119': 1 });
    expect(spy).toHaveBeenCalledWith(expect.stringMatching('✔'));
    expect(core.startGroup).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('omits zero-count lines', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printConsoleSummary({ blocking: 0, warnings: 0 }, { 'CWE-119': 0 });
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('CWE-119'));
    spy.mockRestore();
  });
}); 