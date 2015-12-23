module.exports = (function() {
  var FileWatchersConfig = function() {
    this.config = {};
    this.extensions = {};
  };

  FileWatchersConfig.prototype.get = function(key) {
    return typeof(key) == 'undefined' ? this.config : this.config[key];
  };

  FileWatchersConfig.prototype.set = function(key, value) {
    //把字符串转换为数组
    if (key.match(/@extension|@exclude/g)) {
      if (value.trim() === '') {
        value = [];
      } else {
        value = key.match(/@extension/g) ? value.toLowerCase() : value;
        value = value.replace(/\s{2,20}/g, ' ').split(' ');
      }
    }

    this.config[key] = value;

    //存储已开启监听文件类型的扩展名
    if (key.match(/@file|@extension/g)) {
      this.setExtensions(key.match(/compile@([\s\S]*?)@/)[1]);
    }
  };

  FileWatchersConfig.prototype.setExtensions = function(fileType) {
    if (Object.prototype.hasOwnProperty.call(this.config, 'compile@' + fileType + '@extension') && Object.prototype.hasOwnProperty.call(this.config, 'compile@' + fileType + '@extension')) {
      if (this.config['compile@' + fileType + '@file']) {
        this.extensions[fileType] = this.config['compile@' + fileType + '@extension'];
      } else if (!this.config['compile@' + fileType + '@file'] && Object.prototype.hasOwnProperty.call(this.extensions, fileType)) {
        delete this.extensions[fileType];
      }
    }
  };

  FileWatchersConfig.prototype.getExtensions = function() {
    return this.extensions;
  };

  return FileWatchersConfig;
})();
