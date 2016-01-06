'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _glob = require("glob");

var _glob2 = _interopRequireDefault(_glob);

var _parseImport = require("parse-import");

var _parseImport2 = _interopRequireDefault(_parseImport);

var _child_process = require("child_process");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var detector = {
    cache: {},
    cacheModify: function cacheModify(filePath) {
        var time = new Date();
        //缓存有效期120秒
        if (this.cache[filePath] && this.cache[filePath].time - time > 120000) {
            delete this.cache[filePath];
        }
        this.cache[filePath] = this.cache[filePath] || {
            exist: _fs2.default.existsSync(filePath),
            time: time
        };
        if (this.cache[filePath].exist) {
            if (typeof this.cache[filePath].file === 'undefined') {
                this.cache[filePath].file = _fs2.default.lstatSync(filePath).isFile();
            }
            return this.cache[filePath].file;
        } else {
            delete this.cache[filePath];
            return false;
        }
    },
    getFilePath: function getFilePath(filePath, fileExt) {
        var newFilePath = filePath;
        //如果当前文件路径没有扩展名 就默认添加扩展名
        if (_path2.default.extname(newFilePath) === '') newFilePath = filePath + fileExt;
        if (this.cacheModify(newFilePath)) {
            return newFilePath;
        } else {
            return false;
        }
    },
    addFile: function addFile(fileMap, filePath, parent) {
        if (this.cacheModify(filePath)) {
            fileMap[filePath] = fileMap[filePath] || {
                imports: [],
                importedBy: []
            };
            if (typeof parent == 'undefined') {
                var file = _path2.default.parse(filePath);
                var improts = (0, _parseImport2.default)(_fs2.default.readFileSync(filePath, 'utf-8'));
                for (var i = 0; i < improts.length; i++) {
                    var improtFilePath = this.getFilePath(_path2.default.resolve(file.dir, improts[i].path).replace(/\\/g, '/'), file.ext);
                    if (improtFilePath) {
                        fileMap[filePath].imports.push(improtFilePath);
                        this.addFile(fileMap, improtFilePath, filePath);
                    }
                }
            } else {
                fileMap[filePath].importedBy.push(parent);
            }
        }
    },
    traversal: function traversal(files, callback) {
        var _this = this;

        if (files.length === 0 || files.length === 1 && files[0].trim() === "") {
            callback(null, null);
        } else {
            (function () {
                var fileMap = {};
                files.forEach(function (file) {
                    _this.addFile(fileMap, file);
                });
                callback(fileMap, null);
            })();
        }
    },
    find: function find(startDir, ext, callback) {
        var _this2 = this;

        if (/^win/.test(process.platform)) {
            (0, _glob2.default)(startDir + '/**/*' + ext + '', {
                cwd: startDir,
                nosort: true
            }, function (err, files) {
                if (err) {
                    callback(null, err);
                } else {
                    _this2.traversal(files, callback);
                }
            });
        } else {
            var command = 'find ' + startDir + ' -type f -name *' + ext;
            (0, _child_process.exec)(command, function (err, stdout, stderr) {
                if (err) {
                    callback(null, err);
                } else {
                    var files = stdout.replace(/\r/g, "").split("\n");
                    files.splice(-1, 1);
                    _this2.traversal(files, callback);
                }
            });
        }
    }
};

exports.default = detector;
module.exports = exports['default'];