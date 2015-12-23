var config = require('./atom-file-watchers-config'),
  helper = require('./helper/helper');

var path = require('path');

module.exports = (function() {
  var installationDir = helper.getNpmInstallationDir(),
    options = {
      showSuccessCompilingNotification: {
        title: 'Show \' Success Compiling \' Notification',
        description: 'If enabled a \' Success Compiling \' notification is shown',
        type: 'boolean',
        "default": true,
        order: 10
      },
      parsesCssFiles: {
        title: 'Parses Sass files or Less files',
        description: 'If enabled parses Sass files or Less files. Compilation depend files. ',
        type: 'boolean',
        "default": true,
        order: 11
      }
    };

  for (var i = 0; i < config.length; i++) {
    //补全处理程序地址
    if (config[i].programPath.indexOf('$installationDir$') !== -1) {
      config[i].programPath = installationDir === null ? '' : config[i].programPath.replace(/\$installationDir\$/g, installationDir).replace(/\\/g, '/');
    }

    //是否开启当前文件类型监听
    options['compile@' + config[i].fileType + '@file'] = {
      title: 'Watch all ' + config[i].fileType + ' files',
      type: 'boolean',
      "default": false,
      order: i * 5 + 12
    };
    //当前文件类型后缀
    options['compile@' + config[i].fileType + '@extension'] = {
      title: config[i].fileType + ' file extensions',
      description: 'File types to be parsed. Multiple extensions separated by Spaces',
      type: 'string',
      "default": config[i].fileExtension,
      order: i * 5 + 13
    };
    //当前文件处理程序绝对地址
    options['compile@' + config[i].fileType + '@programPath'] = {
      title: 'Path to command program',
      description: 'bsolute path where executable is placed. Please read documentation before usage!',
      type: 'string',
      "default": config[i].programPath,
      order: i * 5 + 14
    };
    //当前文件执行命令行代码
    options['compile@' + config[i].fileType + '@command'] = {
      title: 'Command line code',
      description: 'which can execute scripts. Please read documentation before usage!',
      type: 'string',
      "default": config[i].command,
      order: i * 5 + 15
    };
    //当前文件类型排除目录或者文件路径
    options['compile@' + config[i].fileType + '@exclude'] = {
      title: 'Exclude directories or files',
      description: 'To exclude directories or files. Multiple extensions separated by Spaces. Project root the relative paths',
      type: 'string',
      "default": config[i].exclude,
      order: i * 5 + 16
    };
  }

  return options;
})();
