'use strict';

import fs from "fs";
import path from "path";
import {
    exec,
    execSync
}
from "child_process";
import units from "./helper/units";

export default class FileWatchersCompiler {
    constructor(event) {
        this.event = event;
        this.cache = {};
    }
    findProgramInstallation(programPath) {
        if (typeof(this.cache[programPath]) === 'undefined') {
            if (fs.existsSync(programPath)) {
                var command = programPath + " --version >" + (process.platform === 'win32' ? 'nul' : '/dev/null') + " 2>&1 && (echo found) || (echo fail)";
                var environment = Object.create(process.env);
                environment.PATH += ":" + path.parse(programPath).dir;
                if (execSync(command, {
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
    replacePlaceholder(projectDir, filePath, content) {
        let file = path.parse(filePath);
        file.dir = units.formatPath(file.dir);
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
            content = content.replace(/\$FileDirPathFromParent\(([\s\S]*?)\)\$/, fileDirPathFromParent[1].trim() === '' ? '' : () => {
                let index = file.dirNames.lastIndexOf(fileDirPathFromParent[1]);
                return index === -1 || index + 1 === file.dirNames.length ? '' : file.dirNames.splice(index + 1).join('/');
            });
        }
        return content;
    }
    errorMessage(error, stdout, stderr, filePath, watch) {
        var message = filePath + '\n \n';
        message += "MESSAGE: \n";

        if (watch.name === 'Sass' && error.message.indexOf('"message":') > -1) {
            let errorJson = JSON.parse(error.message.match(/{\n(.*?(\n))+}/gm));
            message += errorJson.message + '\n \n';
            message += "LINE:  " + errorJson.line + '\n';
            message += "COLUMN: " + errorJson.column;
        } else if (watch.name === 'Less' && error.message.indexOf('ParseError:') > -1) {
            let msg = error.message.replace(/\[([\d]*?)m/g, '');
            message += msg.substring(msg.indexOf('ParseError:') + 12);
        } else if (watch.name === 'TypeScript' && stdout.match(/error TS([\s\S]*?):/gm)) {
            let errorCode = stdout.match(/error TS([\s\S]*?):/gm);
            let text = stdout.substring(stdout.indexOf(errorCode[0]) + errorCode[0].length);
            let number = stdout.match(/\(([\d]*?),([\d]*?)\)/gm)[0].replace('(', '').replace(')', '').split(',');
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
    exec(projectDir, filePath, watch) {
        if (!this.findProgramInstallation(watch.path)) {
            //没有找到处理程序。
            this.event.emit('warning', 'Warning', watch.path + ' No such file or directory');
        } else if (watch.command === '') {
            //没有处理程序命令
            this.event.emit('warning', 'Warning', 'Please enter the executable command');
        } else {
            var _exec = (files, errorMessage) => {
                if (files) {
                    let successCount = 0;
                    files.forEach((file, index) => {
                        let command = watch.path + ' ' + this.replacePlaceholder(projectDir, file, watch.command);
                        exec(command, {
                            env: this.cache[watch.path],
                            encoding: 'utf8'
                        }, (error, stdout, stderr) => {
                            if (error === null) {
                                successCount++;
                                if (successCount == files.length) {
                                    this.event.emit('success', 'Successfully compiled', files.join('\n \n'));
                                }
                            } else {
                                this.event.emit('error', 'Compilation error', this.errorMessage(error, stdout, stderr, file, watch));
                            }
                        });
                    });
                } else {
                    this.event.emit('error', 'Compilation error', errorMessage);
                }
            };
            if (watch.parsesCssFiles && watch.name.match(/^(Sass|Less)$/) && path.parse(filePath).ext.match(/^(.sass|.scss|.less)$/)) {
                units.getFilesByImprot(projectDir, filePath, (files, errorMessage) => {
                    if (files) {
                        _exec(files);
                    } else {
                        this.event.emit('error', 'Compilation error', errorMessage);
                    }
                });
            } else {
                _exec([filePath]);
            }
        }
    }
}
