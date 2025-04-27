const fs = require('fs');
const { vol } = require('memfs');
const fg = require('fast-glob');
jest.mock('fast-glob');
jest.mock('@actions/core');

const core = require('@actions/core');
const { getInputs } = require('../src/utils/input');

jest.mock('fs', () => require('memfs').fs);

describe('getInputs', () => {
  beforeEach(() => {
    fg.sync.mockReturnValue(['/foo.bin']);
    vol.reset();
    vol.fromJSON({ '/foo.bin': Buffer.alloc(10) });
    core.__setInputs({
      token: 'abc',
      binary: '*.bin',
      wait: 'true',
    });
  });

  it('returns parsed inputs and validates size', () => {
    const out = getInputs();
    expect(out.paths).toEqual(['/foo.bin']);
    expect(out.token).toBe('abc');
  });

  it('fails when file >100 MB', () => {
    vol.reset();
    vol.fromJSON({ '/huge.bin': Buffer.alloc(101 * 1024 * 1024) });
    fg.sync.mockReturnValue(['huge.bin']);
    expect(() => getInputs()).toThrow();
  });
});
