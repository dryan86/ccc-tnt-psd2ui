"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageMgr = void 0;
class ImageMgr {
    constructor() {
        // 镜像图像管理
        this._imageIdKeyMap = new Map();
        // 当前 psd 所有的图片
        this._imageMapMd5Key = new Map();
        this._imageMapImgNameKey = new Map();
    }
    // /** 相同名称不同  md5 图片的后缀id */
    // private _sameImgNameId: Record<string, number> = {};
    add(psdImage) {
        var _a;
        // 不忽略导出图片
        if (!psdImage.isIgnore() && !psdImage.isBind()) {
            if (!this._imageMapMd5Key.has(psdImage.name)) {
                this._imageMapMd5Key.set(psdImage.name, psdImage);
            }
        }
        if (typeof ((_a = psdImage.attr.comps.img) === null || _a === void 0 ? void 0 : _a.id) != "undefined") {
            let id = psdImage.attr.comps.img.id;
            if (this._imageIdKeyMap.has(id)) {
                console.warn(`ImageMgr-> ${psdImage.source.name} 已有相同 @img{id:${id}}，请检查 psd 图层`);
            }
            this._imageIdKeyMap.set(id, psdImage);
        }
        this.handleSameImgName(psdImage, psdImage.imgName, 0);
    }
    /**
     * 处理相同名称的图片
     *
     * @param {PsdImage} psdImage
     * @param {string} imgName
     * @param {number} idx
     * @memberof ImageMgr
     */
    handleSameImgName(psdImage, imgName, idx) {
        if (this._imageMapImgNameKey.has(imgName)) {
            let _psdImage = this._imageMapImgNameKey.get(imgName);
            if (_psdImage.name != psdImage.name) {
                this.handleSameImgName(psdImage, `${psdImage.imgName}_R${idx}`, idx + 1);
            }
            else {
                psdImage.imgName = imgName;
            }
        }
        else {
            psdImage.imgName = imgName;
            this._imageMapImgNameKey.set(imgName, psdImage);
        }
    }
    getAllImage() {
        return this._imageMapMd5Key;
    }
    /** 尝试获取有编号的图像图层 */
    getSerialNumberImage(psdImage) {
        var _a, _b, _c;
        let bind = (_b = (_a = psdImage.attr.comps.flip) === null || _a === void 0 ? void 0 : _a.bind) !== null && _b !== void 0 ? _b : (_c = psdImage.attr.comps.img) === null || _c === void 0 ? void 0 : _c.bind;
        if (typeof bind != 'undefined') {
            if (this._imageIdKeyMap.has(bind)) {
                return this._imageIdKeyMap.get(bind);
            }
            else {
                console.warn(`ImageMgr-> ${psdImage.source.name} 未找到绑定的图像 {${bind}}，请检查 psd 图层`);
            }
        }
        return psdImage;
    }
    clear() {
        this._imageIdKeyMap.clear();
        this._imageMapMd5Key.clear();
    }
    static getInstance() {
        if (!this._instance) {
            this._instance = new ImageMgr();
        }
        return this._instance;
    }
}
ImageMgr._instance = null;
exports.imageMgr = ImageMgr.getInstance();
