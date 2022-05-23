module.exports = class Style {
  constructor(prefix, suffix) {
    this.prefix = `\x1b[${prefix}m`;
    this.suffix = `\x1b[${suffix}m`;
  };
};
