"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Texture9Utils = void 0;
const canvas_1 = __importDefault(require("canvas"));
class Texture9Utils {
    static safeBorder(_canvas, border) {
        var _a, _b, _c, _d;
        border.l = ((_a = border.l) !== null && _a !== void 0 ? _a : border.r) || 0;
        border.r = ((_b = border.r) !== null && _b !== void 0 ? _b : border.l) || 0;
        border.t = ((_c = border.t) !== null && _c !== void 0 ? _c : border.b) || 0;
        border.b = ((_d = border.b) !== null && _d !== void 0 ? _d : border.t) || 0;
        return border;
    }
    static split(_canvas, border) {
        this.safeBorder(_canvas, border);
        let cw = _canvas.width;
        let ch = _canvas.height;
        let space = 4;
        let left = border.l || cw;
        let right = border.r || cw;
        let top = border.t || ch;
        let bottom = border.b || ch;
        if (border.b == 0 && border.t == 0 && border.l == 0 && border.r == 0) {
            return _canvas;
        }
        if (border.l + border.r > cw + space) {
            console.log(`Texture9Utils-> 设置的九宫格 left， right 数据不合理，请重新设置`);
            return _canvas;
        }
        if (border.b + border.t > ch + space) {
            console.log(`Texture9Utils-> 设置的九宫格 bottom， top 数据不合理，请重新设置`);
            return _canvas;
        }
        let imgW = border.l + border.r == 0 ? cw : Math.min(cw, border.l + border.r + space);
        let imgH = border.b + border.t == 0 ? ch : Math.min(ch, border.b + border.t + space);
        let newCanvas = canvas_1.default.createCanvas(imgW, imgH);
        let ctx = newCanvas.getContext("2d");
        // 左上
        ctx.drawImage(_canvas, 0, 0, left + space, top + space, 0, 0, left + space, top + space);
        // 左下
        ctx.drawImage(_canvas, 0, ch - bottom, left + space, bottom, 0, top + space, left + space, bottom);
        // 右上
        ctx.drawImage(_canvas, cw - left, 0, right, top + space, left + space, 0, right, top + space);
        // 右下
        ctx.drawImage(_canvas, cw - left, ch - bottom, right, bottom, left + space, top + space, right, bottom);
        return newCanvas;
    }
}
exports.Texture9Utils = Texture9Utils;
