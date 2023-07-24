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
exports.strokeStyleLineAlignment = exports.strokeStyleLineJoinType = exports.strokeStyleLineCapType = exports.FrFl = exports.FStl = exports.ClrS = exports.gradientInterpolationMethodType = exports.stdTrackID = exports.animInterpStyleEnum = exports.GrdT = exports.IGSr = exports.BETE = exports.BESs = exports.bvlT = exports.BESl = exports.BlnM = exports.warpStyle = exports.Annt = exports.Ornt = exports.textGridding = exports.unitsValue = exports.unitsPercent = exports.unitsAngle = exports.parseUnitsToNumber = exports.parseUnitsOrNumber = exports.parseUnits = exports.parsePercentOrAngle = exports.parsePercent = exports.parseAngle = exports.serializeColor = exports.parseColor = exports.serializeVectorContent = exports.parseVectorContent = exports.serializeTrackList = exports.parseTrackList = exports.parseEffects = exports.serializeEffects = exports.xyToHorzVrtc = exports.horzVrtcToXY = exports.writeVersionAndDescriptor = exports.readVersionAndDescriptor = exports.writeDescriptorStructure = exports.readDescriptorStructure = exports.readAsciiStringOrClassId = exports.setLogErrors = void 0;
var helpers_1 = require("./helpers");
var psdReader_1 = require("./psdReader");
var psdWriter_1 = require("./psdWriter");
function revMap(map) {
    var result = {};
    Object.keys(map).forEach(function (key) { return result[map[key]] = key; });
    return result;
}
var unitsMap = {
    '#Ang': 'Angle',
    '#Rsl': 'Density',
    '#Rlt': 'Distance',
    '#Nne': 'None',
    '#Prc': 'Percent',
    '#Pxl': 'Pixels',
    '#Mlm': 'Millimeters',
    '#Pnt': 'Points',
    'RrPi': 'Picas',
    'RrIn': 'Inches',
    'RrCm': 'Centimeters',
};
var unitsMapRev = revMap(unitsMap);
var logErrors = false;
function setLogErrors(value) {
    logErrors = value;
}
exports.setLogErrors = setLogErrors;
function makeType(name, classID) {
    return { name: name, classID: classID };
}
var nullType = makeType('', 'null');
var fieldToExtType = {
    strokeStyleContent: makeType('', 'solidColorLayer'),
    // printProofSetup: makeType('校样设置', 'proofSetup'), // TESTING
    printProofSetup: makeType('Proof Setup', 'proofSetup'),
    patternFill: makeType('', 'patternFill'),
    Grad: makeType('Gradient', 'Grdn'),
    ebbl: makeType('', 'ebbl'),
    SoFi: makeType('', 'SoFi'),
    GrFl: makeType('', 'GrFl'),
    sdwC: makeType('', 'RGBC'),
    hglC: makeType('', 'RGBC'),
    'Clr ': makeType('', 'RGBC'),
    'tintColor': makeType('', 'RGBC'),
    Ofst: makeType('', 'Pnt '),
    ChFX: makeType('', 'ChFX'),
    MpgS: makeType('', 'ShpC'),
    DrSh: makeType('', 'DrSh'),
    IrSh: makeType('', 'IrSh'),
    OrGl: makeType('', 'OrGl'),
    IrGl: makeType('', 'IrGl'),
    TrnS: makeType('', 'ShpC'),
    Ptrn: makeType('', 'Ptrn'),
    FrFX: makeType('', 'FrFX'),
    phase: makeType('', 'Pnt '),
    frameStep: nullType,
    duration: nullType,
    workInTime: nullType,
    workOutTime: nullType,
    audioClipGroupList: nullType,
    bounds: makeType('', 'Rctn'),
    customEnvelopeWarp: makeType('', 'customEnvelopeWarp'),
    warp: makeType('', 'warp'),
    'Sz  ': makeType('', 'Pnt '),
    origin: makeType('', 'Pnt '),
    autoExpandOffset: makeType('', 'Pnt '),
    keyOriginShapeBBox: makeType('', 'unitRect'),
    Vrsn: nullType,
    psVersion: nullType,
    docDefaultNewArtboardBackgroundColor: makeType('', 'RGBC'),
    artboardRect: makeType('', 'classFloatRect'),
    keyOriginRRectRadii: makeType('', 'radii'),
    keyOriginBoxCorners: nullType,
    rectangleCornerA: makeType('', 'Pnt '),
    rectangleCornerB: makeType('', 'Pnt '),
    rectangleCornerC: makeType('', 'Pnt '),
    rectangleCornerD: makeType('', 'Pnt '),
    compInfo: nullType,
    Trnf: makeType('Transform', 'Trnf'),
    quiltWarp: makeType('', 'quiltWarp'),
    generatorSettings: nullType,
    crema: nullType,
    FrIn: nullType,
    blendOptions: nullType,
    FXRf: nullType,
    Lefx: nullType,
    time: nullType,
    animKey: nullType,
    timeScope: nullType,
    inTime: nullType,
    outTime: nullType,
    sheetStyle: nullType,
    translation: nullType,
    Skew: nullType,
    'Lnk ': makeType('', 'ExternalFileLink'),
    frameReader: makeType('', 'FrameReader'),
    effectParams: makeType('', 'motionTrackEffectParams'),
};
var fieldToArrayExtType = {
    'Crv ': makeType('', 'CrPt'),
    Clrs: makeType('', 'Clrt'),
    Trns: makeType('', 'TrnS'),
    keyDescriptorList: nullType,
    solidFillMulti: makeType('', 'SoFi'),
    gradientFillMulti: makeType('', 'GrFl'),
    dropShadowMulti: makeType('', 'DrSh'),
    innerShadowMulti: makeType('', 'IrSh'),
    frameFXMulti: makeType('', 'FrFX'),
    FrIn: nullType,
    FSts: nullType,
    LaSt: nullType,
    sheetTimelineOptions: nullType,
    trackList: makeType('', 'animationTrack'),
    globalTrackList: makeType('', 'animationTrack'),
    keyList: nullType,
    audioClipGroupList: nullType,
    audioClipList: nullType,
};
var typeToField = {
    'TEXT': [
        'Txt ', 'printerName', 'Nm  ', 'Idnt', 'blackAndWhitePresetFileName', 'LUT3DFileName',
        'presetFileName', 'curvesPresetFileName', 'mixerPresetFileName', 'placed', 'description', 'reason',
        'artboardPresetName', 'json', 'groupID', 'clipID', 'relPath', 'fullPath', 'mediaDescriptor',
    ],
    'tdta': ['EngineData', 'LUT3DFileData'],
    'long': [
        'TextIndex', 'RndS', 'Mdpn', 'Smth', 'Lctn', 'strokeStyleVersion', 'LaID', 'Vrsn', 'Cnt ',
        'Brgh', 'Cntr', 'means', 'vibrance', 'Strt', 'bwPresetKind', 'presetKind', 'comp', 'compID', 'originalCompID',
        'curvesPresetKind', 'mixerPresetKind', 'uOrder', 'vOrder', 'PgNm', 'totalPages', 'Crop',
        'numerator', 'denominator', 'frameCount', 'Annt', 'keyOriginType', 'unitValueQuadVersion',
        'keyOriginIndex', 'major', 'minor', 'fix', 'docDefaultNewArtboardBackgroundType', 'artboardBackgroundType',
        'numModifyingFX', 'deformNumRows', 'deformNumCols', 'FrID', 'FrDl', 'FsID', 'LCnt', 'AFrm', 'AFSt',
        'numBefore', 'numAfter', 'Spcn', 'minOpacity', 'maxOpacity', 'BlnM', 'sheetID', 'gblA', 'globalAltitude',
        'descVersion', 'frameReaderType', 'LyrI', 'zoomOrigin',
    ],
    'enum': [
        'textGridding', 'Ornt', 'warpStyle', 'warpRotate', 'Inte', 'Bltn', 'ClrS',
        'sdwM', 'hglM', 'bvlT', 'bvlS', 'bvlD', 'Md  ', 'glwS', 'GrdF', 'GlwT',
        'strokeStyleLineCapType', 'strokeStyleLineJoinType', 'strokeStyleLineAlignment',
        'strokeStyleBlendMode', 'PntT', 'Styl', 'lookupType', 'LUTFormat', 'dataOrder',
        'tableOrder', 'enableCompCore', 'enableCompCoreGPU', 'compCoreSupport', 'compCoreGPUSupport', 'Engn',
        'enableCompCoreThreads', 'gs99', 'FrDs', 'trackID', 'animInterpStyle',
    ],
    'bool': [
        'PstS', 'printSixteenBit', 'masterFXSwitch', 'enab', 'uglg', 'antialiasGloss',
        'useShape', 'useTexture', 'uglg', 'antialiasGloss', 'useShape',
        'useTexture', 'Algn', 'Rvrs', 'Dthr', 'Invr', 'VctC', 'ShTr', 'layerConceals',
        'strokeEnabled', 'fillEnabled', 'strokeStyleScaleLock', 'strokeStyleStrokeAdjust',
        'hardProof', 'MpBl', 'paperWhite', 'useLegacy', 'Auto', 'Lab ', 'useTint', 'keyShapeInvalidated',
        'autoExpandEnabled', 'autoNestEnabled', 'autoPositionEnabled', 'shrinkwrapOnSaveEnabled',
        'present', 'showInDialog', 'overprint', 'sheetDisclosed', 'lightsDisclosed', 'meshesDisclosed',
        'materialsDisclosed', 'hasMotion', 'muted', 'Effc', 'selected', 'autoScope', 'fillCanvas',
    ],
    'doub': [
        'warpValue', 'warpPerspective', 'warpPerspectiveOther', 'Intr', 'Wdth', 'Hght',
        'strokeStyleMiterLimit', 'strokeStyleResolution', 'layerTime', 'keyOriginResolution',
        'xx', 'xy', 'yx', 'yy', 'tx', 'ty', 'FrGA', 'frameRate', 'audioLevel', 'rotation',
    ],
    'UntF': [
        'Scl ', 'sdwO', 'hglO', 'lagl', 'Lald', 'srgR', 'blur', 'Sftn', 'Opct', 'Dstn', 'Angl',
        'Ckmt', 'Nose', 'Inpr', 'ShdN', 'strokeStyleLineWidth', 'strokeStyleLineDashOffset',
        'strokeStyleOpacity', 'H   ', 'Top ', 'Left', 'Btom', 'Rght', 'Rslt',
        'topRight', 'topLeft', 'bottomLeft', 'bottomRight',
    ],
    'VlLs': [
        'Crv ', 'Clrs', 'Mnm ', 'Mxm ', 'Trns', 'pathList', 'strokeStyleLineDashSet', 'FrLs',
        'LaSt', 'Trnf', 'nonAffineTransform', 'keyDescriptorList', 'guideIndeces', 'gradientFillMulti',
        'solidFillMulti', 'frameFXMulti', 'innerShadowMulti', 'dropShadowMulti', 'FrIn', 'FSts', 'FsFr',
        'sheetTimelineOptions', 'audioClipList', 'trackList', 'globalTrackList', 'keyList', 'audioClipList',
    ],
    'ObAr': ['meshPoints', 'quiltSliceX', 'quiltSliceY'],
    'obj ': ['null'],
};
var channels = [
    'Rd  ', 'Grn ', 'Bl  ', 'Yllw', 'Ylw ', 'Cyn ', 'Mgnt', 'Blck', 'Gry ', 'Lmnc', 'A   ', 'B   ',
];
var fieldToArrayType = {
    'Mnm ': 'long',
    'Mxm ': 'long',
    'FrLs': 'long',
    'strokeStyleLineDashSet': 'UntF',
    'Trnf': 'doub',
    'nonAffineTransform': 'doub',
    'keyDescriptorList': 'Objc',
    'gradientFillMulti': 'Objc',
    'solidFillMulti': 'Objc',
    'frameFXMulti': 'Objc',
    'innerShadowMulti': 'Objc',
    'dropShadowMulti': 'Objc',
    'LaSt': 'Objc',
    'FrIn': 'Objc',
    'FSts': 'Objc',
    'FsFr': 'long',
    'blendOptions': 'Objc',
    'sheetTimelineOptions': 'Objc',
    'keyList': 'Objc',
};
var fieldToType = {};
for (var _i = 0, _a = Object.keys(typeToField); _i < _a.length; _i++) {
    var type = _a[_i];
    for (var _b = 0, _c = typeToField[type]; _b < _c.length; _b++) {
        var field = _c[_b];
        fieldToType[field] = type;
    }
}
for (var _d = 0, _e = Object.keys(fieldToExtType); _d < _e.length; _d++) {
    var field = _e[_d];
    if (!fieldToType[field])
        fieldToType[field] = 'Objc';
}
for (var _f = 0, _g = Object.keys(fieldToArrayExtType); _f < _g.length; _f++) {
    var field = _g[_f];
    fieldToArrayType[field] = 'Objc';
}
function getTypeByKey(key, value, root, parent) {
    if (key === 'Sz  ') {
        return ('Wdth' in value) ? 'Objc' : (('units' in value) ? 'UntF' : 'doub');
    }
    else if (key === 'Type') {
        return typeof value === 'string' ? 'enum' : 'long';
    }
    else if (key === 'AntA') {
        return typeof value === 'string' ? 'enum' : 'bool';
    }
    else if ((key === 'Hrzn' || key === 'Vrtc') && parent.Type === 'keyType.Pstn') {
        return 'long';
    }
    else if (key === 'Hrzn' || key === 'Vrtc' || key === 'Top ' || key === 'Left' || key === 'Btom' || key === 'Rght') {
        return typeof value === 'number' ? 'doub' : 'UntF';
    }
    else if (key === 'Vrsn') {
        return typeof value === 'number' ? 'long' : 'Objc';
    }
    else if (key === 'Rd  ' || key === 'Grn ' || key === 'Bl  ') {
        return root === 'artd' ? 'long' : 'doub';
    }
    else if (key === 'Trnf') {
        return Array.isArray(value) ? 'VlLs' : 'Objc';
    }
    else {
        return fieldToType[key];
    }
}
function readAsciiStringOrClassId(reader) {
    var length = (0, psdReader_1.readInt32)(reader);
    return (0, psdReader_1.readAsciiString)(reader, length || 4);
}
exports.readAsciiStringOrClassId = readAsciiStringOrClassId;
function writeAsciiStringOrClassId(writer, value) {
    if (value.length === 4 && value !== 'warp' && value !== 'time' && value !== 'hold') {
        // write classId
        (0, psdWriter_1.writeInt32)(writer, 0);
        (0, psdWriter_1.writeSignature)(writer, value);
    }
    else {
        // write ascii string
        (0, psdWriter_1.writeInt32)(writer, value.length);
        for (var i = 0; i < value.length; i++) {
            (0, psdWriter_1.writeUint8)(writer, value.charCodeAt(i));
        }
    }
}
function readDescriptorStructure(reader) {
    var object = {};
    // object.__struct =
    readClassStructure(reader);
    var itemsCount = (0, psdReader_1.readUint32)(reader);
    // console.log('//', object.__struct);
    for (var i = 0; i < itemsCount; i++) {
        var key = readAsciiStringOrClassId(reader);
        var type = (0, psdReader_1.readSignature)(reader);
        // console.log(`> '${key}' '${type}'`);
        var data = readOSType(reader, type);
        // if (!getTypeByKey(key, data)) console.log(`> '${key}' '${type}'`, data);
        object[key] = data;
    }
    return object;
}
exports.readDescriptorStructure = readDescriptorStructure;
function writeDescriptorStructure(writer, name, classId, value, root) {
    if (logErrors && !classId)
        console.log('Missing classId for: ', name, classId, value);
    // write class structure
    (0, psdWriter_1.writeUnicodeStringWithPadding)(writer, name);
    writeAsciiStringOrClassId(writer, classId);
    var keys = Object.keys(value);
    (0, psdWriter_1.writeUint32)(writer, keys.length);
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        var type = getTypeByKey(key, value[key], root, value);
        var extType = fieldToExtType[key];
        if (key === 'Scl ' && 'Hrzn' in value[key]) {
            type = 'Objc';
            extType = nullType;
        }
        else if (key === 'audioClipGroupList' && keys.length === 1) {
            type = 'VlLs';
        }
        else if ((key === 'Strt' || key === 'Brgh') && 'H   ' in value) {
            type = 'doub';
        }
        else if (key === 'Strt') {
            type = 'Objc';
            extType = nullType;
        }
        else if (channels.indexOf(key) !== -1) {
            type = (classId === 'RGBC' && root !== 'artd') ? 'doub' : 'long';
        }
        else if (key === 'profile') {
            type = classId === 'printOutput' ? 'TEXT' : 'tdta';
        }
        else if (key === 'strokeStyleContent') {
            if (value[key]['Clr ']) {
                extType = makeType('', 'solidColorLayer');
            }
            else if (value[key].Grad) {
                extType = makeType('', 'gradientLayer');
            }
            else if (value[key].Ptrn) {
                extType = makeType('', 'patternLayer');
            }
            else {
                logErrors && console.log('Invalid strokeStyleContent value', value[key]);
            }
        }
        else if (key === 'bounds' && root === 'quiltWarp') {
            extType = makeType('', 'classFloatRect');
        }
        if (extType && extType.classID === 'RGBC') {
            if ('H   ' in value[key])
                extType = { classID: 'HSBC', name: '' };
            // TODO: other color spaces
        }
        writeAsciiStringOrClassId(writer, key);
        (0, psdWriter_1.writeSignature)(writer, type || 'long');
        writeOSType(writer, type || 'long', value[key], key, extType, root);
        if (logErrors && !type)
            console.log("Missing descriptor field type for: '".concat(key, "' in"), value);
    }
}
exports.writeDescriptorStructure = writeDescriptorStructure;
function readOSType(reader, type) {
    switch (type) {
        case 'obj ': // Reference
            return readReferenceStructure(reader);
        case 'Objc': // Descriptor
        case 'GlbO': // GlobalObject same as Descriptor
            return readDescriptorStructure(reader);
        case 'VlLs': { // List
            var length_1 = (0, psdReader_1.readInt32)(reader);
            var items = [];
            for (var i = 0; i < length_1; i++) {
                var type_1 = (0, psdReader_1.readSignature)(reader);
                // console.log('  >', type);
                items.push(readOSType(reader, type_1));
            }
            return items;
        }
        case 'doub': // Double
            return (0, psdReader_1.readFloat64)(reader);
        case 'UntF': { // Unit double
            var units = (0, psdReader_1.readSignature)(reader);
            var value = (0, psdReader_1.readFloat64)(reader);
            if (!unitsMap[units])
                throw new Error("Invalid units: ".concat(units));
            return { units: unitsMap[units], value: value };
        }
        case 'UnFl': { // Unit float
            var units = (0, psdReader_1.readSignature)(reader);
            var value = (0, psdReader_1.readFloat32)(reader);
            if (!unitsMap[units])
                throw new Error("Invalid units: ".concat(units));
            return { units: unitsMap[units], value: value };
        }
        case 'TEXT': // String
            return (0, psdReader_1.readUnicodeString)(reader);
        case 'enum': { // Enumerated
            var type_2 = readAsciiStringOrClassId(reader);
            var value = readAsciiStringOrClassId(reader);
            return "".concat(type_2, ".").concat(value);
        }
        case 'long': // Integer
            return (0, psdReader_1.readInt32)(reader);
        case 'comp': { // Large Integer
            var low = (0, psdReader_1.readUint32)(reader);
            var high = (0, psdReader_1.readUint32)(reader);
            return { low: low, high: high };
        }
        case 'bool': // Boolean
            return !!(0, psdReader_1.readUint8)(reader);
        case 'type': // Class
        case 'GlbC': // Class
            return readClassStructure(reader);
        case 'alis': { // Alias
            var length_2 = (0, psdReader_1.readInt32)(reader);
            return (0, psdReader_1.readAsciiString)(reader, length_2);
        }
        case 'tdta': { // Raw Data
            var length_3 = (0, psdReader_1.readInt32)(reader);
            return (0, psdReader_1.readBytes)(reader, length_3);
        }
        case 'ObAr': { // Object array
            (0, psdReader_1.readInt32)(reader); // version: 16
            (0, psdReader_1.readUnicodeString)(reader); // name: ''
            readAsciiStringOrClassId(reader); // 'rationalPoint'
            var length_4 = (0, psdReader_1.readInt32)(reader);
            var items = [];
            for (var i = 0; i < length_4; i++) {
                var type1 = readAsciiStringOrClassId(reader); // type Hrzn | Vrtc
                (0, psdReader_1.readSignature)(reader); // UnFl
                (0, psdReader_1.readSignature)(reader); // units ? '#Pxl'
                var valuesCount = (0, psdReader_1.readInt32)(reader);
                var values = [];
                for (var j = 0; j < valuesCount; j++) {
                    values.push((0, psdReader_1.readFloat64)(reader));
                }
                items.push({ type: type1, values: values });
            }
            return items;
        }
        case 'Pth ': { // File path
            /*const length =*/ (0, psdReader_1.readInt32)(reader);
            var sig = (0, psdReader_1.readSignature)(reader);
            /*const pathSize =*/ (0, psdReader_1.readInt32LE)(reader);
            var charsCount = (0, psdReader_1.readInt32LE)(reader);
            var path = (0, psdReader_1.readUnicodeStringWithLength)(reader, charsCount);
            return { sig: sig, path: path };
        }
        default:
            throw new Error("Invalid TySh descriptor OSType: ".concat(type, " at ").concat(reader.offset.toString(16)));
    }
}
var ObArTypes = {
    meshPoints: 'rationalPoint',
    quiltSliceX: 'UntF',
    quiltSliceY: 'UntF',
};
function writeOSType(writer, type, value, key, extType, root) {
    switch (type) {
        case 'obj ': // Reference
            writeReferenceStructure(writer, key, value);
            break;
        case 'Objc': // Descriptor
        case 'GlbO': // GlobalObject same as Descriptor
            if (!extType)
                throw new Error("Missing ext type for: '".concat(key, "' (").concat(JSON.stringify(value), ")"));
            writeDescriptorStructure(writer, extType.name, extType.classID, value, root);
            break;
        case 'VlLs': // List
            (0, psdWriter_1.writeInt32)(writer, value.length);
            for (var i = 0; i < value.length; i++) {
                var type_3 = fieldToArrayType[key];
                (0, psdWriter_1.writeSignature)(writer, type_3 || 'long');
                writeOSType(writer, type_3 || 'long', value[i], '', fieldToArrayExtType[key], root);
                if (logErrors && !type_3)
                    console.log("Missing descriptor array type for: '".concat(key, "' in"), value);
            }
            break;
        case 'doub': // Double
            (0, psdWriter_1.writeFloat64)(writer, value);
            break;
        case 'UntF': // Unit double
            if (!unitsMapRev[value.units])
                throw new Error("Invalid units: ".concat(value.units, " in ").concat(key));
            (0, psdWriter_1.writeSignature)(writer, unitsMapRev[value.units]);
            (0, psdWriter_1.writeFloat64)(writer, value.value);
            break;
        case 'UnFl': // Unit float
            if (!unitsMapRev[value.units])
                throw new Error("Invalid units: ".concat(value.units, " in ").concat(key));
            (0, psdWriter_1.writeSignature)(writer, unitsMapRev[value.units]);
            (0, psdWriter_1.writeFloat32)(writer, value.value);
            break;
        case 'TEXT': // String
            (0, psdWriter_1.writeUnicodeStringWithPadding)(writer, value);
            break;
        case 'enum': { // Enumerated
            var _a = value.split('.'), _type = _a[0], val = _a[1];
            writeAsciiStringOrClassId(writer, _type);
            writeAsciiStringOrClassId(writer, val);
            break;
        }
        case 'long': // Integer
            (0, psdWriter_1.writeInt32)(writer, value);
            break;
        // case 'comp': // Large Integer
        // 	writeLargeInteger(reader);
        case 'bool': // Boolean
            (0, psdWriter_1.writeUint8)(writer, value ? 1 : 0);
            break;
        // case 'type': // Class
        // case 'GlbC': // Class
        // 	writeClassStructure(reader);
        // case 'alis': // Alias
        // 	writeAliasStructure(reader);
        case 'tdta': // Raw Data
            (0, psdWriter_1.writeInt32)(writer, value.byteLength);
            (0, psdWriter_1.writeBytes)(writer, value);
            break;
        case 'ObAr': { // Object array
            (0, psdWriter_1.writeInt32)(writer, 16); // version
            (0, psdWriter_1.writeUnicodeStringWithPadding)(writer, ''); // name
            var type_4 = ObArTypes[key];
            if (!type_4)
                throw new Error("Not implemented ObArType for: ".concat(key));
            writeAsciiStringOrClassId(writer, type_4);
            (0, psdWriter_1.writeInt32)(writer, value.length);
            for (var i = 0; i < value.length; i++) {
                writeAsciiStringOrClassId(writer, value[i].type); // Hrzn | Vrtc
                (0, psdWriter_1.writeSignature)(writer, 'UnFl');
                (0, psdWriter_1.writeSignature)(writer, '#Pxl');
                (0, psdWriter_1.writeInt32)(writer, value[i].values.length);
                for (var j = 0; j < value[i].values.length; j++) {
                    (0, psdWriter_1.writeFloat64)(writer, value[i].values[j]);
                }
            }
            break;
        }
        // case 'Pth ': // File path
        // 	writeFilePath(reader);
        default:
            throw new Error("Not implemented descriptor OSType: ".concat(type));
    }
}
function readReferenceStructure(reader) {
    var itemsCount = (0, psdReader_1.readInt32)(reader);
    var items = [];
    for (var i = 0; i < itemsCount; i++) {
        var type = (0, psdReader_1.readSignature)(reader);
        switch (type) {
            case 'prop': { // Property
                readClassStructure(reader);
                var keyID = readAsciiStringOrClassId(reader);
                items.push(keyID);
                break;
            }
            case 'Clss': // Class
                items.push(readClassStructure(reader));
                break;
            case 'Enmr': { // Enumerated Reference
                readClassStructure(reader);
                var typeID = readAsciiStringOrClassId(reader);
                var value = readAsciiStringOrClassId(reader);
                items.push("".concat(typeID, ".").concat(value));
                break;
            }
            case 'rele': { // Offset
                // const { name, classID } =
                readClassStructure(reader);
                items.push((0, psdReader_1.readUint32)(reader));
                break;
            }
            case 'Idnt': // Identifier
                items.push((0, psdReader_1.readInt32)(reader));
                break;
            case 'indx': // Index
                items.push((0, psdReader_1.readInt32)(reader));
                break;
            case 'name': { // Name
                readClassStructure(reader);
                items.push((0, psdReader_1.readUnicodeString)(reader));
                break;
            }
            default:
                throw new Error("Invalid descriptor reference type: ".concat(type));
        }
    }
    return items;
}
function writeReferenceStructure(writer, _key, items) {
    (0, psdWriter_1.writeInt32)(writer, items.length);
    for (var i = 0; i < items.length; i++) {
        var value = items[i];
        var type = 'unknown';
        if (typeof value === 'string') {
            if (/^[a-z]+\.[a-z]+$/i.test(value)) {
                type = 'Enmr';
            }
            else {
                type = 'name';
            }
        }
        (0, psdWriter_1.writeSignature)(writer, type);
        switch (type) {
            // case 'prop': // Property
            // case 'Clss': // Class
            case 'Enmr': { // Enumerated Reference
                var _a = value.split('.'), typeID = _a[0], enumValue = _a[1];
                writeClassStructure(writer, '\0', typeID);
                writeAsciiStringOrClassId(writer, typeID);
                writeAsciiStringOrClassId(writer, enumValue);
                break;
            }
            // case 'rele': // Offset
            // case 'Idnt': // Identifier
            // case 'indx': // Index
            case 'name': { // Name
                writeClassStructure(writer, '\0', 'Lyr ');
                (0, psdWriter_1.writeUnicodeString)(writer, value + '\0');
                break;
            }
            default:
                throw new Error("Invalid descriptor reference type: ".concat(type));
        }
    }
    return items;
}
function readClassStructure(reader) {
    var name = (0, psdReader_1.readUnicodeString)(reader);
    var classID = readAsciiStringOrClassId(reader);
    // console.log({ name, classID });
    return { name: name, classID: classID };
}
function writeClassStructure(writer, name, classID) {
    (0, psdWriter_1.writeUnicodeString)(writer, name);
    writeAsciiStringOrClassId(writer, classID);
}
function readVersionAndDescriptor(reader) {
    var version = (0, psdReader_1.readUint32)(reader);
    if (version !== 16)
        throw new Error("Invalid descriptor version: ".concat(version));
    var desc = readDescriptorStructure(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    return desc;
}
exports.readVersionAndDescriptor = readVersionAndDescriptor;
function writeVersionAndDescriptor(writer, name, classID, descriptor, root) {
    if (root === void 0) { root = ''; }
    (0, psdWriter_1.writeUint32)(writer, 16); // version
    writeDescriptorStructure(writer, name, classID, descriptor, root);
}
exports.writeVersionAndDescriptor = writeVersionAndDescriptor;
function horzVrtcToXY(hv) {
    return { x: hv.Hrzn, y: hv.Vrtc };
}
exports.horzVrtcToXY = horzVrtcToXY;
function xyToHorzVrtc(xy) {
    return { Hrzn: xy.x, Vrtc: xy.y };
}
exports.xyToHorzVrtc = xyToHorzVrtc;
function parseFxObject(fx) {
    var stroke = {
        enabled: !!fx.enab,
        position: exports.FStl.decode(fx.Styl),
        fillType: exports.FrFl.decode(fx.PntT),
        blendMode: exports.BlnM.decode(fx['Md  ']),
        opacity: parsePercent(fx.Opct),
        size: parseUnits(fx['Sz  ']),
    };
    if (fx.present !== undefined)
        stroke.present = fx.present;
    if (fx.showInDialog !== undefined)
        stroke.showInDialog = fx.showInDialog;
    if (fx.overprint !== undefined)
        stroke.overprint = fx.overprint;
    if (fx['Clr '])
        stroke.color = parseColor(fx['Clr ']);
    if (fx.Grad)
        stroke.gradient = parseGradientContent(fx);
    if (fx.Ptrn)
        stroke.pattern = parsePatternContent(fx);
    return stroke;
}
function serializeFxObject(stroke) {
    var FrFX = {};
    FrFX.enab = !!stroke.enabled;
    if (stroke.present !== undefined)
        FrFX.present = !!stroke.present;
    if (stroke.showInDialog !== undefined)
        FrFX.showInDialog = !!stroke.showInDialog;
    FrFX.Styl = exports.FStl.encode(stroke.position);
    FrFX.PntT = exports.FrFl.encode(stroke.fillType);
    FrFX['Md  '] = exports.BlnM.encode(stroke.blendMode);
    FrFX.Opct = unitsPercent(stroke.opacity);
    FrFX['Sz  '] = unitsValue(stroke.size, 'size');
    if (stroke.color)
        FrFX['Clr '] = serializeColor(stroke.color);
    if (stroke.gradient)
        FrFX = __assign(__assign({}, FrFX), serializeGradientContent(stroke.gradient));
    if (stroke.pattern)
        FrFX = __assign(__assign({}, FrFX), serializePatternContent(stroke.pattern));
    if (stroke.overprint !== undefined)
        FrFX.overprint = !!stroke.overprint;
    return FrFX;
}
function serializeEffects(e, log, multi) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    var info = multi ? {
        'Scl ': unitsPercent((_a = e.scale) !== null && _a !== void 0 ? _a : 1),
        masterFXSwitch: !e.disabled,
    } : {
        masterFXSwitch: !e.disabled,
        'Scl ': unitsPercent((_b = e.scale) !== null && _b !== void 0 ? _b : 1),
    };
    var arrayKeys = ['dropShadow', 'innerShadow', 'solidFill', 'gradientOverlay', 'stroke'];
    for (var _i = 0, arrayKeys_1 = arrayKeys; _i < arrayKeys_1.length; _i++) {
        var key = arrayKeys_1[_i];
        if (e[key] && !Array.isArray(e[key]))
            throw new Error("".concat(key, " should be an array"));
    }
    if (((_c = e.dropShadow) === null || _c === void 0 ? void 0 : _c[0]) && !multi)
        info.DrSh = serializeEffectObject(e.dropShadow[0], 'dropShadow', log);
    if (((_d = e.dropShadow) === null || _d === void 0 ? void 0 : _d[0]) && multi)
        info.dropShadowMulti = e.dropShadow.map(function (i) { return serializeEffectObject(i, 'dropShadow', log); });
    if (((_e = e.innerShadow) === null || _e === void 0 ? void 0 : _e[0]) && !multi)
        info.IrSh = serializeEffectObject(e.innerShadow[0], 'innerShadow', log);
    if (((_f = e.innerShadow) === null || _f === void 0 ? void 0 : _f[0]) && multi)
        info.innerShadowMulti = e.innerShadow.map(function (i) { return serializeEffectObject(i, 'innerShadow', log); });
    if (e.outerGlow)
        info.OrGl = serializeEffectObject(e.outerGlow, 'outerGlow', log);
    if (((_g = e.solidFill) === null || _g === void 0 ? void 0 : _g[0]) && multi)
        info.solidFillMulti = e.solidFill.map(function (i) { return serializeEffectObject(i, 'solidFill', log); });
    if (((_h = e.gradientOverlay) === null || _h === void 0 ? void 0 : _h[0]) && multi)
        info.gradientFillMulti = e.gradientOverlay.map(function (i) { return serializeEffectObject(i, 'gradientOverlay', log); });
    if (((_j = e.stroke) === null || _j === void 0 ? void 0 : _j[0]) && multi)
        info.frameFXMulti = e.stroke.map(function (i) { return serializeFxObject(i); });
    if (e.innerGlow)
        info.IrGl = serializeEffectObject(e.innerGlow, 'innerGlow', log);
    if (e.bevel)
        info.ebbl = serializeEffectObject(e.bevel, 'bevel', log);
    if (((_k = e.solidFill) === null || _k === void 0 ? void 0 : _k[0]) && !multi)
        info.SoFi = serializeEffectObject(e.solidFill[0], 'solidFill', log);
    if (e.patternOverlay)
        info.patternFill = serializeEffectObject(e.patternOverlay, 'patternOverlay', log);
    if (((_l = e.gradientOverlay) === null || _l === void 0 ? void 0 : _l[0]) && !multi)
        info.GrFl = serializeEffectObject(e.gradientOverlay[0], 'gradientOverlay', log);
    if (e.satin)
        info.ChFX = serializeEffectObject(e.satin, 'satin', log);
    if (((_m = e.stroke) === null || _m === void 0 ? void 0 : _m[0]) && !multi)
        info.FrFX = serializeFxObject((_o = e.stroke) === null || _o === void 0 ? void 0 : _o[0]);
    if (multi) {
        info.numModifyingFX = 0;
        for (var _p = 0, _q = Object.keys(e); _p < _q.length; _p++) {
            var key = _q[_p];
            var value = e[key];
            if (Array.isArray(value)) {
                for (var _r = 0, value_1 = value; _r < value_1.length; _r++) {
                    var effect = value_1[_r];
                    if (effect.enabled)
                        info.numModifyingFX++;
                }
            }
        }
    }
    return info;
}
exports.serializeEffects = serializeEffects;
function parseEffects(info, log) {
    var effects = {};
    if (!info.masterFXSwitch)
        effects.disabled = true;
    if (info['Scl '])
        effects.scale = parsePercent(info['Scl ']);
    if (info.DrSh)
        effects.dropShadow = [parseEffectObject(info.DrSh, log)];
    if (info.dropShadowMulti)
        effects.dropShadow = info.dropShadowMulti.map(function (i) { return parseEffectObject(i, log); });
    if (info.IrSh)
        effects.innerShadow = [parseEffectObject(info.IrSh, log)];
    if (info.innerShadowMulti)
        effects.innerShadow = info.innerShadowMulti.map(function (i) { return parseEffectObject(i, log); });
    if (info.OrGl)
        effects.outerGlow = parseEffectObject(info.OrGl, log);
    if (info.IrGl)
        effects.innerGlow = parseEffectObject(info.IrGl, log);
    if (info.ebbl)
        effects.bevel = parseEffectObject(info.ebbl, log);
    if (info.SoFi)
        effects.solidFill = [parseEffectObject(info.SoFi, log)];
    if (info.solidFillMulti)
        effects.solidFill = info.solidFillMulti.map(function (i) { return parseEffectObject(i, log); });
    if (info.patternFill)
        effects.patternOverlay = parseEffectObject(info.patternFill, log);
    if (info.GrFl)
        effects.gradientOverlay = [parseEffectObject(info.GrFl, log)];
    if (info.gradientFillMulti)
        effects.gradientOverlay = info.gradientFillMulti.map(function (i) { return parseEffectObject(i, log); });
    if (info.ChFX)
        effects.satin = parseEffectObject(info.ChFX, log);
    if (info.FrFX)
        effects.stroke = [parseFxObject(info.FrFX)];
    if (info.frameFXMulti)
        effects.stroke = info.frameFXMulti.map(function (i) { return parseFxObject(i); });
    return effects;
}
exports.parseEffects = parseEffects;
function parseKeyList(keyList, logMissingFeatures) {
    var keys = [];
    for (var j = 0; j < keyList.length; j++) {
        var key = keyList[j];
        var time = key.time, selected = key.selected, animKey = key.animKey;
        var interpolation = exports.animInterpStyleEnum.decode(key.animInterpStyle);
        switch (animKey.Type) {
            case 'keyType.Opct':
                keys.push({ interpolation: interpolation, time: time, selected: selected, type: 'opacity', value: parsePercent(animKey.Opct) });
                break;
            case 'keyType.Pstn':
                keys.push({ interpolation: interpolation, time: time, selected: selected, type: 'position', x: animKey.Hrzn, y: animKey.Vrtc });
                break;
            case 'keyType.Trnf':
                keys.push({
                    interpolation: interpolation,
                    time: time,
                    selected: selected,
                    type: 'transform',
                    scale: horzVrtcToXY(animKey['Scl ']), skew: horzVrtcToXY(animKey.Skew), rotation: animKey.rotation, translation: horzVrtcToXY(animKey.translation)
                });
                break;
            case 'keyType.sheetStyle': {
                var key_1 = { interpolation: interpolation, time: time, selected: selected, type: 'style' };
                if (animKey.sheetStyle.Lefx)
                    key_1.style = parseEffects(animKey.sheetStyle.Lefx, logMissingFeatures);
                keys.push(key_1);
                break;
            }
            case 'keyType.globalLighting': {
                keys.push({
                    interpolation: interpolation,
                    time: time,
                    selected: selected,
                    type: 'globalLighting',
                    globalAngle: animKey.gblA, globalAltitude: animKey.globalAltitude
                });
                break;
            }
            default: throw new Error("Unsupported keyType value");
        }
    }
    return keys;
}
function serializeKeyList(keys) {
    var keyList = [];
    for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var time = key.time, _a = key.selected, selected = _a === void 0 ? false : _a, interpolation = key.interpolation;
        var animInterpStyle = exports.animInterpStyleEnum.encode(interpolation);
        var animKey = void 0;
        switch (key.type) {
            case 'opacity':
                animKey = { Type: 'keyType.Opct', Opct: unitsPercent(key.value) };
                break;
            case 'position':
                animKey = { Type: 'keyType.Pstn', Hrzn: key.x, Vrtc: key.y };
                break;
            case 'transform':
                animKey = { Type: 'keyType.Trnf', 'Scl ': xyToHorzVrtc(key.scale), Skew: xyToHorzVrtc(key.skew), rotation: key.rotation, translation: xyToHorzVrtc(key.translation) };
                break;
            case 'style':
                animKey = { Type: 'keyType.sheetStyle', sheetStyle: { Vrsn: 1, blendOptions: {} } };
                if (key.style)
                    animKey.sheetStyle = { Vrsn: 1, Lefx: serializeEffects(key.style, false, false), blendOptions: {} };
                break;
            case 'globalLighting': {
                animKey = { Type: 'keyType.globalLighting', gblA: key.globalAngle, globalAltitude: key.globalAltitude };
                break;
            }
            default: throw new Error("Unsupported keyType value");
        }
        keyList.push({ Vrsn: 1, animInterpStyle: animInterpStyle, time: time, animKey: animKey, selected: selected });
    }
    return keyList;
}
function parseTrackList(trackList, logMissingFeatures) {
    var tracks = [];
    for (var i = 0; i < trackList.length; i++) {
        var tr = trackList[i];
        var track = {
            type: exports.stdTrackID.decode(tr.trackID),
            enabled: tr.enab,
            keys: parseKeyList(tr.keyList, logMissingFeatures),
        };
        if (tr.effectParams) {
            track.effectParams = {
                fillCanvas: tr.effectParams.fillCanvas,
                zoomOrigin: tr.effectParams.zoomOrigin,
                keys: parseKeyList(tr.effectParams.keyList, logMissingFeatures),
            };
        }
        tracks.push(track);
    }
    return tracks;
}
exports.parseTrackList = parseTrackList;
function serializeTrackList(tracks) {
    var trackList = [];
    for (var i = 0; i < tracks.length; i++) {
        var t = tracks[i];
        trackList.push(__assign(__assign({ trackID: exports.stdTrackID.encode(t.type), Vrsn: 1, enab: !!t.enabled, Effc: !!t.effectParams }, (t.effectParams ? {
            effectParams: {
                keyList: serializeKeyList(t.keys),
                fillCanvas: t.effectParams.fillCanvas,
                zoomOrigin: t.effectParams.zoomOrigin,
            }
        } : {})), { keyList: serializeKeyList(t.keys) }));
    }
    return trackList;
}
exports.serializeTrackList = serializeTrackList;
function parseEffectObject(obj, reportErrors) {
    var result = {};
    for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
        var key = _a[_i];
        var val = obj[key];
        switch (key) {
            case 'enab':
                result.enabled = !!val;
                break;
            case 'uglg':
                result.useGlobalLight = !!val;
                break;
            case 'AntA':
                result.antialiased = !!val;
                break;
            case 'Algn':
                result.align = !!val;
                break;
            case 'Dthr':
                result.dither = !!val;
                break;
            case 'Invr':
                result.invert = !!val;
                break;
            case 'Rvrs':
                result.reverse = !!val;
                break;
            case 'Clr ':
                result.color = parseColor(val);
                break;
            case 'hglC':
                result.highlightColor = parseColor(val);
                break;
            case 'sdwC':
                result.shadowColor = parseColor(val);
                break;
            case 'Styl':
                result.position = exports.FStl.decode(val);
                break;
            case 'Md  ':
                result.blendMode = exports.BlnM.decode(val);
                break;
            case 'hglM':
                result.highlightBlendMode = exports.BlnM.decode(val);
                break;
            case 'sdwM':
                result.shadowBlendMode = exports.BlnM.decode(val);
                break;
            case 'bvlS':
                result.style = exports.BESl.decode(val);
                break;
            case 'bvlD':
                result.direction = exports.BESs.decode(val);
                break;
            case 'bvlT':
                result.technique = exports.bvlT.decode(val);
                break;
            case 'GlwT':
                result.technique = exports.BETE.decode(val);
                break;
            case 'glwS':
                result.source = exports.IGSr.decode(val);
                break;
            case 'Type':
                result.type = exports.GrdT.decode(val);
                break;
            case 'gs99':
                result.interpolationMethod = exports.gradientInterpolationMethodType.decode(val);
                break;
            case 'Opct':
                result.opacity = parsePercent(val);
                break;
            case 'hglO':
                result.highlightOpacity = parsePercent(val);
                break;
            case 'sdwO':
                result.shadowOpacity = parsePercent(val);
                break;
            case 'lagl':
                result.angle = parseAngle(val);
                break;
            case 'Angl':
                result.angle = parseAngle(val);
                break;
            case 'Lald':
                result.altitude = parseAngle(val);
                break;
            case 'Sftn':
                result.soften = parseUnits(val);
                break;
            case 'srgR':
                result.strength = parsePercent(val);
                break;
            case 'blur':
                result.size = parseUnits(val);
                break;
            case 'Nose':
                result.noise = parsePercent(val);
                break;
            case 'Inpr':
                result.range = parsePercent(val);
                break;
            case 'Ckmt':
                result.choke = parseUnits(val);
                break;
            case 'ShdN':
                result.jitter = parsePercent(val);
                break;
            case 'Dstn':
                result.distance = parseUnits(val);
                break;
            case 'Scl ':
                result.scale = parsePercent(val);
                break;
            case 'Ptrn':
                result.pattern = { name: val['Nm  '], id: val.Idnt };
                break;
            case 'phase':
                result.phase = { x: val.Hrzn, y: val.Vrtc };
                break;
            case 'Ofst':
                result.offset = { x: parsePercent(val.Hrzn), y: parsePercent(val.Vrtc) };
                break;
            case 'MpgS':
            case 'TrnS':
                result.contour = {
                    name: val['Nm  '],
                    curve: val['Crv '].map(function (p) { return ({ x: p.Hrzn, y: p.Vrtc }); }),
                };
                break;
            case 'Grad':
                result.gradient = parseGradient(val);
                break;
            case 'useTexture':
            case 'useShape':
            case 'layerConceals':
            case 'present':
            case 'showInDialog':
            case 'antialiasGloss':
                result[key] = val;
                break;
            default:
                reportErrors && console.log("Invalid effect key: '".concat(key, "', value:"), val);
        }
    }
    return result;
}
function serializeEffectObject(obj, objName, reportErrors) {
    var result = {};
    for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
        var objKey = _a[_i];
        var key = objKey;
        var val = obj[key];
        switch (key) {
            case 'enabled':
                result.enab = !!val;
                break;
            case 'useGlobalLight':
                result.uglg = !!val;
                break;
            case 'antialiased':
                result.AntA = !!val;
                break;
            case 'align':
                result.Algn = !!val;
                break;
            case 'dither':
                result.Dthr = !!val;
                break;
            case 'invert':
                result.Invr = !!val;
                break;
            case 'reverse':
                result.Rvrs = !!val;
                break;
            case 'color':
                result['Clr '] = serializeColor(val);
                break;
            case 'highlightColor':
                result.hglC = serializeColor(val);
                break;
            case 'shadowColor':
                result.sdwC = serializeColor(val);
                break;
            case 'position':
                result.Styl = exports.FStl.encode(val);
                break;
            case 'blendMode':
                result['Md  '] = exports.BlnM.encode(val);
                break;
            case 'highlightBlendMode':
                result.hglM = exports.BlnM.encode(val);
                break;
            case 'shadowBlendMode':
                result.sdwM = exports.BlnM.encode(val);
                break;
            case 'style':
                result.bvlS = exports.BESl.encode(val);
                break;
            case 'direction':
                result.bvlD = exports.BESs.encode(val);
                break;
            case 'technique':
                if (objName === 'bevel') {
                    result.bvlT = exports.bvlT.encode(val);
                }
                else {
                    result.GlwT = exports.BETE.encode(val);
                }
                break;
            case 'source':
                result.glwS = exports.IGSr.encode(val);
                break;
            case 'type':
                result.Type = exports.GrdT.encode(val);
                break;
            case 'interpolationMethod':
                result.gs99 = exports.gradientInterpolationMethodType.encode(val);
                break;
            case 'opacity':
                result.Opct = unitsPercent(val);
                break;
            case 'highlightOpacity':
                result.hglO = unitsPercent(val);
                break;
            case 'shadowOpacity':
                result.sdwO = unitsPercent(val);
                break;
            case 'angle':
                if (objName === 'gradientOverlay') {
                    result.Angl = unitsAngle(val);
                }
                else {
                    result.lagl = unitsAngle(val);
                }
                break;
            case 'altitude':
                result.Lald = unitsAngle(val);
                break;
            case 'soften':
                result.Sftn = unitsValue(val, key);
                break;
            case 'strength':
                result.srgR = unitsPercent(val);
                break;
            case 'size':
                result.blur = unitsValue(val, key);
                break;
            case 'noise':
                result.Nose = unitsPercent(val);
                break;
            case 'range':
                result.Inpr = unitsPercent(val);
                break;
            case 'choke':
                result.Ckmt = unitsValue(val, key);
                break;
            case 'jitter':
                result.ShdN = unitsPercent(val);
                break;
            case 'distance':
                result.Dstn = unitsValue(val, key);
                break;
            case 'scale':
                result['Scl '] = unitsPercent(val);
                break;
            case 'pattern':
                result.Ptrn = { 'Nm  ': val.name, Idnt: val.id };
                break;
            case 'phase':
                result.phase = { Hrzn: val.x, Vrtc: val.y };
                break;
            case 'offset':
                result.Ofst = { Hrzn: unitsPercent(val.x), Vrtc: unitsPercent(val.y) };
                break;
            case 'contour': {
                result[objName === 'satin' ? 'MpgS' : 'TrnS'] = {
                    'Nm  ': val.name,
                    'Crv ': val.curve.map(function (p) { return ({ Hrzn: p.x, Vrtc: p.y }); }),
                };
                break;
            }
            case 'gradient':
                result.Grad = serializeGradient(val);
                break;
            case 'useTexture':
            case 'useShape':
            case 'layerConceals':
            case 'present':
            case 'showInDialog':
            case 'antialiasGloss':
                result[key] = val;
                break;
            default:
                reportErrors && console.log("Invalid effect key: '".concat(key, "', value:"), val);
        }
    }
    return result;
}
function parseGradient(grad) {
    if (grad.GrdF === 'GrdF.CstS') {
        var samples_1 = grad.Intr || 4096;
        return {
            type: 'solid',
            name: grad['Nm  '],
            smoothness: grad.Intr / 4096,
            colorStops: grad.Clrs.map(function (s) { return ({
                color: parseColor(s['Clr ']),
                location: s.Lctn / samples_1,
                midpoint: s.Mdpn / 100,
            }); }),
            opacityStops: grad.Trns.map(function (s) { return ({
                opacity: parsePercent(s.Opct),
                location: s.Lctn / samples_1,
                midpoint: s.Mdpn / 100,
            }); }),
        };
    }
    else {
        return {
            type: 'noise',
            name: grad['Nm  '],
            roughness: grad.Smth / 4096,
            colorModel: exports.ClrS.decode(grad.ClrS),
            randomSeed: grad.RndS,
            restrictColors: !!grad.VctC,
            addTransparency: !!grad.ShTr,
            min: grad['Mnm '].map(function (x) { return x / 100; }),
            max: grad['Mxm '].map(function (x) { return x / 100; }),
        };
    }
}
function serializeGradient(grad) {
    var _a, _b;
    if (grad.type === 'solid') {
        var samples_2 = Math.round(((_a = grad.smoothness) !== null && _a !== void 0 ? _a : 1) * 4096);
        return {
            'Nm  ': grad.name || '',
            GrdF: 'GrdF.CstS',
            Intr: samples_2,
            Clrs: grad.colorStops.map(function (s) {
                var _a;
                return ({
                    'Clr ': serializeColor(s.color),
                    Type: 'Clry.UsrS',
                    Lctn: Math.round(s.location * samples_2),
                    Mdpn: Math.round(((_a = s.midpoint) !== null && _a !== void 0 ? _a : 0.5) * 100),
                });
            }),
            Trns: grad.opacityStops.map(function (s) {
                var _a;
                return ({
                    Opct: unitsPercent(s.opacity),
                    Lctn: Math.round(s.location * samples_2),
                    Mdpn: Math.round(((_a = s.midpoint) !== null && _a !== void 0 ? _a : 0.5) * 100),
                });
            }),
        };
    }
    else {
        return {
            GrdF: 'GrdF.ClNs',
            'Nm  ': grad.name || '',
            ShTr: !!grad.addTransparency,
            VctC: !!grad.restrictColors,
            ClrS: exports.ClrS.encode(grad.colorModel),
            RndS: grad.randomSeed || 0,
            Smth: Math.round(((_b = grad.roughness) !== null && _b !== void 0 ? _b : 1) * 4096),
            'Mnm ': (grad.min || [0, 0, 0, 0]).map(function (x) { return x * 100; }),
            'Mxm ': (grad.max || [1, 1, 1, 1]).map(function (x) { return x * 100; }),
        };
    }
}
function parseGradientContent(descriptor) {
    var result = parseGradient(descriptor.Grad);
    result.style = exports.GrdT.decode(descriptor.Type);
    if (descriptor.Dthr !== undefined)
        result.dither = descriptor.Dthr;
    if (descriptor.Rvrs !== undefined)
        result.reverse = descriptor.Rvrs;
    if (descriptor.Angl !== undefined)
        result.angle = parseAngle(descriptor.Angl);
    if (descriptor['Scl '] !== undefined)
        result.scale = parsePercent(descriptor['Scl ']);
    if (descriptor.Algn !== undefined)
        result.align = descriptor.Algn;
    if (descriptor.Ofst !== undefined) {
        result.offset = {
            x: parsePercent(descriptor.Ofst.Hrzn),
            y: parsePercent(descriptor.Ofst.Vrtc)
        };
    }
    return result;
}
function parsePatternContent(descriptor) {
    var result = {
        name: descriptor.Ptrn['Nm  '],
        id: descriptor.Ptrn.Idnt,
    };
    if (descriptor.Lnkd !== undefined)
        result.linked = descriptor.Lnkd;
    if (descriptor.phase !== undefined)
        result.phase = { x: descriptor.phase.Hrzn, y: descriptor.phase.Vrtc };
    return result;
}
function parseVectorContent(descriptor) {
    if ('Grad' in descriptor) {
        return parseGradientContent(descriptor);
    }
    else if ('Ptrn' in descriptor) {
        return __assign({ type: 'pattern' }, parsePatternContent(descriptor));
    }
    else if ('Clr ' in descriptor) {
        return { type: 'color', color: parseColor(descriptor['Clr ']) };
    }
    else {
        throw new Error('Invalid vector content');
    }
}
exports.parseVectorContent = parseVectorContent;
function serializeGradientContent(content) {
    var result = {};
    if (content.dither !== undefined)
        result.Dthr = content.dither;
    if (content.reverse !== undefined)
        result.Rvrs = content.reverse;
    if (content.angle !== undefined)
        result.Angl = unitsAngle(content.angle);
    result.Type = exports.GrdT.encode(content.style);
    if (content.align !== undefined)
        result.Algn = content.align;
    if (content.scale !== undefined)
        result['Scl '] = unitsPercent(content.scale);
    if (content.offset) {
        result.Ofst = {
            Hrzn: unitsPercent(content.offset.x),
            Vrtc: unitsPercent(content.offset.y),
        };
    }
    result.Grad = serializeGradient(content);
    return result;
}
function serializePatternContent(content) {
    var result = {
        Ptrn: {
            'Nm  ': content.name || '',
            Idnt: content.id || '',
        }
    };
    if (content.linked !== undefined)
        result.Lnkd = !!content.linked;
    if (content.phase !== undefined)
        result.phase = { Hrzn: content.phase.x, Vrtc: content.phase.y };
    return result;
}
function serializeVectorContent(content) {
    if (content.type === 'color') {
        return { key: 'SoCo', descriptor: { 'Clr ': serializeColor(content.color) } };
    }
    else if (content.type === 'pattern') {
        return { key: 'PtFl', descriptor: serializePatternContent(content) };
    }
    else {
        return { key: 'GdFl', descriptor: serializeGradientContent(content) };
    }
}
exports.serializeVectorContent = serializeVectorContent;
function parseColor(color) {
    if ('H   ' in color) {
        return { h: parsePercentOrAngle(color['H   ']), s: color.Strt, b: color.Brgh };
    }
    else if ('Rd  ' in color) {
        return { r: color['Rd  '], g: color['Grn '], b: color['Bl  '] };
    }
    else if ('Cyn ' in color) {
        return { c: color['Cyn '], m: color.Mgnt, y: color['Ylw '], k: color.Blck };
    }
    else if ('Gry ' in color) {
        return { k: color['Gry '] };
    }
    else if ('Lmnc' in color) {
        return { l: color.Lmnc, a: color['A   '], b: color['B   '] };
    }
    else {
        throw new Error('Unsupported color descriptor');
    }
}
exports.parseColor = parseColor;
function serializeColor(color) {
    if (!color) {
        return { 'Rd  ': 0, 'Grn ': 0, 'Bl  ': 0 };
    }
    else if ('r' in color) {
        return { 'Rd  ': color.r || 0, 'Grn ': color.g || 0, 'Bl  ': color.b || 0 };
    }
    else if ('h' in color) {
        return { 'H   ': unitsAngle(color.h * 360), Strt: color.s || 0, Brgh: color.b || 0 };
    }
    else if ('c' in color) {
        return { 'Cyn ': color.c || 0, Mgnt: color.m || 0, 'Ylw ': color.y || 0, Blck: color.k || 0 };
    }
    else if ('l' in color) {
        return { Lmnc: color.l || 0, 'A   ': color.a || 0, 'B   ': color.b || 0 };
    }
    else if ('k' in color) {
        return { 'Gry ': color.k };
    }
    else {
        throw new Error('Invalid color value');
    }
}
exports.serializeColor = serializeColor;
function parseAngle(x) {
    if (x === undefined)
        return 0;
    if (x.units !== 'Angle')
        throw new Error("Invalid units: ".concat(x.units));
    return x.value;
}
exports.parseAngle = parseAngle;
function parsePercent(x) {
    if (x === undefined)
        return 1;
    if (x.units !== 'Percent')
        throw new Error("Invalid units: ".concat(x.units));
    return x.value / 100;
}
exports.parsePercent = parsePercent;
function parsePercentOrAngle(x) {
    if (x === undefined)
        return 1;
    if (x.units === 'Percent')
        return x.value / 100;
    if (x.units === 'Angle')
        return x.value / 360;
    throw new Error("Invalid units: ".concat(x.units));
}
exports.parsePercentOrAngle = parsePercentOrAngle;
function parseUnits(_a) {
    var units = _a.units, value = _a.value;
    if (units !== 'Pixels' && units !== 'Millimeters' && units !== 'Points' && units !== 'None' &&
        units !== 'Picas' && units !== 'Inches' && units !== 'Centimeters' && units !== 'Density') {
        throw new Error("Invalid units: ".concat(JSON.stringify({ units: units, value: value })));
    }
    return { value: value, units: units };
}
exports.parseUnits = parseUnits;
function parseUnitsOrNumber(value, units) {
    if (units === void 0) { units = 'Pixels'; }
    if (typeof value === 'number')
        return { value: value, units: units };
    return parseUnits(value);
}
exports.parseUnitsOrNumber = parseUnitsOrNumber;
function parseUnitsToNumber(_a, expectedUnits) {
    var units = _a.units, value = _a.value;
    if (units !== expectedUnits)
        throw new Error("Invalid units: ".concat(JSON.stringify({ units: units, value: value })));
    return value;
}
exports.parseUnitsToNumber = parseUnitsToNumber;
function unitsAngle(value) {
    return { units: 'Angle', value: value || 0 };
}
exports.unitsAngle = unitsAngle;
function unitsPercent(value) {
    return { units: 'Percent', value: Math.round((value || 0) * 100) };
}
exports.unitsPercent = unitsPercent;
function unitsValue(x, key) {
    if (x == null)
        return { units: 'Pixels', value: 0 };
    if (typeof x !== 'object')
        throw new Error("Invalid value: ".concat(JSON.stringify(x), " (key: ").concat(key, ") (should have value and units)"));
    var units = x.units, value = x.value;
    if (typeof value !== 'number')
        throw new Error("Invalid value in ".concat(JSON.stringify(x), " (key: ").concat(key, ")"));
    if (units !== 'Pixels' && units !== 'Millimeters' && units !== 'Points' && units !== 'None' &&
        units !== 'Picas' && units !== 'Inches' && units !== 'Centimeters' && units !== 'Density') {
        throw new Error("Invalid units in ".concat(JSON.stringify(x), " (key: ").concat(key, ")"));
    }
    return { units: units, value: value };
}
exports.unitsValue = unitsValue;
exports.textGridding = (0, helpers_1.createEnum)('textGridding', 'none', {
    none: 'None',
    round: 'Rnd ',
});
exports.Ornt = (0, helpers_1.createEnum)('Ornt', 'horizontal', {
    horizontal: 'Hrzn',
    vertical: 'Vrtc',
});
exports.Annt = (0, helpers_1.createEnum)('Annt', 'sharp', {
    none: 'Anno',
    sharp: 'antiAliasSharp',
    crisp: 'AnCr',
    strong: 'AnSt',
    smooth: 'AnSm',
    platform: 'antiAliasPlatformGray',
    platformLCD: 'antiAliasPlatformLCD',
});
exports.warpStyle = (0, helpers_1.createEnum)('warpStyle', 'none', {
    none: 'warpNone',
    arc: 'warpArc',
    arcLower: 'warpArcLower',
    arcUpper: 'warpArcUpper',
    arch: 'warpArch',
    bulge: 'warpBulge',
    shellLower: 'warpShellLower',
    shellUpper: 'warpShellUpper',
    flag: 'warpFlag',
    wave: 'warpWave',
    fish: 'warpFish',
    rise: 'warpRise',
    fisheye: 'warpFisheye',
    inflate: 'warpInflate',
    squeeze: 'warpSqueeze',
    twist: 'warpTwist',
    custom: 'warpCustom',
});
exports.BlnM = (0, helpers_1.createEnum)('BlnM', 'normal', {
    'normal': 'Nrml',
    'dissolve': 'Dslv',
    'darken': 'Drkn',
    'multiply': 'Mltp',
    'color burn': 'CBrn',
    'linear burn': 'linearBurn',
    'darker color': 'darkerColor',
    'lighten': 'Lghn',
    'screen': 'Scrn',
    'color dodge': 'CDdg',
    'linear dodge': 'linearDodge',
    'lighter color': 'lighterColor',
    'overlay': 'Ovrl',
    'soft light': 'SftL',
    'hard light': 'HrdL',
    'vivid light': 'vividLight',
    'linear light': 'linearLight',
    'pin light': 'pinLight',
    'hard mix': 'hardMix',
    'difference': 'Dfrn',
    'exclusion': 'Xclu',
    'subtract': 'blendSubtraction',
    'divide': 'blendDivide',
    'hue': 'H   ',
    'saturation': 'Strt',
    'color': 'Clr ',
    'luminosity': 'Lmns',
    // used in ABR
    'linear height': 'linearHeight',
    'height': 'Hght',
    'subtraction': 'Sbtr', // 2nd version of subtract ?
});
exports.BESl = (0, helpers_1.createEnum)('BESl', 'inner bevel', {
    'inner bevel': 'InrB',
    'outer bevel': 'OtrB',
    'emboss': 'Embs',
    'pillow emboss': 'PlEb',
    'stroke emboss': 'strokeEmboss',
});
exports.bvlT = (0, helpers_1.createEnum)('bvlT', 'smooth', {
    'smooth': 'SfBL',
    'chisel hard': 'PrBL',
    'chisel soft': 'Slmt',
});
exports.BESs = (0, helpers_1.createEnum)('BESs', 'up', {
    up: 'In  ',
    down: 'Out ',
});
exports.BETE = (0, helpers_1.createEnum)('BETE', 'softer', {
    softer: 'SfBL',
    precise: 'PrBL',
});
exports.IGSr = (0, helpers_1.createEnum)('IGSr', 'edge', {
    edge: 'SrcE',
    center: 'SrcC',
});
exports.GrdT = (0, helpers_1.createEnum)('GrdT', 'linear', {
    linear: 'Lnr ',
    radial: 'Rdl ',
    angle: 'Angl',
    reflected: 'Rflc',
    diamond: 'Dmnd',
});
exports.animInterpStyleEnum = (0, helpers_1.createEnum)('animInterpStyle', 'linear', {
    linear: 'Lnr ',
    hold: 'hold',
});
exports.stdTrackID = (0, helpers_1.createEnum)('stdTrackID', 'opacity', {
    opacity: 'opacityTrack',
    style: 'styleTrack',
    sheetTransform: 'sheetTransformTrack',
    sheetPosition: 'sheetPositionTrack',
    globalLighting: 'globalLightingTrack',
});
exports.gradientInterpolationMethodType = (0, helpers_1.createEnum)('gradientInterpolationMethodType', 'perceptual', {
    perceptual: 'Perc',
    linear: 'Lnr',
    classic: 'Gcls',
});
exports.ClrS = (0, helpers_1.createEnum)('ClrS', 'rgb', {
    rgb: 'RGBC',
    hsb: 'HSBl',
    lab: 'LbCl',
});
exports.FStl = (0, helpers_1.createEnum)('FStl', 'outside', {
    outside: 'OutF',
    center: 'CtrF',
    inside: 'InsF'
});
exports.FrFl = (0, helpers_1.createEnum)('FrFl', 'color', {
    color: 'SClr',
    gradient: 'GrFl',
    pattern: 'Ptrn',
});
exports.strokeStyleLineCapType = (0, helpers_1.createEnum)('strokeStyleLineCapType', 'butt', {
    butt: 'strokeStyleButtCap',
    round: 'strokeStyleRoundCap',
    square: 'strokeStyleSquareCap',
});
exports.strokeStyleLineJoinType = (0, helpers_1.createEnum)('strokeStyleLineJoinType', 'miter', {
    miter: 'strokeStyleMiterJoin',
    round: 'strokeStyleRoundJoin',
    bevel: 'strokeStyleBevelJoin',
});
exports.strokeStyleLineAlignment = (0, helpers_1.createEnum)('strokeStyleLineAlignment', 'inside', {
    inside: 'strokeStyleAlignInside',
    center: 'strokeStyleAlignCenter',
    outside: 'strokeStyleAlignOutside',
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,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Q0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDbkQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDbkQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDdEQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDcEQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDeEQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDbEQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDckQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDckQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDbkQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDdEQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDdEQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDckQsS0FBSyxNQUFNO2dCQUFF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QUUsTUFBTSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDekQsS0FBSyxVQUFVO2dCQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDeEQsS0FBSyxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQ3ZELEtBQUssT0FBTztnQkFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQ3JELEtBQUssT0FBTztnQkFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQ3JELEtBQUssT0FBTztnQkFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUN4RCxLQUFLLFFBQVE7Z0JBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUN0RCxLQUFLLFVBQVU7Z0JBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUFDLE1BQU07WUFDM0QsS0FBSyxPQUFPO2dCQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUN4RCxLQUFLLFNBQVM7Z0JBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQUMsTUFBTTtZQUN4RSxLQUFLLE9BQU87Z0JBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxFQUFFLElB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QUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDL0U7U0FBTSxJQUFJLE1BQU0sSUFBSSxLQUFLLEVBQUU7UUFDM0IsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7S0FDaEU7U0FBTSxJQUFJLE1BQU0sSUFBSSxLQUFLLEVBQUU7UUFDM0IsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQzVFO1NBQU0sSUFBSSxNQUFNLElBQUksS0FBSyxFQUFFO1FBQzNCLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7S0FDNUI7U0FBTSxJQUFJLE1BQU0sSUFBSSxLQUFLLEVBQUU7UUFDM0IsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO0tBQzdEO1NBQU07UUFDTixNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7S0FDaEQ7QUFDRixDQUFDO0FBZEQsZ0NBY0M7QUFFRCxTQUFnQixjQUFjLENBQUMsS0FBd0I7SUFDdEQsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNYLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO0tBQzNDO1NBQU0sSUFBSSxHQUFHLElBQUksS0FBSyxFQUFF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RTtJQUN2RyxNQUFNLEVBQUUsd0JBQXdCO0lBQ2hDLE1BQU0sRUFBRSx3QkFBd0I7SUFDaEMsT0FBTyxFQUFFLHlCQUF5QjtDQUNsQyxDQUFDLENBQUMiLCJmaWxlIjoiZGVzY3JpcHRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZUVudW0gfSBmcm9tICcuL2hlbHBlcnMnO1xyXG5pbXBvcnQge1xyXG5cdEFudGlBbGlhcywgQmV2ZWxEaXJlY3Rpb24sIEJldmVsU3R5bGUsIEJldmVsVGVjaG5pcXVlLCBCbGVuZE1vZGUsIENvbG9yLCBFZmZlY3RDb250b3VyLFxyXG5cdEVmZmVjdE5vaXNlR3JhZGllbnQsIEVmZmVjdFBhdHRlcm4sIEVmZmVjdFNvbGlkR3JhZGllbnQsIEV4dHJhR3JhZGllbnRJbmZvLCBFeHRyYVBhdHRlcm5JbmZvLFxyXG5cdEdsb3dTb3VyY2UsIEdsb3dUZWNobmlxdWUsIEdyYWRpZW50U3R5bGUsIEludGVycG9sYXRpb25NZXRob2QsIExheWVyRWZmZWN0QmV2ZWwsXHJcblx0TGF5ZXJFZmZlY3RHcmFkaWVudE92ZXJsYXksIExheWVyRWZmZWN0SW5uZXJHbG93LCBMYXllckVmZmVjdFBhdHRlcm5PdmVybGF5LFxyXG5cdExheWVyRWZmZWN0U2F0aW4sIExheWVyRWZmZWN0U2hhZG93LCBMYXllckVmZmVjdHNJbmZvLCBMYXllckVmZmVjdFNvbGlkRmlsbCxcclxuXHRMYXllckVmZmVjdHNPdXRlckdsb3csIExheWVyRWZmZWN0U3Ryb2tlLCBMaW5lQWxpZ25tZW50LCBMaW5lQ2FwVHlwZSwgTGluZUpvaW5UeXBlLFxyXG5cdE9yaWVudGF0aW9uLCBUZXh0R3JpZGRpbmcsIFRpbWVsaW5lS2V5LCBUaW1lbGluZUtleUludGVycG9sYXRpb24sIFRpbWVsaW5lVHJhY2ssIFRpbWVsaW5lVHJhY2tUeXBlLFxyXG5cdFVuaXRzLCBVbml0c1ZhbHVlLCBWZWN0b3JDb250ZW50LCBXYXJwU3R5bGVcclxufSBmcm9tICcuL3BzZCc7XHJcbmltcG9ydCB7XHJcblx0UHNkUmVhZGVyLCByZWFkU2lnbmF0dXJlLCByZWFkVW5pY29kZVN0cmluZywgcmVhZFVpbnQzMiwgcmVhZFVpbnQ4LCByZWFkRmxvYXQ2NCxcclxuXHRyZWFkQnl0ZXMsIHJlYWRBc2NpaVN0cmluZywgcmVhZEludDMyLCByZWFkRmxvYXQzMiwgcmVhZEludDMyTEUsIHJlYWRVbmljb2RlU3RyaW5nV2l0aExlbmd0aFxyXG59IGZyb20gJy4vcHNkUmVhZGVyJztcclxuaW1wb3J0IHtcclxuXHRQc2RXcml0ZXIsIHdyaXRlU2lnbmF0dXJlLCB3cml0ZUJ5dGVzLCB3cml0ZVVpbnQzMiwgd3JpdGVGbG9hdDY0LCB3cml0ZVVpbnQ4LFxyXG5cdHdyaXRlVW5pY29kZVN0cmluZ1dpdGhQYWRkaW5nLCB3cml0ZUludDMyLCB3cml0ZUZsb2F0MzIsIHdyaXRlVW5pY29kZVN0cmluZ1xyXG59IGZyb20gJy4vcHNkV3JpdGVyJztcclxuXHJcbmludGVyZmFjZSBEaWN0IHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9XHJcbmludGVyZmFjZSBOYW1lQ2xhc3NJRCB7IG5hbWU6IHN0cmluZzsgY2xhc3NJRDogc3RyaW5nOyB9XHJcbmludGVyZmFjZSBFeHRUeXBlRGljdCB7IFtrZXk6IHN0cmluZ106IE5hbWVDbGFzc0lEOyB9XHJcblxyXG5mdW5jdGlvbiByZXZNYXAobWFwOiBEaWN0KSB7XHJcblx0Y29uc3QgcmVzdWx0OiBEaWN0ID0ge307XHJcblx0T2JqZWN0LmtleXMobWFwKS5mb3JFYWNoKGtleSA9PiByZXN1bHRbbWFwW2tleV1dID0ga2V5KTtcclxuXHRyZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5jb25zdCB1bml0c01hcDogRGljdCA9IHtcclxuXHQnI0FuZyc6ICdBbmdsZScsXHJcblx0JyNSc2wnOiAnRGVuc2l0eScsXHJcblx0JyNSbHQnOiAnRGlzdGFuY2UnLFxyXG5cdCcjTm5lJzogJ05vbmUnLFxyXG5cdCcjUHJjJzogJ1BlcmNlbnQnLFxyXG5cdCcjUHhsJzogJ1BpeGVscycsXHJcblx0JyNNbG0nOiAnTWlsbGltZXRlcnMnLFxyXG5cdCcjUG50JzogJ1BvaW50cycsXHJcblx0J1JyUGknOiAnUGljYXMnLFxyXG5cdCdSckluJzogJ0luY2hlcycsXHJcblx0J1JyQ20nOiAnQ2VudGltZXRlcnMnLFxyXG59O1xyXG5cclxuY29uc3QgdW5pdHNNYXBSZXYgPSByZXZNYXAodW5pdHNNYXApO1xyXG5sZXQgbG9nRXJyb3JzID0gZmFsc2U7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0TG9nRXJyb3JzKHZhbHVlOiBib29sZWFuKSB7XHJcblx0bG9nRXJyb3JzID0gdmFsdWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VUeXBlKG5hbWU6IHN0cmluZywgY2xhc3NJRDogc3RyaW5nKSB7XHJcblx0cmV0dXJuIHsgbmFtZSwgY2xhc3NJRCB9O1xyXG59XHJcblxyXG5jb25zdCBudWxsVHlwZSA9IG1ha2VUeXBlKCcnLCAnbnVsbCcpO1xyXG5cclxuY29uc3QgZmllbGRUb0V4dFR5cGU6IEV4dFR5cGVEaWN0ID0ge1xyXG5cdHN0cm9rZVN0eWxlQ29udGVudDogbWFrZVR5cGUoJycsICdzb2xpZENvbG9yTGF5ZXInKSxcclxuXHQvLyBwcmludFByb29mU2V0dXA6IG1ha2VUeXBlKCfmoKHmoLforr7nva4nLCAncHJvb2ZTZXR1cCcpLCAvLyBURVNUSU5HXHJcblx0cHJpbnRQcm9vZlNldHVwOiBtYWtlVHlwZSgnUHJvb2YgU2V0dXAnLCAncHJvb2ZTZXR1cCcpLFxyXG5cdHBhdHRlcm5GaWxsOiBtYWtlVHlwZSgnJywgJ3BhdHRlcm5GaWxsJyksXHJcblx0R3JhZDogbWFrZVR5cGUoJ0dyYWRpZW50JywgJ0dyZG4nKSxcclxuXHRlYmJsOiBtYWtlVHlwZSgnJywgJ2ViYmwnKSxcclxuXHRTb0ZpOiBtYWtlVHlwZSgnJywgJ1NvRmknKSxcclxuXHRHckZsOiBtYWtlVHlwZSgnJywgJ0dyRmwnKSxcclxuXHRzZHdDOiBtYWtlVHlwZSgnJywgJ1JHQkMnKSxcclxuXHRoZ2xDOiBtYWtlVHlwZSgnJywgJ1JHQkMnKSxcclxuXHQnQ2xyICc6IG1ha2VUeXBlKCcnLCAnUkdCQycpLFxyXG5cdCd0aW50Q29sb3InOiBtYWtlVHlwZSgnJywgJ1JHQkMnKSxcclxuXHRPZnN0OiBtYWtlVHlwZSgnJywgJ1BudCAnKSxcclxuXHRDaEZYOiBtYWtlVHlwZSgnJywgJ0NoRlgnKSxcclxuXHRNcGdTOiBtYWtlVHlwZSgnJywgJ1NocEMnKSxcclxuXHREclNoOiBtYWtlVHlwZSgnJywgJ0RyU2gnKSxcclxuXHRJclNoOiBtYWtlVHlwZSgnJywgJ0lyU2gnKSxcclxuXHRPckdsOiBtYWtlVHlwZSgnJywgJ09yR2wnKSxcclxuXHRJckdsOiBtYWtlVHlwZSgnJywgJ0lyR2wnKSxcclxuXHRUcm5TOiBtYWtlVHlwZSgnJywgJ1NocEMnKSxcclxuXHRQdHJuOiBtYWtlVHlwZSgnJywgJ1B0cm4nKSxcclxuXHRGckZYOiBtYWtlVHlwZSgnJywgJ0ZyRlgnKSxcclxuXHRwaGFzZTogbWFrZVR5cGUoJycsICdQbnQgJyksXHJcblx0ZnJhbWVTdGVwOiBudWxsVHlwZSxcclxuXHRkdXJhdGlvbjogbnVsbFR5cGUsXHJcblx0d29ya0luVGltZTogbnVsbFR5cGUsXHJcblx0d29ya091dFRpbWU6IG51bGxUeXBlLFxyXG5cdGF1ZGlvQ2xpcEdyb3VwTGlzdDogbnVsbFR5cGUsXHJcblx0Ym91bmRzOiBtYWtlVHlwZSgnJywgJ1JjdG4nKSxcclxuXHRjdXN0b21FbnZlbG9wZVdhcnA6IG1ha2VUeXBlKCcnLCAnY3VzdG9tRW52ZWxvcGVXYXJwJyksXHJcblx0d2FycDogbWFrZVR5cGUoJycsICd3YXJwJyksXHJcblx0J1N6ICAnOiBtYWtlVHlwZSgnJywgJ1BudCAnKSxcclxuXHRvcmlnaW46IG1ha2VUeXBlKCcnLCAnUG50ICcpLFxyXG5cdGF1dG9FeHBhbmRPZmZzZXQ6IG1ha2VUeXBlKCcnLCAnUG50ICcpLFxyXG5cdGtleU9yaWdpblNoYXBlQkJveDogbWFrZVR5cGUoJycsICd1bml0UmVjdCcpLFxyXG5cdFZyc246IG51bGxUeXBlLFxyXG5cdHBzVmVyc2lvbjogbnVsbFR5cGUsXHJcblx0ZG9jRGVmYXVsdE5ld0FydGJvYXJkQmFja2dyb3VuZENvbG9yOiBtYWtlVHlwZSgnJywgJ1JHQkMnKSxcclxuXHRhcnRib2FyZFJlY3Q6IG1ha2VUeXBlKCcnLCAnY2xhc3NGbG9hdFJlY3QnKSxcclxuXHRrZXlPcmlnaW5SUmVjdFJhZGlpOiBtYWtlVHlwZSgnJywgJ3JhZGlpJyksXHJcblx0a2V5T3JpZ2luQm94Q29ybmVyczogbnVsbFR5cGUsXHJcblx0cmVjdGFuZ2xlQ29ybmVyQTogbWFrZVR5cGUoJycsICdQbnQgJyksXHJcblx0cmVjdGFuZ2xlQ29ybmVyQjogbWFrZVR5cGUoJycsICdQbnQgJyksXHJcblx0cmVjdGFuZ2xlQ29ybmVyQzogbWFrZVR5cGUoJycsICdQbnQgJyksXHJcblx0cmVjdGFuZ2xlQ29ybmVyRDogbWFrZVR5cGUoJycsICdQbnQgJyksXHJcblx0Y29tcEluZm86IG51bGxUeXBlLFxyXG5cdFRybmY6IG1ha2VUeXBlKCdUcmFuc2Zvcm0nLCAnVHJuZicpLFxyXG5cdHF1aWx0V2FycDogbWFrZVR5cGUoJycsICdxdWlsdFdhcnAnKSxcclxuXHRnZW5lcmF0b3JTZXR0aW5nczogbnVsbFR5cGUsXHJcblx0Y3JlbWE6IG51bGxUeXBlLFxyXG5cdEZySW46IG51bGxUeXBlLFxyXG5cdGJsZW5kT3B0aW9uczogbnVsbFR5cGUsXHJcblx0RlhSZjogbnVsbFR5cGUsXHJcblx0TGVmeDogbnVsbFR5cGUsXHJcblx0dGltZTogbnVsbFR5cGUsXHJcblx0YW5pbUtleTogbnVsbFR5cGUsXHJcblx0dGltZVNjb3BlOiBudWxsVHlwZSxcclxuXHRpblRpbWU6IG51bGxUeXBlLFxyXG5cdG91dFRpbWU6IG51bGxUeXBlLFxyXG5cdHNoZWV0U3R5bGU6IG51bGxUeXBlLFxyXG5cdHRyYW5zbGF0aW9uOiBudWxsVHlwZSxcclxuXHRTa2V3OiBudWxsVHlwZSxcclxuXHQnTG5rICc6IG1ha2VUeXBlKCcnLCAnRXh0ZXJuYWxGaWxlTGluaycpLFxyXG5cdGZyYW1lUmVhZGVyOiBtYWtlVHlwZSgnJywgJ0ZyYW1lUmVhZGVyJyksXHJcblx0ZWZmZWN0UGFyYW1zOiBtYWtlVHlwZSgnJywgJ21vdGlvblRyYWNrRWZmZWN0UGFyYW1zJyksXHJcbn07XHJcblxyXG5jb25zdCBmaWVsZFRvQXJyYXlFeHRUeXBlOiBFeHRUeXBlRGljdCA9IHtcclxuXHQnQ3J2ICc6IG1ha2VUeXBlKCcnLCAnQ3JQdCcpLFxyXG5cdENscnM6IG1ha2VUeXBlKCcnLCAnQ2xydCcpLFxyXG5cdFRybnM6IG1ha2VUeXBlKCcnLCAnVHJuUycpLFxyXG5cdGtleURlc2NyaXB0b3JMaXN0OiBudWxsVHlwZSxcclxuXHRzb2xpZEZpbGxNdWx0aTogbWFrZVR5cGUoJycsICdTb0ZpJyksXHJcblx0Z3JhZGllbnRGaWxsTXVsdGk6IG1ha2VUeXBlKCcnLCAnR3JGbCcpLFxyXG5cdGRyb3BTaGFkb3dNdWx0aTogbWFrZVR5cGUoJycsICdEclNoJyksXHJcblx0aW5uZXJTaGFkb3dNdWx0aTogbWFrZVR5cGUoJycsICdJclNoJyksXHJcblx0ZnJhbWVGWE11bHRpOiBtYWtlVHlwZSgnJywgJ0ZyRlgnKSxcclxuXHRGckluOiBudWxsVHlwZSxcclxuXHRGU3RzOiBudWxsVHlwZSxcclxuXHRMYVN0OiBudWxsVHlwZSxcclxuXHRzaGVldFRpbWVsaW5lT3B0aW9uczogbnVsbFR5cGUsXHJcblx0dHJhY2tMaXN0OiBtYWtlVHlwZSgnJywgJ2FuaW1hdGlvblRyYWNrJyksXHJcblx0Z2xvYmFsVHJhY2tMaXN0OiBtYWtlVHlwZSgnJywgJ2FuaW1hdGlvblRyYWNrJyksXHJcblx0a2V5TGlzdDogbnVsbFR5cGUsXHJcblx0YXVkaW9DbGlwR3JvdXBMaXN0OiBudWxsVHlwZSxcclxuXHRhdWRpb0NsaXBMaXN0OiBudWxsVHlwZSxcclxufTtcclxuXHJcbmNvbnN0IHR5cGVUb0ZpZWxkOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZ1tdOyB9ID0ge1xyXG5cdCdURVhUJzogW1xyXG5cdFx0J1R4dCAnLCAncHJpbnRlck5hbWUnLCAnTm0gICcsICdJZG50JywgJ2JsYWNrQW5kV2hpdGVQcmVzZXRGaWxlTmFtZScsICdMVVQzREZpbGVOYW1lJyxcclxuXHRcdCdwcmVzZXRGaWxlTmFtZScsICdjdXJ2ZXNQcmVzZXRGaWxlTmFtZScsICdtaXhlclByZXNldEZpbGVOYW1lJywgJ3BsYWNlZCcsICdkZXNjcmlwdGlvbicsICdyZWFzb24nLFxyXG5cdFx0J2FydGJvYXJkUHJlc2V0TmFtZScsICdqc29uJywgJ2dyb3VwSUQnLCAnY2xpcElEJywgJ3JlbFBhdGgnLCAnZnVsbFBhdGgnLCAnbWVkaWFEZXNjcmlwdG9yJyxcclxuXHRdLFxyXG5cdCd0ZHRhJzogWydFbmdpbmVEYXRhJywgJ0xVVDNERmlsZURhdGEnXSxcclxuXHQnbG9uZyc6IFtcclxuXHRcdCdUZXh0SW5kZXgnLCAnUm5kUycsICdNZHBuJywgJ1NtdGgnLCAnTGN0bicsICdzdHJva2VTdHlsZVZlcnNpb24nLCAnTGFJRCcsICdWcnNuJywgJ0NudCAnLFxyXG5cdFx0J0JyZ2gnLCAnQ250cicsICdtZWFucycsICd2aWJyYW5jZScsICdTdHJ0JywgJ2J3UHJlc2V0S2luZCcsICdwcmVzZXRLaW5kJywgJ2NvbXAnLCAnY29tcElEJywgJ29yaWdpbmFsQ29tcElEJyxcclxuXHRcdCdjdXJ2ZXNQcmVzZXRLaW5kJywgJ21peGVyUHJlc2V0S2luZCcsICd1T3JkZXInLCAndk9yZGVyJywgJ1BnTm0nLCAndG90YWxQYWdlcycsICdDcm9wJyxcclxuXHRcdCdudW1lcmF0b3InLCAnZGVub21pbmF0b3InLCAnZnJhbWVDb3VudCcsICdBbm50JywgJ2tleU9yaWdpblR5cGUnLCAndW5pdFZhbHVlUXVhZFZlcnNpb24nLFxyXG5cdFx0J2tleU9yaWdpbkluZGV4JywgJ21ham9yJywgJ21pbm9yJywgJ2ZpeCcsICdkb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kVHlwZScsICdhcnRib2FyZEJhY2tncm91bmRUeXBlJyxcclxuXHRcdCdudW1Nb2RpZnlpbmdGWCcsICdkZWZvcm1OdW1Sb3dzJywgJ2RlZm9ybU51bUNvbHMnLCAnRnJJRCcsICdGckRsJywgJ0ZzSUQnLCAnTENudCcsICdBRnJtJywgJ0FGU3QnLFxyXG5cdFx0J251bUJlZm9yZScsICdudW1BZnRlcicsICdTcGNuJywgJ21pbk9wYWNpdHknLCAnbWF4T3BhY2l0eScsICdCbG5NJywgJ3NoZWV0SUQnLCAnZ2JsQScsICdnbG9iYWxBbHRpdHVkZScsXHJcblx0XHQnZGVzY1ZlcnNpb24nLCAnZnJhbWVSZWFkZXJUeXBlJywgJ0x5ckknLCAnem9vbU9yaWdpbicsXHJcblx0XSxcclxuXHQnZW51bSc6IFtcclxuXHRcdCd0ZXh0R3JpZGRpbmcnLCAnT3JudCcsICd3YXJwU3R5bGUnLCAnd2FycFJvdGF0ZScsICdJbnRlJywgJ0JsdG4nLCAnQ2xyUycsXHJcblx0XHQnc2R3TScsICdoZ2xNJywgJ2J2bFQnLCAnYnZsUycsICdidmxEJywgJ01kICAnLCAnZ2x3UycsICdHcmRGJywgJ0dsd1QnLFxyXG5cdFx0J3N0cm9rZVN0eWxlTGluZUNhcFR5cGUnLCAnc3Ryb2tlU3R5bGVMaW5lSm9pblR5cGUnLCAnc3Ryb2tlU3R5bGVMaW5lQWxpZ25tZW50JyxcclxuXHRcdCdzdHJva2VTdHlsZUJsZW5kTW9kZScsICdQbnRUJywgJ1N0eWwnLCAnbG9va3VwVHlwZScsICdMVVRGb3JtYXQnLCAnZGF0YU9yZGVyJyxcclxuXHRcdCd0YWJsZU9yZGVyJywgJ2VuYWJsZUNvbXBDb3JlJywgJ2VuYWJsZUNvbXBDb3JlR1BVJywgJ2NvbXBDb3JlU3VwcG9ydCcsICdjb21wQ29yZUdQVVN1cHBvcnQnLCAnRW5nbicsXHJcblx0XHQnZW5hYmxlQ29tcENvcmVUaHJlYWRzJywgJ2dzOTknLCAnRnJEcycsICd0cmFja0lEJywgJ2FuaW1JbnRlcnBTdHlsZScsXHJcblx0XSxcclxuXHQnYm9vbCc6IFtcclxuXHRcdCdQc3RTJywgJ3ByaW50U2l4dGVlbkJpdCcsICdtYXN0ZXJGWFN3aXRjaCcsICdlbmFiJywgJ3VnbGcnLCAnYW50aWFsaWFzR2xvc3MnLFxyXG5cdFx0J3VzZVNoYXBlJywgJ3VzZVRleHR1cmUnLCAndWdsZycsICdhbnRpYWxpYXNHbG9zcycsICd1c2VTaGFwZScsXHJcblx0XHQndXNlVGV4dHVyZScsICdBbGduJywgJ1J2cnMnLCAnRHRocicsICdJbnZyJywgJ1ZjdEMnLCAnU2hUcicsICdsYXllckNvbmNlYWxzJyxcclxuXHRcdCdzdHJva2VFbmFibGVkJywgJ2ZpbGxFbmFibGVkJywgJ3N0cm9rZVN0eWxlU2NhbGVMb2NrJywgJ3N0cm9rZVN0eWxlU3Ryb2tlQWRqdXN0JyxcclxuXHRcdCdoYXJkUHJvb2YnLCAnTXBCbCcsICdwYXBlcldoaXRlJywgJ3VzZUxlZ2FjeScsICdBdXRvJywgJ0xhYiAnLCAndXNlVGludCcsICdrZXlTaGFwZUludmFsaWRhdGVkJyxcclxuXHRcdCdhdXRvRXhwYW5kRW5hYmxlZCcsICdhdXRvTmVzdEVuYWJsZWQnLCAnYXV0b1Bvc2l0aW9uRW5hYmxlZCcsICdzaHJpbmt3cmFwT25TYXZlRW5hYmxlZCcsXHJcblx0XHQncHJlc2VudCcsICdzaG93SW5EaWFsb2cnLCAnb3ZlcnByaW50JywgJ3NoZWV0RGlzY2xvc2VkJywgJ2xpZ2h0c0Rpc2Nsb3NlZCcsICdtZXNoZXNEaXNjbG9zZWQnLFxyXG5cdFx0J21hdGVyaWFsc0Rpc2Nsb3NlZCcsICdoYXNNb3Rpb24nLCAnbXV0ZWQnLCAnRWZmYycsICdzZWxlY3RlZCcsICdhdXRvU2NvcGUnLCAnZmlsbENhbnZhcycsXHJcblx0XSxcclxuXHQnZG91Yic6IFtcclxuXHRcdCd3YXJwVmFsdWUnLCAnd2FycFBlcnNwZWN0aXZlJywgJ3dhcnBQZXJzcGVjdGl2ZU90aGVyJywgJ0ludHInLCAnV2R0aCcsICdIZ2h0JyxcclxuXHRcdCdzdHJva2VTdHlsZU1pdGVyTGltaXQnLCAnc3Ryb2tlU3R5bGVSZXNvbHV0aW9uJywgJ2xheWVyVGltZScsICdrZXlPcmlnaW5SZXNvbHV0aW9uJyxcclxuXHRcdCd4eCcsICd4eScsICd5eCcsICd5eScsICd0eCcsICd0eScsICdGckdBJywgJ2ZyYW1lUmF0ZScsICdhdWRpb0xldmVsJywgJ3JvdGF0aW9uJyxcclxuXHRdLFxyXG5cdCdVbnRGJzogW1xyXG5cdFx0J1NjbCAnLCAnc2R3TycsICdoZ2xPJywgJ2xhZ2wnLCAnTGFsZCcsICdzcmdSJywgJ2JsdXInLCAnU2Z0bicsICdPcGN0JywgJ0RzdG4nLCAnQW5nbCcsXHJcblx0XHQnQ2ttdCcsICdOb3NlJywgJ0lucHInLCAnU2hkTicsICdzdHJva2VTdHlsZUxpbmVXaWR0aCcsICdzdHJva2VTdHlsZUxpbmVEYXNoT2Zmc2V0JyxcclxuXHRcdCdzdHJva2VTdHlsZU9wYWNpdHknLCAnSCAgICcsICdUb3AgJywgJ0xlZnQnLCAnQnRvbScsICdSZ2h0JywgJ1JzbHQnLFxyXG5cdFx0J3RvcFJpZ2h0JywgJ3RvcExlZnQnLCAnYm90dG9tTGVmdCcsICdib3R0b21SaWdodCcsXHJcblx0XSxcclxuXHQnVmxMcyc6IFtcclxuXHRcdCdDcnYgJywgJ0NscnMnLCAnTW5tICcsICdNeG0gJywgJ1RybnMnLCAncGF0aExpc3QnLCAnc3Ryb2tlU3R5bGVMaW5lRGFzaFNldCcsICdGckxzJyxcclxuXHRcdCdMYVN0JywgJ1RybmYnLCAnbm9uQWZmaW5lVHJhbnNmb3JtJywgJ2tleURlc2NyaXB0b3JMaXN0JywgJ2d1aWRlSW5kZWNlcycsICdncmFkaWVudEZpbGxNdWx0aScsXHJcblx0XHQnc29saWRGaWxsTXVsdGknLCAnZnJhbWVGWE11bHRpJywgJ2lubmVyU2hhZG93TXVsdGknLCAnZHJvcFNoYWRvd011bHRpJywgJ0ZySW4nLCAnRlN0cycsICdGc0ZyJyxcclxuXHRcdCdzaGVldFRpbWVsaW5lT3B0aW9ucycsICdhdWRpb0NsaXBMaXN0JywgJ3RyYWNrTGlzdCcsICdnbG9iYWxUcmFja0xpc3QnLCAna2V5TGlzdCcsICdhdWRpb0NsaXBMaXN0JyxcclxuXHRdLFxyXG5cdCdPYkFyJzogWydtZXNoUG9pbnRzJywgJ3F1aWx0U2xpY2VYJywgJ3F1aWx0U2xpY2VZJ10sXHJcblx0J29iaiAnOiBbJ251bGwnXSxcclxufTtcclxuXHJcbmNvbnN0IGNoYW5uZWxzID0gW1xyXG5cdCdSZCAgJywgJ0dybiAnLCAnQmwgICcsICdZbGx3JywgJ1lsdyAnLCAnQ3luICcsICdNZ250JywgJ0JsY2snLCAnR3J5ICcsICdMbW5jJywgJ0EgICAnLCAnQiAgICcsXHJcbl07XHJcblxyXG5jb25zdCBmaWVsZFRvQXJyYXlUeXBlOiBEaWN0ID0ge1xyXG5cdCdNbm0gJzogJ2xvbmcnLFxyXG5cdCdNeG0gJzogJ2xvbmcnLFxyXG5cdCdGckxzJzogJ2xvbmcnLFxyXG5cdCdzdHJva2VTdHlsZUxpbmVEYXNoU2V0JzogJ1VudEYnLFxyXG5cdCdUcm5mJzogJ2RvdWInLFxyXG5cdCdub25BZmZpbmVUcmFuc2Zvcm0nOiAnZG91YicsXHJcblx0J2tleURlc2NyaXB0b3JMaXN0JzogJ09iamMnLFxyXG5cdCdncmFkaWVudEZpbGxNdWx0aSc6ICdPYmpjJyxcclxuXHQnc29saWRGaWxsTXVsdGknOiAnT2JqYycsXHJcblx0J2ZyYW1lRlhNdWx0aSc6ICdPYmpjJyxcclxuXHQnaW5uZXJTaGFkb3dNdWx0aSc6ICdPYmpjJyxcclxuXHQnZHJvcFNoYWRvd011bHRpJzogJ09iamMnLFxyXG5cdCdMYVN0JzogJ09iamMnLFxyXG5cdCdGckluJzogJ09iamMnLFxyXG5cdCdGU3RzJzogJ09iamMnLFxyXG5cdCdGc0ZyJzogJ2xvbmcnLFxyXG5cdCdibGVuZE9wdGlvbnMnOiAnT2JqYycsXHJcblx0J3NoZWV0VGltZWxpbmVPcHRpb25zJzogJ09iamMnLFxyXG5cdCdrZXlMaXN0JzogJ09iamMnLFxyXG59O1xyXG5cclxuY29uc3QgZmllbGRUb1R5cGU6IERpY3QgPSB7fTtcclxuXHJcbmZvciAoY29uc3QgdHlwZSBvZiBPYmplY3Qua2V5cyh0eXBlVG9GaWVsZCkpIHtcclxuXHRmb3IgKGNvbnN0IGZpZWxkIG9mIHR5cGVUb0ZpZWxkW3R5cGVdKSB7XHJcblx0XHRmaWVsZFRvVHlwZVtmaWVsZF0gPSB0eXBlO1xyXG5cdH1cclxufVxyXG5cclxuZm9yIChjb25zdCBmaWVsZCBvZiBPYmplY3Qua2V5cyhmaWVsZFRvRXh0VHlwZSkpIHtcclxuXHRpZiAoIWZpZWxkVG9UeXBlW2ZpZWxkXSkgZmllbGRUb1R5cGVbZmllbGRdID0gJ09iamMnO1xyXG59XHJcblxyXG5mb3IgKGNvbnN0IGZpZWxkIG9mIE9iamVjdC5rZXlzKGZpZWxkVG9BcnJheUV4dFR5cGUpKSB7XHJcblx0ZmllbGRUb0FycmF5VHlwZVtmaWVsZF0gPSAnT2JqYyc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFR5cGVCeUtleShrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgcm9vdDogc3RyaW5nLCBwYXJlbnQ6IGFueSkge1xyXG5cdGlmIChrZXkgPT09ICdTeiAgJykge1xyXG5cdFx0cmV0dXJuICgnV2R0aCcgaW4gdmFsdWUpID8gJ09iamMnIDogKCgndW5pdHMnIGluIHZhbHVlKSA/ICdVbnRGJyA6ICdkb3ViJyk7XHJcblx0fSBlbHNlIGlmIChrZXkgPT09ICdUeXBlJykge1xyXG5cdFx0cmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyAnZW51bScgOiAnbG9uZyc7XHJcblx0fSBlbHNlIGlmIChrZXkgPT09ICdBbnRBJykge1xyXG5cdFx0cmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyAnZW51bScgOiAnYm9vbCc7XHJcblx0fSBlbHNlIGlmICgoa2V5ID09PSAnSHJ6bicgfHwga2V5ID09PSAnVnJ0YycpICYmIHBhcmVudC5UeXBlID09PSAna2V5VHlwZS5Qc3RuJykge1xyXG5cdFx0cmV0dXJuICdsb25nJztcclxuXHR9IGVsc2UgaWYgKGtleSA9PT0gJ0hyem4nIHx8IGtleSA9PT0gJ1ZydGMnIHx8IGtleSA9PT0gJ1RvcCAnIHx8IGtleSA9PT0gJ0xlZnQnIHx8IGtleSA9PT0gJ0J0b20nIHx8IGtleSA9PT0gJ1JnaHQnKSB7XHJcblx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyA/ICdkb3ViJyA6ICdVbnRGJztcclxuXHR9IGVsc2UgaWYgKGtleSA9PT0gJ1Zyc24nKSB7XHJcblx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyA/ICdsb25nJyA6ICdPYmpjJztcclxuXHR9IGVsc2UgaWYgKGtleSA9PT0gJ1JkICAnIHx8IGtleSA9PT0gJ0dybiAnIHx8IGtleSA9PT0gJ0JsICAnKSB7XHJcblx0XHRyZXR1cm4gcm9vdCA9PT0gJ2FydGQnID8gJ2xvbmcnIDogJ2RvdWInO1xyXG5cdH0gZWxzZSBpZiAoa2V5ID09PSAnVHJuZicpIHtcclxuXHRcdHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSA/ICdWbExzJyA6ICdPYmpjJztcclxuXHR9IGVsc2Uge1xyXG5cdFx0cmV0dXJuIGZpZWxkVG9UeXBlW2tleV07XHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZEFzY2lpU3RyaW5nT3JDbGFzc0lkKHJlYWRlcjogUHNkUmVhZGVyKSB7XHJcblx0Y29uc3QgbGVuZ3RoID0gcmVhZEludDMyKHJlYWRlcik7XHJcblx0cmV0dXJuIHJlYWRBc2NpaVN0cmluZyhyZWFkZXIsIGxlbmd0aCB8fCA0KTtcclxufVxyXG5cclxuZnVuY3Rpb24gd3JpdGVBc2NpaVN0cmluZ09yQ2xhc3NJZCh3cml0ZXI6IFBzZFdyaXRlciwgdmFsdWU6IHN0cmluZykge1xyXG5cdGlmICh2YWx1ZS5sZW5ndGggPT09IDQgJiYgdmFsdWUgIT09ICd3YXJwJyAmJiB2YWx1ZSAhPT0gJ3RpbWUnICYmIHZhbHVlICE9PSAnaG9sZCcpIHtcclxuXHRcdC8vIHdyaXRlIGNsYXNzSWRcclxuXHRcdHdyaXRlSW50MzIod3JpdGVyLCAwKTtcclxuXHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgdmFsdWUpO1xyXG5cdH0gZWxzZSB7XHJcblx0XHQvLyB3cml0ZSBhc2NpaSBzdHJpbmdcclxuXHRcdHdyaXRlSW50MzIod3JpdGVyLCB2YWx1ZS5sZW5ndGgpO1xyXG5cclxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIHZhbHVlLmNoYXJDb2RlQXQoaSkpO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWREZXNjcmlwdG9yU3RydWN0dXJlKHJlYWRlcjogUHNkUmVhZGVyKSB7XHJcblx0Y29uc3Qgb2JqZWN0OiBhbnkgPSB7fTtcclxuXHQvLyBvYmplY3QuX19zdHJ1Y3QgPVxyXG5cdHJlYWRDbGFzc1N0cnVjdHVyZShyZWFkZXIpO1xyXG5cdGNvbnN0IGl0ZW1zQ291bnQgPSByZWFkVWludDMyKHJlYWRlcik7XHJcblx0Ly8gY29uc29sZS5sb2coJy8vJywgb2JqZWN0Ll9fc3RydWN0KTtcclxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zQ291bnQ7IGkrKykge1xyXG5cdFx0Y29uc3Qga2V5ID0gcmVhZEFzY2lpU3RyaW5nT3JDbGFzc0lkKHJlYWRlcik7XHJcblx0XHRjb25zdCB0eXBlID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xyXG5cdFx0Ly8gY29uc29sZS5sb2coYD4gJyR7a2V5fScgJyR7dHlwZX0nYCk7XHJcblx0XHRjb25zdCBkYXRhID0gcmVhZE9TVHlwZShyZWFkZXIsIHR5cGUpO1xyXG5cdFx0Ly8gaWYgKCFnZXRUeXBlQnlLZXkoa2V5LCBkYXRhKSkgY29uc29sZS5sb2coYD4gJyR7a2V5fScgJyR7dHlwZX0nYCwgZGF0YSk7XHJcblx0XHRvYmplY3Rba2V5XSA9IGRhdGE7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gb2JqZWN0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVEZXNjcmlwdG9yU3RydWN0dXJlKHdyaXRlcjogUHNkV3JpdGVyLCBuYW1lOiBzdHJpbmcsIGNsYXNzSWQ6IHN0cmluZywgdmFsdWU6IGFueSwgcm9vdDogc3RyaW5nKSB7XHJcblx0aWYgKGxvZ0Vycm9ycyAmJiAhY2xhc3NJZCkgY29uc29sZS5sb2coJ01pc3NpbmcgY2xhc3NJZCBmb3I6ICcsIG5hbWUsIGNsYXNzSWQsIHZhbHVlKTtcclxuXHJcblx0Ly8gd3JpdGUgY2xhc3Mgc3RydWN0dXJlXHJcblx0d3JpdGVVbmljb2RlU3RyaW5nV2l0aFBhZGRpbmcod3JpdGVyLCBuYW1lKTtcclxuXHR3cml0ZUFzY2lpU3RyaW5nT3JDbGFzc0lkKHdyaXRlciwgY2xhc3NJZCk7XHJcblxyXG5cdGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XHJcblx0d3JpdGVVaW50MzIod3JpdGVyLCBrZXlzLmxlbmd0aCk7XHJcblxyXG5cdGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcclxuXHRcdGxldCB0eXBlID0gZ2V0VHlwZUJ5S2V5KGtleSwgdmFsdWVba2V5XSwgcm9vdCwgdmFsdWUpO1xyXG5cdFx0bGV0IGV4dFR5cGUgPSBmaWVsZFRvRXh0VHlwZVtrZXldO1xyXG5cclxuXHRcdGlmIChrZXkgPT09ICdTY2wgJyAmJiAnSHJ6bicgaW4gdmFsdWVba2V5XSkge1xyXG5cdFx0XHR0eXBlID0gJ09iamMnO1xyXG5cdFx0XHRleHRUeXBlID0gbnVsbFR5cGU7XHJcblx0XHR9IGVsc2UgaWYgKGtleSA9PT0gJ2F1ZGlvQ2xpcEdyb3VwTGlzdCcgJiYga2V5cy5sZW5ndGggPT09IDEpIHtcclxuXHRcdFx0dHlwZSA9ICdWbExzJztcclxuXHRcdH0gZWxzZSBpZiAoKGtleSA9PT0gJ1N0cnQnIHx8IGtleSA9PT0gJ0JyZ2gnKSAmJiAnSCAgICcgaW4gdmFsdWUpIHtcclxuXHRcdFx0dHlwZSA9ICdkb3ViJztcclxuXHRcdH0gZWxzZSBpZiAoa2V5ID09PSAnU3RydCcpIHtcclxuXHRcdFx0dHlwZSA9ICdPYmpjJztcclxuXHRcdFx0ZXh0VHlwZSA9IG51bGxUeXBlO1xyXG5cdFx0fSBlbHNlIGlmIChjaGFubmVscy5pbmRleE9mKGtleSkgIT09IC0xKSB7XHJcblx0XHRcdHR5cGUgPSAoY2xhc3NJZCA9PT0gJ1JHQkMnICYmIHJvb3QgIT09ICdhcnRkJykgPyAnZG91YicgOiAnbG9uZyc7XHJcblx0XHR9IGVsc2UgaWYgKGtleSA9PT0gJ3Byb2ZpbGUnKSB7XHJcblx0XHRcdHR5cGUgPSBjbGFzc0lkID09PSAncHJpbnRPdXRwdXQnID8gJ1RFWFQnIDogJ3RkdGEnO1xyXG5cdFx0fSBlbHNlIGlmIChrZXkgPT09ICdzdHJva2VTdHlsZUNvbnRlbnQnKSB7XHJcblx0XHRcdGlmICh2YWx1ZVtrZXldWydDbHIgJ10pIHtcclxuXHRcdFx0XHRleHRUeXBlID0gbWFrZVR5cGUoJycsICdzb2xpZENvbG9yTGF5ZXInKTtcclxuXHRcdFx0fSBlbHNlIGlmICh2YWx1ZVtrZXldLkdyYWQpIHtcclxuXHRcdFx0XHRleHRUeXBlID0gbWFrZVR5cGUoJycsICdncmFkaWVudExheWVyJyk7XHJcblx0XHRcdH0gZWxzZSBpZiAodmFsdWVba2V5XS5QdHJuKSB7XHJcblx0XHRcdFx0ZXh0VHlwZSA9IG1ha2VUeXBlKCcnLCAncGF0dGVybkxheWVyJyk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0bG9nRXJyb3JzICYmIGNvbnNvbGUubG9nKCdJbnZhbGlkIHN0cm9rZVN0eWxlQ29udGVudCB2YWx1ZScsIHZhbHVlW2tleV0pO1xyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2UgaWYgKGtleSA9PT0gJ2JvdW5kcycgJiYgcm9vdCA9PT0gJ3F1aWx0V2FycCcpIHtcclxuXHRcdFx0ZXh0VHlwZSA9IG1ha2VUeXBlKCcnLCAnY2xhc3NGbG9hdFJlY3QnKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZXh0VHlwZSAmJiBleHRUeXBlLmNsYXNzSUQgPT09ICdSR0JDJykge1xyXG5cdFx0XHRpZiAoJ0ggICAnIGluIHZhbHVlW2tleV0pIGV4dFR5cGUgPSB7IGNsYXNzSUQ6ICdIU0JDJywgbmFtZTogJycgfTtcclxuXHRcdFx0Ly8gVE9ETzogb3RoZXIgY29sb3Igc3BhY2VzXHJcblx0XHR9XHJcblxyXG5cdFx0d3JpdGVBc2NpaVN0cmluZ09yQ2xhc3NJZCh3cml0ZXIsIGtleSk7XHJcblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIHR5cGUgfHwgJ2xvbmcnKTtcclxuXHRcdHdyaXRlT1NUeXBlKHdyaXRlciwgdHlwZSB8fCAnbG9uZycsIHZhbHVlW2tleV0sIGtleSwgZXh0VHlwZSwgcm9vdCk7XHJcblx0XHRpZiAobG9nRXJyb3JzICYmICF0eXBlKSBjb25zb2xlLmxvZyhgTWlzc2luZyBkZXNjcmlwdG9yIGZpZWxkIHR5cGUgZm9yOiAnJHtrZXl9JyBpbmAsIHZhbHVlKTtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRPU1R5cGUocmVhZGVyOiBQc2RSZWFkZXIsIHR5cGU6IHN0cmluZykge1xyXG5cdHN3aXRjaCAodHlwZSkge1xyXG5cdFx0Y2FzZSAnb2JqICc6IC8vIFJlZmVyZW5jZVxyXG5cdFx0XHRyZXR1cm4gcmVhZFJlZmVyZW5jZVN0cnVjdHVyZShyZWFkZXIpO1xyXG5cdFx0Y2FzZSAnT2JqYyc6IC8vIERlc2NyaXB0b3JcclxuXHRcdGNhc2UgJ0dsYk8nOiAvLyBHbG9iYWxPYmplY3Qgc2FtZSBhcyBEZXNjcmlwdG9yXHJcblx0XHRcdHJldHVybiByZWFkRGVzY3JpcHRvclN0cnVjdHVyZShyZWFkZXIpO1xyXG5cdFx0Y2FzZSAnVmxMcyc6IHsgLy8gTGlzdFxyXG5cdFx0XHRjb25zdCBsZW5ndGggPSByZWFkSW50MzIocmVhZGVyKTtcclxuXHRcdFx0Y29uc3QgaXRlbXM6IGFueVtdID0gW107XHJcblxyXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0Y29uc3QgdHlwZSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcclxuXHRcdFx0XHQvLyBjb25zb2xlLmxvZygnICA+JywgdHlwZSk7XHJcblx0XHRcdFx0aXRlbXMucHVzaChyZWFkT1NUeXBlKHJlYWRlciwgdHlwZSkpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gaXRlbXM7XHJcblx0XHR9XHJcblx0XHRjYXNlICdkb3ViJzogLy8gRG91YmxlXHJcblx0XHRcdHJldHVybiByZWFkRmxvYXQ2NChyZWFkZXIpO1xyXG5cdFx0Y2FzZSAnVW50Ric6IHsgLy8gVW5pdCBkb3VibGVcclxuXHRcdFx0Y29uc3QgdW5pdHMgPSByZWFkU2lnbmF0dXJlKHJlYWRlcik7XHJcblx0XHRcdGNvbnN0IHZhbHVlID0gcmVhZEZsb2F0NjQocmVhZGVyKTtcclxuXHRcdFx0aWYgKCF1bml0c01hcFt1bml0c10pIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB1bml0czogJHt1bml0c31gKTtcclxuXHRcdFx0cmV0dXJuIHsgdW5pdHM6IHVuaXRzTWFwW3VuaXRzXSwgdmFsdWUgfTtcclxuXHRcdH1cclxuXHRcdGNhc2UgJ1VuRmwnOiB7IC8vIFVuaXQgZmxvYXRcclxuXHRcdFx0Y29uc3QgdW5pdHMgPSByZWFkU2lnbmF0dXJlKHJlYWRlcik7XHJcblx0XHRcdGNvbnN0IHZhbHVlID0gcmVhZEZsb2F0MzIocmVhZGVyKTtcclxuXHRcdFx0aWYgKCF1bml0c01hcFt1bml0c10pIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB1bml0czogJHt1bml0c31gKTtcclxuXHRcdFx0cmV0dXJuIHsgdW5pdHM6IHVuaXRzTWFwW3VuaXRzXSwgdmFsdWUgfTtcclxuXHRcdH1cclxuXHRcdGNhc2UgJ1RFWFQnOiAvLyBTdHJpbmdcclxuXHRcdFx0cmV0dXJuIHJlYWRVbmljb2RlU3RyaW5nKHJlYWRlcik7XHJcblx0XHRjYXNlICdlbnVtJzogeyAvLyBFbnVtZXJhdGVkXHJcblx0XHRcdGNvbnN0IHR5cGUgPSByZWFkQXNjaWlTdHJpbmdPckNsYXNzSWQocmVhZGVyKTtcclxuXHRcdFx0Y29uc3QgdmFsdWUgPSByZWFkQXNjaWlTdHJpbmdPckNsYXNzSWQocmVhZGVyKTtcclxuXHRcdFx0cmV0dXJuIGAke3R5cGV9LiR7dmFsdWV9YDtcclxuXHRcdH1cclxuXHRcdGNhc2UgJ2xvbmcnOiAvLyBJbnRlZ2VyXHJcblx0XHRcdHJldHVybiByZWFkSW50MzIocmVhZGVyKTtcclxuXHRcdGNhc2UgJ2NvbXAnOiB7IC8vIExhcmdlIEludGVnZXJcclxuXHRcdFx0Y29uc3QgbG93ID0gcmVhZFVpbnQzMihyZWFkZXIpO1xyXG5cdFx0XHRjb25zdCBoaWdoID0gcmVhZFVpbnQzMihyZWFkZXIpO1xyXG5cdFx0XHRyZXR1cm4geyBsb3csIGhpZ2ggfTtcclxuXHRcdH1cclxuXHRcdGNhc2UgJ2Jvb2wnOiAvLyBCb29sZWFuXHJcblx0XHRcdHJldHVybiAhIXJlYWRVaW50OChyZWFkZXIpO1xyXG5cdFx0Y2FzZSAndHlwZSc6IC8vIENsYXNzXHJcblx0XHRjYXNlICdHbGJDJzogLy8gQ2xhc3NcclxuXHRcdFx0cmV0dXJuIHJlYWRDbGFzc1N0cnVjdHVyZShyZWFkZXIpO1xyXG5cdFx0Y2FzZSAnYWxpcyc6IHsgLy8gQWxpYXNcclxuXHRcdFx0Y29uc3QgbGVuZ3RoID0gcmVhZEludDMyKHJlYWRlcik7XHJcblx0XHRcdHJldHVybiByZWFkQXNjaWlTdHJpbmcocmVhZGVyLCBsZW5ndGgpO1xyXG5cdFx0fVxyXG5cdFx0Y2FzZSAndGR0YSc6IHsgLy8gUmF3IERhdGFcclxuXHRcdFx0Y29uc3QgbGVuZ3RoID0gcmVhZEludDMyKHJlYWRlcik7XHJcblx0XHRcdHJldHVybiByZWFkQnl0ZXMocmVhZGVyLCBsZW5ndGgpO1xyXG5cdFx0fVxyXG5cdFx0Y2FzZSAnT2JBcic6IHsgLy8gT2JqZWN0IGFycmF5XHJcblx0XHRcdHJlYWRJbnQzMihyZWFkZXIpOyAvLyB2ZXJzaW9uOiAxNlxyXG5cdFx0XHRyZWFkVW5pY29kZVN0cmluZyhyZWFkZXIpOyAvLyBuYW1lOiAnJ1xyXG5cdFx0XHRyZWFkQXNjaWlTdHJpbmdPckNsYXNzSWQocmVhZGVyKTsgLy8gJ3JhdGlvbmFsUG9pbnQnXHJcblx0XHRcdGNvbnN0IGxlbmd0aCA9IHJlYWRJbnQzMihyZWFkZXIpO1xyXG5cdFx0XHRjb25zdCBpdGVtczogYW55W10gPSBbXTtcclxuXHJcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRjb25zdCB0eXBlMSA9IHJlYWRBc2NpaVN0cmluZ09yQ2xhc3NJZChyZWFkZXIpOyAvLyB0eXBlIEhyem4gfCBWcnRjXHJcblx0XHRcdFx0cmVhZFNpZ25hdHVyZShyZWFkZXIpOyAvLyBVbkZsXHJcblxyXG5cdFx0XHRcdHJlYWRTaWduYXR1cmUocmVhZGVyKTsgLy8gdW5pdHMgPyAnI1B4bCdcclxuXHRcdFx0XHRjb25zdCB2YWx1ZXNDb3VudCA9IHJlYWRJbnQzMihyZWFkZXIpO1xyXG5cdFx0XHRcdGNvbnN0IHZhbHVlczogbnVtYmVyW10gPSBbXTtcclxuXHRcdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlc0NvdW50OyBqKyspIHtcclxuXHRcdFx0XHRcdHZhbHVlcy5wdXNoKHJlYWRGbG9hdDY0KHJlYWRlcikpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aXRlbXMucHVzaCh7IHR5cGU6IHR5cGUxLCB2YWx1ZXMgfSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBpdGVtcztcclxuXHRcdH1cclxuXHRcdGNhc2UgJ1B0aCAnOiB7IC8vIEZpbGUgcGF0aFxyXG5cdFx0XHQvKmNvbnN0IGxlbmd0aCA9Ki8gcmVhZEludDMyKHJlYWRlcik7XHJcblx0XHRcdGNvbnN0IHNpZyA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcclxuXHRcdFx0Lypjb25zdCBwYXRoU2l6ZSA9Ki8gcmVhZEludDMyTEUocmVhZGVyKTtcclxuXHRcdFx0Y29uc3QgY2hhcnNDb3VudCA9IHJlYWRJbnQzMkxFKHJlYWRlcik7XHJcblx0XHRcdGNvbnN0IHBhdGggPSByZWFkVW5pY29kZVN0cmluZ1dpdGhMZW5ndGgocmVhZGVyLCBjaGFyc0NvdW50KTtcclxuXHRcdFx0cmV0dXJuIHsgc2lnLCBwYXRoIH07XHJcblx0XHR9XHJcblx0XHRkZWZhdWx0OlxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgVHlTaCBkZXNjcmlwdG9yIE9TVHlwZTogJHt0eXBlfSBhdCAke3JlYWRlci5vZmZzZXQudG9TdHJpbmcoMTYpfWApO1xyXG5cdH1cclxufVxyXG5cclxuY29uc3QgT2JBclR5cGVzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB8IHVuZGVmaW5lZDsgfSA9IHtcclxuXHRtZXNoUG9pbnRzOiAncmF0aW9uYWxQb2ludCcsXHJcblx0cXVpbHRTbGljZVg6ICdVbnRGJyxcclxuXHRxdWlsdFNsaWNlWTogJ1VudEYnLFxyXG59O1xyXG5cclxuZnVuY3Rpb24gd3JpdGVPU1R5cGUod3JpdGVyOiBQc2RXcml0ZXIsIHR5cGU6IHN0cmluZywgdmFsdWU6IGFueSwga2V5OiBzdHJpbmcsIGV4dFR5cGU6IE5hbWVDbGFzc0lEIHwgdW5kZWZpbmVkLCByb290OiBzdHJpbmcpIHtcclxuXHRzd2l0Y2ggKHR5cGUpIHtcclxuXHRcdGNhc2UgJ29iaiAnOiAvLyBSZWZlcmVuY2VcclxuXHRcdFx0d3JpdGVSZWZlcmVuY2VTdHJ1Y3R1cmUod3JpdGVyLCBrZXksIHZhbHVlKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICdPYmpjJzogLy8gRGVzY3JpcHRvclxyXG5cdFx0Y2FzZSAnR2xiTyc6IC8vIEdsb2JhbE9iamVjdCBzYW1lIGFzIERlc2NyaXB0b3JcclxuXHRcdFx0aWYgKCFleHRUeXBlKSB0aHJvdyBuZXcgRXJyb3IoYE1pc3NpbmcgZXh0IHR5cGUgZm9yOiAnJHtrZXl9JyAoJHtKU09OLnN0cmluZ2lmeSh2YWx1ZSl9KWApO1xyXG5cdFx0XHR3cml0ZURlc2NyaXB0b3JTdHJ1Y3R1cmUod3JpdGVyLCBleHRUeXBlLm5hbWUsIGV4dFR5cGUuY2xhc3NJRCwgdmFsdWUsIHJvb3QpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgJ1ZsTHMnOiAvLyBMaXN0XHJcblx0XHRcdHdyaXRlSW50MzIod3JpdGVyLCB2YWx1ZS5sZW5ndGgpO1xyXG5cclxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGNvbnN0IHR5cGUgPSBmaWVsZFRvQXJyYXlUeXBlW2tleV07XHJcblx0XHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCB0eXBlIHx8ICdsb25nJyk7XHJcblx0XHRcdFx0d3JpdGVPU1R5cGUod3JpdGVyLCB0eXBlIHx8ICdsb25nJywgdmFsdWVbaV0sICcnLCBmaWVsZFRvQXJyYXlFeHRUeXBlW2tleV0sIHJvb3QpO1xyXG5cdFx0XHRcdGlmIChsb2dFcnJvcnMgJiYgIXR5cGUpIGNvbnNvbGUubG9nKGBNaXNzaW5nIGRlc2NyaXB0b3IgYXJyYXkgdHlwZSBmb3I6ICcke2tleX0nIGluYCwgdmFsdWUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSAnZG91Yic6IC8vIERvdWJsZVxyXG5cdFx0XHR3cml0ZUZsb2F0NjQod3JpdGVyLCB2YWx1ZSk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSAnVW50Ric6IC8vIFVuaXQgZG91YmxlXHJcblx0XHRcdGlmICghdW5pdHNNYXBSZXZbdmFsdWUudW5pdHNdKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdW5pdHM6ICR7dmFsdWUudW5pdHN9IGluICR7a2V5fWApO1xyXG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIHVuaXRzTWFwUmV2W3ZhbHVlLnVuaXRzXSk7XHJcblx0XHRcdHdyaXRlRmxvYXQ2NCh3cml0ZXIsIHZhbHVlLnZhbHVlKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICdVbkZsJzogLy8gVW5pdCBmbG9hdFxyXG5cdFx0XHRpZiAoIXVuaXRzTWFwUmV2W3ZhbHVlLnVuaXRzXSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHVuaXRzOiAke3ZhbHVlLnVuaXRzfSBpbiAke2tleX1gKTtcclxuXHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCB1bml0c01hcFJldlt2YWx1ZS51bml0c10pO1xyXG5cdFx0XHR3cml0ZUZsb2F0MzIod3JpdGVyLCB2YWx1ZS52YWx1ZSk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSAnVEVYVCc6IC8vIFN0cmluZ1xyXG5cdFx0XHR3cml0ZVVuaWNvZGVTdHJpbmdXaXRoUGFkZGluZyh3cml0ZXIsIHZhbHVlKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICdlbnVtJzogeyAvLyBFbnVtZXJhdGVkXHJcblx0XHRcdGNvbnN0IFtfdHlwZSwgdmFsXSA9IHZhbHVlLnNwbGl0KCcuJyk7XHJcblx0XHRcdHdyaXRlQXNjaWlTdHJpbmdPckNsYXNzSWQod3JpdGVyLCBfdHlwZSk7XHJcblx0XHRcdHdyaXRlQXNjaWlTdHJpbmdPckNsYXNzSWQod3JpdGVyLCB2YWwpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHRcdGNhc2UgJ2xvbmcnOiAvLyBJbnRlZ2VyXHJcblx0XHRcdHdyaXRlSW50MzIod3JpdGVyLCB2YWx1ZSk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Ly8gY2FzZSAnY29tcCc6IC8vIExhcmdlIEludGVnZXJcclxuXHRcdC8vIFx0d3JpdGVMYXJnZUludGVnZXIocmVhZGVyKTtcclxuXHRcdGNhc2UgJ2Jvb2wnOiAvLyBCb29sZWFuXHJcblx0XHRcdHdyaXRlVWludDgod3JpdGVyLCB2YWx1ZSA/IDEgOiAwKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHQvLyBjYXNlICd0eXBlJzogLy8gQ2xhc3NcclxuXHRcdC8vIGNhc2UgJ0dsYkMnOiAvLyBDbGFzc1xyXG5cdFx0Ly8gXHR3cml0ZUNsYXNzU3RydWN0dXJlKHJlYWRlcik7XHJcblx0XHQvLyBjYXNlICdhbGlzJzogLy8gQWxpYXNcclxuXHRcdC8vIFx0d3JpdGVBbGlhc1N0cnVjdHVyZShyZWFkZXIpO1xyXG5cdFx0Y2FzZSAndGR0YSc6IC8vIFJhdyBEYXRhXHJcblx0XHRcdHdyaXRlSW50MzIod3JpdGVyLCB2YWx1ZS5ieXRlTGVuZ3RoKTtcclxuXHRcdFx0d3JpdGVCeXRlcyh3cml0ZXIsIHZhbHVlKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICdPYkFyJzogeyAvLyBPYmplY3QgYXJyYXlcclxuXHRcdFx0d3JpdGVJbnQzMih3cml0ZXIsIDE2KTsgLy8gdmVyc2lvblxyXG5cdFx0XHR3cml0ZVVuaWNvZGVTdHJpbmdXaXRoUGFkZGluZyh3cml0ZXIsICcnKTsgLy8gbmFtZVxyXG5cdFx0XHRjb25zdCB0eXBlID0gT2JBclR5cGVzW2tleV07XHJcblx0XHRcdGlmICghdHlwZSkgdGhyb3cgbmV3IEVycm9yKGBOb3QgaW1wbGVtZW50ZWQgT2JBclR5cGUgZm9yOiAke2tleX1gKTtcclxuXHRcdFx0d3JpdGVBc2NpaVN0cmluZ09yQ2xhc3NJZCh3cml0ZXIsIHR5cGUpO1xyXG5cdFx0XHR3cml0ZUludDMyKHdyaXRlciwgdmFsdWUubGVuZ3RoKTtcclxuXHJcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHR3cml0ZUFzY2lpU3RyaW5nT3JDbGFzc0lkKHdyaXRlciwgdmFsdWVbaV0udHlwZSk7IC8vIEhyem4gfCBWcnRjXHJcblx0XHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnVW5GbCcpO1xyXG5cdFx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJyNQeGwnKTtcclxuXHRcdFx0XHR3cml0ZUludDMyKHdyaXRlciwgdmFsdWVbaV0udmFsdWVzLmxlbmd0aCk7XHJcblxyXG5cdFx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVbaV0udmFsdWVzLmxlbmd0aDsgaisrKSB7XHJcblx0XHRcdFx0XHR3cml0ZUZsb2F0NjQod3JpdGVyLCB2YWx1ZVtpXS52YWx1ZXNbal0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHRcdC8vIGNhc2UgJ1B0aCAnOiAvLyBGaWxlIHBhdGhcclxuXHRcdC8vIFx0d3JpdGVGaWxlUGF0aChyZWFkZXIpO1xyXG5cdFx0ZGVmYXVsdDpcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBOb3QgaW1wbGVtZW50ZWQgZGVzY3JpcHRvciBPU1R5cGU6ICR7dHlwZX1gKTtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRSZWZlcmVuY2VTdHJ1Y3R1cmUocmVhZGVyOiBQc2RSZWFkZXIpIHtcclxuXHRjb25zdCBpdGVtc0NvdW50ID0gcmVhZEludDMyKHJlYWRlcik7XHJcblx0Y29uc3QgaXRlbXM6IGFueVtdID0gW107XHJcblxyXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXNDb3VudDsgaSsrKSB7XHJcblx0XHRjb25zdCB0eXBlID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xyXG5cclxuXHRcdHN3aXRjaCAodHlwZSkge1xyXG5cdFx0XHRjYXNlICdwcm9wJzogeyAvLyBQcm9wZXJ0eVxyXG5cdFx0XHRcdHJlYWRDbGFzc1N0cnVjdHVyZShyZWFkZXIpO1xyXG5cdFx0XHRcdGNvbnN0IGtleUlEID0gcmVhZEFzY2lpU3RyaW5nT3JDbGFzc0lkKHJlYWRlcik7XHJcblx0XHRcdFx0aXRlbXMucHVzaChrZXlJRCk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2FzZSAnQ2xzcyc6IC8vIENsYXNzXHJcblx0XHRcdFx0aXRlbXMucHVzaChyZWFkQ2xhc3NTdHJ1Y3R1cmUocmVhZGVyKSk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ0VubXInOiB7IC8vIEVudW1lcmF0ZWQgUmVmZXJlbmNlXHJcblx0XHRcdFx0cmVhZENsYXNzU3RydWN0dXJlKHJlYWRlcik7XHJcblx0XHRcdFx0Y29uc3QgdHlwZUlEID0gcmVhZEFzY2lpU3RyaW5nT3JDbGFzc0lkKHJlYWRlcik7XHJcblx0XHRcdFx0Y29uc3QgdmFsdWUgPSByZWFkQXNjaWlTdHJpbmdPckNsYXNzSWQocmVhZGVyKTtcclxuXHRcdFx0XHRpdGVtcy5wdXNoKGAke3R5cGVJRH0uJHt2YWx1ZX1gKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXNlICdyZWxlJzogeyAvLyBPZmZzZXRcclxuXHRcdFx0XHQvLyBjb25zdCB7IG5hbWUsIGNsYXNzSUQgfSA9XHJcblx0XHRcdFx0cmVhZENsYXNzU3RydWN0dXJlKHJlYWRlcik7XHJcblx0XHRcdFx0aXRlbXMucHVzaChyZWFkVWludDMyKHJlYWRlcikpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNhc2UgJ0lkbnQnOiAvLyBJZGVudGlmaWVyXHJcblx0XHRcdFx0aXRlbXMucHVzaChyZWFkSW50MzIocmVhZGVyKSk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ2luZHgnOiAvLyBJbmRleFxyXG5cdFx0XHRcdGl0ZW1zLnB1c2gocmVhZEludDMyKHJlYWRlcikpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICduYW1lJzogeyAvLyBOYW1lXHJcblx0XHRcdFx0cmVhZENsYXNzU3RydWN0dXJlKHJlYWRlcik7XHJcblx0XHRcdFx0aXRlbXMucHVzaChyZWFkVW5pY29kZVN0cmluZyhyZWFkZXIpKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBkZXNjcmlwdG9yIHJlZmVyZW5jZSB0eXBlOiAke3R5cGV9YCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gaXRlbXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdyaXRlUmVmZXJlbmNlU3RydWN0dXJlKHdyaXRlcjogUHNkV3JpdGVyLCBfa2V5OiBzdHJpbmcsIGl0ZW1zOiBhbnlbXSkge1xyXG5cdHdyaXRlSW50MzIod3JpdGVyLCBpdGVtcy5sZW5ndGgpO1xyXG5cclxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRjb25zdCB2YWx1ZSA9IGl0ZW1zW2ldO1xyXG5cdFx0bGV0IHR5cGUgPSAndW5rbm93bic7XHJcblxyXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0aWYgKC9eW2Etel0rXFwuW2Etel0rJC9pLnRlc3QodmFsdWUpKSB7XHJcblx0XHRcdFx0dHlwZSA9ICdFbm1yJztcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0eXBlID0gJ25hbWUnO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCB0eXBlKTtcclxuXHJcblx0XHRzd2l0Y2ggKHR5cGUpIHtcclxuXHRcdFx0Ly8gY2FzZSAncHJvcCc6IC8vIFByb3BlcnR5XHJcblx0XHRcdC8vIGNhc2UgJ0Nsc3MnOiAvLyBDbGFzc1xyXG5cdFx0XHRjYXNlICdFbm1yJzogeyAvLyBFbnVtZXJhdGVkIFJlZmVyZW5jZVxyXG5cdFx0XHRcdGNvbnN0IFt0eXBlSUQsIGVudW1WYWx1ZV0gPSB2YWx1ZS5zcGxpdCgnLicpO1xyXG5cdFx0XHRcdHdyaXRlQ2xhc3NTdHJ1Y3R1cmUod3JpdGVyLCAnXFwwJywgdHlwZUlEKTtcclxuXHRcdFx0XHR3cml0ZUFzY2lpU3RyaW5nT3JDbGFzc0lkKHdyaXRlciwgdHlwZUlEKTtcclxuXHRcdFx0XHR3cml0ZUFzY2lpU3RyaW5nT3JDbGFzc0lkKHdyaXRlciwgZW51bVZhbHVlKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBjYXNlICdyZWxlJzogLy8gT2Zmc2V0XHJcblx0XHRcdC8vIGNhc2UgJ0lkbnQnOiAvLyBJZGVudGlmaWVyXHJcblx0XHRcdC8vIGNhc2UgJ2luZHgnOiAvLyBJbmRleFxyXG5cdFx0XHRjYXNlICduYW1lJzogeyAvLyBOYW1lXHJcblx0XHRcdFx0d3JpdGVDbGFzc1N0cnVjdHVyZSh3cml0ZXIsICdcXDAnLCAnTHlyICcpO1xyXG5cdFx0XHRcdHdyaXRlVW5pY29kZVN0cmluZyh3cml0ZXIsIHZhbHVlICsgJ1xcMCcpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHRcdGRlZmF1bHQ6XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGRlc2NyaXB0b3IgcmVmZXJlbmNlIHR5cGU6ICR7dHlwZX1gKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiBpdGVtcztcclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZENsYXNzU3RydWN0dXJlKHJlYWRlcjogUHNkUmVhZGVyKSB7XHJcblx0Y29uc3QgbmFtZSA9IHJlYWRVbmljb2RlU3RyaW5nKHJlYWRlcik7XHJcblx0Y29uc3QgY2xhc3NJRCA9IHJlYWRBc2NpaVN0cmluZ09yQ2xhc3NJZChyZWFkZXIpO1xyXG5cdC8vIGNvbnNvbGUubG9nKHsgbmFtZSwgY2xhc3NJRCB9KTtcclxuXHRyZXR1cm4geyBuYW1lLCBjbGFzc0lEIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdyaXRlQ2xhc3NTdHJ1Y3R1cmUod3JpdGVyOiBQc2RXcml0ZXIsIG5hbWU6IHN0cmluZywgY2xhc3NJRDogc3RyaW5nKSB7XHJcblx0d3JpdGVVbmljb2RlU3RyaW5nKHdyaXRlciwgbmFtZSk7XHJcblx0d3JpdGVBc2NpaVN0cmluZ09yQ2xhc3NJZCh3cml0ZXIsIGNsYXNzSUQpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcjogUHNkUmVhZGVyKSB7XHJcblx0Y29uc3QgdmVyc2lvbiA9IHJlYWRVaW50MzIocmVhZGVyKTtcclxuXHRpZiAodmVyc2lvbiAhPT0gMTYpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBkZXNjcmlwdG9yIHZlcnNpb246ICR7dmVyc2lvbn1gKTtcclxuXHRjb25zdCBkZXNjID0gcmVhZERlc2NyaXB0b3JTdHJ1Y3R1cmUocmVhZGVyKTtcclxuXHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcclxuXHRyZXR1cm4gZGVzYztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlVmVyc2lvbkFuZERlc2NyaXB0b3Iod3JpdGVyOiBQc2RXcml0ZXIsIG5hbWU6IHN0cmluZywgY2xhc3NJRDogc3RyaW5nLCBkZXNjcmlwdG9yOiBhbnksIHJvb3QgPSAnJykge1xyXG5cdHdyaXRlVWludDMyKHdyaXRlciwgMTYpOyAvLyB2ZXJzaW9uXHJcblx0d3JpdGVEZXNjcmlwdG9yU3RydWN0dXJlKHdyaXRlciwgbmFtZSwgY2xhc3NJRCwgZGVzY3JpcHRvciwgcm9vdCk7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIERlc2NyaXB0b3JVbml0cyA9ICdBbmdsZScgfCAnRGVuc2l0eScgfCAnRGlzdGFuY2UnIHwgJ05vbmUnIHwgJ1BlcmNlbnQnIHwgJ1BpeGVscycgfFxyXG5cdCdNaWxsaW1ldGVycycgfCAnUG9pbnRzJyB8ICdQaWNhcycgfCAnSW5jaGVzJyB8ICdDZW50aW1ldGVycyc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIERlc2NyaXB0b3JVbml0c1ZhbHVlIHtcclxuXHR1bml0czogRGVzY3JpcHRvclVuaXRzO1xyXG5cdHZhbHVlOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIERlc2NyaXB0b3JDb2xvciA9IHtcclxuXHQnUmQgICc6IG51bWJlcjtcclxuXHQnR3JuICc6IG51bWJlcjtcclxuXHQnQmwgICc6IG51bWJlcjtcclxufSB8IHtcclxuXHQnSCAgICc6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFN0cnQ6IG51bWJlcjtcclxuXHRCcmdoOiBudW1iZXI7XHJcbn0gfCB7XHJcblx0J0N5biAnOiBudW1iZXI7XHJcblx0TWdudDogbnVtYmVyO1xyXG5cdCdZbHcgJzogbnVtYmVyO1xyXG5cdEJsY2s6IG51bWJlcjtcclxufSB8IHtcclxuXHQnR3J5ICc6IG51bWJlcjtcclxufSB8IHtcclxuXHRMbW5jOiBudW1iZXI7XHJcblx0J0EgICAnOiBudW1iZXI7XHJcblx0J0IgICAnOiBudW1iZXI7XHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIERlc2NpcHRvclBhdHRlcm4ge1xyXG5cdCdObSAgJzogc3RyaW5nO1xyXG5cdElkbnQ6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgRGVzY2lwdG9yR3JhZGllbnQgPSB7XHJcblx0J05tICAnOiBzdHJpbmc7XHJcblx0R3JkRjogJ0dyZEYuQ3N0Uyc7XHJcblx0SW50cjogbnVtYmVyO1xyXG5cdENscnM6IHtcclxuXHRcdCdDbHIgJzogRGVzY3JpcHRvckNvbG9yO1xyXG5cdFx0VHlwZTogJ0NscnkuVXNyUyc7XHJcblx0XHRMY3RuOiBudW1iZXI7XHJcblx0XHRNZHBuOiBudW1iZXI7XHJcblx0fVtdO1xyXG5cdFRybnM6IHtcclxuXHRcdE9wY3Q6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0TGN0bjogbnVtYmVyO1xyXG5cdFx0TWRwbjogbnVtYmVyO1xyXG5cdH1bXTtcclxufSB8IHtcclxuXHRHcmRGOiAnR3JkRi5DbE5zJztcclxuXHRTbXRoOiBudW1iZXI7XHJcblx0J05tICAnOiBzdHJpbmc7XHJcblx0Q2xyUzogc3RyaW5nO1xyXG5cdFJuZFM6IG51bWJlcjtcclxuXHRWY3RDPzogYm9vbGVhbjtcclxuXHRTaFRyPzogYm9vbGVhbjtcclxuXHQnTW5tICc6IG51bWJlcltdO1xyXG5cdCdNeG0gJzogbnVtYmVyW107XHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIERlc2NyaXB0b3JDb2xvckNvbnRlbnQge1xyXG5cdCdDbHIgJzogRGVzY3JpcHRvckNvbG9yO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIERlc2NyaXB0b3JHcmFkaWVudENvbnRlbnQge1xyXG5cdEdyYWQ6IERlc2NpcHRvckdyYWRpZW50O1xyXG5cdFR5cGU6IHN0cmluZztcclxuXHREdGhyPzogYm9vbGVhbjtcclxuXHRSdnJzPzogYm9vbGVhbjtcclxuXHRBbmdsPzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0J1NjbCAnPzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0QWxnbj86IGJvb2xlYW47XHJcblx0T2ZzdD86IHsgSHJ6bjogRGVzY3JpcHRvclVuaXRzVmFsdWU7IFZydGM6IERlc2NyaXB0b3JVbml0c1ZhbHVlOyB9O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIERlc2NyaXB0b3JQYXR0ZXJuQ29udGVudCB7XHJcblx0UHRybjogRGVzY2lwdG9yUGF0dGVybjtcclxuXHRMbmtkPzogYm9vbGVhbjtcclxuXHRwaGFzZT86IHsgSHJ6bjogbnVtYmVyOyBWcnRjOiBudW1iZXI7IH07XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIERlc2NyaXB0b3JWZWN0b3JDb250ZW50ID0gRGVzY3JpcHRvckNvbG9yQ29udGVudCB8IERlc2NyaXB0b3JHcmFkaWVudENvbnRlbnQgfCBEZXNjcmlwdG9yUGF0dGVybkNvbnRlbnQ7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFN0cm9rZURlc2NyaXB0b3Ige1xyXG5cdHN0cm9rZVN0eWxlVmVyc2lvbjogbnVtYmVyO1xyXG5cdHN0cm9rZUVuYWJsZWQ6IGJvb2xlYW47XHJcblx0ZmlsbEVuYWJsZWQ6IGJvb2xlYW47XHJcblx0c3Ryb2tlU3R5bGVMaW5lV2lkdGg6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdHN0cm9rZVN0eWxlTGluZURhc2hPZmZzZXQ6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdHN0cm9rZVN0eWxlTWl0ZXJMaW1pdDogbnVtYmVyO1xyXG5cdHN0cm9rZVN0eWxlTGluZUNhcFR5cGU6IHN0cmluZztcclxuXHRzdHJva2VTdHlsZUxpbmVKb2luVHlwZTogc3RyaW5nO1xyXG5cdHN0cm9rZVN0eWxlTGluZUFsaWdubWVudDogc3RyaW5nO1xyXG5cdHN0cm9rZVN0eWxlU2NhbGVMb2NrOiBib29sZWFuO1xyXG5cdHN0cm9rZVN0eWxlU3Ryb2tlQWRqdXN0OiBib29sZWFuO1xyXG5cdHN0cm9rZVN0eWxlTGluZURhc2hTZXQ6IERlc2NyaXB0b3JVbml0c1ZhbHVlW107XHJcblx0c3Ryb2tlU3R5bGVCbGVuZE1vZGU6IHN0cmluZztcclxuXHRzdHJva2VTdHlsZU9wYWNpdHk6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdHN0cm9rZVN0eWxlQ29udGVudDogRGVzY3JpcHRvclZlY3RvckNvbnRlbnQ7XHJcblx0c3Ryb2tlU3R5bGVSZXNvbHV0aW9uOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVGV4dERlc2NyaXB0b3Ige1xyXG5cdCdUeHQgJzogc3RyaW5nO1xyXG5cdHRleHRHcmlkZGluZzogc3RyaW5nO1xyXG5cdE9ybnQ6IHN0cmluZztcclxuXHRBbnRBOiBzdHJpbmc7XHJcblx0VGV4dEluZGV4OiBudW1iZXI7XHJcblx0RW5naW5lRGF0YT86IFVpbnQ4QXJyYXk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgV2FycERlc2NyaXB0b3Ige1xyXG5cdHdhcnBTdHlsZTogc3RyaW5nO1xyXG5cdHdhcnBWYWx1ZTogbnVtYmVyO1xyXG5cdHdhcnBQZXJzcGVjdGl2ZTogbnVtYmVyO1xyXG5cdHdhcnBQZXJzcGVjdGl2ZU90aGVyOiBudW1iZXI7XHJcblx0d2FycFJvdGF0ZTogc3RyaW5nO1xyXG5cdGJvdW5kcz86IHtcclxuXHRcdCdUb3AgJzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRMZWZ0OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdEJ0b206IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0UmdodDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0fTtcclxuXHR1T3JkZXI6IG51bWJlcjtcclxuXHR2T3JkZXI6IG51bWJlcjtcclxuXHRjdXN0b21FbnZlbG9wZVdhcnA/OiB7XHJcblx0XHRtZXNoUG9pbnRzOiB7XHJcblx0XHRcdHR5cGU6ICdIcnpuJyB8ICdWcnRjJztcclxuXHRcdFx0dmFsdWVzOiBudW1iZXJbXTtcclxuXHRcdH1bXTtcclxuXHR9O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFF1aWx0V2FycERlc2NyaXB0b3IgZXh0ZW5kcyBXYXJwRGVzY3JpcHRvciB7XHJcblx0ZGVmb3JtTnVtUm93czogbnVtYmVyO1xyXG5cdGRlZm9ybU51bUNvbHM6IG51bWJlcjtcclxuXHRjdXN0b21FbnZlbG9wZVdhcnA6IHtcclxuXHRcdHF1aWx0U2xpY2VYOiB7XHJcblx0XHRcdHR5cGU6ICdxdWlsdFNsaWNlWCc7XHJcblx0XHRcdHZhbHVlczogbnVtYmVyW107XHJcblx0XHR9W107XHJcblx0XHRxdWlsdFNsaWNlWToge1xyXG5cdFx0XHR0eXBlOiAncXVpbHRTbGljZVknO1xyXG5cdFx0XHR2YWx1ZXM6IG51bWJlcltdO1xyXG5cdFx0fVtdO1xyXG5cdFx0bWVzaFBvaW50czoge1xyXG5cdFx0XHR0eXBlOiAnSHJ6bicgfCAnVnJ0Yyc7XHJcblx0XHRcdHZhbHVlczogbnVtYmVyW107XHJcblx0XHR9W107XHJcblx0fTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBGcmFjdGlvbkRlc2NyaXB0b3Ige1xyXG5cdG51bWVyYXRvcjogbnVtYmVyO1xyXG5cdGRlbm9taW5hdG9yOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSHJ6blZydGNEZXNjcmlwdG9yIHtcclxuXHRIcnpuOiBudW1iZXI7XHJcblx0VnJ0YzogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEZyYW1lRGVzY3JpcHRvciB7XHJcblx0RnJMczogbnVtYmVyW107XHJcblx0ZW5hYj86IGJvb2xlYW47XHJcblx0SU1zaz86IHsgT2ZzdDogSHJ6blZydGNEZXNjcmlwdG9yIH07XHJcblx0Vk1zaz86IHsgT2ZzdDogSHJ6blZydGNEZXNjcmlwdG9yIH07XHJcblx0T2ZzdD86IEhyem5WcnRjRGVzY3JpcHRvcjtcclxuXHRGWFJmPzogSHJ6blZydGNEZXNjcmlwdG9yO1xyXG5cdExlZng/OiBMZngyRGVzY3JpcHRvcjtcclxuXHRibGVuZE9wdGlvbnM/OiB7IE9wY3Q6IERlc2NyaXB0b3JVbml0c1ZhbHVlOyB9O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEZyYW1lTGlzdERlc2NyaXB0b3Ige1xyXG5cdExhSUQ6IG51bWJlcjsgLy8gbGF5ZXIgSURcclxuXHRMYVN0OiBGcmFtZURlc2NyaXB0b3JbXTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGhvcnpWcnRjVG9YWShodjogSHJ6blZydGNEZXNjcmlwdG9yKTogeyB4OiBudW1iZXI7IHk6IG51bWJlcjsgfSB7XHJcblx0cmV0dXJuIHsgeDogaHYuSHJ6biwgeTogaHYuVnJ0YyB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24geHlUb0hvcnpWcnRjKHh5OiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyB9KTogSHJ6blZydGNEZXNjcmlwdG9yIHtcclxuXHRyZXR1cm4geyBIcnpuOiB4eS54LCBWcnRjOiB4eS55IH07XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFRpbWVsaW5lQW5pbUtleURlc2NyaXB0b3IgPSB7XHJcblx0VHlwZTogJ2tleVR5cGUuT3BjdCc7XHJcblx0T3BjdDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcbn0gfCB7XHJcblx0VHlwZTogJ2tleVR5cGUuVHJuZic7XHJcblx0J1NjbCAnOiBIcnpuVnJ0Y0Rlc2NyaXB0b3I7XHJcblx0U2tldzogSHJ6blZydGNEZXNjcmlwdG9yO1xyXG5cdHJvdGF0aW9uOiBudW1iZXI7XHJcblx0dHJhbnNsYXRpb246IEhyem5WcnRjRGVzY3JpcHRvcjtcclxufSB8IHtcclxuXHRUeXBlOiAna2V5VHlwZS5Qc3RuJztcclxuXHRIcnpuOiBudW1iZXI7XHJcblx0VnJ0YzogbnVtYmVyO1xyXG59IHwge1xyXG5cdFR5cGU6ICdrZXlUeXBlLnNoZWV0U3R5bGUnO1xyXG5cdHNoZWV0U3R5bGU6IHtcclxuXHRcdFZyc246IG51bWJlcjtcclxuXHRcdExlZng/OiBMZngyRGVzY3JpcHRvcjtcclxuXHRcdGJsZW5kT3B0aW9uczoge307XHJcblx0fTtcclxufSB8IHtcclxuXHRUeXBlOiAna2V5VHlwZS5nbG9iYWxMaWdodGluZyc7XHJcblx0Z2JsQTogbnVtYmVyO1xyXG5cdGdsb2JhbEFsdGl0dWRlOiBudW1iZXI7XHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFRpbWVsaW5lS2V5RGVzY3JpcHRvciB7XHJcblx0VnJzbjogMTtcclxuXHRhbmltSW50ZXJwU3R5bGU6ICdhbmltSW50ZXJwU3R5bGUuTG5yICcgfCAnYW5pbUludGVycFN0eWxlLmhvbGQnO1xyXG5cdHRpbWU6IEZyYWN0aW9uRGVzY3JpcHRvcjtcclxuXHRhbmltS2V5OiBUaW1lbGluZUFuaW1LZXlEZXNjcmlwdG9yO1xyXG5cdHNlbGVjdGVkOiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFRpbWVsaW5lVHJhY2tEZXNjcmlwdG9yIHtcclxuXHR0cmFja0lEOiAnc3RkVHJhY2tJRC5nbG9iYWxMaWdodGluZ1RyYWNrJyB8ICdzdGRUcmFja0lELm9wYWNpdHlUcmFjaycgfCAnc3RkVHJhY2tJRC5zdHlsZVRyYWNrJyB8ICdzdGRUcmFja0lELnNoZWV0VHJhbnNmb3JtVHJhY2snIHwgJ3N0ZFRyYWNrSUQuc2hlZXRQb3NpdGlvblRyYWNrJztcclxuXHRWcnNuOiAxO1xyXG5cdGVuYWI6IGJvb2xlYW47XHJcblx0RWZmYzogYm9vbGVhbjtcclxuXHRlZmZlY3RQYXJhbXM/OiB7XHJcblx0XHRrZXlMaXN0OiBUaW1lbGluZUtleURlc2NyaXB0b3JbXTtcclxuXHRcdGZpbGxDYW52YXM6IGJvb2xlYW47XHJcblx0XHR6b29tT3JpZ2luOiBudW1iZXI7XHJcblx0fTtcclxuXHRrZXlMaXN0OiBUaW1lbGluZUtleURlc2NyaXB0b3JbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBUaW1lU2NvcGVEZXNjcmlwdG9yIHtcclxuXHRWcnNuOiAxO1xyXG5cdFN0cnQ6IEZyYWN0aW9uRGVzY3JpcHRvcjtcclxuXHRkdXJhdGlvbjogRnJhY3Rpb25EZXNjcmlwdG9yO1xyXG5cdGluVGltZTogRnJhY3Rpb25EZXNjcmlwdG9yO1xyXG5cdG91dFRpbWU6IEZyYWN0aW9uRGVzY3JpcHRvcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBUaW1lbGluZURlc2NyaXB0b3Ige1xyXG5cdFZyc246IDE7XHJcblx0dGltZVNjb3BlOiBUaW1lU2NvcGVEZXNjcmlwdG9yO1xyXG5cdGF1dG9TY29wZTogYm9vbGVhbjtcclxuXHRhdWRpb0xldmVsOiBudW1iZXI7XHJcblx0THlySTogbnVtYmVyO1xyXG5cdHRyYWNrTGlzdD86IFRpbWVsaW5lVHJhY2tEZXNjcmlwdG9yW107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRWZmZWN0RGVzY3JpcHRvciBleHRlbmRzIFBhcnRpYWw8RGVzY3JpcHRvckdyYWRpZW50Q29udGVudD4sIFBhcnRpYWw8RGVzY3JpcHRvclBhdHRlcm5Db250ZW50PiB7XHJcblx0ZW5hYj86IGJvb2xlYW47XHJcblx0U3R5bDogc3RyaW5nO1xyXG5cdFBudFQ/OiBzdHJpbmc7XHJcblx0J01kICAnPzogc3RyaW5nO1xyXG5cdE9wY3Q/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHQnU3ogICc/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHQnQ2xyICc/OiBEZXNjcmlwdG9yQ29sb3I7XHJcblx0cHJlc2VudD86IGJvb2xlYW47XHJcblx0c2hvd0luRGlhbG9nPzogYm9vbGVhbjtcclxuXHRvdmVycHJpbnQ/OiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIExmeDJEZXNjcmlwdG9yIHtcclxuXHQnU2NsICc/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRtYXN0ZXJGWFN3aXRjaD86IGJvb2xlYW47XHJcblx0RHJTaD86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0SXJTaD86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0T3JHbD86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0SXJHbD86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0ZWJibD86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0U29GaT86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0cGF0dGVybkZpbGw/OiBFZmZlY3REZXNjcmlwdG9yO1xyXG5cdEdyRmw/OiBFZmZlY3REZXNjcmlwdG9yO1xyXG5cdENoRlg/OiBFZmZlY3REZXNjcmlwdG9yO1xyXG5cdEZyRlg/OiBFZmZlY3REZXNjcmlwdG9yO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIExtZnhEZXNjcmlwdG9yIHtcclxuXHQnU2NsICc/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRtYXN0ZXJGWFN3aXRjaD86IGJvb2xlYW47XHJcblx0bnVtTW9kaWZ5aW5nRlg/OiBudW1iZXI7XHJcblx0T3JHbD86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0SXJHbD86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0ZWJibD86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0Q2hGWD86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0ZHJvcFNoYWRvd011bHRpPzogRWZmZWN0RGVzY3JpcHRvcltdO1xyXG5cdGlubmVyU2hhZG93TXVsdGk/OiBFZmZlY3REZXNjcmlwdG9yW107XHJcblx0c29saWRGaWxsTXVsdGk/OiBFZmZlY3REZXNjcmlwdG9yW107XHJcblx0Z3JhZGllbnRGaWxsTXVsdGk/OiBFZmZlY3REZXNjcmlwdG9yW107XHJcblx0ZnJhbWVGWE11bHRpPzogRWZmZWN0RGVzY3JpcHRvcltdO1xyXG5cdHBhdHRlcm5GaWxsPzogRWZmZWN0RGVzY3JpcHRvcjsgLy8gPz8/XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlRnhPYmplY3QoZng6IEVmZmVjdERlc2NyaXB0b3IpIHtcclxuXHRjb25zdCBzdHJva2U6IExheWVyRWZmZWN0U3Ryb2tlID0ge1xyXG5cdFx0ZW5hYmxlZDogISFmeC5lbmFiLFxyXG5cdFx0cG9zaXRpb246IEZTdGwuZGVjb2RlKGZ4LlN0eWwpLFxyXG5cdFx0ZmlsbFR5cGU6IEZyRmwuZGVjb2RlKGZ4LlBudFQhKSxcclxuXHRcdGJsZW5kTW9kZTogQmxuTS5kZWNvZGUoZnhbJ01kICAnXSEpLFxyXG5cdFx0b3BhY2l0eTogcGFyc2VQZXJjZW50KGZ4Lk9wY3QpLFxyXG5cdFx0c2l6ZTogcGFyc2VVbml0cyhmeFsnU3ogICddISksXHJcblx0fTtcclxuXHJcblx0aWYgKGZ4LnByZXNlbnQgIT09IHVuZGVmaW5lZCkgc3Ryb2tlLnByZXNlbnQgPSBmeC5wcmVzZW50O1xyXG5cdGlmIChmeC5zaG93SW5EaWFsb2cgIT09IHVuZGVmaW5lZCkgc3Ryb2tlLnNob3dJbkRpYWxvZyA9IGZ4LnNob3dJbkRpYWxvZztcclxuXHRpZiAoZngub3ZlcnByaW50ICE9PSB1bmRlZmluZWQpIHN0cm9rZS5vdmVycHJpbnQgPSBmeC5vdmVycHJpbnQ7XHJcblx0aWYgKGZ4WydDbHIgJ10pIHN0cm9rZS5jb2xvciA9IHBhcnNlQ29sb3IoZnhbJ0NsciAnXSk7XHJcblx0aWYgKGZ4LkdyYWQpIHN0cm9rZS5ncmFkaWVudCA9IHBhcnNlR3JhZGllbnRDb250ZW50KGZ4IGFzIGFueSk7XHJcblx0aWYgKGZ4LlB0cm4pIHN0cm9rZS5wYXR0ZXJuID0gcGFyc2VQYXR0ZXJuQ29udGVudChmeCBhcyBhbnkpO1xyXG5cclxuXHRyZXR1cm4gc3Ryb2tlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXJpYWxpemVGeE9iamVjdChzdHJva2U6IExheWVyRWZmZWN0U3Ryb2tlKSB7XHJcblx0bGV0IEZyRlg6IEVmZmVjdERlc2NyaXB0b3IgPSB7fSBhcyBhbnk7XHJcblx0RnJGWC5lbmFiID0gISFzdHJva2UuZW5hYmxlZDtcclxuXHRpZiAoc3Ryb2tlLnByZXNlbnQgIT09IHVuZGVmaW5lZCkgRnJGWC5wcmVzZW50ID0gISFzdHJva2UucHJlc2VudDtcclxuXHRpZiAoc3Ryb2tlLnNob3dJbkRpYWxvZyAhPT0gdW5kZWZpbmVkKSBGckZYLnNob3dJbkRpYWxvZyA9ICEhc3Ryb2tlLnNob3dJbkRpYWxvZztcclxuXHRGckZYLlN0eWwgPSBGU3RsLmVuY29kZShzdHJva2UucG9zaXRpb24pO1xyXG5cdEZyRlguUG50VCA9IEZyRmwuZW5jb2RlKHN0cm9rZS5maWxsVHlwZSk7XHJcblx0RnJGWFsnTWQgICddID0gQmxuTS5lbmNvZGUoc3Ryb2tlLmJsZW5kTW9kZSk7XHJcblx0RnJGWC5PcGN0ID0gdW5pdHNQZXJjZW50KHN0cm9rZS5vcGFjaXR5KTtcclxuXHRGckZYWydTeiAgJ10gPSB1bml0c1ZhbHVlKHN0cm9rZS5zaXplLCAnc2l6ZScpO1xyXG5cdGlmIChzdHJva2UuY29sb3IpIEZyRlhbJ0NsciAnXSA9IHNlcmlhbGl6ZUNvbG9yKHN0cm9rZS5jb2xvcik7XHJcblx0aWYgKHN0cm9rZS5ncmFkaWVudCkgRnJGWCA9IHsgLi4uRnJGWCwgLi4uc2VyaWFsaXplR3JhZGllbnRDb250ZW50KHN0cm9rZS5ncmFkaWVudCkgfTtcclxuXHRpZiAoc3Ryb2tlLnBhdHRlcm4pIEZyRlggPSB7IC4uLkZyRlgsIC4uLnNlcmlhbGl6ZVBhdHRlcm5Db250ZW50KHN0cm9rZS5wYXR0ZXJuKSB9O1xyXG5cdGlmIChzdHJva2Uub3ZlcnByaW50ICE9PSB1bmRlZmluZWQpIEZyRlgub3ZlcnByaW50ID0gISFzdHJva2Uub3ZlcnByaW50O1xyXG5cdHJldHVybiBGckZYO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplRWZmZWN0cyhlOiBMYXllckVmZmVjdHNJbmZvLCBsb2c6IGJvb2xlYW4sIG11bHRpOiBib29sZWFuKSB7XHJcblx0Y29uc3QgaW5mbzogTGZ4MkRlc2NyaXB0b3IgJiBMbWZ4RGVzY3JpcHRvciA9IG11bHRpID8ge1xyXG5cdFx0J1NjbCAnOiB1bml0c1BlcmNlbnQoZS5zY2FsZSA/PyAxKSxcclxuXHRcdG1hc3RlckZYU3dpdGNoOiAhZS5kaXNhYmxlZCxcclxuXHR9IDoge1xyXG5cdFx0bWFzdGVyRlhTd2l0Y2g6ICFlLmRpc2FibGVkLFxyXG5cdFx0J1NjbCAnOiB1bml0c1BlcmNlbnQoZS5zY2FsZSA/PyAxKSxcclxuXHR9O1xyXG5cclxuXHRjb25zdCBhcnJheUtleXM6IChrZXlvZiBMYXllckVmZmVjdHNJbmZvKVtdID0gWydkcm9wU2hhZG93JywgJ2lubmVyU2hhZG93JywgJ3NvbGlkRmlsbCcsICdncmFkaWVudE92ZXJsYXknLCAnc3Ryb2tlJ107XHJcblx0Zm9yIChjb25zdCBrZXkgb2YgYXJyYXlLZXlzKSB7XHJcblx0XHRpZiAoZVtrZXldICYmICFBcnJheS5pc0FycmF5KGVba2V5XSkpIHRocm93IG5ldyBFcnJvcihgJHtrZXl9IHNob3VsZCBiZSBhbiBhcnJheWApO1xyXG5cdH1cclxuXHJcblx0aWYgKGUuZHJvcFNoYWRvdz8uWzBdICYmICFtdWx0aSkgaW5mby5EclNoID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUuZHJvcFNoYWRvd1swXSwgJ2Ryb3BTaGFkb3cnLCBsb2cpO1xyXG5cdGlmIChlLmRyb3BTaGFkb3c/LlswXSAmJiBtdWx0aSkgaW5mby5kcm9wU2hhZG93TXVsdGkgPSBlLmRyb3BTaGFkb3cubWFwKGkgPT4gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGksICdkcm9wU2hhZG93JywgbG9nKSk7XHJcblx0aWYgKGUuaW5uZXJTaGFkb3c/LlswXSAmJiAhbXVsdGkpIGluZm8uSXJTaCA9IHNlcmlhbGl6ZUVmZmVjdE9iamVjdChlLmlubmVyU2hhZG93WzBdLCAnaW5uZXJTaGFkb3cnLCBsb2cpO1xyXG5cdGlmIChlLmlubmVyU2hhZG93Py5bMF0gJiYgbXVsdGkpIGluZm8uaW5uZXJTaGFkb3dNdWx0aSA9IGUuaW5uZXJTaGFkb3cubWFwKGkgPT4gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGksICdpbm5lclNoYWRvdycsIGxvZykpO1xyXG5cdGlmIChlLm91dGVyR2xvdykgaW5mby5PckdsID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUub3V0ZXJHbG93LCAnb3V0ZXJHbG93JywgbG9nKTtcclxuXHRpZiAoZS5zb2xpZEZpbGw/LlswXSAmJiBtdWx0aSkgaW5mby5zb2xpZEZpbGxNdWx0aSA9IGUuc29saWRGaWxsLm1hcChpID0+IHNlcmlhbGl6ZUVmZmVjdE9iamVjdChpLCAnc29saWRGaWxsJywgbG9nKSk7XHJcblx0aWYgKGUuZ3JhZGllbnRPdmVybGF5Py5bMF0gJiYgbXVsdGkpIGluZm8uZ3JhZGllbnRGaWxsTXVsdGkgPSBlLmdyYWRpZW50T3ZlcmxheS5tYXAoaSA9PiBzZXJpYWxpemVFZmZlY3RPYmplY3QoaSwgJ2dyYWRpZW50T3ZlcmxheScsIGxvZykpO1xyXG5cdGlmIChlLnN0cm9rZT8uWzBdICYmIG11bHRpKSBpbmZvLmZyYW1lRlhNdWx0aSA9IGUuc3Ryb2tlLm1hcChpID0+IHNlcmlhbGl6ZUZ4T2JqZWN0KGkpKTtcclxuXHRpZiAoZS5pbm5lckdsb3cpIGluZm8uSXJHbCA9IHNlcmlhbGl6ZUVmZmVjdE9iamVjdChlLmlubmVyR2xvdywgJ2lubmVyR2xvdycsIGxvZyk7XHJcblx0aWYgKGUuYmV2ZWwpIGluZm8uZWJibCA9IHNlcmlhbGl6ZUVmZmVjdE9iamVjdChlLmJldmVsLCAnYmV2ZWwnLCBsb2cpO1xyXG5cdGlmIChlLnNvbGlkRmlsbD8uWzBdICYmICFtdWx0aSkgaW5mby5Tb0ZpID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUuc29saWRGaWxsWzBdLCAnc29saWRGaWxsJywgbG9nKTtcclxuXHRpZiAoZS5wYXR0ZXJuT3ZlcmxheSkgaW5mby5wYXR0ZXJuRmlsbCA9IHNlcmlhbGl6ZUVmZmVjdE9iamVjdChlLnBhdHRlcm5PdmVybGF5LCAncGF0dGVybk92ZXJsYXknLCBsb2cpO1xyXG5cdGlmIChlLmdyYWRpZW50T3ZlcmxheT8uWzBdICYmICFtdWx0aSkgaW5mby5HckZsID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUuZ3JhZGllbnRPdmVybGF5WzBdLCAnZ3JhZGllbnRPdmVybGF5JywgbG9nKTtcclxuXHRpZiAoZS5zYXRpbikgaW5mby5DaEZYID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUuc2F0aW4sICdzYXRpbicsIGxvZyk7XHJcblx0aWYgKGUuc3Ryb2tlPy5bMF0gJiYgIW11bHRpKSBpbmZvLkZyRlggPSBzZXJpYWxpemVGeE9iamVjdChlLnN0cm9rZT8uWzBdKTtcclxuXHJcblx0aWYgKG11bHRpKSB7XHJcblx0XHRpbmZvLm51bU1vZGlmeWluZ0ZYID0gMDtcclxuXHJcblx0XHRmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhlKSkge1xyXG5cdFx0XHRjb25zdCB2YWx1ZSA9IChlIGFzIGFueSlba2V5XTtcclxuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcblx0XHRcdFx0Zm9yIChjb25zdCBlZmZlY3Qgb2YgdmFsdWUpIHtcclxuXHRcdFx0XHRcdGlmIChlZmZlY3QuZW5hYmxlZCkgaW5mby5udW1Nb2RpZnlpbmdGWCsrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGluZm87XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUVmZmVjdHMoaW5mbzogTGZ4MkRlc2NyaXB0b3IgJiBMbWZ4RGVzY3JpcHRvciwgbG9nOiBib29sZWFuKSB7XHJcblx0Y29uc3QgZWZmZWN0czogTGF5ZXJFZmZlY3RzSW5mbyA9IHt9O1xyXG5cdGlmICghaW5mby5tYXN0ZXJGWFN3aXRjaCkgZWZmZWN0cy5kaXNhYmxlZCA9IHRydWU7XHJcblx0aWYgKGluZm9bJ1NjbCAnXSkgZWZmZWN0cy5zY2FsZSA9IHBhcnNlUGVyY2VudChpbmZvWydTY2wgJ10pO1xyXG5cdGlmIChpbmZvLkRyU2gpIGVmZmVjdHMuZHJvcFNoYWRvdyA9IFtwYXJzZUVmZmVjdE9iamVjdChpbmZvLkRyU2gsIGxvZyldO1xyXG5cdGlmIChpbmZvLmRyb3BTaGFkb3dNdWx0aSkgZWZmZWN0cy5kcm9wU2hhZG93ID0gaW5mby5kcm9wU2hhZG93TXVsdGkubWFwKGkgPT4gcGFyc2VFZmZlY3RPYmplY3QoaSwgbG9nKSk7XHJcblx0aWYgKGluZm8uSXJTaCkgZWZmZWN0cy5pbm5lclNoYWRvdyA9IFtwYXJzZUVmZmVjdE9iamVjdChpbmZvLklyU2gsIGxvZyldO1xyXG5cdGlmIChpbmZvLmlubmVyU2hhZG93TXVsdGkpIGVmZmVjdHMuaW5uZXJTaGFkb3cgPSBpbmZvLmlubmVyU2hhZG93TXVsdGkubWFwKGkgPT4gcGFyc2VFZmZlY3RPYmplY3QoaSwgbG9nKSk7XHJcblx0aWYgKGluZm8uT3JHbCkgZWZmZWN0cy5vdXRlckdsb3cgPSBwYXJzZUVmZmVjdE9iamVjdChpbmZvLk9yR2wsIGxvZyk7XHJcblx0aWYgKGluZm8uSXJHbCkgZWZmZWN0cy5pbm5lckdsb3cgPSBwYXJzZUVmZmVjdE9iamVjdChpbmZvLklyR2wsIGxvZyk7XHJcblx0aWYgKGluZm8uZWJibCkgZWZmZWN0cy5iZXZlbCA9IHBhcnNlRWZmZWN0T2JqZWN0KGluZm8uZWJibCwgbG9nKTtcclxuXHRpZiAoaW5mby5Tb0ZpKSBlZmZlY3RzLnNvbGlkRmlsbCA9IFtwYXJzZUVmZmVjdE9iamVjdChpbmZvLlNvRmksIGxvZyldO1xyXG5cdGlmIChpbmZvLnNvbGlkRmlsbE11bHRpKSBlZmZlY3RzLnNvbGlkRmlsbCA9IGluZm8uc29saWRGaWxsTXVsdGkubWFwKGkgPT4gcGFyc2VFZmZlY3RPYmplY3QoaSwgbG9nKSk7XHJcblx0aWYgKGluZm8ucGF0dGVybkZpbGwpIGVmZmVjdHMucGF0dGVybk92ZXJsYXkgPSBwYXJzZUVmZmVjdE9iamVjdChpbmZvLnBhdHRlcm5GaWxsLCBsb2cpO1xyXG5cdGlmIChpbmZvLkdyRmwpIGVmZmVjdHMuZ3JhZGllbnRPdmVybGF5ID0gW3BhcnNlRWZmZWN0T2JqZWN0KGluZm8uR3JGbCwgbG9nKV07XHJcblx0aWYgKGluZm8uZ3JhZGllbnRGaWxsTXVsdGkpIGVmZmVjdHMuZ3JhZGllbnRPdmVybGF5ID0gaW5mby5ncmFkaWVudEZpbGxNdWx0aS5tYXAoaSA9PiBwYXJzZUVmZmVjdE9iamVjdChpLCBsb2cpKTtcclxuXHRpZiAoaW5mby5DaEZYKSBlZmZlY3RzLnNhdGluID0gcGFyc2VFZmZlY3RPYmplY3QoaW5mby5DaEZYLCBsb2cpO1xyXG5cdGlmIChpbmZvLkZyRlgpIGVmZmVjdHMuc3Ryb2tlID0gW3BhcnNlRnhPYmplY3QoaW5mby5GckZYKV07XHJcblx0aWYgKGluZm8uZnJhbWVGWE11bHRpKSBlZmZlY3RzLnN0cm9rZSA9IGluZm8uZnJhbWVGWE11bHRpLm1hcChpID0+IHBhcnNlRnhPYmplY3QoaSkpO1xyXG5cdHJldHVybiBlZmZlY3RzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZUtleUxpc3Qoa2V5TGlzdDogVGltZWxpbmVLZXlEZXNjcmlwdG9yW10sIGxvZ01pc3NpbmdGZWF0dXJlczogYm9vbGVhbikge1xyXG5cdGNvbnN0IGtleXM6IFRpbWVsaW5lS2V5W10gPSBbXTtcclxuXHJcblx0Zm9yIChsZXQgaiA9IDA7IGogPCBrZXlMaXN0Lmxlbmd0aDsgaisrKSB7XHJcblx0XHRjb25zdCBrZXkgPSBrZXlMaXN0W2pdO1xyXG5cdFx0Y29uc3QgeyB0aW1lLCBzZWxlY3RlZCwgYW5pbUtleSB9ID0ga2V5O1xyXG5cdFx0Y29uc3QgaW50ZXJwb2xhdGlvbiA9IGFuaW1JbnRlcnBTdHlsZUVudW0uZGVjb2RlKGtleS5hbmltSW50ZXJwU3R5bGUpO1xyXG5cclxuXHRcdHN3aXRjaCAoYW5pbUtleS5UeXBlKSB7XHJcblx0XHRcdGNhc2UgJ2tleVR5cGUuT3BjdCc6XHJcblx0XHRcdFx0a2V5cy5wdXNoKHsgaW50ZXJwb2xhdGlvbiwgdGltZSwgc2VsZWN0ZWQsIHR5cGU6ICdvcGFjaXR5JywgdmFsdWU6IHBhcnNlUGVyY2VudChhbmltS2V5Lk9wY3QpIH0pO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdrZXlUeXBlLlBzdG4nOlxyXG5cdFx0XHRcdGtleXMucHVzaCh7IGludGVycG9sYXRpb24sIHRpbWUsIHNlbGVjdGVkLCB0eXBlOiAncG9zaXRpb24nLCB4OiBhbmltS2V5Lkhyem4sIHk6IGFuaW1LZXkuVnJ0YyB9KTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAna2V5VHlwZS5Ucm5mJzpcclxuXHRcdFx0XHRrZXlzLnB1c2goe1xyXG5cdFx0XHRcdFx0aW50ZXJwb2xhdGlvbiwgdGltZSwgc2VsZWN0ZWQsIHR5cGU6ICd0cmFuc2Zvcm0nLFxyXG5cdFx0XHRcdFx0c2NhbGU6IGhvcnpWcnRjVG9YWShhbmltS2V5WydTY2wgJ10pLCBza2V3OiBob3J6VnJ0Y1RvWFkoYW5pbUtleS5Ta2V3KSwgcm90YXRpb246IGFuaW1LZXkucm90YXRpb24sIHRyYW5zbGF0aW9uOiBob3J6VnJ0Y1RvWFkoYW5pbUtleS50cmFuc2xhdGlvbilcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAna2V5VHlwZS5zaGVldFN0eWxlJzoge1xyXG5cdFx0XHRcdGNvbnN0IGtleTogVGltZWxpbmVLZXkgPSB7IGludGVycG9sYXRpb24sIHRpbWUsIHNlbGVjdGVkLCB0eXBlOiAnc3R5bGUnIH07XHJcblx0XHRcdFx0aWYgKGFuaW1LZXkuc2hlZXRTdHlsZS5MZWZ4KSBrZXkuc3R5bGUgPSBwYXJzZUVmZmVjdHMoYW5pbUtleS5zaGVldFN0eWxlLkxlZngsIGxvZ01pc3NpbmdGZWF0dXJlcyk7XHJcblx0XHRcdFx0a2V5cy5wdXNoKGtleSk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2FzZSAna2V5VHlwZS5nbG9iYWxMaWdodGluZyc6IHtcclxuXHRcdFx0XHRrZXlzLnB1c2goe1xyXG5cdFx0XHRcdFx0aW50ZXJwb2xhdGlvbiwgdGltZSwgc2VsZWN0ZWQsIHR5cGU6ICdnbG9iYWxMaWdodGluZycsXHJcblx0XHRcdFx0XHRnbG9iYWxBbmdsZTogYW5pbUtleS5nYmxBLCBnbG9iYWxBbHRpdHVkZTogYW5pbUtleS5nbG9iYWxBbHRpdHVkZVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHRcdGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQga2V5VHlwZSB2YWx1ZWApO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGtleXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNlcmlhbGl6ZUtleUxpc3Qoa2V5czogVGltZWxpbmVLZXlbXSk6IFRpbWVsaW5lS2V5RGVzY3JpcHRvcltdIHtcclxuXHRjb25zdCBrZXlMaXN0OiBUaW1lbGluZUtleURlc2NyaXB0b3JbXSA9IFtdO1xyXG5cclxuXHRmb3IgKGxldCBqID0gMDsgaiA8IGtleXMubGVuZ3RoOyBqKyspIHtcclxuXHRcdGNvbnN0IGtleSA9IGtleXNbal07XHJcblx0XHRjb25zdCB7IHRpbWUsIHNlbGVjdGVkID0gZmFsc2UsIGludGVycG9sYXRpb24gfSA9IGtleTtcclxuXHRcdGNvbnN0IGFuaW1JbnRlcnBTdHlsZSA9IGFuaW1JbnRlcnBTdHlsZUVudW0uZW5jb2RlKGludGVycG9sYXRpb24pIGFzICdhbmltSW50ZXJwU3R5bGUuTG5yICcgfCAnYW5pbUludGVycFN0eWxlLmhvbGQnO1xyXG5cdFx0bGV0IGFuaW1LZXk6IFRpbWVsaW5lQW5pbUtleURlc2NyaXB0b3I7XHJcblxyXG5cdFx0c3dpdGNoIChrZXkudHlwZSkge1xyXG5cdFx0XHRjYXNlICdvcGFjaXR5JzpcclxuXHRcdFx0XHRhbmltS2V5ID0geyBUeXBlOiAna2V5VHlwZS5PcGN0JywgT3BjdDogdW5pdHNQZXJjZW50KGtleS52YWx1ZSkgfTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAncG9zaXRpb24nOlxyXG5cdFx0XHRcdGFuaW1LZXkgPSB7IFR5cGU6ICdrZXlUeXBlLlBzdG4nLCBIcnpuOiBrZXkueCwgVnJ0Yzoga2V5LnkgfTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAndHJhbnNmb3JtJzpcclxuXHRcdFx0XHRhbmltS2V5ID0geyBUeXBlOiAna2V5VHlwZS5Ucm5mJywgJ1NjbCAnOiB4eVRvSG9yelZydGMoa2V5LnNjYWxlKSwgU2tldzogeHlUb0hvcnpWcnRjKGtleS5za2V3KSwgcm90YXRpb246IGtleS5yb3RhdGlvbiwgdHJhbnNsYXRpb246IHh5VG9Ib3J6VnJ0YyhrZXkudHJhbnNsYXRpb24pIH07XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ3N0eWxlJzpcclxuXHRcdFx0XHRhbmltS2V5ID0geyBUeXBlOiAna2V5VHlwZS5zaGVldFN0eWxlJywgc2hlZXRTdHlsZTogeyBWcnNuOiAxLCBibGVuZE9wdGlvbnM6IHt9IH0gfTtcclxuXHRcdFx0XHRpZiAoa2V5LnN0eWxlKSBhbmltS2V5LnNoZWV0U3R5bGUgPSB7IFZyc246IDEsIExlZng6IHNlcmlhbGl6ZUVmZmVjdHMoa2V5LnN0eWxlLCBmYWxzZSwgZmFsc2UpLCBibGVuZE9wdGlvbnM6IHt9IH07XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ2dsb2JhbExpZ2h0aW5nJzoge1xyXG5cdFx0XHRcdGFuaW1LZXkgPSB7IFR5cGU6ICdrZXlUeXBlLmdsb2JhbExpZ2h0aW5nJywgZ2JsQToga2V5Lmdsb2JhbEFuZ2xlLCBnbG9iYWxBbHRpdHVkZToga2V5Lmdsb2JhbEFsdGl0dWRlIH07XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0ZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBrZXlUeXBlIHZhbHVlYCk7XHJcblx0XHR9XHJcblxyXG5cdFx0a2V5TGlzdC5wdXNoKHsgVnJzbjogMSwgYW5pbUludGVycFN0eWxlLCB0aW1lLCBhbmltS2V5LCBzZWxlY3RlZCB9KTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBrZXlMaXN0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUcmFja0xpc3QodHJhY2tMaXN0OiBUaW1lbGluZVRyYWNrRGVzY3JpcHRvcltdLCBsb2dNaXNzaW5nRmVhdHVyZXM6IGJvb2xlYW4pIHtcclxuXHRjb25zdCB0cmFja3M6IFRpbWVsaW5lVHJhY2tbXSA9IFtdO1xyXG5cclxuXHRmb3IgKGxldCBpID0gMDsgaSA8IHRyYWNrTGlzdC5sZW5ndGg7IGkrKykge1xyXG5cdFx0Y29uc3QgdHIgPSB0cmFja0xpc3RbaV07XHJcblx0XHRjb25zdCB0cmFjazogVGltZWxpbmVUcmFjayA9IHtcclxuXHRcdFx0dHlwZTogc3RkVHJhY2tJRC5kZWNvZGUodHIudHJhY2tJRCksXHJcblx0XHRcdGVuYWJsZWQ6IHRyLmVuYWIsXHJcblx0XHRcdGtleXM6IHBhcnNlS2V5TGlzdCh0ci5rZXlMaXN0LCBsb2dNaXNzaW5nRmVhdHVyZXMpLFxyXG5cdFx0fTtcclxuXHJcblx0XHRpZiAodHIuZWZmZWN0UGFyYW1zKSB7XHJcblx0XHRcdHRyYWNrLmVmZmVjdFBhcmFtcyA9IHtcclxuXHRcdFx0XHRmaWxsQ2FudmFzOiB0ci5lZmZlY3RQYXJhbXMuZmlsbENhbnZhcyxcclxuXHRcdFx0XHR6b29tT3JpZ2luOiB0ci5lZmZlY3RQYXJhbXMuem9vbU9yaWdpbixcclxuXHRcdFx0XHRrZXlzOiBwYXJzZUtleUxpc3QodHIuZWZmZWN0UGFyYW1zLmtleUxpc3QsIGxvZ01pc3NpbmdGZWF0dXJlcyksXHJcblx0XHRcdH07XHJcblx0XHR9XHJcblxyXG5cdFx0dHJhY2tzLnB1c2godHJhY2spO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRyYWNrcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVRyYWNrTGlzdCh0cmFja3M6IFRpbWVsaW5lVHJhY2tbXSk6IFRpbWVsaW5lVHJhY2tEZXNjcmlwdG9yW10ge1xyXG5cdGNvbnN0IHRyYWNrTGlzdDogVGltZWxpbmVUcmFja0Rlc2NyaXB0b3JbXSA9IFtdO1xyXG5cclxuXHRmb3IgKGxldCBpID0gMDsgaSA8IHRyYWNrcy5sZW5ndGg7IGkrKykge1xyXG5cdFx0Y29uc3QgdCA9IHRyYWNrc1tpXTtcclxuXHRcdHRyYWNrTGlzdC5wdXNoKHtcclxuXHRcdFx0dHJhY2tJRDogc3RkVHJhY2tJRC5lbmNvZGUodC50eXBlKSBhcyBhbnksXHJcblx0XHRcdFZyc246IDEsXHJcblx0XHRcdGVuYWI6ICEhdC5lbmFibGVkLFxyXG5cdFx0XHRFZmZjOiAhIXQuZWZmZWN0UGFyYW1zLFxyXG5cdFx0XHQuLi4odC5lZmZlY3RQYXJhbXMgPyB7XHJcblx0XHRcdFx0ZWZmZWN0UGFyYW1zOiB7XHJcblx0XHRcdFx0XHRrZXlMaXN0OiBzZXJpYWxpemVLZXlMaXN0KHQua2V5cyksXHJcblx0XHRcdFx0XHRmaWxsQ2FudmFzOiB0LmVmZmVjdFBhcmFtcy5maWxsQ2FudmFzLFxyXG5cdFx0XHRcdFx0em9vbU9yaWdpbjogdC5lZmZlY3RQYXJhbXMuem9vbU9yaWdpbixcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gOiB7fSksXHJcblx0XHRcdGtleUxpc3Q6IHNlcmlhbGl6ZUtleUxpc3QodC5rZXlzKSxcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRyYWNrTGlzdDtcclxufVxyXG5cclxudHlwZSBBbGxFZmZlY3RzID0gTGF5ZXJFZmZlY3RTaGFkb3cgJiBMYXllckVmZmVjdHNPdXRlckdsb3cgJiBMYXllckVmZmVjdFN0cm9rZSAmXHJcblx0TGF5ZXJFZmZlY3RJbm5lckdsb3cgJiBMYXllckVmZmVjdEJldmVsICYgTGF5ZXJFZmZlY3RTb2xpZEZpbGwgJlxyXG5cdExheWVyRWZmZWN0UGF0dGVybk92ZXJsYXkgJiBMYXllckVmZmVjdFNhdGluICYgTGF5ZXJFZmZlY3RHcmFkaWVudE92ZXJsYXk7XHJcblxyXG5mdW5jdGlvbiBwYXJzZUVmZmVjdE9iamVjdChvYmo6IGFueSwgcmVwb3J0RXJyb3JzOiBib29sZWFuKSB7XHJcblx0Y29uc3QgcmVzdWx0OiBBbGxFZmZlY3RzID0ge30gYXMgYW55O1xyXG5cclxuXHRmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhvYmopKSB7XHJcblx0XHRjb25zdCB2YWwgPSBvYmpba2V5XTtcclxuXHJcblx0XHRzd2l0Y2ggKGtleSkge1xyXG5cdFx0XHRjYXNlICdlbmFiJzogcmVzdWx0LmVuYWJsZWQgPSAhIXZhbDsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3VnbGcnOiByZXN1bHQudXNlR2xvYmFsTGlnaHQgPSAhIXZhbDsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ0FudEEnOiByZXN1bHQuYW50aWFsaWFzZWQgPSAhIXZhbDsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ0FsZ24nOiByZXN1bHQuYWxpZ24gPSAhIXZhbDsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ0R0aHInOiByZXN1bHQuZGl0aGVyID0gISF2YWw7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdJbnZyJzogcmVzdWx0LmludmVydCA9ICEhdmFsOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnUnZycyc6IHJlc3VsdC5yZXZlcnNlID0gISF2YWw7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdDbHIgJzogcmVzdWx0LmNvbG9yID0gcGFyc2VDb2xvcih2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnaGdsQyc6IHJlc3VsdC5oaWdobGlnaHRDb2xvciA9IHBhcnNlQ29sb3IodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3Nkd0MnOiByZXN1bHQuc2hhZG93Q29sb3IgPSBwYXJzZUNvbG9yKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdTdHlsJzogcmVzdWx0LnBvc2l0aW9uID0gRlN0bC5kZWNvZGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ01kICAnOiByZXN1bHQuYmxlbmRNb2RlID0gQmxuTS5kZWNvZGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2hnbE0nOiByZXN1bHQuaGlnaGxpZ2h0QmxlbmRNb2RlID0gQmxuTS5kZWNvZGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3Nkd00nOiByZXN1bHQuc2hhZG93QmxlbmRNb2RlID0gQmxuTS5kZWNvZGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2J2bFMnOiByZXN1bHQuc3R5bGUgPSBCRVNsLmRlY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnYnZsRCc6IHJlc3VsdC5kaXJlY3Rpb24gPSBCRVNzLmRlY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnYnZsVCc6IHJlc3VsdC50ZWNobmlxdWUgPSBidmxULmRlY29kZSh2YWwpIGFzIGFueTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ0dsd1QnOiByZXN1bHQudGVjaG5pcXVlID0gQkVURS5kZWNvZGUodmFsKSBhcyBhbnk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdnbHdTJzogcmVzdWx0LnNvdXJjZSA9IElHU3IuZGVjb2RlKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdUeXBlJzogcmVzdWx0LnR5cGUgPSBHcmRULmRlY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnZ3M5OSc6IHJlc3VsdC5pbnRlcnBvbGF0aW9uTWV0aG9kID0gZ3JhZGllbnRJbnRlcnBvbGF0aW9uTWV0aG9kVHlwZS5kZWNvZGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ09wY3QnOiByZXN1bHQub3BhY2l0eSA9IHBhcnNlUGVyY2VudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnaGdsTyc6IHJlc3VsdC5oaWdobGlnaHRPcGFjaXR5ID0gcGFyc2VQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdzZHdPJzogcmVzdWx0LnNoYWRvd09wYWNpdHkgPSBwYXJzZVBlcmNlbnQodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2xhZ2wnOiByZXN1bHQuYW5nbGUgPSBwYXJzZUFuZ2xlKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdBbmdsJzogcmVzdWx0LmFuZ2xlID0gcGFyc2VBbmdsZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnTGFsZCc6IHJlc3VsdC5hbHRpdHVkZSA9IHBhcnNlQW5nbGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ1NmdG4nOiByZXN1bHQuc29mdGVuID0gcGFyc2VVbml0cyh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnc3JnUic6IHJlc3VsdC5zdHJlbmd0aCA9IHBhcnNlUGVyY2VudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnYmx1cic6IHJlc3VsdC5zaXplID0gcGFyc2VVbml0cyh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnTm9zZSc6IHJlc3VsdC5ub2lzZSA9IHBhcnNlUGVyY2VudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnSW5wcic6IHJlc3VsdC5yYW5nZSA9IHBhcnNlUGVyY2VudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnQ2ttdCc6IHJlc3VsdC5jaG9rZSA9IHBhcnNlVW5pdHModmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ1NoZE4nOiByZXN1bHQuaml0dGVyID0gcGFyc2VQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdEc3RuJzogcmVzdWx0LmRpc3RhbmNlID0gcGFyc2VVbml0cyh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnU2NsICc6IHJlc3VsdC5zY2FsZSA9IHBhcnNlUGVyY2VudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnUHRybic6IHJlc3VsdC5wYXR0ZXJuID0geyBuYW1lOiB2YWxbJ05tICAnXSwgaWQ6IHZhbC5JZG50IH07IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdwaGFzZSc6IHJlc3VsdC5waGFzZSA9IHsgeDogdmFsLkhyem4sIHk6IHZhbC5WcnRjIH07IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdPZnN0JzogcmVzdWx0Lm9mZnNldCA9IHsgeDogcGFyc2VQZXJjZW50KHZhbC5IcnpuKSwgeTogcGFyc2VQZXJjZW50KHZhbC5WcnRjKSB9OyBicmVhaztcclxuXHRcdFx0Y2FzZSAnTXBnUyc6XHJcblx0XHRcdGNhc2UgJ1RyblMnOlxyXG5cdFx0XHRcdHJlc3VsdC5jb250b3VyID0ge1xyXG5cdFx0XHRcdFx0bmFtZTogdmFsWydObSAgJ10sXHJcblx0XHRcdFx0XHRjdXJ2ZTogKHZhbFsnQ3J2ICddIGFzIGFueVtdKS5tYXAocCA9PiAoeyB4OiBwLkhyem4sIHk6IHAuVnJ0YyB9KSksXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnR3JhZCc6IHJlc3VsdC5ncmFkaWVudCA9IHBhcnNlR3JhZGllbnQodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3VzZVRleHR1cmUnOlxyXG5cdFx0XHRjYXNlICd1c2VTaGFwZSc6XHJcblx0XHRcdGNhc2UgJ2xheWVyQ29uY2VhbHMnOlxyXG5cdFx0XHRjYXNlICdwcmVzZW50JzpcclxuXHRcdFx0Y2FzZSAnc2hvd0luRGlhbG9nJzpcclxuXHRcdFx0Y2FzZSAnYW50aWFsaWFzR2xvc3MnOiByZXN1bHRba2V5XSA9IHZhbDsgYnJlYWs7XHJcblx0XHRcdGRlZmF1bHQ6XHJcblx0XHRcdFx0cmVwb3J0RXJyb3JzICYmIGNvbnNvbGUubG9nKGBJbnZhbGlkIGVmZmVjdCBrZXk6ICcke2tleX0nLCB2YWx1ZTpgLCB2YWwpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZnVuY3Rpb24gc2VyaWFsaXplRWZmZWN0T2JqZWN0KG9iajogYW55LCBvYmpOYW1lOiBzdHJpbmcsIHJlcG9ydEVycm9yczogYm9vbGVhbikge1xyXG5cdGNvbnN0IHJlc3VsdDogYW55ID0ge307XHJcblxyXG5cdGZvciAoY29uc3Qgb2JqS2V5IG9mIE9iamVjdC5rZXlzKG9iaikpIHtcclxuXHRcdGNvbnN0IGtleToga2V5b2YgQWxsRWZmZWN0cyA9IG9iaktleSBhcyBhbnk7XHJcblx0XHRjb25zdCB2YWwgPSBvYmpba2V5XTtcclxuXHJcblx0XHRzd2l0Y2ggKGtleSkge1xyXG5cdFx0XHRjYXNlICdlbmFibGVkJzogcmVzdWx0LmVuYWIgPSAhIXZhbDsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3VzZUdsb2JhbExpZ2h0JzogcmVzdWx0LnVnbGcgPSAhIXZhbDsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2FudGlhbGlhc2VkJzogcmVzdWx0LkFudEEgPSAhIXZhbDsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2FsaWduJzogcmVzdWx0LkFsZ24gPSAhIXZhbDsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2RpdGhlcic6IHJlc3VsdC5EdGhyID0gISF2YWw7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdpbnZlcnQnOiByZXN1bHQuSW52ciA9ICEhdmFsOyBicmVhaztcclxuXHRcdFx0Y2FzZSAncmV2ZXJzZSc6IHJlc3VsdC5SdnJzID0gISF2YWw7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdjb2xvcic6IHJlc3VsdFsnQ2xyICddID0gc2VyaWFsaXplQ29sb3IodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2hpZ2hsaWdodENvbG9yJzogcmVzdWx0LmhnbEMgPSBzZXJpYWxpemVDb2xvcih2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnc2hhZG93Q29sb3InOiByZXN1bHQuc2R3QyA9IHNlcmlhbGl6ZUNvbG9yKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdwb3NpdGlvbic6IHJlc3VsdC5TdHlsID0gRlN0bC5lbmNvZGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2JsZW5kTW9kZSc6IHJlc3VsdFsnTWQgICddID0gQmxuTS5lbmNvZGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2hpZ2hsaWdodEJsZW5kTW9kZSc6IHJlc3VsdC5oZ2xNID0gQmxuTS5lbmNvZGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3NoYWRvd0JsZW5kTW9kZSc6IHJlc3VsdC5zZHdNID0gQmxuTS5lbmNvZGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3N0eWxlJzogcmVzdWx0LmJ2bFMgPSBCRVNsLmVuY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnZGlyZWN0aW9uJzogcmVzdWx0LmJ2bEQgPSBCRVNzLmVuY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAndGVjaG5pcXVlJzpcclxuXHRcdFx0XHRpZiAob2JqTmFtZSA9PT0gJ2JldmVsJykge1xyXG5cdFx0XHRcdFx0cmVzdWx0LmJ2bFQgPSBidmxULmVuY29kZSh2YWwpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRyZXN1bHQuR2x3VCA9IEJFVEUuZW5jb2RlKHZhbCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdzb3VyY2UnOiByZXN1bHQuZ2x3UyA9IElHU3IuZW5jb2RlKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICd0eXBlJzogcmVzdWx0LlR5cGUgPSBHcmRULmVuY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnaW50ZXJwb2xhdGlvbk1ldGhvZCc6IHJlc3VsdC5nczk5ID0gZ3JhZGllbnRJbnRlcnBvbGF0aW9uTWV0aG9kVHlwZS5lbmNvZGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ29wYWNpdHknOiByZXN1bHQuT3BjdCA9IHVuaXRzUGVyY2VudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnaGlnaGxpZ2h0T3BhY2l0eSc6IHJlc3VsdC5oZ2xPID0gdW5pdHNQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdzaGFkb3dPcGFjaXR5JzogcmVzdWx0LnNkd08gPSB1bml0c1BlcmNlbnQodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2FuZ2xlJzpcclxuXHRcdFx0XHRpZiAob2JqTmFtZSA9PT0gJ2dyYWRpZW50T3ZlcmxheScpIHtcclxuXHRcdFx0XHRcdHJlc3VsdC5BbmdsID0gdW5pdHNBbmdsZSh2YWwpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRyZXN1bHQubGFnbCA9IHVuaXRzQW5nbGUodmFsKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ2FsdGl0dWRlJzogcmVzdWx0LkxhbGQgPSB1bml0c0FuZ2xlKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdzb2Z0ZW4nOiByZXN1bHQuU2Z0biA9IHVuaXRzVmFsdWUodmFsLCBrZXkpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnc3RyZW5ndGgnOiByZXN1bHQuc3JnUiA9IHVuaXRzUGVyY2VudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnc2l6ZSc6IHJlc3VsdC5ibHVyID0gdW5pdHNWYWx1ZSh2YWwsIGtleSk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdub2lzZSc6IHJlc3VsdC5Ob3NlID0gdW5pdHNQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdyYW5nZSc6IHJlc3VsdC5JbnByID0gdW5pdHNQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdjaG9rZSc6IHJlc3VsdC5Da210ID0gdW5pdHNWYWx1ZSh2YWwsIGtleSk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdqaXR0ZXInOiByZXN1bHQuU2hkTiA9IHVuaXRzUGVyY2VudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnZGlzdGFuY2UnOiByZXN1bHQuRHN0biA9IHVuaXRzVmFsdWUodmFsLCBrZXkpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnc2NhbGUnOiByZXN1bHRbJ1NjbCAnXSA9IHVuaXRzUGVyY2VudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAncGF0dGVybic6IHJlc3VsdC5QdHJuID0geyAnTm0gICc6IHZhbC5uYW1lLCBJZG50OiB2YWwuaWQgfTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3BoYXNlJzogcmVzdWx0LnBoYXNlID0geyBIcnpuOiB2YWwueCwgVnJ0YzogdmFsLnkgfTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ29mZnNldCc6IHJlc3VsdC5PZnN0ID0geyBIcnpuOiB1bml0c1BlcmNlbnQodmFsLngpLCBWcnRjOiB1bml0c1BlcmNlbnQodmFsLnkpIH07IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdjb250b3VyJzoge1xyXG5cdFx0XHRcdHJlc3VsdFtvYmpOYW1lID09PSAnc2F0aW4nID8gJ01wZ1MnIDogJ1RyblMnXSA9IHtcclxuXHRcdFx0XHRcdCdObSAgJzogKHZhbCBhcyBFZmZlY3RDb250b3VyKS5uYW1lLFxyXG5cdFx0XHRcdFx0J0NydiAnOiAodmFsIGFzIEVmZmVjdENvbnRvdXIpLmN1cnZlLm1hcChwID0+ICh7IEhyem46IHAueCwgVnJ0YzogcC55IH0pKSxcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNhc2UgJ2dyYWRpZW50JzogcmVzdWx0LkdyYWQgPSBzZXJpYWxpemVHcmFkaWVudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAndXNlVGV4dHVyZSc6XHJcblx0XHRcdGNhc2UgJ3VzZVNoYXBlJzpcclxuXHRcdFx0Y2FzZSAnbGF5ZXJDb25jZWFscyc6XHJcblx0XHRcdGNhc2UgJ3ByZXNlbnQnOlxyXG5cdFx0XHRjYXNlICdzaG93SW5EaWFsb2cnOlxyXG5cdFx0XHRjYXNlICdhbnRpYWxpYXNHbG9zcyc6XHJcblx0XHRcdFx0cmVzdWx0W2tleV0gPSB2YWw7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGRlZmF1bHQ6XHJcblx0XHRcdFx0cmVwb3J0RXJyb3JzICYmIGNvbnNvbGUubG9nKGBJbnZhbGlkIGVmZmVjdCBrZXk6ICcke2tleX0nLCB2YWx1ZTpgLCB2YWwpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VHcmFkaWVudChncmFkOiBEZXNjaXB0b3JHcmFkaWVudCk6IEVmZmVjdFNvbGlkR3JhZGllbnQgfCBFZmZlY3ROb2lzZUdyYWRpZW50IHtcclxuXHRpZiAoZ3JhZC5HcmRGID09PSAnR3JkRi5Dc3RTJykge1xyXG5cdFx0Y29uc3Qgc2FtcGxlczogbnVtYmVyID0gZ3JhZC5JbnRyIHx8IDQwOTY7XHJcblxyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0dHlwZTogJ3NvbGlkJyxcclxuXHRcdFx0bmFtZTogZ3JhZFsnTm0gICddLFxyXG5cdFx0XHRzbW9vdGhuZXNzOiBncmFkLkludHIgLyA0MDk2LFxyXG5cdFx0XHRjb2xvclN0b3BzOiBncmFkLkNscnMubWFwKHMgPT4gKHtcclxuXHRcdFx0XHRjb2xvcjogcGFyc2VDb2xvcihzWydDbHIgJ10pLFxyXG5cdFx0XHRcdGxvY2F0aW9uOiBzLkxjdG4gLyBzYW1wbGVzLFxyXG5cdFx0XHRcdG1pZHBvaW50OiBzLk1kcG4gLyAxMDAsXHJcblx0XHRcdH0pKSxcclxuXHRcdFx0b3BhY2l0eVN0b3BzOiBncmFkLlRybnMubWFwKHMgPT4gKHtcclxuXHRcdFx0XHRvcGFjaXR5OiBwYXJzZVBlcmNlbnQocy5PcGN0KSxcclxuXHRcdFx0XHRsb2NhdGlvbjogcy5MY3RuIC8gc2FtcGxlcyxcclxuXHRcdFx0XHRtaWRwb2ludDogcy5NZHBuIC8gMTAwLFxyXG5cdFx0XHR9KSksXHJcblx0XHR9O1xyXG5cdH0gZWxzZSB7XHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHR0eXBlOiAnbm9pc2UnLFxyXG5cdFx0XHRuYW1lOiBncmFkWydObSAgJ10sXHJcblx0XHRcdHJvdWdobmVzczogZ3JhZC5TbXRoIC8gNDA5NixcclxuXHRcdFx0Y29sb3JNb2RlbDogQ2xyUy5kZWNvZGUoZ3JhZC5DbHJTKSxcclxuXHRcdFx0cmFuZG9tU2VlZDogZ3JhZC5SbmRTLFxyXG5cdFx0XHRyZXN0cmljdENvbG9yczogISFncmFkLlZjdEMsXHJcblx0XHRcdGFkZFRyYW5zcGFyZW5jeTogISFncmFkLlNoVHIsXHJcblx0XHRcdG1pbjogZ3JhZFsnTW5tICddLm1hcCh4ID0+IHggLyAxMDApLFxyXG5cdFx0XHRtYXg6IGdyYWRbJ014bSAnXS5tYXAoeCA9PiB4IC8gMTAwKSxcclxuXHRcdH07XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXJpYWxpemVHcmFkaWVudChncmFkOiBFZmZlY3RTb2xpZEdyYWRpZW50IHwgRWZmZWN0Tm9pc2VHcmFkaWVudCk6IERlc2NpcHRvckdyYWRpZW50IHtcclxuXHRpZiAoZ3JhZC50eXBlID09PSAnc29saWQnKSB7XHJcblx0XHRjb25zdCBzYW1wbGVzID0gTWF0aC5yb3VuZCgoZ3JhZC5zbW9vdGhuZXNzID8/IDEpICogNDA5Nik7XHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHQnTm0gICc6IGdyYWQubmFtZSB8fCAnJyxcclxuXHRcdFx0R3JkRjogJ0dyZEYuQ3N0UycsXHJcblx0XHRcdEludHI6IHNhbXBsZXMsXHJcblx0XHRcdENscnM6IGdyYWQuY29sb3JTdG9wcy5tYXAocyA9PiAoe1xyXG5cdFx0XHRcdCdDbHIgJzogc2VyaWFsaXplQ29sb3Iocy5jb2xvciksXHJcblx0XHRcdFx0VHlwZTogJ0NscnkuVXNyUycsXHJcblx0XHRcdFx0TGN0bjogTWF0aC5yb3VuZChzLmxvY2F0aW9uICogc2FtcGxlcyksXHJcblx0XHRcdFx0TWRwbjogTWF0aC5yb3VuZCgocy5taWRwb2ludCA/PyAwLjUpICogMTAwKSxcclxuXHRcdFx0fSkpLFxyXG5cdFx0XHRUcm5zOiBncmFkLm9wYWNpdHlTdG9wcy5tYXAocyA9PiAoe1xyXG5cdFx0XHRcdE9wY3Q6IHVuaXRzUGVyY2VudChzLm9wYWNpdHkpLFxyXG5cdFx0XHRcdExjdG46IE1hdGgucm91bmQocy5sb2NhdGlvbiAqIHNhbXBsZXMpLFxyXG5cdFx0XHRcdE1kcG46IE1hdGgucm91bmQoKHMubWlkcG9pbnQgPz8gMC41KSAqIDEwMCksXHJcblx0XHRcdH0pKSxcclxuXHRcdH07XHJcblx0fSBlbHNlIHtcclxuXHRcdHJldHVybiB7XHJcblx0XHRcdEdyZEY6ICdHcmRGLkNsTnMnLFxyXG5cdFx0XHQnTm0gICc6IGdyYWQubmFtZSB8fCAnJyxcclxuXHRcdFx0U2hUcjogISFncmFkLmFkZFRyYW5zcGFyZW5jeSxcclxuXHRcdFx0VmN0QzogISFncmFkLnJlc3RyaWN0Q29sb3JzLFxyXG5cdFx0XHRDbHJTOiBDbHJTLmVuY29kZShncmFkLmNvbG9yTW9kZWwpLFxyXG5cdFx0XHRSbmRTOiBncmFkLnJhbmRvbVNlZWQgfHwgMCxcclxuXHRcdFx0U210aDogTWF0aC5yb3VuZCgoZ3JhZC5yb3VnaG5lc3MgPz8gMSkgKiA0MDk2KSxcclxuXHRcdFx0J01ubSAnOiAoZ3JhZC5taW4gfHwgWzAsIDAsIDAsIDBdKS5tYXAoeCA9PiB4ICogMTAwKSxcclxuXHRcdFx0J014bSAnOiAoZ3JhZC5tYXggfHwgWzEsIDEsIDEsIDFdKS5tYXAoeCA9PiB4ICogMTAwKSxcclxuXHRcdH07XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZUdyYWRpZW50Q29udGVudChkZXNjcmlwdG9yOiBEZXNjcmlwdG9yR3JhZGllbnRDb250ZW50KSB7XHJcblx0Y29uc3QgcmVzdWx0ID0gcGFyc2VHcmFkaWVudChkZXNjcmlwdG9yLkdyYWQpIGFzIChFZmZlY3RTb2xpZEdyYWRpZW50IHwgRWZmZWN0Tm9pc2VHcmFkaWVudCkgJiBFeHRyYUdyYWRpZW50SW5mbztcclxuXHRyZXN1bHQuc3R5bGUgPSBHcmRULmRlY29kZShkZXNjcmlwdG9yLlR5cGUpO1xyXG5cdGlmIChkZXNjcmlwdG9yLkR0aHIgIT09IHVuZGVmaW5lZCkgcmVzdWx0LmRpdGhlciA9IGRlc2NyaXB0b3IuRHRocjtcclxuXHRpZiAoZGVzY3JpcHRvci5SdnJzICE9PSB1bmRlZmluZWQpIHJlc3VsdC5yZXZlcnNlID0gZGVzY3JpcHRvci5SdnJzO1xyXG5cdGlmIChkZXNjcmlwdG9yLkFuZ2wgIT09IHVuZGVmaW5lZCkgcmVzdWx0LmFuZ2xlID0gcGFyc2VBbmdsZShkZXNjcmlwdG9yLkFuZ2wpO1xyXG5cdGlmIChkZXNjcmlwdG9yWydTY2wgJ10gIT09IHVuZGVmaW5lZCkgcmVzdWx0LnNjYWxlID0gcGFyc2VQZXJjZW50KGRlc2NyaXB0b3JbJ1NjbCAnXSk7XHJcblx0aWYgKGRlc2NyaXB0b3IuQWxnbiAhPT0gdW5kZWZpbmVkKSByZXN1bHQuYWxpZ24gPSBkZXNjcmlwdG9yLkFsZ247XHJcblx0aWYgKGRlc2NyaXB0b3IuT2ZzdCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRyZXN1bHQub2Zmc2V0ID0ge1xyXG5cdFx0XHR4OiBwYXJzZVBlcmNlbnQoZGVzY3JpcHRvci5PZnN0Lkhyem4pLFxyXG5cdFx0XHR5OiBwYXJzZVBlcmNlbnQoZGVzY3JpcHRvci5PZnN0LlZydGMpXHJcblx0XHR9O1xyXG5cdH1cclxuXHRyZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZVBhdHRlcm5Db250ZW50KGRlc2NyaXB0b3I6IERlc2NyaXB0b3JQYXR0ZXJuQ29udGVudCkge1xyXG5cdGNvbnN0IHJlc3VsdDogRWZmZWN0UGF0dGVybiAmIEV4dHJhUGF0dGVybkluZm8gPSB7XHJcblx0XHRuYW1lOiBkZXNjcmlwdG9yLlB0cm5bJ05tICAnXSxcclxuXHRcdGlkOiBkZXNjcmlwdG9yLlB0cm4uSWRudCxcclxuXHR9O1xyXG5cdGlmIChkZXNjcmlwdG9yLkxua2QgIT09IHVuZGVmaW5lZCkgcmVzdWx0LmxpbmtlZCA9IGRlc2NyaXB0b3IuTG5rZDtcclxuXHRpZiAoZGVzY3JpcHRvci5waGFzZSAhPT0gdW5kZWZpbmVkKSByZXN1bHQucGhhc2UgPSB7IHg6IGRlc2NyaXB0b3IucGhhc2UuSHJ6biwgeTogZGVzY3JpcHRvci5waGFzZS5WcnRjIH07XHJcblx0cmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVZlY3RvckNvbnRlbnQoZGVzY3JpcHRvcjogRGVzY3JpcHRvclZlY3RvckNvbnRlbnQpOiBWZWN0b3JDb250ZW50IHtcclxuXHRpZiAoJ0dyYWQnIGluIGRlc2NyaXB0b3IpIHtcclxuXHRcdHJldHVybiBwYXJzZUdyYWRpZW50Q29udGVudChkZXNjcmlwdG9yKTtcclxuXHR9IGVsc2UgaWYgKCdQdHJuJyBpbiBkZXNjcmlwdG9yKSB7XHJcblx0XHRyZXR1cm4geyB0eXBlOiAncGF0dGVybicsIC4uLnBhcnNlUGF0dGVybkNvbnRlbnQoZGVzY3JpcHRvcikgfTtcclxuXHR9IGVsc2UgaWYgKCdDbHIgJyBpbiBkZXNjcmlwdG9yKSB7XHJcblx0XHRyZXR1cm4geyB0eXBlOiAnY29sb3InLCBjb2xvcjogcGFyc2VDb2xvcihkZXNjcmlwdG9yWydDbHIgJ10pIH07XHJcblx0fSBlbHNlIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2ZWN0b3IgY29udGVudCcpO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gc2VyaWFsaXplR3JhZGllbnRDb250ZW50KGNvbnRlbnQ6IChFZmZlY3RTb2xpZEdyYWRpZW50IHwgRWZmZWN0Tm9pc2VHcmFkaWVudCkgJiBFeHRyYUdyYWRpZW50SW5mbykge1xyXG5cdGNvbnN0IHJlc3VsdDogRGVzY3JpcHRvckdyYWRpZW50Q29udGVudCA9IHt9IGFzIGFueTtcclxuXHRpZiAoY29udGVudC5kaXRoZXIgIT09IHVuZGVmaW5lZCkgcmVzdWx0LkR0aHIgPSBjb250ZW50LmRpdGhlcjtcclxuXHRpZiAoY29udGVudC5yZXZlcnNlICE9PSB1bmRlZmluZWQpIHJlc3VsdC5SdnJzID0gY29udGVudC5yZXZlcnNlO1xyXG5cdGlmIChjb250ZW50LmFuZ2xlICE9PSB1bmRlZmluZWQpIHJlc3VsdC5BbmdsID0gdW5pdHNBbmdsZShjb250ZW50LmFuZ2xlKTtcclxuXHRyZXN1bHQuVHlwZSA9IEdyZFQuZW5jb2RlKGNvbnRlbnQuc3R5bGUpO1xyXG5cdGlmIChjb250ZW50LmFsaWduICE9PSB1bmRlZmluZWQpIHJlc3VsdC5BbGduID0gY29udGVudC5hbGlnbjtcclxuXHRpZiAoY29udGVudC5zY2FsZSAhPT0gdW5kZWZpbmVkKSByZXN1bHRbJ1NjbCAnXSA9IHVuaXRzUGVyY2VudChjb250ZW50LnNjYWxlKTtcclxuXHRpZiAoY29udGVudC5vZmZzZXQpIHtcclxuXHRcdHJlc3VsdC5PZnN0ID0ge1xyXG5cdFx0XHRIcnpuOiB1bml0c1BlcmNlbnQoY29udGVudC5vZmZzZXQueCksXHJcblx0XHRcdFZydGM6IHVuaXRzUGVyY2VudChjb250ZW50Lm9mZnNldC55KSxcclxuXHRcdH07XHJcblx0fVxyXG5cdHJlc3VsdC5HcmFkID0gc2VyaWFsaXplR3JhZGllbnQoY29udGVudCk7XHJcblx0cmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZnVuY3Rpb24gc2VyaWFsaXplUGF0dGVybkNvbnRlbnQoY29udGVudDogRWZmZWN0UGF0dGVybiAmIEV4dHJhUGF0dGVybkluZm8pIHtcclxuXHRjb25zdCByZXN1bHQ6IERlc2NyaXB0b3JQYXR0ZXJuQ29udGVudCA9IHtcclxuXHRcdFB0cm46IHtcclxuXHRcdFx0J05tICAnOiBjb250ZW50Lm5hbWUgfHwgJycsXHJcblx0XHRcdElkbnQ6IGNvbnRlbnQuaWQgfHwgJycsXHJcblx0XHR9XHJcblx0fTtcclxuXHRpZiAoY29udGVudC5saW5rZWQgIT09IHVuZGVmaW5lZCkgcmVzdWx0Lkxua2QgPSAhIWNvbnRlbnQubGlua2VkO1xyXG5cdGlmIChjb250ZW50LnBoYXNlICE9PSB1bmRlZmluZWQpIHJlc3VsdC5waGFzZSA9IHsgSHJ6bjogY29udGVudC5waGFzZS54LCBWcnRjOiBjb250ZW50LnBoYXNlLnkgfTtcclxuXHRyZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplVmVjdG9yQ29udGVudChjb250ZW50OiBWZWN0b3JDb250ZW50KTogeyBkZXNjcmlwdG9yOiBEZXNjcmlwdG9yVmVjdG9yQ29udGVudDsga2V5OiBzdHJpbmc7IH0ge1xyXG5cdGlmIChjb250ZW50LnR5cGUgPT09ICdjb2xvcicpIHtcclxuXHRcdHJldHVybiB7IGtleTogJ1NvQ28nLCBkZXNjcmlwdG9yOiB7ICdDbHIgJzogc2VyaWFsaXplQ29sb3IoY29udGVudC5jb2xvcikgfSB9O1xyXG5cdH0gZWxzZSBpZiAoY29udGVudC50eXBlID09PSAncGF0dGVybicpIHtcclxuXHRcdHJldHVybiB7IGtleTogJ1B0RmwnLCBkZXNjcmlwdG9yOiBzZXJpYWxpemVQYXR0ZXJuQ29udGVudChjb250ZW50KSB9O1xyXG5cdH0gZWxzZSB7XHJcblx0XHRyZXR1cm4geyBrZXk6ICdHZEZsJywgZGVzY3JpcHRvcjogc2VyaWFsaXplR3JhZGllbnRDb250ZW50KGNvbnRlbnQpIH07XHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb2xvcihjb2xvcjogRGVzY3JpcHRvckNvbG9yKTogQ29sb3Ige1xyXG5cdGlmICgnSCAgICcgaW4gY29sb3IpIHtcclxuXHRcdHJldHVybiB7IGg6IHBhcnNlUGVyY2VudE9yQW5nbGUoY29sb3JbJ0ggICAnXSksIHM6IGNvbG9yLlN0cnQsIGI6IGNvbG9yLkJyZ2ggfTtcclxuXHR9IGVsc2UgaWYgKCdSZCAgJyBpbiBjb2xvcikge1xyXG5cdFx0cmV0dXJuIHsgcjogY29sb3JbJ1JkICAnXSwgZzogY29sb3JbJ0dybiAnXSwgYjogY29sb3JbJ0JsICAnXSB9O1xyXG5cdH0gZWxzZSBpZiAoJ0N5biAnIGluIGNvbG9yKSB7XHJcblx0XHRyZXR1cm4geyBjOiBjb2xvclsnQ3luICddLCBtOiBjb2xvci5NZ250LCB5OiBjb2xvclsnWWx3ICddLCBrOiBjb2xvci5CbGNrIH07XHJcblx0fSBlbHNlIGlmICgnR3J5ICcgaW4gY29sb3IpIHtcclxuXHRcdHJldHVybiB7IGs6IGNvbG9yWydHcnkgJ10gfTtcclxuXHR9IGVsc2UgaWYgKCdMbW5jJyBpbiBjb2xvcikge1xyXG5cdFx0cmV0dXJuIHsgbDogY29sb3IuTG1uYywgYTogY29sb3JbJ0EgICAnXSwgYjogY29sb3JbJ0IgICAnXSB9O1xyXG5cdH0gZWxzZSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGNvbG9yIGRlc2NyaXB0b3InKTtcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVDb2xvcihjb2xvcjogQ29sb3IgfCB1bmRlZmluZWQpOiBEZXNjcmlwdG9yQ29sb3Ige1xyXG5cdGlmICghY29sb3IpIHtcclxuXHRcdHJldHVybiB7ICdSZCAgJzogMCwgJ0dybiAnOiAwLCAnQmwgICc6IDAgfTtcclxuXHR9IGVsc2UgaWYgKCdyJyBpbiBjb2xvcikge1xyXG5cdFx0cmV0dXJuIHsgJ1JkICAnOiBjb2xvci5yIHx8IDAsICdHcm4gJzogY29sb3IuZyB8fCAwLCAnQmwgICc6IGNvbG9yLmIgfHwgMCB9O1xyXG5cdH0gZWxzZSBpZiAoJ2gnIGluIGNvbG9yKSB7XHJcblx0XHRyZXR1cm4geyAnSCAgICc6IHVuaXRzQW5nbGUoY29sb3IuaCAqIDM2MCksIFN0cnQ6IGNvbG9yLnMgfHwgMCwgQnJnaDogY29sb3IuYiB8fCAwIH07XHJcblx0fSBlbHNlIGlmICgnYycgaW4gY29sb3IpIHtcclxuXHRcdHJldHVybiB7ICdDeW4gJzogY29sb3IuYyB8fCAwLCBNZ250OiBjb2xvci5tIHx8IDAsICdZbHcgJzogY29sb3IueSB8fCAwLCBCbGNrOiBjb2xvci5rIHx8IDAgfTtcclxuXHR9IGVsc2UgaWYgKCdsJyBpbiBjb2xvcikge1xyXG5cdFx0cmV0dXJuIHsgTG1uYzogY29sb3IubCB8fCAwLCAnQSAgICc6IGNvbG9yLmEgfHwgMCwgJ0IgICAnOiBjb2xvci5iIHx8IDAgfTtcclxuXHR9IGVsc2UgaWYgKCdrJyBpbiBjb2xvcikge1xyXG5cdFx0cmV0dXJuIHsgJ0dyeSAnOiBjb2xvci5rIH07XHJcblx0fSBlbHNlIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2xvciB2YWx1ZScpO1xyXG5cdH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQW5nbGUoeDogRGVzY3JpcHRvclVuaXRzVmFsdWUpIHtcclxuXHRpZiAoeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMDtcclxuXHRpZiAoeC51bml0cyAhPT0gJ0FuZ2xlJykgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHVuaXRzOiAke3gudW5pdHN9YCk7XHJcblx0cmV0dXJuIHgudmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVBlcmNlbnQoeDogRGVzY3JpcHRvclVuaXRzVmFsdWUgfCB1bmRlZmluZWQpIHtcclxuXHRpZiAoeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTtcclxuXHRpZiAoeC51bml0cyAhPT0gJ1BlcmNlbnQnKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdW5pdHM6ICR7eC51bml0c31gKTtcclxuXHRyZXR1cm4geC52YWx1ZSAvIDEwMDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUGVyY2VudE9yQW5nbGUoeDogRGVzY3JpcHRvclVuaXRzVmFsdWUgfCB1bmRlZmluZWQpIHtcclxuXHRpZiAoeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTtcclxuXHRpZiAoeC51bml0cyA9PT0gJ1BlcmNlbnQnKSByZXR1cm4geC52YWx1ZSAvIDEwMDtcclxuXHRpZiAoeC51bml0cyA9PT0gJ0FuZ2xlJykgcmV0dXJuIHgudmFsdWUgLyAzNjA7XHJcblx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHVuaXRzOiAke3gudW5pdHN9YCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVVuaXRzKHsgdW5pdHMsIHZhbHVlIH06IERlc2NyaXB0b3JVbml0c1ZhbHVlKTogVW5pdHNWYWx1ZSB7XHJcblx0aWYgKFxyXG5cdFx0dW5pdHMgIT09ICdQaXhlbHMnICYmIHVuaXRzICE9PSAnTWlsbGltZXRlcnMnICYmIHVuaXRzICE9PSAnUG9pbnRzJyAmJiB1bml0cyAhPT0gJ05vbmUnICYmXHJcblx0XHR1bml0cyAhPT0gJ1BpY2FzJyAmJiB1bml0cyAhPT0gJ0luY2hlcycgJiYgdW5pdHMgIT09ICdDZW50aW1ldGVycycgJiYgdW5pdHMgIT09ICdEZW5zaXR5J1xyXG5cdCkge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHVuaXRzOiAke0pTT04uc3RyaW5naWZ5KHsgdW5pdHMsIHZhbHVlIH0pfWApO1xyXG5cdH1cclxuXHRyZXR1cm4geyB2YWx1ZSwgdW5pdHMgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVW5pdHNPck51bWJlcih2YWx1ZTogRGVzY3JpcHRvclVuaXRzVmFsdWUgfCBudW1iZXIsIHVuaXRzOiBVbml0cyA9ICdQaXhlbHMnKTogVW5pdHNWYWx1ZSB7XHJcblx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHJldHVybiB7IHZhbHVlLCB1bml0cyB9O1xyXG5cdHJldHVybiBwYXJzZVVuaXRzKHZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVW5pdHNUb051bWJlcih7IHVuaXRzLCB2YWx1ZSB9OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZSwgZXhwZWN0ZWRVbml0czogc3RyaW5nKTogbnVtYmVyIHtcclxuXHRpZiAodW5pdHMgIT09IGV4cGVjdGVkVW5pdHMpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB1bml0czogJHtKU09OLnN0cmluZ2lmeSh7IHVuaXRzLCB2YWx1ZSB9KX1gKTtcclxuXHRyZXR1cm4gdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1bml0c0FuZ2xlKHZhbHVlOiBudW1iZXIgfCB1bmRlZmluZWQpOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZSB7XHJcblx0cmV0dXJuIHsgdW5pdHM6ICdBbmdsZScsIHZhbHVlOiB2YWx1ZSB8fCAwIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1bml0c1BlcmNlbnQodmFsdWU6IG51bWJlciB8IHVuZGVmaW5lZCk6IERlc2NyaXB0b3JVbml0c1ZhbHVlIHtcclxuXHRyZXR1cm4geyB1bml0czogJ1BlcmNlbnQnLCB2YWx1ZTogTWF0aC5yb3VuZCgodmFsdWUgfHwgMCkgKiAxMDApIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1bml0c1ZhbHVlKHg6IFVuaXRzVmFsdWUgfCB1bmRlZmluZWQsIGtleTogc3RyaW5nKTogRGVzY3JpcHRvclVuaXRzVmFsdWUge1xyXG5cdGlmICh4ID09IG51bGwpIHJldHVybiB7IHVuaXRzOiAnUGl4ZWxzJywgdmFsdWU6IDAgfTtcclxuXHJcblx0aWYgKHR5cGVvZiB4ICE9PSAnb2JqZWN0JylcclxuXHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB2YWx1ZTogJHtKU09OLnN0cmluZ2lmeSh4KX0gKGtleTogJHtrZXl9KSAoc2hvdWxkIGhhdmUgdmFsdWUgYW5kIHVuaXRzKWApO1xyXG5cclxuXHRjb25zdCB7IHVuaXRzLCB2YWx1ZSB9ID0geDtcclxuXHJcblx0aWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicpXHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWUgaW4gJHtKU09OLnN0cmluZ2lmeSh4KX0gKGtleTogJHtrZXl9KWApO1xyXG5cclxuXHRpZiAoXHJcblx0XHR1bml0cyAhPT0gJ1BpeGVscycgJiYgdW5pdHMgIT09ICdNaWxsaW1ldGVycycgJiYgdW5pdHMgIT09ICdQb2ludHMnICYmIHVuaXRzICE9PSAnTm9uZScgJiZcclxuXHRcdHVuaXRzICE9PSAnUGljYXMnICYmIHVuaXRzICE9PSAnSW5jaGVzJyAmJiB1bml0cyAhPT0gJ0NlbnRpbWV0ZXJzJyAmJiB1bml0cyAhPT0gJ0RlbnNpdHknXHJcblx0KSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdW5pdHMgaW4gJHtKU09OLnN0cmluZ2lmeSh4KX0gKGtleTogJHtrZXl9KWApO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHsgdW5pdHMsIHZhbHVlIH07XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCB0ZXh0R3JpZGRpbmcgPSBjcmVhdGVFbnVtPFRleHRHcmlkZGluZz4oJ3RleHRHcmlkZGluZycsICdub25lJywge1xyXG5cdG5vbmU6ICdOb25lJyxcclxuXHRyb3VuZDogJ1JuZCAnLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBPcm50ID0gY3JlYXRlRW51bTxPcmllbnRhdGlvbj4oJ09ybnQnLCAnaG9yaXpvbnRhbCcsIHtcclxuXHRob3Jpem9udGFsOiAnSHJ6bicsXHJcblx0dmVydGljYWw6ICdWcnRjJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgQW5udCA9IGNyZWF0ZUVudW08QW50aUFsaWFzPignQW5udCcsICdzaGFycCcsIHtcclxuXHRub25lOiAnQW5ubycsXHJcblx0c2hhcnA6ICdhbnRpQWxpYXNTaGFycCcsXHJcblx0Y3Jpc3A6ICdBbkNyJyxcclxuXHRzdHJvbmc6ICdBblN0JyxcclxuXHRzbW9vdGg6ICdBblNtJyxcclxuXHRwbGF0Zm9ybTogJ2FudGlBbGlhc1BsYXRmb3JtR3JheScsXHJcblx0cGxhdGZvcm1MQ0Q6ICdhbnRpQWxpYXNQbGF0Zm9ybUxDRCcsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IHdhcnBTdHlsZSA9IGNyZWF0ZUVudW08V2FycFN0eWxlPignd2FycFN0eWxlJywgJ25vbmUnLCB7XHJcblx0bm9uZTogJ3dhcnBOb25lJyxcclxuXHRhcmM6ICd3YXJwQXJjJyxcclxuXHRhcmNMb3dlcjogJ3dhcnBBcmNMb3dlcicsXHJcblx0YXJjVXBwZXI6ICd3YXJwQXJjVXBwZXInLFxyXG5cdGFyY2g6ICd3YXJwQXJjaCcsXHJcblx0YnVsZ2U6ICd3YXJwQnVsZ2UnLFxyXG5cdHNoZWxsTG93ZXI6ICd3YXJwU2hlbGxMb3dlcicsXHJcblx0c2hlbGxVcHBlcjogJ3dhcnBTaGVsbFVwcGVyJyxcclxuXHRmbGFnOiAnd2FycEZsYWcnLFxyXG5cdHdhdmU6ICd3YXJwV2F2ZScsXHJcblx0ZmlzaDogJ3dhcnBGaXNoJyxcclxuXHRyaXNlOiAnd2FycFJpc2UnLFxyXG5cdGZpc2hleWU6ICd3YXJwRmlzaGV5ZScsXHJcblx0aW5mbGF0ZTogJ3dhcnBJbmZsYXRlJyxcclxuXHRzcXVlZXplOiAnd2FycFNxdWVlemUnLFxyXG5cdHR3aXN0OiAnd2FycFR3aXN0JyxcclxuXHRjdXN0b206ICd3YXJwQ3VzdG9tJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgQmxuTSA9IGNyZWF0ZUVudW08QmxlbmRNb2RlPignQmxuTScsICdub3JtYWwnLCB7XHJcblx0J25vcm1hbCc6ICdOcm1sJyxcclxuXHQnZGlzc29sdmUnOiAnRHNsdicsXHJcblx0J2Rhcmtlbic6ICdEcmtuJyxcclxuXHQnbXVsdGlwbHknOiAnTWx0cCcsXHJcblx0J2NvbG9yIGJ1cm4nOiAnQ0JybicsXHJcblx0J2xpbmVhciBidXJuJzogJ2xpbmVhckJ1cm4nLFxyXG5cdCdkYXJrZXIgY29sb3InOiAnZGFya2VyQ29sb3InLFxyXG5cdCdsaWdodGVuJzogJ0xnaG4nLFxyXG5cdCdzY3JlZW4nOiAnU2NybicsXHJcblx0J2NvbG9yIGRvZGdlJzogJ0NEZGcnLFxyXG5cdCdsaW5lYXIgZG9kZ2UnOiAnbGluZWFyRG9kZ2UnLFxyXG5cdCdsaWdodGVyIGNvbG9yJzogJ2xpZ2h0ZXJDb2xvcicsXHJcblx0J292ZXJsYXknOiAnT3ZybCcsXHJcblx0J3NvZnQgbGlnaHQnOiAnU2Z0TCcsXHJcblx0J2hhcmQgbGlnaHQnOiAnSHJkTCcsXHJcblx0J3ZpdmlkIGxpZ2h0JzogJ3ZpdmlkTGlnaHQnLFxyXG5cdCdsaW5lYXIgbGlnaHQnOiAnbGluZWFyTGlnaHQnLFxyXG5cdCdwaW4gbGlnaHQnOiAncGluTGlnaHQnLFxyXG5cdCdoYXJkIG1peCc6ICdoYXJkTWl4JyxcclxuXHQnZGlmZmVyZW5jZSc6ICdEZnJuJyxcclxuXHQnZXhjbHVzaW9uJzogJ1hjbHUnLFxyXG5cdCdzdWJ0cmFjdCc6ICdibGVuZFN1YnRyYWN0aW9uJyxcclxuXHQnZGl2aWRlJzogJ2JsZW5kRGl2aWRlJyxcclxuXHQnaHVlJzogJ0ggICAnLFxyXG5cdCdzYXR1cmF0aW9uJzogJ1N0cnQnLFxyXG5cdCdjb2xvcic6ICdDbHIgJyxcclxuXHQnbHVtaW5vc2l0eSc6ICdMbW5zJyxcclxuXHQvLyB1c2VkIGluIEFCUlxyXG5cdCdsaW5lYXIgaGVpZ2h0JzogJ2xpbmVhckhlaWdodCcsXHJcblx0J2hlaWdodCc6ICdIZ2h0JyxcclxuXHQnc3VidHJhY3Rpb24nOiAnU2J0cicsIC8vIDJuZCB2ZXJzaW9uIG9mIHN1YnRyYWN0ID9cclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgQkVTbCA9IGNyZWF0ZUVudW08QmV2ZWxTdHlsZT4oJ0JFU2wnLCAnaW5uZXIgYmV2ZWwnLCB7XHJcblx0J2lubmVyIGJldmVsJzogJ0luckInLFxyXG5cdCdvdXRlciBiZXZlbCc6ICdPdHJCJyxcclxuXHQnZW1ib3NzJzogJ0VtYnMnLFxyXG5cdCdwaWxsb3cgZW1ib3NzJzogJ1BsRWInLFxyXG5cdCdzdHJva2UgZW1ib3NzJzogJ3N0cm9rZUVtYm9zcycsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IGJ2bFQgPSBjcmVhdGVFbnVtPEJldmVsVGVjaG5pcXVlPignYnZsVCcsICdzbW9vdGgnLCB7XHJcblx0J3Ntb290aCc6ICdTZkJMJyxcclxuXHQnY2hpc2VsIGhhcmQnOiAnUHJCTCcsXHJcblx0J2NoaXNlbCBzb2Z0JzogJ1NsbXQnLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBCRVNzID0gY3JlYXRlRW51bTxCZXZlbERpcmVjdGlvbj4oJ0JFU3MnLCAndXAnLCB7XHJcblx0dXA6ICdJbiAgJyxcclxuXHRkb3duOiAnT3V0ICcsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IEJFVEUgPSBjcmVhdGVFbnVtPEdsb3dUZWNobmlxdWU+KCdCRVRFJywgJ3NvZnRlcicsIHtcclxuXHRzb2Z0ZXI6ICdTZkJMJyxcclxuXHRwcmVjaXNlOiAnUHJCTCcsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IElHU3IgPSBjcmVhdGVFbnVtPEdsb3dTb3VyY2U+KCdJR1NyJywgJ2VkZ2UnLCB7XHJcblx0ZWRnZTogJ1NyY0UnLFxyXG5cdGNlbnRlcjogJ1NyY0MnLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBHcmRUID0gY3JlYXRlRW51bTxHcmFkaWVudFN0eWxlPignR3JkVCcsICdsaW5lYXInLCB7XHJcblx0bGluZWFyOiAnTG5yICcsXHJcblx0cmFkaWFsOiAnUmRsICcsXHJcblx0YW5nbGU6ICdBbmdsJyxcclxuXHRyZWZsZWN0ZWQ6ICdSZmxjJyxcclxuXHRkaWFtb25kOiAnRG1uZCcsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IGFuaW1JbnRlcnBTdHlsZUVudW0gPSBjcmVhdGVFbnVtPFRpbWVsaW5lS2V5SW50ZXJwb2xhdGlvbj4oJ2FuaW1JbnRlcnBTdHlsZScsICdsaW5lYXInLCB7XHJcblx0bGluZWFyOiAnTG5yICcsXHJcblx0aG9sZDogJ2hvbGQnLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBzdGRUcmFja0lEID0gY3JlYXRlRW51bTxUaW1lbGluZVRyYWNrVHlwZT4oJ3N0ZFRyYWNrSUQnLCAnb3BhY2l0eScsIHtcclxuXHRvcGFjaXR5OiAnb3BhY2l0eVRyYWNrJyxcclxuXHRzdHlsZTogJ3N0eWxlVHJhY2snLFxyXG5cdHNoZWV0VHJhbnNmb3JtOiAnc2hlZXRUcmFuc2Zvcm1UcmFjaycsXHJcblx0c2hlZXRQb3NpdGlvbjogJ3NoZWV0UG9zaXRpb25UcmFjaycsXHJcblx0Z2xvYmFsTGlnaHRpbmc6ICdnbG9iYWxMaWdodGluZ1RyYWNrJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgZ3JhZGllbnRJbnRlcnBvbGF0aW9uTWV0aG9kVHlwZSA9IGNyZWF0ZUVudW08SW50ZXJwb2xhdGlvbk1ldGhvZD4oJ2dyYWRpZW50SW50ZXJwb2xhdGlvbk1ldGhvZFR5cGUnLCAncGVyY2VwdHVhbCcsIHtcclxuXHRwZXJjZXB0dWFsOiAnUGVyYycsXHJcblx0bGluZWFyOiAnTG5yJyxcclxuXHRjbGFzc2ljOiAnR2NscycsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IENsclMgPSBjcmVhdGVFbnVtPCdyZ2InIHwgJ2hzYicgfCAnbGFiJz4oJ0NsclMnLCAncmdiJywge1xyXG5cdHJnYjogJ1JHQkMnLFxyXG5cdGhzYjogJ0hTQmwnLFxyXG5cdGxhYjogJ0xiQ2wnLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBGU3RsID0gY3JlYXRlRW51bTwnaW5zaWRlJyB8ICdjZW50ZXInIHwgJ291dHNpZGUnPignRlN0bCcsICdvdXRzaWRlJywge1xyXG5cdG91dHNpZGU6ICdPdXRGJyxcclxuXHRjZW50ZXI6ICdDdHJGJyxcclxuXHRpbnNpZGU6ICdJbnNGJ1xyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBGckZsID0gY3JlYXRlRW51bTwnY29sb3InIHwgJ2dyYWRpZW50JyB8ICdwYXR0ZXJuJz4oJ0ZyRmwnLCAnY29sb3InLCB7XHJcblx0Y29sb3I6ICdTQ2xyJyxcclxuXHRncmFkaWVudDogJ0dyRmwnLFxyXG5cdHBhdHRlcm46ICdQdHJuJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3Qgc3Ryb2tlU3R5bGVMaW5lQ2FwVHlwZSA9IGNyZWF0ZUVudW08TGluZUNhcFR5cGU+KCdzdHJva2VTdHlsZUxpbmVDYXBUeXBlJywgJ2J1dHQnLCB7XHJcblx0YnV0dDogJ3N0cm9rZVN0eWxlQnV0dENhcCcsXHJcblx0cm91bmQ6ICdzdHJva2VTdHlsZVJvdW5kQ2FwJyxcclxuXHRzcXVhcmU6ICdzdHJva2VTdHlsZVNxdWFyZUNhcCcsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IHN0cm9rZVN0eWxlTGluZUpvaW5UeXBlID0gY3JlYXRlRW51bTxMaW5lSm9pblR5cGU+KCdzdHJva2VTdHlsZUxpbmVKb2luVHlwZScsICdtaXRlcicsIHtcclxuXHRtaXRlcjogJ3N0cm9rZVN0eWxlTWl0ZXJKb2luJyxcclxuXHRyb3VuZDogJ3N0cm9rZVN0eWxlUm91bmRKb2luJyxcclxuXHRiZXZlbDogJ3N0cm9rZVN0eWxlQmV2ZWxKb2luJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3Qgc3Ryb2tlU3R5bGVMaW5lQWxpZ25tZW50ID0gY3JlYXRlRW51bTxMaW5lQWxpZ25tZW50Pignc3Ryb2tlU3R5bGVMaW5lQWxpZ25tZW50JywgJ2luc2lkZScsIHtcclxuXHRpbnNpZGU6ICdzdHJva2VTdHlsZUFsaWduSW5zaWRlJyxcclxuXHRjZW50ZXI6ICdzdHJva2VTdHlsZUFsaWduQ2VudGVyJyxcclxuXHRvdXRzaWRlOiAnc3Ryb2tlU3R5bGVBbGlnbk91dHNpZGUnLFxyXG59KTtcclxuIl0sInNvdXJjZVJvb3QiOiJDOlxcUHJvamVjdHNcXGdpdGh1YlxcYWctcHNkXFxzcmMifQ==
