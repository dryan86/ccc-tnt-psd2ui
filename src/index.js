const fs = require('fs-extra');
const path = require('path');
const JSZIP = require('jszip');
const OS = require('os');
const child_process = require('child_process');

const root = path.join(__dirname, "../");
const projectName = "ccc-tnt-psd2ui";
let tmpFolder = "";
let platform = OS.platform() == 'darwin' ? "mac" : "win32";
let version = "v3.4.+";
// let tag = "x";

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
function zipFolder(target, output) {
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
        console.log(`index-> `);

    }).catch((err) => {
        console.log(`index-> `, err);

    });
}

async function taskStart(name) {
    tmpFolder = path.join(root, "release", `${name}-${platform}`);
    await copyPlugin(name);
    await deleteFile("node_modules");
    await copyNodeModules();
    await deleteFile("@types");
    await deleteFile("src");
    await deleteFile("package-lock.json");
    await reWritePackage();
    await copyNodeJS();
    await copyMacSH();
    console.log(`创建完成 ${tmpFolder}`);

    // fs.mkdirsSync(path.join(root, "release"));
    // zipFolder(tmpFolder, path.join(root, "release", `${name}-${tag}.zip`));
}

function copyPlugin(name) {
    return new Promise((resolve, reject) => {

        let _path = path.join(root, name);
        console.log(`拷贝插件文件夹[${_path}]到[${tmpFolder}]`);
        fs.emptyDirSync(tmpFolder);
        fs.copy(_path, tmpFolder, (err) => {
            err ? reject(err) : resolve();
        });
    })
}

function deleteFile(folderName) {
    return new Promise((resolve, reject) => {
        let node_modules = path.join(tmpFolder, folderName);
        if (!fs.existsSync(node_modules)) {
            resolve();
            return;
        }
        fs.remove(node_modules, (err) => {
            err ? reject(err) : resolve();
        });
    })
}

function copyNodeModules() {
    return new Promise((resolve, reject) => {
        let node_modules = path.join(tmpFolder, "node_modules");
        fs.copy(path.join(root, "npm-packages", `${platform}-${version}`), node_modules, (err) => {
            err ? reject(err) : resolve();
        });
    })
}
function copyNodeJS() {
    return new Promise((resolve, reject) => {
        let bin = path.join(tmpFolder, "bin");
        fs.emptyDirSync(bin);
        let nodejs = `node${OS.platform() == 'win32' ? ".exe" : ""}`;
        fs.copy(path.join(root, `node`, nodejs), path.join(bin, nodejs), (err) => {
            err ? reject(err) : resolve();
        });
    })
}

function copyMacSH() {
    return new Promise((resolve, reject) => {
        if (OS.platform() !== 'darwin') {
            resolve();
        } else {
            let sh = `install_depends.sh`;
            fs.copy(path.join(root, "npm-packages", sh), path.join(tmpFolder, sh), (err) => {
                err ? reject(err) : resolve();
            });
        }
    })
}

function reWritePackage() {
    return new Promise((resolve, reject) => {
        let packagePath = path.join(tmpFolder, "package.json");
        fs.readJson(packagePath, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            let obj = data;
            delete obj["devDependencies"];
            fs.writeJson(packagePath, obj, {
                spaces: 4,
                encoding: 'utf-8'
            }, (err) => {
                err ? reject(err) : resolve();
            });
        });
    })
}

// version = "v3.4.+"
version = "v2.4.x"
taskStart(`${projectName}-${version}`);
