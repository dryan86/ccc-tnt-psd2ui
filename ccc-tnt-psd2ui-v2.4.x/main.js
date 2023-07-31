'use strict';
const Electron = require('electron');
const packageJSON = require('./package.json');
let fs = require('fs');
const path = require("path")
const Os = require('os');
let child_process = require('child_process');
let exec = child_process.exec;
let spawn = child_process.spawn;



const ENGINE_VER = "v249";
const packagePath = path.join(Editor.Project.path, "packages", packageJSON.name);
const projectAssets = path.join(Editor.Project.path, "assets");
const cacheFile = path.join(Editor.Project.path, "local", "psd-to-prefab-cache.json");
const configFile = path.join(`${packagePath}/config/psd.config.json`);


const nodejsFile = path.join(packagePath, "bin", `node${Os.platform() == 'darwin' ? "" : ".exe"}`);
const commandFile = path.join(packagePath, "libs", "psd2ui", `command.${Os.platform() == 'darwin' ? "sh" : "bat"}`);
const psd = path.join(packagePath, "libs", "psd2ui", "index.js");

let uuid2md5 = new Map();
let cacheFileJson = {};


function _exec(options, tasks) {

    let jsonContent = JSON.stringify(options);
    if (!fs.existsSync(nodejsFile)) {
        Editor.log(`[ccc-tnt-psd2ui] 没有内置 nodejs`, nodejsFile);

        return tasks;
    }
    // 处理权限问题
    if (Os.platform() === 'darwin') {
        if (fs.statSync(nodejsFile).mode != 33261) {
            Editor.log(`[ccc-tnt-psd2ui] nodejsFile 设置权限`);
            fs.chmodSync(nodejsFile, 33261);
        }
        if (fs.statSync(commandFile).mode != 33261) {
            Editor.log(`[ccc-tnt-psd2ui] commandFile 设置权限`);
            fs.chmodSync(commandFile, 33261);
        }
    }

    Editor.log("[ccc-tnt-psd2ui] 命令参数：" + jsonContent);
    Editor.log("[ccc-tnt-psd2ui] 命令执行中");

    let base64 = Buffer.from(jsonContent).toString("base64");
    tasks.push(new Promise((rs) => {
        // Editor.log(`[ccc-tnt-psd2ui] `, `${nodejsFile} ${psd}` + ' ' + `--json ${base64}`);
        // exec(`${nodejsFile} ${psd}` + ' ' + `--json ${base64}`, { windowsHide: false }, (err, stdout, stderr) => {
        //     Editor.log("[ccc-tnt-psd2ui]:\n", stdout);
        //     if (stderr) {
        //         Editor.log(stderr);
        //     }
        //     rs();
        // })
        
        let shellScript = commandFile;  // 你的脚本路径
        let scriptArgs = `--json ${base64}`;  // 你的脚本参数

        let command =
        Os.platform() == 'darwin' ? `osascript -e 'tell app "Terminal" to do script "cd ${process.cwd()}; ${shellScript} ${scriptArgs}"'`
        : `start ${commandFile} ${scriptArgs}`;

        exec(command, (error, stdout, stderr) => {
            Editor.log("[ccc-tnt-psd2ui]:\n", stdout);
            Editor.log("[ccc-tnt-psd2ui]: 程序执行完后请手动关闭终端窗口", );
            if (stderr) {
                Editor.log(stderr);
            }
            rs();
        });
    }));
    return tasks;
}

/**
 * 资源删除的监听
 *
 * @param {*} event
 */
function onAssetDeletedListener(event, args) {
    if (!args) {
        return;
    }

    let array = args.filter((element) => {
        return element.type == "texture";
    });
    if (!array.length) {
        return;
    }

    let rewrite = false;
    for (let i = 0; i < array.length; i++) {
        const element = array[i];
        let uuid = element.uuid;
        if (uuid2md5.has(uuid)) {
            rewrite = true;
            let md5 = uuid2md5.get(uuid);
            Editor.log(`[ccc-tnt-psd2ui] 删除资源 md5: ${md5}, uuid: ${uuid}`);
            delete cacheFileJson[`${md5}`];
        }
    }

    if (rewrite) {
        fs.writeFileSync(cacheFile, JSON.stringify(cacheFileJson, null, 2));
    }
}

/**
 * 生成 uuid 转 MD5 的映射
 *
 */
function genUUID2MD5Mapping() {
    if (!fs.existsSync(cacheFile)) {
        return;
    }
    let content = fs.readFileSync(cacheFile, 'utf-8');
    let obj = JSON.parse(content);
    cacheFileJson = obj;
    for (const key in obj) {
        const element = obj[key];
        uuid2md5.set(element.uuid, key);
    }
}

module.exports = {
    load() {
        genUUID2MD5Mapping();
        // Electron.ipcMain.on('asset-db:assets-deleted', onAssetDeletedListener);
    },

    unload() {
        // Electron.ipcMain.removeListener('asset-db:assets-deleted', onAssetDeletedListener);
    },

    messages: {
        'on-drop-file': async (event, param) => {

            let files = param.files;
            let isForceImg = param.isForceImg;
            let isImgOnly = param.isImgOnly;
            let output = param.output;
            let isPinyin = param.isPinyin;

            let options = {
                "project-assets": projectAssets,
                "cache": cacheFile,
                "engine-version": ENGINE_VER,
                "pinyin": isPinyin,
            }

            let tasks = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                let stat = fs.statSync(file);
                if (stat.isFile()) {
                    let ext = path.extname(file);
                    if (ext != '.psd') {
                        continue;
                    }
                }
                let args = JSON.parse(JSON.stringify(options));
                args["input"] = file;
                if (output) {
                    args["output"] = output;
                }
                if (isImgOnly) {

                    // 只导出图片
                    args["img-only"] = true;
                } else {

                    // 强制导出图片
                    if (isForceImg) {
                        args["force-img"] = true;
                    }
                    args["config"] = configFile;
                }

                _exec(args, tasks)
            }

            Promise.all(tasks).then(() => {
                genUUID2MD5Mapping();
                Editor.log("[ccc-tnt-psd2ui]  psd 导出完成，输出位置为：", output ? output : "psd 同级目录");
            }).catch((reason) => {
                Editor.log("[ccc-tnt-psd2ui]  导出失败", reason);
            }).finally(() => {
                event.reply(null, true);
            });
        },

        'open'() {
            Editor.Panel.open('ccc-tnt-psd2ui');
        },

        'onClickCache': (event) => {
            let options = {
                "project-assets": projectAssets,
                "cache": cacheFile,
                "init": true,
            }
            Promise.all(_exec(options, [])).then(() => {
                Editor.log("[ccc-tnt-psd2ui]  执行缓存结束");
            }).catch(() => {
                Editor.log("[ccc-tnt-psd2ui]  执行缓存失败");
            }).finally(() => {
                event.reply(null, true);
            });
        },
        'save-config': async (event, config) => {
            Editor.log('[ccc-tnt-psd2ui]', '调起命令行');
            event.reply(null, true);
        },

        "read-cache"(event, config) {

        },
        "asset-db:assets-deleted": onAssetDeletedListener
    },
};