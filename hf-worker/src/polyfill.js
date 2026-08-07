if (typeof globalThis.File === 'undefined') {
  globalThis.File = class File {
    constructor(bits, name, options) {
      this.bits = bits;
      this.name = name;
      this.options = options;
    }
  };
}

if (typeof String.prototype.toWellFormed === 'undefined') {
  String.prototype.toWellFormed = function () {
    try {
      return this.normalize();
    } catch (e) {
      return String(this);
    }
  };
}
