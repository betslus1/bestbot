module.exports = (string, options) => options.find(o => o.short === string || o.long === string)
