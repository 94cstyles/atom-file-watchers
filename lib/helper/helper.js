var path = require('path'),
  Detector = require('./file-detector');

//数组去重
Array.prototype.unique = function() {
  this.sort();
  var re = [this[0]];
  for (var i = 1; i < this.length; i++) {
    if (this[i] !== re[re.length - 1]) {
      re.push(this[i]);
    }
  }
  return re;
};

module.exports = {
  //空函数
  noop: function() {},
  //查找当前文件修改产生的连锁反应的文件
  //仅用于sass 和 less
  getChainReactionFileByImport: function(filePath, options, callback) {
    var detector = new Detector(atom.project.getPaths()[0].replace(/\\/g, '/'), options);
    detector.find(function(imports, msg) {
      if (!imports) {
        callback(null, msg || filePath + " Could not find the file"); //引发错误
      } else if (!imports[filePath]) {
        callback(null, filePath + " Could not find the file"); //没有找到文件数据
      } else if (imports[filePath].importedBy.length === 0) {
        callback([filePath]); //单独文件 没有被引用
      } else {
        //遍历关系链 找到受连锁反应的文件
        var filePaths = [];
        var multipleNested = function(key, importedBy) {
          for (var i = 0; i < importedBy.length; i++) {
            if (imports[importedBy[i]].importedBy.length === 0) {
              filePaths.push(importedBy[i]);
            } else {
              multipleNested(importedBy[i], imports[importedBy[i]].importedBy);
            }
          }
        };
        multipleNested(filePath, imports[filePath].importedBy);
        callback(filePaths.unique());
      }
    });
  },
  //根据当前系统获取默认npm安装目录
  getNpmInstallationDir: function() {
    var installationDir = null;
    if (process.platform === 'win32') {
      installationDir = path.join(process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'], 'AppData\\Roaming\\npm');
    } else if (process.platform === 'linux' || process.platform === 'darwin') {
      installationDir = '/usr/local/bin';
    }
    return installationDir;
  },
  //根据文件路径或者文件名判断是否是某扩展名并返回文件类型
  hasFileExtension: function(filePath, fileExtensions) {
    var ext = path.extname(filePath).toLowerCase();
    for (var fileType in fileExtensions) {
      if (fileExtensions[fileType].indexOf(ext) !== -1) {
        return fileType;
      }
    }
    return null;
  }
};
