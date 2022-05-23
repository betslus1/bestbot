# Cosmetic

A plugin to color encode strings

## Getting Started

Here's how to get some fancy color encoded strings in your application

### Installing

Add this package to your project

```
npm install --save cosmetic
```

### Using

Cosmetic is easy to use

```
let cosmetic = require('cosmetic');

console.log(cosmetic.green('Success!'));
```

There are many different font styles

```
console.log(cosmetic.bold('Bold'));
console.log(cosmetic.faint('Faint'));
console.log(cosmetic.italic('Italic'));
console.log(cosmetic.underline('Underline'));
console.log(cosmetic.blink('Blink'));
console.log(cosmetic.rapidBlink('Rapid Blink')); // Not always supported...
console.log(cosmetic.reverse('Reverse'));
console.log(cosmetic.conceal('Conceal'));
```

Styles are chainable

```
console.log(cosmetic.underline.green('Underlined green text'));
```

The basic 8 colors, regular and bright, foreground and background

```
console.log(cosmetic.black('Black'));
console.log(cosmetic.bright.black('Bright Black'));
console.log(cosmetic.background.black('Background Black'));
console.log(cosmetic.bright.background.black('Bright Background Black'));

console.log(cosmetic.red('Red'));
console.log(cosmetic.bright.red('Bright Red'));
console.log(cosmetic.background.red('Background Red'));
console.log(cosmetic.bright.background.red('Bright Background Red'));

console.log(cosmetic.green('Green'));
console.log(cosmetic.bright.green('Bright Green'));
console.log(cosmetic.background.green('Background Green'));
console.log(cosmetic.bright.background.green('Bright Background Green'));

console.log(cosmetic.yellow('Yellow'));
console.log(cosmetic.bright.yellow('Bright Yellow'));
console.log(cosmetic.background.yellow('Background Yellow'));
console.log(cosmetic.bright.background.yellow('Bright Background Yellow'));

console.log(cosmetic.blue('Blue'));
console.log(cosmetic.bright.blue('Bright Blue'));
console.log(cosmetic.background.blue('Background Blue'));
console.log(cosmetic.bright.background.blue('Bright Background Blue'));

console.log(cosmetic.magenta('Magenta'));
console.log(cosmetic.bright.magenta('Bright Magenta'));
console.log(cosmetic.background.magenta('Background Magenta'));
console.log(cosmetic.bright.background.magenta('Bright Background Magenta'));

console.log(cosmetic.cyan('Cyan'));
console.log(cosmetic.bright.cyan('Bright Cyan'));
console.log(cosmetic.background.cyan('Background Cyan'));
console.log(cosmetic.bright.background.cyan('Bright Background Cyan'));

console.log(cosmetic.white('White'));
console.log(cosmetic.bright.white('Bright White'));
console.log(cosmetic.background.white('Background White'));
console.log(cosmetic.bright.background.white('Bright Background White'));
```

Also you can use all 256 Xterm colors

```
for (let i = 0; i < 256; i++) {
  console.log(cosmetic.xterm(i)(`Xterm ${i}`));
  console.log(cosmetic.background.xterm(i)(`Xterm ${i} Background`));
};
```

Combine different styles, foreground, and background colors to completely customize your strings.  Enjoy!

## Authors

* **Jay Deaton** - [Github](https://github.com/jayrdeaton)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
