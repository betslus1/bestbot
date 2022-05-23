let Variable = require('../models/Variable')

module.exports = (string) => {
  let results = []
  let variables = string.split(' ')
  for (let variable of variables) {
    let raw = variable.trim()
    if (variable.startsWith('<') && variable.endsWith('>')) {
      variable = variable.replace('<', '').replace('>', '')
      results.push(new Variable({name: variable, raw, required: true}))
    } else if (variable.startsWith('[') && variable.endsWith('...]')) {
      variable = variable.replace('[', '').replace('...]', '')
      results.push(new Variable({array: true, name: variable, raw}))
    } else if (variable.startsWith('[') && variable.endsWith(']')) {
      variable = variable.replace('[', '').replace(']', '')
      results.push(new Variable({name: variable, raw}))
    } else {
      throw `Unrecognized variable description: ${variable}`
    }
  }
  return results
}
