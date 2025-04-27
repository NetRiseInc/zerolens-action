function parseDuration(str) {
  if (typeof str === 'number') return str;
  const match = /^([0-9]+)(ms|s|m|h)?$/.exec(str.trim());
  if (!match) throw new Error(`Invalid duration: ${str}`);
  const value = Number(match[1]);
  const unit = match[2] || 'ms';
  switch (unit) {
    case 'ms':
      return value;
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}

module.exports = { parseDuration }; 