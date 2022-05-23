const { models } = require('./src'),
  { Command, Middleware, Option, Termkit } = models

let base
let command_defaults = {}

const command = (name, variables, info) => {
  const command = new Command(Object.assign({ name, variables, info }, command_defaults))
  if (!base) base = command
  return command
}
const setDefaults = data => command_defaults = data
const middleware = (data) => data
const option = (short, long, variables, info) => new Option({ short, long, variables, info })
const parse = (array) => base.parse(array)

module.exports = { command, middleware, option, parse, setDefaults }
