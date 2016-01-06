'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _child_process = require("child_process");

var _units = require("./helper/units");

var _units2 = _interopRequireDefault(_units);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FileWatchersCompiler = (function () {
    function FileWatchersCompiler(event) {
        _classCallCheck(this, FileWatchersCompiler);

        this.event = event;
        this.cache = {};
    }

    _createClass(FileWatchersCompiler, [{
        key: "findProgramInstallation",
        value: function findProgramInstallation(programPath) {
            if (typeof this.cache[programPath] === 'undefined') {
                if (_fs2.default.existsSync(programPath)) {
                    var command = programPath + " --version >" + (process.platform === 'win32' ? 'nul' : '/dev/null') + " 2>&1 && (echo found) || (echo fail)";
                    var environment = Object.create(process.env);
                    environment.PATH += ":" + _path2.default.parse(programPath).dir;
                    if ((0, _child_process.execSync)(command, {
                        env: environment,
                        encoding: 'utf8',
                        stdio: 'pipe'
                    }).match(/found/)) {
                        this.cache[programPath] = environment;
                    } else {
                        this.cache[programPath] = null;
                    }
                } else {
                    this.cache[programPath] = null;
                }
            }
            return this.cache[programPath];
        }
    }, {
        key: "replacePlaceholder",
        value: function replacePlaceholder(projectDir, filePath, content) {
            var file = _path2.default.parse(filePath);
            file.dir = _units2.default.formatPath(file.dir);
            file.dirNames = file.dir.split('/');
            file.firstName = file.name.indexOf('.') === -1 ? file.name : file.name.substring(0, file.name.indexOf('.'));

            content = content.replace(/\$FileName\$/g, file.base);
            content = content.replace(/\$FileNameWithoutExtension\$/g, file.name);
            content = content.replace(/\$FileNameWithoutAllExtension\$/g, file.firstName);
            content = content.replace(/\$FilePath\$/g, filePath);
            content = content.replace(/\$FileDir\$/g, file.dir);
            content = content.replace(/\$FileDirName\$/g, file.dirNames[file.dirNames.length - 1]);
            content = content.replace(/\$ProjectDir\$/g, projectDir);

            var fileDirPathFromParent = content.match(/\$FileDirPathFromParent\(([\s\S]*?)\)\$/);
            if (fileDirPathFromParent) {
                content = content.replace(/\$FileDirPathFromParent\(([\s\S]*?)\)\$/, fileDirPathFromParent[1].trim() === '' ? '' : function () {
                    var index = file.dirNames.lastIndexOf(fileDirPathFromParent[1]);
                    return index === -1 || index + 1 === file.dirNames.length ? '' : file.dirNames.splice(index + 1).join('/');
                });
            }
            return content;
        }
    }, {
        key: "errorMessage",
        value: function errorMessage(error, stdout, stderr, filePath, watch) {
            var message = filePath + '\n \n';
            message += "MESSAGE: \n";

            if (watch.name === 'Sass' && error.message.indexOf('"message":') > -1) {
                var errorJson = JSON.parse(error.message.match(/{\n(.*?(\n))+}/gm));
                message += errorJson.message + '\n \n';
                message += "LINE:  " + errorJson.line + '\n';
                message += "COLUMN: " + errorJson.column;
            } else if (watch.name === 'Less' && error.message.indexOf('ParseError:') > -1) {
                var msg = error.message.replace(/\[([\d]*?)m/g, '');
                message += msg.substring(msg.indexOf('ParseError:') + 12);
            } else if (watch.name === 'TypeScript' && stdout.match(/error TS([\s\S]*?):/gm)) {
                var errorCode = stdout.match(/error TS([\s\S]*?):/gm);
                var text = stdout.substring(stdout.indexOf(errorCode[0]) + errorCode[0].length);
                var number = stdout.match(/\(([\d]*?),([\d]*?)\)/gm)[0].replace('(', '').replace(')', '').split(',');
                message += text.indexOf(filePath) !== -1 ? text.substring(0, text.indexOf(filePath)) : text + '\n \n';
                message += "LINE:  " + number[0] + '\n';
                message += "COLUMN: " + number[1];
            } else if (watch.name === 'CoffeeScript' && error.message.indexOf('error:') > -1) {
                message += error.message.substring(error.message.indexOf('error:') + 7);
            } else if (watch.name === 'ES6') {
                message += stderr.replace('SyntaxError: ' + filePath + ': ', '');
            } else if (error.message) {
                message += error.message;
            } else {
                message += error;
            }

            return message;
        }
    }, {
        key: "exec",
        value: function exec(projectDir, filePath, watch) {
            var _this = this;

            if (!this.findProgramInstallation(watch.path)) {
                //没有找到处理程序。
                this.event.emit('warning', 'Warning', watch.path + ' No such file or directory');
            } else if (watch.command === '') {
                //没有处理程序命令
                this.event.emit('warning', 'Warning', 'Please enter the executable command');
            } else {
                var _exec = function _exec(files, errorMessage) {
                    if (files) {
                        (function () {
                            var successCount = 0;
                            files.forEach(function (file, index) {
                                var command = watch.path + ' ' + _this.replacePlaceholder(projectDir, file, watch.command);
                                (0, _child_process.exec)(command, {
                                    env: _this.cache[watch.path],
                                    encoding: 'utf8'
                                }, function (error, stdout, stderr) {
                                    if (error === null) {
                                        successCount++;
                                        if (successCount == files.length) {
                                            _this.event.emit('success', 'Successfully compiled', files.join('\n \n'));
                                        }
                                    } else {
                                        _this.event.emit('error', 'Compilation error', _this.errorMessage(error, stdout, stderr, file, watch));
                                    }
                                });
                            });
                        })();
                    } else {
                        _this.event.emit('error', 'Compilation error', errorMessage);
                    }
                };
                if (watch.parsesCssFiles && watch.name.match(/^(Sass|Less)$/) && _path2.default.parse(filePath).ext.match(/^(.sass|.scss|.less)$/)) {
                    _units2.default.getFilesByImprot(projectDir, filePath, function (files, errorMessage) {
                        if (files) {
                            _exec(files);
                        } else {
                            _this.event.emit('error', 'Compilation error', errorMessage);
                        }
                    });
                } else {
                    _exec([filePath]);
                }
            }
        }
    }]);

    return FileWatchersCompiler;
})();

exports.default = FileWatchersCompiler;
module.exports = exports['default'];