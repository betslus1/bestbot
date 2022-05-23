const { Style } = require('./models');

class Cosmetic {
  constructor() {
    Object.setPrototypeOf(this.encoder, Cosmetic.prototype);
    Object.assign([], this.encoder.styles);
    return this.encoder;
  };
  setup() {
    this.styles = [];
    this.bgEnabled = false;
    this.brightEnabled = false;
    // this.xterm = this.xterm.bind(this.encoder)
    // return this;
  };
  xterm(num) {
    if (this.bgEnabled) {
      this.styles.unshift(new Style(`48;5;${num}`, '49'));
    } else {
      this.styles.unshift(new Style(`38;5;${num}`, '39'));
    };
    return this;
  };
  encoder(string) {
    if (!process.stdout || !process.stdout.isTTY) return string;
    let instance = this;
    if (!instance) instance = cosmetic;
    for (let style of instance.styles) string = `${style.prefix}${string}${style.suffix}`;
    instance.setup();
    return string;
  };
  // rgb(r, g, b) {
  //   // Broken
  //   // 0 95 135 175 215 255
  //   this.styles.unshift(new Style(`38;5;${r};${g};${b}`, '39'));
  //   return this;
  // };
  get random() {
    return this.xterm(Math.round(Math.random() * 256));
  };
  get background() {
    this.bgEnabled = true;
    return this;
  };
  get foreground() {
    this.bgEnabled = false;
    return this;
  };
  get bright() {
    this.brightEnabled = true;
    return this;
  };
  get dark() {
    this.brightEnabled = false;
    return this;
  };
  get reset() {
    this.styles.unshift(new Style('0', '0'));
    return this;
  };
  get normal() {
    return this.reset;
  };
  get bold() {
    this.styles.unshift(new Style('1', '22'));
    return this;
  };
  get faint() {
    this.styles.unshift(new Style('2', '22'));
    return this;
  };
  get italic() {
    this.styles.unshift(new Style('3', '23'));
    return this;
  };
  get underline() {
    this.styles.unshift(new Style('4', '24'));
    return this;
  };
  get blink() {
    this.styles.unshift(new Style('5', '25'));
    return this;
  };
  get rapidBlink() {
    this.styles.unshift(new Style('6', '25'));
    return this;
  };
  get reverse() {
    this.styles.unshift(new Style('7', '27'));
    return this;
  };
  get conceal() {
    this.styles.unshift(new Style('8', '28'));
    return this;
  };
  // Colors
  get black() {
    if (this.brightEnabled) {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('100', '49'));
      } else {
        this.styles.unshift(new Style('90', '39'));
      };
    } else {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('40', '49'));
      } else {
        this.styles.unshift(new Style('30', '39'));
      };
    };
    return this;
  };
  get red() {
    if (this.brightEnabled) {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('101', '49'));
      } else {
        this.styles.unshift(new Style('91', '39'));
      };
    } else {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('41', '49'));
      } else {
        this.styles.unshift(new Style('31', '39'));
      };
    };
    return this;
  };
  get green() {
    if (this.brightEnabled) {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('102', '49'));
      } else {
        this.styles.unshift(new Style('92', '39'));
      };
    } else {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('42', '49'));
      } else {
        this.styles.unshift(new Style('32', '39'));
      };
    };
    return this;
  };
  get yellow() {
    if (this.brightEnabled) {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('103', '49'));
      } else {
        this.styles.unshift(new Style('93', '39'));
      };
    } else {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('43', '49'));
      } else {
        this.styles.unshift(new Style('33', '39'));
      };
    };
    return this;
  };
  get blue() {
    if (this.brightEnabled) {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('104', '49'));
      } else {
        this.styles.unshift(new Style('94', '39'));
      };
    } else {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('44', '49'));
      } else {
        this.styles.unshift(new Style('34', '39'));
      };
    };
    return this;
  };
  get magenta() {
    if (this.brightEnabled) {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('105', '49'));
      } else {
        this.styles.unshift(new Style('95', '39'));
      };
    } else {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('45', '49'));
      } else {
        this.styles.unshift(new Style('35', '39'));
      };
    };
    return this;
  };
  get cyan() {
    if (this.brightEnabled) {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('106', '49'));
      } else {
        this.styles.unshift(new Style('96', '39'));
      };
    } else {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('46', '49'));
      } else {
        this.styles.unshift(new Style('36', '39'));
      };
    };
    return this;
  };
  get white() {
    if (this.brightEnabled) {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('107', '49'));
      } else {
        this.styles.unshift(new Style('97', '39'));
      };
    } else {
      if (this.bgEnabled) {
        this.styles.unshift(new Style('47', '49'));
      } else {
        this.styles.unshift(new Style('37', '39'));
      };
    };
    return this;
  };
};

const cosmetic = new Cosmetic();
cosmetic.setup();

module.exports = cosmetic;
