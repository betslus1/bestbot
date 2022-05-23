# Termkit

A terminal input parsing kit

## Getting Started

This is how to get started using Termkit

### Installing

Add this package to your project
```bash
npm install --save termkit
```

### Using

Configure your command line program
```node
const { command, middleware, option } = require('termkit')

const program = command('example')
  .version('1.0.0')
  .description('example program')
  .option('a', 'array', '[arr...]', 'Array variable')
  .option('r', 'required', '<reqA> <reqB>', 'Two required variables')
  .option('o', 'optional', '[opt]', 'One optional variable')
  .option('b', 'boolean', null, 'No variable')
  .middleware((options) => console.log('middleware is run before action, manipulate the options object as needed'))
  .action((options) => console.log('run action with given options'))
  .commands([
    command('first')
    .description('first nested command')
    .options([
      // Same style options as before
    ])
    .middleware((options) => console.log('middleware can be nested too'))
    .action((options) => console.log('run action with given options'))
    .commands([
      // So on and so forth
    ])
  ])
```

Alternatively supply options and middlewares to command in arrays
```node
command('example')
  .options([
    option('a', 'array', '[arr...]', 'Array variable'),
    option('r', 'required', '<reqA> <reqB>', 'Two required variables'),
    option('o', 'optional', '[opt]', 'One optional variable'),
    option('b', 'boolean', null, 'No variable')
  ])
  .middlewares([
    middleware(() => console.log(1)),
    middleware(() => console.log(2)),
    middleware(() => console.log(3))
  ])
```

Commands nest and can have variables themselves
```node
command('example').commands([
  command('another', '[optional]'),
  command('another', '<required>'),
  command('another', '[array...]')
])
```

Variables, and options are passed into middleware and action functions.
```node
command('example', <var>)
  .option('r', 'require', <req>, 'Another example')
  .middleware(options) => {
    console.log(options.require)
  })
  .action((options) => {
    console.log(options.require)
  })
```

After completing constructing the CLI flow, parse the input and catch possible errors
```node
try {
  program.parse(process.argv)
} catch(err) {
  console.log(err)
}
```

Built in terminal help usage function
```node
  program.parse('_ _ help'.split(' '))
```

Stay tuned for more

## Authors

* **Jay Deaton** - [Github](https://github.com/jayrdeaton)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
