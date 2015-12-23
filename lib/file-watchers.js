var FileWatchersView = require('./file-watchers-view'),
  FileWatchersCompiler = require('./file-watchers-compiler'),
  FileWatchersConfig = require('./file-watchers-config'),
  fileWatchersOptions = require('./file-watchers-options');

var helper = require('./helper/helper');

var path = require('path');

var packageName = 'atom-file-watchers';

module.exports = {
  config: fileWatchersOptions,
  fileWatchersView: null,
  fileWatchersCompiler: null,
  fileWatchersConfig: null,
  activate: function(state) {
    this.fileWatchersView = new FileWatchersView(state.fileWatchersViewState);
    this.fileWatchersCompiler = new FileWatchersCompiler();
    this.fileWatchersConfig = new FileWatchersConfig();
    this.registerEventListener();
    this.registerConfigObserver();
    this.registerFileObserver();
    return this;
  },
  deactivate: function() {
    return this.fileWatchersView.destroy();
  },
  serialize: function() {
    return {
      fileWatchersViewState: this.fileWatchersView.serialize()
    };
  },
  registerEventListener: function() {
    this.fileWatchersCompiler.on('success', function(title, message) {
      if (atom.config.get(packageName + '.' + 'showSuccessCompilingNotification')) {
        atom.notifications.addSuccess(title, {
          detail: message,
          dismissable: false
        });
      }
    }).on('warning', function(title, message) {
      atom.notifications.addWarning(title, {
        detail: message,
        dismissable: false
      });
    }).on('error', function(title, message) {
      atom.notifications.addError(title, {
        detail: message,
        dismissable: true
      });
    });
  },
  registerConfigObserver: function() {
    var _this = this;

    //监听配置选项的变化
    var _observe = function(key) {
      atom.config.observe(packageName + '.' + key, function(val) {
        _this.fileWatchersConfig.set(key, val);
        _this.fileWatchersCompiler.setOptions(_this.fileWatchersConfig.get(), key, val);
      });
    };

    for (var key in fileWatchersOptions) {
      _observe(key);
    }
  },
  registerFileObserver: function() {
    var _this = this;
    atom.workspace.observeTextEditors(function(editor) {
      var filePath = editor.getURI().replace(/\\/g, '/'),
        fileType = helper.hasFileExtension(filePath, _this.fileWatchersConfig.getExtensions());
      //判断当前文件是否被监听
      //当前文件类型没有开启监听 那么再打开监听 这文件的监听实际是没有开启的 需要关闭了文件再打开才行，同样的切换监听也出现不及时问题
      if (fileType !== null) {
        var isModified = true,
          firstSave = true;
        editor.onDidStopChanging(function() {
          isModified = editor.isModified();
        });
        editor.onDidSave(function() {
          //防止非修改触发保存
          if (isModified || firstSave) {
            _this.fileWatchersCompiler.process(filePath, fileType);
            isModified = false;
            firstSave = false;
          }
        });
      }
    });
  }
};
