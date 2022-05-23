const findOption = require('./findOption'),
  findVariables = require('./findVariables')

module.exports = (array, command) => {
  const options = command.optionsArray
  const result = {}
  while (array.length > 0 && array[0].startsWith('-')) {
    if (array[0].startsWith('--')) {
      let string = array.shift()
      string = string.replace('--', '')
      const option = findOption(string, options)
      if (!option) throw new Error(`Unknown Option: --${string}`)
      let vars
      try {
        vars = findVariables(option.long, array, option.variables, command.commandStrings)
      } catch(err) {
        err.message += ` for --${option.long}`
        throw err
      }
      Object.assign(result, vars)
    } else {
      let string = array.shift()
      const substring = string.slice(1, 2)
      const option = findOption(substring, options)
      if (!option) throw new Error(`Unknown Option: -${substring}`)
      string = string.replace(substring, '')
      if (string !== '-') array.unshift(string)
      let vars
      try {
        vars = findVariables(option.long, array, option.variables, command.commandStrings)
      } catch(err) {
        err.message += ` for --${option.long}`
        throw err
      }
      Object.assign(result, vars)
    }
  }
  return result
}
