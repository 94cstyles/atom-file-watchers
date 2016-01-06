'use strict';

import fs from "fs";
import path from "path";
import detector from "./file-detector";

export default class Units {
    /**
     * 合并json数据
     * @return {[Object]} [JSON]
     */
    static extend() {
        for (let i = 1; i < arguments.length; i++) {
            if (!arguments[i]) continue;
            for (let key in arguments[i]) {
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
    static getFilesByImprot(projectDir, filePath, callback) {
        detector.find(projectDir, path.parse(filePath).ext, function(fileMap, errorMessage) {
            if (fileMap === null || !fileMap[filePath]) {
                callback(null, errorMessage || filePath + " Could not find the file"); //错误处理
            } else if (fileMap[filePath].importedBy.length === 0) {
                callback([filePath], null); //单独文件 没有被引用
            } else {
                //遍历关系链 找到受连锁反应的文件
                var filePaths = [];
                var multipleNested = function(key, importedBy) {
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
    static getNpmInstallationDir() {
        var installationDir = '';
        if (process.platform === 'win32') {
            installationDir = path.join(process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'], 'AppData\\Roaming\\npm');
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
    static formatPath(...urls) {
        let arr = [];
        urls.forEach((url) => {
            arr.push(url.replace(/\\/g, '/'))
        });
        return path.resolve.apply(path.resolve, arr).replace(/\\/g, '/');
    }
}
