var fs = require('fs'),
  path = require('path'),
  EventEmitter = require('events').EventEmitter,
  exec = require('child_process').exec;

var helper = require('./helper/helper');

module.exports = (function() {
  var FileWatchersCompiler = function() {
    this.options = null;
    this.program = {};
    this.timer = {};
    this.server = new EventEmitter();
  };

  FileWatchersCompiler.prototype.findProgramInstallation = function(programPath, fileType) {
    var _this = this;
    //第一次就立即执行
    //设置1000毫秒的延迟，减少输入框input触发调用执行次数
    clearTimeout(this.timer[fileType]);
    this.timer[fileType] = setTimeout(function() {
      //检查程序路径是否正确
      if (fs.existsSync(programPath)) {
        var command = programPath + " --version >" + (process.platform === 'win32' ? 'nul' : '/dev/null') + " 2>&1 && (echo found) || (echo fail)";
        var environment = Object.create(process.env);
        environment.PATH += ":" + path.parse(programPath).dir;
        exec(command, {
          env: environment
        }, function(error, stdout, stderr) {
          if (stdout.trim() === 'found') {
            //成功找到并测试了处理程序
            _this.program[fileType] = {
              environment: environment,
              path: programPath
            };
          } else {
            //处理程序运行失败
            _this.program[fileType] = null;
          }
        });
      } else {
        //处理程序不存在
        _this.program[fileType] = null;
      }
    }, typeof(this.timer[fileType]) == 'undefined' ? 0 : 1000);
  };

  FileWatchersCompiler.prototype.setOptions = function(options, key, value) {
    this.options = options;
    if (key.match(/@programPath/g)) { //如果是设置程序处理地址 就去验证地址正确性
      this.findProgramInstallation(value, key.match(/compile@([\s\S]*?)@programPath/)[1]);
    }
  };

  FileWatchersCompiler.prototype.replacePlaceholder = function(filePath, content) {
    var projectDirectory = atom.project.getPaths()[0].replace(/\\/g, '/'),
      file = path.parse(filePath);
    file.firstName = file.name.indexOf('.') == -1 ? file.name : file.name.substring(0, file.name.indexOf('.'));

    file.dir = file.dir.replace(/\\/g, '/');

    content = content.replace(/\$FileName\$/g, file.base);
    content = content.replace(/\$FileNameWithoutExtension\$/g, file.name);
    content = content.replace(/\$FileNameWithoutAllExtension\$/g, file.firstName);
    content = content.replace(/\$FileDir\$/g, file.dir);
    content = content.replace(/\$FilePath\$/g, filePath);
    content = content.replace(/\$ProjectDir\$/g, projectDirectory);

    if (content.match(/\$FileDirRelativeToProjectRoot\$/)) {
      content = content.replace(/\$FileDirRelativeToProjectRoot\$/g, file.dir.replace(projectDirectory, '').split('/').splice(1).join('/'));
    }

    if (content.match(/\$FileDirName\$/)) {
      var dirNames = file.dir.split('/');
      content = content.replace(/\$FileDirName\$/g, dirNames[dirNames.length - 1]);
    }

    var fileDirPathFromParent = content.match(/\$FileDirPathFromParent\(([\s\S]*?)\)\$/);
    if (fileDirPathFromParent) {
      fileDirPathFromParent = fileDirPathFromParent[1].trim();
      content = content.replace(/\$FileDirPathFromParent\(([\s\S]*?)\)\$/, fileDirPathFromParent === '' ? "" : function() {
        var dirNames = file.dir.split('/'),
          index = dirNames.lastIndexOf(fileDirPathFromParent);
        return (index == -1 ? [] : dirNames.splice(index + 1)).join('/');
      }());
    }

    return content;
  };

  FileWatchersCompiler.prototype.errorMessage = function(error, stdout, stderr, filePath, fileType) {
    var message = filePath + '\n \n';
    message += "MESSAGE: \n";
    if (fileType === 'sass' && error.message.indexOf('"message":') > -1) {
      var errorJson = JSON.parse(error.message.match(/{\n(.*?(\n))+}/gm));
      message += errorJson.message + '\n \n';
      message += "LINE:  " + errorJson.line + '\n';
      message += "COLUMN: " + errorJson.column;
    } else if (fileType === 'typescript' && stdout.match(/error TS([\s\S]*?):/gm)) {
      var errorCode = stdout.match(/error TS([\s\S]*?):/gm),
        text = stdout.substring(stdout.indexOf(errorCode[0]) + errorCode[0].length),
        number = stdout.match(/\(([\d]*?),([\d]*?)\)/gm)[0].replace('(', '').replace(')', '').split(',');
      message += text.indexOf(filePath) !== -1 ? text.substring(0, text.indexOf(filePath)) : text + '\n \n';
      message += "LINE:  " + number[0] + '\n';
      message += "COLUMN: " + number[1];
    } else if (fileType === 'coffeescript' && error.message.indexOf('error:') > -1) {
      message += error.message.substring(error.message.indexOf('error:') + 7);
    } else if (fileType === 'less' && error.message.indexOf('ParseError:') > -1) {
      var msg = error.message.replace(/\[([\d]*?)m/g, '');
      message += msg.substring(msg.indexOf('ParseError:') + 12);
    } else {
      message = error.message;
    }
    return message;
  };

  FileWatchersCompiler.prototype.process = function(filePath, fileType) {
    var _this = this,
      extension = this.options['compile@' + fileType + '@extension'],
      exclude = this.options['compile@' + fileType + '@exclude'];

    //判断当前文件是否被排除
    for (var i = 0; i < exclude.length; i++) {
      exclude[i] = path.resolve(atom.project.getPaths()[0], exclude[i]);
      if (filePath.indexOf(exclude[i]) === 0) {
        return false;
      }
    }

    if (!this.program[fileType]) {
      //没有找到处理程序。
      this.server.emit('warning', 'Warning', this.options['compile@' + fileType + '@programPath'] + ' No such file or directory');
    } else if (this.options['compile@' + fileType + '@command'].trim() === '') {
      //没有处理程序命令
      this.server.emit('warning', 'Warning', 'Please enter the ' + fileType + ' files command');
    } else {
      var filePaths = [filePath];

      var compile = function(files, msg) {
        if (files) {
          files.forEach(function(file, index) {
            var command = _this.program[fileType].path;
            //替换掉占位符
            command += " " + _this.replacePlaceholder(file, _this.options['compile@' + fileType + '@command']);

            var child = exec(command, {
              env: _this.program[fileType].environment
            }, function(error, stdout, stderr) {
              if (child.exitCode > 0) {
                _this.server.emit('error', 'Compilation error', _this.errorMessage(error, stdout, stderr, file, fileType.toLocaleLowerCase()));
              } else if (index == files.length - 1) {
                _this.server.emit('success', 'Successfully compiled', files.join('\n \n'));
              }
            });
          });
        } else {
          _this.server.emit('error', 'Compilation error', msg);
        }
      };

      //如果当前文件被其他文件引用 这个文件不会被编译 只会去编译引用的文件
      if (this.options.parsesCssFiles && (fileType.toLocaleLowerCase() === 'sass' || fileType.toLocaleLowerCase() === 'less')) {
        helper.getChainReactionFileByImport(filePath, {
          "extensions": extension,
          "exclude": exclude
        }, compile);
      } else {
        compile([filePath]);
      }
    }
  };

  FileWatchersCompiler.prototype.on = function(event, callbcak) {
    return this.server.on(event, callbcak);
  };

  return FileWatchersCompiler;
})();
