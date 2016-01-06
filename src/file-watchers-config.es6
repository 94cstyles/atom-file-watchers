'use strict';

import path from "path";
import fs from "fs";
import minimatch from "minimatch";
import units from "./helper/units";

//默认的npm全局安装目录
const installationDir = units.getNpmInstallationDir();

export default class FileWatchersConfig {
    constructor(event) {
        this.event = event;
        this.config = null;
        this.cache = null;
        this.diy = null;
        this.atom = {};
    }
    custom(filePath) {
        if (!fs.existsSync(filePath)) return this.diy = null;
        var contents = fs.readFileSync(filePath, 'utf-8');;
        try {
            contents = JSON.parse(contents);
            contents = typeof(contents.length) === 'undefined' ? [contents] : contents;
        } catch (e) {
            contents = [];
            this.event.emit('error', 'Config Error', 'Code format error, Please enter the correct format of configuration。', false);
        } finally {
            this.diy = {};
            this.config = null;
            for (let i = contents.length; i >= 0; i--) {
                if (typeof(contents[i]) !== 'object' || typeof(contents[i].name) === 'undefined') {
                    contents.splice(i, 1);
                } else {
                    contents[i].match = contents[i].match || '';
                    contents[i].path = contents[i].path || '';
                    contents[i].command = contents[i].command || '';

                    //装填配置
                    this.diy['compile@' + contents[i].name + '@enabled'] = true;
                    this.diy['compile@' + contents[i].name + '@match'] = contents[i].match;
                    this.diy['compile@' + contents[i].name + '@path'] = units.formatPath(contents[i].path.replace(/\$installationDir\$/g, installationDir));
                    this.diy['compile@' + contents[i].name + '@command'] = contents[i].command;
                }
            }
            //保存触发格式化配置文件
            if (contents.length > 0) {
                fs.writeFile(filePath, JSON.stringify(contents, null, 4));
            }
        }
    }
    get(key) {
        if (this.config === null) {
            this.config = units.extend({}, this.atom, this.diy);
            this.cache = {};
            let arr = null;
            for (let key in this.config) {
                arr = key.match(/compile@([\s\S]*)@([\s\S]*)/);
                if (arr !== null && this.config['compile@' + arr[1] + '@enabled']) {
                    this.cache[arr[1]] = this.cache[arr[1]] || {
                        name: arr[1],
                        parsesCssFiles: this.config.parsesCssFiles
                    };
                    this.cache[arr[1]][arr[2]] = this.config[key];
                }
            }
        };
        return typeof(key) == 'undefined' ? this.config : this.config[key];
    }
    set(key, value) {
        this.atom[key] = value;
        this.config = null;
    }
    match(filePath) {
        let config = this.get();
        let ret = [];
        for (let key in this.cache) {
            if (minimatch(filePath, this.cache[key].match)) {
                ret.push(this.cache[key]);
            }
        }
        return ret;
    }
}
