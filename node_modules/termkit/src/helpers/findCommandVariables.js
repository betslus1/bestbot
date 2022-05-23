const findVariables = require('./findVariables')

module.exports = (array, command) => {
  let variables = findVariables(null, array, command.variables, command.commandStrings)
  if (variables[null]) variables = variables[null]
  for (let key of Object.keys(variables)) {
    if (variables[key] === true) delete variables[key]
  }
  if (Object.keys(variables).length === 0) return null
  return variables
}
