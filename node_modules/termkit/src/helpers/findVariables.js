const findVariable = require('./findVariable')

module.exports = (base, array, variables, commands) => {
  let result = {}
  if (!variables) {
    if (base) result[base] = true
    return result
  }
  if (variables.length > 1) result[base] = {}
  for (let variable of variables) {
    let newVar = findVariable(array, variable, commands)
    if (variables.length > 1) {
      result[base][variable.name] = newVar
    } else {
      if (base) {
        result[base] = newVar
      } else {
        result[variable.name] = newVar
      }
    }
  }
  return result
}
