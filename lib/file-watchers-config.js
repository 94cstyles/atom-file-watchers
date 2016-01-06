'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _minimatch = require("minimatch");

var _minimatch2 = _interopRequireDefault(_minimatch);

var _units = require("./helper/units");

var _units2 = _interopRequireDefault(_units);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//默认的npm全局安装目录
var installationDir = _units2.default.getNpmInstallationDir();

var FileWatchersConfig = (function () {
    function FileWatchersConfig(event) {
        _classCallCheck(this, FileWatchersConfig);

        this.event = event;
        this.config = null;
        this.cache = null;
        this.diy = null;
        this.atom = {};
    }

    _createClass(FileWatchersConfig, [{
        key: "custom",
        value: function custom(filePath) {
            if (!_fs2.default.existsSync(filePath)) return this.diy = null;
            var contents = _fs2.default.readFileSync(filePath, 'utf-8');;
            try {
                contents = JSON.parse(contents);
                contents = typeof contents.length === 'undefined' ? [contents] : contents;
            } catch (e) {
                contents = [];
                this.event.emit('error', 'Config Error', 'Code format error, Please enter the correct format of configuration。', false);
            } finally {
                this.diy = {};
                this.config = null;
                for (var i = contents.length; i >= 0; i--) {
                    if (_typeof(contents[i]) !== 'object' || typeof contents[i].name === 'undefined') {
                        contents.splice(i, 1);
                    } else {
                        contents[i].match = contents[i].match || '';
                        contents[i].path = contents[i].path || '';
                        contents[i].command = contents[i].command || '';

                        //装填配置
                        this.diy['compile@' + contents[i].name + '@enabled'] = true;
                        this.diy['compile@' + contents[i].name + '@match'] = contents[i].match;
                        this.diy['compile@' + contents[i].name + '@path'] = _units2.default.formatPath(contents[i].path.replace(/\$installationDir\$/g, installationDir));
                        this.diy['compile@' + contents[i].name + '@command'] = contents[i].command;
                    }
                }
                //保存触发格式化配置文件
                if (contents.length > 0) {
                    _fs2.default.writeFile(filePath, JSON.stringify(contents, null, 4));
                }
            }
        }
    }, {
        key: "get",
        value: function get(key) {
            if (this.config === null) {
                this.config = _units2.default.extend({}, this.atom, this.diy);
                this.cache = {};
                var arr = null;
                for (var _key in this.config) {
                    arr = _key.match(/compile@([\s\S]*)@([\s\S]*)/);
                    if (arr !== null && this.config['compile@' + arr[1] + '@enabled']) {
                        this.cache[arr[1]] = this.cache[arr[1]] || {
                            name: arr[1],
                            parsesCssFiles: this.config.parsesCssFiles
                        };
                        this.cache[arr[1]][arr[2]] = this.config[_key];
                    }
                }
            };
            return typeof key == 'undefined' ? this.config : this.config[key];
        }
    }, {
        key: "set",
        value: function set(key, value) {
            this.atom[key] = value;
            this.config = null;
        }
    }, {
        key: "match",
        value: function match(filePath) {
            var config = this.get();
            var ret = [];
            for (var key in this.cache) {
                if ((0, _minimatch2.default)(filePath, this.cache[key].match)) {
                    ret.push(this.cache[key]);
                }
            }
            return ret;
        }
    }]);

    return FileWatchersConfig;
})();

exports.default = FileWatchersConfig;
module.exports = exports['default'];