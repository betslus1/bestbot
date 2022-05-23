const Command = require('./Command'),
  Middleware = require('./Middleware'),
  Option = require('./Option')

class Termkit {
  base = null
  command_defaults = {}
  static set defaults(obj) {
    Termkit.command_defaults = obj
  }
  static setDefaults(obj) {
    Termkit.command_defaults = obj
  }
  static command(name, variables, info) {
    const command = new Command(Object.assign({ name, variables, info }, Termkit.command_defaults))
    if (!Termkit.base) Termkit.base = command
    return command
  }
  static middleware(action) {
    return new Middleware(action)
  }
  static option(short, long, variables, info) {
    return new Option({ short, long, variables, info })
  }
  static parse(arr) {
    return Termkit.base.parse(arr)
  }
}

module.exports = Termkit
