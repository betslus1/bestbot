module.exports = (array, variable, commands) => {
  let result
  if (array.length > 0 && !array[0].startsWith('-') && !variable.array) {
    if ((!commands.includes(array[0]) || variable.required) && array[0] !== 'help') result = array.shift()
  } else if (array.length > 0 && variable.array) {
    result = []
    while(array.length > 0 && !array[0].startsWith('-')) {
      if (commands.includes(array[0])) break
      result.push(array.shift())
    }
  }
  if (!result && variable.required) throw new Error(`Missing required variable <${variable.name}>`)
  if (!result) result = true
  return result
}
