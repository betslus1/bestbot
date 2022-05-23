const { is, isnt } = require('amprisand'),
  { command, option, setDefaults } = require('../../')

let program, output

setDefaults({
  middlewares: [
    (options) => output ? output.push({ name: 'default', options }) : null
  ]
})

describe('middleware', () => {
  describe('program = command()', () => {
    it('should create a program with middleware', () => {
      program = command('app', '[opt]')
        .version('0.0.0')
        .options([
          option('a', 'array', '[arr...]', 'Option with array variable'),
          option('r', 'required', '<reqA>', 'Option with required variable'),
          option('o', 'optional', '[opt]', 'Option with optional variable'),
          option('b', 'boolean', null, 'Option with no variable')
        ])
        .middleware(async (options) => await output.push({ name: 'middleware', options }))
        .action(async (options) => await output.push({ name: 'action', options }))
        .commands([
          command('nested')
          .options([
            option('a', 'array', '[arr...]', 'Option with array variable'),
            option('r', 'required', '<reqA>', 'Option with required variable'),
            option('o', 'optional', '[opt]', 'Option with optional variable'),
            option('b', 'boolean', null, 'Option with no variable')
          ])
          .middleware(async (options) => await output.push({ name: 'nested middleware', options }))
          .action(async(options) => await output.push({ name: 'nested action', options }))
        ])
    })
  })
  describe('program.parse()', () => {
    it('middleware should be called before action', async () => {
      output = []
      await program.parse('_ _'.split(' '))
      output[0].name.is('default')
      output[1].name.is('middleware')
      output[2].name.is('action')
    })
  })
  describe('program.parse()', () => {
    it('parent middleware should be called first', async () => {
      output = []
      await program.parse('_ _ nested'.split(' '))
      // hits default twice cause every command gets default, nested and top
      output[0].name.is('default')
      output[1].name.is('middleware')
      output[2].name.is('default')
      output[3].name.is('nested middleware')
      output[4].name.is('nested action')
    })
  })
  describe('program.parse()', () => {
    it('should get options and variables', async () => {
      output = []
      await program.parse('_ _ test -r required nested -b'.split(' '))
      // hits default twice cause every command gets default, nested and top
      output[0].name.is('default')
      output[1].name.is('middleware')
      output[2].name.is('default')
      output[3].name.is('nested middleware')
      output[4].name.is('nested action')      // output[0].name.is('middleware')
      // output[1].name.is('nested middleware')
      // output[2].name.is('nested action')
    })
  })
})
