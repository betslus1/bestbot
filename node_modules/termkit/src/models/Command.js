const Option = require('./Option'),
  cosmetic = require('cosmetic'),
  { findCommand, findCommandVariables, findOptions, getVariables } = require('../helpers')

module.exports = class Command {
  constructor(data) {
    this.actionFunction = null
    this.commandsArray = []
    this.commandStrings = ['help']
    this.info = null
    this.name = null
    this.middlewaresArray = []
    this.optionsArray = []
    this.variables = null
    this.versionString = null

    if (!data) return

    if (data.info) this.info = data.info
    if (data.name) this.name = data.name
    if (data.variables) this.variables = getVariables(data.variables)
    if (data.middlewares) this.middlewaresArray = [...data.middlewares]
    if (data.options) this.optionsArray = [...data.options]
  }
  description(info, description) {
    this.info = info
    this.description = description
    return this
  }
  variable(string) {
    let variable = getVariables(string)
    if (variable && !this.variables) {
      this.variables = variable
    } else if (variable) {
      this.variables.push(variable)
    }
    return this
  }
  action(actionFunction) {
    this.actionFunction = actionFunction
    return this
  }
  command(command) {
    this.commandsArray.push(command)
    return this
  }
  commands(commands) {
    this.commandsArray = commands
    commands.map(c => this.commandStrings.unshift(c.name))
    for (let command of commands) {
      this.commandStrings.unshift(command.name)
    }
    return this
  }
  middleware(middleware) {
    this.middlewaresArray.push(middleware)
    return this
  }
  middlewares(middlewares) {
    this.middlewaresArray.push(...middlewares)
    return this
  }
  option(short, long, variables, info) {
    this.optionsArray.push(new Option({short, long, variables, info}))
    return this
  }
  options(options) {
    this.optionsArray.push(...options)
    return this
  }
  version(version) {
    this.versionString = version
    return this
  }
  help(source) {
    const table = []
    let program = this.name || 'Program'
    if (this.variables) for (const variable of this.variables) program += ` ${variable.raw}`
    if (this.optionsArray.length > 0) program += ' [...options]'
    table.push({ title: '\nCommand', info: program, data: [] })
    if (this.info) table.push({ title: 'Info', info: this.info, data: [] })
    if (this.optionsArray.length > 0) {
      const section = { title: 'Options', data: []}
      for (const option of this.optionsArray) {
        let name = ''
        if (option.short) name = `-${option.short}`
        if (option.short && option.long) name += ', '
        if (option.long) name += `--${option.long}`
        if (option.variables) for (const variable of option.variables) name += ` ${variable.raw}`
        section.data.push([name, option.info || ''])
      }
      table.push(section)
    }
    if (this.commandsArray.length > 0) {
      const section = { title: 'Subcommands', data: []}
      for (let command of this.commandsArray) {
        let name = command.name
        if (command.variables) for (const variable of command.variables) name += ` ${variable.raw}`
        section.data.push([name, command.info || ''])
      }
      table.push(section)
    }
    const padding = {}
    for (const section of table) for (const array of section.data) for (const [index, string] of array.entries()) if (!padding[index] || string.length > padding[index]) padding[index] = string.length
    const lines = []
    for (const section of table) {
      lines.push(section.title ? cosmetic.cyan.underline(section.title) : '')
      if (section.versionString) lines.push(`v${section.versionString}`)
      if (section.info) lines.push(section.info)
      for (const array of section.data) {
        let line = ''
        for (let [index, string] of array.entries()) {
          if (padding[index] && padding[index] !== string.length) while (string.length < padding[index]) string += ' '
          line += line ? `  ${string}` : string
        }
        lines.push(line)
      }
      lines.push('')
    }
    for (const line of lines) console.log(line)
  }
  async parse (array) {
    array.splice(0, 2)
    let command = this
    const options = { _source: Array.from(array) }
    while (array.length) {
      if (!array.includes('help')) {
        Object.assign(options, findOptions(array, command))
        Object.assign(options, findCommandVariables(array, command))
        Object.assign(options, findOptions(array, command))
      }
      if (array.length) {
        if (!array.includes('help')) for (const middleware of command.middlewaresArray) await middleware(options)
        const newCommand = findCommand(array, command.commandsArray)
        if (!newCommand && array[0] === 'help') return command.help(options._source)
        if (!newCommand) throw new SyntaxError(`Unknown command: ${array[0]}`)
        const name = command.name || '_base'
        if (!options._parents) options._parents = {}
        options._parents[name] = {}
        for (const key of Object.keys(options)) {
          if (!key.startsWith('_')) {
            options._parents[name][key] = options[key]
            delete options[key]
          }
        }
        command = newCommand
      }
    }
    for (const middleware of command.middlewaresArray) await middleware(options)
    if (command.actionFunction) return command.actionFunction(options)
    if (options._source.length == 2) return command.help(options._source)
    throw new Error(`No action for command: ${command.name || '_base'}`)
  }
}
