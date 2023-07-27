import { toByteArray } from 'base64-js';
import { readPascalString, readUnicodeString, readUint32, readUint16, readUint8, readFloat64, readBytes, skipBytes, readFloat32, readInt16, readFixedPoint32, readSignature, checkSignature, readSection, readColor } from './psdReader';
import { writePascalString, writeUnicodeString, writeUint32, writeUint8, writeFloat64, writeUint16, writeBytes, writeInt16, writeFloat32, writeFixedPoint32, writeUnicodeStringWithPadding, writeColor, writeSignature, writeSection, } from './psdWriter';
import { createCanvasFromData, createEnum, MOCK_HANDLERS } from './helpers';
import { decodeString, encodeString } from './utf8';
import { parseTrackList, readVersionAndDescriptor, serializeTrackList, writeVersionAndDescriptor } from './descriptor';
export var resourceHandlers = [];
export var resourceHandlersMap = {};
function addHandler(key, has, read, write) {
    var handler = { key: key, has: has, read: read, write: write };
    resourceHandlers.push(handler);
    resourceHandlersMap[handler.key] = handler;
}
var LOG_MOCK_HANDLERS = false;
var RESOLUTION_UNITS = [undefined, 'PPI', 'PPCM'];
var MEASUREMENT_UNITS = [undefined, 'Inches', 'Centimeters', 'Points', 'Picas', 'Columns'];
var hex = '0123456789abcdef';
function charToNibble(code) {
    return code <= 57 ? code - 48 : code - 87;
}
function byteAt(value, index) {
    return (charToNibble(value.charCodeAt(index)) << 4) | charToNibble(value.charCodeAt(index + 1));
}
function readUtf8String(reader, length) {
    var buffer = readBytes(reader, length);
    return decodeString(buffer);
}
function writeUtf8String(writer, value) {
    var buffer = encodeString(value);
    writeBytes(writer, buffer);
}
MOCK_HANDLERS && addHandler(1028, // IPTC-NAA record
function (// IPTC-NAA record
target) { return target._ir1028 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1028', left());
    target._ir1028 = readBytes(reader, left());
}, function (writer, target) {
    writeBytes(writer, target._ir1028);
});
addHandler(1061, function (target) { return target.captionDigest !== undefined; }, function (reader, target) {
    var captionDigest = '';
    for (var i = 0; i < 16; i++) {
        var byte = readUint8(reader);
        captionDigest += hex[byte >> 4];
        captionDigest += hex[byte & 0xf];
    }
    target.captionDigest = captionDigest;
}, function (writer, target) {
    for (var i = 0; i < 16; i++) {
        writeUint8(writer, byteAt(target.captionDigest, i * 2));
    }
});
addHandler(1060, function (target) { return target.xmpMetadata !== undefined; }, function (reader, target, left) { return target.xmpMetadata = readUtf8String(reader, left()); }, function (writer, target) { return writeUtf8String(writer, target.xmpMetadata); });
var Inte = createEnum('Inte', 'perceptual', {
    'perceptual': 'Img ',
    'saturation': 'Grp ',
    'relative colorimetric': 'Clrm',
    'absolute colorimetric': 'AClr',
});
addHandler(1082, function (target) { return target.printInformation !== undefined; }, function (reader, target) {
    var _a, _b;
    var desc = readVersionAndDescriptor(reader);
    target.printInformation = {
        printerName: desc.printerName || '',
        renderingIntent: Inte.decode((_a = desc.Inte) !== null && _a !== void 0 ? _a : 'Inte.Img '),
    };
    var info = target.printInformation;
    if (desc.PstS !== undefined)
        info.printerManagesColors = desc.PstS;
    if (desc['Nm  '] !== undefined)
        info.printerProfile = desc['Nm  '];
    if (desc.MpBl !== undefined)
        info.blackPointCompensation = desc.MpBl;
    if (desc.printSixteenBit !== undefined)
        info.printSixteenBit = desc.printSixteenBit;
    if (desc.hardProof !== undefined)
        info.hardProof = desc.hardProof;
    if (desc.printProofSetup) {
        if ('Bltn' in desc.printProofSetup) {
            info.proofSetup = { builtin: desc.printProofSetup.Bltn.split('.')[1] };
        }
        else {
            info.proofSetup = {
                profile: desc.printProofSetup.profile,
                renderingIntent: Inte.decode((_b = desc.printProofSetup.Inte) !== null && _b !== void 0 ? _b : 'Inte.Img '),
                blackPointCompensation: !!desc.printProofSetup.MpBl,
                paperWhite: !!desc.printProofSetup.paperWhite,
            };
        }
    }
}, function (writer, target) {
    var _a, _b;
    var info = target.printInformation;
    var desc = {};
    if (info.printerManagesColors) {
        desc.PstS = true;
    }
    else {
        if (info.hardProof !== undefined)
            desc.hardProof = !!info.hardProof;
        desc.ClrS = 'ClrS.RGBC'; // TODO: ???
        desc['Nm  '] = (_a = info.printerProfile) !== null && _a !== void 0 ? _a : 'CIE RGB';
    }
    desc.Inte = Inte.encode(info.renderingIntent);
    if (!info.printerManagesColors)
        desc.MpBl = !!info.blackPointCompensation;
    desc.printSixteenBit = !!info.printSixteenBit;
    desc.printerName = info.printerName || '';
    if (info.proofSetup && 'profile' in info.proofSetup) {
        desc.printProofSetup = {
            profile: info.proofSetup.profile || '',
            Inte: Inte.encode(info.proofSetup.renderingIntent),
            MpBl: !!info.proofSetup.blackPointCompensation,
            paperWhite: !!info.proofSetup.paperWhite,
        };
    }
    else {
        desc.printProofSetup = {
            Bltn: ((_b = info.proofSetup) === null || _b === void 0 ? void 0 : _b.builtin) ? "builtinProof.".concat(info.proofSetup.builtin) : 'builtinProof.proofCMYK',
        };
    }
    writeVersionAndDescriptor(writer, '', 'printOutput', desc);
});
MOCK_HANDLERS && addHandler(1083, // Print style
function (// Print style
target) { return target._ir1083 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1083', left());
    target._ir1083 = readBytes(reader, left());
    // TODO:
    // const desc = readVersionAndDescriptor(reader);
    // console.log('1083', require('util').inspect(desc, false, 99, true));
}, function (writer, target) {
    writeBytes(writer, target._ir1083);
});
addHandler(1005, function (target) { return target.resolutionInfo !== undefined; }, function (reader, target) {
    var horizontalResolution = readFixedPoint32(reader);
    var horizontalResolutionUnit = readUint16(reader);
    var widthUnit = readUint16(reader);
    var verticalResolution = readFixedPoint32(reader);
    var verticalResolutionUnit = readUint16(reader);
    var heightUnit = readUint16(reader);
    target.resolutionInfo = {
        horizontalResolution: horizontalResolution,
        horizontalResolutionUnit: RESOLUTION_UNITS[horizontalResolutionUnit] || 'PPI',
        widthUnit: MEASUREMENT_UNITS[widthUnit] || 'Inches',
        verticalResolution: verticalResolution,
        verticalResolutionUnit: RESOLUTION_UNITS[verticalResolutionUnit] || 'PPI',
        heightUnit: MEASUREMENT_UNITS[heightUnit] || 'Inches',
    };
}, function (writer, target) {
    var info = target.resolutionInfo;
    writeFixedPoint32(writer, info.horizontalResolution || 0);
    writeUint16(writer, Math.max(1, RESOLUTION_UNITS.indexOf(info.horizontalResolutionUnit)));
    writeUint16(writer, Math.max(1, MEASUREMENT_UNITS.indexOf(info.widthUnit)));
    writeFixedPoint32(writer, info.verticalResolution || 0);
    writeUint16(writer, Math.max(1, RESOLUTION_UNITS.indexOf(info.verticalResolutionUnit)));
    writeUint16(writer, Math.max(1, MEASUREMENT_UNITS.indexOf(info.heightUnit)));
});
var printScaleStyles = ['centered', 'size to fit', 'user defined'];
addHandler(1062, function (target) { return target.printScale !== undefined; }, function (reader, target) {
    target.printScale = {
        style: printScaleStyles[readInt16(reader)],
        x: readFloat32(reader),
        y: readFloat32(reader),
        scale: readFloat32(reader),
    };
}, function (writer, target) {
    var _a = target.printScale, style = _a.style, x = _a.x, y = _a.y, scale = _a.scale;
    writeInt16(writer, Math.max(0, printScaleStyles.indexOf(style)));
    writeFloat32(writer, x || 0);
    writeFloat32(writer, y || 0);
    writeFloat32(writer, scale || 0);
});
addHandler(1006, function (target) { return target.alphaChannelNames !== undefined; }, function (reader, target, left) {
    target.alphaChannelNames = [];
    while (left()) {
        var value = readPascalString(reader, 1);
        target.alphaChannelNames.push(value);
    }
}, function (writer, target) {
    for (var _i = 0, _a = target.alphaChannelNames; _i < _a.length; _i++) {
        var name_1 = _a[_i];
        writePascalString(writer, name_1, 1);
    }
});
addHandler(1045, function (target) { return target.alphaChannelNames !== undefined; }, function (reader, target, left) {
    target.alphaChannelNames = [];
    while (left()) {
        target.alphaChannelNames.push(readUnicodeString(reader));
    }
}, function (writer, target) {
    for (var _i = 0, _a = target.alphaChannelNames; _i < _a.length; _i++) {
        var name_2 = _a[_i];
        writeUnicodeStringWithPadding(writer, name_2);
    }
});
MOCK_HANDLERS && addHandler(1077, function (target) { return target._ir1077 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1077', left());
    target._ir1077 = readBytes(reader, left());
}, function (writer, target) {
    writeBytes(writer, target._ir1077);
});
addHandler(1053, function (target) { return target.alphaIdentifiers !== undefined; }, function (reader, target, left) {
    target.alphaIdentifiers = [];
    while (left() >= 4) {
        target.alphaIdentifiers.push(readUint32(reader));
    }
}, function (writer, target) {
    for (var _i = 0, _a = target.alphaIdentifiers; _i < _a.length; _i++) {
        var id = _a[_i];
        writeUint32(writer, id);
    }
});
addHandler(1010, function (target) { return target.backgroundColor !== undefined; }, function (reader, target) { return target.backgroundColor = readColor(reader); }, function (writer, target) { return writeColor(writer, target.backgroundColor); });
addHandler(1037, function (target) { return target.globalAngle !== undefined; }, function (reader, target) { return target.globalAngle = readUint32(reader); }, function (writer, target) { return writeUint32(writer, target.globalAngle); });
addHandler(1049, function (target) { return target.globalAltitude !== undefined; }, function (reader, target) { return target.globalAltitude = readUint32(reader); }, function (writer, target) { return writeUint32(writer, target.globalAltitude); });
addHandler(1011, function (target) { return target.printFlags !== undefined; }, function (reader, target) {
    target.printFlags = {
        labels: !!readUint8(reader),
        cropMarks: !!readUint8(reader),
        colorBars: !!readUint8(reader),
        registrationMarks: !!readUint8(reader),
        negative: !!readUint8(reader),
        flip: !!readUint8(reader),
        interpolate: !!readUint8(reader),
        caption: !!readUint8(reader),
        printFlags: !!readUint8(reader),
    };
}, function (writer, target) {
    var flags = target.printFlags;
    writeUint8(writer, flags.labels ? 1 : 0);
    writeUint8(writer, flags.cropMarks ? 1 : 0);
    writeUint8(writer, flags.colorBars ? 1 : 0);
    writeUint8(writer, flags.registrationMarks ? 1 : 0);
    writeUint8(writer, flags.negative ? 1 : 0);
    writeUint8(writer, flags.flip ? 1 : 0);
    writeUint8(writer, flags.interpolate ? 1 : 0);
    writeUint8(writer, flags.caption ? 1 : 0);
    writeUint8(writer, flags.printFlags ? 1 : 0);
});
MOCK_HANDLERS && addHandler(10000, // Print flags
function (// Print flags
target) { return target._ir10000 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 10000', left());
    target._ir10000 = readBytes(reader, left());
}, function (writer, target) {
    writeBytes(writer, target._ir10000);
});
MOCK_HANDLERS && addHandler(1013, // Color halftoning
function (// Color halftoning
target) { return target._ir1013 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1013', left());
    target._ir1013 = readBytes(reader, left());
}, function (writer, target) {
    writeBytes(writer, target._ir1013);
});
MOCK_HANDLERS && addHandler(1016, // Color transfer functions
function (// Color transfer functions
target) { return target._ir1016 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1016', left());
    target._ir1016 = readBytes(reader, left());
}, function (writer, target) {
    writeBytes(writer, target._ir1016);
});
addHandler(1024, function (target) { return target.layerState !== undefined; }, function (reader, target) { return target.layerState = readUint16(reader); }, function (writer, target) { return writeUint16(writer, target.layerState); });
addHandler(1026, function (target) { return target.layersGroup !== undefined; }, function (reader, target, left) {
    target.layersGroup = [];
    while (left()) {
        target.layersGroup.push(readUint16(reader));
    }
}, function (writer, target) {
    for (var _i = 0, _a = target.layersGroup; _i < _a.length; _i++) {
        var g = _a[_i];
        writeUint16(writer, g);
    }
});
addHandler(1072, function (target) { return target.layerGroupsEnabledId !== undefined; }, function (reader, target, left) {
    target.layerGroupsEnabledId = [];
    while (left()) {
        target.layerGroupsEnabledId.push(readUint8(reader));
    }
}, function (writer, target) {
    for (var _i = 0, _a = target.layerGroupsEnabledId; _i < _a.length; _i++) {
        var id = _a[_i];
        writeUint8(writer, id);
    }
});
addHandler(1069, function (target) { return target.layerSelectionIds !== undefined; }, function (reader, target) {
    var count = readUint16(reader);
    target.layerSelectionIds = [];
    while (count--) {
        target.layerSelectionIds.push(readUint32(reader));
    }
}, function (writer, target) {
    writeUint16(writer, target.layerSelectionIds.length);
    for (var _i = 0, _a = target.layerSelectionIds; _i < _a.length; _i++) {
        var id = _a[_i];
        writeUint32(writer, id);
    }
});
addHandler(1032, function (target) { return target.gridAndGuidesInformation !== undefined; }, function (reader, target) {
    var version = readUint32(reader);
    var horizontal = readUint32(reader);
    var vertical = readUint32(reader);
    var count = readUint32(reader);
    if (version !== 1)
        throw new Error("Invalid 1032 resource version: ".concat(version));
    target.gridAndGuidesInformation = {
        grid: { horizontal: horizontal, vertical: vertical },
        guides: [],
    };
    for (var i = 0; i < count; i++) {
        target.gridAndGuidesInformation.guides.push({
            location: readUint32(reader) / 32,
            direction: readUint8(reader) ? 'horizontal' : 'vertical'
        });
    }
}, function (writer, target) {
    var info = target.gridAndGuidesInformation;
    var grid = info.grid || { horizontal: 18 * 32, vertical: 18 * 32 };
    var guides = info.guides || [];
    writeUint32(writer, 1);
    writeUint32(writer, grid.horizontal);
    writeUint32(writer, grid.vertical);
    writeUint32(writer, guides.length);
    for (var _i = 0, guides_1 = guides; _i < guides_1.length; _i++) {
        var g = guides_1[_i];
        writeUint32(writer, g.location * 32);
        writeUint8(writer, g.direction === 'horizontal' ? 1 : 0);
    }
});
// 0 - normal, 7 - multiply, 8 - screen, 23 - difference
var onionSkinsBlendModes = [
    'normal', undefined, undefined, undefined, undefined, undefined, undefined, 'multiply',
    'screen', undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'difference',
];
addHandler(1078, // Onion Skins
function (// Onion Skins
target) { return target.onionSkins !== undefined; }, function (reader, target) {
    var desc = readVersionAndDescriptor(reader);
    // console.log('1078', require('util').inspect(desc, false, 99, true));
    target.onionSkins = {
        enabled: desc.enab,
        framesBefore: desc.numBefore,
        framesAfter: desc.numAfter,
        frameSpacing: desc.Spcn,
        minOpacity: desc.minOpacity / 100,
        maxOpacity: desc.maxOpacity / 100,
        blendMode: onionSkinsBlendModes[desc.BlnM] || 'normal',
    };
}, function (writer, target) {
    var onionSkins = target.onionSkins;
    var desc = {
        Vrsn: 1,
        enab: onionSkins.enabled,
        numBefore: onionSkins.framesBefore,
        numAfter: onionSkins.framesAfter,
        Spcn: onionSkins.frameSpacing,
        minOpacity: (onionSkins.minOpacity * 100) | 0,
        maxOpacity: (onionSkins.maxOpacity * 100) | 0,
        BlnM: Math.max(0, onionSkinsBlendModes.indexOf(onionSkins.blendMode)),
    };
    writeVersionAndDescriptor(writer, '', 'null', desc);
});
addHandler(1075, // Timeline Information
function (// Timeline Information
target) { return target.timelineInformation !== undefined; }, function (reader, target, _, options) {
    var _a, _b;
    var desc = readVersionAndDescriptor(reader);
    // console.log('1075', require('util').inspect(desc, false, 99, true));
    target.timelineInformation = {
        enabled: desc.enab,
        frameStep: desc.frameStep,
        frameRate: desc.frameRate,
        time: desc.time,
        duration: desc.duration,
        workInTime: desc.workInTime,
        workOutTime: desc.workOutTime,
        repeats: desc.LCnt,
        hasMotion: desc.hasMotion,
        globalTracks: parseTrackList(desc.globalTrackList, !!options.logMissingFeatures),
    };
    if ((_b = (_a = desc.audioClipGroupList) === null || _a === void 0 ? void 0 : _a.audioClipGroupList) === null || _b === void 0 ? void 0 : _b.length) {
        target.timelineInformation.audioClipGroups = desc.audioClipGroupList.audioClipGroupList.map(function (g) { return ({
            id: g.groupID,
            muted: g.muted,
            audioClips: g.audioClipList.map(function (_a) {
                var clipID = _a.clipID, timeScope = _a.timeScope, muted = _a.muted, audioLevel = _a.audioLevel, frameReader = _a.frameReader;
                return ({
                    id: clipID,
                    start: timeScope.Strt,
                    duration: timeScope.duration,
                    inTime: timeScope.inTime,
                    outTime: timeScope.outTime,
                    muted: muted,
                    audioLevel: audioLevel,
                    frameReader: {
                        type: frameReader.frameReaderType,
                        mediaDescriptor: frameReader.mediaDescriptor,
                        link: {
                            name: frameReader['Lnk ']['Nm  '],
                            fullPath: frameReader['Lnk '].fullPath,
                            relativePath: frameReader['Lnk '].relPath,
                        },
                    },
                });
            }),
        }); });
    }
}, function (writer, target) {
    var _a;
    var timeline = target.timelineInformation;
    var desc = {
        Vrsn: 1,
        enab: timeline.enabled,
        frameStep: timeline.frameStep,
        frameRate: timeline.frameRate,
        time: timeline.time,
        duration: timeline.duration,
        workInTime: timeline.workInTime,
        workOutTime: timeline.workOutTime,
        LCnt: timeline.repeats,
        globalTrackList: serializeTrackList(timeline.globalTracks),
        audioClipGroupList: {
            audioClipGroupList: (_a = timeline.audioClipGroups) === null || _a === void 0 ? void 0 : _a.map(function (a) { return ({
                groupID: a.id,
                muted: a.muted,
                audioClipList: a.audioClips.map(function (c) { return ({
                    clipID: c.id,
                    timeScope: {
                        Vrsn: 1,
                        Strt: c.start,
                        duration: c.duration,
                        inTime: c.inTime,
                        outTime: c.outTime,
                    },
                    frameReader: {
                        frameReaderType: c.frameReader.type,
                        descVersion: 1,
                        'Lnk ': {
                            descVersion: 1,
                            'Nm  ': c.frameReader.link.name,
                            fullPath: c.frameReader.link.fullPath,
                            relPath: c.frameReader.link.relativePath,
                        },
                        mediaDescriptor: c.frameReader.mediaDescriptor,
                    },
                    muted: c.muted,
                    audioLevel: c.audioLevel,
                }); }),
            }); }),
        },
        hasMotion: timeline.hasMotion,
    };
    // console.log('WRITE:1075', require('util').inspect(desc, false, 99, true));
    writeVersionAndDescriptor(writer, '', 'null', desc, 'anim');
});
addHandler(1076, // Sheet Disclosure
function (// Sheet Disclosure
target) { return target.sheetDisclosure !== undefined; }, function (reader, target) {
    var desc = readVersionAndDescriptor(reader);
    // console.log('1076', require('util').inspect(desc, false, 99, true));
    target.sheetDisclosure = {};
    if (desc.sheetTimelineOptions) {
        target.sheetDisclosure.sheetTimelineOptions = desc.sheetTimelineOptions.map(function (o) { return ({
            sheetID: o.sheetID,
            sheetDisclosed: o.sheetDisclosed,
            lightsDisclosed: o.lightsDisclosed,
            meshesDisclosed: o.meshesDisclosed,
            materialsDisclosed: o.materialsDisclosed,
        }); });
    }
}, function (writer, target) {
    var disclosure = target.sheetDisclosure;
    var desc = { Vrsn: 1 };
    if (disclosure.sheetTimelineOptions) {
        desc.sheetTimelineOptions = disclosure.sheetTimelineOptions.map(function (d) { return ({
            Vrsn: 2,
            sheetID: d.sheetID,
            sheetDisclosed: d.sheetDisclosed,
            lightsDisclosed: d.lightsDisclosed,
            meshesDisclosed: d.meshesDisclosed,
            materialsDisclosed: d.materialsDisclosed,
        }); });
    }
    writeVersionAndDescriptor(writer, '', 'null', desc);
});
addHandler(1054, function (target) { return target.urlsList !== undefined; }, function (reader, target, _, options) {
    var count = readUint32(reader);
    if (count) {
        if (!options.throwForMissingFeatures)
            return;
        throw new Error('Not implemented: URL List');
    }
    // TODO: read actual URL list
    target.urlsList = [];
}, function (writer, target) {
    writeUint32(writer, target.urlsList.length);
    // TODO: write actual URL list
    if (target.urlsList.length) {
        throw new Error('Not implemented: URL List');
    }
});
MOCK_HANDLERS && addHandler(1050, // Slices
function (// Slices
target) { return target._ir1050 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1050', left());
    target._ir1050 = readBytes(reader, left());
}, function (writer, target) {
    writeBytes(writer, target._ir1050);
});
addHandler(1064, function (target) { return target.pixelAspectRatio !== undefined; }, function (reader, target) {
    if (readUint32(reader) > 2)
        throw new Error('Invalid pixelAspectRatio version');
    target.pixelAspectRatio = { aspect: readFloat64(reader) };
}, function (writer, target) {
    writeUint32(writer, 2); // version
    writeFloat64(writer, target.pixelAspectRatio.aspect);
});
addHandler(1041, function (target) { return target.iccUntaggedProfile !== undefined; }, function (reader, target) {
    target.iccUntaggedProfile = !!readUint8(reader);
}, function (writer, target) {
    writeUint8(writer, target.iccUntaggedProfile ? 1 : 0);
});
MOCK_HANDLERS && addHandler(1039, // ICC Profile
function (// ICC Profile
target) { return target._ir1039 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1039', left());
    target._ir1039 = readBytes(reader, left());
}, function (writer, target) {
    writeBytes(writer, target._ir1039);
});
addHandler(1044, function (target) { return target.idsSeedNumber !== undefined; }, function (reader, target) { return target.idsSeedNumber = readUint32(reader); }, function (writer, target) { return writeUint32(writer, target.idsSeedNumber); });
addHandler(1036, function (target) { return target.thumbnail !== undefined || target.thumbnailRaw !== undefined; }, function (reader, target, left, options) {
    var format = readUint32(reader); // 1 = kJpegRGB, 0 = kRawRGB
    var width = readUint32(reader);
    var height = readUint32(reader);
    readUint32(reader); // widthBytes = (width * bits_per_pixel + 31) / 32 * 4.
    readUint32(reader); // totalSize = widthBytes * height * planes
    readUint32(reader); // sizeAfterCompression
    var bitsPerPixel = readUint16(reader); // 24
    var planes = readUint16(reader); // 1
    if (format !== 1 || bitsPerPixel !== 24 || planes !== 1) {
        options.logMissingFeatures && console.log("Invalid thumbnail data (format: ".concat(format, ", bitsPerPixel: ").concat(bitsPerPixel, ", planes: ").concat(planes, ")"));
        skipBytes(reader, left());
        return;
    }
    var size = left();
    var data = readBytes(reader, size);
    if (options.useRawThumbnail) {
        target.thumbnailRaw = { width: width, height: height, data: data };
    }
    else if (data.byteLength) {
        target.thumbnail = createCanvasFromData(data);
    }
}, function (writer, target) {
    var _a;
    var width = 0;
    var height = 0;
    var data;
    if (target.thumbnailRaw) {
        width = target.thumbnailRaw.width;
        height = target.thumbnailRaw.height;
        data = target.thumbnailRaw.data;
    }
    else {
        var dataUrl = (_a = target.thumbnail.toDataURL('image/jpeg', 1)) === null || _a === void 0 ? void 0 : _a.substring('data:image/jpeg;base64,'.length);
        if (dataUrl) {
            width = target.thumbnail.width;
            height = target.thumbnail.height;
            data = toByteArray(dataUrl);
        }
        else {
            data = new Uint8Array(0);
        }
    }
    var bitsPerPixel = 24;
    var widthBytes = Math.floor((width * bitsPerPixel + 31) / 32) * 4;
    var planes = 1;
    var totalSize = widthBytes * height * planes;
    var sizeAfterCompression = data.length;
    writeUint32(writer, 1); // 1 = kJpegRGB
    writeUint32(writer, width);
    writeUint32(writer, height);
    writeUint32(writer, widthBytes);
    writeUint32(writer, totalSize);
    writeUint32(writer, sizeAfterCompression);
    writeUint16(writer, bitsPerPixel);
    writeUint16(writer, planes);
    writeBytes(writer, data);
});
addHandler(1057, function (target) { return target.versionInfo !== undefined; }, function (reader, target, left) {
    var version = readUint32(reader);
    if (version !== 1)
        throw new Error('Invalid versionInfo version');
    target.versionInfo = {
        hasRealMergedData: !!readUint8(reader),
        writerName: readUnicodeString(reader),
        readerName: readUnicodeString(reader),
        fileVersion: readUint32(reader),
    };
    skipBytes(reader, left());
}, function (writer, target) {
    var versionInfo = target.versionInfo;
    writeUint32(writer, 1); // version
    writeUint8(writer, versionInfo.hasRealMergedData ? 1 : 0);
    writeUnicodeString(writer, versionInfo.writerName);
    writeUnicodeString(writer, versionInfo.readerName);
    writeUint32(writer, versionInfo.fileVersion);
});
MOCK_HANDLERS && addHandler(1058, // EXIF data 1.
function (// EXIF data 1.
target) { return target._ir1058 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1058', left());
    target._ir1058 = readBytes(reader, left());
}, function (writer, target) {
    writeBytes(writer, target._ir1058);
});
addHandler(7000, function (target) { return target.imageReadyVariables !== undefined; }, function (reader, target, left) {
    target.imageReadyVariables = readUtf8String(reader, left());
}, function (writer, target) {
    writeUtf8String(writer, target.imageReadyVariables);
});
addHandler(7001, function (target) { return target.imageReadyDataSets !== undefined; }, function (reader, target, left) {
    target.imageReadyDataSets = readUtf8String(reader, left());
}, function (writer, target) {
    writeUtf8String(writer, target.imageReadyDataSets);
});
addHandler(1088, function (target) { return target.pathSelectionState !== undefined; }, function (reader, target, _left) {
    var desc = readVersionAndDescriptor(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    target.pathSelectionState = desc['null'];
}, function (writer, target) {
    var desc = { 'null': target.pathSelectionState };
    writeVersionAndDescriptor(writer, '', 'null', desc);
});
MOCK_HANDLERS && addHandler(1025, function (target) { return target._ir1025 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 1025', left());
    target._ir1025 = readBytes(reader, left());
}, function (writer, target) {
    writeBytes(writer, target._ir1025);
});
var FrmD = createEnum('FrmD', '', {
    auto: 'Auto',
    none: 'None',
    dispose: 'Disp',
});
addHandler(4000, // Plug-In resource(s)
function (// Plug-In resource(s)
target) { return target.animations !== undefined; }, function (reader, target, left, _a) {
    var logMissingFeatures = _a.logMissingFeatures, logDevFeatures = _a.logDevFeatures;
    var key = readSignature(reader);
    if (key === 'mani') {
        checkSignature(reader, 'IRFR');
        readSection(reader, 1, function (left) {
            var _loop_1 = function () {
                checkSignature(reader, '8BIM');
                var key_1 = readSignature(reader);
                readSection(reader, 1, function (left) {
                    if (key_1 === 'AnDs') {
                        var desc = readVersionAndDescriptor(reader);
                        target.animations = {
                            // desc.AFSt ???
                            frames: desc.FrIn.map(function (x) { return ({
                                id: x.FrID,
                                delay: (x.FrDl || 0) / 100,
                                dispose: x.FrDs ? FrmD.decode(x.FrDs) : 'auto', // missing == auto
                                // x.FrGA ???
                            }); }),
                            animations: desc.FSts.map(function (x) { return ({
                                id: x.FsID,
                                frames: x.FsFr,
                                repeats: x.LCnt,
                                activeFrame: x.AFrm || 0,
                            }); }),
                        };
                        // console.log('#4000 AnDs', require('util').inspect(desc, false, 99, true));
                        // console.log('#4000 AnDs:result', require('util').inspect(target.animations, false, 99, true));
                    }
                    else if (key_1 === 'Roll') {
                        var bytes = readBytes(reader, left());
                        logDevFeatures && console.log('#4000 Roll', bytes);
                    }
                    else {
                        logMissingFeatures && console.log('Unhandled subsection in #4000', key_1);
                    }
                });
            };
            while (left()) {
                _loop_1();
            }
        });
    }
    else if (key === 'mopt') {
        var bytes = readBytes(reader, left());
        logDevFeatures && console.log('#4000 mopt', bytes);
    }
    else {
        logMissingFeatures && console.log('Unhandled key in #4000:', key);
    }
}, function (writer, target) {
    if (target.animations) {
        writeSignature(writer, 'mani');
        writeSignature(writer, 'IRFR');
        writeSection(writer, 1, function () {
            writeSignature(writer, '8BIM');
            writeSignature(writer, 'AnDs');
            writeSection(writer, 1, function () {
                var desc = {
                    // AFSt: 0, // ???
                    FrIn: [],
                    FSts: [],
                };
                for (var i = 0; i < target.animations.frames.length; i++) {
                    var f = target.animations.frames[i];
                    var frame = {
                        FrID: f.id,
                    };
                    if (f.delay)
                        frame.FrDl = (f.delay * 100) | 0;
                    frame.FrDs = FrmD.encode(f.dispose);
                    // if (i === 0) frame.FrGA = 30; // ???
                    desc.FrIn.push(frame);
                }
                for (var i = 0; i < target.animations.animations.length; i++) {
                    var a = target.animations.animations[i];
                    var anim = {
                        FsID: a.id,
                        AFrm: a.activeFrame | 0,
                        FsFr: a.frames,
                        LCnt: a.repeats | 0,
                    };
                    desc.FSts.push(anim);
                }
                writeVersionAndDescriptor(writer, '', 'null', desc);
            });
            // writeSignature(writer, '8BIM');
            // writeSignature(writer, 'Roll');
            // writeSection(writer, 1, () => {
            // 	writeZeros(writer, 8);
            // });
        });
    }
});
// TODO: Unfinished
MOCK_HANDLERS && addHandler(4001, // Plug-In resource(s)
function (// Plug-In resource(s)
target) { return target._ir4001 !== undefined; }, function (reader, target, left, _a) {
    var logMissingFeatures = _a.logMissingFeatures, logDevFeatures = _a.logDevFeatures;
    if (MOCK_HANDLERS) {
        LOG_MOCK_HANDLERS && console.log('image resource 4001', left());
        target._ir4001 = readBytes(reader, left());
        return;
    }
    var key = readSignature(reader);
    if (key === 'mfri') {
        var version = readUint32(reader);
        if (version !== 2)
            throw new Error('Invalid mfri version');
        var length_1 = readUint32(reader);
        var bytes = readBytes(reader, length_1);
        logDevFeatures && console.log('mfri', bytes);
    }
    else if (key === 'mset') {
        var desc = readVersionAndDescriptor(reader);
        logDevFeatures && console.log('mset', desc);
    }
    else {
        logMissingFeatures && console.log('Unhandled key in #4001', key);
    }
}, function (writer, target) {
    writeBytes(writer, target._ir4001);
});
// TODO: Unfinished
MOCK_HANDLERS && addHandler(4002, // Plug-In resource(s)
function (// Plug-In resource(s)
target) { return target._ir4002 !== undefined; }, function (reader, target, left) {
    LOG_MOCK_HANDLERS && console.log('image resource 4002', left());
    target._ir4002 = readBytes(reader, left());
}, function (writer, target) {
    writeBytes(writer, target._ir4002);
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDL0QsTUFBYyxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFDckQsQ0FBQyxFQUNELFVBQUMsTUFBTSxFQUFFLE1BQU07SUFDZCxVQUFVLENBQUMsTUFBTSxFQUFHLE1BQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM3QyxDQUFDLENBQ0QsQ0FBQyIsImZpbGUiOiJpbWFnZVJlc291cmNlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHRvQnl0ZUFycmF5IH0gZnJvbSAnYmFzZTY0LWpzJztcbmltcG9ydCB7IEJsZW5kTW9kZSwgSW1hZ2VSZXNvdXJjZXMsIFJlYWRPcHRpb25zLCBSZW5kZXJpbmdJbnRlbnQgfSBmcm9tICcuL3BzZCc7XG5pbXBvcnQge1xuXHRQc2RSZWFkZXIsIHJlYWRQYXNjYWxTdHJpbmcsIHJlYWRVbmljb2RlU3RyaW5nLCByZWFkVWludDMyLCByZWFkVWludDE2LCByZWFkVWludDgsIHJlYWRGbG9hdDY0LFxuXHRyZWFkQnl0ZXMsIHNraXBCeXRlcywgcmVhZEZsb2F0MzIsIHJlYWRJbnQxNiwgcmVhZEZpeGVkUG9pbnQzMiwgcmVhZFNpZ25hdHVyZSwgY2hlY2tTaWduYXR1cmUsXG5cdHJlYWRTZWN0aW9uLCByZWFkQ29sb3Jcbn0gZnJvbSAnLi9wc2RSZWFkZXInO1xuaW1wb3J0IHtcblx0UHNkV3JpdGVyLCB3cml0ZVBhc2NhbFN0cmluZywgd3JpdGVVbmljb2RlU3RyaW5nLCB3cml0ZVVpbnQzMiwgd3JpdGVVaW50OCwgd3JpdGVGbG9hdDY0LCB3cml0ZVVpbnQxNixcblx0d3JpdGVCeXRlcywgd3JpdGVJbnQxNiwgd3JpdGVGbG9hdDMyLCB3cml0ZUZpeGVkUG9pbnQzMiwgd3JpdGVVbmljb2RlU3RyaW5nV2l0aFBhZGRpbmcsIHdyaXRlQ29sb3IsIHdyaXRlU2lnbmF0dXJlLFxuXHR3cml0ZVNlY3Rpb24sXG59IGZyb20gJy4vcHNkV3JpdGVyJztcbmltcG9ydCB7IGNyZWF0ZUNhbnZhc0Zyb21EYXRhLCBjcmVhdGVFbnVtLCBNT0NLX0hBTkRMRVJTIH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7IGRlY29kZVN0cmluZywgZW5jb2RlU3RyaW5nIH0gZnJvbSAnLi91dGY4JztcbmltcG9ydCB7IEZyYWN0aW9uRGVzY3JpcHRvciwgcGFyc2VUcmFja0xpc3QsIHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvciwgc2VyaWFsaXplVHJhY2tMaXN0LCBUaW1lbGluZVRyYWNrRGVzY3JpcHRvciwgVGltZVNjb3BlRGVzY3JpcHRvciwgd3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvciB9IGZyb20gJy4vZGVzY3JpcHRvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb3VyY2VIYW5kbGVyIHtcblx0a2V5OiBudW1iZXI7XG5cdGhhczogKHRhcmdldDogSW1hZ2VSZXNvdXJjZXMpID0+IGJvb2xlYW47XG5cdHJlYWQ6IChyZWFkZXI6IFBzZFJlYWRlciwgdGFyZ2V0OiBJbWFnZVJlc291cmNlcywgbGVmdDogKCkgPT4gbnVtYmVyLCBvcHRpb25zOiBSZWFkT3B0aW9ucykgPT4gdm9pZDtcblx0d3JpdGU6ICh3cml0ZXI6IFBzZFdyaXRlciwgdGFyZ2V0OiBJbWFnZVJlc291cmNlcykgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGNvbnN0IHJlc291cmNlSGFuZGxlcnM6IFJlc291cmNlSGFuZGxlcltdID0gW107XG5leHBvcnQgY29uc3QgcmVzb3VyY2VIYW5kbGVyc01hcDogeyBba2V5OiBudW1iZXJdOiBSZXNvdXJjZUhhbmRsZXIgfSA9IHt9O1xuXG5mdW5jdGlvbiBhZGRIYW5kbGVyKFxuXHRrZXk6IG51bWJlcixcblx0aGFzOiAodGFyZ2V0OiBJbWFnZVJlc291cmNlcykgPT4gYm9vbGVhbixcblx0cmVhZDogKHJlYWRlcjogUHNkUmVhZGVyLCB0YXJnZXQ6IEltYWdlUmVzb3VyY2VzLCBsZWZ0OiAoKSA9PiBudW1iZXIsIG9wdGlvbnM6IFJlYWRPcHRpb25zKSA9PiB2b2lkLFxuXHR3cml0ZTogKHdyaXRlcjogUHNkV3JpdGVyLCB0YXJnZXQ6IEltYWdlUmVzb3VyY2VzKSA9PiB2b2lkLFxuKSB7XG5cdGNvbnN0IGhhbmRsZXI6IFJlc291cmNlSGFuZGxlciA9IHsga2V5LCBoYXMsIHJlYWQsIHdyaXRlIH07XG5cdHJlc291cmNlSGFuZGxlcnMucHVzaChoYW5kbGVyKTtcblx0cmVzb3VyY2VIYW5kbGVyc01hcFtoYW5kbGVyLmtleV0gPSBoYW5kbGVyO1xufVxuXG5jb25zdCBMT0dfTU9DS19IQU5ETEVSUyA9IGZhbHNlO1xuY29uc3QgUkVTT0xVVElPTl9VTklUUyA9IFt1bmRlZmluZWQsICdQUEknLCAnUFBDTSddO1xuY29uc3QgTUVBU1VSRU1FTlRfVU5JVFMgPSBbdW5kZWZpbmVkLCAnSW5jaGVzJywgJ0NlbnRpbWV0ZXJzJywgJ1BvaW50cycsICdQaWNhcycsICdDb2x1bW5zJ107XG5jb25zdCBoZXggPSAnMDEyMzQ1Njc4OWFiY2RlZic7XG5cbmZ1bmN0aW9uIGNoYXJUb05pYmJsZShjb2RlOiBudW1iZXIpIHtcblx0cmV0dXJuIGNvZGUgPD0gNTcgPyBjb2RlIC0gNDggOiBjb2RlIC0gODc7XG59XG5cbmZ1bmN0aW9uIGJ5dGVBdCh2YWx1ZTogc3RyaW5nLCBpbmRleDogbnVtYmVyKSB7XG5cdHJldHVybiAoY2hhclRvTmliYmxlKHZhbHVlLmNoYXJDb2RlQXQoaW5kZXgpKSA8PCA0KSB8IGNoYXJUb05pYmJsZSh2YWx1ZS5jaGFyQ29kZUF0KGluZGV4ICsgMSkpO1xufVxuXG5mdW5jdGlvbiByZWFkVXRmOFN0cmluZyhyZWFkZXI6IFBzZFJlYWRlciwgbGVuZ3RoOiBudW1iZXIpIHtcblx0Y29uc3QgYnVmZmVyID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVuZ3RoKTtcblx0cmV0dXJuIGRlY29kZVN0cmluZyhidWZmZXIpO1xufVxuXG5mdW5jdGlvbiB3cml0ZVV0ZjhTdHJpbmcod3JpdGVyOiBQc2RXcml0ZXIsIHZhbHVlOiBzdHJpbmcpIHtcblx0Y29uc3QgYnVmZmVyID0gZW5jb2RlU3RyaW5nKHZhbHVlKTtcblx0d3JpdGVCeXRlcyh3cml0ZXIsIGJ1ZmZlcik7XG59XG5cbk1PQ0tfSEFORExFUlMgJiYgYWRkSGFuZGxlcihcblx0MTAyOCwgLy8gSVBUQy1OQUEgcmVjb3JkXG5cdHRhcmdldCA9PiAodGFyZ2V0IGFzIGFueSkuX2lyMTAyOCAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRMT0dfTU9DS19IQU5ETEVSUyAmJiBjb25zb2xlLmxvZygnaW1hZ2UgcmVzb3VyY2UgMTAyOCcsIGxlZnQoKSk7XG5cdFx0KHRhcmdldCBhcyBhbnkpLl9pcjEwMjggPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgKHRhcmdldCBhcyBhbnkpLl9pcjEwMjgpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTA2MSxcblx0dGFyZ2V0ID0+IHRhcmdldC5jYXB0aW9uRGlnZXN0ICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGxldCBjYXB0aW9uRGlnZXN0ID0gJyc7XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcblx0XHRcdGNvbnN0IGJ5dGUgPSByZWFkVWludDgocmVhZGVyKTtcblx0XHRcdGNhcHRpb25EaWdlc3QgKz0gaGV4W2J5dGUgPj4gNF07XG5cdFx0XHRjYXB0aW9uRGlnZXN0ICs9IGhleFtieXRlICYgMHhmXTtcblx0XHR9XG5cblx0XHR0YXJnZXQuY2FwdGlvbkRpZ2VzdCA9IGNhcHRpb25EaWdlc3Q7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIGJ5dGVBdCh0YXJnZXQuY2FwdGlvbkRpZ2VzdCEsIGkgKiAyKSk7XG5cdFx0fVxuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTA2MCxcblx0dGFyZ2V0ID0+IHRhcmdldC54bXBNZXRhZGF0YSAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHRhcmdldC54bXBNZXRhZGF0YSA9IHJlYWRVdGY4U3RyaW5nKHJlYWRlciwgbGVmdCgpKSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB3cml0ZVV0ZjhTdHJpbmcod3JpdGVyLCB0YXJnZXQueG1wTWV0YWRhdGEhKSxcbik7XG5cbmNvbnN0IEludGUgPSBjcmVhdGVFbnVtPFJlbmRlcmluZ0ludGVudD4oJ0ludGUnLCAncGVyY2VwdHVhbCcsIHtcblx0J3BlcmNlcHR1YWwnOiAnSW1nICcsXG5cdCdzYXR1cmF0aW9uJzogJ0dycCAnLFxuXHQncmVsYXRpdmUgY29sb3JpbWV0cmljJzogJ0Nscm0nLFxuXHQnYWJzb2x1dGUgY29sb3JpbWV0cmljJzogJ0FDbHInLFxufSk7XG5cbmludGVyZmFjZSBQcmludEluZm9ybWF0aW9uRGVzY3JpcHRvciB7XG5cdCdObSAgJz86IHN0cmluZztcblx0Q2xyUz86IHN0cmluZztcblx0UHN0Uz86IGJvb2xlYW47XG5cdE1wQmw/OiBib29sZWFuO1xuXHRJbnRlPzogc3RyaW5nO1xuXHRoYXJkUHJvb2Y/OiBib29sZWFuO1xuXHRwcmludFNpeHRlZW5CaXQ/OiBib29sZWFuO1xuXHRwcmludGVyTmFtZT86IHN0cmluZztcblx0cHJpbnRQcm9vZlNldHVwPzoge1xuXHRcdEJsdG46IHN0cmluZztcblx0fSB8IHtcblx0XHRwcm9maWxlOiBzdHJpbmc7XG5cdFx0SW50ZTogc3RyaW5nO1xuXHRcdE1wQmw6IGJvb2xlYW47XG5cdFx0cGFwZXJXaGl0ZTogYm9vbGVhbjtcblx0fTtcbn1cblxuYWRkSGFuZGxlcihcblx0MTA4Mixcblx0dGFyZ2V0ID0+IHRhcmdldC5wcmludEluZm9ybWF0aW9uICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGRlc2M6IFByaW50SW5mb3JtYXRpb25EZXNjcmlwdG9yID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcik7XG5cblx0XHR0YXJnZXQucHJpbnRJbmZvcm1hdGlvbiA9IHtcblx0XHRcdHByaW50ZXJOYW1lOiBkZXNjLnByaW50ZXJOYW1lIHx8ICcnLFxuXHRcdFx0cmVuZGVyaW5nSW50ZW50OiBJbnRlLmRlY29kZShkZXNjLkludGUgPz8gJ0ludGUuSW1nICcpLFxuXHRcdH07XG5cblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LnByaW50SW5mb3JtYXRpb247XG5cblx0XHRpZiAoZGVzYy5Qc3RTICE9PSB1bmRlZmluZWQpIGluZm8ucHJpbnRlck1hbmFnZXNDb2xvcnMgPSBkZXNjLlBzdFM7XG5cdFx0aWYgKGRlc2NbJ05tICAnXSAhPT0gdW5kZWZpbmVkKSBpbmZvLnByaW50ZXJQcm9maWxlID0gZGVzY1snTm0gICddO1xuXHRcdGlmIChkZXNjLk1wQmwgIT09IHVuZGVmaW5lZCkgaW5mby5ibGFja1BvaW50Q29tcGVuc2F0aW9uID0gZGVzYy5NcEJsO1xuXHRcdGlmIChkZXNjLnByaW50U2l4dGVlbkJpdCAhPT0gdW5kZWZpbmVkKSBpbmZvLnByaW50U2l4dGVlbkJpdCA9IGRlc2MucHJpbnRTaXh0ZWVuQml0O1xuXHRcdGlmIChkZXNjLmhhcmRQcm9vZiAhPT0gdW5kZWZpbmVkKSBpbmZvLmhhcmRQcm9vZiA9IGRlc2MuaGFyZFByb29mO1xuXHRcdGlmIChkZXNjLnByaW50UHJvb2ZTZXR1cCkge1xuXHRcdFx0aWYgKCdCbHRuJyBpbiBkZXNjLnByaW50UHJvb2ZTZXR1cCkge1xuXHRcdFx0XHRpbmZvLnByb29mU2V0dXAgPSB7IGJ1aWx0aW46IGRlc2MucHJpbnRQcm9vZlNldHVwLkJsdG4uc3BsaXQoJy4nKVsxXSB9O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aW5mby5wcm9vZlNldHVwID0ge1xuXHRcdFx0XHRcdHByb2ZpbGU6IGRlc2MucHJpbnRQcm9vZlNldHVwLnByb2ZpbGUsXG5cdFx0XHRcdFx0cmVuZGVyaW5nSW50ZW50OiBJbnRlLmRlY29kZShkZXNjLnByaW50UHJvb2ZTZXR1cC5JbnRlID8/ICdJbnRlLkltZyAnKSxcblx0XHRcdFx0XHRibGFja1BvaW50Q29tcGVuc2F0aW9uOiAhIWRlc2MucHJpbnRQcm9vZlNldHVwLk1wQmwsXG5cdFx0XHRcdFx0cGFwZXJXaGl0ZTogISFkZXNjLnByaW50UHJvb2ZTZXR1cC5wYXBlcldoaXRlLFxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgaW5mbyA9IHRhcmdldC5wcmludEluZm9ybWF0aW9uITtcblx0XHRjb25zdCBkZXNjOiBQcmludEluZm9ybWF0aW9uRGVzY3JpcHRvciA9IHt9O1xuXG5cdFx0aWYgKGluZm8ucHJpbnRlck1hbmFnZXNDb2xvcnMpIHtcblx0XHRcdGRlc2MuUHN0UyA9IHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChpbmZvLmhhcmRQcm9vZiAhPT0gdW5kZWZpbmVkKSBkZXNjLmhhcmRQcm9vZiA9ICEhaW5mby5oYXJkUHJvb2Y7XG5cdFx0XHRkZXNjLkNsclMgPSAnQ2xyUy5SR0JDJzsgLy8gVE9ETzogPz8/XG5cdFx0XHRkZXNjWydObSAgJ10gPSBpbmZvLnByaW50ZXJQcm9maWxlID8/ICdDSUUgUkdCJztcblx0XHR9XG5cblx0XHRkZXNjLkludGUgPSBJbnRlLmVuY29kZShpbmZvLnJlbmRlcmluZ0ludGVudCk7XG5cblx0XHRpZiAoIWluZm8ucHJpbnRlck1hbmFnZXNDb2xvcnMpIGRlc2MuTXBCbCA9ICEhaW5mby5ibGFja1BvaW50Q29tcGVuc2F0aW9uO1xuXG5cdFx0ZGVzYy5wcmludFNpeHRlZW5CaXQgPSAhIWluZm8ucHJpbnRTaXh0ZWVuQml0O1xuXHRcdGRlc2MucHJpbnRlck5hbWUgPSBpbmZvLnByaW50ZXJOYW1lIHx8ICcnO1xuXG5cdFx0aWYgKGluZm8ucHJvb2ZTZXR1cCAmJiAncHJvZmlsZScgaW4gaW5mby5wcm9vZlNldHVwKSB7XG5cdFx0XHRkZXNjLnByaW50UHJvb2ZTZXR1cCA9IHtcblx0XHRcdFx0cHJvZmlsZTogaW5mby5wcm9vZlNldHVwLnByb2ZpbGUgfHwgJycsXG5cdFx0XHRcdEludGU6IEludGUuZW5jb2RlKGluZm8ucHJvb2ZTZXR1cC5yZW5kZXJpbmdJbnRlbnQpLFxuXHRcdFx0XHRNcEJsOiAhIWluZm8ucHJvb2ZTZXR1cC5ibGFja1BvaW50Q29tcGVuc2F0aW9uLFxuXHRcdFx0XHRwYXBlcldoaXRlOiAhIWluZm8ucHJvb2ZTZXR1cC5wYXBlcldoaXRlLFxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVzYy5wcmludFByb29mU2V0dXAgPSB7XG5cdFx0XHRcdEJsdG46IGluZm8ucHJvb2ZTZXR1cD8uYnVpbHRpbiA/IGBidWlsdGluUHJvb2YuJHtpbmZvLnByb29mU2V0dXAuYnVpbHRpbn1gIDogJ2J1aWx0aW5Qcm9vZi5wcm9vZkNNWUsnLFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdwcmludE91dHB1dCcsIGRlc2MpO1xuXHR9LFxuKTtcblxuTU9DS19IQU5ETEVSUyAmJiBhZGRIYW5kbGVyKFxuXHQxMDgzLCAvLyBQcmludCBzdHlsZVxuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9pcjEwODMgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0TE9HX01PQ0tfSEFORExFUlMgJiYgY29uc29sZS5sb2coJ2ltYWdlIHJlc291cmNlIDEwODMnLCBsZWZ0KCkpO1xuXHRcdCh0YXJnZXQgYXMgYW55KS5faXIxMDgzID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblxuXHRcdC8vIFRPRE86XG5cdFx0Ly8gY29uc3QgZGVzYyA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpO1xuXHRcdC8vIGNvbnNvbGUubG9nKCcxMDgzJywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYywgZmFsc2UsIDk5LCB0cnVlKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlQnl0ZXMod3JpdGVyLCAodGFyZ2V0IGFzIGFueSkuX2lyMTA4Myk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDA1LFxuXHR0YXJnZXQgPT4gdGFyZ2V0LnJlc29sdXRpb25JbmZvICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGhvcml6b250YWxSZXNvbHV0aW9uID0gcmVhZEZpeGVkUG9pbnQzMihyZWFkZXIpO1xuXHRcdGNvbnN0IGhvcml6b250YWxSZXNvbHV0aW9uVW5pdCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0XHRjb25zdCB3aWR0aFVuaXQgPSByZWFkVWludDE2KHJlYWRlcik7XG5cdFx0Y29uc3QgdmVydGljYWxSZXNvbHV0aW9uID0gcmVhZEZpeGVkUG9pbnQzMihyZWFkZXIpO1xuXHRcdGNvbnN0IHZlcnRpY2FsUmVzb2x1dGlvblVuaXQgPSByZWFkVWludDE2KHJlYWRlcik7XG5cdFx0Y29uc3QgaGVpZ2h0VW5pdCA9IHJlYWRVaW50MTYocmVhZGVyKTtcblxuXHRcdHRhcmdldC5yZXNvbHV0aW9uSW5mbyA9IHtcblx0XHRcdGhvcml6b250YWxSZXNvbHV0aW9uLFxuXHRcdFx0aG9yaXpvbnRhbFJlc29sdXRpb25Vbml0OiBSRVNPTFVUSU9OX1VOSVRTW2hvcml6b250YWxSZXNvbHV0aW9uVW5pdF0gfHwgJ1BQSScgYXMgYW55LFxuXHRcdFx0d2lkdGhVbml0OiBNRUFTVVJFTUVOVF9VTklUU1t3aWR0aFVuaXRdIHx8ICdJbmNoZXMnIGFzIGFueSxcblx0XHRcdHZlcnRpY2FsUmVzb2x1dGlvbixcblx0XHRcdHZlcnRpY2FsUmVzb2x1dGlvblVuaXQ6IFJFU09MVVRJT05fVU5JVFNbdmVydGljYWxSZXNvbHV0aW9uVW5pdF0gfHwgJ1BQSScgYXMgYW55LFxuXHRcdFx0aGVpZ2h0VW5pdDogTUVBU1VSRU1FTlRfVU5JVFNbaGVpZ2h0VW5pdF0gfHwgJ0luY2hlcycgYXMgYW55LFxuXHRcdH07XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGluZm8gPSB0YXJnZXQucmVzb2x1dGlvbkluZm8hO1xuXG5cdFx0d3JpdGVGaXhlZFBvaW50MzIod3JpdGVyLCBpbmZvLmhvcml6b250YWxSZXNvbHV0aW9uIHx8IDApO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5tYXgoMSwgUkVTT0xVVElPTl9VTklUUy5pbmRleE9mKGluZm8uaG9yaXpvbnRhbFJlc29sdXRpb25Vbml0KSkpO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5tYXgoMSwgTUVBU1VSRU1FTlRfVU5JVFMuaW5kZXhPZihpbmZvLndpZHRoVW5pdCkpKTtcblx0XHR3cml0ZUZpeGVkUG9pbnQzMih3cml0ZXIsIGluZm8udmVydGljYWxSZXNvbHV0aW9uIHx8IDApO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgTWF0aC5tYXgoMSwgUkVTT0xVVElPTl9VTklUUy5pbmRleE9mKGluZm8udmVydGljYWxSZXNvbHV0aW9uVW5pdCkpKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIE1hdGgubWF4KDEsIE1FQVNVUkVNRU5UX1VOSVRTLmluZGV4T2YoaW5mby5oZWlnaHRVbml0KSkpO1xuXHR9LFxuKTtcblxuY29uc3QgcHJpbnRTY2FsZVN0eWxlcyA9IFsnY2VudGVyZWQnLCAnc2l6ZSB0byBmaXQnLCAndXNlciBkZWZpbmVkJ107XG5cbmFkZEhhbmRsZXIoXG5cdDEwNjIsXG5cdHRhcmdldCA9PiB0YXJnZXQucHJpbnRTY2FsZSAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHtcblx0XHR0YXJnZXQucHJpbnRTY2FsZSA9IHtcblx0XHRcdHN0eWxlOiBwcmludFNjYWxlU3R5bGVzW3JlYWRJbnQxNihyZWFkZXIpXSBhcyBhbnksXG5cdFx0XHR4OiByZWFkRmxvYXQzMihyZWFkZXIpLFxuXHRcdFx0eTogcmVhZEZsb2F0MzIocmVhZGVyKSxcblx0XHRcdHNjYWxlOiByZWFkRmxvYXQzMihyZWFkZXIpLFxuXHRcdH07XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IHsgc3R5bGUsIHgsIHksIHNjYWxlIH0gPSB0YXJnZXQucHJpbnRTY2FsZSE7XG5cdFx0d3JpdGVJbnQxNih3cml0ZXIsIE1hdGgubWF4KDAsIHByaW50U2NhbGVTdHlsZXMuaW5kZXhPZihzdHlsZSEpKSk7XG5cdFx0d3JpdGVGbG9hdDMyKHdyaXRlciwgeCB8fCAwKTtcblx0XHR3cml0ZUZsb2F0MzIod3JpdGVyLCB5IHx8IDApO1xuXHRcdHdyaXRlRmxvYXQzMih3cml0ZXIsIHNjYWxlIHx8IDApO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTAwNixcblx0dGFyZ2V0ID0+IHRhcmdldC5hbHBoYUNoYW5uZWxOYW1lcyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHR0YXJnZXQuYWxwaGFDaGFubmVsTmFtZXMgPSBbXTtcblxuXHRcdHdoaWxlIChsZWZ0KCkpIHtcblx0XHRcdGNvbnN0IHZhbHVlID0gcmVhZFBhc2NhbFN0cmluZyhyZWFkZXIsIDEpO1xuXHRcdFx0dGFyZ2V0LmFscGhhQ2hhbm5lbE5hbWVzLnB1c2godmFsdWUpO1xuXHRcdH1cblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Zm9yIChjb25zdCBuYW1lIG9mIHRhcmdldC5hbHBoYUNoYW5uZWxOYW1lcyEpIHtcblx0XHRcdHdyaXRlUGFzY2FsU3RyaW5nKHdyaXRlciwgbmFtZSwgMSk7XG5cdFx0fVxuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTA0NSxcblx0dGFyZ2V0ID0+IHRhcmdldC5hbHBoYUNoYW5uZWxOYW1lcyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHR0YXJnZXQuYWxwaGFDaGFubmVsTmFtZXMgPSBbXTtcblxuXHRcdHdoaWxlIChsZWZ0KCkpIHtcblx0XHRcdHRhcmdldC5hbHBoYUNoYW5uZWxOYW1lcy5wdXNoKHJlYWRVbmljb2RlU3RyaW5nKHJlYWRlcikpO1xuXHRcdH1cblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Zm9yIChjb25zdCBuYW1lIG9mIHRhcmdldC5hbHBoYUNoYW5uZWxOYW1lcyEpIHtcblx0XHRcdHdyaXRlVW5pY29kZVN0cmluZ1dpdGhQYWRkaW5nKHdyaXRlciwgbmFtZSk7XG5cdFx0fVxuXHR9LFxuKTtcblxuTU9DS19IQU5ETEVSUyAmJiBhZGRIYW5kbGVyKFxuXHQxMDc3LFxuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9pcjEwNzcgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0TE9HX01PQ0tfSEFORExFUlMgJiYgY29uc29sZS5sb2coJ2ltYWdlIHJlc291cmNlIDEwNzcnLCBsZWZ0KCkpO1xuXHRcdCh0YXJnZXQgYXMgYW55KS5faXIxMDc3ID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsICh0YXJnZXQgYXMgYW55KS5faXIxMDc3KTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdDEwNTMsXG5cdHRhcmdldCA9PiB0YXJnZXQuYWxwaGFJZGVudGlmaWVycyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHR0YXJnZXQuYWxwaGFJZGVudGlmaWVycyA9IFtdO1xuXG5cdFx0d2hpbGUgKGxlZnQoKSA+PSA0KSB7XG5cdFx0XHR0YXJnZXQuYWxwaGFJZGVudGlmaWVycy5wdXNoKHJlYWRVaW50MzIocmVhZGVyKSk7XG5cdFx0fVxuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRmb3IgKGNvbnN0IGlkIG9mIHRhcmdldC5hbHBoYUlkZW50aWZpZXJzISkge1xuXHRcdFx0d3JpdGVVaW50MzIod3JpdGVyLCBpZCk7XG5cdFx0fVxuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTAxMCxcblx0dGFyZ2V0ID0+IHRhcmdldC5iYWNrZ3JvdW5kQ29sb3IgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB0YXJnZXQuYmFja2dyb3VuZENvbG9yID0gcmVhZENvbG9yKHJlYWRlciksXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4gd3JpdGVDb2xvcih3cml0ZXIsIHRhcmdldC5iYWNrZ3JvdW5kQ29sb3IhKSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdDEwMzcsXG5cdHRhcmdldCA9PiB0YXJnZXQuZ2xvYmFsQW5nbGUgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB0YXJnZXQuZ2xvYmFsQW5nbGUgPSByZWFkVWludDMyKHJlYWRlciksXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4gd3JpdGVVaW50MzIod3JpdGVyLCB0YXJnZXQuZ2xvYmFsQW5nbGUhKSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdDEwNDksXG5cdHRhcmdldCA9PiB0YXJnZXQuZ2xvYmFsQWx0aXR1ZGUgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB0YXJnZXQuZ2xvYmFsQWx0aXR1ZGUgPSByZWFkVWludDMyKHJlYWRlciksXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4gd3JpdGVVaW50MzIod3JpdGVyLCB0YXJnZXQuZ2xvYmFsQWx0aXR1ZGUhKSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdDEwMTEsXG5cdHRhcmdldCA9PiB0YXJnZXQucHJpbnRGbGFncyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHtcblx0XHR0YXJnZXQucHJpbnRGbGFncyA9IHtcblx0XHRcdGxhYmVsczogISFyZWFkVWludDgocmVhZGVyKSxcblx0XHRcdGNyb3BNYXJrczogISFyZWFkVWludDgocmVhZGVyKSxcblx0XHRcdGNvbG9yQmFyczogISFyZWFkVWludDgocmVhZGVyKSxcblx0XHRcdHJlZ2lzdHJhdGlvbk1hcmtzOiAhIXJlYWRVaW50OChyZWFkZXIpLFxuXHRcdFx0bmVnYXRpdmU6ICEhcmVhZFVpbnQ4KHJlYWRlciksXG5cdFx0XHRmbGlwOiAhIXJlYWRVaW50OChyZWFkZXIpLFxuXHRcdFx0aW50ZXJwb2xhdGU6ICEhcmVhZFVpbnQ4KHJlYWRlciksXG5cdFx0XHRjYXB0aW9uOiAhIXJlYWRVaW50OChyZWFkZXIpLFxuXHRcdFx0cHJpbnRGbGFnczogISFyZWFkVWludDgocmVhZGVyKSxcblx0XHR9O1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBmbGFncyA9IHRhcmdldC5wcmludEZsYWdzITtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgZmxhZ3MubGFiZWxzID8gMSA6IDApO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBmbGFncy5jcm9wTWFya3MgPyAxIDogMCk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGZsYWdzLmNvbG9yQmFycyA/IDEgOiAwKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgZmxhZ3MucmVnaXN0cmF0aW9uTWFya3MgPyAxIDogMCk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGZsYWdzLm5lZ2F0aXZlID8gMSA6IDApO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBmbGFncy5mbGlwID8gMSA6IDApO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBmbGFncy5pbnRlcnBvbGF0ZSA/IDEgOiAwKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgZmxhZ3MuY2FwdGlvbiA/IDEgOiAwKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgZmxhZ3MucHJpbnRGbGFncyA/IDEgOiAwKTtcblx0fSxcbik7XG5cbk1PQ0tfSEFORExFUlMgJiYgYWRkSGFuZGxlcihcblx0MTAwMDAsIC8vIFByaW50IGZsYWdzXG5cdHRhcmdldCA9PiAodGFyZ2V0IGFzIGFueSkuX2lyMTAwMDAgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0TE9HX01PQ0tfSEFORExFUlMgJiYgY29uc29sZS5sb2coJ2ltYWdlIHJlc291cmNlIDEwMDAwJywgbGVmdCgpKTtcblx0XHQodGFyZ2V0IGFzIGFueSkuX2lyMTAwMDAgPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgKHRhcmdldCBhcyBhbnkpLl9pcjEwMDAwKTtcblx0fSxcbik7XG5cbk1PQ0tfSEFORExFUlMgJiYgYWRkSGFuZGxlcihcblx0MTAxMywgLy8gQ29sb3IgaGFsZnRvbmluZ1xuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9pcjEwMTMgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0TE9HX01PQ0tfSEFORExFUlMgJiYgY29uc29sZS5sb2coJ2ltYWdlIHJlc291cmNlIDEwMTMnLCBsZWZ0KCkpO1xuXHRcdCh0YXJnZXQgYXMgYW55KS5faXIxMDEzID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsICh0YXJnZXQgYXMgYW55KS5faXIxMDEzKTtcblx0fSxcbik7XG5cbk1PQ0tfSEFORExFUlMgJiYgYWRkSGFuZGxlcihcblx0MTAxNiwgLy8gQ29sb3IgdHJhbnNmZXIgZnVuY3Rpb25zXG5cdHRhcmdldCA9PiAodGFyZ2V0IGFzIGFueSkuX2lyMTAxNiAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRMT0dfTU9DS19IQU5ETEVSUyAmJiBjb25zb2xlLmxvZygnaW1hZ2UgcmVzb3VyY2UgMTAxNicsIGxlZnQoKSk7XG5cdFx0KHRhcmdldCBhcyBhbnkpLl9pcjEwMTYgPSByZWFkQnl0ZXMocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgKHRhcmdldCBhcyBhbnkpLl9pcjEwMTYpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTAyNCxcblx0dGFyZ2V0ID0+IHRhcmdldC5sYXllclN0YXRlICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4gdGFyZ2V0LmxheWVyU3RhdGUgPSByZWFkVWludDE2KHJlYWRlciksXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4gd3JpdGVVaW50MTYod3JpdGVyLCB0YXJnZXQubGF5ZXJTdGF0ZSEpLFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTAyNixcblx0dGFyZ2V0ID0+IHRhcmdldC5sYXllcnNHcm91cCAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHR0YXJnZXQubGF5ZXJzR3JvdXAgPSBbXTtcblxuXHRcdHdoaWxlIChsZWZ0KCkpIHtcblx0XHRcdHRhcmdldC5sYXllcnNHcm91cC5wdXNoKHJlYWRVaW50MTYocmVhZGVyKSk7XG5cdFx0fVxuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRmb3IgKGNvbnN0IGcgb2YgdGFyZ2V0LmxheWVyc0dyb3VwISkge1xuXHRcdFx0d3JpdGVVaW50MTYod3JpdGVyLCBnKTtcblx0XHR9XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDcyLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmxheWVyR3JvdXBzRW5hYmxlZElkICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdHRhcmdldC5sYXllckdyb3Vwc0VuYWJsZWRJZCA9IFtdO1xuXG5cdFx0d2hpbGUgKGxlZnQoKSkge1xuXHRcdFx0dGFyZ2V0LmxheWVyR3JvdXBzRW5hYmxlZElkLnB1c2gocmVhZFVpbnQ4KHJlYWRlcikpO1xuXHRcdH1cblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Zm9yIChjb25zdCBpZCBvZiB0YXJnZXQubGF5ZXJHcm91cHNFbmFibGVkSWQhKSB7XG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgaWQpO1xuXHRcdH1cblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdDEwNjksXG5cdHRhcmdldCA9PiB0YXJnZXQubGF5ZXJTZWxlY3Rpb25JZHMgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0bGV0IGNvdW50ID0gcmVhZFVpbnQxNihyZWFkZXIpO1xuXHRcdHRhcmdldC5sYXllclNlbGVjdGlvbklkcyA9IFtdO1xuXG5cdFx0d2hpbGUgKGNvdW50LS0pIHtcblx0XHRcdHRhcmdldC5sYXllclNlbGVjdGlvbklkcy5wdXNoKHJlYWRVaW50MzIocmVhZGVyKSk7XG5cdFx0fVxuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIHRhcmdldC5sYXllclNlbGVjdGlvbklkcyEubGVuZ3RoKTtcblxuXHRcdGZvciAoY29uc3QgaWQgb2YgdGFyZ2V0LmxheWVyU2VsZWN0aW9uSWRzISkge1xuXHRcdFx0d3JpdGVVaW50MzIod3JpdGVyLCBpZCk7XG5cdFx0fVxuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTAzMixcblx0dGFyZ2V0ID0+IHRhcmdldC5ncmlkQW5kR3VpZGVzSW5mb3JtYXRpb24gIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3QgdmVyc2lvbiA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRjb25zdCBob3Jpem9udGFsID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdGNvbnN0IHZlcnRpY2FsID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdGNvbnN0IGNvdW50ID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXG5cdFx0aWYgKHZlcnNpb24gIT09IDEpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCAxMDMyIHJlc291cmNlIHZlcnNpb246ICR7dmVyc2lvbn1gKTtcblxuXHRcdHRhcmdldC5ncmlkQW5kR3VpZGVzSW5mb3JtYXRpb24gPSB7XG5cdFx0XHRncmlkOiB7IGhvcml6b250YWwsIHZlcnRpY2FsIH0sXG5cdFx0XHRndWlkZXM6IFtdLFxuXHRcdH07XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcblx0XHRcdHRhcmdldC5ncmlkQW5kR3VpZGVzSW5mb3JtYXRpb24uZ3VpZGVzIS5wdXNoKHtcblx0XHRcdFx0bG9jYXRpb246IHJlYWRVaW50MzIocmVhZGVyKSAvIDMyLFxuXHRcdFx0XHRkaXJlY3Rpb246IHJlYWRVaW50OChyZWFkZXIpID8gJ2hvcml6b250YWwnIDogJ3ZlcnRpY2FsJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBpbmZvID0gdGFyZ2V0LmdyaWRBbmRHdWlkZXNJbmZvcm1hdGlvbiE7XG5cdFx0Y29uc3QgZ3JpZCA9IGluZm8uZ3JpZCB8fCB7IGhvcml6b250YWw6IDE4ICogMzIsIHZlcnRpY2FsOiAxOCAqIDMyIH07XG5cdFx0Y29uc3QgZ3VpZGVzID0gaW5mby5ndWlkZXMgfHwgW107XG5cblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDEpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgZ3JpZC5ob3Jpem9udGFsKTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIGdyaWQudmVydGljYWwpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgZ3VpZGVzLmxlbmd0aCk7XG5cblx0XHRmb3IgKGNvbnN0IGcgb2YgZ3VpZGVzKSB7XG5cdFx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIGcubG9jYXRpb24gKiAzMik7XG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgZy5kaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJyA/IDEgOiAwKTtcblx0XHR9XG5cdH0sXG4pO1xuXG5pbnRlcmZhY2UgT25pb25Ta2luc0Rlc2NyaXB0b3Ige1xuXHRWcnNuOiAxO1xuXHRlbmFiOiBib29sZWFuO1xuXHRudW1CZWZvcmU6IG51bWJlcjtcblx0bnVtQWZ0ZXI6IG51bWJlcjtcblx0U3BjbjogbnVtYmVyO1xuXHRtaW5PcGFjaXR5OiBudW1iZXI7XG5cdG1heE9wYWNpdHk6IG51bWJlcjtcblx0QmxuTTogbnVtYmVyO1xufVxuXG4vLyAwIC0gbm9ybWFsLCA3IC0gbXVsdGlwbHksIDggLSBzY3JlZW4sIDIzIC0gZGlmZmVyZW5jZVxuY29uc3Qgb25pb25Ta2luc0JsZW5kTW9kZXM6IChCbGVuZE1vZGUgfCB1bmRlZmluZWQpW10gPSBbXG5cdCdub3JtYWwnLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCAnbXVsdGlwbHknLFxuXHQnc2NyZWVuJywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxuXHR1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsICdkaWZmZXJlbmNlJyxcbl07XG5cbmFkZEhhbmRsZXIoXG5cdDEwNzgsIC8vIE9uaW9uIFNraW5zXG5cdHRhcmdldCA9PiB0YXJnZXQub25pb25Ta2lucyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBkZXNjID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcikgYXMgT25pb25Ta2luc0Rlc2NyaXB0b3I7XG5cdFx0Ly8gY29uc29sZS5sb2coJzEwNzgnLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblxuXHRcdHRhcmdldC5vbmlvblNraW5zID0ge1xuXHRcdFx0ZW5hYmxlZDogZGVzYy5lbmFiLFxuXHRcdFx0ZnJhbWVzQmVmb3JlOiBkZXNjLm51bUJlZm9yZSxcblx0XHRcdGZyYW1lc0FmdGVyOiBkZXNjLm51bUFmdGVyLFxuXHRcdFx0ZnJhbWVTcGFjaW5nOiBkZXNjLlNwY24sXG5cdFx0XHRtaW5PcGFjaXR5OiBkZXNjLm1pbk9wYWNpdHkgLyAxMDAsXG5cdFx0XHRtYXhPcGFjaXR5OiBkZXNjLm1heE9wYWNpdHkgLyAxMDAsXG5cdFx0XHRibGVuZE1vZGU6IG9uaW9uU2tpbnNCbGVuZE1vZGVzW2Rlc2MuQmxuTV0gfHwgJ25vcm1hbCcsXG5cdFx0fTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0Y29uc3Qgb25pb25Ta2lucyA9IHRhcmdldC5vbmlvblNraW5zITtcblx0XHRjb25zdCBkZXNjOiBPbmlvblNraW5zRGVzY3JpcHRvciA9IHtcblx0XHRcdFZyc246IDEsXG5cdFx0XHRlbmFiOiBvbmlvblNraW5zLmVuYWJsZWQsXG5cdFx0XHRudW1CZWZvcmU6IG9uaW9uU2tpbnMuZnJhbWVzQmVmb3JlLFxuXHRcdFx0bnVtQWZ0ZXI6IG9uaW9uU2tpbnMuZnJhbWVzQWZ0ZXIsXG5cdFx0XHRTcGNuOiBvbmlvblNraW5zLmZyYW1lU3BhY2luZyxcblx0XHRcdG1pbk9wYWNpdHk6IChvbmlvblNraW5zLm1pbk9wYWNpdHkgKiAxMDApIHwgMCxcblx0XHRcdG1heE9wYWNpdHk6IChvbmlvblNraW5zLm1heE9wYWNpdHkgKiAxMDApIHwgMCxcblx0XHRcdEJsbk06IE1hdGgubWF4KDAsIG9uaW9uU2tpbnNCbGVuZE1vZGVzLmluZGV4T2Yob25pb25Ta2lucy5ibGVuZE1vZGUpKSxcblx0XHR9O1xuXG5cdFx0d3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXIsICcnLCAnbnVsbCcsIGRlc2MpO1xuXHR9LFxuKTtcblxuaW50ZXJmYWNlIFRpbWVsaW5lQXVkaW9DbGlwRGVzY3JpcHRvciB7XG5cdGNsaXBJRDogc3RyaW5nO1xuXHR0aW1lU2NvcGU6IFRpbWVTY29wZURlc2NyaXB0b3I7XG5cdGZyYW1lUmVhZGVyOiB7XG5cdFx0ZnJhbWVSZWFkZXJUeXBlOiBudW1iZXI7XG5cdFx0ZGVzY1ZlcnNpb246IDE7XG5cdFx0J0xuayAnOiB7XG5cdFx0XHRkZXNjVmVyc2lvbjogMTtcblx0XHRcdCdObSAgJzogc3RyaW5nO1xuXHRcdFx0ZnVsbFBhdGg6IHN0cmluZztcblx0XHRcdHJlbFBhdGg6IHN0cmluZztcblx0XHR9LFxuXHRcdG1lZGlhRGVzY3JpcHRvcjogc3RyaW5nO1xuXHR9LFxuXHRtdXRlZDogYm9vbGVhbjtcblx0YXVkaW9MZXZlbDogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgVGltZWxpbmVBdWRpb0NsaXBHcm91cERlc2NyaXB0b3Ige1xuXHRncm91cElEOiBzdHJpbmc7XG5cdG11dGVkOiBib29sZWFuO1xuXHRhdWRpb0NsaXBMaXN0OiBUaW1lbGluZUF1ZGlvQ2xpcERlc2NyaXB0b3JbXTtcbn1cblxuaW50ZXJmYWNlIFRpbWVsaW5lSW5mb3JtYXRpb25EZXNjcmlwdG9yIHtcblx0VnJzbjogMTtcblx0ZW5hYjogYm9vbGVhbjtcblx0ZnJhbWVTdGVwOiBGcmFjdGlvbkRlc2NyaXB0b3I7XG5cdGZyYW1lUmF0ZTogbnVtYmVyO1xuXHR0aW1lOiBGcmFjdGlvbkRlc2NyaXB0b3I7XG5cdGR1cmF0aW9uOiBGcmFjdGlvbkRlc2NyaXB0b3I7XG5cdHdvcmtJblRpbWU6IEZyYWN0aW9uRGVzY3JpcHRvcjtcblx0d29ya091dFRpbWU6IEZyYWN0aW9uRGVzY3JpcHRvcjtcblx0TENudDogbnVtYmVyO1xuXHRnbG9iYWxUcmFja0xpc3Q6IFRpbWVsaW5lVHJhY2tEZXNjcmlwdG9yW107XG5cdGF1ZGlvQ2xpcEdyb3VwTGlzdD86IHtcblx0XHRhdWRpb0NsaXBHcm91cExpc3Q/OiBUaW1lbGluZUF1ZGlvQ2xpcEdyb3VwRGVzY3JpcHRvcltdO1xuXHR9LFxuXHRoYXNNb3Rpb246IGJvb2xlYW47XG59XG5cbmFkZEhhbmRsZXIoXG5cdDEwNzUsIC8vIFRpbWVsaW5lIEluZm9ybWF0aW9uXG5cdHRhcmdldCA9PiB0YXJnZXQudGltZWxpbmVJbmZvcm1hdGlvbiAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIF8sIG9wdGlvbnMpID0+IHtcblx0XHRjb25zdCBkZXNjID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcikgYXMgVGltZWxpbmVJbmZvcm1hdGlvbkRlc2NyaXB0b3I7XG5cdFx0Ly8gY29uc29sZS5sb2coJzEwNzUnLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblxuXHRcdHRhcmdldC50aW1lbGluZUluZm9ybWF0aW9uID0ge1xuXHRcdFx0ZW5hYmxlZDogZGVzYy5lbmFiLFxuXHRcdFx0ZnJhbWVTdGVwOiBkZXNjLmZyYW1lU3RlcCxcblx0XHRcdGZyYW1lUmF0ZTogZGVzYy5mcmFtZVJhdGUsXG5cdFx0XHR0aW1lOiBkZXNjLnRpbWUsXG5cdFx0XHRkdXJhdGlvbjogZGVzYy5kdXJhdGlvbixcblx0XHRcdHdvcmtJblRpbWU6IGRlc2Mud29ya0luVGltZSxcblx0XHRcdHdvcmtPdXRUaW1lOiBkZXNjLndvcmtPdXRUaW1lLFxuXHRcdFx0cmVwZWF0czogZGVzYy5MQ250LFxuXHRcdFx0aGFzTW90aW9uOiBkZXNjLmhhc01vdGlvbixcblx0XHRcdGdsb2JhbFRyYWNrczogcGFyc2VUcmFja0xpc3QoZGVzYy5nbG9iYWxUcmFja0xpc3QsICEhb3B0aW9ucy5sb2dNaXNzaW5nRmVhdHVyZXMpLFxuXHRcdH07XG5cblx0XHRpZiAoZGVzYy5hdWRpb0NsaXBHcm91cExpc3Q/LmF1ZGlvQ2xpcEdyb3VwTGlzdD8ubGVuZ3RoKSB7XG5cdFx0XHR0YXJnZXQudGltZWxpbmVJbmZvcm1hdGlvbi5hdWRpb0NsaXBHcm91cHMgPSBkZXNjLmF1ZGlvQ2xpcEdyb3VwTGlzdC5hdWRpb0NsaXBHcm91cExpc3QubWFwKGcgPT4gKHtcblx0XHRcdFx0aWQ6IGcuZ3JvdXBJRCxcblx0XHRcdFx0bXV0ZWQ6IGcubXV0ZWQsXG5cdFx0XHRcdGF1ZGlvQ2xpcHM6IGcuYXVkaW9DbGlwTGlzdC5tYXAoKHsgY2xpcElELCB0aW1lU2NvcGUsIG11dGVkLCBhdWRpb0xldmVsLCBmcmFtZVJlYWRlciB9KSA9PiAoe1xuXHRcdFx0XHRcdGlkOiBjbGlwSUQsXG5cdFx0XHRcdFx0c3RhcnQ6IHRpbWVTY29wZS5TdHJ0LFxuXHRcdFx0XHRcdGR1cmF0aW9uOiB0aW1lU2NvcGUuZHVyYXRpb24sXG5cdFx0XHRcdFx0aW5UaW1lOiB0aW1lU2NvcGUuaW5UaW1lLFxuXHRcdFx0XHRcdG91dFRpbWU6IHRpbWVTY29wZS5vdXRUaW1lLFxuXHRcdFx0XHRcdG11dGVkOiBtdXRlZCxcblx0XHRcdFx0XHRhdWRpb0xldmVsOiBhdWRpb0xldmVsLFxuXHRcdFx0XHRcdGZyYW1lUmVhZGVyOiB7XG5cdFx0XHRcdFx0XHR0eXBlOiBmcmFtZVJlYWRlci5mcmFtZVJlYWRlclR5cGUsXG5cdFx0XHRcdFx0XHRtZWRpYURlc2NyaXB0b3I6IGZyYW1lUmVhZGVyLm1lZGlhRGVzY3JpcHRvcixcblx0XHRcdFx0XHRcdGxpbms6IHtcblx0XHRcdFx0XHRcdFx0bmFtZTogZnJhbWVSZWFkZXJbJ0xuayAnXVsnTm0gICddLFxuXHRcdFx0XHRcdFx0XHRmdWxsUGF0aDogZnJhbWVSZWFkZXJbJ0xuayAnXS5mdWxsUGF0aCxcblx0XHRcdFx0XHRcdFx0cmVsYXRpdmVQYXRoOiBmcmFtZVJlYWRlclsnTG5rICddLnJlbFBhdGgsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pKSxcblx0XHRcdH0pKTtcblx0XHR9XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IHRpbWVsaW5lID0gdGFyZ2V0LnRpbWVsaW5lSW5mb3JtYXRpb24hO1xuXHRcdGNvbnN0IGRlc2M6IFRpbWVsaW5lSW5mb3JtYXRpb25EZXNjcmlwdG9yID0ge1xuXHRcdFx0VnJzbjogMSxcblx0XHRcdGVuYWI6IHRpbWVsaW5lLmVuYWJsZWQsXG5cdFx0XHRmcmFtZVN0ZXA6IHRpbWVsaW5lLmZyYW1lU3RlcCxcblx0XHRcdGZyYW1lUmF0ZTogdGltZWxpbmUuZnJhbWVSYXRlLFxuXHRcdFx0dGltZTogdGltZWxpbmUudGltZSxcblx0XHRcdGR1cmF0aW9uOiB0aW1lbGluZS5kdXJhdGlvbixcblx0XHRcdHdvcmtJblRpbWU6IHRpbWVsaW5lLndvcmtJblRpbWUsXG5cdFx0XHR3b3JrT3V0VGltZTogdGltZWxpbmUud29ya091dFRpbWUsXG5cdFx0XHRMQ250OiB0aW1lbGluZS5yZXBlYXRzLFxuXHRcdFx0Z2xvYmFsVHJhY2tMaXN0OiBzZXJpYWxpemVUcmFja0xpc3QodGltZWxpbmUuZ2xvYmFsVHJhY2tzKSxcblx0XHRcdGF1ZGlvQ2xpcEdyb3VwTGlzdDoge1xuXHRcdFx0XHRhdWRpb0NsaXBHcm91cExpc3Q6IHRpbWVsaW5lLmF1ZGlvQ2xpcEdyb3Vwcz8ubWFwKGEgPT4gKHtcblx0XHRcdFx0XHRncm91cElEOiBhLmlkLFxuXHRcdFx0XHRcdG11dGVkOiBhLm11dGVkLFxuXHRcdFx0XHRcdGF1ZGlvQ2xpcExpc3Q6IGEuYXVkaW9DbGlwcy5tYXA8VGltZWxpbmVBdWRpb0NsaXBEZXNjcmlwdG9yPihjID0+ICh7XG5cdFx0XHRcdFx0XHRjbGlwSUQ6IGMuaWQsXG5cdFx0XHRcdFx0XHR0aW1lU2NvcGU6IHtcblx0XHRcdFx0XHRcdFx0VnJzbjogMSxcblx0XHRcdFx0XHRcdFx0U3RydDogYy5zdGFydCxcblx0XHRcdFx0XHRcdFx0ZHVyYXRpb246IGMuZHVyYXRpb24sXG5cdFx0XHRcdFx0XHRcdGluVGltZTogYy5pblRpbWUsXG5cdFx0XHRcdFx0XHRcdG91dFRpbWU6IGMub3V0VGltZSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRmcmFtZVJlYWRlcjoge1xuXHRcdFx0XHRcdFx0XHRmcmFtZVJlYWRlclR5cGU6IGMuZnJhbWVSZWFkZXIudHlwZSxcblx0XHRcdFx0XHRcdFx0ZGVzY1ZlcnNpb246IDEsXG5cdFx0XHRcdFx0XHRcdCdMbmsgJzoge1xuXHRcdFx0XHRcdFx0XHRcdGRlc2NWZXJzaW9uOiAxLFxuXHRcdFx0XHRcdFx0XHRcdCdObSAgJzogYy5mcmFtZVJlYWRlci5saW5rLm5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0ZnVsbFBhdGg6IGMuZnJhbWVSZWFkZXIubGluay5mdWxsUGF0aCxcblx0XHRcdFx0XHRcdFx0XHRyZWxQYXRoOiBjLmZyYW1lUmVhZGVyLmxpbmsucmVsYXRpdmVQYXRoLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRtZWRpYURlc2NyaXB0b3I6IGMuZnJhbWVSZWFkZXIubWVkaWFEZXNjcmlwdG9yLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG11dGVkOiBjLm11dGVkLFxuXHRcdFx0XHRcdFx0YXVkaW9MZXZlbDogYy5hdWRpb0xldmVsLFxuXHRcdFx0XHRcdH0pKSxcblx0XHRcdFx0fSkpLFxuXHRcdFx0fSxcblx0XHRcdGhhc01vdGlvbjogdGltZWxpbmUuaGFzTW90aW9uLFxuXHRcdH07XG5cblx0XHQvLyBjb25zb2xlLmxvZygnV1JJVEU6MTA3NScsIHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KGRlc2MsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCBkZXNjLCAnYW5pbScpO1xuXHR9LFxuKTtcblxuaW50ZXJmYWNlIFNoZWV0RGlzY2xvc3VyZURlc2NyaXB0b3Ige1xuXHRWcnNuOiAxO1xuXHRzaGVldFRpbWVsaW5lT3B0aW9ucz86IHtcblx0XHRWcnNuOiAyO1xuXHRcdHNoZWV0SUQ6IG51bWJlcjtcblx0XHRzaGVldERpc2Nsb3NlZDogYm9vbGVhbjtcblx0XHRsaWdodHNEaXNjbG9zZWQ6IGJvb2xlYW47XG5cdFx0bWVzaGVzRGlzY2xvc2VkOiBib29sZWFuO1xuXHRcdG1hdGVyaWFsc0Rpc2Nsb3NlZDogYm9vbGVhbjtcblx0fVtdO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQxMDc2LCAvLyBTaGVldCBEaXNjbG9zdXJlXG5cdHRhcmdldCA9PiB0YXJnZXQuc2hlZXREaXNjbG9zdXJlICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGRlc2MgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKSBhcyBTaGVldERpc2Nsb3N1cmVEZXNjcmlwdG9yO1xuXHRcdC8vIGNvbnNvbGUubG9nKCcxMDc2JywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYywgZmFsc2UsIDk5LCB0cnVlKSk7XG5cblx0XHR0YXJnZXQuc2hlZXREaXNjbG9zdXJlID0ge307XG5cblx0XHRpZiAoZGVzYy5zaGVldFRpbWVsaW5lT3B0aW9ucykge1xuXHRcdFx0dGFyZ2V0LnNoZWV0RGlzY2xvc3VyZS5zaGVldFRpbWVsaW5lT3B0aW9ucyA9IGRlc2Muc2hlZXRUaW1lbGluZU9wdGlvbnMubWFwKG8gPT4gKHtcblx0XHRcdFx0c2hlZXRJRDogby5zaGVldElELFxuXHRcdFx0XHRzaGVldERpc2Nsb3NlZDogby5zaGVldERpc2Nsb3NlZCxcblx0XHRcdFx0bGlnaHRzRGlzY2xvc2VkOiBvLmxpZ2h0c0Rpc2Nsb3NlZCxcblx0XHRcdFx0bWVzaGVzRGlzY2xvc2VkOiBvLm1lc2hlc0Rpc2Nsb3NlZCxcblx0XHRcdFx0bWF0ZXJpYWxzRGlzY2xvc2VkOiBvLm1hdGVyaWFsc0Rpc2Nsb3NlZCxcblx0XHRcdH0pKTtcblx0XHR9XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IGRpc2Nsb3N1cmUgPSB0YXJnZXQuc2hlZXREaXNjbG9zdXJlITtcblx0XHRjb25zdCBkZXNjOiBTaGVldERpc2Nsb3N1cmVEZXNjcmlwdG9yID0geyBWcnNuOiAxIH07XG5cblx0XHRpZiAoZGlzY2xvc3VyZS5zaGVldFRpbWVsaW5lT3B0aW9ucykge1xuXHRcdFx0ZGVzYy5zaGVldFRpbWVsaW5lT3B0aW9ucyA9IGRpc2Nsb3N1cmUuc2hlZXRUaW1lbGluZU9wdGlvbnMubWFwKGQgPT4gKHtcblx0XHRcdFx0VnJzbjogMixcblx0XHRcdFx0c2hlZXRJRDogZC5zaGVldElELFxuXHRcdFx0XHRzaGVldERpc2Nsb3NlZDogZC5zaGVldERpc2Nsb3NlZCxcblx0XHRcdFx0bGlnaHRzRGlzY2xvc2VkOiBkLmxpZ2h0c0Rpc2Nsb3NlZCxcblx0XHRcdFx0bWVzaGVzRGlzY2xvc2VkOiBkLm1lc2hlc0Rpc2Nsb3NlZCxcblx0XHRcdFx0bWF0ZXJpYWxzRGlzY2xvc2VkOiBkLm1hdGVyaWFsc0Rpc2Nsb3NlZCxcblx0XHRcdH0pKTtcblx0XHR9XG5cblx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdudWxsJywgZGVzYyk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQxMDU0LFxuXHR0YXJnZXQgPT4gdGFyZ2V0LnVybHNMaXN0ICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgXywgb3B0aW9ucykgPT4ge1xuXHRcdGNvbnN0IGNvdW50ID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXG5cdFx0aWYgKGNvdW50KSB7XG5cdFx0XHRpZiAoIW9wdGlvbnMudGhyb3dGb3JNaXNzaW5nRmVhdHVyZXMpIHJldHVybjtcblx0XHRcdHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkOiBVUkwgTGlzdCcpO1xuXHRcdH1cblxuXHRcdC8vIFRPRE86IHJlYWQgYWN0dWFsIFVSTCBsaXN0XG5cdFx0dGFyZ2V0LnVybHNMaXN0ID0gW107XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgdGFyZ2V0LnVybHNMaXN0IS5sZW5ndGgpO1xuXG5cdFx0Ly8gVE9ETzogd3JpdGUgYWN0dWFsIFVSTCBsaXN0XG5cdFx0aWYgKHRhcmdldC51cmxzTGlzdCEubGVuZ3RoKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZDogVVJMIExpc3QnKTtcblx0XHR9XG5cdH0sXG4pO1xuXG5NT0NLX0hBTkRMRVJTICYmIGFkZEhhbmRsZXIoXG5cdDEwNTAsIC8vIFNsaWNlc1xuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9pcjEwNTAgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0TE9HX01PQ0tfSEFORExFUlMgJiYgY29uc29sZS5sb2coJ2ltYWdlIHJlc291cmNlIDEwNTAnLCBsZWZ0KCkpO1xuXHRcdCh0YXJnZXQgYXMgYW55KS5faXIxMDUwID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsICh0YXJnZXQgYXMgYW55KS5faXIxMDUwKTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdDEwNjQsXG5cdHRhcmdldCA9PiB0YXJnZXQucGl4ZWxBc3BlY3RSYXRpbyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHtcblx0XHRpZiAocmVhZFVpbnQzMihyZWFkZXIpID4gMikgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBpeGVsQXNwZWN0UmF0aW8gdmVyc2lvbicpO1xuXHRcdHRhcmdldC5waXhlbEFzcGVjdFJhdGlvID0geyBhc3BlY3Q6IHJlYWRGbG9hdDY0KHJlYWRlcikgfTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCAyKTsgLy8gdmVyc2lvblxuXHRcdHdyaXRlRmxvYXQ2NCh3cml0ZXIsIHRhcmdldC5waXhlbEFzcGVjdFJhdGlvIS5hc3BlY3QpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTA0MSxcblx0dGFyZ2V0ID0+IHRhcmdldC5pY2NVbnRhZ2dlZFByb2ZpbGUgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0dGFyZ2V0LmljY1VudGFnZ2VkUHJvZmlsZSA9ICEhcmVhZFVpbnQ4KHJlYWRlcik7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCB0YXJnZXQuaWNjVW50YWdnZWRQcm9maWxlID8gMSA6IDApO1xuXHR9LFxuKTtcblxuTU9DS19IQU5ETEVSUyAmJiBhZGRIYW5kbGVyKFxuXHQxMDM5LCAvLyBJQ0MgUHJvZmlsZVxuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9pcjEwMzkgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0TE9HX01PQ0tfSEFORExFUlMgJiYgY29uc29sZS5sb2coJ2ltYWdlIHJlc291cmNlIDEwMzknLCBsZWZ0KCkpO1xuXHRcdCh0YXJnZXQgYXMgYW55KS5faXIxMDM5ID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0fSxcblx0KHdyaXRlciwgdGFyZ2V0KSA9PiB7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsICh0YXJnZXQgYXMgYW55KS5faXIxMDM5KTtcblx0fSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdDEwNDQsXG5cdHRhcmdldCA9PiB0YXJnZXQuaWRzU2VlZE51bWJlciAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQpID0+IHRhcmdldC5pZHNTZWVkTnVtYmVyID0gcmVhZFVpbnQzMihyZWFkZXIpLFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHdyaXRlVWludDMyKHdyaXRlciwgdGFyZ2V0Lmlkc1NlZWROdW1iZXIhKSxcbik7XG5cbmFkZEhhbmRsZXIoXG5cdDEwMzYsXG5cdHRhcmdldCA9PiB0YXJnZXQudGh1bWJuYWlsICE9PSB1bmRlZmluZWQgfHwgdGFyZ2V0LnRodW1ibmFpbFJhdyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQsIG9wdGlvbnMpID0+IHtcblx0XHRjb25zdCBmb3JtYXQgPSByZWFkVWludDMyKHJlYWRlcik7IC8vIDEgPSBrSnBlZ1JHQiwgMCA9IGtSYXdSR0Jcblx0XHRjb25zdCB3aWR0aCA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRjb25zdCBoZWlnaHQgPSByZWFkVWludDMyKHJlYWRlcik7XG5cdFx0cmVhZFVpbnQzMihyZWFkZXIpOyAvLyB3aWR0aEJ5dGVzID0gKHdpZHRoICogYml0c19wZXJfcGl4ZWwgKyAzMSkgLyAzMiAqIDQuXG5cdFx0cmVhZFVpbnQzMihyZWFkZXIpOyAvLyB0b3RhbFNpemUgPSB3aWR0aEJ5dGVzICogaGVpZ2h0ICogcGxhbmVzXG5cdFx0cmVhZFVpbnQzMihyZWFkZXIpOyAvLyBzaXplQWZ0ZXJDb21wcmVzc2lvblxuXHRcdGNvbnN0IGJpdHNQZXJQaXhlbCA9IHJlYWRVaW50MTYocmVhZGVyKTsgLy8gMjRcblx0XHRjb25zdCBwbGFuZXMgPSByZWFkVWludDE2KHJlYWRlcik7IC8vIDFcblxuXHRcdGlmIChmb3JtYXQgIT09IDEgfHwgYml0c1BlclBpeGVsICE9PSAyNCB8fCBwbGFuZXMgIT09IDEpIHtcblx0XHRcdG9wdGlvbnMubG9nTWlzc2luZ0ZlYXR1cmVzICYmIGNvbnNvbGUubG9nKGBJbnZhbGlkIHRodW1ibmFpbCBkYXRhIChmb3JtYXQ6ICR7Zm9ybWF0fSwgYml0c1BlclBpeGVsOiAke2JpdHNQZXJQaXhlbH0sIHBsYW5lczogJHtwbGFuZXN9KWApO1xuXHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBzaXplID0gbGVmdCgpO1xuXHRcdGNvbnN0IGRhdGEgPSByZWFkQnl0ZXMocmVhZGVyLCBzaXplKTtcblxuXHRcdGlmIChvcHRpb25zLnVzZVJhd1RodW1ibmFpbCkge1xuXHRcdFx0dGFyZ2V0LnRodW1ibmFpbFJhdyA9IHsgd2lkdGgsIGhlaWdodCwgZGF0YSB9O1xuXHRcdH0gZWxzZSBpZiAoZGF0YS5ieXRlTGVuZ3RoKSB7XG5cdFx0XHR0YXJnZXQudGh1bWJuYWlsID0gY3JlYXRlQ2FudmFzRnJvbURhdGEoZGF0YSk7XG5cdFx0fVxuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRsZXQgd2lkdGggPSAwO1xuXHRcdGxldCBoZWlnaHQgPSAwO1xuXHRcdGxldCBkYXRhOiBVaW50OEFycmF5O1xuXG5cdFx0aWYgKHRhcmdldC50aHVtYm5haWxSYXcpIHtcblx0XHRcdHdpZHRoID0gdGFyZ2V0LnRodW1ibmFpbFJhdy53aWR0aDtcblx0XHRcdGhlaWdodCA9IHRhcmdldC50aHVtYm5haWxSYXcuaGVpZ2h0O1xuXHRcdFx0ZGF0YSA9IHRhcmdldC50aHVtYm5haWxSYXcuZGF0YTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgZGF0YVVybCA9IHRhcmdldC50aHVtYm5haWwhLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycsIDEpPy5zdWJzdHJpbmcoJ2RhdGE6aW1hZ2UvanBlZztiYXNlNjQsJy5sZW5ndGgpO1xuXG5cdFx0XHRpZiAoZGF0YVVybCkge1xuXHRcdFx0XHR3aWR0aCA9IHRhcmdldC50aHVtYm5haWwhLndpZHRoO1xuXHRcdFx0XHRoZWlnaHQgPSB0YXJnZXQudGh1bWJuYWlsIS5oZWlnaHQ7XG5cdFx0XHRcdGRhdGEgPSB0b0J5dGVBcnJheShkYXRhVXJsKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRhdGEgPSBuZXcgVWludDhBcnJheSgwKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBiaXRzUGVyUGl4ZWwgPSAyNDtcblx0XHRjb25zdCB3aWR0aEJ5dGVzID0gTWF0aC5mbG9vcigod2lkdGggKiBiaXRzUGVyUGl4ZWwgKyAzMSkgLyAzMikgKiA0O1xuXHRcdGNvbnN0IHBsYW5lcyA9IDE7XG5cdFx0Y29uc3QgdG90YWxTaXplID0gd2lkdGhCeXRlcyAqIGhlaWdodCAqIHBsYW5lcztcblx0XHRjb25zdCBzaXplQWZ0ZXJDb21wcmVzc2lvbiA9IGRhdGEubGVuZ3RoO1xuXG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCAxKTsgLy8gMSA9IGtKcGVnUkdCXG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCB3aWR0aCk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCBoZWlnaHQpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgd2lkdGhCeXRlcyk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCB0b3RhbFNpemUpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgc2l6ZUFmdGVyQ29tcHJlc3Npb24pO1xuXHRcdHdyaXRlVWludDE2KHdyaXRlciwgYml0c1BlclBpeGVsKTtcblx0XHR3cml0ZVVpbnQxNih3cml0ZXIsIHBsYW5lcyk7XG5cdFx0d3JpdGVCeXRlcyh3cml0ZXIsIGRhdGEpO1xuXHR9LFxuKTtcblxuYWRkSGFuZGxlcihcblx0MTA1Nyxcblx0dGFyZ2V0ID0+IHRhcmdldC52ZXJzaW9uSW5mbyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHRjb25zdCB2ZXJzaW9uID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdGlmICh2ZXJzaW9uICE9PSAxKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdmVyc2lvbkluZm8gdmVyc2lvbicpO1xuXG5cdFx0dGFyZ2V0LnZlcnNpb25JbmZvID0ge1xuXHRcdFx0aGFzUmVhbE1lcmdlZERhdGE6ICEhcmVhZFVpbnQ4KHJlYWRlciksXG5cdFx0XHR3cml0ZXJOYW1lOiByZWFkVW5pY29kZVN0cmluZyhyZWFkZXIpLFxuXHRcdFx0cmVhZGVyTmFtZTogcmVhZFVuaWNvZGVTdHJpbmcocmVhZGVyKSxcblx0XHRcdGZpbGVWZXJzaW9uOiByZWFkVWludDMyKHJlYWRlciksXG5cdFx0fTtcblxuXHRcdHNraXBCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGNvbnN0IHZlcnNpb25JbmZvID0gdGFyZ2V0LnZlcnNpb25JbmZvITtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDEpOyAvLyB2ZXJzaW9uXG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIHZlcnNpb25JbmZvLmhhc1JlYWxNZXJnZWREYXRhID8gMSA6IDApO1xuXHRcdHdyaXRlVW5pY29kZVN0cmluZyh3cml0ZXIsIHZlcnNpb25JbmZvLndyaXRlck5hbWUpO1xuXHRcdHdyaXRlVW5pY29kZVN0cmluZyh3cml0ZXIsIHZlcnNpb25JbmZvLnJlYWRlck5hbWUpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgdmVyc2lvbkluZm8uZmlsZVZlcnNpb24pO1xuXHR9LFxuKTtcblxuTU9DS19IQU5ETEVSUyAmJiBhZGRIYW5kbGVyKFxuXHQxMDU4LCAvLyBFWElGIGRhdGEgMS5cblx0dGFyZ2V0ID0+ICh0YXJnZXQgYXMgYW55KS5faXIxMDU4ICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdExPR19NT0NLX0hBTkRMRVJTICYmIGNvbnNvbGUubG9nKCdpbWFnZSByZXNvdXJjZSAxMDU4JywgbGVmdCgpKTtcblx0XHQodGFyZ2V0IGFzIGFueSkuX2lyMTA1OCA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlQnl0ZXMod3JpdGVyLCAodGFyZ2V0IGFzIGFueSkuX2lyMTA1OCk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQ3MDAwLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmltYWdlUmVhZHlWYXJpYWJsZXMgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0KSA9PiB7XG5cdFx0dGFyZ2V0LmltYWdlUmVhZHlWYXJpYWJsZXMgPSByZWFkVXRmOFN0cmluZyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlVXRmOFN0cmluZyh3cml0ZXIsIHRhcmdldC5pbWFnZVJlYWR5VmFyaWFibGVzISk7XG5cdH0sXG4pO1xuXG5hZGRIYW5kbGVyKFxuXHQ3MDAxLFxuXHR0YXJnZXQgPT4gdGFyZ2V0LmltYWdlUmVhZHlEYXRhU2V0cyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQpID0+IHtcblx0XHR0YXJnZXQuaW1hZ2VSZWFkeURhdGFTZXRzID0gcmVhZFV0ZjhTdHJpbmcocmVhZGVyLCBsZWZ0KCkpO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHR3cml0ZVV0ZjhTdHJpbmcod3JpdGVyLCB0YXJnZXQuaW1hZ2VSZWFkeURhdGFTZXRzISk7XG5cdH0sXG4pO1xuXG5pbnRlcmZhY2UgRGVzY3JpcHRvcjEwODgge1xuXHQnbnVsbCc6IHN0cmluZ1tdO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQxMDg4LFxuXHR0YXJnZXQgPT4gdGFyZ2V0LnBhdGhTZWxlY3Rpb25TdGF0ZSAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIF9sZWZ0KSA9PiB7XG5cdFx0Y29uc3QgZGVzYzogRGVzY3JpcHRvcjEwODggPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcblx0XHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblx0XHR0YXJnZXQucGF0aFNlbGVjdGlvblN0YXRlID0gZGVzY1snbnVsbCddO1xuXHR9LFxuXHQod3JpdGVyLCB0YXJnZXQpID0+IHtcblx0XHRjb25zdCBkZXNjOiBEZXNjcmlwdG9yMTA4OCA9IHsgJ251bGwnOiB0YXJnZXQucGF0aFNlbGVjdGlvblN0YXRlISB9O1xuXHRcdHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyLCAnJywgJ251bGwnLCBkZXNjKTtcblx0fSxcbik7XG5cbk1PQ0tfSEFORExFUlMgJiYgYWRkSGFuZGxlcihcblx0MTAyNSxcblx0dGFyZ2V0ID0+ICh0YXJnZXQgYXMgYW55KS5faXIxMDI1ICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdExPR19NT0NLX0hBTkRMRVJTICYmIGNvbnNvbGUubG9nKCdpbWFnZSByZXNvdXJjZSAxMDI1JywgbGVmdCgpKTtcblx0XHQodGFyZ2V0IGFzIGFueSkuX2lyMTAyNSA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlQnl0ZXMod3JpdGVyLCAodGFyZ2V0IGFzIGFueSkuX2lyMTAyNSk7XG5cdH0sXG4pO1xuXG5jb25zdCBGcm1EID0gY3JlYXRlRW51bTwnYXV0bycgfCAnbm9uZScgfCAnZGlzcG9zZSc+KCdGcm1EJywgJycsIHtcblx0YXV0bzogJ0F1dG8nLFxuXHRub25lOiAnTm9uZScsXG5cdGRpc3Bvc2U6ICdEaXNwJyxcbn0pO1xuXG5pbnRlcmZhY2UgQW5pbWF0aW9uRnJhbWVEZXNjcmlwdG9yIHtcblx0RnJJRDogbnVtYmVyO1xuXHRGckRsPzogbnVtYmVyO1xuXHRGckRzOiBzdHJpbmc7XG5cdEZyR0E/OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBBbmltYXRpb25EZXNjcmlwdG9yIHtcblx0RnNJRDogbnVtYmVyO1xuXHRBRnJtPzogbnVtYmVyO1xuXHRGc0ZyOiBudW1iZXJbXTtcblx0TENudDogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgQW5pbWF0aW9uc0Rlc2NyaXB0b3Ige1xuXHRBRlN0PzogbnVtYmVyO1xuXHRGckluOiBBbmltYXRpb25GcmFtZURlc2NyaXB0b3JbXTtcblx0RlN0czogQW5pbWF0aW9uRGVzY3JpcHRvcltdO1xufVxuXG5hZGRIYW5kbGVyKFxuXHQ0MDAwLCAvLyBQbHVnLUluIHJlc291cmNlKHMpXG5cdHRhcmdldCA9PiB0YXJnZXQuYW5pbWF0aW9ucyAhPT0gdW5kZWZpbmVkLFxuXHQocmVhZGVyLCB0YXJnZXQsIGxlZnQsIHsgbG9nTWlzc2luZ0ZlYXR1cmVzLCBsb2dEZXZGZWF0dXJlcyB9KSA9PiB7XG5cdFx0Y29uc3Qga2V5ID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xuXG5cdFx0aWYgKGtleSA9PT0gJ21hbmknKSB7XG5cdFx0XHRjaGVja1NpZ25hdHVyZShyZWFkZXIsICdJUkZSJyk7XG5cdFx0XHRyZWFkU2VjdGlvbihyZWFkZXIsIDEsIGxlZnQgPT4ge1xuXHRcdFx0XHR3aGlsZSAobGVmdCgpKSB7XG5cdFx0XHRcdFx0Y2hlY2tTaWduYXR1cmUocmVhZGVyLCAnOEJJTScpO1xuXHRcdFx0XHRcdGNvbnN0IGtleSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcblxuXHRcdFx0XHRcdHJlYWRTZWN0aW9uKHJlYWRlciwgMSwgbGVmdCA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoa2V5ID09PSAnQW5EcycpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgZGVzYyA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpIGFzIEFuaW1hdGlvbnNEZXNjcmlwdG9yO1xuXHRcdFx0XHRcdFx0XHR0YXJnZXQuYW5pbWF0aW9ucyA9IHtcblx0XHRcdFx0XHRcdFx0XHQvLyBkZXNjLkFGU3QgPz8/XG5cdFx0XHRcdFx0XHRcdFx0ZnJhbWVzOiBkZXNjLkZySW4ubWFwKHggPT4gKHtcblx0XHRcdFx0XHRcdFx0XHRcdGlkOiB4LkZySUQsXG5cdFx0XHRcdFx0XHRcdFx0XHRkZWxheTogKHguRnJEbCB8fCAwKSAvIDEwMCxcblx0XHRcdFx0XHRcdFx0XHRcdGRpc3Bvc2U6IHguRnJEcyA/IEZybUQuZGVjb2RlKHguRnJEcykgOiAnYXV0bycsIC8vIG1pc3NpbmcgPT0gYXV0b1xuXHRcdFx0XHRcdFx0XHRcdFx0Ly8geC5GckdBID8/P1xuXHRcdFx0XHRcdFx0XHRcdH0pKSxcblx0XHRcdFx0XHRcdFx0XHRhbmltYXRpb25zOiBkZXNjLkZTdHMubWFwKHggPT4gKHtcblx0XHRcdFx0XHRcdFx0XHRcdGlkOiB4LkZzSUQsXG5cdFx0XHRcdFx0XHRcdFx0XHRmcmFtZXM6IHguRnNGcixcblx0XHRcdFx0XHRcdFx0XHRcdHJlcGVhdHM6IHguTENudCxcblx0XHRcdFx0XHRcdFx0XHRcdGFjdGl2ZUZyYW1lOiB4LkFGcm0gfHwgMCxcblx0XHRcdFx0XHRcdFx0XHR9KSksXG5cdFx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coJyM0MDAwIEFuRHMnLCByZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcblx0XHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coJyM0MDAwIEFuRHM6cmVzdWx0JywgcmVxdWlyZSgndXRpbCcpLmluc3BlY3QodGFyZ2V0LmFuaW1hdGlvbnMsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmIChrZXkgPT09ICdSb2xsJykge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBieXRlcyA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdFx0XHRcdFx0XHRcdGxvZ0RldkZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCcjNDAwMCBSb2xsJywgYnl0ZXMpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0bG9nTWlzc2luZ0ZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCdVbmhhbmRsZWQgc3Vic2VjdGlvbiBpbiAjNDAwMCcsIGtleSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0gZWxzZSBpZiAoa2V5ID09PSAnbW9wdCcpIHtcblx0XHRcdGNvbnN0IGJ5dGVzID0gcmVhZEJ5dGVzKHJlYWRlciwgbGVmdCgpKTtcblx0XHRcdGxvZ0RldkZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCcjNDAwMCBtb3B0JywgYnl0ZXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsb2dNaXNzaW5nRmVhdHVyZXMgJiYgY29uc29sZS5sb2coJ1VuaGFuZGxlZCBrZXkgaW4gIzQwMDA6Jywga2V5KTtcblx0XHR9XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdGlmICh0YXJnZXQuYW5pbWF0aW9ucykge1xuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnbWFuaScpO1xuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnSVJGUicpO1xuXHRcdFx0d3JpdGVTZWN0aW9uKHdyaXRlciwgMSwgKCkgPT4ge1xuXHRcdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdFx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJ0FuRHMnKTtcblx0XHRcdFx0d3JpdGVTZWN0aW9uKHdyaXRlciwgMSwgKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGRlc2M6IEFuaW1hdGlvbnNEZXNjcmlwdG9yID0ge1xuXHRcdFx0XHRcdFx0Ly8gQUZTdDogMCwgLy8gPz8/XG5cdFx0XHRcdFx0XHRGckluOiBbXSxcblx0XHRcdFx0XHRcdEZTdHM6IFtdLFxuXHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRhcmdldC5hbmltYXRpb25zIS5mcmFtZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdGNvbnN0IGYgPSB0YXJnZXQuYW5pbWF0aW9ucyEuZnJhbWVzW2ldO1xuXHRcdFx0XHRcdFx0Y29uc3QgZnJhbWU6IEFuaW1hdGlvbkZyYW1lRGVzY3JpcHRvciA9IHtcblx0XHRcdFx0XHRcdFx0RnJJRDogZi5pZCxcblx0XHRcdFx0XHRcdH0gYXMgYW55O1xuXHRcdFx0XHRcdFx0aWYgKGYuZGVsYXkpIGZyYW1lLkZyRGwgPSAoZi5kZWxheSAqIDEwMCkgfCAwO1xuXHRcdFx0XHRcdFx0ZnJhbWUuRnJEcyA9IEZybUQuZW5jb2RlKGYuZGlzcG9zZSk7XG5cdFx0XHRcdFx0XHQvLyBpZiAoaSA9PT0gMCkgZnJhbWUuRnJHQSA9IDMwOyAvLyA/Pz9cblx0XHRcdFx0XHRcdGRlc2MuRnJJbi5wdXNoKGZyYW1lKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRhcmdldC5hbmltYXRpb25zIS5hbmltYXRpb25zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBhID0gdGFyZ2V0LmFuaW1hdGlvbnMhLmFuaW1hdGlvbnNbaV07XG5cdFx0XHRcdFx0XHRjb25zdCBhbmltOiBBbmltYXRpb25EZXNjcmlwdG9yID0ge1xuXHRcdFx0XHRcdFx0XHRGc0lEOiBhLmlkLFxuXHRcdFx0XHRcdFx0XHRBRnJtOiBhLmFjdGl2ZUZyYW1lISB8IDAsXG5cdFx0XHRcdFx0XHRcdEZzRnI6IGEuZnJhbWVzLFxuXHRcdFx0XHRcdFx0XHRMQ250OiBhLnJlcGVhdHMhIHwgMCxcblx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRkZXNjLkZTdHMucHVzaChhbmltKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR3cml0ZVZlcnNpb25BbmREZXNjcmlwdG9yKHdyaXRlciwgJycsICdudWxsJywgZGVzYyk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdC8vIHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJzhCSU0nKTtcblx0XHRcdFx0Ly8gd3JpdGVTaWduYXR1cmUod3JpdGVyLCAnUm9sbCcpO1xuXHRcdFx0XHQvLyB3cml0ZVNlY3Rpb24od3JpdGVyLCAxLCAoKSA9PiB7XG5cdFx0XHRcdC8vIFx0d3JpdGVaZXJvcyh3cml0ZXIsIDgpO1xuXHRcdFx0XHQvLyB9KTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fSxcbik7XG5cbi8vIFRPRE86IFVuZmluaXNoZWRcbk1PQ0tfSEFORExFUlMgJiYgYWRkSGFuZGxlcihcblx0NDAwMSwgLy8gUGx1Zy1JbiByZXNvdXJjZShzKVxuXHR0YXJnZXQgPT4gKHRhcmdldCBhcyBhbnkpLl9pcjQwMDEgIT09IHVuZGVmaW5lZCxcblx0KHJlYWRlciwgdGFyZ2V0LCBsZWZ0LCB7IGxvZ01pc3NpbmdGZWF0dXJlcywgbG9nRGV2RmVhdHVyZXMgfSkgPT4ge1xuXHRcdGlmIChNT0NLX0hBTkRMRVJTKSB7XG5cdFx0XHRMT0dfTU9DS19IQU5ETEVSUyAmJiBjb25zb2xlLmxvZygnaW1hZ2UgcmVzb3VyY2UgNDAwMScsIGxlZnQoKSk7XG5cdFx0XHQodGFyZ2V0IGFzIGFueSkuX2lyNDAwMSA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3Qga2V5ID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xuXG5cdFx0aWYgKGtleSA9PT0gJ21mcmknKSB7XG5cdFx0XHRjb25zdCB2ZXJzaW9uID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0aWYgKHZlcnNpb24gIT09IDIpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBtZnJpIHZlcnNpb24nKTtcblxuXHRcdFx0Y29uc3QgbGVuZ3RoID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0Y29uc3QgYnl0ZXMgPSByZWFkQnl0ZXMocmVhZGVyLCBsZW5ndGgpO1xuXHRcdFx0bG9nRGV2RmVhdHVyZXMgJiYgY29uc29sZS5sb2coJ21mcmknLCBieXRlcyk7XG5cdFx0fSBlbHNlIGlmIChrZXkgPT09ICdtc2V0Jykge1xuXHRcdFx0Y29uc3QgZGVzYyA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpO1xuXHRcdFx0bG9nRGV2RmVhdHVyZXMgJiYgY29uc29sZS5sb2coJ21zZXQnLCBkZXNjKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bG9nTWlzc2luZ0ZlYXR1cmVzICYmIGNvbnNvbGUubG9nKCdVbmhhbmRsZWQga2V5IGluICM0MDAxJywga2V5KTtcblx0XHR9XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlQnl0ZXMod3JpdGVyLCAodGFyZ2V0IGFzIGFueSkuX2lyNDAwMSk7XG5cdH0sXG4pO1xuXG4vLyBUT0RPOiBVbmZpbmlzaGVkXG5NT0NLX0hBTkRMRVJTICYmIGFkZEhhbmRsZXIoXG5cdDQwMDIsIC8vIFBsdWctSW4gcmVzb3VyY2Uocylcblx0dGFyZ2V0ID0+ICh0YXJnZXQgYXMgYW55KS5faXI0MDAyICE9PSB1bmRlZmluZWQsXG5cdChyZWFkZXIsIHRhcmdldCwgbGVmdCkgPT4ge1xuXHRcdExPR19NT0NLX0hBTkRMRVJTICYmIGNvbnNvbGUubG9nKCdpbWFnZSByZXNvdXJjZSA0MDAyJywgbGVmdCgpKTtcblx0XHQodGFyZ2V0IGFzIGFueSkuX2lyNDAwMiA9IHJlYWRCeXRlcyhyZWFkZXIsIGxlZnQoKSk7XG5cdH0sXG5cdCh3cml0ZXIsIHRhcmdldCkgPT4ge1xuXHRcdHdyaXRlQnl0ZXMod3JpdGVyLCAodGFyZ2V0IGFzIGFueSkuX2lyNDAwMik7XG5cdH0sXG4pO1xuIl0sInNvdXJjZVJvb3QiOiJDOlxcUHJvamVjdHNcXGdpdGh1YlxcYWctcHNkXFxzcmMifQ==
