const { is, isnt } = require('amprisand'),
  { command, middleware, option, setDefaults } = require('../../')

// setDefaults({
//   middlewares: [() => console.log('yooo')]
// })

let program

describe('complex', () => {
  describe('program = command()', () => {
    it('should set up program', () => {
      program = command('app', '<req>')
        .version(process.env.npm_package_version)
        .description('Program description', 'This is some super extensive detail about this command')
        .variable('[dir]')
        .middlewares([
          // middleware((options) => console.log('here', options))
        ])
        .options([
          option('a', 'array', '[arr...]', 'Option with array variable'),
          option('r', 'required', '<reqA> <reqB>', 'Option with required variable'),
          option('o', 'optional', '[opt]', 'Option with optional variable'),
          option('b', 'boolean', null, 'Option with no variable')
        ])
        .action((options) => ({ command: 'app', options }))
        .commands([
          command('help', null, 'Help Func')
          .action((options) => ({ command: 'help', options })),
          command('one', '[reqA] [reqB]', 'Description of one')
          .option('a', 'array', '[arr...]', 'Option with array variable')
          .option('r', 'required', '<req>', 'Option with required variable')
          .option('o', 'optional', '[opt]', 'Option wit h optional variable')
          .option('b', 'boolean', null, 'Option with no variable')
          .action((options) => ({ command: 'one', options })),
          command('two', '<req>', 'Description of two')
          .option('a', 'array', '[arr...]', 'Option with array variable')
          .option('r', 'required', '<req>', 'Option with required variable')
          .option('o', 'optional', '[opt]', 'Option with optional variable')
          .option('b', 'boolean', null, 'Option with no variable')
          .middleware(() => console.log('two middleware'))
          .action((options) => ({ command: 'two', options }))
          .commands([
            command('three', null, 'Description of three')
            .option('a', 'array', '[arr...]', 'Option with array variable')
            .option('r', 'required', '<req>', 'Option with required variable')
            .option('o', 'optional', '[opt]', 'Option with optional variable')
            .option('b', 'boolean', null, 'Option with no variable')
            .action((options) => ({ command: 'three', options }))
            .commands([
              command('help')
              .action((options) => {
                console.log('custom usage printout')
              })
            ]),
            command('four', '[optA] [optB]', 'Description of four')
            .option('a', 'array', '[arr...]', 'Option with array variable')
            .option(null, 'required', '<req>', 'Option with required variable')
            .option('o', null, '[opt]', 'Option with optional variable')
            .option('b', 'boolean', null, 'Option with no variable')
            .middleware((options) => console.log('four middleware'))
            .action((options) => console.log('four action'))
          ])
        ])

    })
  })
  describe('program.parse()', () => {
    it('should run program', async () => {
      let error, result
      try {
        result = await program.parse('_ _ req --array arr0 arr1 arr2 --required req1 req2 --optional test --boolean'.split(' '))
      } catch(err) {
        error = err
      }
      isnt(error)
      is(result)
      result.command.is('app')
      // program.parse('_ _ -a arr0 arr1 arr2 -r req1 req2 -o -b'.split(' '))
      // program.parse('_ _ one testA testB'.split(' '))
      // program.parse('_ _ test -r requiredA requiredB one -r requiredC'.split(' '))
      // program.parse('_ _ test -a arr0 arr1 one -br required'.split(' '))
      // program.parse('_ _ -r reqA reqB'.split(' '))
      // program.parse('_ _ dir -r reqA reqB -a arr1 arr2 arr3 -o optional one fail'.split(' '))
      // program.parse('_ _ two four -a arr0 arr1 arr2 -r required -ob'.split(' '))
      // program.parse('_ _ shortcut'.split(' '))
      // program.parse('_ _ help'.split(' '))
      // program.parse('_ _ two three help'.split(' '))
      // program.parse('_ _ two help'.split(' '))
      // program.parse('_ _ two four help'.split(' '))
      // program.parse('_ _ two required four optionalA optionalB'.split(' '))
      // program.parse('_ _ two required four optionalA'.split(' '))
    })
  })
  describe('program.parse()', () => {
    it('should run program', async () => {
      let error, result
      try {
        result = await program.parse('_ _ req two req three -a arr0 arr1 arr2 -r required -ob'.split(' '))
      } catch(err) {
        error = err
      }
      isnt(error)
      is(result)
      result.command.is('three')
    })
  })
  describe('program.parse()', () => {
    it('should run program', async () => {
      let error, result
      try {
        result = await program.parse('_ _ req two req three -a arr0 arr1 arr2 --required required -ob'.split(' '))
      } catch(err) {
        error = err
      }
      isnt(error)
      is(result)
      result.command.is('three')
    })
  })
  describe('program.parse(help)', () => {
    it('should run program', async () => {
      let error, result
      try {
        result = await program.parse('_ _ help'.split(' '))
      } catch(err) {
        error = err
      }
      isnt(error)
      is(result)
      result.command.is('help')
    })
  })
  describe('program.parse(help)', () => {
    it('should run program', async () => {
      let error, result
      try {
        await program.parse('_ _ help'.split(' '))
      } catch(err) {
        error = err
      }
      isnt(error)
      // is(result)
      // result.command.is('help')
    })
  })
  describe('program.parse(-b req)', () => {
    it('should run program', async () => {
      let error, result
      try {
        result = await program.parse('_ _ -b req'.split(' '))
      } catch(err) {
        error = err
      }
      isnt(error)
      is(result)
      // result.command.is('help')
    })
  })
})
