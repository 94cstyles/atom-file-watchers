'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _events = require("events");

var _fileWatchersConfig = require("./file-watchers-config");

var _fileWatchersConfig2 = _interopRequireDefault(_fileWatchersConfig);

var _fileWatchersCompiler = require("./file-watchers-compiler");

var _fileWatchersCompiler2 = _interopRequireDefault(_fileWatchersCompiler);

var _fileWatchersOptions = require("./file-watchers-options");

var _fileWatchersOptions2 = _interopRequireDefault(_fileWatchersOptions);

var _units = require("./helper/units");

var _units2 = _interopRequireDefault(_units);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var packageName = 'atom-file-watchers';
var diyFileName = 'atom-file-watchers-config.json';

var fileWatchers = {
    config: _fileWatchersOptions2.default,
    event: null,
    projectDir: '',
    diyFilePath: '',
    fileWatchersConfig: null,
    fileWatchersCompiler: null,
    activate: function activate(state) {
        //设置自定义文件路径
        if (atom.project.getPaths().length > 0) {
            this.projectDir = _units2.default.formatPath(atom.project.getPaths()[0]);
            this.diyFilePath = _units2.default.formatPath(this.projectDir, diyFileName);
        }
        this.projectChangeObserver();

        this.event = new _events.EventEmitter();
        this.registerEventListener();

        this.fileWatchersCompiler = new _fileWatchersCompiler2.default(this.event);
        this.fileWatchersConfig = new _fileWatchersConfig2.default(this.event);
        this.fileWatchersConfig.custom(this.diyFilePath);
        this.registerConfigObserver();

        this.registerFileObserver();
    },
    deactivate: function deactivate() {
        return this;
    },
    serialize: function serialize() {
        return {};
    },
    projectChangeObserver: function projectChangeObserver() {
        var _this = this;

        //检测项目根目录变化
        atom.project.onDidChangePaths(function () {
            if (atom.project.getPaths().length > 0) {
                _this.projectDir = _units2.default.formatPath(atom.project.getPaths()[0]);
                _this.diyFilePath = _units2.default.formatPath(_this.projectDir, diyFileName);
            }
        });
    },
    registerEventListener: function registerEventListener() {
        this.event.on('error', function (title, message) {
            var dismissable = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

            atom.notifications.addError(title, {
                detail: message,
                dismissable: dismissable
            });
        });
        this.event.on('warning', function (title, message) {
            var dismissable = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

            atom.notifications.addWarning(title, {
                detail: message,
                dismissable: dismissable
            });
        });
        this.event.on('success', function (title, message) {
            var dismissable = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

            if (atom.config.get(packageName + '.' + 'showSuccessCompilingNotification')) {
                atom.notifications.addSuccess(title, {
                    detail: message,
                    dismissable: dismissable
                });
            }
        });
    },
    registerConfigObserver: function registerConfigObserver() {
        var _this2 = this;

        var _observe = function _observe(key) {
            atom.config.observe(packageName + '.' + key, function (val) {
                _this2.fileWatchersConfig.set(key, val);
            });
        };
        for (var key in _fileWatchersOptions2.default) {
            _observe(key);
        }
    },
    registerFileObserver: function registerFileObserver() {
        var _this3 = this;

        atom.workspace.observeTextEditors(function (editor) {
            if (!editor || editor.getURI() === undefined) return;
            var filePath = _units2.default.formatPath(editor.getURI());
            editor.onDidSave(function () {
                setTimeout(function () {
                    if (filePath === _this3.diyFilePath) {
                        //监听配置文件的变化
                        _this3.fileWatchersConfig.custom(_this3.diyFilePath);
                    } else {
                        var watchs = _this3.fileWatchersConfig.match(_path2.default.relative(_this3.projectDir, filePath));
                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;

                        try {
                            for (var _iterator = watchs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                var watch = _step.value;

                                _this3.fileWatchersCompiler.exec(_this3.projectDir, filePath, watch);
                            }
                        } catch (err) {
                            _didIteratorError = true;
                            _iteratorError = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion && _iterator.return) {
                                    _iterator.return();
                                }
                            } finally {
                                if (_didIteratorError) {
                                    throw _iteratorError;
                                }
                            }
                        }
                    }
                }, 0);
            });
        });
    }
};
exports.default = fileWatchers;
module.exports = exports['default'];