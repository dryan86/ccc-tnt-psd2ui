"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCanvas = exports.createImageData = exports.createCanvasFromData = exports.createCanvas = exports.writeDataZipWithoutPrediction = exports.writeDataRLE = exports.writeDataRaw = exports.decodeBitmap = exports.resetImageData = exports.hasAlpha = exports.clamp = exports.offsetForChannel = exports.Compression = exports.ChannelID = exports.MaskParams = exports.LayerMaskFlags = exports.ColorSpace = exports.createEnum = exports.revMap = exports.largeAdditionalInfoKeys = exports.layerColors = exports.toBlendMode = exports.fromBlendMode = exports.RAW_IMAGE_DATA = exports.MOCK_HANDLERS = void 0;
var base64_js_1 = require("base64-js");
var pako_1 = require("pako");
exports.MOCK_HANDLERS = false;
exports.RAW_IMAGE_DATA = false;
exports.fromBlendMode = {};
exports.toBlendMode = {
    'pass': 'pass through',
    'norm': 'normal',
    'diss': 'dissolve',
    'dark': 'darken',
    'mul ': 'multiply',
    'idiv': 'color burn',
    'lbrn': 'linear burn',
    'dkCl': 'darker color',
    'lite': 'lighten',
    'scrn': 'screen',
    'div ': 'color dodge',
    'lddg': 'linear dodge',
    'lgCl': 'lighter color',
    'over': 'overlay',
    'sLit': 'soft light',
    'hLit': 'hard light',
    'vLit': 'vivid light',
    'lLit': 'linear light',
    'pLit': 'pin light',
    'hMix': 'hard mix',
    'diff': 'difference',
    'smud': 'exclusion',
    'fsub': 'subtract',
    'fdiv': 'divide',
    'hue ': 'hue',
    'sat ': 'saturation',
    'colr': 'color',
    'lum ': 'luminosity',
};
Object.keys(exports.toBlendMode).forEach(function (key) { return exports.fromBlendMode[exports.toBlendMode[key]] = key; });
exports.layerColors = [
    'none', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray'
];
exports.largeAdditionalInfoKeys = [
    // from documentation
    'LMsk', 'Lr16', 'Lr32', 'Layr', 'Mt16', 'Mt32', 'Mtrn', 'Alph', 'FMsk', 'lnk2', 'FEid', 'FXid', 'PxSD',
    // from guessing
    'cinf',
];
function revMap(map) {
    var result = {};
    Object.keys(map).forEach(function (key) { return result[map[key]] = key; });
    return result;
}
exports.revMap = revMap;
function createEnum(prefix, def, map) {
    var rev = revMap(map);
    var decode = function (val) {
        var value = val.split('.')[1];
        if (value && !rev[value])
            throw new Error("Unrecognized value for enum: '".concat(val, "'"));
        return rev[value] || def;
    };
    var encode = function (val) {
        if (val && !map[val])
            throw new Error("Invalid value for enum: '".concat(val, "'"));
        return "".concat(prefix, ".").concat(map[val] || map[def]);
    };
    return { decode: decode, encode: encode };
}
exports.createEnum = createEnum;
var ColorSpace;
(function (ColorSpace) {
    ColorSpace[ColorSpace["RGB"] = 0] = "RGB";
    ColorSpace[ColorSpace["HSB"] = 1] = "HSB";
    ColorSpace[ColorSpace["CMYK"] = 2] = "CMYK";
    ColorSpace[ColorSpace["Lab"] = 7] = "Lab";
    ColorSpace[ColorSpace["Grayscale"] = 8] = "Grayscale";
})(ColorSpace = exports.ColorSpace || (exports.ColorSpace = {}));
var LayerMaskFlags;
(function (LayerMaskFlags) {
    LayerMaskFlags[LayerMaskFlags["PositionRelativeToLayer"] = 1] = "PositionRelativeToLayer";
    LayerMaskFlags[LayerMaskFlags["LayerMaskDisabled"] = 2] = "LayerMaskDisabled";
    LayerMaskFlags[LayerMaskFlags["InvertLayerMaskWhenBlending"] = 4] = "InvertLayerMaskWhenBlending";
    LayerMaskFlags[LayerMaskFlags["LayerMaskFromRenderingOtherData"] = 8] = "LayerMaskFromRenderingOtherData";
    LayerMaskFlags[LayerMaskFlags["MaskHasParametersAppliedToIt"] = 16] = "MaskHasParametersAppliedToIt";
})(LayerMaskFlags = exports.LayerMaskFlags || (exports.LayerMaskFlags = {}));
var MaskParams;
(function (MaskParams) {
    MaskParams[MaskParams["UserMaskDensity"] = 1] = "UserMaskDensity";
    MaskParams[MaskParams["UserMaskFeather"] = 2] = "UserMaskFeather";
    MaskParams[MaskParams["VectorMaskDensity"] = 4] = "VectorMaskDensity";
    MaskParams[MaskParams["VectorMaskFeather"] = 8] = "VectorMaskFeather";
})(MaskParams = exports.MaskParams || (exports.MaskParams = {}));
var ChannelID;
(function (ChannelID) {
    ChannelID[ChannelID["Color0"] = 0] = "Color0";
    ChannelID[ChannelID["Color1"] = 1] = "Color1";
    ChannelID[ChannelID["Color2"] = 2] = "Color2";
    ChannelID[ChannelID["Color3"] = 3] = "Color3";
    ChannelID[ChannelID["Transparency"] = -1] = "Transparency";
    ChannelID[ChannelID["UserMask"] = -2] = "UserMask";
    ChannelID[ChannelID["RealUserMask"] = -3] = "RealUserMask";
})(ChannelID = exports.ChannelID || (exports.ChannelID = {}));
var Compression;
(function (Compression) {
    Compression[Compression["RawData"] = 0] = "RawData";
    Compression[Compression["RleCompressed"] = 1] = "RleCompressed";
    Compression[Compression["ZipWithoutPrediction"] = 2] = "ZipWithoutPrediction";
    Compression[Compression["ZipWithPrediction"] = 3] = "ZipWithPrediction";
})(Compression = exports.Compression || (exports.Compression = {}));
function offsetForChannel(channelId, cmyk) {
    switch (channelId) {
        case 0 /* ChannelID.Color0 */: return 0;
        case 1 /* ChannelID.Color1 */: return 1;
        case 2 /* ChannelID.Color2 */: return 2;
        case 3 /* ChannelID.Color3 */: return cmyk ? 3 : channelId + 1;
        case -1 /* ChannelID.Transparency */: return cmyk ? 4 : 3;
        default: return channelId + 1;
    }
}
exports.offsetForChannel = offsetForChannel;
function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value);
}
exports.clamp = clamp;
function hasAlpha(data) {
    var size = data.width * data.height * 4;
    for (var i = 3; i < size; i += 4) {
        if (data.data[i] !== 255) {
            return true;
        }
    }
    return false;
}
exports.hasAlpha = hasAlpha;
function resetImageData(_a) {
    var data = _a.data;
    var buffer = new Uint32Array(data.buffer);
    var size = buffer.length | 0;
    for (var p = 0; p < size; p = (p + 1) | 0) {
        buffer[p] = 0xff000000;
    }
}
exports.resetImageData = resetImageData;
function decodeBitmap(input, output, width, height) {
    for (var y = 0, p = 0, o = 0; y < height; y++) {
        for (var x = 0; x < width;) {
            var b = input[o++];
            for (var i = 0; i < 8 && x < width; i++, x++) {
                var v = b & 0x80 ? 0 : 255;
                b = b << 1;
                output[p++] = v;
                output[p++] = v;
                output[p++] = v;
                output[p++] = 255;
            }
        }
    }
}
exports.decodeBitmap = decodeBitmap;
function writeDataRaw(data, offset, width, height) {
    if (!width || !height)
        return undefined;
    var array = new Uint8Array(width * height);
    for (var i = 0; i < array.length; i++) {
        array[i] = data.data[i * 4 + offset];
    }
    return array;
}
exports.writeDataRaw = writeDataRaw;
function writeDataRLE(buffer, _a, offsets, large) {
    var data = _a.data, width = _a.width, height = _a.height;
    if (!width || !height)
        return undefined;
    var stride = (4 * width) | 0;
    var ol = 0;
    var o = (offsets.length * (large ? 4 : 2) * height) | 0;
    for (var _i = 0, offsets_1 = offsets; _i < offsets_1.length; _i++) {
        var offset = offsets_1[_i];
        for (var y = 0, p = offset | 0; y < height; y++) {
            var strideStart = (y * stride) | 0;
            var strideEnd = (strideStart + stride) | 0;
            var lastIndex = (strideEnd + offset - 4) | 0;
            var lastIndex2 = (lastIndex - 4) | 0;
            var startOffset = o;
            for (p = (strideStart + offset) | 0; p < strideEnd; p = (p + 4) | 0) {
                if (p < lastIndex2) {
                    var value1 = data[p];
                    p = (p + 4) | 0;
                    var value2 = data[p];
                    p = (p + 4) | 0;
                    var value3 = data[p];
                    if (value1 === value2 && value1 === value3) {
                        var count = 3;
                        while (count < 128 && p < lastIndex && data[(p + 4) | 0] === value1) {
                            count = (count + 1) | 0;
                            p = (p + 4) | 0;
                        }
                        buffer[o++] = 1 - count;
                        buffer[o++] = value1;
                    }
                    else {
                        var countIndex = o;
                        var writeLast = true;
                        var count = 1;
                        buffer[o++] = 0;
                        buffer[o++] = value1;
                        while (p < lastIndex && count < 128) {
                            p = (p + 4) | 0;
                            value1 = value2;
                            value2 = value3;
                            value3 = data[p];
                            if (value1 === value2 && value1 === value3) {
                                p = (p - 12) | 0;
                                writeLast = false;
                                break;
                            }
                            else {
                                count++;
                                buffer[o++] = value1;
                            }
                        }
                        if (writeLast) {
                            if (count < 127) {
                                buffer[o++] = value2;
                                buffer[o++] = value3;
                                count += 2;
                            }
                            else if (count < 128) {
                                buffer[o++] = value2;
                                count++;
                                p = (p - 4) | 0;
                            }
                            else {
                                p = (p - 8) | 0;
                            }
                        }
                        buffer[countIndex] = count - 1;
                    }
                }
                else if (p === lastIndex) {
                    buffer[o++] = 0;
                    buffer[o++] = data[p];
                }
                else { // p === lastIndex2
                    buffer[o++] = 1;
                    buffer[o++] = data[p];
                    p = (p + 4) | 0;
                    buffer[o++] = data[p];
                }
            }
            var length_1 = o - startOffset;
            if (large) {
                buffer[ol++] = (length_1 >> 24) & 0xff;
                buffer[ol++] = (length_1 >> 16) & 0xff;
            }
            buffer[ol++] = (length_1 >> 8) & 0xff;
            buffer[ol++] = length_1 & 0xff;
        }
    }
    return buffer.slice(0, o);
}
exports.writeDataRLE = writeDataRLE;
function writeDataZipWithoutPrediction(_a, offsets) {
    var data = _a.data, width = _a.width, height = _a.height;
    var size = width * height;
    var channel = new Uint8Array(size);
    var buffers = [];
    var totalLength = 0;
    for (var _i = 0, offsets_2 = offsets; _i < offsets_2.length; _i++) {
        var offset = offsets_2[_i];
        for (var i = 0, o = offset; i < size; i++, o += 4) {
            channel[i] = data[o];
        }
        var buffer = (0, pako_1.deflate)(channel);
        buffers.push(buffer);
        totalLength += buffer.byteLength;
    }
    if (buffers.length > 0) {
        var buffer = new Uint8Array(totalLength);
        var offset = 0;
        for (var _b = 0, buffers_1 = buffers; _b < buffers_1.length; _b++) {
            var b = buffers_1[_b];
            buffer.set(b, offset);
            offset += b.byteLength;
        }
        return buffer;
    }
    else {
        return buffers[0];
    }
}
exports.writeDataZipWithoutPrediction = writeDataZipWithoutPrediction;
var createCanvas = function () {
    throw new Error('Canvas not initialized, use initializeCanvas method to set up createCanvas method');
};
exports.createCanvas = createCanvas;
var createCanvasFromData = function () {
    throw new Error('Canvas not initialized, use initializeCanvas method to set up createCanvasFromData method');
};
exports.createCanvasFromData = createCanvasFromData;
var tempCanvas = undefined;
var createImageData = function (width, height) {
    if (!tempCanvas)
        tempCanvas = (0, exports.createCanvas)(1, 1);
    return tempCanvas.getContext('2d').createImageData(width, height);
};
exports.createImageData = createImageData;
if (typeof document !== 'undefined') {
    exports.createCanvas = function (width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    };
    exports.createCanvasFromData = function (data) {
        var image = new Image();
        image.src = 'data:image/jpeg;base64,' + (0, base64_js_1.fromByteArray)(data);
        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext('2d').drawImage(image, 0, 0);
        return canvas;
    };
}
function initializeCanvas(createCanvasMethod, createCanvasFromDataMethod, createImageDataMethod) {
    exports.createCanvas = createCanvasMethod;
    exports.createCanvasFromData = createCanvasFromDataMethod || exports.createCanvasFromData;
    exports.createImageData = createImageDataMethod || exports.createImageData;
}
exports.initializeCanvas = initializeCanvas;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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SyxDQUFDLEdBQUcsR0FBRyx5QkFBeUIsR0FBRyxJQUFBLHlCQUFhLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUQsSUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoRCxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFDM0IsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFFLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDLENBQUM7Q0FDRjtBQUVELFNBQWdCLGdCQUFnQixDQUMvQixrQkFBd0UsRUFDeEUsMEJBQW9FLEVBQ3BFLHFCQUFvRTtJQUVwRSxvQkFBWSxHQUFHLGtCQUFrQixDQUFDO0lBQ2xDLDRCQUFvQixHQUFHLDBCQUEwQixJQUFJLDRCQUFvQixDQUFDO0lBQzFFLHVCQUFlLEdBQUcscUJBQXFCLElBQUksdUJBQWUsQ0FBQztBQUM1RCxDQUFDO0FBUkQsNENBUUMiLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZyb21CeXRlQXJyYXkgfSBmcm9tICdiYXNlNjQtanMnO1xuaW1wb3J0IHsgZGVmbGF0ZSB9IGZyb20gJ3Bha28nO1xuaW1wb3J0IHsgTGF5ZXIsIEJsZW5kTW9kZSwgTGF5ZXJDb2xvciB9IGZyb20gJy4vcHNkJztcblxuZXhwb3J0IGNvbnN0IE1PQ0tfSEFORExFUlMgPSBmYWxzZTtcbmV4cG9ydCBjb25zdCBSQVdfSU1BR0VfREFUQSA9IGZhbHNlO1xuXG5leHBvcnQgY29uc3QgZnJvbUJsZW5kTW9kZTogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuZXhwb3J0IGNvbnN0IHRvQmxlbmRNb2RlOiB7IFtrZXk6IHN0cmluZ106IEJsZW5kTW9kZSB9ID0ge1xuXHQncGFzcyc6ICdwYXNzIHRocm91Z2gnLFxuXHQnbm9ybSc6ICdub3JtYWwnLFxuXHQnZGlzcyc6ICdkaXNzb2x2ZScsXG5cdCdkYXJrJzogJ2RhcmtlbicsXG5cdCdtdWwgJzogJ211bHRpcGx5Jyxcblx0J2lkaXYnOiAnY29sb3IgYnVybicsXG5cdCdsYnJuJzogJ2xpbmVhciBidXJuJyxcblx0J2RrQ2wnOiAnZGFya2VyIGNvbG9yJyxcblx0J2xpdGUnOiAnbGlnaHRlbicsXG5cdCdzY3JuJzogJ3NjcmVlbicsXG5cdCdkaXYgJzogJ2NvbG9yIGRvZGdlJyxcblx0J2xkZGcnOiAnbGluZWFyIGRvZGdlJyxcblx0J2xnQ2wnOiAnbGlnaHRlciBjb2xvcicsXG5cdCdvdmVyJzogJ292ZXJsYXknLFxuXHQnc0xpdCc6ICdzb2Z0IGxpZ2h0Jyxcblx0J2hMaXQnOiAnaGFyZCBsaWdodCcsXG5cdCd2TGl0JzogJ3ZpdmlkIGxpZ2h0Jyxcblx0J2xMaXQnOiAnbGluZWFyIGxpZ2h0Jyxcblx0J3BMaXQnOiAncGluIGxpZ2h0Jyxcblx0J2hNaXgnOiAnaGFyZCBtaXgnLFxuXHQnZGlmZic6ICdkaWZmZXJlbmNlJyxcblx0J3NtdWQnOiAnZXhjbHVzaW9uJyxcblx0J2ZzdWInOiAnc3VidHJhY3QnLFxuXHQnZmRpdic6ICdkaXZpZGUnLFxuXHQnaHVlICc6ICdodWUnLFxuXHQnc2F0ICc6ICdzYXR1cmF0aW9uJyxcblx0J2NvbHInOiAnY29sb3InLFxuXHQnbHVtICc6ICdsdW1pbm9zaXR5Jyxcbn07XG5cbk9iamVjdC5rZXlzKHRvQmxlbmRNb2RlKS5mb3JFYWNoKGtleSA9PiBmcm9tQmxlbmRNb2RlW3RvQmxlbmRNb2RlW2tleV1dID0ga2V5KTtcblxuZXhwb3J0IGNvbnN0IGxheWVyQ29sb3JzOiBMYXllckNvbG9yW10gPSBbXG5cdCdub25lJywgJ3JlZCcsICdvcmFuZ2UnLCAneWVsbG93JywgJ2dyZWVuJywgJ2JsdWUnLCAndmlvbGV0JywgJ2dyYXknXG5dO1xuXG5leHBvcnQgY29uc3QgbGFyZ2VBZGRpdGlvbmFsSW5mb0tleXMgPSBbXG5cdC8vIGZyb20gZG9jdW1lbnRhdGlvblxuXHQnTE1zaycsICdMcjE2JywgJ0xyMzInLCAnTGF5cicsICdNdDE2JywgJ010MzInLCAnTXRybicsICdBbHBoJywgJ0ZNc2snLCAnbG5rMicsICdGRWlkJywgJ0ZYaWQnLCAnUHhTRCcsXG5cdC8vIGZyb20gZ3Vlc3Npbmdcblx0J2NpbmYnLFxuXTtcblxuZXhwb3J0IGludGVyZmFjZSBEaWN0IHtcblx0W2tleTogc3RyaW5nXTogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmV2TWFwKG1hcDogRGljdCkge1xuXHRjb25zdCByZXN1bHQ6IERpY3QgPSB7fTtcblx0T2JqZWN0LmtleXMobWFwKS5mb3JFYWNoKGtleSA9PiByZXN1bHRbbWFwW2tleV1dID0ga2V5KTtcblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudW08VD4ocHJlZml4OiBzdHJpbmcsIGRlZjogc3RyaW5nLCBtYXA6IERpY3QpIHtcblx0Y29uc3QgcmV2ID0gcmV2TWFwKG1hcCk7XG5cdGNvbnN0IGRlY29kZSA9ICh2YWw6IHN0cmluZyk6IFQgPT4ge1xuXHRcdGNvbnN0IHZhbHVlID0gdmFsLnNwbGl0KCcuJylbMV07XG5cdFx0aWYgKHZhbHVlICYmICFyZXZbdmFsdWVdKSB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCB2YWx1ZSBmb3IgZW51bTogJyR7dmFsfSdgKTtcblx0XHRyZXR1cm4gKHJldlt2YWx1ZV0gYXMgYW55KSB8fCBkZWY7XG5cdH07XG5cdGNvbnN0IGVuY29kZSA9ICh2YWw6IFQgfCB1bmRlZmluZWQpOiBzdHJpbmcgPT4ge1xuXHRcdGlmICh2YWwgJiYgIW1hcFt2YWwgYXMgYW55XSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBlbnVtOiAnJHt2YWx9J2ApO1xuXHRcdHJldHVybiBgJHtwcmVmaXh9LiR7bWFwW3ZhbCBhcyBhbnldIHx8IG1hcFtkZWZdfWA7XG5cdH07XG5cdHJldHVybiB7IGRlY29kZSwgZW5jb2RlIH07XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIENvbG9yU3BhY2Uge1xuXHRSR0IgPSAwLFxuXHRIU0IgPSAxLFxuXHRDTVlLID0gMixcblx0TGFiID0gNyxcblx0R3JheXNjYWxlID0gOCxcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gTGF5ZXJNYXNrRmxhZ3Mge1xuXHRQb3NpdGlvblJlbGF0aXZlVG9MYXllciA9IDEsXG5cdExheWVyTWFza0Rpc2FibGVkID0gMixcblx0SW52ZXJ0TGF5ZXJNYXNrV2hlbkJsZW5kaW5nID0gNCwgLy8gb2Jzb2xldGVcblx0TGF5ZXJNYXNrRnJvbVJlbmRlcmluZ090aGVyRGF0YSA9IDgsXG5cdE1hc2tIYXNQYXJhbWV0ZXJzQXBwbGllZFRvSXQgPSAxNixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gTWFza1BhcmFtcyB7XG5cdFVzZXJNYXNrRGVuc2l0eSA9IDEsXG5cdFVzZXJNYXNrRmVhdGhlciA9IDIsXG5cdFZlY3Rvck1hc2tEZW5zaXR5ID0gNCxcblx0VmVjdG9yTWFza0ZlYXRoZXIgPSA4LFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBDaGFubmVsSUQge1xuXHRDb2xvcjAgPSAwLCAvLyByZWQgKHJnYikgLyBjeWFuIChjbXlrKVxuXHRDb2xvcjEgPSAxLCAvLyBncmVlbiAocmdiKSAvIG1hZ2VudGEgKGNteWspXG5cdENvbG9yMiA9IDIsIC8vIGJsdWUgKHJnYikgLyB5ZWxsb3cgKGNteWspXG5cdENvbG9yMyA9IDMsIC8vIC0gKHJnYikgLyBibGFjayAoY215aylcblx0VHJhbnNwYXJlbmN5ID0gLTEsXG5cdFVzZXJNYXNrID0gLTIsXG5cdFJlYWxVc2VyTWFzayA9IC0zLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBDb21wcmVzc2lvbiB7XG5cdFJhd0RhdGEgPSAwLFxuXHRSbGVDb21wcmVzc2VkID0gMSxcblx0WmlwV2l0aG91dFByZWRpY3Rpb24gPSAyLFxuXHRaaXBXaXRoUHJlZGljdGlvbiA9IDMsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhbm5lbERhdGEge1xuXHRjaGFubmVsSWQ6IENoYW5uZWxJRDtcblx0Y29tcHJlc3Npb246IENvbXByZXNzaW9uO1xuXHRidWZmZXI6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG5cdGxlbmd0aDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJvdW5kcyB7XG5cdHRvcDogbnVtYmVyO1xuXHRsZWZ0OiBudW1iZXI7XG5cdHJpZ2h0OiBudW1iZXI7XG5cdGJvdHRvbTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExheWVyQ2hhbm5lbERhdGEge1xuXHRsYXllcjogTGF5ZXI7XG5cdGNoYW5uZWxzOiBDaGFubmVsRGF0YVtdO1xuXHR0b3A6IG51bWJlcjtcblx0bGVmdDogbnVtYmVyO1xuXHRyaWdodDogbnVtYmVyO1xuXHRib3R0b206IG51bWJlcjtcblx0bWFzaz86IEJvdW5kcztcbn1cblxuZXhwb3J0IHR5cGUgUGl4ZWxBcnJheSA9IFVpbnQ4Q2xhbXBlZEFycmF5IHwgVWludDhBcnJheTtcblxuZXhwb3J0IGludGVyZmFjZSBQaXhlbERhdGEge1xuXHRkYXRhOiBQaXhlbEFycmF5O1xuXHR3aWR0aDogbnVtYmVyO1xuXHRoZWlnaHQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9mZnNldEZvckNoYW5uZWwoY2hhbm5lbElkOiBDaGFubmVsSUQsIGNteWs6IGJvb2xlYW4pIHtcblx0c3dpdGNoIChjaGFubmVsSWQpIHtcblx0XHRjYXNlIENoYW5uZWxJRC5Db2xvcjA6IHJldHVybiAwO1xuXHRcdGNhc2UgQ2hhbm5lbElELkNvbG9yMTogcmV0dXJuIDE7XG5cdFx0Y2FzZSBDaGFubmVsSUQuQ29sb3IyOiByZXR1cm4gMjtcblx0XHRjYXNlIENoYW5uZWxJRC5Db2xvcjM6IHJldHVybiBjbXlrID8gMyA6IGNoYW5uZWxJZCArIDE7XG5cdFx0Y2FzZSBDaGFubmVsSUQuVHJhbnNwYXJlbmN5OiByZXR1cm4gY215ayA/IDQgOiAzO1xuXHRcdGRlZmF1bHQ6IHJldHVybiBjaGFubmVsSWQgKyAxO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGFtcCh2YWx1ZTogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpIHtcblx0cmV0dXJuIHZhbHVlIDwgbWluID8gbWluIDogKHZhbHVlID4gbWF4ID8gbWF4IDogdmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzQWxwaGEoZGF0YTogUGl4ZWxEYXRhKSB7XG5cdGNvbnN0IHNpemUgPSBkYXRhLndpZHRoICogZGF0YS5oZWlnaHQgKiA0O1xuXG5cdGZvciAobGV0IGkgPSAzOyBpIDwgc2l6ZTsgaSArPSA0KSB7XG5cdFx0aWYgKGRhdGEuZGF0YVtpXSAhPT0gMjU1KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldEltYWdlRGF0YSh7IGRhdGEgfTogUGl4ZWxEYXRhKSB7XG5cdGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheShkYXRhLmJ1ZmZlcik7XG5cdGNvbnN0IHNpemUgPSBidWZmZXIubGVuZ3RoIHwgMDtcblxuXHRmb3IgKGxldCBwID0gMDsgcCA8IHNpemU7IHAgPSAocCArIDEpIHwgMCkge1xuXHRcdGJ1ZmZlcltwXSA9IDB4ZmYwMDAwMDA7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZUJpdG1hcChpbnB1dDogUGl4ZWxBcnJheSwgb3V0cHV0OiBQaXhlbEFycmF5LCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuXHRmb3IgKGxldCB5ID0gMCwgcCA9IDAsIG8gPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcblx0XHRmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOykge1xuXHRcdFx0bGV0IGIgPSBpbnB1dFtvKytdO1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDggJiYgeCA8IHdpZHRoOyBpKyssIHgrKykge1xuXHRcdFx0XHRjb25zdCB2ID0gYiAmIDB4ODAgPyAwIDogMjU1O1xuXHRcdFx0XHRiID0gYiA8PCAxO1xuXHRcdFx0XHRvdXRwdXRbcCsrXSA9IHY7XG5cdFx0XHRcdG91dHB1dFtwKytdID0gdjtcblx0XHRcdFx0b3V0cHV0W3ArK10gPSB2O1xuXHRcdFx0XHRvdXRwdXRbcCsrXSA9IDI1NTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRGF0YVJhdyhkYXRhOiBQaXhlbERhdGEsIG9mZnNldDogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuXHRpZiAoIXdpZHRoIHx8ICFoZWlnaHQpXG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblxuXHRjb25zdCBhcnJheSA9IG5ldyBVaW50OEFycmF5KHdpZHRoICogaGVpZ2h0KTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG5cdFx0YXJyYXlbaV0gPSBkYXRhLmRhdGFbaSAqIDQgKyBvZmZzZXRdO1xuXHR9XG5cblx0cmV0dXJuIGFycmF5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVEYXRhUkxFKGJ1ZmZlcjogVWludDhBcnJheSwgeyBkYXRhLCB3aWR0aCwgaGVpZ2h0IH06IFBpeGVsRGF0YSwgb2Zmc2V0czogbnVtYmVyW10sIGxhcmdlOiBib29sZWFuKSB7XG5cdGlmICghd2lkdGggfHwgIWhlaWdodCkgcmV0dXJuIHVuZGVmaW5lZDtcblxuXHRjb25zdCBzdHJpZGUgPSAoNCAqIHdpZHRoKSB8IDA7XG5cblx0bGV0IG9sID0gMDtcblx0bGV0IG8gPSAob2Zmc2V0cy5sZW5ndGggKiAobGFyZ2UgPyA0IDogMikgKiBoZWlnaHQpIHwgMDtcblxuXHRmb3IgKGNvbnN0IG9mZnNldCBvZiBvZmZzZXRzKSB7XG5cdFx0Zm9yIChsZXQgeSA9IDAsIHAgPSBvZmZzZXQgfCAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcblx0XHRcdGNvbnN0IHN0cmlkZVN0YXJ0ID0gKHkgKiBzdHJpZGUpIHwgMDtcblx0XHRcdGNvbnN0IHN0cmlkZUVuZCA9IChzdHJpZGVTdGFydCArIHN0cmlkZSkgfCAwO1xuXHRcdFx0Y29uc3QgbGFzdEluZGV4ID0gKHN0cmlkZUVuZCArIG9mZnNldCAtIDQpIHwgMDtcblx0XHRcdGNvbnN0IGxhc3RJbmRleDIgPSAobGFzdEluZGV4IC0gNCkgfCAwO1xuXHRcdFx0Y29uc3Qgc3RhcnRPZmZzZXQgPSBvO1xuXG5cdFx0XHRmb3IgKHAgPSAoc3RyaWRlU3RhcnQgKyBvZmZzZXQpIHwgMDsgcCA8IHN0cmlkZUVuZDsgcCA9IChwICsgNCkgfCAwKSB7XG5cdFx0XHRcdGlmIChwIDwgbGFzdEluZGV4Mikge1xuXHRcdFx0XHRcdGxldCB2YWx1ZTEgPSBkYXRhW3BdO1xuXHRcdFx0XHRcdHAgPSAocCArIDQpIHwgMDtcblx0XHRcdFx0XHRsZXQgdmFsdWUyID0gZGF0YVtwXTtcblx0XHRcdFx0XHRwID0gKHAgKyA0KSB8IDA7XG5cdFx0XHRcdFx0bGV0IHZhbHVlMyA9IGRhdGFbcF07XG5cblx0XHRcdFx0XHRpZiAodmFsdWUxID09PSB2YWx1ZTIgJiYgdmFsdWUxID09PSB2YWx1ZTMpIHtcblx0XHRcdFx0XHRcdGxldCBjb3VudCA9IDM7XG5cblx0XHRcdFx0XHRcdHdoaWxlIChjb3VudCA8IDEyOCAmJiBwIDwgbGFzdEluZGV4ICYmIGRhdGFbKHAgKyA0KSB8IDBdID09PSB2YWx1ZTEpIHtcblx0XHRcdFx0XHRcdFx0Y291bnQgPSAoY291bnQgKyAxKSB8IDA7XG5cdFx0XHRcdFx0XHRcdHAgPSAocCArIDQpIHwgMDtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0YnVmZmVyW28rK10gPSAxIC0gY291bnQ7XG5cdFx0XHRcdFx0XHRidWZmZXJbbysrXSA9IHZhbHVlMTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc3QgY291bnRJbmRleCA9IG87XG5cdFx0XHRcdFx0XHRsZXQgd3JpdGVMYXN0ID0gdHJ1ZTtcblx0XHRcdFx0XHRcdGxldCBjb3VudCA9IDE7XG5cdFx0XHRcdFx0XHRidWZmZXJbbysrXSA9IDA7XG5cdFx0XHRcdFx0XHRidWZmZXJbbysrXSA9IHZhbHVlMTtcblxuXHRcdFx0XHRcdFx0d2hpbGUgKHAgPCBsYXN0SW5kZXggJiYgY291bnQgPCAxMjgpIHtcblx0XHRcdFx0XHRcdFx0cCA9IChwICsgNCkgfCAwO1xuXHRcdFx0XHRcdFx0XHR2YWx1ZTEgPSB2YWx1ZTI7XG5cdFx0XHRcdFx0XHRcdHZhbHVlMiA9IHZhbHVlMztcblx0XHRcdFx0XHRcdFx0dmFsdWUzID0gZGF0YVtwXTtcblxuXHRcdFx0XHRcdFx0XHRpZiAodmFsdWUxID09PSB2YWx1ZTIgJiYgdmFsdWUxID09PSB2YWx1ZTMpIHtcblx0XHRcdFx0XHRcdFx0XHRwID0gKHAgLSAxMikgfCAwO1xuXHRcdFx0XHRcdFx0XHRcdHdyaXRlTGFzdCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdGNvdW50Kys7XG5cdFx0XHRcdFx0XHRcdFx0YnVmZmVyW28rK10gPSB2YWx1ZTE7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKHdyaXRlTGFzdCkge1xuXHRcdFx0XHRcdFx0XHRpZiAoY291bnQgPCAxMjcpIHtcblx0XHRcdFx0XHRcdFx0XHRidWZmZXJbbysrXSA9IHZhbHVlMjtcblx0XHRcdFx0XHRcdFx0XHRidWZmZXJbbysrXSA9IHZhbHVlMztcblx0XHRcdFx0XHRcdFx0XHRjb3VudCArPSAyO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKGNvdW50IDwgMTI4KSB7XG5cdFx0XHRcdFx0XHRcdFx0YnVmZmVyW28rK10gPSB2YWx1ZTI7XG5cdFx0XHRcdFx0XHRcdFx0Y291bnQrKztcblx0XHRcdFx0XHRcdFx0XHRwID0gKHAgLSA0KSB8IDA7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0cCA9IChwIC0gOCkgfCAwO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGJ1ZmZlcltjb3VudEluZGV4XSA9IGNvdW50IC0gMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSBpZiAocCA9PT0gbGFzdEluZGV4KSB7XG5cdFx0XHRcdFx0YnVmZmVyW28rK10gPSAwO1xuXHRcdFx0XHRcdGJ1ZmZlcltvKytdID0gZGF0YVtwXTtcblx0XHRcdFx0fSBlbHNlIHsgLy8gcCA9PT0gbGFzdEluZGV4MlxuXHRcdFx0XHRcdGJ1ZmZlcltvKytdID0gMTtcblx0XHRcdFx0XHRidWZmZXJbbysrXSA9IGRhdGFbcF07XG5cdFx0XHRcdFx0cCA9IChwICsgNCkgfCAwO1xuXHRcdFx0XHRcdGJ1ZmZlcltvKytdID0gZGF0YVtwXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBsZW5ndGggPSBvIC0gc3RhcnRPZmZzZXQ7XG5cblx0XHRcdGlmIChsYXJnZSkge1xuXHRcdFx0XHRidWZmZXJbb2wrK10gPSAobGVuZ3RoID4+IDI0KSAmIDB4ZmY7XG5cdFx0XHRcdGJ1ZmZlcltvbCsrXSA9IChsZW5ndGggPj4gMTYpICYgMHhmZjtcblx0XHRcdH1cblxuXHRcdFx0YnVmZmVyW29sKytdID0gKGxlbmd0aCA+PiA4KSAmIDB4ZmY7XG5cdFx0XHRidWZmZXJbb2wrK10gPSBsZW5ndGggJiAweGZmO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBidWZmZXIuc2xpY2UoMCwgbyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZURhdGFaaXBXaXRob3V0UHJlZGljdGlvbih7IGRhdGEsIHdpZHRoLCBoZWlnaHQgfTogUGl4ZWxEYXRhLCBvZmZzZXRzOiBudW1iZXJbXSkge1xuXHRjb25zdCBzaXplID0gd2lkdGggKiBoZWlnaHQ7XG5cdGNvbnN0IGNoYW5uZWwgPSBuZXcgVWludDhBcnJheShzaXplKTtcblx0Y29uc3QgYnVmZmVyczogVWludDhBcnJheVtdID0gW107XG5cdGxldCB0b3RhbExlbmd0aCA9IDA7XG5cblx0Zm9yIChjb25zdCBvZmZzZXQgb2Ygb2Zmc2V0cykge1xuXHRcdGZvciAobGV0IGkgPSAwLCBvID0gb2Zmc2V0OyBpIDwgc2l6ZTsgaSsrLCBvICs9IDQpIHtcblx0XHRcdGNoYW5uZWxbaV0gPSBkYXRhW29dO1xuXHRcdH1cblxuXHRcdGNvbnN0IGJ1ZmZlciA9IGRlZmxhdGUoY2hhbm5lbCk7XG5cdFx0YnVmZmVycy5wdXNoKGJ1ZmZlcik7XG5cdFx0dG90YWxMZW5ndGggKz0gYnVmZmVyLmJ5dGVMZW5ndGg7XG5cdH1cblxuXHRpZiAoYnVmZmVycy5sZW5ndGggPiAwKSB7XG5cdFx0Y29uc3QgYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkodG90YWxMZW5ndGgpO1xuXHRcdGxldCBvZmZzZXQgPSAwO1xuXG5cdFx0Zm9yIChjb25zdCBiIG9mIGJ1ZmZlcnMpIHtcblx0XHRcdGJ1ZmZlci5zZXQoYiwgb2Zmc2V0KTtcblx0XHRcdG9mZnNldCArPSBiLmJ5dGVMZW5ndGg7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGJ1ZmZlcjtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gYnVmZmVyc1swXTtcblx0fVxufVxuXG5leHBvcnQgbGV0IGNyZWF0ZUNhbnZhczogKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSA9PiBIVE1MQ2FudmFzRWxlbWVudCA9ICgpID0+IHtcblx0dGhyb3cgbmV3IEVycm9yKCdDYW52YXMgbm90IGluaXRpYWxpemVkLCB1c2UgaW5pdGlhbGl6ZUNhbnZhcyBtZXRob2QgdG8gc2V0IHVwIGNyZWF0ZUNhbnZhcyBtZXRob2QnKTtcbn07XG5cbmV4cG9ydCBsZXQgY3JlYXRlQ2FudmFzRnJvbURhdGE6IChkYXRhOiBVaW50OEFycmF5KSA9PiBIVE1MQ2FudmFzRWxlbWVudCA9ICgpID0+IHtcblx0dGhyb3cgbmV3IEVycm9yKCdDYW52YXMgbm90IGluaXRpYWxpemVkLCB1c2UgaW5pdGlhbGl6ZUNhbnZhcyBtZXRob2QgdG8gc2V0IHVwIGNyZWF0ZUNhbnZhc0Zyb21EYXRhIG1ldGhvZCcpO1xufTtcblxubGV0IHRlbXBDYW52YXM6IEhUTUxDYW52YXNFbGVtZW50IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG5leHBvcnQgbGV0IGNyZWF0ZUltYWdlRGF0YTogKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSA9PiBJbWFnZURhdGEgPSAod2lkdGgsIGhlaWdodCkgPT4ge1xuXHRpZiAoIXRlbXBDYW52YXMpIHRlbXBDYW52YXMgPSBjcmVhdGVDYW52YXMoMSwgMSk7XG5cdHJldHVybiB0ZW1wQ2FudmFzLmdldENvbnRleHQoJzJkJykhLmNyZWF0ZUltYWdlRGF0YSh3aWR0aCwgaGVpZ2h0KTtcbn07XG5cbmlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG5cdGNyZWF0ZUNhbnZhcyA9ICh3aWR0aCwgaGVpZ2h0KSA9PiB7XG5cdFx0Y29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0Y2FudmFzLndpZHRoID0gd2lkdGg7XG5cdFx0Y2FudmFzLmhlaWdodCA9IGhlaWdodDtcblx0XHRyZXR1cm4gY2FudmFzO1xuXHR9O1xuXG5cdGNyZWF0ZUNhbnZhc0Zyb21EYXRhID0gKGRhdGEpID0+IHtcblx0XHRjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuXHRcdGltYWdlLnNyYyA9ICdkYXRhOmltYWdlL2pwZWc7YmFzZTY0LCcgKyBmcm9tQnl0ZUFycmF5KGRhdGEpO1xuXHRcdGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdGNhbnZhcy53aWR0aCA9IGltYWdlLndpZHRoO1xuXHRcdGNhbnZhcy5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XG5cdFx0Y2FudmFzLmdldENvbnRleHQoJzJkJykhLmRyYXdJbWFnZShpbWFnZSwgMCwgMCk7XG5cdFx0cmV0dXJuIGNhbnZhcztcblx0fTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVDYW52YXMoXG5cdGNyZWF0ZUNhbnZhc01ldGhvZDogKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSA9PiBIVE1MQ2FudmFzRWxlbWVudCxcblx0Y3JlYXRlQ2FudmFzRnJvbURhdGFNZXRob2Q/OiAoZGF0YTogVWludDhBcnJheSkgPT4gSFRNTENhbnZhc0VsZW1lbnQsXG5cdGNyZWF0ZUltYWdlRGF0YU1ldGhvZD86ICh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikgPT4gSW1hZ2VEYXRhXG4pIHtcblx0Y3JlYXRlQ2FudmFzID0gY3JlYXRlQ2FudmFzTWV0aG9kO1xuXHRjcmVhdGVDYW52YXNGcm9tRGF0YSA9IGNyZWF0ZUNhbnZhc0Zyb21EYXRhTWV0aG9kIHx8IGNyZWF0ZUNhbnZhc0Zyb21EYXRhO1xuXHRjcmVhdGVJbWFnZURhdGEgPSBjcmVhdGVJbWFnZURhdGFNZXRob2QgfHwgY3JlYXRlSW1hZ2VEYXRhO1xufVxuIl0sInNvdXJjZVJvb3QiOiJDOlxcUHJvamVjdHNcXGdpdGh1YlxcYWctcHNkXFxzcmMifQ==
