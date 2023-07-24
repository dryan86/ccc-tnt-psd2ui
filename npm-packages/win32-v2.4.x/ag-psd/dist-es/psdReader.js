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
import { inflate } from 'pako';
import { resetImageData, offsetForChannel, decodeBitmap, createCanvas, createImageData, toBlendMode, RAW_IMAGE_DATA, largeAdditionalInfoKeys } from './helpers';
import { infoHandlersMap } from './additionalInfo';
import { resourceHandlersMap } from './imageResources';
export var supportedColorModes = [0 /* ColorMode.Bitmap */, 1 /* ColorMode.Grayscale */, 3 /* ColorMode.RGB */];
var colorModes = ['bitmap', 'grayscale', 'indexed', 'RGB', 'CMYK', 'multichannel', 'duotone', 'lab'];
function setupGrayscale(data) {
    var size = data.width * data.height * 4;
    for (var i = 0; i < size; i += 4) {
        data.data[i + 1] = data.data[i];
        data.data[i + 2] = data.data[i];
    }
}
export function createReader(buffer, offset, length) {
    var view = new DataView(buffer, offset, length);
    return { view: view, offset: 0, strict: false, debug: false };
}
export function warnOrThrow(reader, message) {
    if (reader.strict)
        throw new Error(message);
    if (reader.debug)
        console.warn(message);
}
export function readUint8(reader) {
    reader.offset += 1;
    return reader.view.getUint8(reader.offset - 1);
}
export function peekUint8(reader) {
    return reader.view.getUint8(reader.offset);
}
export function readInt16(reader) {
    reader.offset += 2;
    return reader.view.getInt16(reader.offset - 2, false);
}
export function readUint16(reader) {
    reader.offset += 2;
    return reader.view.getUint16(reader.offset - 2, false);
}
export function readInt32(reader) {
    reader.offset += 4;
    return reader.view.getInt32(reader.offset - 4, false);
}
export function readInt32LE(reader) {
    reader.offset += 4;
    return reader.view.getInt32(reader.offset - 4, true);
}
export function readUint32(reader) {
    reader.offset += 4;
    return reader.view.getUint32(reader.offset - 4, false);
}
export function readFloat32(reader) {
    reader.offset += 4;
    return reader.view.getFloat32(reader.offset - 4, false);
}
export function readFloat64(reader) {
    reader.offset += 8;
    return reader.view.getFloat64(reader.offset - 8, false);
}
// 32-bit fixed-point number 16.16
export function readFixedPoint32(reader) {
    return readInt32(reader) / (1 << 16);
}
// 32-bit fixed-point number 8.24
export function readFixedPointPath32(reader) {
    return readInt32(reader) / (1 << 24);
}
export function readBytes(reader, length) {
    var start = reader.view.byteOffset + reader.offset;
    reader.offset += length;
    if ((start + length) > reader.view.buffer.byteLength) {
        // fix for broken PSD files that are missing part of file at the end
        warnOrThrow(reader, 'Reading bytes exceeding buffer length');
        if (length > (100 * 1024 * 1024))
            throw new Error('Reading past end of file'); // limit to 100MB
        var result = new Uint8Array(length);
        var len = Math.min(length, reader.view.byteLength - start);
        if (len > 0)
            result.set(new Uint8Array(reader.view.buffer, start, len));
        return result;
    }
    else {
        return new Uint8Array(reader.view.buffer, start, length);
    }
}
export function readSignature(reader) {
    return readShortString(reader, 4);
}
export function readPascalString(reader, padTo) {
    var length = readUint8(reader);
    var text = length ? readShortString(reader, length) : '';
    while (++length % padTo) {
        reader.offset++;
    }
    return text;
}
export function readUnicodeString(reader) {
    var length = readUint32(reader);
    return readUnicodeStringWithLength(reader, length);
}
export function readUnicodeStringWithLength(reader, length) {
    var text = '';
    while (length--) {
        var value = readUint16(reader);
        if (value || length > 0) { // remove trailing \0
            text += String.fromCharCode(value);
        }
    }
    return text;
}
export function readAsciiString(reader, length) {
    var text = '';
    while (length--) {
        text += String.fromCharCode(readUint8(reader));
    }
    return text;
}
export function skipBytes(reader, count) {
    reader.offset += count;
}
export function checkSignature(reader, a, b) {
    var offset = reader.offset;
    var signature = readSignature(reader);
    if (signature !== a && signature !== b) {
        throw new Error("Invalid signature: '".concat(signature, "' at 0x").concat(offset.toString(16)));
    }
}
function readShortString(reader, length) {
    var buffer = readBytes(reader, length);
    var result = '';
    for (var i = 0; i < buffer.length; i++) {
        result += String.fromCharCode(buffer[i]);
    }
    return result;
}
function isValidSignature(sig) {
    return sig === '8BIM' || sig === 'MeSa' || sig === 'AgHg' || sig === 'PHUT' || sig === 'DCSR';
}
export function readPsd(reader, options) {
    var _a;
    if (options === void 0) { options = {}; }
    // header
    checkSignature(reader, '8BPS');
    var version = readUint16(reader);
    if (version !== 1 && version !== 2)
        throw new Error("Invalid PSD file version: ".concat(version));
    skipBytes(reader, 6);
    var channels = readUint16(reader);
    var height = readUint32(reader);
    var width = readUint32(reader);
    var bitsPerChannel = readUint16(reader);
    var colorMode = readUint16(reader);
    var maxSize = version === 1 ? 30000 : 300000;
    if (width > maxSize || height > maxSize)
        throw new Error("Invalid size");
    if (channels > 16)
        throw new Error("Invalid channel count");
    if (bitsPerChannel > 32)
        throw new Error("Invalid bitsPerChannel count");
    if (supportedColorModes.indexOf(colorMode) === -1)
        throw new Error("Color mode not supported: ".concat((_a = colorModes[colorMode]) !== null && _a !== void 0 ? _a : colorMode));
    var psd = { width: width, height: height, channels: channels, bitsPerChannel: bitsPerChannel, colorMode: colorMode };
    var opt = __assign(__assign({}, options), { large: version === 2 });
    var fixOffsets = [0, 1, -1, 2, -2, 3, -3, 4, -4];
    // color mode data
    readSection(reader, 1, function (left) {
        if (opt.throwForMissingFeatures)
            throw new Error('Color mode data not supported');
        skipBytes(reader, left());
    });
    // image resources
    readSection(reader, 1, function (left) {
        var _loop_1 = function () {
            var sigOffset = reader.offset;
            var sig = '';
            // attempt to fix broken document by realigning with the signature
            for (var _i = 0, fixOffsets_1 = fixOffsets; _i < fixOffsets_1.length; _i++) {
                var offset = fixOffsets_1[_i];
                try {
                    reader.offset = sigOffset + offset;
                    sig = readSignature(reader);
                }
                catch (_a) { }
                if (isValidSignature(sig))
                    break;
            }
            if (!isValidSignature(sig)) {
                throw new Error("Invalid signature: '".concat(sig, "' at 0x").concat((sigOffset).toString(16)));
            }
            var id = readUint16(reader);
            readPascalString(reader, 2); // name
            readSection(reader, 2, function (left) {
                var handler = resourceHandlersMap[id];
                var skip = id === 1036 && !!opt.skipThumbnail;
                if (!psd.imageResources) {
                    psd.imageResources = {};
                }
                if (handler && !skip) {
                    try {
                        handler.read(reader, psd.imageResources, left, opt);
                    }
                    catch (e) {
                        if (opt.throwForMissingFeatures)
                            throw e;
                        skipBytes(reader, left());
                    }
                }
                else {
                    // options.logMissingFeatures && console.log(`Unhandled image resource: ${id}`);
                    skipBytes(reader, left());
                }
            });
        };
        while (left()) {
            _loop_1();
        }
    });
    // layer and mask info
    var globalAlpha = false;
    readSection(reader, 1, function (left) {
        globalAlpha = readLayerInfo(reader, psd, opt);
        // SAI does not include this section
        if (left() > 0) {
            var globalLayerMaskInfo = readGlobalLayerMaskInfo(reader);
            if (globalLayerMaskInfo)
                psd.globalLayerMaskInfo = globalLayerMaskInfo;
        }
        else {
            // revert back to end of section if exceeded section limits
            // opt.logMissingFeatures && console.log('reverting to end of section');
            skipBytes(reader, left());
        }
        while (left() > 0) {
            // sometimes there are empty bytes here
            while (left() && peekUint8(reader) === 0) {
                // opt.logMissingFeatures && console.log('skipping 0 byte');
                skipBytes(reader, 1);
            }
            if (left() >= 12) {
                readAdditionalLayerInfo(reader, psd, psd, opt);
            }
            else {
                // opt.logMissingFeatures && console.log('skipping leftover bytes', left());
                skipBytes(reader, left());
            }
        }
    }, undefined, opt.large);
    var hasChildren = psd.children && psd.children.length;
    var skipComposite = opt.skipCompositeImageData && (opt.skipLayerImageData || hasChildren);
    if (!skipComposite) {
        readImageData(reader, psd, globalAlpha, opt);
    }
    // TODO: show converted color mode instead of original PSD file color mode
    //       but add option to preserve file color mode (need to return image data instead of canvas in that case)
    // psd.colorMode = ColorMode.RGB; // we convert all color modes to RGB
    return psd;
}
function readLayerInfo(reader, psd, options) {
    var globalAlpha = false;
    readSection(reader, 2, function (left) {
        var layerCount = readInt16(reader);
        if (layerCount < 0) {
            globalAlpha = true;
            layerCount = -layerCount;
        }
        var layers = [];
        var layerChannels = [];
        for (var i = 0; i < layerCount; i++) {
            var _a = readLayerRecord(reader, psd, options), layer = _a.layer, channels = _a.channels;
            layers.push(layer);
            layerChannels.push(channels);
        }
        if (!options.skipLayerImageData) {
            for (var i = 0; i < layerCount; i++) {
                readLayerChannelImageData(reader, psd, layers[i], layerChannels[i], options);
            }
        }
        skipBytes(reader, left());
        if (!psd.children)
            psd.children = [];
        var stack = [psd];
        for (var i = layers.length - 1; i >= 0; i--) {
            var l = layers[i];
            var type = l.sectionDivider ? l.sectionDivider.type : 0 /* SectionDividerType.Other */;
            if (type === 1 /* SectionDividerType.OpenFolder */ || type === 2 /* SectionDividerType.ClosedFolder */) {
                l.opened = type === 1 /* SectionDividerType.OpenFolder */;
                l.children = [];
                stack[stack.length - 1].children.unshift(l);
                stack.push(l);
            }
            else if (type === 3 /* SectionDividerType.BoundingSectionDivider */) {
                stack.pop();
                // this was workaround because I didn't know what `lsdk` section was, now it's probably not needed anymore
                // } else if (l.name === '</Layer group>' && !l.sectionDivider && !l.top && !l.left && !l.bottom && !l.right) {
                // 	// sometimes layer group terminator doesn't have sectionDivider, so we just guess here (PS bug ?)
                // 	stack.pop();
            }
            else {
                stack[stack.length - 1].children.unshift(l);
            }
        }
    }, undefined, options.large);
    return globalAlpha;
}
function readLayerRecord(reader, psd, options) {
    var layer = {};
    layer.top = readInt32(reader);
    layer.left = readInt32(reader);
    layer.bottom = readInt32(reader);
    layer.right = readInt32(reader);
    var channelCount = readUint16(reader);
    var channels = [];
    for (var i = 0; i < channelCount; i++) {
        var channelID = readInt16(reader);
        var channelLength = readUint32(reader);
        if (options.large) {
            if (channelLength !== 0)
                throw new Error('Sizes larger than 4GB are not supported');
            channelLength = readUint32(reader);
        }
        channels.push({ id: channelID, length: channelLength });
    }
    checkSignature(reader, '8BIM');
    var blendMode = readSignature(reader);
    if (!toBlendMode[blendMode])
        throw new Error("Invalid blend mode: '".concat(blendMode, "'"));
    layer.blendMode = toBlendMode[blendMode];
    layer.opacity = readUint8(reader) / 0xff;
    layer.clipping = readUint8(reader) === 1;
    var flags = readUint8(reader);
    layer.transparencyProtected = (flags & 0x01) !== 0;
    layer.hidden = (flags & 0x02) !== 0;
    // 0x04 - obsolete
    // 0x08 - 1 for Photoshop 5.0 and later, tells if bit 4 has useful information
    // 0x10 - pixel data irrelevant to appearance of document
    // 0x20 - ???
    // if (flags & 0x20) (layer as any)._2 = true; // TEMP !!!!
    skipBytes(reader, 1);
    readSection(reader, 1, function (left) {
        var mask = readLayerMaskData(reader, options);
        if (mask)
            layer.mask = mask;
        /*const blendingRanges =*/ readLayerBlendingRanges(reader);
        layer.name = readPascalString(reader, 4);
        while (left()) {
            readAdditionalLayerInfo(reader, layer, psd, options);
        }
    });
    return { layer: layer, channels: channels };
}
function readLayerMaskData(reader, options) {
    return readSection(reader, 1, function (left) {
        if (!left())
            return undefined;
        var mask = {};
        mask.top = readInt32(reader);
        mask.left = readInt32(reader);
        mask.bottom = readInt32(reader);
        mask.right = readInt32(reader);
        mask.defaultColor = readUint8(reader);
        var flags = readUint8(reader);
        mask.positionRelativeToLayer = (flags & 1 /* LayerMaskFlags.PositionRelativeToLayer */) !== 0;
        mask.disabled = (flags & 2 /* LayerMaskFlags.LayerMaskDisabled */) !== 0;
        mask.fromVectorData = (flags & 8 /* LayerMaskFlags.LayerMaskFromRenderingOtherData */) !== 0;
        if (flags & 16 /* LayerMaskFlags.MaskHasParametersAppliedToIt */) {
            var params = readUint8(reader);
            if (params & 1 /* MaskParams.UserMaskDensity */)
                mask.userMaskDensity = readUint8(reader) / 0xff;
            if (params & 2 /* MaskParams.UserMaskFeather */)
                mask.userMaskFeather = readFloat64(reader);
            if (params & 4 /* MaskParams.VectorMaskDensity */)
                mask.vectorMaskDensity = readUint8(reader) / 0xff;
            if (params & 8 /* MaskParams.VectorMaskFeather */)
                mask.vectorMaskFeather = readFloat64(reader);
        }
        if (left() > 2) {
            options.logMissingFeatures && console.log('Unhandled extra mask params');
            // TODO: handle these values
            /*const realFlags =*/ readUint8(reader);
            /*const realUserMaskBackground =*/ readUint8(reader);
            /*const top2 =*/ readInt32(reader);
            /*const left2 =*/ readInt32(reader);
            /*const bottom2 =*/ readInt32(reader);
            /*const right2 =*/ readInt32(reader);
        }
        skipBytes(reader, left());
        return mask;
    });
}
function readLayerBlendingRanges(reader) {
    return readSection(reader, 1, function (left) {
        var compositeGrayBlendSource = readUint32(reader);
        var compositeGraphBlendDestinationRange = readUint32(reader);
        var ranges = [];
        while (left()) {
            var sourceRange = readUint32(reader);
            var destRange = readUint32(reader);
            ranges.push({ sourceRange: sourceRange, destRange: destRange });
        }
        return { compositeGrayBlendSource: compositeGrayBlendSource, compositeGraphBlendDestinationRange: compositeGraphBlendDestinationRange, ranges: ranges };
    });
}
function readLayerChannelImageData(reader, psd, layer, channels, options) {
    var layerWidth = (layer.right || 0) - (layer.left || 0);
    var layerHeight = (layer.bottom || 0) - (layer.top || 0);
    var cmyk = psd.colorMode === 4 /* ColorMode.CMYK */;
    var imageData;
    if (layerWidth && layerHeight) {
        if (cmyk) {
            imageData = { width: layerWidth, height: layerHeight, data: new Uint8ClampedArray(layerWidth * layerHeight * 5) };
            for (var p = 4; p < imageData.data.byteLength; p += 5)
                imageData.data[p] = 255;
        }
        else {
            imageData = createImageData(layerWidth, layerHeight);
            resetImageData(imageData);
        }
    }
    if (RAW_IMAGE_DATA)
        layer.imageDataRaw = [];
    for (var _i = 0, channels_1 = channels; _i < channels_1.length; _i++) {
        var channel = channels_1[_i];
        if (channel.length === 0)
            continue;
        if (channel.length < 2)
            throw new Error('Invalid channel length');
        var start = reader.offset;
        var compression = readUint16(reader);
        if (channel.id === -2 /* ChannelID.UserMask */) {
            var mask = layer.mask;
            if (!mask)
                throw new Error("Missing layer mask data");
            var maskWidth = (mask.right || 0) - (mask.left || 0);
            var maskHeight = (mask.bottom || 0) - (mask.top || 0);
            if (maskWidth && maskHeight) {
                var maskData = createImageData(maskWidth, maskHeight);
                resetImageData(maskData);
                var start_1 = reader.offset;
                readData(reader, channel.length, maskData, compression, maskWidth, maskHeight, 0, options.large, 4);
                if (RAW_IMAGE_DATA) {
                    layer.maskDataRaw = new Uint8Array(reader.view.buffer, reader.view.byteOffset + start_1, reader.offset - start_1);
                }
                setupGrayscale(maskData);
                if (options.useImageData) {
                    mask.imageData = maskData;
                }
                else {
                    mask.canvas = createCanvas(maskWidth, maskHeight);
                    mask.canvas.getContext('2d').putImageData(maskData, 0, 0);
                }
            }
        }
        else {
            var offset = offsetForChannel(channel.id, cmyk);
            var targetData = imageData;
            if (offset < 0) {
                targetData = undefined;
                if (options.throwForMissingFeatures) {
                    throw new Error("Channel not supported: ".concat(channel.id));
                }
            }
            readData(reader, channel.length, targetData, compression, layerWidth, layerHeight, offset, options.large, cmyk ? 5 : 4);
            if (RAW_IMAGE_DATA) {
                layer.imageDataRaw[channel.id] = new Uint8Array(reader.view.buffer, reader.view.byteOffset + start + 2, channel.length - 2);
            }
            reader.offset = start + channel.length;
            if (targetData && psd.colorMode === 1 /* ColorMode.Grayscale */) {
                setupGrayscale(targetData);
            }
        }
    }
    if (imageData) {
        if (cmyk) {
            var cmykData = imageData;
            imageData = createImageData(cmykData.width, cmykData.height);
            cmykToRgb(cmykData, imageData, false);
        }
        if (options.useImageData) {
            layer.imageData = imageData;
        }
        else {
            layer.canvas = createCanvas(layerWidth, layerHeight);
            layer.canvas.getContext('2d').putImageData(imageData, 0, 0);
        }
    }
}
function readData(reader, length, data, compression, width, height, offset, large, step) {
    if (compression === 0 /* Compression.RawData */) {
        readDataRaw(reader, data, width, height, step, offset);
    }
    else if (compression === 1 /* Compression.RleCompressed */) {
        readDataRLE(reader, data, width, height, step, [offset], large);
    }
    else if (compression === 2 /* Compression.ZipWithoutPrediction */) {
        readDataZipWithoutPrediction(reader, length, data, width, height, step, offset);
    }
    else if (compression === 3 /* Compression.ZipWithPrediction */) {
        throw new Error("Compression type not supported: ".concat(compression));
    }
    else {
        throw new Error("Invalid Compression type: ".concat(compression));
    }
}
function readGlobalLayerMaskInfo(reader) {
    return readSection(reader, 1, function (left) {
        if (!left())
            return undefined;
        var overlayColorSpace = readUint16(reader);
        var colorSpace1 = readUint16(reader);
        var colorSpace2 = readUint16(reader);
        var colorSpace3 = readUint16(reader);
        var colorSpace4 = readUint16(reader);
        var opacity = readUint16(reader) / 0xff;
        var kind = readUint8(reader);
        skipBytes(reader, left()); // 3 bytes of padding ?
        return { overlayColorSpace: overlayColorSpace, colorSpace1: colorSpace1, colorSpace2: colorSpace2, colorSpace3: colorSpace3, colorSpace4: colorSpace4, opacity: opacity, kind: kind };
    });
}
function readAdditionalLayerInfo(reader, target, psd, options) {
    var sig = readSignature(reader);
    if (sig !== '8BIM' && sig !== '8B64')
        throw new Error("Invalid signature: '".concat(sig, "' at 0x").concat((reader.offset - 4).toString(16)));
    var key = readSignature(reader);
    // `largeAdditionalInfoKeys` fallback, because some keys don't have 8B64 signature even when they are 64bit
    var u64 = sig === '8B64' || (options.large && largeAdditionalInfoKeys.indexOf(key) !== -1);
    readSection(reader, 2, function (left) {
        var handler = infoHandlersMap[key];
        if (handler) {
            try {
                handler.read(reader, target, left, psd, options);
            }
            catch (e) {
                if (options.throwForMissingFeatures)
                    throw e;
            }
        }
        else {
            options.logMissingFeatures && console.log("Unhandled additional info: ".concat(key));
            skipBytes(reader, left());
        }
        if (left()) {
            options.logMissingFeatures && console.log("Unread ".concat(left(), " bytes left for additional info: ").concat(key));
            skipBytes(reader, left());
        }
    }, false, u64);
}
function readImageData(reader, psd, globalAlpha, options) {
    var compression = readUint16(reader);
    if (supportedColorModes.indexOf(psd.colorMode) === -1)
        throw new Error("Color mode not supported: ".concat(psd.colorMode));
    if (compression !== 0 /* Compression.RawData */ && compression !== 1 /* Compression.RleCompressed */)
        throw new Error("Compression type not supported: ".concat(compression));
    var imageData = createImageData(psd.width, psd.height);
    resetImageData(imageData);
    switch (psd.colorMode) {
        case 0 /* ColorMode.Bitmap */: {
            var bytes = void 0;
            if (compression === 0 /* Compression.RawData */) {
                bytes = readBytes(reader, Math.ceil(psd.width / 8) * psd.height);
            }
            else if (compression === 1 /* Compression.RleCompressed */) {
                bytes = new Uint8Array(psd.width * psd.height);
                readDataRLE(reader, { data: bytes, width: psd.width, height: psd.height }, psd.width, psd.height, 1, [0], options.large);
            }
            else {
                throw new Error("Bitmap compression not supported: ".concat(compression));
            }
            decodeBitmap(bytes, imageData.data, psd.width, psd.height);
            break;
        }
        case 3 /* ColorMode.RGB */:
        case 1 /* ColorMode.Grayscale */: {
            var channels = psd.colorMode === 1 /* ColorMode.Grayscale */ ? [0] : [0, 1, 2];
            if (psd.channels && psd.channels > 3) {
                for (var i = 3; i < psd.channels; i++) {
                    // TODO: store these channels in additional image data
                    channels.push(i);
                }
            }
            else if (globalAlpha) {
                channels.push(3);
            }
            if (compression === 0 /* Compression.RawData */) {
                for (var i = 0; i < channels.length; i++) {
                    readDataRaw(reader, imageData, psd.width, psd.height, 4, channels[i]);
                }
            }
            else if (compression === 1 /* Compression.RleCompressed */) {
                var start = reader.offset;
                readDataRLE(reader, imageData, psd.width, psd.height, 4, channels, options.large);
                if (RAW_IMAGE_DATA)
                    psd.imageDataRaw = new Uint8Array(reader.view.buffer, reader.view.byteOffset + start, reader.offset - start);
            }
            if (psd.colorMode === 1 /* ColorMode.Grayscale */) {
                setupGrayscale(imageData);
            }
            break;
        }
        case 4 /* ColorMode.CMYK */: {
            if (psd.channels !== 4)
                throw new Error("Invalid channel count");
            var channels = [0, 1, 2, 3];
            if (globalAlpha)
                channels.push(4);
            if (compression === 0 /* Compression.RawData */) {
                throw new Error("Not implemented");
                // TODO: ...
                // for (let i = 0; i < channels.length; i++) {
                // 	readDataRaw(reader, imageData, channels[i], psd.width, psd.height);
                // }
            }
            else if (compression === 1 /* Compression.RleCompressed */) {
                var cmykImageData = {
                    width: imageData.width,
                    height: imageData.height,
                    data: new Uint8Array(imageData.width * imageData.height * 5),
                };
                var start = reader.offset;
                readDataRLE(reader, cmykImageData, psd.width, psd.height, 5, channels, options.large);
                cmykToRgb(cmykImageData, imageData, true);
                if (RAW_IMAGE_DATA)
                    psd.imageDataRaw = new Uint8Array(reader.view.buffer, reader.view.byteOffset + start, reader.offset - start);
            }
            break;
        }
        default: throw new Error("Color mode not supported: ".concat(psd.colorMode));
    }
    if (options.useImageData) {
        psd.imageData = imageData;
    }
    else {
        psd.canvas = createCanvas(psd.width, psd.height);
        psd.canvas.getContext('2d').putImageData(imageData, 0, 0);
    }
}
function cmykToRgb(cmyk, rgb, reverseAlpha) {
    var size = rgb.width * rgb.height * 4;
    var srcData = cmyk.data;
    var dstData = rgb.data;
    for (var src = 0, dst = 0; dst < size; src += 5, dst += 4) {
        var c = srcData[src];
        var m = srcData[src + 1];
        var y = srcData[src + 2];
        var k = srcData[src + 3];
        dstData[dst] = ((((c * k) | 0) / 255) | 0);
        dstData[dst + 1] = ((((m * k) | 0) / 255) | 0);
        dstData[dst + 2] = ((((y * k) | 0) / 255) | 0);
        dstData[dst + 3] = reverseAlpha ? 255 - srcData[src + 4] : srcData[src + 4];
    }
    // for (let src = 0, dst = 0; dst < size; src += 5, dst += 4) {
    // 	const c = 1 - (srcData[src + 0] / 255);
    // 	const m = 1 - (srcData[src + 1] / 255);
    // 	const y = 1 - (srcData[src + 2] / 255);
    // 	// const k = srcData[src + 3] / 255;
    // 	dstData[dst + 0] = ((1 - c * 0.8) * 255) | 0;
    // 	dstData[dst + 1] = ((1 - m * 0.8) * 255) | 0;
    // 	dstData[dst + 2] = ((1 - y * 0.8) * 255) | 0;
    // 	dstData[dst + 3] = reverseAlpha ? 255 - srcData[src + 4] : srcData[src + 4];
    // }
}
function readDataRaw(reader, pixelData, width, height, step, offset) {
    var size = width * height;
    var buffer = readBytes(reader, size);
    if (pixelData && offset < step) {
        var data = pixelData.data;
        for (var i = 0, p = offset | 0; i < size; i++, p = (p + step) | 0) {
            data[p] = buffer[i];
        }
    }
}
export function readDataZipWithoutPrediction(reader, length, pixelData, width, height, step, offset) {
    var compressed = readBytes(reader, length);
    var decompressed = inflate(compressed);
    var size = width * height;
    if (pixelData && offset < step) {
        var data = pixelData.data;
        for (var i = 0, p = offset | 0; i < size; i++, p = (p + step) | 0) {
            data[p] = decompressed[i];
        }
    }
}
export function readDataRLE(reader, pixelData, _width, height, step, offsets, large) {
    var data = pixelData && pixelData.data;
    var lengths;
    if (large) {
        lengths = new Uint32Array(offsets.length * height);
        for (var o = 0, li = 0; o < offsets.length; o++) {
            for (var y = 0; y < height; y++, li++) {
                lengths[li] = readUint32(reader);
            }
        }
    }
    else {
        lengths = new Uint16Array(offsets.length * height);
        for (var o = 0, li = 0; o < offsets.length; o++) {
            for (var y = 0; y < height; y++, li++) {
                lengths[li] = readUint16(reader);
            }
        }
    }
    var extraLimit = (step - 1) | 0; // 3 for rgb, 4 for cmyk
    for (var c = 0, li = 0; c < offsets.length; c++) {
        var offset = offsets[c] | 0;
        var extra = c > extraLimit || offset > extraLimit;
        if (!data || extra) {
            for (var y = 0; y < height; y++, li++) {
                skipBytes(reader, lengths[li]);
            }
        }
        else {
            for (var y = 0, p = offset | 0; y < height; y++, li++) {
                var length_1 = lengths[li];
                var buffer = readBytes(reader, length_1);
                for (var i = 0; i < length_1; i++) {
                    var header = buffer[i];
                    if (header > 128) {
                        var value = buffer[++i];
                        header = (256 - header) | 0;
                        for (var j = 0; j <= header; j = (j + 1) | 0) {
                            data[p] = value;
                            p = (p + step) | 0;
                        }
                    }
                    else if (header < 128) {
                        for (var j = 0; j <= header; j = (j + 1) | 0) {
                            data[p] = buffer[++i];
                            p = (p + step) | 0;
                        }
                    }
                    else {
                        // ignore 128
                    }
                    // This showed up on some images from non-photoshop programs, ignoring it seems to work just fine.
                    // if (i >= length) throw new Error(`Invalid RLE data: exceeded buffer size ${i}/${length}`);
                }
            }
        }
    }
}
export function readSection(reader, round, func, skipEmpty, eightBytes) {
    if (skipEmpty === void 0) { skipEmpty = true; }
    if (eightBytes === void 0) { eightBytes = false; }
    var length = readUint32(reader);
    if (eightBytes) {
        if (length !== 0)
            throw new Error('Sizes larger than 4GB are not supported');
        length = readUint32(reader);
    }
    if (length <= 0 && skipEmpty)
        return undefined;
    var end = reader.offset + length;
    if (end > reader.view.byteLength)
        throw new Error('Section exceeds file size');
    var result = func(function () { return end - reader.offset; });
    if (reader.offset !== end) {
        if (reader.offset > end) {
            warnOrThrow(reader, 'Exceeded section limits');
        }
        else {
            warnOrThrow(reader, "Unread section data"); // : ${end - reader.offset} bytes at 0x${reader.offset.toString(16)}`);
        }
    }
    while (end % round)
        end++;
    reader.offset = end;
    return result;
}
export function readColor(reader) {
    var colorSpace = readUint16(reader);
    switch (colorSpace) {
        case 0 /* ColorSpace.RGB */: {
            var r = readUint16(reader) / 257;
            var g = readUint16(reader) / 257;
            var b = readUint16(reader) / 257;
            skipBytes(reader, 2);
            return { r: r, g: g, b: b };
        }
        case 1 /* ColorSpace.HSB */: {
            var h = readUint16(reader) / 0xffff;
            var s = readUint16(reader) / 0xffff;
            var b = readUint16(reader) / 0xffff;
            skipBytes(reader, 2);
            return { h: h, s: s, b: b };
        }
        case 2 /* ColorSpace.CMYK */: {
            var c = readUint16(reader) / 257;
            var m = readUint16(reader) / 257;
            var y = readUint16(reader) / 257;
            var k = readUint16(reader) / 257;
            return { c: c, m: m, y: y, k: k };
        }
        case 7 /* ColorSpace.Lab */: {
            var l = readInt16(reader) / 10000;
            var ta = readInt16(reader);
            var tb = readInt16(reader);
            var a = ta < 0 ? (ta / 12800) : (ta / 12700);
            var b = tb < 0 ? (tb / 12800) : (tb / 12700);
            skipBytes(reader, 2);
            return { l: l, a: a, b: b };
        }
        case 8 /* ColorSpace.Grayscale */: {
            var k = readUint16(reader) * 255 / 10000;
            skipBytes(reader, 6);
            return { k: k };
        }
        default:
            throw new Error('Invalid color space');
    }
}
export function readPattern(reader) {
    readUint32(reader); // length
    var version = readUint32(reader);
    if (version !== 1)
        throw new Error("Invalid pattern version: ".concat(version));
    var colorMode = readUint32(reader);
    var x = readInt16(reader);
    var y = readInt16(reader);
    // we only support RGB and grayscale for now
    if (colorMode !== 3 /* ColorMode.RGB */ && colorMode !== 1 /* ColorMode.Grayscale */ && colorMode !== 2 /* ColorMode.Indexed */) {
        throw new Error("Unsupported pattern color mode: ".concat(colorMode));
    }
    var name = readUnicodeString(reader);
    var id = readPascalString(reader, 1);
    var palette = [];
    if (colorMode === 2 /* ColorMode.Indexed */) {
        for (var i = 0; i < 256; i++) {
            palette.push({
                r: readUint8(reader),
                g: readUint8(reader),
                b: readUint8(reader),
            });
        }
        skipBytes(reader, 4); // no idea what this is
    }
    // virtual memory array list
    var version2 = readUint32(reader);
    if (version2 !== 3)
        throw new Error("Invalid pattern VMAL version: ".concat(version2));
    readUint32(reader); // length
    var top = readUint32(reader);
    var left = readUint32(reader);
    var bottom = readUint32(reader);
    var right = readUint32(reader);
    var channelsCount = readUint32(reader);
    var width = right - left;
    var height = bottom - top;
    var data = new Uint8Array(width * height * 4);
    for (var i = 3; i < data.byteLength; i += 4) {
        data[i] = 255;
    }
    for (var i = 0, ch = 0; i < (channelsCount + 2); i++) {
        var has = readUint32(reader);
        if (!has)
            continue;
        var length_2 = readUint32(reader);
        var pixelDepth = readUint32(reader);
        var ctop = readUint32(reader);
        var cleft = readUint32(reader);
        var cbottom = readUint32(reader);
        var cright = readUint32(reader);
        var pixelDepth2 = readUint16(reader);
        var compressionMode = readUint8(reader); // 0 - raw, 1 - zip
        var dataLength = length_2 - (4 + 16 + 2 + 1);
        var cdata = readBytes(reader, dataLength);
        if (pixelDepth !== 8 || pixelDepth2 !== 8) {
            throw new Error('16bit pixel depth not supported for patterns');
        }
        var w = cright - cleft;
        var h = cbottom - ctop;
        var ox = cleft - left;
        var oy = ctop - top;
        if (compressionMode === 0) {
            if (colorMode === 3 /* ColorMode.RGB */ && ch < 3) {
                for (var y_1 = 0; y_1 < h; y_1++) {
                    for (var x_1 = 0; x_1 < w; x_1++) {
                        var src = x_1 + y_1 * w;
                        var dst = (ox + x_1 + (y_1 + oy) * width) * 4;
                        data[dst + ch] = cdata[src];
                    }
                }
            }
            if (colorMode === 1 /* ColorMode.Grayscale */ && ch < 1) {
                for (var y_2 = 0; y_2 < h; y_2++) {
                    for (var x_2 = 0; x_2 < w; x_2++) {
                        var src = x_2 + y_2 * w;
                        var dst = (ox + x_2 + (y_2 + oy) * width) * 4;
                        var value = cdata[src];
                        data[dst + 0] = value;
                        data[dst + 1] = value;
                        data[dst + 2] = value;
                    }
                }
            }
            if (colorMode === 2 /* ColorMode.Indexed */) {
                // TODO:
                throw new Error('Indexed pattern color mode not implemented');
            }
        }
        else if (compressionMode === 1) {
            // console.log({ colorMode });
            // require('fs').writeFileSync('zip.bin', Buffer.from(cdata));
            // const data = require('zlib').inflateRawSync(cdata);
            // const data = require('zlib').unzipSync(cdata);
            // console.log(data);
            // throw new Error('Zip compression not supported for pattern');
            // throw new Error('Unsupported pattern compression');
            console.error('Unsupported pattern compression');
            name += ' (failed to decode)';
        }
        else {
            throw new Error('Invalid pattern compression mode');
        }
        ch++;
    }
    // TODO: use canvas instead of data ?
    return { id: id, name: name, x: x, y: y, bounds: { x: left, y: top, w: width, h: height }, data: data };
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LEVBQUUsRUFBRSxJQUFJLE1BQUEsRUFBRSxDQUFDO0FBQ25GLENBQUMiLCJmaWxlIjoicHNkUmVhZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaW5mbGF0ZSB9IGZyb20gJ3Bha28nO1xuaW1wb3J0IHtcblx0UHNkLCBMYXllciwgQ29sb3JNb2RlLCBTZWN0aW9uRGl2aWRlclR5cGUsIExheWVyQWRkaXRpb25hbEluZm8sIFJlYWRPcHRpb25zLCBMYXllck1hc2tEYXRhLCBDb2xvcixcblx0UGF0dGVybkluZm8sIEdsb2JhbExheWVyTWFza0luZm8sIFJHQlxufSBmcm9tICcuL3BzZCc7XG5pbXBvcnQge1xuXHRyZXNldEltYWdlRGF0YSwgb2Zmc2V0Rm9yQ2hhbm5lbCwgZGVjb2RlQml0bWFwLCBQaXhlbERhdGEsIGNyZWF0ZUNhbnZhcywgY3JlYXRlSW1hZ2VEYXRhLFxuXHR0b0JsZW5kTW9kZSwgQ2hhbm5lbElELCBDb21wcmVzc2lvbiwgTGF5ZXJNYXNrRmxhZ3MsIE1hc2tQYXJhbXMsIENvbG9yU3BhY2UsIFJBV19JTUFHRV9EQVRBLCBsYXJnZUFkZGl0aW9uYWxJbmZvS2V5c1xufSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgaW5mb0hhbmRsZXJzTWFwIH0gZnJvbSAnLi9hZGRpdGlvbmFsSW5mbyc7XG5pbXBvcnQgeyByZXNvdXJjZUhhbmRsZXJzTWFwIH0gZnJvbSAnLi9pbWFnZVJlc291cmNlcyc7XG5cbmludGVyZmFjZSBDaGFubmVsSW5mbyB7XG5cdGlkOiBDaGFubmVsSUQ7XG5cdGxlbmd0aDogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgUmVhZE9wdGlvbnNFeHQgZXh0ZW5kcyBSZWFkT3B0aW9ucyB7XG5cdGxhcmdlOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3Qgc3VwcG9ydGVkQ29sb3JNb2RlcyA9IFtDb2xvck1vZGUuQml0bWFwLCBDb2xvck1vZGUuR3JheXNjYWxlLCBDb2xvck1vZGUuUkdCXTtcbmNvbnN0IGNvbG9yTW9kZXMgPSBbJ2JpdG1hcCcsICdncmF5c2NhbGUnLCAnaW5kZXhlZCcsICdSR0InLCAnQ01ZSycsICdtdWx0aWNoYW5uZWwnLCAnZHVvdG9uZScsICdsYWInXTtcblxuZnVuY3Rpb24gc2V0dXBHcmF5c2NhbGUoZGF0YTogUGl4ZWxEYXRhKSB7XG5cdGNvbnN0IHNpemUgPSBkYXRhLndpZHRoICogZGF0YS5oZWlnaHQgKiA0O1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSArPSA0KSB7XG5cdFx0ZGF0YS5kYXRhW2kgKyAxXSA9IGRhdGEuZGF0YVtpXTtcblx0XHRkYXRhLmRhdGFbaSArIDJdID0gZGF0YS5kYXRhW2ldO1xuXHR9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHNkUmVhZGVyIHtcblx0b2Zmc2V0OiBudW1iZXI7XG5cdHZpZXc6IERhdGFWaWV3O1xuXHRzdHJpY3Q6IGJvb2xlYW47XG5cdGRlYnVnOiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmVhZGVyKGJ1ZmZlcjogQXJyYXlCdWZmZXIsIG9mZnNldD86IG51bWJlciwgbGVuZ3RoPzogbnVtYmVyKTogUHNkUmVhZGVyIHtcblx0Y29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIsIG9mZnNldCwgbGVuZ3RoKTtcblx0cmV0dXJuIHsgdmlldywgb2Zmc2V0OiAwLCBzdHJpY3Q6IGZhbHNlLCBkZWJ1ZzogZmFsc2UgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhcm5PclRocm93KHJlYWRlcjogUHNkUmVhZGVyLCBtZXNzYWdlOiBzdHJpbmcpIHtcblx0aWYgKHJlYWRlci5zdHJpY3QpIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcblx0aWYgKHJlYWRlci5kZWJ1ZykgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFVpbnQ4KHJlYWRlcjogUHNkUmVhZGVyKSB7XG5cdHJlYWRlci5vZmZzZXQgKz0gMTtcblx0cmV0dXJuIHJlYWRlci52aWV3LmdldFVpbnQ4KHJlYWRlci5vZmZzZXQgLSAxKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBlZWtVaW50OChyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRyZXR1cm4gcmVhZGVyLnZpZXcuZ2V0VWludDgocmVhZGVyLm9mZnNldCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkSW50MTYocmVhZGVyOiBQc2RSZWFkZXIpIHtcblx0cmVhZGVyLm9mZnNldCArPSAyO1xuXHRyZXR1cm4gcmVhZGVyLnZpZXcuZ2V0SW50MTYocmVhZGVyLm9mZnNldCAtIDIsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRVaW50MTYocmVhZGVyOiBQc2RSZWFkZXIpIHtcblx0cmVhZGVyLm9mZnNldCArPSAyO1xuXHRyZXR1cm4gcmVhZGVyLnZpZXcuZ2V0VWludDE2KHJlYWRlci5vZmZzZXQgLSAyLCBmYWxzZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkSW50MzIocmVhZGVyOiBQc2RSZWFkZXIpIHtcblx0cmVhZGVyLm9mZnNldCArPSA0O1xuXHRyZXR1cm4gcmVhZGVyLnZpZXcuZ2V0SW50MzIocmVhZGVyLm9mZnNldCAtIDQsIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRJbnQzMkxFKHJlYWRlcjogUHNkUmVhZGVyKSB7XG5cdHJlYWRlci5vZmZzZXQgKz0gNDtcblx0cmV0dXJuIHJlYWRlci52aWV3LmdldEludDMyKHJlYWRlci5vZmZzZXQgLSA0LCB0cnVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRVaW50MzIocmVhZGVyOiBQc2RSZWFkZXIpIHtcblx0cmVhZGVyLm9mZnNldCArPSA0O1xuXHRyZXR1cm4gcmVhZGVyLnZpZXcuZ2V0VWludDMyKHJlYWRlci5vZmZzZXQgLSA0LCBmYWxzZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRmxvYXQzMihyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRyZWFkZXIub2Zmc2V0ICs9IDQ7XG5cdHJldHVybiByZWFkZXIudmlldy5nZXRGbG9hdDMyKHJlYWRlci5vZmZzZXQgLSA0LCBmYWxzZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRmxvYXQ2NChyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRyZWFkZXIub2Zmc2V0ICs9IDg7XG5cdHJldHVybiByZWFkZXIudmlldy5nZXRGbG9hdDY0KHJlYWRlci5vZmZzZXQgLSA4LCBmYWxzZSk7XG59XG5cbi8vIDMyLWJpdCBmaXhlZC1wb2ludCBudW1iZXIgMTYuMTZcbmV4cG9ydCBmdW5jdGlvbiByZWFkRml4ZWRQb2ludDMyKHJlYWRlcjogUHNkUmVhZGVyKTogbnVtYmVyIHtcblx0cmV0dXJuIHJlYWRJbnQzMihyZWFkZXIpIC8gKDEgPDwgMTYpO1xufVxuXG4vLyAzMi1iaXQgZml4ZWQtcG9pbnQgbnVtYmVyIDguMjRcbmV4cG9ydCBmdW5jdGlvbiByZWFkRml4ZWRQb2ludFBhdGgzMihyZWFkZXI6IFBzZFJlYWRlcik6IG51bWJlciB7XG5cdHJldHVybiByZWFkSW50MzIocmVhZGVyKSAvICgxIDw8IDI0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRCeXRlcyhyZWFkZXI6IFBzZFJlYWRlciwgbGVuZ3RoOiBudW1iZXIpIHtcblx0Y29uc3Qgc3RhcnQgPSByZWFkZXIudmlldy5ieXRlT2Zmc2V0ICsgcmVhZGVyLm9mZnNldDtcblx0cmVhZGVyLm9mZnNldCArPSBsZW5ndGg7XG5cblx0aWYgKChzdGFydCArIGxlbmd0aCkgPiByZWFkZXIudmlldy5idWZmZXIuYnl0ZUxlbmd0aCkge1xuXHRcdC8vIGZpeCBmb3IgYnJva2VuIFBTRCBmaWxlcyB0aGF0IGFyZSBtaXNzaW5nIHBhcnQgb2YgZmlsZSBhdCB0aGUgZW5kXG5cdFx0d2Fybk9yVGhyb3cocmVhZGVyLCAnUmVhZGluZyBieXRlcyBleGNlZWRpbmcgYnVmZmVyIGxlbmd0aCcpO1xuXHRcdGlmIChsZW5ndGggPiAoMTAwICogMTAyNCAqIDEwMjQpKSB0aHJvdyBuZXcgRXJyb3IoJ1JlYWRpbmcgcGFzdCBlbmQgb2YgZmlsZScpOyAvLyBsaW1pdCB0byAxMDBNQlxuXHRcdGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG5cdFx0Y29uc3QgbGVuID0gTWF0aC5taW4obGVuZ3RoLCByZWFkZXIudmlldy5ieXRlTGVuZ3RoIC0gc3RhcnQpO1xuXHRcdGlmIChsZW4gPiAwKSByZXN1bHQuc2V0KG5ldyBVaW50OEFycmF5KHJlYWRlci52aWV3LmJ1ZmZlciwgc3RhcnQsIGxlbikpO1xuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIG5ldyBVaW50OEFycmF5KHJlYWRlci52aWV3LmJ1ZmZlciwgc3RhcnQsIGxlbmd0aCk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRTaWduYXR1cmUocmVhZGVyOiBQc2RSZWFkZXIpIHtcblx0cmV0dXJuIHJlYWRTaG9ydFN0cmluZyhyZWFkZXIsIDQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhc2NhbFN0cmluZyhyZWFkZXI6IFBzZFJlYWRlciwgcGFkVG86IG51bWJlcikge1xuXHRsZXQgbGVuZ3RoID0gcmVhZFVpbnQ4KHJlYWRlcik7XG5cdGNvbnN0IHRleHQgPSBsZW5ndGggPyByZWFkU2hvcnRTdHJpbmcocmVhZGVyLCBsZW5ndGgpIDogJyc7XG5cblx0d2hpbGUgKCsrbGVuZ3RoICUgcGFkVG8pIHtcblx0XHRyZWFkZXIub2Zmc2V0Kys7XG5cdH1cblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRVbmljb2RlU3RyaW5nKHJlYWRlcjogUHNkUmVhZGVyKSB7XG5cdGNvbnN0IGxlbmd0aCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0cmV0dXJuIHJlYWRVbmljb2RlU3RyaW5nV2l0aExlbmd0aChyZWFkZXIsIGxlbmd0aCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkVW5pY29kZVN0cmluZ1dpdGhMZW5ndGgocmVhZGVyOiBQc2RSZWFkZXIsIGxlbmd0aDogbnVtYmVyKSB7XG5cdGxldCB0ZXh0ID0gJyc7XG5cblx0d2hpbGUgKGxlbmd0aC0tKSB7XG5cdFx0Y29uc3QgdmFsdWUgPSByZWFkVWludDE2KHJlYWRlcik7XG5cblx0XHRpZiAodmFsdWUgfHwgbGVuZ3RoID4gMCkgeyAvLyByZW1vdmUgdHJhaWxpbmcgXFwwXG5cdFx0XHR0ZXh0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUodmFsdWUpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0ZXh0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEFzY2lpU3RyaW5nKHJlYWRlcjogUHNkUmVhZGVyLCBsZW5ndGg6IG51bWJlcikge1xuXHRsZXQgdGV4dCA9ICcnO1xuXG5cdHdoaWxlIChsZW5ndGgtLSkge1xuXHRcdHRleHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShyZWFkVWludDgocmVhZGVyKSk7XG5cdH1cblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNraXBCeXRlcyhyZWFkZXI6IFBzZFJlYWRlciwgY291bnQ6IG51bWJlcikge1xuXHRyZWFkZXIub2Zmc2V0ICs9IGNvdW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tTaWduYXR1cmUocmVhZGVyOiBQc2RSZWFkZXIsIGE6IHN0cmluZywgYj86IHN0cmluZykge1xuXHRjb25zdCBvZmZzZXQgPSByZWFkZXIub2Zmc2V0O1xuXHRjb25zdCBzaWduYXR1cmUgPSByZWFkU2lnbmF0dXJlKHJlYWRlcik7XG5cblx0aWYgKHNpZ25hdHVyZSAhPT0gYSAmJiBzaWduYXR1cmUgIT09IGIpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2lnbmF0dXJlOiAnJHtzaWduYXR1cmV9JyBhdCAweCR7b2Zmc2V0LnRvU3RyaW5nKDE2KX1gKTtcblx0fVxufVxuXG5mdW5jdGlvbiByZWFkU2hvcnRTdHJpbmcocmVhZGVyOiBQc2RSZWFkZXIsIGxlbmd0aDogbnVtYmVyKSB7XG5cdGNvbnN0IGJ1ZmZlciA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlbmd0aCk7XG5cdGxldCByZXN1bHQgPSAnJztcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGJ1ZmZlci5sZW5ndGg7IGkrKykge1xuXHRcdHJlc3VsdCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZmZlcltpXSk7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkU2lnbmF0dXJlKHNpZzogc3RyaW5nKSB7XG5cdHJldHVybiBzaWcgPT09ICc4QklNJyB8fCBzaWcgPT09ICdNZVNhJyB8fCBzaWcgPT09ICdBZ0hnJyB8fCBzaWcgPT09ICdQSFVUJyB8fCBzaWcgPT09ICdEQ1NSJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQc2QocmVhZGVyOiBQc2RSZWFkZXIsIG9wdGlvbnM6IFJlYWRPcHRpb25zID0ge30pIHtcblx0Ly8gaGVhZGVyXG5cdGNoZWNrU2lnbmF0dXJlKHJlYWRlciwgJzhCUFMnKTtcblx0Y29uc3QgdmVyc2lvbiA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0aWYgKHZlcnNpb24gIT09IDEgJiYgdmVyc2lvbiAhPT0gMikgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFBTRCBmaWxlIHZlcnNpb246ICR7dmVyc2lvbn1gKTtcblxuXHRza2lwQnl0ZXMocmVhZGVyLCA2KTtcblx0Y29uc3QgY2hhbm5lbHMgPSByZWFkVWludDE2KHJlYWRlcik7XG5cdGNvbnN0IGhlaWdodCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0Y29uc3Qgd2lkdGggPSByZWFkVWludDMyKHJlYWRlcik7XG5cdGNvbnN0IGJpdHNQZXJDaGFubmVsID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRjb25zdCBjb2xvck1vZGUgPSByZWFkVWludDE2KHJlYWRlcik7XG5cdGNvbnN0IG1heFNpemUgPSB2ZXJzaW9uID09PSAxID8gMzAwMDAgOiAzMDAwMDA7XG5cblx0aWYgKHdpZHRoID4gbWF4U2l6ZSB8fCBoZWlnaHQgPiBtYXhTaXplKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2l6ZWApO1xuXHRpZiAoY2hhbm5lbHMgPiAxNikgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGNoYW5uZWwgY291bnRgKTtcblx0aWYgKGJpdHNQZXJDaGFubmVsID4gMzIpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBiaXRzUGVyQ2hhbm5lbCBjb3VudGApO1xuXHRpZiAoc3VwcG9ydGVkQ29sb3JNb2Rlcy5pbmRleE9mKGNvbG9yTW9kZSkgPT09IC0xKVxuXHRcdHRocm93IG5ldyBFcnJvcihgQ29sb3IgbW9kZSBub3Qgc3VwcG9ydGVkOiAke2NvbG9yTW9kZXNbY29sb3JNb2RlXSA/PyBjb2xvck1vZGV9YCk7XG5cblx0Y29uc3QgcHNkOiBQc2QgPSB7IHdpZHRoLCBoZWlnaHQsIGNoYW5uZWxzLCBiaXRzUGVyQ2hhbm5lbCwgY29sb3JNb2RlIH07XG5cdGNvbnN0IG9wdDogUmVhZE9wdGlvbnNFeHQgPSB7IC4uLm9wdGlvbnMsIGxhcmdlOiB2ZXJzaW9uID09PSAyIH07XG5cdGNvbnN0IGZpeE9mZnNldHMgPSBbMCwgMSwgLTEsIDIsIC0yLCAzLCAtMywgNCwgLTRdO1xuXG5cdC8vIGNvbG9yIG1vZGUgZGF0YVxuXHRyZWFkU2VjdGlvbihyZWFkZXIsIDEsIGxlZnQgPT4ge1xuXHRcdGlmIChvcHQudGhyb3dGb3JNaXNzaW5nRmVhdHVyZXMpIHRocm93IG5ldyBFcnJvcignQ29sb3IgbW9kZSBkYXRhIG5vdCBzdXBwb3J0ZWQnKTtcblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9KTtcblxuXHQvLyBpbWFnZSByZXNvdXJjZXNcblx0cmVhZFNlY3Rpb24ocmVhZGVyLCAxLCBsZWZ0ID0+IHtcblx0XHR3aGlsZSAobGVmdCgpKSB7XG5cdFx0XHRjb25zdCBzaWdPZmZzZXQgPSByZWFkZXIub2Zmc2V0O1xuXHRcdFx0bGV0IHNpZyA9ICcnO1xuXG5cdFx0XHQvLyBhdHRlbXB0IHRvIGZpeCBicm9rZW4gZG9jdW1lbnQgYnkgcmVhbGlnbmluZyB3aXRoIHRoZSBzaWduYXR1cmVcblx0XHRcdGZvciAoY29uc3Qgb2Zmc2V0IG9mIGZpeE9mZnNldHMpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRyZWFkZXIub2Zmc2V0ID0gc2lnT2Zmc2V0ICsgb2Zmc2V0O1xuXHRcdFx0XHRcdHNpZyA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcblx0XHRcdFx0fSBjYXRjaCB7IH1cblx0XHRcdFx0aWYgKGlzVmFsaWRTaWduYXR1cmUoc2lnKSkgYnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghaXNWYWxpZFNpZ25hdHVyZShzaWcpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzaWduYXR1cmU6ICcke3NpZ30nIGF0IDB4JHsoc2lnT2Zmc2V0KS50b1N0cmluZygxNil9YCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGlkID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdFx0cmVhZFBhc2NhbFN0cmluZyhyZWFkZXIsIDIpOyAvLyBuYW1lXG5cblx0XHRcdHJlYWRTZWN0aW9uKHJlYWRlciwgMiwgbGVmdCA9PiB7XG5cdFx0XHRcdGNvbnN0IGhhbmRsZXIgPSByZXNvdXJjZUhhbmRsZXJzTWFwW2lkXTtcblx0XHRcdFx0Y29uc3Qgc2tpcCA9IGlkID09PSAxMDM2ICYmICEhb3B0LnNraXBUaHVtYm5haWw7XG5cblx0XHRcdFx0aWYgKCFwc2QuaW1hZ2VSZXNvdXJjZXMpIHtcblx0XHRcdFx0XHRwc2QuaW1hZ2VSZXNvdXJjZXMgPSB7fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChoYW5kbGVyICYmICFza2lwKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGhhbmRsZXIucmVhZChyZWFkZXIsIHBzZC5pbWFnZVJlc291cmNlcywgbGVmdCwgb3B0KTtcblx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRpZiAob3B0LnRocm93Rm9yTWlzc2luZ0ZlYXR1cmVzKSB0aHJvdyBlO1xuXHRcdFx0XHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gb3B0aW9ucy5sb2dNaXNzaW5nRmVhdHVyZXMgJiYgY29uc29sZS5sb2coYFVuaGFuZGxlZCBpbWFnZSByZXNvdXJjZTogJHtpZH1gKTtcblx0XHRcdFx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIGxheWVyIGFuZCBtYXNrIGluZm9cblx0bGV0IGdsb2JhbEFscGhhID0gZmFsc2U7XG5cblx0cmVhZFNlY3Rpb24ocmVhZGVyLCAxLCBsZWZ0ID0+IHtcblx0XHRnbG9iYWxBbHBoYSA9IHJlYWRMYXllckluZm8ocmVhZGVyLCBwc2QsIG9wdCk7XG5cblx0XHQvLyBTQUkgZG9lcyBub3QgaW5jbHVkZSB0aGlzIHNlY3Rpb25cblx0XHRpZiAobGVmdCgpID4gMCkge1xuXHRcdFx0Y29uc3QgZ2xvYmFsTGF5ZXJNYXNrSW5mbyA9IHJlYWRHbG9iYWxMYXllck1hc2tJbmZvKHJlYWRlcik7XG5cdFx0XHRpZiAoZ2xvYmFsTGF5ZXJNYXNrSW5mbykgcHNkLmdsb2JhbExheWVyTWFza0luZm8gPSBnbG9iYWxMYXllck1hc2tJbmZvO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyByZXZlcnQgYmFjayB0byBlbmQgb2Ygc2VjdGlvbiBpZiBleGNlZWRlZCBzZWN0aW9uIGxpbWl0c1xuXHRcdFx0Ly8gb3B0LmxvZ01pc3NpbmdGZWF0dXJlcyAmJiBjb25zb2xlLmxvZygncmV2ZXJ0aW5nIHRvIGVuZCBvZiBzZWN0aW9uJyk7XG5cdFx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdH1cblxuXHRcdHdoaWxlIChsZWZ0KCkgPiAwKSB7XG5cdFx0XHQvLyBzb21ldGltZXMgdGhlcmUgYXJlIGVtcHR5IGJ5dGVzIGhlcmVcblx0XHRcdHdoaWxlIChsZWZ0KCkgJiYgcGVla1VpbnQ4KHJlYWRlcikgPT09IDApIHtcblx0XHRcdFx0Ly8gb3B0LmxvZ01pc3NpbmdGZWF0dXJlcyAmJiBjb25zb2xlLmxvZygnc2tpcHBpbmcgMCBieXRlJyk7XG5cdFx0XHRcdHNraXBCeXRlcyhyZWFkZXIsIDEpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAobGVmdCgpID49IDEyKSB7XG5cdFx0XHRcdHJlYWRBZGRpdGlvbmFsTGF5ZXJJbmZvKHJlYWRlciwgcHNkLCBwc2QsIG9wdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBvcHQubG9nTWlzc2luZ0ZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCdza2lwcGluZyBsZWZ0b3ZlciBieXRlcycsIGxlZnQoKSk7XG5cdFx0XHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LCB1bmRlZmluZWQsIG9wdC5sYXJnZSk7XG5cblx0Y29uc3QgaGFzQ2hpbGRyZW4gPSBwc2QuY2hpbGRyZW4gJiYgcHNkLmNoaWxkcmVuLmxlbmd0aDtcblx0Y29uc3Qgc2tpcENvbXBvc2l0ZSA9IG9wdC5za2lwQ29tcG9zaXRlSW1hZ2VEYXRhICYmIChvcHQuc2tpcExheWVySW1hZ2VEYXRhIHx8IGhhc0NoaWxkcmVuKTtcblxuXHRpZiAoIXNraXBDb21wb3NpdGUpIHtcblx0XHRyZWFkSW1hZ2VEYXRhKHJlYWRlciwgcHNkLCBnbG9iYWxBbHBoYSwgb3B0KTtcblx0fVxuXG5cdC8vIFRPRE86IHNob3cgY29udmVydGVkIGNvbG9yIG1vZGUgaW5zdGVhZCBvZiBvcmlnaW5hbCBQU0QgZmlsZSBjb2xvciBtb2RlXG5cdC8vICAgICAgIGJ1dCBhZGQgb3B0aW9uIHRvIHByZXNlcnZlIGZpbGUgY29sb3IgbW9kZSAobmVlZCB0byByZXR1cm4gaW1hZ2UgZGF0YSBpbnN0ZWFkIG9mIGNhbnZhcyBpbiB0aGF0IGNhc2UpXG5cdC8vIHBzZC5jb2xvck1vZGUgPSBDb2xvck1vZGUuUkdCOyAvLyB3ZSBjb252ZXJ0IGFsbCBjb2xvciBtb2RlcyB0byBSR0JcblxuXHRyZXR1cm4gcHNkO1xufVxuXG5mdW5jdGlvbiByZWFkTGF5ZXJJbmZvKHJlYWRlcjogUHNkUmVhZGVyLCBwc2Q6IFBzZCwgb3B0aW9uczogUmVhZE9wdGlvbnNFeHQpIHtcblx0bGV0IGdsb2JhbEFscGhhID0gZmFsc2U7XG5cblx0cmVhZFNlY3Rpb24ocmVhZGVyLCAyLCBsZWZ0ID0+IHtcblx0XHRsZXQgbGF5ZXJDb3VudCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXG5cdFx0aWYgKGxheWVyQ291bnQgPCAwKSB7XG5cdFx0XHRnbG9iYWxBbHBoYSA9IHRydWU7XG5cdFx0XHRsYXllckNvdW50ID0gLWxheWVyQ291bnQ7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbGF5ZXJzOiBMYXllcltdID0gW107XG5cdFx0Y29uc3QgbGF5ZXJDaGFubmVsczogQ2hhbm5lbEluZm9bXVtdID0gW107XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGxheWVyQ291bnQ7IGkrKykge1xuXHRcdFx0Y29uc3QgeyBsYXllciwgY2hhbm5lbHMgfSA9IHJlYWRMYXllclJlY29yZChyZWFkZXIsIHBzZCwgb3B0aW9ucyk7XG5cdFx0XHRsYXllcnMucHVzaChsYXllcik7XG5cdFx0XHRsYXllckNoYW5uZWxzLnB1c2goY2hhbm5lbHMpO1xuXHRcdH1cblxuXHRcdGlmICghb3B0aW9ucy5za2lwTGF5ZXJJbWFnZURhdGEpIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXJDb3VudDsgaSsrKSB7XG5cdFx0XHRcdHJlYWRMYXllckNoYW5uZWxJbWFnZURhdGEocmVhZGVyLCBwc2QsIGxheWVyc1tpXSwgbGF5ZXJDaGFubmVsc1tpXSwgb3B0aW9ucyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblxuXHRcdGlmICghcHNkLmNoaWxkcmVuKSBwc2QuY2hpbGRyZW4gPSBbXTtcblxuXHRcdGNvbnN0IHN0YWNrOiAoTGF5ZXIgfCBQc2QpW10gPSBbcHNkXTtcblxuXHRcdGZvciAobGV0IGkgPSBsYXllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdGNvbnN0IGwgPSBsYXllcnNbaV07XG5cdFx0XHRjb25zdCB0eXBlID0gbC5zZWN0aW9uRGl2aWRlciA/IGwuc2VjdGlvbkRpdmlkZXIudHlwZSA6IFNlY3Rpb25EaXZpZGVyVHlwZS5PdGhlcjtcblxuXHRcdFx0aWYgKHR5cGUgPT09IFNlY3Rpb25EaXZpZGVyVHlwZS5PcGVuRm9sZGVyIHx8IHR5cGUgPT09IFNlY3Rpb25EaXZpZGVyVHlwZS5DbG9zZWRGb2xkZXIpIHtcblx0XHRcdFx0bC5vcGVuZWQgPSB0eXBlID09PSBTZWN0aW9uRGl2aWRlclR5cGUuT3BlbkZvbGRlcjtcblx0XHRcdFx0bC5jaGlsZHJlbiA9IFtdO1xuXHRcdFx0XHRzdGFja1tzdGFjay5sZW5ndGggLSAxXS5jaGlsZHJlbiEudW5zaGlmdChsKTtcblx0XHRcdFx0c3RhY2sucHVzaChsKTtcblx0XHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gU2VjdGlvbkRpdmlkZXJUeXBlLkJvdW5kaW5nU2VjdGlvbkRpdmlkZXIpIHtcblx0XHRcdFx0c3RhY2sucG9wKCk7XG5cdFx0XHRcdC8vIHRoaXMgd2FzIHdvcmthcm91bmQgYmVjYXVzZSBJIGRpZG4ndCBrbm93IHdoYXQgYGxzZGtgIHNlY3Rpb24gd2FzLCBub3cgaXQncyBwcm9iYWJseSBub3QgbmVlZGVkIGFueW1vcmVcblx0XHRcdFx0Ly8gfSBlbHNlIGlmIChsLm5hbWUgPT09ICc8L0xheWVyIGdyb3VwPicgJiYgIWwuc2VjdGlvbkRpdmlkZXIgJiYgIWwudG9wICYmICFsLmxlZnQgJiYgIWwuYm90dG9tICYmICFsLnJpZ2h0KSB7XG5cdFx0XHRcdC8vIFx0Ly8gc29tZXRpbWVzIGxheWVyIGdyb3VwIHRlcm1pbmF0b3IgZG9lc24ndCBoYXZlIHNlY3Rpb25EaXZpZGVyLCBzbyB3ZSBqdXN0IGd1ZXNzIGhlcmUgKFBTIGJ1ZyA/KVxuXHRcdFx0XHQvLyBcdHN0YWNrLnBvcCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c3RhY2tbc3RhY2subGVuZ3RoIC0gMV0uY2hpbGRyZW4hLnVuc2hpZnQobCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LCB1bmRlZmluZWQsIG9wdGlvbnMubGFyZ2UpO1xuXG5cdHJldHVybiBnbG9iYWxBbHBoYTtcbn1cblxuZnVuY3Rpb24gcmVhZExheWVyUmVjb3JkKHJlYWRlcjogUHNkUmVhZGVyLCBwc2Q6IFBzZCwgb3B0aW9uczogUmVhZE9wdGlvbnNFeHQpIHtcblx0Y29uc3QgbGF5ZXI6IExheWVyID0ge307XG5cdGxheWVyLnRvcCA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRsYXllci5sZWZ0ID0gcmVhZEludDMyKHJlYWRlcik7XG5cdGxheWVyLmJvdHRvbSA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRsYXllci5yaWdodCA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXG5cdGNvbnN0IGNoYW5uZWxDb3VudCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0Y29uc3QgY2hhbm5lbHM6IENoYW5uZWxJbmZvW10gPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGNoYW5uZWxDb3VudDsgaSsrKSB7XG5cdFx0bGV0IGNoYW5uZWxJRCA9IHJlYWRJbnQxNihyZWFkZXIpIGFzIENoYW5uZWxJRDtcblx0XHRsZXQgY2hhbm5lbExlbmd0aCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblxuXHRcdGlmIChvcHRpb25zLmxhcmdlKSB7XG5cdFx0XHRpZiAoY2hhbm5lbExlbmd0aCAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdTaXplcyBsYXJnZXIgdGhhbiA0R0IgYXJlIG5vdCBzdXBwb3J0ZWQnKTtcblx0XHRcdGNoYW5uZWxMZW5ndGggPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0fVxuXG5cdFx0Y2hhbm5lbHMucHVzaCh7IGlkOiBjaGFubmVsSUQsIGxlbmd0aDogY2hhbm5lbExlbmd0aCB9KTtcblx0fVxuXG5cdGNoZWNrU2lnbmF0dXJlKHJlYWRlciwgJzhCSU0nKTtcblx0Y29uc3QgYmxlbmRNb2RlID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xuXHRpZiAoIXRvQmxlbmRNb2RlW2JsZW5kTW9kZV0pIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBibGVuZCBtb2RlOiAnJHtibGVuZE1vZGV9J2ApO1xuXHRsYXllci5ibGVuZE1vZGUgPSB0b0JsZW5kTW9kZVtibGVuZE1vZGVdO1xuXG5cdGxheWVyLm9wYWNpdHkgPSByZWFkVWludDgocmVhZGVyKSAvIDB4ZmY7XG5cdGxheWVyLmNsaXBwaW5nID0gcmVhZFVpbnQ4KHJlYWRlcikgPT09IDE7XG5cblx0Y29uc3QgZmxhZ3MgPSByZWFkVWludDgocmVhZGVyKTtcblx0bGF5ZXIudHJhbnNwYXJlbmN5UHJvdGVjdGVkID0gKGZsYWdzICYgMHgwMSkgIT09IDA7XG5cdGxheWVyLmhpZGRlbiA9IChmbGFncyAmIDB4MDIpICE9PSAwO1xuXHQvLyAweDA0IC0gb2Jzb2xldGVcblx0Ly8gMHgwOCAtIDEgZm9yIFBob3Rvc2hvcCA1LjAgYW5kIGxhdGVyLCB0ZWxscyBpZiBiaXQgNCBoYXMgdXNlZnVsIGluZm9ybWF0aW9uXG5cdC8vIDB4MTAgLSBwaXhlbCBkYXRhIGlycmVsZXZhbnQgdG8gYXBwZWFyYW5jZSBvZiBkb2N1bWVudFxuXHQvLyAweDIwIC0gPz8/XG5cdC8vIGlmIChmbGFncyAmIDB4MjApIChsYXllciBhcyBhbnkpLl8yID0gdHJ1ZTsgLy8gVEVNUCAhISEhXG5cblx0c2tpcEJ5dGVzKHJlYWRlciwgMSk7XG5cblx0cmVhZFNlY3Rpb24ocmVhZGVyLCAxLCBsZWZ0ID0+IHtcblx0XHRjb25zdCBtYXNrID0gcmVhZExheWVyTWFza0RhdGEocmVhZGVyLCBvcHRpb25zKTtcblx0XHRpZiAobWFzaykgbGF5ZXIubWFzayA9IG1hc2s7XG5cblx0XHQvKmNvbnN0IGJsZW5kaW5nUmFuZ2VzID0qLyByZWFkTGF5ZXJCbGVuZGluZ1JhbmdlcyhyZWFkZXIpO1xuXHRcdGxheWVyLm5hbWUgPSByZWFkUGFzY2FsU3RyaW5nKHJlYWRlciwgNCk7XG5cblx0XHR3aGlsZSAobGVmdCgpKSB7XG5cdFx0XHRyZWFkQWRkaXRpb25hbExheWVySW5mbyhyZWFkZXIsIGxheWVyLCBwc2QsIG9wdGlvbnMpO1xuXHRcdH1cblx0fSk7XG5cblx0cmV0dXJuIHsgbGF5ZXIsIGNoYW5uZWxzIH07XG59XG5cbmZ1bmN0aW9uIHJlYWRMYXllck1hc2tEYXRhKHJlYWRlcjogUHNkUmVhZGVyLCBvcHRpb25zOiBSZWFkT3B0aW9ucykge1xuXHRyZXR1cm4gcmVhZFNlY3Rpb248TGF5ZXJNYXNrRGF0YSB8IHVuZGVmaW5lZD4ocmVhZGVyLCAxLCBsZWZ0ID0+IHtcblx0XHRpZiAoIWxlZnQoKSkgcmV0dXJuIHVuZGVmaW5lZDtcblxuXHRcdGNvbnN0IG1hc2s6IExheWVyTWFza0RhdGEgPSB7fTtcblx0XHRtYXNrLnRvcCA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRcdG1hc2subGVmdCA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRcdG1hc2suYm90dG9tID0gcmVhZEludDMyKHJlYWRlcik7XG5cdFx0bWFzay5yaWdodCA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRcdG1hc2suZGVmYXVsdENvbG9yID0gcmVhZFVpbnQ4KHJlYWRlcik7XG5cblx0XHRjb25zdCBmbGFncyA9IHJlYWRVaW50OChyZWFkZXIpO1xuXHRcdG1hc2sucG9zaXRpb25SZWxhdGl2ZVRvTGF5ZXIgPSAoZmxhZ3MgJiBMYXllck1hc2tGbGFncy5Qb3NpdGlvblJlbGF0aXZlVG9MYXllcikgIT09IDA7XG5cdFx0bWFzay5kaXNhYmxlZCA9IChmbGFncyAmIExheWVyTWFza0ZsYWdzLkxheWVyTWFza0Rpc2FibGVkKSAhPT0gMDtcblx0XHRtYXNrLmZyb21WZWN0b3JEYXRhID0gKGZsYWdzICYgTGF5ZXJNYXNrRmxhZ3MuTGF5ZXJNYXNrRnJvbVJlbmRlcmluZ090aGVyRGF0YSkgIT09IDA7XG5cblx0XHRpZiAoZmxhZ3MgJiBMYXllck1hc2tGbGFncy5NYXNrSGFzUGFyYW1ldGVyc0FwcGxpZWRUb0l0KSB7XG5cdFx0XHRjb25zdCBwYXJhbXMgPSByZWFkVWludDgocmVhZGVyKTtcblx0XHRcdGlmIChwYXJhbXMgJiBNYXNrUGFyYW1zLlVzZXJNYXNrRGVuc2l0eSkgbWFzay51c2VyTWFza0RlbnNpdHkgPSByZWFkVWludDgocmVhZGVyKSAvIDB4ZmY7XG5cdFx0XHRpZiAocGFyYW1zICYgTWFza1BhcmFtcy5Vc2VyTWFza0ZlYXRoZXIpIG1hc2sudXNlck1hc2tGZWF0aGVyID0gcmVhZEZsb2F0NjQocmVhZGVyKTtcblx0XHRcdGlmIChwYXJhbXMgJiBNYXNrUGFyYW1zLlZlY3Rvck1hc2tEZW5zaXR5KSBtYXNrLnZlY3Rvck1hc2tEZW5zaXR5ID0gcmVhZFVpbnQ4KHJlYWRlcikgLyAweGZmO1xuXHRcdFx0aWYgKHBhcmFtcyAmIE1hc2tQYXJhbXMuVmVjdG9yTWFza0ZlYXRoZXIpIG1hc2sudmVjdG9yTWFza0ZlYXRoZXIgPSByZWFkRmxvYXQ2NChyZWFkZXIpO1xuXHRcdH1cblxuXHRcdGlmIChsZWZ0KCkgPiAyKSB7XG5cdFx0XHRvcHRpb25zLmxvZ01pc3NpbmdGZWF0dXJlcyAmJiBjb25zb2xlLmxvZygnVW5oYW5kbGVkIGV4dHJhIG1hc2sgcGFyYW1zJyk7XG5cdFx0XHQvLyBUT0RPOiBoYW5kbGUgdGhlc2UgdmFsdWVzXG5cdFx0XHQvKmNvbnN0IHJlYWxGbGFncyA9Ki8gcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHQvKmNvbnN0IHJlYWxVc2VyTWFza0JhY2tncm91bmQgPSovIHJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0Lypjb25zdCB0b3AyID0qLyByZWFkSW50MzIocmVhZGVyKTtcblx0XHRcdC8qY29uc3QgbGVmdDIgPSovIHJlYWRJbnQzMihyZWFkZXIpO1xuXHRcdFx0Lypjb25zdCBib3R0b20yID0qLyByZWFkSW50MzIocmVhZGVyKTtcblx0XHRcdC8qY29uc3QgcmlnaHQyID0qLyByZWFkSW50MzIocmVhZGVyKTtcblx0XHR9XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdHJldHVybiBtYXNrO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gcmVhZExheWVyQmxlbmRpbmdSYW5nZXMocmVhZGVyOiBQc2RSZWFkZXIpIHtcblx0cmV0dXJuIHJlYWRTZWN0aW9uKHJlYWRlciwgMSwgbGVmdCA9PiB7XG5cdFx0Y29uc3QgY29tcG9zaXRlR3JheUJsZW5kU291cmNlID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdGNvbnN0IGNvbXBvc2l0ZUdyYXBoQmxlbmREZXN0aW5hdGlvblJhbmdlID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdGNvbnN0IHJhbmdlcyA9IFtdO1xuXG5cdFx0d2hpbGUgKGxlZnQoKSkge1xuXHRcdFx0Y29uc3Qgc291cmNlUmFuZ2UgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0XHRjb25zdCBkZXN0UmFuZ2UgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0XHRyYW5nZXMucHVzaCh7IHNvdXJjZVJhbmdlLCBkZXN0UmFuZ2UgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgY29tcG9zaXRlR3JheUJsZW5kU291cmNlLCBjb21wb3NpdGVHcmFwaEJsZW5kRGVzdGluYXRpb25SYW5nZSwgcmFuZ2VzIH07XG5cdH0pO1xufVxuXG5mdW5jdGlvbiByZWFkTGF5ZXJDaGFubmVsSW1hZ2VEYXRhKFxuXHRyZWFkZXI6IFBzZFJlYWRlciwgcHNkOiBQc2QsIGxheWVyOiBMYXllciwgY2hhbm5lbHM6IENoYW5uZWxJbmZvW10sIG9wdGlvbnM6IFJlYWRPcHRpb25zRXh0XG4pIHtcblx0Y29uc3QgbGF5ZXJXaWR0aCA9IChsYXllci5yaWdodCB8fCAwKSAtIChsYXllci5sZWZ0IHx8IDApO1xuXHRjb25zdCBsYXllckhlaWdodCA9IChsYXllci5ib3R0b20gfHwgMCkgLSAobGF5ZXIudG9wIHx8IDApO1xuXHRjb25zdCBjbXlrID0gcHNkLmNvbG9yTW9kZSA9PT0gQ29sb3JNb2RlLkNNWUs7XG5cblx0bGV0IGltYWdlRGF0YTogSW1hZ2VEYXRhIHwgdW5kZWZpbmVkO1xuXG5cdGlmIChsYXllcldpZHRoICYmIGxheWVySGVpZ2h0KSB7XG5cdFx0aWYgKGNteWspIHtcblx0XHRcdGltYWdlRGF0YSA9IHsgd2lkdGg6IGxheWVyV2lkdGgsIGhlaWdodDogbGF5ZXJIZWlnaHQsIGRhdGE6IG5ldyBVaW50OENsYW1wZWRBcnJheShsYXllcldpZHRoICogbGF5ZXJIZWlnaHQgKiA1KSB9IGFzIGFueSBhcyBJbWFnZURhdGE7XG5cdFx0XHRmb3IgKGxldCBwID0gNDsgcCA8IGltYWdlRGF0YS5kYXRhLmJ5dGVMZW5ndGg7IHAgKz0gNSkgaW1hZ2VEYXRhLmRhdGFbcF0gPSAyNTU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGltYWdlRGF0YSA9IGNyZWF0ZUltYWdlRGF0YShsYXllcldpZHRoLCBsYXllckhlaWdodCk7XG5cdFx0XHRyZXNldEltYWdlRGF0YShpbWFnZURhdGEpO1xuXHRcdH1cblx0fVxuXG5cdGlmIChSQVdfSU1BR0VfREFUQSkgKGxheWVyIGFzIGFueSkuaW1hZ2VEYXRhUmF3ID0gW107XG5cblx0Zm9yIChjb25zdCBjaGFubmVsIG9mIGNoYW5uZWxzKSB7XG5cdFx0aWYgKGNoYW5uZWwubGVuZ3RoID09PSAwKSBjb250aW51ZTtcblx0XHRpZiAoY2hhbm5lbC5sZW5ndGggPCAyKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2hhbm5lbCBsZW5ndGgnKTtcblxuXHRcdGNvbnN0IHN0YXJ0ID0gcmVhZGVyLm9mZnNldDtcblx0XHRjb25zdCBjb21wcmVzc2lvbiA9IHJlYWRVaW50MTYocmVhZGVyKSBhcyBDb21wcmVzc2lvbjtcblxuXHRcdGlmIChjaGFubmVsLmlkID09PSBDaGFubmVsSUQuVXNlck1hc2spIHtcblx0XHRcdGNvbnN0IG1hc2sgPSBsYXllci5tYXNrO1xuXG5cdFx0XHRpZiAoIW1hc2spIHRocm93IG5ldyBFcnJvcihgTWlzc2luZyBsYXllciBtYXNrIGRhdGFgKTtcblxuXHRcdFx0Y29uc3QgbWFza1dpZHRoID0gKG1hc2sucmlnaHQgfHwgMCkgLSAobWFzay5sZWZ0IHx8IDApO1xuXHRcdFx0Y29uc3QgbWFza0hlaWdodCA9IChtYXNrLmJvdHRvbSB8fCAwKSAtIChtYXNrLnRvcCB8fCAwKTtcblxuXHRcdFx0aWYgKG1hc2tXaWR0aCAmJiBtYXNrSGVpZ2h0KSB7XG5cdFx0XHRcdGNvbnN0IG1hc2tEYXRhID0gY3JlYXRlSW1hZ2VEYXRhKG1hc2tXaWR0aCwgbWFza0hlaWdodCk7XG5cdFx0XHRcdHJlc2V0SW1hZ2VEYXRhKG1hc2tEYXRhKTtcblxuXHRcdFx0XHRjb25zdCBzdGFydCA9IHJlYWRlci5vZmZzZXQ7XG5cdFx0XHRcdHJlYWREYXRhKHJlYWRlciwgY2hhbm5lbC5sZW5ndGgsIG1hc2tEYXRhLCBjb21wcmVzc2lvbiwgbWFza1dpZHRoLCBtYXNrSGVpZ2h0LCAwLCBvcHRpb25zLmxhcmdlLCA0KTtcblxuXHRcdFx0XHRpZiAoUkFXX0lNQUdFX0RBVEEpIHtcblx0XHRcdFx0XHQobGF5ZXIgYXMgYW55KS5tYXNrRGF0YVJhdyA9IG5ldyBVaW50OEFycmF5KHJlYWRlci52aWV3LmJ1ZmZlciwgcmVhZGVyLnZpZXcuYnl0ZU9mZnNldCArIHN0YXJ0LCByZWFkZXIub2Zmc2V0IC0gc3RhcnQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c2V0dXBHcmF5c2NhbGUobWFza0RhdGEpO1xuXG5cdFx0XHRcdGlmIChvcHRpb25zLnVzZUltYWdlRGF0YSkge1xuXHRcdFx0XHRcdG1hc2suaW1hZ2VEYXRhID0gbWFza0RhdGE7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bWFzay5jYW52YXMgPSBjcmVhdGVDYW52YXMobWFza1dpZHRoLCBtYXNrSGVpZ2h0KTtcblx0XHRcdFx0XHRtYXNrLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpIS5wdXRJbWFnZURhdGEobWFza0RhdGEsIDAsIDApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IG9mZnNldCA9IG9mZnNldEZvckNoYW5uZWwoY2hhbm5lbC5pZCwgY215ayk7XG5cdFx0XHRsZXQgdGFyZ2V0RGF0YSA9IGltYWdlRGF0YTtcblxuXHRcdFx0aWYgKG9mZnNldCA8IDApIHtcblx0XHRcdFx0dGFyZ2V0RGF0YSA9IHVuZGVmaW5lZDtcblxuXHRcdFx0XHRpZiAob3B0aW9ucy50aHJvd0Zvck1pc3NpbmdGZWF0dXJlcykge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgQ2hhbm5lbCBub3Qgc3VwcG9ydGVkOiAke2NoYW5uZWwuaWR9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmVhZERhdGEocmVhZGVyLCBjaGFubmVsLmxlbmd0aCwgdGFyZ2V0RGF0YSwgY29tcHJlc3Npb24sIGxheWVyV2lkdGgsIGxheWVySGVpZ2h0LCBvZmZzZXQsIG9wdGlvbnMubGFyZ2UsIGNteWsgPyA1IDogNCk7XG5cblx0XHRcdGlmIChSQVdfSU1BR0VfREFUQSkge1xuXHRcdFx0XHQobGF5ZXIgYXMgYW55KS5pbWFnZURhdGFSYXdbY2hhbm5lbC5pZF0gPSBuZXcgVWludDhBcnJheShyZWFkZXIudmlldy5idWZmZXIsIHJlYWRlci52aWV3LmJ5dGVPZmZzZXQgKyBzdGFydCArIDIsIGNoYW5uZWwubGVuZ3RoIC0gMik7XG5cdFx0XHR9XG5cblx0XHRcdHJlYWRlci5vZmZzZXQgPSBzdGFydCArIGNoYW5uZWwubGVuZ3RoO1xuXG5cdFx0XHRpZiAodGFyZ2V0RGF0YSAmJiBwc2QuY29sb3JNb2RlID09PSBDb2xvck1vZGUuR3JheXNjYWxlKSB7XG5cdFx0XHRcdHNldHVwR3JheXNjYWxlKHRhcmdldERhdGEpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlmIChpbWFnZURhdGEpIHtcblx0XHRpZiAoY215aykge1xuXHRcdFx0Y29uc3QgY215a0RhdGEgPSBpbWFnZURhdGE7XG5cdFx0XHRpbWFnZURhdGEgPSBjcmVhdGVJbWFnZURhdGEoY215a0RhdGEud2lkdGgsIGNteWtEYXRhLmhlaWdodCk7XG5cdFx0XHRjbXlrVG9SZ2IoY215a0RhdGEsIGltYWdlRGF0YSwgZmFsc2UpO1xuXHRcdH1cblxuXHRcdGlmIChvcHRpb25zLnVzZUltYWdlRGF0YSkge1xuXHRcdFx0bGF5ZXIuaW1hZ2VEYXRhID0gaW1hZ2VEYXRhO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsYXllci5jYW52YXMgPSBjcmVhdGVDYW52YXMobGF5ZXJXaWR0aCwgbGF5ZXJIZWlnaHQpO1xuXHRcdFx0bGF5ZXIuY2FudmFzLmdldENvbnRleHQoJzJkJykhLnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiByZWFkRGF0YShcblx0cmVhZGVyOiBQc2RSZWFkZXIsIGxlbmd0aDogbnVtYmVyLCBkYXRhOiBJbWFnZURhdGEgfCB1bmRlZmluZWQsIGNvbXByZXNzaW9uOiBDb21wcmVzc2lvbiwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsXG5cdG9mZnNldDogbnVtYmVyLCBsYXJnZTogYm9vbGVhbiwgc3RlcDogbnVtYmVyXG4pIHtcblx0aWYgKGNvbXByZXNzaW9uID09PSBDb21wcmVzc2lvbi5SYXdEYXRhKSB7XG5cdFx0cmVhZERhdGFSYXcocmVhZGVyLCBkYXRhLCB3aWR0aCwgaGVpZ2h0LCBzdGVwLCBvZmZzZXQpO1xuXHR9IGVsc2UgaWYgKGNvbXByZXNzaW9uID09PSBDb21wcmVzc2lvbi5SbGVDb21wcmVzc2VkKSB7XG5cdFx0cmVhZERhdGFSTEUocmVhZGVyLCBkYXRhLCB3aWR0aCwgaGVpZ2h0LCBzdGVwLCBbb2Zmc2V0XSwgbGFyZ2UpO1xuXHR9IGVsc2UgaWYgKGNvbXByZXNzaW9uID09PSBDb21wcmVzc2lvbi5aaXBXaXRob3V0UHJlZGljdGlvbikge1xuXHRcdHJlYWREYXRhWmlwV2l0aG91dFByZWRpY3Rpb24ocmVhZGVyLCBsZW5ndGgsIGRhdGEsIHdpZHRoLCBoZWlnaHQsIHN0ZXAsIG9mZnNldCk7XG5cdH0gZWxzZSBpZiAoY29tcHJlc3Npb24gPT09IENvbXByZXNzaW9uLlppcFdpdGhQcmVkaWN0aW9uKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBDb21wcmVzc2lvbiB0eXBlIG5vdCBzdXBwb3J0ZWQ6ICR7Y29tcHJlc3Npb259YCk7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIENvbXByZXNzaW9uIHR5cGU6ICR7Y29tcHJlc3Npb259YCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVhZEdsb2JhbExheWVyTWFza0luZm8ocmVhZGVyOiBQc2RSZWFkZXIpIHtcblx0cmV0dXJuIHJlYWRTZWN0aW9uPEdsb2JhbExheWVyTWFza0luZm8gfCB1bmRlZmluZWQ+KHJlYWRlciwgMSwgbGVmdCA9PiB7XG5cdFx0aWYgKCFsZWZ0KCkpIHJldHVybiB1bmRlZmluZWQ7XG5cblx0XHRjb25zdCBvdmVybGF5Q29sb3JTcGFjZSA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRjb25zdCBjb2xvclNwYWNlMSA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRjb25zdCBjb2xvclNwYWNlMiA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRjb25zdCBjb2xvclNwYWNlMyA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRjb25zdCBjb2xvclNwYWNlNCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRjb25zdCBvcGFjaXR5ID0gcmVhZFVpbnQxNihyZWFkZXIpIC8gMHhmZjtcblx0XHRjb25zdCBraW5kID0gcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTsgLy8gMyBieXRlcyBvZiBwYWRkaW5nID9cblx0XHRyZXR1cm4geyBvdmVybGF5Q29sb3JTcGFjZSwgY29sb3JTcGFjZTEsIGNvbG9yU3BhY2UyLCBjb2xvclNwYWNlMywgY29sb3JTcGFjZTQsIG9wYWNpdHksIGtpbmQgfTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIHJlYWRBZGRpdGlvbmFsTGF5ZXJJbmZvKHJlYWRlcjogUHNkUmVhZGVyLCB0YXJnZXQ6IExheWVyQWRkaXRpb25hbEluZm8sIHBzZDogUHNkLCBvcHRpb25zOiBSZWFkT3B0aW9uc0V4dCkge1xuXHRjb25zdCBzaWcgPSByZWFkU2lnbmF0dXJlKHJlYWRlcik7XG5cdGlmIChzaWcgIT09ICc4QklNJyAmJiBzaWcgIT09ICc4QjY0JykgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNpZ25hdHVyZTogJyR7c2lnfScgYXQgMHgkeyhyZWFkZXIub2Zmc2V0IC0gNCkudG9TdHJpbmcoMTYpfWApO1xuXHRjb25zdCBrZXkgPSByZWFkU2lnbmF0dXJlKHJlYWRlcik7XG5cblx0Ly8gYGxhcmdlQWRkaXRpb25hbEluZm9LZXlzYCBmYWxsYmFjaywgYmVjYXVzZSBzb21lIGtleXMgZG9uJ3QgaGF2ZSA4QjY0IHNpZ25hdHVyZSBldmVuIHdoZW4gdGhleSBhcmUgNjRiaXRcblx0Y29uc3QgdTY0ID0gc2lnID09PSAnOEI2NCcgfHwgKG9wdGlvbnMubGFyZ2UgJiYgbGFyZ2VBZGRpdGlvbmFsSW5mb0tleXMuaW5kZXhPZihrZXkpICE9PSAtMSk7XG5cblx0cmVhZFNlY3Rpb24ocmVhZGVyLCAyLCBsZWZ0ID0+IHtcblx0XHRjb25zdCBoYW5kbGVyID0gaW5mb0hhbmRsZXJzTWFwW2tleV07XG5cblx0XHRpZiAoaGFuZGxlcikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0aGFuZGxlci5yZWFkKHJlYWRlciwgdGFyZ2V0LCBsZWZ0LCBwc2QsIG9wdGlvbnMpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAob3B0aW9ucy50aHJvd0Zvck1pc3NpbmdGZWF0dXJlcykgdGhyb3cgZTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0b3B0aW9ucy5sb2dNaXNzaW5nRmVhdHVyZXMgJiYgY29uc29sZS5sb2coYFVuaGFuZGxlZCBhZGRpdGlvbmFsIGluZm86ICR7a2V5fWApO1xuXHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0XHR9XG5cblx0XHRpZiAobGVmdCgpKSB7XG5cdFx0XHRvcHRpb25zLmxvZ01pc3NpbmdGZWF0dXJlcyAmJiBjb25zb2xlLmxvZyhgVW5yZWFkICR7bGVmdCgpfSBieXRlcyBsZWZ0IGZvciBhZGRpdGlvbmFsIGluZm86ICR7a2V5fWApO1xuXHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0XHR9XG5cdH0sIGZhbHNlLCB1NjQpO1xufVxuXG5mdW5jdGlvbiByZWFkSW1hZ2VEYXRhKHJlYWRlcjogUHNkUmVhZGVyLCBwc2Q6IFBzZCwgZ2xvYmFsQWxwaGE6IGJvb2xlYW4sIG9wdGlvbnM6IFJlYWRPcHRpb25zRXh0KSB7XG5cdGNvbnN0IGNvbXByZXNzaW9uID0gcmVhZFVpbnQxNihyZWFkZXIpIGFzIENvbXByZXNzaW9uO1xuXG5cdGlmIChzdXBwb3J0ZWRDb2xvck1vZGVzLmluZGV4T2YocHNkLmNvbG9yTW9kZSEpID09PSAtMSlcblx0XHR0aHJvdyBuZXcgRXJyb3IoYENvbG9yIG1vZGUgbm90IHN1cHBvcnRlZDogJHtwc2QuY29sb3JNb2RlfWApO1xuXG5cdGlmIChjb21wcmVzc2lvbiAhPT0gQ29tcHJlc3Npb24uUmF3RGF0YSAmJiBjb21wcmVzc2lvbiAhPT0gQ29tcHJlc3Npb24uUmxlQ29tcHJlc3NlZClcblx0XHR0aHJvdyBuZXcgRXJyb3IoYENvbXByZXNzaW9uIHR5cGUgbm90IHN1cHBvcnRlZDogJHtjb21wcmVzc2lvbn1gKTtcblxuXHRjb25zdCBpbWFnZURhdGEgPSBjcmVhdGVJbWFnZURhdGEocHNkLndpZHRoLCBwc2QuaGVpZ2h0KTtcblx0cmVzZXRJbWFnZURhdGEoaW1hZ2VEYXRhKTtcblxuXHRzd2l0Y2ggKHBzZC5jb2xvck1vZGUpIHtcblx0XHRjYXNlIENvbG9yTW9kZS5CaXRtYXA6IHtcblx0XHRcdGxldCBieXRlczogVWludDhBcnJheTtcblxuXHRcdFx0aWYgKGNvbXByZXNzaW9uID09PSBDb21wcmVzc2lvbi5SYXdEYXRhKSB7XG5cdFx0XHRcdGJ5dGVzID0gcmVhZEJ5dGVzKHJlYWRlciwgTWF0aC5jZWlsKHBzZC53aWR0aCAvIDgpICogcHNkLmhlaWdodCk7XG5cdFx0XHR9IGVsc2UgaWYgKGNvbXByZXNzaW9uID09PSBDb21wcmVzc2lvbi5SbGVDb21wcmVzc2VkKSB7XG5cdFx0XHRcdGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkocHNkLndpZHRoICogcHNkLmhlaWdodCk7XG5cdFx0XHRcdHJlYWREYXRhUkxFKHJlYWRlciwgeyBkYXRhOiBieXRlcywgd2lkdGg6IHBzZC53aWR0aCwgaGVpZ2h0OiBwc2QuaGVpZ2h0IH0sIHBzZC53aWR0aCwgcHNkLmhlaWdodCwgMSwgWzBdLCBvcHRpb25zLmxhcmdlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgQml0bWFwIGNvbXByZXNzaW9uIG5vdCBzdXBwb3J0ZWQ6ICR7Y29tcHJlc3Npb259YCk7XG5cdFx0XHR9XG5cblx0XHRcdGRlY29kZUJpdG1hcChieXRlcywgaW1hZ2VEYXRhLmRhdGEsIHBzZC53aWR0aCwgcHNkLmhlaWdodCk7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cdFx0Y2FzZSBDb2xvck1vZGUuUkdCOlxuXHRcdGNhc2UgQ29sb3JNb2RlLkdyYXlzY2FsZToge1xuXHRcdFx0Y29uc3QgY2hhbm5lbHMgPSBwc2QuY29sb3JNb2RlID09PSBDb2xvck1vZGUuR3JheXNjYWxlID8gWzBdIDogWzAsIDEsIDJdO1xuXG5cdFx0XHRpZiAocHNkLmNoYW5uZWxzICYmIHBzZC5jaGFubmVscyA+IDMpIHtcblx0XHRcdFx0Zm9yIChsZXQgaSA9IDM7IGkgPCBwc2QuY2hhbm5lbHM7IGkrKykge1xuXHRcdFx0XHRcdC8vIFRPRE86IHN0b3JlIHRoZXNlIGNoYW5uZWxzIGluIGFkZGl0aW9uYWwgaW1hZ2UgZGF0YVxuXHRcdFx0XHRcdGNoYW5uZWxzLnB1c2goaSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoZ2xvYmFsQWxwaGEpIHtcblx0XHRcdFx0Y2hhbm5lbHMucHVzaCgzKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGNvbXByZXNzaW9uID09PSBDb21wcmVzc2lvbi5SYXdEYXRhKSB7XG5cdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY2hhbm5lbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRyZWFkRGF0YVJhdyhyZWFkZXIsIGltYWdlRGF0YSwgcHNkLndpZHRoLCBwc2QuaGVpZ2h0LCA0LCBjaGFubmVsc1tpXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoY29tcHJlc3Npb24gPT09IENvbXByZXNzaW9uLlJsZUNvbXByZXNzZWQpIHtcblx0XHRcdFx0Y29uc3Qgc3RhcnQgPSByZWFkZXIub2Zmc2V0O1xuXHRcdFx0XHRyZWFkRGF0YVJMRShyZWFkZXIsIGltYWdlRGF0YSwgcHNkLndpZHRoLCBwc2QuaGVpZ2h0LCA0LCBjaGFubmVscywgb3B0aW9ucy5sYXJnZSk7XG5cdFx0XHRcdGlmIChSQVdfSU1BR0VfREFUQSkgKHBzZCBhcyBhbnkpLmltYWdlRGF0YVJhdyA9IG5ldyBVaW50OEFycmF5KHJlYWRlci52aWV3LmJ1ZmZlciwgcmVhZGVyLnZpZXcuYnl0ZU9mZnNldCArIHN0YXJ0LCByZWFkZXIub2Zmc2V0IC0gc3RhcnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocHNkLmNvbG9yTW9kZSA9PT0gQ29sb3JNb2RlLkdyYXlzY2FsZSkge1xuXHRcdFx0XHRzZXR1cEdyYXlzY2FsZShpbWFnZURhdGEpO1xuXHRcdFx0fVxuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHRcdGNhc2UgQ29sb3JNb2RlLkNNWUs6IHtcblx0XHRcdGlmIChwc2QuY2hhbm5lbHMgIT09IDQpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBjaGFubmVsIGNvdW50YCk7XG5cblx0XHRcdGNvbnN0IGNoYW5uZWxzID0gWzAsIDEsIDIsIDNdO1xuXHRcdFx0aWYgKGdsb2JhbEFscGhhKSBjaGFubmVscy5wdXNoKDQpO1xuXG5cdFx0XHRpZiAoY29tcHJlc3Npb24gPT09IENvbXByZXNzaW9uLlJhd0RhdGEpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBOb3QgaW1wbGVtZW50ZWRgKTtcblx0XHRcdFx0Ly8gVE9ETzogLi4uXG5cdFx0XHRcdC8vIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhbm5lbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Ly8gXHRyZWFkRGF0YVJhdyhyZWFkZXIsIGltYWdlRGF0YSwgY2hhbm5lbHNbaV0sIHBzZC53aWR0aCwgcHNkLmhlaWdodCk7XG5cdFx0XHRcdC8vIH1cblx0XHRcdH0gZWxzZSBpZiAoY29tcHJlc3Npb24gPT09IENvbXByZXNzaW9uLlJsZUNvbXByZXNzZWQpIHtcblx0XHRcdFx0Y29uc3QgY215a0ltYWdlRGF0YTogUGl4ZWxEYXRhID0ge1xuXHRcdFx0XHRcdHdpZHRoOiBpbWFnZURhdGEud2lkdGgsXG5cdFx0XHRcdFx0aGVpZ2h0OiBpbWFnZURhdGEuaGVpZ2h0LFxuXHRcdFx0XHRcdGRhdGE6IG5ldyBVaW50OEFycmF5KGltYWdlRGF0YS53aWR0aCAqIGltYWdlRGF0YS5oZWlnaHQgKiA1KSxcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRjb25zdCBzdGFydCA9IHJlYWRlci5vZmZzZXQ7XG5cdFx0XHRcdHJlYWREYXRhUkxFKHJlYWRlciwgY215a0ltYWdlRGF0YSwgcHNkLndpZHRoLCBwc2QuaGVpZ2h0LCA1LCBjaGFubmVscywgb3B0aW9ucy5sYXJnZSk7XG5cdFx0XHRcdGNteWtUb1JnYihjbXlrSW1hZ2VEYXRhLCBpbWFnZURhdGEsIHRydWUpO1xuXG5cdFx0XHRcdGlmIChSQVdfSU1BR0VfREFUQSkgKHBzZCBhcyBhbnkpLmltYWdlRGF0YVJhdyA9IG5ldyBVaW50OEFycmF5KHJlYWRlci52aWV3LmJ1ZmZlciwgcmVhZGVyLnZpZXcuYnl0ZU9mZnNldCArIHN0YXJ0LCByZWFkZXIub2Zmc2V0IC0gc3RhcnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRicmVhaztcblx0XHR9XG5cdFx0ZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBDb2xvciBtb2RlIG5vdCBzdXBwb3J0ZWQ6ICR7cHNkLmNvbG9yTW9kZX1gKTtcblx0fVxuXG5cdGlmIChvcHRpb25zLnVzZUltYWdlRGF0YSkge1xuXHRcdHBzZC5pbWFnZURhdGEgPSBpbWFnZURhdGE7XG5cdH0gZWxzZSB7XG5cdFx0cHNkLmNhbnZhcyA9IGNyZWF0ZUNhbnZhcyhwc2Qud2lkdGgsIHBzZC5oZWlnaHQpO1xuXHRcdHBzZC5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKSEucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gY215a1RvUmdiKGNteWs6IFBpeGVsRGF0YSwgcmdiOiBQaXhlbERhdGEsIHJldmVyc2VBbHBoYTogYm9vbGVhbikge1xuXHRjb25zdCBzaXplID0gcmdiLndpZHRoICogcmdiLmhlaWdodCAqIDQ7XG5cdGNvbnN0IHNyY0RhdGEgPSBjbXlrLmRhdGE7XG5cdGNvbnN0IGRzdERhdGEgPSByZ2IuZGF0YTtcblxuXHRmb3IgKGxldCBzcmMgPSAwLCBkc3QgPSAwOyBkc3QgPCBzaXplOyBzcmMgKz0gNSwgZHN0ICs9IDQpIHtcblx0XHRjb25zdCBjID0gc3JjRGF0YVtzcmNdO1xuXHRcdGNvbnN0IG0gPSBzcmNEYXRhW3NyYyArIDFdO1xuXHRcdGNvbnN0IHkgPSBzcmNEYXRhW3NyYyArIDJdO1xuXHRcdGNvbnN0IGsgPSBzcmNEYXRhW3NyYyArIDNdO1xuXHRcdGRzdERhdGFbZHN0XSA9ICgoKChjICogaykgfCAwKSAvIDI1NSkgfCAwKTtcblx0XHRkc3REYXRhW2RzdCArIDFdID0gKCgoKG0gKiBrKSB8IDApIC8gMjU1KSB8IDApO1xuXHRcdGRzdERhdGFbZHN0ICsgMl0gPSAoKCgoeSAqIGspIHwgMCkgLyAyNTUpIHwgMCk7XG5cdFx0ZHN0RGF0YVtkc3QgKyAzXSA9IHJldmVyc2VBbHBoYSA/IDI1NSAtIHNyY0RhdGFbc3JjICsgNF0gOiBzcmNEYXRhW3NyYyArIDRdO1xuXHR9XG5cblx0Ly8gZm9yIChsZXQgc3JjID0gMCwgZHN0ID0gMDsgZHN0IDwgc2l6ZTsgc3JjICs9IDUsIGRzdCArPSA0KSB7XG5cdC8vIFx0Y29uc3QgYyA9IDEgLSAoc3JjRGF0YVtzcmMgKyAwXSAvIDI1NSk7XG5cdC8vIFx0Y29uc3QgbSA9IDEgLSAoc3JjRGF0YVtzcmMgKyAxXSAvIDI1NSk7XG5cdC8vIFx0Y29uc3QgeSA9IDEgLSAoc3JjRGF0YVtzcmMgKyAyXSAvIDI1NSk7XG5cdC8vIFx0Ly8gY29uc3QgayA9IHNyY0RhdGFbc3JjICsgM10gLyAyNTU7XG5cdC8vIFx0ZHN0RGF0YVtkc3QgKyAwXSA9ICgoMSAtIGMgKiAwLjgpICogMjU1KSB8IDA7XG5cdC8vIFx0ZHN0RGF0YVtkc3QgKyAxXSA9ICgoMSAtIG0gKiAwLjgpICogMjU1KSB8IDA7XG5cdC8vIFx0ZHN0RGF0YVtkc3QgKyAyXSA9ICgoMSAtIHkgKiAwLjgpICogMjU1KSB8IDA7XG5cdC8vIFx0ZHN0RGF0YVtkc3QgKyAzXSA9IHJldmVyc2VBbHBoYSA/IDI1NSAtIHNyY0RhdGFbc3JjICsgNF0gOiBzcmNEYXRhW3NyYyArIDRdO1xuXHQvLyB9XG59XG5cbmZ1bmN0aW9uIHJlYWREYXRhUmF3KHJlYWRlcjogUHNkUmVhZGVyLCBwaXhlbERhdGE6IFBpeGVsRGF0YSB8IHVuZGVmaW5lZCwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIHN0ZXA6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIpIHtcblx0Y29uc3Qgc2l6ZSA9IHdpZHRoICogaGVpZ2h0O1xuXHRjb25zdCBidWZmZXIgPSByZWFkQnl0ZXMocmVhZGVyLCBzaXplKTtcblxuXHRpZiAocGl4ZWxEYXRhICYmIG9mZnNldCA8IHN0ZXApIHtcblx0XHRjb25zdCBkYXRhID0gcGl4ZWxEYXRhLmRhdGE7XG5cblx0XHRmb3IgKGxldCBpID0gMCwgcCA9IG9mZnNldCB8IDA7IGkgPCBzaXplOyBpKyssIHAgPSAocCArIHN0ZXApIHwgMCkge1xuXHRcdFx0ZGF0YVtwXSA9IGJ1ZmZlcltpXTtcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWREYXRhWmlwV2l0aG91dFByZWRpY3Rpb24oXG5cdHJlYWRlcjogUHNkUmVhZGVyLCBsZW5ndGg6IG51bWJlciwgcGl4ZWxEYXRhOiBQaXhlbERhdGEgfCB1bmRlZmluZWQsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLFxuXHRzdGVwOiBudW1iZXIsIG9mZnNldDogbnVtYmVyXG4pIHtcblx0Y29uc3QgY29tcHJlc3NlZCA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlbmd0aCk7XG5cdGNvbnN0IGRlY29tcHJlc3NlZCA9IGluZmxhdGUoY29tcHJlc3NlZCk7XG5cdGNvbnN0IHNpemUgPSB3aWR0aCAqIGhlaWdodDtcblxuXHRpZiAocGl4ZWxEYXRhICYmIG9mZnNldCA8IHN0ZXApIHtcblx0XHRjb25zdCBkYXRhID0gcGl4ZWxEYXRhLmRhdGE7XG5cblx0XHRmb3IgKGxldCBpID0gMCwgcCA9IG9mZnNldCB8IDA7IGkgPCBzaXplOyBpKyssIHAgPSAocCArIHN0ZXApIHwgMCkge1xuXHRcdFx0ZGF0YVtwXSA9IGRlY29tcHJlc3NlZFtpXTtcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWREYXRhUkxFKFxuXHRyZWFkZXI6IFBzZFJlYWRlciwgcGl4ZWxEYXRhOiBQaXhlbERhdGEgfCB1bmRlZmluZWQsIF93aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgc3RlcDogbnVtYmVyLCBvZmZzZXRzOiBudW1iZXJbXSxcblx0bGFyZ2U6IGJvb2xlYW5cbikge1xuXHRjb25zdCBkYXRhID0gcGl4ZWxEYXRhICYmIHBpeGVsRGF0YS5kYXRhO1xuXHRsZXQgbGVuZ3RoczogVWludDE2QXJyYXkgfCBVaW50MzJBcnJheTtcblxuXHRpZiAobGFyZ2UpIHtcblx0XHRsZW5ndGhzID0gbmV3IFVpbnQzMkFycmF5KG9mZnNldHMubGVuZ3RoICogaGVpZ2h0KTtcblxuXHRcdGZvciAobGV0IG8gPSAwLCBsaSA9IDA7IG8gPCBvZmZzZXRzLmxlbmd0aDsgbysrKSB7XG5cdFx0XHRmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodDsgeSsrLCBsaSsrKSB7XG5cdFx0XHRcdGxlbmd0aHNbbGldID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRsZW5ndGhzID0gbmV3IFVpbnQxNkFycmF5KG9mZnNldHMubGVuZ3RoICogaGVpZ2h0KTtcblxuXHRcdGZvciAobGV0IG8gPSAwLCBsaSA9IDA7IG8gPCBvZmZzZXRzLmxlbmd0aDsgbysrKSB7XG5cdFx0XHRmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodDsgeSsrLCBsaSsrKSB7XG5cdFx0XHRcdGxlbmd0aHNbbGldID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGNvbnN0IGV4dHJhTGltaXQgPSAoc3RlcCAtIDEpIHwgMDsgLy8gMyBmb3IgcmdiLCA0IGZvciBjbXlrXG5cblx0Zm9yIChsZXQgYyA9IDAsIGxpID0gMDsgYyA8IG9mZnNldHMubGVuZ3RoOyBjKyspIHtcblx0XHRjb25zdCBvZmZzZXQgPSBvZmZzZXRzW2NdIHwgMDtcblx0XHRjb25zdCBleHRyYSA9IGMgPiBleHRyYUxpbWl0IHx8IG9mZnNldCA+IGV4dHJhTGltaXQ7XG5cblx0XHRpZiAoIWRhdGEgfHwgZXh0cmEpIHtcblx0XHRcdGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyssIGxpKyspIHtcblx0XHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVuZ3Roc1tsaV0pO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKGxldCB5ID0gMCwgcCA9IG9mZnNldCB8IDA7IHkgPCBoZWlnaHQ7IHkrKywgbGkrKykge1xuXHRcdFx0XHRjb25zdCBsZW5ndGggPSBsZW5ndGhzW2xpXTtcblx0XHRcdFx0Y29uc3QgYnVmZmVyID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVuZ3RoKTtcblxuXHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0bGV0IGhlYWRlciA9IGJ1ZmZlcltpXTtcblxuXHRcdFx0XHRcdGlmIChoZWFkZXIgPiAxMjgpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHZhbHVlID0gYnVmZmVyWysraV07XG5cdFx0XHRcdFx0XHRoZWFkZXIgPSAoMjU2IC0gaGVhZGVyKSB8IDA7XG5cblx0XHRcdFx0XHRcdGZvciAobGV0IGogPSAwOyBqIDw9IGhlYWRlcjsgaiA9IChqICsgMSkgfCAwKSB7XG5cdFx0XHRcdFx0XHRcdGRhdGFbcF0gPSB2YWx1ZTtcblx0XHRcdFx0XHRcdFx0cCA9IChwICsgc3RlcCkgfCAwO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoaGVhZGVyIDwgMTI4KSB7XG5cdFx0XHRcdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8PSBoZWFkZXI7IGogPSAoaiArIDEpIHwgMCkge1xuXHRcdFx0XHRcdFx0XHRkYXRhW3BdID0gYnVmZmVyWysraV07XG5cdFx0XHRcdFx0XHRcdHAgPSAocCArIHN0ZXApIHwgMDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gaWdub3JlIDEyOFxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIFRoaXMgc2hvd2VkIHVwIG9uIHNvbWUgaW1hZ2VzIGZyb20gbm9uLXBob3Rvc2hvcCBwcm9ncmFtcywgaWdub3JpbmcgaXQgc2VlbXMgdG8gd29yayBqdXN0IGZpbmUuXG5cdFx0XHRcdFx0Ly8gaWYgKGkgPj0gbGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgUkxFIGRhdGE6IGV4Y2VlZGVkIGJ1ZmZlciBzaXplICR7aX0vJHtsZW5ndGh9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRTZWN0aW9uPFQ+KFxuXHRyZWFkZXI6IFBzZFJlYWRlciwgcm91bmQ6IG51bWJlciwgZnVuYzogKGxlZnQ6ICgpID0+IG51bWJlcikgPT4gVCwgc2tpcEVtcHR5ID0gdHJ1ZSwgZWlnaHRCeXRlcyA9IGZhbHNlXG4pOiBUIHwgdW5kZWZpbmVkIHtcblx0bGV0IGxlbmd0aCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblxuXHRpZiAoZWlnaHRCeXRlcykge1xuXHRcdGlmIChsZW5ndGggIT09IDApIHRocm93IG5ldyBFcnJvcignU2l6ZXMgbGFyZ2VyIHRoYW4gNEdCIGFyZSBub3Qgc3VwcG9ydGVkJyk7XG5cdFx0bGVuZ3RoID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHR9XG5cblx0aWYgKGxlbmd0aCA8PSAwICYmIHNraXBFbXB0eSkgcmV0dXJuIHVuZGVmaW5lZDtcblxuXHRsZXQgZW5kID0gcmVhZGVyLm9mZnNldCArIGxlbmd0aDtcblx0aWYgKGVuZCA+IHJlYWRlci52aWV3LmJ5dGVMZW5ndGgpIHRocm93IG5ldyBFcnJvcignU2VjdGlvbiBleGNlZWRzIGZpbGUgc2l6ZScpO1xuXG5cdGNvbnN0IHJlc3VsdCA9IGZ1bmMoKCkgPT4gZW5kIC0gcmVhZGVyLm9mZnNldCk7XG5cblx0aWYgKHJlYWRlci5vZmZzZXQgIT09IGVuZCkge1xuXHRcdGlmIChyZWFkZXIub2Zmc2V0ID4gZW5kKSB7XG5cdFx0XHR3YXJuT3JUaHJvdyhyZWFkZXIsICdFeGNlZWRlZCBzZWN0aW9uIGxpbWl0cycpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR3YXJuT3JUaHJvdyhyZWFkZXIsIGBVbnJlYWQgc2VjdGlvbiBkYXRhYCk7IC8vIDogJHtlbmQgLSByZWFkZXIub2Zmc2V0fSBieXRlcyBhdCAweCR7cmVhZGVyLm9mZnNldC50b1N0cmluZygxNil9YCk7XG5cdFx0fVxuXHR9XG5cblx0d2hpbGUgKGVuZCAlIHJvdW5kKSBlbmQrKztcblx0cmVhZGVyLm9mZnNldCA9IGVuZDtcblxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZENvbG9yKHJlYWRlcjogUHNkUmVhZGVyKTogQ29sb3Ige1xuXHRjb25zdCBjb2xvclNwYWNlID0gcmVhZFVpbnQxNihyZWFkZXIpIGFzIENvbG9yU3BhY2U7XG5cblx0c3dpdGNoIChjb2xvclNwYWNlKSB7XG5cdFx0Y2FzZSBDb2xvclNwYWNlLlJHQjoge1xuXHRcdFx0Y29uc3QgciA9IHJlYWRVaW50MTYocmVhZGVyKSAvIDI1Nztcblx0XHRcdGNvbnN0IGcgPSByZWFkVWludDE2KHJlYWRlcikgLyAyNTc7XG5cdFx0XHRjb25zdCBiID0gcmVhZFVpbnQxNihyZWFkZXIpIC8gMjU3O1xuXHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgMik7XG5cdFx0XHRyZXR1cm4geyByLCBnLCBiIH07XG5cdFx0fVxuXHRcdGNhc2UgQ29sb3JTcGFjZS5IU0I6IHtcblx0XHRcdGNvbnN0IGggPSByZWFkVWludDE2KHJlYWRlcikgLyAweGZmZmY7XG5cdFx0XHRjb25zdCBzID0gcmVhZFVpbnQxNihyZWFkZXIpIC8gMHhmZmZmO1xuXHRcdFx0Y29uc3QgYiA9IHJlYWRVaW50MTYocmVhZGVyKSAvIDB4ZmZmZjtcblx0XHRcdHNraXBCeXRlcyhyZWFkZXIsIDIpO1xuXHRcdFx0cmV0dXJuIHsgaCwgcywgYiB9O1xuXHRcdH1cblx0XHRjYXNlIENvbG9yU3BhY2UuQ01ZSzoge1xuXHRcdFx0Y29uc3QgYyA9IHJlYWRVaW50MTYocmVhZGVyKSAvIDI1Nztcblx0XHRcdGNvbnN0IG0gPSByZWFkVWludDE2KHJlYWRlcikgLyAyNTc7XG5cdFx0XHRjb25zdCB5ID0gcmVhZFVpbnQxNihyZWFkZXIpIC8gMjU3O1xuXHRcdFx0Y29uc3QgayA9IHJlYWRVaW50MTYocmVhZGVyKSAvIDI1Nztcblx0XHRcdHJldHVybiB7IGMsIG0sIHksIGsgfTtcblx0XHR9XG5cdFx0Y2FzZSBDb2xvclNwYWNlLkxhYjoge1xuXHRcdFx0Y29uc3QgbCA9IHJlYWRJbnQxNihyZWFkZXIpIC8gMTAwMDA7XG5cdFx0XHRjb25zdCB0YSA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRcdFx0Y29uc3QgdGIgPSByZWFkSW50MTYocmVhZGVyKTtcblx0XHRcdGNvbnN0IGEgPSB0YSA8IDAgPyAodGEgLyAxMjgwMCkgOiAodGEgLyAxMjcwMCk7XG5cdFx0XHRjb25zdCBiID0gdGIgPCAwID8gKHRiIC8gMTI4MDApIDogKHRiIC8gMTI3MDApO1xuXHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgMik7XG5cdFx0XHRyZXR1cm4geyBsLCBhLCBiIH07XG5cdFx0fVxuXHRcdGNhc2UgQ29sb3JTcGFjZS5HcmF5c2NhbGU6IHtcblx0XHRcdGNvbnN0IGsgPSByZWFkVWludDE2KHJlYWRlcikgKiAyNTUgLyAxMDAwMDtcblx0XHRcdHNraXBCeXRlcyhyZWFkZXIsIDYpO1xuXHRcdFx0cmV0dXJuIHsgayB9O1xuXHRcdH1cblx0XHRkZWZhdWx0OlxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbG9yIHNwYWNlJyk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQYXR0ZXJuKHJlYWRlcjogUHNkUmVhZGVyKTogUGF0dGVybkluZm8ge1xuXHRyZWFkVWludDMyKHJlYWRlcik7IC8vIGxlbmd0aFxuXHRjb25zdCB2ZXJzaW9uID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRpZiAodmVyc2lvbiAhPT0gMSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHBhdHRlcm4gdmVyc2lvbjogJHt2ZXJzaW9ufWApO1xuXG5cdGNvbnN0IGNvbG9yTW9kZSA9IHJlYWRVaW50MzIocmVhZGVyKSBhcyBDb2xvck1vZGU7XG5cdGNvbnN0IHggPSByZWFkSW50MTYocmVhZGVyKTtcblx0Y29uc3QgeSA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXG5cdC8vIHdlIG9ubHkgc3VwcG9ydCBSR0IgYW5kIGdyYXlzY2FsZSBmb3Igbm93XG5cdGlmIChjb2xvck1vZGUgIT09IENvbG9yTW9kZS5SR0IgJiYgY29sb3JNb2RlICE9PSBDb2xvck1vZGUuR3JheXNjYWxlICYmIGNvbG9yTW9kZSAhPT0gQ29sb3JNb2RlLkluZGV4ZWQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHBhdHRlcm4gY29sb3IgbW9kZTogJHtjb2xvck1vZGV9YCk7XG5cdH1cblxuXHRsZXQgbmFtZSA9IHJlYWRVbmljb2RlU3RyaW5nKHJlYWRlcik7XG5cdGNvbnN0IGlkID0gcmVhZFBhc2NhbFN0cmluZyhyZWFkZXIsIDEpO1xuXHRjb25zdCBwYWxldHRlOiBSR0JbXSA9IFtdO1xuXG5cdGlmIChjb2xvck1vZGUgPT09IENvbG9yTW9kZS5JbmRleGVkKSB7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCAyNTY7IGkrKykge1xuXHRcdFx0cGFsZXR0ZS5wdXNoKHtcblx0XHRcdFx0cjogcmVhZFVpbnQ4KHJlYWRlciksXG5cdFx0XHRcdGc6IHJlYWRVaW50OChyZWFkZXIpLFxuXHRcdFx0XHRiOiByZWFkVWludDgocmVhZGVyKSxcblx0XHRcdH0pXG5cdFx0fVxuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgNCk7IC8vIG5vIGlkZWEgd2hhdCB0aGlzIGlzXG5cdH1cblxuXHQvLyB2aXJ0dWFsIG1lbW9yeSBhcnJheSBsaXN0XG5cdGNvbnN0IHZlcnNpb24yID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRpZiAodmVyc2lvbjIgIT09IDMpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBwYXR0ZXJuIFZNQUwgdmVyc2lvbjogJHt2ZXJzaW9uMn1gKTtcblxuXHRyZWFkVWludDMyKHJlYWRlcik7IC8vIGxlbmd0aFxuXHRjb25zdCB0b3AgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdGNvbnN0IGxlZnQgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdGNvbnN0IGJvdHRvbSA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0Y29uc3QgcmlnaHQgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdGNvbnN0IGNoYW5uZWxzQ291bnQgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdGNvbnN0IHdpZHRoID0gcmlnaHQgLSBsZWZ0O1xuXHRjb25zdCBoZWlnaHQgPSBib3R0b20gLSB0b3A7XG5cdGNvbnN0IGRhdGEgPSBuZXcgVWludDhBcnJheSh3aWR0aCAqIGhlaWdodCAqIDQpO1xuXG5cdGZvciAobGV0IGkgPSAzOyBpIDwgZGF0YS5ieXRlTGVuZ3RoOyBpICs9IDQpIHtcblx0XHRkYXRhW2ldID0gMjU1O1xuXHR9XG5cblx0Zm9yIChsZXQgaSA9IDAsIGNoID0gMDsgaSA8IChjaGFubmVsc0NvdW50ICsgMik7IGkrKykge1xuXHRcdGNvbnN0IGhhcyA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRpZiAoIWhhcykgY29udGludWU7XG5cblx0XHRjb25zdCBsZW5ndGggPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0Y29uc3QgcGl4ZWxEZXB0aCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRjb25zdCBjdG9wID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdGNvbnN0IGNsZWZ0ID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdGNvbnN0IGNib3R0b20gPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0Y29uc3QgY3JpZ2h0ID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdGNvbnN0IHBpeGVsRGVwdGgyID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGNvbnN0IGNvbXByZXNzaW9uTW9kZSA9IHJlYWRVaW50OChyZWFkZXIpOyAvLyAwIC0gcmF3LCAxIC0gemlwXG5cdFx0Y29uc3QgZGF0YUxlbmd0aCA9IGxlbmd0aCAtICg0ICsgMTYgKyAyICsgMSk7XG5cdFx0Y29uc3QgY2RhdGEgPSByZWFkQnl0ZXMocmVhZGVyLCBkYXRhTGVuZ3RoKTtcblxuXHRcdGlmIChwaXhlbERlcHRoICE9PSA4IHx8IHBpeGVsRGVwdGgyICE9PSA4KSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJzE2Yml0IHBpeGVsIGRlcHRoIG5vdCBzdXBwb3J0ZWQgZm9yIHBhdHRlcm5zJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdyA9IGNyaWdodCAtIGNsZWZ0O1xuXHRcdGNvbnN0IGggPSBjYm90dG9tIC0gY3RvcDtcblx0XHRjb25zdCBveCA9IGNsZWZ0IC0gbGVmdDtcblx0XHRjb25zdCBveSA9IGN0b3AgLSB0b3A7XG5cblx0XHRpZiAoY29tcHJlc3Npb25Nb2RlID09PSAwKSB7XG5cdFx0XHRpZiAoY29sb3JNb2RlID09PSBDb2xvck1vZGUuUkdCICYmIGNoIDwgMykge1xuXHRcdFx0XHRmb3IgKGxldCB5ID0gMDsgeSA8IGg7IHkrKykge1xuXHRcdFx0XHRcdGZvciAobGV0IHggPSAwOyB4IDwgdzsgeCsrKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBzcmMgPSB4ICsgeSAqIHc7XG5cdFx0XHRcdFx0XHRjb25zdCBkc3QgPSAob3ggKyB4ICsgKHkgKyBveSkgKiB3aWR0aCkgKiA0O1xuXHRcdFx0XHRcdFx0ZGF0YVtkc3QgKyBjaF0gPSBjZGF0YVtzcmNdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoY29sb3JNb2RlID09PSBDb2xvck1vZGUuR3JheXNjYWxlICYmIGNoIDwgMSkge1xuXHRcdFx0XHRmb3IgKGxldCB5ID0gMDsgeSA8IGg7IHkrKykge1xuXHRcdFx0XHRcdGZvciAobGV0IHggPSAwOyB4IDwgdzsgeCsrKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBzcmMgPSB4ICsgeSAqIHc7XG5cdFx0XHRcdFx0XHRjb25zdCBkc3QgPSAob3ggKyB4ICsgKHkgKyBveSkgKiB3aWR0aCkgKiA0O1xuXHRcdFx0XHRcdFx0Y29uc3QgdmFsdWUgPSBjZGF0YVtzcmNdO1xuXHRcdFx0XHRcdFx0ZGF0YVtkc3QgKyAwXSA9IHZhbHVlO1xuXHRcdFx0XHRcdFx0ZGF0YVtkc3QgKyAxXSA9IHZhbHVlO1xuXHRcdFx0XHRcdFx0ZGF0YVtkc3QgKyAyXSA9IHZhbHVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoY29sb3JNb2RlID09PSBDb2xvck1vZGUuSW5kZXhlZCkge1xuXHRcdFx0XHQvLyBUT0RPOlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0luZGV4ZWQgcGF0dGVybiBjb2xvciBtb2RlIG5vdCBpbXBsZW1lbnRlZCcpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoY29tcHJlc3Npb25Nb2RlID09PSAxKSB7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyh7IGNvbG9yTW9kZSB9KTtcblx0XHRcdC8vIHJlcXVpcmUoJ2ZzJykud3JpdGVGaWxlU3luYygnemlwLmJpbicsIEJ1ZmZlci5mcm9tKGNkYXRhKSk7XG5cdFx0XHQvLyBjb25zdCBkYXRhID0gcmVxdWlyZSgnemxpYicpLmluZmxhdGVSYXdTeW5jKGNkYXRhKTtcblx0XHRcdC8vIGNvbnN0IGRhdGEgPSByZXF1aXJlKCd6bGliJykudW56aXBTeW5jKGNkYXRhKTtcblx0XHRcdC8vIGNvbnNvbGUubG9nKGRhdGEpO1xuXHRcdFx0Ly8gdGhyb3cgbmV3IEVycm9yKCdaaXAgY29tcHJlc3Npb24gbm90IHN1cHBvcnRlZCBmb3IgcGF0dGVybicpO1xuXHRcdFx0Ly8gdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBwYXR0ZXJuIGNvbXByZXNzaW9uJyk7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdVbnN1cHBvcnRlZCBwYXR0ZXJuIGNvbXByZXNzaW9uJyk7XG5cdFx0XHRuYW1lICs9ICcgKGZhaWxlZCB0byBkZWNvZGUpJztcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhdHRlcm4gY29tcHJlc3Npb24gbW9kZScpO1xuXHRcdH1cblxuXHRcdGNoKys7XG5cdH1cblxuXHQvLyBUT0RPOiB1c2UgY2FudmFzIGluc3RlYWQgb2YgZGF0YSA/XG5cblx0cmV0dXJuIHsgaWQsIG5hbWUsIHgsIHksIGJvdW5kczogeyB4OiBsZWZ0LCB5OiB0b3AsIHc6IHdpZHRoLCBoOiBoZWlnaHQgfSwgZGF0YSB9O1xufVxuIl0sInNvdXJjZVJvb3QiOiJDOlxcUHJvamVjdHNcXGdpdGh1YlxcYWctcHNkXFxzcmMifQ==
