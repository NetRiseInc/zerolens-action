const { retry } = require('../src/utils/retry');

describe('retry helper', () => {
  it('resolves on first success', async () => {
    const fn = jest.fn().mockResolvedValue(42);
    const res = await retry(fn, { attempts: 3, delayMs: 1 });
    expect(res).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure then succeeds', async () => {
    let attempts = 0;
    const res = await retry(() => {
      attempts += 1;
      if (attempts < 2) return Promise.reject(new Error('fail'));
      return Promise.resolve('ok');
    }, { attempts: 3, delayMs: 1 });
    expect(res).toBe('ok');
  });

  it('throws after exhausting attempts', async () => {
    await expect(
      retry(() => Promise.reject(new Error('nope')), { attempts: 2, delayMs: 1 }),
    ).rejects.toThrow('nope');
  });
}); 