/* eslint-disable no-undef */
const inputs = {};
module.exports = {
  getInput: (k, opt = {}) => {
    if (opt.required && inputs[k] === undefined) {
      throw new Error(`Input ${k} required`);
    }
    return inputs[k];
  },
  getBooleanInput: (k) => inputs[k] === 'true',
  setFailed: jest.fn((msg) => {
    throw new Error(msg);
  }),
  __setInputs: (obj) => {
    Object.keys(obj).forEach((k) => {
      inputs[k] = obj[k];
    });
  },
}; 