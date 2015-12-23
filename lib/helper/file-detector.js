var fs = require('fs'),
  path = require('path'),
  exec = require('child_process').exec,
  glob = require('glob'),
  parseImport = require('parse-import');

var cache = {};

module.exports = (function() {
  var Detector = function(dir, options) {
    this.dir = dir;
    this.extensions = options.extensions || [];
    this.exclude = options.exclude || [];
    this.isWindows = /^win/.test(process.platform);
    this.imports = {};
  };

  Detector.prototype.whetherExclude = function(filePath) {
    //不是文件就排除掉
    if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) return false;
    //过滤自定目录或者自定文件
    for (var i = 0; i < this.exclude.length; i++) {
      if (filePath.indexOf(this.exclude[i]) === 0) {
        return false;
      }
    }
    return true;
  };

  Detector.prototype.addFile = function(filePath, parent) {
    if (this.whetherExclude(filePath)) {
      this.imports[filePath] = this.imports[filePath] || {
        imports: [],
        importedBy: []
      };
      if (typeof(parent) == 'undefined') {
        var file = path.parse(filePath),
          improts = parseImport(fs.readFileSync(filePath, 'utf-8'));

        for (var i = 0; i < improts.length; i++) {
          var improtFilePath = this.getFilePath(path.resolve(file.dir, improts[i].path).replace(/\\/g, '/'), file.ext);
          if (improtFilePath) {
            this.imports[filePath].imports.push(improtFilePath);
            this.addFile(improtFilePath, filePath);
          }
        }
      } else {
        this.imports[filePath].importedBy.push(parent);
      }
    }
  };

  Detector.prototype.getFilePath = function(filePath, fileExt) {
    var newPath = filePath;
    //如果当前文件路径没有扩展名 就默认添加扩展名
    if (path.extname(newPath) === '') newPath = filePath + fileExt;
    //查找当前文件是否存在
    if (fs.existsSync(newPath) && fs.lstatSync(newPath).isFile()) {
      return newPath;
    } else {
      for (var i = 0; i < this.extensions.length; i++) {
        newPath = filePath + '.' + this.extensions[i];
        if (fs.existsSync(newPath) && fs.lstatSync(newPath).isFile()) {
          return newPath;
        }
      }
    }
    return false;
  };

  Detector.prototype.find = function(callback) {
    if (this.extensions.length === 0) return callback(null, 'Extension of empty');

    //遍历文件
    var _this = this;
    var traverse = function(files) {
      if (files.length === 0 || (files.length === 1 && files[0].trim() === "")) return callback(null, '');
      files.forEach(function(file) {
        _this.addFile(file);
      });
      //处理结束
      callback(_this.imports);
    };

    //判断用户是否是windos系统 如果是就使用node-glob来完成文件的查找任务 否则使用命令行
    //命令行查找速度快于node-glob 但是在win因为路径过长问题会导致查找错误 所以win用node-glob
    if (this.isWindows) {
      glob(this.dir + '/**/*.@(' + this.extensions.join('|').replace(/\./g, '') + ')', {
        cwd: this.dir,
        nosort: true,
        cache: cache,
        statCache: cache
      }, function(err, files) {
        if (err) {
          callback(null, err);
        } else {
          traverse(files);
        }
      });
    } else {
      var command = 'find ' + this.dir + ' -type f';
      this.extensions.forEach(function(ext, i) {
        command += (i > 0 ? ' -o' : '') + ' -name *' + ext;
      });
      exec(command, function(err, stdout, stderr) {
        if (err) {
          callback(null, err);
        } else {
          var files = stdout.replace(/\r/g, "").split("\n");
          files.splice(-1, 1);
          traverse(files);
        }
      });
    }
  };

  return Detector;
}());
