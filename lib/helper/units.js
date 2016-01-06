'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fileDetector = require("./file-detector");

var _fileDetector2 = _interopRequireDefault(_fileDetector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Units = (function () {
    function Units() {
        _classCallCheck(this, Units);
    }

    _createClass(Units, null, [{
        key: "extend",

        /**
         * 合并json数据
         * @return {[Object]} [JSON]
         */
        value: function extend() {
            for (var i = 1; i < arguments.length; i++) {
                if (!arguments[i]) continue;
                for (var key in arguments[i]) {
                    if (arguments[i].hasOwnProperty(key)) {
                        arguments[0][key] = arguments[i][key];
                    }
                }
            }
            return arguments[0];
        }
        /**
         * 查找sass和less文件的关系链 不支持多种混合, .sass和.scss混合也不行
         * @param  {[type]} projectDir [项目目录]
         * @param  {[type]} filePath   [当前文件地址]
         * @param  {[type]} callback   [回调函数(受影响文件列表,错误信息)]
         */

    }, {
        key: "getFilesByImprot",
        value: function getFilesByImprot(projectDir, filePath, callback) {
            _fileDetector2.default.find(projectDir, _path2.default.parse(filePath).ext, function (fileMap, errorMessage) {
                if (fileMap === null || !fileMap[filePath]) {
                    callback(null, errorMessage || filePath + " Could not find the file"); //错误处理
                } else if (fileMap[filePath].importedBy.length === 0) {
                        callback([filePath], null); //单独文件 没有被引用
                    } else {
                            //遍历关系链 找到受连锁反应的文件
                            var filePaths = [];
                            var multipleNested = function multipleNested(key, importedBy) {
                                for (var i = 0; i < importedBy.length; i++) {
                                    if (fileMap[importedBy[i]].importedBy.length === 0 && filePaths.indexOf(importedBy[i]) === -1) {
                                        filePaths.push(importedBy[i]);
                                    } else {
                                        multipleNested(importedBy[i], fileMap[importedBy[i]].importedBy);
                                    }
                                }
                            };
                            multipleNested(filePath, fileMap[filePath].importedBy);
                            callback(filePaths, null);
                        }
            });
        }
        /**
         * /根据当前系统获取默认npm安装目录
         * @return {String}
         */

    }, {
        key: "getNpmInstallationDir",
        value: function getNpmInstallationDir() {
            var installationDir = '';
            if (process.platform === 'win32') {
                installationDir = _path2.default.join(process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'], 'AppData\\Roaming\\npm');
            } else if (process.platform === 'linux' || process.platform === 'darwin') {
                installationDir = '/usr/local/bin';
            }
            return installationDir;
        }
        /**
         * 格式化并合并路径 解决path.sep不同的问题
         * @param  {[String]} ...urls [原路径]
         * @return {[String]}         [新路径]
         */

    }, {
        key: "formatPath",
        value: function formatPath() {
            var arr = [];

            for (var _len = arguments.length, urls = Array(_len), _key = 0; _key < _len; _key++) {
                urls[_key] = arguments[_key];
            }

            urls.forEach(function (url) {
                arr.push(url.replace(/\\/g, '/'));
            });
            return _path2.default.resolve.apply(_path2.default.resolve, arr).replace(/\\/g, '/');
        }
    }]);

    return Units;
})();

exports.default = Units;
module.exports = exports['default'];