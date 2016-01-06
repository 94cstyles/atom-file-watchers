'use strict';

import fs from "fs";
import path from "path";
import glob from "glob";
import parseImport from "parse-import";
import {
    exec
}
from "child_process";

const detector = {
    cache: {},
    cacheModify: function(filePath) {
        let time = new Date();
        //缓存有效期120秒
        if (this.cache[filePath] && this.cache[filePath].time - time > 120000) {
            delete this.cache[filePath];
        }
        this.cache[filePath] = this.cache[filePath] || {
            exist: fs.existsSync(filePath),
            time: time
        }
        if (this.cache[filePath].exist) {
            if (typeof(this.cache[filePath].file) === 'undefined') {
                this.cache[filePath].file = fs.lstatSync(filePath).isFile();
            }
            return this.cache[filePath].file;
        } else {
            delete this.cache[filePath];
            return false;
        }
    },
    getFilePath: function(filePath, fileExt) {
        let newFilePath = filePath;
        //如果当前文件路径没有扩展名 就默认添加扩展名
        if (path.extname(newFilePath) === '') newFilePath = filePath + fileExt;
        if (this.cacheModify(newFilePath)) {
            return newFilePath;
        } else {
            return false;
        }
    },
    addFile: function(fileMap, filePath, parent) {
        if (this.cacheModify(filePath)) {
            fileMap[filePath] = fileMap[filePath] || {
                imports: [],
                importedBy: []
            };
            if (typeof(parent) == 'undefined') {
                let file = path.parse(filePath);
                let improts = parseImport(fs.readFileSync(filePath, 'utf-8'));
                for (let i = 0; i < improts.length; i++) {
                    let improtFilePath = this.getFilePath(path.resolve(file.dir, improts[i].path).replace(/\\/g, '/'), file.ext);
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
    traversal: function(files, callback) {
        if (files.length === 0 || (files.length === 1 && files[0].trim() === "")) {
            callback(null, null);
        } else {
            let fileMap = {};
            files.forEach((file) => {
                this.addFile(fileMap, file);
            });
            callback(fileMap, null);
        }
    },
    find: function(startDir, ext, callback) {
        if (/^win/.test(process.platform)) {
            glob(startDir + '/**/*' + ext + '', {
                cwd: startDir,
                nosort: true
            }, (err, files) => {
                if (err) {
                    callback(null, err);
                } else {
                    this.traversal(files, callback);
                }
            });
        } else {
            let command = 'find ' + startDir + ' -type f -name *' + ext;
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    callback(null, err);
                } else {
                    let files = stdout.replace(/\r/g, "").split("\n");
                    files.splice(-1, 1);
                    this.traversal(files, callback);
                }
            });
        }
    }
};

export default detector;
