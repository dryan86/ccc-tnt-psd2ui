"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeColor = exports.writePsd = exports.writeSection = exports.writeUnicodeStringWithPadding = exports.writeUnicodeString = exports.writePascalString = exports.writeSignature = exports.writeZeros = exports.writeBytes = exports.writeFixedPointPath32 = exports.writeFixedPoint32 = exports.writeFloat64 = exports.writeFloat32 = exports.writeUint32 = exports.writeInt32 = exports.writeUint16 = exports.writeInt16 = exports.writeUint8 = exports.getWriterBufferNoCopy = exports.getWriterBuffer = exports.createWriter = void 0;
var helpers_1 = require("./helpers");
var additionalInfo_1 = require("./additionalInfo");
var imageResources_1 = require("./imageResources");
function createWriter(size) {
    if (size === void 0) { size = 4096; }
    var buffer = new ArrayBuffer(size);
    var view = new DataView(buffer);
    var offset = 0;
    return { buffer: buffer, view: view, offset: offset };
}
exports.createWriter = createWriter;
function getWriterBuffer(writer) {
    return writer.buffer.slice(0, writer.offset);
}
exports.getWriterBuffer = getWriterBuffer;
function getWriterBufferNoCopy(writer) {
    return new Uint8Array(writer.buffer, 0, writer.offset);
}
exports.getWriterBufferNoCopy = getWriterBufferNoCopy;
function writeUint8(writer, value) {
    var offset = addSize(writer, 1);
    writer.view.setUint8(offset, value);
}
exports.writeUint8 = writeUint8;
function writeInt16(writer, value) {
    var offset = addSize(writer, 2);
    writer.view.setInt16(offset, value, false);
}
exports.writeInt16 = writeInt16;
function writeUint16(writer, value) {
    var offset = addSize(writer, 2);
    writer.view.setUint16(offset, value, false);
}
exports.writeUint16 = writeUint16;
function writeInt32(writer, value) {
    var offset = addSize(writer, 4);
    writer.view.setInt32(offset, value, false);
}
exports.writeInt32 = writeInt32;
function writeUint32(writer, value) {
    var offset = addSize(writer, 4);
    writer.view.setUint32(offset, value, false);
}
exports.writeUint32 = writeUint32;
function writeFloat32(writer, value) {
    var offset = addSize(writer, 4);
    writer.view.setFloat32(offset, value, false);
}
exports.writeFloat32 = writeFloat32;
function writeFloat64(writer, value) {
    var offset = addSize(writer, 8);
    writer.view.setFloat64(offset, value, false);
}
exports.writeFloat64 = writeFloat64;
// 32-bit fixed-point number 16.16
function writeFixedPoint32(writer, value) {
    writeInt32(writer, value * (1 << 16));
}
exports.writeFixedPoint32 = writeFixedPoint32;
// 32-bit fixed-point number 8.24
function writeFixedPointPath32(writer, value) {
    writeInt32(writer, value * (1 << 24));
}
exports.writeFixedPointPath32 = writeFixedPointPath32;
function writeBytes(writer, buffer) {
    if (buffer) {
        ensureSize(writer, writer.offset + buffer.length);
        var bytes = new Uint8Array(writer.buffer);
        bytes.set(buffer, writer.offset);
        writer.offset += buffer.length;
    }
}
exports.writeBytes = writeBytes;
function writeZeros(writer, count) {
    for (var i = 0; i < count; i++) {
        writeUint8(writer, 0);
    }
}
exports.writeZeros = writeZeros;
function writeSignature(writer, signature) {
    if (signature.length !== 4)
        throw new Error("Invalid signature: '".concat(signature, "'"));
    for (var i = 0; i < 4; i++) {
        writeUint8(writer, signature.charCodeAt(i));
    }
}
exports.writeSignature = writeSignature;
function writePascalString(writer, text, padTo) {
    var length = text.length;
    writeUint8(writer, length);
    for (var i = 0; i < length; i++) {
        var code = text.charCodeAt(i);
        writeUint8(writer, code < 128 ? code : '?'.charCodeAt(0));
    }
    while (++length % padTo) {
        writeUint8(writer, 0);
    }
}
exports.writePascalString = writePascalString;
function writeUnicodeString(writer, text) {
    writeUint32(writer, text.length);
    for (var i = 0; i < text.length; i++) {
        writeUint16(writer, text.charCodeAt(i));
    }
}
exports.writeUnicodeString = writeUnicodeString;
function writeUnicodeStringWithPadding(writer, text) {
    writeUint32(writer, text.length + 1);
    for (var i = 0; i < text.length; i++) {
        writeUint16(writer, text.charCodeAt(i));
    }
    writeUint16(writer, 0);
}
exports.writeUnicodeStringWithPadding = writeUnicodeStringWithPadding;
function getLargestLayerSize(layers) {
    if (layers === void 0) { layers = []; }
    var max = 0;
    for (var _i = 0, layers_1 = layers; _i < layers_1.length; _i++) {
        var layer = layers_1[_i];
        if (layer.canvas || layer.imageData) {
            var _a = getLayerDimentions(layer), width = _a.width, height = _a.height;
            max = Math.max(max, 2 * height + 2 * width * height);
        }
        if (layer.children) {
            max = Math.max(max, getLargestLayerSize(layer.children));
        }
    }
    return max;
}
function writeSection(writer, round, func, writeTotalLength, large) {
    if (writeTotalLength === void 0) { writeTotalLength = false; }
    if (large === void 0) { large = false; }
    if (large)
        writeUint32(writer, 0);
    var offset = writer.offset;
    writeUint32(writer, 0);
    func();
    var length = writer.offset - offset - 4;
    var len = length;
    while ((len % round) !== 0) {
        writeUint8(writer, 0);
        len++;
    }
    if (writeTotalLength) {
        length = len;
    }
    writer.view.setUint32(offset, length, false);
}
exports.writeSection = writeSection;
function writePsd(writer, psd, options) {
    if (options === void 0) { options = {}; }
    if (!(+psd.width > 0 && +psd.height > 0))
        throw new Error('Invalid document size');
    if ((psd.width > 30000 || psd.height > 30000) && !options.psb)
        throw new Error('Document size is too large (max is 30000x30000, use PSB format instead)');
    var imageResources = psd.imageResources || {};
    var opt = __assign(__assign({}, options), { layerIds: new Set(), layerToId: new Map() });
    if (opt.generateThumbnail) {
        imageResources = __assign(__assign({}, imageResources), { thumbnail: createThumbnail(psd) });
    }
    var imageData = psd.imageData;
    if (!imageData && psd.canvas) {
        imageData = psd.canvas.getContext('2d').getImageData(0, 0, psd.canvas.width, psd.canvas.height);
    }
    if (imageData && (psd.width !== imageData.width || psd.height !== imageData.height))
        throw new Error('Document canvas must have the same size as document');
    var globalAlpha = !!imageData && (0, helpers_1.hasAlpha)(imageData);
    var maxBufferSize = Math.max(getLargestLayerSize(psd.children), 4 * 2 * psd.width * psd.height + 2 * psd.height);
    var tempBuffer = new Uint8Array(maxBufferSize);
    // header
    writeSignature(writer, '8BPS');
    writeUint16(writer, options.psb ? 2 : 1); // version
    writeZeros(writer, 6);
    writeUint16(writer, globalAlpha ? 4 : 3); // channels
    writeUint32(writer, psd.height);
    writeUint32(writer, psd.width);
    writeUint16(writer, 8); // bits per channel
    writeUint16(writer, 3 /* ColorMode.RGB */); // we only support saving RGB right now
    // color mode data
    writeSection(writer, 1, function () {
        // TODO: implement
    });
    // image resources
    writeSection(writer, 1, function () {
        var _loop_1 = function (handler) {
            if (handler.has(imageResources)) {
                writeSignature(writer, '8BIM');
                writeUint16(writer, handler.key);
                writePascalString(writer, '', 2);
                writeSection(writer, 2, function () { return handler.write(writer, imageResources); });
            }
        };
        for (var _i = 0, resourceHandlers_1 = imageResources_1.resourceHandlers; _i < resourceHandlers_1.length; _i++) {
            var handler = resourceHandlers_1[_i];
            _loop_1(handler);
        }
    });
    // layer and mask info
    writeSection(writer, 2, function () {
        writeLayerInfo(tempBuffer, writer, psd, globalAlpha, opt);
        writeGlobalLayerMaskInfo(writer, psd.globalLayerMaskInfo);
        writeAdditionalLayerInfo(writer, psd, psd, opt);
    }, undefined, !!opt.psb);
    // image data
    var channels = globalAlpha ? [0, 1, 2, 3] : [0, 1, 2];
    var data = imageData || {
        data: new Uint8Array(4 * psd.width * psd.height),
        width: psd.width,
        height: psd.height,
    };
    writeUint16(writer, 1 /* Compression.RleCompressed */); // Photoshop doesn't support zip compression of composite image data
    if (helpers_1.RAW_IMAGE_DATA && psd.imageDataRaw) {
        console.log('writing raw image data');
        writeBytes(writer, psd.imageDataRaw);
    }
    else {
        writeBytes(writer, (0, helpers_1.writeDataRLE)(tempBuffer, data, channels, !!options.psb));
    }
}
exports.writePsd = writePsd;
function writeLayerInfo(tempBuffer, writer, psd, globalAlpha, options) {
    writeSection(writer, 4, function () {
        var _a;
        var layers = [];
        addChildren(layers, psd.children);
        if (!layers.length)
            layers.push({});
        writeInt16(writer, globalAlpha ? -layers.length : layers.length);
        var layersData = layers.map(function (l, i) { return getChannels(tempBuffer, l, i === 0, options); });
        var _loop_2 = function (layerData) {
            var layer = layerData.layer, top_1 = layerData.top, left = layerData.left, bottom = layerData.bottom, right = layerData.right, channels = layerData.channels;
            writeInt32(writer, top_1);
            writeInt32(writer, left);
            writeInt32(writer, bottom);
            writeInt32(writer, right);
            writeUint16(writer, channels.length);
            for (var _e = 0, channels_1 = channels; _e < channels_1.length; _e++) {
                var c = channels_1[_e];
                writeInt16(writer, c.channelId);
                if (options.psb)
                    writeUint32(writer, 0);
                writeUint32(writer, c.length);
            }
            writeSignature(writer, '8BIM');
            writeSignature(writer, helpers_1.fromBlendMode[layer.blendMode] || 'norm');
            writeUint8(writer, Math.round((0, helpers_1.clamp)((_a = layer.opacity) !== null && _a !== void 0 ? _a : 1, 0, 1) * 255));
            writeUint8(writer, layer.clipping ? 1 : 0);
            var flags = 0x08; // 1 for Photoshop 5.0 and later, tells if bit 4 has useful information
            if (layer.transparencyProtected)
                flags |= 0x01;
            if (layer.hidden)
                flags |= 0x02;
            if (layer.vectorMask || (layer.sectionDivider && layer.sectionDivider.type !== 0 /* SectionDividerType.Other */)) {
                flags |= 0x10; // pixel data irrelevant to appearance of document
            }
            if (layer.effects && (0, additionalInfo_1.hasMultiEffects)(layer.effects)) { // TODO: this is not correct
                flags |= 0x20; // just guessing this one, might be completely incorrect
            }
            // if ('_2' in layer) flags |= 0x20; // TEMP!!!
            writeUint8(writer, flags);
            writeUint8(writer, 0); // filler
            writeSection(writer, 1, function () {
                writeLayerMaskData(writer, layer, layerData);
                writeLayerBlendingRanges(writer, psd);
                writePascalString(writer, layer.name || '', 4);
                writeAdditionalLayerInfo(writer, layer, psd, options);
            });
        };
        // layer records
        for (var _i = 0, layersData_1 = layersData; _i < layersData_1.length; _i++) {
            var layerData = layersData_1[_i];
            _loop_2(layerData);
        }
        // layer channel image data
        for (var _b = 0, layersData_2 = layersData; _b < layersData_2.length; _b++) {
            var layerData = layersData_2[_b];
            for (var _c = 0, _d = layerData.channels; _c < _d.length; _c++) {
                var channel = _d[_c];
                writeUint16(writer, channel.compression);
                if (channel.buffer) {
                    writeBytes(writer, channel.buffer);
                }
            }
        }
    }, true, options.psb);
}
function writeLayerMaskData(writer, _a, layerData) {
    var mask = _a.mask;
    writeSection(writer, 1, function () {
        if (!mask)
            return;
        var m = layerData.mask || {};
        writeInt32(writer, m.top);
        writeInt32(writer, m.left);
        writeInt32(writer, m.bottom);
        writeInt32(writer, m.right);
        writeUint8(writer, mask.defaultColor);
        var params = 0;
        if (mask.userMaskDensity !== undefined)
            params |= 1 /* MaskParams.UserMaskDensity */;
        if (mask.userMaskFeather !== undefined)
            params |= 2 /* MaskParams.UserMaskFeather */;
        if (mask.vectorMaskDensity !== undefined)
            params |= 4 /* MaskParams.VectorMaskDensity */;
        if (mask.vectorMaskFeather !== undefined)
            params |= 8 /* MaskParams.VectorMaskFeather */;
        var flags = 0;
        if (mask.disabled)
            flags |= 2 /* LayerMaskFlags.LayerMaskDisabled */;
        if (mask.positionRelativeToLayer)
            flags |= 1 /* LayerMaskFlags.PositionRelativeToLayer */;
        if (mask.fromVectorData)
            flags |= 8 /* LayerMaskFlags.LayerMaskFromRenderingOtherData */;
        if (params)
            flags |= 16 /* LayerMaskFlags.MaskHasParametersAppliedToIt */;
        writeUint8(writer, flags);
        if (params) {
            writeUint8(writer, params);
            if (mask.userMaskDensity !== undefined)
                writeUint8(writer, Math.round(mask.userMaskDensity * 0xff));
            if (mask.userMaskFeather !== undefined)
                writeFloat64(writer, mask.userMaskFeather);
            if (mask.vectorMaskDensity !== undefined)
                writeUint8(writer, Math.round(mask.vectorMaskDensity * 0xff));
            if (mask.vectorMaskFeather !== undefined)
                writeFloat64(writer, mask.vectorMaskFeather);
        }
        // TODO: handle rest of the fields
        writeZeros(writer, 2);
    });
}
function writeLayerBlendingRanges(writer, psd) {
    writeSection(writer, 1, function () {
        writeUint32(writer, 65535);
        writeUint32(writer, 65535);
        var channels = psd.channels || 0; // TODO: use always 4 instead ?
        // channels = 4; // TESTING
        for (var i = 0; i < channels; i++) {
            writeUint32(writer, 65535);
            writeUint32(writer, 65535);
        }
    });
}
function writeGlobalLayerMaskInfo(writer, info) {
    writeSection(writer, 1, function () {
        if (info) {
            writeUint16(writer, info.overlayColorSpace);
            writeUint16(writer, info.colorSpace1);
            writeUint16(writer, info.colorSpace2);
            writeUint16(writer, info.colorSpace3);
            writeUint16(writer, info.colorSpace4);
            writeUint16(writer, info.opacity * 0xff);
            writeUint8(writer, info.kind);
            writeZeros(writer, 3);
        }
    });
}
function writeAdditionalLayerInfo(writer, target, psd, options) {
    var _loop_3 = function (handler) {
        var key = handler.key;
        if (key === 'Txt2' && options.invalidateTextLayers)
            return "continue";
        if (key === 'vmsk' && options.psb)
            key = 'vsms';
        if (handler.has(target)) {
            var large = options.psb && helpers_1.largeAdditionalInfoKeys.indexOf(key) !== -1;
            writeSignature(writer, large ? '8B64' : '8BIM');
            writeSignature(writer, key);
            var fourBytes = key === 'Txt2' || key === 'luni' || key === 'vmsk' || key === 'artb' || key === 'artd' ||
                key === 'vogk' || key === 'SoLd' || key === 'lnk2' || key === 'vscg' || key === 'vsms' || key === 'GdFl' ||
                key === 'lmfx' || key === 'lrFX' || key === 'cinf' || key === 'PlLd' || key === 'Anno';
            writeSection(writer, fourBytes ? 4 : 2, function () {
                handler.write(writer, target, psd, options);
            }, key !== 'Txt2' && key !== 'cinf' && key !== 'extn', large);
        }
    };
    for (var _i = 0, infoHandlers_1 = additionalInfo_1.infoHandlers; _i < infoHandlers_1.length; _i++) {
        var handler = infoHandlers_1[_i];
        _loop_3(handler);
    }
}
function addChildren(layers, children) {
    if (!children)
        return;
    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
        var c = children_1[_i];
        if (c.children && c.canvas)
            throw new Error("Invalid layer, cannot have both 'canvas' and 'children' properties");
        if (c.children && c.imageData)
            throw new Error("Invalid layer, cannot have both 'imageData' and 'children' properties");
        if (c.children) {
            layers.push({
                name: '</Layer group>',
                sectionDivider: {
                    type: 3 /* SectionDividerType.BoundingSectionDivider */,
                },
                // TESTING
                // nameSource: 'lset',
                // id: [4, 0, 0, 8, 11, 0, 0, 0, 0, 14][layers.length] || 0,
                // layerColor: 'none',
                // timestamp: [1611346817.349021, 0, 0, 1611346817.349175, 1611346817.3491833, 0, 0, 0, 0, 1611346817.349832][layers.length] || 0,
                // protected: {},
                // referencePoint: { x: 0, y: 0 },
            });
            addChildren(layers, c.children);
            layers.push(__assign({ sectionDivider: {
                    type: c.opened === false ? 2 /* SectionDividerType.ClosedFolder */ : 1 /* SectionDividerType.OpenFolder */,
                    key: helpers_1.fromBlendMode[c.blendMode] || 'pass',
                    subType: 0,
                } }, c));
        }
        else {
            layers.push(__assign({}, c));
        }
    }
}
function resizeBuffer(writer, size) {
    var newLength = writer.buffer.byteLength;
    do {
        newLength *= 2;
    } while (size > newLength);
    var newBuffer = new ArrayBuffer(newLength);
    var newBytes = new Uint8Array(newBuffer);
    var oldBytes = new Uint8Array(writer.buffer);
    newBytes.set(oldBytes);
    writer.buffer = newBuffer;
    writer.view = new DataView(writer.buffer);
}
function ensureSize(writer, size) {
    if (size > writer.buffer.byteLength) {
        resizeBuffer(writer, size);
    }
}
function addSize(writer, size) {
    var offset = writer.offset;
    ensureSize(writer, writer.offset += size);
    return offset;
}
function createThumbnail(psd) {
    var canvas = (0, helpers_1.createCanvas)(10, 10);
    var scale = 1;
    if (psd.width > psd.height) {
        canvas.width = 160;
        canvas.height = Math.floor(psd.height * (canvas.width / psd.width));
        scale = canvas.width / psd.width;
    }
    else {
        canvas.height = 160;
        canvas.width = Math.floor(psd.width * (canvas.height / psd.height));
        scale = canvas.height / psd.height;
    }
    var context = canvas.getContext('2d');
    context.scale(scale, scale);
    if (psd.imageData) {
        var temp = (0, helpers_1.createCanvas)(psd.imageData.width, psd.imageData.height);
        temp.getContext('2d').putImageData(psd.imageData, 0, 0);
        context.drawImage(temp, 0, 0);
    }
    else if (psd.canvas) {
        context.drawImage(psd.canvas, 0, 0);
    }
    return canvas;
}
function getChannels(tempBuffer, layer, background, options) {
    var layerData = getLayerChannels(tempBuffer, layer, background, options);
    var mask = layer.mask;
    if (mask) {
        var top_2 = mask.top | 0;
        var left = mask.left | 0;
        var right = mask.right | 0;
        var bottom = mask.bottom | 0;
        var _a = getLayerDimentions(mask), width = _a.width, height = _a.height;
        var imageData = mask.imageData;
        if (!imageData && mask.canvas && width && height) {
            imageData = mask.canvas.getContext('2d').getImageData(0, 0, width, height);
        }
        if (width && height && imageData) {
            right = left + width;
            bottom = top_2 + height;
            if (imageData.width !== width || imageData.height !== height) {
                throw new Error('Invalid imageData dimentions');
            }
            var buffer = void 0;
            var compression = void 0;
            if (helpers_1.RAW_IMAGE_DATA && layer.maskDataRaw) {
                // console.log('written raw layer image data');
                buffer = layer.maskDataRaw;
                compression = 1 /* Compression.RleCompressed */;
            }
            else if (options.compress) {
                buffer = (0, helpers_1.writeDataZipWithoutPrediction)(imageData, [0]);
                compression = 2 /* Compression.ZipWithoutPrediction */;
            }
            else {
                buffer = (0, helpers_1.writeDataRLE)(tempBuffer, imageData, [0], !!options.psb);
                compression = 1 /* Compression.RleCompressed */;
            }
            layerData.mask = { top: top_2, left: left, right: right, bottom: bottom };
            layerData.channels.push({ channelId: -2 /* ChannelID.UserMask */, compression: compression, buffer: buffer, length: 2 + buffer.length });
        }
        else {
            layerData.mask = { top: 0, left: 0, right: 0, bottom: 0 };
            layerData.channels.push({ channelId: -2 /* ChannelID.UserMask */, compression: 0 /* Compression.RawData */, buffer: new Uint8Array(0), length: 0 });
        }
    }
    return layerData;
}
function getLayerDimentions(_a) {
    var canvas = _a.canvas, imageData = _a.imageData;
    return imageData || canvas || { width: 0, height: 0 };
}
function cropImageData(data, left, top, width, height) {
    var croppedData = (0, helpers_1.createImageData)(width, height);
    var srcData = data.data;
    var dstData = croppedData.data;
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var src = ((x + left) + (y + top) * width) * 4;
            var dst = (x + y * width) * 4;
            dstData[dst] = srcData[src];
            dstData[dst + 1] = srcData[src + 1];
            dstData[dst + 2] = srcData[src + 2];
            dstData[dst + 3] = srcData[src + 3];
        }
    }
    return croppedData;
}
function getLayerChannels(tempBuffer, layer, background, options) {
    var _a;
    var top = layer.top | 0;
    var left = layer.left | 0;
    var right = layer.right | 0;
    var bottom = layer.bottom | 0;
    var channels = [
        { channelId: -1 /* ChannelID.Transparency */, compression: 0 /* Compression.RawData */, buffer: undefined, length: 2 },
        { channelId: 0 /* ChannelID.Color0 */, compression: 0 /* Compression.RawData */, buffer: undefined, length: 2 },
        { channelId: 1 /* ChannelID.Color1 */, compression: 0 /* Compression.RawData */, buffer: undefined, length: 2 },
        { channelId: 2 /* ChannelID.Color2 */, compression: 0 /* Compression.RawData */, buffer: undefined, length: 2 },
    ];
    var _b = getLayerDimentions(layer), width = _b.width, height = _b.height;
    if (!(layer.canvas || layer.imageData) || !width || !height) {
        right = left;
        bottom = top;
        return { layer: layer, top: top, left: left, right: right, bottom: bottom, channels: channels };
    }
    right = left + width;
    bottom = top + height;
    var data = layer.imageData || layer.canvas.getContext('2d').getImageData(0, 0, width, height);
    if (options.trimImageData) {
        var trimmed = trimData(data);
        if (trimmed.left !== 0 || trimmed.top !== 0 || trimmed.right !== data.width || trimmed.bottom !== data.height) {
            left += trimmed.left;
            top += trimmed.top;
            right -= (data.width - trimmed.right);
            bottom -= (data.height - trimmed.bottom);
            width = right - left;
            height = bottom - top;
            if (!width || !height) {
                return { layer: layer, top: top, left: left, right: right, bottom: bottom, channels: channels };
            }
            if (layer.imageData) {
                data = cropImageData(data, trimmed.left, trimmed.top, width, height);
            }
            else {
                data = layer.canvas.getContext('2d').getImageData(trimmed.left, trimmed.top, width, height);
            }
        }
    }
    var channelIds = [
        0 /* ChannelID.Color0 */,
        1 /* ChannelID.Color1 */,
        2 /* ChannelID.Color2 */,
    ];
    if (!background || options.noBackground || layer.mask || (0, helpers_1.hasAlpha)(data) || (helpers_1.RAW_IMAGE_DATA && ((_a = layer.imageDataRaw) === null || _a === void 0 ? void 0 : _a['-1']))) {
        channelIds.unshift(-1 /* ChannelID.Transparency */);
    }
    channels = channelIds.map(function (channelId) {
        var offset = (0, helpers_1.offsetForChannel)(channelId, false); // TODO: psd.colorMode === ColorMode.CMYK);
        var buffer;
        var compression;
        if (helpers_1.RAW_IMAGE_DATA && layer.imageDataRaw) {
            // console.log('written raw layer image data');
            buffer = layer.imageDataRaw[channelId];
            compression = 1 /* Compression.RleCompressed */;
        }
        else if (options.compress) {
            buffer = (0, helpers_1.writeDataZipWithoutPrediction)(data, [offset]);
            compression = 2 /* Compression.ZipWithoutPrediction */;
        }
        else {
            buffer = (0, helpers_1.writeDataRLE)(tempBuffer, data, [offset], !!options.psb);
            compression = 1 /* Compression.RleCompressed */;
        }
        return { channelId: channelId, compression: compression, buffer: buffer, length: 2 + buffer.length };
    });
    return { layer: layer, top: top, left: left, right: right, bottom: bottom, channels: channels };
}
function isRowEmpty(_a, y, left, right) {
    var data = _a.data, width = _a.width;
    var start = ((y * width + left) * 4 + 3) | 0;
    var end = (start + (right - left) * 4) | 0;
    for (var i = start; i < end; i = (i + 4) | 0) {
        if (data[i] !== 0) {
            return false;
        }
    }
    return true;
}
function isColEmpty(_a, x, top, bottom) {
    var data = _a.data, width = _a.width;
    var stride = (width * 4) | 0;
    var start = (top * stride + x * 4 + 3) | 0;
    for (var y = top, i = start; y < bottom; y++, i = (i + stride) | 0) {
        if (data[i] !== 0) {
            return false;
        }
    }
    return true;
}
function trimData(data) {
    var top = 0;
    var left = 0;
    var right = data.width;
    var bottom = data.height;
    while (top < bottom && isRowEmpty(data, top, left, right))
        top++;
    while (bottom > top && isRowEmpty(data, bottom - 1, left, right))
        bottom--;
    while (left < right && isColEmpty(data, left, top, bottom))
        left++;
    while (right > left && isColEmpty(data, right - 1, top, bottom))
        right--;
    return { top: top, left: left, right: right, bottom: bottom };
}
function writeColor(writer, color) {
    if (!color) {
        writeUint16(writer, 0 /* ColorSpace.RGB */);
        writeZeros(writer, 8);
    }
    else if ('r' in color) {
        writeUint16(writer, 0 /* ColorSpace.RGB */);
        writeUint16(writer, Math.round(color.r * 257));
        writeUint16(writer, Math.round(color.g * 257));
        writeUint16(writer, Math.round(color.b * 257));
        writeUint16(writer, 0);
    }
    else if ('l' in color) {
        writeUint16(writer, 7 /* ColorSpace.Lab */);
        writeInt16(writer, Math.round(color.l * 10000));
        writeInt16(writer, Math.round(color.a < 0 ? (color.a * 12800) : (color.a * 12700)));
        writeInt16(writer, Math.round(color.b < 0 ? (color.b * 12800) : (color.b * 12700)));
        writeUint16(writer, 0);
    }
    else if ('h' in color) {
        writeUint16(writer, 1 /* ColorSpace.HSB */);
        writeUint16(writer, Math.round(color.h * 0xffff));
        writeUint16(writer, Math.round(color.s * 0xffff));
        writeUint16(writer, Math.round(color.b * 0xffff));
        writeUint16(writer, 0);
    }
    else if ('c' in color) {
        writeUint16(writer, 2 /* ColorSpace.CMYK */);
        writeUint16(writer, Math.round(color.c * 257));
        writeUint16(writer, Math.round(color.m * 257));
        writeUint16(writer, Math.round(color.y * 257));
        writeUint16(writer, Math.round(color.k * 257));
    }
    else {
        writeUint16(writer, 8 /* ColorSpace.Grayscale */);
        writeUint16(writer, Math.round(color.k * 10000 / 255));
        writeZeros(writer, 6);
    }
}
exports.writeColor = writeColor;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBzZFdyaXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLHFDQUltQjtBQUNuQixtREFBdUY7QUFDdkYsbURBQW9EO0FBUXBELFNBQWdCLFlBQVksQ0FBQyxJQUFXO0lBQVgscUJBQUEsRUFBQSxXQUFXO0lBQ3ZDLElBQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLElBQU0sSUFBSSxHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xDLElBQU0sTUFBTSxHQUFHLENBQUMsQ0FBQztJQUNqQixPQUFPLEVBQUUsTUFBTSxRQUFBLEVBQUUsSUFBSSxNQUFBLEVBQUUsTUFBTSxRQUFBLEVBQUUsQ0FBQztBQUNqQyxDQUFDO0FBTEQsb0NBS0M7QUFFRCxTQUFnQixlQUFlLENBQUMsTUFBaUI7SUFDaEQsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFGRCwwQ0FFQztBQUVELFNBQWdCLHFCQUFxQixDQUFDLE1BQWlCO0lBQ3RELE9BQU8sSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUFGRCxzREFFQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxNQUFpQixFQUFFLEtBQWE7SUFDMUQsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDckMsQ0FBQztBQUhELGdDQUdDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUMxRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUhELGdDQUdDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUMzRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDN0MsQ0FBQztBQUhELGtDQUdDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUMxRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUhELGdDQUdDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUMzRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDN0MsQ0FBQztBQUhELGtDQUdDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUM1RCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUhELG9DQUdDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUM1RCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQUhELG9DQUdDO0FBRUQsa0NBQWtDO0FBQ2xDLFNBQWdCLGlCQUFpQixDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUNqRSxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7QUFGRCw4Q0FFQztBQUVELGlDQUFpQztBQUNqQyxTQUFnQixxQkFBcUIsQ0FBQyxNQUFpQixFQUFFLEtBQWE7SUFDckUsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN2QyxDQUFDO0FBRkQsc0RBRUM7QUFFRCxTQUFnQixVQUFVLENBQUMsTUFBaUIsRUFBRSxNQUE4QjtJQUMzRSxJQUFJLE1BQU0sRUFBRTtRQUNYLFVBQVUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEQsSUFBTSxLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqQyxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUM7S0FDL0I7QUFDRixDQUFDO0FBUEQsZ0NBT0M7QUFFRCxTQUFnQixVQUFVLENBQUMsTUFBaUIsRUFBRSxLQUFhO0lBQzFELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDL0IsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztLQUN0QjtBQUNGLENBQUM7QUFKRCxnQ0FJQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxNQUFpQixFQUFFLFNBQWlCO0lBQ2xFLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBdUIsU0FBUyxNQUFHLENBQUMsQ0FBQztJQUVqRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzNCLFVBQVUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzVDO0FBQ0YsQ0FBQztBQU5ELHdDQU1DO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsTUFBaUIsRUFBRSxJQUFZLEVBQUUsS0FBYTtJQUMvRSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3pCLFVBQVUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFM0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNoQyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDMUQ7SUFFRCxPQUFPLEVBQUUsTUFBTSxHQUFHLEtBQUssRUFBRTtRQUN4QixVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3RCO0FBQ0YsQ0FBQztBQVpELDhDQVlDO0FBRUQsU0FBZ0Isa0JBQWtCLENBQUMsTUFBaUIsRUFBRSxJQUFZO0lBQ2pFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRWpDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3JDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3hDO0FBQ0YsQ0FBQztBQU5ELGdEQU1DO0FBRUQsU0FBZ0IsNkJBQTZCLENBQUMsTUFBaUIsRUFBRSxJQUFZO0lBQzVFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVyQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNyQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN4QztJQUVELFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDeEIsQ0FBQztBQVJELHNFQVFDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxNQUFvQjtJQUFwQix1QkFBQSxFQUFBLFdBQW9CO0lBQ2hELElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztJQUVaLEtBQW9CLFVBQU0sRUFBTixpQkFBTSxFQUFOLG9CQUFNLEVBQU4sSUFBTSxFQUFFO1FBQXZCLElBQU0sS0FBSyxlQUFBO1FBQ2YsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLEVBQUU7WUFDOUIsSUFBQSxLQUFvQixrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBM0MsS0FBSyxXQUFBLEVBQUUsTUFBTSxZQUE4QixDQUFDO1lBQ3BELEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUM7U0FDckQ7UUFFRCxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUU7WUFDbkIsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1NBQ3pEO0tBQ0Q7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNaLENBQUM7QUFFRCxTQUFnQixZQUFZLENBQUMsTUFBaUIsRUFBRSxLQUFhLEVBQUUsSUFBZ0IsRUFBRSxnQkFBd0IsRUFBRSxLQUFhO0lBQXZDLGlDQUFBLEVBQUEsd0JBQXdCO0lBQUUsc0JBQUEsRUFBQSxhQUFhO0lBQ3ZILElBQUksS0FBSztRQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbEMsSUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM3QixXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXZCLElBQUksRUFBRSxDQUFDO0lBRVAsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3hDLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQztJQUVqQixPQUFPLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUMzQixVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLEdBQUcsRUFBRSxDQUFDO0tBQ047SUFFRCxJQUFJLGdCQUFnQixFQUFFO1FBQ3JCLE1BQU0sR0FBRyxHQUFHLENBQUM7S0FDYjtJQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDOUMsQ0FBQztBQXBCRCxvQ0FvQkM7QUFFRCxTQUFnQixRQUFRLENBQUMsTUFBaUIsRUFBRSxHQUFRLEVBQUUsT0FBMEI7SUFBMUIsd0JBQUEsRUFBQSxZQUEwQjtJQUMvRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBRTFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUc7UUFDNUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5RUFBeUUsQ0FBQyxDQUFDO0lBRTVGLElBQUksY0FBYyxHQUFHLEdBQUcsQ0FBQyxjQUFjLElBQUksRUFBRSxDQUFDO0lBRTlDLElBQU0sR0FBRyx5QkFBOEIsT0FBTyxLQUFFLFFBQVEsRUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEdBQUcsRUFBRSxHQUFFLENBQUM7SUFFNUYsSUFBSSxHQUFHLENBQUMsaUJBQWlCLEVBQUU7UUFDMUIsY0FBYyx5QkFBUSxjQUFjLEtBQUUsU0FBUyxFQUFFLGVBQWUsQ0FBQyxHQUFHLENBQUMsR0FBRSxDQUFDO0tBQ3hFO0lBRUQsSUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztJQUU5QixJQUFJLENBQUMsU0FBUyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUU7UUFDN0IsU0FBUyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDakc7SUFFRCxJQUFJLFNBQVMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUM7UUFDbEYsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO0lBRXhFLElBQU0sV0FBVyxHQUFHLENBQUMsQ0FBQyxTQUFTLElBQUksSUFBQSxrQkFBUSxFQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZELElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbkgsSUFBTSxVQUFVLEdBQUcsSUFBSSxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFakQsU0FBUztJQUNULGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDL0IsV0FBVyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVTtJQUNwRCxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFdBQVcsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVztJQUNyRCxXQUFXLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNoQyxXQUFXLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CO0lBQzNDLFdBQVcsQ0FBQyxNQUFNLHdCQUFnQixDQUFDLENBQUMsdUNBQXVDO0lBRTNFLGtCQUFrQjtJQUNsQixZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRTtRQUN2QixrQkFBa0I7SUFDbkIsQ0FBQyxDQUFDLENBQUM7SUFFSCxrQkFBa0I7SUFDbEIsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUU7Z0NBQ1osT0FBTztZQUNqQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUU7Z0JBQ2hDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQy9CLFdBQVcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNqQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxjQUFNLE9BQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLEVBQXJDLENBQXFDLENBQUMsQ0FBQzthQUNyRTs7UUFORixLQUFzQixVQUFnQixFQUFoQixxQkFBQSxpQ0FBZ0IsRUFBaEIsOEJBQWdCLEVBQWhCLElBQWdCO1lBQWpDLElBQU0sT0FBTyx5QkFBQTtvQkFBUCxPQUFPO1NBT2pCO0lBQ0YsQ0FBQyxDQUFDLENBQUM7SUFFSCxzQkFBc0I7SUFDdEIsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUU7UUFDdkIsY0FBYyxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMxRCx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDMUQsd0JBQXdCLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDakQsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRXpCLGFBQWE7SUFDYixJQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN4RCxJQUFNLElBQUksR0FBYyxTQUFTLElBQUk7UUFDcEMsSUFBSSxFQUFFLElBQUksVUFBVSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7UUFDaEQsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO1FBQ2hCLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTTtLQUNsQixDQUFDO0lBRUYsV0FBVyxDQUFDLE1BQU0sb0NBQTRCLENBQUMsQ0FBQyxvRUFBb0U7SUFFcEgsSUFBSSx3QkFBYyxJQUFLLEdBQVcsQ0FBQyxZQUFZLEVBQUU7UUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3RDLFVBQVUsQ0FBQyxNQUFNLEVBQUcsR0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQzlDO1NBQU07UUFDTixVQUFVLENBQUMsTUFBTSxFQUFFLElBQUEsc0JBQVksRUFBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDNUU7QUFDRixDQUFDO0FBOUVELDRCQThFQztBQUVELFNBQVMsY0FBYyxDQUFDLFVBQXNCLEVBQUUsTUFBaUIsRUFBRSxHQUFRLEVBQUUsV0FBb0IsRUFBRSxPQUE2QjtJQUMvSCxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRTs7UUFDdkIsSUFBTSxNQUFNLEdBQVksRUFBRSxDQUFDO1FBRTNCLFdBQVcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRWxDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTTtZQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFcEMsVUFBVSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWpFLElBQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQyxJQUFLLE9BQUEsV0FBVyxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPLENBQUMsRUFBNUMsQ0FBNEMsQ0FBQyxDQUFDO2dDQUczRSxTQUFTO1lBQ1gsSUFBQSxLQUFLLEdBQXlDLFNBQVMsTUFBbEQsRUFBRSxLQUFHLEdBQW9DLFNBQVMsSUFBN0MsRUFBRSxJQUFJLEdBQThCLFNBQVMsS0FBdkMsRUFBRSxNQUFNLEdBQXNCLFNBQVMsT0FBL0IsRUFBRSxLQUFLLEdBQWUsU0FBUyxNQUF4QixFQUFFLFFBQVEsR0FBSyxTQUFTLFNBQWQsQ0FBZTtZQUVoRSxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUcsQ0FBQyxDQUFDO1lBQ3hCLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekIsVUFBVSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMzQixVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFCLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXJDLEtBQWdCLFVBQVEsRUFBUixxQkFBUSxFQUFSLHNCQUFRLEVBQVIsSUFBUSxFQUFFO2dCQUFyQixJQUFNLENBQUMsaUJBQUE7Z0JBQ1gsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksT0FBTyxDQUFDLEdBQUc7b0JBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDeEMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDOUI7WUFFRCxjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQy9CLGNBQWMsQ0FBQyxNQUFNLEVBQUUsdUJBQWEsQ0FBQyxLQUFLLENBQUMsU0FBVSxDQUFDLElBQUksTUFBTSxDQUFDLENBQUM7WUFDbEUsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUEsZUFBSyxFQUFDLE1BQUEsS0FBSyxDQUFDLE9BQU8sbUNBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUzQyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyx1RUFBdUU7WUFDekYsSUFBSSxLQUFLLENBQUMscUJBQXFCO2dCQUFFLEtBQUssSUFBSSxJQUFJLENBQUM7WUFDL0MsSUFBSSxLQUFLLENBQUMsTUFBTTtnQkFBRSxLQUFLLElBQUksSUFBSSxDQUFDO1lBQ2hDLElBQUksS0FBSyxDQUFDLFVBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLHFDQUE2QixDQUFDLEVBQUU7Z0JBQ3pHLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQyxrREFBa0Q7YUFDakU7WUFDRCxJQUFJLEtBQUssQ0FBQyxPQUFPLElBQUksSUFBQSxnQ0FBZSxFQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLDRCQUE0QjtnQkFDbEYsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLHdEQUF3RDthQUN2RTtZQUNELCtDQUErQztZQUUvQyxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFCLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQ2hDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFO2dCQUN2QixrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM3Qyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3RDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDL0Msd0JBQXdCLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdkQsQ0FBQyxDQUFDLENBQUM7O1FBdkNKLGdCQUFnQjtRQUNoQixLQUF3QixVQUFVLEVBQVYseUJBQVUsRUFBVix3QkFBVSxFQUFWLElBQVU7WUFBN0IsSUFBTSxTQUFTLG1CQUFBO29CQUFULFNBQVM7U0F1Q25CO1FBRUQsMkJBQTJCO1FBQzNCLEtBQXdCLFVBQVUsRUFBVix5QkFBVSxFQUFWLHdCQUFVLEVBQVYsSUFBVSxFQUFFO1lBQS9CLElBQU0sU0FBUyxtQkFBQTtZQUNuQixLQUFzQixVQUFrQixFQUFsQixLQUFBLFNBQVMsQ0FBQyxRQUFRLEVBQWxCLGNBQWtCLEVBQWxCLElBQWtCLEVBQUU7Z0JBQXJDLElBQU0sT0FBTyxTQUFBO2dCQUNqQixXQUFXLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFFekMsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFO29CQUNuQixVQUFVLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDbkM7YUFDRDtTQUNEO0lBQ0YsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdkIsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsTUFBaUIsRUFBRSxFQUFlLEVBQUUsU0FBMkI7UUFBMUMsSUFBSSxVQUFBO0lBQ3BELFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFO1FBQ3ZCLElBQUksQ0FBQyxJQUFJO1lBQUUsT0FBTztRQUVsQixJQUFNLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxJQUFJLEVBQXFCLENBQUM7UUFDbEQsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsR0FBSSxDQUFDLENBQUM7UUFDM0IsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsSUFBSyxDQUFDLENBQUM7UUFDNUIsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTyxDQUFDLENBQUM7UUFDOUIsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsS0FBTSxDQUFDLENBQUM7UUFDN0IsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsWUFBYSxDQUFDLENBQUM7UUFFdkMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVM7WUFBRSxNQUFNLHNDQUE4QixDQUFDO1FBQzdFLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyxTQUFTO1lBQUUsTUFBTSxzQ0FBOEIsQ0FBQztRQUM3RSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxTQUFTO1lBQUUsTUFBTSx3Q0FBZ0MsQ0FBQztRQUNqRixJQUFJLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxTQUFTO1lBQUUsTUFBTSx3Q0FBZ0MsQ0FBQztRQUVqRixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDZCxJQUFJLElBQUksQ0FBQyxRQUFRO1lBQUUsS0FBSyw0Q0FBb0MsQ0FBQztRQUM3RCxJQUFJLElBQUksQ0FBQyx1QkFBdUI7WUFBRSxLQUFLLGtEQUEwQyxDQUFDO1FBQ2xGLElBQUksSUFBSSxDQUFDLGNBQWM7WUFBRSxLQUFLLDBEQUFrRCxDQUFDO1FBQ2pGLElBQUksTUFBTTtZQUFFLEtBQUssd0RBQStDLENBQUM7UUFFakUsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUUxQixJQUFJLE1BQU0sRUFBRTtZQUNYLFVBQVUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFM0IsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVM7Z0JBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRyxJQUFJLElBQUksQ0FBQyxlQUFlLEtBQUssU0FBUztnQkFBRSxZQUFZLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNuRixJQUFJLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxTQUFTO2dCQUFFLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN4RyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxTQUFTO2dCQUFFLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7U0FDdkY7UUFFRCxrQ0FBa0M7UUFFbEMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN2QixDQUFDLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLHdCQUF3QixDQUFDLE1BQWlCLEVBQUUsR0FBUTtJQUM1RCxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRTtRQUN2QixXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNCLFdBQVcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFM0IsSUFBSSxRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQywrQkFBK0I7UUFDakUsMkJBQTJCO1FBRTNCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDbEMsV0FBVyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMzQixXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzNCO0lBQ0YsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyx3QkFBd0IsQ0FBQyxNQUFpQixFQUFFLElBQXFDO0lBQ3pGLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFO1FBQ3ZCLElBQUksSUFBSSxFQUFFO1lBQ1QsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUM1QyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN0QyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN0QyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN0QyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN0QyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDekMsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN0QjtJQUNGLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsd0JBQXdCLENBQUMsTUFBaUIsRUFBRSxNQUEyQixFQUFFLEdBQVEsRUFBRSxPQUE2Qjs0QkFDN0csT0FBTztRQUNqQixJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBRXRCLElBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxPQUFPLENBQUMsb0JBQW9COzhCQUFXO1FBQzdELElBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxPQUFPLENBQUMsR0FBRztZQUFFLEdBQUcsR0FBRyxNQUFNLENBQUM7UUFFaEQsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3hCLElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLElBQUksaUNBQXVCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRXpFLGNBQWMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hELGNBQWMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFNUIsSUFBTSxTQUFTLEdBQUcsR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxJQUFJLEdBQUcsS0FBSyxNQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTTtnQkFDdkcsR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxJQUFJLEdBQUcsS0FBSyxNQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxJQUFJLEdBQUcsS0FBSyxNQUFNO2dCQUN4RyxHQUFHLEtBQUssTUFBTSxJQUFJLEdBQUcsS0FBSyxNQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxJQUFJLEdBQUcsS0FBSyxNQUFNLENBQUM7WUFFeEYsWUFBWSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN2QyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzdDLENBQUMsRUFBRSxHQUFHLEtBQUssTUFBTSxJQUFJLEdBQUcsS0FBSyxNQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztTQUM5RDs7SUFuQkYsS0FBc0IsVUFBWSxFQUFaLGlCQUFBLDZCQUFZLEVBQVosMEJBQVksRUFBWixJQUFZO1FBQTdCLElBQU0sT0FBTyxxQkFBQTtnQkFBUCxPQUFPO0tBb0JqQjtBQUNGLENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FBQyxNQUFlLEVBQUUsUUFBNkI7SUFDbEUsSUFBSSxDQUFDLFFBQVE7UUFBRSxPQUFPO0lBRXRCLEtBQWdCLFVBQVEsRUFBUixxQkFBUSxFQUFSLHNCQUFRLEVBQVIsSUFBUSxFQUFFO1FBQXJCLElBQU0sQ0FBQyxpQkFBQTtRQUNYLElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsTUFBTTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsb0VBQW9FLENBQUMsQ0FBQztRQUNsSCxJQUFJLENBQUMsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLFNBQVM7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHVFQUF1RSxDQUFDLENBQUM7UUFFeEgsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFO1lBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDWCxJQUFJLEVBQUUsZ0JBQWdCO2dCQUN0QixjQUFjLEVBQUU7b0JBQ2YsSUFBSSxtREFBMkM7aUJBQy9DO2dCQUNELFVBQVU7Z0JBQ1Ysc0JBQXNCO2dCQUN0Qiw0REFBNEQ7Z0JBQzVELHNCQUFzQjtnQkFDdEIsa0lBQWtJO2dCQUNsSSxpQkFBaUI7Z0JBQ2pCLGtDQUFrQzthQUNsQyxDQUFDLENBQUM7WUFDSCxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsSUFBSSxZQUNWLGNBQWMsRUFBRTtvQkFDZixJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxLQUFLLENBQUMsQ0FBQyx5Q0FBaUMsQ0FBQyxzQ0FBOEI7b0JBQzFGLEdBQUcsRUFBRSx1QkFBYSxDQUFDLENBQUMsQ0FBQyxTQUFVLENBQUMsSUFBSSxNQUFNO29CQUMxQyxPQUFPLEVBQUUsQ0FBQztpQkFDVixJQUNFLENBQUMsRUFDSCxDQUFDO1NBQ0g7YUFBTTtZQUNOLE1BQU0sQ0FBQyxJQUFJLGNBQU0sQ0FBQyxFQUFHLENBQUM7U0FDdEI7S0FDRDtBQUNGLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBQyxNQUFpQixFQUFFLElBQVk7SUFDcEQsSUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7SUFFekMsR0FBRztRQUNGLFNBQVMsSUFBSSxDQUFDLENBQUM7S0FDZixRQUFRLElBQUksR0FBRyxTQUFTLEVBQUU7SUFFM0IsSUFBTSxTQUFTLEdBQUcsSUFBSSxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDN0MsSUFBTSxRQUFRLEdBQUcsSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDM0MsSUFBTSxRQUFRLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQy9DLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkIsTUFBTSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7SUFDMUIsTUFBTSxDQUFDLElBQUksR0FBRyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLE1BQWlCLEVBQUUsSUFBWTtJQUNsRCxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRTtRQUNwQyxZQUFZLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzNCO0FBQ0YsQ0FBQztBQUVELFNBQVMsT0FBTyxDQUFDLE1BQWlCLEVBQUUsSUFBWTtJQUMvQyxJQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzdCLFVBQVUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQztJQUMxQyxPQUFPLE1BQU0sQ0FBQztBQUNmLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxHQUFRO0lBQ2hDLElBQU0sTUFBTSxHQUFHLElBQUEsc0JBQVksRUFBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDcEMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBRWQsSUFBSSxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUU7UUFDM0IsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7UUFDbkIsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7S0FDakM7U0FBTTtRQUNOLE1BQU0sQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNwRSxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0tBQ25DO0lBRUQsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQztJQUN6QyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUU1QixJQUFJLEdBQUcsQ0FBQyxTQUFTLEVBQUU7UUFDbEIsSUFBTSxJQUFJLEdBQUcsSUFBQSxzQkFBWSxFQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDekQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzlCO1NBQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFO1FBQ3RCLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDcEM7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNmLENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FDbkIsVUFBc0IsRUFBRSxLQUFZLEVBQUUsVUFBbUIsRUFBRSxPQUFxQjtJQUVoRixJQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMzRSxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0lBRXhCLElBQUksSUFBSSxFQUFFO1FBQ1QsSUFBSSxLQUFHLEdBQUksSUFBSSxDQUFDLEdBQVcsR0FBRyxDQUFDLENBQUM7UUFDaEMsSUFBSSxJQUFJLEdBQUksSUFBSSxDQUFDLElBQVksR0FBRyxDQUFDLENBQUM7UUFDbEMsSUFBSSxLQUFLLEdBQUksSUFBSSxDQUFDLEtBQWEsR0FBRyxDQUFDLENBQUM7UUFDcEMsSUFBSSxNQUFNLEdBQUksSUFBSSxDQUFDLE1BQWMsR0FBRyxDQUFDLENBQUM7UUFDbEMsSUFBQSxLQUFvQixrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBMUMsS0FBSyxXQUFBLEVBQUUsTUFBTSxZQUE2QixDQUFDO1FBQ2pELElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFFL0IsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssSUFBSSxNQUFNLEVBQUU7WUFDakQsU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztTQUM1RTtRQUVELElBQUksS0FBSyxJQUFJLE1BQU0sSUFBSSxTQUFTLEVBQUU7WUFDakMsS0FBSyxHQUFHLElBQUksR0FBRyxLQUFLLENBQUM7WUFDckIsTUFBTSxHQUFHLEtBQUcsR0FBRyxNQUFNLENBQUM7WUFFdEIsSUFBSSxTQUFTLENBQUMsS0FBSyxLQUFLLEtBQUssSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLE1BQU0sRUFBRTtnQkFDN0QsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO2FBQ2hEO1lBRUQsSUFBSSxNQUFNLFNBQVksQ0FBQztZQUN2QixJQUFJLFdBQVcsU0FBYSxDQUFDO1lBRTdCLElBQUksd0JBQWMsSUFBSyxLQUFhLENBQUMsV0FBVyxFQUFFO2dCQUNqRCwrQ0FBK0M7Z0JBQy9DLE1BQU0sR0FBSSxLQUFhLENBQUMsV0FBVyxDQUFDO2dCQUNwQyxXQUFXLG9DQUE0QixDQUFDO2FBQ3hDO2lCQUFNLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRTtnQkFDNUIsTUFBTSxHQUFHLElBQUEsdUNBQTZCLEVBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkQsV0FBVywyQ0FBbUMsQ0FBQzthQUMvQztpQkFBTTtnQkFDTixNQUFNLEdBQUcsSUFBQSxzQkFBWSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBRSxDQUFDO2dCQUNsRSxXQUFXLG9DQUE0QixDQUFDO2FBQ3hDO1lBRUQsU0FBUyxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsT0FBQSxFQUFFLElBQUksTUFBQSxFQUFFLEtBQUssT0FBQSxFQUFFLE1BQU0sUUFBQSxFQUFFLENBQUM7WUFDOUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxTQUFTLDZCQUFvQixFQUFFLFdBQVcsYUFBQSxFQUFFLE1BQU0sUUFBQSxFQUFFLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7U0FDM0c7YUFBTTtZQUNOLFNBQVMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDMUQsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxTQUFTLDZCQUFvQixFQUFFLFdBQVcsNkJBQXFCLEVBQUUsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ25JO0tBQ0Q7SUFFRCxPQUFPLFNBQVMsQ0FBQztBQUNsQixDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxFQUE0QjtRQUExQixNQUFNLFlBQUEsRUFBRSxTQUFTLGVBQUE7SUFDOUMsT0FBTyxTQUFTLElBQUksTUFBTSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDdkQsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLElBQWUsRUFBRSxJQUFZLEVBQUUsR0FBVyxFQUFFLEtBQWEsRUFBRSxNQUFjO0lBQy9GLElBQU0sV0FBVyxHQUFHLElBQUEseUJBQWUsRUFBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbkQsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztJQUMxQixJQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDO0lBRWpDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMvQixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMvQyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUIsT0FBTyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNwQyxPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDcEM7S0FDRDtJQUVELE9BQU8sV0FBVyxDQUFDO0FBQ3BCLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUN4QixVQUFzQixFQUFFLEtBQVksRUFBRSxVQUFtQixFQUFFLE9BQXFCOztJQUVoRixJQUFJLEdBQUcsR0FBSSxLQUFLLENBQUMsR0FBVyxHQUFHLENBQUMsQ0FBQztJQUNqQyxJQUFJLElBQUksR0FBSSxLQUFLLENBQUMsSUFBWSxHQUFHLENBQUMsQ0FBQztJQUNuQyxJQUFJLEtBQUssR0FBSSxLQUFLLENBQUMsS0FBYSxHQUFHLENBQUMsQ0FBQztJQUNyQyxJQUFJLE1BQU0sR0FBSSxLQUFLLENBQUMsTUFBYyxHQUFHLENBQUMsQ0FBQztJQUN2QyxJQUFJLFFBQVEsR0FBa0I7UUFDN0IsRUFBRSxTQUFTLGlDQUF3QixFQUFFLFdBQVcsNkJBQXFCLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFO1FBQ3JHLEVBQUUsU0FBUywwQkFBa0IsRUFBRSxXQUFXLDZCQUFxQixFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRTtRQUMvRixFQUFFLFNBQVMsMEJBQWtCLEVBQUUsV0FBVyw2QkFBcUIsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUU7UUFDL0YsRUFBRSxTQUFTLDBCQUFrQixFQUFFLFdBQVcsNkJBQXFCLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFO0tBQy9GLENBQUM7SUFDRSxJQUFBLEtBQW9CLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUEzQyxLQUFLLFdBQUEsRUFBRSxNQUFNLFlBQThCLENBQUM7SUFFbEQsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDNUQsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNiLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDYixPQUFPLEVBQUUsS0FBSyxPQUFBLEVBQUUsR0FBRyxLQUFBLEVBQUUsSUFBSSxNQUFBLEVBQUUsS0FBSyxPQUFBLEVBQUUsTUFBTSxRQUFBLEVBQUUsUUFBUSxVQUFBLEVBQUUsQ0FBQztLQUNyRDtJQUVELEtBQUssR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLE1BQU0sR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDO0lBRXRCLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLE1BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRWhHLElBQUksT0FBTyxDQUFDLGFBQWEsRUFBRTtRQUMxQixJQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFL0IsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQzlHLElBQUksSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ3JCLEdBQUcsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQ25CLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLEtBQUssR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLE1BQU0sR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDO1lBRXRCLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ3RCLE9BQU8sRUFBRSxLQUFLLE9BQUEsRUFBRSxHQUFHLEtBQUEsRUFBRSxJQUFJLE1BQUEsRUFBRSxLQUFLLE9BQUEsRUFBRSxNQUFNLFFBQUEsRUFBRSxRQUFRLFVBQUEsRUFBRSxDQUFDO2FBQ3JEO1lBRUQsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFO2dCQUNwQixJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2FBQ3JFO2lCQUFNO2dCQUNOLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUUsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQzthQUM5RjtTQUNEO0tBQ0Q7SUFFRCxJQUFNLFVBQVUsR0FBRzs7OztLQUlsQixDQUFDO0lBRUYsSUFBSSxDQUFDLFVBQVUsSUFBSSxPQUFPLENBQUMsWUFBWSxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksSUFBQSxrQkFBUSxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWMsS0FBSSxNQUFDLEtBQWEsQ0FBQyxZQUFZLDBDQUFHLElBQUksQ0FBQyxDQUFBLENBQUMsRUFBRTtRQUNuSSxVQUFVLENBQUMsT0FBTyxpQ0FBd0IsQ0FBQztLQUMzQztJQUVELFFBQVEsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLFVBQUEsU0FBUztRQUNsQyxJQUFNLE1BQU0sR0FBRyxJQUFBLDBCQUFnQixFQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLDJDQUEyQztRQUM5RixJQUFJLE1BQWtCLENBQUM7UUFDdkIsSUFBSSxXQUF3QixDQUFDO1FBRTdCLElBQUksd0JBQWMsSUFBSyxLQUFhLENBQUMsWUFBWSxFQUFFO1lBQ2xELCtDQUErQztZQUMvQyxNQUFNLEdBQUksS0FBYSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNoRCxXQUFXLG9DQUE0QixDQUFDO1NBQ3hDO2FBQU0sSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQzVCLE1BQU0sR0FBRyxJQUFBLHVDQUE2QixFQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDdkQsV0FBVywyQ0FBbUMsQ0FBQztTQUMvQzthQUFNO1lBQ04sTUFBTSxHQUFHLElBQUEsc0JBQVksRUFBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUUsQ0FBQztZQUNsRSxXQUFXLG9DQUE0QixDQUFDO1NBQ3hDO1FBRUQsT0FBTyxFQUFFLFNBQVMsV0FBQSxFQUFFLFdBQVcsYUFBQSxFQUFFLE1BQU0sUUFBQSxFQUFFLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3RFLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxFQUFFLEtBQUssT0FBQSxFQUFFLEdBQUcsS0FBQSxFQUFFLElBQUksTUFBQSxFQUFFLEtBQUssT0FBQSxFQUFFLE1BQU0sUUFBQSxFQUFFLFFBQVEsVUFBQSxFQUFFLENBQUM7QUFDdEQsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLEVBQTBCLEVBQUUsQ0FBUyxFQUFFLElBQVksRUFBRSxLQUFhO1FBQWhFLElBQUksVUFBQSxFQUFFLEtBQUssV0FBQTtJQUNoQyxJQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9DLElBQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUU3QyxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDN0MsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2xCLE9BQU8sS0FBSyxDQUFDO1NBQ2I7S0FDRDtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2IsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLEVBQTBCLEVBQUUsQ0FBUyxFQUFFLEdBQVcsRUFBRSxNQUFjO1FBQWhFLElBQUksVUFBQSxFQUFFLEtBQUssV0FBQTtJQUNoQyxJQUFNLE1BQU0sR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0IsSUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRTdDLEtBQUssSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ25FLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNsQixPQUFPLEtBQUssQ0FBQztTQUNiO0tBQ0Q7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNiLENBQUM7QUFFRCxTQUFTLFFBQVEsQ0FBQyxJQUFlO0lBQ2hDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztJQUNaLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNiLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDdkIsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUV6QixPQUFPLEdBQUcsR0FBRyxNQUFNLElBQUksVUFBVSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQztRQUN4RCxHQUFHLEVBQUUsQ0FBQztJQUNQLE9BQU8sTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQztRQUMvRCxNQUFNLEVBQUUsQ0FBQztJQUNWLE9BQU8sSUFBSSxHQUFHLEtBQUssSUFBSSxVQUFVLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDO1FBQ3pELElBQUksRUFBRSxDQUFDO0lBQ1IsT0FBTyxLQUFLLEdBQUcsSUFBSSxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDO1FBQzlELEtBQUssRUFBRSxDQUFDO0lBRVQsT0FBTyxFQUFFLEdBQUcsS0FBQSxFQUFFLElBQUksTUFBQSxFQUFFLEtBQUssT0FBQSxFQUFFLE1BQU0sUUFBQSxFQUFFLENBQUM7QUFDckMsQ0FBQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxNQUFpQixFQUFFLEtBQXdCO0lBQ3JFLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDWCxXQUFXLENBQUMsTUFBTSx5QkFBaUIsQ0FBQztRQUNwQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3RCO1NBQU0sSUFBSSxHQUFHLElBQUksS0FBSyxFQUFFO1FBQ3hCLFdBQVcsQ0FBQyxNQUFNLHlCQUFpQixDQUFDO1FBQ3BDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0MsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMvQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQy9DLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDdkI7U0FBTSxJQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUU7UUFDeEIsV0FBVyxDQUFDLE1BQU0seUJBQWlCLENBQUM7UUFDcEMsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNoRCxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRixVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRixXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3ZCO1NBQU0sSUFBSSxHQUFHLElBQUksS0FBSyxFQUFFO1FBQ3hCLFdBQVcsQ0FBQyxNQUFNLHlCQUFpQixDQUFDO1FBQ3BDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDbEQsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNsRCxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ2xELFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDdkI7U0FBTSxJQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUU7UUFDeEIsV0FBVyxDQUFDLE1BQU0sMEJBQWtCLENBQUM7UUFDckMsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMvQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQy9DLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0MsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztLQUMvQztTQUFNO1FBQ04sV0FBVyxDQUFDLE1BQU0sK0JBQXVCLENBQUM7UUFDMUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdkQsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztLQUN0QjtBQUNGLENBQUM7QUFqQ0QsZ0NBaUNDIiwiZmlsZSI6InBzZFdyaXRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBzZCwgTGF5ZXIsIExheWVyQWRkaXRpb25hbEluZm8sIENvbG9yTW9kZSwgU2VjdGlvbkRpdmlkZXJUeXBlLCBXcml0ZU9wdGlvbnMsIENvbG9yLCBHbG9iYWxMYXllck1hc2tJbmZvIH0gZnJvbSAnLi9wc2QnO1xuaW1wb3J0IHtcblx0aGFzQWxwaGEsIGNyZWF0ZUNhbnZhcywgd3JpdGVEYXRhUkxFLCBQaXhlbERhdGEsIExheWVyQ2hhbm5lbERhdGEsIENoYW5uZWxEYXRhLFxuXHRvZmZzZXRGb3JDaGFubmVsLCBjcmVhdGVJbWFnZURhdGEsIGZyb21CbGVuZE1vZGUsIENoYW5uZWxJRCwgQ29tcHJlc3Npb24sIGNsYW1wLFxuXHRMYXllck1hc2tGbGFncywgTWFza1BhcmFtcywgQ29sb3JTcGFjZSwgQm91bmRzLCBsYXJnZUFkZGl0aW9uYWxJbmZvS2V5cywgUkFXX0lNQUdFX0RBVEEsIHdyaXRlRGF0YVppcFdpdGhvdXRQcmVkaWN0aW9uXG59IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBFeHRlbmRlZFdyaXRlT3B0aW9ucywgaGFzTXVsdGlFZmZlY3RzLCBpbmZvSGFuZGxlcnMgfSBmcm9tICcuL2FkZGl0aW9uYWxJbmZvJztcbmltcG9ydCB7IHJlc291cmNlSGFuZGxlcnMgfSBmcm9tICcuL2ltYWdlUmVzb3VyY2VzJztcblxuZXhwb3J0IGludGVyZmFjZSBQc2RXcml0ZXIge1xuXHRvZmZzZXQ6IG51bWJlcjtcblx0YnVmZmVyOiBBcnJheUJ1ZmZlcjtcblx0dmlldzogRGF0YVZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVXcml0ZXIoc2l6ZSA9IDQwOTYpOiBQc2RXcml0ZXIge1xuXHRjb25zdCBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoc2l6ZSk7XG5cdGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcblx0Y29uc3Qgb2Zmc2V0ID0gMDtcblx0cmV0dXJuIHsgYnVmZmVyLCB2aWV3LCBvZmZzZXQgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFdyaXRlckJ1ZmZlcih3cml0ZXI6IFBzZFdyaXRlcikge1xuXHRyZXR1cm4gd3JpdGVyLmJ1ZmZlci5zbGljZSgwLCB3cml0ZXIub2Zmc2V0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFdyaXRlckJ1ZmZlck5vQ29weSh3cml0ZXI6IFBzZFdyaXRlcikge1xuXHRyZXR1cm4gbmV3IFVpbnQ4QXJyYXkod3JpdGVyLmJ1ZmZlciwgMCwgd3JpdGVyLm9mZnNldCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVVpbnQ4KHdyaXRlcjogUHNkV3JpdGVyLCB2YWx1ZTogbnVtYmVyKSB7XG5cdGNvbnN0IG9mZnNldCA9IGFkZFNpemUod3JpdGVyLCAxKTtcblx0d3JpdGVyLnZpZXcuc2V0VWludDgob2Zmc2V0LCB2YWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUludDE2KHdyaXRlcjogUHNkV3JpdGVyLCB2YWx1ZTogbnVtYmVyKSB7XG5cdGNvbnN0IG9mZnNldCA9IGFkZFNpemUod3JpdGVyLCAyKTtcblx0d3JpdGVyLnZpZXcuc2V0SW50MTYob2Zmc2V0LCB2YWx1ZSwgZmFsc2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVVaW50MTYod3JpdGVyOiBQc2RXcml0ZXIsIHZhbHVlOiBudW1iZXIpIHtcblx0Y29uc3Qgb2Zmc2V0ID0gYWRkU2l6ZSh3cml0ZXIsIDIpO1xuXHR3cml0ZXIudmlldy5zZXRVaW50MTYob2Zmc2V0LCB2YWx1ZSwgZmFsc2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVJbnQzMih3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IG51bWJlcikge1xuXHRjb25zdCBvZmZzZXQgPSBhZGRTaXplKHdyaXRlciwgNCk7XG5cdHdyaXRlci52aWV3LnNldEludDMyKG9mZnNldCwgdmFsdWUsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlVWludDMyKHdyaXRlcjogUHNkV3JpdGVyLCB2YWx1ZTogbnVtYmVyKSB7XG5cdGNvbnN0IG9mZnNldCA9IGFkZFNpemUod3JpdGVyLCA0KTtcblx0d3JpdGVyLnZpZXcuc2V0VWludDMyKG9mZnNldCwgdmFsdWUsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmxvYXQzMih3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IG51bWJlcikge1xuXHRjb25zdCBvZmZzZXQgPSBhZGRTaXplKHdyaXRlciwgNCk7XG5cdHdyaXRlci52aWV3LnNldEZsb2F0MzIob2Zmc2V0LCB2YWx1ZSwgZmFsc2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVGbG9hdDY0KHdyaXRlcjogUHNkV3JpdGVyLCB2YWx1ZTogbnVtYmVyKSB7XG5cdGNvbnN0IG9mZnNldCA9IGFkZFNpemUod3JpdGVyLCA4KTtcblx0d3JpdGVyLnZpZXcuc2V0RmxvYXQ2NChvZmZzZXQsIHZhbHVlLCBmYWxzZSk7XG59XG5cbi8vIDMyLWJpdCBmaXhlZC1wb2ludCBudW1iZXIgMTYuMTZcbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZpeGVkUG9pbnQzMih3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IG51bWJlcikge1xuXHR3cml0ZUludDMyKHdyaXRlciwgdmFsdWUgKiAoMSA8PCAxNikpO1xufVxuXG4vLyAzMi1iaXQgZml4ZWQtcG9pbnQgbnVtYmVyIDguMjRcbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZpeGVkUG9pbnRQYXRoMzIod3JpdGVyOiBQc2RXcml0ZXIsIHZhbHVlOiBudW1iZXIpIHtcblx0d3JpdGVJbnQzMih3cml0ZXIsIHZhbHVlICogKDEgPDwgMjQpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlQnl0ZXMod3JpdGVyOiBQc2RXcml0ZXIsIGJ1ZmZlcjogVWludDhBcnJheSB8IHVuZGVmaW5lZCkge1xuXHRpZiAoYnVmZmVyKSB7XG5cdFx0ZW5zdXJlU2l6ZSh3cml0ZXIsIHdyaXRlci5vZmZzZXQgKyBidWZmZXIubGVuZ3RoKTtcblx0XHRjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KHdyaXRlci5idWZmZXIpO1xuXHRcdGJ5dGVzLnNldChidWZmZXIsIHdyaXRlci5vZmZzZXQpO1xuXHRcdHdyaXRlci5vZmZzZXQgKz0gYnVmZmVyLmxlbmd0aDtcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVaZXJvcyh3cml0ZXI6IFBzZFdyaXRlciwgY291bnQ6IG51bWJlcikge1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgMCk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlU2lnbmF0dXJlKHdyaXRlcjogUHNkV3JpdGVyLCBzaWduYXR1cmU6IHN0cmluZykge1xuXHRpZiAoc2lnbmF0dXJlLmxlbmd0aCAhPT0gNCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNpZ25hdHVyZTogJyR7c2lnbmF0dXJlfSdgKTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBzaWduYXR1cmUuY2hhckNvZGVBdChpKSk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlUGFzY2FsU3RyaW5nKHdyaXRlcjogUHNkV3JpdGVyLCB0ZXh0OiBzdHJpbmcsIHBhZFRvOiBudW1iZXIpIHtcblx0bGV0IGxlbmd0aCA9IHRleHQubGVuZ3RoO1xuXHR3cml0ZVVpbnQ4KHdyaXRlciwgbGVuZ3RoKTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0Y29uc3QgY29kZSA9IHRleHQuY2hhckNvZGVBdChpKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgY29kZSA8IDEyOCA/IGNvZGUgOiAnPycuY2hhckNvZGVBdCgwKSk7XG5cdH1cblxuXHR3aGlsZSAoKytsZW5ndGggJSBwYWRUbykge1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCAwKTtcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVVbmljb2RlU3RyaW5nKHdyaXRlcjogUHNkV3JpdGVyLCB0ZXh0OiBzdHJpbmcpIHtcblx0d3JpdGVVaW50MzIod3JpdGVyLCB0ZXh0Lmxlbmd0aCk7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCB0ZXh0LmNoYXJDb2RlQXQoaSkpO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVVuaWNvZGVTdHJpbmdXaXRoUGFkZGluZyh3cml0ZXI6IFBzZFdyaXRlciwgdGV4dDogc3RyaW5nKSB7XG5cdHdyaXRlVWludDMyKHdyaXRlciwgdGV4dC5sZW5ndGggKyAxKTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIHRleHQuY2hhckNvZGVBdChpKSk7XG5cdH1cblxuXHR3cml0ZVVpbnQxNih3cml0ZXIsIDApO1xufVxuXG5mdW5jdGlvbiBnZXRMYXJnZXN0TGF5ZXJTaXplKGxheWVyczogTGF5ZXJbXSA9IFtdKTogbnVtYmVyIHtcblx0bGV0IG1heCA9IDA7XG5cblx0Zm9yIChjb25zdCBsYXllciBvZiBsYXllcnMpIHtcblx0XHRpZiAobGF5ZXIuY2FudmFzIHx8IGxheWVyLmltYWdlRGF0YSkge1xuXHRcdFx0Y29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBnZXRMYXllckRpbWVudGlvbnMobGF5ZXIpO1xuXHRcdFx0bWF4ID0gTWF0aC5tYXgobWF4LCAyICogaGVpZ2h0ICsgMiAqIHdpZHRoICogaGVpZ2h0KTtcblx0XHR9XG5cblx0XHRpZiAobGF5ZXIuY2hpbGRyZW4pIHtcblx0XHRcdG1heCA9IE1hdGgubWF4KG1heCwgZ2V0TGFyZ2VzdExheWVyU2l6ZShsYXllci5jaGlsZHJlbikpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBtYXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVNlY3Rpb24od3JpdGVyOiBQc2RXcml0ZXIsIHJvdW5kOiBudW1iZXIsIGZ1bmM6ICgpID0+IHZvaWQsIHdyaXRlVG90YWxMZW5ndGggPSBmYWxzZSwgbGFyZ2UgPSBmYWxzZSkge1xuXHRpZiAobGFyZ2UpIHdyaXRlVWludDMyKHdyaXRlciwgMCk7XG5cdGNvbnN0IG9mZnNldCA9IHdyaXRlci5vZmZzZXQ7XG5cdHdyaXRlVWludDMyKHdyaXRlciwgMCk7XG5cblx0ZnVuYygpO1xuXG5cdGxldCBsZW5ndGggPSB3cml0ZXIub2Zmc2V0IC0gb2Zmc2V0IC0gNDtcblx0bGV0IGxlbiA9IGxlbmd0aDtcblxuXHR3aGlsZSAoKGxlbiAlIHJvdW5kKSAhPT0gMCkge1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCAwKTtcblx0XHRsZW4rKztcblx0fVxuXG5cdGlmICh3cml0ZVRvdGFsTGVuZ3RoKSB7XG5cdFx0bGVuZ3RoID0gbGVuO1xuXHR9XG5cblx0d3JpdGVyLnZpZXcuc2V0VWludDMyKG9mZnNldCwgbGVuZ3RoLCBmYWxzZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVBzZCh3cml0ZXI6IFBzZFdyaXRlciwgcHNkOiBQc2QsIG9wdGlvbnM6IFdyaXRlT3B0aW9ucyA9IHt9KSB7XG5cdGlmICghKCtwc2Qud2lkdGggPiAwICYmICtwc2QuaGVpZ2h0ID4gMCkpXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRvY3VtZW50IHNpemUnKTtcblxuXHRpZiAoKHBzZC53aWR0aCA+IDMwMDAwIHx8IHBzZC5oZWlnaHQgPiAzMDAwMCkgJiYgIW9wdGlvbnMucHNiKVxuXHRcdHRocm93IG5ldyBFcnJvcignRG9jdW1lbnQgc2l6ZSBpcyB0b28gbGFyZ2UgKG1heCBpcyAzMDAwMHgzMDAwMCwgdXNlIFBTQiBmb3JtYXQgaW5zdGVhZCknKTtcblxuXHRsZXQgaW1hZ2VSZXNvdXJjZXMgPSBwc2QuaW1hZ2VSZXNvdXJjZXMgfHwge307XG5cblx0Y29uc3Qgb3B0OiBFeHRlbmRlZFdyaXRlT3B0aW9ucyA9IHsgLi4ub3B0aW9ucywgbGF5ZXJJZHM6IG5ldyBTZXQoKSwgbGF5ZXJUb0lkOiBuZXcgTWFwKCkgfTtcblxuXHRpZiAob3B0LmdlbmVyYXRlVGh1bWJuYWlsKSB7XG5cdFx0aW1hZ2VSZXNvdXJjZXMgPSB7IC4uLmltYWdlUmVzb3VyY2VzLCB0aHVtYm5haWw6IGNyZWF0ZVRodW1ibmFpbChwc2QpIH07XG5cdH1cblxuXHRsZXQgaW1hZ2VEYXRhID0gcHNkLmltYWdlRGF0YTtcblxuXHRpZiAoIWltYWdlRGF0YSAmJiBwc2QuY2FudmFzKSB7XG5cdFx0aW1hZ2VEYXRhID0gcHNkLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpIS5nZXRJbWFnZURhdGEoMCwgMCwgcHNkLmNhbnZhcy53aWR0aCwgcHNkLmNhbnZhcy5oZWlnaHQpO1xuXHR9XG5cblx0aWYgKGltYWdlRGF0YSAmJiAocHNkLndpZHRoICE9PSBpbWFnZURhdGEud2lkdGggfHwgcHNkLmhlaWdodCAhPT0gaW1hZ2VEYXRhLmhlaWdodCkpXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdEb2N1bWVudCBjYW52YXMgbXVzdCBoYXZlIHRoZSBzYW1lIHNpemUgYXMgZG9jdW1lbnQnKTtcblxuXHRjb25zdCBnbG9iYWxBbHBoYSA9ICEhaW1hZ2VEYXRhICYmIGhhc0FscGhhKGltYWdlRGF0YSk7XG5cdGNvbnN0IG1heEJ1ZmZlclNpemUgPSBNYXRoLm1heChnZXRMYXJnZXN0TGF5ZXJTaXplKHBzZC5jaGlsZHJlbiksIDQgKiAyICogcHNkLndpZHRoICogcHNkLmhlaWdodCArIDIgKiBwc2QuaGVpZ2h0KTtcblx0Y29uc3QgdGVtcEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KG1heEJ1ZmZlclNpemUpO1xuXG5cdC8vIGhlYWRlclxuXHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QlBTJyk7XG5cdHdyaXRlVWludDE2KHdyaXRlciwgb3B0aW9ucy5wc2IgPyAyIDogMSk7IC8vIHZlcnNpb25cblx0d3JpdGVaZXJvcyh3cml0ZXIsIDYpO1xuXHR3cml0ZVVpbnQxNih3cml0ZXIsIGdsb2JhbEFscGhhID8gNCA6IDMpOyAvLyBjaGFubmVsc1xuXHR3cml0ZVVpbnQzMih3cml0ZXIsIHBzZC5oZWlnaHQpO1xuXHR3cml0ZVVpbnQzMih3cml0ZXIsIHBzZC53aWR0aCk7XG5cdHdyaXRlVWludDE2KHdyaXRlciwgOCk7IC8vIGJpdHMgcGVyIGNoYW5uZWxcblx0d3JpdGVVaW50MTYod3JpdGVyLCBDb2xvck1vZGUuUkdCKTsgLy8gd2Ugb25seSBzdXBwb3J0IHNhdmluZyBSR0IgcmlnaHQgbm93XG5cblx0Ly8gY29sb3IgbW9kZSBkYXRhXG5cdHdyaXRlU2VjdGlvbih3cml0ZXIsIDEsICgpID0+IHtcblx0XHQvLyBUT0RPOiBpbXBsZW1lbnRcblx0fSk7XG5cblx0Ly8gaW1hZ2UgcmVzb3VyY2VzXG5cdHdyaXRlU2VjdGlvbih3cml0ZXIsIDEsICgpID0+IHtcblx0XHRmb3IgKGNvbnN0IGhhbmRsZXIgb2YgcmVzb3VyY2VIYW5kbGVycykge1xuXHRcdFx0aWYgKGhhbmRsZXIuaGFzKGltYWdlUmVzb3VyY2VzKSkge1xuXHRcdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdFx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgaGFuZGxlci5rZXkpO1xuXHRcdFx0XHR3cml0ZVBhc2NhbFN0cmluZyh3cml0ZXIsICcnLCAyKTtcblx0XHRcdFx0d3JpdGVTZWN0aW9uKHdyaXRlciwgMiwgKCkgPT4gaGFuZGxlci53cml0ZSh3cml0ZXIsIGltYWdlUmVzb3VyY2VzKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBsYXllciBhbmQgbWFzayBpbmZvXG5cdHdyaXRlU2VjdGlvbih3cml0ZXIsIDIsICgpID0+IHtcblx0XHR3cml0ZUxheWVySW5mbyh0ZW1wQnVmZmVyLCB3cml0ZXIsIHBzZCwgZ2xvYmFsQWxwaGEsIG9wdCk7XG5cdFx0d3JpdGVHbG9iYWxMYXllck1hc2tJbmZvKHdyaXRlciwgcHNkLmdsb2JhbExheWVyTWFza0luZm8pO1xuXHRcdHdyaXRlQWRkaXRpb25hbExheWVySW5mbyh3cml0ZXIsIHBzZCwgcHNkLCBvcHQpO1xuXHR9LCB1bmRlZmluZWQsICEhb3B0LnBzYik7XG5cblx0Ly8gaW1hZ2UgZGF0YVxuXHRjb25zdCBjaGFubmVscyA9IGdsb2JhbEFscGhhID8gWzAsIDEsIDIsIDNdIDogWzAsIDEsIDJdO1xuXHRjb25zdCBkYXRhOiBQaXhlbERhdGEgPSBpbWFnZURhdGEgfHwge1xuXHRcdGRhdGE6IG5ldyBVaW50OEFycmF5KDQgKiBwc2Qud2lkdGggKiBwc2QuaGVpZ2h0KSxcblx0XHR3aWR0aDogcHNkLndpZHRoLFxuXHRcdGhlaWdodDogcHNkLmhlaWdodCxcblx0fTtcblxuXHR3cml0ZVVpbnQxNih3cml0ZXIsIENvbXByZXNzaW9uLlJsZUNvbXByZXNzZWQpOyAvLyBQaG90b3Nob3AgZG9lc24ndCBzdXBwb3J0IHppcCBjb21wcmVzc2lvbiBvZiBjb21wb3NpdGUgaW1hZ2UgZGF0YVxuXG5cdGlmIChSQVdfSU1BR0VfREFUQSAmJiAocHNkIGFzIGFueSkuaW1hZ2VEYXRhUmF3KSB7XG5cdFx0Y29uc29sZS5sb2coJ3dyaXRpbmcgcmF3IGltYWdlIGRhdGEnKTtcblx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgKHBzZCBhcyBhbnkpLmltYWdlRGF0YVJhdyk7XG5cdH0gZWxzZSB7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsIHdyaXRlRGF0YVJMRSh0ZW1wQnVmZmVyLCBkYXRhLCBjaGFubmVscywgISFvcHRpb25zLnBzYikpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHdyaXRlTGF5ZXJJbmZvKHRlbXBCdWZmZXI6IFVpbnQ4QXJyYXksIHdyaXRlcjogUHNkV3JpdGVyLCBwc2Q6IFBzZCwgZ2xvYmFsQWxwaGE6IGJvb2xlYW4sIG9wdGlvbnM6IEV4dGVuZGVkV3JpdGVPcHRpb25zKSB7XG5cdHdyaXRlU2VjdGlvbih3cml0ZXIsIDQsICgpID0+IHtcblx0XHRjb25zdCBsYXllcnM6IExheWVyW10gPSBbXTtcblxuXHRcdGFkZENoaWxkcmVuKGxheWVycywgcHNkLmNoaWxkcmVuKTtcblxuXHRcdGlmICghbGF5ZXJzLmxlbmd0aCkgbGF5ZXJzLnB1c2goe30pO1xuXG5cdFx0d3JpdGVJbnQxNih3cml0ZXIsIGdsb2JhbEFscGhhID8gLWxheWVycy5sZW5ndGggOiBsYXllcnMubGVuZ3RoKTtcblxuXHRcdGNvbnN0IGxheWVyc0RhdGEgPSBsYXllcnMubWFwKChsLCBpKSA9PiBnZXRDaGFubmVscyh0ZW1wQnVmZmVyLCBsLCBpID09PSAwLCBvcHRpb25zKSk7XG5cblx0XHQvLyBsYXllciByZWNvcmRzXG5cdFx0Zm9yIChjb25zdCBsYXllckRhdGEgb2YgbGF5ZXJzRGF0YSkge1xuXHRcdFx0Y29uc3QgeyBsYXllciwgdG9wLCBsZWZ0LCBib3R0b20sIHJpZ2h0LCBjaGFubmVscyB9ID0gbGF5ZXJEYXRhO1xuXG5cdFx0XHR3cml0ZUludDMyKHdyaXRlciwgdG9wKTtcblx0XHRcdHdyaXRlSW50MzIod3JpdGVyLCBsZWZ0KTtcblx0XHRcdHdyaXRlSW50MzIod3JpdGVyLCBib3R0b20pO1xuXHRcdFx0d3JpdGVJbnQzMih3cml0ZXIsIHJpZ2h0KTtcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgY2hhbm5lbHMubGVuZ3RoKTtcblxuXHRcdFx0Zm9yIChjb25zdCBjIG9mIGNoYW5uZWxzKSB7XG5cdFx0XHRcdHdyaXRlSW50MTYod3JpdGVyLCBjLmNoYW5uZWxJZCk7XG5cdFx0XHRcdGlmIChvcHRpb25zLnBzYikgd3JpdGVVaW50MzIod3JpdGVyLCAwKTtcblx0XHRcdFx0d3JpdGVVaW50MzIod3JpdGVyLCBjLmxlbmd0aCk7XG5cdFx0XHR9XG5cblx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJzhCSU0nKTtcblx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgZnJvbUJsZW5kTW9kZVtsYXllci5ibGVuZE1vZGUhXSB8fCAnbm9ybScpO1xuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIE1hdGgucm91bmQoY2xhbXAobGF5ZXIub3BhY2l0eSA/PyAxLCAwLCAxKSAqIDI1NSkpO1xuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIGxheWVyLmNsaXBwaW5nID8gMSA6IDApO1xuXG5cdFx0XHRsZXQgZmxhZ3MgPSAweDA4OyAvLyAxIGZvciBQaG90b3Nob3AgNS4wIGFuZCBsYXRlciwgdGVsbHMgaWYgYml0IDQgaGFzIHVzZWZ1bCBpbmZvcm1hdGlvblxuXHRcdFx0aWYgKGxheWVyLnRyYW5zcGFyZW5jeVByb3RlY3RlZCkgZmxhZ3MgfD0gMHgwMTtcblx0XHRcdGlmIChsYXllci5oaWRkZW4pIGZsYWdzIHw9IDB4MDI7XG5cdFx0XHRpZiAobGF5ZXIudmVjdG9yTWFzayB8fCAobGF5ZXIuc2VjdGlvbkRpdmlkZXIgJiYgbGF5ZXIuc2VjdGlvbkRpdmlkZXIudHlwZSAhPT0gU2VjdGlvbkRpdmlkZXJUeXBlLk90aGVyKSkge1xuXHRcdFx0XHRmbGFncyB8PSAweDEwOyAvLyBwaXhlbCBkYXRhIGlycmVsZXZhbnQgdG8gYXBwZWFyYW5jZSBvZiBkb2N1bWVudFxuXHRcdFx0fVxuXHRcdFx0aWYgKGxheWVyLmVmZmVjdHMgJiYgaGFzTXVsdGlFZmZlY3RzKGxheWVyLmVmZmVjdHMpKSB7IC8vIFRPRE86IHRoaXMgaXMgbm90IGNvcnJlY3Rcblx0XHRcdFx0ZmxhZ3MgfD0gMHgyMDsgLy8ganVzdCBndWVzc2luZyB0aGlzIG9uZSwgbWlnaHQgYmUgY29tcGxldGVseSBpbmNvcnJlY3Rcblx0XHRcdH1cblx0XHRcdC8vIGlmICgnXzInIGluIGxheWVyKSBmbGFncyB8PSAweDIwOyAvLyBURU1QISEhXG5cblx0XHRcdHdyaXRlVWludDgod3JpdGVyLCBmbGFncyk7XG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgMCk7IC8vIGZpbGxlclxuXHRcdFx0d3JpdGVTZWN0aW9uKHdyaXRlciwgMSwgKCkgPT4ge1xuXHRcdFx0XHR3cml0ZUxheWVyTWFza0RhdGEod3JpdGVyLCBsYXllciwgbGF5ZXJEYXRhKTtcblx0XHRcdFx0d3JpdGVMYXllckJsZW5kaW5nUmFuZ2VzKHdyaXRlciwgcHNkKTtcblx0XHRcdFx0d3JpdGVQYXNjYWxTdHJpbmcod3JpdGVyLCBsYXllci5uYW1lIHx8ICcnLCA0KTtcblx0XHRcdFx0d3JpdGVBZGRpdGlvbmFsTGF5ZXJJbmZvKHdyaXRlciwgbGF5ZXIsIHBzZCwgb3B0aW9ucyk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBsYXllciBjaGFubmVsIGltYWdlIGRhdGFcblx0XHRmb3IgKGNvbnN0IGxheWVyRGF0YSBvZiBsYXllcnNEYXRhKSB7XG5cdFx0XHRmb3IgKGNvbnN0IGNoYW5uZWwgb2YgbGF5ZXJEYXRhLmNoYW5uZWxzKSB7XG5cdFx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgY2hhbm5lbC5jb21wcmVzc2lvbik7XG5cblx0XHRcdFx0aWYgKGNoYW5uZWwuYnVmZmVyKSB7XG5cdFx0XHRcdFx0d3JpdGVCeXRlcyh3cml0ZXIsIGNoYW5uZWwuYnVmZmVyKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSwgdHJ1ZSwgb3B0aW9ucy5wc2IpO1xufVxuXG5mdW5jdGlvbiB3cml0ZUxheWVyTWFza0RhdGEod3JpdGVyOiBQc2RXcml0ZXIsIHsgbWFzayB9OiBMYXllciwgbGF5ZXJEYXRhOiBMYXllckNoYW5uZWxEYXRhKSB7XG5cdHdyaXRlU2VjdGlvbih3cml0ZXIsIDEsICgpID0+IHtcblx0XHRpZiAoIW1hc2spIHJldHVybjtcblxuXHRcdGNvbnN0IG0gPSBsYXllckRhdGEubWFzayB8fCB7fSBhcyBQYXJ0aWFsPEJvdW5kcz47XG5cdFx0d3JpdGVJbnQzMih3cml0ZXIsIG0udG9wISk7XG5cdFx0d3JpdGVJbnQzMih3cml0ZXIsIG0ubGVmdCEpO1xuXHRcdHdyaXRlSW50MzIod3JpdGVyLCBtLmJvdHRvbSEpO1xuXHRcdHdyaXRlSW50MzIod3JpdGVyLCBtLnJpZ2h0ISk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIG1hc2suZGVmYXVsdENvbG9yISk7XG5cblx0XHRsZXQgcGFyYW1zID0gMDtcblx0XHRpZiAobWFzay51c2VyTWFza0RlbnNpdHkgIT09IHVuZGVmaW5lZCkgcGFyYW1zIHw9IE1hc2tQYXJhbXMuVXNlck1hc2tEZW5zaXR5O1xuXHRcdGlmIChtYXNrLnVzZXJNYXNrRmVhdGhlciAhPT0gdW5kZWZpbmVkKSBwYXJhbXMgfD0gTWFza1BhcmFtcy5Vc2VyTWFza0ZlYXRoZXI7XG5cdFx0aWYgKG1hc2sudmVjdG9yTWFza0RlbnNpdHkgIT09IHVuZGVmaW5lZCkgcGFyYW1zIHw9IE1hc2tQYXJhbXMuVmVjdG9yTWFza0RlbnNpdHk7XG5cdFx0aWYgKG1hc2sudmVjdG9yTWFza0ZlYXRoZXIgIT09IHVuZGVmaW5lZCkgcGFyYW1zIHw9IE1hc2tQYXJhbXMuVmVjdG9yTWFza0ZlYXRoZXI7XG5cblx0XHRsZXQgZmxhZ3MgPSAwO1xuXHRcdGlmIChtYXNrLmRpc2FibGVkKSBmbGFncyB8PSBMYXllck1hc2tGbGFncy5MYXllck1hc2tEaXNhYmxlZDtcblx0XHRpZiAobWFzay5wb3NpdGlvblJlbGF0aXZlVG9MYXllcikgZmxhZ3MgfD0gTGF5ZXJNYXNrRmxhZ3MuUG9zaXRpb25SZWxhdGl2ZVRvTGF5ZXI7XG5cdFx0aWYgKG1hc2suZnJvbVZlY3RvckRhdGEpIGZsYWdzIHw9IExheWVyTWFza0ZsYWdzLkxheWVyTWFza0Zyb21SZW5kZXJpbmdPdGhlckRhdGE7XG5cdFx0aWYgKHBhcmFtcykgZmxhZ3MgfD0gTGF5ZXJNYXNrRmxhZ3MuTWFza0hhc1BhcmFtZXRlcnNBcHBsaWVkVG9JdDtcblxuXHRcdHdyaXRlVWludDgod3JpdGVyLCBmbGFncyk7XG5cblx0XHRpZiAocGFyYW1zKSB7XG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgcGFyYW1zKTtcblxuXHRcdFx0aWYgKG1hc2sudXNlck1hc2tEZW5zaXR5ICE9PSB1bmRlZmluZWQpIHdyaXRlVWludDgod3JpdGVyLCBNYXRoLnJvdW5kKG1hc2sudXNlck1hc2tEZW5zaXR5ICogMHhmZikpO1xuXHRcdFx0aWYgKG1hc2sudXNlck1hc2tGZWF0aGVyICE9PSB1bmRlZmluZWQpIHdyaXRlRmxvYXQ2NCh3cml0ZXIsIG1hc2sudXNlck1hc2tGZWF0aGVyKTtcblx0XHRcdGlmIChtYXNrLnZlY3Rvck1hc2tEZW5zaXR5ICE9PSB1bmRlZmluZWQpIHdyaXRlVWludDgod3JpdGVyLCBNYXRoLnJvdW5kKG1hc2sudmVjdG9yTWFza0RlbnNpdHkgKiAweGZmKSk7XG5cdFx0XHRpZiAobWFzay52ZWN0b3JNYXNrRmVhdGhlciAhPT0gdW5kZWZpbmVkKSB3cml0ZUZsb2F0NjQod3JpdGVyLCBtYXNrLnZlY3Rvck1hc2tGZWF0aGVyKTtcblx0XHR9XG5cblx0XHQvLyBUT0RPOiBoYW5kbGUgcmVzdCBvZiB0aGUgZmllbGRzXG5cblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMik7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiB3cml0ZUxheWVyQmxlbmRpbmdSYW5nZXMod3JpdGVyOiBQc2RXcml0ZXIsIHBzZDogUHNkKSB7XG5cdHdyaXRlU2VjdGlvbih3cml0ZXIsIDEsICgpID0+IHtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDY1NTM1KTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDY1NTM1KTtcblxuXHRcdGxldCBjaGFubmVscyA9IHBzZC5jaGFubmVscyB8fCAwOyAvLyBUT0RPOiB1c2UgYWx3YXlzIDQgaW5zdGVhZCA/XG5cdFx0Ly8gY2hhbm5lbHMgPSA0OyAvLyBURVNUSU5HXG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGNoYW5uZWxzOyBpKyspIHtcblx0XHRcdHdyaXRlVWludDMyKHdyaXRlciwgNjU1MzUpO1xuXHRcdFx0d3JpdGVVaW50MzIod3JpdGVyLCA2NTUzNSk7XG5cdFx0fVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gd3JpdGVHbG9iYWxMYXllck1hc2tJbmZvKHdyaXRlcjogUHNkV3JpdGVyLCBpbmZvOiBHbG9iYWxMYXllck1hc2tJbmZvIHwgdW5kZWZpbmVkKSB7XG5cdHdyaXRlU2VjdGlvbih3cml0ZXIsIDEsICgpID0+IHtcblx0XHRpZiAoaW5mbykge1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLm92ZXJsYXlDb2xvclNwYWNlKTtcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgaW5mby5jb2xvclNwYWNlMSk7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZm8uY29sb3JTcGFjZTIpO1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLmNvbG9yU3BhY2UzKTtcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgaW5mby5jb2xvclNwYWNlNCk7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZm8ub3BhY2l0eSAqIDB4ZmYpO1xuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIGluZm8ua2luZCk7XG5cdFx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdFx0fVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gd3JpdGVBZGRpdGlvbmFsTGF5ZXJJbmZvKHdyaXRlcjogUHNkV3JpdGVyLCB0YXJnZXQ6IExheWVyQWRkaXRpb25hbEluZm8sIHBzZDogUHNkLCBvcHRpb25zOiBFeHRlbmRlZFdyaXRlT3B0aW9ucykge1xuXHRmb3IgKGNvbnN0IGhhbmRsZXIgb2YgaW5mb0hhbmRsZXJzKSB7XG5cdFx0bGV0IGtleSA9IGhhbmRsZXIua2V5O1xuXG5cdFx0aWYgKGtleSA9PT0gJ1R4dDInICYmIG9wdGlvbnMuaW52YWxpZGF0ZVRleHRMYXllcnMpIGNvbnRpbnVlO1xuXHRcdGlmIChrZXkgPT09ICd2bXNrJyAmJiBvcHRpb25zLnBzYikga2V5ID0gJ3ZzbXMnO1xuXG5cdFx0aWYgKGhhbmRsZXIuaGFzKHRhcmdldCkpIHtcblx0XHRcdGNvbnN0IGxhcmdlID0gb3B0aW9ucy5wc2IgJiYgbGFyZ2VBZGRpdGlvbmFsSW5mb0tleXMuaW5kZXhPZihrZXkpICE9PSAtMTtcblxuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCBsYXJnZSA/ICc4QjY0JyA6ICc4QklNJyk7XG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIGtleSk7XG5cblx0XHRcdGNvbnN0IGZvdXJCeXRlcyA9IGtleSA9PT0gJ1R4dDInIHx8IGtleSA9PT0gJ2x1bmknIHx8IGtleSA9PT0gJ3Ztc2snIHx8IGtleSA9PT0gJ2FydGInIHx8IGtleSA9PT0gJ2FydGQnIHx8XG5cdFx0XHRcdGtleSA9PT0gJ3ZvZ2snIHx8IGtleSA9PT0gJ1NvTGQnIHx8IGtleSA9PT0gJ2xuazInIHx8IGtleSA9PT0gJ3ZzY2cnIHx8IGtleSA9PT0gJ3ZzbXMnIHx8IGtleSA9PT0gJ0dkRmwnIHx8XG5cdFx0XHRcdGtleSA9PT0gJ2xtZngnIHx8IGtleSA9PT0gJ2xyRlgnIHx8IGtleSA9PT0gJ2NpbmYnIHx8IGtleSA9PT0gJ1BsTGQnIHx8IGtleSA9PT0gJ0Fubm8nO1xuXG5cdFx0XHR3cml0ZVNlY3Rpb24od3JpdGVyLCBmb3VyQnl0ZXMgPyA0IDogMiwgKCkgPT4ge1xuXHRcdFx0XHRoYW5kbGVyLndyaXRlKHdyaXRlciwgdGFyZ2V0LCBwc2QsIG9wdGlvbnMpO1xuXHRcdFx0fSwga2V5ICE9PSAnVHh0MicgJiYga2V5ICE9PSAnY2luZicgJiYga2V5ICE9PSAnZXh0bicsIGxhcmdlKTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gYWRkQ2hpbGRyZW4obGF5ZXJzOiBMYXllcltdLCBjaGlsZHJlbjogTGF5ZXJbXSB8IHVuZGVmaW5lZCkge1xuXHRpZiAoIWNoaWxkcmVuKSByZXR1cm47XG5cblx0Zm9yIChjb25zdCBjIG9mIGNoaWxkcmVuKSB7XG5cdFx0aWYgKGMuY2hpbGRyZW4gJiYgYy5jYW52YXMpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBsYXllciwgY2Fubm90IGhhdmUgYm90aCAnY2FudmFzJyBhbmQgJ2NoaWxkcmVuJyBwcm9wZXJ0aWVzYCk7XG5cdFx0aWYgKGMuY2hpbGRyZW4gJiYgYy5pbWFnZURhdGEpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBsYXllciwgY2Fubm90IGhhdmUgYm90aCAnaW1hZ2VEYXRhJyBhbmQgJ2NoaWxkcmVuJyBwcm9wZXJ0aWVzYCk7XG5cblx0XHRpZiAoYy5jaGlsZHJlbikge1xuXHRcdFx0bGF5ZXJzLnB1c2goe1xuXHRcdFx0XHRuYW1lOiAnPC9MYXllciBncm91cD4nLFxuXHRcdFx0XHRzZWN0aW9uRGl2aWRlcjoge1xuXHRcdFx0XHRcdHR5cGU6IFNlY3Rpb25EaXZpZGVyVHlwZS5Cb3VuZGluZ1NlY3Rpb25EaXZpZGVyLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHQvLyBURVNUSU5HXG5cdFx0XHRcdC8vIG5hbWVTb3VyY2U6ICdsc2V0Jyxcblx0XHRcdFx0Ly8gaWQ6IFs0LCAwLCAwLCA4LCAxMSwgMCwgMCwgMCwgMCwgMTRdW2xheWVycy5sZW5ndGhdIHx8IDAsXG5cdFx0XHRcdC8vIGxheWVyQ29sb3I6ICdub25lJyxcblx0XHRcdFx0Ly8gdGltZXN0YW1wOiBbMTYxMTM0NjgxNy4zNDkwMjEsIDAsIDAsIDE2MTEzNDY4MTcuMzQ5MTc1LCAxNjExMzQ2ODE3LjM0OTE4MzMsIDAsIDAsIDAsIDAsIDE2MTEzNDY4MTcuMzQ5ODMyXVtsYXllcnMubGVuZ3RoXSB8fCAwLFxuXHRcdFx0XHQvLyBwcm90ZWN0ZWQ6IHt9LFxuXHRcdFx0XHQvLyByZWZlcmVuY2VQb2ludDogeyB4OiAwLCB5OiAwIH0sXG5cdFx0XHR9KTtcblx0XHRcdGFkZENoaWxkcmVuKGxheWVycywgYy5jaGlsZHJlbik7XG5cdFx0XHRsYXllcnMucHVzaCh7XG5cdFx0XHRcdHNlY3Rpb25EaXZpZGVyOiB7XG5cdFx0XHRcdFx0dHlwZTogYy5vcGVuZWQgPT09IGZhbHNlID8gU2VjdGlvbkRpdmlkZXJUeXBlLkNsb3NlZEZvbGRlciA6IFNlY3Rpb25EaXZpZGVyVHlwZS5PcGVuRm9sZGVyLFxuXHRcdFx0XHRcdGtleTogZnJvbUJsZW5kTW9kZVtjLmJsZW5kTW9kZSFdIHx8ICdwYXNzJyxcblx0XHRcdFx0XHRzdWJUeXBlOiAwLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHQuLi5jLFxuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGxheWVycy5wdXNoKHsgLi4uYyB9KTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVzaXplQnVmZmVyKHdyaXRlcjogUHNkV3JpdGVyLCBzaXplOiBudW1iZXIpIHtcblx0bGV0IG5ld0xlbmd0aCA9IHdyaXRlci5idWZmZXIuYnl0ZUxlbmd0aDtcblxuXHRkbyB7XG5cdFx0bmV3TGVuZ3RoICo9IDI7XG5cdH0gd2hpbGUgKHNpemUgPiBuZXdMZW5ndGgpO1xuXG5cdGNvbnN0IG5ld0J1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihuZXdMZW5ndGgpO1xuXHRjb25zdCBuZXdCeXRlcyA9IG5ldyBVaW50OEFycmF5KG5ld0J1ZmZlcik7XG5cdGNvbnN0IG9sZEJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkod3JpdGVyLmJ1ZmZlcik7XG5cdG5ld0J5dGVzLnNldChvbGRCeXRlcyk7XG5cdHdyaXRlci5idWZmZXIgPSBuZXdCdWZmZXI7XG5cdHdyaXRlci52aWV3ID0gbmV3IERhdGFWaWV3KHdyaXRlci5idWZmZXIpO1xufVxuXG5mdW5jdGlvbiBlbnN1cmVTaXplKHdyaXRlcjogUHNkV3JpdGVyLCBzaXplOiBudW1iZXIpIHtcblx0aWYgKHNpemUgPiB3cml0ZXIuYnVmZmVyLmJ5dGVMZW5ndGgpIHtcblx0XHRyZXNpemVCdWZmZXIod3JpdGVyLCBzaXplKTtcblx0fVxufVxuXG5mdW5jdGlvbiBhZGRTaXplKHdyaXRlcjogUHNkV3JpdGVyLCBzaXplOiBudW1iZXIpIHtcblx0Y29uc3Qgb2Zmc2V0ID0gd3JpdGVyLm9mZnNldDtcblx0ZW5zdXJlU2l6ZSh3cml0ZXIsIHdyaXRlci5vZmZzZXQgKz0gc2l6ZSk7XG5cdHJldHVybiBvZmZzZXQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVRodW1ibmFpbChwc2Q6IFBzZCkge1xuXHRjb25zdCBjYW52YXMgPSBjcmVhdGVDYW52YXMoMTAsIDEwKTtcblx0bGV0IHNjYWxlID0gMTtcblxuXHRpZiAocHNkLndpZHRoID4gcHNkLmhlaWdodCkge1xuXHRcdGNhbnZhcy53aWR0aCA9IDE2MDtcblx0XHRjYW52YXMuaGVpZ2h0ID0gTWF0aC5mbG9vcihwc2QuaGVpZ2h0ICogKGNhbnZhcy53aWR0aCAvIHBzZC53aWR0aCkpO1xuXHRcdHNjYWxlID0gY2FudmFzLndpZHRoIC8gcHNkLndpZHRoO1xuXHR9IGVsc2Uge1xuXHRcdGNhbnZhcy5oZWlnaHQgPSAxNjA7XG5cdFx0Y2FudmFzLndpZHRoID0gTWF0aC5mbG9vcihwc2Qud2lkdGggKiAoY2FudmFzLmhlaWdodCAvIHBzZC5oZWlnaHQpKTtcblx0XHRzY2FsZSA9IGNhbnZhcy5oZWlnaHQgLyBwc2QuaGVpZ2h0O1xuXHR9XG5cblx0Y29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcblx0Y29udGV4dC5zY2FsZShzY2FsZSwgc2NhbGUpO1xuXG5cdGlmIChwc2QuaW1hZ2VEYXRhKSB7XG5cdFx0Y29uc3QgdGVtcCA9IGNyZWF0ZUNhbnZhcyhwc2QuaW1hZ2VEYXRhLndpZHRoLCBwc2QuaW1hZ2VEYXRhLmhlaWdodCk7XG5cdFx0dGVtcC5nZXRDb250ZXh0KCcyZCcpIS5wdXRJbWFnZURhdGEocHNkLmltYWdlRGF0YSwgMCwgMCk7XG5cdFx0Y29udGV4dC5kcmF3SW1hZ2UodGVtcCwgMCwgMCk7XG5cdH0gZWxzZSBpZiAocHNkLmNhbnZhcykge1xuXHRcdGNvbnRleHQuZHJhd0ltYWdlKHBzZC5jYW52YXMsIDAsIDApO1xuXHR9XG5cblx0cmV0dXJuIGNhbnZhcztcbn1cblxuZnVuY3Rpb24gZ2V0Q2hhbm5lbHMoXG5cdHRlbXBCdWZmZXI6IFVpbnQ4QXJyYXksIGxheWVyOiBMYXllciwgYmFja2dyb3VuZDogYm9vbGVhbiwgb3B0aW9uczogV3JpdGVPcHRpb25zXG4pOiBMYXllckNoYW5uZWxEYXRhIHtcblx0Y29uc3QgbGF5ZXJEYXRhID0gZ2V0TGF5ZXJDaGFubmVscyh0ZW1wQnVmZmVyLCBsYXllciwgYmFja2dyb3VuZCwgb3B0aW9ucyk7XG5cdGNvbnN0IG1hc2sgPSBsYXllci5tYXNrO1xuXG5cdGlmIChtYXNrKSB7XG5cdFx0bGV0IHRvcCA9IChtYXNrLnRvcCBhcyBhbnkpIHwgMDtcblx0XHRsZXQgbGVmdCA9IChtYXNrLmxlZnQgYXMgYW55KSB8IDA7XG5cdFx0bGV0IHJpZ2h0ID0gKG1hc2sucmlnaHQgYXMgYW55KSB8IDA7XG5cdFx0bGV0IGJvdHRvbSA9IChtYXNrLmJvdHRvbSBhcyBhbnkpIHwgMDtcblx0XHRsZXQgeyB3aWR0aCwgaGVpZ2h0IH0gPSBnZXRMYXllckRpbWVudGlvbnMobWFzayk7XG5cdFx0bGV0IGltYWdlRGF0YSA9IG1hc2suaW1hZ2VEYXRhO1xuXG5cdFx0aWYgKCFpbWFnZURhdGEgJiYgbWFzay5jYW52YXMgJiYgd2lkdGggJiYgaGVpZ2h0KSB7XG5cdFx0XHRpbWFnZURhdGEgPSBtYXNrLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpIS5nZXRJbWFnZURhdGEoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG5cdFx0fVxuXG5cdFx0aWYgKHdpZHRoICYmIGhlaWdodCAmJiBpbWFnZURhdGEpIHtcblx0XHRcdHJpZ2h0ID0gbGVmdCArIHdpZHRoO1xuXHRcdFx0Ym90dG9tID0gdG9wICsgaGVpZ2h0O1xuXG5cdFx0XHRpZiAoaW1hZ2VEYXRhLndpZHRoICE9PSB3aWR0aCB8fCBpbWFnZURhdGEuaGVpZ2h0ICE9PSBoZWlnaHQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGltYWdlRGF0YSBkaW1lbnRpb25zJyk7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBidWZmZXI6IFVpbnQ4QXJyYXk7XG5cdFx0XHRsZXQgY29tcHJlc3Npb246IENvbXByZXNzaW9uO1xuXG5cdFx0XHRpZiAoUkFXX0lNQUdFX0RBVEEgJiYgKGxheWVyIGFzIGFueSkubWFza0RhdGFSYXcpIHtcblx0XHRcdFx0Ly8gY29uc29sZS5sb2coJ3dyaXR0ZW4gcmF3IGxheWVyIGltYWdlIGRhdGEnKTtcblx0XHRcdFx0YnVmZmVyID0gKGxheWVyIGFzIGFueSkubWFza0RhdGFSYXc7XG5cdFx0XHRcdGNvbXByZXNzaW9uID0gQ29tcHJlc3Npb24uUmxlQ29tcHJlc3NlZDtcblx0XHRcdH0gZWxzZSBpZiAob3B0aW9ucy5jb21wcmVzcykge1xuXHRcdFx0XHRidWZmZXIgPSB3cml0ZURhdGFaaXBXaXRob3V0UHJlZGljdGlvbihpbWFnZURhdGEsIFswXSk7XG5cdFx0XHRcdGNvbXByZXNzaW9uID0gQ29tcHJlc3Npb24uWmlwV2l0aG91dFByZWRpY3Rpb247XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRidWZmZXIgPSB3cml0ZURhdGFSTEUodGVtcEJ1ZmZlciwgaW1hZ2VEYXRhLCBbMF0sICEhb3B0aW9ucy5wc2IpITtcblx0XHRcdFx0Y29tcHJlc3Npb24gPSBDb21wcmVzc2lvbi5SbGVDb21wcmVzc2VkO1xuXHRcdFx0fVxuXG5cdFx0XHRsYXllckRhdGEubWFzayA9IHsgdG9wLCBsZWZ0LCByaWdodCwgYm90dG9tIH07XG5cdFx0XHRsYXllckRhdGEuY2hhbm5lbHMucHVzaCh7IGNoYW5uZWxJZDogQ2hhbm5lbElELlVzZXJNYXNrLCBjb21wcmVzc2lvbiwgYnVmZmVyLCBsZW5ndGg6IDIgKyBidWZmZXIubGVuZ3RoIH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsYXllckRhdGEubWFzayA9IHsgdG9wOiAwLCBsZWZ0OiAwLCByaWdodDogMCwgYm90dG9tOiAwIH07XG5cdFx0XHRsYXllckRhdGEuY2hhbm5lbHMucHVzaCh7IGNoYW5uZWxJZDogQ2hhbm5lbElELlVzZXJNYXNrLCBjb21wcmVzc2lvbjogQ29tcHJlc3Npb24uUmF3RGF0YSwgYnVmZmVyOiBuZXcgVWludDhBcnJheSgwKSwgbGVuZ3RoOiAwIH0pO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBsYXllckRhdGE7XG59XG5cbmZ1bmN0aW9uIGdldExheWVyRGltZW50aW9ucyh7IGNhbnZhcywgaW1hZ2VEYXRhIH06IExheWVyKTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlcjsgfSB7XG5cdHJldHVybiBpbWFnZURhdGEgfHwgY2FudmFzIHx8IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9O1xufVxuXG5mdW5jdGlvbiBjcm9wSW1hZ2VEYXRhKGRhdGE6IEltYWdlRGF0YSwgbGVmdDogbnVtYmVyLCB0b3A6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpIHtcblx0Y29uc3QgY3JvcHBlZERhdGEgPSBjcmVhdGVJbWFnZURhdGEod2lkdGgsIGhlaWdodCk7XG5cdGNvbnN0IHNyY0RhdGEgPSBkYXRhLmRhdGE7XG5cdGNvbnN0IGRzdERhdGEgPSBjcm9wcGVkRGF0YS5kYXRhO1xuXG5cdGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcblx0XHRmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcblx0XHRcdGxldCBzcmMgPSAoKHggKyBsZWZ0KSArICh5ICsgdG9wKSAqIHdpZHRoKSAqIDQ7XG5cdFx0XHRsZXQgZHN0ID0gKHggKyB5ICogd2lkdGgpICogNDtcblx0XHRcdGRzdERhdGFbZHN0XSA9IHNyY0RhdGFbc3JjXTtcblx0XHRcdGRzdERhdGFbZHN0ICsgMV0gPSBzcmNEYXRhW3NyYyArIDFdO1xuXHRcdFx0ZHN0RGF0YVtkc3QgKyAyXSA9IHNyY0RhdGFbc3JjICsgMl07XG5cdFx0XHRkc3REYXRhW2RzdCArIDNdID0gc3JjRGF0YVtzcmMgKyAzXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gY3JvcHBlZERhdGE7XG59XG5cbmZ1bmN0aW9uIGdldExheWVyQ2hhbm5lbHMoXG5cdHRlbXBCdWZmZXI6IFVpbnQ4QXJyYXksIGxheWVyOiBMYXllciwgYmFja2dyb3VuZDogYm9vbGVhbiwgb3B0aW9uczogV3JpdGVPcHRpb25zXG4pOiBMYXllckNoYW5uZWxEYXRhIHtcblx0bGV0IHRvcCA9IChsYXllci50b3AgYXMgYW55KSB8IDA7XG5cdGxldCBsZWZ0ID0gKGxheWVyLmxlZnQgYXMgYW55KSB8IDA7XG5cdGxldCByaWdodCA9IChsYXllci5yaWdodCBhcyBhbnkpIHwgMDtcblx0bGV0IGJvdHRvbSA9IChsYXllci5ib3R0b20gYXMgYW55KSB8IDA7XG5cdGxldCBjaGFubmVsczogQ2hhbm5lbERhdGFbXSA9IFtcblx0XHR7IGNoYW5uZWxJZDogQ2hhbm5lbElELlRyYW5zcGFyZW5jeSwgY29tcHJlc3Npb246IENvbXByZXNzaW9uLlJhd0RhdGEsIGJ1ZmZlcjogdW5kZWZpbmVkLCBsZW5ndGg6IDIgfSxcblx0XHR7IGNoYW5uZWxJZDogQ2hhbm5lbElELkNvbG9yMCwgY29tcHJlc3Npb246IENvbXByZXNzaW9uLlJhd0RhdGEsIGJ1ZmZlcjogdW5kZWZpbmVkLCBsZW5ndGg6IDIgfSxcblx0XHR7IGNoYW5uZWxJZDogQ2hhbm5lbElELkNvbG9yMSwgY29tcHJlc3Npb246IENvbXByZXNzaW9uLlJhd0RhdGEsIGJ1ZmZlcjogdW5kZWZpbmVkLCBsZW5ndGg6IDIgfSxcblx0XHR7IGNoYW5uZWxJZDogQ2hhbm5lbElELkNvbG9yMiwgY29tcHJlc3Npb246IENvbXByZXNzaW9uLlJhd0RhdGEsIGJ1ZmZlcjogdW5kZWZpbmVkLCBsZW5ndGg6IDIgfSxcblx0XTtcblx0bGV0IHsgd2lkdGgsIGhlaWdodCB9ID0gZ2V0TGF5ZXJEaW1lbnRpb25zKGxheWVyKTtcblxuXHRpZiAoIShsYXllci5jYW52YXMgfHwgbGF5ZXIuaW1hZ2VEYXRhKSB8fCAhd2lkdGggfHwgIWhlaWdodCkge1xuXHRcdHJpZ2h0ID0gbGVmdDtcblx0XHRib3R0b20gPSB0b3A7XG5cdFx0cmV0dXJuIHsgbGF5ZXIsIHRvcCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgY2hhbm5lbHMgfTtcblx0fVxuXG5cdHJpZ2h0ID0gbGVmdCArIHdpZHRoO1xuXHRib3R0b20gPSB0b3AgKyBoZWlnaHQ7XG5cblx0bGV0IGRhdGEgPSBsYXllci5pbWFnZURhdGEgfHwgbGF5ZXIuY2FudmFzIS5nZXRDb250ZXh0KCcyZCcpIS5nZXRJbWFnZURhdGEoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG5cblx0aWYgKG9wdGlvbnMudHJpbUltYWdlRGF0YSkge1xuXHRcdGNvbnN0IHRyaW1tZWQgPSB0cmltRGF0YShkYXRhKTtcblxuXHRcdGlmICh0cmltbWVkLmxlZnQgIT09IDAgfHwgdHJpbW1lZC50b3AgIT09IDAgfHwgdHJpbW1lZC5yaWdodCAhPT0gZGF0YS53aWR0aCB8fCB0cmltbWVkLmJvdHRvbSAhPT0gZGF0YS5oZWlnaHQpIHtcblx0XHRcdGxlZnQgKz0gdHJpbW1lZC5sZWZ0O1xuXHRcdFx0dG9wICs9IHRyaW1tZWQudG9wO1xuXHRcdFx0cmlnaHQgLT0gKGRhdGEud2lkdGggLSB0cmltbWVkLnJpZ2h0KTtcblx0XHRcdGJvdHRvbSAtPSAoZGF0YS5oZWlnaHQgLSB0cmltbWVkLmJvdHRvbSk7XG5cdFx0XHR3aWR0aCA9IHJpZ2h0IC0gbGVmdDtcblx0XHRcdGhlaWdodCA9IGJvdHRvbSAtIHRvcDtcblxuXHRcdFx0aWYgKCF3aWR0aCB8fCAhaGVpZ2h0KSB7XG5cdFx0XHRcdHJldHVybiB7IGxheWVyLCB0b3AsIGxlZnQsIHJpZ2h0LCBib3R0b20sIGNoYW5uZWxzIH07XG5cdFx0XHR9XG5cblx0XHRcdGlmIChsYXllci5pbWFnZURhdGEpIHtcblx0XHRcdFx0ZGF0YSA9IGNyb3BJbWFnZURhdGEoZGF0YSwgdHJpbW1lZC5sZWZ0LCB0cmltbWVkLnRvcCwgd2lkdGgsIGhlaWdodCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkYXRhID0gbGF5ZXIuY2FudmFzIS5nZXRDb250ZXh0KCcyZCcpIS5nZXRJbWFnZURhdGEodHJpbW1lZC5sZWZ0LCB0cmltbWVkLnRvcCwgd2lkdGgsIGhlaWdodCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Y29uc3QgY2hhbm5lbElkcyA9IFtcblx0XHRDaGFubmVsSUQuQ29sb3IwLFxuXHRcdENoYW5uZWxJRC5Db2xvcjEsXG5cdFx0Q2hhbm5lbElELkNvbG9yMixcblx0XTtcblxuXHRpZiAoIWJhY2tncm91bmQgfHwgb3B0aW9ucy5ub0JhY2tncm91bmQgfHwgbGF5ZXIubWFzayB8fCBoYXNBbHBoYShkYXRhKSB8fCAoUkFXX0lNQUdFX0RBVEEgJiYgKGxheWVyIGFzIGFueSkuaW1hZ2VEYXRhUmF3Py5bJy0xJ10pKSB7XG5cdFx0Y2hhbm5lbElkcy51bnNoaWZ0KENoYW5uZWxJRC5UcmFuc3BhcmVuY3kpO1xuXHR9XG5cblx0Y2hhbm5lbHMgPSBjaGFubmVsSWRzLm1hcChjaGFubmVsSWQgPT4ge1xuXHRcdGNvbnN0IG9mZnNldCA9IG9mZnNldEZvckNoYW5uZWwoY2hhbm5lbElkLCBmYWxzZSk7IC8vIFRPRE86IHBzZC5jb2xvck1vZGUgPT09IENvbG9yTW9kZS5DTVlLKTtcblx0XHRsZXQgYnVmZmVyOiBVaW50OEFycmF5O1xuXHRcdGxldCBjb21wcmVzc2lvbjogQ29tcHJlc3Npb247XG5cblx0XHRpZiAoUkFXX0lNQUdFX0RBVEEgJiYgKGxheWVyIGFzIGFueSkuaW1hZ2VEYXRhUmF3KSB7XG5cdFx0XHQvLyBjb25zb2xlLmxvZygnd3JpdHRlbiByYXcgbGF5ZXIgaW1hZ2UgZGF0YScpO1xuXHRcdFx0YnVmZmVyID0gKGxheWVyIGFzIGFueSkuaW1hZ2VEYXRhUmF3W2NoYW5uZWxJZF07XG5cdFx0XHRjb21wcmVzc2lvbiA9IENvbXByZXNzaW9uLlJsZUNvbXByZXNzZWQ7XG5cdFx0fSBlbHNlIGlmIChvcHRpb25zLmNvbXByZXNzKSB7XG5cdFx0XHRidWZmZXIgPSB3cml0ZURhdGFaaXBXaXRob3V0UHJlZGljdGlvbihkYXRhLCBbb2Zmc2V0XSk7XG5cdFx0XHRjb21wcmVzc2lvbiA9IENvbXByZXNzaW9uLlppcFdpdGhvdXRQcmVkaWN0aW9uO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRidWZmZXIgPSB3cml0ZURhdGFSTEUodGVtcEJ1ZmZlciwgZGF0YSwgW29mZnNldF0sICEhb3B0aW9ucy5wc2IpITtcblx0XHRcdGNvbXByZXNzaW9uID0gQ29tcHJlc3Npb24uUmxlQ29tcHJlc3NlZDtcblx0XHR9XG5cblx0XHRyZXR1cm4geyBjaGFubmVsSWQsIGNvbXByZXNzaW9uLCBidWZmZXIsIGxlbmd0aDogMiArIGJ1ZmZlci5sZW5ndGggfTtcblx0fSk7XG5cblx0cmV0dXJuIHsgbGF5ZXIsIHRvcCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgY2hhbm5lbHMgfTtcbn1cblxuZnVuY3Rpb24gaXNSb3dFbXB0eSh7IGRhdGEsIHdpZHRoIH06IFBpeGVsRGF0YSwgeTogbnVtYmVyLCBsZWZ0OiBudW1iZXIsIHJpZ2h0OiBudW1iZXIpIHtcblx0Y29uc3Qgc3RhcnQgPSAoKHkgKiB3aWR0aCArIGxlZnQpICogNCArIDMpIHwgMDtcblx0Y29uc3QgZW5kID0gKHN0YXJ0ICsgKHJpZ2h0IC0gbGVmdCkgKiA0KSB8IDA7XG5cblx0Zm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpID0gKGkgKyA0KSB8IDApIHtcblx0XHRpZiAoZGF0YVtpXSAhPT0gMCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBpc0NvbEVtcHR5KHsgZGF0YSwgd2lkdGggfTogUGl4ZWxEYXRhLCB4OiBudW1iZXIsIHRvcDogbnVtYmVyLCBib3R0b206IG51bWJlcikge1xuXHRjb25zdCBzdHJpZGUgPSAod2lkdGggKiA0KSB8IDA7XG5cdGNvbnN0IHN0YXJ0ID0gKHRvcCAqIHN0cmlkZSArIHggKiA0ICsgMykgfCAwO1xuXG5cdGZvciAobGV0IHkgPSB0b3AsIGkgPSBzdGFydDsgeSA8IGJvdHRvbTsgeSsrLCBpID0gKGkgKyBzdHJpZGUpIHwgMCkge1xuXHRcdGlmIChkYXRhW2ldICE9PSAwKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHRyaW1EYXRhKGRhdGE6IFBpeGVsRGF0YSkge1xuXHRsZXQgdG9wID0gMDtcblx0bGV0IGxlZnQgPSAwO1xuXHRsZXQgcmlnaHQgPSBkYXRhLndpZHRoO1xuXHRsZXQgYm90dG9tID0gZGF0YS5oZWlnaHQ7XG5cblx0d2hpbGUgKHRvcCA8IGJvdHRvbSAmJiBpc1Jvd0VtcHR5KGRhdGEsIHRvcCwgbGVmdCwgcmlnaHQpKVxuXHRcdHRvcCsrO1xuXHR3aGlsZSAoYm90dG9tID4gdG9wICYmIGlzUm93RW1wdHkoZGF0YSwgYm90dG9tIC0gMSwgbGVmdCwgcmlnaHQpKVxuXHRcdGJvdHRvbS0tO1xuXHR3aGlsZSAobGVmdCA8IHJpZ2h0ICYmIGlzQ29sRW1wdHkoZGF0YSwgbGVmdCwgdG9wLCBib3R0b20pKVxuXHRcdGxlZnQrKztcblx0d2hpbGUgKHJpZ2h0ID4gbGVmdCAmJiBpc0NvbEVtcHR5KGRhdGEsIHJpZ2h0IC0gMSwgdG9wLCBib3R0b20pKVxuXHRcdHJpZ2h0LS07XG5cblx0cmV0dXJuIHsgdG9wLCBsZWZ0LCByaWdodCwgYm90dG9tIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUNvbG9yKHdyaXRlcjogUHNkV3JpdGVyLCBjb2xvcjogQ29sb3IgfCB1bmRlZmluZWQpIHtcblx0aWYgKCFjb2xvcikge1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgQ29sb3JTcGFjZS5SR0IpO1xuXHRcdHdyaXRlWmVyb3Mod3JpdGVyLCA4KTtcblx0fSBlbHNlIGlmICgncicgaW4gY29sb3IpIHtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIENvbG9yU3BhY2UuUkdCKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgucm91bmQoY29sb3IuciAqIDI1NykpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci5nICogMjU3KSk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmIgKiAyNTcpKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDApO1xuXHR9IGVsc2UgaWYgKCdsJyBpbiBjb2xvcikge1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgQ29sb3JTcGFjZS5MYWIpO1xuXHRcdHdyaXRlSW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmwgKiAxMDAwMCkpO1xuXHRcdHdyaXRlSW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmEgPCAwID8gKGNvbG9yLmEgKiAxMjgwMCkgOiAoY29sb3IuYSAqIDEyNzAwKSkpO1xuXHRcdHdyaXRlSW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmIgPCAwID8gKGNvbG9yLmIgKiAxMjgwMCkgOiAoY29sb3IuYiAqIDEyNzAwKSkpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMCk7XG5cdH0gZWxzZSBpZiAoJ2gnIGluIGNvbG9yKSB7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBDb2xvclNwYWNlLkhTQik7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmggKiAweGZmZmYpKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgucm91bmQoY29sb3IucyAqIDB4ZmZmZikpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci5iICogMHhmZmZmKSk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAwKTtcblx0fSBlbHNlIGlmICgnYycgaW4gY29sb3IpIHtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIENvbG9yU3BhY2UuQ01ZSyk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmMgKiAyNTcpKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgucm91bmQoY29sb3IubSAqIDI1NykpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci55ICogMjU3KSk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmsgKiAyNTcpKTtcblx0fSBlbHNlIHtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIENvbG9yU3BhY2UuR3JheXNjYWxlKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgucm91bmQoY29sb3IuayAqIDEwMDAwIC8gMjU1KSk7XG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDYpO1xuXHR9XG59XG4iXSwic291cmNlUm9vdCI6IkM6XFxQcm9qZWN0c1xcZ2l0aHViXFxhZy1wc2RcXHNyYyJ9
