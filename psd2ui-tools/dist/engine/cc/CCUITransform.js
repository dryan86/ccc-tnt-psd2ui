"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CCUITransform = void 0;
const EditorVersion_1 = require("../../EditorVersion");
const _decorator_1 = require("../../_decorator");
const CCComponent_1 = require("./CCComponent");
const CCSize_1 = require("./values/CCSize");
const CCVec2_1 = require("./values/CCVec2");
// 3.4.x
let CCUITransform = class CCUITransform extends CCComponent_1.CCComponent {
    constructor() {
        super(...arguments);
        this._contentSize = new CCSize_1.CCSize();
        this._anchorPoint = new CCVec2_1.CCVec2(0, 0);
    }
    updateWithLayer(psdLayer) {
    }
};
exports.CCUITransform = CCUITransform;
__decorate([
    (0, _decorator_1.ccversion)(EditorVersion_1.EditorVersion.v342)
], CCUITransform.prototype, "_contentSize", void 0);
__decorate([
    (0, _decorator_1.ccversion)(EditorVersion_1.EditorVersion.v342)
], CCUITransform.prototype, "_anchorPoint", void 0);
exports.CCUITransform = CCUITransform = __decorate([
    (0, _decorator_1.cctype)("cc.UITransform")
], CCUITransform);