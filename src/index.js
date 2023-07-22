const fs = require('fs');
const path = require('path');
const JSZIP = require('jszip');
const OS = require('os');
const child_process = require('child_process');

const root = path.join(__dirname, "../");
let tmpFolder = "";
// 排除部分文件或文件夹
const exclude = name => !['@types', 'node_modules'].includes(name)

// zip 递归读取文件夹下的文件流
function readDir(zip, nowPath) {
    // 读取目录中的所有文件及文件夹（同步操作）
    let files = fs.readdirSync(nowPath)

    //遍历检测目录中的文件
    files.filter(exclude).forEach((fileName, index) => {
        // 打印当前读取的文件名
        console.log(fileName, index)

        // 当前文件的全路径
        let fillPath = path.join(nowPath, fileName)

        // 获取一个文件的属性
        let file = fs.statSync(fillPath)

        // 如果是目录的话，继续查询
        if (file.isDirectory()) {
            // 压缩对象中生成该目录
            let dirlist = zip.folder(fileName)
            // （递归）重新检索目录文件
            readDir(dirlist, fillPath)
        } else {
            // 压缩目录添加文件
            zip.file(fileName, fs.readFileSync(fillPath))
        }
    })
}

// 开始压缩文件
function zipFolder({ target = __dirname, output = __dirname + '/result.zip' }) {
    // 创建 zip 实例
    const zip = new JSZIP()

    // zip 递归读取文件夹下的文件流
    readDir(zip, target)

    // 设置压缩格式，开始打包
    zip.generateAsync({
        // nodejs 专用
        type: 'nodebuffer',
        // 压缩算法
        compression: 'DEFLATE',
        // 压缩级别
        compressionOptions: { level: 9, },
    }).then(content => {
        // 将打包的内容写入 当前目录下的 result.zip中
        fs.writeFileSync(output, content, 'utf-8')
    })
}

// zipFolder({ 
//     // 目标文件夹
//     target: path.join(__dirname, 'test'), 
//     // 输出 zip 
//     output: __dirname + '/result.zip' 
// })


console.log(`index-> `, path.join(__dirname, "../", 'ccc-tnt-psd2ui-v3.4.+'));


function taskStart(name, callback) {
    tmpFolder = path.join(root, `${name}_tmp`);
    callback(name);
}

function copyPlguin(name, callback) {

    fs.copyFile(path.join(root, name), tmpFolder, () => {
        callback(name);
    });
}

function cd2TmpFolder(name, callback) {

    child_process.exec(`cd ${tmpFolder}`, (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (err) {
            console.log(`child_process err-> `, err);
        } else {
            callback(name);
        }
    });
}

function unstallPackage(name, callback, packageNames) {
    for (let i = 0; i < packageNames.length; i++) {
        const element = packageNames[i];
        child_process.exec(`npm uninstall ${element}`, (err, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (err) {
                console.log(`child_process err-> `, err);
            } else {
                if (i == packageNames.length - 1) {
                    callback(name);
                }
            }
        });
    }
}

taskStart("ccc-tnt-psd2ui-v3.4.+", (name) => {
    copyPlguin(name, (name) => {
        cd2TmpFolder(name, (name) => {
            // unstallPackage(name, (name) => {

            // }, [
            //     "@types/fs-extra",
            //     "@types/node",
            //     "typescript"
            // ]);
        });
    });
});

console.log(`index-> `, root);
