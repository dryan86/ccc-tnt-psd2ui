
const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = 'ccc-tnt-psd2ui';
const PACKAGE_PATH = Editor.url(`packages://${PACKAGE_NAME}/`);
const DIR_PATH = path.join(PACKAGE_PATH, 'panel/');


// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({

    template: fs.readFileSync(path.join(DIR_PATH, 'index.html'), 'utf8'),

    ready() {

        const root = this.shadowRoot;
        loadCSS(root, path.join(DIR_PATH, 'index.css'));

        const app = new window.Vue({
            el: this.shadowRoot,


            data: {
                isImgOnly: false,
                isForceImg: false,
                isProcessing: false,
            },


            methods: {

                start() {
                    let dropArea = root.getElementById('drop-area')
                    dropArea.addEventListener('drop', this.onDropFiles);

                    let forceImg = root.getElementById("is-force-img")
                    forceImg.addEventListener('change', () => {
                        this.isForceImg = !this.isForceImg;
                    });


                    let onlyImg = root.getElementById("is-img-only")
                    onlyImg.addEventListener('change', () => {
                        this.isImgOnly = !this.isImgOnly;
                    });

                    let str = localStorage.getItem(`${Editor.Project.name}_psd2ui_output`);
                    if (str) {
                        let outputInput = root.getElementById("output");
                        outputInput.value = str;
                    }

                },
                onDragEnter(event) {
                    event.stopPropagation()
                    event.preventDefault()
                },
                onDragLeave(event) {

                    event.stopPropagation()
                    event.preventDefault()
                },
                onDragOver(event) {
                    event.stopPropagation()
                    event.preventDefault()
                },
                onDropFiles(event) {
                    if (this.isProcessing) {
                        Editor.Dialog.warn("当前有正在处理的文件，请等待完成。\n如果已完成，请关闭 DOS 窗口。")
                        return;
                    }
                    event.stopPropagation()
                    event.preventDefault()

                    let files = [];
                    [].forEach.call(event.dataTransfer.files, function (file) {
                        files.push(file.path);
                    }, false);


                    this.processPsd(files);

                },


                onClickDropArea(event) {
                    if (this.isProcessing) {
                        // Editor.Dialog.warn("当前有正在处理的文件，请等待完成。\n如果已完成，请关闭 DOS 窗口。")
                        // Editor.
                        return;
                    }
                    
                    let result = Editor.Dialog.openFile({
                        'multi': true,
                        'type': "file",
                        'filters': [
                            {
                                'extensions': ["psd"],
                                'name': "请选择 PSD"
                            }
                        ]
                    });

                    let files = result;
                    this.processPsd(files);
                },
                processPsd(files) {
                    if (this.isProcessing) {
                        return;
                    }
                    let outputInput = root.getElementById("output")
                    let output = outputInput.value;
                    // 
                    this.isProcessing = true;
                    Editor.Ipc.sendToMain('ccc-tnt-psd2ui:on-drop-file', { output, files, isForceImg: this.isForceImg, isImgOnly: this.isImgOnly }, (err) => {
                        this.isProcessing = false;

                    });

                },
                onClickCache() {
                    if (this.isProcessing) {
                        return;
                    }
                    this.isProcessing = true;

                    // Editor.Ipc.sendToMain('ccc-tnt-psd2ui:clicked');
                    Editor.Ipc.sendToMain('ccc-tnt-psd2ui:onClickCache', null, () => {
                        this.isProcessing = false;

                    });
                },

                /**
                 * 保存配置
                 */
                onSaveBtnClick() {
                    console.log(`index-> onclick`);

                    if (this.isProcessing) return;
                    this.isProcessing = true;

                    let config = this.cache;

                    // Editor.Ipc.sendToMain('ccc-tnt-psd2ui:clicked');
                    Editor.Ipc.sendToMain('ccc-tnt-psd2ui:save-config', config, () => {
                        this.isProcessing = false;
                        console.log(`index-> `);

                    });
                },

                /**
                 * 读取配置
                 */
                readConfig() {
                    Editor.Ipc.sendToMain('ccc-tnt-psd2ui:read-cache', (err, config) => {
                        if (err || !config) return;


                    });
                },

            }
        });
        // app.readConfig();
        app.start();
    },
    close() {
        const root = this.shadowRoot;
        let outputInput = root.getElementById("output")
        localStorage.setItem(`${Editor.Project.name}_psd2ui_output`, outputInput.value);
    },
    // register your ipc messages here
    messages: {

        // 'ccc-tnt-psd2ui:hello' (event) {
        //   this.$label.innerText = 'Hello!';
        // }
    }
});


/**
 * 加载样式表
 * @param {HTMLElement} root 根元素
 * @param {string} path CSS 文件路径
 */
function loadCSS(root, path) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = path;
    const el = root.querySelector('#app');
    root.insertBefore(link, el);
}

