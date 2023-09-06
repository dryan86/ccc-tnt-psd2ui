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
exports.hasMultiEffects = exports.readVectorMask = exports.booleanOperations = exports.readBezierKnot = exports.infoHandlersMap = exports.infoHandlers = void 0;
var base64_js_1 = require("base64-js");
var effectsHelpers_1 = require("./effectsHelpers");
var helpers_1 = require("./helpers");
var psdReader_1 = require("./psdReader");
var psdWriter_1 = require("./psdWriter");
var descriptor_1 = require("./descriptor");
var engineData_1 = require("./engineData");
var text_1 = require("./text");
exports.infoHandlers = [];
exports.infoHandlersMap = {};
function addHandler(key, has, read, write) {
    var handler = { key: key, has: has, read: read, write: write };
    exports.infoHandlers.push(handler);
    exports.infoHandlersMap[handler.key] = handler;
}
function addHandlerAlias(key, target) {
    exports.infoHandlersMap[key] = exports.infoHandlersMap[target];
}
function hasKey(key) {
    return function (target) { return target[key] !== undefined; };
}
function readLength64(reader) {
    if ((0, psdReader_1.readUint32)(reader))
        throw new Error("Resource size above 4 GB limit at ".concat(reader.offset.toString(16)));
    return (0, psdReader_1.readUint32)(reader);
}
function writeLength64(writer, length) {
    (0, psdWriter_1.writeUint32)(writer, 0);
    (0, psdWriter_1.writeUint32)(writer, length);
}
addHandler('TySh', hasKey('text'), function (reader, target, leftBytes) {
    if ((0, psdReader_1.readInt16)(reader) !== 1)
        throw new Error("Invalid TySh version");
    var transform = [];
    for (var i = 0; i < 6; i++)
        transform.push((0, psdReader_1.readFloat64)(reader));
    if ((0, psdReader_1.readInt16)(reader) !== 50)
        throw new Error("Invalid TySh text version");
    var text = (0, descriptor_1.readVersionAndDescriptor)(reader);
    if ((0, psdReader_1.readInt16)(reader) !== 1)
        throw new Error("Invalid TySh warp version");
    var warp = (0, descriptor_1.readVersionAndDescriptor)(reader);
    target.text = {
        transform: transform,
        left: (0, psdReader_1.readFloat32)(reader),
        top: (0, psdReader_1.readFloat32)(reader),
        right: (0, psdReader_1.readFloat32)(reader),
        bottom: (0, psdReader_1.readFloat32)(reader),
        text: text['Txt '].replace(/\r/g, '\n'),
        index: text.TextIndex || 0,
        gridding: descriptor_1.textGridding.decode(text.textGridding),
        antiAlias: descriptor_1.Annt.decode(text.AntA),
        orientation: descriptor_1.Ornt.decode(text.Ornt),
        warp: {
            style: descriptor_1.warpStyle.decode(warp.warpStyle),
            value: warp.warpValue || 0,
            perspective: warp.warpPerspective || 0,
            perspectiveOther: warp.warpPerspectiveOther || 0,
            rotate: descriptor_1.Ornt.decode(warp.warpRotate),
        },
    };
    if (text.EngineData) {
        var engineData = (0, engineData_1.parseEngineData)(text.EngineData);
        var textData = (0, text_1.decodeEngineData)(engineData);
        // require('fs').writeFileSync(`layer-${target.name}.txt`, require('util').inspect(engineData, false, 99, false), 'utf8');
        // const before = parseEngineData(text.EngineData);
        // const after = encodeEngineData(engineData);
        // require('fs').writeFileSync('before.txt', require('util').inspect(before, false, 99, false), 'utf8');
        // require('fs').writeFileSync('after.txt', require('util').inspect(after, false, 99, false), 'utf8');
        // console.log(require('util').inspect(parseEngineData(text.EngineData), false, 99, true));
        target.text = __assign(__assign({}, target.text), textData);
        // console.log(require('util').inspect(target.text, false, 99, true));
    }
    (0, psdReader_1.skipBytes)(reader, leftBytes());
}, function (writer, target) {
    var text = target.text;
    var warp = text.warp || {};
    var transform = text.transform || [1, 0, 0, 1, 0, 0];
    var textDescriptor = {
        'Txt ': (text.text || '').replace(/\r?\n/g, '\r'),
        textGridding: descriptor_1.textGridding.encode(text.gridding),
        Ornt: descriptor_1.Ornt.encode(text.orientation),
        AntA: descriptor_1.Annt.encode(text.antiAlias),
        TextIndex: text.index || 0,
        EngineData: (0, engineData_1.serializeEngineData)((0, text_1.encodeEngineData)(text)),
    };
    (0, psdWriter_1.writeInt16)(writer, 1); // version
    for (var i = 0; i < 6; i++) {
        (0, psdWriter_1.writeFloat64)(writer, transform[i]);
    }
    (0, psdWriter_1.writeInt16)(writer, 50); // text version
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'TxLr', textDescriptor);
    (0, psdWriter_1.writeInt16)(writer, 1); // warp version
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'warp', encodeWarp(warp));
    (0, psdWriter_1.writeFloat32)(writer, text.left);
    (0, psdWriter_1.writeFloat32)(writer, text.top);
    (0, psdWriter_1.writeFloat32)(writer, text.right);
    (0, psdWriter_1.writeFloat32)(writer, text.bottom);
    // writeZeros(writer, 2);
});
// vector fills
addHandler('SoCo', function (target) { return target.vectorFill !== undefined && target.vectorStroke === undefined &&
    target.vectorFill.type === 'color'; }, function (reader, target) {
    var descriptor = (0, descriptor_1.readVersionAndDescriptor)(reader);
    target.vectorFill = (0, descriptor_1.parseVectorContent)(descriptor);
}, function (writer, target) {
    var descriptor = (0, descriptor_1.serializeVectorContent)(target.vectorFill).descriptor;
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', descriptor);
});
addHandler('GdFl', function (target) { return target.vectorFill !== undefined && target.vectorStroke === undefined &&
    (target.vectorFill.type === 'solid' || target.vectorFill.type === 'noise'); }, function (reader, target, left) {
    var descriptor = (0, descriptor_1.readVersionAndDescriptor)(reader);
    target.vectorFill = (0, descriptor_1.parseVectorContent)(descriptor);
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var descriptor = (0, descriptor_1.serializeVectorContent)(target.vectorFill).descriptor;
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', descriptor);
});
addHandler('PtFl', function (target) { return target.vectorFill !== undefined && target.vectorStroke === undefined &&
    target.vectorFill.type === 'pattern'; }, function (reader, target) {
    var descriptor = (0, descriptor_1.readVersionAndDescriptor)(reader);
    target.vectorFill = (0, descriptor_1.parseVectorContent)(descriptor);
}, function (writer, target) {
    var descriptor = (0, descriptor_1.serializeVectorContent)(target.vectorFill).descriptor;
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', descriptor);
});
addHandler('vscg', function (target) { return target.vectorFill !== undefined && target.vectorStroke !== undefined; }, function (reader, target, left) {
    (0, psdReader_1.readSignature)(reader); // key
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
    target.vectorFill = (0, descriptor_1.parseVectorContent)(desc);
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var _a = (0, descriptor_1.serializeVectorContent)(target.vectorFill), descriptor = _a.descriptor, key = _a.key;
    (0, psdWriter_1.writeSignature)(writer, key);
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', descriptor);
});
function readBezierKnot(reader, width, height) {
    var y0 = (0, psdReader_1.readFixedPointPath32)(reader) * height;
    var x0 = (0, psdReader_1.readFixedPointPath32)(reader) * width;
    var y1 = (0, psdReader_1.readFixedPointPath32)(reader) * height;
    var x1 = (0, psdReader_1.readFixedPointPath32)(reader) * width;
    var y2 = (0, psdReader_1.readFixedPointPath32)(reader) * height;
    var x2 = (0, psdReader_1.readFixedPointPath32)(reader) * width;
    return [x0, y0, x1, y1, x2, y2];
}
exports.readBezierKnot = readBezierKnot;
function writeBezierKnot(writer, points, width, height) {
    (0, psdWriter_1.writeFixedPointPath32)(writer, points[1] / height); // y0
    (0, psdWriter_1.writeFixedPointPath32)(writer, points[0] / width); // x0
    (0, psdWriter_1.writeFixedPointPath32)(writer, points[3] / height); // y1
    (0, psdWriter_1.writeFixedPointPath32)(writer, points[2] / width); // x1
    (0, psdWriter_1.writeFixedPointPath32)(writer, points[5] / height); // y2
    (0, psdWriter_1.writeFixedPointPath32)(writer, points[4] / width); // x2
}
exports.booleanOperations = ['exclude', 'combine', 'subtract', 'intersect'];
function readVectorMask(reader, vectorMask, width, height, size) {
    var end = reader.offset + size;
    var paths = vectorMask.paths;
    var path = undefined;
    while ((end - reader.offset) >= 26) {
        var selector = (0, psdReader_1.readUint16)(reader);
        switch (selector) {
            case 0: // Closed subpath length record
            case 3: { // Open subpath length record
                (0, psdReader_1.readUint16)(reader); // count
                var boolOp = (0, psdReader_1.readInt16)(reader);
                (0, psdReader_1.readUint16)(reader); // always 1 ?
                (0, psdReader_1.skipBytes)(reader, 18);
                // TODO: 'combine' here might be wrong
                path = { open: selector === 3, operation: boolOp === -1 ? 'combine' : exports.booleanOperations[boolOp], knots: [] };
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
                (0, psdReader_1.skipBytes)(reader, 24);
                break;
            case 7: { // Clipboard record
                // TODO: check if these need to be multiplied by document size
                var top_1 = (0, psdReader_1.readFixedPointPath32)(reader);
                var left = (0, psdReader_1.readFixedPointPath32)(reader);
                var bottom = (0, psdReader_1.readFixedPointPath32)(reader);
                var right = (0, psdReader_1.readFixedPointPath32)(reader);
                var resolution = (0, psdReader_1.readFixedPointPath32)(reader);
                (0, psdReader_1.skipBytes)(reader, 4);
                vectorMask.clipboard = { top: top_1, left: left, bottom: bottom, right: right, resolution: resolution };
                break;
            }
            case 8: // Initial fill rule record
                vectorMask.fillStartsWithAllPixels = !!(0, psdReader_1.readUint16)(reader);
                (0, psdReader_1.skipBytes)(reader, 22);
                break;
            default: throw new Error('Invalid vmsk section');
        }
    }
    return paths;
}
exports.readVectorMask = readVectorMask;
addHandler('vmsk', hasKey('vectorMask'), function (reader, target, left, _a) {
    var width = _a.width, height = _a.height;
    if ((0, psdReader_1.readUint32)(reader) !== 3)
        throw new Error('Invalid vmsk version');
    target.vectorMask = { paths: [] };
    var vectorMask = target.vectorMask;
    var flags = (0, psdReader_1.readUint32)(reader);
    vectorMask.invert = (flags & 1) !== 0;
    vectorMask.notLink = (flags & 2) !== 0;
    vectorMask.disable = (flags & 4) !== 0;
    readVectorMask(reader, vectorMask, width, height, left());
    // drawBezierPaths(vectorMask.paths, width, height, 'out.png');
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target, _a) {
    var width = _a.width, height = _a.height;
    var vectorMask = target.vectorMask;
    var flags = (vectorMask.invert ? 1 : 0) |
        (vectorMask.notLink ? 2 : 0) |
        (vectorMask.disable ? 4 : 0);
    (0, psdWriter_1.writeUint32)(writer, 3); // version
    (0, psdWriter_1.writeUint32)(writer, flags);
    // initial entry
    (0, psdWriter_1.writeUint16)(writer, 6);
    (0, psdWriter_1.writeZeros)(writer, 24);
    var clipboard = vectorMask.clipboard;
    if (clipboard) {
        (0, psdWriter_1.writeUint16)(writer, 7);
        (0, psdWriter_1.writeFixedPointPath32)(writer, clipboard.top);
        (0, psdWriter_1.writeFixedPointPath32)(writer, clipboard.left);
        (0, psdWriter_1.writeFixedPointPath32)(writer, clipboard.bottom);
        (0, psdWriter_1.writeFixedPointPath32)(writer, clipboard.right);
        (0, psdWriter_1.writeFixedPointPath32)(writer, clipboard.resolution);
        (0, psdWriter_1.writeZeros)(writer, 4);
    }
    if (vectorMask.fillStartsWithAllPixels !== undefined) {
        (0, psdWriter_1.writeUint16)(writer, 8);
        (0, psdWriter_1.writeUint16)(writer, vectorMask.fillStartsWithAllPixels ? 1 : 0);
        (0, psdWriter_1.writeZeros)(writer, 22);
    }
    for (var _i = 0, _b = vectorMask.paths; _i < _b.length; _i++) {
        var path = _b[_i];
        (0, psdWriter_1.writeUint16)(writer, path.open ? 3 : 0);
        (0, psdWriter_1.writeUint16)(writer, path.knots.length);
        (0, psdWriter_1.writeUint16)(writer, Math.abs(exports.booleanOperations.indexOf(path.operation))); // default to 1 if not found
        (0, psdWriter_1.writeUint16)(writer, 1);
        (0, psdWriter_1.writeZeros)(writer, 18); // TODO: these are sometimes non-zero
        var linkedKnot = path.open ? 4 : 1;
        var unlinkedKnot = path.open ? 5 : 2;
        for (var _c = 0, _d = path.knots; _c < _d.length; _c++) {
            var _e = _d[_c], linked = _e.linked, points = _e.points;
            (0, psdWriter_1.writeUint16)(writer, linked ? linkedKnot : unlinkedKnot);
            writeBezierKnot(writer, points, width, height);
        }
    }
});
// TODO: need to write vmsk if has outline ?
addHandlerAlias('vsms', 'vmsk');
addHandler('vogk', hasKey('vectorOrigination'), function (reader, target, left) {
    if ((0, psdReader_1.readInt32)(reader) !== 1)
        throw new Error("Invalid vogk version");
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
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
                top: (0, descriptor_1.parseUnits)(i.keyOriginShapeBBox['Top ']),
                left: (0, descriptor_1.parseUnits)(i.keyOriginShapeBBox.Left),
                bottom: (0, descriptor_1.parseUnits)(i.keyOriginShapeBBox.Btom),
                right: (0, descriptor_1.parseUnits)(i.keyOriginShapeBBox.Rght),
            };
        }
        var rectRadii = i.keyOriginRRectRadii;
        if (rectRadii) {
            item.keyOriginRRectRadii = {
                topRight: (0, descriptor_1.parseUnits)(rectRadii.topRight),
                topLeft: (0, descriptor_1.parseUnits)(rectRadii.topLeft),
                bottomLeft: (0, descriptor_1.parseUnits)(rectRadii.bottomLeft),
                bottomRight: (0, descriptor_1.parseUnits)(rectRadii.bottomRight),
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
    (0, psdReader_1.skipBytes)(reader, left());
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
                    topRight: (0, descriptor_1.unitsValue)(radii.topRight, 'topRight'),
                    topLeft: (0, descriptor_1.unitsValue)(radii.topLeft, 'topLeft'),
                    bottomLeft: (0, descriptor_1.unitsValue)(radii.bottomLeft, 'bottomLeft'),
                    bottomRight: (0, descriptor_1.unitsValue)(radii.bottomRight, 'bottomRight'),
                };
            }
            var box = item.keyOriginShapeBoundingBox;
            if (box) {
                out.keyOriginShapeBBox = {
                    unitValueQuadVersion: 1,
                    'Top ': (0, descriptor_1.unitsValue)(box.top, 'top'),
                    Left: (0, descriptor_1.unitsValue)(box.left, 'left'),
                    Btom: (0, descriptor_1.unitsValue)(box.bottom, 'bottom'),
                    Rght: (0, descriptor_1.unitsValue)(box.right, 'right'),
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
    (0, psdWriter_1.writeInt32)(writer, 1); // version
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
});
addHandler('lmfx', function (target) { return target.effects !== undefined && hasMultiEffects(target.effects); }, function (reader, target, left, _, options) {
    var version = (0, psdReader_1.readUint32)(reader);
    if (version !== 0)
        throw new Error('Invalid lmfx version');
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
    // console.log(require('util').inspect(info, false, 99, true));
    // discard if read in 'lrFX' or 'lfx2' section
    target.effects = (0, descriptor_1.parseEffects)(desc, !!options.logMissingFeatures);
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target, _, options) {
    var desc = (0, descriptor_1.serializeEffects)(target.effects, !!options.logMissingFeatures, true);
    (0, psdWriter_1.writeUint32)(writer, 0); // version
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
});
addHandler('lrFX', hasKey('effects'), function (reader, target, left) {
    if (!target.effects)
        target.effects = (0, effectsHelpers_1.readEffects)(reader);
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    (0, effectsHelpers_1.writeEffects)(writer, target.effects);
});
addHandler('luni', hasKey('name'), function (reader, target, left) {
    target.name = (0, psdReader_1.readUnicodeString)(reader);
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    (0, psdWriter_1.writeUnicodeString)(writer, target.name);
    // writeUint16(writer, 0); // padding (but not extending string length)
});
addHandler('lnsr', hasKey('nameSource'), function (reader, target) { return target.nameSource = (0, psdReader_1.readSignature)(reader); }, function (writer, target) { return (0, psdWriter_1.writeSignature)(writer, target.nameSource); });
addHandler('lyid', hasKey('id'), function (reader, target) { return target.id = (0, psdReader_1.readUint32)(reader); }, function (writer, target, _psd, options) {
    var id = target.id;
    while (options.layerIds.has(id))
        id += 100; // make sure we don't have duplicate layer ids
    (0, psdWriter_1.writeUint32)(writer, id);
    options.layerIds.add(id);
    options.layerToId.set(target, id);
});
addHandler('lsct', hasKey('sectionDivider'), function (reader, target, left) {
    target.sectionDivider = { type: (0, psdReader_1.readUint32)(reader) };
    if (left()) {
        (0, psdReader_1.checkSignature)(reader, '8BIM');
        target.sectionDivider.key = (0, psdReader_1.readSignature)(reader);
    }
    if (left()) {
        target.sectionDivider.subType = (0, psdReader_1.readUint32)(reader);
    }
}, function (writer, target) {
    (0, psdWriter_1.writeUint32)(writer, target.sectionDivider.type);
    if (target.sectionDivider.key) {
        (0, psdWriter_1.writeSignature)(writer, '8BIM');
        (0, psdWriter_1.writeSignature)(writer, target.sectionDivider.key);
        if (target.sectionDivider.subType !== undefined) {
            (0, psdWriter_1.writeUint32)(writer, target.sectionDivider.subType);
        }
    }
});
// it seems lsdk is used when there's a layer is nested more than 6 levels, but I don't know why?
// maybe some limitation of old version of PS?
addHandlerAlias('lsdk', 'lsct');
addHandler('clbl', hasKey('blendClippendElements'), function (reader, target) {
    target.blendClippendElements = !!(0, psdReader_1.readUint8)(reader);
    (0, psdReader_1.skipBytes)(reader, 3);
}, function (writer, target) {
    (0, psdWriter_1.writeUint8)(writer, target.blendClippendElements ? 1 : 0);
    (0, psdWriter_1.writeZeros)(writer, 3);
});
addHandler('infx', hasKey('blendInteriorElements'), function (reader, target) {
    target.blendInteriorElements = !!(0, psdReader_1.readUint8)(reader);
    (0, psdReader_1.skipBytes)(reader, 3);
}, function (writer, target) {
    (0, psdWriter_1.writeUint8)(writer, target.blendInteriorElements ? 1 : 0);
    (0, psdWriter_1.writeZeros)(writer, 3);
});
addHandler('knko', hasKey('knockout'), function (reader, target) {
    target.knockout = !!(0, psdReader_1.readUint8)(reader);
    (0, psdReader_1.skipBytes)(reader, 3);
}, function (writer, target) {
    (0, psdWriter_1.writeUint8)(writer, target.knockout ? 1 : 0);
    (0, psdWriter_1.writeZeros)(writer, 3);
});
addHandler('lmgm', hasKey('layerMaskAsGlobalMask'), function (reader, target) {
    target.layerMaskAsGlobalMask = !!(0, psdReader_1.readUint8)(reader);
    (0, psdReader_1.skipBytes)(reader, 3);
}, function (writer, target) {
    (0, psdWriter_1.writeUint8)(writer, target.layerMaskAsGlobalMask ? 1 : 0);
    (0, psdWriter_1.writeZeros)(writer, 3);
});
addHandler('lspf', hasKey('protected'), function (reader, target) {
    var flags = (0, psdReader_1.readUint32)(reader);
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
    (0, psdWriter_1.writeUint32)(writer, flags);
});
addHandler('lclr', hasKey('layerColor'), function (reader, target) {
    var color = (0, psdReader_1.readUint16)(reader);
    (0, psdReader_1.skipBytes)(reader, 6);
    target.layerColor = helpers_1.layerColors[color];
}, function (writer, target) {
    var index = helpers_1.layerColors.indexOf(target.layerColor);
    (0, psdWriter_1.writeUint16)(writer, index === -1 ? 0 : index);
    (0, psdWriter_1.writeZeros)(writer, 6);
});
addHandler('shmd', function (target) { return target.timestamp !== undefined || target.animationFrames !== undefined ||
    target.animationFrameFlags !== undefined || target.timeline !== undefined; }, function (reader, target, left, _, options) {
    var count = (0, psdReader_1.readUint32)(reader);
    var _loop_1 = function (i) {
        (0, psdReader_1.checkSignature)(reader, '8BIM');
        var key = (0, psdReader_1.readSignature)(reader);
        (0, psdReader_1.readUint8)(reader); // copy
        (0, psdReader_1.skipBytes)(reader, 3);
        (0, psdReader_1.readSection)(reader, 1, function (left) {
            if (key === 'cust') {
                var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
                // console.log('cust', target.name, require('util').inspect(desc, false, 99, true));
                if (desc.layerTime !== undefined)
                    target.timestamp = desc.layerTime;
            }
            else if (key === 'mlst') {
                var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
                // console.log('mlst', target.name, require('util').inspect(desc, false, 99, true));
                target.animationFrames = [];
                for (var i_1 = 0; i_1 < desc.LaSt.length; i_1++) {
                    var f = desc.LaSt[i_1];
                    var frame = { frames: f.FrLs };
                    if (f.enab !== undefined)
                        frame.enable = f.enab;
                    if (f.Ofst)
                        frame.offset = (0, descriptor_1.horzVrtcToXY)(f.Ofst);
                    if (f.FXRf)
                        frame.referencePoint = (0, descriptor_1.horzVrtcToXY)(f.FXRf);
                    if (f.Lefx)
                        frame.effects = (0, descriptor_1.parseEffects)(f.Lefx, !!options.logMissingFeatures);
                    if (f.blendOptions && f.blendOptions.Opct)
                        frame.opacity = (0, descriptor_1.parsePercent)(f.blendOptions.Opct);
                    target.animationFrames.push(frame);
                }
            }
            else if (key === 'mdyn') {
                // frame flags
                (0, psdReader_1.readUint16)(reader); // unknown
                var propagate = (0, psdReader_1.readUint8)(reader);
                var flags = (0, psdReader_1.readUint8)(reader);
                target.animationFrameFlags = {
                    propagateFrameOne: !propagate,
                    unifyLayerPosition: (flags & 1) !== 0,
                    unifyLayerStyle: (flags & 2) !== 0,
                    unifyLayerVisibility: (flags & 4) !== 0,
                };
            }
            else if (key === 'tmln') {
                var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
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
                    timeline.tracks = (0, descriptor_1.parseTrackList)(desc.trackList, !!options.logMissingFeatures);
                }
                target.timeline = timeline;
                // console.log('tmln:result', target.name, target.id, require('util').inspect(timeline, false, 99, true));
            }
            else {
                options.logDevFeatures && console.log('Unhandled "shmd" section key', key);
            }
            (0, psdReader_1.skipBytes)(reader, left());
        });
    };
    for (var i = 0; i < count; i++) {
        _loop_1(i);
    }
    (0, psdReader_1.skipBytes)(reader, left());
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
    (0, psdWriter_1.writeUint32)(writer, count);
    if (animationFrames) {
        (0, psdWriter_1.writeSignature)(writer, '8BIM');
        (0, psdWriter_1.writeSignature)(writer, 'mlst');
        (0, psdWriter_1.writeUint8)(writer, 0); // copy (always false)
        (0, psdWriter_1.writeZeros)(writer, 3);
        (0, psdWriter_1.writeSection)(writer, 2, function () {
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
                    frame.Ofst = (0, descriptor_1.xyToHorzVrtc)(f.offset);
                if (f.referencePoint)
                    frame.FXRf = (0, descriptor_1.xyToHorzVrtc)(f.referencePoint);
                if (f.effects)
                    frame.Lefx = (0, descriptor_1.serializeEffects)(f.effects, false, false);
                if (f.opacity !== undefined)
                    frame.blendOptions = { Opct: (0, descriptor_1.unitsPercent)(f.opacity) };
                desc.LaSt.push(frame);
            }
            (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
        }, true);
    }
    if (animationFrameFlags) {
        (0, psdWriter_1.writeSignature)(writer, '8BIM');
        (0, psdWriter_1.writeSignature)(writer, 'mdyn');
        (0, psdWriter_1.writeUint8)(writer, 0); // copy (always false)
        (0, psdWriter_1.writeZeros)(writer, 3);
        (0, psdWriter_1.writeSection)(writer, 2, function () {
            (0, psdWriter_1.writeUint16)(writer, 0); // unknown
            (0, psdWriter_1.writeUint8)(writer, animationFrameFlags.propagateFrameOne ? 0x0 : 0xf);
            (0, psdWriter_1.writeUint8)(writer, (animationFrameFlags.unifyLayerPosition ? 1 : 0) |
                (animationFrameFlags.unifyLayerStyle ? 2 : 0) |
                (animationFrameFlags.unifyLayerVisibility ? 4 : 0));
        });
    }
    if (timeline) {
        (0, psdWriter_1.writeSignature)(writer, '8BIM');
        (0, psdWriter_1.writeSignature)(writer, 'tmln');
        (0, psdWriter_1.writeUint8)(writer, 0); // copy (always false)
        (0, psdWriter_1.writeZeros)(writer, 3);
        (0, psdWriter_1.writeSection)(writer, 2, function () {
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
                desc.trackList = (0, descriptor_1.serializeTrackList)(timeline.tracks);
            }
            var id = options.layerToId.get(target) || target.id || 0;
            if (!id)
                throw new Error('You need to provide layer.id value whan writing document with animations');
            desc.LyrI = id;
            // console.log('WRITE:tmln', target.name, target.id, require('util').inspect(desc, false, 99, true));
            (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc, 'anim');
        }, true);
    }
    if (timestamp !== undefined) {
        (0, psdWriter_1.writeSignature)(writer, '8BIM');
        (0, psdWriter_1.writeSignature)(writer, 'cust');
        (0, psdWriter_1.writeUint8)(writer, 0); // copy (always false)
        (0, psdWriter_1.writeZeros)(writer, 3);
        (0, psdWriter_1.writeSection)(writer, 2, function () {
            var desc = {
                layerTime: timestamp,
            };
            (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'metadata', desc);
        }, true);
    }
});
addHandler('vstk', hasKey('vectorStroke'), function (reader, target, left) {
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    target.vectorStroke = {
        strokeEnabled: desc.strokeEnabled,
        fillEnabled: desc.fillEnabled,
        lineWidth: (0, descriptor_1.parseUnits)(desc.strokeStyleLineWidth),
        lineDashOffset: (0, descriptor_1.parseUnits)(desc.strokeStyleLineDashOffset),
        miterLimit: desc.strokeStyleMiterLimit,
        lineCapType: descriptor_1.strokeStyleLineCapType.decode(desc.strokeStyleLineCapType),
        lineJoinType: descriptor_1.strokeStyleLineJoinType.decode(desc.strokeStyleLineJoinType),
        lineAlignment: descriptor_1.strokeStyleLineAlignment.decode(desc.strokeStyleLineAlignment),
        scaleLock: desc.strokeStyleScaleLock,
        strokeAdjust: desc.strokeStyleStrokeAdjust,
        lineDashSet: desc.strokeStyleLineDashSet.map(descriptor_1.parseUnits),
        blendMode: descriptor_1.BlnM.decode(desc.strokeStyleBlendMode),
        opacity: (0, descriptor_1.parsePercent)(desc.strokeStyleOpacity),
        content: (0, descriptor_1.parseVectorContent)(desc.strokeStyleContent),
        resolution: desc.strokeStyleResolution,
    };
    (0, psdReader_1.skipBytes)(reader, left());
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
        strokeStyleLineCapType: descriptor_1.strokeStyleLineCapType.encode(stroke.lineCapType),
        strokeStyleLineJoinType: descriptor_1.strokeStyleLineJoinType.encode(stroke.lineJoinType),
        strokeStyleLineAlignment: descriptor_1.strokeStyleLineAlignment.encode(stroke.lineAlignment),
        strokeStyleScaleLock: !!stroke.scaleLock,
        strokeStyleStrokeAdjust: !!stroke.strokeAdjust,
        strokeStyleLineDashSet: stroke.lineDashSet || [],
        strokeStyleBlendMode: descriptor_1.BlnM.encode(stroke.blendMode),
        strokeStyleOpacity: (0, descriptor_1.unitsPercent)((_b = stroke.opacity) !== null && _b !== void 0 ? _b : 1),
        strokeStyleContent: (0, descriptor_1.serializeVectorContent)(stroke.content || { type: 'color', color: { r: 0, g: 0, b: 0 } }).descriptor,
        strokeStyleResolution: (_c = stroke.resolution) !== null && _c !== void 0 ? _c : 72,
    };
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'strokeStyle', descriptor);
});
addHandler('artb', // per-layer arboard info
hasKey('artboard'), function (reader, target, left) {
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
    var rect = desc.artboardRect;
    target.artboard = {
        rect: { top: rect['Top '], left: rect.Left, bottom: rect.Btom, right: rect.Rght },
        guideIndices: desc.guideIndeces,
        presetName: desc.artboardPresetName,
        color: (0, descriptor_1.parseColor)(desc['Clr ']),
        backgroundType: desc.artboardBackgroundType,
    };
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var _a;
    var artboard = target.artboard;
    var rect = artboard.rect;
    var desc = {
        artboardRect: { 'Top ': rect.top, Left: rect.left, Btom: rect.bottom, Rght: rect.right },
        guideIndeces: artboard.guideIndices || [],
        artboardPresetName: artboard.presetName || '',
        'Clr ': (0, descriptor_1.serializeColor)(artboard.color),
        artboardBackgroundType: (_a = artboard.backgroundType) !== null && _a !== void 0 ? _a : 1,
    };
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'artboard', desc);
});
addHandler('sn2P', hasKey('usingAlignedRendering'), function (reader, target) { return target.usingAlignedRendering = !!(0, psdReader_1.readUint32)(reader); }, function (writer, target) { return (0, psdWriter_1.writeUint32)(writer, target.usingAlignedRendering ? 1 : 0); });
var placedLayerTypes = ['unknown', 'vector', 'raster', 'image stack'];
function parseWarp(warp) {
    var _a, _b, _c, _d, _e, _f;
    var result = __assign(__assign({ style: descriptor_1.warpStyle.decode(warp.warpStyle) }, (warp.warpValues ? { values: warp.warpValues } : { value: warp.warpValue || 0 })), { perspective: warp.warpPerspective || 0, perspectiveOther: warp.warpPerspectiveOther || 0, rotate: descriptor_1.Ornt.decode(warp.warpRotate), bounds: warp.bounds && {
            top: (0, descriptor_1.parseUnitsOrNumber)(warp.bounds['Top ']),
            left: (0, descriptor_1.parseUnitsOrNumber)(warp.bounds.Left),
            bottom: (0, descriptor_1.parseUnitsOrNumber)(warp.bounds.Btom),
            right: (0, descriptor_1.parseUnitsOrNumber)(warp.bounds.Rght),
        }, uOrder: warp.uOrder, vOrder: warp.vOrder });
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
    var desc = __assign(__assign({ warpStyle: descriptor_1.warpStyle.encode(warp.style) }, (warp.values ? { warpValues: warp.values } : { warpValue: warp.value })), { warpPerspective: warp.perspective || 0, warpPerspectiveOther: warp.perspectiveOther || 0, warpRotate: descriptor_1.Ornt.encode(warp.rotate), bounds: {
            'Top ': (0, descriptor_1.unitsValue)(bounds && bounds.top || { units: 'Pixels', value: 0 }, 'bounds.top'),
            Left: (0, descriptor_1.unitsValue)(bounds && bounds.left || { units: 'Pixels', value: 0 }, 'bounds.left'),
            Btom: (0, descriptor_1.unitsValue)(bounds && bounds.bottom || { units: 'Pixels', value: 0 }, 'bounds.bottom'),
            Rght: (0, descriptor_1.unitsValue)(bounds && bounds.right || { units: 'Pixels', value: 0 }, 'bounds.right'),
        }, uOrder: warp.uOrder || 0, vOrder: warp.vOrder || 0 });
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
    if ((0, psdReader_1.readSignature)(reader) !== 'plcL')
        throw new Error("Invalid PlLd signature");
    if ((0, psdReader_1.readInt32)(reader) !== 3)
        throw new Error("Invalid PlLd version");
    var id = (0, psdReader_1.readPascalString)(reader, 1);
    var pageNumber = (0, psdReader_1.readInt32)(reader);
    var totalPages = (0, psdReader_1.readInt32)(reader); // TODO: check how this works ?
    (0, psdReader_1.readInt32)(reader); // anitAliasPolicy 16
    var placedLayerType = (0, psdReader_1.readInt32)(reader); // 0 = unknown, 1 = vector, 2 = raster, 3 = image stack
    if (!placedLayerTypes[placedLayerType])
        throw new Error('Invalid PlLd type');
    var transform = [];
    for (var i = 0; i < 8; i++)
        transform.push((0, psdReader_1.readFloat64)(reader)); // x, y of 4 corners of the transform
    var warpVersion = (0, psdReader_1.readInt32)(reader);
    if (warpVersion !== 0)
        throw new Error("Invalid Warp version ".concat(warpVersion));
    var warp = (0, descriptor_1.readVersionAndDescriptor)(reader);
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
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var placed = target.placedLayer;
    (0, psdWriter_1.writeSignature)(writer, 'plcL');
    (0, psdWriter_1.writeInt32)(writer, 3); // version
    (0, psdWriter_1.writePascalString)(writer, placed.id, 1);
    (0, psdWriter_1.writeInt32)(writer, 1); // pageNumber
    (0, psdWriter_1.writeInt32)(writer, 1); // totalPages
    (0, psdWriter_1.writeInt32)(writer, 16); // anitAliasPolicy
    if (placedLayerTypes.indexOf(placed.type) === -1)
        throw new Error('Invalid placedLayer type');
    (0, psdWriter_1.writeInt32)(writer, placedLayerTypes.indexOf(placed.type));
    for (var i = 0; i < 8; i++)
        (0, psdWriter_1.writeFloat64)(writer, placed.transform[i]);
    (0, psdWriter_1.writeInt32)(writer, 0); // warp version
    var isQuilt = placed.warp && isQuiltWarp(placed.warp);
    var type = isQuilt ? 'quiltWarp' : 'warp';
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', type, encodeWarp(placed.warp || {}), type);
});
function uint8ToFloat32(array) {
    return new Float32Array(array.buffer.slice(array.byteOffset), 0, array.byteLength / 4);
}
function uint8ToUint32(array) {
    return new Uint32Array(array.buffer.slice(array.byteOffset), 0, array.byteLength / 4);
}
function toUint8(array) {
    return new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
}
function arrayToPoints(array) {
    var points = [];
    for (var i = 0; i < array.length; i += 2) {
        points.push({ x: array[i], y: array[i + 1] });
    }
    return points;
}
function pointsToArray(points) {
    var array = [];
    for (var i = 0; i < points.length; i++) {
        array.push(points[i].x, points[i].y);
    }
    return array;
}
function uin8ToPoints(array) {
    return arrayToPoints(uint8ToFloat32(array));
}
function hrznVrtcToPoint(desc) {
    return {
        x: (0, descriptor_1.parseUnits)(desc.Hrzn),
        y: (0, descriptor_1.parseUnits)(desc.Vrtc),
    };
}
function pointToHrznVrtc(point) {
    return {
        Hrzn: (0, descriptor_1.unitsValue)(point.x, 'x'),
        Vrtc: (0, descriptor_1.unitsValue)(point.y, 'y'),
    };
}
function parseFilterFX(desc) {
    return {
        enabled: desc.enab,
        validAtPosition: desc.validAtPosition,
        maskEnabled: desc.filterMaskEnable,
        maskLinked: desc.filterMaskLinked,
        maskExtendWithWhite: desc.filterMaskExtendWithWhite,
        list: desc.filterFXList.map(function (f) { return ({
            id: f.filterID,
            name: f['Nm  '],
            opacity: (0, descriptor_1.parsePercent)(f.blendOptions.Opct),
            blendMode: descriptor_1.BlnM.decode(f.blendOptions['Md  ']),
            enabled: f.enab,
            hasOptions: f.hasoptions,
            foregroundColor: (0, descriptor_1.parseColor)(f.FrgC),
            backgroundColor: (0, descriptor_1.parseColor)(f.BckC),
            filter: {
                rigidType: f.Fltr.rigidType,
                bounds: [
                    { x: f.Fltr.PuX0, y: f.Fltr.PuY0, },
                    { x: f.Fltr.PuX1, y: f.Fltr.PuY1, },
                    { x: f.Fltr.PuX2, y: f.Fltr.PuY2, },
                    { x: f.Fltr.PuX3, y: f.Fltr.PuY3, },
                ],
                puppetShapeList: f.Fltr.puppetShapeList.map(function (p) { return ({
                    rigidType: p.rigidType,
                    // TODO: VrsM
                    // TODO: VrsN
                    originalVertexArray: uin8ToPoints(p.originalVertexArray),
                    deformedVertexArray: uin8ToPoints(p.deformedVertexArray),
                    indexArray: Array.from(uint8ToUint32(p.indexArray)),
                    pinOffsets: arrayToPoints(p.pinOffsets),
                    posFinalPins: arrayToPoints(p.posFinalPins),
                    pinVertexIndices: p.pinVertexIndices,
                    selectedPin: p.selectedPin,
                    pinPosition: arrayToPoints(p.PinP),
                    pinRotation: p.PnRt,
                    pinOverlay: p.PnOv,
                    pinDepth: p.PnDp,
                    meshQuality: p.meshQuality,
                    meshExpansion: p.meshExpansion,
                    meshRigidity: p.meshRigidity,
                    imageResolution: p.imageResolution,
                    meshBoundaryPath: {
                        pathComponents: p.meshBoundaryPath.pathComponents.map(function (c) { return ({
                            shapeOperation: c.shapeOperation.split('.')[1],
                            paths: c.SbpL.map(function (t) { return ({
                                closed: t.Clsp,
                                points: t['Pts '].map(function (pt) { return ({
                                    anchor: hrznVrtcToPoint(pt.Anch),
                                    forward: hrznVrtcToPoint(pt['Fwd ']),
                                    backward: hrznVrtcToPoint(pt['Bwd ']),
                                    smooth: pt.Smoo,
                                }); }),
                            }); }),
                        }); }),
                    },
                }); }),
            },
        }); }),
    };
}
function serializeFilterFX(filter) {
    return {
        enab: filter.enabled,
        validAtPosition: filter.validAtPosition,
        filterMaskEnable: filter.maskEnabled,
        filterMaskLinked: filter.maskLinked,
        filterMaskExtendWithWhite: filter.maskExtendWithWhite,
        filterFXList: (filter.list || []).map(function (f) { return ({
            'Nm  ': f.name,
            blendOptions: {
                Opct: (0, descriptor_1.unitsPercent)(f.opacity),
                'Md  ': descriptor_1.BlnM.encode(f.blendMode),
            },
            enab: f.enabled,
            hasoptions: f.hasOptions,
            FrgC: (0, descriptor_1.serializeColor)(f.foregroundColor),
            BckC: (0, descriptor_1.serializeColor)(f.backgroundColor),
            Fltr: {
                'null': ['Ordn.Trgt'],
                rigidType: f.filter.rigidType,
                puppetShapeList: (f.filter.puppetShapeList || []).map(function (p) { return ({
                    rigidType: p.rigidType,
                    VrsM: 1,
                    VrsN: 0,
                    originalVertexArray: toUint8(new Float32Array(pointsToArray(p.originalVertexArray))),
                    deformedVertexArray: toUint8(new Float32Array(pointsToArray(p.deformedVertexArray))),
                    indexArray: toUint8(new Uint32Array(p.indexArray)),
                    pinOffsets: pointsToArray(p.pinOffsets),
                    posFinalPins: pointsToArray(p.posFinalPins),
                    selectedPin: p.selectedPin,
                    pinVertexIndices: p.pinVertexIndices,
                    PinP: pointsToArray(p.pinPosition),
                    PnRt: p.pinRotation,
                    PnOv: p.pinOverlay,
                    PnDp: p.pinDepth,
                    meshQuality: p.meshQuality,
                    meshExpansion: p.meshExpansion,
                    meshRigidity: p.meshRigidity,
                    imageResolution: p.imageResolution,
                    meshBoundaryPath: {
                        pathComponents: (p.meshBoundaryPath.pathComponents || []).map(function (c) { return ({
                            shapeOperation: "shapeOperation.".concat(c.shapeOperation),
                            SbpL: (c.paths || []).map(function (path) { return ({
                                Clsp: path.closed,
                                'Pts ': (path.points || []).map(function (pt) { return ({
                                    Anch: pointToHrznVrtc(pt.anchor),
                                    'Fwd ': pointToHrznVrtc(pt.forward),
                                    'Bwd ': pointToHrznVrtc(pt.backward),
                                    Smoo: pt.smooth,
                                }); }),
                            }); }),
                        }); }),
                    },
                }); }),
                PuX0: f.filter.bounds[0].x,
                PuX1: f.filter.bounds[1].x,
                PuX2: f.filter.bounds[2].x,
                PuX3: f.filter.bounds[3].x,
                PuY0: f.filter.bounds[0].y,
                PuY1: f.filter.bounds[1].y,
                PuY2: f.filter.bounds[2].y,
                PuY3: f.filter.bounds[3].y,
            },
            filterID: f.id,
        }); }),
    };
}
addHandler('SoLd', hasKey('placedLayer'), function (reader, target, left) {
    if ((0, psdReader_1.readSignature)(reader) !== 'soLD')
        throw new Error("Invalid SoLd type");
    var version = (0, psdReader_1.readInt32)(reader);
    if (version !== 4 && version !== 5)
        throw new Error("Invalid SoLd version");
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
    // console.log('SoLd', require('util').inspect(desc, false, 99, true));
    // console.log('SoLd.warp', require('util').inspect(desc.warp, false, 99, true));
    // console.log('SoLd.quiltWarp', require('util').inspect(desc.quiltWarp, false, 99, true));
    // desc.filterFX!.filterFXList[0].Fltr.puppetShapeList[0].meshBoundaryPath.pathComponents[0].SbpL[0]['Pts '] = [];
    // console.log('filterFX', require('util').inspect(desc.filterFX, false, 99, true));
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
        resolution: (0, descriptor_1.parseUnits)(desc.Rslt),
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
    if (desc.filterFX)
        target.placedLayer.filter = parseFilterFX(desc.filterFX);
    (0, psdReader_1.skipBytes)(reader, left()); // HACK
}, function (writer, target) {
    var _a, _b;
    (0, psdWriter_1.writeSignature)(writer, 'soLD');
    (0, psdWriter_1.writeInt32)(writer, 4); // version
    var placed = target.placedLayer;
    var desc = __assign(__assign({ Idnt: placed.id, placed: (_a = placed.placed) !== null && _a !== void 0 ? _a : placed.id, PgNm: placed.pageNumber || 1, totalPages: placed.totalPages || 1 }, (placed.crop ? { Crop: placed.crop } : {})), { frameStep: placed.frameStep || { numerator: 0, denominator: 600 }, duration: placed.duration || { numerator: 0, denominator: 600 }, frameCount: placed.frameCount || 0, Annt: 16, Type: placedLayerTypes.indexOf(placed.type), Trnf: placed.transform, nonAffineTransform: (_b = placed.nonAffineTransform) !== null && _b !== void 0 ? _b : placed.transform, quiltWarp: {}, warp: encodeWarp(placed.warp || {}), 'Sz  ': {
            Wdth: placed.width || 0,
            Hght: placed.height || 0, // TODO: find size ?
        }, Rslt: placed.resolution ? (0, descriptor_1.unitsValue)(placed.resolution, 'resolution') : { units: 'Density', value: 72 } });
    if (placed.filter)
        desc.filterFX = serializeFilterFX(placed.filter);
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
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc, desc.quiltWarp ? 'quiltWarp' : 'warp');
});
addHandlerAlias('SoLE', 'SoLd');
addHandler('fxrp', hasKey('referencePoint'), function (reader, target) {
    target.referencePoint = {
        x: (0, psdReader_1.readFloat64)(reader),
        y: (0, psdReader_1.readFloat64)(reader),
    };
}, function (writer, target) {
    (0, psdWriter_1.writeFloat64)(writer, target.referencePoint.x);
    (0, psdWriter_1.writeFloat64)(writer, target.referencePoint.y);
});
if (helpers_1.MOCK_HANDLERS) {
    addHandler('Patt', function (target) { return target._Patt !== undefined; }, function (reader, target, left) {
        // console.log('additional info: Patt');
        target._Patt = (0, psdReader_1.readBytes)(reader, left());
    }, function (writer, target) { return false && (0, psdWriter_1.writeBytes)(writer, target._Patt); });
}
else {
    addHandler('Patt', // TODO: handle also Pat2 & Pat3
    function (// TODO: handle also Pat2 & Pat3
    target) { return !target; }, function (reader, target, left) {
        if (!left())
            return;
        (0, psdReader_1.skipBytes)(reader, left());
        return; // not supported yet
        target;
        psdReader_1.readPattern;
        // if (!target.patterns) target.patterns = [];
        // target.patterns.push(readPattern(reader));
        // skipBytes(reader, left());
    }, function (_writer, _target) {
    });
}
function readRect(reader) {
    var top = (0, psdReader_1.readInt32)(reader);
    var left = (0, psdReader_1.readInt32)(reader);
    var bottom = (0, psdReader_1.readInt32)(reader);
    var right = (0, psdReader_1.readInt32)(reader);
    return { top: top, left: left, bottom: bottom, right: right };
}
function writeRect(writer, rect) {
    (0, psdWriter_1.writeInt32)(writer, rect.top);
    (0, psdWriter_1.writeInt32)(writer, rect.left);
    (0, psdWriter_1.writeInt32)(writer, rect.bottom);
    (0, psdWriter_1.writeInt32)(writer, rect.right);
}
addHandler('Anno', function (target) { return target.annotations !== undefined; }, function (reader, target, left) {
    var major = (0, psdReader_1.readUint16)(reader);
    var minor = (0, psdReader_1.readUint16)(reader);
    if (major !== 2 || minor !== 1)
        throw new Error('Invalid Anno version');
    var count = (0, psdReader_1.readUint32)(reader);
    var annotations = [];
    for (var i = 0; i < count; i++) {
        /*const length =*/ (0, psdReader_1.readUint32)(reader);
        var type = (0, psdReader_1.readSignature)(reader);
        var open_1 = !!(0, psdReader_1.readUint8)(reader);
        /*const flags =*/ (0, psdReader_1.readUint8)(reader); // always 28
        /*const optionalBlocks =*/ (0, psdReader_1.readUint16)(reader);
        var iconLocation = readRect(reader);
        var popupLocation = readRect(reader);
        var color = (0, psdReader_1.readColor)(reader);
        var author = (0, psdReader_1.readPascalString)(reader, 2);
        var name_1 = (0, psdReader_1.readPascalString)(reader, 2);
        var date = (0, psdReader_1.readPascalString)(reader, 2);
        /*const contentLength =*/ (0, psdReader_1.readUint32)(reader);
        /*const dataType =*/ (0, psdReader_1.readSignature)(reader);
        var dataLength = (0, psdReader_1.readUint32)(reader);
        var data = void 0;
        if (type === 'txtA') {
            if (dataLength >= 2 && (0, psdReader_1.readUint16)(reader) === 0xfeff) {
                data = (0, psdReader_1.readUnicodeStringWithLength)(reader, (dataLength - 2) / 2);
            }
            else {
                reader.offset -= 2;
                data = (0, psdReader_1.readAsciiString)(reader, dataLength);
            }
            data = data.replace(/\r/g, '\n');
        }
        else if (type === 'sndA') {
            data = (0, psdReader_1.readBytes)(reader, dataLength);
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
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var annotations = target.annotations;
    (0, psdWriter_1.writeUint16)(writer, 2);
    (0, psdWriter_1.writeUint16)(writer, 1);
    (0, psdWriter_1.writeUint32)(writer, annotations.length);
    for (var _i = 0, annotations_1 = annotations; _i < annotations_1.length; _i++) {
        var annotation = annotations_1[_i];
        var sound = annotation.type === 'sound';
        if (sound && !(annotation.data instanceof Uint8Array))
            throw new Error('Sound annotation data should be Uint8Array');
        if (!sound && typeof annotation.data !== 'string')
            throw new Error('Text annotation data should be string');
        var lengthOffset = writer.offset;
        (0, psdWriter_1.writeUint32)(writer, 0); // length
        (0, psdWriter_1.writeSignature)(writer, sound ? 'sndA' : 'txtA');
        (0, psdWriter_1.writeUint8)(writer, annotation.open ? 1 : 0);
        (0, psdWriter_1.writeUint8)(writer, 28);
        (0, psdWriter_1.writeUint16)(writer, 1);
        writeRect(writer, annotation.iconLocation);
        writeRect(writer, annotation.popupLocation);
        (0, psdWriter_1.writeColor)(writer, annotation.color);
        (0, psdWriter_1.writePascalString)(writer, annotation.author || '', 2);
        (0, psdWriter_1.writePascalString)(writer, annotation.name || '', 2);
        (0, psdWriter_1.writePascalString)(writer, annotation.date || '', 2);
        var contentOffset = writer.offset;
        (0, psdWriter_1.writeUint32)(writer, 0); // content length
        (0, psdWriter_1.writeSignature)(writer, sound ? 'sndM' : 'txtC');
        (0, psdWriter_1.writeUint32)(writer, 0); // data length
        var dataOffset = writer.offset;
        if (sound) {
            (0, psdWriter_1.writeBytes)(writer, annotation.data);
        }
        else {
            (0, psdWriter_1.writeUint16)(writer, 0xfeff); // unicode string indicator
            var text = annotation.data.replace(/\n/g, '\r');
            for (var i = 0; i < text.length; i++)
                (0, psdWriter_1.writeUint16)(writer, text.charCodeAt(i));
        }
        writer.view.setUint32(lengthOffset, writer.offset - lengthOffset, false);
        writer.view.setUint32(contentOffset, writer.offset - contentOffset, false);
        writer.view.setUint32(dataOffset - 4, writer.offset - dataOffset, false);
    }
});
addHandler('lnk2', function (target) { return !!target.linkedFiles && target.linkedFiles.length > 0; }, function (reader, target, left, _, options) {
    var psd = target;
    psd.linkedFiles = psd.linkedFiles || [];
    while (left() > 8) {
        var size = readLength64(reader); // size
        var startOffset = reader.offset;
        var type = (0, psdReader_1.readSignature)(reader);
        var version = (0, psdReader_1.readInt32)(reader);
        var id = (0, psdReader_1.readPascalString)(reader, 1);
        var name_2 = (0, psdReader_1.readUnicodeString)(reader);
        var fileType = (0, psdReader_1.readSignature)(reader).trim(); // '    ' if empty
        var fileCreator = (0, psdReader_1.readSignature)(reader).trim(); // '    ' or '\0\0\0\0' if empty
        var dataSize = readLength64(reader);
        var hasFileOpenDescriptor = (0, psdReader_1.readUint8)(reader);
        var fileOpenDescriptor = hasFileOpenDescriptor ? (0, descriptor_1.readVersionAndDescriptor)(reader) : undefined;
        var linkedFileDescriptor = type === 'liFE' ? (0, descriptor_1.readVersionAndDescriptor)(reader) : undefined;
        var file = { id: id, name: name_2, data: undefined };
        if (fileType)
            file.type = fileType;
        if (fileCreator)
            file.creator = fileCreator;
        if (fileOpenDescriptor)
            file.descriptor = fileOpenDescriptor;
        if (type === 'liFE' && version > 3) {
            var year = (0, psdReader_1.readInt32)(reader);
            var month = (0, psdReader_1.readUint8)(reader);
            var day = (0, psdReader_1.readUint8)(reader);
            var hour = (0, psdReader_1.readUint8)(reader);
            var minute = (0, psdReader_1.readUint8)(reader);
            var seconds = (0, psdReader_1.readFloat64)(reader);
            var wholeSeconds = Math.floor(seconds);
            var ms = (seconds - wholeSeconds) * 1000;
            file.time = (new Date(year, month, day, hour, minute, wholeSeconds, ms)).toISOString();
        }
        var fileSize = type === 'liFE' ? readLength64(reader) : 0;
        if (type === 'liFA')
            (0, psdReader_1.skipBytes)(reader, 8);
        if (type === 'liFD')
            file.data = (0, psdReader_1.readBytes)(reader, dataSize);
        if (version >= 5)
            file.childDocumentID = (0, psdReader_1.readUnicodeString)(reader);
        if (version >= 6)
            file.assetModTime = (0, psdReader_1.readFloat64)(reader);
        if (version >= 7)
            file.assetLockedState = (0, psdReader_1.readUint8)(reader);
        if (type === 'liFE')
            file.data = (0, psdReader_1.readBytes)(reader, fileSize);
        if (options.skipLinkedFilesData)
            file.data = undefined;
        psd.linkedFiles.push(file);
        linkedFileDescriptor;
        while (size % 4)
            size++;
        reader.offset = startOffset + size;
    }
    (0, psdReader_1.skipBytes)(reader, left()); // ?
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
        (0, psdWriter_1.writeUint32)(writer, 0);
        (0, psdWriter_1.writeUint32)(writer, 0); // size
        var sizeOffset = writer.offset;
        (0, psdWriter_1.writeSignature)(writer, file.data ? 'liFD' : 'liFA');
        (0, psdWriter_1.writeInt32)(writer, version);
        (0, psdWriter_1.writePascalString)(writer, file.id || '', 1);
        (0, psdWriter_1.writeUnicodeStringWithPadding)(writer, file.name || '');
        (0, psdWriter_1.writeSignature)(writer, file.type ? "".concat(file.type, "    ").substring(0, 4) : '    ');
        (0, psdWriter_1.writeSignature)(writer, file.creator ? "".concat(file.creator, "    ").substring(0, 4) : '\0\0\0\0');
        writeLength64(writer, file.data ? file.data.byteLength : 0);
        if (file.descriptor && file.descriptor.compInfo) {
            var desc = {
                compInfo: file.descriptor.compInfo,
            };
            (0, psdWriter_1.writeUint8)(writer, 1);
            (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
        }
        else {
            (0, psdWriter_1.writeUint8)(writer, 0);
        }
        if (file.data)
            (0, psdWriter_1.writeBytes)(writer, file.data);
        else
            writeLength64(writer, 0);
        if (version >= 5)
            (0, psdWriter_1.writeUnicodeStringWithPadding)(writer, file.childDocumentID || '');
        if (version >= 6)
            (0, psdWriter_1.writeFloat64)(writer, file.assetModTime || 0);
        if (version >= 7)
            (0, psdWriter_1.writeUint8)(writer, file.assetLockedState || 0);
        var size = writer.offset - sizeOffset;
        writer.view.setUint32(sizeOffset - 4, size, false); // write size
        while (size % 4) {
            size++;
            (0, psdWriter_1.writeUint8)(writer, 0);
        }
    }
});
addHandlerAlias('lnkD', 'lnk2');
addHandlerAlias('lnk3', 'lnk2');
addHandlerAlias('lnkE', 'lnk2');
addHandler('pths', hasKey('pathList'), function (reader, target) {
    var descriptor = (0, descriptor_1.readVersionAndDescriptor)(reader);
    target.pathList = []; // TODO: read paths (find example with non-empty list)
    descriptor;
    // console.log('pths', descriptor); // TODO: remove this
}, function (writer, _target) {
    var descriptor = {
        pathList: [], // TODO: write paths
    };
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'pathsDataClass', descriptor);
});
addHandler('lyvr', hasKey('version'), function (reader, target) { return target.version = (0, psdReader_1.readUint32)(reader); }, function (writer, target) { return (0, psdWriter_1.writeUint32)(writer, target.version); });
function adjustmentType(type) {
    return function (target) { return !!target.adjustment && target.adjustment.type === type; };
}
addHandler('brit', adjustmentType('brightness/contrast'), function (reader, target, left) {
    if (!target.adjustment) { // ignore if got one from CgEd block
        target.adjustment = {
            type: 'brightness/contrast',
            brightness: (0, psdReader_1.readInt16)(reader),
            contrast: (0, psdReader_1.readInt16)(reader),
            meanValue: (0, psdReader_1.readInt16)(reader),
            labColorOnly: !!(0, psdReader_1.readUint8)(reader),
            useLegacy: true,
        };
    }
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var _a;
    var info = target.adjustment;
    (0, psdWriter_1.writeInt16)(writer, info.brightness || 0);
    (0, psdWriter_1.writeInt16)(writer, info.contrast || 0);
    (0, psdWriter_1.writeInt16)(writer, (_a = info.meanValue) !== null && _a !== void 0 ? _a : 127);
    (0, psdWriter_1.writeUint8)(writer, info.labColorOnly ? 1 : 0);
    (0, psdWriter_1.writeZeros)(writer, 1);
});
function readLevelsChannel(reader) {
    var shadowInput = (0, psdReader_1.readInt16)(reader);
    var highlightInput = (0, psdReader_1.readInt16)(reader);
    var shadowOutput = (0, psdReader_1.readInt16)(reader);
    var highlightOutput = (0, psdReader_1.readInt16)(reader);
    var midtoneInput = (0, psdReader_1.readInt16)(reader) / 100;
    return { shadowInput: shadowInput, highlightInput: highlightInput, shadowOutput: shadowOutput, highlightOutput: highlightOutput, midtoneInput: midtoneInput };
}
function writeLevelsChannel(writer, channel) {
    (0, psdWriter_1.writeInt16)(writer, channel.shadowInput);
    (0, psdWriter_1.writeInt16)(writer, channel.highlightInput);
    (0, psdWriter_1.writeInt16)(writer, channel.shadowOutput);
    (0, psdWriter_1.writeInt16)(writer, channel.highlightOutput);
    (0, psdWriter_1.writeInt16)(writer, Math.round(channel.midtoneInput * 100));
}
addHandler('levl', adjustmentType('levels'), function (reader, target, left) {
    if ((0, psdReader_1.readUint16)(reader) !== 2)
        throw new Error('Invalid levl version');
    target.adjustment = __assign(__assign({}, target.adjustment), { type: 'levels', rgb: readLevelsChannel(reader), red: readLevelsChannel(reader), green: readLevelsChannel(reader), blue: readLevelsChannel(reader) });
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    var defaultChannel = {
        shadowInput: 0,
        highlightInput: 255,
        shadowOutput: 0,
        highlightOutput: 255,
        midtoneInput: 1,
    };
    (0, psdWriter_1.writeUint16)(writer, 2); // version
    writeLevelsChannel(writer, info.rgb || defaultChannel);
    writeLevelsChannel(writer, info.red || defaultChannel);
    writeLevelsChannel(writer, info.blue || defaultChannel);
    writeLevelsChannel(writer, info.green || defaultChannel);
    for (var i = 0; i < 59; i++)
        writeLevelsChannel(writer, defaultChannel);
});
function readCurveChannel(reader) {
    var nodes = (0, psdReader_1.readUint16)(reader);
    var channel = [];
    for (var j = 0; j < nodes; j++) {
        var output = (0, psdReader_1.readInt16)(reader);
        var input = (0, psdReader_1.readInt16)(reader);
        channel.push({ input: input, output: output });
    }
    return channel;
}
function writeCurveChannel(writer, channel) {
    (0, psdWriter_1.writeUint16)(writer, channel.length);
    for (var _i = 0, channel_1 = channel; _i < channel_1.length; _i++) {
        var n = channel_1[_i];
        (0, psdWriter_1.writeUint16)(writer, n.output);
        (0, psdWriter_1.writeUint16)(writer, n.input);
    }
}
addHandler('curv', adjustmentType('curves'), function (reader, target, left) {
    (0, psdReader_1.readUint8)(reader);
    if ((0, psdReader_1.readUint16)(reader) !== 1)
        throw new Error('Invalid curv version');
    (0, psdReader_1.readUint16)(reader);
    var channels = (0, psdReader_1.readUint16)(reader);
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
    (0, psdReader_1.skipBytes)(reader, left());
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
    (0, psdWriter_1.writeUint8)(writer, 0);
    (0, psdWriter_1.writeUint16)(writer, 1); // version
    (0, psdWriter_1.writeUint16)(writer, 0);
    (0, psdWriter_1.writeUint16)(writer, channels);
    if (rgb && rgb.length)
        writeCurveChannel(writer, rgb);
    if (red && red.length)
        writeCurveChannel(writer, red);
    if (green && green.length)
        writeCurveChannel(writer, green);
    if (blue && blue.length)
        writeCurveChannel(writer, blue);
    (0, psdWriter_1.writeSignature)(writer, 'Crv ');
    (0, psdWriter_1.writeUint16)(writer, 4); // version
    (0, psdWriter_1.writeUint16)(writer, 0);
    (0, psdWriter_1.writeUint16)(writer, channelCount);
    if (rgb && rgb.length) {
        (0, psdWriter_1.writeUint16)(writer, 0);
        writeCurveChannel(writer, rgb);
    }
    if (red && red.length) {
        (0, psdWriter_1.writeUint16)(writer, 1);
        writeCurveChannel(writer, red);
    }
    if (green && green.length) {
        (0, psdWriter_1.writeUint16)(writer, 2);
        writeCurveChannel(writer, green);
    }
    if (blue && blue.length) {
        (0, psdWriter_1.writeUint16)(writer, 3);
        writeCurveChannel(writer, blue);
    }
    (0, psdWriter_1.writeZeros)(writer, 2);
});
addHandler('expA', adjustmentType('exposure'), function (reader, target, left) {
    if ((0, psdReader_1.readUint16)(reader) !== 1)
        throw new Error('Invalid expA version');
    target.adjustment = __assign(__assign({}, target.adjustment), { type: 'exposure', exposure: (0, psdReader_1.readFloat32)(reader), offset: (0, psdReader_1.readFloat32)(reader), gamma: (0, psdReader_1.readFloat32)(reader) });
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    (0, psdWriter_1.writeUint16)(writer, 1); // version
    (0, psdWriter_1.writeFloat32)(writer, info.exposure);
    (0, psdWriter_1.writeFloat32)(writer, info.offset);
    (0, psdWriter_1.writeFloat32)(writer, info.gamma);
    (0, psdWriter_1.writeZeros)(writer, 2);
});
addHandler('vibA', adjustmentType('vibrance'), function (reader, target, left) {
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
    target.adjustment = { type: 'vibrance' };
    if (desc.vibrance !== undefined)
        target.adjustment.vibrance = desc.vibrance;
    if (desc.Strt !== undefined)
        target.adjustment.saturation = desc.Strt;
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    var desc = {};
    if (info.vibrance !== undefined)
        desc.vibrance = info.vibrance;
    if (info.saturation !== undefined)
        desc.Strt = info.saturation;
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
});
function readHueChannel(reader) {
    return {
        a: (0, psdReader_1.readInt16)(reader),
        b: (0, psdReader_1.readInt16)(reader),
        c: (0, psdReader_1.readInt16)(reader),
        d: (0, psdReader_1.readInt16)(reader),
        hue: (0, psdReader_1.readInt16)(reader),
        saturation: (0, psdReader_1.readInt16)(reader),
        lightness: (0, psdReader_1.readInt16)(reader),
    };
}
function writeHueChannel(writer, channel) {
    var c = channel || {};
    (0, psdWriter_1.writeInt16)(writer, c.a || 0);
    (0, psdWriter_1.writeInt16)(writer, c.b || 0);
    (0, psdWriter_1.writeInt16)(writer, c.c || 0);
    (0, psdWriter_1.writeInt16)(writer, c.d || 0);
    (0, psdWriter_1.writeInt16)(writer, c.hue || 0);
    (0, psdWriter_1.writeInt16)(writer, c.saturation || 0);
    (0, psdWriter_1.writeInt16)(writer, c.lightness || 0);
}
addHandler('hue2', adjustmentType('hue/saturation'), function (reader, target, left) {
    if ((0, psdReader_1.readUint16)(reader) !== 2)
        throw new Error('Invalid hue2 version');
    target.adjustment = __assign(__assign({}, target.adjustment), { type: 'hue/saturation', master: readHueChannel(reader), reds: readHueChannel(reader), yellows: readHueChannel(reader), greens: readHueChannel(reader), cyans: readHueChannel(reader), blues: readHueChannel(reader), magentas: readHueChannel(reader) });
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    (0, psdWriter_1.writeUint16)(writer, 2); // version
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
        cyanRed: (0, psdReader_1.readInt16)(reader),
        magentaGreen: (0, psdReader_1.readInt16)(reader),
        yellowBlue: (0, psdReader_1.readInt16)(reader),
    };
}
function writeColorBalance(writer, value) {
    (0, psdWriter_1.writeInt16)(writer, value.cyanRed || 0);
    (0, psdWriter_1.writeInt16)(writer, value.magentaGreen || 0);
    (0, psdWriter_1.writeInt16)(writer, value.yellowBlue || 0);
}
addHandler('blnc', adjustmentType('color balance'), function (reader, target, left) {
    target.adjustment = {
        type: 'color balance',
        shadows: readColorBalance(reader),
        midtones: readColorBalance(reader),
        highlights: readColorBalance(reader),
        preserveLuminosity: !!(0, psdReader_1.readUint8)(reader),
    };
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    writeColorBalance(writer, info.shadows || {});
    writeColorBalance(writer, info.midtones || {});
    writeColorBalance(writer, info.highlights || {});
    (0, psdWriter_1.writeUint8)(writer, info.preserveLuminosity ? 1 : 0);
    (0, psdWriter_1.writeZeros)(writer, 1);
});
addHandler('blwh', adjustmentType('black & white'), function (reader, target, left) {
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
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
        target.adjustment.tintColor = (0, descriptor_1.parseColor)(desc.tintColor);
    (0, psdReader_1.skipBytes)(reader, left());
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
        tintColor: (0, descriptor_1.serializeColor)(info.tintColor),
        bwPresetKind: info.presetKind || 0,
        blackAndWhitePresetFileName: info.presetFileName || '',
    };
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
});
addHandler('phfl', adjustmentType('photo filter'), function (reader, target, left) {
    var version = (0, psdReader_1.readUint16)(reader);
    if (version !== 2 && version !== 3)
        throw new Error('Invalid phfl version');
    var color;
    if (version === 2) {
        color = (0, psdReader_1.readColor)(reader);
    }
    else { // version 3
        // TODO: test this, this is probably wrong
        color = {
            l: (0, psdReader_1.readInt32)(reader) / 100,
            a: (0, psdReader_1.readInt32)(reader) / 100,
            b: (0, psdReader_1.readInt32)(reader) / 100,
        };
    }
    target.adjustment = {
        type: 'photo filter',
        color: color,
        density: (0, psdReader_1.readUint32)(reader) / 100,
        preserveLuminosity: !!(0, psdReader_1.readUint8)(reader),
    };
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    (0, psdWriter_1.writeUint16)(writer, 2); // version
    (0, psdWriter_1.writeColor)(writer, info.color || { l: 0, a: 0, b: 0 });
    (0, psdWriter_1.writeUint32)(writer, (info.density || 0) * 100);
    (0, psdWriter_1.writeUint8)(writer, info.preserveLuminosity ? 1 : 0);
    (0, psdWriter_1.writeZeros)(writer, 3);
});
function readMixrChannel(reader) {
    var red = (0, psdReader_1.readInt16)(reader);
    var green = (0, psdReader_1.readInt16)(reader);
    var blue = (0, psdReader_1.readInt16)(reader);
    (0, psdReader_1.skipBytes)(reader, 2);
    var constant = (0, psdReader_1.readInt16)(reader);
    return { red: red, green: green, blue: blue, constant: constant };
}
function writeMixrChannel(writer, channel) {
    var c = channel || {};
    (0, psdWriter_1.writeInt16)(writer, c.red);
    (0, psdWriter_1.writeInt16)(writer, c.green);
    (0, psdWriter_1.writeInt16)(writer, c.blue);
    (0, psdWriter_1.writeZeros)(writer, 2);
    (0, psdWriter_1.writeInt16)(writer, c.constant);
}
addHandler('mixr', adjustmentType('channel mixer'), function (reader, target, left) {
    if ((0, psdReader_1.readUint16)(reader) !== 1)
        throw new Error('Invalid mixr version');
    var adjustment = target.adjustment = __assign(__assign({}, target.adjustment), { type: 'channel mixer', monochrome: !!(0, psdReader_1.readUint16)(reader) });
    if (!adjustment.monochrome) {
        adjustment.red = readMixrChannel(reader);
        adjustment.green = readMixrChannel(reader);
        adjustment.blue = readMixrChannel(reader);
    }
    adjustment.gray = readMixrChannel(reader);
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var info = target.adjustment;
    (0, psdWriter_1.writeUint16)(writer, 1); // version
    (0, psdWriter_1.writeUint16)(writer, info.monochrome ? 1 : 0);
    if (info.monochrome) {
        writeMixrChannel(writer, info.gray);
        (0, psdWriter_1.writeZeros)(writer, 3 * 5 * 2);
    }
    else {
        writeMixrChannel(writer, info.red);
        writeMixrChannel(writer, info.green);
        writeMixrChannel(writer, info.blue);
        writeMixrChannel(writer, info.gray);
    }
});
var colorLookupType = (0, helpers_1.createEnum)('colorLookupType', '3DLUT', {
    '3dlut': '3DLUT',
    abstractProfile: 'abstractProfile',
    deviceLinkProfile: 'deviceLinkProfile',
});
var LUTFormatType = (0, helpers_1.createEnum)('LUTFormatType', 'look', {
    look: 'LUTFormatLOOK',
    cube: 'LUTFormatCUBE',
    '3dl': 'LUTFormat3DL',
});
var colorLookupOrder = (0, helpers_1.createEnum)('colorLookupOrder', 'rgb', {
    rgb: 'rgbOrder',
    bgr: 'bgrOrder',
});
addHandler('clrL', adjustmentType('color lookup'), function (reader, target, left) {
    if ((0, psdReader_1.readUint16)(reader) !== 1)
        throw new Error('Invalid clrL version');
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
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
    (0, psdReader_1.skipBytes)(reader, left());
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
    (0, psdWriter_1.writeUint16)(writer, 1); // version
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
});
addHandler('nvrt', adjustmentType('invert'), function (reader, target, left) {
    target.adjustment = { type: 'invert' };
    (0, psdReader_1.skipBytes)(reader, left());
}, function () {
    // nothing to write here
});
addHandler('post', adjustmentType('posterize'), function (reader, target, left) {
    target.adjustment = {
        type: 'posterize',
        levels: (0, psdReader_1.readUint16)(reader),
    };
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var _a;
    var info = target.adjustment;
    (0, psdWriter_1.writeUint16)(writer, (_a = info.levels) !== null && _a !== void 0 ? _a : 4);
    (0, psdWriter_1.writeZeros)(writer, 2);
});
addHandler('thrs', adjustmentType('threshold'), function (reader, target, left) {
    target.adjustment = {
        type: 'threshold',
        level: (0, psdReader_1.readUint16)(reader),
    };
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var _a;
    var info = target.adjustment;
    (0, psdWriter_1.writeUint16)(writer, (_a = info.level) !== null && _a !== void 0 ? _a : 128);
    (0, psdWriter_1.writeZeros)(writer, 2);
});
var grdmColorModels = ['', '', '', 'rgb', 'hsb', '', 'lab'];
addHandler('grdm', adjustmentType('gradient map'), function (reader, target, left) {
    if ((0, psdReader_1.readUint16)(reader) !== 1)
        throw new Error('Invalid grdm version');
    var info = {
        type: 'gradient map',
        gradientType: 'solid',
    };
    info.reverse = !!(0, psdReader_1.readUint8)(reader);
    info.dither = !!(0, psdReader_1.readUint8)(reader);
    info.name = (0, psdReader_1.readUnicodeString)(reader);
    info.colorStops = [];
    info.opacityStops = [];
    var stopsCount = (0, psdReader_1.readUint16)(reader);
    for (var i = 0; i < stopsCount; i++) {
        info.colorStops.push({
            location: (0, psdReader_1.readUint32)(reader),
            midpoint: (0, psdReader_1.readUint32)(reader) / 100,
            color: (0, psdReader_1.readColor)(reader),
        });
        (0, psdReader_1.skipBytes)(reader, 2);
    }
    var opacityStopsCount = (0, psdReader_1.readUint16)(reader);
    for (var i = 0; i < opacityStopsCount; i++) {
        info.opacityStops.push({
            location: (0, psdReader_1.readUint32)(reader),
            midpoint: (0, psdReader_1.readUint32)(reader) / 100,
            opacity: (0, psdReader_1.readUint16)(reader) / 0xff,
        });
    }
    var expansionCount = (0, psdReader_1.readUint16)(reader);
    if (expansionCount !== 2)
        throw new Error('Invalid grdm expansion count');
    var interpolation = (0, psdReader_1.readUint16)(reader);
    info.smoothness = interpolation / 4096;
    var length = (0, psdReader_1.readUint16)(reader);
    if (length !== 32)
        throw new Error('Invalid grdm length');
    info.gradientType = (0, psdReader_1.readUint16)(reader) ? 'noise' : 'solid';
    info.randomSeed = (0, psdReader_1.readUint32)(reader);
    info.addTransparency = !!(0, psdReader_1.readUint16)(reader);
    info.restrictColors = !!(0, psdReader_1.readUint16)(reader);
    info.roughness = (0, psdReader_1.readUint32)(reader) / 4096;
    info.colorModel = (grdmColorModels[(0, psdReader_1.readUint16)(reader)] || 'rgb');
    info.min = [
        (0, psdReader_1.readUint16)(reader) / 0x8000,
        (0, psdReader_1.readUint16)(reader) / 0x8000,
        (0, psdReader_1.readUint16)(reader) / 0x8000,
        (0, psdReader_1.readUint16)(reader) / 0x8000,
    ];
    info.max = [
        (0, psdReader_1.readUint16)(reader) / 0x8000,
        (0, psdReader_1.readUint16)(reader) / 0x8000,
        (0, psdReader_1.readUint16)(reader) / 0x8000,
        (0, psdReader_1.readUint16)(reader) / 0x8000,
    ];
    (0, psdReader_1.skipBytes)(reader, left());
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
    (0, psdWriter_1.writeUint16)(writer, 1); // version
    (0, psdWriter_1.writeUint8)(writer, info.reverse ? 1 : 0);
    (0, psdWriter_1.writeUint8)(writer, info.dither ? 1 : 0);
    (0, psdWriter_1.writeUnicodeStringWithPadding)(writer, info.name || '');
    (0, psdWriter_1.writeUint16)(writer, info.colorStops && info.colorStops.length || 0);
    var interpolation = Math.round(((_a = info.smoothness) !== null && _a !== void 0 ? _a : 1) * 4096);
    for (var _i = 0, _d = info.colorStops || []; _i < _d.length; _i++) {
        var s = _d[_i];
        (0, psdWriter_1.writeUint32)(writer, Math.round(s.location * interpolation));
        (0, psdWriter_1.writeUint32)(writer, Math.round(s.midpoint * 100));
        (0, psdWriter_1.writeColor)(writer, s.color);
        (0, psdWriter_1.writeZeros)(writer, 2);
    }
    (0, psdWriter_1.writeUint16)(writer, info.opacityStops && info.opacityStops.length || 0);
    for (var _e = 0, _f = info.opacityStops || []; _e < _f.length; _e++) {
        var s = _f[_e];
        (0, psdWriter_1.writeUint32)(writer, Math.round(s.location * interpolation));
        (0, psdWriter_1.writeUint32)(writer, Math.round(s.midpoint * 100));
        (0, psdWriter_1.writeUint16)(writer, Math.round(s.opacity * 0xff));
    }
    (0, psdWriter_1.writeUint16)(writer, 2); // expansion count
    (0, psdWriter_1.writeUint16)(writer, interpolation);
    (0, psdWriter_1.writeUint16)(writer, 32); // length
    (0, psdWriter_1.writeUint16)(writer, info.gradientType === 'noise' ? 1 : 0);
    (0, psdWriter_1.writeUint32)(writer, info.randomSeed || 0);
    (0, psdWriter_1.writeUint16)(writer, info.addTransparency ? 1 : 0);
    (0, psdWriter_1.writeUint16)(writer, info.restrictColors ? 1 : 0);
    (0, psdWriter_1.writeUint32)(writer, Math.round(((_b = info.roughness) !== null && _b !== void 0 ? _b : 1) * 4096));
    var colorModel = grdmColorModels.indexOf((_c = info.colorModel) !== null && _c !== void 0 ? _c : 'rgb');
    (0, psdWriter_1.writeUint16)(writer, colorModel === -1 ? 3 : colorModel);
    for (var i = 0; i < 4; i++)
        (0, psdWriter_1.writeUint16)(writer, Math.round((info.min && info.min[i] || 0) * 0x8000));
    for (var i = 0; i < 4; i++)
        (0, psdWriter_1.writeUint16)(writer, Math.round((info.max && info.max[i] || 0) * 0x8000));
    (0, psdWriter_1.writeZeros)(writer, 4);
});
function readSelectiveColors(reader) {
    return {
        c: (0, psdReader_1.readInt16)(reader),
        m: (0, psdReader_1.readInt16)(reader),
        y: (0, psdReader_1.readInt16)(reader),
        k: (0, psdReader_1.readInt16)(reader),
    };
}
function writeSelectiveColors(writer, cmyk) {
    var c = cmyk || {};
    (0, psdWriter_1.writeInt16)(writer, c.c);
    (0, psdWriter_1.writeInt16)(writer, c.m);
    (0, psdWriter_1.writeInt16)(writer, c.y);
    (0, psdWriter_1.writeInt16)(writer, c.k);
}
addHandler('selc', adjustmentType('selective color'), function (reader, target) {
    if ((0, psdReader_1.readUint16)(reader) !== 1)
        throw new Error('Invalid selc version');
    var mode = (0, psdReader_1.readUint16)(reader) ? 'absolute' : 'relative';
    (0, psdReader_1.skipBytes)(reader, 8);
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
    (0, psdWriter_1.writeUint16)(writer, 1); // version
    (0, psdWriter_1.writeUint16)(writer, info.mode === 'absolute' ? 1 : 0);
    (0, psdWriter_1.writeZeros)(writer, 8);
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
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
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
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target) {
    var _a, _b, _c, _d;
    var info = target.adjustment;
    if (info.type === 'levels' || info.type === 'exposure' || info.type === 'hue/saturation') {
        var desc = {
            Vrsn: 1,
            presetKind: (_a = info.presetKind) !== null && _a !== void 0 ? _a : 1,
            presetFileName: info.presetFileName || '',
        };
        (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
    }
    else if (info.type === 'curves') {
        var desc = {
            Vrsn: 1,
            curvesPresetKind: (_b = info.presetKind) !== null && _b !== void 0 ? _b : 1,
            curvesPresetFileName: info.presetFileName || '',
        };
        (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
    }
    else if (info.type === 'channel mixer') {
        var desc = {
            Vrsn: 1,
            mixerPresetKind: (_c = info.presetKind) !== null && _c !== void 0 ? _c : 1,
            mixerPresetFileName: info.presetFileName || '',
        };
        (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
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
        (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
    }
    else {
        throw new Error('Unhandled CgEd case');
    }
});
addHandler('Txt2', hasKey('engineData'), function (reader, target, left) {
    var data = (0, psdReader_1.readBytes)(reader, left());
    target.engineData = (0, base64_js_1.fromByteArray)(data);
    // const engineData = parseEngineData(data);
    // console.log(require('util').inspect(engineData, false, 99, true));
    // require('fs').writeFileSync('resources/engineData2Simple.txt', require('util').inspect(engineData, false, 99, false), 'utf8');
    // require('fs').writeFileSync('test_data.json', JSON.stringify(ed, null, 2), 'utf8');
}, function (writer, target) {
    var buffer = (0, base64_js_1.toByteArray)(target.engineData);
    (0, psdWriter_1.writeBytes)(writer, buffer);
});
addHandler('FMsk', hasKey('filterMask'), function (reader, target) {
    target.filterMask = {
        colorSpace: (0, psdReader_1.readColor)(reader),
        opacity: (0, psdReader_1.readUint16)(reader) / 0xff,
    };
}, function (writer, target) {
    var _a;
    (0, psdWriter_1.writeColor)(writer, target.filterMask.colorSpace);
    (0, psdWriter_1.writeUint16)(writer, (0, helpers_1.clamp)((_a = target.filterMask.opacity) !== null && _a !== void 0 ? _a : 1, 0, 1) * 0xff);
});
addHandler('artd', // document-wide artboard info
function (// document-wide artboard info
target) { return target.artboards !== undefined; }, function (reader, target, left) {
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
    target.artboards = {
        count: desc['Cnt '],
        autoExpandOffset: { horizontal: desc.autoExpandOffset.Hrzn, vertical: desc.autoExpandOffset.Vrtc },
        origin: { horizontal: desc.origin.Hrzn, vertical: desc.origin.Vrtc },
        autoExpandEnabled: desc.autoExpandEnabled,
        autoNestEnabled: desc.autoNestEnabled,
        autoPositionEnabled: desc.autoPositionEnabled,
        shrinkwrapOnSaveEnabled: !!desc.shrinkwrapOnSaveEnabled,
        docDefaultNewArtboardBackgroundColor: (0, descriptor_1.parseColor)(desc.docDefaultNewArtboardBackgroundColor),
        docDefaultNewArtboardBackgroundType: desc.docDefaultNewArtboardBackgroundType,
    };
    (0, psdReader_1.skipBytes)(reader, left());
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
        docDefaultNewArtboardBackgroundColor: (0, descriptor_1.serializeColor)(artb.docDefaultNewArtboardBackgroundColor),
        docDefaultNewArtboardBackgroundType: (_e = artb.docDefaultNewArtboardBackgroundType) !== null && _e !== void 0 ? _e : 1,
    };
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc, 'artd');
});
function hasMultiEffects(effects) {
    return Object.keys(effects).map(function (key) { return effects[key]; }).some(function (v) { return Array.isArray(v) && v.length > 1; });
}
exports.hasMultiEffects = hasMultiEffects;
addHandler('lfx2', function (target) { return target.effects !== undefined && !hasMultiEffects(target.effects); }, function (reader, target, left, _, options) {
    var version = (0, psdReader_1.readUint32)(reader);
    if (version !== 0)
        throw new Error("Invalid lfx2 version");
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    // TODO: don't discard if we got it from lmfx
    // discard if read in 'lrFX' section
    target.effects = (0, descriptor_1.parseEffects)(desc, !!options.logMissingFeatures);
    (0, psdReader_1.skipBytes)(reader, left());
}, function (writer, target, _, options) {
    var desc = (0, descriptor_1.serializeEffects)(target.effects, !!options.logMissingFeatures, false);
    // console.log(require('util').inspect(desc, false, 99, true));
    (0, psdWriter_1.writeUint32)(writer, 0); // version
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
});
addHandler('cinf', hasKey('compositorUsed'), function (reader, target, left) {
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
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
    (0, psdReader_1.skipBytes)(reader, left());
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
    (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', desc);
});
// extension settings ?, ignore it
addHandler('extn', function (target) { return target._extn !== undefined; }, function (reader, target) {
    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    if (helpers_1.MOCK_HANDLERS)
        target._extn = desc;
}, function (writer, target) {
    // TODO: need to add correct types for desc fields (resources/src.psd)
    if (helpers_1.MOCK_HANDLERS)
        (0, descriptor_1.writeVersionAndDescriptor)(writer, '', 'null', target._extn);
});
addHandler('iOpa', hasKey('fillOpacity'), function (reader, target) {
    target.fillOpacity = (0, psdReader_1.readUint8)(reader) / 0xff;
    (0, psdReader_1.skipBytes)(reader, 3);
}, function (writer, target) {
    (0, psdWriter_1.writeUint8)(writer, target.fillOpacity * 0xff);
    (0, psdWriter_1.writeZeros)(writer, 3);
});
addHandler('brst', hasKey('channelBlendingRestrictions'), function (reader, target, left) {
    target.channelBlendingRestrictions = [];
    while (left() > 4) {
        target.channelBlendingRestrictions.push((0, psdReader_1.readInt32)(reader));
    }
}, function (writer, target) {
    for (var _i = 0, _a = target.channelBlendingRestrictions; _i < _a.length; _i++) {
        var channel = _a[_i];
        (0, psdWriter_1.writeInt32)(writer, channel);
    }
});
addHandler('tsly', hasKey('transparencyShapesLayer'), function (reader, target) {
    target.transparencyShapesLayer = !!(0, psdReader_1.readUint8)(reader);
    (0, psdReader_1.skipBytes)(reader, 3);
}, function (writer, target) {
    (0, psdWriter_1.writeUint8)(writer, target.transparencyShapesLayer ? 1 : 0);
    (0, psdWriter_1.writeZeros)(writer, 3);
});
/*addHandler(
    'FEid',
    hasKey('filterEffects'),
    (reader, _target) => {
        const version = readInt32(reader);
        if (version < 1 || version > 3) throw new Error(`Invalid filterEffects version ${version}`);

        if (readUint32(reader)) throw new Error('filterEffects: 64 bit length is not supported');
        const length = readUint32(reader);
        const end = reader.offset + length;

        while (reader.offset < end) {
            console.log('bytes to go', end - reader.offset, 'at', reader.offset.toString(16));
            //
            const id = readPascalString(reader, 1);
            const effectVersion = readInt32(reader);
            if (effectVersion !== 1) throw new Error(`Invalid filterEffect version ${effectVersion}`);
            if (readUint32(reader)) throw new Error('filterEffect: 64 bit length is not supported');
            const effectLength = readUint32(reader);
            const endOfEffect = reader.offset + effectLength;
            const top = readInt32(reader);
            const left = readInt32(reader);
            const bottom = readInt32(reader);
            const right = readInt32(reader);
            const depth = readInt32(reader);
            const maxChannels = readInt32(reader);
            const channels: any[] = [];

            for (let i = 0; i < (maxChannels + 2); i++) {
                const exists = readInt32(reader);
                if (exists) {
                    if (readUint32(reader)) throw new Error('filterEffect: 64 bit length is not supported');
                    const channelLength = readUint32(reader);
                    const compressionMode = readUint16(reader);
                    const data = readBytes(reader, channelLength - 2);
                    channels.push({ channelLength, compressionMode, data: data?.length + ' bytes' });
                    // if (c < 3 || c == 25) e_ = _F.Cn(!0, rL, m, b.rect.F, b.rect.V, X, rp);
                    // if (c == 0) _c.S = e_;
                    // if (c == 1) _c.v = e_;
                    // if (c == 2) _c.e = e_;
                    // if (c == 25) _c.w = e_;
                } else {
                    channels.push(undefined);
                }
            }

            console.log('left at the end', endOfEffect - reader.offset);
            if (endOfEffect > reader.offset) {
                if (readUint8(reader)) {
                    const compressionMode = readUint16(reader);
                    const data = endOfEffect > reader.offset ? readBytes(reader, endOfEffect - reader.offset) : undefined;
                    console.log('extra data', { compressionMode, data: data?.length + ' bytes' });
                } else {
                    console.log('no extra');
                }
            }

            console.log('effect', {
                id,
                effectVersion,
                effectLength,
                top,
                left,
                bottom,
                right,
                depth,
                maxChannels,
                channels,
            });

            console.log('bytes left after effect', endOfEffect - reader.offset);
            // if (length % 4) skipBytes(reader, 4 - length % 4);
        }

        console.log({ version, length });
    },
    (_writer, _target) => {
    },
);

addHandlerAlias('FXid', 'FEid');*/
//# sourceMappingURL=additionalInfo.js.map