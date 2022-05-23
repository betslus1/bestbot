module.exports = (array, commands) => {
  let result
  for (let command of commands) {
    if (array[0] === command.name) {
      array.shift()
      return command
    }
  }
  return null
}
