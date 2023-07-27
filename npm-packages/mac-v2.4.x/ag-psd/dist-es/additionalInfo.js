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
import { fromByteArray, toByteArray } from 'base64-js';
import { readEffects, writeEffects } from './effectsHelpers';
import { clamp, createEnum, layerColors, MOCK_HANDLERS } from './helpers';
import { readSignature, readUnicodeString, skipBytes, readUint32, readUint8, readFloat64, readUint16, readBytes, readInt16, checkSignature, readFloat32, readFixedPointPath32, readSection, readColor, readInt32, readPascalString, readUnicodeStringWithLength, readAsciiString, readPattern, } from './psdReader';
import { writeZeros, writeSignature, writeBytes, writeUint32, writeUint16, writeFloat64, writeUint8, writeInt16, writeFloat32, writeFixedPointPath32, writeUnicodeString, writeSection, writeUnicodeStringWithPadding, writeColor, writePascalString, writeInt32, } from './psdWriter';
import { Annt, BlnM, parsePercent, parseUnits, parseUnitsOrNumber, strokeStyleLineAlignment, strokeStyleLineCapType, strokeStyleLineJoinType, textGridding, unitsPercent, unitsValue, warpStyle, writeVersionAndDescriptor, readVersionAndDescriptor, Ornt, horzVrtcToXY, xyToHorzVrtc, serializeEffects, parseEffects, parseColor, serializeColor, serializeVectorContent, parseVectorContent, parseTrackList, serializeTrackList, } from './descriptor';
import { serializeEngineData, parseEngineData } from './engineData';
import { encodeEngineData, decodeEngineData } from './text';
export var infoHandlers = [];
export var infoHandlersMap = {};
function addHandler(key, has, read, write) {
    var handler = { key: key, has: has, read: read, write: write };
    infoHandlers.push(handler);
    infoHandlersMap[handler.key] = handler;
}
function addHandlerAlias(key, target) {
    infoHandlersMap[key] = infoHandlersMap[target];
}
function hasKey(key) {
    return function (target) { return target[key] !== undefined; };
}
function readLength64(reader) {
    if (readUint32(reader))
        throw new Error("Resource size above 4 GB limit at ".concat(reader.offset.toString(16)));
    return readUint32(reader);
}
function writeLength64(writer, length) {
    writeUint32(writer, 0);
    writeUint32(writer, length);
}
addHandler('TySh', hasKey('text'), function (reader, target, leftBytes) {
    if (readInt16(reader) !== 1)
        throw new Error("Invalid TySh version");
    var transform = [];
    for (var i = 0; i < 6; i++)
        transform.push(readFloat64(reader));
    if (readInt16(reader) !== 50)
        throw new Error("Invalid TySh text version");
    var text = readVersionAndDescriptor(reader);
    if (readInt16(reader) !== 1)
        throw new Error("Invalid TySh warp version");
    var warp = readVersionAndDescriptor(reader);
    target.text = {
        transform: transform,
        left: readFloat32(reader),
        top: readFloat32(reader),
        right: readFloat32(reader),
        bottom: readFloat32(reader),
        text: text['Txt '].replace(/\r/g, '\n'),
        index: text.TextIndex || 0,
        gridding: textGridding.decode(text.textGridding),
        antiAlias: Annt.decode(text.AntA),
        orientation: Ornt.decode(text.Ornt),
        warp: {
            style: warpStyle.decode(warp.warpStyle),
            value: warp.warpValue || 0,
            perspective: warp.warpPerspective || 0,
            perspectiveOther: warp.warpPerspectiveOther || 0,
            rotate: Ornt.decode(warp.warpRotate),
        },
    };
    if (text.EngineData) {
        var engineData = decodeEngineData(parseEngineData(text.EngineData));
        // const before = parseEngineData(text.EngineData);
        // const after = encodeEngineData(engineData);
        // require('fs').writeFileSync('before.txt', require('util').inspect(before, false, 99, false), 'utf8');
        // require('fs').writeFileSync('after.txt', require('util').inspect(after, false, 99, false), 'utf8');
        // console.log(require('util').inspect(parseEngineData(text.EngineData), false, 99, true));
        target.text = __assign(__assign({}, target.text), engineData);
        // console.log(require('util').inspect(target.text, false, 99, true));
    }
    skipBytes(reader, leftBytes());
}, function (writer, target) {
    var text = target.text;
    var warp = text.warp || {};
    var transform = text.transform || [1, 0, 0, 1, 0, 0];
    var textDescriptor = {
        'Txt ': (text.text || '').replace(/\r?\n/g, '\r'),
        textGridding: textGridding.encode(text.gridding),
        Ornt: Ornt.encode(text.orientation),
        AntA: Annt.encode(text.antiAlias),
        TextIndex: text.index || 0,
        EngineData: serializeEngineData(encodeEngineData(text)),
    };
    writeInt16(writer, 1); // version
    for (var i = 0; i < 6; i++) {
        writeFloat64(writer, transform[i]);
    }
    writeInt16(writer, 50); // text version
    writeVersionAndDescriptor(writer, '', 'TxLr', textDescriptor);
    writeInt16(writer, 1); // warp version
    writeVersionAndDescriptor(writer, '', 'warp', encodeWarp(warp));
    writeFloat32(writer, text.left);
    writeFloat32(writer, text.top);
    writeFloat32(writer, text.right);
    writeFloat32(writer, text.bottom);
    // writeZeros(writer, 2);
});
// vector fills
addHandler('SoCo', function (target) { return target.vectorFill !== undefined && target.vectorStroke === undefined &&
    target.vectorFill.type === 'color'; }, function (reader, target) {
    var descriptor = readVersionAndDescriptor(reader);
    target.vectorFill = parseVectorContent(descriptor);
}, function (writer, target) {
    var descriptor = serializeVectorContent(target.vectorFill).descriptor;
    writeVersionAndDescriptor(writer, '', 'null', descriptor);
});
addHandler('GdFl', function (target) { return target.vectorFill !== undefined && target.vectorStroke === undefined &&
    (target.vectorFill.type === 'solid' || target.vectorFill.type === 'noise'); }, function (reader, target, left) {
    var descriptor = readVersionAndDescriptor(reader);
    target.vectorFill = parseVectorContent(descriptor);
    skipBytes(reader, left());
}, function (writer, target) {
    var descriptor = serializeVectorContent(target.vectorFill).descriptor;
    writeVersionAndDescriptor(writer, '', 'null', descriptor);
});
addHandler('PtFl', function (target) { return target.vectorFill !== undefined && target.vectorStroke === undefined &&
    target.vectorFill.type === 'pattern'; }, function (reader, target) {
    var descriptor = readVersionAndDescriptor(reader);
    target.vectorFill = parseVectorContent(descriptor);
}, function (writer, target) {
    var descriptor = serializeVectorContent(target.vectorFill).descriptor;
    writeVersionAndDescriptor(writer, '', 'null', descriptor);
});
addHandler('vscg', function (target) { return target.vectorFill !== undefined && target.vectorStroke !== undefined; }, function (reader, target, left) {
    readSignature(reader); // key
    var desc = readVersionAndDescriptor(reader);
    target.vectorFill = parseVectorContent(desc);
    skipBytes(reader, left());
}, function (writer, target) {
    var _a = serializeVectorContent(target.vectorFill), descriptor = _a.descriptor, key = _a.key;
    writeSignature(writer, key);
    writeVersionAndDescriptor(writer, '', 'null', descriptor);
});
export function readBezierKnot(reader, width, height) {
    var y0 = readFixedPointPath32(reader) * height;
    var x0 = readFixedPointPath32(reader) * width;
    var y1 = readFixedPointPath32(reader) * height;
    var x1 = readFixedPointPath32(reader) * width;
    var y2 = readFixedPointPath32(reader) * height;
    var x2 = readFixedPointPath32(reader) * width;
    return [x0, y0, x1, y1, x2, y2];
}
function writeBezierKnot(writer, points, width, height) {
    writeFixedPointPath32(writer, points[1] / height); // y0
    writeFixedPointPath32(writer, points[0] / width); // x0
    writeFixedPointPath32(writer, points[3] / height); // y1
    writeFixedPointPath32(writer, points[2] / width); // x1
    writeFixedPointPath32(writer, points[5] / height); // y2
    writeFixedPointPath32(writer, points[4] / width); // x2
}
export var booleanOperations = ['exclude', 'combine', 'subtract', 'intersect'];
export function readVectorMask(reader, vectorMask, width, height, size) {
    var end = reader.offset + size;
    var paths = vectorMask.paths;
    var path = undefined;
    while ((end - reader.offset) >= 26) {
        var selector = readUint16(reader);
        switch (selector) {
            case 0: // Closed subpath length record
            case 3: { // Open subpath length record
                readUint16(reader); // count
                var boolOp = readInt16(reader);
                readUint16(reader); // always 1 ?
                skipBytes(reader, 18);
                // TODO: 'combine' here might be wrong
                path = { open: selector === 3, operation: boolOp === -1 ? 'combine' : booleanOperations[boolOp], knots: [] };
                paths.push(path);
                break;
            }
            case 1: // Closed subpath Bezier knot, linked
            case 2: // Closed subpath Bezier knot, unlinked
            case 4: // Open subpath Bezier knot, linked
            case 5: // Open subpath Bezier knot, unlinked
                path.knots.push({ linked: (selector === 1 || selector === 4), points: readBezierKnot(reader, width, height) });
                break;
            case 6: // Path fill rule record
                skipBytes(reader, 24);
                break;
            case 7: { // Clipboard record
                // TODO: check if these need to be multiplied by document size
                var top_1 = readFixedPointPath32(reader);
                var left = readFixedPointPath32(reader);
                var bottom = readFixedPointPath32(reader);
                var right = readFixedPointPath32(reader);
                var resolution = readFixedPointPath32(reader);
                skipBytes(reader, 4);
                vectorMask.clipboard = { top: top_1, left: left, bottom: bottom, right: right, resolution: resolution };
                break;
            }
            case 8: // Initial fill rule record
                vectorMask.fillStartsWithAllPixels = !!readUint16(reader);
                skipBytes(reader, 22);
                break;
            default: throw new Error('Invalid vmsk section');
        }
    }
    return paths;
}
addHandler('vmsk', hasKey('vectorMask'), function (reader, target, left, _a) {
    var width = _a.width, height = _a.height;
    if (readUint32(reader) !== 3)
        throw new Error('Invalid vmsk version');
    target.vectorMask = { paths: [] };
    var vectorMask = target.vectorMask;
    var flags = readUint32(reader);
    vectorMask.invert = (flags & 1) !== 0;
    vectorMask.notLink = (flags & 2) !== 0;
    vectorMask.disable = (flags & 4) !== 0;
    readVectorMask(reader, vectorMask, width, height, left());
    // drawBezierPaths(vectorMask.paths, width, height, 'out.png');
    skipBytes(reader, left());
}, function (writer, target, _a) {
    var width = _a.width, height = _a.height;
    var vectorMask = target.vectorMask;
    var flags = (vectorMask.invert ? 1 : 0) |
        (vectorMask.notLink ? 2 : 0) |
        (vectorMask.disable ? 4 : 0);
    writeUint32(writer, 3); // version
    writeUint32(writer, flags);
    // initial entry
    writeUint16(writer, 6);
    writeZeros(writer, 24);
    var clipboard = vectorMask.clipboard;
    if (clipboard) {
        writeUint16(writer, 7);
        writeFixedPointPath32(writer, clipboard.top);
        writeFixedPointPath32(writer, clipboard.left);
        writeFixedPointPath32(writer, clipboard.bottom);
        writeFixedPointPath32(writer, clipboard.right);
        writeFixedPointPath32(writer, clipboard.resolution);
        writeZeros(writer, 4);
    }
    if (vectorMask.fillStartsWithAllPixels !== undefined) {
        writeUint16(writer, 8);
        writeUint16(writer, vectorMask.fillStartsWithAllPixels ? 1 : 0);
        writeZeros(writer, 22);
    }
    for (var _i = 0, _b = vectorMask.paths; _i < _b.length; _i++) {
        var path = _b[_i];
        writeUint16(writer, path.open ? 3 : 0);
        writeUint16(writer, path.knots.length);
        writeUint16(writer, Math.abs(booleanOperations.indexOf(path.operation))); // default to 1 if not found
        writeUint16(writer, 1);
        writeZeros(writer, 18); // TODO: these are sometimes non-zero
        var linkedKnot = path.open ? 4 : 1;
        var unlinkedKnot = path.open ? 5 : 2;
        for (var _c = 0, _d = path.knots; _c < _d.length; _c++) {
            var _e = _d[_c], linked = _e.linked, points = _e.points;
            writeUint16(writer, linked ? linkedKnot : unlinkedKnot);
            writeBezierKnot(writer, points, width, height);
        }
    }
});
// TODO: need to write vmsk if has outline ?
addHandlerAlias('vsms', 'vmsk');
addHandler('vogk', hasKey('vectorOrigination'), function (reader, target, left) {
    if (readInt32(reader) !== 1)
        throw new Error("Invalid vogk version");
    var desc = readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    target.vectorOrigination = { keyDescriptorList: [] };
    for (var _i = 0, _a = desc.keyDescriptorList; _i < _a.length; _i++) {
        var i = _a[_i];
        var item = {};
        if (i.keyShapeInvalidated != null)
            item.keyShapeInvalidated = i.keyShapeInvalidated;
        if (i.keyOriginType != null)
            item.keyOriginType = i.keyOriginType;
        if (i.keyOriginResolution != null)
            item.keyOriginResolution = i.keyOriginResolution;
        if (i.keyOriginShapeBBox) {
            item.keyOriginShapeBoundingBox = {
                top: parseUnits(i.keyOriginShapeBBox['Top ']),
                left: parseUnits(i.keyOriginShapeBBox.Left),
                bottom: parseUnits(i.keyOriginShapeBBox.Btom),
                right: parseUnits(i.keyOriginShapeBBox.Rght),
            };
        }
        var rectRadii = i.keyOriginRRectRadii;
        if (rectRadii) {
            item.keyOriginRRectRadii = {
                topRight: parseUnits(rectRadii.topRight),
                topLeft: parseUnits(rectRadii.topLeft),
                bottomLeft: parseUnits(rectRadii.bottomLeft),
                bottomRight: parseUnits(rectRadii.bottomRight),
            };
        }
        var corners = i.keyOriginBoxCorners;
        if (corners) {
            item.keyOriginBoxCorners = [
                { x: corners.rectangleCornerA.Hrzn, y: corners.rectangleCornerA.Vrtc },
                { x: corners.rectangleCornerB.Hrzn, y: corners.rectangleCornerB.Vrtc },
                { x: corners.rectangleCornerC.Hrzn, y: corners.rectangleCornerC.Vrtc },
                { x: corners.rectangleCornerD.Hrzn, y: corners.rectangleCornerD.Vrtc },
            ];
        }
        var trnf = i.Trnf;
        if (trnf) {
            item.transform = [trnf.xx, trnf.xy, trnf.xy, trnf.yy, trnf.tx, trnf.ty];
        }
        target.vectorOrigination.keyDescriptorList.push(item);
    }
    skipBytes(reader, left());
}, function (writer, target) {
    target;
    var orig = target.vectorOrigination;
    var desc = { keyDescriptorList: [] };
    for (var i = 0; i < orig.keyDescriptorList.length; i++) {
        var item = orig.keyDescriptorList[i];
        if (item.keyShapeInvalidated) {
            desc.keyDescriptorList.push({ keyShapeInvalidated: true, keyOriginIndex: i });
        }
        else {
            desc.keyDescriptorList.push({}); // we're adding keyOriginIndex at the end
            var out = desc.keyDescriptorList[desc.keyDescriptorList.length - 1];
            if (item.keyOriginType != null)
                out.keyOriginType = item.keyOriginType;
            if (item.keyOriginResolution != null)
                out.keyOriginResolution = item.keyOriginResolution;
            var radii = item.keyOriginRRectRadii;
            if (radii) {
                out.keyOriginRRectRadii = {
                    unitValueQuadVersion: 1,
                    topRight: unitsValue(radii.topRight, 'topRight'),
                    topLeft: unitsValue(radii.topLeft, 'topLeft'),
                    bottomLeft: unitsValue(radii.bottomLeft, 'bottomLeft'),
                    bottomRight: unitsValue(radii.bottomRight, 'bottomRight'),
                };
            }
            var box = item.keyOriginShapeBoundingBox;
            if (box) {
                out.keyOriginShapeBBox = {
                    unitValueQuadVersion: 1,
                    'Top ': unitsValue(box.top, 'top'),
                    Left: unitsValue(box.left, 'left'),
                    Btom: unitsValue(box.bottom, 'bottom'),
                    Rght: unitsValue(box.right, 'right'),
                };
            }
            var corners = item.keyOriginBoxCorners;
            if (corners && corners.length === 4) {
                out.keyOriginBoxCorners = {
                    rectangleCornerA: { Hrzn: corners[0].x, Vrtc: corners[0].y },
                    rectangleCornerB: { Hrzn: corners[1].x, Vrtc: corners[1].y },
                    rectangleCornerC: { Hrzn: corners[2].x, Vrtc: corners[2].y },
                    rectangleCornerD: { Hrzn: corners[3].x, Vrtc: corners[3].y },
                };
            }
            var transform = item.transform;
            if (transform && transform.length === 6) {
                out.Trnf = {
                    xx: transform[0],
                    xy: transform[1],
                    yx: transform[2],
                    yy: transform[3],
                    tx: transform[4],
                    ty: transform[5],
                };
            }
            out.keyOriginIndex = i;
        }
    }
    writeInt32(writer, 1); // version
    writeVersionAndDescriptor(writer, '', 'null', desc);
});
addHandler('lmfx', function (target) { return target.effects !== undefined && hasMultiEffects(target.effects); }, function (reader, target, left, _, options) {
    var version = readUint32(reader);
    if (version !== 0)
        throw new Error('Invalid lmfx version');
    var desc = readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(info, false, 99, true));
    // discard if read in 'lrFX' or 'lfx2' section
    target.effects = parseEffects(desc, !!options.logMissingFeatures);
    skipBytes(reader, left());
}, function (writer, target, _, options) {
    var desc = serializeEffects(target.effects, !!options.logMissingFeatures, true);
    writeUint32(writer, 0); // version
    writeVersionAndDescriptor(writer, '', 'null', desc);
});
addHandler('lrFX', hasKey('effects'), function (reader, target, left) {
    if (!target.effects)
        target.effects = readEffects(reader);
    skipBytes(reader, left());
}, function (writer, target) {
    writeEffects(writer, target.effects);
});
addHandler('luni', hasKey('name'), function (reader, target, left) {
    target.name = readUnicodeString(reader);
    skipBytes(reader, left());
}, function (writer, target) {
    writeUnicodeString(writer, target.name);
    // writeUint16(writer, 0); // padding (but not extending string length)
});
addHandler('lnsr', hasKey('nameSource'), function (reader, target) { return target.nameSource = readSignature(reader); }, function (writer, target) { return writeSignature(writer, target.nameSource); });
addHandler('lyid', hasKey('id'), function (reader, target) { return target.id = readUint32(reader); }, function (writer, target, _psd, options) {
    var id = target.id;
    while (options.layerIds.has(id))
        id += 100; // make sure we don't have duplicate layer ids
    writeUint32(writer, id);
    options.layerIds.add(id);
    options.layerToId.set(target, id);
});
addHandler('lsct', hasKey('sectionDivider'), function (reader, target, left) {
    target.sectionDivider = { type: readUint32(reader) };
    if (left()) {
        checkSignature(reader, '8BIM');
        target.sectionDivider.key = readSignature(reader);
    }
    if (left()) {
        target.sectionDivider.subType = readUint32(reader);
    }
}, function (writer, target) {
    writeUint32(writer, target.sectionDivider.type);
    if (target.sectionDivider.key) {
        writeSignature(writer, '8BIM');
        writeSignature(writer, target.sectionDivider.key);
        if (target.sectionDivider.subType !== undefined) {
            writeUint32(writer, target.sectionDivider.subType);
        }
    }
});
// it seems lsdk is used when there's a layer is nested more than 6 levels, but I don't know why?
// maybe some limitation of old version of PS?
addHandlerAlias('lsdk', 'lsct');
addHandler('clbl', hasKey('blendClippendElements'), function (reader, target) {
    target.blendClippendElements = !!readUint8(reader);
    skipBytes(reader, 3);
}, function (writer, target) {
    writeUint8(writer, target.blendClippendElements ? 1 : 0);
    writeZeros(writer, 3);
});
addHandler('infx', hasKey('blendInteriorElements'), function (reader, target) {
    target.blendInteriorElements = !!readUint8(reader);
    skipBytes(reader, 3);
}, function (writer, target) {
    writeUint8(writer, target.blendInteriorElements ? 1 : 0);
    writeZeros(writer, 3);
});
addHandler('knko', hasKey('knockout'), function (reader, target) {
    target.knockout = !!readUint8(reader);
    skipBytes(reader, 3);
}, function (writer, target) {
    writeUint8(writer, target.knockout ? 1 : 0);
    writeZeros(writer, 3);
});
addHandler('lmgm', hasKey('layerMaskAsGlobalMask'), function (reader, target) {
    target.layerMaskAsGlobalMask = !!readUint8(reader);
    skipBytes(reader, 3);
}, function (writer, target) {
    writeUint8(writer, target.layerMaskAsGlobalMask ? 1 : 0);
    writeZeros(writer, 3);
});
addHandler('lspf', hasKey('protected'), function (reader, target) {
    var flags = readUint32(reader);
    target.protected = {
        transparency: (flags & 0x01) !== 0,
        composite: (flags & 0x02) !== 0,
        position: (flags & 0x04) !== 0,
    };
    if (flags & 0x08)
        target.protected.artboards = true;
}, function (writer, target) {
    var flags = (target.protected.transparency ? 0x01 : 0) |
        (target.protected.composite ? 0x02 : 0) |
        (target.protected.position ? 0x04 : 0) |
        (target.protected.artboards ? 0x08 : 0);
    writeUint32(writer, flags);
});
addHandler('lclr', hasKey('layerColor'), function (reader, target) {
    var color = readUint16(reader);
    skipBytes(reader, 6);
    target.layerColor = layerColors[color];
}, function (writer, target) {
    var index = layerColors.indexOf(target.layerColor);
    writeUint16(writer, index === -1 ? 0 : index);
    writeZeros(writer, 6);
});
addHandler('shmd', function (target) { return target.timestamp !== undefined || target.animationFrames !== undefined ||
    target.animationFrameFlags !== undefined || target.timeline !== undefined; }, function (reader, target, left, _, options) {
    var count = readUint32(reader);
    var _loop_1 = function (i) {
        checkSignature(reader, '8BIM');
        var key = readSignature(reader);
        readUint8(reader); // copy
        skipBytes(reader, 3);
        readSection(reader, 1, function (left) {
            if (key === 'cust') {
                var desc = readVersionAndDescriptor(reader);
                // console.log('cust', target.name, require('util').inspect(desc, false, 99, true));
                if (desc.layerTime !== undefined)
                    target.timestamp = desc.layerTime;
            }
            else if (key === 'mlst') {
                var desc = readVersionAndDescriptor(reader);
                // console.log('mlst', target.name, require('util').inspect(desc, false, 99, true));
                target.animationFrames = [];
                for (var i_1 = 0; i_1 < desc.LaSt.length; i_1++) {
                    var f = desc.LaSt[i_1];
                    var frame = { frames: f.FrLs };
                    if (f.enab !== undefined)
                        frame.enable = f.enab;
                    if (f.Ofst)
                        frame.offset = horzVrtcToXY(f.Ofst);
                    if (f.FXRf)
                        frame.referencePoint = horzVrtcToXY(f.FXRf);
                    if (f.Lefx)
                        frame.effects = parseEffects(f.Lefx, !!options.logMissingFeatures);
                    if (f.blendOptions && f.blendOptions.Opct)
                        frame.opacity = parsePercent(f.blendOptions.Opct);
                    target.animationFrames.push(frame);
                }
            }
            else if (key === 'mdyn') {
                // frame flags
                readUint16(reader); // unknown
                var propagate = readUint8(reader);
                var flags = readUint8(reader);
                target.animationFrameFlags = {
                    propagateFrameOne: !propagate,
                    unifyLayerPosition: (flags & 1) !== 0,
                    unifyLayerStyle: (flags & 2) !== 0,
                    unifyLayerVisibility: (flags & 4) !== 0,
                };
            }
            else if (key === 'tmln') {
                var desc = readVersionAndDescriptor(reader);
                var timeScope = desc.timeScope;
                // console.log('tmln', target.name, target.id, require('util').inspect(desc, false, 99, true));
                var timeline = {
                    start: timeScope.Strt,
                    duration: timeScope.duration,
                    inTime: timeScope.inTime,
                    outTime: timeScope.outTime,
                    autoScope: desc.autoScope,
                    audioLevel: desc.audioLevel,
                };
                if (desc.trackList) {
                    timeline.tracks = parseTrackList(desc.trackList, !!options.logMissingFeatures);
                }
                target.timeline = timeline;
                // console.log('tmln:result', target.name, target.id, require('util').inspect(timeline, false, 99, true));
            }
            else {
                options.logDevFeatures && console.log('Unhandled "shmd" section key', key);
            }
            skipBytes(reader, left());
        });
    };
    for (var i = 0; i < count; i++) {
        _loop_1(i);
    }
    skipBytes(reader, left());
}, function (writer, target, _, options) {
    var animationFrames = target.animationFrames, animationFrameFlags = target.animationFrameFlags, timestamp = target.timestamp, timeline = target.timeline;
    var count = 0;
    if (animationFrames)
        count++;
    if (animationFrameFlags)
        count++;
    if (timeline)
        count++;
    if (timestamp !== undefined)
        count++;
    writeUint32(writer, count);
    if (animationFrames) {
        writeSignature(writer, '8BIM');
        writeSignature(writer, 'mlst');
        writeUint8(writer, 0); // copy (always false)
        writeZeros(writer, 3);
        writeSection(writer, 2, function () {
            var _a;
            var desc = {
                LaID: (_a = target.id) !== null && _a !== void 0 ? _a : 0,
                LaSt: [],
            };
            for (var i = 0; i < animationFrames.length; i++) {
                var f = animationFrames[i];
                var frame = {};
                if (f.enable !== undefined)
                    frame.enab = f.enable;
                frame.FrLs = f.frames;
                if (f.offset)
                    frame.Ofst = xyToHorzVrtc(f.offset);
                if (f.referencePoint)
                    frame.FXRf = xyToHorzVrtc(f.referencePoint);
                if (f.effects)
                    frame.Lefx = serializeEffects(f.effects, false, false);
                if (f.opacity !== undefined)
                    frame.blendOptions = { Opct: unitsPercent(f.opacity) };
                desc.LaSt.push(frame);
            }
            writeVersionAndDescriptor(writer, '', 'null', desc);
        }, true);
    }
    if (animationFrameFlags) {
        writeSignature(writer, '8BIM');
        writeSignature(writer, 'mdyn');
        writeUint8(writer, 0); // copy (always false)
        writeZeros(writer, 3);
        writeSection(writer, 2, function () {
            writeUint16(writer, 0); // unknown
            writeUint8(writer, animationFrameFlags.propagateFrameOne ? 0x0 : 0xf);
            writeUint8(writer, (animationFrameFlags.unifyLayerPosition ? 1 : 0) |
                (animationFrameFlags.unifyLayerStyle ? 2 : 0) |
                (animationFrameFlags.unifyLayerVisibility ? 4 : 0));
        });
    }
    if (timeline) {
        writeSignature(writer, '8BIM');
        writeSignature(writer, 'tmln');
        writeUint8(writer, 0); // copy (always false)
        writeZeros(writer, 3);
        writeSection(writer, 2, function () {
            var desc = {
                Vrsn: 1,
                timeScope: {
                    Vrsn: 1,
                    Strt: timeline.start,
                    duration: timeline.duration,
                    inTime: timeline.inTime,
                    outTime: timeline.outTime,
                },
                autoScope: timeline.autoScope,
                audioLevel: timeline.audioLevel,
            };
            if (timeline.tracks) {
                desc.trackList = serializeTrackList(timeline.tracks);
            }
            var id = options.layerToId.get(target) || target.id || 0;
            if (!id)
                throw new Error('You need to provide layer.id value whan writing document with animations');
            desc.LyrI = id;
            // console.log('WRITE:tmln', target.name, target.id, require('util').inspect(desc, false, 99, true));
            writeVersionAndDescriptor(writer, '', 'null', desc, 'anim');
        }, true);
    }
    if (timestamp !== undefined) {
        writeSignature(writer, '8BIM');
        writeSignature(writer, 'cust');
        writeUint8(writer, 0); // copy (always false)
        writeZeros(writer, 3);
        writeSection(writer, 2, function () {
            var desc = {
                layerTime: timestamp,
            };
            writeVersionAndDescriptor(writer, '', 'metadata', desc);
        }, true);
    }
});
addHandler('vstk', hasKey('vectorStroke'), function (reader, target, left) {
    var desc = readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    target.vectorStroke = {
        strokeEnabled: desc.strokeEnabled,
        fillEnabled: desc.fillEnabled,
        lineWidth: parseUnits(desc.strokeStyleLineWidth),
        lineDashOffset: parseUnits(desc.strokeStyleLineDashOffset),
        miterLimit: desc.strokeStyleMiterLimit,
        lineCapType: strokeStyleLineCapType.decode(desc.strokeStyleLineCapType),
        lineJoinType: strokeStyleLineJoinType.decode(desc.strokeStyleLineJoinType),
        lineAlignment: strokeStyleLineAlignment.decode(desc.strokeStyleLineAlignment),
        scaleLock: desc.strokeStyleScaleLock,
        strokeAdjust: desc.strokeStyleStrokeAdjust,
        lineDashSet: desc.strokeStyleLineDashSet.map(parseUnits),
        blendMode: BlnM.decode(desc.strokeStyleBlendMode),
        opacity: parsePercent(desc.strokeStyleOpacity),
        content: parseVectorContent(desc.strokeStyleContent),
        resolution: desc.strokeStyleResolution,
    };
    skipBytes(reader, left());
}, function (writer, target) {
    var _a, _b, _c;
    var stroke = target.vectorStroke;
    var descriptor = {
        strokeStyleVersion: 2,
        strokeEnabled: !!stroke.strokeEnabled,
        fillEnabled: !!stroke.fillEnabled,
        strokeStyleLineWidth: stroke.lineWidth || { value: 3, units: 'Points' },
        strokeStyleLineDashOffset: stroke.lineDashOffset || { value: 0, units: 'Points' },
        strokeStyleMiterLimit: (_a = stroke.miterLimit) !== null && _a !== void 0 ? _a : 100,
        strokeStyleLineCapType: strokeStyleLineCapType.encode(stroke.lineCapType),
        strokeStyleLineJoinType: strokeStyleLineJoinType.encode(stroke.lineJoinType),
        strokeStyleLineAlignment: strokeStyleLineAlignment.encode(stroke.lineAlignment),
        strokeStyleScaleLock: !!stroke.scaleLock,
        strokeStyleStrokeAdjust: !!stroke.strokeAdjust,
        strokeStyleLineDashSet: stroke.lineDashSet || [],
        strokeStyleBlendMode: BlnM.encode(stroke.blendMode),
        strokeStyleOpacity: unitsPercent((_b = stroke.opacity) !== null && _b !== void 0 ? _b : 1),
        strokeStyleContent: serializeVectorContent(stroke.content || { type: 'color', color: { r: 0, g: 0, b: 0 } }).descriptor,
        strokeStyleResolution: (_c = stroke.resolution) !== null && _c !== void 0 ? _c : 72,
    };
    writeVersionAndDescriptor(writer, '', 'strokeStyle', descriptor);
});
addHandler('artb', // per-layer arboard info
hasKey('artboard'), function (reader, target, left) {
    var desc = readVersionAndDescriptor(reader);
    var rect = desc.artboardRect;
    target.artboard = {
        rect: { top: rect['Top '], left: rect.Left, bottom: rect.Btom, right: rect.Rght },
        guideIndices: desc.guideIndeces,
        presetName: desc.artboardPresetName,
        color: parseColor(desc['Clr ']),
        backgroundType: desc.artboardBackgroundType,
    };
    skipBytes(reader, left());
}, function (writer, target) {
    var _a;
    var artboard = target.artboard;
    var rect = artboard.rect;
    var desc = {
        artboardRect: { 'Top ': rect.top, Left: rect.left, Btom: rect.bottom, Rght: rect.right },
        guideIndeces: artboard.guideIndices || [],
        artboardPresetName: artboard.presetName || '',
        'Clr ': serializeColor(artboard.color),
        artboardBackgroundType: (_a = artboard.backgroundType) !== null && _a !== void 0 ? _a : 1,
    };
    writeVersionAndDescriptor(writer, '', 'artboard', desc);
});
addHandler('sn2P', hasKey('usingAlignedRendering'), function (reader, target) { return target.usingAlignedRendering = !!readUint32(reader); }, function (writer, target) { return writeUint32(writer, target.usingAlignedRendering ? 1 : 0); });
var placedLayerTypes = ['unknown', 'vector', 'raster', 'image stack'];
function parseWarp(warp) {
    var _a, _b, _c, _d, _e, _f;
    var result = {
        style: warpStyle.decode(warp.warpStyle),
        value: warp.warpValue || 0,
        perspective: warp.warpPerspective || 0,
        perspectiveOther: warp.warpPerspectiveOther || 0,
        rotate: Ornt.decode(warp.warpRotate),
        bounds: warp.bounds && {
            top: parseUnitsOrNumber(warp.bounds['Top ']),
            left: parseUnitsOrNumber(warp.bounds.Left),
            bottom: parseUnitsOrNumber(warp.bounds.Btom),
            right: parseUnitsOrNumber(warp.bounds.Rght),
        },
        uOrder: warp.uOrder,
        vOrder: warp.vOrder,
    };
    if (warp.deformNumRows != null || warp.deformNumCols != null) {
        result.deformNumRows = warp.deformNumRows;
        result.deformNumCols = warp.deformNumCols;
    }
    var envelopeWarp = warp.customEnvelopeWarp;
    if (envelopeWarp) {
        result.customEnvelopeWarp = {
            meshPoints: [],
        };
        var xs = ((_a = envelopeWarp.meshPoints.find(function (i) { return i.type === 'Hrzn'; })) === null || _a === void 0 ? void 0 : _a.values) || [];
        var ys = ((_b = envelopeWarp.meshPoints.find(function (i) { return i.type === 'Vrtc'; })) === null || _b === void 0 ? void 0 : _b.values) || [];
        for (var i = 0; i < xs.length; i++) {
            result.customEnvelopeWarp.meshPoints.push({ x: xs[i], y: ys[i] });
        }
        if (envelopeWarp.quiltSliceX || envelopeWarp.quiltSliceY) {
            result.customEnvelopeWarp.quiltSliceX = ((_d = (_c = envelopeWarp.quiltSliceX) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.values) || [];
            result.customEnvelopeWarp.quiltSliceY = ((_f = (_e = envelopeWarp.quiltSliceY) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.values) || [];
        }
    }
    return result;
}
function isQuiltWarp(warp) {
    var _a, _b;
    return warp.deformNumCols != null || warp.deformNumRows != null ||
        ((_a = warp.customEnvelopeWarp) === null || _a === void 0 ? void 0 : _a.quiltSliceX) || ((_b = warp.customEnvelopeWarp) === null || _b === void 0 ? void 0 : _b.quiltSliceY);
}
function encodeWarp(warp) {
    var bounds = warp.bounds;
    var desc = {
        warpStyle: warpStyle.encode(warp.style),
        warpValue: warp.value || 0,
        warpPerspective: warp.perspective || 0,
        warpPerspectiveOther: warp.perspectiveOther || 0,
        warpRotate: Ornt.encode(warp.rotate),
        bounds: {
            'Top ': unitsValue(bounds && bounds.top || { units: 'Pixels', value: 0 }, 'bounds.top'),
            Left: unitsValue(bounds && bounds.left || { units: 'Pixels', value: 0 }, 'bounds.left'),
            Btom: unitsValue(bounds && bounds.bottom || { units: 'Pixels', value: 0 }, 'bounds.bottom'),
            Rght: unitsValue(bounds && bounds.right || { units: 'Pixels', value: 0 }, 'bounds.right'),
        },
        uOrder: warp.uOrder || 0,
        vOrder: warp.vOrder || 0,
    };
    var isQuilt = isQuiltWarp(warp);
    if (isQuilt) {
        var desc2 = desc;
        desc2.deformNumRows = warp.deformNumRows || 0;
        desc2.deformNumCols = warp.deformNumCols || 0;
    }
    var customEnvelopeWarp = warp.customEnvelopeWarp;
    if (customEnvelopeWarp) {
        var meshPoints = customEnvelopeWarp.meshPoints || [];
        if (isQuilt) {
            var desc2 = desc;
            desc2.customEnvelopeWarp = {
                quiltSliceX: [{
                        type: 'quiltSliceX',
                        values: customEnvelopeWarp.quiltSliceX || [],
                    }],
                quiltSliceY: [{
                        type: 'quiltSliceY',
                        values: customEnvelopeWarp.quiltSliceY || [],
                    }],
                meshPoints: [
                    { type: 'Hrzn', values: meshPoints.map(function (p) { return p.x; }) },
                    { type: 'Vrtc', values: meshPoints.map(function (p) { return p.y; }) },
                ],
            };
        }
        else {
            desc.customEnvelopeWarp = {
                meshPoints: [
                    { type: 'Hrzn', values: meshPoints.map(function (p) { return p.x; }) },
                    { type: 'Vrtc', values: meshPoints.map(function (p) { return p.y; }) },
                ],
            };
        }
    }
    return desc;
}
addHandler('PlLd', hasKey('placedLayer'), function (reader, target, left) {
    if (readSignature(reader) !== 'plcL')
        throw new Error("Invalid PlLd signature");
    if (readInt32(reader) !== 3)
        throw new Error("Invalid PlLd version");
    var id = readPascalString(reader, 1);
    var pageNumber = readInt32(reader);
    var totalPages = readInt32(reader); // TODO: check how this works ?
    readInt32(reader); // anitAliasPolicy 16
    var placedLayerType = readInt32(reader); // 0 = unknown, 1 = vector, 2 = raster, 3 = image stack
    if (!placedLayerTypes[placedLayerType])
        throw new Error('Invalid PlLd type');
    var transform = [];
    for (var i = 0; i < 8; i++)
        transform.push(readFloat64(reader)); // x, y of 4 corners of the transform
    var warpVersion = readInt32(reader);
    if (warpVersion !== 0)
        throw new Error("Invalid Warp version ".concat(warpVersion));
    var warp = readVersionAndDescriptor(reader);
    target.placedLayer = target.placedLayer || {
        id: id,
        type: placedLayerTypes[placedLayerType],
        pageNumber: pageNumber,
        totalPages: totalPages,
        transform: transform,
        warp: parseWarp(warp),
    };
    // console.log('PlLd warp', require('util').inspect(warp, false, 99, true));
    // console.log('PlLd', require('util').inspect(target.placedLayer, false, 99, true));
    skipBytes(reader, left());
}, function (writer, target) {
    var placed = target.placedLayer;
    writeSignature(writer, 'plcL');
    writeInt32(writer, 3); // version
    writePascalString(writer, placed.id, 1);
    writeInt32(writer, 1); // pageNumber
    writeInt32(writer, 1); // totalPages
    writeInt32(writer, 16); // anitAliasPolicy
    if (placedLayerTypes.indexOf(placed.type) === -1)
        throw new Error('Invalid placedLayer type');
    writeInt32(writer, placedLayerTypes.indexOf(placed.type));
    for (var i = 0; i < 8; i++)
        writeFloat64(writer, placed.transform[i]);
    writeInt32(writer, 0); // warp version
    var isQuilt = placed.warp && isQuiltWarp(placed.warp);
    var type = isQuilt ? 'quiltWarp' : 'warp';
    writeVersionAndDescriptor(writer, '', type, encodeWarp(placed.warp || {}), type);
});
addHandler('SoLd', hasKey('placedLayer'), function (reader, target, left) {
    if (readSignature(reader) !== 'soLD')
        throw new Error("Invalid SoLd type");
    if (readInt32(reader) !== 4)
        throw new Error("Invalid SoLd version");
    var desc = readVersionAndDescriptor(reader);
    // console.log('SoLd', require('util').inspect(desc, false, 99, true));
    // console.log('SoLd.warp', require('util').inspect(desc.warp, false, 99, true));
    // console.log('SoLd.quiltWarp', require('util').inspect(desc.quiltWarp, false, 99, true));
    target.placedLayer = {
        id: desc.Idnt,
        placed: desc.placed,
        type: placedLayerTypes[desc.Type],
        pageNumber: desc.PgNm,
        totalPages: desc.totalPages,
        frameStep: desc.frameStep,
        duration: desc.duration,
        frameCount: desc.frameCount,
        transform: desc.Trnf,
        width: desc['Sz  '].Wdth,
        height: desc['Sz  '].Hght,
        resolution: parseUnits(desc.Rslt),
        warp: parseWarp((desc.quiltWarp || desc.warp)),
    };
    if (desc.nonAffineTransform && desc.nonAffineTransform.some(function (x, i) { return x !== desc.Trnf[i]; })) {
        target.placedLayer.nonAffineTransform = desc.nonAffineTransform;
    }
    if (desc.Crop)
        target.placedLayer.crop = desc.Crop;
    if (desc.comp)
        target.placedLayer.comp = desc.comp;
    if (desc.compInfo)
        target.placedLayer.compInfo = desc.compInfo;
    skipBytes(reader, left()); // HACK
}, function (writer, target) {
    var _a, _b;
    writeSignature(writer, 'soLD');
    writeInt32(writer, 4); // version
    var placed = target.placedLayer;
    var desc = __assign(__assign({ Idnt: placed.id, placed: (_a = placed.placed) !== null && _a !== void 0 ? _a : placed.id, PgNm: placed.pageNumber || 1, totalPages: placed.totalPages || 1 }, (placed.crop ? { Crop: placed.crop } : {})), { frameStep: placed.frameStep || { numerator: 0, denominator: 600 }, duration: placed.duration || { numerator: 0, denominator: 600 }, frameCount: placed.frameCount || 0, Annt: 16, Type: placedLayerTypes.indexOf(placed.type), Trnf: placed.transform, nonAffineTransform: (_b = placed.nonAffineTransform) !== null && _b !== void 0 ? _b : placed.transform, quiltWarp: {}, warp: encodeWarp(placed.warp || {}), 'Sz  ': {
            Wdth: placed.width || 0,
            Hght: placed.height || 0, // TODO: find size ?
        }, Rslt: placed.resolution ? unitsValue(placed.resolution, 'resolution') : { units: 'Density', value: 72 } });
    if (placed.warp && isQuiltWarp(placed.warp)) {
        var quiltWarp = encodeWarp(placed.warp);
        desc.quiltWarp = quiltWarp;
        desc.warp = {
            warpStyle: 'warpStyle.warpNone',
            warpValue: quiltWarp.warpValue,
            warpPerspective: quiltWarp.warpPerspective,
            warpPerspectiveOther: quiltWarp.warpPerspectiveOther,
            warpRotate: quiltWarp.warpRotate,
            bounds: quiltWarp.bounds,
            uOrder: quiltWarp.uOrder,
            vOrder: quiltWarp.vOrder,
        };
    }
    else {
        delete desc.quiltWarp;
    }
    if (placed.comp)
        desc.comp = placed.comp;
    if (placed.compInfo)
        desc.compInfo = placed.compInfo;
    writeVersionAndDescriptor(writer, '', 'null', desc, desc.quiltWarp ? 'quiltWarp' : 'warp');
});
addHandler('fxrp', hasKey('referencePoint'), function (reader, target) {
    target.referencePoint = {
        x: readFloat64(reader),
        y: readFloat64(reader),
    };
}, function (writer, target) {
    writeFloat64(writer, target.referencePoint.x);
    writeFloat64(writer, target.referencePoint.y);
});
if (MOCK_HANDLERS) {
    addHandler('Patt', function (target) { return target._Patt !== undefined; }, function (reader, target, left) {
        // console.log('additional info: Patt');
        target._Patt = readBytes(reader, left());
    }, function (writer, target) { return false && writeBytes(writer, target._Patt); });
}
else {
    addHandler('Patt', // TODO: handle also Pat2 & Pat3
    function (// TODO: handle also Pat2 & Pat3
    target) { return !target; }, function (reader, target, left) {
        if (!left())
            return;
        skipBytes(reader, left());
        return; // not supported yet
        target;
        readPattern;
        // if (!target.patterns) target.patterns = [];
        // target.patterns.push(readPattern(reader));
        // skipBytes(reader, left());
    }, function (_writer, _target) {
    });
}
function readRect(reader) {
    var top = readInt32(reader);
    var left = readInt32(reader);
    var bottom = readInt32(reader);
    var right = readInt32(reader);
    return { top: top, left: left, bottom: bottom, right: right };
}
function writeRect(writer, rect) {
    writeInt32(writer, rect.top);
    writeInt32(writer, rect.left);
    writeInt32(writer, rect.bottom);
    writeInt32(writer, rect.right);
}
addHandler('Anno', function (target) { return target.annotations !== undefined; }, function (reader, target, left) {
    var major = readUint16(reader);
    var minor = readUint16(reader);
    if (major !== 2 || minor !== 1)
        throw new Error('Invalid Anno version');
    var count = readUint32(reader);
    var annotations = [];
    for (var i = 0; i < count; i++) {
        /*const length =*/ readUint32(reader);
        var type = readSignature(reader);
        var open_1 = !!readUint8(reader);
        /*const flags =*/ readUint8(reader); // always 28
        /*const optionalBlocks =*/ readUint16(reader);
        var iconLocation = readRect(reader);
        var popupLocation = readRect(reader);
        var color = readColor(reader);
        var author = readPascalString(reader, 2);
        var name_1 = readPascalString(reader, 2);
        var date = readPascalString(reader, 2);
        /*const contentLength =*/ readUint32(reader);
        /*const dataType =*/ readSignature(reader);
        var dataLength = readUint32(reader);
        var data = void 0;
        if (type === 'txtA') {
            if (dataLength >= 2 && readUint16(reader) === 0xfeff) {
                data = readUnicodeStringWithLength(reader, (dataLength - 2) / 2);
            }
            else {
                reader.offset -= 2;
                data = readAsciiString(reader, dataLength);
            }
            data = data.replace(/\r/g, '\n');
        }
        else if (type === 'sndA') {
            data = readBytes(reader, dataLength);
        }
        else {
            throw new Error('Unknown annotation type');
        }
        annotations.push({
            type: type === 'txtA' ? 'text' : 'sound',
            open: open_1,
            iconLocation: iconLocation,
            popupLocation: popupLocation,
            color: color,
            author: author,
            name: name_1,
            date: date,
            data: data,
        });
    }
    target.annotations = annotations;
    skipBytes(reader, left());
}, function (writer, target) {
    var annotations = target.annotations;
    writeUint16(writer, 2);
    writeUint16(writer, 1);
    writeUint32(writer, annotations.length);
    for (var _i = 0, annotations_1 = annotations; _i < annotations_1.length; _i++) {
        var annotation = annotations_1[_i];
        var sound = annotation.type === 'sound';
        if (sound && !(annotation.data instanceof Uint8Array))
            throw new Error('Sound annotation data should be Uint8Array');
        if (!sound && typeof annotation.data !== 'string')
            throw new Error('Text annotation data should be string');
        var lengthOffset = writer.offset;
        writeUint32(writer, 0); // length
        writeSignature(writer, sound ? 'sndA' : 'txtA');
        writeUint8(writer, annotation.open ? 1 : 0);
        writeUint8(writer, 28);
        writeUint16(writer, 1);
        writeRect(writer, annotation.iconLocation);
        writeRect(writer, annotation.popupLocation);
        writeColor(writer, annotation.color);
        writePascalString(writer, annotation.author || '', 2);
        writePascalString(writer, annotation.name || '', 2);
        writePascalString(writer, annotation.date || '', 2);
        var contentOffset = writer.offset;
        writeUint32(writer, 0); // content length
        writeSignature(writer, sound ? 'sndM' : 'txtC');
        writeUint32(writer, 0); // data length
        var dataOffset = writer.offset;
        if (sound) {
            writeBytes(writer, annotation.data);
        }
        else {
            writeUint16(writer, 0xfeff); // unicode string indicator
            var text = annotation.data.replace(/\n/g, '\r');
            for (var i = 0; i < text.length; i++)
                writeUint16(writer, text.charCodeAt(i));
        }
        writer.view.setUint32(lengthOffset, writer.offset - lengthOffset, false);
        writer.view.setUint32(contentOffset, writer.offset - contentOffset, false);
        writer.view.setUint32(dataOffset - 4, writer.offset - dataOffset, false);
    }
});
addHandler('lnk2', function (target) { return !!target.linkedFiles && target.linkedFiles.length > 0; }, function (reader, target, left, _, options) {
    var psd = target;
    psd.linkedFiles = [];
    while (left() > 8) {
        var size = readLength64(reader); // size
        var startOffset = reader.offset;
        var type = readSignature(reader);
        var version = readInt32(reader);
        var id = readPascalString(reader, 1);
        var name_2 = readUnicodeString(reader);
        var fileType = readSignature(reader).trim(); // '    ' if empty
        var fileCreator = readSignature(reader).trim(); // '    ' or '\0\0\0\0' if empty
        var dataSize = readLength64(reader);
        var hasFileOpenDescriptor = readUint8(reader);
        var fileOpenDescriptor = hasFileOpenDescriptor ? readVersionAndDescriptor(reader) : undefined;
        var linkedFileDescriptor = type === 'liFE' ? readVersionAndDescriptor(reader) : undefined;
        var file = { id: id, name: name_2, data: undefined };
        if (fileType)
            file.type = fileType;
        if (fileCreator)
            file.creator = fileCreator;
        if (fileOpenDescriptor)
            file.descriptor = fileOpenDescriptor;
        if (type === 'liFE' && version > 3) {
            var year = readInt32(reader);
            var month = readUint8(reader);
            var day = readUint8(reader);
            var hour = readUint8(reader);
            var minute = readUint8(reader);
            var seconds = readFloat64(reader);
            var wholeSeconds = Math.floor(seconds);
            var ms = (seconds - wholeSeconds) * 1000;
            file.time = new Date(year, month, day, hour, minute, wholeSeconds, ms);
        }
        var fileSize = type === 'liFE' ? readLength64(reader) : 0;
        if (type === 'liFA')
            skipBytes(reader, 8);
        if (type === 'liFD')
            file.data = readBytes(reader, dataSize);
        if (version >= 5)
            file.childDocumentID = readUnicodeString(reader);
        if (version >= 6)
            file.assetModTime = readFloat64(reader);
        if (version >= 7)
            file.assetLockedState = readUint8(reader);
        if (type === 'liFE')
            file.data = readBytes(reader, fileSize);
        if (options.skipLinkedFilesData)
            file.data = undefined;
        psd.linkedFiles.push(file);
        linkedFileDescriptor;
        while (size % 4)
            size++;
        reader.offset = startOffset + size;
    }
    skipBytes(reader, left()); // ?
}, function (writer, target) {
    var psd = target;
    for (var _i = 0, _a = psd.linkedFiles; _i < _a.length; _i++) {
        var file = _a[_i];
        var version = 2;
        if (file.assetLockedState != null)
            version = 7;
        else if (file.assetModTime != null)
            version = 6;
        else if (file.childDocumentID != null)
            version = 5;
        // TODO: else if (file.time != null) version = 3; (only for liFE)
        writeUint32(writer, 0);
        writeUint32(writer, 0); // size
        var sizeOffset = writer.offset;
        writeSignature(writer, file.data ? 'liFD' : 'liFA');
        writeInt32(writer, version);
        writePascalString(writer, file.id || '', 1);
        writeUnicodeStringWithPadding(writer, file.name || '');
        writeSignature(writer, file.type ? "".concat(file.type, "    ").substring(0, 4) : '    ');
        writeSignature(writer, file.creator ? "".concat(file.creator, "    ").substring(0, 4) : '\0\0\0\0');
        writeLength64(writer, file.data ? file.data.byteLength : 0);
        if (file.descriptor && file.descriptor.compInfo) {
            var desc = {
                compInfo: file.descriptor.compInfo,
            };
            writeUint8(writer, 1);
            writeVersionAndDescriptor(writer, '', 'null', desc);
        }
        else {
            writeUint8(writer, 0);
        }
        if (file.data)
            writeBytes(writer, file.data);
        else
            writeLength64(writer, 0);
        if (version >= 5)
            writeUnicodeStringWithPadding(writer, file.childDocumentID || '');
        if (version >= 6)
            writeFloat64(writer, file.assetModTime || 0);
        if (version >= 7)
            writeUint8(writer, file.assetLockedState || 0);
        var size = writer.offset - sizeOffset;
        writer.view.setUint32(sizeOffset - 4, size, false); // write size
        while (size % 4) {
            size++;
            writeUint8(writer, 0);
        }
    }
});
addHandlerAlias('lnkD', 'lnk2');
addHandlerAlias('lnk3', 'lnk2');
// this seems to just be zero size block, ignore it
addHandler('lnkE', function (target) { return target._lnkE !== undefined; }, function (reader, target, left, _psds, options) {
    if (options.logMissingFeatures && left()) {
        console.log("Non-empty lnkE layer info (".concat(left(), " bytes)"));
    }
    if (MOCK_HANDLERS) {
        target._lnkE = readBytes(reader, left());
    }
}, function (writer, target) { return MOCK_HANDLERS && writeBytes(writer, target._lnkE); });
addHandler('pths', hasKey('pathList'), function (reader, target) {
    var descriptor = readVersionAndDescriptor(reader);
    target.pathList = []; // TODO: read paths (find example with non-empty list)
    descriptor;
    // console.log('pths', descriptor); // TODO: remove this
}, function (writer, _target) {
    var descriptor = {
        pathList: [], // TODO: write paths
    };
    writeVersionAndDescriptor(writer, '', 'pathsDataClass', descriptor);
});
addHandler('lyvr', hasKey('version'), function (reader, target) { return target.version = readUint32(reader); }, function (writer, target) { return writeUint32(writer, target.version); });
function adjustmentType(type) {
    return function (target) { return !!target.adjustment && target.adjustment.type === type; };
}
addHandler('brit', adjustmentType('brightness/contrast'), function (reader, target, left) {
    if (!target.adjustment) { // ignore if got one from CgEd block
        target.adjustment = {
            type: 'brightness/contrast',
            brightness: readInt16(reader),
            contrast: readInt16(reader),
            meanValue: readInt16(reader),
            labColorOnly: !!readUint8(reader),
            useLegacy: true,
        };
    }
    skipBytes(reader, left());
}, function (writer, target) {
    var _a;
    var info = target.adjustment;
    writeInt16(writer, info.brightness || 0);
    writeInt16(writer, info.contrast || 0);
    writeInt16(writer, (_a = info.meanValue) !== null && _a !== void 0 ? _a : 127);
    writeUint8(writer, info.labColorOnly ? 1 : 0);
    writeZeros(writer, 1);
});
function readLevelsChannel(reader) {
    var shadowInput = readInt16(reader);
    var highlightInput = readInt16(reader);
    var shadowOutput = readInt16(reader);
    var highlightOutput = readInt16(reader);
    var midtoneInput = readInt16(reader) / 100;
    return { shadowInput: shadowInput, highlightInput: highlightInput, shadowOutput: shadowOutput, highlightOutput: highlightOutput, midtoneInput: midtoneInput };
}
function writeLevelsChannel(writer, channel) {
    writeInt16(writer, channel.shadowInput);
    writeInt16(writer, channel.highlightInput);
    writeInt16(writer, channel.shadowOutput);
    writeInt16(writer, channel.highlightOutput);
    writeInt16(writer, Math.round(channel.midtoneInput * 100));
}
addHandler('levl', adjustmentType('levels'), function (reader, target, left) {
    if (readUint16(reader) !== 2)
        throw new Error('Invalid levl version');
    target.adjustment = __assign(__assign({}, target.adjustment), { type: 'levels', rgb: readLevelsChannel(reader), red: readLevelsChannel(reader), green: readLevelsChannel(reader), blue: readLevelsChannel(reader) });
    skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    var defaultChannel = {
        shadowInput: 0,
        highlightInput: 255,
        shadowOutput: 0,
        highlightOutput: 255,
        midtoneInput: 1,
    };
    writeUint16(writer, 2); // version
    writeLevelsChannel(writer, info.rgb || defaultChannel);
    writeLevelsChannel(writer, info.red || defaultChannel);
    writeLevelsChannel(writer, info.blue || defaultChannel);
    writeLevelsChannel(writer, info.green || defaultChannel);
    for (var i = 0; i < 59; i++)
        writeLevelsChannel(writer, defaultChannel);
});
function readCurveChannel(reader) {
    var nodes = readUint16(reader);
    var channel = [];
    for (var j = 0; j < nodes; j++) {
        var output = readInt16(reader);
        var input = readInt16(reader);
        channel.push({ input: input, output: output });
    }
    return channel;
}
function writeCurveChannel(writer, channel) {
    writeUint16(writer, channel.length);
    for (var _i = 0, channel_1 = channel; _i < channel_1.length; _i++) {
        var n = channel_1[_i];
        writeUint16(writer, n.output);
        writeUint16(writer, n.input);
    }
}
addHandler('curv', adjustmentType('curves'), function (reader, target, left) {
    readUint8(reader);
    if (readUint16(reader) !== 1)
        throw new Error('Invalid curv version');
    readUint16(reader);
    var channels = readUint16(reader);
    var info = { type: 'curves' };
    if (channels & 1)
        info.rgb = readCurveChannel(reader);
    if (channels & 2)
        info.red = readCurveChannel(reader);
    if (channels & 4)
        info.green = readCurveChannel(reader);
    if (channels & 8)
        info.blue = readCurveChannel(reader);
    target.adjustment = __assign(__assign({}, target.adjustment), info);
    // ignoring, duplicate information
    // checkSignature(reader, 'Crv ');
    // const cVersion = readUint16(reader);
    // readUint16(reader);
    // const channelCount = readUint16(reader);
    // for (let i = 0; i < channelCount; i++) {
    // 	const index = readUint16(reader);
    // 	const nodes = readUint16(reader);
    // 	for (let j = 0; j < nodes; j++) {
    // 		const output = readInt16(reader);
    // 		const input = readInt16(reader);
    // 	}
    // }
    skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    var rgb = info.rgb, red = info.red, green = info.green, blue = info.blue;
    var channels = 0;
    var channelCount = 0;
    if (rgb && rgb.length) {
        channels |= 1;
        channelCount++;
    }
    if (red && red.length) {
        channels |= 2;
        channelCount++;
    }
    if (green && green.length) {
        channels |= 4;
        channelCount++;
    }
    if (blue && blue.length) {
        channels |= 8;
        channelCount++;
    }
    writeUint8(writer, 0);
    writeUint16(writer, 1); // version
    writeUint16(writer, 0);
    writeUint16(writer, channels);
    if (rgb && rgb.length)
        writeCurveChannel(writer, rgb);
    if (red && red.length)
        writeCurveChannel(writer, red);
    if (green && green.length)
        writeCurveChannel(writer, green);
    if (blue && blue.length)
        writeCurveChannel(writer, blue);
    writeSignature(writer, 'Crv ');
    writeUint16(writer, 4); // version
    writeUint16(writer, 0);
    writeUint16(writer, channelCount);
    if (rgb && rgb.length) {
        writeUint16(writer, 0);
        writeCurveChannel(writer, rgb);
    }
    if (red && red.length) {
        writeUint16(writer, 1);
        writeCurveChannel(writer, red);
    }
    if (green && green.length) {
        writeUint16(writer, 2);
        writeCurveChannel(writer, green);
    }
    if (blue && blue.length) {
        writeUint16(writer, 3);
        writeCurveChannel(writer, blue);
    }
    writeZeros(writer, 2);
});
addHandler('expA', adjustmentType('exposure'), function (reader, target, left) {
    if (readUint16(reader) !== 1)
        throw new Error('Invalid expA version');
    target.adjustment = __assign(__assign({}, target.adjustment), { type: 'exposure', exposure: readFloat32(reader), offset: readFloat32(reader), gamma: readFloat32(reader) });
    skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    writeUint16(writer, 1); // version
    writeFloat32(writer, info.exposure);
    writeFloat32(writer, info.offset);
    writeFloat32(writer, info.gamma);
    writeZeros(writer, 2);
});
addHandler('vibA', adjustmentType('vibrance'), function (reader, target, left) {
    var desc = readVersionAndDescriptor(reader);
    target.adjustment = { type: 'vibrance' };
    if (desc.vibrance !== undefined)
        target.adjustment.vibrance = desc.vibrance;
    if (desc.Strt !== undefined)
        target.adjustment.saturation = desc.Strt;
    skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    var desc = {};
    if (info.vibrance !== undefined)
        desc.vibrance = info.vibrance;
    if (info.saturation !== undefined)
        desc.Strt = info.saturation;
    writeVersionAndDescriptor(writer, '', 'null', desc);
});
function readHueChannel(reader) {
    return {
        a: readInt16(reader),
        b: readInt16(reader),
        c: readInt16(reader),
        d: readInt16(reader),
        hue: readInt16(reader),
        saturation: readInt16(reader),
        lightness: readInt16(reader),
    };
}
function writeHueChannel(writer, channel) {
    var c = channel || {};
    writeInt16(writer, c.a || 0);
    writeInt16(writer, c.b || 0);
    writeInt16(writer, c.c || 0);
    writeInt16(writer, c.d || 0);
    writeInt16(writer, c.hue || 0);
    writeInt16(writer, c.saturation || 0);
    writeInt16(writer, c.lightness || 0);
}
addHandler('hue2', adjustmentType('hue/saturation'), function (reader, target, left) {
    if (readUint16(reader) !== 2)
        throw new Error('Invalid hue2 version');
    target.adjustment = __assign(__assign({}, target.adjustment), { type: 'hue/saturation', master: readHueChannel(reader), reds: readHueChannel(reader), yellows: readHueChannel(reader), greens: readHueChannel(reader), cyans: readHueChannel(reader), blues: readHueChannel(reader), magentas: readHueChannel(reader) });
    skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    writeUint16(writer, 2); // version
    writeHueChannel(writer, info.master);
    writeHueChannel(writer, info.reds);
    writeHueChannel(writer, info.yellows);
    writeHueChannel(writer, info.greens);
    writeHueChannel(writer, info.cyans);
    writeHueChannel(writer, info.blues);
    writeHueChannel(writer, info.magentas);
});
function readColorBalance(reader) {
    return {
        cyanRed: readInt16(reader),
        magentaGreen: readInt16(reader),
        yellowBlue: readInt16(reader),
    };
}
function writeColorBalance(writer, value) {
    writeInt16(writer, value.cyanRed || 0);
    writeInt16(writer, value.magentaGreen || 0);
    writeInt16(writer, value.yellowBlue || 0);
}
addHandler('blnc', adjustmentType('color balance'), function (reader, target, left) {
    target.adjustment = {
        type: 'color balance',
        shadows: readColorBalance(reader),
        midtones: readColorBalance(reader),
        highlights: readColorBalance(reader),
        preserveLuminosity: !!readUint8(reader),
    };
    skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    writeColorBalance(writer, info.shadows || {});
    writeColorBalance(writer, info.midtones || {});
    writeColorBalance(writer, info.highlights || {});
    writeUint8(writer, info.preserveLuminosity ? 1 : 0);
    writeZeros(writer, 1);
});
addHandler('blwh', adjustmentType('black & white'), function (reader, target, left) {
    var desc = readVersionAndDescriptor(reader);
    target.adjustment = {
        type: 'black & white',
        reds: desc['Rd  '],
        yellows: desc.Yllw,
        greens: desc['Grn '],
        cyans: desc['Cyn '],
        blues: desc['Bl  '],
        magentas: desc.Mgnt,
        useTint: !!desc.useTint,
        presetKind: desc.bwPresetKind,
        presetFileName: desc.blackAndWhitePresetFileName,
    };
    if (desc.tintColor !== undefined)
        target.adjustment.tintColor = parseColor(desc.tintColor);
    skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    var desc = {
        'Rd  ': info.reds || 0,
        Yllw: info.yellows || 0,
        'Grn ': info.greens || 0,
        'Cyn ': info.cyans || 0,
        'Bl  ': info.blues || 0,
        Mgnt: info.magentas || 0,
        useTint: !!info.useTint,
        tintColor: serializeColor(info.tintColor),
        bwPresetKind: info.presetKind || 0,
        blackAndWhitePresetFileName: info.presetFileName || '',
    };
    writeVersionAndDescriptor(writer, '', 'null', desc);
});
addHandler('phfl', adjustmentType('photo filter'), function (reader, target, left) {
    var version = readUint16(reader);
    if (version !== 2 && version !== 3)
        throw new Error('Invalid phfl version');
    var color;
    if (version === 2) {
        color = readColor(reader);
    }
    else { // version 3
        // TODO: test this, this is probably wrong
        color = {
            l: readInt32(reader) / 100,
            a: readInt32(reader) / 100,
            b: readInt32(reader) / 100,
        };
    }
    target.adjustment = {
        type: 'photo filter',
        color: color,
        density: readUint32(reader) / 100,
        preserveLuminosity: !!readUint8(reader),
    };
    skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    writeUint16(writer, 2); // version
    writeColor(writer, info.color || { l: 0, a: 0, b: 0 });
    writeUint32(writer, (info.density || 0) * 100);
    writeUint8(writer, info.preserveLuminosity ? 1 : 0);
    writeZeros(writer, 3);
});
function readMixrChannel(reader) {
    var red = readInt16(reader);
    var green = readInt16(reader);
    var blue = readInt16(reader);
    skipBytes(reader, 2);
    var constant = readInt16(reader);
    return { red: red, green: green, blue: blue, constant: constant };
}
function writeMixrChannel(writer, channel) {
    var c = channel || {};
    writeInt16(writer, c.red);
    writeInt16(writer, c.green);
    writeInt16(writer, c.blue);
    writeZeros(writer, 2);
    writeInt16(writer, c.constant);
}
addHandler('mixr', adjustmentType('channel mixer'), function (reader, target, left) {
    if (readUint16(reader) !== 1)
        throw new Error('Invalid mixr version');
    var adjustment = target.adjustment = __assign(__assign({}, target.adjustment), { type: 'channel mixer', monochrome: !!readUint16(reader) });
    if (!adjustment.monochrome) {
        adjustment.red = readMixrChannel(reader);
        adjustment.green = readMixrChannel(reader);
        adjustment.blue = readMixrChannel(reader);
    }
    adjustment.gray = readMixrChannel(reader);
    skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    writeUint16(writer, 1); // version
    writeUint16(writer, info.monochrome ? 1 : 0);
    if (info.monochrome) {
        writeMixrChannel(writer, info.gray);
        writeZeros(writer, 3 * 5 * 2);
    }
    else {
        writeMixrChannel(writer, info.red);
        writeMixrChannel(writer, info.green);
        writeMixrChannel(writer, info.blue);
        writeMixrChannel(writer, info.gray);
    }
});
var colorLookupType = createEnum('colorLookupType', '3DLUT', {
    '3dlut': '3DLUT',
    abstractProfile: 'abstractProfile',
    deviceLinkProfile: 'deviceLinkProfile',
});
var LUTFormatType = createEnum('LUTFormatType', 'look', {
    look: 'LUTFormatLOOK',
    cube: 'LUTFormatCUBE',
    '3dl': 'LUTFormat3DL',
});
var colorLookupOrder = createEnum('colorLookupOrder', 'rgb', {
    rgb: 'rgbOrder',
    bgr: 'bgrOrder',
});
addHandler('clrL', adjustmentType('color lookup'), function (reader, target, left) {
    if (readUint16(reader) !== 1)
        throw new Error('Invalid clrL version');
    var desc = readVersionAndDescriptor(reader);
    target.adjustment = { type: 'color lookup' };
    var info = target.adjustment;
    if (desc.lookupType !== undefined)
        info.lookupType = colorLookupType.decode(desc.lookupType);
    if (desc['Nm  '] !== undefined)
        info.name = desc['Nm  '];
    if (desc.Dthr !== undefined)
        info.dither = desc.Dthr;
    if (desc.profile !== undefined)
        info.profile = desc.profile;
    if (desc.LUTFormat !== undefined)
        info.lutFormat = LUTFormatType.decode(desc.LUTFormat);
    if (desc.dataOrder !== undefined)
        info.dataOrder = colorLookupOrder.decode(desc.dataOrder);
    if (desc.tableOrder !== undefined)
        info.tableOrder = colorLookupOrder.decode(desc.tableOrder);
    if (desc.LUT3DFileData !== undefined)
        info.lut3DFileData = desc.LUT3DFileData;
    if (desc.LUT3DFileName !== undefined)
        info.lut3DFileName = desc.LUT3DFileName;
    skipBytes(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    var desc = {};
    if (info.lookupType !== undefined)
        desc.lookupType = colorLookupType.encode(info.lookupType);
    if (info.name !== undefined)
        desc['Nm  '] = info.name;
    if (info.dither !== undefined)
        desc.Dthr = info.dither;
    if (info.profile !== undefined)
        desc.profile = info.profile;
    if (info.lutFormat !== undefined)
        desc.LUTFormat = LUTFormatType.encode(info.lutFormat);
    if (info.dataOrder !== undefined)
        desc.dataOrder = colorLookupOrder.encode(info.dataOrder);
    if (info.tableOrder !== undefined)
        desc.tableOrder = colorLookupOrder.encode(info.tableOrder);
    if (info.lut3DFileData !== undefined)
        desc.LUT3DFileData = info.lut3DFileData;
    if (info.lut3DFileName !== undefined)
        desc.LUT3DFileName = info.lut3DFileName;
    writeUint16(writer, 1); // version
    writeVersionAndDescriptor(writer, '', 'null', desc);
});
addHandler('nvrt', adjustmentType('invert'), function (reader, target, left) {
    target.adjustment = { type: 'invert' };
    skipBytes(reader, left());
}, function () {
    // nothing to write here
});
addHandler('post', adjustmentType('posterize'), function (reader, target, left) {
    target.adjustment = {
        type: 'posterize',
        levels: readUint16(reader),
    };
    skipBytes(reader, left());
}, function (writer, target) {
    var _a;
    var info = target.adjustment;
    writeUint16(writer, (_a = info.levels) !== null && _a !== void 0 ? _a : 4);
    writeZeros(writer, 2);
});
addHandler('thrs', adjustmentType('threshold'), function (reader, target, left) {
    target.adjustment = {
        type: 'threshold',
        level: readUint16(reader),
    };
    skipBytes(reader, left());
}, function (writer, target) {
    var _a;
    var info = target.adjustment;
    writeUint16(writer, (_a = info.level) !== null && _a !== void 0 ? _a : 128);
    writeZeros(writer, 2);
});
var grdmColorModels = ['', '', '', 'rgb', 'hsb', '', 'lab'];
addHandler('grdm', adjustmentType('gradient map'), function (reader, target, left) {
    if (readUint16(reader) !== 1)
        throw new Error('Invalid grdm version');
    var info = {
        type: 'gradient map',
        gradientType: 'solid',
    };
    info.reverse = !!readUint8(reader);
    info.dither = !!readUint8(reader);
    info.name = readUnicodeString(reader);
    info.colorStops = [];
    info.opacityStops = [];
    var stopsCount = readUint16(reader);
    for (var i = 0; i < stopsCount; i++) {
        info.colorStops.push({
            location: readUint32(reader),
            midpoint: readUint32(reader) / 100,
            color: readColor(reader),
        });
        skipBytes(reader, 2);
    }
    var opacityStopsCount = readUint16(reader);
    for (var i = 0; i < opacityStopsCount; i++) {
        info.opacityStops.push({
            location: readUint32(reader),
            midpoint: readUint32(reader) / 100,
            opacity: readUint16(reader) / 0xff,
        });
    }
    var expansionCount = readUint16(reader);
    if (expansionCount !== 2)
        throw new Error('Invalid grdm expansion count');
    var interpolation = readUint16(reader);
    info.smoothness = interpolation / 4096;
    var length = readUint16(reader);
    if (length !== 32)
        throw new Error('Invalid grdm length');
    info.gradientType = readUint16(reader) ? 'noise' : 'solid';
    info.randomSeed = readUint32(reader);
    info.addTransparency = !!readUint16(reader);
    info.restrictColors = !!readUint16(reader);
    info.roughness = readUint32(reader) / 4096;
    info.colorModel = (grdmColorModels[readUint16(reader)] || 'rgb');
    info.min = [
        readUint16(reader) / 0x8000,
        readUint16(reader) / 0x8000,
        readUint16(reader) / 0x8000,
        readUint16(reader) / 0x8000,
    ];
    info.max = [
        readUint16(reader) / 0x8000,
        readUint16(reader) / 0x8000,
        readUint16(reader) / 0x8000,
        readUint16(reader) / 0x8000,
    ];
    skipBytes(reader, left());
    for (var _i = 0, _a = info.colorStops; _i < _a.length; _i++) {
        var s = _a[_i];
        s.location /= interpolation;
    }
    for (var _b = 0, _c = info.opacityStops; _b < _c.length; _b++) {
        var s = _c[_b];
        s.location /= interpolation;
    }
    target.adjustment = info;
}, function (writer, target) {
    var _a, _b, _c;
    var info = target.adjustment;
    writeUint16(writer, 1); // version
    writeUint8(writer, info.reverse ? 1 : 0);
    writeUint8(writer, info.dither ? 1 : 0);
    writeUnicodeStringWithPadding(writer, info.name || '');
    writeUint16(writer, info.colorStops && info.colorStops.length || 0);
    var interpolation = Math.round(((_a = info.smoothness) !== null && _a !== void 0 ? _a : 1) * 4096);
    for (var _i = 0, _d = info.colorStops || []; _i < _d.length; _i++) {
        var s = _d[_i];
        writeUint32(writer, Math.round(s.location * interpolation));
        writeUint32(writer, Math.round(s.midpoint * 100));
        writeColor(writer, s.color);
        writeZeros(writer, 2);
    }
    writeUint16(writer, info.opacityStops && info.opacityStops.length || 0);
    for (var _e = 0, _f = info.opacityStops || []; _e < _f.length; _e++) {
        var s = _f[_e];
        writeUint32(writer, Math.round(s.location * interpolation));
        writeUint32(writer, Math.round(s.midpoint * 100));
        writeUint16(writer, Math.round(s.opacity * 0xff));
    }
    writeUint16(writer, 2); // expansion count
    writeUint16(writer, interpolation);
    writeUint16(writer, 32); // length
    writeUint16(writer, info.gradientType === 'noise' ? 1 : 0);
    writeUint32(writer, info.randomSeed || 0);
    writeUint16(writer, info.addTransparency ? 1 : 0);
    writeUint16(writer, info.restrictColors ? 1 : 0);
    writeUint32(writer, Math.round(((_b = info.roughness) !== null && _b !== void 0 ? _b : 1) * 4096));
    var colorModel = grdmColorModels.indexOf((_c = info.colorModel) !== null && _c !== void 0 ? _c : 'rgb');
    writeUint16(writer, colorModel === -1 ? 3 : colorModel);
    for (var i = 0; i < 4; i++)
        writeUint16(writer, Math.round((info.min && info.min[i] || 0) * 0x8000));
    for (var i = 0; i < 4; i++)
        writeUint16(writer, Math.round((info.max && info.max[i] || 0) * 0x8000));
    writeZeros(writer, 4);
});
function readSelectiveColors(reader) {
    return {
        c: readInt16(reader),
        m: readInt16(reader),
        y: readInt16(reader),
        k: readInt16(reader),
    };
}
function writeSelectiveColors(writer, cmyk) {
    var c = cmyk || {};
    writeInt16(writer, c.c);
    writeInt16(writer, c.m);
    writeInt16(writer, c.y);
    writeInt16(writer, c.k);
}
addHandler('selc', adjustmentType('selective color'), function (reader, target) {
    if (readUint16(reader) !== 1)
        throw new Error('Invalid selc version');
    var mode = readUint16(reader) ? 'absolute' : 'relative';
    skipBytes(reader, 8);
    target.adjustment = {
        type: 'selective color',
        mode: mode,
        reds: readSelectiveColors(reader),
        yellows: readSelectiveColors(reader),
        greens: readSelectiveColors(reader),
        cyans: readSelectiveColors(reader),
        blues: readSelectiveColors(reader),
        magentas: readSelectiveColors(reader),
        whites: readSelectiveColors(reader),
        neutrals: readSelectiveColors(reader),
        blacks: readSelectiveColors(reader),
    };
}, function (writer, target) {
    var info = target.adjustment;
    writeUint16(writer, 1); // version
    writeUint16(writer, info.mode === 'absolute' ? 1 : 0);
    writeZeros(writer, 8);
    writeSelectiveColors(writer, info.reds);
    writeSelectiveColors(writer, info.yellows);
    writeSelectiveColors(writer, info.greens);
    writeSelectiveColors(writer, info.cyans);
    writeSelectiveColors(writer, info.blues);
    writeSelectiveColors(writer, info.magentas);
    writeSelectiveColors(writer, info.whites);
    writeSelectiveColors(writer, info.neutrals);
    writeSelectiveColors(writer, info.blacks);
});
addHandler('CgEd', function (target) {
    var a = target.adjustment;
    if (!a)
        return false;
    return (a.type === 'brightness/contrast' && !a.useLegacy) ||
        ((a.type === 'levels' || a.type === 'curves' || a.type === 'exposure' || a.type === 'channel mixer' ||
            a.type === 'hue/saturation') && a.presetFileName !== undefined);
}, function (reader, target, left) {
    var desc = readVersionAndDescriptor(reader);
    if (desc.Vrsn !== 1)
        throw new Error('Invalid CgEd version');
    // this section can specify preset file name for other adjustment types
    if ('presetFileName' in desc) {
        target.adjustment = __assign(__assign({}, target.adjustment), { presetKind: desc.presetKind, presetFileName: desc.presetFileName });
    }
    else if ('curvesPresetFileName' in desc) {
        target.adjustment = __assign(__assign({}, target.adjustment), { presetKind: desc.curvesPresetKind, presetFileName: desc.curvesPresetFileName });
    }
    else if ('mixerPresetFileName' in desc) {
        target.adjustment = __assign(__assign({}, target.adjustment), { presetKind: desc.mixerPresetKind, presetFileName: desc.mixerPresetFileName });
    }
    else {
        target.adjustment = {
            type: 'brightness/contrast',
            brightness: desc.Brgh,
            contrast: desc.Cntr,
            meanValue: desc.means,
            useLegacy: !!desc.useLegacy,
            labColorOnly: !!desc['Lab '],
            auto: !!desc.Auto,
        };
    }
    skipBytes(reader, left());
}, function (writer, target) {
    var _a, _b, _c, _d;
    var info = target.adjustment;
    if (info.type === 'levels' || info.type === 'exposure' || info.type === 'hue/saturation') {
        var desc = {
            Vrsn: 1,
            presetKind: (_a = info.presetKind) !== null && _a !== void 0 ? _a : 1,
            presetFileName: info.presetFileName || '',
        };
        writeVersionAndDescriptor(writer, '', 'null', desc);
    }
    else if (info.type === 'curves') {
        var desc = {
            Vrsn: 1,
            curvesPresetKind: (_b = info.presetKind) !== null && _b !== void 0 ? _b : 1,
            curvesPresetFileName: info.presetFileName || '',
        };
        writeVersionAndDescriptor(writer, '', 'null', desc);
    }
    else if (info.type === 'channel mixer') {
        var desc = {
            Vrsn: 1,
            mixerPresetKind: (_c = info.presetKind) !== null && _c !== void 0 ? _c : 1,
            mixerPresetFileName: info.presetFileName || '',
        };
        writeVersionAndDescriptor(writer, '', 'null', desc);
    }
    else if (info.type === 'brightness/contrast') {
        var desc = {
            Vrsn: 1,
            Brgh: info.brightness || 0,
            Cntr: info.contrast || 0,
            means: (_d = info.meanValue) !== null && _d !== void 0 ? _d : 127,
            'Lab ': !!info.labColorOnly,
            useLegacy: !!info.useLegacy,
            Auto: !!info.auto,
        };
        writeVersionAndDescriptor(writer, '', 'null', desc);
    }
    else {
        throw new Error('Unhandled CgEd case');
    }
});
addHandler('Txt2', hasKey('engineData'), function (reader, target, left) {
    var data = readBytes(reader, left());
    target.engineData = fromByteArray(data);
    // const engineData = parseEngineData(data);
    // console.log(require('util').inspect(engineData, false, 99, true));
    // require('fs').writeFileSync('resources/engineData2Simple.txt', require('util').inspect(engineData, false, 99, false), 'utf8');
    // require('fs').writeFileSync('test_data.json', JSON.stringify(ed, null, 2), 'utf8');
}, function (writer, target) {
    var buffer = toByteArray(target.engineData);
    writeBytes(writer, buffer);
});
addHandler('FMsk', hasKey('filterMask'), function (reader, target) {
    target.filterMask = {
        colorSpace: readColor(reader),
        opacity: readUint16(reader) / 0xff,
    };
}, function (writer, target) {
    var _a;
    writeColor(writer, target.filterMask.colorSpace);
    writeUint16(writer, clamp((_a = target.filterMask.opacity) !== null && _a !== void 0 ? _a : 1, 0, 1) * 0xff);
});
addHandler('artd', // document-wide artboard info
function (// document-wide artboard info
target) { return target.artboards !== undefined; }, function (reader, target, left) {
    var desc = readVersionAndDescriptor(reader);
    target.artboards = {
        count: desc['Cnt '],
        autoExpandOffset: { horizontal: desc.autoExpandOffset.Hrzn, vertical: desc.autoExpandOffset.Vrtc },
        origin: { horizontal: desc.origin.Hrzn, vertical: desc.origin.Vrtc },
        autoExpandEnabled: desc.autoExpandEnabled,
        autoNestEnabled: desc.autoNestEnabled,
        autoPositionEnabled: desc.autoPositionEnabled,
        shrinkwrapOnSaveEnabled: desc.shrinkwrapOnSaveEnabled,
        docDefaultNewArtboardBackgroundColor: parseColor(desc.docDefaultNewArtboardBackgroundColor),
        docDefaultNewArtboardBackgroundType: desc.docDefaultNewArtboardBackgroundType,
    };
    skipBytes(reader, left());
}, function (writer, target) {
    var _a, _b, _c, _d, _e;
    var artb = target.artboards;
    var desc = {
        'Cnt ': artb.count,
        autoExpandOffset: artb.autoExpandOffset ? { Hrzn: artb.autoExpandOffset.horizontal, Vrtc: artb.autoExpandOffset.vertical } : { Hrzn: 0, Vrtc: 0 },
        origin: artb.origin ? { Hrzn: artb.origin.horizontal, Vrtc: artb.origin.vertical } : { Hrzn: 0, Vrtc: 0 },
        autoExpandEnabled: (_a = artb.autoExpandEnabled) !== null && _a !== void 0 ? _a : true,
        autoNestEnabled: (_b = artb.autoNestEnabled) !== null && _b !== void 0 ? _b : true,
        autoPositionEnabled: (_c = artb.autoPositionEnabled) !== null && _c !== void 0 ? _c : true,
        shrinkwrapOnSaveEnabled: (_d = artb.shrinkwrapOnSaveEnabled) !== null && _d !== void 0 ? _d : true,
        docDefaultNewArtboardBackgroundColor: serializeColor(artb.docDefaultNewArtboardBackgroundColor),
        docDefaultNewArtboardBackgroundType: (_e = artb.docDefaultNewArtboardBackgroundType) !== null && _e !== void 0 ? _e : 1,
    };
    writeVersionAndDescriptor(writer, '', 'null', desc, 'artd');
});
export function hasMultiEffects(effects) {
    return Object.keys(effects).map(function (key) { return effects[key]; }).some(function (v) { return Array.isArray(v) && v.length > 1; });
}
addHandler('lfx2', function (target) { return target.effects !== undefined && !hasMultiEffects(target.effects); }, function (reader, target, left, _, options) {
    var version = readUint32(reader);
    if (version !== 0)
        throw new Error("Invalid lfx2 version");
    var desc = readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    // TODO: don't discard if we got it from lmfx
    // discard if read in 'lrFX' section
    target.effects = parseEffects(desc, !!options.logMissingFeatures);
    skipBytes(reader, left());
}, function (writer, target, _, options) {
    var desc = serializeEffects(target.effects, !!options.logMissingFeatures, false);
    // console.log(require('util').inspect(desc, false, 99, true));
    writeUint32(writer, 0); // version
    writeVersionAndDescriptor(writer, '', 'null', desc);
});
addHandler('cinf', hasKey('compositorUsed'), function (reader, target, left) {
    var desc = readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    target.compositorUsed = {
        description: desc.description,
        reason: desc.reason,
        engine: desc.Engn.split('.')[1],
        enableCompCore: desc.enableCompCore.split('.')[1],
        enableCompCoreGPU: desc.enableCompCoreGPU.split('.')[1],
        compCoreSupport: desc.compCoreSupport.split('.')[1],
        compCoreGPUSupport: desc.compCoreGPUSupport.split('.')[1],
    };
    skipBytes(reader, left());
}, function (writer, target) {
    var cinf = target.compositorUsed;
    var desc = {
        Vrsn: { major: 1, minor: 0, fix: 0 },
        // psVersion: { major: 22, minor: 3, fix: 1 }, // TESTING
        description: cinf.description,
        reason: cinf.reason,
        Engn: "Engn.".concat(cinf.engine),
        enableCompCore: "enable.".concat(cinf.enableCompCore),
        enableCompCoreGPU: "enable.".concat(cinf.enableCompCoreGPU),
        // enableCompCoreThreads: `enable.feature`, // TESTING
        compCoreSupport: "reason.".concat(cinf.compCoreSupport),
        compCoreGPUSupport: "reason.".concat(cinf.compCoreGPUSupport),
    };
    writeVersionAndDescriptor(writer, '', 'null', desc);
});
// extension settings ?, ignore it
addHandler('extn', function (target) { return target._extn !== undefined; }, function (reader, target) {
    var desc = readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    if (MOCK_HANDLERS)
        target._extn = desc;
}, function (writer, target) {
    // TODO: need to add correct types for desc fields (resources/src.psd)
    if (MOCK_HANDLERS)
        writeVersionAndDescriptor(writer, '', 'null', target._extn);
});
addHandler('iOpa', hasKey('fillOpacity'), function (reader, target) {
    target.fillOpacity = readUint8(reader) / 0xff;
    skipBytes(reader, 3);
}, function (writer, target) {
    writeUint8(writer, target.fillOpacity * 0xff);
    writeZeros(writer, 3);
});
addHandler('brst', hasKey('channelBlendingRestrictions'), function (reader, target, left) {
    target.channelBlendingRestrictions = [];
    while (left() > 4) {
        target.channelBlendingRestrictions.push(readInt32(reader));
    }
}, function (writer, target) {
    for (var _i = 0, _a = target.channelBlendingRestrictions; _i < _a.length; _i++) {
        var channel = _a[_i];
        writeInt32(writer, channel);
    }
});
addHandler('tsly', hasKey('transparencyShapesLayer'), function (reader, target) {
    target.transparencyShapesLayer = !!readUint8(reader);
    skipBytes(reader, 3);
}, function (writer, target) {
    writeUint8(writer, target.transparencyShapesLayer ? 1 : 0);
    writeZeros(writer, 3);
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pELFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdkIsQ0FBQyxDQUNELENBQUM7QUFFRixVQUFVLENBQ1QsTUFBTSxFQUNOLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxFQUMvQixVQUFDLE1BQU0sRUFBRSxNQUFNO0lBQ2QsTUFBTSxDQUFDLHFCQUFxQixHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbkQsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN0QixDQUFDLEVBQ0QsVUFBQyxNQUFNLEVBQUUsTUFBTTtJQUNkLFVBQVUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pELFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdkIsQ0FBQyxDQUNELENBQUM7QUFFRixVQUFVLENBQ1QsTUFBTSxFQUNOLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFDbEIsVUFBQyxNQUFNLEVBQUUsTUFBTTtJQUNkLE1BQU0sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0QyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLENBQUMsRUFDRCxVQUFDLE1BQU0sRUFBRSxNQUFNO0lBQ2QsVUFBVSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdkIsQ0FBQyxDQUNELENBQUM7QUFFRixVQUFVLENBQ1QsTUFBTSxFQUNOLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxFQUMvQixVQUFDLE1BQU0sRUFBRSxNQUFNO0lBQ2QsTUFBTSxDQUFDLHFCQUFxQixHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbkQsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN0QixDQUFDLEVBQ0QsVUFBQyxNQUFNLEVBQUUsTUFBTTtJQUNkLFVBQVUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pELFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdkIsQ0FBQyxDQUNELENBQUM7QUFFRixVQUFVLENBQ1QsTUFBTSxFQUNOLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFDbkIsVUFBQyxNQUFNLEVBQUUsTUFBTTtJQUNkLElBQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNqQyxNQUFNLENBQUMsU0FBUyxHQUFHO1FBQ2xCLFlBQVksRUFBRSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ2xDLFNBQVMsRUFBRSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQy9CLFFBQVEsRUFBRSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0tBQzlCLENBQUM7SUFFRixJQUFJLEtBQUssR0FBRyxJQUFJO1FBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ3JELENBQUMsRUFDRCxVQUFDLE1BQU0sRUFBRSxNQUFNO0lBQ2QsSUFBTSxLQUFLLEdBQ1YsQ0FBQyxNQUFNLENBQUMsU0FBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0MsQ0FBQyxNQUFNLENBQUMsU0FBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFD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eEMsT0FBTyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUU7UUFDbEIsTUFBTSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUMzRDtBQUNGLENBQUMsRUFDRCxVQUFDLE1BQU0sRUFBRSxNQUFNO0lBQ2QsS0FBc0IsVUFBbUMsRUFBbkMsS0FBQSxNQUFNLENBQUMsMkJBQTRCLEVBQW5DLGNBQW1DLEVBQW5DLElBQW1DLEVBQUU7UUFBdEQsSUFBTSxPQUFPLFNBQUE7UUFDakIsVUFBVSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztLQUM1QjtBQUNGLENBQUMsQ0FDRCxDQUFDO0FBRUYsVUFBVSxDQUNULE1BQU0sRUFDTixNQUFNLENBQUMseUJBQXlCLENBQUMsRUFDakMsVUFBQyxNQUFNLEVBQUUsTUFBTTtJQUNkLE1BQU0sQ0FBQyx1QkFBdUIsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3JELFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdEIsQ0FBQyxFQUNELFVBQUMsTUFBTSxFQUFFLE1BQU07SUFDZCxVQUFVLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRCxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FDRCxDQUFDIiwiZmlsZSI6ImFkZGl0aW9uYWxJbmZvLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZnJvbUJ5dGVBcnJheSwgdG9CeXRlQXJyYXkgfSBmcm9tICdiYXNlNjQtanMnO1xuaW1wb3J0IHsgcmVhZEVmZmVjdHMsIHdyaXRlRWZmZWN0cyB9IGZyb20gJy4vZWZmZWN0c0hlbHBlcnMnO1xuaW1wb3J0IHsgY2xhbXAsIGNyZWF0ZUVudW0sIGxheWVyQ29sb3JzLCBNT0NLX0hBTkRMRVJTIH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7XG5cdExheWVyQWRkaXRpb25hbEluZm8sIEJlemllclBhdGgsIFBzZCwgUmVhZE9wdGlvbnMsIEJyaWdodG5lc3NBZGp1c3RtZW50LCBFeHBvc3VyZUFkanVzdG1lbnQsIFZpYnJhbmNlQWRqdXN0bWVudCxcblx0Q29sb3JCYWxhbmNlQWRqdXN0bWVudCwgQmxhY2tBbmRXaGl0ZUFkanVzdG1lbnQsIFBob3RvRmlsdGVyQWRqdXN0bWVudCwgQ2hhbm5lbE1peGVyQ2hhbm5lbCxcblx0Q2hhbm5lbE1peGVyQWRqdXN0bWVudCwgUG9zdGVyaXplQWRqdXN0bWVudCwgVGhyZXNob2xkQWRqdXN0bWVudCwgR3JhZGllbnRNYXBBZGp1c3RtZW50LCBDTVlLLFxuXHRTZWxlY3RpdmVDb2xvckFkanVzdG1lbnQsIENvbG9yTG9va3VwQWRqdXN0bWVudCwgTGV2ZWxzQWRqdXN0bWVudENoYW5uZWwsIExldmVsc0FkanVzdG1lbnQsXG5cdEN1cnZlc0FkanVzdG1lbnQsIEN1cnZlc0FkanVzdG1lbnRDaGFubmVsLCBIdWVTYXR1cmF0aW9uQWRqdXN0bWVudCwgSHVlU2F0dXJhdGlvbkFkanVzdG1lbnRDaGFubmVsLFxuXHRQcmVzZXRJbmZvLCBDb2xvciwgQ29sb3JCYWxhbmNlVmFsdWVzLCBXcml0ZU9wdGlvbnMsIExpbmtlZEZpbGUsIFBsYWNlZExheWVyVHlwZSwgV2FycCwgS2V5RGVzY3JpcHRvckl0ZW0sXG5cdEJvb2xlYW5PcGVyYXRpb24sIExheWVyRWZmZWN0c0luZm8sIEFubm90YXRpb24sIExheWVyVmVjdG9yTWFzaywgQW5pbWF0aW9uRnJhbWUsIFRpbWVsaW5lLFxufSBmcm9tICcuL3BzZCc7XG5pbXBvcnQge1xuXHRQc2RSZWFkZXIsIHJlYWRTaWduYXR1cmUsIHJlYWRVbmljb2RlU3RyaW5nLCBza2lwQnl0ZXMsIHJlYWRVaW50MzIsIHJlYWRVaW50OCwgcmVhZEZsb2F0NjQsIHJlYWRVaW50MTYsXG5cdHJlYWRCeXRlcywgcmVhZEludDE2LCBjaGVja1NpZ25hdHVyZSwgcmVhZEZsb2F0MzIsIHJlYWRGaXhlZFBvaW50UGF0aDMyLCByZWFkU2VjdGlvbiwgcmVhZENvbG9yLCByZWFkSW50MzIsXG5cdHJlYWRQYXNjYWxTdHJpbmcsIHJlYWRVbmljb2RlU3RyaW5nV2l0aExlbmd0aCwgcmVhZEFzY2lpU3RyaW5nLCByZWFkUGF0dGVybixcbn0gZnJvbSAnLi9wc2RSZWFkZXInO1xuaW1wb3J0IHtcblx0UHNkV3JpdGVyLCB3cml0ZVplcm9zLCB3cml0ZVNpZ25hdHVyZSwgd3JpdGVCeXRlcywgd3JpdGVVaW50MzIsIHdyaXRlVWludDE2LCB3cml0ZUZsb2F0NjQsIHdyaXRlVWludDgsXG5cdHdyaXRlSW50MTYsIHdyaXRlRmxvYXQzMiwgd3JpdGVGaXhlZFBvaW50UGF0aDMyLCB3cml0ZVVuaWNvZGVTdHJpbmcsIHdyaXRlU2VjdGlvbiwgd3JpdGVVbmljb2RlU3RyaW5nV2l0aFBhZGRpbmcsXG5cdHdyaXRlQ29sb3IsIHdyaXRlUGFzY2FsU3RyaW5nLCB3cml0ZUludDMyLFxufSBmcm9tICcuL3BzZFdyaXRlcic7XG5pbXBvcnQge1xuXHRBbm50LCBCbG5NLCBEZXNjcmlwdG9yQ29sb3IsIERlc2NyaXB0b3JVbml0c1ZhbHVlLCBwYXJzZVBlcmNlbnQsIHBhcnNlVW5pdHMsIHBhcnNlVW5pdHNPck51bWJlciwgUXVpbHRXYXJwRGVzY3JpcHRvcixcblx0c3Ryb2tlU3R5bGVMaW5lQWxpZ25tZW50LCBzdHJva2VTdHlsZUxpbmVDYXBUeXBlLCBzdHJva2VTdHlsZUxpbmVKb2luVHlwZSwgVGV4dERlc2NyaXB0b3IsIHRleHRHcmlkZGluZyxcblx0dW5pdHNQZXJjZW50LCB1bml0c1ZhbHVlLCBXYXJwRGVzY3JpcHRvciwgd2FycFN0eWxlLCB3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yLFxuXHRyZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IsIFN0cm9rZURlc2NyaXB0b3IsIE9ybnQsIGhvcnpWcnRjVG9YWSwgTG1meERlc2NyaXB0b3IsIExmeDJEZXNjcmlwdG9yLFxuXHRGcmFtZUxpc3REZXNjcmlwdG9yLCBUaW1lbGluZURlc2NyaXB0b3IsIEZyYW1lRGVzY3JpcHRvciwgeHlUb0hvcnpWcnRjLCBzZXJpYWxpemVFZmZlY3RzLFxuXHRwYXJzZUVmZmVjdHMsIHBhcnNlQ29sb3IsIHNlcmlhbGl6ZUNvbG9yLCBzZXJpYWxpemVWZWN0b3JDb250ZW50LCBwYXJzZVZlY3RvckNvbnRlbnQsIHBhcnNlVHJhY2tMaXN0LCBzZXJpYWxpemVUcmFja0xpc3QsIEZyYWN0aW9uRGVzY3JpcHRvcixcbn0gZnJvbSAnLi9kZXNjcmlwdG9yJztcbmltcG9ydCB7IHNlcmlhbGl6ZUVuZ2luZURhdGEsIHBhcnNlRW5naW5lRGF0YSB9IGZyb20gJy4vZW5naW5lRGF0YSc7XG5pbXBvcnQgeyBlbmNvZGVFbmdpbmVEYXRhLCBkZWNvZGVFbmdpbmVEYXRhIH0gZnJvbSAnLi90ZXh0JztcblxuZXhwb3J0IGludGVyZmFjZSBFeHRlbmRlZFdyaXRlT3B0aW9ucyBleHRlbmRzIFdyaXRlT3B0aW9ucyB7XG5cdGxheWVySWRzOiBTZXQ8bnVtYmVyPjtcblx0bGF5ZXJUb0lkOiBNYXA8YW55LCBudW1iZXI+O1xufVxuXG50eXBlIEhhc01ldGhvZCA9ICh0YXJnZXQ6IExheWVyQWRkaXRpb25hbEluZm8pID0+IGJvb2xlYW47XG50eXBlIFJlYWRNZXRob2QgPSAocmVhZGVyOiBQc2RSZWFkZXIsIHRhcmdldDogTGF5ZXJBZGRpdGlvbmFsSW5mbywgbGVmdDogKCkgPT4gbnVtYmVyLCBwc2Q6IFBzZCwgb3B0aW9uczogUmVhZE9wdGlvbnMpID0+IHZvaWQ7XG50eXBlIFdyaXRlTWV0aG9kID0gKHdyaXRlcjogUHNkV3JpdGVyLCB0YXJnZXQ6IExheWVyQWRkaXRpb25hbEluZm8sIHBzZDogUHNkLCBvcHRpb25zOiBFeHRlbmRlZFdyaXRlT3B0aW9ucykgPT4gdm9pZDtcblxuZXhwb3J0IGludGVyZmFjZSBJbmZvSGFuZGxlciB7XG5cdGtleTogc3RyaW5nO1xuXHRoYXM6IEhhc01ldGhvZDtcblx0cmVhZDogUmVhZE1ldGhvZDtcblx0d3JpdGU6IFdyaXRlTWV0aG9kO1xufVxuXG5leHBvcnQgY29uc3QgaW5mb0hhbmRsZXJzOiBJbmZvSGFuZGxlcltdID0gW107XG5leHBvcnQgY29uc3QgaW5mb0hhbmRsZXJzTWFwOiB7IFtrZXk6IHN0cmluZ106IEluZm9IYW5kbGVyOyB9ID0ge307XG5cbmZ1bmN0aW9uIGFkZEhhbmRsZXIoa2V5OiBzdHJpbmcsIGhhczogSGFzTWV0aG9kLCByZWFkOiBSZWFkTWV0aG9kLCB3cml0ZTogV3JpdGVNZXRob2QpIHtcblx0Y29uc3QgaGFuZGxlcjogSW5mb0hhbmRsZXIgPSB7IGtleSwgaGFzLCByZWFkLCB3cml0ZSB9O1xuXHRpbmZvSGFuZGxlcnMucHVzaChoYW5kbGVyKTtcblx0aW5mb0hhbmRsZXJzTWFwW2hhbmRsZXIua2V5XSA9IGhhbmRsZXI7XG59XG5cbmZ1bmN0aW9uIGFkZEhhbmRsZXJBbGlhcyhrZXk6IHN0cmluZywgdGFyZ2V0OiBzdHJpbmcpIHtcblx0aW5mb0hhbmRsZXJzTWFwW2tleV0gPSBpbmZvSGFuZGxlcnNNYXBbdGFyZ2V0XTtcbn1cblxuZnVuY3Rpb24gaGFzS2V5KGtleToga2V5b2YgTGF5ZXJBZGRpdGlvbmFsSW5mbykge1xuXHRyZXR1cm4gKHRhcmdldDogTGF5ZXJBZGRpdGlvbmFsSW5mbykgPT4gdGFyZ2V0W2tleV0gIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gcmVhZExlbmd0aDY0KHJlYWRlcjogUHNkUmVhZGVyKSB7XG5cdGlmIChyZWFkVWludDMyKHJlYWRlcikpIHRocm93IG5ldyBFcnJvcihgUmVzb3VyY2Ugc2l6ZSBhYm92ZSA0IEdCIGxpbWl0IGF0ICR7cmVhZGVyLm9mZnNldC50b1N0cmluZygxNil9YCk7XG5cdHJldHVybiByZWFkVWludDMyKHJlYWRlcik7XG59XG5cbmZ1bmN0aW9uIHdyaXRlTGVuZ3RoNjQod3JpdGVyOiBQc2RXcml0ZXIsIGxlbmd0aDogbnVtYmVyKSB7XG5cdHdyaXRlVWludDMyKHdyaXRlciwgMCk7XG5cdHdyaXRlVWludDMyKHdyaXRlciwgbGVuZ3RoKTtcbn1cblxuYWRkSGFuZGxlcihcblx0J1R5U2gnLFxuXHRoYXNLZXkoJ3RleHQnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0Qnl0ZXMpID0+IHtcblx0XHRpZiAocmVhZEludDE2KHJlYWRlcikgIT09IDEpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBUeVNoIHZlcnNpb25gKTtcblxuXHRcdGNvbnN0IHRyYW5zZm9ybTogbnVtYmVyW10gPSBbXTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDY7IGkrKykgdHJhbnNmb3JtLnB1c2gocmVhZEZsb2F0NjQocmVhZGVyKSk7XG5cblx0XHRpZiAocmVhZEludDE2KHJlYWRlcikgIT09IDUwKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgVHlTaCB0ZXh0IHZlcnNpb25gKTtcblx0XHRjb25zdCB0ZXh0OiBUZXh0RGVzY3JpcHRvciA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpO1xuXG5cdFx0aWYgKHJlYWRJbnQxNihyZWFkZXIpICE9PSAxKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgVHlTaCB3YXJwIHZlcnNpb25gKTtcblx0XHRjb25zdCB3YXJwOiBXYXJwRGVzY3JpcHRvciA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpO1xuXG5cdFx0dGFyZ2V0LnRleHQgPSB7XG5cdFx0XHR0cmFuc2Zvcm0sXG5cdFx0XHRsZWZ0OiByZWFkRmxvYXQzMihyZWFkZXIpLFxuXHRcdFx0dG9wOiByZWFkRmxvYXQzMihyZWFkZXIpLFxuXHRcdFx0cmlnaHQ6IHJlYWRGbG9hdDMyKHJlYWRlciksXG5cdFx0XHRib3R0b206IHJlYWRGbG9hdDMyKHJlYWRlciksXG5cdFx0XHR0ZXh0OiB0ZXh0WydUeHQgJ10ucmVwbGFjZSgvXFxyL2csICdcXG4nKSxcblx0XHRcdGluZGV4OiB0ZXh0LlRleHRJbmRleCB8fCAwLFxuXHRcdFx0Z3JpZGRpbmc6IHRleHRHcmlkZGluZy5kZWNvZGUodGV4dC50ZXh0R3JpZGRpbmcpLFxuXHRcdFx0YW50aUFsaWFzOiBBbm50LmRlY29kZSh0ZXh0LkFudEEpLFxuXHRcdFx0b3JpZW50YXRpb246IE9ybnQuZGVjb2RlKHRleHQuT3JudCksXG5cdFx0XHR3YXJwOiB7XG5cdFx0XHRcdHN0eWxlOiB3YXJwU3R5bGUuZGVjb2RlKHdhcnAud2FycFN0eWxlKSxcblx0XHRcdFx0dmFsdWU6IHdhcnAud2FycFZhbHVlIHx8IDAsXG5cdFx0XHRcdHBlcnNwZWN0aXZlOiB3YXJwLndhcnBQZXJzcGVjdGl2ZSB8fCAwLFxuXHRcdFx0XHRwZXJzcGVjdGl2ZU90aGVyOiB3YXJwLndhcnBQZXJzcGVjdGl2ZU90aGVyIHx8IDAsXG5cdFx0XHRcdHJvdGF0ZTogT3JudC5kZWNvZGUod2FycC53YXJwUm90YXRlKSxcblx0XHRcdH0sXG5cdFx0fTtcblxuXHRcdGlmICh0ZXh0LkVuZ2luZURhdGEpIHtcblx0XHRcdGNvbnN0IGVuZ2luZURhdGEgPSBkZWNvZGVFbmdpbmVEYXRhKHBhcnNlRW5naW5lRGF0YSh0ZXh0LkVuZ2luZURhdGEpKTtcblxuXHRcdFx0Ly8gY29uc3QgYmVmb3JlID0gcGFyc2VFbmdpbmVEYXRhKHRleHQuRW5naW5lRGF0YSk7XG5cdFx0XHQvLyBjb25zdCBhZnRlciA9IGVuY29kZUVuZ2luZURhdGEoZW5naW5lRGF0YSk7XG5cdFx0XHQvLyByZXF1aXJlKCdmcycpLndyaXRlRmlsZVN5bmMoJ2JlZm9yZS50eHQnLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChiZWZvcmUsIGZhbHNlLCA5OSwgZmFsc2UpLCAndXRmOCcpO1xuXHRcdFx0Ly8gcmVxdWlyZSgnZnMnKS53cml0ZUZpbGVTeW5jKCdhZnRlci50eHQnLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChhZnRlciwgZmFsc2UsIDk5LCBmYWxzZSksICd1dGY4Jyk7XG5cblx0XHRcdC8vIGNvbnNvbGUubG9nKHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KHBhcnNlRW5naW5lRGF0YSh0ZXh0LkVuZ2luZURhdGEpLCBmYWxzZSwgOTksIHRydWUpKTtcblx0XHRcdHRhcmdldC50ZXh0ID0geyAuLi50YXJnZXQudGV4dCwgLi4uZW5naW5lRGF0YSB9O1xuXHRcdFx0Ly8gY29uc29sZS5sb2cocmVxdWlyZSgndXRpbCcpLmluc3BlY3QodGFyZ2V0LnRleHQsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXHRcdH1cblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnRCeXRlcygpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgdGV4dCA9IHRhcmdldC50ZXh0ITtcblx0XHRjb25zdCB3YXJwID0gdGV4dC53YXJwIHx8IHt9O1xuXHRcdGNvbnN0IHRyYW5zZm9ybSA9IHRleHQudHJhbnNmb3JtIHx8IFsxLCAwLCAwLCAxLCAwLCAwXTtcblxuXHRcdGNvbnN0IHRleHREZXNjcmlwdG9yOiBUZXh0RGVzY3JpcHRvciA9IHtcblx0XHRcdCdUeHQgJzogKHRleHQudGV4dCB8fCAnJykucmVwbGFjZSgvXFxyP1xcbi9nLCAnXFxyJyksXG5cdFx0XHR0ZXh0R3JpZGRpbmc6IHRleHRHcmlkZGluZy5lbmNvZGUodGV4dC5ncmlkZGluZyksXG5cdFx0XHRPcm50OiBPcm50LmVuY29kZSh0ZXh0Lm9yaWVudGF0aW9uKSxcblx0XHRcdEFudEE6IEFubnQuZW5jb2RlKHRleHQuYW50aUFsaWFzKSxcblx0XHRcdFRleHRJbmRleDogdGV4dC5pbmRleCB8fCAwLFxuXHRcdFx0RW5naW5lRGF0YTogc2VyaWFsaXplRW5naW5lRGF0YShlbmNvZGVFbmdpbmVEYXRhKHRleHQpKSxcblx0XHR9O1xuXG5cdFx0d3JpdGVJbnQxNih3cml0ZXIsIDEpOyAvLyB2ZXJzaW9uXG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDY7IGkrKykge1xuXHRcdFx0d3JpdGVGbG9hdDY0KHdyaXRlciwgdHJhbnNmb3JtW2ldKTtcblx0XHR9XG5cblx0XHR3cml0ZUludDE2KHdyaXRlciwgNTApOyAvLyB0ZXh0IHZlcnNpb25cblx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdUeExyJywgdGV4dERlc2NyaXB0b3IpO1xuXG5cdFx0d3JpdGVJbnQxNih3cml0ZXIsIDEpOyAvLyB3YXJwIHZlcnNpb25cblx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICd3YXJwJywgZW5jb2RlV2FycCh3YXJwKSk7XG5cblx0XHR3cml0ZUZsb2F0MzIod3JpdGVyLCB0ZXh0LmxlZnQhKTtcblx0XHR3cml0ZUZsb2F0MzIod3JpdGVyLCB0ZXh0LnRvcCEpO1xuXHRcdHdyaXRlRmxvYXQzMih3cml0ZXIsIHRleHQucmlnaHQhKTtcblx0XHR3cml0ZUZsb2F0MzIod3JpdGVyLCB0ZXh0LmJvdHRvbSEpO1xuXG5cdFx0Ly8gd3JpdGVaZXJvcyh3cml0ZXIsIDIpO1xuXHR9LFxuKTtcblxuLy8gdmVjdG9yIGZpbGxzXG5cbmFkZEhhbmRsZXIoXG5cdCdTb0NvJyxcblx0dGFyZ2V0ID0+IHRhcmdldC52ZWN0b3JGaWxsICE9PSB1bmRlZmluZWQgJiYgdGFyZ2V0LnZlY3RvclN0cm9rZSA9PT0gdW5kZWZpbmVkICYmXG5cdFx0dGFyZ2V0LnZlY3RvckZpbGwudHlwZSA9PT0gJ2NvbG9yJyxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgZGVzY3JpcHRvciA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpO1xuXHRcdHRhcmdldC52ZWN0b3JGaWxsID0gcGFyc2VWZWN0b3JDb250ZW50KGRlc2NyaXB0b3IpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCB7IGRlc2NyaXB0b3IgfSA9IHNlcmlhbGl6ZVZlY3RvckNvbnRlbnQodGFyZ2V0LnZlY3RvckZpbGwhKTtcblx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdudWxsJywgZGVzY3JpcHRvcik7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnR2RGbCcsXG5cdHRhcmdldCA9PiB0YXJnZXQudmVjdG9yRmlsbCAhPT0gdW5kZWZpbmVkICYmIHRhcmdldC52ZWN0b3JTdHJva2UgPT09IHVuZGVmaW5lZCAmJlxuXHRcdCh0YXJnZXQudmVjdG9yRmlsbC50eXBlID09PSAnc29saWQnIHx8IHRhcmdldC52ZWN0b3JGaWxsLnR5cGUgPT09ICdub2lzZScpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRjb25zdCBkZXNjcmlwdG9yID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcik7XG5cdFx0dGFyZ2V0LnZlY3RvckZpbGwgPSBwYXJzZVZlY3RvckNvbnRlbnQoZGVzY3JpcHRvcik7XG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgeyBkZXNjcmlwdG9yIH0gPSBzZXJpYWxpemVWZWN0b3JDb250ZW50KHRhcmdldC52ZWN0b3JGaWxsISk7XG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2NyaXB0b3IpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J1B0RmwnLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LnZlY3RvckZpbGwgIT09IHVuZGVmaW5lZCAmJiB0YXJnZXQudmVjdG9yU3Ryb2tlID09PSB1bmRlZmluZWQgJiZcblx0XHR0YXJnZXQudmVjdG9yRmlsbC50eXBlID09PSAncGF0dGVybicsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGRlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHR0YXJnZXQudmVjdG9yRmlsbCA9IHBhcnNlVmVjdG9yQ29udGVudChkZXNjcmlwdG9yKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgeyBkZXNjcmlwdG9yIH0gPSBzZXJpYWxpemVWZWN0b3JDb250ZW50KHRhcmdldC52ZWN0b3JGaWxsISk7XG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2NyaXB0b3IpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J3ZzY2cnLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LnZlY3RvckZpbGwgIT09IHVuZGVmaW5lZCAmJiB0YXJnZXQudmVjdG9yU3Ryb2tlICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdHJlYWRTaWduYXR1cmUocmVhZGVyKTsgLy8ga2V5XG5cdFx0Y29uc3QgZGVzYyA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpO1xuXHRcdHRhcmdldC52ZWN0b3JGaWxsID0gcGFyc2VWZWN0b3JDb250ZW50KGRlc2MpO1xuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IHsgZGVzY3JpcHRvciwga2V5IH0gPSBzZXJpYWxpemVWZWN0b3JDb250ZW50KHRhcmdldC52ZWN0b3JGaWxsISk7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCBrZXkpO1xuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCBkZXNjcmlwdG9yKTtcblx0fSxcbik7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkQmV6aWVyS25vdChyZWFkZXI6IFBzZFJlYWRlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpIHtcblx0Y29uc3QgeTAgPSByZWFkRml4ZWRQb2ludFBhdGgzMihyZWFkZXIpICogaGVpZ2h0O1xuXHRjb25zdCB4MCA9IHJlYWRGaXhlZFBvaW50UGF0aDMyKHJlYWRlcikgKiB3aWR0aDtcblx0Y29uc3QgeTEgPSByZWFkRml4ZWRQb2ludFBhdGgzMihyZWFkZXIpICogaGVpZ2h0O1xuXHRjb25zdCB4MSA9IHJlYWRGaXhlZFBvaW50UGF0aDMyKHJlYWRlcikgKiB3aWR0aDtcblx0Y29uc3QgeTIgPSByZWFkRml4ZWRQb2ludFBhdGgzMihyZWFkZXIpICogaGVpZ2h0O1xuXHRjb25zdCB4MiA9IHJlYWRGaXhlZFBvaW50UGF0aDMyKHJlYWRlcikgKiB3aWR0aDtcblx0cmV0dXJuIFt4MCwgeTAsIHgxLCB5MSwgeDIsIHkyXTtcbn1cblxuZnVuY3Rpb24gd3JpdGVCZXppZXJLbm90KHdyaXRlcjogUHNkV3JpdGVyLCBwb2ludHM6IG51bWJlcltdLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuXHR3cml0ZUZpeGVkUG9pbnRQYXRoMzIod3JpdGVyLCBwb2ludHNbMV0gLyBoZWlnaHQpOyAvLyB5MFxuXHR3cml0ZUZpeGVkUG9pbnRQYXRoMzIod3JpdGVyLCBwb2ludHNbMF0gLyB3aWR0aCk7IC8vIHgwXG5cdHdyaXRlRml4ZWRQb2ludFBhdGgzMih3cml0ZXIsIHBvaW50c1szXSAvIGhlaWdodCk7IC8vIHkxXG5cdHdyaXRlRml4ZWRQb2ludFBhdGgzMih3cml0ZXIsIHBvaW50c1syXSAvIHdpZHRoKTsgLy8geDFcblx0d3JpdGVGaXhlZFBvaW50UGF0aDMyKHdyaXRlciwgcG9pbnRzWzVdIC8gaGVpZ2h0KTsgLy8geTJcblx0d3JpdGVGaXhlZFBvaW50UGF0aDMyKHdyaXRlciwgcG9pbnRzWzRdIC8gd2lkdGgpOyAvLyB4MlxufVxuXG5leHBvcnQgY29uc3QgYm9vbGVhbk9wZXJhdGlvbnM6IEJvb2xlYW5PcGVyYXRpb25bXSA9IFsnZXhjbHVkZScsICdjb21iaW5lJywgJ3N1YnRyYWN0JywgJ2ludGVyc2VjdCddO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFZlY3Rvck1hc2socmVhZGVyOiBQc2RSZWFkZXIsIHZlY3Rvck1hc2s6IExheWVyVmVjdG9yTWFzaywgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIHNpemU6IG51bWJlcikge1xuXHRjb25zdCBlbmQgPSByZWFkZXIub2Zmc2V0ICsgc2l6ZTtcblx0Y29uc3QgcGF0aHMgPSB2ZWN0b3JNYXNrLnBhdGhzO1xuXHRsZXQgcGF0aDogQmV6aWVyUGF0aCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuXHR3aGlsZSAoKGVuZCAtIHJlYWRlci5vZmZzZXQpID49IDI2KSB7XG5cdFx0Y29uc3Qgc2VsZWN0b3IgPSByZWFkVWludDE2KHJlYWRlcik7XG5cblx0XHRzd2l0Y2ggKHNlbGVjdG9yKSB7XG5cdFx0XHRjYXNlIDA6IC8vIENsb3NlZCBzdWJwYXRoIGxlbmd0aCByZWNvcmRcblx0XHRcdGNhc2UgMzogeyAvLyBPcGVuIHN1YnBhdGggbGVuZ3RoIHJlY29yZFxuXHRcdFx0XHRyZWFkVWludDE2KHJlYWRlcik7IC8vIGNvdW50XG5cdFx0XHRcdGNvbnN0IGJvb2xPcCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRcdFx0XHRyZWFkVWludDE2KHJlYWRlcik7IC8vIGFsd2F5cyAxID9cblx0XHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgMTgpO1xuXHRcdFx0XHQvLyBUT0RPOiAnY29tYmluZScgaGVyZSBtaWdodCBiZSB3cm9uZ1xuXHRcdFx0XHRwYXRoID0geyBvcGVuOiBzZWxlY3RvciA9PT0gMywgb3BlcmF0aW9uOiBib29sT3AgPT09IC0xID8gJ2NvbWJpbmUnIDogYm9vbGVhbk9wZXJhdGlvbnNbYm9vbE9wXSwga25vdHM6IFtdIH07XG5cdFx0XHRcdHBhdGhzLnB1c2gocGF0aCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0Y2FzZSAxOiAvLyBDbG9zZWQgc3VicGF0aCBCZXppZXIga25vdCwgbGlua2VkXG5cdFx0XHRjYXNlIDI6IC8vIENsb3NlZCBzdWJwYXRoIEJlemllciBrbm90LCB1bmxpbmtlZFxuXHRcdFx0Y2FzZSA0OiAvLyBPcGVuIHN1YnBhdGggQmV6aWVyIGtub3QsIGxpbmtlZFxuXHRcdFx0Y2FzZSA1OiAvLyBPcGVuIHN1YnBhdGggQmV6aWVyIGtub3QsIHVubGlua2VkXG5cdFx0XHRcdHBhdGghLmtub3RzLnB1c2goeyBsaW5rZWQ6IChzZWxlY3RvciA9PT0gMSB8fCBzZWxlY3RvciA9PT0gNCksIHBvaW50czogcmVhZEJlemllcktub3QocmVhZGVyLCB3aWR0aCwgaGVpZ2h0KSB9KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIDY6IC8vIFBhdGggZmlsbCBydWxlIHJlY29yZFxuXHRcdFx0XHRza2lwQnl0ZXMocmVhZGVyLCAyNCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSA3OiB7IC8vIENsaXBib2FyZCByZWNvcmRcblx0XHRcdFx0Ly8gVE9ETzogY2hlY2sgaWYgdGhlc2UgbmVlZCB0byBiZSBtdWx0aXBsaWVkIGJ5IGRvY3VtZW50IHNpemVcblx0XHRcdFx0Y29uc3QgdG9wID0gcmVhZEZpeGVkUG9pbnRQYXRoMzIocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgbGVmdCA9IHJlYWRGaXhlZFBvaW50UGF0aDMyKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IGJvdHRvbSA9IHJlYWRGaXhlZFBvaW50UGF0aDMyKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHJpZ2h0ID0gcmVhZEZpeGVkUG9pbnRQYXRoMzIocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgcmVzb2x1dGlvbiA9IHJlYWRGaXhlZFBvaW50UGF0aDMyKHJlYWRlcik7XG5cdFx0XHRcdHNraXBCeXRlcyhyZWFkZXIsIDQpO1xuXHRcdFx0XHR2ZWN0b3JNYXNrLmNsaXBib2FyZCA9IHsgdG9wLCBsZWZ0LCBib3R0b20sIHJpZ2h0LCByZXNvbHV0aW9uIH07XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0Y2FzZSA4OiAvLyBJbml0aWFsIGZpbGwgcnVsZSByZWNvcmRcblx0XHRcdFx0dmVjdG9yTWFzay5maWxsU3RhcnRzV2l0aEFsbFBpeGVscyA9ICEhcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdFx0XHRza2lwQnl0ZXMocmVhZGVyLCAyMik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZtc2sgc2VjdGlvbicpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBwYXRocztcbn1cblxuYWRkSGFuZGxlcihcblx0J3Ztc2snLFxuXHRoYXNLZXkoJ3ZlY3Rvck1hc2snKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0LCB7IHdpZHRoLCBoZWlnaHQgfSkgPT4ge1xuXHRcdGlmIChyZWFkVWludDMyKHJlYWRlcikgIT09IDMpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2bXNrIHZlcnNpb24nKTtcblxuXHRcdHRhcmdldC52ZWN0b3JNYXNrID0geyBwYXRoczogW10gfTtcblx0XHRjb25zdCB2ZWN0b3JNYXNrID0gdGFyZ2V0LnZlY3Rvck1hc2s7XG5cblx0XHRjb25zdCBmbGFncyA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHR2ZWN0b3JNYXNrLmludmVydCA9IChmbGFncyAmIDEpICE9PSAwO1xuXHRcdHZlY3Rvck1hc2subm90TGluayA9IChmbGFncyAmIDIpICE9PSAwO1xuXHRcdHZlY3Rvck1hc2suZGlzYWJsZSA9IChmbGFncyAmIDQpICE9PSAwO1xuXG5cdFx0cmVhZFZlY3Rvck1hc2socmVhZGVyLCB2ZWN0b3JNYXNrLCB3aWR0aCwgaGVpZ2h0LCBsZWZ0KCkpO1xuXG5cdFx0Ly8gZHJhd0JlemllclBhdGhzKHZlY3Rvck1hc2sucGF0aHMsIHdpZHRoLCBoZWlnaHQsICdvdXQucG5nJyk7XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQsIHsgd2lkdGgsIGhlaWdodCB9KSA9PiB7XG5cdFx0Y29uc3QgdmVjdG9yTWFzayA9IHRhcmdldC52ZWN0b3JNYXNrITtcblx0XHRjb25zdCBmbGFncyA9XG5cdFx0XHQodmVjdG9yTWFzay5pbnZlcnQgPyAxIDogMCkgfFxuXHRcdFx0KHZlY3Rvck1hc2subm90TGluayA/IDIgOiAwKSB8XG5cdFx0XHQodmVjdG9yTWFzay5kaXNhYmxlID8gNCA6IDApO1xuXG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCAzKTsgLy8gdmVyc2lvblxuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgZmxhZ3MpO1xuXG5cdFx0Ly8gaW5pdGlhbCBlbnRyeVxuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgNik7XG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDI0KTtcblxuXHRcdGNvbnN0IGNsaXBib2FyZCA9IHZlY3Rvck1hc2suY2xpcGJvYXJkO1xuXHRcdGlmIChjbGlwYm9hcmQpIHtcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgNyk7XG5cdFx0XHR3cml0ZUZpeGVkUG9pbnRQYXRoMzIod3JpdGVyLCBjbGlwYm9hcmQudG9wKTtcblx0XHRcdHdyaXRlRml4ZWRQb2ludFBhdGgzMih3cml0ZXIsIGNsaXBib2FyZC5sZWZ0KTtcblx0XHRcdHdyaXRlRml4ZWRQb2ludFBhdGgzMih3cml0ZXIsIGNsaXBib2FyZC5ib3R0b20pO1xuXHRcdFx0d3JpdGVGaXhlZFBvaW50UGF0aDMyKHdyaXRlciwgY2xpcGJvYXJkLnJpZ2h0KTtcblx0XHRcdHdyaXRlRml4ZWRQb2ludFBhdGgzMih3cml0ZXIsIGNsaXBib2FyZC5yZXNvbHV0aW9uKTtcblx0XHRcdHdyaXRlWmVyb3Mod3JpdGVyLCA0KTtcblx0XHR9XG5cblx0XHRpZiAodmVjdG9yTWFzay5maWxsU3RhcnRzV2l0aEFsbFBpeGVscyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDgpO1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCB2ZWN0b3JNYXNrLmZpbGxTdGFydHNXaXRoQWxsUGl4ZWxzID8gMSA6IDApO1xuXHRcdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDIyKTtcblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IHBhdGggb2YgdmVjdG9yTWFzay5wYXRocykge1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBwYXRoLm9wZW4gPyAzIDogMCk7XG5cdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIHBhdGgua25vdHMubGVuZ3RoKTtcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5hYnMoYm9vbGVhbk9wZXJhdGlvbnMuaW5kZXhPZihwYXRoLm9wZXJhdGlvbikpKTsgLy8gZGVmYXVsdCB0byAxIGlmIG5vdCBmb3VuZFxuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCAxKTtcblx0XHRcdHdyaXRlWmVyb3Mod3JpdGVyLCAxOCk7IC8vIFRPRE86IHRoZXNlIGFyZSBzb21ldGltZXMgbm9uLXplcm9cblxuXHRcdFx0Y29uc3QgbGlua2VkS25vdCA9IHBhdGgub3BlbiA/IDQgOiAxO1xuXHRcdFx0Y29uc3QgdW5saW5rZWRLbm90ID0gcGF0aC5vcGVuID8gNSA6IDI7XG5cblx0XHRcdGZvciAoY29uc3QgeyBsaW5rZWQsIHBvaW50cyB9IG9mIHBhdGgua25vdHMpIHtcblx0XHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBsaW5rZWQgPyBsaW5rZWRLbm90IDogdW5saW5rZWRLbm90KTtcblx0XHRcdFx0d3JpdGVCZXppZXJLbm90KHdyaXRlciwgcG9pbnRzLCB3aWR0aCwgaGVpZ2h0KTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG4pO1xuXG4vLyBUT0RPOiBuZWVkIHRvIHdyaXRlIHZtc2sgaWYgaGFzIG91dGxpbmUgP1xuYWRkSGFuZGxlckFsaWFzKCd2c21zJywgJ3Ztc2snKTtcbi8vIGFkZEhhbmRsZXJBbGlhcygndm1zaycsICd2c21zJyk7XG5cbmludGVyZmFjZSBWb2drRGVzY3JpcHRvciB7XG5cdGtleURlc2NyaXB0b3JMaXN0OiB7XG5cdFx0a2V5U2hhcGVJbnZhbGlkYXRlZD86IGJvb2xlYW47XG5cdFx0a2V5T3JpZ2luVHlwZT86IG51bWJlcjtcblx0XHRrZXlPcmlnaW5SZXNvbHV0aW9uPzogbnVtYmVyO1xuXHRcdGtleU9yaWdpblJSZWN0UmFkaWk/OiB7XG5cdFx0XHR1bml0VmFsdWVRdWFkVmVyc2lvbjogbnVtYmVyO1xuXHRcdFx0dG9wUmlnaHQ6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xuXHRcdFx0dG9wTGVmdDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XG5cdFx0XHRib3R0b21MZWZ0OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcblx0XHRcdGJvdHRvbVJpZ2h0OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcblx0XHR9O1xuXHRcdGtleU9yaWdpblNoYXBlQkJveD86IHtcblx0XHRcdHVuaXRWYWx1ZVF1YWRWZXJzaW9uOiBudW1iZXI7XG5cdFx0XHQnVG9wICc6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xuXHRcdFx0TGVmdDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XG5cdFx0XHRCdG9tOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcblx0XHRcdFJnaHQ6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xuXHRcdH07XG5cdFx0a2V5T3JpZ2luQm94Q29ybmVycz86IHtcblx0XHRcdHJlY3RhbmdsZUNvcm5lckE6IHsgSHJ6bjogbnVtYmVyOyBWcnRjOiBudW1iZXI7IH07XG5cdFx0XHRyZWN0YW5nbGVDb3JuZXJCOiB7IEhyem46IG51bWJlcjsgVnJ0YzogbnVtYmVyOyB9O1xuXHRcdFx0cmVjdGFuZ2xlQ29ybmVyQzogeyBIcnpuOiBudW1iZXI7IFZydGM6IG51bWJlcjsgfTtcblx0XHRcdHJlY3RhbmdsZUNvcm5lckQ6IHsgSHJ6bjogbnVtYmVyOyBWcnRjOiBudW1iZXI7IH07XG5cdFx0fTtcblx0XHRUcm5mPzogeyB4eDogbnVtYmVyOyB4eTogbnVtYmVyOyB5eDogbnVtYmVyOyB5eTogbnVtYmVyOyB0eDogbnVtYmVyOyB0eTogbnVtYmVyOyB9LFxuXHRcdGtleU9yaWdpbkluZGV4OiBudW1iZXI7XG5cdH1bXTtcbn1cblxuYWRkSGFuZGxlcihcblx0J3ZvZ2snLFxuXHRoYXNLZXkoJ3ZlY3Rvck9yaWdpbmF0aW9uJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGlmIChyZWFkSW50MzIocmVhZGVyKSAhPT0gMSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZvZ2sgdmVyc2lvbmApO1xuXHRcdGNvbnN0IGRlc2MgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKSBhcyBWb2drRGVzY3JpcHRvcjtcblx0XHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblxuXHRcdHRhcmdldC52ZWN0b3JPcmlnaW5hdGlvbiA9IHsga2V5RGVzY3JpcHRvckxpc3Q6IFtdIH07XG5cblx0XHRmb3IgKGNvbnN0IGkgb2YgZGVzYy5rZXlEZXNjcmlwdG9yTGlzdCkge1xuXHRcdFx0Y29uc3QgaXRlbTogS2V5RGVzY3JpcHRvckl0ZW0gPSB7fTtcblxuXHRcdFx0aWYgKGkua2V5U2hhcGVJbnZhbGlkYXRlZCAhPSBudWxsKSBpdGVtLmtleVNoYXBlSW52YWxpZGF0ZWQgPSBpLmtleVNoYXBlSW52YWxpZGF0ZWQ7XG5cdFx0XHRpZiAoaS5rZXlPcmlnaW5UeXBlICE9IG51bGwpIGl0ZW0ua2V5T3JpZ2luVHlwZSA9IGkua2V5T3JpZ2luVHlwZTtcblx0XHRcdGlmIChpLmtleU9yaWdpblJlc29sdXRpb24gIT0gbnVsbCkgaXRlbS5rZXlPcmlnaW5SZXNvbHV0aW9uID0gaS5rZXlPcmlnaW5SZXNvbHV0aW9uO1xuXHRcdFx0aWYgKGkua2V5T3JpZ2luU2hhcGVCQm94KSB7XG5cdFx0XHRcdGl0ZW0ua2V5T3JpZ2luU2hhcGVCb3VuZGluZ0JveCA9IHtcblx0XHRcdFx0XHR0b3A6IHBhcnNlVW5pdHMoaS5rZXlPcmlnaW5TaGFwZUJCb3hbJ1RvcCAnXSksXG5cdFx0XHRcdFx0bGVmdDogcGFyc2VVbml0cyhpLmtleU9yaWdpblNoYXBlQkJveC5MZWZ0KSxcblx0XHRcdFx0XHRib3R0b206IHBhcnNlVW5pdHMoaS5rZXlPcmlnaW5TaGFwZUJCb3guQnRvbSksXG5cdFx0XHRcdFx0cmlnaHQ6IHBhcnNlVW5pdHMoaS5rZXlPcmlnaW5TaGFwZUJCb3guUmdodCksXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHRjb25zdCByZWN0UmFkaWkgPSBpLmtleU9yaWdpblJSZWN0UmFkaWk7XG5cdFx0XHRpZiAocmVjdFJhZGlpKSB7XG5cdFx0XHRcdGl0ZW0ua2V5T3JpZ2luUlJlY3RSYWRpaSA9IHtcblx0XHRcdFx0XHR0b3BSaWdodDogcGFyc2VVbml0cyhyZWN0UmFkaWkudG9wUmlnaHQpLFxuXHRcdFx0XHRcdHRvcExlZnQ6IHBhcnNlVW5pdHMocmVjdFJhZGlpLnRvcExlZnQpLFxuXHRcdFx0XHRcdGJvdHRvbUxlZnQ6IHBhcnNlVW5pdHMocmVjdFJhZGlpLmJvdHRvbUxlZnQpLFxuXHRcdFx0XHRcdGJvdHRvbVJpZ2h0OiBwYXJzZVVuaXRzKHJlY3RSYWRpaS5ib3R0b21SaWdodCksXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBjb3JuZXJzID0gaS5rZXlPcmlnaW5Cb3hDb3JuZXJzO1xuXHRcdFx0aWYgKGNvcm5lcnMpIHtcblx0XHRcdFx0aXRlbS5rZXlPcmlnaW5Cb3hDb3JuZXJzID0gW1xuXHRcdFx0XHRcdHsgeDogY29ybmVycy5yZWN0YW5nbGVDb3JuZXJBLkhyem4sIHk6IGNvcm5lcnMucmVjdGFuZ2xlQ29ybmVyQS5WcnRjIH0sXG5cdFx0XHRcdFx0eyB4OiBjb3JuZXJzLnJlY3RhbmdsZUNvcm5lckIuSHJ6biwgeTogY29ybmVycy5yZWN0YW5nbGVDb3JuZXJCLlZydGMgfSxcblx0XHRcdFx0XHR7IHg6IGNvcm5lcnMucmVjdGFuZ2xlQ29ybmVyQy5IcnpuLCB5OiBjb3JuZXJzLnJlY3RhbmdsZUNvcm5lckMuVnJ0YyB9LFxuXHRcdFx0XHRcdHsgeDogY29ybmVycy5yZWN0YW5nbGVDb3JuZXJELkhyem4sIHk6IGNvcm5lcnMucmVjdGFuZ2xlQ29ybmVyRC5WcnRjIH0sXG5cdFx0XHRcdF07XG5cdFx0XHR9XG5cdFx0XHRjb25zdCB0cm5mID0gaS5Ucm5mO1xuXHRcdFx0aWYgKHRybmYpIHtcblx0XHRcdFx0aXRlbS50cmFuc2Zvcm0gPSBbdHJuZi54eCwgdHJuZi54eSwgdHJuZi54eSwgdHJuZi55eSwgdHJuZi50eCwgdHJuZi50eV07XG5cdFx0XHR9XG5cblx0XHRcdHRhcmdldC52ZWN0b3JPcmlnaW5hdGlvbi5rZXlEZXNjcmlwdG9yTGlzdC5wdXNoKGl0ZW0pO1xuXHRcdH1cblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldDtcblx0XHRjb25zdCBvcmlnID0gdGFyZ2V0LnZlY3Rvck9yaWdpbmF0aW9uITtcblx0XHRjb25zdCBkZXNjOiBWb2drRGVzY3JpcHRvciA9IHsga2V5RGVzY3JpcHRvckxpc3Q6IFtdIH07XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG9yaWcua2V5RGVzY3JpcHRvckxpc3QubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IGl0ZW0gPSBvcmlnLmtleURlc2NyaXB0b3JMaXN0W2ldO1xuXG5cdFx0XHRpZiAoaXRlbS5rZXlTaGFwZUludmFsaWRhdGVkKSB7XG5cdFx0XHRcdGRlc2Mua2V5RGVzY3JpcHRvckxpc3QucHVzaCh7IGtleVNoYXBlSW52YWxpZGF0ZWQ6IHRydWUsIGtleU9yaWdpbkluZGV4OiBpIH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGVzYy5rZXlEZXNjcmlwdG9yTGlzdC5wdXNoKHt9IGFzIGFueSk7IC8vIHdlJ3JlIGFkZGluZyBrZXlPcmlnaW5JbmRleCBhdCB0aGUgZW5kXG5cblx0XHRcdFx0Y29uc3Qgb3V0ID0gZGVzYy5rZXlEZXNjcmlwdG9yTGlzdFtkZXNjLmtleURlc2NyaXB0b3JMaXN0Lmxlbmd0aCAtIDFdO1xuXG5cdFx0XHRcdGlmIChpdGVtLmtleU9yaWdpblR5cGUgIT0gbnVsbCkgb3V0LmtleU9yaWdpblR5cGUgPSBpdGVtLmtleU9yaWdpblR5cGU7XG5cdFx0XHRcdGlmIChpdGVtLmtleU9yaWdpblJlc29sdXRpb24gIT0gbnVsbCkgb3V0LmtleU9yaWdpblJlc29sdXRpb24gPSBpdGVtLmtleU9yaWdpblJlc29sdXRpb247XG5cblx0XHRcdFx0Y29uc3QgcmFkaWkgPSBpdGVtLmtleU9yaWdpblJSZWN0UmFkaWk7XG5cdFx0XHRcdGlmIChyYWRpaSkge1xuXHRcdFx0XHRcdG91dC5rZXlPcmlnaW5SUmVjdFJhZGlpID0ge1xuXHRcdFx0XHRcdFx0dW5pdFZhbHVlUXVhZFZlcnNpb246IDEsXG5cdFx0XHRcdFx0XHR0b3BSaWdodDogdW5pdHNWYWx1ZShyYWRpaS50b3BSaWdodCwgJ3RvcFJpZ2h0JyksXG5cdFx0XHRcdFx0XHR0b3BMZWZ0OiB1bml0c1ZhbHVlKHJhZGlpLnRvcExlZnQsICd0b3BMZWZ0JyksXG5cdFx0XHRcdFx0XHRib3R0b21MZWZ0OiB1bml0c1ZhbHVlKHJhZGlpLmJvdHRvbUxlZnQsICdib3R0b21MZWZ0JyksXG5cdFx0XHRcdFx0XHRib3R0b21SaWdodDogdW5pdHNWYWx1ZShyYWRpaS5ib3R0b21SaWdodCwgJ2JvdHRvbVJpZ2h0JyksXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGJveCA9IGl0ZW0ua2V5T3JpZ2luU2hhcGVCb3VuZGluZ0JveDtcblx0XHRcdFx0aWYgKGJveCkge1xuXHRcdFx0XHRcdG91dC5rZXlPcmlnaW5TaGFwZUJCb3ggPSB7XG5cdFx0XHRcdFx0XHR1bml0VmFsdWVRdWFkVmVyc2lvbjogMSxcblx0XHRcdFx0XHRcdCdUb3AgJzogdW5pdHNWYWx1ZShib3gudG9wLCAndG9wJyksXG5cdFx0XHRcdFx0XHRMZWZ0OiB1bml0c1ZhbHVlKGJveC5sZWZ0LCAnbGVmdCcpLFxuXHRcdFx0XHRcdFx0QnRvbTogdW5pdHNWYWx1ZShib3guYm90dG9tLCAnYm90dG9tJyksXG5cdFx0XHRcdFx0XHRSZ2h0OiB1bml0c1ZhbHVlKGJveC5yaWdodCwgJ3JpZ2h0JyksXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGNvcm5lcnMgPSBpdGVtLmtleU9yaWdpbkJveENvcm5lcnM7XG5cdFx0XHRcdGlmIChjb3JuZXJzICYmIGNvcm5lcnMubGVuZ3RoID09PSA0KSB7XG5cdFx0XHRcdFx0b3V0LmtleU9yaWdpbkJveENvcm5lcnMgPSB7XG5cdFx0XHRcdFx0XHRyZWN0YW5nbGVDb3JuZXJBOiB7IEhyem46IGNvcm5lcnNbMF0ueCwgVnJ0YzogY29ybmVyc1swXS55IH0sXG5cdFx0XHRcdFx0XHRyZWN0YW5nbGVDb3JuZXJCOiB7IEhyem46IGNvcm5lcnNbMV0ueCwgVnJ0YzogY29ybmVyc1sxXS55IH0sXG5cdFx0XHRcdFx0XHRyZWN0YW5nbGVDb3JuZXJDOiB7IEhyem46IGNvcm5lcnNbMl0ueCwgVnJ0YzogY29ybmVyc1syXS55IH0sXG5cdFx0XHRcdFx0XHRyZWN0YW5nbGVDb3JuZXJEOiB7IEhyem46IGNvcm5lcnNbM10ueCwgVnJ0YzogY29ybmVyc1szXS55IH0sXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHRyYW5zZm9ybSA9IGl0ZW0udHJhbnNmb3JtO1xuXHRcdFx0XHRpZiAodHJhbnNmb3JtICYmIHRyYW5zZm9ybS5sZW5ndGggPT09IDYpIHtcblx0XHRcdFx0XHRvdXQuVHJuZiA9IHtcblx0XHRcdFx0XHRcdHh4OiB0cmFuc2Zvcm1bMF0sXG5cdFx0XHRcdFx0XHR4eTogdHJhbnNmb3JtWzFdLFxuXHRcdFx0XHRcdFx0eXg6IHRyYW5zZm9ybVsyXSxcblx0XHRcdFx0XHRcdHl5OiB0cmFuc2Zvcm1bM10sXG5cdFx0XHRcdFx0XHR0eDogdHJhbnNmb3JtWzRdLFxuXHRcdFx0XHRcdFx0dHk6IHRyYW5zZm9ybVs1XSxcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0b3V0LmtleU9yaWdpbkluZGV4ID0gaTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR3cml0ZUludDMyKHdyaXRlciwgMSk7IC8vIHZlcnNpb25cblx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdudWxsJywgZGVzYyk7XG5cdH1cbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdsbWZ4Jyxcblx0dGFyZ2V0ID0+IHRhcmdldC5lZmZlY3RzICE9PSB1bmRlZmluZWQgJiYgaGFzTXVsdGlFZmZlY3RzKHRhcmdldC5lZmZlY3RzKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0LCBfLCBvcHRpb25zKSA9PiB7XG5cdFx0Y29uc3QgdmVyc2lvbiA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRpZiAodmVyc2lvbiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGxtZnggdmVyc2lvbicpO1xuXG5cdFx0Y29uc3QgZGVzYzogTG1meERlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChpbmZvLCBmYWxzZSwgOTksIHRydWUpKTtcblxuXHRcdC8vIGRpc2NhcmQgaWYgcmVhZCBpbiAnbHJGWCcgb3IgJ2xmeDInIHNlY3Rpb25cblx0XHR0YXJnZXQuZWZmZWN0cyA9IHBhcnNlRWZmZWN0cyhkZXNjLCAhIW9wdGlvbnMubG9nTWlzc2luZ0ZlYXR1cmVzKTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCwgXywgb3B0aW9ucykgPT4ge1xuXHRcdGNvbnN0IGRlc2MgPSBzZXJpYWxpemVFZmZlY3RzKHRhcmdldC5lZmZlY3RzISwgISFvcHRpb25zLmxvZ01pc3NpbmdGZWF0dXJlcywgdHJ1ZSk7XG5cblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDApOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J2xyRlgnLFxuXHRoYXNLZXkoJ2VmZmVjdHMnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0aWYgKCF0YXJnZXQuZWZmZWN0cykgdGFyZ2V0LmVmZmVjdHMgPSByZWFkRWZmZWN0cyhyZWFkZXIpO1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVFZmZlY3RzKHdyaXRlciwgdGFyZ2V0LmVmZmVjdHMhKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdsdW5pJyxcblx0aGFzS2V5KCduYW1lJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdHRhcmdldC5uYW1lID0gcmVhZFVuaWNvZGVTdHJpbmcocmVhZGVyKTtcblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZVVuaWNvZGVTdHJpbmcod3JpdGVyLCB0YXJnZXQubmFtZSEpO1xuXHRcdC8vIHdyaXRlVWludDE2KHdyaXRlciwgMCk7IC8vIHBhZGRpbmcgKGJ1dCBub3QgZXh0ZW5kaW5nIHN0cmluZyBsZW5ndGgpXG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnbG5zcicsXG5cdGhhc0tleSgnbmFtZVNvdXJjZScpLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHRhcmdldC5uYW1lU291cmNlID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpLFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgdGFyZ2V0Lm5hbWVTb3VyY2UhKSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdseWlkJyxcblx0aGFzS2V5KCdpZCcpLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHRhcmdldC5pZCA9IHJlYWRVaW50MzIocmVhZGVyKSxcblx0KHdyaXRlciwgdGFyZ2V0LCBfcHNkLCBvcHRpb25zKSA9PiB7XG5cdFx0bGV0IGlkID0gdGFyZ2V0LmlkITtcblx0XHR3aGlsZSAob3B0aW9ucy5sYXllcklkcy5oYXMoaWQpKSBpZCArPSAxMDA7IC8vIG1ha2Ugc3VyZSB3ZSBkb24ndCBoYXZlIGR1cGxpY2F0ZSBsYXllciBpZHNcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIGlkKTtcblx0XHRvcHRpb25zLmxheWVySWRzLmFkZChpZCk7XG5cdFx0b3B0aW9ucy5sYXllclRvSWQuc2V0KHRhcmdldCwgaWQpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J2xzY3QnLFxuXHRoYXNLZXkoJ3NlY3Rpb25EaXZpZGVyJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdHRhcmdldC5zZWN0aW9uRGl2aWRlciA9IHsgdHlwZTogcmVhZFVpbnQzMihyZWFkZXIpIH07XG5cblx0XHRpZiAobGVmdCgpKSB7XG5cdFx0XHRjaGVja1NpZ25hdHVyZShyZWFkZXIsICc4QklNJyk7XG5cdFx0XHR0YXJnZXQuc2VjdGlvbkRpdmlkZXIua2V5ID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xuXHRcdH1cblxuXHRcdGlmIChsZWZ0KCkpIHtcblx0XHRcdHRhcmdldC5zZWN0aW9uRGl2aWRlci5zdWJUeXBlID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdH1cblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCB0YXJnZXQuc2VjdGlvbkRpdmlkZXIhLnR5cGUpO1xuXG5cdFx0aWYgKHRhcmdldC5zZWN0aW9uRGl2aWRlciEua2V5KSB7XG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIHRhcmdldC5zZWN0aW9uRGl2aWRlciEua2V5KTtcblxuXHRcdFx0aWYgKHRhcmdldC5zZWN0aW9uRGl2aWRlciEuc3ViVHlwZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHdyaXRlVWludDMyKHdyaXRlciwgdGFyZ2V0LnNlY3Rpb25EaXZpZGVyIS5zdWJUeXBlKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG4pO1xuXG4vLyBpdCBzZWVtcyBsc2RrIGlzIHVzZWQgd2hlbiB0aGVyZSdzIGEgbGF5ZXIgaXMgbmVzdGVkIG1vcmUgdGhhbiA2IGxldmVscywgYnV0IEkgZG9uJ3Qga25vdyB3aHk/XG4vLyBtYXliZSBzb21lIGxpbWl0YXRpb24gb2Ygb2xkIHZlcnNpb24gb2YgUFM/XG5hZGRIYW5kbGVyQWxpYXMoJ2xzZGsnLCAnbHNjdCcpO1xuXG5hZGRIYW5kbGVyKFxuXHQnY2xibCcsXG5cdGhhc0tleSgnYmxlbmRDbGlwcGVuZEVsZW1lbnRzJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldC5ibGVuZENsaXBwZW5kRWxlbWVudHMgPSAhIXJlYWRVaW50OChyZWFkZXIpO1xuXHRcdHNraXBCeXRlcyhyZWFkZXIsIDMpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgdGFyZ2V0LmJsZW5kQ2xpcHBlbmRFbGVtZW50cyA/IDEgOiAwKTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnaW5meCcsXG5cdGhhc0tleSgnYmxlbmRJbnRlcmlvckVsZW1lbnRzJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldC5ibGVuZEludGVyaW9yRWxlbWVudHMgPSAhIXJlYWRVaW50OChyZWFkZXIpO1xuXHRcdHNraXBCeXRlcyhyZWFkZXIsIDMpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgdGFyZ2V0LmJsZW5kSW50ZXJpb3JFbGVtZW50cyA/IDEgOiAwKTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQna25rbycsXG5cdGhhc0tleSgna25vY2tvdXQnKSxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0dGFyZ2V0Lmtub2Nrb3V0ID0gISFyZWFkVWludDgocmVhZGVyKTtcblx0XHRza2lwQnl0ZXMocmVhZGVyLCAzKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIHRhcmdldC5rbm9ja291dCA/IDEgOiAwKTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnbG1nbScsXG5cdGhhc0tleSgnbGF5ZXJNYXNrQXNHbG9iYWxNYXNrJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldC5sYXllck1hc2tBc0dsb2JhbE1hc2sgPSAhIXJlYWRVaW50OChyZWFkZXIpO1xuXHRcdHNraXBCeXRlcyhyZWFkZXIsIDMpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgdGFyZ2V0LmxheWVyTWFza0FzR2xvYmFsTWFzayA/IDEgOiAwKTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnbHNwZicsXG5cdGhhc0tleSgncHJvdGVjdGVkJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGZsYWdzID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdHRhcmdldC5wcm90ZWN0ZWQgPSB7XG5cdFx0XHR0cmFuc3BhcmVuY3k6IChmbGFncyAmIDB4MDEpICE9PSAwLFxuXHRcdFx0Y29tcG9zaXRlOiAoZmxhZ3MgJiAweDAyKSAhPT0gMCxcblx0XHRcdHBvc2l0aW9uOiAoZmxhZ3MgJiAweDA0KSAhPT0gMCxcblx0XHR9O1xuXG5cdFx0aWYgKGZsYWdzICYgMHgwOCkgdGFyZ2V0LnByb3RlY3RlZC5hcnRib2FyZHMgPSB0cnVlO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBmbGFncyA9XG5cdFx0XHQodGFyZ2V0LnByb3RlY3RlZCEudHJhbnNwYXJlbmN5ID8gMHgwMSA6IDApIHxcblx0XHRcdCh0YXJnZXQucHJvdGVjdGVkIS5jb21wb3NpdGUgPyAweDAyIDogMCkgfFxuXHRcdFx0KHRhcmdldC5wcm90ZWN0ZWQhLnBvc2l0aW9uID8gMHgwNCA6IDApIHxcblx0XHRcdCh0YXJnZXQucHJvdGVjdGVkIS5hcnRib2FyZHMgPyAweDA4IDogMCk7XG5cblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIGZsYWdzKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdsY2xyJyxcblx0aGFzS2V5KCdsYXllckNvbG9yJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGNvbG9yID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdHNraXBCeXRlcyhyZWFkZXIsIDYpO1xuXHRcdHRhcmdldC5sYXllckNvbG9yID0gbGF5ZXJDb2xvcnNbY29sb3JdO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmRleCA9IGxheWVyQ29sb3JzLmluZGV4T2YodGFyZ2V0LmxheWVyQ29sb3IhKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZGV4ID09PSAtMSA/IDAgOiBpbmRleCk7XG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDYpO1xuXHR9LFxuKTtcblxuaW50ZXJmYWNlIEN1c3RvbURlc2NyaXB0b3Ige1xuXHRsYXllclRpbWU/OiBudW1iZXI7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdzaG1kJyxcblx0dGFyZ2V0ID0+IHRhcmdldC50aW1lc3RhbXAgIT09IHVuZGVmaW5lZCB8fCB0YXJnZXQuYW5pbWF0aW9uRnJhbWVzICE9PSB1bmRlZmluZWQgfHxcblx0XHR0YXJnZXQuYW5pbWF0aW9uRnJhbWVGbGFncyAhPT0gdW5kZWZpbmVkIHx8IHRhcmdldC50aW1lbGluZSAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQsIF8sIG9wdGlvbnMpID0+IHtcblx0XHRjb25zdCBjb3VudCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuXHRcdFx0Y2hlY2tTaWduYXR1cmUocmVhZGVyLCAnOEJJTScpO1xuXHRcdFx0Y29uc3Qga2V5ID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xuXHRcdFx0cmVhZFVpbnQ4KHJlYWRlcik7IC8vIGNvcHlcblx0XHRcdHNraXBCeXRlcyhyZWFkZXIsIDMpO1xuXG5cdFx0XHRyZWFkU2VjdGlvbihyZWFkZXIsIDEsIGxlZnQgPT4ge1xuXHRcdFx0XHRpZiAoa2V5ID09PSAnY3VzdCcpIHtcblx0XHRcdFx0XHRjb25zdCBkZXNjID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcikgYXMgQ3VzdG9tRGVzY3JpcHRvcjtcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZygnY3VzdCcsIHRhcmdldC5uYW1lLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblx0XHRcdFx0XHRpZiAoZGVzYy5sYXllclRpbWUgIT09IHVuZGVmaW5lZCkgdGFyZ2V0LnRpbWVzdGFtcCA9IGRlc2MubGF5ZXJUaW1lO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGtleSA9PT0gJ21sc3QnKSB7XG5cdFx0XHRcdFx0Y29uc3QgZGVzYyA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpIGFzIEZyYW1lTGlzdERlc2NyaXB0b3I7XG5cdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coJ21sc3QnLCB0YXJnZXQubmFtZSwgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYywgZmFsc2UsIDk5LCB0cnVlKSk7XG5cblx0XHRcdFx0XHR0YXJnZXQuYW5pbWF0aW9uRnJhbWVzID0gW107XG5cblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGRlc2MuTGFTdC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0Y29uc3QgZiA9IGRlc2MuTGFTdFtpXTtcblx0XHRcdFx0XHRcdGNvbnN0IGZyYW1lOiBBbmltYXRpb25GcmFtZSA9IHsgZnJhbWVzOiBmLkZyTHMgfTtcblx0XHRcdFx0XHRcdGlmIChmLmVuYWIgIT09IHVuZGVmaW5lZCkgZnJhbWUuZW5hYmxlID0gZi5lbmFiO1xuXHRcdFx0XHRcdFx0aWYgKGYuT2ZzdCkgZnJhbWUub2Zmc2V0ID0gaG9yelZydGNUb1hZKGYuT2ZzdCk7XG5cdFx0XHRcdFx0XHRpZiAoZi5GWFJmKSBmcmFtZS5yZWZlcmVuY2VQb2ludCA9IGhvcnpWcnRjVG9YWShmLkZYUmYpO1xuXHRcdFx0XHRcdFx0aWYgKGYuTGVmeCkgZnJhbWUuZWZmZWN0cyA9IHBhcnNlRWZmZWN0cyhmLkxlZngsICEhb3B0aW9ucy5sb2dNaXNzaW5nRmVhdHVyZXMpO1xuXHRcdFx0XHRcdFx0aWYgKGYuYmxlbmRPcHRpb25zICYmIGYuYmxlbmRPcHRpb25zLk9wY3QpIGZyYW1lLm9wYWNpdHkgPSBwYXJzZVBlcmNlbnQoZi5ibGVuZE9wdGlvbnMuT3BjdCk7XG5cdFx0XHRcdFx0XHR0YXJnZXQuYW5pbWF0aW9uRnJhbWVzLnB1c2goZnJhbWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIGlmIChrZXkgPT09ICdtZHluJykge1xuXHRcdFx0XHRcdC8vIGZyYW1lIGZsYWdzXG5cdFx0XHRcdFx0cmVhZFVpbnQxNihyZWFkZXIpOyAvLyB1bmtub3duXG5cdFx0XHRcdFx0Y29uc3QgcHJvcGFnYXRlID0gcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHRcdFx0Y29uc3QgZmxhZ3MgPSByZWFkVWludDgocmVhZGVyKTtcblxuXHRcdFx0XHRcdHRhcmdldC5hbmltYXRpb25GcmFtZUZsYWdzID0ge1xuXHRcdFx0XHRcdFx0cHJvcGFnYXRlRnJhbWVPbmU6ICFwcm9wYWdhdGUsXG5cdFx0XHRcdFx0XHR1bmlmeUxheWVyUG9zaXRpb246IChmbGFncyAmIDEpICE9PSAwLFxuXHRcdFx0XHRcdFx0dW5pZnlMYXllclN0eWxlOiAoZmxhZ3MgJiAyKSAhPT0gMCxcblx0XHRcdFx0XHRcdHVuaWZ5TGF5ZXJWaXNpYmlsaXR5OiAoZmxhZ3MgJiA0KSAhPT0gMCxcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9IGVsc2UgaWYgKGtleSA9PT0gJ3RtbG4nKSB7XG5cdFx0XHRcdFx0Y29uc3QgZGVzYyA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpIGFzIFRpbWVsaW5lRGVzY3JpcHRvcjtcblx0XHRcdFx0XHRjb25zdCB0aW1lU2NvcGUgPSBkZXNjLnRpbWVTY29wZTtcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZygndG1sbicsIHRhcmdldC5uYW1lLCB0YXJnZXQuaWQsIHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KGRlc2MsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXG5cdFx0XHRcdFx0Y29uc3QgdGltZWxpbmU6IFRpbWVsaW5lID0ge1xuXHRcdFx0XHRcdFx0c3RhcnQ6IHRpbWVTY29wZS5TdHJ0LFxuXHRcdFx0XHRcdFx0ZHVyYXRpb246IHRpbWVTY29wZS5kdXJhdGlvbixcblx0XHRcdFx0XHRcdGluVGltZTogdGltZVNjb3BlLmluVGltZSxcblx0XHRcdFx0XHRcdG91dFRpbWU6IHRpbWVTY29wZS5vdXRUaW1lLFxuXHRcdFx0XHRcdFx0YXV0b1Njb3BlOiBkZXNjLmF1dG9TY29wZSxcblx0XHRcdFx0XHRcdGF1ZGlvTGV2ZWw6IGRlc2MuYXVkaW9MZXZlbCxcblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0aWYgKGRlc2MudHJhY2tMaXN0KSB7XG5cdFx0XHRcdFx0XHR0aW1lbGluZS50cmFja3MgPSBwYXJzZVRyYWNrTGlzdChkZXNjLnRyYWNrTGlzdCwgISFvcHRpb25zLmxvZ01pc3NpbmdGZWF0dXJlcyk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dGFyZ2V0LnRpbWVsaW5lID0gdGltZWxpbmU7XG5cdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coJ3RtbG46cmVzdWx0JywgdGFyZ2V0Lm5hbWUsIHRhcmdldC5pZCwgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QodGltZWxpbmUsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdG9wdGlvbnMubG9nRGV2RmVhdHVyZXMgJiYgY29uc29sZS5sb2coJ1VuaGFuZGxlZCBcInNobWRcIiBzZWN0aW9uIGtleScsIGtleSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0LCBfLCBvcHRpb25zKSA9PiB7XG5cdFx0Y29uc3QgeyBhbmltYXRpb25GcmFtZXMsIGFuaW1hdGlvbkZyYW1lRmxhZ3MsIHRpbWVzdGFtcCwgdGltZWxpbmUgfSA9IHRhcmdldDtcblxuXHRcdGxldCBjb3VudCA9IDA7XG5cdFx0aWYgKGFuaW1hdGlvbkZyYW1lcykgY291bnQrKztcblx0XHRpZiAoYW5pbWF0aW9uRnJhbWVGbGFncykgY291bnQrKztcblx0XHRpZiAodGltZWxpbmUpIGNvdW50Kys7XG5cdFx0aWYgKHRpbWVzdGFtcCAhPT0gdW5kZWZpbmVkKSBjb3VudCsrO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgY291bnQpO1xuXG5cdFx0aWYgKGFuaW1hdGlvbkZyYW1lcykge1xuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnOEJJTScpO1xuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnbWxzdCcpO1xuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIDApOyAvLyBjb3B5IChhbHdheXMgZmFsc2UpXG5cdFx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdFx0XHR3cml0ZVNlY3Rpb24od3JpdGVyLCAyLCAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGRlc2M6IEZyYW1lTGlzdERlc2NyaXB0b3IgPSB7XG5cdFx0XHRcdFx0TGFJRDogdGFyZ2V0LmlkID8/IDAsXG5cdFx0XHRcdFx0TGFTdDogW10sXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBhbmltYXRpb25GcmFtZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRjb25zdCBmID0gYW5pbWF0aW9uRnJhbWVzW2ldO1xuXHRcdFx0XHRcdGNvbnN0IGZyYW1lOiBGcmFtZURlc2NyaXB0b3IgPSB7fSBhcyBhbnk7XG5cdFx0XHRcdFx0aWYgKGYuZW5hYmxlICE9PSB1bmRlZmluZWQpIGZyYW1lLmVuYWIgPSBmLmVuYWJsZTtcblx0XHRcdFx0XHRmcmFtZS5GckxzID0gZi5mcmFtZXM7XG5cdFx0XHRcdFx0aWYgKGYub2Zmc2V0KSBmcmFtZS5PZnN0ID0geHlUb0hvcnpWcnRjKGYub2Zmc2V0KTtcblx0XHRcdFx0XHRpZiAoZi5yZWZlcmVuY2VQb2ludCkgZnJhbWUuRlhSZiA9IHh5VG9Ib3J6VnJ0YyhmLnJlZmVyZW5jZVBvaW50KTtcblx0XHRcdFx0XHRpZiAoZi5lZmZlY3RzKSBmcmFtZS5MZWZ4ID0gc2VyaWFsaXplRWZmZWN0cyhmLmVmZmVjdHMsIGZhbHNlLCBmYWxzZSk7XG5cdFx0XHRcdFx0aWYgKGYub3BhY2l0eSAhPT0gdW5kZWZpbmVkKSBmcmFtZS5ibGVuZE9wdGlvbnMgPSB7IE9wY3Q6IHVuaXRzUGVyY2VudChmLm9wYWNpdHkpIH07XG5cdFx0XHRcdFx0ZGVzYy5MYVN0LnB1c2goZnJhbWUpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHRcdFx0fSwgdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0aWYgKGFuaW1hdGlvbkZyYW1lRmxhZ3MpIHtcblx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJzhCSU0nKTtcblx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJ21keW4nKTtcblx0XHRcdHdyaXRlVWludDgod3JpdGVyLCAwKTsgLy8gY29weSAoYWx3YXlzIGZhbHNlKVxuXHRcdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDMpO1xuXHRcdFx0d3JpdGVTZWN0aW9uKHdyaXRlciwgMiwgKCkgPT4ge1xuXHRcdFx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDApOyAvLyB1bmtub3duXG5cdFx0XHRcdHdyaXRlVWludDgod3JpdGVyLCBhbmltYXRpb25GcmFtZUZsYWdzLnByb3BhZ2F0ZUZyYW1lT25lID8gMHgwIDogMHhmKTtcblx0XHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsXG5cdFx0XHRcdFx0KGFuaW1hdGlvbkZyYW1lRmxhZ3MudW5pZnlMYXllclBvc2l0aW9uID8gMSA6IDApIHxcblx0XHRcdFx0XHQoYW5pbWF0aW9uRnJhbWVGbGFncy51bmlmeUxheWVyU3R5bGUgPyAyIDogMCkgfFxuXHRcdFx0XHRcdChhbmltYXRpb25GcmFtZUZsYWdzLnVuaWZ5TGF5ZXJWaXNpYmlsaXR5ID8gNCA6IDApKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICh0aW1lbGluZSkge1xuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnOEJJTScpO1xuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAndG1sbicpO1xuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIDApOyAvLyBjb3B5IChhbHdheXMgZmFsc2UpXG5cdFx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdFx0XHR3cml0ZVNlY3Rpb24od3JpdGVyLCAyLCAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGRlc2M6IFRpbWVsaW5lRGVzY3JpcHRvciA9IHtcblx0XHRcdFx0XHRWcnNuOiAxLFxuXHRcdFx0XHRcdHRpbWVTY29wZToge1xuXHRcdFx0XHRcdFx0VnJzbjogMSxcblx0XHRcdFx0XHRcdFN0cnQ6IHRpbWVsaW5lLnN0YXJ0LFxuXHRcdFx0XHRcdFx0ZHVyYXRpb246IHRpbWVsaW5lLmR1cmF0aW9uLFxuXHRcdFx0XHRcdFx0aW5UaW1lOiB0aW1lbGluZS5pblRpbWUsXG5cdFx0XHRcdFx0XHRvdXRUaW1lOiB0aW1lbGluZS5vdXRUaW1lLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0YXV0b1Njb3BlOiB0aW1lbGluZS5hdXRvU2NvcGUsXG5cdFx0XHRcdFx0YXVkaW9MZXZlbDogdGltZWxpbmUuYXVkaW9MZXZlbCxcblx0XHRcdFx0fSBhcyBhbnk7XG5cblx0XHRcdFx0aWYgKHRpbWVsaW5lLnRyYWNrcykge1xuXHRcdFx0XHRcdGRlc2MudHJhY2tMaXN0ID0gc2VyaWFsaXplVHJhY2tMaXN0KHRpbWVsaW5lLnRyYWNrcyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBpZCA9IG9wdGlvbnMubGF5ZXJUb0lkLmdldCh0YXJnZXQpIHx8IHRhcmdldC5pZCB8fCAwO1xuXHRcdFx0XHRpZiAoIWlkKSB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBuZWVkIHRvIHByb3ZpZGUgbGF5ZXIuaWQgdmFsdWUgd2hhbiB3cml0aW5nIGRvY3VtZW50IHdpdGggYW5pbWF0aW9ucycpO1xuXHRcdFx0XHRkZXNjLkx5ckkgPSBpZDtcblxuXHRcdFx0XHQvLyBjb25zb2xlLmxvZygnV1JJVEU6dG1sbicsIHRhcmdldC5uYW1lLCB0YXJnZXQuaWQsIHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KGRlc2MsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXHRcdFx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdudWxsJywgZGVzYywgJ2FuaW0nKTtcblx0XHRcdH0sIHRydWUpO1xuXHRcdH1cblxuXHRcdGlmICh0aW1lc3RhbXAgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnOEJJTScpO1xuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnY3VzdCcpO1xuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIDApOyAvLyBjb3B5IChhbHdheXMgZmFsc2UpXG5cdFx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdFx0XHR3cml0ZVNlY3Rpb24od3JpdGVyLCAyLCAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGRlc2M6IEN1c3RvbURlc2NyaXB0b3IgPSB7XG5cdFx0XHRcdFx0bGF5ZXJUaW1lOiB0aW1lc3RhbXAsXG5cdFx0XHRcdH07XG5cdFx0XHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ21ldGFkYXRhJywgZGVzYyk7XG5cdFx0XHR9LCB0cnVlKTtcblx0XHR9XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQndnN0aycsXG5cdGhhc0tleSgndmVjdG9yU3Ryb2tlJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGNvbnN0IGRlc2MgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKSBhcyBTdHJva2VEZXNjcmlwdG9yO1xuXHRcdC8vIGNvbnNvbGUubG9nKHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KGRlc2MsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXG5cdFx0dGFyZ2V0LnZlY3RvclN0cm9rZSA9IHtcblx0XHRcdHN0cm9rZUVuYWJsZWQ6IGRlc2Muc3Ryb2tlRW5hYmxlZCxcblx0XHRcdGZpbGxFbmFibGVkOiBkZXNjLmZpbGxFbmFibGVkLFxuXHRcdFx0bGluZVdpZHRoOiBwYXJzZVVuaXRzKGRlc2Muc3Ryb2tlU3R5bGVMaW5lV2lkdGgpLFxuXHRcdFx0bGluZURhc2hPZmZzZXQ6IHBhcnNlVW5pdHMoZGVzYy5zdHJva2VTdHlsZUxpbmVEYXNoT2Zmc2V0KSxcblx0XHRcdG1pdGVyTGltaXQ6IGRlc2Muc3Ryb2tlU3R5bGVNaXRlckxpbWl0LFxuXHRcdFx0bGluZUNhcFR5cGU6IHN0cm9rZVN0eWxlTGluZUNhcFR5cGUuZGVjb2RlKGRlc2Muc3Ryb2tlU3R5bGVMaW5lQ2FwVHlwZSksXG5cdFx0XHRsaW5lSm9pblR5cGU6IHN0cm9rZVN0eWxlTGluZUpvaW5UeXBlLmRlY29kZShkZXNjLnN0cm9rZVN0eWxlTGluZUpvaW5UeXBlKSxcblx0XHRcdGxpbmVBbGlnbm1lbnQ6IHN0cm9rZVN0eWxlTGluZUFsaWdubWVudC5kZWNvZGUoZGVzYy5zdHJva2VTdHlsZUxpbmVBbGlnbm1lbnQpLFxuXHRcdFx0c2NhbGVMb2NrOiBkZXNjLnN0cm9rZVN0eWxlU2NhbGVMb2NrLFxuXHRcdFx0c3Ryb2tlQWRqdXN0OiBkZXNjLnN0cm9rZVN0eWxlU3Ryb2tlQWRqdXN0LFxuXHRcdFx0bGluZURhc2hTZXQ6IGRlc2Muc3Ryb2tlU3R5bGVMaW5lRGFzaFNldC5tYXAocGFyc2VVbml0cyksXG5cdFx0XHRibGVuZE1vZGU6IEJsbk0uZGVjb2RlKGRlc2Muc3Ryb2tlU3R5bGVCbGVuZE1vZGUpLFxuXHRcdFx0b3BhY2l0eTogcGFyc2VQZXJjZW50KGRlc2Muc3Ryb2tlU3R5bGVPcGFjaXR5KSxcblx0XHRcdGNvbnRlbnQ6IHBhcnNlVmVjdG9yQ29udGVudChkZXNjLnN0cm9rZVN0eWxlQ29udGVudCksXG5cdFx0XHRyZXNvbHV0aW9uOiBkZXNjLnN0cm9rZVN0eWxlUmVzb2x1dGlvbixcblx0XHR9O1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3Qgc3Ryb2tlID0gdGFyZ2V0LnZlY3RvclN0cm9rZSE7XG5cdFx0Y29uc3QgZGVzY3JpcHRvcjogU3Ryb2tlRGVzY3JpcHRvciA9IHtcblx0XHRcdHN0cm9rZVN0eWxlVmVyc2lvbjogMixcblx0XHRcdHN0cm9rZUVuYWJsZWQ6ICEhc3Ryb2tlLnN0cm9rZUVuYWJsZWQsXG5cdFx0XHRmaWxsRW5hYmxlZDogISFzdHJva2UuZmlsbEVuYWJsZWQsXG5cdFx0XHRzdHJva2VTdHlsZUxpbmVXaWR0aDogc3Ryb2tlLmxpbmVXaWR0aCB8fCB7IHZhbHVlOiAzLCB1bml0czogJ1BvaW50cycgfSxcblx0XHRcdHN0cm9rZVN0eWxlTGluZURhc2hPZmZzZXQ6IHN0cm9rZS5saW5lRGFzaE9mZnNldCB8fCB7IHZhbHVlOiAwLCB1bml0czogJ1BvaW50cycgfSxcblx0XHRcdHN0cm9rZVN0eWxlTWl0ZXJMaW1pdDogc3Ryb2tlLm1pdGVyTGltaXQgPz8gMTAwLFxuXHRcdFx0c3Ryb2tlU3R5bGVMaW5lQ2FwVHlwZTogc3Ryb2tlU3R5bGVMaW5lQ2FwVHlwZS5lbmNvZGUoc3Ryb2tlLmxpbmVDYXBUeXBlKSxcblx0XHRcdHN0cm9rZVN0eWxlTGluZUpvaW5UeXBlOiBzdHJva2VTdHlsZUxpbmVKb2luVHlwZS5lbmNvZGUoc3Ryb2tlLmxpbmVKb2luVHlwZSksXG5cdFx0XHRzdHJva2VTdHlsZUxpbmVBbGlnbm1lbnQ6IHN0cm9rZVN0eWxlTGluZUFsaWdubWVudC5lbmNvZGUoc3Ryb2tlLmxpbmVBbGlnbm1lbnQpLFxuXHRcdFx0c3Ryb2tlU3R5bGVTY2FsZUxvY2s6ICEhc3Ryb2tlLnNjYWxlTG9jayxcblx0XHRcdHN0cm9rZVN0eWxlU3Ryb2tlQWRqdXN0OiAhIXN0cm9rZS5zdHJva2VBZGp1c3QsXG5cdFx0XHRzdHJva2VTdHlsZUxpbmVEYXNoU2V0OiBzdHJva2UubGluZURhc2hTZXQgfHwgW10sXG5cdFx0XHRzdHJva2VTdHlsZUJsZW5kTW9kZTogQmxuTS5lbmNvZGUoc3Ryb2tlLmJsZW5kTW9kZSksXG5cdFx0XHRzdHJva2VTdHlsZU9wYWNpdHk6IHVuaXRzUGVyY2VudChzdHJva2Uub3BhY2l0eSA/PyAxKSxcblx0XHRcdHN0cm9rZVN0eWxlQ29udGVudDogc2VyaWFsaXplVmVjdG9yQ29udGVudChcblx0XHRcdFx0c3Ryb2tlLmNvbnRlbnQgfHwgeyB0eXBlOiAnY29sb3InLCBjb2xvcjogeyByOiAwLCBnOiAwLCBiOiAwIH0gfSkuZGVzY3JpcHRvcixcblx0XHRcdHN0cm9rZVN0eWxlUmVzb2x1dGlvbjogc3Ryb2tlLnJlc29sdXRpb24gPz8gNzIsXG5cdFx0fTtcblxuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ3N0cm9rZVN0eWxlJywgZGVzY3JpcHRvcik7XG5cdH0sXG4pO1xuXG5pbnRlcmZhY2UgQXJ0YkRlc2NyaXB0b3Ige1xuXHRhcnRib2FyZFJlY3Q6IHsgJ1RvcCAnOiBudW1iZXI7IExlZnQ6IG51bWJlcjsgQnRvbTogbnVtYmVyOyBSZ2h0OiBudW1iZXI7IH07XG5cdGd1aWRlSW5kZWNlczogYW55W107XG5cdGFydGJvYXJkUHJlc2V0TmFtZTogc3RyaW5nO1xuXHQnQ2xyICc6IERlc2NyaXB0b3JDb2xvcjtcblx0YXJ0Ym9hcmRCYWNrZ3JvdW5kVHlwZTogbnVtYmVyO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQnYXJ0YicsIC8vIHBlci1sYXllciBhcmJvYXJkIGluZm9cblx0aGFzS2V5KCdhcnRib2FyZCcpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRjb25zdCBkZXNjID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcikgYXMgQXJ0YkRlc2NyaXB0b3I7XG5cdFx0Y29uc3QgcmVjdCA9IGRlc2MuYXJ0Ym9hcmRSZWN0O1xuXHRcdHRhcmdldC5hcnRib2FyZCA9IHtcblx0XHRcdHJlY3Q6IHsgdG9wOiByZWN0WydUb3AgJ10sIGxlZnQ6IHJlY3QuTGVmdCwgYm90dG9tOiByZWN0LkJ0b20sIHJpZ2h0OiByZWN0LlJnaHQgfSxcblx0XHRcdGd1aWRlSW5kaWNlczogZGVzYy5ndWlkZUluZGVjZXMsXG5cdFx0XHRwcmVzZXROYW1lOiBkZXNjLmFydGJvYXJkUHJlc2V0TmFtZSxcblx0XHRcdGNvbG9yOiBwYXJzZUNvbG9yKGRlc2NbJ0NsciAnXSksXG5cdFx0XHRiYWNrZ3JvdW5kVHlwZTogZGVzYy5hcnRib2FyZEJhY2tncm91bmRUeXBlLFxuXHRcdH07XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBhcnRib2FyZCA9IHRhcmdldC5hcnRib2FyZCE7XG5cdFx0Y29uc3QgcmVjdCA9IGFydGJvYXJkLnJlY3Q7XG5cdFx0Y29uc3QgZGVzYzogQXJ0YkRlc2NyaXB0b3IgPSB7XG5cdFx0XHRhcnRib2FyZFJlY3Q6IHsgJ1RvcCAnOiByZWN0LnRvcCwgTGVmdDogcmVjdC5sZWZ0LCBCdG9tOiByZWN0LmJvdHRvbSwgUmdodDogcmVjdC5yaWdodCB9LFxuXHRcdFx0Z3VpZGVJbmRlY2VzOiBhcnRib2FyZC5ndWlkZUluZGljZXMgfHwgW10sXG5cdFx0XHRhcnRib2FyZFByZXNldE5hbWU6IGFydGJvYXJkLnByZXNldE5hbWUgfHwgJycsXG5cdFx0XHQnQ2xyICc6IHNlcmlhbGl6ZUNvbG9yKGFydGJvYXJkLmNvbG9yKSxcblx0XHRcdGFydGJvYXJkQmFja2dyb3VuZFR5cGU6IGFydGJvYXJkLmJhY2tncm91bmRUeXBlID8/IDEsXG5cdFx0fTtcblxuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ2FydGJvYXJkJywgZGVzYyk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnc24yUCcsXG5cdGhhc0tleSgndXNpbmdBbGlnbmVkUmVuZGVyaW5nJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4gdGFyZ2V0LnVzaW5nQWxpZ25lZFJlbmRlcmluZyA9ICEhcmVhZFVpbnQzMihyZWFkZXIpLFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHdyaXRlVWludDMyKHdyaXRlciwgdGFyZ2V0LnVzaW5nQWxpZ25lZFJlbmRlcmluZyA/IDEgOiAwKSxcbik7XG5cbmNvbnN0IHBsYWNlZExheWVyVHlwZXM6IFBsYWNlZExheWVyVHlwZVtdID0gWyd1bmtub3duJywgJ3ZlY3RvcicsICdyYXN0ZXInLCAnaW1hZ2Ugc3RhY2snXTtcblxuZnVuY3Rpb24gcGFyc2VXYXJwKHdhcnA6IFdhcnBEZXNjcmlwdG9yICYgUXVpbHRXYXJwRGVzY3JpcHRvcik6IFdhcnAge1xuXHRjb25zdCByZXN1bHQ6IFdhcnAgPSB7XG5cdFx0c3R5bGU6IHdhcnBTdHlsZS5kZWNvZGUod2FycC53YXJwU3R5bGUpLFxuXHRcdHZhbHVlOiB3YXJwLndhcnBWYWx1ZSB8fCAwLFxuXHRcdHBlcnNwZWN0aXZlOiB3YXJwLndhcnBQZXJzcGVjdGl2ZSB8fCAwLFxuXHRcdHBlcnNwZWN0aXZlT3RoZXI6IHdhcnAud2FycFBlcnNwZWN0aXZlT3RoZXIgfHwgMCxcblx0XHRyb3RhdGU6IE9ybnQuZGVjb2RlKHdhcnAud2FycFJvdGF0ZSksXG5cdFx0Ym91bmRzOiB3YXJwLmJvdW5kcyAmJiB7XG5cdFx0XHR0b3A6IHBhcnNlVW5pdHNPck51bWJlcih3YXJwLmJvdW5kc1snVG9wICddKSxcblx0XHRcdGxlZnQ6IHBhcnNlVW5pdHNPck51bWJlcih3YXJwLmJvdW5kcy5MZWZ0KSxcblx0XHRcdGJvdHRvbTogcGFyc2VVbml0c09yTnVtYmVyKHdhcnAuYm91bmRzLkJ0b20pLFxuXHRcdFx0cmlnaHQ6IHBhcnNlVW5pdHNPck51bWJlcih3YXJwLmJvdW5kcy5SZ2h0KSxcblx0XHR9LFxuXHRcdHVPcmRlcjogd2FycC51T3JkZXIsXG5cdFx0dk9yZGVyOiB3YXJwLnZPcmRlcixcblx0fTtcblxuXHRpZiAod2FycC5kZWZvcm1OdW1Sb3dzICE9IG51bGwgfHwgd2FycC5kZWZvcm1OdW1Db2xzICE9IG51bGwpIHtcblx0XHRyZXN1bHQuZGVmb3JtTnVtUm93cyA9IHdhcnAuZGVmb3JtTnVtUm93cztcblx0XHRyZXN1bHQuZGVmb3JtTnVtQ29scyA9IHdhcnAuZGVmb3JtTnVtQ29scztcblx0fVxuXG5cdGNvbnN0IGVudmVsb3BlV2FycCA9IHdhcnAuY3VzdG9tRW52ZWxvcGVXYXJwO1xuXHRpZiAoZW52ZWxvcGVXYXJwKSB7XG5cdFx0cmVzdWx0LmN1c3RvbUVudmVsb3BlV2FycCA9IHtcblx0XHRcdG1lc2hQb2ludHM6IFtdLFxuXHRcdH07XG5cblx0XHRjb25zdCB4cyA9IGVudmVsb3BlV2FycC5tZXNoUG9pbnRzLmZpbmQoaSA9PiBpLnR5cGUgPT09ICdIcnpuJyk/LnZhbHVlcyB8fCBbXTtcblx0XHRjb25zdCB5cyA9IGVudmVsb3BlV2FycC5tZXNoUG9pbnRzLmZpbmQoaSA9PiBpLnR5cGUgPT09ICdWcnRjJyk/LnZhbHVlcyB8fCBbXTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHJlc3VsdC5jdXN0b21FbnZlbG9wZVdhcnAhLm1lc2hQb2ludHMucHVzaCh7IHg6IHhzW2ldLCB5OiB5c1tpXSB9KTtcblx0XHR9XG5cblx0XHRpZiAoZW52ZWxvcGVXYXJwLnF1aWx0U2xpY2VYIHx8IGVudmVsb3BlV2FycC5xdWlsdFNsaWNlWSkge1xuXHRcdFx0cmVzdWx0LmN1c3RvbUVudmVsb3BlV2FycC5xdWlsdFNsaWNlWCA9IGVudmVsb3BlV2FycC5xdWlsdFNsaWNlWD8uWzBdPy52YWx1ZXMgfHwgW107XG5cdFx0XHRyZXN1bHQuY3VzdG9tRW52ZWxvcGVXYXJwLnF1aWx0U2xpY2VZID0gZW52ZWxvcGVXYXJwLnF1aWx0U2xpY2VZPy5bMF0/LnZhbHVlcyB8fCBbXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpc1F1aWx0V2FycCh3YXJwOiBXYXJwKSB7XG5cdHJldHVybiB3YXJwLmRlZm9ybU51bUNvbHMgIT0gbnVsbCB8fCB3YXJwLmRlZm9ybU51bVJvd3MgIT0gbnVsbCB8fFxuXHRcdHdhcnAuY3VzdG9tRW52ZWxvcGVXYXJwPy5xdWlsdFNsaWNlWCB8fCB3YXJwLmN1c3RvbUVudmVsb3BlV2FycD8ucXVpbHRTbGljZVk7XG59XG5cbmZ1bmN0aW9uIGVuY29kZVdhcnAod2FycDogV2FycCk6IFdhcnBEZXNjcmlwdG9yIHtcblx0Y29uc3QgYm91bmRzID0gd2FycC5ib3VuZHM7XG5cdGNvbnN0IGRlc2M6IFdhcnBEZXNjcmlwdG9yID0ge1xuXHRcdHdhcnBTdHlsZTogd2FycFN0eWxlLmVuY29kZSh3YXJwLnN0eWxlKSxcblx0XHR3YXJwVmFsdWU6IHdhcnAudmFsdWUgfHwgMCxcblx0XHR3YXJwUGVyc3BlY3RpdmU6IHdhcnAucGVyc3BlY3RpdmUgfHwgMCxcblx0XHR3YXJwUGVyc3BlY3RpdmVPdGhlcjogd2FycC5wZXJzcGVjdGl2ZU90aGVyIHx8IDAsXG5cdFx0d2FycFJvdGF0ZTogT3JudC5lbmNvZGUod2FycC5yb3RhdGUpLFxuXHRcdGJvdW5kczoge1xuXHRcdFx0J1RvcCAnOiB1bml0c1ZhbHVlKGJvdW5kcyAmJiBib3VuZHMudG9wIHx8IHsgdW5pdHM6ICdQaXhlbHMnLCB2YWx1ZTogMCB9LCAnYm91bmRzLnRvcCcpLFxuXHRcdFx0TGVmdDogdW5pdHNWYWx1ZShib3VuZHMgJiYgYm91bmRzLmxlZnQgfHwgeyB1bml0czogJ1BpeGVscycsIHZhbHVlOiAwIH0sICdib3VuZHMubGVmdCcpLFxuXHRcdFx0QnRvbTogdW5pdHNWYWx1ZShib3VuZHMgJiYgYm91bmRzLmJvdHRvbSB8fCB7IHVuaXRzOiAnUGl4ZWxzJywgdmFsdWU6IDAgfSwgJ2JvdW5kcy5ib3R0b20nKSxcblx0XHRcdFJnaHQ6IHVuaXRzVmFsdWUoYm91bmRzICYmIGJvdW5kcy5yaWdodCB8fCB7IHVuaXRzOiAnUGl4ZWxzJywgdmFsdWU6IDAgfSwgJ2JvdW5kcy5yaWdodCcpLFxuXHRcdH0sXG5cdFx0dU9yZGVyOiB3YXJwLnVPcmRlciB8fCAwLFxuXHRcdHZPcmRlcjogd2FycC52T3JkZXIgfHwgMCxcblx0fTtcblxuXHRjb25zdCBpc1F1aWx0ID0gaXNRdWlsdFdhcnAod2FycCk7XG5cblx0aWYgKGlzUXVpbHQpIHtcblx0XHRjb25zdCBkZXNjMiA9IGRlc2MgYXMgUXVpbHRXYXJwRGVzY3JpcHRvcjtcblx0XHRkZXNjMi5kZWZvcm1OdW1Sb3dzID0gd2FycC5kZWZvcm1OdW1Sb3dzIHx8IDA7XG5cdFx0ZGVzYzIuZGVmb3JtTnVtQ29scyA9IHdhcnAuZGVmb3JtTnVtQ29scyB8fCAwO1xuXHR9XG5cblx0Y29uc3QgY3VzdG9tRW52ZWxvcGVXYXJwID0gd2FycC5jdXN0b21FbnZlbG9wZVdhcnA7XG5cdGlmIChjdXN0b21FbnZlbG9wZVdhcnApIHtcblx0XHRjb25zdCBtZXNoUG9pbnRzID0gY3VzdG9tRW52ZWxvcGVXYXJwLm1lc2hQb2ludHMgfHwgW107XG5cblx0XHRpZiAoaXNRdWlsdCkge1xuXHRcdFx0Y29uc3QgZGVzYzIgPSBkZXNjIGFzIFF1aWx0V2FycERlc2NyaXB0b3I7XG5cdFx0XHRkZXNjMi5jdXN0b21FbnZlbG9wZVdhcnAgPSB7XG5cdFx0XHRcdHF1aWx0U2xpY2VYOiBbe1xuXHRcdFx0XHRcdHR5cGU6ICdxdWlsdFNsaWNlWCcsXG5cdFx0XHRcdFx0dmFsdWVzOiBjdXN0b21FbnZlbG9wZVdhcnAucXVpbHRTbGljZVggfHwgW10sXG5cdFx0XHRcdH1dLFxuXHRcdFx0XHRxdWlsdFNsaWNlWTogW3tcblx0XHRcdFx0XHR0eXBlOiAncXVpbHRTbGljZVknLFxuXHRcdFx0XHRcdHZhbHVlczogY3VzdG9tRW52ZWxvcGVXYXJwLnF1aWx0U2xpY2VZIHx8IFtdLFxuXHRcdFx0XHR9XSxcblx0XHRcdFx0bWVzaFBvaW50czogW1xuXHRcdFx0XHRcdHsgdHlwZTogJ0hyem4nLCB2YWx1ZXM6IG1lc2hQb2ludHMubWFwKHAgPT4gcC54KSB9LFxuXHRcdFx0XHRcdHsgdHlwZTogJ1ZydGMnLCB2YWx1ZXM6IG1lc2hQb2ludHMubWFwKHAgPT4gcC55KSB9LFxuXHRcdFx0XHRdLFxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVzYy5jdXN0b21FbnZlbG9wZVdhcnAgPSB7XG5cdFx0XHRcdG1lc2hQb2ludHM6IFtcblx0XHRcdFx0XHR7IHR5cGU6ICdIcnpuJywgdmFsdWVzOiBtZXNoUG9pbnRzLm1hcChwID0+IHAueCkgfSxcblx0XHRcdFx0XHR7IHR5cGU6ICdWcnRjJywgdmFsdWVzOiBtZXNoUG9pbnRzLm1hcChwID0+IHAueSkgfSxcblx0XHRcdFx0XSxcblx0XHRcdH07XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGRlc2M7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdQbExkJyxcblx0aGFzS2V5KCdwbGFjZWRMYXllcicpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRpZiAocmVhZFNpZ25hdHVyZShyZWFkZXIpICE9PSAncGxjTCcpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBQbExkIHNpZ25hdHVyZWApO1xuXHRcdGlmIChyZWFkSW50MzIocmVhZGVyKSAhPT0gMykgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFBsTGQgdmVyc2lvbmApO1xuXHRcdGNvbnN0IGlkID0gcmVhZFBhc2NhbFN0cmluZyhyZWFkZXIsIDEpO1xuXHRcdGNvbnN0IHBhZ2VOdW1iZXIgPSByZWFkSW50MzIocmVhZGVyKTtcblx0XHRjb25zdCB0b3RhbFBhZ2VzID0gcmVhZEludDMyKHJlYWRlcik7IC8vIFRPRE86IGNoZWNrIGhvdyB0aGlzIHdvcmtzID9cblx0XHRyZWFkSW50MzIocmVhZGVyKTsgLy8gYW5pdEFsaWFzUG9saWN5IDE2XG5cdFx0Y29uc3QgcGxhY2VkTGF5ZXJUeXBlID0gcmVhZEludDMyKHJlYWRlcik7IC8vIDAgPSB1bmtub3duLCAxID0gdmVjdG9yLCAyID0gcmFzdGVyLCAzID0gaW1hZ2Ugc3RhY2tcblx0XHRpZiAoIXBsYWNlZExheWVyVHlwZXNbcGxhY2VkTGF5ZXJUeXBlXSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFBsTGQgdHlwZScpO1xuXHRcdGNvbnN0IHRyYW5zZm9ybTogbnVtYmVyW10gPSBbXTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDg7IGkrKykgdHJhbnNmb3JtLnB1c2gocmVhZEZsb2F0NjQocmVhZGVyKSk7IC8vIHgsIHkgb2YgNCBjb3JuZXJzIG9mIHRoZSB0cmFuc2Zvcm1cblx0XHRjb25zdCB3YXJwVmVyc2lvbiA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRcdGlmICh3YXJwVmVyc2lvbiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFdhcnAgdmVyc2lvbiAke3dhcnBWZXJzaW9ufWApO1xuXHRcdGNvbnN0IHdhcnA6IFdhcnBEZXNjcmlwdG9yICYgUXVpbHRXYXJwRGVzY3JpcHRvciA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpO1xuXG5cdFx0dGFyZ2V0LnBsYWNlZExheWVyID0gdGFyZ2V0LnBsYWNlZExheWVyIHx8IHsgLy8gc2tpcCBpZiBTb0xkIGFscmVhZHkgc2V0IGl0XG5cdFx0XHRpZCxcblx0XHRcdHR5cGU6IHBsYWNlZExheWVyVHlwZXNbcGxhY2VkTGF5ZXJUeXBlXSxcblx0XHRcdHBhZ2VOdW1iZXIsXG5cdFx0XHR0b3RhbFBhZ2VzLFxuXHRcdFx0dHJhbnNmb3JtLFxuXHRcdFx0d2FycDogcGFyc2VXYXJwKHdhcnApLFxuXHRcdH07XG5cblx0XHQvLyBjb25zb2xlLmxvZygnUGxMZCB3YXJwJywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3Qod2FycCwgZmFsc2UsIDk5LCB0cnVlKSk7XG5cdFx0Ly8gY29uc29sZS5sb2coJ1BsTGQnLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdCh0YXJnZXQucGxhY2VkTGF5ZXIsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgcGxhY2VkID0gdGFyZ2V0LnBsYWNlZExheWVyITtcblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICdwbGNMJyk7XG5cdFx0d3JpdGVJbnQzMih3cml0ZXIsIDMpOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVQYXNjYWxTdHJpbmcod3JpdGVyLCBwbGFjZWQuaWQsIDEpO1xuXHRcdHdyaXRlSW50MzIod3JpdGVyLCAxKTsgLy8gcGFnZU51bWJlclxuXHRcdHdyaXRlSW50MzIod3JpdGVyLCAxKTsgLy8gdG90YWxQYWdlc1xuXHRcdHdyaXRlSW50MzIod3JpdGVyLCAxNik7IC8vIGFuaXRBbGlhc1BvbGljeVxuXHRcdGlmIChwbGFjZWRMYXllclR5cGVzLmluZGV4T2YocGxhY2VkLnR5cGUpID09PSAtMSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBsYWNlZExheWVyIHR5cGUnKTtcblx0XHR3cml0ZUludDMyKHdyaXRlciwgcGxhY2VkTGF5ZXJUeXBlcy5pbmRleE9mKHBsYWNlZC50eXBlKSk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCA4OyBpKyspIHdyaXRlRmxvYXQ2NCh3cml0ZXIsIHBsYWNlZC50cmFuc2Zvcm1baV0pO1xuXHRcdHdyaXRlSW50MzIod3JpdGVyLCAwKTsgLy8gd2FycCB2ZXJzaW9uXG5cdFx0Y29uc3QgaXNRdWlsdCA9IHBsYWNlZC53YXJwICYmIGlzUXVpbHRXYXJwKHBsYWNlZC53YXJwKTtcblx0XHRjb25zdCB0eXBlID0gaXNRdWlsdCA/ICdxdWlsdFdhcnAnIDogJ3dhcnAnO1xuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgdHlwZSwgZW5jb2RlV2FycChwbGFjZWQud2FycCB8fCB7fSksIHR5cGUpO1xuXHR9LFxuKTtcblxuaW50ZXJmYWNlIFNvTGREZXNjcmlwdG9yIHtcblx0SWRudDogc3RyaW5nO1xuXHRwbGFjZWQ6IHN0cmluZztcblx0UGdObTogbnVtYmVyO1xuXHR0b3RhbFBhZ2VzOiBudW1iZXI7XG5cdENyb3A/OiBudW1iZXI7XG5cdGZyYW1lU3RlcDogRnJhY3Rpb25EZXNjcmlwdG9yO1xuXHRkdXJhdGlvbjogRnJhY3Rpb25EZXNjcmlwdG9yO1xuXHRmcmFtZUNvdW50OiBudW1iZXI7XG5cdEFubnQ6IG51bWJlcjtcblx0VHlwZTogbnVtYmVyO1xuXHRUcm5mOiBudW1iZXJbXTtcblx0bm9uQWZmaW5lVHJhbnNmb3JtOiBudW1iZXJbXTtcblx0cXVpbHRXYXJwPzogUXVpbHRXYXJwRGVzY3JpcHRvcjtcblx0d2FycDogV2FycERlc2NyaXB0b3I7XG5cdCdTeiAgJzogeyBXZHRoOiBudW1iZXI7IEhnaHQ6IG51bWJlcjsgfTtcblx0UnNsdDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XG5cdGNvbXA/OiBudW1iZXI7XG5cdGNvbXBJbmZvPzogeyBjb21wSUQ6IG51bWJlcjsgb3JpZ2luYWxDb21wSUQ6IG51bWJlcjsgfTtcbn1cblxuYWRkSGFuZGxlcihcblx0J1NvTGQnLFxuXHRoYXNLZXkoJ3BsYWNlZExheWVyJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGlmIChyZWFkU2lnbmF0dXJlKHJlYWRlcikgIT09ICdzb0xEJykgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFNvTGQgdHlwZWApO1xuXHRcdGlmIChyZWFkSW50MzIocmVhZGVyKSAhPT0gNCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFNvTGQgdmVyc2lvbmApO1xuXHRcdGNvbnN0IGRlc2M6IFNvTGREZXNjcmlwdG9yID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcik7XG5cdFx0Ly8gY29uc29sZS5sb2coJ1NvTGQnLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblx0XHQvLyBjb25zb2xlLmxvZygnU29MZC53YXJwJywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYy53YXJwLCBmYWxzZSwgOTksIHRydWUpKTtcblx0XHQvLyBjb25zb2xlLmxvZygnU29MZC5xdWlsdFdhcnAnLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLnF1aWx0V2FycCwgZmFsc2UsIDk5LCB0cnVlKSk7XG5cblx0XHR0YXJnZXQucGxhY2VkTGF5ZXIgPSB7XG5cdFx0XHRpZDogZGVzYy5JZG50LFxuXHRcdFx0cGxhY2VkOiBkZXNjLnBsYWNlZCxcblx0XHRcdHR5cGU6IHBsYWNlZExheWVyVHlwZXNbZGVzYy5UeXBlXSxcblx0XHRcdHBhZ2VOdW1iZXI6IGRlc2MuUGdObSxcblx0XHRcdHRvdGFsUGFnZXM6IGRlc2MudG90YWxQYWdlcyxcblx0XHRcdGZyYW1lU3RlcDogZGVzYy5mcmFtZVN0ZXAsXG5cdFx0XHRkdXJhdGlvbjogZGVzYy5kdXJhdGlvbixcblx0XHRcdGZyYW1lQ291bnQ6IGRlc2MuZnJhbWVDb3VudCxcblx0XHRcdHRyYW5zZm9ybTogZGVzYy5Ucm5mLFxuXHRcdFx0d2lkdGg6IGRlc2NbJ1N6ICAnXS5XZHRoLFxuXHRcdFx0aGVpZ2h0OiBkZXNjWydTeiAgJ10uSGdodCxcblx0XHRcdHJlc29sdXRpb246IHBhcnNlVW5pdHMoZGVzYy5Sc2x0KSxcblx0XHRcdHdhcnA6IHBhcnNlV2FycCgoZGVzYy5xdWlsdFdhcnAgfHwgZGVzYy53YXJwKSBhcyBhbnkpLFxuXHRcdH07XG5cblx0XHRpZiAoZGVzYy5ub25BZmZpbmVUcmFuc2Zvcm0gJiYgZGVzYy5ub25BZmZpbmVUcmFuc2Zvcm0uc29tZSgoeCwgaSkgPT4geCAhPT0gZGVzYy5Ucm5mW2ldKSkge1xuXHRcdFx0dGFyZ2V0LnBsYWNlZExheWVyLm5vbkFmZmluZVRyYW5zZm9ybSA9IGRlc2Mubm9uQWZmaW5lVHJhbnNmb3JtO1xuXHRcdH1cblxuXHRcdGlmIChkZXNjLkNyb3ApIHRhcmdldC5wbGFjZWRMYXllci5jcm9wID0gZGVzYy5Dcm9wO1xuXHRcdGlmIChkZXNjLmNvbXApIHRhcmdldC5wbGFjZWRMYXllci5jb21wID0gZGVzYy5jb21wO1xuXHRcdGlmIChkZXNjLmNvbXBJbmZvKSB0YXJnZXQucGxhY2VkTGF5ZXIuY29tcEluZm8gPSBkZXNjLmNvbXBJbmZvO1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTsgLy8gSEFDS1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICdzb0xEJyk7XG5cdFx0d3JpdGVJbnQzMih3cml0ZXIsIDQpOyAvLyB2ZXJzaW9uXG5cblx0XHRjb25zdCBwbGFjZWQgPSB0YXJnZXQucGxhY2VkTGF5ZXIhO1xuXHRcdGNvbnN0IGRlc2M6IFNvTGREZXNjcmlwdG9yID0ge1xuXHRcdFx0SWRudDogcGxhY2VkLmlkLFxuXHRcdFx0cGxhY2VkOiBwbGFjZWQucGxhY2VkID8/IHBsYWNlZC5pZCxcblx0XHRcdFBnTm06IHBsYWNlZC5wYWdlTnVtYmVyIHx8IDEsXG5cdFx0XHR0b3RhbFBhZ2VzOiBwbGFjZWQudG90YWxQYWdlcyB8fCAxLFxuXHRcdFx0Li4uKHBsYWNlZC5jcm9wID8geyBDcm9wOiBwbGFjZWQuY3JvcCB9IDoge30pLFxuXHRcdFx0ZnJhbWVTdGVwOiBwbGFjZWQuZnJhbWVTdGVwIHx8IHsgbnVtZXJhdG9yOiAwLCBkZW5vbWluYXRvcjogNjAwIH0sXG5cdFx0XHRkdXJhdGlvbjogcGxhY2VkLmR1cmF0aW9uIHx8IHsgbnVtZXJhdG9yOiAwLCBkZW5vbWluYXRvcjogNjAwIH0sXG5cdFx0XHRmcmFtZUNvdW50OiBwbGFjZWQuZnJhbWVDb3VudCB8fCAwLFxuXHRcdFx0QW5udDogMTYsXG5cdFx0XHRUeXBlOiBwbGFjZWRMYXllclR5cGVzLmluZGV4T2YocGxhY2VkLnR5cGUpLFxuXHRcdFx0VHJuZjogcGxhY2VkLnRyYW5zZm9ybSxcblx0XHRcdG5vbkFmZmluZVRyYW5zZm9ybTogcGxhY2VkLm5vbkFmZmluZVRyYW5zZm9ybSA/PyBwbGFjZWQudHJhbnNmb3JtLFxuXHRcdFx0cXVpbHRXYXJwOiB7fSBhcyBhbnksXG5cdFx0XHR3YXJwOiBlbmNvZGVXYXJwKHBsYWNlZC53YXJwIHx8IHt9KSxcblx0XHRcdCdTeiAgJzoge1xuXHRcdFx0XHRXZHRoOiBwbGFjZWQud2lkdGggfHwgMCwgLy8gVE9ETzogZmluZCBzaXplID9cblx0XHRcdFx0SGdodDogcGxhY2VkLmhlaWdodCB8fCAwLCAvLyBUT0RPOiBmaW5kIHNpemUgP1xuXHRcdFx0fSxcblx0XHRcdFJzbHQ6IHBsYWNlZC5yZXNvbHV0aW9uID8gdW5pdHNWYWx1ZShwbGFjZWQucmVzb2x1dGlvbiwgJ3Jlc29sdXRpb24nKSA6IHsgdW5pdHM6ICdEZW5zaXR5JywgdmFsdWU6IDcyIH0sXG5cdFx0fTtcblxuXHRcdGlmIChwbGFjZWQud2FycCAmJiBpc1F1aWx0V2FycChwbGFjZWQud2FycCkpIHtcblx0XHRcdGNvbnN0IHF1aWx0V2FycCA9IGVuY29kZVdhcnAocGxhY2VkLndhcnApIGFzIFF1aWx0V2FycERlc2NyaXB0b3I7XG5cdFx0XHRkZXNjLnF1aWx0V2FycCA9IHF1aWx0V2FycDtcblx0XHRcdGRlc2Mud2FycCA9IHtcblx0XHRcdFx0d2FycFN0eWxlOiAnd2FycFN0eWxlLndhcnBOb25lJyxcblx0XHRcdFx0d2FycFZhbHVlOiBxdWlsdFdhcnAud2FycFZhbHVlLFxuXHRcdFx0XHR3YXJwUGVyc3BlY3RpdmU6IHF1aWx0V2FycC53YXJwUGVyc3BlY3RpdmUsXG5cdFx0XHRcdHdhcnBQZXJzcGVjdGl2ZU90aGVyOiBxdWlsdFdhcnAud2FycFBlcnNwZWN0aXZlT3RoZXIsXG5cdFx0XHRcdHdhcnBSb3RhdGU6IHF1aWx0V2FycC53YXJwUm90YXRlLFxuXHRcdFx0XHRib3VuZHM6IHF1aWx0V2FycC5ib3VuZHMsXG5cdFx0XHRcdHVPcmRlcjogcXVpbHRXYXJwLnVPcmRlcixcblx0XHRcdFx0dk9yZGVyOiBxdWlsdFdhcnAudk9yZGVyLFxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVsZXRlIGRlc2MucXVpbHRXYXJwO1xuXHRcdH1cblxuXHRcdGlmIChwbGFjZWQuY29tcCkgZGVzYy5jb21wID0gcGxhY2VkLmNvbXA7XG5cdFx0aWYgKHBsYWNlZC5jb21wSW5mbykgZGVzYy5jb21wSW5mbyA9IHBsYWNlZC5jb21wSW5mbztcblxuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCBkZXNjLCBkZXNjLnF1aWx0V2FycCA/ICdxdWlsdFdhcnAnIDogJ3dhcnAnKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdmeHJwJyxcblx0aGFzS2V5KCdyZWZlcmVuY2VQb2ludCcpLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHtcblx0XHR0YXJnZXQucmVmZXJlbmNlUG9pbnQgPSB7XG5cdFx0XHR4OiByZWFkRmxvYXQ2NChyZWFkZXIpLFxuXHRcdFx0eTogcmVhZEZsb2F0NjQocmVhZGVyKSxcblx0XHR9O1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZUZsb2F0NjQod3JpdGVyLCB0YXJnZXQucmVmZXJlbmNlUG9pbnQhLngpO1xuXHRcdHdyaXRlRmxvYXQ2NCh3cml0ZXIsIHRhcmdldC5yZWZlcmVuY2VQb2ludCEueSk7XG5cdH0sXG4pO1xuXG5pZiAoTU9DS19IQU5ETEVSUykge1xuXHRhZGRIYW5kbGVyKFxuXHRcdCdQYXR0Jyxcblx0XHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9QYXR0ICE9PSB1bmRlZmluZWQsXG5cdFx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0XHQvLyBjb25zb2xlLmxvZygnYWRkaXRpb25hbCBpbmZvOiBQYXR0Jyk7XG5cdFx0XHQodGFyZ2V0IGFzIGFueSkuX1BhdHQgPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdH0sXG5cdFx0KHdyaXRlciwgdGFyZ2V0KSA9PiBmYWxzZSAmJiB3cml0ZUJ5dGVzKHdyaXRlciwgKHRhcmdldCBhcyBhbnkpLl9QYXR0KSxcblx0KTtcbn0gZWxzZSB7XG5cdGFkZEhhbmRsZXIoXG5cdFx0J1BhdHQnLCAvLyBUT0RPOiBoYW5kbGUgYWxzbyBQYXQyICYgUGF0M1xuXHRcdHRhcmdldCA9PiAhdGFyZ2V0LFxuXHRcdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdFx0aWYgKCFsZWZ0KCkpIHJldHVybjtcblxuXHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTsgcmV0dXJuOyAvLyBub3Qgc3VwcG9ydGVkIHlldFxuXHRcdFx0dGFyZ2V0OyByZWFkUGF0dGVybjtcblxuXHRcdFx0Ly8gaWYgKCF0YXJnZXQucGF0dGVybnMpIHRhcmdldC5wYXR0ZXJucyA9IFtdO1xuXHRcdFx0Ly8gdGFyZ2V0LnBhdHRlcm5zLnB1c2gocmVhZFBhdHRlcm4ocmVhZGVyKSk7XG5cdFx0XHQvLyBza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdH0sXG5cdFx0KF93cml0ZXIsIF90YXJnZXQpID0+IHtcblx0XHR9LFxuXHQpO1xufVxuXG5mdW5jdGlvbiByZWFkUmVjdChyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRjb25zdCB0b3AgPSByZWFkSW50MzIocmVhZGVyKTtcblx0Y29uc3QgbGVmdCA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRjb25zdCBib3R0b20gPSByZWFkSW50MzIocmVhZGVyKTtcblx0Y29uc3QgcmlnaHQgPSByZWFkSW50MzIocmVhZGVyKTtcblx0cmV0dXJuIHsgdG9wLCBsZWZ0LCBib3R0b20sIHJpZ2h0IH07XG59XG5cbmZ1bmN0aW9uIHdyaXRlUmVjdCh3cml0ZXI6IFBzZFdyaXRlciwgcmVjdDogeyBsZWZ0OiBudW1iZXI7IHRvcDogbnVtYmVyOyByaWdodDogbnVtYmVyOyBib3R0b206IG51bWJlciB9KSB7XG5cdHdyaXRlSW50MzIod3JpdGVyLCByZWN0LnRvcCk7XG5cdHdyaXRlSW50MzIod3JpdGVyLCByZWN0LmxlZnQpO1xuXHR3cml0ZUludDMyKHdyaXRlciwgcmVjdC5ib3R0b20pO1xuXHR3cml0ZUludDMyKHdyaXRlciwgcmVjdC5yaWdodCk7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdBbm5vJyxcblx0dGFyZ2V0ID0+ICh0YXJnZXQgYXMgUHNkKS5hbm5vdGF0aW9ucyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRjb25zdCBtYWpvciA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRjb25zdCBtaW5vciA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRpZiAobWFqb3IgIT09IDIgfHwgbWlub3IgIT09IDEpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBBbm5vIHZlcnNpb24nKTtcblx0XHRjb25zdCBjb3VudCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRjb25zdCBhbm5vdGF0aW9uczogQW5ub3RhdGlvbltdID0gW107XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcblx0XHRcdC8qY29uc3QgbGVuZ3RoID0qLyByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0XHRjb25zdCB0eXBlID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xuXHRcdFx0Y29uc3Qgb3BlbiA9ICEhcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHQvKmNvbnN0IGZsYWdzID0qLyByZWFkVWludDgocmVhZGVyKTsgLy8gYWx3YXlzIDI4XG5cdFx0XHQvKmNvbnN0IG9wdGlvbmFsQmxvY2tzID0qLyByZWFkVWludDE2KHJlYWRlcik7XG5cdFx0XHRjb25zdCBpY29uTG9jYXRpb24gPSByZWFkUmVjdChyZWFkZXIpO1xuXHRcdFx0Y29uc3QgcG9wdXBMb2NhdGlvbiA9IHJlYWRSZWN0KHJlYWRlcik7XG5cdFx0XHRjb25zdCBjb2xvciA9IHJlYWRDb2xvcihyZWFkZXIpO1xuXHRcdFx0Y29uc3QgYXV0aG9yID0gcmVhZFBhc2NhbFN0cmluZyhyZWFkZXIsIDIpO1xuXHRcdFx0Y29uc3QgbmFtZSA9IHJlYWRQYXNjYWxTdHJpbmcocmVhZGVyLCAyKTtcblx0XHRcdGNvbnN0IGRhdGUgPSByZWFkUGFzY2FsU3RyaW5nKHJlYWRlciwgMik7XG5cdFx0XHQvKmNvbnN0IGNvbnRlbnRMZW5ndGggPSovIHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdC8qY29uc3QgZGF0YVR5cGUgPSovIHJlYWRTaWduYXR1cmUocmVhZGVyKTtcblx0XHRcdGNvbnN0IGRhdGFMZW5ndGggPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0XHRsZXQgZGF0YTogc3RyaW5nIHwgVWludDhBcnJheTtcblxuXHRcdFx0aWYgKHR5cGUgPT09ICd0eHRBJykge1xuXHRcdFx0XHRpZiAoZGF0YUxlbmd0aCA+PSAyICYmIHJlYWRVaW50MTYocmVhZGVyKSA9PT0gMHhmZWZmKSB7XG5cdFx0XHRcdFx0ZGF0YSA9IHJlYWRVbmljb2RlU3RyaW5nV2l0aExlbmd0aChyZWFkZXIsIChkYXRhTGVuZ3RoIC0gMikgLyAyKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZWFkZXIub2Zmc2V0IC09IDI7XG5cdFx0XHRcdFx0ZGF0YSA9IHJlYWRBc2NpaVN0cmluZyhyZWFkZXIsIGRhdGFMZW5ndGgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZGF0YSA9IGRhdGEucmVwbGFjZSgvXFxyL2csICdcXG4nKTtcblx0XHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ3NuZEEnKSB7XG5cdFx0XHRcdGRhdGEgPSByZWFkQnl0ZXMocmVhZGVyLCBkYXRhTGVuZ3RoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVW5rbm93biBhbm5vdGF0aW9uIHR5cGUnKTtcblx0XHRcdH1cblxuXHRcdFx0YW5ub3RhdGlvbnMucHVzaCh7XG5cdFx0XHRcdHR5cGU6IHR5cGUgPT09ICd0eHRBJyA/ICd0ZXh0JyA6ICdzb3VuZCcsIG9wZW4sIGljb25Mb2NhdGlvbiwgcG9wdXBMb2NhdGlvbiwgY29sb3IsIGF1dGhvciwgbmFtZSwgZGF0ZSwgZGF0YSxcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdCh0YXJnZXQgYXMgUHNkKS5hbm5vdGF0aW9ucyA9IGFubm90YXRpb25zO1xuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGFubm90YXRpb25zID0gKHRhcmdldCBhcyBQc2QpLmFubm90YXRpb25zITtcblxuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMik7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAxKTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIGFubm90YXRpb25zLmxlbmd0aCk7XG5cblx0XHRmb3IgKGNvbnN0IGFubm90YXRpb24gb2YgYW5ub3RhdGlvbnMpIHtcblx0XHRcdGNvbnN0IHNvdW5kID0gYW5ub3RhdGlvbi50eXBlID09PSAnc291bmQnO1xuXG5cdFx0XHRpZiAoc291bmQgJiYgIShhbm5vdGF0aW9uLmRhdGEgaW5zdGFuY2VvZiBVaW50OEFycmF5KSkgdGhyb3cgbmV3IEVycm9yKCdTb3VuZCBhbm5vdGF0aW9uIGRhdGEgc2hvdWxkIGJlIFVpbnQ4QXJyYXknKTtcblx0XHRcdGlmICghc291bmQgJiYgdHlwZW9mIGFubm90YXRpb24uZGF0YSAhPT0gJ3N0cmluZycpIHRocm93IG5ldyBFcnJvcignVGV4dCBhbm5vdGF0aW9uIGRhdGEgc2hvdWxkIGJlIHN0cmluZycpO1xuXG5cdFx0XHRjb25zdCBsZW5ndGhPZmZzZXQgPSB3cml0ZXIub2Zmc2V0O1xuXHRcdFx0d3JpdGVVaW50MzIod3JpdGVyLCAwKTsgLy8gbGVuZ3RoXG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIHNvdW5kID8gJ3NuZEEnIDogJ3R4dEEnKTtcblx0XHRcdHdyaXRlVWludDgod3JpdGVyLCBhbm5vdGF0aW9uLm9wZW4gPyAxIDogMCk7XG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgMjgpO1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCAxKTtcblx0XHRcdHdyaXRlUmVjdCh3cml0ZXIsIGFubm90YXRpb24uaWNvbkxvY2F0aW9uKTtcblx0XHRcdHdyaXRlUmVjdCh3cml0ZXIsIGFubm90YXRpb24ucG9wdXBMb2NhdGlvbik7XG5cdFx0XHR3cml0ZUNvbG9yKHdyaXRlciwgYW5ub3RhdGlvbi5jb2xvcik7XG5cdFx0XHR3cml0ZVBhc2NhbFN0cmluZyh3cml0ZXIsIGFubm90YXRpb24uYXV0aG9yIHx8ICcnLCAyKTtcblx0XHRcdHdyaXRlUGFzY2FsU3RyaW5nKHdyaXRlciwgYW5ub3RhdGlvbi5uYW1lIHx8ICcnLCAyKTtcblx0XHRcdHdyaXRlUGFzY2FsU3RyaW5nKHdyaXRlciwgYW5ub3RhdGlvbi5kYXRlIHx8ICcnLCAyKTtcblx0XHRcdGNvbnN0IGNvbnRlbnRPZmZzZXQgPSB3cml0ZXIub2Zmc2V0O1xuXHRcdFx0d3JpdGVVaW50MzIod3JpdGVyLCAwKTsgLy8gY29udGVudCBsZW5ndGhcblx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgc291bmQgPyAnc25kTScgOiAndHh0QycpO1xuXHRcdFx0d3JpdGVVaW50MzIod3JpdGVyLCAwKTsgLy8gZGF0YSBsZW5ndGhcblx0XHRcdGNvbnN0IGRhdGFPZmZzZXQgPSB3cml0ZXIub2Zmc2V0O1xuXG5cdFx0XHRpZiAoc291bmQpIHtcblx0XHRcdFx0d3JpdGVCeXRlcyh3cml0ZXIsIGFubm90YXRpb24uZGF0YSBhcyBVaW50OEFycmF5KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgMHhmZWZmKTsgLy8gdW5pY29kZSBzdHJpbmcgaW5kaWNhdG9yXG5cdFx0XHRcdGNvbnN0IHRleHQgPSAoYW5ub3RhdGlvbi5kYXRhIGFzIHN0cmluZykucmVwbGFjZSgvXFxuL2csICdcXHInKTtcblx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKSB3cml0ZVVpbnQxNih3cml0ZXIsIHRleHQuY2hhckNvZGVBdChpKSk7XG5cdFx0XHR9XG5cblx0XHRcdHdyaXRlci52aWV3LnNldFVpbnQzMihsZW5ndGhPZmZzZXQsIHdyaXRlci5vZmZzZXQgLSBsZW5ndGhPZmZzZXQsIGZhbHNlKTtcblx0XHRcdHdyaXRlci52aWV3LnNldFVpbnQzMihjb250ZW50T2Zmc2V0LCB3cml0ZXIub2Zmc2V0IC0gY29udGVudE9mZnNldCwgZmFsc2UpO1xuXHRcdFx0d3JpdGVyLnZpZXcuc2V0VWludDMyKGRhdGFPZmZzZXQgLSA0LCB3cml0ZXIub2Zmc2V0IC0gZGF0YU9mZnNldCwgZmFsc2UpO1xuXHRcdH1cblx0fVxuKTtcblxuaW50ZXJmYWNlIEZpbGVPcGVuRGVzY3JpcHRvciB7XG5cdGNvbXBJbmZvOiB7IGNvbXBJRDogbnVtYmVyOyBvcmlnaW5hbENvbXBJRDogbnVtYmVyOyB9O1xufVxuXG5hZGRIYW5kbGVyKFxuXHQnbG5rMicsXG5cdCh0YXJnZXQ6IGFueSkgPT4gISEodGFyZ2V0IGFzIFBzZCkubGlua2VkRmlsZXMgJiYgKHRhcmdldCBhcyBQc2QpLmxpbmtlZEZpbGVzIS5sZW5ndGggPiAwLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQsIF8sIG9wdGlvbnMpID0+IHtcblx0XHRjb25zdCBwc2QgPSB0YXJnZXQgYXMgUHNkO1xuXHRcdHBzZC5saW5rZWRGaWxlcyA9IFtdO1xuXG5cdFx0d2hpbGUgKGxlZnQoKSA+IDgpIHtcblx0XHRcdGxldCBzaXplID0gcmVhZExlbmd0aDY0KHJlYWRlcik7IC8vIHNpemVcblx0XHRcdGNvbnN0IHN0YXJ0T2Zmc2V0ID0gcmVhZGVyLm9mZnNldDtcblx0XHRcdGNvbnN0IHR5cGUgPSByZWFkU2lnbmF0dXJlKHJlYWRlcikgYXMgJ2xpRkQnIHwgJ2xpRkUnIHwgJ2xpRkEnO1xuXHRcdFx0Y29uc3QgdmVyc2lvbiA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRcdFx0Y29uc3QgaWQgPSByZWFkUGFzY2FsU3RyaW5nKHJlYWRlciwgMSk7XG5cdFx0XHRjb25zdCBuYW1lID0gcmVhZFVuaWNvZGVTdHJpbmcocmVhZGVyKTtcblx0XHRcdGNvbnN0IGZpbGVUeXBlID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpLnRyaW0oKTsgLy8gJyAgICAnIGlmIGVtcHR5XG5cdFx0XHRjb25zdCBmaWxlQ3JlYXRvciA9IHJlYWRTaWduYXR1cmUocmVhZGVyKS50cmltKCk7IC8vICcgICAgJyBvciAnXFwwXFwwXFwwXFwwJyBpZiBlbXB0eVxuXHRcdFx0Y29uc3QgZGF0YVNpemUgPSByZWFkTGVuZ3RoNjQocmVhZGVyKTtcblx0XHRcdGNvbnN0IGhhc0ZpbGVPcGVuRGVzY3JpcHRvciA9IHJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0Y29uc3QgZmlsZU9wZW5EZXNjcmlwdG9yID0gaGFzRmlsZU9wZW5EZXNjcmlwdG9yID8gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcikgYXMgRmlsZU9wZW5EZXNjcmlwdG9yIDogdW5kZWZpbmVkO1xuXHRcdFx0Y29uc3QgbGlua2VkRmlsZURlc2NyaXB0b3IgPSB0eXBlID09PSAnbGlGRScgPyByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKSA6IHVuZGVmaW5lZDtcblx0XHRcdGNvbnN0IGZpbGU6IExpbmtlZEZpbGUgPSB7IGlkLCBuYW1lLCBkYXRhOiB1bmRlZmluZWQgfTtcblxuXHRcdFx0aWYgKGZpbGVUeXBlKSBmaWxlLnR5cGUgPSBmaWxlVHlwZTtcblx0XHRcdGlmIChmaWxlQ3JlYXRvcikgZmlsZS5jcmVhdG9yID0gZmlsZUNyZWF0b3I7XG5cdFx0XHRpZiAoZmlsZU9wZW5EZXNjcmlwdG9yKSBmaWxlLmRlc2NyaXB0b3IgPSBmaWxlT3BlbkRlc2NyaXB0b3I7XG5cblx0XHRcdGlmICh0eXBlID09PSAnbGlGRScgJiYgdmVyc2lvbiA+IDMpIHtcblx0XHRcdFx0Y29uc3QgeWVhciA9IHJlYWRJbnQzMihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBtb250aCA9IHJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBkYXkgPSByZWFkVWludDgocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgaG91ciA9IHJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBtaW51dGUgPSByZWFkVWludDgocmVhZGVyKTtcblx0XHRcdFx0Y29uc3Qgc2Vjb25kcyA9IHJlYWRGbG9hdDY0KHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHdob2xlU2Vjb25kcyA9IE1hdGguZmxvb3Ioc2Vjb25kcyk7XG5cdFx0XHRcdGNvbnN0IG1zID0gKHNlY29uZHMgLSB3aG9sZVNlY29uZHMpICogMTAwMDtcblx0XHRcdFx0ZmlsZS50aW1lID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSwgaG91ciwgbWludXRlLCB3aG9sZVNlY29uZHMsIG1zKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgZmlsZVNpemUgPSB0eXBlID09PSAnbGlGRScgPyByZWFkTGVuZ3RoNjQocmVhZGVyKSA6IDA7XG5cdFx0XHRpZiAodHlwZSA9PT0gJ2xpRkEnKSBza2lwQnl0ZXMocmVhZGVyLCA4KTtcblx0XHRcdGlmICh0eXBlID09PSAnbGlGRCcpIGZpbGUuZGF0YSA9IHJlYWRCeXRlcyhyZWFkZXIsIGRhdGFTaXplKTtcblx0XHRcdGlmICh2ZXJzaW9uID49IDUpIGZpbGUuY2hpbGREb2N1bWVudElEID0gcmVhZFVuaWNvZGVTdHJpbmcocmVhZGVyKTtcblx0XHRcdGlmICh2ZXJzaW9uID49IDYpIGZpbGUuYXNzZXRNb2RUaW1lID0gcmVhZEZsb2F0NjQocmVhZGVyKTtcblx0XHRcdGlmICh2ZXJzaW9uID49IDcpIGZpbGUuYXNzZXRMb2NrZWRTdGF0ZSA9IHJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0aWYgKHR5cGUgPT09ICdsaUZFJykgZmlsZS5kYXRhID0gcmVhZEJ5dGVzKHJlYWRlciwgZmlsZVNpemUpO1xuXG5cdFx0XHRpZiAob3B0aW9ucy5za2lwTGlua2VkRmlsZXNEYXRhKSBmaWxlLmRhdGEgPSB1bmRlZmluZWQ7XG5cblx0XHRcdHBzZC5saW5rZWRGaWxlcy5wdXNoKGZpbGUpO1xuXHRcdFx0bGlua2VkRmlsZURlc2NyaXB0b3I7XG5cblx0XHRcdHdoaWxlIChzaXplICUgNCkgc2l6ZSsrO1xuXHRcdFx0cmVhZGVyLm9mZnNldCA9IHN0YXJ0T2Zmc2V0ICsgc2l6ZTtcblx0XHR9XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpOyAvLyA/XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IHBzZCA9IHRhcmdldCBhcyBQc2Q7XG5cblx0XHRmb3IgKGNvbnN0IGZpbGUgb2YgcHNkLmxpbmtlZEZpbGVzISkge1xuXHRcdFx0bGV0IHZlcnNpb24gPSAyO1xuXG5cdFx0XHRpZiAoZmlsZS5hc3NldExvY2tlZFN0YXRlICE9IG51bGwpIHZlcnNpb24gPSA3O1xuXHRcdFx0ZWxzZSBpZiAoZmlsZS5hc3NldE1vZFRpbWUgIT0gbnVsbCkgdmVyc2lvbiA9IDY7XG5cdFx0XHRlbHNlIGlmIChmaWxlLmNoaWxkRG9jdW1lbnRJRCAhPSBudWxsKSB2ZXJzaW9uID0gNTtcblx0XHRcdC8vIFRPRE86IGVsc2UgaWYgKGZpbGUudGltZSAhPSBudWxsKSB2ZXJzaW9uID0gMzsgKG9ubHkgZm9yIGxpRkUpXG5cblx0XHRcdHdyaXRlVWludDMyKHdyaXRlciwgMCk7XG5cdFx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDApOyAvLyBzaXplXG5cdFx0XHRjb25zdCBzaXplT2Zmc2V0ID0gd3JpdGVyLm9mZnNldDtcblx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgZmlsZS5kYXRhID8gJ2xpRkQnIDogJ2xpRkEnKTtcblx0XHRcdHdyaXRlSW50MzIod3JpdGVyLCB2ZXJzaW9uKTtcblx0XHRcdHdyaXRlUGFzY2FsU3RyaW5nKHdyaXRlciwgZmlsZS5pZCB8fCAnJywgMSk7XG5cdFx0XHR3cml0ZVVuaWNvZGVTdHJpbmdXaXRoUGFkZGluZyh3cml0ZXIsIGZpbGUubmFtZSB8fCAnJyk7XG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIGZpbGUudHlwZSA/IGAke2ZpbGUudHlwZX0gICAgYC5zdWJzdHJpbmcoMCwgNCkgOiAnICAgICcpO1xuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCBmaWxlLmNyZWF0b3IgPyBgJHtmaWxlLmNyZWF0b3J9ICAgIGAuc3Vic3RyaW5nKDAsIDQpIDogJ1xcMFxcMFxcMFxcMCcpO1xuXHRcdFx0d3JpdGVMZW5ndGg2NCh3cml0ZXIsIGZpbGUuZGF0YSA/IGZpbGUuZGF0YS5ieXRlTGVuZ3RoIDogMCk7XG5cblx0XHRcdGlmIChmaWxlLmRlc2NyaXB0b3IgJiYgZmlsZS5kZXNjcmlwdG9yLmNvbXBJbmZvKSB7XG5cdFx0XHRcdGNvbnN0IGRlc2M6IEZpbGVPcGVuRGVzY3JpcHRvciA9IHtcblx0XHRcdFx0XHRjb21wSW5mbzogZmlsZS5kZXNjcmlwdG9yLmNvbXBJbmZvLFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHdyaXRlVWludDgod3JpdGVyLCAxKTtcblx0XHRcdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIDApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZmlsZS5kYXRhKSB3cml0ZUJ5dGVzKHdyaXRlciwgZmlsZS5kYXRhKTtcblx0XHRcdGVsc2Ugd3JpdGVMZW5ndGg2NCh3cml0ZXIsIDApO1xuXHRcdFx0aWYgKHZlcnNpb24gPj0gNSkgd3JpdGVVbmljb2RlU3RyaW5nV2l0aFBhZGRpbmcod3JpdGVyLCBmaWxlLmNoaWxkRG9jdW1lbnRJRCB8fCAnJyk7XG5cdFx0XHRpZiAodmVyc2lvbiA+PSA2KSB3cml0ZUZsb2F0NjQod3JpdGVyLCBmaWxlLmFzc2V0TW9kVGltZSB8fCAwKTtcblx0XHRcdGlmICh2ZXJzaW9uID49IDcpIHdyaXRlVWludDgod3JpdGVyLCBmaWxlLmFzc2V0TG9ja2VkU3RhdGUgfHwgMCk7XG5cblx0XHRcdGxldCBzaXplID0gd3JpdGVyLm9mZnNldCAtIHNpemVPZmZzZXQ7XG5cdFx0XHR3cml0ZXIudmlldy5zZXRVaW50MzIoc2l6ZU9mZnNldCAtIDQsIHNpemUsIGZhbHNlKTsgLy8gd3JpdGUgc2l6ZVxuXG5cdFx0XHR3aGlsZSAoc2l6ZSAlIDQpIHtcblx0XHRcdFx0c2l6ZSsrO1xuXHRcdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgMCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuKTtcbmFkZEhhbmRsZXJBbGlhcygnbG5rRCcsICdsbmsyJyk7XG5hZGRIYW5kbGVyQWxpYXMoJ2xuazMnLCAnbG5rMicpO1xuXG4vLyB0aGlzIHNlZW1zIHRvIGp1c3QgYmUgemVybyBzaXplIGJsb2NrLCBpZ25vcmUgaXRcbmFkZEhhbmRsZXIoXG5cdCdsbmtFJyxcblx0dGFyZ2V0ID0+ICh0YXJnZXQgYXMgYW55KS5fbG5rRSAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQsIF9wc2RzLCBvcHRpb25zKSA9PiB7XG5cdFx0aWYgKG9wdGlvbnMubG9nTWlzc2luZ0ZlYXR1cmVzICYmIGxlZnQoKSkge1xuXHRcdFx0Y29uc29sZS5sb2coYE5vbi1lbXB0eSBsbmtFIGxheWVyIGluZm8gKCR7bGVmdCgpfSBieXRlcylgKTtcblx0XHR9XG5cblx0XHRpZiAoTU9DS19IQU5ETEVSUykge1xuXHRcdFx0KHRhcmdldCBhcyBhbnkpLl9sbmtFID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0XHR9XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4gTU9DS19IQU5ETEVSUyAmJiB3cml0ZUJ5dGVzKHdyaXRlciwgKHRhcmdldCBhcyBhbnkpLl9sbmtFKSxcbik7XG5cbmludGVyZmFjZSBFeHRlbnNpb25EZXNjIHtcblx0Z2VuZXJhdG9yU2V0dGluZ3M6IHtcblx0XHRnZW5lcmF0b3JfNDVfYXNzZXRzOiB7IGpzb246IHN0cmluZzsgfTtcblx0XHRsYXllclRpbWU6IG51bWJlcjtcblx0fTtcbn1cblxuYWRkSGFuZGxlcihcblx0J3B0aHMnLFxuXHRoYXNLZXkoJ3BhdGhMaXN0JyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGRlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblxuXHRcdHRhcmdldC5wYXRoTGlzdCA9IFtdOyAvLyBUT0RPOiByZWFkIHBhdGhzIChmaW5kIGV4YW1wbGUgd2l0aCBub24tZW1wdHkgbGlzdClcblxuXHRcdGRlc2NyaXB0b3I7XG5cdFx0Ly8gY29uc29sZS5sb2coJ3B0aHMnLCBkZXNjcmlwdG9yKTsgLy8gVE9ETzogcmVtb3ZlIHRoaXNcblx0fSxcblx0KHdyaXRlciwgX3RhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGRlc2NyaXB0b3IgPSB7XG5cdFx0XHRwYXRoTGlzdDogW10sIC8vIFRPRE86IHdyaXRlIHBhdGhzXG5cdFx0fTtcblxuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ3BhdGhzRGF0YUNsYXNzJywgZGVzY3JpcHRvcik7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnbHl2cicsXG5cdGhhc0tleSgndmVyc2lvbicpLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHRhcmdldC52ZXJzaW9uID0gcmVhZFVpbnQzMihyZWFkZXIpLFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHdyaXRlVWludDMyKHdyaXRlciwgdGFyZ2V0LnZlcnNpb24hKSxcbik7XG5cbmZ1bmN0aW9uIGFkanVzdG1lbnRUeXBlKHR5cGU6IHN0cmluZykge1xuXHRyZXR1cm4gKHRhcmdldDogTGF5ZXJBZGRpdGlvbmFsSW5mbykgPT4gISF0YXJnZXQuYWRqdXN0bWVudCAmJiB0YXJnZXQuYWRqdXN0bWVudC50eXBlID09PSB0eXBlO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQnYnJpdCcsXG5cdGFkanVzdG1lbnRUeXBlKCdicmlnaHRuZXNzL2NvbnRyYXN0JyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGlmICghdGFyZ2V0LmFkanVzdG1lbnQpIHsgLy8gaWdub3JlIGlmIGdvdCBvbmUgZnJvbSBDZ0VkIGJsb2NrXG5cdFx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IHtcblx0XHRcdFx0dHlwZTogJ2JyaWdodG5lc3MvY29udHJhc3QnLFxuXHRcdFx0XHRicmlnaHRuZXNzOiByZWFkSW50MTYocmVhZGVyKSxcblx0XHRcdFx0Y29udHJhc3Q6IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdFx0XHRtZWFuVmFsdWU6IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdFx0XHRsYWJDb2xvck9ubHk6ICEhcmVhZFVpbnQ4KHJlYWRlciksXG5cdFx0XHRcdHVzZUxlZ2FjeTogdHJ1ZSxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5hZGp1c3RtZW50IGFzIEJyaWdodG5lc3NBZGp1c3RtZW50O1xuXHRcdHdyaXRlSW50MTYod3JpdGVyLCBpbmZvLmJyaWdodG5lc3MgfHwgMCk7XG5cdFx0d3JpdGVJbnQxNih3cml0ZXIsIGluZm8uY29udHJhc3QgfHwgMCk7XG5cdFx0d3JpdGVJbnQxNih3cml0ZXIsIGluZm8ubWVhblZhbHVlID8/IDEyNyk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGluZm8ubGFiQ29sb3JPbmx5ID8gMSA6IDApO1xuXHRcdHdyaXRlWmVyb3Mod3JpdGVyLCAxKTtcblx0fSxcbik7XG5cbmZ1bmN0aW9uIHJlYWRMZXZlbHNDaGFubmVsKHJlYWRlcjogUHNkUmVhZGVyKTogTGV2ZWxzQWRqdXN0bWVudENoYW5uZWwge1xuXHRjb25zdCBzaGFkb3dJbnB1dCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRjb25zdCBoaWdobGlnaHRJbnB1dCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRjb25zdCBzaGFkb3dPdXRwdXQgPSByZWFkSW50MTYocmVhZGVyKTtcblx0Y29uc3QgaGlnaGxpZ2h0T3V0cHV0ID0gcmVhZEludDE2KHJlYWRlcik7XG5cdGNvbnN0IG1pZHRvbmVJbnB1dCA9IHJlYWRJbnQxNihyZWFkZXIpIC8gMTAwO1xuXHRyZXR1cm4geyBzaGFkb3dJbnB1dCwgaGlnaGxpZ2h0SW5wdXQsIHNoYWRvd091dHB1dCwgaGlnaGxpZ2h0T3V0cHV0LCBtaWR0b25lSW5wdXQgfTtcbn1cblxuZnVuY3Rpb24gd3JpdGVMZXZlbHNDaGFubmVsKHdyaXRlcjogUHNkV3JpdGVyLCBjaGFubmVsOiBMZXZlbHNBZGp1c3RtZW50Q2hhbm5lbCkge1xuXHR3cml0ZUludDE2KHdyaXRlciwgY2hhbm5lbC5zaGFkb3dJbnB1dCk7XG5cdHdyaXRlSW50MTYod3JpdGVyLCBjaGFubmVsLmhpZ2hsaWdodElucHV0KTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIGNoYW5uZWwuc2hhZG93T3V0cHV0KTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIGNoYW5uZWwuaGlnaGxpZ2h0T3V0cHV0KTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIE1hdGgucm91bmQoY2hhbm5lbC5taWR0b25lSW5wdXQgKiAxMDApKTtcbn1cblxuYWRkSGFuZGxlcihcblx0J2xldmwnLFxuXHRhZGp1c3RtZW50VHlwZSgnbGV2ZWxzJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGlmIChyZWFkVWludDE2KHJlYWRlcikgIT09IDIpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBsZXZsIHZlcnNpb24nKTtcblxuXHRcdHRhcmdldC5hZGp1c3RtZW50ID0ge1xuXHRcdFx0Li4udGFyZ2V0LmFkanVzdG1lbnQgYXMgUHJlc2V0SW5mbyxcblx0XHRcdHR5cGU6ICdsZXZlbHMnLFxuXHRcdFx0cmdiOiByZWFkTGV2ZWxzQ2hhbm5lbChyZWFkZXIpLFxuXHRcdFx0cmVkOiByZWFkTGV2ZWxzQ2hhbm5lbChyZWFkZXIpLFxuXHRcdFx0Z3JlZW46IHJlYWRMZXZlbHNDaGFubmVsKHJlYWRlciksXG5cdFx0XHRibHVlOiByZWFkTGV2ZWxzQ2hhbm5lbChyZWFkZXIpLFxuXHRcdH07XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQgYXMgTGV2ZWxzQWRqdXN0bWVudDtcblx0XHRjb25zdCBkZWZhdWx0Q2hhbm5lbCA9IHtcblx0XHRcdHNoYWRvd0lucHV0OiAwLFxuXHRcdFx0aGlnaGxpZ2h0SW5wdXQ6IDI1NSxcblx0XHRcdHNoYWRvd091dHB1dDogMCxcblx0XHRcdGhpZ2hsaWdodE91dHB1dDogMjU1LFxuXHRcdFx0bWlkdG9uZUlucHV0OiAxLFxuXHRcdH07XG5cblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDIpOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVMZXZlbHNDaGFubmVsKHdyaXRlciwgaW5mby5yZ2IgfHwgZGVmYXVsdENoYW5uZWwpO1xuXHRcdHdyaXRlTGV2ZWxzQ2hhbm5lbCh3cml0ZXIsIGluZm8ucmVkIHx8IGRlZmF1bHRDaGFubmVsKTtcblx0XHR3cml0ZUxldmVsc0NoYW5uZWwod3JpdGVyLCBpbmZvLmJsdWUgfHwgZGVmYXVsdENoYW5uZWwpO1xuXHRcdHdyaXRlTGV2ZWxzQ2hhbm5lbCh3cml0ZXIsIGluZm8uZ3JlZW4gfHwgZGVmYXVsdENoYW5uZWwpO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgNTk7IGkrKykgd3JpdGVMZXZlbHNDaGFubmVsKHdyaXRlciwgZGVmYXVsdENoYW5uZWwpO1xuXHR9LFxuKTtcblxuZnVuY3Rpb24gcmVhZEN1cnZlQ2hhbm5lbChyZWFkZXI6IFBzZFJlYWRlcikge1xuXHRjb25zdCBub2RlcyA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0Y29uc3QgY2hhbm5lbDogQ3VydmVzQWRqdXN0bWVudENoYW5uZWwgPSBbXTtcblxuXHRmb3IgKGxldCBqID0gMDsgaiA8IG5vZGVzOyBqKyspIHtcblx0XHRjb25zdCBvdXRwdXQgPSByZWFkSW50MTYocmVhZGVyKTtcblx0XHRjb25zdCBpbnB1dCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRcdGNoYW5uZWwucHVzaCh7IGlucHV0LCBvdXRwdXQgfSk7XG5cdH1cblxuXHRyZXR1cm4gY2hhbm5lbDtcbn1cblxuZnVuY3Rpb24gd3JpdGVDdXJ2ZUNoYW5uZWwod3JpdGVyOiBQc2RXcml0ZXIsIGNoYW5uZWw6IEN1cnZlc0FkanVzdG1lbnRDaGFubmVsKSB7XG5cdHdyaXRlVWludDE2KHdyaXRlciwgY2hhbm5lbC5sZW5ndGgpO1xuXG5cdGZvciAoY29uc3QgbiBvZiBjaGFubmVsKSB7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBuLm91dHB1dCk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBuLmlucHV0KTtcblx0fVxufVxuXG5hZGRIYW5kbGVyKFxuXHQnY3VydicsXG5cdGFkanVzdG1lbnRUeXBlKCdjdXJ2ZXMnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0cmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0aWYgKHJlYWRVaW50MTYocmVhZGVyKSAhPT0gMSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGN1cnYgdmVyc2lvbicpO1xuXHRcdHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRjb25zdCBjaGFubmVscyA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRjb25zdCBpbmZvOiBDdXJ2ZXNBZGp1c3RtZW50ID0geyB0eXBlOiAnY3VydmVzJyB9O1xuXG5cdFx0aWYgKGNoYW5uZWxzICYgMSkgaW5mby5yZ2IgPSByZWFkQ3VydmVDaGFubmVsKHJlYWRlcik7XG5cdFx0aWYgKGNoYW5uZWxzICYgMikgaW5mby5yZWQgPSByZWFkQ3VydmVDaGFubmVsKHJlYWRlcik7XG5cdFx0aWYgKGNoYW5uZWxzICYgNCkgaW5mby5ncmVlbiA9IHJlYWRDdXJ2ZUNoYW5uZWwocmVhZGVyKTtcblx0XHRpZiAoY2hhbm5lbHMgJiA4KSBpbmZvLmJsdWUgPSByZWFkQ3VydmVDaGFubmVsKHJlYWRlcik7XG5cblx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IHtcblx0XHRcdC4uLnRhcmdldC5hZGp1c3RtZW50IGFzIFByZXNldEluZm8sXG5cdFx0XHQuLi5pbmZvLFxuXHRcdH07XG5cblx0XHQvLyBpZ25vcmluZywgZHVwbGljYXRlIGluZm9ybWF0aW9uXG5cdFx0Ly8gY2hlY2tTaWduYXR1cmUocmVhZGVyLCAnQ3J2ICcpO1xuXG5cdFx0Ly8gY29uc3QgY1ZlcnNpb24gPSByZWFkVWludDE2KHJlYWRlcik7XG5cdFx0Ly8gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdC8vIGNvbnN0IGNoYW5uZWxDb3VudCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblxuXHRcdC8vIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhbm5lbENvdW50OyBpKyspIHtcblx0XHQvLyBcdGNvbnN0IGluZGV4ID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdC8vIFx0Y29uc3Qgbm9kZXMgPSByZWFkVWludDE2KHJlYWRlcik7XG5cblx0XHQvLyBcdGZvciAobGV0IGogPSAwOyBqIDwgbm9kZXM7IGorKykge1xuXHRcdC8vIFx0XHRjb25zdCBvdXRwdXQgPSByZWFkSW50MTYocmVhZGVyKTtcblx0XHQvLyBcdFx0Y29uc3QgaW5wdXQgPSByZWFkSW50MTYocmVhZGVyKTtcblx0XHQvLyBcdH1cblx0XHQvLyB9XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQgYXMgQ3VydmVzQWRqdXN0bWVudDtcblx0XHRjb25zdCB7IHJnYiwgcmVkLCBncmVlbiwgYmx1ZSB9ID0gaW5mbztcblx0XHRsZXQgY2hhbm5lbHMgPSAwO1xuXHRcdGxldCBjaGFubmVsQ291bnQgPSAwO1xuXG5cdFx0aWYgKHJnYiAmJiByZ2IubGVuZ3RoKSB7IGNoYW5uZWxzIHw9IDE7IGNoYW5uZWxDb3VudCsrOyB9XG5cdFx0aWYgKHJlZCAmJiByZWQubGVuZ3RoKSB7IGNoYW5uZWxzIHw9IDI7IGNoYW5uZWxDb3VudCsrOyB9XG5cdFx0aWYgKGdyZWVuICYmIGdyZWVuLmxlbmd0aCkgeyBjaGFubmVscyB8PSA0OyBjaGFubmVsQ291bnQrKzsgfVxuXHRcdGlmIChibHVlICYmIGJsdWUubGVuZ3RoKSB7IGNoYW5uZWxzIHw9IDg7IGNoYW5uZWxDb3VudCsrOyB9XG5cblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgMCk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAxKTsgLy8gdmVyc2lvblxuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMCk7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBjaGFubmVscyk7XG5cblx0XHRpZiAocmdiICYmIHJnYi5sZW5ndGgpIHdyaXRlQ3VydmVDaGFubmVsKHdyaXRlciwgcmdiKTtcblx0XHRpZiAocmVkICYmIHJlZC5sZW5ndGgpIHdyaXRlQ3VydmVDaGFubmVsKHdyaXRlciwgcmVkKTtcblx0XHRpZiAoZ3JlZW4gJiYgZ3JlZW4ubGVuZ3RoKSB3cml0ZUN1cnZlQ2hhbm5lbCh3cml0ZXIsIGdyZWVuKTtcblx0XHRpZiAoYmx1ZSAmJiBibHVlLmxlbmd0aCkgd3JpdGVDdXJ2ZUNoYW5uZWwod3JpdGVyLCBibHVlKTtcblxuXHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJ0NydiAnKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDQpOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAwKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGNoYW5uZWxDb3VudCk7XG5cblx0XHRpZiAocmdiICYmIHJnYi5sZW5ndGgpIHsgd3JpdGVVaW50MTYod3JpdGVyLCAwKTsgd3JpdGVDdXJ2ZUNoYW5uZWwod3JpdGVyLCByZ2IpOyB9XG5cdFx0aWYgKHJlZCAmJiByZWQubGVuZ3RoKSB7IHdyaXRlVWludDE2KHdyaXRlciwgMSk7IHdyaXRlQ3VydmVDaGFubmVsKHdyaXRlciwgcmVkKTsgfVxuXHRcdGlmIChncmVlbiAmJiBncmVlbi5sZW5ndGgpIHsgd3JpdGVVaW50MTYod3JpdGVyLCAyKTsgd3JpdGVDdXJ2ZUNoYW5uZWwod3JpdGVyLCBncmVlbik7IH1cblx0XHRpZiAoYmx1ZSAmJiBibHVlLmxlbmd0aCkgeyB3cml0ZVVpbnQxNih3cml0ZXIsIDMpOyB3cml0ZUN1cnZlQ2hhbm5lbCh3cml0ZXIsIGJsdWUpOyB9XG5cblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMik7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnZXhwQScsXG5cdGFkanVzdG1lbnRUeXBlKCdleHBvc3VyZScpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRpZiAocmVhZFVpbnQxNihyZWFkZXIpICE9PSAxKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZXhwQSB2ZXJzaW9uJyk7XG5cblx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IHtcblx0XHRcdC4uLnRhcmdldC5hZGp1c3RtZW50IGFzIFByZXNldEluZm8sXG5cdFx0XHR0eXBlOiAnZXhwb3N1cmUnLFxuXHRcdFx0ZXhwb3N1cmU6IHJlYWRGbG9hdDMyKHJlYWRlciksXG5cdFx0XHRvZmZzZXQ6IHJlYWRGbG9hdDMyKHJlYWRlciksXG5cdFx0XHRnYW1tYTogcmVhZEZsb2F0MzIocmVhZGVyKSxcblx0XHR9O1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5hZGp1c3RtZW50IGFzIEV4cG9zdXJlQWRqdXN0bWVudDtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDEpOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVGbG9hdDMyKHdyaXRlciwgaW5mby5leHBvc3VyZSEpO1xuXHRcdHdyaXRlRmxvYXQzMih3cml0ZXIsIGluZm8ub2Zmc2V0ISk7XG5cdFx0d3JpdGVGbG9hdDMyKHdyaXRlciwgaW5mby5nYW1tYSEpO1xuXHRcdHdyaXRlWmVyb3Mod3JpdGVyLCAyKTtcblx0fSxcbik7XG5cbmludGVyZmFjZSBWaWJyYW5jZURlc2NyaXB0b3Ige1xuXHR2aWJyYW5jZT86IG51bWJlcjtcblx0U3RydD86IG51bWJlcjtcbn1cblxuYWRkSGFuZGxlcihcblx0J3ZpYkEnLFxuXHRhZGp1c3RtZW50VHlwZSgndmlicmFuY2UnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0Y29uc3QgZGVzYzogVmlicmFuY2VEZXNjcmlwdG9yID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcik7XG5cdFx0dGFyZ2V0LmFkanVzdG1lbnQgPSB7IHR5cGU6ICd2aWJyYW5jZScgfTtcblx0XHRpZiAoZGVzYy52aWJyYW5jZSAhPT0gdW5kZWZpbmVkKSB0YXJnZXQuYWRqdXN0bWVudC52aWJyYW5jZSA9IGRlc2MudmlicmFuY2U7XG5cdFx0aWYgKGRlc2MuU3RydCAhPT0gdW5kZWZpbmVkKSB0YXJnZXQuYWRqdXN0bWVudC5zYXR1cmF0aW9uID0gZGVzYy5TdHJ0O1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5hZGp1c3RtZW50IGFzIFZpYnJhbmNlQWRqdXN0bWVudDtcblx0XHRjb25zdCBkZXNjOiBWaWJyYW5jZURlc2NyaXB0b3IgPSB7fTtcblx0XHRpZiAoaW5mby52aWJyYW5jZSAhPT0gdW5kZWZpbmVkKSBkZXNjLnZpYnJhbmNlID0gaW5mby52aWJyYW5jZTtcblx0XHRpZiAoaW5mby5zYXR1cmF0aW9uICE9PSB1bmRlZmluZWQpIGRlc2MuU3RydCA9IGluZm8uc2F0dXJhdGlvbjtcblxuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCBkZXNjKTtcblx0fSxcbik7XG5cbmZ1bmN0aW9uIHJlYWRIdWVDaGFubmVsKHJlYWRlcjogUHNkUmVhZGVyKTogSHVlU2F0dXJhdGlvbkFkanVzdG1lbnRDaGFubmVsIHtcblx0cmV0dXJuIHtcblx0XHRhOiByZWFkSW50MTYocmVhZGVyKSxcblx0XHRiOiByZWFkSW50MTYocmVhZGVyKSxcblx0XHRjOiByZWFkSW50MTYocmVhZGVyKSxcblx0XHRkOiByZWFkSW50MTYocmVhZGVyKSxcblx0XHRodWU6IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdHNhdHVyYXRpb246IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdGxpZ2h0bmVzczogcmVhZEludDE2KHJlYWRlciksXG5cdH07XG59XG5cbmZ1bmN0aW9uIHdyaXRlSHVlQ2hhbm5lbCh3cml0ZXI6IFBzZFdyaXRlciwgY2hhbm5lbDogSHVlU2F0dXJhdGlvbkFkanVzdG1lbnRDaGFubmVsIHwgdW5kZWZpbmVkKSB7XG5cdGNvbnN0IGMgPSBjaGFubmVsIHx8IHt9IGFzIFBhcnRpYWw8SHVlU2F0dXJhdGlvbkFkanVzdG1lbnRDaGFubmVsPjtcblx0d3JpdGVJbnQxNih3cml0ZXIsIGMuYSB8fCAwKTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIGMuYiB8fCAwKTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIGMuYyB8fCAwKTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIGMuZCB8fCAwKTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIGMuaHVlIHx8IDApO1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy5zYXR1cmF0aW9uIHx8IDApO1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy5saWdodG5lc3MgfHwgMCk7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdodWUyJyxcblx0YWRqdXN0bWVudFR5cGUoJ2h1ZS9zYXR1cmF0aW9uJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGlmIChyZWFkVWludDE2KHJlYWRlcikgIT09IDIpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBodWUyIHZlcnNpb24nKTtcblxuXHRcdHRhcmdldC5hZGp1c3RtZW50ID0ge1xuXHRcdFx0Li4udGFyZ2V0LmFkanVzdG1lbnQgYXMgUHJlc2V0SW5mbyxcblx0XHRcdHR5cGU6ICdodWUvc2F0dXJhdGlvbicsXG5cdFx0XHRtYXN0ZXI6IHJlYWRIdWVDaGFubmVsKHJlYWRlciksXG5cdFx0XHRyZWRzOiByZWFkSHVlQ2hhbm5lbChyZWFkZXIpLFxuXHRcdFx0eWVsbG93czogcmVhZEh1ZUNoYW5uZWwocmVhZGVyKSxcblx0XHRcdGdyZWVuczogcmVhZEh1ZUNoYW5uZWwocmVhZGVyKSxcblx0XHRcdGN5YW5zOiByZWFkSHVlQ2hhbm5lbChyZWFkZXIpLFxuXHRcdFx0Ymx1ZXM6IHJlYWRIdWVDaGFubmVsKHJlYWRlciksXG5cdFx0XHRtYWdlbnRhczogcmVhZEh1ZUNoYW5uZWwocmVhZGVyKSxcblx0XHR9O1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5hZGp1c3RtZW50IGFzIEh1ZVNhdHVyYXRpb25BZGp1c3RtZW50O1xuXG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAyKTsgLy8gdmVyc2lvblxuXHRcdHdyaXRlSHVlQ2hhbm5lbCh3cml0ZXIsIGluZm8ubWFzdGVyKTtcblx0XHR3cml0ZUh1ZUNoYW5uZWwod3JpdGVyLCBpbmZvLnJlZHMpO1xuXHRcdHdyaXRlSHVlQ2hhbm5lbCh3cml0ZXIsIGluZm8ueWVsbG93cyk7XG5cdFx0d3JpdGVIdWVDaGFubmVsKHdyaXRlciwgaW5mby5ncmVlbnMpO1xuXHRcdHdyaXRlSHVlQ2hhbm5lbCh3cml0ZXIsIGluZm8uY3lhbnMpO1xuXHRcdHdyaXRlSHVlQ2hhbm5lbCh3cml0ZXIsIGluZm8uYmx1ZXMpO1xuXHRcdHdyaXRlSHVlQ2hhbm5lbCh3cml0ZXIsIGluZm8ubWFnZW50YXMpO1xuXHR9LFxuKTtcblxuZnVuY3Rpb24gcmVhZENvbG9yQmFsYW5jZShyZWFkZXI6IFBzZFJlYWRlcik6IENvbG9yQmFsYW5jZVZhbHVlcyB7XG5cdHJldHVybiB7XG5cdFx0Y3lhblJlZDogcmVhZEludDE2KHJlYWRlciksXG5cdFx0bWFnZW50YUdyZWVuOiByZWFkSW50MTYocmVhZGVyKSxcblx0XHR5ZWxsb3dCbHVlOiByZWFkSW50MTYocmVhZGVyKSxcblx0fTtcbn1cblxuZnVuY3Rpb24gd3JpdGVDb2xvckJhbGFuY2Uod3JpdGVyOiBQc2RXcml0ZXIsIHZhbHVlOiBQYXJ0aWFsPENvbG9yQmFsYW5jZVZhbHVlcz4pIHtcblx0d3JpdGVJbnQxNih3cml0ZXIsIHZhbHVlLmN5YW5SZWQgfHwgMCk7XG5cdHdyaXRlSW50MTYod3JpdGVyLCB2YWx1ZS5tYWdlbnRhR3JlZW4gfHwgMCk7XG5cdHdyaXRlSW50MTYod3JpdGVyLCB2YWx1ZS55ZWxsb3dCbHVlIHx8IDApO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQnYmxuYycsXG5cdGFkanVzdG1lbnRUeXBlKCdjb2xvciBiYWxhbmNlJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdHRhcmdldC5hZGp1c3RtZW50ID0ge1xuXHRcdFx0dHlwZTogJ2NvbG9yIGJhbGFuY2UnLFxuXHRcdFx0c2hhZG93czogcmVhZENvbG9yQmFsYW5jZShyZWFkZXIpLFxuXHRcdFx0bWlkdG9uZXM6IHJlYWRDb2xvckJhbGFuY2UocmVhZGVyKSxcblx0XHRcdGhpZ2hsaWdodHM6IHJlYWRDb2xvckJhbGFuY2UocmVhZGVyKSxcblx0XHRcdHByZXNlcnZlTHVtaW5vc2l0eTogISFyZWFkVWludDgocmVhZGVyKSxcblx0XHR9O1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5hZGp1c3RtZW50IGFzIENvbG9yQmFsYW5jZUFkanVzdG1lbnQ7XG5cdFx0d3JpdGVDb2xvckJhbGFuY2Uod3JpdGVyLCBpbmZvLnNoYWRvd3MgfHwge30pO1xuXHRcdHdyaXRlQ29sb3JCYWxhbmNlKHdyaXRlciwgaW5mby5taWR0b25lcyB8fCB7fSk7XG5cdFx0d3JpdGVDb2xvckJhbGFuY2Uod3JpdGVyLCBpbmZvLmhpZ2hsaWdodHMgfHwge30pO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBpbmZvLnByZXNlcnZlTHVtaW5vc2l0eSA/IDEgOiAwKTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMSk7XG5cdH0sXG4pO1xuXG5pbnRlcmZhY2UgQmxhY2tBbmRXaGl0ZURlc2NyaXB0b3Ige1xuXHQnUmQgICc6IG51bWJlcjtcblx0WWxsdzogbnVtYmVyO1xuXHQnR3JuICc6IG51bWJlcjtcblx0J0N5biAnOiBudW1iZXI7XG5cdCdCbCAgJzogbnVtYmVyO1xuXHRNZ250OiBudW1iZXI7XG5cdHVzZVRpbnQ6IGJvb2xlYW47XG5cdHRpbnRDb2xvcj86IERlc2NyaXB0b3JDb2xvcjtcblx0YndQcmVzZXRLaW5kOiBudW1iZXI7XG5cdGJsYWNrQW5kV2hpdGVQcmVzZXRGaWxlTmFtZTogc3RyaW5nO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQnYmx3aCcsXG5cdGFkanVzdG1lbnRUeXBlKCdibGFjayAmIHdoaXRlJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGNvbnN0IGRlc2M6IEJsYWNrQW5kV2hpdGVEZXNjcmlwdG9yID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcik7XG5cdFx0dGFyZ2V0LmFkanVzdG1lbnQgPSB7XG5cdFx0XHR0eXBlOiAnYmxhY2sgJiB3aGl0ZScsXG5cdFx0XHRyZWRzOiBkZXNjWydSZCAgJ10sXG5cdFx0XHR5ZWxsb3dzOiBkZXNjLllsbHcsXG5cdFx0XHRncmVlbnM6IGRlc2NbJ0dybiAnXSxcblx0XHRcdGN5YW5zOiBkZXNjWydDeW4gJ10sXG5cdFx0XHRibHVlczogZGVzY1snQmwgICddLFxuXHRcdFx0bWFnZW50YXM6IGRlc2MuTWdudCxcblx0XHRcdHVzZVRpbnQ6ICEhZGVzYy51c2VUaW50LFxuXHRcdFx0cHJlc2V0S2luZDogZGVzYy5id1ByZXNldEtpbmQsXG5cdFx0XHRwcmVzZXRGaWxlTmFtZTogZGVzYy5ibGFja0FuZFdoaXRlUHJlc2V0RmlsZU5hbWUsXG5cdFx0fTtcblxuXHRcdGlmIChkZXNjLnRpbnRDb2xvciAhPT0gdW5kZWZpbmVkKSB0YXJnZXQuYWRqdXN0bWVudC50aW50Q29sb3IgPSBwYXJzZUNvbG9yKGRlc2MudGludENvbG9yKTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGluZm8gPSB0YXJnZXQuYWRqdXN0bWVudCBhcyBCbGFja0FuZFdoaXRlQWRqdXN0bWVudDtcblx0XHRjb25zdCBkZXNjOiBCbGFja0FuZFdoaXRlRGVzY3JpcHRvciA9IHtcblx0XHRcdCdSZCAgJzogaW5mby5yZWRzIHx8IDAsXG5cdFx0XHRZbGx3OiBpbmZvLnllbGxvd3MgfHwgMCxcblx0XHRcdCdHcm4gJzogaW5mby5ncmVlbnMgfHwgMCxcblx0XHRcdCdDeW4gJzogaW5mby5jeWFucyB8fCAwLFxuXHRcdFx0J0JsICAnOiBpbmZvLmJsdWVzIHx8IDAsXG5cdFx0XHRNZ250OiBpbmZvLm1hZ2VudGFzIHx8IDAsXG5cdFx0XHR1c2VUaW50OiAhIWluZm8udXNlVGludCxcblx0XHRcdHRpbnRDb2xvcjogc2VyaWFsaXplQ29sb3IoaW5mby50aW50Q29sb3IpLFxuXHRcdFx0YndQcmVzZXRLaW5kOiBpbmZvLnByZXNldEtpbmQgfHwgMCxcblx0XHRcdGJsYWNrQW5kV2hpdGVQcmVzZXRGaWxlTmFtZTogaW5mby5wcmVzZXRGaWxlTmFtZSB8fCAnJyxcblx0XHR9O1xuXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J3BoZmwnLFxuXHRhZGp1c3RtZW50VHlwZSgncGhvdG8gZmlsdGVyJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGNvbnN0IHZlcnNpb24gPSByZWFkVWludDE2KHJlYWRlcik7XG5cdFx0aWYgKHZlcnNpb24gIT09IDIgJiYgdmVyc2lvbiAhPT0gMykgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBoZmwgdmVyc2lvbicpO1xuXG5cdFx0bGV0IGNvbG9yOiBDb2xvcjtcblxuXHRcdGlmICh2ZXJzaW9uID09PSAyKSB7XG5cdFx0XHRjb2xvciA9IHJlYWRDb2xvcihyZWFkZXIpO1xuXHRcdH0gZWxzZSB7IC8vIHZlcnNpb24gM1xuXHRcdFx0Ly8gVE9ETzogdGVzdCB0aGlzLCB0aGlzIGlzIHByb2JhYmx5IHdyb25nXG5cdFx0XHRjb2xvciA9IHtcblx0XHRcdFx0bDogcmVhZEludDMyKHJlYWRlcikgLyAxMDAsXG5cdFx0XHRcdGE6IHJlYWRJbnQzMihyZWFkZXIpIC8gMTAwLFxuXHRcdFx0XHRiOiByZWFkSW50MzIocmVhZGVyKSAvIDEwMCxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0dGFyZ2V0LmFkanVzdG1lbnQgPSB7XG5cdFx0XHR0eXBlOiAncGhvdG8gZmlsdGVyJyxcblx0XHRcdGNvbG9yLFxuXHRcdFx0ZGVuc2l0eTogcmVhZFVpbnQzMihyZWFkZXIpIC8gMTAwLFxuXHRcdFx0cHJlc2VydmVMdW1pbm9zaXR5OiAhIXJlYWRVaW50OChyZWFkZXIpLFxuXHRcdH07XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQgYXMgUGhvdG9GaWx0ZXJBZGp1c3RtZW50O1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMik7IC8vIHZlcnNpb25cblx0XHR3cml0ZUNvbG9yKHdyaXRlciwgaW5mby5jb2xvciB8fCB7IGw6IDAsIGE6IDAsIGI6IDAgfSk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCAoaW5mby5kZW5zaXR5IHx8IDApICogMTAwKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgaW5mby5wcmVzZXJ2ZUx1bWlub3NpdHkgPyAxIDogMCk7XG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDMpO1xuXHR9LFxuKTtcblxuZnVuY3Rpb24gcmVhZE1peHJDaGFubmVsKHJlYWRlcjogUHNkUmVhZGVyKTogQ2hhbm5lbE1peGVyQ2hhbm5lbCB7XG5cdGNvbnN0IHJlZCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRjb25zdCBncmVlbiA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRjb25zdCBibHVlID0gcmVhZEludDE2KHJlYWRlcik7XG5cdHNraXBCeXRlcyhyZWFkZXIsIDIpO1xuXHRjb25zdCBjb25zdGFudCA9IHJlYWRJbnQxNihyZWFkZXIpO1xuXHRyZXR1cm4geyByZWQsIGdyZWVuLCBibHVlLCBjb25zdGFudCB9O1xufVxuXG5mdW5jdGlvbiB3cml0ZU1peHJDaGFubmVsKHdyaXRlcjogUHNkV3JpdGVyLCBjaGFubmVsOiBDaGFubmVsTWl4ZXJDaGFubmVsIHwgdW5kZWZpbmVkKSB7XG5cdGNvbnN0IGMgPSBjaGFubmVsIHx8IHt9IGFzIFBhcnRpYWw8Q2hhbm5lbE1peGVyQ2hhbm5lbD47XG5cdHdyaXRlSW50MTYod3JpdGVyLCBjLnJlZCEpO1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy5ncmVlbiEpO1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy5ibHVlISk7XG5cdHdyaXRlWmVyb3Mod3JpdGVyLCAyKTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIGMuY29uc3RhbnQhKTtcbn1cblxuYWRkSGFuZGxlcihcblx0J21peHInLFxuXHRhZGp1c3RtZW50VHlwZSgnY2hhbm5lbCBtaXhlcicpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRpZiAocmVhZFVpbnQxNihyZWFkZXIpICE9PSAxKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbWl4ciB2ZXJzaW9uJyk7XG5cblx0XHRjb25zdCBhZGp1c3RtZW50OiBDaGFubmVsTWl4ZXJBZGp1c3RtZW50ID0gdGFyZ2V0LmFkanVzdG1lbnQgPSB7XG5cdFx0XHQuLi50YXJnZXQuYWRqdXN0bWVudCBhcyBQcmVzZXRJbmZvLFxuXHRcdFx0dHlwZTogJ2NoYW5uZWwgbWl4ZXInLFxuXHRcdFx0bW9ub2Nocm9tZTogISFyZWFkVWludDE2KHJlYWRlciksXG5cdFx0fTtcblxuXHRcdGlmICghYWRqdXN0bWVudC5tb25vY2hyb21lKSB7XG5cdFx0XHRhZGp1c3RtZW50LnJlZCA9IHJlYWRNaXhyQ2hhbm5lbChyZWFkZXIpO1xuXHRcdFx0YWRqdXN0bWVudC5ncmVlbiA9IHJlYWRNaXhyQ2hhbm5lbChyZWFkZXIpO1xuXHRcdFx0YWRqdXN0bWVudC5ibHVlID0gcmVhZE1peHJDaGFubmVsKHJlYWRlcik7XG5cdFx0fVxuXG5cdFx0YWRqdXN0bWVudC5ncmF5ID0gcmVhZE1peHJDaGFubmVsKHJlYWRlcik7XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQgYXMgQ2hhbm5lbE1peGVyQWRqdXN0bWVudDtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDEpOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLm1vbm9jaHJvbWUgPyAxIDogMCk7XG5cblx0XHRpZiAoaW5mby5tb25vY2hyb21lKSB7XG5cdFx0XHR3cml0ZU1peHJDaGFubmVsKHdyaXRlciwgaW5mby5ncmF5KTtcblx0XHRcdHdyaXRlWmVyb3Mod3JpdGVyLCAzICogNSAqIDIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR3cml0ZU1peHJDaGFubmVsKHdyaXRlciwgaW5mby5yZWQpO1xuXHRcdFx0d3JpdGVNaXhyQ2hhbm5lbCh3cml0ZXIsIGluZm8uZ3JlZW4pO1xuXHRcdFx0d3JpdGVNaXhyQ2hhbm5lbCh3cml0ZXIsIGluZm8uYmx1ZSk7XG5cdFx0XHR3cml0ZU1peHJDaGFubmVsKHdyaXRlciwgaW5mby5ncmF5KTtcblx0XHR9XG5cdH0sXG4pO1xuXG5jb25zdCBjb2xvckxvb2t1cFR5cGUgPSBjcmVhdGVFbnVtPCczZGx1dCcgfCAnYWJzdHJhY3RQcm9maWxlJyB8ICdkZXZpY2VMaW5rUHJvZmlsZSc+KCdjb2xvckxvb2t1cFR5cGUnLCAnM0RMVVQnLCB7XG5cdCczZGx1dCc6ICczRExVVCcsXG5cdGFic3RyYWN0UHJvZmlsZTogJ2Fic3RyYWN0UHJvZmlsZScsXG5cdGRldmljZUxpbmtQcm9maWxlOiAnZGV2aWNlTGlua1Byb2ZpbGUnLFxufSk7XG5cbmNvbnN0IExVVEZvcm1hdFR5cGUgPSBjcmVhdGVFbnVtPCdsb29rJyB8ICdjdWJlJyB8ICczZGwnPignTFVURm9ybWF0VHlwZScsICdsb29rJywge1xuXHRsb29rOiAnTFVURm9ybWF0TE9PSycsXG5cdGN1YmU6ICdMVVRGb3JtYXRDVUJFJyxcblx0JzNkbCc6ICdMVVRGb3JtYXQzREwnLFxufSk7XG5cbmNvbnN0IGNvbG9yTG9va3VwT3JkZXIgPSBjcmVhdGVFbnVtPCdyZ2InIHwgJ2Jncic+KCdjb2xvckxvb2t1cE9yZGVyJywgJ3JnYicsIHtcblx0cmdiOiAncmdiT3JkZXInLFxuXHRiZ3I6ICdiZ3JPcmRlcicsXG59KTtcblxuaW50ZXJmYWNlIENvbG9yTG9va3VwRGVzY3JpcHRvciB7XG5cdGxvb2t1cFR5cGU/OiBzdHJpbmc7XG5cdCdObSAgJz86IHN0cmluZztcblx0RHRocj86IGJvb2xlYW47XG5cdHByb2ZpbGU/OiBVaW50OEFycmF5O1xuXHRMVVRGb3JtYXQ/OiBzdHJpbmc7XG5cdGRhdGFPcmRlcj86IHN0cmluZztcblx0dGFibGVPcmRlcj86IHN0cmluZztcblx0TFVUM0RGaWxlRGF0YT86IFVpbnQ4QXJyYXk7XG5cdExVVDNERmlsZU5hbWU/OiBzdHJpbmc7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdjbHJMJyxcblx0YWRqdXN0bWVudFR5cGUoJ2NvbG9yIGxvb2t1cCcpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRpZiAocmVhZFVpbnQxNihyZWFkZXIpICE9PSAxKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2xyTCB2ZXJzaW9uJyk7XG5cblx0XHRjb25zdCBkZXNjOiBDb2xvckxvb2t1cERlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IHsgdHlwZTogJ2NvbG9yIGxvb2t1cCcgfTtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmFkanVzdG1lbnQ7XG5cblx0XHRpZiAoZGVzYy5sb29rdXBUeXBlICE9PSB1bmRlZmluZWQpIGluZm8ubG9va3VwVHlwZSA9IGNvbG9yTG9va3VwVHlwZS5kZWNvZGUoZGVzYy5sb29rdXBUeXBlKTtcblx0XHRpZiAoZGVzY1snTm0gICddICE9PSB1bmRlZmluZWQpIGluZm8ubmFtZSA9IGRlc2NbJ05tICAnXTtcblx0XHRpZiAoZGVzYy5EdGhyICE9PSB1bmRlZmluZWQpIGluZm8uZGl0aGVyID0gZGVzYy5EdGhyO1xuXHRcdGlmIChkZXNjLnByb2ZpbGUgIT09IHVuZGVmaW5lZCkgaW5mby5wcm9maWxlID0gZGVzYy5wcm9maWxlO1xuXHRcdGlmIChkZXNjLkxVVEZvcm1hdCAhPT0gdW5kZWZpbmVkKSBpbmZvLmx1dEZvcm1hdCA9IExVVEZvcm1hdFR5cGUuZGVjb2RlKGRlc2MuTFVURm9ybWF0KTtcblx0XHRpZiAoZGVzYy5kYXRhT3JkZXIgIT09IHVuZGVmaW5lZCkgaW5mby5kYXRhT3JkZXIgPSBjb2xvckxvb2t1cE9yZGVyLmRlY29kZShkZXNjLmRhdGFPcmRlcik7XG5cdFx0aWYgKGRlc2MudGFibGVPcmRlciAhPT0gdW5kZWZpbmVkKSBpbmZvLnRhYmxlT3JkZXIgPSBjb2xvckxvb2t1cE9yZGVyLmRlY29kZShkZXNjLnRhYmxlT3JkZXIpO1xuXHRcdGlmIChkZXNjLkxVVDNERmlsZURhdGEgIT09IHVuZGVmaW5lZCkgaW5mby5sdXQzREZpbGVEYXRhID0gZGVzYy5MVVQzREZpbGVEYXRhO1xuXHRcdGlmIChkZXNjLkxVVDNERmlsZU5hbWUgIT09IHVuZGVmaW5lZCkgaW5mby5sdXQzREZpbGVOYW1lID0gZGVzYy5MVVQzREZpbGVOYW1lO1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5hZGp1c3RtZW50IGFzIENvbG9yTG9va3VwQWRqdXN0bWVudDtcblx0XHRjb25zdCBkZXNjOiBDb2xvckxvb2t1cERlc2NyaXB0b3IgPSB7fTtcblxuXHRcdGlmIChpbmZvLmxvb2t1cFR5cGUgIT09IHVuZGVmaW5lZCkgZGVzYy5sb29rdXBUeXBlID0gY29sb3JMb29rdXBUeXBlLmVuY29kZShpbmZvLmxvb2t1cFR5cGUpO1xuXHRcdGlmIChpbmZvLm5hbWUgIT09IHVuZGVmaW5lZCkgZGVzY1snTm0gICddID0gaW5mby5uYW1lO1xuXHRcdGlmIChpbmZvLmRpdGhlciAhPT0gdW5kZWZpbmVkKSBkZXNjLkR0aHIgPSBpbmZvLmRpdGhlcjtcblx0XHRpZiAoaW5mby5wcm9maWxlICE9PSB1bmRlZmluZWQpIGRlc2MucHJvZmlsZSA9IGluZm8ucHJvZmlsZTtcblx0XHRpZiAoaW5mby5sdXRGb3JtYXQgIT09IHVuZGVmaW5lZCkgZGVzYy5MVVRGb3JtYXQgPSBMVVRGb3JtYXRUeXBlLmVuY29kZShpbmZvLmx1dEZvcm1hdCk7XG5cdFx0aWYgKGluZm8uZGF0YU9yZGVyICE9PSB1bmRlZmluZWQpIGRlc2MuZGF0YU9yZGVyID0gY29sb3JMb29rdXBPcmRlci5lbmNvZGUoaW5mby5kYXRhT3JkZXIpO1xuXHRcdGlmIChpbmZvLnRhYmxlT3JkZXIgIT09IHVuZGVmaW5lZCkgZGVzYy50YWJsZU9yZGVyID0gY29sb3JMb29rdXBPcmRlci5lbmNvZGUoaW5mby50YWJsZU9yZGVyKTtcblx0XHRpZiAoaW5mby5sdXQzREZpbGVEYXRhICE9PSB1bmRlZmluZWQpIGRlc2MuTFVUM0RGaWxlRGF0YSA9IGluZm8ubHV0M0RGaWxlRGF0YTtcblx0XHRpZiAoaW5mby5sdXQzREZpbGVOYW1lICE9PSB1bmRlZmluZWQpIGRlc2MuTFVUM0RGaWxlTmFtZSA9IGluZm8ubHV0M0RGaWxlTmFtZTtcblxuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMSk7IC8vIHZlcnNpb25cblx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdudWxsJywgZGVzYyk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnbnZydCcsXG5cdGFkanVzdG1lbnRUeXBlKCdpbnZlcnQnKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0dGFyZ2V0LmFkanVzdG1lbnQgPSB7IHR5cGU6ICdpbnZlcnQnIH07XG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KCkgPT4ge1xuXHRcdC8vIG5vdGhpbmcgdG8gd3JpdGUgaGVyZVxuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J3Bvc3QnLFxuXHRhZGp1c3RtZW50VHlwZSgncG9zdGVyaXplJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdHRhcmdldC5hZGp1c3RtZW50ID0ge1xuXHRcdFx0dHlwZTogJ3Bvc3Rlcml6ZScsXG5cdFx0XHRsZXZlbHM6IHJlYWRVaW50MTYocmVhZGVyKSxcblx0XHR9O1xuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGluZm8gPSB0YXJnZXQuYWRqdXN0bWVudCBhcyBQb3N0ZXJpemVBZGp1c3RtZW50O1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgaW5mby5sZXZlbHMgPz8gNCk7XG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDIpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J3RocnMnLFxuXHRhZGp1c3RtZW50VHlwZSgndGhyZXNob2xkJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdHRhcmdldC5hZGp1c3RtZW50ID0ge1xuXHRcdFx0dHlwZTogJ3RocmVzaG9sZCcsXG5cdFx0XHRsZXZlbDogcmVhZFVpbnQxNihyZWFkZXIpLFxuXHRcdH07XG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5hZGp1c3RtZW50IGFzIFRocmVzaG9sZEFkanVzdG1lbnQ7XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLmxldmVsID8/IDEyOCk7XG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDIpO1xuXHR9LFxuKTtcblxuY29uc3QgZ3JkbUNvbG9yTW9kZWxzID0gWycnLCAnJywgJycsICdyZ2InLCAnaHNiJywgJycsICdsYWInXTtcblxuYWRkSGFuZGxlcihcblx0J2dyZG0nLFxuXHRhZGp1c3RtZW50VHlwZSgnZ3JhZGllbnQgbWFwJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGlmIChyZWFkVWludDE2KHJlYWRlcikgIT09IDEpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBncmRtIHZlcnNpb24nKTtcblxuXHRcdGNvbnN0IGluZm86IEdyYWRpZW50TWFwQWRqdXN0bWVudCA9IHtcblx0XHRcdHR5cGU6ICdncmFkaWVudCBtYXAnLFxuXHRcdFx0Z3JhZGllbnRUeXBlOiAnc29saWQnLFxuXHRcdH07XG5cblx0XHRpbmZvLnJldmVyc2UgPSAhIXJlYWRVaW50OChyZWFkZXIpO1xuXHRcdGluZm8uZGl0aGVyID0gISFyZWFkVWludDgocmVhZGVyKTtcblx0XHRpbmZvLm5hbWUgPSByZWFkVW5pY29kZVN0cmluZyhyZWFkZXIpO1xuXHRcdGluZm8uY29sb3JTdG9wcyA9IFtdO1xuXHRcdGluZm8ub3BhY2l0eVN0b3BzID0gW107XG5cblx0XHRjb25zdCBzdG9wc0NvdW50ID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzdG9wc0NvdW50OyBpKyspIHtcblx0XHRcdGluZm8uY29sb3JTdG9wcy5wdXNoKHtcblx0XHRcdFx0bG9jYXRpb246IHJlYWRVaW50MzIocmVhZGVyKSxcblx0XHRcdFx0bWlkcG9pbnQ6IHJlYWRVaW50MzIocmVhZGVyKSAvIDEwMCxcblx0XHRcdFx0Y29sb3I6IHJlYWRDb2xvcihyZWFkZXIpLFxuXHRcdFx0fSk7XG5cdFx0XHRza2lwQnl0ZXMocmVhZGVyLCAyKTtcblx0XHR9XG5cblx0XHRjb25zdCBvcGFjaXR5U3RvcHNDb3VudCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgb3BhY2l0eVN0b3BzQ291bnQ7IGkrKykge1xuXHRcdFx0aW5mby5vcGFjaXR5U3RvcHMucHVzaCh7XG5cdFx0XHRcdGxvY2F0aW9uOiByZWFkVWludDMyKHJlYWRlciksXG5cdFx0XHRcdG1pZHBvaW50OiByZWFkVWludDMyKHJlYWRlcikgLyAxMDAsXG5cdFx0XHRcdG9wYWNpdHk6IHJlYWRVaW50MTYocmVhZGVyKSAvIDB4ZmYsXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCBleHBhbnNpb25Db3VudCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRpZiAoZXhwYW5zaW9uQ291bnQgIT09IDIpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBncmRtIGV4cGFuc2lvbiBjb3VudCcpO1xuXG5cdFx0Y29uc3QgaW50ZXJwb2xhdGlvbiA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRpbmZvLnNtb290aG5lc3MgPSBpbnRlcnBvbGF0aW9uIC8gNDA5NjtcblxuXHRcdGNvbnN0IGxlbmd0aCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRpZiAobGVuZ3RoICE9PSAzMikgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGdyZG0gbGVuZ3RoJyk7XG5cblx0XHRpbmZvLmdyYWRpZW50VHlwZSA9IHJlYWRVaW50MTYocmVhZGVyKSA/ICdub2lzZScgOiAnc29saWQnO1xuXHRcdGluZm8ucmFuZG9tU2VlZCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRpbmZvLmFkZFRyYW5zcGFyZW5jeSA9ICEhcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdGluZm8ucmVzdHJpY3RDb2xvcnMgPSAhIXJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRpbmZvLnJvdWdobmVzcyA9IHJlYWRVaW50MzIocmVhZGVyKSAvIDQwOTY7XG5cdFx0aW5mby5jb2xvck1vZGVsID0gKGdyZG1Db2xvck1vZGVsc1tyZWFkVWludDE2KHJlYWRlcildIHx8ICdyZ2InKSBhcyAncmdiJyB8ICdoc2InIHwgJ2xhYic7XG5cblx0XHRpbmZvLm1pbiA9IFtcblx0XHRcdHJlYWRVaW50MTYocmVhZGVyKSAvIDB4ODAwMCxcblx0XHRcdHJlYWRVaW50MTYocmVhZGVyKSAvIDB4ODAwMCxcblx0XHRcdHJlYWRVaW50MTYocmVhZGVyKSAvIDB4ODAwMCxcblx0XHRcdHJlYWRVaW50MTYocmVhZGVyKSAvIDB4ODAwMCxcblx0XHRdO1xuXG5cdFx0aW5mby5tYXggPSBbXG5cdFx0XHRyZWFkVWludDE2KHJlYWRlcikgLyAweDgwMDAsXG5cdFx0XHRyZWFkVWludDE2KHJlYWRlcikgLyAweDgwMDAsXG5cdFx0XHRyZWFkVWludDE2KHJlYWRlcikgLyAweDgwMDAsXG5cdFx0XHRyZWFkVWludDE2KHJlYWRlcikgLyAweDgwMDAsXG5cdFx0XTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cblx0XHRmb3IgKGNvbnN0IHMgb2YgaW5mby5jb2xvclN0b3BzKSBzLmxvY2F0aW9uIC89IGludGVycG9sYXRpb247XG5cdFx0Zm9yIChjb25zdCBzIG9mIGluZm8ub3BhY2l0eVN0b3BzKSBzLmxvY2F0aW9uIC89IGludGVycG9sYXRpb247XG5cblx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IGluZm87XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGluZm8gPSB0YXJnZXQuYWRqdXN0bWVudCBhcyBHcmFkaWVudE1hcEFkanVzdG1lbnQ7XG5cblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDEpOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGluZm8ucmV2ZXJzZSA/IDEgOiAwKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgaW5mby5kaXRoZXIgPyAxIDogMCk7XG5cdFx0d3JpdGVVbmljb2RlU3RyaW5nV2l0aFBhZGRpbmcod3JpdGVyLCBpbmZvLm5hbWUgfHwgJycpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgaW5mby5jb2xvclN0b3BzICYmIGluZm8uY29sb3JTdG9wcy5sZW5ndGggfHwgMCk7XG5cblx0XHRjb25zdCBpbnRlcnBvbGF0aW9uID0gTWF0aC5yb3VuZCgoaW5mby5zbW9vdGhuZXNzID8/IDEpICogNDA5Nik7XG5cblx0XHRmb3IgKGNvbnN0IHMgb2YgaW5mby5jb2xvclN0b3BzIHx8IFtdKSB7XG5cdFx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIE1hdGgucm91bmQocy5sb2NhdGlvbiAqIGludGVycG9sYXRpb24pKTtcblx0XHRcdHdyaXRlVWludDMyKHdyaXRlciwgTWF0aC5yb3VuZChzLm1pZHBvaW50ICogMTAwKSk7XG5cdFx0XHR3cml0ZUNvbG9yKHdyaXRlciwgcy5jb2xvcik7XG5cdFx0XHR3cml0ZVplcm9zKHdyaXRlciwgMik7XG5cdFx0fVxuXG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLm9wYWNpdHlTdG9wcyAmJiBpbmZvLm9wYWNpdHlTdG9wcy5sZW5ndGggfHwgMCk7XG5cblx0XHRmb3IgKGNvbnN0IHMgb2YgaW5mby5vcGFjaXR5U3RvcHMgfHwgW10pIHtcblx0XHRcdHdyaXRlVWludDMyKHdyaXRlciwgTWF0aC5yb3VuZChzLmxvY2F0aW9uICogaW50ZXJwb2xhdGlvbikpO1xuXHRcdFx0d3JpdGVVaW50MzIod3JpdGVyLCBNYXRoLnJvdW5kKHMubWlkcG9pbnQgKiAxMDApKTtcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5yb3VuZChzLm9wYWNpdHkgKiAweGZmKSk7XG5cdFx0fVxuXG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCAyKTsgLy8gZXhwYW5zaW9uIGNvdW50XG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbnRlcnBvbGF0aW9uKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIDMyKTsgLy8gbGVuZ3RoXG5cdFx0d3JpdGVVaW50MTYod3JpdGVyLCBpbmZvLmdyYWRpZW50VHlwZSA9PT0gJ25vaXNlJyA/IDEgOiAwKTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIGluZm8ucmFuZG9tU2VlZCB8fCAwKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZm8uYWRkVHJhbnNwYXJlbmN5ID8gMSA6IDApO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgaW5mby5yZXN0cmljdENvbG9ycyA/IDEgOiAwKTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIE1hdGgucm91bmQoKGluZm8ucm91Z2huZXNzID8/IDEpICogNDA5NikpO1xuXHRcdGNvbnN0IGNvbG9yTW9kZWwgPSBncmRtQ29sb3JNb2RlbHMuaW5kZXhPZihpbmZvLmNvbG9yTW9kZWwgPz8gJ3JnYicpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgY29sb3JNb2RlbCA9PT0gLTEgPyAzIDogY29sb3JNb2RlbCk7XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKylcblx0XHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5yb3VuZCgoaW5mby5taW4gJiYgaW5mby5taW5baV0gfHwgMCkgKiAweDgwMDApKTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKVxuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBNYXRoLnJvdW5kKChpbmZvLm1heCAmJiBpbmZvLm1heFtpXSB8fCAwKSAqIDB4ODAwMCkpO1xuXG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDQpO1xuXHR9LFxuKTtcblxuZnVuY3Rpb24gcmVhZFNlbGVjdGl2ZUNvbG9ycyhyZWFkZXI6IFBzZFJlYWRlcik6IENNWUsge1xuXHRyZXR1cm4ge1xuXHRcdGM6IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdG06IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdHk6IHJlYWRJbnQxNihyZWFkZXIpLFxuXHRcdGs6IHJlYWRJbnQxNihyZWFkZXIpLFxuXHR9O1xufVxuXG5mdW5jdGlvbiB3cml0ZVNlbGVjdGl2ZUNvbG9ycyh3cml0ZXI6IFBzZFdyaXRlciwgY215azogQ01ZSyB8IHVuZGVmaW5lZCkge1xuXHRjb25zdCBjID0gY215ayB8fCB7fSBhcyBQYXJ0aWFsPENNWUs+O1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy5jISk7XG5cdHdyaXRlSW50MTYod3JpdGVyLCBjLm0hKTtcblx0d3JpdGVJbnQxNih3cml0ZXIsIGMueSEpO1xuXHR3cml0ZUludDE2KHdyaXRlciwgYy5rISk7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdzZWxjJyxcblx0YWRqdXN0bWVudFR5cGUoJ3NlbGVjdGl2ZSBjb2xvcicpLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHtcblx0XHRpZiAocmVhZFVpbnQxNihyZWFkZXIpICE9PSAxKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc2VsYyB2ZXJzaW9uJyk7XG5cblx0XHRjb25zdCBtb2RlID0gcmVhZFVpbnQxNihyZWFkZXIpID8gJ2Fic29sdXRlJyA6ICdyZWxhdGl2ZSc7XG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgOCk7XG5cblx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IHtcblx0XHRcdHR5cGU6ICdzZWxlY3RpdmUgY29sb3InLFxuXHRcdFx0bW9kZSxcblx0XHRcdHJlZHM6IHJlYWRTZWxlY3RpdmVDb2xvcnMocmVhZGVyKSxcblx0XHRcdHllbGxvd3M6IHJlYWRTZWxlY3RpdmVDb2xvcnMocmVhZGVyKSxcblx0XHRcdGdyZWVuczogcmVhZFNlbGVjdGl2ZUNvbG9ycyhyZWFkZXIpLFxuXHRcdFx0Y3lhbnM6IHJlYWRTZWxlY3RpdmVDb2xvcnMocmVhZGVyKSxcblx0XHRcdGJsdWVzOiByZWFkU2VsZWN0aXZlQ29sb3JzKHJlYWRlciksXG5cdFx0XHRtYWdlbnRhczogcmVhZFNlbGVjdGl2ZUNvbG9ycyhyZWFkZXIpLFxuXHRcdFx0d2hpdGVzOiByZWFkU2VsZWN0aXZlQ29sb3JzKHJlYWRlciksXG5cdFx0XHRuZXV0cmFsczogcmVhZFNlbGVjdGl2ZUNvbG9ycyhyZWFkZXIpLFxuXHRcdFx0YmxhY2tzOiByZWFkU2VsZWN0aXZlQ29sb3JzKHJlYWRlciksXG5cdFx0fTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5hZGp1c3RtZW50IGFzIFNlbGVjdGl2ZUNvbG9yQWRqdXN0bWVudDtcblxuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgMSk7IC8vIHZlcnNpb25cblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIGluZm8ubW9kZSA9PT0gJ2Fic29sdXRlJyA/IDEgOiAwKTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgOCk7XG5cdFx0d3JpdGVTZWxlY3RpdmVDb2xvcnMod3JpdGVyLCBpbmZvLnJlZHMpO1xuXHRcdHdyaXRlU2VsZWN0aXZlQ29sb3JzKHdyaXRlciwgaW5mby55ZWxsb3dzKTtcblx0XHR3cml0ZVNlbGVjdGl2ZUNvbG9ycyh3cml0ZXIsIGluZm8uZ3JlZW5zKTtcblx0XHR3cml0ZVNlbGVjdGl2ZUNvbG9ycyh3cml0ZXIsIGluZm8uY3lhbnMpO1xuXHRcdHdyaXRlU2VsZWN0aXZlQ29sb3JzKHdyaXRlciwgaW5mby5ibHVlcyk7XG5cdFx0d3JpdGVTZWxlY3RpdmVDb2xvcnMod3JpdGVyLCBpbmZvLm1hZ2VudGFzKTtcblx0XHR3cml0ZVNlbGVjdGl2ZUNvbG9ycyh3cml0ZXIsIGluZm8ud2hpdGVzKTtcblx0XHR3cml0ZVNlbGVjdGl2ZUNvbG9ycyh3cml0ZXIsIGluZm8ubmV1dHJhbHMpO1xuXHRcdHdyaXRlU2VsZWN0aXZlQ29sb3JzKHdyaXRlciwgaW5mby5ibGFja3MpO1xuXHR9LFxuKTtcblxuaW50ZXJmYWNlIEJyaWdodG5lc3NDb250cmFzdERlc2NyaXB0b3Ige1xuXHRWcnNuOiBudW1iZXI7XG5cdEJyZ2g6IG51bWJlcjtcblx0Q250cjogbnVtYmVyO1xuXHRtZWFuczogbnVtYmVyO1xuXHQnTGFiICc6IGJvb2xlYW47XG5cdHVzZUxlZ2FjeTogYm9vbGVhbjtcblx0QXV0bzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIFByZXNldERlc2NyaXB0b3Ige1xuXHRWcnNuOiBudW1iZXI7XG5cdHByZXNldEtpbmQ6IG51bWJlcjtcblx0cHJlc2V0RmlsZU5hbWU6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEN1cnZlc1ByZXNldERlc2NyaXB0b3Ige1xuXHRWcnNuOiBudW1iZXI7XG5cdGN1cnZlc1ByZXNldEtpbmQ6IG51bWJlcjtcblx0Y3VydmVzUHJlc2V0RmlsZU5hbWU6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIE1peGVyUHJlc2V0RGVzY3JpcHRvciB7XG5cdFZyc246IG51bWJlcjtcblx0bWl4ZXJQcmVzZXRLaW5kOiBudW1iZXI7XG5cdG1peGVyUHJlc2V0RmlsZU5hbWU6IHN0cmluZztcbn1cblxuYWRkSGFuZGxlcihcblx0J0NnRWQnLFxuXHR0YXJnZXQgPT4ge1xuXHRcdGNvbnN0IGEgPSB0YXJnZXQuYWRqdXN0bWVudDtcblxuXHRcdGlmICghYSkgcmV0dXJuIGZhbHNlO1xuXG5cdFx0cmV0dXJuIChhLnR5cGUgPT09ICdicmlnaHRuZXNzL2NvbnRyYXN0JyAmJiAhYS51c2VMZWdhY3kpIHx8XG5cdFx0XHQoKGEudHlwZSA9PT0gJ2xldmVscycgfHwgYS50eXBlID09PSAnY3VydmVzJyB8fCBhLnR5cGUgPT09ICdleHBvc3VyZScgfHwgYS50eXBlID09PSAnY2hhbm5lbCBtaXhlcicgfHxcblx0XHRcdFx0YS50eXBlID09PSAnaHVlL3NhdHVyYXRpb24nKSAmJiBhLnByZXNldEZpbGVOYW1lICE9PSB1bmRlZmluZWQpO1xuXHR9LFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRjb25zdCBkZXNjID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcikgYXNcblx0XHRcdEJyaWdodG5lc3NDb250cmFzdERlc2NyaXB0b3IgfCBQcmVzZXREZXNjcmlwdG9yIHwgQ3VydmVzUHJlc2V0RGVzY3JpcHRvciB8IE1peGVyUHJlc2V0RGVzY3JpcHRvcjtcblx0XHRpZiAoZGVzYy5WcnNuICE9PSAxKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgQ2dFZCB2ZXJzaW9uJyk7XG5cblx0XHQvLyB0aGlzIHNlY3Rpb24gY2FuIHNwZWNpZnkgcHJlc2V0IGZpbGUgbmFtZSBmb3Igb3RoZXIgYWRqdXN0bWVudCB0eXBlc1xuXHRcdGlmICgncHJlc2V0RmlsZU5hbWUnIGluIGRlc2MpIHtcblx0XHRcdHRhcmdldC5hZGp1c3RtZW50ID0ge1xuXHRcdFx0XHQuLi50YXJnZXQuYWRqdXN0bWVudCBhcyBMZXZlbHNBZGp1c3RtZW50IHwgRXhwb3N1cmVBZGp1c3RtZW50IHwgSHVlU2F0dXJhdGlvbkFkanVzdG1lbnQsXG5cdFx0XHRcdHByZXNldEtpbmQ6IGRlc2MucHJlc2V0S2luZCxcblx0XHRcdFx0cHJlc2V0RmlsZU5hbWU6IGRlc2MucHJlc2V0RmlsZU5hbWUsXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSBpZiAoJ2N1cnZlc1ByZXNldEZpbGVOYW1lJyBpbiBkZXNjKSB7XG5cdFx0XHR0YXJnZXQuYWRqdXN0bWVudCA9IHtcblx0XHRcdFx0Li4udGFyZ2V0LmFkanVzdG1lbnQgYXMgQ3VydmVzQWRqdXN0bWVudCxcblx0XHRcdFx0cHJlc2V0S2luZDogZGVzYy5jdXJ2ZXNQcmVzZXRLaW5kLFxuXHRcdFx0XHRwcmVzZXRGaWxlTmFtZTogZGVzYy5jdXJ2ZXNQcmVzZXRGaWxlTmFtZSxcblx0XHRcdH07XG5cdFx0fSBlbHNlIGlmICgnbWl4ZXJQcmVzZXRGaWxlTmFtZScgaW4gZGVzYykge1xuXHRcdFx0dGFyZ2V0LmFkanVzdG1lbnQgPSB7XG5cdFx0XHRcdC4uLnRhcmdldC5hZGp1c3RtZW50IGFzIEN1cnZlc0FkanVzdG1lbnQsXG5cdFx0XHRcdHByZXNldEtpbmQ6IGRlc2MubWl4ZXJQcmVzZXRLaW5kLFxuXHRcdFx0XHRwcmVzZXRGaWxlTmFtZTogZGVzYy5taXhlclByZXNldEZpbGVOYW1lLFxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGFyZ2V0LmFkanVzdG1lbnQgPSB7XG5cdFx0XHRcdHR5cGU6ICdicmlnaHRuZXNzL2NvbnRyYXN0Jyxcblx0XHRcdFx0YnJpZ2h0bmVzczogZGVzYy5CcmdoLFxuXHRcdFx0XHRjb250cmFzdDogZGVzYy5DbnRyLFxuXHRcdFx0XHRtZWFuVmFsdWU6IGRlc2MubWVhbnMsXG5cdFx0XHRcdHVzZUxlZ2FjeTogISFkZXNjLnVzZUxlZ2FjeSxcblx0XHRcdFx0bGFiQ29sb3JPbmx5OiAhIWRlc2NbJ0xhYiAnXSxcblx0XHRcdFx0YXV0bzogISFkZXNjLkF1dG8sXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGluZm8gPSB0YXJnZXQuYWRqdXN0bWVudCE7XG5cblx0XHRpZiAoaW5mby50eXBlID09PSAnbGV2ZWxzJyB8fCBpbmZvLnR5cGUgPT09ICdleHBvc3VyZScgfHwgaW5mby50eXBlID09PSAnaHVlL3NhdHVyYXRpb24nKSB7XG5cdFx0XHRjb25zdCBkZXNjOiBQcmVzZXREZXNjcmlwdG9yID0ge1xuXHRcdFx0XHRWcnNuOiAxLFxuXHRcdFx0XHRwcmVzZXRLaW5kOiBpbmZvLnByZXNldEtpbmQgPz8gMSxcblx0XHRcdFx0cHJlc2V0RmlsZU5hbWU6IGluZm8ucHJlc2V0RmlsZU5hbWUgfHwgJycsXG5cdFx0XHR9O1xuXHRcdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHRcdH0gZWxzZSBpZiAoaW5mby50eXBlID09PSAnY3VydmVzJykge1xuXHRcdFx0Y29uc3QgZGVzYzogQ3VydmVzUHJlc2V0RGVzY3JpcHRvciA9IHtcblx0XHRcdFx0VnJzbjogMSxcblx0XHRcdFx0Y3VydmVzUHJlc2V0S2luZDogaW5mby5wcmVzZXRLaW5kID8/IDEsXG5cdFx0XHRcdGN1cnZlc1ByZXNldEZpbGVOYW1lOiBpbmZvLnByZXNldEZpbGVOYW1lIHx8ICcnLFxuXHRcdFx0fTtcblx0XHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCBkZXNjKTtcblx0XHR9IGVsc2UgaWYgKGluZm8udHlwZSA9PT0gJ2NoYW5uZWwgbWl4ZXInKSB7XG5cdFx0XHRjb25zdCBkZXNjOiBNaXhlclByZXNldERlc2NyaXB0b3IgPSB7XG5cdFx0XHRcdFZyc246IDEsXG5cdFx0XHRcdG1peGVyUHJlc2V0S2luZDogaW5mby5wcmVzZXRLaW5kID8/IDEsXG5cdFx0XHRcdG1peGVyUHJlc2V0RmlsZU5hbWU6IGluZm8ucHJlc2V0RmlsZU5hbWUgfHwgJycsXG5cdFx0XHR9O1xuXHRcdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHRcdH0gZWxzZSBpZiAoaW5mby50eXBlID09PSAnYnJpZ2h0bmVzcy9jb250cmFzdCcpIHtcblx0XHRcdGNvbnN0IGRlc2M6IEJyaWdodG5lc3NDb250cmFzdERlc2NyaXB0b3IgPSB7XG5cdFx0XHRcdFZyc246IDEsXG5cdFx0XHRcdEJyZ2g6IGluZm8uYnJpZ2h0bmVzcyB8fCAwLFxuXHRcdFx0XHRDbnRyOiBpbmZvLmNvbnRyYXN0IHx8IDAsXG5cdFx0XHRcdG1lYW5zOiBpbmZvLm1lYW5WYWx1ZSA/PyAxMjcsXG5cdFx0XHRcdCdMYWIgJzogISFpbmZvLmxhYkNvbG9yT25seSxcblx0XHRcdFx0dXNlTGVnYWN5OiAhIWluZm8udXNlTGVnYWN5LFxuXHRcdFx0XHRBdXRvOiAhIWluZm8uYXV0byxcblx0XHRcdH07XG5cdFx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdudWxsJywgZGVzYyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignVW5oYW5kbGVkIENnRWQgY2FzZScpO1xuXHRcdH1cblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdCdUeHQyJyxcblx0aGFzS2V5KCdlbmdpbmVEYXRhJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdGNvbnN0IGRhdGEgPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHRcdHRhcmdldC5lbmdpbmVEYXRhID0gZnJvbUJ5dGVBcnJheShkYXRhKTtcblx0XHQvLyBjb25zdCBlbmdpbmVEYXRhID0gcGFyc2VFbmdpbmVEYXRhKGRhdGEpO1xuXHRcdC8vIGNvbnNvbGUubG9nKHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KGVuZ2luZURhdGEsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXHRcdC8vIHJlcXVpcmUoJ2ZzJykud3JpdGVGaWxlU3luYygncmVzb3VyY2VzL2VuZ2luZURhdGEyU2ltcGxlLnR4dCcsIHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KGVuZ2luZURhdGEsIGZhbHNlLCA5OSwgZmFsc2UpLCAndXRmOCcpO1xuXHRcdC8vIHJlcXVpcmUoJ2ZzJykud3JpdGVGaWxlU3luYygndGVzdF9kYXRhLmpzb24nLCBKU09OLnN0cmluZ2lmeShlZCwgbnVsbCwgMiksICd1dGY4Jyk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGJ1ZmZlciA9IHRvQnl0ZUFycmF5KHRhcmdldC5lbmdpbmVEYXRhISk7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsIGJ1ZmZlcik7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnRk1zaycsXG5cdGhhc0tleSgnZmlsdGVyTWFzaycpLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHtcblx0XHR0YXJnZXQuZmlsdGVyTWFzayA9IHtcblx0XHRcdGNvbG9yU3BhY2U6IHJlYWRDb2xvcihyZWFkZXIpLFxuXHRcdFx0b3BhY2l0eTogcmVhZFVpbnQxNihyZWFkZXIpIC8gMHhmZixcblx0XHR9O1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZUNvbG9yKHdyaXRlciwgdGFyZ2V0LmZpbHRlck1hc2shLmNvbG9yU3BhY2UpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgY2xhbXAodGFyZ2V0LmZpbHRlck1hc2shLm9wYWNpdHkgPz8gMSwgMCwgMSkgKiAweGZmKTtcblx0fSxcbik7XG5cbmludGVyZmFjZSBBcnRkRGVzY3JpcHRvciB7XG5cdCdDbnQgJzogbnVtYmVyO1xuXHRhdXRvRXhwYW5kT2Zmc2V0OiB7IEhyem46IG51bWJlcjsgVnJ0YzogbnVtYmVyOyB9O1xuXHRvcmlnaW46IHsgSHJ6bjogbnVtYmVyOyBWcnRjOiBudW1iZXI7IH07XG5cdGF1dG9FeHBhbmRFbmFibGVkOiBib29sZWFuO1xuXHRhdXRvTmVzdEVuYWJsZWQ6IGJvb2xlYW47XG5cdGF1dG9Qb3NpdGlvbkVuYWJsZWQ6IGJvb2xlYW47XG5cdHNocmlua3dyYXBPblNhdmVFbmFibGVkOiBib29sZWFuO1xuXHRkb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kQ29sb3I6IERlc2NyaXB0b3JDb2xvcjtcblx0ZG9jRGVmYXVsdE5ld0FydGJvYXJkQmFja2dyb3VuZFR5cGU6IG51bWJlcjtcbn1cblxuYWRkSGFuZGxlcihcblx0J2FydGQnLCAvLyBkb2N1bWVudC13aWRlIGFydGJvYXJkIGluZm9cblx0dGFyZ2V0ID0+ICh0YXJnZXQgYXMgUHNkKS5hcnRib2FyZHMgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0Y29uc3QgZGVzYyA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpIGFzIEFydGREZXNjcmlwdG9yO1xuXHRcdCh0YXJnZXQgYXMgUHNkKS5hcnRib2FyZHMgPSB7XG5cdFx0XHRjb3VudDogZGVzY1snQ250ICddLFxuXHRcdFx0YXV0b0V4cGFuZE9mZnNldDogeyBob3Jpem9udGFsOiBkZXNjLmF1dG9FeHBhbmRPZmZzZXQuSHJ6biwgdmVydGljYWw6IGRlc2MuYXV0b0V4cGFuZE9mZnNldC5WcnRjIH0sXG5cdFx0XHRvcmlnaW46IHsgaG9yaXpvbnRhbDogZGVzYy5vcmlnaW4uSHJ6biwgdmVydGljYWw6IGRlc2Mub3JpZ2luLlZydGMgfSxcblx0XHRcdGF1dG9FeHBhbmRFbmFibGVkOiBkZXNjLmF1dG9FeHBhbmRFbmFibGVkLFxuXHRcdFx0YXV0b05lc3RFbmFibGVkOiBkZXNjLmF1dG9OZXN0RW5hYmxlZCxcblx0XHRcdGF1dG9Qb3NpdGlvbkVuYWJsZWQ6IGRlc2MuYXV0b1Bvc2l0aW9uRW5hYmxlZCxcblx0XHRcdHNocmlua3dyYXBPblNhdmVFbmFibGVkOiBkZXNjLnNocmlua3dyYXBPblNhdmVFbmFibGVkLFxuXHRcdFx0ZG9jRGVmYXVsdE5ld0FydGJvYXJkQmFja2dyb3VuZENvbG9yOiBwYXJzZUNvbG9yKGRlc2MuZG9jRGVmYXVsdE5ld0FydGJvYXJkQmFja2dyb3VuZENvbG9yKSxcblx0XHRcdGRvY0RlZmF1bHROZXdBcnRib2FyZEJhY2tncm91bmRUeXBlOiBkZXNjLmRvY0RlZmF1bHROZXdBcnRib2FyZEJhY2tncm91bmRUeXBlLFxuXHRcdH07XG5cblx0XHRza2lwQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBhcnRiID0gKHRhcmdldCBhcyBQc2QpLmFydGJvYXJkcyE7XG5cdFx0Y29uc3QgZGVzYzogQXJ0ZERlc2NyaXB0b3IgPSB7XG5cdFx0XHQnQ250ICc6IGFydGIuY291bnQsXG5cdFx0XHRhdXRvRXhwYW5kT2Zmc2V0OiBhcnRiLmF1dG9FeHBhbmRPZmZzZXQgPyB7IEhyem46IGFydGIuYXV0b0V4cGFuZE9mZnNldC5ob3Jpem9udGFsLCBWcnRjOiBhcnRiLmF1dG9FeHBhbmRPZmZzZXQudmVydGljYWwgfSA6IHsgSHJ6bjogMCwgVnJ0YzogMCB9LFxuXHRcdFx0b3JpZ2luOiBhcnRiLm9yaWdpbiA/IHsgSHJ6bjogYXJ0Yi5vcmlnaW4uaG9yaXpvbnRhbCwgVnJ0YzogYXJ0Yi5vcmlnaW4udmVydGljYWwgfSA6IHsgSHJ6bjogMCwgVnJ0YzogMCB9LFxuXHRcdFx0YXV0b0V4cGFuZEVuYWJsZWQ6IGFydGIuYXV0b0V4cGFuZEVuYWJsZWQgPz8gdHJ1ZSxcblx0XHRcdGF1dG9OZXN0RW5hYmxlZDogYXJ0Yi5hdXRvTmVzdEVuYWJsZWQgPz8gdHJ1ZSxcblx0XHRcdGF1dG9Qb3NpdGlvbkVuYWJsZWQ6IGFydGIuYXV0b1Bvc2l0aW9uRW5hYmxlZCA/PyB0cnVlLFxuXHRcdFx0c2hyaW5rd3JhcE9uU2F2ZUVuYWJsZWQ6IGFydGIuc2hyaW5rd3JhcE9uU2F2ZUVuYWJsZWQgPz8gdHJ1ZSxcblx0XHRcdGRvY0RlZmF1bHROZXdBcnRib2FyZEJhY2tncm91bmRDb2xvcjogc2VyaWFsaXplQ29sb3IoYXJ0Yi5kb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kQ29sb3IpLFxuXHRcdFx0ZG9jRGVmYXVsdE5ld0FydGJvYXJkQmFja2dyb3VuZFR5cGU6IGFydGIuZG9jRGVmYXVsdE5ld0FydGJvYXJkQmFja2dyb3VuZFR5cGUgPz8gMSxcblx0XHR9O1xuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCBkZXNjLCAnYXJ0ZCcpO1xuXHR9LFxuKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGhhc011bHRpRWZmZWN0cyhlZmZlY3RzOiBMYXllckVmZmVjdHNJbmZvKSB7XG5cdHJldHVybiBPYmplY3Qua2V5cyhlZmZlY3RzKS5tYXAoa2V5ID0+IChlZmZlY3RzIGFzIGFueSlba2V5XSkuc29tZSh2ID0+IEFycmF5LmlzQXJyYXkodikgJiYgdi5sZW5ndGggPiAxKTtcbn1cblxuYWRkSGFuZGxlcihcblx0J2xmeDInLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmVmZmVjdHMgIT09IHVuZGVmaW5lZCAmJiAhaGFzTXVsdGlFZmZlY3RzKHRhcmdldC5lZmZlY3RzKSxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0LCBfLCBvcHRpb25zKSA9PiB7XG5cdFx0Y29uc3QgdmVyc2lvbiA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRpZiAodmVyc2lvbiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGxmeDIgdmVyc2lvbmApO1xuXG5cdFx0Y29uc3QgZGVzYzogTGZ4MkRlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblxuXHRcdC8vIFRPRE86IGRvbid0IGRpc2NhcmQgaWYgd2UgZ290IGl0IGZyb20gbG1meFxuXHRcdC8vIGRpc2NhcmQgaWYgcmVhZCBpbiAnbHJGWCcgc2VjdGlvblxuXHRcdHRhcmdldC5lZmZlY3RzID0gcGFyc2VFZmZlY3RzKGRlc2MsICEhb3B0aW9ucy5sb2dNaXNzaW5nRmVhdHVyZXMpO1xuXG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0LCBfLCBvcHRpb25zKSA9PiB7XG5cdFx0Y29uc3QgZGVzYyA9IHNlcmlhbGl6ZUVmZmVjdHModGFyZ2V0LmVmZmVjdHMhLCAhIW9wdGlvbnMubG9nTWlzc2luZ0ZlYXR1cmVzLCBmYWxzZSk7XG5cdFx0Ly8gY29uc29sZS5sb2cocmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYywgZmFsc2UsIDk5LCB0cnVlKSk7XG5cblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDApOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHR9LFxuKTtcblxuaW50ZXJmYWNlIENpbmZEZXNjcmlwdG9yIHtcblx0VnJzbjogeyBtYWpvcjogbnVtYmVyOyBtaW5vcjogbnVtYmVyOyBmaXg6IG51bWJlcjsgfTtcblx0cHNWZXJzaW9uPzogeyBtYWpvcjogbnVtYmVyOyBtaW5vcjogbnVtYmVyOyBmaXg6IG51bWJlcjsgfTtcblx0ZGVzY3JpcHRpb246IHN0cmluZztcblx0cmVhc29uOiBzdHJpbmc7XG5cdEVuZ246IHN0cmluZzsgLy8gJ0VuZ24uY29tcENvcmUnO1xuXHRlbmFibGVDb21wQ29yZTogc3RyaW5nOyAvLyAnZW5hYmxlLmZlYXR1cmUnO1xuXHRlbmFibGVDb21wQ29yZUdQVTogc3RyaW5nOyAvLyAnZW5hYmxlLmZlYXR1cmUnO1xuXHRlbmFibGVDb21wQ29yZVRocmVhZHM/OiBzdHJpbmc7IC8vICdlbmFibGUuZmVhdHVyZSc7XG5cdGNvbXBDb3JlU3VwcG9ydDogc3RyaW5nOyAvLyAncmVhc29uLnN1cHBvcnRlZCc7XG5cdGNvbXBDb3JlR1BVU3VwcG9ydDogc3RyaW5nOyAvLyAncmVhc29uLmZlYXR1cmVEaXNhYmxlZCc7XG59XG5cbmFkZEhhbmRsZXIoXG5cdCdjaW5mJyxcblx0aGFzS2V5KCdjb21wb3NpdG9yVXNlZCcpLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRjb25zdCBkZXNjID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcikgYXMgQ2luZkRlc2NyaXB0b3I7XG5cdFx0Ly8gY29uc29sZS5sb2cocmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYywgZmFsc2UsIDk5LCB0cnVlKSk7XG5cblx0XHR0YXJnZXQuY29tcG9zaXRvclVzZWQgPSB7XG5cdFx0XHRkZXNjcmlwdGlvbjogZGVzYy5kZXNjcmlwdGlvbixcblx0XHRcdHJlYXNvbjogZGVzYy5yZWFzb24sXG5cdFx0XHRlbmdpbmU6IGRlc2MuRW5nbi5zcGxpdCgnLicpWzFdLFxuXHRcdFx0ZW5hYmxlQ29tcENvcmU6IGRlc2MuZW5hYmxlQ29tcENvcmUuc3BsaXQoJy4nKVsxXSxcblx0XHRcdGVuYWJsZUNvbXBDb3JlR1BVOiBkZXNjLmVuYWJsZUNvbXBDb3JlR1BVLnNwbGl0KCcuJylbMV0sXG5cdFx0XHRjb21wQ29yZVN1cHBvcnQ6IGRlc2MuY29tcENvcmVTdXBwb3J0LnNwbGl0KCcuJylbMV0sXG5cdFx0XHRjb21wQ29yZUdQVVN1cHBvcnQ6IGRlc2MuY29tcENvcmVHUFVTdXBwb3J0LnNwbGl0KCcuJylbMV0sXG5cdFx0fTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGNpbmYgPSB0YXJnZXQuY29tcG9zaXRvclVzZWQhO1xuXHRcdGNvbnN0IGRlc2M6IENpbmZEZXNjcmlwdG9yID0ge1xuXHRcdFx0VnJzbjogeyBtYWpvcjogMSwgbWlub3I6IDAsIGZpeDogMCB9LCAvLyBURU1QXG5cdFx0XHQvLyBwc1ZlcnNpb246IHsgbWFqb3I6IDIyLCBtaW5vcjogMywgZml4OiAxIH0sIC8vIFRFU1RJTkdcblx0XHRcdGRlc2NyaXB0aW9uOiBjaW5mLmRlc2NyaXB0aW9uLFxuXHRcdFx0cmVhc29uOiBjaW5mLnJlYXNvbixcblx0XHRcdEVuZ246IGBFbmduLiR7Y2luZi5lbmdpbmV9YCxcblx0XHRcdGVuYWJsZUNvbXBDb3JlOiBgZW5hYmxlLiR7Y2luZi5lbmFibGVDb21wQ29yZX1gLFxuXHRcdFx0ZW5hYmxlQ29tcENvcmVHUFU6IGBlbmFibGUuJHtjaW5mLmVuYWJsZUNvbXBDb3JlR1BVfWAsXG5cdFx0XHQvLyBlbmFibGVDb21wQ29yZVRocmVhZHM6IGBlbmFibGUuZmVhdHVyZWAsIC8vIFRFU1RJTkdcblx0XHRcdGNvbXBDb3JlU3VwcG9ydDogYHJlYXNvbi4ke2NpbmYuY29tcENvcmVTdXBwb3J0fWAsXG5cdFx0XHRjb21wQ29yZUdQVVN1cHBvcnQ6IGByZWFzb24uJHtjaW5mLmNvbXBDb3JlR1BVU3VwcG9ydH1gLFxuXHRcdH07XG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHR9LFxuKTtcblxuLy8gZXh0ZW5zaW9uIHNldHRpbmdzID8sIGlnbm9yZSBpdFxuYWRkSGFuZGxlcihcblx0J2V4dG4nLFxuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9leHRuICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGRlc2M6IEV4dGVuc2lvbkRlc2MgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblxuXHRcdGlmIChNT0NLX0hBTkRMRVJTKSAodGFyZ2V0IGFzIGFueSkuX2V4dG4gPSBkZXNjO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHQvLyBUT0RPOiBuZWVkIHRvIGFkZCBjb3JyZWN0IHR5cGVzIGZvciBkZXNjIGZpZWxkcyAocmVzb3VyY2VzL3NyYy5wc2QpXG5cdFx0aWYgKE1PQ0tfSEFORExFUlMpIHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCAodGFyZ2V0IGFzIGFueSkuX2V4dG4pO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J2lPcGEnLFxuXHRoYXNLZXkoJ2ZpbGxPcGFjaXR5JyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldC5maWxsT3BhY2l0eSA9IHJlYWRVaW50OChyZWFkZXIpIC8gMHhmZjtcblx0XHRza2lwQnl0ZXMocmVhZGVyLCAzKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIHRhcmdldC5maWxsT3BhY2l0eSEgKiAweGZmKTtcblx0XHR3cml0ZVplcm9zKHdyaXRlciwgMyk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQnYnJzdCcsXG5cdGhhc0tleSgnY2hhbm5lbEJsZW5kaW5nUmVzdHJpY3Rpb25zJyksXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdHRhcmdldC5jaGFubmVsQmxlbmRpbmdSZXN0cmljdGlvbnMgPSBbXTtcblxuXHRcdHdoaWxlIChsZWZ0KCkgPiA0KSB7XG5cdFx0XHR0YXJnZXQuY2hhbm5lbEJsZW5kaW5nUmVzdHJpY3Rpb25zLnB1c2gocmVhZEludDMyKHJlYWRlcikpO1xuXHRcdH1cblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Zm9yIChjb25zdCBjaGFubmVsIG9mIHRhcmdldC5jaGFubmVsQmxlbmRpbmdSZXN0cmljdGlvbnMhKSB7XG5cdFx0XHR3cml0ZUludDMyKHdyaXRlciwgY2hhbm5lbCk7XG5cdFx0fVxuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0J3RzbHknLFxuXHRoYXNLZXkoJ3RyYW5zcGFyZW5jeVNoYXBlc0xheWVyJyksXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdHRhcmdldC50cmFuc3BhcmVuY3lTaGFwZXNMYXllciA9ICEhcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0c2tpcEJ5dGVzKHJlYWRlciwgMyk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCB0YXJnZXQudHJhbnNwYXJlbmN5U2hhcGVzTGF5ZXIgPyAxIDogMCk7XG5cdFx0d3JpdGVaZXJvcyh3cml0ZXIsIDMpO1xuXHR9LFxuKTtcbiJdLCJzb3VyY2VSb290IjoiQzpcXFByb2plY3RzXFxnaXRodWJcXGFnLXBzZFxcc3JjIn0=
