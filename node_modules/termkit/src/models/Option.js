let helpers = require('../helpers'),
  getVariables = helpers.getVariables

module.exports = class Option {
  constructor(data) {
    this.short = null
    this.long = null
    this.info = null
    this.variables = null

    if (!data) return

    if (data.short) this.short = data.short
    if (data.long) this.long = data.long
    if (data.info) this.info = data.info
    if (data.variables) this.variables = getVariables(data.variables)
  }
  description(string) {
    this.info = string
    return this
  }
}
