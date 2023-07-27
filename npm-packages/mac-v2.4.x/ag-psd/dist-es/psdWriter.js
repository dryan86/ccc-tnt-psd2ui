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
import { hasAlpha, createCanvas, writeDataRLE, offsetForChannel, createImageData, fromBlendMode, clamp, largeAdditionalInfoKeys, RAW_IMAGE_DATA, writeDataZipWithoutPrediction } from './helpers';
import { hasMultiEffects, infoHandlers } from './additionalInfo';
import { resourceHandlers } from './imageResources';
export function createWriter(size) {
    if (size === void 0) { size = 4096; }
    var buffer = new ArrayBuffer(size);
    var view = new DataView(buffer);
    var offset = 0;
    return { buffer: buffer, view: view, offset: offset };
}
export function getWriterBuffer(writer) {
    return writer.buffer.slice(0, writer.offset);
}
export function getWriterBufferNoCopy(writer) {
    return new Uint8Array(writer.buffer, 0, writer.offset);
}
export function writeUint8(writer, value) {
    var offset = addSize(writer, 1);
    writer.view.setUint8(offset, value);
}
export function writeInt16(writer, value) {
    var offset = addSize(writer, 2);
    writer.view.setInt16(offset, value, false);
}
export function writeUint16(writer, value) {
    var offset = addSize(writer, 2);
    writer.view.setUint16(offset, value, false);
}
export function writeInt32(writer, value) {
    var offset = addSize(writer, 4);
    writer.view.setInt32(offset, value, false);
}
export function writeUint32(writer, value) {
    var offset = addSize(writer, 4);
    writer.view.setUint32(offset, value, false);
}
export function writeFloat32(writer, value) {
    var offset = addSize(writer, 4);
    writer.view.setFloat32(offset, value, false);
}
export function writeFloat64(writer, value) {
    var offset = addSize(writer, 8);
    writer.view.setFloat64(offset, value, false);
}
// 32-bit fixed-point number 16.16
export function writeFixedPoint32(writer, value) {
    writeInt32(writer, value * (1 << 16));
}
// 32-bit fixed-point number 8.24
export function writeFixedPointPath32(writer, value) {
    writeInt32(writer, value * (1 << 24));
}
export function writeBytes(writer, buffer) {
    if (buffer) {
        ensureSize(writer, writer.offset + buffer.length);
        var bytes = new Uint8Array(writer.buffer);
        bytes.set(buffer, writer.offset);
        writer.offset += buffer.length;
    }
}
export function writeZeros(writer, count) {
    for (var i = 0; i < count; i++) {
        writeUint8(writer, 0);
    }
}
export function writeSignature(writer, signature) {
    if (signature.length !== 4)
        throw new Error("Invalid signature: '".concat(signature, "'"));
    for (var i = 0; i < 4; i++) {
        writeUint8(writer, signature.charCodeAt(i));
    }
}
export function writePascalString(writer, text, padTo) {
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
export function writeUnicodeString(writer, text) {
    writeUint32(writer, text.length);
    for (var i = 0; i < text.length; i++) {
        writeUint16(writer, text.charCodeAt(i));
    }
}
export function writeUnicodeStringWithPadding(writer, text) {
    writeUint32(writer, text.length + 1);
    for (var i = 0; i < text.length; i++) {
        writeUint16(writer, text.charCodeAt(i));
    }
    writeUint16(writer, 0);
}
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
export function writeSection(writer, round, func, writeTotalLength, large) {
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
export function writePsd(writer, psd, options) {
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
    var globalAlpha = !!imageData && hasAlpha(imageData);
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
        for (var _i = 0, resourceHandlers_1 = resourceHandlers; _i < resourceHandlers_1.length; _i++) {
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
    if (RAW_IMAGE_DATA && psd.imageDataRaw) {
        console.log('writing raw image data');
        writeBytes(writer, psd.imageDataRaw);
    }
    else {
        writeBytes(writer, writeDataRLE(tempBuffer, data, channels, !!options.psb));
    }
}
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
            writeSignature(writer, fromBlendMode[layer.blendMode] || 'norm');
            writeUint8(writer, Math.round(clamp((_a = layer.opacity) !== null && _a !== void 0 ? _a : 1, 0, 1) * 255));
            writeUint8(writer, layer.clipping ? 1 : 0);
            var flags = 0x08; // 1 for Photoshop 5.0 and later, tells if bit 4 has useful information
            if (layer.transparencyProtected)
                flags |= 0x01;
            if (layer.hidden)
                flags |= 0x02;
            if (layer.vectorMask || (layer.sectionDivider && layer.sectionDivider.type !== 0 /* SectionDividerType.Other */)) {
                flags |= 0x10; // pixel data irrelevant to appearance of document
            }
            if (layer.effects && hasMultiEffects(layer.effects)) { // TODO: this is not correct
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
            var large = options.psb && largeAdditionalInfoKeys.indexOf(key) !== -1;
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
    for (var _i = 0, infoHandlers_1 = infoHandlers; _i < infoHandlers_1.length; _i++) {
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
                    key: fromBlendMode[c.blendMode] || 'pass',
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
    var canvas = createCanvas(10, 10);
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
        var temp = createCanvas(psd.imageData.width, psd.imageData.height);
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
            if (RAW_IMAGE_DATA && layer.maskDataRaw) {
                // console.log('written raw layer image data');
                buffer = layer.maskDataRaw;
                compression = 1 /* Compression.RleCompressed */;
            }
            else if (options.compress) {
                buffer = writeDataZipWithoutPrediction(imageData, [0]);
                compression = 2 /* Compression.ZipWithoutPrediction */;
            }
            else {
                buffer = writeDataRLE(tempBuffer, imageData, [0], !!options.psb);
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
    var croppedData = createImageData(width, height);
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
    if (!background || options.noBackground || layer.mask || hasAlpha(data) || (RAW_IMAGE_DATA && ((_a = layer.imageDataRaw) === null || _a === void 0 ? void 0 : _a['-1']))) {
        channelIds.unshift(-1 /* ChannelID.Transparency */);
    }
    channels = channelIds.map(function (channelId) {
        var offset = offsetForChannel(channelId, false); // TODO: psd.colorMode === ColorMode.CMYK);
        var buffer;
        var compression;
        if (RAW_IMAGE_DATA && layer.imageDataRaw) {
            // console.log('written raw layer image data');
            buffer = layer.imageDataRaw[channelId];
            compression = 1 /* Compression.RleCompressed */;
        }
        else if (options.compress) {
            buffer = writeDataZipWithoutPrediction(data, [offset]);
            compression = 2 /* Compression.ZipWithoutPrediction */;
        }
        else {
            buffer = writeDataRLE(tempBuffer, data, [offset], !!options.psb);
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
export function writeColor(writer, color) {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDbEQsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztLQUN2QjtTQUFNLElBQUksR0FBRyxJQUFJLEtBQUssRUFBRTtRQUN4QixXQUFXLENBQUMsTUFBTSwwQkFBa0IsQ0FBQztRQUNyQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQy9DLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0MsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMvQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQy9DO1NBQU07UUFDTixXQUFXLENBQUMsTUFBTSwrQkFBdUIsQ0FBQztRQUMxQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN2RCxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3RCO0FBQ0YsQ0FBQyIsImZpbGUiOiJwc2RXcml0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQc2QsIExheWVyLCBMYXllckFkZGl0aW9uYWxJbmZvLCBDb2xvck1vZGUsIFNlY3Rpb25EaXZpZGVyVHlwZSwgV3JpdGVPcHRpb25zLCBDb2xvciwgR2xvYmFsTGF5ZXJNYXNrSW5mbyB9IGZyb20gJy4vcHNkJztcbmltcG9ydCB7XG5cdGhhc0FscGhhLCBjcmVhdGVDYW52YXMsIHdyaXRlRGF0YVJMRSwgUGl4ZWxEYXRhLCBMYXllckNoYW5uZWxEYXRhLCBDaGFubmVsRGF0YSxcblx0b2Zmc2V0Rm9yQ2hhbm5lbCwgY3JlYXRlSW1hZ2VEYXRhLCBmcm9tQmxlbmRNb2RlLCBDaGFubmVsSUQsIENvbXByZXNzaW9uLCBjbGFtcCxcblx0TGF5ZXJNYXNrRmxhZ3MsIE1hc2tQYXJhbXMsIENvbG9yU3BhY2UsIEJvdW5kcywgbGFyZ2VBZGRpdGlvbmFsSW5mb0tleXMsIFJBV19JTUFHRV9EQVRBLCB3cml0ZURhdGFaaXBXaXRob3V0UHJlZGljdGlvblxufSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgRXh0ZW5kZWRXcml0ZU9wdGlvbnMsIGhhc011bHRpRWZmZWN0cywgaW5mb0hhbmRsZXJzIH0gZnJvbSAnLi9hZGRpdGlvbmFsSW5mbyc7XG5pbXBvcnQgeyByZXNvdXJjZUhhbmRsZXJzIH0gZnJvbSAnLi9pbWFnZVJlc291cmNlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHNkV3JpdGVyIHtcblx0b2Zmc2V0OiBudW1iZXI7XG5cdGJ1ZmZlcjogQXJyYXlCdWZmZXI7XG5cdHZpZXc6IERhdGFWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlV3JpdGVyKHNpemUgPSA0MDk2KTogUHNkV3JpdGVyIHtcblx0Y29uc3QgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHNpemUpO1xuXHRjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG5cdGNvbnN0IG9mZnNldCA9IDA7XG5cdHJldHVybiB7IGJ1ZmZlciwgdmlldywgb2Zmc2V0IH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXcml0ZXJCdWZmZXIod3JpdGVyOiBQc2RXcml0ZXIpIHtcblx0cmV0dXJuIHdyaXRlci5idWZmZXIuc2xpY2UoMCwgd3JpdGVyLm9mZnNldCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXcml0ZXJCdWZmZXJOb0NvcHkod3JpdGVyOiBQc2RXcml0ZXIpIHtcblx0cmV0dXJuIG5ldyBVaW50OEFycmF5KHdyaXRlci5idWZmZXIsIDAsIHdyaXRlci5vZmZzZXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVVaW50OCh3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IG51bWJlcikge1xuXHRjb25zdCBvZmZzZXQgPSBhZGRTaXplKHdyaXRlciwgMSk7XG5cdHdyaXRlci52aWV3LnNldFVpbnQ4KG9mZnNldCwgdmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVJbnQxNih3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IG51bWJlcikge1xuXHRjb25zdCBvZmZzZXQgPSBhZGRTaXplKHdyaXRlciwgMik7XG5cdHdyaXRlci52aWV3LnNldEludDE2KG9mZnNldCwgdmFsdWUsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlVWludDE2KHdyaXRlcjogUHNkV3JpdGVyLCB2YWx1ZTogbnVtYmVyKSB7XG5cdGNvbnN0IG9mZnNldCA9IGFkZFNpemUod3JpdGVyLCAyKTtcblx0d3JpdGVyLnZpZXcuc2V0VWludDE2KG9mZnNldCwgdmFsdWUsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlSW50MzIod3JpdGVyOiBQc2RXcml0ZXIsIHZhbHVlOiBudW1iZXIpIHtcblx0Y29uc3Qgb2Zmc2V0ID0gYWRkU2l6ZSh3cml0ZXIsIDQpO1xuXHR3cml0ZXIudmlldy5zZXRJbnQzMihvZmZzZXQsIHZhbHVlLCBmYWxzZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVVpbnQzMih3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IG51bWJlcikge1xuXHRjb25zdCBvZmZzZXQgPSBhZGRTaXplKHdyaXRlciwgNCk7XG5cdHdyaXRlci52aWV3LnNldFVpbnQzMihvZmZzZXQsIHZhbHVlLCBmYWxzZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZsb2F0MzIod3JpdGVyOiBQc2RXcml0ZXIsIHZhbHVlOiBudW1iZXIpIHtcblx0Y29uc3Qgb2Zmc2V0ID0gYWRkU2l6ZSh3cml0ZXIsIDQpO1xuXHR3cml0ZXIudmlldy5zZXRGbG9hdDMyKG9mZnNldCwgdmFsdWUsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmxvYXQ2NCh3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IG51bWJlcikge1xuXHRjb25zdCBvZmZzZXQgPSBhZGRTaXplKHdyaXRlciwgOCk7XG5cdHdyaXRlci52aWV3LnNldEZsb2F0NjQob2Zmc2V0LCB2YWx1ZSwgZmFsc2UpO1xufVxuXG4vLyAzMi1iaXQgZml4ZWQtcG9pbnQgbnVtYmVyIDE2LjE2XG5leHBvcnQgZnVuY3Rpb24gd3JpdGVGaXhlZFBvaW50MzIod3JpdGVyOiBQc2RXcml0ZXIsIHZhbHVlOiBudW1iZXIpIHtcblx0d3JpdGVJbnQzMih3cml0ZXIsIHZhbHVlICogKDEgPDwgMTYpKTtcbn1cblxuLy8gMzItYml0IGZpeGVkLXBvaW50IG51bWJlciA4LjI0XG5leHBvcnQgZnVuY3Rpb24gd3JpdGVGaXhlZFBvaW50UGF0aDMyKHdyaXRlcjogUHNkV3JpdGVyLCB2YWx1ZTogbnVtYmVyKSB7XG5cdHdyaXRlSW50MzIod3JpdGVyLCB2YWx1ZSAqICgxIDw8IDI0KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUJ5dGVzKHdyaXRlcjogUHNkV3JpdGVyLCBidWZmZXI6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQpIHtcblx0aWYgKGJ1ZmZlcikge1xuXHRcdGVuc3VyZVNpemUod3JpdGVyLCB3cml0ZXIub2Zmc2V0ICsgYnVmZmVyLmxlbmd0aCk7XG5cdFx0Y29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSh3cml0ZXIuYnVmZmVyKTtcblx0XHRieXRlcy5zZXQoYnVmZmVyLCB3cml0ZXIub2Zmc2V0KTtcblx0XHR3cml0ZXIub2Zmc2V0ICs9IGJ1ZmZlci5sZW5ndGg7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlWmVyb3Mod3JpdGVyOiBQc2RXcml0ZXIsIGNvdW50OiBudW1iZXIpIHtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIDApO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVNpZ25hdHVyZSh3cml0ZXI6IFBzZFdyaXRlciwgc2lnbmF0dXJlOiBzdHJpbmcpIHtcblx0aWYgKHNpZ25hdHVyZS5sZW5ndGggIT09IDQpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzaWduYXR1cmU6ICcke3NpZ25hdHVyZX0nYCk7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgc2lnbmF0dXJlLmNoYXJDb2RlQXQoaSkpO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVBhc2NhbFN0cmluZyh3cml0ZXI6IFBzZFdyaXRlciwgdGV4dDogc3RyaW5nLCBwYWRUbzogbnVtYmVyKSB7XG5cdGxldCBsZW5ndGggPSB0ZXh0Lmxlbmd0aDtcblx0d3JpdGVVaW50OCh3cml0ZXIsIGxlbmd0aCk7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdGNvbnN0IGNvZGUgPSB0ZXh0LmNoYXJDb2RlQXQoaSk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGNvZGUgPCAxMjggPyBjb2RlIDogJz8nLmNoYXJDb2RlQXQoMCkpO1xuXHR9XG5cblx0d2hpbGUgKCsrbGVuZ3RoICUgcGFkVG8pIHtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgMCk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlVW5pY29kZVN0cmluZyh3cml0ZXI6IFBzZFdyaXRlciwgdGV4dDogc3RyaW5nKSB7XG5cdHdyaXRlVWludDMyKHdyaXRlciwgdGV4dC5sZW5ndGgpO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgdGV4dC5jaGFyQ29kZUF0KGkpKTtcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVVbmljb2RlU3RyaW5nV2l0aFBhZGRpbmcod3JpdGVyOiBQc2RXcml0ZXIsIHRleHQ6IHN0cmluZykge1xuXHR3cml0ZVVpbnQzMih3cml0ZXIsIHRleHQubGVuZ3RoICsgMSk7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCB0ZXh0LmNoYXJDb2RlQXQoaSkpO1xuXHR9XG5cblx0d3JpdGVVaW50MTYod3JpdGVyLCAwKTtcbn1cblxuZnVuY3Rpb24gZ2V0TGFyZ2VzdExheWVyU2l6ZShsYXllcnM6IExheWVyW10gPSBbXSk6IG51bWJlciB7XG5cdGxldCBtYXggPSAwO1xuXG5cdGZvciAoY29uc3QgbGF5ZXIgb2YgbGF5ZXJzKSB7XG5cdFx0aWYgKGxheWVyLmNhbnZhcyB8fCBsYXllci5pbWFnZURhdGEpIHtcblx0XHRcdGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gZ2V0TGF5ZXJEaW1lbnRpb25zKGxheWVyKTtcblx0XHRcdG1heCA9IE1hdGgubWF4KG1heCwgMiAqIGhlaWdodCArIDIgKiB3aWR0aCAqIGhlaWdodCk7XG5cdFx0fVxuXG5cdFx0aWYgKGxheWVyLmNoaWxkcmVuKSB7XG5cdFx0XHRtYXggPSBNYXRoLm1heChtYXgsIGdldExhcmdlc3RMYXllclNpemUobGF5ZXIuY2hpbGRyZW4pKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gbWF4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVTZWN0aW9uKHdyaXRlcjogUHNkV3JpdGVyLCByb3VuZDogbnVtYmVyLCBmdW5jOiAoKSA9PiB2b2lkLCB3cml0ZVRvdGFsTGVuZ3RoID0gZmFsc2UsIGxhcmdlID0gZmFsc2UpIHtcblx0aWYgKGxhcmdlKSB3cml0ZVVpbnQzMih3cml0ZXIsIDApO1xuXHRjb25zdCBvZmZzZXQgPSB3cml0ZXIub2Zmc2V0O1xuXHR3cml0ZVVpbnQzMih3cml0ZXIsIDApO1xuXG5cdGZ1bmMoKTtcblxuXHRsZXQgbGVuZ3RoID0gd3JpdGVyLm9mZnNldCAtIG9mZnNldCAtIDQ7XG5cdGxldCBsZW4gPSBsZW5ndGg7XG5cblx0d2hpbGUgKChsZW4gJSByb3VuZCkgIT09IDApIHtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgMCk7XG5cdFx0bGVuKys7XG5cdH1cblxuXHRpZiAod3JpdGVUb3RhbExlbmd0aCkge1xuXHRcdGxlbmd0aCA9IGxlbjtcblx0fVxuXG5cdHdyaXRlci52aWV3LnNldFVpbnQzMihvZmZzZXQsIGxlbmd0aCwgZmFsc2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVQc2Qod3JpdGVyOiBQc2RXcml0ZXIsIHBzZDogUHNkLCBvcHRpb25zOiBXcml0ZU9wdGlvbnMgPSB7fSkge1xuXHRpZiAoISgrcHNkLndpZHRoID4gMCAmJiArcHNkLmhlaWdodCA+IDApKVxuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBkb2N1bWVudCBzaXplJyk7XG5cblx0aWYgKChwc2Qud2lkdGggPiAzMDAwMCB8fCBwc2QuaGVpZ2h0ID4gMzAwMDApICYmICFvcHRpb25zLnBzYilcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0RvY3VtZW50IHNpemUgaXMgdG9vIGxhcmdlIChtYXggaXMgMzAwMDB4MzAwMDAsIHVzZSBQU0IgZm9ybWF0IGluc3RlYWQpJyk7XG5cblx0bGV0IGltYWdlUmVzb3VyY2VzID0gcHNkLmltYWdlUmVzb3VyY2VzIHx8IHt9O1xuXG5cdGNvbnN0IG9wdDogRXh0ZW5kZWRXcml0ZU9wdGlvbnMgPSB7IC4uLm9wdGlvbnMsIGxheWVySWRzOiBuZXcgU2V0KCksIGxheWVyVG9JZDogbmV3IE1hcCgpIH07XG5cblx0aWYgKG9wdC5nZW5lcmF0ZVRodW1ibmFpbCkge1xuXHRcdGltYWdlUmVzb3VyY2VzID0geyAuLi5pbWFnZVJlc291cmNlcywgdGh1bWJuYWlsOiBjcmVhdGVUaHVtYm5haWwocHNkKSB9O1xuXHR9XG5cblx0bGV0IGltYWdlRGF0YSA9IHBzZC5pbWFnZURhdGE7XG5cblx0aWYgKCFpbWFnZURhdGEgJiYgcHNkLmNhbnZhcykge1xuXHRcdGltYWdlRGF0YSA9IHBzZC5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKSEuZ2V0SW1hZ2VEYXRhKDAsIDAsIHBzZC5jYW52YXMud2lkdGgsIHBzZC5jYW52YXMuaGVpZ2h0KTtcblx0fVxuXG5cdGlmIChpbWFnZURhdGEgJiYgKHBzZC53aWR0aCAhPT0gaW1hZ2VEYXRhLndpZHRoIHx8IHBzZC5oZWlnaHQgIT09IGltYWdlRGF0YS5oZWlnaHQpKVxuXHRcdHRocm93IG5ldyBFcnJvcignRG9jdW1lbnQgY2FudmFzIG11c3QgaGF2ZSB0aGUgc2FtZSBzaXplIGFzIGRvY3VtZW50Jyk7XG5cblx0Y29uc3QgZ2xvYmFsQWxwaGEgPSAhIWltYWdlRGF0YSAmJiBoYXNBbHBoYShpbWFnZURhdGEpO1xuXHRjb25zdCBtYXhCdWZmZXJTaXplID0gTWF0aC5tYXgoZ2V0TGFyZ2VzdExheWVyU2l6ZShwc2QuY2hpbGRyZW4pLCA0ICogMiAqIHBzZC53aWR0aCAqIHBzZC5oZWlnaHQgKyAyICogcHNkLmhlaWdodCk7XG5cdGNvbnN0IHRlbXBCdWZmZXIgPSBuZXcgVWludDhBcnJheShtYXhCdWZmZXJTaXplKTtcblxuXHQvLyBoZWFkZXJcblx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnOEJQUycpO1xuXHR3cml0ZVVpbnQxNih3cml0ZXIsIG9wdGlvbnMucHNiID8gMiA6IDEpOyAvLyB2ZXJzaW9uXG5cdHdyaXRlWmVyb3Mod3JpdGVyLCA2KTtcblx0d3JpdGVVaW50MTYod3JpdGVyLCBnbG9iYWxBbHBoYSA/IDQgOiAzKTsgLy8gY2hhbm5lbHNcblx0d3JpdGVVaW50MzIod3JpdGVyLCBwc2QuaGVpZ2h0KTtcblx0d3JpdGVVaW50MzIod3JpdGVyLCBwc2Qud2lkdGgpO1xuXHR3cml0ZVVpbnQxNih3cml0ZXIsIDgpOyAvLyBiaXRzIHBlciBjaGFubmVsXG5cdHdyaXRlVWludDE2KHdyaXRlciwgQ29sb3JNb2RlLlJHQik7IC8vIHdlIG9ubHkgc3VwcG9ydCBzYXZpbmcgUkdCIHJpZ2h0IG5vd1xuXG5cdC8vIGNvbG9yIG1vZGUgZGF0YVxuXHR3cml0ZVNlY3Rpb24od3JpdGVyLCAxLCAoKSA9PiB7XG5cdFx0Ly8gVE9ETzogaW1wbGVtZW50XG5cdH0pO1xuXG5cdC8vIGltYWdlIHJlc291cmNlc1xuXHR3cml0ZVNlY3Rpb24od3JpdGVyLCAxLCAoKSA9PiB7XG5cdFx0Zm9yIChjb25zdCBoYW5kbGVyIG9mIHJlc291cmNlSGFuZGxlcnMpIHtcblx0XHRcdGlmIChoYW5kbGVyLmhhcyhpbWFnZVJlc291cmNlcykpIHtcblx0XHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnOEJJTScpO1xuXHRcdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGhhbmRsZXIua2V5KTtcblx0XHRcdFx0d3JpdGVQYXNjYWxTdHJpbmcod3JpdGVyLCAnJywgMik7XG5cdFx0XHRcdHdyaXRlU2VjdGlvbih3cml0ZXIsIDIsICgpID0+IGhhbmRsZXIud3JpdGUod3JpdGVyLCBpbWFnZVJlc291cmNlcykpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0Ly8gbGF5ZXIgYW5kIG1hc2sgaW5mb1xuXHR3cml0ZVNlY3Rpb24od3JpdGVyLCAyLCAoKSA9PiB7XG5cdFx0d3JpdGVMYXllckluZm8odGVtcEJ1ZmZlciwgd3JpdGVyLCBwc2QsIGdsb2JhbEFscGhhLCBvcHQpO1xuXHRcdHdyaXRlR2xvYmFsTGF5ZXJNYXNrSW5mbyh3cml0ZXIsIHBzZC5nbG9iYWxMYXllck1hc2tJbmZvKTtcblx0XHR3cml0ZUFkZGl0aW9uYWxMYXllckluZm8od3JpdGVyLCBwc2QsIHBzZCwgb3B0KTtcblx0fSwgdW5kZWZpbmVkLCAhIW9wdC5wc2IpO1xuXG5cdC8vIGltYWdlIGRhdGFcblx0Y29uc3QgY2hhbm5lbHMgPSBnbG9iYWxBbHBoYSA/IFswLCAxLCAyLCAzXSA6IFswLCAxLCAyXTtcblx0Y29uc3QgZGF0YTogUGl4ZWxEYXRhID0gaW1hZ2VEYXRhIHx8IHtcblx0XHRkYXRhOiBuZXcgVWludDhBcnJheSg0ICogcHNkLndpZHRoICogcHNkLmhlaWdodCksXG5cdFx0d2lkdGg6IHBzZC53aWR0aCxcblx0XHRoZWlnaHQ6IHBzZC5oZWlnaHQsXG5cdH07XG5cblx0d3JpdGVVaW50MTYod3JpdGVyLCBDb21wcmVzc2lvbi5SbGVDb21wcmVzc2VkKTsgLy8gUGhvdG9zaG9wIGRvZXNuJ3Qgc3VwcG9ydCB6aXAgY29tcHJlc3Npb24gb2YgY29tcG9zaXRlIGltYWdlIGRhdGFcblxuXHRpZiAoUkFXX0lNQUdFX0RBVEEgJiYgKHBzZCBhcyBhbnkpLmltYWdlRGF0YVJhdykge1xuXHRcdGNvbnNvbGUubG9nKCd3cml0aW5nIHJhdyBpbWFnZSBkYXRhJyk7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsIChwc2QgYXMgYW55KS5pbWFnZURhdGFSYXcpO1xuXHR9IGVsc2Uge1xuXHRcdHdyaXRlQnl0ZXMod3JpdGVyLCB3cml0ZURhdGFSTEUodGVtcEJ1ZmZlciwgZGF0YSwgY2hhbm5lbHMsICEhb3B0aW9ucy5wc2IpKTtcblx0fVxufVxuXG5mdW5jdGlvbiB3cml0ZUxheWVySW5mbyh0ZW1wQnVmZmVyOiBVaW50OEFycmF5LCB3cml0ZXI6IFBzZFdyaXRlciwgcHNkOiBQc2QsIGdsb2JhbEFscGhhOiBib29sZWFuLCBvcHRpb25zOiBFeHRlbmRlZFdyaXRlT3B0aW9ucykge1xuXHR3cml0ZVNlY3Rpb24od3JpdGVyLCA0LCAoKSA9PiB7XG5cdFx0Y29uc3QgbGF5ZXJzOiBMYXllcltdID0gW107XG5cblx0XHRhZGRDaGlsZHJlbihsYXllcnMsIHBzZC5jaGlsZHJlbik7XG5cblx0XHRpZiAoIWxheWVycy5sZW5ndGgpIGxheWVycy5wdXNoKHt9KTtcblxuXHRcdHdyaXRlSW50MTYod3JpdGVyLCBnbG9iYWxBbHBoYSA/IC1sYXllcnMubGVuZ3RoIDogbGF5ZXJzLmxlbmd0aCk7XG5cblx0XHRjb25zdCBsYXllcnNEYXRhID0gbGF5ZXJzLm1hcCgobCwgaSkgPT4gZ2V0Q2hhbm5lbHModGVtcEJ1ZmZlciwgbCwgaSA9PT0gMCwgb3B0aW9ucykpO1xuXG5cdFx0Ly8gbGF5ZXIgcmVjb3Jkc1xuXHRcdGZvciAoY29uc3QgbGF5ZXJEYXRhIG9mIGxheWVyc0RhdGEpIHtcblx0XHRcdGNvbnN0IHsgbGF5ZXIsIHRvcCwgbGVmdCwgYm90dG9tLCByaWdodCwgY2hhbm5lbHMgfSA9IGxheWVyRGF0YTtcblxuXHRcdFx0d3JpdGVJbnQzMih3cml0ZXIsIHRvcCk7XG5cdFx0XHR3cml0ZUludDMyKHdyaXRlciwgbGVmdCk7XG5cdFx0XHR3cml0ZUludDMyKHdyaXRlciwgYm90dG9tKTtcblx0XHRcdHdyaXRlSW50MzIod3JpdGVyLCByaWdodCk7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGNoYW5uZWxzLmxlbmd0aCk7XG5cblx0XHRcdGZvciAoY29uc3QgYyBvZiBjaGFubmVscykge1xuXHRcdFx0XHR3cml0ZUludDE2KHdyaXRlciwgYy5jaGFubmVsSWQpO1xuXHRcdFx0XHRpZiAob3B0aW9ucy5wc2IpIHdyaXRlVWludDMyKHdyaXRlciwgMCk7XG5cdFx0XHRcdHdyaXRlVWludDMyKHdyaXRlciwgYy5sZW5ndGgpO1xuXHRcdFx0fVxuXG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIGZyb21CbGVuZE1vZGVbbGF5ZXIuYmxlbmRNb2RlIV0gfHwgJ25vcm0nKTtcblx0XHRcdHdyaXRlVWludDgod3JpdGVyLCBNYXRoLnJvdW5kKGNsYW1wKGxheWVyLm9wYWNpdHkgPz8gMSwgMCwgMSkgKiAyNTUpKTtcblx0XHRcdHdyaXRlVWludDgod3JpdGVyLCBsYXllci5jbGlwcGluZyA/IDEgOiAwKTtcblxuXHRcdFx0bGV0IGZsYWdzID0gMHgwODsgLy8gMSBmb3IgUGhvdG9zaG9wIDUuMCBhbmQgbGF0ZXIsIHRlbGxzIGlmIGJpdCA0IGhhcyB1c2VmdWwgaW5mb3JtYXRpb25cblx0XHRcdGlmIChsYXllci50cmFuc3BhcmVuY3lQcm90ZWN0ZWQpIGZsYWdzIHw9IDB4MDE7XG5cdFx0XHRpZiAobGF5ZXIuaGlkZGVuKSBmbGFncyB8PSAweDAyO1xuXHRcdFx0aWYgKGxheWVyLnZlY3Rvck1hc2sgfHwgKGxheWVyLnNlY3Rpb25EaXZpZGVyICYmIGxheWVyLnNlY3Rpb25EaXZpZGVyLnR5cGUgIT09IFNlY3Rpb25EaXZpZGVyVHlwZS5PdGhlcikpIHtcblx0XHRcdFx0ZmxhZ3MgfD0gMHgxMDsgLy8gcGl4ZWwgZGF0YSBpcnJlbGV2YW50IHRvIGFwcGVhcmFuY2Ugb2YgZG9jdW1lbnRcblx0XHRcdH1cblx0XHRcdGlmIChsYXllci5lZmZlY3RzICYmIGhhc011bHRpRWZmZWN0cyhsYXllci5lZmZlY3RzKSkgeyAvLyBUT0RPOiB0aGlzIGlzIG5vdCBjb3JyZWN0XG5cdFx0XHRcdGZsYWdzIHw9IDB4MjA7IC8vIGp1c3QgZ3Vlc3NpbmcgdGhpcyBvbmUsIG1pZ2h0IGJlIGNvbXBsZXRlbHkgaW5jb3JyZWN0XG5cdFx0XHR9XG5cdFx0XHQvLyBpZiAoJ18yJyBpbiBsYXllcikgZmxhZ3MgfD0gMHgyMDsgLy8gVEVNUCEhIVxuXG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgZmxhZ3MpO1xuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIDApOyAvLyBmaWxsZXJcblx0XHRcdHdyaXRlU2VjdGlvbih3cml0ZXIsIDEsICgpID0+IHtcblx0XHRcdFx0d3JpdGVMYXllck1hc2tEYXRhKHdyaXRlciwgbGF5ZXIsIGxheWVyRGF0YSk7XG5cdFx0XHRcdHdyaXRlTGF5ZXJCbGVuZGluZ1Jhbmdlcyh3cml0ZXIsIHBzZCk7XG5cdFx0XHRcdHdyaXRlUGFzY2FsU3RyaW5nKHdyaXRlciwgbGF5ZXIubmFtZSB8fCAnJywgNCk7XG5cdFx0XHRcdHdyaXRlQWRkaXRpb25hbExheWVySW5mbyh3cml0ZXIsIGxheWVyLCBwc2QsIG9wdGlvbnMpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gbGF5ZXIgY2hhbm5lbCBpbWFnZSBkYXRhXG5cdFx0Zm9yIChjb25zdCBsYXllckRhdGEgb2YgbGF5ZXJzRGF0YSkge1xuXHRcdFx0Zm9yIChjb25zdCBjaGFubmVsIG9mIGxheWVyRGF0YS5jaGFubmVscykge1xuXHRcdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGNoYW5uZWwuY29tcHJlc3Npb24pO1xuXG5cdFx0XHRcdGlmIChjaGFubmVsLmJ1ZmZlcikge1xuXHRcdFx0XHRcdHdyaXRlQnl0ZXMod3JpdGVyLCBjaGFubmVsLmJ1ZmZlcik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH0sIHRydWUsIG9wdGlvbnMucHNiKTtcbn1cblxuZnVuY3Rpb24gd3JpdGVMYXllck1hc2tEYXRhKHdyaXRlcjogUHNkV3JpdGVyLCB7IG1hc2sgfTogTGF5ZXIsIGxheWVyRGF0YTogTGF5ZXJDaGFubmVsRGF0YSkge1xuXHR3cml0ZVNlY3Rpb24od3JpdGVyLCAxLCAoKSA9PiB7XG5cdFx0aWYgKCFtYXNrKSByZXR1cm47XG5cblx0XHRjb25zdCBtID0gbGF5ZXJEYXRhLm1hc2sgfHwge30gYXMgUGFydGlhbDxCb3VuZHM+O1xuXHRcdHdyaXRlSW50MzIod3JpdGVyLCBtLnRvcCEpO1xuXHRcdHdyaXRlSW50MzIod3JpdGVyLCBtLmxlZnQhKTtcblx0XHR3cml0ZUludDMyKHdyaXRlciwgbS5ib3R0b20hKTtcblx0XHR3cml0ZUludDMyKHdyaXRlciwgbS5yaWdodCEpO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBtYXNrLmRlZmF1bHRDb2xvciEpO1xuXG5cdFx0bGV0IHBhcmFtcyA9IDA7XG5cdFx0aWYgKG1hc2sudXNlck1hc2tEZW5zaXR5ICE9PSB1bmRlZmluZWQpIHBhcmFtcyB8PSBNYXNrUGFyYW1zLlVzZXJNYXNrRGVuc2l0eTtcblx0XHRpZiAobWFzay51c2VyTWFza0ZlYXRoZXIgIT09IHVuZGVmaW5lZCkgcGFyYW1zIHw9IE1hc2tQYXJhbXMuVXNlck1hc2tGZWF0aGVyO1xuXHRcdGlmIChtYXNrLnZlY3Rvck1hc2tEZW5zaXR5ICE9PSB1bmRlZmluZWQpIHBhcmFtcyB8PSBNYXNrUGFyYW1zLlZlY3Rvck1hc2tEZW5zaXR5O1xuXHRcdGlmIChtYXNrLnZlY3Rvck1hc2tGZWF0aGVyICE9PSB1bmRlZmluZWQpIHBhcmFtcyB8PSBNYXNrUGFyYW1zLlZlY3Rvck1hc2tGZWF0aGVyO1xuXG5cdFx0bGV0IGZsYWdzID0gMDtcblx0XHRpZiAobWFzay5kaXNhYmxlZCkgZmxhZ3MgfD0gTGF5ZXJNYXNrRmxhZ3MuTGF5ZXJNYXNrRGlzYWJsZWQ7XG5cdFx0aWYgKG1hc2sucG9zaXRpb25SZWxhdGl2ZVRvTGF5ZXIpIGZsYWdzIHw9IExheWVyTWFza0ZsYWdzLlBvc2l0aW9uUmVsYXRpdmVUb0xheWVyO1xuXHRcdGlmIChtYXNrLmZyb21WZWN0b3JEYXRhKSBmbGFncyB8PSBMYXllck1hc2tGbGFncy5MYXllck1hc2tGcm9tUmVuZGVyaW5nT3RoZXJEYXRhO1xuXHRcdGlmIChwYXJhbXMpIGZsYWdzIHw9IExheWVyTWFza0ZsYWdzLk1hc2tIYXNQYXJhbWV0ZXJzQXBwbGllZFRvSXQ7XG5cblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgZmxhZ3MpO1xuXG5cdFx0aWYgKHBhcmFtcykge1xuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIHBhcmFtcyk7XG5cblx0XHRcdGlmIChtYXNrLnVzZXJNYXNrRGVuc2l0eSAhPT0gdW5kZWZpbmVkKSB3cml0ZVVpbnQ4KHdyaXRlciwgTWF0aC5yb3VuZChtYXNrLnVzZXJNYXNrRGVuc2l0eSAqIDB4ZmYpKTtcblx0XHRcdGlmIChtYXNrLnVzZXJNYXNrRmVhdGhlciAhPT0gdW5kZWZpbmVkKSB3cml0ZUZsb2F0NjQod3JpdGVyLCBtYXNrLnVzZXJNYXNrRmVhdGhlcik7XG5cdFx0XHRpZiAobWFzay52ZWN0b3JNYXNrRGVuc2l0eSAhPT0gdW5kZWZpbmVkKSB3cml0ZVVpbnQ4KHdyaXRlciwgTWF0aC5yb3VuZChtYXNrLnZlY3Rvck1hc2tEZW5zaXR5ICogMHhmZikpO1xuXHRcdFx0aWYgKG1hc2sudmVjdG9yTWFza0ZlYXRoZXIgIT09IHVuZGVmaW5lZCkgd3JpdGVGbG9hdDY0KHdyaXRlciwgbWFzay52ZWN0b3JNYXNrRmVhdGhlcik7XG5cdFx0fVxuXG5cdFx0Ly8gVE9ETzogaGFuZGxlIHJlc3Qgb2YgdGhlIGZpZWxkc1xuXG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDIpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gd3JpdGVMYXllckJsZW5kaW5nUmFuZ2VzKHdyaXRlcjogUHNkV3JpdGVyLCBwc2Q6IFBzZCkge1xuXHR3cml0ZVNlY3Rpb24od3JpdGVyLCAxLCAoKSA9PiB7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCA2NTUzNSk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCA2NTUzNSk7XG5cblx0XHRsZXQgY2hhbm5lbHMgPSBwc2QuY2hhbm5lbHMgfHwgMDsgLy8gVE9ETzogdXNlIGFsd2F5cyA0IGluc3RlYWQgP1xuXHRcdC8vIGNoYW5uZWxzID0gNDsgLy8gVEVTVElOR1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjaGFubmVsczsgaSsrKSB7XG5cdFx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDY1NTM1KTtcblx0XHRcdHdyaXRlVWludDMyKHdyaXRlciwgNjU1MzUpO1xuXHRcdH1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIHdyaXRlR2xvYmFsTGF5ZXJNYXNrSW5mbyh3cml0ZXI6IFBzZFdyaXRlciwgaW5mbzogR2xvYmFsTGF5ZXJNYXNrSW5mbyB8IHVuZGVmaW5lZCkge1xuXHR3cml0ZVNlY3Rpb24od3JpdGVyLCAxLCAoKSA9PiB7XG5cdFx0aWYgKGluZm8pIHtcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgaW5mby5vdmVybGF5Q29sb3JTcGFjZSk7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZm8uY29sb3JTcGFjZTEpO1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLmNvbG9yU3BhY2UyKTtcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgaW5mby5jb2xvclNwYWNlMyk7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZm8uY29sb3JTcGFjZTQpO1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLm9wYWNpdHkgKiAweGZmKTtcblx0XHRcdHdyaXRlVWludDgod3JpdGVyLCBpbmZvLmtpbmQpO1xuXHRcdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDMpO1xuXHRcdH1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIHdyaXRlQWRkaXRpb25hbExheWVySW5mbyh3cml0ZXI6IFBzZFdyaXRlciwgdGFyZ2V0OiBMYXllckFkZGl0aW9uYWxJbmZvLCBwc2Q6IFBzZCwgb3B0aW9uczogRXh0ZW5kZWRXcml0ZU9wdGlvbnMpIHtcblx0Zm9yIChjb25zdCBoYW5kbGVyIG9mIGluZm9IYW5kbGVycykge1xuXHRcdGxldCBrZXkgPSBoYW5kbGVyLmtleTtcblxuXHRcdGlmIChrZXkgPT09ICdUeHQyJyAmJiBvcHRpb25zLmludmFsaWRhdGVUZXh0TGF5ZXJzKSBjb250aW51ZTtcblx0XHRpZiAoa2V5ID09PSAndm1zaycgJiYgb3B0aW9ucy5wc2IpIGtleSA9ICd2c21zJztcblxuXHRcdGlmIChoYW5kbGVyLmhhcyh0YXJnZXQpKSB7XG5cdFx0XHRjb25zdCBsYXJnZSA9IG9wdGlvbnMucHNiICYmIGxhcmdlQWRkaXRpb25hbEluZm9LZXlzLmluZGV4T2Yoa2V5KSAhPT0gLTE7XG5cblx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgbGFyZ2UgPyAnOEI2NCcgOiAnOEJJTScpO1xuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCBrZXkpO1xuXG5cdFx0XHRjb25zdCBmb3VyQnl0ZXMgPSBrZXkgPT09ICdUeHQyJyB8fCBrZXkgPT09ICdsdW5pJyB8fCBrZXkgPT09ICd2bXNrJyB8fCBrZXkgPT09ICdhcnRiJyB8fCBrZXkgPT09ICdhcnRkJyB8fFxuXHRcdFx0XHRrZXkgPT09ICd2b2drJyB8fCBrZXkgPT09ICdTb0xkJyB8fCBrZXkgPT09ICdsbmsyJyB8fCBrZXkgPT09ICd2c2NnJyB8fCBrZXkgPT09ICd2c21zJyB8fCBrZXkgPT09ICdHZEZsJyB8fFxuXHRcdFx0XHRrZXkgPT09ICdsbWZ4JyB8fCBrZXkgPT09ICdsckZYJyB8fCBrZXkgPT09ICdjaW5mJyB8fCBrZXkgPT09ICdQbExkJyB8fCBrZXkgPT09ICdBbm5vJztcblxuXHRcdFx0d3JpdGVTZWN0aW9uKHdyaXRlciwgZm91ckJ5dGVzID8gNCA6IDIsICgpID0+IHtcblx0XHRcdFx0aGFuZGxlci53cml0ZSh3cml0ZXIsIHRhcmdldCwgcHNkLCBvcHRpb25zKTtcblx0XHRcdH0sIGtleSAhPT0gJ1R4dDInICYmIGtleSAhPT0gJ2NpbmYnICYmIGtleSAhPT0gJ2V4dG4nLCBsYXJnZSk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGFkZENoaWxkcmVuKGxheWVyczogTGF5ZXJbXSwgY2hpbGRyZW46IExheWVyW10gfCB1bmRlZmluZWQpIHtcblx0aWYgKCFjaGlsZHJlbikgcmV0dXJuO1xuXG5cdGZvciAoY29uc3QgYyBvZiBjaGlsZHJlbikge1xuXHRcdGlmIChjLmNoaWxkcmVuICYmIGMuY2FudmFzKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbGF5ZXIsIGNhbm5vdCBoYXZlIGJvdGggJ2NhbnZhcycgYW5kICdjaGlsZHJlbicgcHJvcGVydGllc2ApO1xuXHRcdGlmIChjLmNoaWxkcmVuICYmIGMuaW1hZ2VEYXRhKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbGF5ZXIsIGNhbm5vdCBoYXZlIGJvdGggJ2ltYWdlRGF0YScgYW5kICdjaGlsZHJlbicgcHJvcGVydGllc2ApO1xuXG5cdFx0aWYgKGMuY2hpbGRyZW4pIHtcblx0XHRcdGxheWVycy5wdXNoKHtcblx0XHRcdFx0bmFtZTogJzwvTGF5ZXIgZ3JvdXA+Jyxcblx0XHRcdFx0c2VjdGlvbkRpdmlkZXI6IHtcblx0XHRcdFx0XHR0eXBlOiBTZWN0aW9uRGl2aWRlclR5cGUuQm91bmRpbmdTZWN0aW9uRGl2aWRlcixcblx0XHRcdFx0fSxcblx0XHRcdFx0Ly8gVEVTVElOR1xuXHRcdFx0XHQvLyBuYW1lU291cmNlOiAnbHNldCcsXG5cdFx0XHRcdC8vIGlkOiBbNCwgMCwgMCwgOCwgMTEsIDAsIDAsIDAsIDAsIDE0XVtsYXllcnMubGVuZ3RoXSB8fCAwLFxuXHRcdFx0XHQvLyBsYXllckNvbG9yOiAnbm9uZScsXG5cdFx0XHRcdC8vIHRpbWVzdGFtcDogWzE2MTEzNDY4MTcuMzQ5MDIxLCAwLCAwLCAxNjExMzQ2ODE3LjM0OTE3NSwgMTYxMTM0NjgxNy4zNDkxODMzLCAwLCAwLCAwLCAwLCAxNjExMzQ2ODE3LjM0OTgzMl1bbGF5ZXJzLmxlbmd0aF0gfHwgMCxcblx0XHRcdFx0Ly8gcHJvdGVjdGVkOiB7fSxcblx0XHRcdFx0Ly8gcmVmZXJlbmNlUG9pbnQ6IHsgeDogMCwgeTogMCB9LFxuXHRcdFx0fSk7XG5cdFx0XHRhZGRDaGlsZHJlbihsYXllcnMsIGMuY2hpbGRyZW4pO1xuXHRcdFx0bGF5ZXJzLnB1c2goe1xuXHRcdFx0XHRzZWN0aW9uRGl2aWRlcjoge1xuXHRcdFx0XHRcdHR5cGU6IGMub3BlbmVkID09PSBmYWxzZSA/IFNlY3Rpb25EaXZpZGVyVHlwZS5DbG9zZWRGb2xkZXIgOiBTZWN0aW9uRGl2aWRlclR5cGUuT3BlbkZvbGRlcixcblx0XHRcdFx0XHRrZXk6IGZyb21CbGVuZE1vZGVbYy5ibGVuZE1vZGUhXSB8fCAncGFzcycsXG5cdFx0XHRcdFx0c3ViVHlwZTogMCxcblx0XHRcdFx0fSxcblx0XHRcdFx0Li4uYyxcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsYXllcnMucHVzaCh7IC4uLmMgfSk7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHJlc2l6ZUJ1ZmZlcih3cml0ZXI6IFBzZFdyaXRlciwgc2l6ZTogbnVtYmVyKSB7XG5cdGxldCBuZXdMZW5ndGggPSB3cml0ZXIuYnVmZmVyLmJ5dGVMZW5ndGg7XG5cblx0ZG8ge1xuXHRcdG5ld0xlbmd0aCAqPSAyO1xuXHR9IHdoaWxlIChzaXplID4gbmV3TGVuZ3RoKTtcblxuXHRjb25zdCBuZXdCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIobmV3TGVuZ3RoKTtcblx0Y29uc3QgbmV3Qnl0ZXMgPSBuZXcgVWludDhBcnJheShuZXdCdWZmZXIpO1xuXHRjb25zdCBvbGRCeXRlcyA9IG5ldyBVaW50OEFycmF5KHdyaXRlci5idWZmZXIpO1xuXHRuZXdCeXRlcy5zZXQob2xkQnl0ZXMpO1xuXHR3cml0ZXIuYnVmZmVyID0gbmV3QnVmZmVyO1xuXHR3cml0ZXIudmlldyA9IG5ldyBEYXRhVmlldyh3cml0ZXIuYnVmZmVyKTtcbn1cblxuZnVuY3Rpb24gZW5zdXJlU2l6ZSh3cml0ZXI6IFBzZFdyaXRlciwgc2l6ZTogbnVtYmVyKSB7XG5cdGlmIChzaXplID4gd3JpdGVyLmJ1ZmZlci5ieXRlTGVuZ3RoKSB7XG5cdFx0cmVzaXplQnVmZmVyKHdyaXRlciwgc2l6ZSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gYWRkU2l6ZSh3cml0ZXI6IFBzZFdyaXRlciwgc2l6ZTogbnVtYmVyKSB7XG5cdGNvbnN0IG9mZnNldCA9IHdyaXRlci5vZmZzZXQ7XG5cdGVuc3VyZVNpemUod3JpdGVyLCB3cml0ZXIub2Zmc2V0ICs9IHNpemUpO1xuXHRyZXR1cm4gb2Zmc2V0O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVUaHVtYm5haWwocHNkOiBQc2QpIHtcblx0Y29uc3QgY2FudmFzID0gY3JlYXRlQ2FudmFzKDEwLCAxMCk7XG5cdGxldCBzY2FsZSA9IDE7XG5cblx0aWYgKHBzZC53aWR0aCA+IHBzZC5oZWlnaHQpIHtcblx0XHRjYW52YXMud2lkdGggPSAxNjA7XG5cdFx0Y2FudmFzLmhlaWdodCA9IE1hdGguZmxvb3IocHNkLmhlaWdodCAqIChjYW52YXMud2lkdGggLyBwc2Qud2lkdGgpKTtcblx0XHRzY2FsZSA9IGNhbnZhcy53aWR0aCAvIHBzZC53aWR0aDtcblx0fSBlbHNlIHtcblx0XHRjYW52YXMuaGVpZ2h0ID0gMTYwO1xuXHRcdGNhbnZhcy53aWR0aCA9IE1hdGguZmxvb3IocHNkLndpZHRoICogKGNhbnZhcy5oZWlnaHQgLyBwc2QuaGVpZ2h0KSk7XG5cdFx0c2NhbGUgPSBjYW52YXMuaGVpZ2h0IC8gcHNkLmhlaWdodDtcblx0fVxuXG5cdGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSE7XG5cdGNvbnRleHQuc2NhbGUoc2NhbGUsIHNjYWxlKTtcblxuXHRpZiAocHNkLmltYWdlRGF0YSkge1xuXHRcdGNvbnN0IHRlbXAgPSBjcmVhdGVDYW52YXMocHNkLmltYWdlRGF0YS53aWR0aCwgcHNkLmltYWdlRGF0YS5oZWlnaHQpO1xuXHRcdHRlbXAuZ2V0Q29udGV4dCgnMmQnKSEucHV0SW1hZ2VEYXRhKHBzZC5pbWFnZURhdGEsIDAsIDApO1xuXHRcdGNvbnRleHQuZHJhd0ltYWdlKHRlbXAsIDAsIDApO1xuXHR9IGVsc2UgaWYgKHBzZC5jYW52YXMpIHtcblx0XHRjb250ZXh0LmRyYXdJbWFnZShwc2QuY2FudmFzLCAwLCAwKTtcblx0fVxuXG5cdHJldHVybiBjYW52YXM7XG59XG5cbmZ1bmN0aW9uIGdldENoYW5uZWxzKFxuXHR0ZW1wQnVmZmVyOiBVaW50OEFycmF5LCBsYXllcjogTGF5ZXIsIGJhY2tncm91bmQ6IGJvb2xlYW4sIG9wdGlvbnM6IFdyaXRlT3B0aW9uc1xuKTogTGF5ZXJDaGFubmVsRGF0YSB7XG5cdGNvbnN0IGxheWVyRGF0YSA9IGdldExheWVyQ2hhbm5lbHModGVtcEJ1ZmZlciwgbGF5ZXIsIGJhY2tncm91bmQsIG9wdGlvbnMpO1xuXHRjb25zdCBtYXNrID0gbGF5ZXIubWFzaztcblxuXHRpZiAobWFzaykge1xuXHRcdGxldCB0b3AgPSAobWFzay50b3AgYXMgYW55KSB8IDA7XG5cdFx0bGV0IGxlZnQgPSAobWFzay5sZWZ0IGFzIGFueSkgfCAwO1xuXHRcdGxldCByaWdodCA9IChtYXNrLnJpZ2h0IGFzIGFueSkgfCAwO1xuXHRcdGxldCBib3R0b20gPSAobWFzay5ib3R0b20gYXMgYW55KSB8IDA7XG5cdFx0bGV0IHsgd2lkdGgsIGhlaWdodCB9ID0gZ2V0TGF5ZXJEaW1lbnRpb25zKG1hc2spO1xuXHRcdGxldCBpbWFnZURhdGEgPSBtYXNrLmltYWdlRGF0YTtcblxuXHRcdGlmICghaW1hZ2VEYXRhICYmIG1hc2suY2FudmFzICYmIHdpZHRoICYmIGhlaWdodCkge1xuXHRcdFx0aW1hZ2VEYXRhID0gbWFzay5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKSEuZ2V0SW1hZ2VEYXRhKDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuXHRcdH1cblxuXHRcdGlmICh3aWR0aCAmJiBoZWlnaHQgJiYgaW1hZ2VEYXRhKSB7XG5cdFx0XHRyaWdodCA9IGxlZnQgKyB3aWR0aDtcblx0XHRcdGJvdHRvbSA9IHRvcCArIGhlaWdodDtcblxuXHRcdFx0aWYgKGltYWdlRGF0YS53aWR0aCAhPT0gd2lkdGggfHwgaW1hZ2VEYXRhLmhlaWdodCAhPT0gaGVpZ2h0KSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpbWFnZURhdGEgZGltZW50aW9ucycpO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgYnVmZmVyOiBVaW50OEFycmF5O1xuXHRcdFx0bGV0IGNvbXByZXNzaW9uOiBDb21wcmVzc2lvbjtcblxuXHRcdFx0aWYgKFJBV19JTUFHRV9EQVRBICYmIChsYXllciBhcyBhbnkpLm1hc2tEYXRhUmF3KSB7XG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKCd3cml0dGVuIHJhdyBsYXllciBpbWFnZSBkYXRhJyk7XG5cdFx0XHRcdGJ1ZmZlciA9IChsYXllciBhcyBhbnkpLm1hc2tEYXRhUmF3O1xuXHRcdFx0XHRjb21wcmVzc2lvbiA9IENvbXByZXNzaW9uLlJsZUNvbXByZXNzZWQ7XG5cdFx0XHR9IGVsc2UgaWYgKG9wdGlvbnMuY29tcHJlc3MpIHtcblx0XHRcdFx0YnVmZmVyID0gd3JpdGVEYXRhWmlwV2l0aG91dFByZWRpY3Rpb24oaW1hZ2VEYXRhLCBbMF0pO1xuXHRcdFx0XHRjb21wcmVzc2lvbiA9IENvbXByZXNzaW9uLlppcFdpdGhvdXRQcmVkaWN0aW9uO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YnVmZmVyID0gd3JpdGVEYXRhUkxFKHRlbXBCdWZmZXIsIGltYWdlRGF0YSwgWzBdLCAhIW9wdGlvbnMucHNiKSE7XG5cdFx0XHRcdGNvbXByZXNzaW9uID0gQ29tcHJlc3Npb24uUmxlQ29tcHJlc3NlZDtcblx0XHRcdH1cblxuXHRcdFx0bGF5ZXJEYXRhLm1hc2sgPSB7IHRvcCwgbGVmdCwgcmlnaHQsIGJvdHRvbSB9O1xuXHRcdFx0bGF5ZXJEYXRhLmNoYW5uZWxzLnB1c2goeyBjaGFubmVsSWQ6IENoYW5uZWxJRC5Vc2VyTWFzaywgY29tcHJlc3Npb24sIGJ1ZmZlciwgbGVuZ3RoOiAyICsgYnVmZmVyLmxlbmd0aCB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bGF5ZXJEYXRhLm1hc2sgPSB7IHRvcDogMCwgbGVmdDogMCwgcmlnaHQ6IDAsIGJvdHRvbTogMCB9O1xuXHRcdFx0bGF5ZXJEYXRhLmNoYW5uZWxzLnB1c2goeyBjaGFubmVsSWQ6IENoYW5uZWxJRC5Vc2VyTWFzaywgY29tcHJlc3Npb246IENvbXByZXNzaW9uLlJhd0RhdGEsIGJ1ZmZlcjogbmV3IFVpbnQ4QXJyYXkoMCksIGxlbmd0aDogMCB9KTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gbGF5ZXJEYXRhO1xufVxuXG5mdW5jdGlvbiBnZXRMYXllckRpbWVudGlvbnMoeyBjYW52YXMsIGltYWdlRGF0YSB9OiBMYXllcik6IHsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXI7IH0ge1xuXHRyZXR1cm4gaW1hZ2VEYXRhIHx8IGNhbnZhcyB8fCB7IHdpZHRoOiAwLCBoZWlnaHQ6IDAgfTtcbn1cblxuZnVuY3Rpb24gY3JvcEltYWdlRGF0YShkYXRhOiBJbWFnZURhdGEsIGxlZnQ6IG51bWJlciwgdG9wOiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSB7XG5cdGNvbnN0IGNyb3BwZWREYXRhID0gY3JlYXRlSW1hZ2VEYXRhKHdpZHRoLCBoZWlnaHQpO1xuXHRjb25zdCBzcmNEYXRhID0gZGF0YS5kYXRhO1xuXHRjb25zdCBkc3REYXRhID0gY3JvcHBlZERhdGEuZGF0YTtcblxuXHRmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XG5cdFx0Zm9yIChsZXQgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XG5cdFx0XHRsZXQgc3JjID0gKCh4ICsgbGVmdCkgKyAoeSArIHRvcCkgKiB3aWR0aCkgKiA0O1xuXHRcdFx0bGV0IGRzdCA9ICh4ICsgeSAqIHdpZHRoKSAqIDQ7XG5cdFx0XHRkc3REYXRhW2RzdF0gPSBzcmNEYXRhW3NyY107XG5cdFx0XHRkc3REYXRhW2RzdCArIDFdID0gc3JjRGF0YVtzcmMgKyAxXTtcblx0XHRcdGRzdERhdGFbZHN0ICsgMl0gPSBzcmNEYXRhW3NyYyArIDJdO1xuXHRcdFx0ZHN0RGF0YVtkc3QgKyAzXSA9IHNyY0RhdGFbc3JjICsgM107XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGNyb3BwZWREYXRhO1xufVxuXG5mdW5jdGlvbiBnZXRMYXllckNoYW5uZWxzKFxuXHR0ZW1wQnVmZmVyOiBVaW50OEFycmF5LCBsYXllcjogTGF5ZXIsIGJhY2tncm91bmQ6IGJvb2xlYW4sIG9wdGlvbnM6IFdyaXRlT3B0aW9uc1xuKTogTGF5ZXJDaGFubmVsRGF0YSB7XG5cdGxldCB0b3AgPSAobGF5ZXIudG9wIGFzIGFueSkgfCAwO1xuXHRsZXQgbGVmdCA9IChsYXllci5sZWZ0IGFzIGFueSkgfCAwO1xuXHRsZXQgcmlnaHQgPSAobGF5ZXIucmlnaHQgYXMgYW55KSB8IDA7XG5cdGxldCBib3R0b20gPSAobGF5ZXIuYm90dG9tIGFzIGFueSkgfCAwO1xuXHRsZXQgY2hhbm5lbHM6IENoYW5uZWxEYXRhW10gPSBbXG5cdFx0eyBjaGFubmVsSWQ6IENoYW5uZWxJRC5UcmFuc3BhcmVuY3ksIGNvbXByZXNzaW9uOiBDb21wcmVzc2lvbi5SYXdEYXRhLCBidWZmZXI6IHVuZGVmaW5lZCwgbGVuZ3RoOiAyIH0sXG5cdFx0eyBjaGFubmVsSWQ6IENoYW5uZWxJRC5Db2xvcjAsIGNvbXByZXNzaW9uOiBDb21wcmVzc2lvbi5SYXdEYXRhLCBidWZmZXI6IHVuZGVmaW5lZCwgbGVuZ3RoOiAyIH0sXG5cdFx0eyBjaGFubmVsSWQ6IENoYW5uZWxJRC5Db2xvcjEsIGNvbXByZXNzaW9uOiBDb21wcmVzc2lvbi5SYXdEYXRhLCBidWZmZXI6IHVuZGVmaW5lZCwgbGVuZ3RoOiAyIH0sXG5cdFx0eyBjaGFubmVsSWQ6IENoYW5uZWxJRC5Db2xvcjIsIGNvbXByZXNzaW9uOiBDb21wcmVzc2lvbi5SYXdEYXRhLCBidWZmZXI6IHVuZGVmaW5lZCwgbGVuZ3RoOiAyIH0sXG5cdF07XG5cdGxldCB7IHdpZHRoLCBoZWlnaHQgfSA9IGdldExheWVyRGltZW50aW9ucyhsYXllcik7XG5cblx0aWYgKCEobGF5ZXIuY2FudmFzIHx8IGxheWVyLmltYWdlRGF0YSkgfHwgIXdpZHRoIHx8ICFoZWlnaHQpIHtcblx0XHRyaWdodCA9IGxlZnQ7XG5cdFx0Ym90dG9tID0gdG9wO1xuXHRcdHJldHVybiB7IGxheWVyLCB0b3AsIGxlZnQsIHJpZ2h0LCBib3R0b20sIGNoYW5uZWxzIH07XG5cdH1cblxuXHRyaWdodCA9IGxlZnQgKyB3aWR0aDtcblx0Ym90dG9tID0gdG9wICsgaGVpZ2h0O1xuXG5cdGxldCBkYXRhID0gbGF5ZXIuaW1hZ2VEYXRhIHx8IGxheWVyLmNhbnZhcyEuZ2V0Q29udGV4dCgnMmQnKSEuZ2V0SW1hZ2VEYXRhKDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuXG5cdGlmIChvcHRpb25zLnRyaW1JbWFnZURhdGEpIHtcblx0XHRjb25zdCB0cmltbWVkID0gdHJpbURhdGEoZGF0YSk7XG5cblx0XHRpZiAodHJpbW1lZC5sZWZ0ICE9PSAwIHx8IHRyaW1tZWQudG9wICE9PSAwIHx8IHRyaW1tZWQucmlnaHQgIT09IGRhdGEud2lkdGggfHwgdHJpbW1lZC5ib3R0b20gIT09IGRhdGEuaGVpZ2h0KSB7XG5cdFx0XHRsZWZ0ICs9IHRyaW1tZWQubGVmdDtcblx0XHRcdHRvcCArPSB0cmltbWVkLnRvcDtcblx0XHRcdHJpZ2h0IC09IChkYXRhLndpZHRoIC0gdHJpbW1lZC5yaWdodCk7XG5cdFx0XHRib3R0b20gLT0gKGRhdGEuaGVpZ2h0IC0gdHJpbW1lZC5ib3R0b20pO1xuXHRcdFx0d2lkdGggPSByaWdodCAtIGxlZnQ7XG5cdFx0XHRoZWlnaHQgPSBib3R0b20gLSB0b3A7XG5cblx0XHRcdGlmICghd2lkdGggfHwgIWhlaWdodCkge1xuXHRcdFx0XHRyZXR1cm4geyBsYXllciwgdG9wLCBsZWZ0LCByaWdodCwgYm90dG9tLCBjaGFubmVscyB9O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAobGF5ZXIuaW1hZ2VEYXRhKSB7XG5cdFx0XHRcdGRhdGEgPSBjcm9wSW1hZ2VEYXRhKGRhdGEsIHRyaW1tZWQubGVmdCwgdHJpbW1lZC50b3AsIHdpZHRoLCBoZWlnaHQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGF0YSA9IGxheWVyLmNhbnZhcyEuZ2V0Q29udGV4dCgnMmQnKSEuZ2V0SW1hZ2VEYXRhKHRyaW1tZWQubGVmdCwgdHJpbW1lZC50b3AsIHdpZHRoLCBoZWlnaHQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGNvbnN0IGNoYW5uZWxJZHMgPSBbXG5cdFx0Q2hhbm5lbElELkNvbG9yMCxcblx0XHRDaGFubmVsSUQuQ29sb3IxLFxuXHRcdENoYW5uZWxJRC5Db2xvcjIsXG5cdF07XG5cblx0aWYgKCFiYWNrZ3JvdW5kIHx8IG9wdGlvbnMubm9CYWNrZ3JvdW5kIHx8IGxheWVyLm1hc2sgfHwgaGFzQWxwaGEoZGF0YSkgfHwgKFJBV19JTUFHRV9EQVRBICYmIChsYXllciBhcyBhbnkpLmltYWdlRGF0YVJhdz8uWyctMSddKSkge1xuXHRcdGNoYW5uZWxJZHMudW5zaGlmdChDaGFubmVsSUQuVHJhbnNwYXJlbmN5KTtcblx0fVxuXG5cdGNoYW5uZWxzID0gY2hhbm5lbElkcy5tYXAoY2hhbm5lbElkID0+IHtcblx0XHRjb25zdCBvZmZzZXQgPSBvZmZzZXRGb3JDaGFubmVsKGNoYW5uZWxJZCwgZmFsc2UpOyAvLyBUT0RPOiBwc2QuY29sb3JNb2RlID09PSBDb2xvck1vZGUuQ01ZSyk7XG5cdFx0bGV0IGJ1ZmZlcjogVWludDhBcnJheTtcblx0XHRsZXQgY29tcHJlc3Npb246IENvbXByZXNzaW9uO1xuXG5cdFx0aWYgKFJBV19JTUFHRV9EQVRBICYmIChsYXllciBhcyBhbnkpLmltYWdlRGF0YVJhdykge1xuXHRcdFx0Ly8gY29uc29sZS5sb2coJ3dyaXR0ZW4gcmF3IGxheWVyIGltYWdlIGRhdGEnKTtcblx0XHRcdGJ1ZmZlciA9IChsYXllciBhcyBhbnkpLmltYWdlRGF0YVJhd1tjaGFubmVsSWRdO1xuXHRcdFx0Y29tcHJlc3Npb24gPSBDb21wcmVzc2lvbi5SbGVDb21wcmVzc2VkO1xuXHRcdH0gZWxzZSBpZiAob3B0aW9ucy5jb21wcmVzcykge1xuXHRcdFx0YnVmZmVyID0gd3JpdGVEYXRhWmlwV2l0aG91dFByZWRpY3Rpb24oZGF0YSwgW29mZnNldF0pO1xuXHRcdFx0Y29tcHJlc3Npb24gPSBDb21wcmVzc2lvbi5aaXBXaXRob3V0UHJlZGljdGlvbjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YnVmZmVyID0gd3JpdGVEYXRhUkxFKHRlbXBCdWZmZXIsIGRhdGEsIFtvZmZzZXRdLCAhIW9wdGlvbnMucHNiKSE7XG5cdFx0XHRjb21wcmVzc2lvbiA9IENvbXByZXNzaW9uLlJsZUNvbXByZXNzZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgY2hhbm5lbElkLCBjb21wcmVzc2lvbiwgYnVmZmVyLCBsZW5ndGg6IDIgKyBidWZmZXIubGVuZ3RoIH07XG5cdH0pO1xuXG5cdHJldHVybiB7IGxheWVyLCB0b3AsIGxlZnQsIHJpZ2h0LCBib3R0b20sIGNoYW5uZWxzIH07XG59XG5cbmZ1bmN0aW9uIGlzUm93RW1wdHkoeyBkYXRhLCB3aWR0aCB9OiBQaXhlbERhdGEsIHk6IG51bWJlciwgbGVmdDogbnVtYmVyLCByaWdodDogbnVtYmVyKSB7XG5cdGNvbnN0IHN0YXJ0ID0gKCh5ICogd2lkdGggKyBsZWZ0KSAqIDQgKyAzKSB8IDA7XG5cdGNvbnN0IGVuZCA9IChzdGFydCArIChyaWdodCAtIGxlZnQpICogNCkgfCAwO1xuXG5cdGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSA9IChpICsgNCkgfCAwKSB7XG5cdFx0aWYgKGRhdGFbaV0gIT09IDApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaXNDb2xFbXB0eSh7IGRhdGEsIHdpZHRoIH06IFBpeGVsRGF0YSwgeDogbnVtYmVyLCB0b3A6IG51bWJlciwgYm90dG9tOiBudW1iZXIpIHtcblx0Y29uc3Qgc3RyaWRlID0gKHdpZHRoICogNCkgfCAwO1xuXHRjb25zdCBzdGFydCA9ICh0b3AgKiBzdHJpZGUgKyB4ICogNCArIDMpIHwgMDtcblxuXHRmb3IgKGxldCB5ID0gdG9wLCBpID0gc3RhcnQ7IHkgPCBib3R0b207IHkrKywgaSA9IChpICsgc3RyaWRlKSB8IDApIHtcblx0XHRpZiAoZGF0YVtpXSAhPT0gMCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB0cmltRGF0YShkYXRhOiBQaXhlbERhdGEpIHtcblx0bGV0IHRvcCA9IDA7XG5cdGxldCBsZWZ0ID0gMDtcblx0bGV0IHJpZ2h0ID0gZGF0YS53aWR0aDtcblx0bGV0IGJvdHRvbSA9IGRhdGEuaGVpZ2h0O1xuXG5cdHdoaWxlICh0b3AgPCBib3R0b20gJiYgaXNSb3dFbXB0eShkYXRhLCB0b3AsIGxlZnQsIHJpZ2h0KSlcblx0XHR0b3ArKztcblx0d2hpbGUgKGJvdHRvbSA+IHRvcCAmJiBpc1Jvd0VtcHR5KGRhdGEsIGJvdHRvbSAtIDEsIGxlZnQsIHJpZ2h0KSlcblx0XHRib3R0b20tLTtcblx0d2hpbGUgKGxlZnQgPCByaWdodCAmJiBpc0NvbEVtcHR5KGRhdGEsIGxlZnQsIHRvcCwgYm90dG9tKSlcblx0XHRsZWZ0Kys7XG5cdHdoaWxlIChyaWdodCA+IGxlZnQgJiYgaXNDb2xFbXB0eShkYXRhLCByaWdodCAtIDEsIHRvcCwgYm90dG9tKSlcblx0XHRyaWdodC0tO1xuXG5cdHJldHVybiB7IHRvcCwgbGVmdCwgcmlnaHQsIGJvdHRvbSB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVDb2xvcih3cml0ZXI6IFBzZFdyaXRlciwgY29sb3I6IENvbG9yIHwgdW5kZWZpbmVkKSB7XG5cdGlmICghY29sb3IpIHtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIENvbG9yU3BhY2UuUkdCKTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgOCk7XG5cdH0gZWxzZSBpZiAoJ3InIGluIGNvbG9yKSB7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBDb2xvclNwYWNlLlJHQik7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLnIgKiAyNTcpKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgucm91bmQoY29sb3IuZyAqIDI1NykpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci5iICogMjU3KSk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAwKTtcblx0fSBlbHNlIGlmICgnbCcgaW4gY29sb3IpIHtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIENvbG9yU3BhY2UuTGFiKTtcblx0XHR3cml0ZUludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci5sICogMTAwMDApKTtcblx0XHR3cml0ZUludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci5hIDwgMCA/IChjb2xvci5hICogMTI4MDApIDogKGNvbG9yLmEgKiAxMjcwMCkpKTtcblx0XHR3cml0ZUludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci5iIDwgMCA/IChjb2xvci5iICogMTI4MDApIDogKGNvbG9yLmIgKiAxMjcwMCkpKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDApO1xuXHR9IGVsc2UgaWYgKCdoJyBpbiBjb2xvcikge1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgQ29sb3JTcGFjZS5IU0IpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci5oICogMHhmZmZmKSk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLnMgKiAweGZmZmYpKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgucm91bmQoY29sb3IuYiAqIDB4ZmZmZikpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMCk7XG5cdH0gZWxzZSBpZiAoJ2MnIGluIGNvbG9yKSB7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBDb2xvclNwYWNlLkNNWUspO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci5jICogMjU3KSk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLm0gKiAyNTcpKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgucm91bmQoY29sb3IueSAqIDI1NykpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5yb3VuZChjb2xvci5rICogMjU3KSk7XG5cdH0gZWxzZSB7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBDb2xvclNwYWNlLkdyYXlzY2FsZSk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKGNvbG9yLmsgKiAxMDAwMCAvIDI1NSkpO1xuXHRcdHdyaXRlWmVyb3Mod3JpdGVyLCA2KTtcblx0fVxufVxuIl0sInNvdXJjZVJvb3QiOiJDOlxcUHJvamVjdHNcXGdpdGh1YlxcYWctcHNkXFxzcmMifQ==
