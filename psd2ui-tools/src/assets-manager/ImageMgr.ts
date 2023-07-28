import { PsdImage } from "../psd/PsdImage";

class ImageMgr{
    // 镜像图像管理
    private _imageIdKeyMap: Map<number,PsdImage> = new Map();

    // 当前 psd 所有的图片
    private _imageArray: Map<string,PsdImage> = new Map();

    add(psdImage: PsdImage){
        // 不忽略导出图片
        if(!psdImage.isIgnore() && !psdImage.isBind()){
            if(!this._imageArray.has(psdImage.md5)){
                this._imageArray.set(psdImage.md5,psdImage);
            }
        }
        
        if(typeof psdImage.attr.comps.img?.id != "undefined"){
            let id = psdImage.attr.comps.img.id;
            if(this._imageIdKeyMap.has(id)){
                console.warn(`ImageMgr-> ${psdImage.source.name} 已有相同 @img{id:${id}}，请检查 psd 图层`);
            }
            this._imageIdKeyMap.set(id,psdImage);
        }
    }

    getAllImage(){
        return this._imageArray;
    }

    /** 尝试获取有编号的图像图层 */
    getSerialNumberImage(psdImage: PsdImage){
        let bind = psdImage.attr.comps.flip?.bind ?? psdImage.attr.comps.img?.bind;
        if(typeof bind != 'undefined'){
            if(this._imageIdKeyMap.has(bind)){
                return this._imageIdKeyMap.get(bind)
            }else{
                console.warn(`ImageMgr-> ${psdImage.source.name} 未找到绑定的图像 {${bind}}，请检查 psd 图层`);
                
            }
        }
        return psdImage;
    }

    clear(){
        this._imageIdKeyMap.clear();
        this._imageArray.clear()
    }

    private static _instance:ImageMgr = null
    public static getInstance(): ImageMgr{
        if(!this._instance){
            this._instance = new ImageMgr();
        }
        return this._instance;
    }
}

export const imageMgr = ImageMgr.getInstance();