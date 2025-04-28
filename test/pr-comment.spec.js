const core = require('@actions/core');
const github = require('@actions/github');
const { buildMarkdown } = require('../src/report/step-summary');

describe('PR comment helper', () => {
  it('buildMarkdown returns summary heading', () => {
    const md = buildMarkdown({ blocking:0, warnings:1 }, { 'CWE-134':1 }, false);
    expect(md).toMatch(/ZeroLens Scan Summary/);
  });
}); 