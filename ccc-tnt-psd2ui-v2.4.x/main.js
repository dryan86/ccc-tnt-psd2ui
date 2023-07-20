'use strict';
const Electron = require('electron');
let fs = require('fs');
const path = require("path")
const packageJSON = require('./package.json');
let child_process = require('child_process');
let exec = child_process.exec;
let spawn = child_process.spawn;



const ENGINE_VER = "v249"; // 参数超过了 10 个，这里暂时省略掉 版本号参数
const projectAssets = path.join(Editor.Project.path, "assets");
const cacheFile = path.join(Editor.Project.path, "local", "psd-to-prefab-cache.json");
const commandBat = path.join(Editor.Project.path, `packages\\${packageJSON.name}\\libs\\psd2ui\\command.bat`);
const configFile = path.join(Editor.Project.path, `packages\\${packageJSON.name}\\config\\psd.config.json`);
let uuid2md5 = new Map();
let cacheFileJson = {};


function _exec(options, tasks) {
    let jsonContent = JSON.stringify(options);

    console.log("批处理命令参数：" + jsonContent);
    let base64 = Buffer.from(jsonContent).toString("base64");

    console.log('start ' + commandBat + ' ' + `--json ${base64}`);
    tasks.push(new Promise((rs) => {
        exec('start ' + commandBat + ' ' + `--json ${base64}`, { windowsHide: false }, (err, stdout, stderr) => {
            rs();
        })
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
    
    if(rewrite){
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
            let output = param.output

            let options = {
                "project-assets": projectAssets,
                "cache": cacheFile,
                "engine-version": ENGINE_VER,
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

            await Promise.all(tasks);
            genUUID2MD5Mapping();
            Editor.log("[ccc-tnt-psd2ui]  psd 导出完成，输出位置为：", output ? output : "psd 同级目录");
            event.reply(null, true);
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
                console.log("[ccc-tnt-psd2ui]  执行缓存结束");
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