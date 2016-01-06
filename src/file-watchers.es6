'use strict';

import path from "path";
import fs from "fs";
import {
    EventEmitter
}
from 'events';
import FileWatchersConfig from "./file-watchers-config";
import FileWatchersCompiler from "./file-watchers-compiler";
import options from "./file-watchers-options";
import units from "./helper/units";

const packageName = 'atom-file-watchers';
const diyFileName = 'atom-file-watchers-config.json';

const fileWatchers = {
    config: options,
    event: null,
    projectDir: '',
    diyFilePath: '',
    fileWatchersConfig: null,
    fileWatchersCompiler: null,
    activate: function(state) {
        //设置自定义文件路径
        if (atom.project.getPaths().length > 0) {
            this.projectDir = units.formatPath(atom.project.getPaths()[0]);
            this.diyFilePath = units.formatPath(this.projectDir, diyFileName);
        }
        this.projectChangeObserver();

        this.event = new EventEmitter();
        this.registerEventListener();

        this.fileWatchersCompiler = new FileWatchersCompiler(this.event);
        this.fileWatchersConfig = new FileWatchersConfig(this.event);
        this.fileWatchersConfig.custom(this.diyFilePath);
        this.registerConfigObserver();

        this.registerFileObserver();
    },
    deactivate: function() {
        return this;
    },
    serialize: function() {
        return {};
    },
    projectChangeObserver: function() {
        //检测项目根目录变化
        atom.project.onDidChangePaths(() => {
            if (atom.project.getPaths().length > 0) {
                this.projectDir = units.formatPath(atom.project.getPaths()[0]);
                this.diyFilePath = units.formatPath(this.projectDir, diyFileName);
            }
        });
    },
    registerEventListener: function() {
        this.event.on('error', (title, message, dismissable = true) => {
            atom.notifications.addError(title, {
                detail: message,
                dismissable: dismissable
            });
        });
        this.event.on('warning', (title, message, dismissable = false) => {
            atom.notifications.addWarning(title, {
                detail: message,
                dismissable: dismissable
            });
        });
        this.event.on('success', (title, message, dismissable = false) => {
            if (atom.config.get(packageName + '.' + 'showSuccessCompilingNotification')) {
                atom.notifications.addSuccess(title, {
                    detail: message,
                    dismissable: dismissable
                });
            }
        });
    },
    registerConfigObserver: function() {
        var _observe = (key) => {
            atom.config.observe(packageName + '.' + key, (val) => {
                this.fileWatchersConfig.set(key, val);
            });
        }
        for (let key in options) {
            _observe(key);
        }
    },
    registerFileObserver: function() {
        atom.workspace.observeTextEditors((editor) => {
            if (!editor || editor.getURI() === undefined) return;
            let filePath = units.formatPath(editor.getURI());
            editor.onDidSave(() => {
                setTimeout(() => {
                    if (filePath === this.diyFilePath) {
                        //监听配置文件的变化
                        this.fileWatchersConfig.custom(this.diyFilePath);
                    } else {
                        let watchs = this.fileWatchersConfig.match(path.relative(this.projectDir, filePath));
                        for (let watch of watchs) {
                            this.fileWatchersCompiler.exec(this.projectDir, filePath, watch);
                        }
                    }
                }, 0);
            });
        });
    }
};
export default fileWatchers;
