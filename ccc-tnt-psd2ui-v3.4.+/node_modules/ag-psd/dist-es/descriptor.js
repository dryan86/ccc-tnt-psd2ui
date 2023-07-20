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
import { createEnum } from './helpers';
import { readSignature, readUnicodeString, readUint32, readUint8, readFloat64, readBytes, readAsciiString, readInt32, readFloat32, readInt32LE, readUnicodeStringWithLength } from './psdReader';
import { writeSignature, writeBytes, writeUint32, writeFloat64, writeUint8, writeUnicodeStringWithPadding, writeInt32, writeFloat32, writeUnicodeString } from './psdWriter';
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
export function setLogErrors(value) {
    logErrors = value;
}
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
export function readAsciiStringOrClassId(reader) {
    var length = readInt32(reader);
    return readAsciiString(reader, length || 4);
}
function writeAsciiStringOrClassId(writer, value) {
    if (value.length === 4 && value !== 'warp' && value !== 'time' && value !== 'hold') {
        // write classId
        writeInt32(writer, 0);
        writeSignature(writer, value);
    }
    else {
        // write ascii string
        writeInt32(writer, value.length);
        for (var i = 0; i < value.length; i++) {
            writeUint8(writer, value.charCodeAt(i));
        }
    }
}
export function readDescriptorStructure(reader) {
    var object = {};
    // object.__struct =
    readClassStructure(reader);
    var itemsCount = readUint32(reader);
    // console.log('//', object.__struct);
    for (var i = 0; i < itemsCount; i++) {
        var key = readAsciiStringOrClassId(reader);
        var type = readSignature(reader);
        // console.log(`> '${key}' '${type}'`);
        var data = readOSType(reader, type);
        // if (!getTypeByKey(key, data)) console.log(`> '${key}' '${type}'`, data);
        object[key] = data;
    }
    return object;
}
export function writeDescriptorStructure(writer, name, classId, value, root) {
    if (logErrors && !classId)
        console.log('Missing classId for: ', name, classId, value);
    // write class structure
    writeUnicodeStringWithPadding(writer, name);
    writeAsciiStringOrClassId(writer, classId);
    var keys = Object.keys(value);
    writeUint32(writer, keys.length);
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
        writeSignature(writer, type || 'long');
        writeOSType(writer, type || 'long', value[key], key, extType, root);
        if (logErrors && !type)
            console.log("Missing descriptor field type for: '".concat(key, "' in"), value);
    }
}
function readOSType(reader, type) {
    switch (type) {
        case 'obj ': // Reference
            return readReferenceStructure(reader);
        case 'Objc': // Descriptor
        case 'GlbO': // GlobalObject same as Descriptor
            return readDescriptorStructure(reader);
        case 'VlLs': { // List
            var length_1 = readInt32(reader);
            var items = [];
            for (var i = 0; i < length_1; i++) {
                var type_1 = readSignature(reader);
                // console.log('  >', type);
                items.push(readOSType(reader, type_1));
            }
            return items;
        }
        case 'doub': // Double
            return readFloat64(reader);
        case 'UntF': { // Unit double
            var units = readSignature(reader);
            var value = readFloat64(reader);
            if (!unitsMap[units])
                throw new Error("Invalid units: ".concat(units));
            return { units: unitsMap[units], value: value };
        }
        case 'UnFl': { // Unit float
            var units = readSignature(reader);
            var value = readFloat32(reader);
            if (!unitsMap[units])
                throw new Error("Invalid units: ".concat(units));
            return { units: unitsMap[units], value: value };
        }
        case 'TEXT': // String
            return readUnicodeString(reader);
        case 'enum': { // Enumerated
            var type_2 = readAsciiStringOrClassId(reader);
            var value = readAsciiStringOrClassId(reader);
            return "".concat(type_2, ".").concat(value);
        }
        case 'long': // Integer
            return readInt32(reader);
        case 'comp': { // Large Integer
            var low = readUint32(reader);
            var high = readUint32(reader);
            return { low: low, high: high };
        }
        case 'bool': // Boolean
            return !!readUint8(reader);
        case 'type': // Class
        case 'GlbC': // Class
            return readClassStructure(reader);
        case 'alis': { // Alias
            var length_2 = readInt32(reader);
            return readAsciiString(reader, length_2);
        }
        case 'tdta': { // Raw Data
            var length_3 = readInt32(reader);
            return readBytes(reader, length_3);
        }
        case 'ObAr': { // Object array
            readInt32(reader); // version: 16
            readUnicodeString(reader); // name: ''
            readAsciiStringOrClassId(reader); // 'rationalPoint'
            var length_4 = readInt32(reader);
            var items = [];
            for (var i = 0; i < length_4; i++) {
                var type1 = readAsciiStringOrClassId(reader); // type Hrzn | Vrtc
                readSignature(reader); // UnFl
                readSignature(reader); // units ? '#Pxl'
                var valuesCount = readInt32(reader);
                var values = [];
                for (var j = 0; j < valuesCount; j++) {
                    values.push(readFloat64(reader));
                }
                items.push({ type: type1, values: values });
            }
            return items;
        }
        case 'Pth ': { // File path
            /*const length =*/ readInt32(reader);
            var sig = readSignature(reader);
            /*const pathSize =*/ readInt32LE(reader);
            var charsCount = readInt32LE(reader);
            var path = readUnicodeStringWithLength(reader, charsCount);
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
            writeInt32(writer, value.length);
            for (var i = 0; i < value.length; i++) {
                var type_3 = fieldToArrayType[key];
                writeSignature(writer, type_3 || 'long');
                writeOSType(writer, type_3 || 'long', value[i], '', fieldToArrayExtType[key], root);
                if (logErrors && !type_3)
                    console.log("Missing descriptor array type for: '".concat(key, "' in"), value);
            }
            break;
        case 'doub': // Double
            writeFloat64(writer, value);
            break;
        case 'UntF': // Unit double
            if (!unitsMapRev[value.units])
                throw new Error("Invalid units: ".concat(value.units, " in ").concat(key));
            writeSignature(writer, unitsMapRev[value.units]);
            writeFloat64(writer, value.value);
            break;
        case 'UnFl': // Unit float
            if (!unitsMapRev[value.units])
                throw new Error("Invalid units: ".concat(value.units, " in ").concat(key));
            writeSignature(writer, unitsMapRev[value.units]);
            writeFloat32(writer, value.value);
            break;
        case 'TEXT': // String
            writeUnicodeStringWithPadding(writer, value);
            break;
        case 'enum': { // Enumerated
            var _a = value.split('.'), _type = _a[0], val = _a[1];
            writeAsciiStringOrClassId(writer, _type);
            writeAsciiStringOrClassId(writer, val);
            break;
        }
        case 'long': // Integer
            writeInt32(writer, value);
            break;
        // case 'comp': // Large Integer
        // 	writeLargeInteger(reader);
        case 'bool': // Boolean
            writeUint8(writer, value ? 1 : 0);
            break;
        // case 'type': // Class
        // case 'GlbC': // Class
        // 	writeClassStructure(reader);
        // case 'alis': // Alias
        // 	writeAliasStructure(reader);
        case 'tdta': // Raw Data
            writeInt32(writer, value.byteLength);
            writeBytes(writer, value);
            break;
        case 'ObAr': { // Object array
            writeInt32(writer, 16); // version
            writeUnicodeStringWithPadding(writer, ''); // name
            var type_4 = ObArTypes[key];
            if (!type_4)
                throw new Error("Not implemented ObArType for: ".concat(key));
            writeAsciiStringOrClassId(writer, type_4);
            writeInt32(writer, value.length);
            for (var i = 0; i < value.length; i++) {
                writeAsciiStringOrClassId(writer, value[i].type); // Hrzn | Vrtc
                writeSignature(writer, 'UnFl');
                writeSignature(writer, '#Pxl');
                writeInt32(writer, value[i].values.length);
                for (var j = 0; j < value[i].values.length; j++) {
                    writeFloat64(writer, value[i].values[j]);
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
    var itemsCount = readInt32(reader);
    var items = [];
    for (var i = 0; i < itemsCount; i++) {
        var type = readSignature(reader);
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
                items.push(readUint32(reader));
                break;
            }
            case 'Idnt': // Identifier
                items.push(readInt32(reader));
                break;
            case 'indx': // Index
                items.push(readInt32(reader));
                break;
            case 'name': { // Name
                readClassStructure(reader);
                items.push(readUnicodeString(reader));
                break;
            }
            default:
                throw new Error("Invalid descriptor reference type: ".concat(type));
        }
    }
    return items;
}
function writeReferenceStructure(writer, _key, items) {
    writeInt32(writer, items.length);
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
        writeSignature(writer, type);
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
                writeUnicodeString(writer, value + '\0');
                break;
            }
            default:
                throw new Error("Invalid descriptor reference type: ".concat(type));
        }
    }
    return items;
}
function readClassStructure(reader) {
    var name = readUnicodeString(reader);
    var classID = readAsciiStringOrClassId(reader);
    // console.log({ name, classID });
    return { name: name, classID: classID };
}
function writeClassStructure(writer, name, classID) {
    writeUnicodeString(writer, name);
    writeAsciiStringOrClassId(writer, classID);
}
export function readVersionAndDescriptor(reader) {
    var version = readUint32(reader);
    if (version !== 16)
        throw new Error("Invalid descriptor version: ".concat(version));
    var desc = readDescriptorStructure(reader);
    // console.log(require('util').inspect(desc, false, 99, true));
    return desc;
}
export function writeVersionAndDescriptor(writer, name, classID, descriptor, root) {
    if (root === void 0) { root = ''; }
    writeUint32(writer, 16); // version
    writeDescriptorStructure(writer, name, classID, descriptor, root);
}
export function horzVrtcToXY(hv) {
    return { x: hv.Hrzn, y: hv.Vrtc };
}
export function xyToHorzVrtc(xy) {
    return { Hrzn: xy.x, Vrtc: xy.y };
}
function parseFxObject(fx) {
    var stroke = {
        enabled: !!fx.enab,
        position: FStl.decode(fx.Styl),
        fillType: FrFl.decode(fx.PntT),
        blendMode: BlnM.decode(fx['Md  ']),
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
    FrFX.Styl = FStl.encode(stroke.position);
    FrFX.PntT = FrFl.encode(stroke.fillType);
    FrFX['Md  '] = BlnM.encode(stroke.blendMode);
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
export function serializeEffects(e, log, multi) {
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
export function parseEffects(info, log) {
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
function parseKeyList(keyList, logMissingFeatures) {
    var keys = [];
    for (var j = 0; j < keyList.length; j++) {
        var key = keyList[j];
        var time = key.time, selected = key.selected, animKey = key.animKey;
        var interpolation = animInterpStyleEnum.decode(key.animInterpStyle);
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
        var animInterpStyle = animInterpStyleEnum.encode(interpolation);
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
export function parseTrackList(trackList, logMissingFeatures) {
    var tracks = [];
    for (var i = 0; i < trackList.length; i++) {
        var tr = trackList[i];
        var track = {
            type: stdTrackID.decode(tr.trackID),
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
export function serializeTrackList(tracks) {
    var trackList = [];
    for (var i = 0; i < tracks.length; i++) {
        var t = tracks[i];
        trackList.push(__assign(__assign({ trackID: stdTrackID.encode(t.type), Vrsn: 1, enab: !!t.enabled, Effc: !!t.effectParams }, (t.effectParams ? {
            effectParams: {
                keyList: serializeKeyList(t.keys),
                fillCanvas: t.effectParams.fillCanvas,
                zoomOrigin: t.effectParams.zoomOrigin,
            }
        } : {})), { keyList: serializeKeyList(t.keys) }));
    }
    return trackList;
}
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
                result.position = FStl.decode(val);
                break;
            case 'Md  ':
                result.blendMode = BlnM.decode(val);
                break;
            case 'hglM':
                result.highlightBlendMode = BlnM.decode(val);
                break;
            case 'sdwM':
                result.shadowBlendMode = BlnM.decode(val);
                break;
            case 'bvlS':
                result.style = BESl.decode(val);
                break;
            case 'bvlD':
                result.direction = BESs.decode(val);
                break;
            case 'bvlT':
                result.technique = bvlT.decode(val);
                break;
            case 'GlwT':
                result.technique = BETE.decode(val);
                break;
            case 'glwS':
                result.source = IGSr.decode(val);
                break;
            case 'Type':
                result.type = GrdT.decode(val);
                break;
            case 'gs99':
                result.interpolationMethod = gradientInterpolationMethodType.decode(val);
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
                result.Styl = FStl.encode(val);
                break;
            case 'blendMode':
                result['Md  '] = BlnM.encode(val);
                break;
            case 'highlightBlendMode':
                result.hglM = BlnM.encode(val);
                break;
            case 'shadowBlendMode':
                result.sdwM = BlnM.encode(val);
                break;
            case 'style':
                result.bvlS = BESl.encode(val);
                break;
            case 'direction':
                result.bvlD = BESs.encode(val);
                break;
            case 'technique':
                if (objName === 'bevel') {
                    result.bvlT = bvlT.encode(val);
                }
                else {
                    result.GlwT = BETE.encode(val);
                }
                break;
            case 'source':
                result.glwS = IGSr.encode(val);
                break;
            case 'type':
                result.Type = GrdT.encode(val);
                break;
            case 'interpolationMethod':
                result.gs99 = gradientInterpolationMethodType.encode(val);
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
            colorModel: ClrS.decode(grad.ClrS),
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
            ClrS: ClrS.encode(grad.colorModel),
            RndS: grad.randomSeed || 0,
            Smth: Math.round(((_b = grad.roughness) !== null && _b !== void 0 ? _b : 1) * 4096),
            'Mnm ': (grad.min || [0, 0, 0, 0]).map(function (x) { return x * 100; }),
            'Mxm ': (grad.max || [1, 1, 1, 1]).map(function (x) { return x * 100; }),
        };
    }
}
function parseGradientContent(descriptor) {
    var result = parseGradient(descriptor.Grad);
    result.style = GrdT.decode(descriptor.Type);
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
export function parseVectorContent(descriptor) {
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
function serializeGradientContent(content) {
    var result = {};
    if (content.dither !== undefined)
        result.Dthr = content.dither;
    if (content.reverse !== undefined)
        result.Rvrs = content.reverse;
    if (content.angle !== undefined)
        result.Angl = unitsAngle(content.angle);
    result.Type = GrdT.encode(content.style);
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
export function serializeVectorContent(content) {
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
export function parseColor(color) {
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
export function serializeColor(color) {
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
export function parseAngle(x) {
    if (x === undefined)
        return 0;
    if (x.units !== 'Angle')
        throw new Error("Invalid units: ".concat(x.units));
    return x.value;
}
export function parsePercent(x) {
    if (x === undefined)
        return 1;
    if (x.units !== 'Percent')
        throw new Error("Invalid units: ".concat(x.units));
    return x.value / 100;
}
export function parsePercentOrAngle(x) {
    if (x === undefined)
        return 1;
    if (x.units === 'Percent')
        return x.value / 100;
    if (x.units === 'Angle')
        return x.value / 360;
    throw new Error("Invalid units: ".concat(x.units));
}
export function parseUnits(_a) {
    var units = _a.units, value = _a.value;
    if (units !== 'Pixels' && units !== 'Millimeters' && units !== 'Points' && units !== 'None' &&
        units !== 'Picas' && units !== 'Inches' && units !== 'Centimeters' && units !== 'Density') {
        throw new Error("Invalid units: ".concat(JSON.stringify({ units: units, value: value })));
    }
    return { value: value, units: units };
}
export function parseUnitsOrNumber(value, units) {
    if (units === void 0) { units = 'Pixels'; }
    if (typeof value === 'number')
        return { value: value, units: units };
    return parseUnits(value);
}
export function parseUnitsToNumber(_a, expectedUnits) {
    var units = _a.units, value = _a.value;
    if (units !== expectedUnits)
        throw new Error("Invalid units: ".concat(JSON.stringify({ units: units, value: value })));
    return value;
}
export function unitsAngle(value) {
    return { units: 'Angle', value: value || 0 };
}
export function unitsPercent(value) {
    return { units: 'Percent', value: Math.round((value || 0) * 100) };
}
export function unitsValue(x, key) {
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
export var textGridding = createEnum('textGridding', 'none', {
    none: 'None',
    round: 'Rnd ',
});
export var Ornt = createEnum('Ornt', 'horizontal', {
    horizontal: 'Hrzn',
    vertical: 'Vrtc',
});
export var Annt = createEnum('Annt', 'sharp', {
    none: 'Anno',
    sharp: 'antiAliasSharp',
    crisp: 'AnCr',
    strong: 'AnSt',
    smooth: 'AnSm',
    platform: 'antiAliasPlatformGray',
    platformLCD: 'antiAliasPlatformLCD',
});
export var warpStyle = createEnum('warpStyle', 'none', {
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
export var BlnM = createEnum('BlnM', 'normal', {
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
export var BESl = createEnum('BESl', 'inner bevel', {
    'inner bevel': 'InrB',
    'outer bevel': 'OtrB',
    'emboss': 'Embs',
    'pillow emboss': 'PlEb',
    'stroke emboss': 'strokeEmboss',
});
export var bvlT = createEnum('bvlT', 'smooth', {
    'smooth': 'SfBL',
    'chisel hard': 'PrBL',
    'chisel soft': 'Slmt',
});
export var BESs = createEnum('BESs', 'up', {
    up: 'In  ',
    down: 'Out ',
});
export var BETE = createEnum('BETE', 'softer', {
    softer: 'SfBL',
    precise: 'PrBL',
});
export var IGSr = createEnum('IGSr', 'edge', {
    edge: 'SrcE',
    center: 'SrcC',
});
export var GrdT = createEnum('GrdT', 'linear', {
    linear: 'Lnr ',
    radial: 'Rdl ',
    angle: 'Angl',
    reflected: 'Rflc',
    diamond: 'Dmnd',
});
export var animInterpStyleEnum = createEnum('animInterpStyle', 'linear', {
    linear: 'Lnr ',
    hold: 'hold',
});
export var stdTrackID = createEnum('stdTrackID', 'opacity', {
    opacity: 'opacityTrack',
    style: 'styleTrack',
    sheetTransform: 'sheetTransformTrack',
    sheetPosition: 'sheetPositionTrack',
    globalLighting: 'globalLightingTrack',
});
export var gradientInterpolationMethodType = createEnum('gradientInterpolationMethodType', 'perceptual', {
    perceptual: 'Perc',
    linear: 'Lnr',
    classic: 'Gcls',
});
export var ClrS = createEnum('ClrS', 'rgb', {
    rgb: 'RGBC',
    hsb: 'HSBl',
    lab: 'LbCl',
});
export var FStl = createEnum('FStl', 'outside', {
    outside: 'OutF',
    center: 'CtrF',
    inside: 'InsF'
});
export var FrFl = createEnum('FrFl', 'color', {
    color: 'SClr',
    gradient: 'GrFl',
    pattern: 'Ptrn',
});
export var strokeStyleLineCapType = createEnum('strokeStyleLineCapType', 'butt', {
    butt: 'strokeStyleButtCap',
    round: 'strokeStyleRoundCap',
    square: 'strokeStyleSquareCap',
});
export var strokeStyleLineJoinType = createEnum('strokeStyleLineJoinType', 'miter', {
    miter: 'strokeStyleMiterJoin',
    round: 'strokeStyleRoundJoin',
    bevel: 'strokeStyleBevelJoin',
});
export var strokeStyleLineAlignment = createEnum('strokeStyleLineAlignment', 'inside', {
    inside: 'strokeStyleAlignInside',
    center: 'strokeStyleAlignCenter',
    outside: 'strokeStyleAlignOutside',
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUM7Z0JBQUMsTUFBTTtZQUNwRCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLFFBQVEsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUN4RCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUNsRCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUNyRCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUNyRCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUNuRCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUN0RCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUN0RCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUNyRCxLQUFLLE1BQU07Z0JBQUUsTUFBTSxDQUFDLE9BQU8sR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFBQyxNQUFNO1lBQ3pFLEtBQUssT0FBTztnQkFBRSxNQUFNLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFBQyxNQUFNO1lBQ2pFLEtBQUss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QUMsQ0FBQztBQUVILE1BQU0sQ0FBQyxJQUFNLElBQUksR0FBRyxVQUFVLENBQWtDLE1BQU0sRUFBRSxTQUFTLEVBQUU7SUFDbEYsT0FBTyxFQUFFLE1BQU07SUFDZixNQUFNLEVBQUUsTUFBTTtJQUNkLE1BQU0sRUFBRSxNQUFNO0NBQ2QsQ0FBQyxDQUFDO0FBRUgsTUFBTSxDQUFDLElBQU0sSUFBSSxHQUFHLFVBQVUsQ0FBbUMsTUFBTSxFQUFFLE9BQU8sRUFBRTtJQUNqRixLQUFLLEVBQUUsTUFBTTtJQUNiLFFBQVEsRUFBRSxNQUFNO0lBQ2hCLE9BQU8sRUFBRSxNQUFNO0NBQ2YsQ0FBQyxDQUFDO0FBRUgsTUFBTSxDQUFDLElBQU0sc0JBQXNCLEdBQUcsVUFBVSxDQUFjLHdCQUF3QixFQUFFLE1BQU0sRUFBRTtJQUMvRixJQUFJLEVBQUUsb0JBQW9CO0lBQzFCLEtBQUssRUFBRSxxQkFBcUI7SUFDNUIsTUFBTSxFQUFFLHNCQUFzQjtDQUM5QixDQUFDLENBQUM7QUFFSCxNQUFNLENBQUMsSUFBTSx1QkFBdUIsR0FBRyxVQUFVLENBQWUseUJBQXlCLEVBQUUsT0FBTyxFQUFFO0lBQ25HLEtBQUssRUFBRSxzQkFBc0I7SUFDN0IsS0FBSyxFQUFFLHNCQUFzQjtJQUM3QixLQUFLLEVBQUUsc0JBQXNCO0NBQzdCLENBQUMsQ0FBQztBQUVILE1BQU0sQ0FBQyxJQUFNLHdCQUF3QixHQUFHLFVBQVUsQ0FBZ0IsMEJBQTBCLEVBQUUsUUFBUSxFQUFFO0lBQ3ZHLE1BQU0sRUFBRSx3QkFBd0I7SUFDaEMsTUFBTSxFQUFFLHdCQUF3QjtJQUNoQyxPQUFPLEVBQUUseUJBQXlCO0NBQ2xDLENBQUMsQ0FBQyIsImZpbGUiOiJkZXNjcmlwdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlRW51bSB9IGZyb20gJy4vaGVscGVycyc7XHJcbmltcG9ydCB7XHJcblx0QW50aUFsaWFzLCBCZXZlbERpcmVjdGlvbiwgQmV2ZWxTdHlsZSwgQmV2ZWxUZWNobmlxdWUsIEJsZW5kTW9kZSwgQ29sb3IsIEVmZmVjdENvbnRvdXIsXHJcblx0RWZmZWN0Tm9pc2VHcmFkaWVudCwgRWZmZWN0UGF0dGVybiwgRWZmZWN0U29saWRHcmFkaWVudCwgRXh0cmFHcmFkaWVudEluZm8sIEV4dHJhUGF0dGVybkluZm8sXHJcblx0R2xvd1NvdXJjZSwgR2xvd1RlY2huaXF1ZSwgR3JhZGllbnRTdHlsZSwgSW50ZXJwb2xhdGlvbk1ldGhvZCwgTGF5ZXJFZmZlY3RCZXZlbCxcclxuXHRMYXllckVmZmVjdEdyYWRpZW50T3ZlcmxheSwgTGF5ZXJFZmZlY3RJbm5lckdsb3csIExheWVyRWZmZWN0UGF0dGVybk92ZXJsYXksXHJcblx0TGF5ZXJFZmZlY3RTYXRpbiwgTGF5ZXJFZmZlY3RTaGFkb3csIExheWVyRWZmZWN0c0luZm8sIExheWVyRWZmZWN0U29saWRGaWxsLFxyXG5cdExheWVyRWZmZWN0c091dGVyR2xvdywgTGF5ZXJFZmZlY3RTdHJva2UsIExpbmVBbGlnbm1lbnQsIExpbmVDYXBUeXBlLCBMaW5lSm9pblR5cGUsXHJcblx0T3JpZW50YXRpb24sIFRleHRHcmlkZGluZywgVGltZWxpbmVLZXksIFRpbWVsaW5lS2V5SW50ZXJwb2xhdGlvbiwgVGltZWxpbmVUcmFjaywgVGltZWxpbmVUcmFja1R5cGUsXHJcblx0VW5pdHMsIFVuaXRzVmFsdWUsIFZlY3RvckNvbnRlbnQsIFdhcnBTdHlsZVxyXG59IGZyb20gJy4vcHNkJztcclxuaW1wb3J0IHtcclxuXHRQc2RSZWFkZXIsIHJlYWRTaWduYXR1cmUsIHJlYWRVbmljb2RlU3RyaW5nLCByZWFkVWludDMyLCByZWFkVWludDgsIHJlYWRGbG9hdDY0LFxyXG5cdHJlYWRCeXRlcywgcmVhZEFzY2lpU3RyaW5nLCByZWFkSW50MzIsIHJlYWRGbG9hdDMyLCByZWFkSW50MzJMRSwgcmVhZFVuaWNvZGVTdHJpbmdXaXRoTGVuZ3RoXHJcbn0gZnJvbSAnLi9wc2RSZWFkZXInO1xyXG5pbXBvcnQge1xyXG5cdFBzZFdyaXRlciwgd3JpdGVTaWduYXR1cmUsIHdyaXRlQnl0ZXMsIHdyaXRlVWludDMyLCB3cml0ZUZsb2F0NjQsIHdyaXRlVWludDgsXHJcblx0d3JpdGVVbmljb2RlU3RyaW5nV2l0aFBhZGRpbmcsIHdyaXRlSW50MzIsIHdyaXRlRmxvYXQzMiwgd3JpdGVVbmljb2RlU3RyaW5nXHJcbn0gZnJvbSAnLi9wc2RXcml0ZXInO1xyXG5cclxuaW50ZXJmYWNlIERpY3QgeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH1cclxuaW50ZXJmYWNlIE5hbWVDbGFzc0lEIHsgbmFtZTogc3RyaW5nOyBjbGFzc0lEOiBzdHJpbmc7IH1cclxuaW50ZXJmYWNlIEV4dFR5cGVEaWN0IHsgW2tleTogc3RyaW5nXTogTmFtZUNsYXNzSUQ7IH1cclxuXHJcbmZ1bmN0aW9uIHJldk1hcChtYXA6IERpY3QpIHtcclxuXHRjb25zdCByZXN1bHQ6IERpY3QgPSB7fTtcclxuXHRPYmplY3Qua2V5cyhtYXApLmZvckVhY2goa2V5ID0+IHJlc3VsdFttYXBba2V5XV0gPSBrZXkpO1xyXG5cdHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmNvbnN0IHVuaXRzTWFwOiBEaWN0ID0ge1xyXG5cdCcjQW5nJzogJ0FuZ2xlJyxcclxuXHQnI1JzbCc6ICdEZW5zaXR5JyxcclxuXHQnI1JsdCc6ICdEaXN0YW5jZScsXHJcblx0JyNObmUnOiAnTm9uZScsXHJcblx0JyNQcmMnOiAnUGVyY2VudCcsXHJcblx0JyNQeGwnOiAnUGl4ZWxzJyxcclxuXHQnI01sbSc6ICdNaWxsaW1ldGVycycsXHJcblx0JyNQbnQnOiAnUG9pbnRzJyxcclxuXHQnUnJQaSc6ICdQaWNhcycsXHJcblx0J1JySW4nOiAnSW5jaGVzJyxcclxuXHQnUnJDbSc6ICdDZW50aW1ldGVycycsXHJcbn07XHJcblxyXG5jb25zdCB1bml0c01hcFJldiA9IHJldk1hcCh1bml0c01hcCk7XHJcbmxldCBsb2dFcnJvcnMgPSBmYWxzZTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRMb2dFcnJvcnModmFsdWU6IGJvb2xlYW4pIHtcclxuXHRsb2dFcnJvcnMgPSB2YWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFrZVR5cGUobmFtZTogc3RyaW5nLCBjbGFzc0lEOiBzdHJpbmcpIHtcclxuXHRyZXR1cm4geyBuYW1lLCBjbGFzc0lEIH07XHJcbn1cclxuXHJcbmNvbnN0IG51bGxUeXBlID0gbWFrZVR5cGUoJycsICdudWxsJyk7XHJcblxyXG5jb25zdCBmaWVsZFRvRXh0VHlwZTogRXh0VHlwZURpY3QgPSB7XHJcblx0c3Ryb2tlU3R5bGVDb250ZW50OiBtYWtlVHlwZSgnJywgJ3NvbGlkQ29sb3JMYXllcicpLFxyXG5cdC8vIHByaW50UHJvb2ZTZXR1cDogbWFrZVR5cGUoJ+agoeagt+iuvue9ricsICdwcm9vZlNldHVwJyksIC8vIFRFU1RJTkdcclxuXHRwcmludFByb29mU2V0dXA6IG1ha2VUeXBlKCdQcm9vZiBTZXR1cCcsICdwcm9vZlNldHVwJyksXHJcblx0cGF0dGVybkZpbGw6IG1ha2VUeXBlKCcnLCAncGF0dGVybkZpbGwnKSxcclxuXHRHcmFkOiBtYWtlVHlwZSgnR3JhZGllbnQnLCAnR3JkbicpLFxyXG5cdGViYmw6IG1ha2VUeXBlKCcnLCAnZWJibCcpLFxyXG5cdFNvRmk6IG1ha2VUeXBlKCcnLCAnU29GaScpLFxyXG5cdEdyRmw6IG1ha2VUeXBlKCcnLCAnR3JGbCcpLFxyXG5cdHNkd0M6IG1ha2VUeXBlKCcnLCAnUkdCQycpLFxyXG5cdGhnbEM6IG1ha2VUeXBlKCcnLCAnUkdCQycpLFxyXG5cdCdDbHIgJzogbWFrZVR5cGUoJycsICdSR0JDJyksXHJcblx0J3RpbnRDb2xvcic6IG1ha2VUeXBlKCcnLCAnUkdCQycpLFxyXG5cdE9mc3Q6IG1ha2VUeXBlKCcnLCAnUG50ICcpLFxyXG5cdENoRlg6IG1ha2VUeXBlKCcnLCAnQ2hGWCcpLFxyXG5cdE1wZ1M6IG1ha2VUeXBlKCcnLCAnU2hwQycpLFxyXG5cdERyU2g6IG1ha2VUeXBlKCcnLCAnRHJTaCcpLFxyXG5cdElyU2g6IG1ha2VUeXBlKCcnLCAnSXJTaCcpLFxyXG5cdE9yR2w6IG1ha2VUeXBlKCcnLCAnT3JHbCcpLFxyXG5cdElyR2w6IG1ha2VUeXBlKCcnLCAnSXJHbCcpLFxyXG5cdFRyblM6IG1ha2VUeXBlKCcnLCAnU2hwQycpLFxyXG5cdFB0cm46IG1ha2VUeXBlKCcnLCAnUHRybicpLFxyXG5cdEZyRlg6IG1ha2VUeXBlKCcnLCAnRnJGWCcpLFxyXG5cdHBoYXNlOiBtYWtlVHlwZSgnJywgJ1BudCAnKSxcclxuXHRmcmFtZVN0ZXA6IG51bGxUeXBlLFxyXG5cdGR1cmF0aW9uOiBudWxsVHlwZSxcclxuXHR3b3JrSW5UaW1lOiBudWxsVHlwZSxcclxuXHR3b3JrT3V0VGltZTogbnVsbFR5cGUsXHJcblx0YXVkaW9DbGlwR3JvdXBMaXN0OiBudWxsVHlwZSxcclxuXHRib3VuZHM6IG1ha2VUeXBlKCcnLCAnUmN0bicpLFxyXG5cdGN1c3RvbUVudmVsb3BlV2FycDogbWFrZVR5cGUoJycsICdjdXN0b21FbnZlbG9wZVdhcnAnKSxcclxuXHR3YXJwOiBtYWtlVHlwZSgnJywgJ3dhcnAnKSxcclxuXHQnU3ogICc6IG1ha2VUeXBlKCcnLCAnUG50ICcpLFxyXG5cdG9yaWdpbjogbWFrZVR5cGUoJycsICdQbnQgJyksXHJcblx0YXV0b0V4cGFuZE9mZnNldDogbWFrZVR5cGUoJycsICdQbnQgJyksXHJcblx0a2V5T3JpZ2luU2hhcGVCQm94OiBtYWtlVHlwZSgnJywgJ3VuaXRSZWN0JyksXHJcblx0VnJzbjogbnVsbFR5cGUsXHJcblx0cHNWZXJzaW9uOiBudWxsVHlwZSxcclxuXHRkb2NEZWZhdWx0TmV3QXJ0Ym9hcmRCYWNrZ3JvdW5kQ29sb3I6IG1ha2VUeXBlKCcnLCAnUkdCQycpLFxyXG5cdGFydGJvYXJkUmVjdDogbWFrZVR5cGUoJycsICdjbGFzc0Zsb2F0UmVjdCcpLFxyXG5cdGtleU9yaWdpblJSZWN0UmFkaWk6IG1ha2VUeXBlKCcnLCAncmFkaWknKSxcclxuXHRrZXlPcmlnaW5Cb3hDb3JuZXJzOiBudWxsVHlwZSxcclxuXHRyZWN0YW5nbGVDb3JuZXJBOiBtYWtlVHlwZSgnJywgJ1BudCAnKSxcclxuXHRyZWN0YW5nbGVDb3JuZXJCOiBtYWtlVHlwZSgnJywgJ1BudCAnKSxcclxuXHRyZWN0YW5nbGVDb3JuZXJDOiBtYWtlVHlwZSgnJywgJ1BudCAnKSxcclxuXHRyZWN0YW5nbGVDb3JuZXJEOiBtYWtlVHlwZSgnJywgJ1BudCAnKSxcclxuXHRjb21wSW5mbzogbnVsbFR5cGUsXHJcblx0VHJuZjogbWFrZVR5cGUoJ1RyYW5zZm9ybScsICdUcm5mJyksXHJcblx0cXVpbHRXYXJwOiBtYWtlVHlwZSgnJywgJ3F1aWx0V2FycCcpLFxyXG5cdGdlbmVyYXRvclNldHRpbmdzOiBudWxsVHlwZSxcclxuXHRjcmVtYTogbnVsbFR5cGUsXHJcblx0RnJJbjogbnVsbFR5cGUsXHJcblx0YmxlbmRPcHRpb25zOiBudWxsVHlwZSxcclxuXHRGWFJmOiBudWxsVHlwZSxcclxuXHRMZWZ4OiBudWxsVHlwZSxcclxuXHR0aW1lOiBudWxsVHlwZSxcclxuXHRhbmltS2V5OiBudWxsVHlwZSxcclxuXHR0aW1lU2NvcGU6IG51bGxUeXBlLFxyXG5cdGluVGltZTogbnVsbFR5cGUsXHJcblx0b3V0VGltZTogbnVsbFR5cGUsXHJcblx0c2hlZXRTdHlsZTogbnVsbFR5cGUsXHJcblx0dHJhbnNsYXRpb246IG51bGxUeXBlLFxyXG5cdFNrZXc6IG51bGxUeXBlLFxyXG5cdCdMbmsgJzogbWFrZVR5cGUoJycsICdFeHRlcm5hbEZpbGVMaW5rJyksXHJcblx0ZnJhbWVSZWFkZXI6IG1ha2VUeXBlKCcnLCAnRnJhbWVSZWFkZXInKSxcclxuXHRlZmZlY3RQYXJhbXM6IG1ha2VUeXBlKCcnLCAnbW90aW9uVHJhY2tFZmZlY3RQYXJhbXMnKSxcclxufTtcclxuXHJcbmNvbnN0IGZpZWxkVG9BcnJheUV4dFR5cGU6IEV4dFR5cGVEaWN0ID0ge1xyXG5cdCdDcnYgJzogbWFrZVR5cGUoJycsICdDclB0JyksXHJcblx0Q2xyczogbWFrZVR5cGUoJycsICdDbHJ0JyksXHJcblx0VHJuczogbWFrZVR5cGUoJycsICdUcm5TJyksXHJcblx0a2V5RGVzY3JpcHRvckxpc3Q6IG51bGxUeXBlLFxyXG5cdHNvbGlkRmlsbE11bHRpOiBtYWtlVHlwZSgnJywgJ1NvRmknKSxcclxuXHRncmFkaWVudEZpbGxNdWx0aTogbWFrZVR5cGUoJycsICdHckZsJyksXHJcblx0ZHJvcFNoYWRvd011bHRpOiBtYWtlVHlwZSgnJywgJ0RyU2gnKSxcclxuXHRpbm5lclNoYWRvd011bHRpOiBtYWtlVHlwZSgnJywgJ0lyU2gnKSxcclxuXHRmcmFtZUZYTXVsdGk6IG1ha2VUeXBlKCcnLCAnRnJGWCcpLFxyXG5cdEZySW46IG51bGxUeXBlLFxyXG5cdEZTdHM6IG51bGxUeXBlLFxyXG5cdExhU3Q6IG51bGxUeXBlLFxyXG5cdHNoZWV0VGltZWxpbmVPcHRpb25zOiBudWxsVHlwZSxcclxuXHR0cmFja0xpc3Q6IG1ha2VUeXBlKCcnLCAnYW5pbWF0aW9uVHJhY2snKSxcclxuXHRnbG9iYWxUcmFja0xpc3Q6IG1ha2VUeXBlKCcnLCAnYW5pbWF0aW9uVHJhY2snKSxcclxuXHRrZXlMaXN0OiBudWxsVHlwZSxcclxuXHRhdWRpb0NsaXBHcm91cExpc3Q6IG51bGxUeXBlLFxyXG5cdGF1ZGlvQ2xpcExpc3Q6IG51bGxUeXBlLFxyXG59O1xyXG5cclxuY29uc3QgdHlwZVRvRmllbGQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nW107IH0gPSB7XHJcblx0J1RFWFQnOiBbXHJcblx0XHQnVHh0ICcsICdwcmludGVyTmFtZScsICdObSAgJywgJ0lkbnQnLCAnYmxhY2tBbmRXaGl0ZVByZXNldEZpbGVOYW1lJywgJ0xVVDNERmlsZU5hbWUnLFxyXG5cdFx0J3ByZXNldEZpbGVOYW1lJywgJ2N1cnZlc1ByZXNldEZpbGVOYW1lJywgJ21peGVyUHJlc2V0RmlsZU5hbWUnLCAncGxhY2VkJywgJ2Rlc2NyaXB0aW9uJywgJ3JlYXNvbicsXHJcblx0XHQnYXJ0Ym9hcmRQcmVzZXROYW1lJywgJ2pzb24nLCAnZ3JvdXBJRCcsICdjbGlwSUQnLCAncmVsUGF0aCcsICdmdWxsUGF0aCcsICdtZWRpYURlc2NyaXB0b3InLFxyXG5cdF0sXHJcblx0J3RkdGEnOiBbJ0VuZ2luZURhdGEnLCAnTFVUM0RGaWxlRGF0YSddLFxyXG5cdCdsb25nJzogW1xyXG5cdFx0J1RleHRJbmRleCcsICdSbmRTJywgJ01kcG4nLCAnU210aCcsICdMY3RuJywgJ3N0cm9rZVN0eWxlVmVyc2lvbicsICdMYUlEJywgJ1Zyc24nLCAnQ250ICcsXHJcblx0XHQnQnJnaCcsICdDbnRyJywgJ21lYW5zJywgJ3ZpYnJhbmNlJywgJ1N0cnQnLCAnYndQcmVzZXRLaW5kJywgJ3ByZXNldEtpbmQnLCAnY29tcCcsICdjb21wSUQnLCAnb3JpZ2luYWxDb21wSUQnLFxyXG5cdFx0J2N1cnZlc1ByZXNldEtpbmQnLCAnbWl4ZXJQcmVzZXRLaW5kJywgJ3VPcmRlcicsICd2T3JkZXInLCAnUGdObScsICd0b3RhbFBhZ2VzJywgJ0Nyb3AnLFxyXG5cdFx0J251bWVyYXRvcicsICdkZW5vbWluYXRvcicsICdmcmFtZUNvdW50JywgJ0FubnQnLCAna2V5T3JpZ2luVHlwZScsICd1bml0VmFsdWVRdWFkVmVyc2lvbicsXHJcblx0XHQna2V5T3JpZ2luSW5kZXgnLCAnbWFqb3InLCAnbWlub3InLCAnZml4JywgJ2RvY0RlZmF1bHROZXdBcnRib2FyZEJhY2tncm91bmRUeXBlJywgJ2FydGJvYXJkQmFja2dyb3VuZFR5cGUnLFxyXG5cdFx0J251bU1vZGlmeWluZ0ZYJywgJ2RlZm9ybU51bVJvd3MnLCAnZGVmb3JtTnVtQ29scycsICdGcklEJywgJ0ZyRGwnLCAnRnNJRCcsICdMQ250JywgJ0FGcm0nLCAnQUZTdCcsXHJcblx0XHQnbnVtQmVmb3JlJywgJ251bUFmdGVyJywgJ1NwY24nLCAnbWluT3BhY2l0eScsICdtYXhPcGFjaXR5JywgJ0Jsbk0nLCAnc2hlZXRJRCcsICdnYmxBJywgJ2dsb2JhbEFsdGl0dWRlJyxcclxuXHRcdCdkZXNjVmVyc2lvbicsICdmcmFtZVJlYWRlclR5cGUnLCAnTHlySScsICd6b29tT3JpZ2luJyxcclxuXHRdLFxyXG5cdCdlbnVtJzogW1xyXG5cdFx0J3RleHRHcmlkZGluZycsICdPcm50JywgJ3dhcnBTdHlsZScsICd3YXJwUm90YXRlJywgJ0ludGUnLCAnQmx0bicsICdDbHJTJyxcclxuXHRcdCdzZHdNJywgJ2hnbE0nLCAnYnZsVCcsICdidmxTJywgJ2J2bEQnLCAnTWQgICcsICdnbHdTJywgJ0dyZEYnLCAnR2x3VCcsXHJcblx0XHQnc3Ryb2tlU3R5bGVMaW5lQ2FwVHlwZScsICdzdHJva2VTdHlsZUxpbmVKb2luVHlwZScsICdzdHJva2VTdHlsZUxpbmVBbGlnbm1lbnQnLFxyXG5cdFx0J3N0cm9rZVN0eWxlQmxlbmRNb2RlJywgJ1BudFQnLCAnU3R5bCcsICdsb29rdXBUeXBlJywgJ0xVVEZvcm1hdCcsICdkYXRhT3JkZXInLFxyXG5cdFx0J3RhYmxlT3JkZXInLCAnZW5hYmxlQ29tcENvcmUnLCAnZW5hYmxlQ29tcENvcmVHUFUnLCAnY29tcENvcmVTdXBwb3J0JywgJ2NvbXBDb3JlR1BVU3VwcG9ydCcsICdFbmduJyxcclxuXHRcdCdlbmFibGVDb21wQ29yZVRocmVhZHMnLCAnZ3M5OScsICdGckRzJywgJ3RyYWNrSUQnLCAnYW5pbUludGVycFN0eWxlJyxcclxuXHRdLFxyXG5cdCdib29sJzogW1xyXG5cdFx0J1BzdFMnLCAncHJpbnRTaXh0ZWVuQml0JywgJ21hc3RlckZYU3dpdGNoJywgJ2VuYWInLCAndWdsZycsICdhbnRpYWxpYXNHbG9zcycsXHJcblx0XHQndXNlU2hhcGUnLCAndXNlVGV4dHVyZScsICd1Z2xnJywgJ2FudGlhbGlhc0dsb3NzJywgJ3VzZVNoYXBlJyxcclxuXHRcdCd1c2VUZXh0dXJlJywgJ0FsZ24nLCAnUnZycycsICdEdGhyJywgJ0ludnInLCAnVmN0QycsICdTaFRyJywgJ2xheWVyQ29uY2VhbHMnLFxyXG5cdFx0J3N0cm9rZUVuYWJsZWQnLCAnZmlsbEVuYWJsZWQnLCAnc3Ryb2tlU3R5bGVTY2FsZUxvY2snLCAnc3Ryb2tlU3R5bGVTdHJva2VBZGp1c3QnLFxyXG5cdFx0J2hhcmRQcm9vZicsICdNcEJsJywgJ3BhcGVyV2hpdGUnLCAndXNlTGVnYWN5JywgJ0F1dG8nLCAnTGFiICcsICd1c2VUaW50JywgJ2tleVNoYXBlSW52YWxpZGF0ZWQnLFxyXG5cdFx0J2F1dG9FeHBhbmRFbmFibGVkJywgJ2F1dG9OZXN0RW5hYmxlZCcsICdhdXRvUG9zaXRpb25FbmFibGVkJywgJ3Nocmlua3dyYXBPblNhdmVFbmFibGVkJyxcclxuXHRcdCdwcmVzZW50JywgJ3Nob3dJbkRpYWxvZycsICdvdmVycHJpbnQnLCAnc2hlZXREaXNjbG9zZWQnLCAnbGlnaHRzRGlzY2xvc2VkJywgJ21lc2hlc0Rpc2Nsb3NlZCcsXHJcblx0XHQnbWF0ZXJpYWxzRGlzY2xvc2VkJywgJ2hhc01vdGlvbicsICdtdXRlZCcsICdFZmZjJywgJ3NlbGVjdGVkJywgJ2F1dG9TY29wZScsICdmaWxsQ2FudmFzJyxcclxuXHRdLFxyXG5cdCdkb3ViJzogW1xyXG5cdFx0J3dhcnBWYWx1ZScsICd3YXJwUGVyc3BlY3RpdmUnLCAnd2FycFBlcnNwZWN0aXZlT3RoZXInLCAnSW50cicsICdXZHRoJywgJ0hnaHQnLFxyXG5cdFx0J3N0cm9rZVN0eWxlTWl0ZXJMaW1pdCcsICdzdHJva2VTdHlsZVJlc29sdXRpb24nLCAnbGF5ZXJUaW1lJywgJ2tleU9yaWdpblJlc29sdXRpb24nLFxyXG5cdFx0J3h4JywgJ3h5JywgJ3l4JywgJ3l5JywgJ3R4JywgJ3R5JywgJ0ZyR0EnLCAnZnJhbWVSYXRlJywgJ2F1ZGlvTGV2ZWwnLCAncm90YXRpb24nLFxyXG5cdF0sXHJcblx0J1VudEYnOiBbXHJcblx0XHQnU2NsICcsICdzZHdPJywgJ2hnbE8nLCAnbGFnbCcsICdMYWxkJywgJ3NyZ1InLCAnYmx1cicsICdTZnRuJywgJ09wY3QnLCAnRHN0bicsICdBbmdsJyxcclxuXHRcdCdDa210JywgJ05vc2UnLCAnSW5wcicsICdTaGROJywgJ3N0cm9rZVN0eWxlTGluZVdpZHRoJywgJ3N0cm9rZVN0eWxlTGluZURhc2hPZmZzZXQnLFxyXG5cdFx0J3N0cm9rZVN0eWxlT3BhY2l0eScsICdIICAgJywgJ1RvcCAnLCAnTGVmdCcsICdCdG9tJywgJ1JnaHQnLCAnUnNsdCcsXHJcblx0XHQndG9wUmlnaHQnLCAndG9wTGVmdCcsICdib3R0b21MZWZ0JywgJ2JvdHRvbVJpZ2h0JyxcclxuXHRdLFxyXG5cdCdWbExzJzogW1xyXG5cdFx0J0NydiAnLCAnQ2xycycsICdNbm0gJywgJ014bSAnLCAnVHJucycsICdwYXRoTGlzdCcsICdzdHJva2VTdHlsZUxpbmVEYXNoU2V0JywgJ0ZyTHMnLFxyXG5cdFx0J0xhU3QnLCAnVHJuZicsICdub25BZmZpbmVUcmFuc2Zvcm0nLCAna2V5RGVzY3JpcHRvckxpc3QnLCAnZ3VpZGVJbmRlY2VzJywgJ2dyYWRpZW50RmlsbE11bHRpJyxcclxuXHRcdCdzb2xpZEZpbGxNdWx0aScsICdmcmFtZUZYTXVsdGknLCAnaW5uZXJTaGFkb3dNdWx0aScsICdkcm9wU2hhZG93TXVsdGknLCAnRnJJbicsICdGU3RzJywgJ0ZzRnInLFxyXG5cdFx0J3NoZWV0VGltZWxpbmVPcHRpb25zJywgJ2F1ZGlvQ2xpcExpc3QnLCAndHJhY2tMaXN0JywgJ2dsb2JhbFRyYWNrTGlzdCcsICdrZXlMaXN0JywgJ2F1ZGlvQ2xpcExpc3QnLFxyXG5cdF0sXHJcblx0J09iQXInOiBbJ21lc2hQb2ludHMnLCAncXVpbHRTbGljZVgnLCAncXVpbHRTbGljZVknXSxcclxuXHQnb2JqICc6IFsnbnVsbCddLFxyXG59O1xyXG5cclxuY29uc3QgY2hhbm5lbHMgPSBbXHJcblx0J1JkICAnLCAnR3JuICcsICdCbCAgJywgJ1lsbHcnLCAnWWx3ICcsICdDeW4gJywgJ01nbnQnLCAnQmxjaycsICdHcnkgJywgJ0xtbmMnLCAnQSAgICcsICdCICAgJyxcclxuXTtcclxuXHJcbmNvbnN0IGZpZWxkVG9BcnJheVR5cGU6IERpY3QgPSB7XHJcblx0J01ubSAnOiAnbG9uZycsXHJcblx0J014bSAnOiAnbG9uZycsXHJcblx0J0ZyTHMnOiAnbG9uZycsXHJcblx0J3N0cm9rZVN0eWxlTGluZURhc2hTZXQnOiAnVW50RicsXHJcblx0J1RybmYnOiAnZG91YicsXHJcblx0J25vbkFmZmluZVRyYW5zZm9ybSc6ICdkb3ViJyxcclxuXHQna2V5RGVzY3JpcHRvckxpc3QnOiAnT2JqYycsXHJcblx0J2dyYWRpZW50RmlsbE11bHRpJzogJ09iamMnLFxyXG5cdCdzb2xpZEZpbGxNdWx0aSc6ICdPYmpjJyxcclxuXHQnZnJhbWVGWE11bHRpJzogJ09iamMnLFxyXG5cdCdpbm5lclNoYWRvd011bHRpJzogJ09iamMnLFxyXG5cdCdkcm9wU2hhZG93TXVsdGknOiAnT2JqYycsXHJcblx0J0xhU3QnOiAnT2JqYycsXHJcblx0J0ZySW4nOiAnT2JqYycsXHJcblx0J0ZTdHMnOiAnT2JqYycsXHJcblx0J0ZzRnInOiAnbG9uZycsXHJcblx0J2JsZW5kT3B0aW9ucyc6ICdPYmpjJyxcclxuXHQnc2hlZXRUaW1lbGluZU9wdGlvbnMnOiAnT2JqYycsXHJcblx0J2tleUxpc3QnOiAnT2JqYycsXHJcbn07XHJcblxyXG5jb25zdCBmaWVsZFRvVHlwZTogRGljdCA9IHt9O1xyXG5cclxuZm9yIChjb25zdCB0eXBlIG9mIE9iamVjdC5rZXlzKHR5cGVUb0ZpZWxkKSkge1xyXG5cdGZvciAoY29uc3QgZmllbGQgb2YgdHlwZVRvRmllbGRbdHlwZV0pIHtcclxuXHRcdGZpZWxkVG9UeXBlW2ZpZWxkXSA9IHR5cGU7XHJcblx0fVxyXG59XHJcblxyXG5mb3IgKGNvbnN0IGZpZWxkIG9mIE9iamVjdC5rZXlzKGZpZWxkVG9FeHRUeXBlKSkge1xyXG5cdGlmICghZmllbGRUb1R5cGVbZmllbGRdKSBmaWVsZFRvVHlwZVtmaWVsZF0gPSAnT2JqYyc7XHJcbn1cclxuXHJcbmZvciAoY29uc3QgZmllbGQgb2YgT2JqZWN0LmtleXMoZmllbGRUb0FycmF5RXh0VHlwZSkpIHtcclxuXHRmaWVsZFRvQXJyYXlUeXBlW2ZpZWxkXSA9ICdPYmpjJztcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0VHlwZUJ5S2V5KGtleTogc3RyaW5nLCB2YWx1ZTogYW55LCByb290OiBzdHJpbmcsIHBhcmVudDogYW55KSB7XHJcblx0aWYgKGtleSA9PT0gJ1N6ICAnKSB7XHJcblx0XHRyZXR1cm4gKCdXZHRoJyBpbiB2YWx1ZSkgPyAnT2JqYycgOiAoKCd1bml0cycgaW4gdmFsdWUpID8gJ1VudEYnIDogJ2RvdWInKTtcclxuXHR9IGVsc2UgaWYgKGtleSA9PT0gJ1R5cGUnKSB7XHJcblx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/ICdlbnVtJyA6ICdsb25nJztcclxuXHR9IGVsc2UgaWYgKGtleSA9PT0gJ0FudEEnKSB7XHJcblx0XHRyZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/ICdlbnVtJyA6ICdib29sJztcclxuXHR9IGVsc2UgaWYgKChrZXkgPT09ICdIcnpuJyB8fCBrZXkgPT09ICdWcnRjJykgJiYgcGFyZW50LlR5cGUgPT09ICdrZXlUeXBlLlBzdG4nKSB7XHJcblx0XHRyZXR1cm4gJ2xvbmcnO1xyXG5cdH0gZWxzZSBpZiAoa2V5ID09PSAnSHJ6bicgfHwga2V5ID09PSAnVnJ0YycgfHwga2V5ID09PSAnVG9wICcgfHwga2V5ID09PSAnTGVmdCcgfHwga2V5ID09PSAnQnRvbScgfHwga2V5ID09PSAnUmdodCcpIHtcclxuXHRcdHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInID8gJ2RvdWInIDogJ1VudEYnO1xyXG5cdH0gZWxzZSBpZiAoa2V5ID09PSAnVnJzbicpIHtcclxuXHRcdHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInID8gJ2xvbmcnIDogJ09iamMnO1xyXG5cdH0gZWxzZSBpZiAoa2V5ID09PSAnUmQgICcgfHwga2V5ID09PSAnR3JuICcgfHwga2V5ID09PSAnQmwgICcpIHtcclxuXHRcdHJldHVybiByb290ID09PSAnYXJ0ZCcgPyAnbG9uZycgOiAnZG91Yic7XHJcblx0fSBlbHNlIGlmIChrZXkgPT09ICdUcm5mJykge1xyXG5cdFx0cmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gJ1ZsTHMnIDogJ09iamMnO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRyZXR1cm4gZmllbGRUb1R5cGVba2V5XTtcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWFkQXNjaWlTdHJpbmdPckNsYXNzSWQocmVhZGVyOiBQc2RSZWFkZXIpIHtcclxuXHRjb25zdCBsZW5ndGggPSByZWFkSW50MzIocmVhZGVyKTtcclxuXHRyZXR1cm4gcmVhZEFzY2lpU3RyaW5nKHJlYWRlciwgbGVuZ3RoIHx8IDQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB3cml0ZUFzY2lpU3RyaW5nT3JDbGFzc0lkKHdyaXRlcjogUHNkV3JpdGVyLCB2YWx1ZTogc3RyaW5nKSB7XHJcblx0aWYgKHZhbHVlLmxlbmd0aCA9PT0gNCAmJiB2YWx1ZSAhPT0gJ3dhcnAnICYmIHZhbHVlICE9PSAndGltZScgJiYgdmFsdWUgIT09ICdob2xkJykge1xyXG5cdFx0Ly8gd3JpdGUgY2xhc3NJZFxyXG5cdFx0d3JpdGVJbnQzMih3cml0ZXIsIDApO1xyXG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCB2YWx1ZSk7XHJcblx0fSBlbHNlIHtcclxuXHRcdC8vIHdyaXRlIGFzY2lpIHN0cmluZ1xyXG5cdFx0d3JpdGVJbnQzMih3cml0ZXIsIHZhbHVlLmxlbmd0aCk7XHJcblxyXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgdmFsdWUuY2hhckNvZGVBdChpKSk7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZERlc2NyaXB0b3JTdHJ1Y3R1cmUocmVhZGVyOiBQc2RSZWFkZXIpIHtcclxuXHRjb25zdCBvYmplY3Q6IGFueSA9IHt9O1xyXG5cdC8vIG9iamVjdC5fX3N0cnVjdCA9XHJcblx0cmVhZENsYXNzU3RydWN0dXJlKHJlYWRlcik7XHJcblx0Y29uc3QgaXRlbXNDb3VudCA9IHJlYWRVaW50MzIocmVhZGVyKTtcclxuXHQvLyBjb25zb2xlLmxvZygnLy8nLCBvYmplY3QuX19zdHJ1Y3QpO1xyXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXNDb3VudDsgaSsrKSB7XHJcblx0XHRjb25zdCBrZXkgPSByZWFkQXNjaWlTdHJpbmdPckNsYXNzSWQocmVhZGVyKTtcclxuXHRcdGNvbnN0IHR5cGUgPSByZWFkU2lnbmF0dXJlKHJlYWRlcik7XHJcblx0XHQvLyBjb25zb2xlLmxvZyhgPiAnJHtrZXl9JyAnJHt0eXBlfSdgKTtcclxuXHRcdGNvbnN0IGRhdGEgPSByZWFkT1NUeXBlKHJlYWRlciwgdHlwZSk7XHJcblx0XHQvLyBpZiAoIWdldFR5cGVCeUtleShrZXksIGRhdGEpKSBjb25zb2xlLmxvZyhgPiAnJHtrZXl9JyAnJHt0eXBlfSdgLCBkYXRhKTtcclxuXHRcdG9iamVjdFtrZXldID0gZGF0YTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBvYmplY3Q7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3cml0ZURlc2NyaXB0b3JTdHJ1Y3R1cmUod3JpdGVyOiBQc2RXcml0ZXIsIG5hbWU6IHN0cmluZywgY2xhc3NJZDogc3RyaW5nLCB2YWx1ZTogYW55LCByb290OiBzdHJpbmcpIHtcclxuXHRpZiAobG9nRXJyb3JzICYmICFjbGFzc0lkKSBjb25zb2xlLmxvZygnTWlzc2luZyBjbGFzc0lkIGZvcjogJywgbmFtZSwgY2xhc3NJZCwgdmFsdWUpO1xyXG5cclxuXHQvLyB3cml0ZSBjbGFzcyBzdHJ1Y3R1cmVcclxuXHR3cml0ZVVuaWNvZGVTdHJpbmdXaXRoUGFkZGluZyh3cml0ZXIsIG5hbWUpO1xyXG5cdHdyaXRlQXNjaWlTdHJpbmdPckNsYXNzSWQod3JpdGVyLCBjbGFzc0lkKTtcclxuXHJcblx0Y29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcclxuXHR3cml0ZVVpbnQzMih3cml0ZXIsIGtleXMubGVuZ3RoKTtcclxuXHJcblx0Zm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xyXG5cdFx0bGV0IHR5cGUgPSBnZXRUeXBlQnlLZXkoa2V5LCB2YWx1ZVtrZXldLCByb290LCB2YWx1ZSk7XHJcblx0XHRsZXQgZXh0VHlwZSA9IGZpZWxkVG9FeHRUeXBlW2tleV07XHJcblxyXG5cdFx0aWYgKGtleSA9PT0gJ1NjbCAnICYmICdIcnpuJyBpbiB2YWx1ZVtrZXldKSB7XHJcblx0XHRcdHR5cGUgPSAnT2JqYyc7XHJcblx0XHRcdGV4dFR5cGUgPSBudWxsVHlwZTtcclxuXHRcdH0gZWxzZSBpZiAoa2V5ID09PSAnYXVkaW9DbGlwR3JvdXBMaXN0JyAmJiBrZXlzLmxlbmd0aCA9PT0gMSkge1xyXG5cdFx0XHR0eXBlID0gJ1ZsTHMnO1xyXG5cdFx0fSBlbHNlIGlmICgoa2V5ID09PSAnU3RydCcgfHwga2V5ID09PSAnQnJnaCcpICYmICdIICAgJyBpbiB2YWx1ZSkge1xyXG5cdFx0XHR0eXBlID0gJ2RvdWInO1xyXG5cdFx0fSBlbHNlIGlmIChrZXkgPT09ICdTdHJ0Jykge1xyXG5cdFx0XHR0eXBlID0gJ09iamMnO1xyXG5cdFx0XHRleHRUeXBlID0gbnVsbFR5cGU7XHJcblx0XHR9IGVsc2UgaWYgKGNoYW5uZWxzLmluZGV4T2Yoa2V5KSAhPT0gLTEpIHtcclxuXHRcdFx0dHlwZSA9IChjbGFzc0lkID09PSAnUkdCQycgJiYgcm9vdCAhPT0gJ2FydGQnKSA/ICdkb3ViJyA6ICdsb25nJztcclxuXHRcdH0gZWxzZSBpZiAoa2V5ID09PSAncHJvZmlsZScpIHtcclxuXHRcdFx0dHlwZSA9IGNsYXNzSWQgPT09ICdwcmludE91dHB1dCcgPyAnVEVYVCcgOiAndGR0YSc7XHJcblx0XHR9IGVsc2UgaWYgKGtleSA9PT0gJ3N0cm9rZVN0eWxlQ29udGVudCcpIHtcclxuXHRcdFx0aWYgKHZhbHVlW2tleV1bJ0NsciAnXSkge1xyXG5cdFx0XHRcdGV4dFR5cGUgPSBtYWtlVHlwZSgnJywgJ3NvbGlkQ29sb3JMYXllcicpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHZhbHVlW2tleV0uR3JhZCkge1xyXG5cdFx0XHRcdGV4dFR5cGUgPSBtYWtlVHlwZSgnJywgJ2dyYWRpZW50TGF5ZXInKTtcclxuXHRcdFx0fSBlbHNlIGlmICh2YWx1ZVtrZXldLlB0cm4pIHtcclxuXHRcdFx0XHRleHRUeXBlID0gbWFrZVR5cGUoJycsICdwYXR0ZXJuTGF5ZXInKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRsb2dFcnJvcnMgJiYgY29uc29sZS5sb2coJ0ludmFsaWQgc3Ryb2tlU3R5bGVDb250ZW50IHZhbHVlJywgdmFsdWVba2V5XSk7XHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSBpZiAoa2V5ID09PSAnYm91bmRzJyAmJiByb290ID09PSAncXVpbHRXYXJwJykge1xyXG5cdFx0XHRleHRUeXBlID0gbWFrZVR5cGUoJycsICdjbGFzc0Zsb2F0UmVjdCcpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChleHRUeXBlICYmIGV4dFR5cGUuY2xhc3NJRCA9PT0gJ1JHQkMnKSB7XHJcblx0XHRcdGlmICgnSCAgICcgaW4gdmFsdWVba2V5XSkgZXh0VHlwZSA9IHsgY2xhc3NJRDogJ0hTQkMnLCBuYW1lOiAnJyB9O1xyXG5cdFx0XHQvLyBUT0RPOiBvdGhlciBjb2xvciBzcGFjZXNcclxuXHRcdH1cclxuXHJcblx0XHR3cml0ZUFzY2lpU3RyaW5nT3JDbGFzc0lkKHdyaXRlciwga2V5KTtcclxuXHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgdHlwZSB8fCAnbG9uZycpO1xyXG5cdFx0d3JpdGVPU1R5cGUod3JpdGVyLCB0eXBlIHx8ICdsb25nJywgdmFsdWVba2V5XSwga2V5LCBleHRUeXBlLCByb290KTtcclxuXHRcdGlmIChsb2dFcnJvcnMgJiYgIXR5cGUpIGNvbnNvbGUubG9nKGBNaXNzaW5nIGRlc2NyaXB0b3IgZmllbGQgdHlwZSBmb3I6ICcke2tleX0nIGluYCwgdmFsdWUpO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZE9TVHlwZShyZWFkZXI6IFBzZFJlYWRlciwgdHlwZTogc3RyaW5nKSB7XHJcblx0c3dpdGNoICh0eXBlKSB7XHJcblx0XHRjYXNlICdvYmogJzogLy8gUmVmZXJlbmNlXHJcblx0XHRcdHJldHVybiByZWFkUmVmZXJlbmNlU3RydWN0dXJlKHJlYWRlcik7XHJcblx0XHRjYXNlICdPYmpjJzogLy8gRGVzY3JpcHRvclxyXG5cdFx0Y2FzZSAnR2xiTyc6IC8vIEdsb2JhbE9iamVjdCBzYW1lIGFzIERlc2NyaXB0b3JcclxuXHRcdFx0cmV0dXJuIHJlYWREZXNjcmlwdG9yU3RydWN0dXJlKHJlYWRlcik7XHJcblx0XHRjYXNlICdWbExzJzogeyAvLyBMaXN0XHJcblx0XHRcdGNvbnN0IGxlbmd0aCA9IHJlYWRJbnQzMihyZWFkZXIpO1xyXG5cdFx0XHRjb25zdCBpdGVtczogYW55W10gPSBbXTtcclxuXHJcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRjb25zdCB0eXBlID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xyXG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKCcgID4nLCB0eXBlKTtcclxuXHRcdFx0XHRpdGVtcy5wdXNoKHJlYWRPU1R5cGUocmVhZGVyLCB0eXBlKSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBpdGVtcztcclxuXHRcdH1cclxuXHRcdGNhc2UgJ2RvdWInOiAvLyBEb3VibGVcclxuXHRcdFx0cmV0dXJuIHJlYWRGbG9hdDY0KHJlYWRlcik7XHJcblx0XHRjYXNlICdVbnRGJzogeyAvLyBVbml0IGRvdWJsZVxyXG5cdFx0XHRjb25zdCB1bml0cyA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcclxuXHRcdFx0Y29uc3QgdmFsdWUgPSByZWFkRmxvYXQ2NChyZWFkZXIpO1xyXG5cdFx0XHRpZiAoIXVuaXRzTWFwW3VuaXRzXSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHVuaXRzOiAke3VuaXRzfWApO1xyXG5cdFx0XHRyZXR1cm4geyB1bml0czogdW5pdHNNYXBbdW5pdHNdLCB2YWx1ZSB9O1xyXG5cdFx0fVxyXG5cdFx0Y2FzZSAnVW5GbCc6IHsgLy8gVW5pdCBmbG9hdFxyXG5cdFx0XHRjb25zdCB1bml0cyA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcclxuXHRcdFx0Y29uc3QgdmFsdWUgPSByZWFkRmxvYXQzMihyZWFkZXIpO1xyXG5cdFx0XHRpZiAoIXVuaXRzTWFwW3VuaXRzXSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHVuaXRzOiAke3VuaXRzfWApO1xyXG5cdFx0XHRyZXR1cm4geyB1bml0czogdW5pdHNNYXBbdW5pdHNdLCB2YWx1ZSB9O1xyXG5cdFx0fVxyXG5cdFx0Y2FzZSAnVEVYVCc6IC8vIFN0cmluZ1xyXG5cdFx0XHRyZXR1cm4gcmVhZFVuaWNvZGVTdHJpbmcocmVhZGVyKTtcclxuXHRcdGNhc2UgJ2VudW0nOiB7IC8vIEVudW1lcmF0ZWRcclxuXHRcdFx0Y29uc3QgdHlwZSA9IHJlYWRBc2NpaVN0cmluZ09yQ2xhc3NJZChyZWFkZXIpO1xyXG5cdFx0XHRjb25zdCB2YWx1ZSA9IHJlYWRBc2NpaVN0cmluZ09yQ2xhc3NJZChyZWFkZXIpO1xyXG5cdFx0XHRyZXR1cm4gYCR7dHlwZX0uJHt2YWx1ZX1gO1xyXG5cdFx0fVxyXG5cdFx0Y2FzZSAnbG9uZyc6IC8vIEludGVnZXJcclxuXHRcdFx0cmV0dXJuIHJlYWRJbnQzMihyZWFkZXIpO1xyXG5cdFx0Y2FzZSAnY29tcCc6IHsgLy8gTGFyZ2UgSW50ZWdlclxyXG5cdFx0XHRjb25zdCBsb3cgPSByZWFkVWludDMyKHJlYWRlcik7XHJcblx0XHRcdGNvbnN0IGhpZ2ggPSByZWFkVWludDMyKHJlYWRlcik7XHJcblx0XHRcdHJldHVybiB7IGxvdywgaGlnaCB9O1xyXG5cdFx0fVxyXG5cdFx0Y2FzZSAnYm9vbCc6IC8vIEJvb2xlYW5cclxuXHRcdFx0cmV0dXJuICEhcmVhZFVpbnQ4KHJlYWRlcik7XHJcblx0XHRjYXNlICd0eXBlJzogLy8gQ2xhc3NcclxuXHRcdGNhc2UgJ0dsYkMnOiAvLyBDbGFzc1xyXG5cdFx0XHRyZXR1cm4gcmVhZENsYXNzU3RydWN0dXJlKHJlYWRlcik7XHJcblx0XHRjYXNlICdhbGlzJzogeyAvLyBBbGlhc1xyXG5cdFx0XHRjb25zdCBsZW5ndGggPSByZWFkSW50MzIocmVhZGVyKTtcclxuXHRcdFx0cmV0dXJuIHJlYWRBc2NpaVN0cmluZyhyZWFkZXIsIGxlbmd0aCk7XHJcblx0XHR9XHJcblx0XHRjYXNlICd0ZHRhJzogeyAvLyBSYXcgRGF0YVxyXG5cdFx0XHRjb25zdCBsZW5ndGggPSByZWFkSW50MzIocmVhZGVyKTtcclxuXHRcdFx0cmV0dXJuIHJlYWRCeXRlcyhyZWFkZXIsIGxlbmd0aCk7XHJcblx0XHR9XHJcblx0XHRjYXNlICdPYkFyJzogeyAvLyBPYmplY3QgYXJyYXlcclxuXHRcdFx0cmVhZEludDMyKHJlYWRlcik7IC8vIHZlcnNpb246IDE2XHJcblx0XHRcdHJlYWRVbmljb2RlU3RyaW5nKHJlYWRlcik7IC8vIG5hbWU6ICcnXHJcblx0XHRcdHJlYWRBc2NpaVN0cmluZ09yQ2xhc3NJZChyZWFkZXIpOyAvLyAncmF0aW9uYWxQb2ludCdcclxuXHRcdFx0Y29uc3QgbGVuZ3RoID0gcmVhZEludDMyKHJlYWRlcik7XHJcblx0XHRcdGNvbnN0IGl0ZW1zOiBhbnlbXSA9IFtdO1xyXG5cclxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGNvbnN0IHR5cGUxID0gcmVhZEFzY2lpU3RyaW5nT3JDbGFzc0lkKHJlYWRlcik7IC8vIHR5cGUgSHJ6biB8IFZydGNcclxuXHRcdFx0XHRyZWFkU2lnbmF0dXJlKHJlYWRlcik7IC8vIFVuRmxcclxuXHJcblx0XHRcdFx0cmVhZFNpZ25hdHVyZShyZWFkZXIpOyAvLyB1bml0cyA/ICcjUHhsJ1xyXG5cdFx0XHRcdGNvbnN0IHZhbHVlc0NvdW50ID0gcmVhZEludDMyKHJlYWRlcik7XHJcblx0XHRcdFx0Y29uc3QgdmFsdWVzOiBudW1iZXJbXSA9IFtdO1xyXG5cdFx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVzQ291bnQ7IGorKykge1xyXG5cdFx0XHRcdFx0dmFsdWVzLnB1c2gocmVhZEZsb2F0NjQocmVhZGVyKSk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpdGVtcy5wdXNoKHsgdHlwZTogdHlwZTEsIHZhbHVlcyB9KTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIGl0ZW1zO1xyXG5cdFx0fVxyXG5cdFx0Y2FzZSAnUHRoICc6IHsgLy8gRmlsZSBwYXRoXHJcblx0XHRcdC8qY29uc3QgbGVuZ3RoID0qLyByZWFkSW50MzIocmVhZGVyKTtcclxuXHRcdFx0Y29uc3Qgc2lnID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpO1xyXG5cdFx0XHQvKmNvbnN0IHBhdGhTaXplID0qLyByZWFkSW50MzJMRShyZWFkZXIpO1xyXG5cdFx0XHRjb25zdCBjaGFyc0NvdW50ID0gcmVhZEludDMyTEUocmVhZGVyKTtcclxuXHRcdFx0Y29uc3QgcGF0aCA9IHJlYWRVbmljb2RlU3RyaW5nV2l0aExlbmd0aChyZWFkZXIsIGNoYXJzQ291bnQpO1xyXG5cdFx0XHRyZXR1cm4geyBzaWcsIHBhdGggfTtcclxuXHRcdH1cclxuXHRcdGRlZmF1bHQ6XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBUeVNoIGRlc2NyaXB0b3IgT1NUeXBlOiAke3R5cGV9IGF0ICR7cmVhZGVyLm9mZnNldC50b1N0cmluZygxNil9YCk7XHJcblx0fVxyXG59XHJcblxyXG5jb25zdCBPYkFyVHlwZXM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIHwgdW5kZWZpbmVkOyB9ID0ge1xyXG5cdG1lc2hQb2ludHM6ICdyYXRpb25hbFBvaW50JyxcclxuXHRxdWlsdFNsaWNlWDogJ1VudEYnLFxyXG5cdHF1aWx0U2xpY2VZOiAnVW50RicsXHJcbn07XHJcblxyXG5mdW5jdGlvbiB3cml0ZU9TVHlwZSh3cml0ZXI6IFBzZFdyaXRlciwgdHlwZTogc3RyaW5nLCB2YWx1ZTogYW55LCBrZXk6IHN0cmluZywgZXh0VHlwZTogTmFtZUNsYXNzSUQgfCB1bmRlZmluZWQsIHJvb3Q6IHN0cmluZykge1xyXG5cdHN3aXRjaCAodHlwZSkge1xyXG5cdFx0Y2FzZSAnb2JqICc6IC8vIFJlZmVyZW5jZVxyXG5cdFx0XHR3cml0ZVJlZmVyZW5jZVN0cnVjdHVyZSh3cml0ZXIsIGtleSwgdmFsdWUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgJ09iamMnOiAvLyBEZXNjcmlwdG9yXHJcblx0XHRjYXNlICdHbGJPJzogLy8gR2xvYmFsT2JqZWN0IHNhbWUgYXMgRGVzY3JpcHRvclxyXG5cdFx0XHRpZiAoIWV4dFR5cGUpIHRocm93IG5ldyBFcnJvcihgTWlzc2luZyBleHQgdHlwZSBmb3I6ICcke2tleX0nICgke0pTT04uc3RyaW5naWZ5KHZhbHVlKX0pYCk7XHJcblx0XHRcdHdyaXRlRGVzY3JpcHRvclN0cnVjdHVyZSh3cml0ZXIsIGV4dFR5cGUubmFtZSwgZXh0VHlwZS5jbGFzc0lELCB2YWx1ZSwgcm9vdCk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSAnVmxMcyc6IC8vIExpc3RcclxuXHRcdFx0d3JpdGVJbnQzMih3cml0ZXIsIHZhbHVlLmxlbmd0aCk7XHJcblxyXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0Y29uc3QgdHlwZSA9IGZpZWxkVG9BcnJheVR5cGVba2V5XTtcclxuXHRcdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIHR5cGUgfHwgJ2xvbmcnKTtcclxuXHRcdFx0XHR3cml0ZU9TVHlwZSh3cml0ZXIsIHR5cGUgfHwgJ2xvbmcnLCB2YWx1ZVtpXSwgJycsIGZpZWxkVG9BcnJheUV4dFR5cGVba2V5XSwgcm9vdCk7XHJcblx0XHRcdFx0aWYgKGxvZ0Vycm9ycyAmJiAhdHlwZSkgY29uc29sZS5sb2coYE1pc3NpbmcgZGVzY3JpcHRvciBhcnJheSB0eXBlIGZvcjogJyR7a2V5fScgaW5gLCB2YWx1ZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICdkb3ViJzogLy8gRG91YmxlXHJcblx0XHRcdHdyaXRlRmxvYXQ2NCh3cml0ZXIsIHZhbHVlKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICdVbnRGJzogLy8gVW5pdCBkb3VibGVcclxuXHRcdFx0aWYgKCF1bml0c01hcFJldlt2YWx1ZS51bml0c10pIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB1bml0czogJHt2YWx1ZS51bml0c30gaW4gJHtrZXl9YCk7XHJcblx0XHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgdW5pdHNNYXBSZXZbdmFsdWUudW5pdHNdKTtcclxuXHRcdFx0d3JpdGVGbG9hdDY0KHdyaXRlciwgdmFsdWUudmFsdWUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgJ1VuRmwnOiAvLyBVbml0IGZsb2F0XHJcblx0XHRcdGlmICghdW5pdHNNYXBSZXZbdmFsdWUudW5pdHNdKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdW5pdHM6ICR7dmFsdWUudW5pdHN9IGluICR7a2V5fWApO1xyXG5cdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIHVuaXRzTWFwUmV2W3ZhbHVlLnVuaXRzXSk7XHJcblx0XHRcdHdyaXRlRmxvYXQzMih3cml0ZXIsIHZhbHVlLnZhbHVlKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICdURVhUJzogLy8gU3RyaW5nXHJcblx0XHRcdHdyaXRlVW5pY29kZVN0cmluZ1dpdGhQYWRkaW5nKHdyaXRlciwgdmFsdWUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgJ2VudW0nOiB7IC8vIEVudW1lcmF0ZWRcclxuXHRcdFx0Y29uc3QgW190eXBlLCB2YWxdID0gdmFsdWUuc3BsaXQoJy4nKTtcclxuXHRcdFx0d3JpdGVBc2NpaVN0cmluZ09yQ2xhc3NJZCh3cml0ZXIsIF90eXBlKTtcclxuXHRcdFx0d3JpdGVBc2NpaVN0cmluZ09yQ2xhc3NJZCh3cml0ZXIsIHZhbCk7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cdFx0Y2FzZSAnbG9uZyc6IC8vIEludGVnZXJcclxuXHRcdFx0d3JpdGVJbnQzMih3cml0ZXIsIHZhbHVlKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHQvLyBjYXNlICdjb21wJzogLy8gTGFyZ2UgSW50ZWdlclxyXG5cdFx0Ly8gXHR3cml0ZUxhcmdlSW50ZWdlcihyZWFkZXIpO1xyXG5cdFx0Y2FzZSAnYm9vbCc6IC8vIEJvb2xlYW5cclxuXHRcdFx0d3JpdGVVaW50OCh3cml0ZXIsIHZhbHVlID8gMSA6IDApO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdC8vIGNhc2UgJ3R5cGUnOiAvLyBDbGFzc1xyXG5cdFx0Ly8gY2FzZSAnR2xiQyc6IC8vIENsYXNzXHJcblx0XHQvLyBcdHdyaXRlQ2xhc3NTdHJ1Y3R1cmUocmVhZGVyKTtcclxuXHRcdC8vIGNhc2UgJ2FsaXMnOiAvLyBBbGlhc1xyXG5cdFx0Ly8gXHR3cml0ZUFsaWFzU3RydWN0dXJlKHJlYWRlcik7XHJcblx0XHRjYXNlICd0ZHRhJzogLy8gUmF3IERhdGFcclxuXHRcdFx0d3JpdGVJbnQzMih3cml0ZXIsIHZhbHVlLmJ5dGVMZW5ndGgpO1xyXG5cdFx0XHR3cml0ZUJ5dGVzKHdyaXRlciwgdmFsdWUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgJ09iQXInOiB7IC8vIE9iamVjdCBhcnJheVxyXG5cdFx0XHR3cml0ZUludDMyKHdyaXRlciwgMTYpOyAvLyB2ZXJzaW9uXHJcblx0XHRcdHdyaXRlVW5pY29kZVN0cmluZ1dpdGhQYWRkaW5nKHdyaXRlciwgJycpOyAvLyBuYW1lXHJcblx0XHRcdGNvbnN0IHR5cGUgPSBPYkFyVHlwZXNba2V5XTtcclxuXHRcdFx0aWYgKCF0eXBlKSB0aHJvdyBuZXcgRXJyb3IoYE5vdCBpbXBsZW1lbnRlZCBPYkFyVHlwZSBmb3I6ICR7a2V5fWApO1xyXG5cdFx0XHR3cml0ZUFzY2lpU3RyaW5nT3JDbGFzc0lkKHdyaXRlciwgdHlwZSk7XHJcblx0XHRcdHdyaXRlSW50MzIod3JpdGVyLCB2YWx1ZS5sZW5ndGgpO1xyXG5cclxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdHdyaXRlQXNjaWlTdHJpbmdPckNsYXNzSWQod3JpdGVyLCB2YWx1ZVtpXS50eXBlKTsgLy8gSHJ6biB8IFZydGNcclxuXHRcdFx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICdVbkZsJyk7XHJcblx0XHRcdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnI1B4bCcpO1xyXG5cdFx0XHRcdHdyaXRlSW50MzIod3JpdGVyLCB2YWx1ZVtpXS52YWx1ZXMubGVuZ3RoKTtcclxuXHJcblx0XHRcdFx0Zm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZVtpXS52YWx1ZXMubGVuZ3RoOyBqKyspIHtcclxuXHRcdFx0XHRcdHdyaXRlRmxvYXQ2NCh3cml0ZXIsIHZhbHVlW2ldLnZhbHVlc1tqXSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cdFx0Ly8gY2FzZSAnUHRoICc6IC8vIEZpbGUgcGF0aFxyXG5cdFx0Ly8gXHR3cml0ZUZpbGVQYXRoKHJlYWRlcik7XHJcblx0XHRkZWZhdWx0OlxyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE5vdCBpbXBsZW1lbnRlZCBkZXNjcmlwdG9yIE9TVHlwZTogJHt0eXBlfWApO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVhZFJlZmVyZW5jZVN0cnVjdHVyZShyZWFkZXI6IFBzZFJlYWRlcikge1xyXG5cdGNvbnN0IGl0ZW1zQ291bnQgPSByZWFkSW50MzIocmVhZGVyKTtcclxuXHRjb25zdCBpdGVtczogYW55W10gPSBbXTtcclxuXHJcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtc0NvdW50OyBpKyspIHtcclxuXHRcdGNvbnN0IHR5cGUgPSByZWFkU2lnbmF0dXJlKHJlYWRlcik7XHJcblxyXG5cdFx0c3dpdGNoICh0eXBlKSB7XHJcblx0XHRcdGNhc2UgJ3Byb3AnOiB7IC8vIFByb3BlcnR5XHJcblx0XHRcdFx0cmVhZENsYXNzU3RydWN0dXJlKHJlYWRlcik7XHJcblx0XHRcdFx0Y29uc3Qga2V5SUQgPSByZWFkQXNjaWlTdHJpbmdPckNsYXNzSWQocmVhZGVyKTtcclxuXHRcdFx0XHRpdGVtcy5wdXNoKGtleUlEKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXNlICdDbHNzJzogLy8gQ2xhc3NcclxuXHRcdFx0XHRpdGVtcy5wdXNoKHJlYWRDbGFzc1N0cnVjdHVyZShyZWFkZXIpKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnRW5tcic6IHsgLy8gRW51bWVyYXRlZCBSZWZlcmVuY2VcclxuXHRcdFx0XHRyZWFkQ2xhc3NTdHJ1Y3R1cmUocmVhZGVyKTtcclxuXHRcdFx0XHRjb25zdCB0eXBlSUQgPSByZWFkQXNjaWlTdHJpbmdPckNsYXNzSWQocmVhZGVyKTtcclxuXHRcdFx0XHRjb25zdCB2YWx1ZSA9IHJlYWRBc2NpaVN0cmluZ09yQ2xhc3NJZChyZWFkZXIpO1xyXG5cdFx0XHRcdGl0ZW1zLnB1c2goYCR7dHlwZUlEfS4ke3ZhbHVlfWApO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNhc2UgJ3JlbGUnOiB7IC8vIE9mZnNldFxyXG5cdFx0XHRcdC8vIGNvbnN0IHsgbmFtZSwgY2xhc3NJRCB9ID1cclxuXHRcdFx0XHRyZWFkQ2xhc3NTdHJ1Y3R1cmUocmVhZGVyKTtcclxuXHRcdFx0XHRpdGVtcy5wdXNoKHJlYWRVaW50MzIocmVhZGVyKSk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2FzZSAnSWRudCc6IC8vIElkZW50aWZpZXJcclxuXHRcdFx0XHRpdGVtcy5wdXNoKHJlYWRJbnQzMihyZWFkZXIpKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnaW5keCc6IC8vIEluZGV4XHJcblx0XHRcdFx0aXRlbXMucHVzaChyZWFkSW50MzIocmVhZGVyKSk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ25hbWUnOiB7IC8vIE5hbWVcclxuXHRcdFx0XHRyZWFkQ2xhc3NTdHJ1Y3R1cmUocmVhZGVyKTtcclxuXHRcdFx0XHRpdGVtcy5wdXNoKHJlYWRVbmljb2RlU3RyaW5nKHJlYWRlcikpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHRcdGRlZmF1bHQ6XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGRlc2NyaXB0b3IgcmVmZXJlbmNlIHR5cGU6ICR7dHlwZX1gKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiBpdGVtcztcclxufVxyXG5cclxuZnVuY3Rpb24gd3JpdGVSZWZlcmVuY2VTdHJ1Y3R1cmUod3JpdGVyOiBQc2RXcml0ZXIsIF9rZXk6IHN0cmluZywgaXRlbXM6IGFueVtdKSB7XHJcblx0d3JpdGVJbnQzMih3cml0ZXIsIGl0ZW1zLmxlbmd0aCk7XHJcblxyXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcclxuXHRcdGNvbnN0IHZhbHVlID0gaXRlbXNbaV07XHJcblx0XHRsZXQgdHlwZSA9ICd1bmtub3duJztcclxuXHJcblx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xyXG5cdFx0XHRpZiAoL15bYS16XStcXC5bYS16XSskL2kudGVzdCh2YWx1ZSkpIHtcclxuXHRcdFx0XHR0eXBlID0gJ0VubXInO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHR5cGUgPSAnbmFtZSc7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsIHR5cGUpO1xyXG5cclxuXHRcdHN3aXRjaCAodHlwZSkge1xyXG5cdFx0XHQvLyBjYXNlICdwcm9wJzogLy8gUHJvcGVydHlcclxuXHRcdFx0Ly8gY2FzZSAnQ2xzcyc6IC8vIENsYXNzXHJcblx0XHRcdGNhc2UgJ0VubXInOiB7IC8vIEVudW1lcmF0ZWQgUmVmZXJlbmNlXHJcblx0XHRcdFx0Y29uc3QgW3R5cGVJRCwgZW51bVZhbHVlXSA9IHZhbHVlLnNwbGl0KCcuJyk7XHJcblx0XHRcdFx0d3JpdGVDbGFzc1N0cnVjdHVyZSh3cml0ZXIsICdcXDAnLCB0eXBlSUQpO1xyXG5cdFx0XHRcdHdyaXRlQXNjaWlTdHJpbmdPckNsYXNzSWQod3JpdGVyLCB0eXBlSUQpO1xyXG5cdFx0XHRcdHdyaXRlQXNjaWlTdHJpbmdPckNsYXNzSWQod3JpdGVyLCBlbnVtVmFsdWUpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIGNhc2UgJ3JlbGUnOiAvLyBPZmZzZXRcclxuXHRcdFx0Ly8gY2FzZSAnSWRudCc6IC8vIElkZW50aWZpZXJcclxuXHRcdFx0Ly8gY2FzZSAnaW5keCc6IC8vIEluZGV4XHJcblx0XHRcdGNhc2UgJ25hbWUnOiB7IC8vIE5hbWVcclxuXHRcdFx0XHR3cml0ZUNsYXNzU3RydWN0dXJlKHdyaXRlciwgJ1xcMCcsICdMeXIgJyk7XHJcblx0XHRcdFx0d3JpdGVVbmljb2RlU3RyaW5nKHdyaXRlciwgdmFsdWUgKyAnXFwwJyk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZGVzY3JpcHRvciByZWZlcmVuY2UgdHlwZTogJHt0eXBlfWApO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGl0ZW1zO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkQ2xhc3NTdHJ1Y3R1cmUocmVhZGVyOiBQc2RSZWFkZXIpIHtcclxuXHRjb25zdCBuYW1lID0gcmVhZFVuaWNvZGVTdHJpbmcocmVhZGVyKTtcclxuXHRjb25zdCBjbGFzc0lEID0gcmVhZEFzY2lpU3RyaW5nT3JDbGFzc0lkKHJlYWRlcik7XHJcblx0Ly8gY29uc29sZS5sb2coeyBuYW1lLCBjbGFzc0lEIH0pO1xyXG5cdHJldHVybiB7IG5hbWUsIGNsYXNzSUQgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gd3JpdGVDbGFzc1N0cnVjdHVyZSh3cml0ZXI6IFBzZFdyaXRlciwgbmFtZTogc3RyaW5nLCBjbGFzc0lEOiBzdHJpbmcpIHtcclxuXHR3cml0ZVVuaWNvZGVTdHJpbmcod3JpdGVyLCBuYW1lKTtcclxuXHR3cml0ZUFzY2lpU3RyaW5nT3JDbGFzc0lkKHdyaXRlciwgY2xhc3NJRCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyOiBQc2RSZWFkZXIpIHtcclxuXHRjb25zdCB2ZXJzaW9uID0gcmVhZFVpbnQzMihyZWFkZXIpO1xyXG5cdGlmICh2ZXJzaW9uICE9PSAxNikgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGRlc2NyaXB0b3IgdmVyc2lvbjogJHt2ZXJzaW9ufWApO1xyXG5cdGNvbnN0IGRlc2MgPSByZWFkRGVzY3JpcHRvclN0cnVjdHVyZShyZWFkZXIpO1xyXG5cdC8vIGNvbnNvbGUubG9nKHJlcXVpcmUoJ3V0aWwnKS5pbnNwZWN0KGRlc2MsIGZhbHNlLCA5OSwgdHJ1ZSkpO1xyXG5cdHJldHVybiBkZXNjO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVWZXJzaW9uQW5kRGVzY3JpcHRvcih3cml0ZXI6IFBzZFdyaXRlciwgbmFtZTogc3RyaW5nLCBjbGFzc0lEOiBzdHJpbmcsIGRlc2NyaXB0b3I6IGFueSwgcm9vdCA9ICcnKSB7XHJcblx0d3JpdGVVaW50MzIod3JpdGVyLCAxNik7IC8vIHZlcnNpb25cclxuXHR3cml0ZURlc2NyaXB0b3JTdHJ1Y3R1cmUod3JpdGVyLCBuYW1lLCBjbGFzc0lELCBkZXNjcmlwdG9yLCByb290KTtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgRGVzY3JpcHRvclVuaXRzID0gJ0FuZ2xlJyB8ICdEZW5zaXR5JyB8ICdEaXN0YW5jZScgfCAnTm9uZScgfCAnUGVyY2VudCcgfCAnUGl4ZWxzJyB8XHJcblx0J01pbGxpbWV0ZXJzJyB8ICdQb2ludHMnIHwgJ1BpY2FzJyB8ICdJbmNoZXMnIHwgJ0NlbnRpbWV0ZXJzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGVzY3JpcHRvclVuaXRzVmFsdWUge1xyXG5cdHVuaXRzOiBEZXNjcmlwdG9yVW5pdHM7XHJcblx0dmFsdWU6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgRGVzY3JpcHRvckNvbG9yID0ge1xyXG5cdCdSZCAgJzogbnVtYmVyO1xyXG5cdCdHcm4gJzogbnVtYmVyO1xyXG5cdCdCbCAgJzogbnVtYmVyO1xyXG59IHwge1xyXG5cdCdIICAgJzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0U3RydDogbnVtYmVyO1xyXG5cdEJyZ2g6IG51bWJlcjtcclxufSB8IHtcclxuXHQnQ3luICc6IG51bWJlcjtcclxuXHRNZ250OiBudW1iZXI7XHJcblx0J1lsdyAnOiBudW1iZXI7XHJcblx0QmxjazogbnVtYmVyO1xyXG59IHwge1xyXG5cdCdHcnkgJzogbnVtYmVyO1xyXG59IHwge1xyXG5cdExtbmM6IG51bWJlcjtcclxuXHQnQSAgICc6IG51bWJlcjtcclxuXHQnQiAgICc6IG51bWJlcjtcclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGVzY2lwdG9yUGF0dGVybiB7XHJcblx0J05tICAnOiBzdHJpbmc7XHJcblx0SWRudDogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBEZXNjaXB0b3JHcmFkaWVudCA9IHtcclxuXHQnTm0gICc6IHN0cmluZztcclxuXHRHcmRGOiAnR3JkRi5Dc3RTJztcclxuXHRJbnRyOiBudW1iZXI7XHJcblx0Q2xyczoge1xyXG5cdFx0J0NsciAnOiBEZXNjcmlwdG9yQ29sb3I7XHJcblx0XHRUeXBlOiAnQ2xyeS5Vc3JTJztcclxuXHRcdExjdG46IG51bWJlcjtcclxuXHRcdE1kcG46IG51bWJlcjtcclxuXHR9W107XHJcblx0VHJuczoge1xyXG5cdFx0T3BjdDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRMY3RuOiBudW1iZXI7XHJcblx0XHRNZHBuOiBudW1iZXI7XHJcblx0fVtdO1xyXG59IHwge1xyXG5cdEdyZEY6ICdHcmRGLkNsTnMnO1xyXG5cdFNtdGg6IG51bWJlcjtcclxuXHQnTm0gICc6IHN0cmluZztcclxuXHRDbHJTOiBzdHJpbmc7XHJcblx0Um5kUzogbnVtYmVyO1xyXG5cdFZjdEM/OiBib29sZWFuO1xyXG5cdFNoVHI/OiBib29sZWFuO1xyXG5cdCdNbm0gJzogbnVtYmVyW107XHJcblx0J014bSAnOiBudW1iZXJbXTtcclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGVzY3JpcHRvckNvbG9yQ29udGVudCB7XHJcblx0J0NsciAnOiBEZXNjcmlwdG9yQ29sb3I7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGVzY3JpcHRvckdyYWRpZW50Q29udGVudCB7XHJcblx0R3JhZDogRGVzY2lwdG9yR3JhZGllbnQ7XHJcblx0VHlwZTogc3RyaW5nO1xyXG5cdER0aHI/OiBib29sZWFuO1xyXG5cdFJ2cnM/OiBib29sZWFuO1xyXG5cdEFuZ2w/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHQnU2NsICc/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRBbGduPzogYm9vbGVhbjtcclxuXHRPZnN0PzogeyBIcnpuOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTsgVnJ0YzogRGVzY3JpcHRvclVuaXRzVmFsdWU7IH07XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGVzY3JpcHRvclBhdHRlcm5Db250ZW50IHtcclxuXHRQdHJuOiBEZXNjaXB0b3JQYXR0ZXJuO1xyXG5cdExua2Q/OiBib29sZWFuO1xyXG5cdHBoYXNlPzogeyBIcnpuOiBudW1iZXI7IFZydGM6IG51bWJlcjsgfTtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgRGVzY3JpcHRvclZlY3RvckNvbnRlbnQgPSBEZXNjcmlwdG9yQ29sb3JDb250ZW50IHwgRGVzY3JpcHRvckdyYWRpZW50Q29udGVudCB8IERlc2NyaXB0b3JQYXR0ZXJuQ29udGVudDtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU3Ryb2tlRGVzY3JpcHRvciB7XHJcblx0c3Ryb2tlU3R5bGVWZXJzaW9uOiBudW1iZXI7XHJcblx0c3Ryb2tlRW5hYmxlZDogYm9vbGVhbjtcclxuXHRmaWxsRW5hYmxlZDogYm9vbGVhbjtcclxuXHRzdHJva2VTdHlsZUxpbmVXaWR0aDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0c3Ryb2tlU3R5bGVMaW5lRGFzaE9mZnNldDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0c3Ryb2tlU3R5bGVNaXRlckxpbWl0OiBudW1iZXI7XHJcblx0c3Ryb2tlU3R5bGVMaW5lQ2FwVHlwZTogc3RyaW5nO1xyXG5cdHN0cm9rZVN0eWxlTGluZUpvaW5UeXBlOiBzdHJpbmc7XHJcblx0c3Ryb2tlU3R5bGVMaW5lQWxpZ25tZW50OiBzdHJpbmc7XHJcblx0c3Ryb2tlU3R5bGVTY2FsZUxvY2s6IGJvb2xlYW47XHJcblx0c3Ryb2tlU3R5bGVTdHJva2VBZGp1c3Q6IGJvb2xlYW47XHJcblx0c3Ryb2tlU3R5bGVMaW5lRGFzaFNldDogRGVzY3JpcHRvclVuaXRzVmFsdWVbXTtcclxuXHRzdHJva2VTdHlsZUJsZW5kTW9kZTogc3RyaW5nO1xyXG5cdHN0cm9rZVN0eWxlT3BhY2l0eTogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0c3Ryb2tlU3R5bGVDb250ZW50OiBEZXNjcmlwdG9yVmVjdG9yQ29udGVudDtcclxuXHRzdHJva2VTdHlsZVJlc29sdXRpb246IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBUZXh0RGVzY3JpcHRvciB7XHJcblx0J1R4dCAnOiBzdHJpbmc7XHJcblx0dGV4dEdyaWRkaW5nOiBzdHJpbmc7XHJcblx0T3JudDogc3RyaW5nO1xyXG5cdEFudEE6IHN0cmluZztcclxuXHRUZXh0SW5kZXg6IG51bWJlcjtcclxuXHRFbmdpbmVEYXRhPzogVWludDhBcnJheTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBXYXJwRGVzY3JpcHRvciB7XHJcblx0d2FycFN0eWxlOiBzdHJpbmc7XHJcblx0d2FycFZhbHVlOiBudW1iZXI7XHJcblx0d2FycFBlcnNwZWN0aXZlOiBudW1iZXI7XHJcblx0d2FycFBlcnNwZWN0aXZlT3RoZXI6IG51bWJlcjtcclxuXHR3YXJwUm90YXRlOiBzdHJpbmc7XHJcblx0Ym91bmRzPzoge1xyXG5cdFx0J1RvcCAnOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdExlZnQ6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0QnRvbTogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRSZ2h0OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHR9O1xyXG5cdHVPcmRlcjogbnVtYmVyO1xyXG5cdHZPcmRlcjogbnVtYmVyO1xyXG5cdGN1c3RvbUVudmVsb3BlV2FycD86IHtcclxuXHRcdG1lc2hQb2ludHM6IHtcclxuXHRcdFx0dHlwZTogJ0hyem4nIHwgJ1ZydGMnO1xyXG5cdFx0XHR2YWx1ZXM6IG51bWJlcltdO1xyXG5cdFx0fVtdO1xyXG5cdH07XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUXVpbHRXYXJwRGVzY3JpcHRvciBleHRlbmRzIFdhcnBEZXNjcmlwdG9yIHtcclxuXHRkZWZvcm1OdW1Sb3dzOiBudW1iZXI7XHJcblx0ZGVmb3JtTnVtQ29sczogbnVtYmVyO1xyXG5cdGN1c3RvbUVudmVsb3BlV2FycDoge1xyXG5cdFx0cXVpbHRTbGljZVg6IHtcclxuXHRcdFx0dHlwZTogJ3F1aWx0U2xpY2VYJztcclxuXHRcdFx0dmFsdWVzOiBudW1iZXJbXTtcclxuXHRcdH1bXTtcclxuXHRcdHF1aWx0U2xpY2VZOiB7XHJcblx0XHRcdHR5cGU6ICdxdWlsdFNsaWNlWSc7XHJcblx0XHRcdHZhbHVlczogbnVtYmVyW107XHJcblx0XHR9W107XHJcblx0XHRtZXNoUG9pbnRzOiB7XHJcblx0XHRcdHR5cGU6ICdIcnpuJyB8ICdWcnRjJztcclxuXHRcdFx0dmFsdWVzOiBudW1iZXJbXTtcclxuXHRcdH1bXTtcclxuXHR9O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEZyYWN0aW9uRGVzY3JpcHRvciB7XHJcblx0bnVtZXJhdG9yOiBudW1iZXI7XHJcblx0ZGVub21pbmF0b3I6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBIcnpuVnJ0Y0Rlc2NyaXB0b3Ige1xyXG5cdEhyem46IG51bWJlcjtcclxuXHRWcnRjOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRnJhbWVEZXNjcmlwdG9yIHtcclxuXHRGckxzOiBudW1iZXJbXTtcclxuXHRlbmFiPzogYm9vbGVhbjtcclxuXHRJTXNrPzogeyBPZnN0OiBIcnpuVnJ0Y0Rlc2NyaXB0b3IgfTtcclxuXHRWTXNrPzogeyBPZnN0OiBIcnpuVnJ0Y0Rlc2NyaXB0b3IgfTtcclxuXHRPZnN0PzogSHJ6blZydGNEZXNjcmlwdG9yO1xyXG5cdEZYUmY/OiBIcnpuVnJ0Y0Rlc2NyaXB0b3I7XHJcblx0TGVmeD86IExmeDJEZXNjcmlwdG9yO1xyXG5cdGJsZW5kT3B0aW9ucz86IHsgT3BjdDogRGVzY3JpcHRvclVuaXRzVmFsdWU7IH07XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRnJhbWVMaXN0RGVzY3JpcHRvciB7XHJcblx0TGFJRDogbnVtYmVyOyAvLyBsYXllciBJRFxyXG5cdExhU3Q6IEZyYW1lRGVzY3JpcHRvcltdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaG9yelZydGNUb1hZKGh2OiBIcnpuVnJ0Y0Rlc2NyaXB0b3IpOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyB9IHtcclxuXHRyZXR1cm4geyB4OiBodi5IcnpuLCB5OiBodi5WcnRjIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB4eVRvSG9yelZydGMoeHk6IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IH0pOiBIcnpuVnJ0Y0Rlc2NyaXB0b3Ige1xyXG5cdHJldHVybiB7IEhyem46IHh5LngsIFZydGM6IHh5LnkgfTtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgVGltZWxpbmVBbmltS2V5RGVzY3JpcHRvciA9IHtcclxuXHRUeXBlOiAna2V5VHlwZS5PcGN0JztcclxuXHRPcGN0OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxufSB8IHtcclxuXHRUeXBlOiAna2V5VHlwZS5Ucm5mJztcclxuXHQnU2NsICc6IEhyem5WcnRjRGVzY3JpcHRvcjtcclxuXHRTa2V3OiBIcnpuVnJ0Y0Rlc2NyaXB0b3I7XHJcblx0cm90YXRpb246IG51bWJlcjtcclxuXHR0cmFuc2xhdGlvbjogSHJ6blZydGNEZXNjcmlwdG9yO1xyXG59IHwge1xyXG5cdFR5cGU6ICdrZXlUeXBlLlBzdG4nO1xyXG5cdEhyem46IG51bWJlcjtcclxuXHRWcnRjOiBudW1iZXI7XHJcbn0gfCB7XHJcblx0VHlwZTogJ2tleVR5cGUuc2hlZXRTdHlsZSc7XHJcblx0c2hlZXRTdHlsZToge1xyXG5cdFx0VnJzbjogbnVtYmVyO1xyXG5cdFx0TGVmeD86IExmeDJEZXNjcmlwdG9yO1xyXG5cdFx0YmxlbmRPcHRpb25zOiB7fTtcclxuXHR9O1xyXG59IHwge1xyXG5cdFR5cGU6ICdrZXlUeXBlLmdsb2JhbExpZ2h0aW5nJztcclxuXHRnYmxBOiBudW1iZXI7XHJcblx0Z2xvYmFsQWx0aXR1ZGU6IG51bWJlcjtcclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVGltZWxpbmVLZXlEZXNjcmlwdG9yIHtcclxuXHRWcnNuOiAxO1xyXG5cdGFuaW1JbnRlcnBTdHlsZTogJ2FuaW1JbnRlcnBTdHlsZS5MbnIgJyB8ICdhbmltSW50ZXJwU3R5bGUuaG9sZCc7XHJcblx0dGltZTogRnJhY3Rpb25EZXNjcmlwdG9yO1xyXG5cdGFuaW1LZXk6IFRpbWVsaW5lQW5pbUtleURlc2NyaXB0b3I7XHJcblx0c2VsZWN0ZWQ6IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVGltZWxpbmVUcmFja0Rlc2NyaXB0b3Ige1xyXG5cdHRyYWNrSUQ6ICdzdGRUcmFja0lELmdsb2JhbExpZ2h0aW5nVHJhY2snIHwgJ3N0ZFRyYWNrSUQub3BhY2l0eVRyYWNrJyB8ICdzdGRUcmFja0lELnN0eWxlVHJhY2snIHwgJ3N0ZFRyYWNrSUQuc2hlZXRUcmFuc2Zvcm1UcmFjaycgfCAnc3RkVHJhY2tJRC5zaGVldFBvc2l0aW9uVHJhY2snO1xyXG5cdFZyc246IDE7XHJcblx0ZW5hYjogYm9vbGVhbjtcclxuXHRFZmZjOiBib29sZWFuO1xyXG5cdGVmZmVjdFBhcmFtcz86IHtcclxuXHRcdGtleUxpc3Q6IFRpbWVsaW5lS2V5RGVzY3JpcHRvcltdO1xyXG5cdFx0ZmlsbENhbnZhczogYm9vbGVhbjtcclxuXHRcdHpvb21PcmlnaW46IG51bWJlcjtcclxuXHR9O1xyXG5cdGtleUxpc3Q6IFRpbWVsaW5lS2V5RGVzY3JpcHRvcltdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFRpbWVTY29wZURlc2NyaXB0b3Ige1xyXG5cdFZyc246IDE7XHJcblx0U3RydDogRnJhY3Rpb25EZXNjcmlwdG9yO1xyXG5cdGR1cmF0aW9uOiBGcmFjdGlvbkRlc2NyaXB0b3I7XHJcblx0aW5UaW1lOiBGcmFjdGlvbkRlc2NyaXB0b3I7XHJcblx0b3V0VGltZTogRnJhY3Rpb25EZXNjcmlwdG9yO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFRpbWVsaW5lRGVzY3JpcHRvciB7XHJcblx0VnJzbjogMTtcclxuXHR0aW1lU2NvcGU6IFRpbWVTY29wZURlc2NyaXB0b3I7XHJcblx0YXV0b1Njb3BlOiBib29sZWFuO1xyXG5cdGF1ZGlvTGV2ZWw6IG51bWJlcjtcclxuXHRMeXJJOiBudW1iZXI7XHJcblx0dHJhY2tMaXN0PzogVGltZWxpbmVUcmFja0Rlc2NyaXB0b3JbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFZmZlY3REZXNjcmlwdG9yIGV4dGVuZHMgUGFydGlhbDxEZXNjcmlwdG9yR3JhZGllbnRDb250ZW50PiwgUGFydGlhbDxEZXNjcmlwdG9yUGF0dGVybkNvbnRlbnQ+IHtcclxuXHRlbmFiPzogYm9vbGVhbjtcclxuXHRTdHlsOiBzdHJpbmc7XHJcblx0UG50VD86IHN0cmluZztcclxuXHQnTWQgICc/OiBzdHJpbmc7XHJcblx0T3BjdD86IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdCdTeiAgJz86IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdCdDbHIgJz86IERlc2NyaXB0b3JDb2xvcjtcclxuXHRwcmVzZW50PzogYm9vbGVhbjtcclxuXHRzaG93SW5EaWFsb2c/OiBib29sZWFuO1xyXG5cdG92ZXJwcmludD86IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTGZ4MkRlc2NyaXB0b3Ige1xyXG5cdCdTY2wgJz86IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdG1hc3RlckZYU3dpdGNoPzogYm9vbGVhbjtcclxuXHREclNoPzogRWZmZWN0RGVzY3JpcHRvcjtcclxuXHRJclNoPzogRWZmZWN0RGVzY3JpcHRvcjtcclxuXHRPckdsPzogRWZmZWN0RGVzY3JpcHRvcjtcclxuXHRJckdsPzogRWZmZWN0RGVzY3JpcHRvcjtcclxuXHRlYmJsPzogRWZmZWN0RGVzY3JpcHRvcjtcclxuXHRTb0ZpPzogRWZmZWN0RGVzY3JpcHRvcjtcclxuXHRwYXR0ZXJuRmlsbD86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0R3JGbD86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0Q2hGWD86IEVmZmVjdERlc2NyaXB0b3I7XHJcblx0RnJGWD86IEVmZmVjdERlc2NyaXB0b3I7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTG1meERlc2NyaXB0b3Ige1xyXG5cdCdTY2wgJz86IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdG1hc3RlckZYU3dpdGNoPzogYm9vbGVhbjtcclxuXHRudW1Nb2RpZnlpbmdGWD86IG51bWJlcjtcclxuXHRPckdsPzogRWZmZWN0RGVzY3JpcHRvcjtcclxuXHRJckdsPzogRWZmZWN0RGVzY3JpcHRvcjtcclxuXHRlYmJsPzogRWZmZWN0RGVzY3JpcHRvcjtcclxuXHRDaEZYPzogRWZmZWN0RGVzY3JpcHRvcjtcclxuXHRkcm9wU2hhZG93TXVsdGk/OiBFZmZlY3REZXNjcmlwdG9yW107XHJcblx0aW5uZXJTaGFkb3dNdWx0aT86IEVmZmVjdERlc2NyaXB0b3JbXTtcclxuXHRzb2xpZEZpbGxNdWx0aT86IEVmZmVjdERlc2NyaXB0b3JbXTtcclxuXHRncmFkaWVudEZpbGxNdWx0aT86IEVmZmVjdERlc2NyaXB0b3JbXTtcclxuXHRmcmFtZUZYTXVsdGk/OiBFZmZlY3REZXNjcmlwdG9yW107XHJcblx0cGF0dGVybkZpbGw/OiBFZmZlY3REZXNjcmlwdG9yOyAvLyA/Pz9cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VGeE9iamVjdChmeDogRWZmZWN0RGVzY3JpcHRvcikge1xyXG5cdGNvbnN0IHN0cm9rZTogTGF5ZXJFZmZlY3RTdHJva2UgPSB7XHJcblx0XHRlbmFibGVkOiAhIWZ4LmVuYWIsXHJcblx0XHRwb3NpdGlvbjogRlN0bC5kZWNvZGUoZnguU3R5bCksXHJcblx0XHRmaWxsVHlwZTogRnJGbC5kZWNvZGUoZnguUG50VCEpLFxyXG5cdFx0YmxlbmRNb2RlOiBCbG5NLmRlY29kZShmeFsnTWQgICddISksXHJcblx0XHRvcGFjaXR5OiBwYXJzZVBlcmNlbnQoZnguT3BjdCksXHJcblx0XHRzaXplOiBwYXJzZVVuaXRzKGZ4WydTeiAgJ10hKSxcclxuXHR9O1xyXG5cclxuXHRpZiAoZngucHJlc2VudCAhPT0gdW5kZWZpbmVkKSBzdHJva2UucHJlc2VudCA9IGZ4LnByZXNlbnQ7XHJcblx0aWYgKGZ4LnNob3dJbkRpYWxvZyAhPT0gdW5kZWZpbmVkKSBzdHJva2Uuc2hvd0luRGlhbG9nID0gZnguc2hvd0luRGlhbG9nO1xyXG5cdGlmIChmeC5vdmVycHJpbnQgIT09IHVuZGVmaW5lZCkgc3Ryb2tlLm92ZXJwcmludCA9IGZ4Lm92ZXJwcmludDtcclxuXHRpZiAoZnhbJ0NsciAnXSkgc3Ryb2tlLmNvbG9yID0gcGFyc2VDb2xvcihmeFsnQ2xyICddKTtcclxuXHRpZiAoZnguR3JhZCkgc3Ryb2tlLmdyYWRpZW50ID0gcGFyc2VHcmFkaWVudENvbnRlbnQoZnggYXMgYW55KTtcclxuXHRpZiAoZnguUHRybikgc3Ryb2tlLnBhdHRlcm4gPSBwYXJzZVBhdHRlcm5Db250ZW50KGZ4IGFzIGFueSk7XHJcblxyXG5cdHJldHVybiBzdHJva2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNlcmlhbGl6ZUZ4T2JqZWN0KHN0cm9rZTogTGF5ZXJFZmZlY3RTdHJva2UpIHtcclxuXHRsZXQgRnJGWDogRWZmZWN0RGVzY3JpcHRvciA9IHt9IGFzIGFueTtcclxuXHRGckZYLmVuYWIgPSAhIXN0cm9rZS5lbmFibGVkO1xyXG5cdGlmIChzdHJva2UucHJlc2VudCAhPT0gdW5kZWZpbmVkKSBGckZYLnByZXNlbnQgPSAhIXN0cm9rZS5wcmVzZW50O1xyXG5cdGlmIChzdHJva2Uuc2hvd0luRGlhbG9nICE9PSB1bmRlZmluZWQpIEZyRlguc2hvd0luRGlhbG9nID0gISFzdHJva2Uuc2hvd0luRGlhbG9nO1xyXG5cdEZyRlguU3R5bCA9IEZTdGwuZW5jb2RlKHN0cm9rZS5wb3NpdGlvbik7XHJcblx0RnJGWC5QbnRUID0gRnJGbC5lbmNvZGUoc3Ryb2tlLmZpbGxUeXBlKTtcclxuXHRGckZYWydNZCAgJ10gPSBCbG5NLmVuY29kZShzdHJva2UuYmxlbmRNb2RlKTtcclxuXHRGckZYLk9wY3QgPSB1bml0c1BlcmNlbnQoc3Ryb2tlLm9wYWNpdHkpO1xyXG5cdEZyRlhbJ1N6ICAnXSA9IHVuaXRzVmFsdWUoc3Ryb2tlLnNpemUsICdzaXplJyk7XHJcblx0aWYgKHN0cm9rZS5jb2xvcikgRnJGWFsnQ2xyICddID0gc2VyaWFsaXplQ29sb3Ioc3Ryb2tlLmNvbG9yKTtcclxuXHRpZiAoc3Ryb2tlLmdyYWRpZW50KSBGckZYID0geyAuLi5GckZYLCAuLi5zZXJpYWxpemVHcmFkaWVudENvbnRlbnQoc3Ryb2tlLmdyYWRpZW50KSB9O1xyXG5cdGlmIChzdHJva2UucGF0dGVybikgRnJGWCA9IHsgLi4uRnJGWCwgLi4uc2VyaWFsaXplUGF0dGVybkNvbnRlbnQoc3Ryb2tlLnBhdHRlcm4pIH07XHJcblx0aWYgKHN0cm9rZS5vdmVycHJpbnQgIT09IHVuZGVmaW5lZCkgRnJGWC5vdmVycHJpbnQgPSAhIXN0cm9rZS5vdmVycHJpbnQ7XHJcblx0cmV0dXJuIEZyRlg7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVFZmZlY3RzKGU6IExheWVyRWZmZWN0c0luZm8sIGxvZzogYm9vbGVhbiwgbXVsdGk6IGJvb2xlYW4pIHtcclxuXHRjb25zdCBpbmZvOiBMZngyRGVzY3JpcHRvciAmIExtZnhEZXNjcmlwdG9yID0gbXVsdGkgPyB7XHJcblx0XHQnU2NsICc6IHVuaXRzUGVyY2VudChlLnNjYWxlID8/IDEpLFxyXG5cdFx0bWFzdGVyRlhTd2l0Y2g6ICFlLmRpc2FibGVkLFxyXG5cdH0gOiB7XHJcblx0XHRtYXN0ZXJGWFN3aXRjaDogIWUuZGlzYWJsZWQsXHJcblx0XHQnU2NsICc6IHVuaXRzUGVyY2VudChlLnNjYWxlID8/IDEpLFxyXG5cdH07XHJcblxyXG5cdGNvbnN0IGFycmF5S2V5czogKGtleW9mIExheWVyRWZmZWN0c0luZm8pW10gPSBbJ2Ryb3BTaGFkb3cnLCAnaW5uZXJTaGFkb3cnLCAnc29saWRGaWxsJywgJ2dyYWRpZW50T3ZlcmxheScsICdzdHJva2UnXTtcclxuXHRmb3IgKGNvbnN0IGtleSBvZiBhcnJheUtleXMpIHtcclxuXHRcdGlmIChlW2tleV0gJiYgIUFycmF5LmlzQXJyYXkoZVtrZXldKSkgdGhyb3cgbmV3IEVycm9yKGAke2tleX0gc2hvdWxkIGJlIGFuIGFycmF5YCk7XHJcblx0fVxyXG5cclxuXHRpZiAoZS5kcm9wU2hhZG93Py5bMF0gJiYgIW11bHRpKSBpbmZvLkRyU2ggPSBzZXJpYWxpemVFZmZlY3RPYmplY3QoZS5kcm9wU2hhZG93WzBdLCAnZHJvcFNoYWRvdycsIGxvZyk7XHJcblx0aWYgKGUuZHJvcFNoYWRvdz8uWzBdICYmIG11bHRpKSBpbmZvLmRyb3BTaGFkb3dNdWx0aSA9IGUuZHJvcFNoYWRvdy5tYXAoaSA9PiBzZXJpYWxpemVFZmZlY3RPYmplY3QoaSwgJ2Ryb3BTaGFkb3cnLCBsb2cpKTtcclxuXHRpZiAoZS5pbm5lclNoYWRvdz8uWzBdICYmICFtdWx0aSkgaW5mby5JclNoID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUuaW5uZXJTaGFkb3dbMF0sICdpbm5lclNoYWRvdycsIGxvZyk7XHJcblx0aWYgKGUuaW5uZXJTaGFkb3c/LlswXSAmJiBtdWx0aSkgaW5mby5pbm5lclNoYWRvd011bHRpID0gZS5pbm5lclNoYWRvdy5tYXAoaSA9PiBzZXJpYWxpemVFZmZlY3RPYmplY3QoaSwgJ2lubmVyU2hhZG93JywgbG9nKSk7XHJcblx0aWYgKGUub3V0ZXJHbG93KSBpbmZvLk9yR2wgPSBzZXJpYWxpemVFZmZlY3RPYmplY3QoZS5vdXRlckdsb3csICdvdXRlckdsb3cnLCBsb2cpO1xyXG5cdGlmIChlLnNvbGlkRmlsbD8uWzBdICYmIG11bHRpKSBpbmZvLnNvbGlkRmlsbE11bHRpID0gZS5zb2xpZEZpbGwubWFwKGkgPT4gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGksICdzb2xpZEZpbGwnLCBsb2cpKTtcclxuXHRpZiAoZS5ncmFkaWVudE92ZXJsYXk/LlswXSAmJiBtdWx0aSkgaW5mby5ncmFkaWVudEZpbGxNdWx0aSA9IGUuZ3JhZGllbnRPdmVybGF5Lm1hcChpID0+IHNlcmlhbGl6ZUVmZmVjdE9iamVjdChpLCAnZ3JhZGllbnRPdmVybGF5JywgbG9nKSk7XHJcblx0aWYgKGUuc3Ryb2tlPy5bMF0gJiYgbXVsdGkpIGluZm8uZnJhbWVGWE11bHRpID0gZS5zdHJva2UubWFwKGkgPT4gc2VyaWFsaXplRnhPYmplY3QoaSkpO1xyXG5cdGlmIChlLmlubmVyR2xvdykgaW5mby5JckdsID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUuaW5uZXJHbG93LCAnaW5uZXJHbG93JywgbG9nKTtcclxuXHRpZiAoZS5iZXZlbCkgaW5mby5lYmJsID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUuYmV2ZWwsICdiZXZlbCcsIGxvZyk7XHJcblx0aWYgKGUuc29saWRGaWxsPy5bMF0gJiYgIW11bHRpKSBpbmZvLlNvRmkgPSBzZXJpYWxpemVFZmZlY3RPYmplY3QoZS5zb2xpZEZpbGxbMF0sICdzb2xpZEZpbGwnLCBsb2cpO1xyXG5cdGlmIChlLnBhdHRlcm5PdmVybGF5KSBpbmZvLnBhdHRlcm5GaWxsID0gc2VyaWFsaXplRWZmZWN0T2JqZWN0KGUucGF0dGVybk92ZXJsYXksICdwYXR0ZXJuT3ZlcmxheScsIGxvZyk7XHJcblx0aWYgKGUuZ3JhZGllbnRPdmVybGF5Py5bMF0gJiYgIW11bHRpKSBpbmZvLkdyRmwgPSBzZXJpYWxpemVFZmZlY3RPYmplY3QoZS5ncmFkaWVudE92ZXJsYXlbMF0sICdncmFkaWVudE92ZXJsYXknLCBsb2cpO1xyXG5cdGlmIChlLnNhdGluKSBpbmZvLkNoRlggPSBzZXJpYWxpemVFZmZlY3RPYmplY3QoZS5zYXRpbiwgJ3NhdGluJywgbG9nKTtcclxuXHRpZiAoZS5zdHJva2U/LlswXSAmJiAhbXVsdGkpIGluZm8uRnJGWCA9IHNlcmlhbGl6ZUZ4T2JqZWN0KGUuc3Ryb2tlPy5bMF0pO1xyXG5cclxuXHRpZiAobXVsdGkpIHtcclxuXHRcdGluZm8ubnVtTW9kaWZ5aW5nRlggPSAwO1xyXG5cclxuXHRcdGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGUpKSB7XHJcblx0XHRcdGNvbnN0IHZhbHVlID0gKGUgYXMgYW55KVtrZXldO1xyXG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuXHRcdFx0XHRmb3IgKGNvbnN0IGVmZmVjdCBvZiB2YWx1ZSkge1xyXG5cdFx0XHRcdFx0aWYgKGVmZmVjdC5lbmFibGVkKSBpbmZvLm51bU1vZGlmeWluZ0ZYKys7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gaW5mbztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRWZmZWN0cyhpbmZvOiBMZngyRGVzY3JpcHRvciAmIExtZnhEZXNjcmlwdG9yLCBsb2c6IGJvb2xlYW4pIHtcclxuXHRjb25zdCBlZmZlY3RzOiBMYXllckVmZmVjdHNJbmZvID0ge307XHJcblx0aWYgKCFpbmZvLm1hc3RlckZYU3dpdGNoKSBlZmZlY3RzLmRpc2FibGVkID0gdHJ1ZTtcclxuXHRpZiAoaW5mb1snU2NsICddKSBlZmZlY3RzLnNjYWxlID0gcGFyc2VQZXJjZW50KGluZm9bJ1NjbCAnXSk7XHJcblx0aWYgKGluZm8uRHJTaCkgZWZmZWN0cy5kcm9wU2hhZG93ID0gW3BhcnNlRWZmZWN0T2JqZWN0KGluZm8uRHJTaCwgbG9nKV07XHJcblx0aWYgKGluZm8uZHJvcFNoYWRvd011bHRpKSBlZmZlY3RzLmRyb3BTaGFkb3cgPSBpbmZvLmRyb3BTaGFkb3dNdWx0aS5tYXAoaSA9PiBwYXJzZUVmZmVjdE9iamVjdChpLCBsb2cpKTtcclxuXHRpZiAoaW5mby5JclNoKSBlZmZlY3RzLmlubmVyU2hhZG93ID0gW3BhcnNlRWZmZWN0T2JqZWN0KGluZm8uSXJTaCwgbG9nKV07XHJcblx0aWYgKGluZm8uaW5uZXJTaGFkb3dNdWx0aSkgZWZmZWN0cy5pbm5lclNoYWRvdyA9IGluZm8uaW5uZXJTaGFkb3dNdWx0aS5tYXAoaSA9PiBwYXJzZUVmZmVjdE9iamVjdChpLCBsb2cpKTtcclxuXHRpZiAoaW5mby5PckdsKSBlZmZlY3RzLm91dGVyR2xvdyA9IHBhcnNlRWZmZWN0T2JqZWN0KGluZm8uT3JHbCwgbG9nKTtcclxuXHRpZiAoaW5mby5JckdsKSBlZmZlY3RzLmlubmVyR2xvdyA9IHBhcnNlRWZmZWN0T2JqZWN0KGluZm8uSXJHbCwgbG9nKTtcclxuXHRpZiAoaW5mby5lYmJsKSBlZmZlY3RzLmJldmVsID0gcGFyc2VFZmZlY3RPYmplY3QoaW5mby5lYmJsLCBsb2cpO1xyXG5cdGlmIChpbmZvLlNvRmkpIGVmZmVjdHMuc29saWRGaWxsID0gW3BhcnNlRWZmZWN0T2JqZWN0KGluZm8uU29GaSwgbG9nKV07XHJcblx0aWYgKGluZm8uc29saWRGaWxsTXVsdGkpIGVmZmVjdHMuc29saWRGaWxsID0gaW5mby5zb2xpZEZpbGxNdWx0aS5tYXAoaSA9PiBwYXJzZUVmZmVjdE9iamVjdChpLCBsb2cpKTtcclxuXHRpZiAoaW5mby5wYXR0ZXJuRmlsbCkgZWZmZWN0cy5wYXR0ZXJuT3ZlcmxheSA9IHBhcnNlRWZmZWN0T2JqZWN0KGluZm8ucGF0dGVybkZpbGwsIGxvZyk7XHJcblx0aWYgKGluZm8uR3JGbCkgZWZmZWN0cy5ncmFkaWVudE92ZXJsYXkgPSBbcGFyc2VFZmZlY3RPYmplY3QoaW5mby5HckZsLCBsb2cpXTtcclxuXHRpZiAoaW5mby5ncmFkaWVudEZpbGxNdWx0aSkgZWZmZWN0cy5ncmFkaWVudE92ZXJsYXkgPSBpbmZvLmdyYWRpZW50RmlsbE11bHRpLm1hcChpID0+IHBhcnNlRWZmZWN0T2JqZWN0KGksIGxvZykpO1xyXG5cdGlmIChpbmZvLkNoRlgpIGVmZmVjdHMuc2F0aW4gPSBwYXJzZUVmZmVjdE9iamVjdChpbmZvLkNoRlgsIGxvZyk7XHJcblx0aWYgKGluZm8uRnJGWCkgZWZmZWN0cy5zdHJva2UgPSBbcGFyc2VGeE9iamVjdChpbmZvLkZyRlgpXTtcclxuXHRpZiAoaW5mby5mcmFtZUZYTXVsdGkpIGVmZmVjdHMuc3Ryb2tlID0gaW5mby5mcmFtZUZYTXVsdGkubWFwKGkgPT4gcGFyc2VGeE9iamVjdChpKSk7XHJcblx0cmV0dXJuIGVmZmVjdHM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlS2V5TGlzdChrZXlMaXN0OiBUaW1lbGluZUtleURlc2NyaXB0b3JbXSwgbG9nTWlzc2luZ0ZlYXR1cmVzOiBib29sZWFuKSB7XHJcblx0Y29uc3Qga2V5czogVGltZWxpbmVLZXlbXSA9IFtdO1xyXG5cclxuXHRmb3IgKGxldCBqID0gMDsgaiA8IGtleUxpc3QubGVuZ3RoOyBqKyspIHtcclxuXHRcdGNvbnN0IGtleSA9IGtleUxpc3Rbal07XHJcblx0XHRjb25zdCB7IHRpbWUsIHNlbGVjdGVkLCBhbmltS2V5IH0gPSBrZXk7XHJcblx0XHRjb25zdCBpbnRlcnBvbGF0aW9uID0gYW5pbUludGVycFN0eWxlRW51bS5kZWNvZGUoa2V5LmFuaW1JbnRlcnBTdHlsZSk7XHJcblxyXG5cdFx0c3dpdGNoIChhbmltS2V5LlR5cGUpIHtcclxuXHRcdFx0Y2FzZSAna2V5VHlwZS5PcGN0JzpcclxuXHRcdFx0XHRrZXlzLnB1c2goeyBpbnRlcnBvbGF0aW9uLCB0aW1lLCBzZWxlY3RlZCwgdHlwZTogJ29wYWNpdHknLCB2YWx1ZTogcGFyc2VQZXJjZW50KGFuaW1LZXkuT3BjdCkgfSk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ2tleVR5cGUuUHN0bic6XHJcblx0XHRcdFx0a2V5cy5wdXNoKHsgaW50ZXJwb2xhdGlvbiwgdGltZSwgc2VsZWN0ZWQsIHR5cGU6ICdwb3NpdGlvbicsIHg6IGFuaW1LZXkuSHJ6biwgeTogYW5pbUtleS5WcnRjIH0pO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdrZXlUeXBlLlRybmYnOlxyXG5cdFx0XHRcdGtleXMucHVzaCh7XHJcblx0XHRcdFx0XHRpbnRlcnBvbGF0aW9uLCB0aW1lLCBzZWxlY3RlZCwgdHlwZTogJ3RyYW5zZm9ybScsXHJcblx0XHRcdFx0XHRzY2FsZTogaG9yelZydGNUb1hZKGFuaW1LZXlbJ1NjbCAnXSksIHNrZXc6IGhvcnpWcnRjVG9YWShhbmltS2V5LlNrZXcpLCByb3RhdGlvbjogYW5pbUtleS5yb3RhdGlvbiwgdHJhbnNsYXRpb246IGhvcnpWcnRjVG9YWShhbmltS2V5LnRyYW5zbGF0aW9uKVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdrZXlUeXBlLnNoZWV0U3R5bGUnOiB7XHJcblx0XHRcdFx0Y29uc3Qga2V5OiBUaW1lbGluZUtleSA9IHsgaW50ZXJwb2xhdGlvbiwgdGltZSwgc2VsZWN0ZWQsIHR5cGU6ICdzdHlsZScgfTtcclxuXHRcdFx0XHRpZiAoYW5pbUtleS5zaGVldFN0eWxlLkxlZngpIGtleS5zdHlsZSA9IHBhcnNlRWZmZWN0cyhhbmltS2V5LnNoZWV0U3R5bGUuTGVmeCwgbG9nTWlzc2luZ0ZlYXR1cmVzKTtcclxuXHRcdFx0XHRrZXlzLnB1c2goa2V5KTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXNlICdrZXlUeXBlLmdsb2JhbExpZ2h0aW5nJzoge1xyXG5cdFx0XHRcdGtleXMucHVzaCh7XHJcblx0XHRcdFx0XHRpbnRlcnBvbGF0aW9uLCB0aW1lLCBzZWxlY3RlZCwgdHlwZTogJ2dsb2JhbExpZ2h0aW5nJyxcclxuXHRcdFx0XHRcdGdsb2JhbEFuZ2xlOiBhbmltS2V5LmdibEEsIGdsb2JhbEFsdGl0dWRlOiBhbmltS2V5Lmdsb2JhbEFsdGl0dWRlXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0ZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBrZXlUeXBlIHZhbHVlYCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4ga2V5cztcclxufVxyXG5cclxuZnVuY3Rpb24gc2VyaWFsaXplS2V5TGlzdChrZXlzOiBUaW1lbGluZUtleVtdKTogVGltZWxpbmVLZXlEZXNjcmlwdG9yW10ge1xyXG5cdGNvbnN0IGtleUxpc3Q6IFRpbWVsaW5lS2V5RGVzY3JpcHRvcltdID0gW107XHJcblxyXG5cdGZvciAobGV0IGogPSAwOyBqIDwga2V5cy5sZW5ndGg7IGorKykge1xyXG5cdFx0Y29uc3Qga2V5ID0ga2V5c1tqXTtcclxuXHRcdGNvbnN0IHsgdGltZSwgc2VsZWN0ZWQgPSBmYWxzZSwgaW50ZXJwb2xhdGlvbiB9ID0ga2V5O1xyXG5cdFx0Y29uc3QgYW5pbUludGVycFN0eWxlID0gYW5pbUludGVycFN0eWxlRW51bS5lbmNvZGUoaW50ZXJwb2xhdGlvbikgYXMgJ2FuaW1JbnRlcnBTdHlsZS5MbnIgJyB8ICdhbmltSW50ZXJwU3R5bGUuaG9sZCc7XHJcblx0XHRsZXQgYW5pbUtleTogVGltZWxpbmVBbmltS2V5RGVzY3JpcHRvcjtcclxuXHJcblx0XHRzd2l0Y2ggKGtleS50eXBlKSB7XHJcblx0XHRcdGNhc2UgJ29wYWNpdHknOlxyXG5cdFx0XHRcdGFuaW1LZXkgPSB7IFR5cGU6ICdrZXlUeXBlLk9wY3QnLCBPcGN0OiB1bml0c1BlcmNlbnQoa2V5LnZhbHVlKSB9O1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdwb3NpdGlvbic6XHJcblx0XHRcdFx0YW5pbUtleSA9IHsgVHlwZTogJ2tleVR5cGUuUHN0bicsIEhyem46IGtleS54LCBWcnRjOiBrZXkueSB9O1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICd0cmFuc2Zvcm0nOlxyXG5cdFx0XHRcdGFuaW1LZXkgPSB7IFR5cGU6ICdrZXlUeXBlLlRybmYnLCAnU2NsICc6IHh5VG9Ib3J6VnJ0YyhrZXkuc2NhbGUpLCBTa2V3OiB4eVRvSG9yelZydGMoa2V5LnNrZXcpLCByb3RhdGlvbjoga2V5LnJvdGF0aW9uLCB0cmFuc2xhdGlvbjogeHlUb0hvcnpWcnRjKGtleS50cmFuc2xhdGlvbikgfTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnc3R5bGUnOlxyXG5cdFx0XHRcdGFuaW1LZXkgPSB7IFR5cGU6ICdrZXlUeXBlLnNoZWV0U3R5bGUnLCBzaGVldFN0eWxlOiB7IFZyc246IDEsIGJsZW5kT3B0aW9uczoge30gfSB9O1xyXG5cdFx0XHRcdGlmIChrZXkuc3R5bGUpIGFuaW1LZXkuc2hlZXRTdHlsZSA9IHsgVnJzbjogMSwgTGVmeDogc2VyaWFsaXplRWZmZWN0cyhrZXkuc3R5bGUsIGZhbHNlLCBmYWxzZSksIGJsZW5kT3B0aW9uczoge30gfTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnZ2xvYmFsTGlnaHRpbmcnOiB7XHJcblx0XHRcdFx0YW5pbUtleSA9IHsgVHlwZTogJ2tleVR5cGUuZ2xvYmFsTGlnaHRpbmcnLCBnYmxBOiBrZXkuZ2xvYmFsQW5nbGUsIGdsb2JhbEFsdGl0dWRlOiBrZXkuZ2xvYmFsQWx0aXR1ZGUgfTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0XHRkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIGtleVR5cGUgdmFsdWVgKTtcclxuXHRcdH1cclxuXHJcblx0XHRrZXlMaXN0LnB1c2goeyBWcnNuOiAxLCBhbmltSW50ZXJwU3R5bGUsIHRpbWUsIGFuaW1LZXksIHNlbGVjdGVkIH0pO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGtleUxpc3Q7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVRyYWNrTGlzdCh0cmFja0xpc3Q6IFRpbWVsaW5lVHJhY2tEZXNjcmlwdG9yW10sIGxvZ01pc3NpbmdGZWF0dXJlczogYm9vbGVhbikge1xyXG5cdGNvbnN0IHRyYWNrczogVGltZWxpbmVUcmFja1tdID0gW107XHJcblxyXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgdHJhY2tMaXN0Lmxlbmd0aDsgaSsrKSB7XHJcblx0XHRjb25zdCB0ciA9IHRyYWNrTGlzdFtpXTtcclxuXHRcdGNvbnN0IHRyYWNrOiBUaW1lbGluZVRyYWNrID0ge1xyXG5cdFx0XHR0eXBlOiBzdGRUcmFja0lELmRlY29kZSh0ci50cmFja0lEKSxcclxuXHRcdFx0ZW5hYmxlZDogdHIuZW5hYixcclxuXHRcdFx0a2V5czogcGFyc2VLZXlMaXN0KHRyLmtleUxpc3QsIGxvZ01pc3NpbmdGZWF0dXJlcyksXHJcblx0XHR9O1xyXG5cclxuXHRcdGlmICh0ci5lZmZlY3RQYXJhbXMpIHtcclxuXHRcdFx0dHJhY2suZWZmZWN0UGFyYW1zID0ge1xyXG5cdFx0XHRcdGZpbGxDYW52YXM6IHRyLmVmZmVjdFBhcmFtcy5maWxsQ2FudmFzLFxyXG5cdFx0XHRcdHpvb21PcmlnaW46IHRyLmVmZmVjdFBhcmFtcy56b29tT3JpZ2luLFxyXG5cdFx0XHRcdGtleXM6IHBhcnNlS2V5TGlzdCh0ci5lZmZlY3RQYXJhbXMua2V5TGlzdCwgbG9nTWlzc2luZ0ZlYXR1cmVzKSxcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHJcblx0XHR0cmFja3MucHVzaCh0cmFjayk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gdHJhY2tzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplVHJhY2tMaXN0KHRyYWNrczogVGltZWxpbmVUcmFja1tdKTogVGltZWxpbmVUcmFja0Rlc2NyaXB0b3JbXSB7XHJcblx0Y29uc3QgdHJhY2tMaXN0OiBUaW1lbGluZVRyYWNrRGVzY3JpcHRvcltdID0gW107XHJcblxyXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgdHJhY2tzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRjb25zdCB0ID0gdHJhY2tzW2ldO1xyXG5cdFx0dHJhY2tMaXN0LnB1c2goe1xyXG5cdFx0XHR0cmFja0lEOiBzdGRUcmFja0lELmVuY29kZSh0LnR5cGUpIGFzIGFueSxcclxuXHRcdFx0VnJzbjogMSxcclxuXHRcdFx0ZW5hYjogISF0LmVuYWJsZWQsXHJcblx0XHRcdEVmZmM6ICEhdC5lZmZlY3RQYXJhbXMsXHJcblx0XHRcdC4uLih0LmVmZmVjdFBhcmFtcyA/IHtcclxuXHRcdFx0XHRlZmZlY3RQYXJhbXM6IHtcclxuXHRcdFx0XHRcdGtleUxpc3Q6IHNlcmlhbGl6ZUtleUxpc3QodC5rZXlzKSxcclxuXHRcdFx0XHRcdGZpbGxDYW52YXM6IHQuZWZmZWN0UGFyYW1zLmZpbGxDYW52YXMsXHJcblx0XHRcdFx0XHR6b29tT3JpZ2luOiB0LmVmZmVjdFBhcmFtcy56b29tT3JpZ2luLFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSA6IHt9KSxcclxuXHRcdFx0a2V5TGlzdDogc2VyaWFsaXplS2V5TGlzdCh0LmtleXMpLFxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gdHJhY2tMaXN0O1xyXG59XHJcblxyXG50eXBlIEFsbEVmZmVjdHMgPSBMYXllckVmZmVjdFNoYWRvdyAmIExheWVyRWZmZWN0c091dGVyR2xvdyAmIExheWVyRWZmZWN0U3Ryb2tlICZcclxuXHRMYXllckVmZmVjdElubmVyR2xvdyAmIExheWVyRWZmZWN0QmV2ZWwgJiBMYXllckVmZmVjdFNvbGlkRmlsbCAmXHJcblx0TGF5ZXJFZmZlY3RQYXR0ZXJuT3ZlcmxheSAmIExheWVyRWZmZWN0U2F0aW4gJiBMYXllckVmZmVjdEdyYWRpZW50T3ZlcmxheTtcclxuXHJcbmZ1bmN0aW9uIHBhcnNlRWZmZWN0T2JqZWN0KG9iajogYW55LCByZXBvcnRFcnJvcnM6IGJvb2xlYW4pIHtcclxuXHRjb25zdCByZXN1bHQ6IEFsbEVmZmVjdHMgPSB7fSBhcyBhbnk7XHJcblxyXG5cdGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG9iaikpIHtcclxuXHRcdGNvbnN0IHZhbCA9IG9ialtrZXldO1xyXG5cclxuXHRcdHN3aXRjaCAoa2V5KSB7XHJcblx0XHRcdGNhc2UgJ2VuYWInOiByZXN1bHQuZW5hYmxlZCA9ICEhdmFsOyBicmVhaztcclxuXHRcdFx0Y2FzZSAndWdsZyc6IHJlc3VsdC51c2VHbG9iYWxMaWdodCA9ICEhdmFsOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnQW50QSc6IHJlc3VsdC5hbnRpYWxpYXNlZCA9ICEhdmFsOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnQWxnbic6IHJlc3VsdC5hbGlnbiA9ICEhdmFsOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnRHRocic6IHJlc3VsdC5kaXRoZXIgPSAhIXZhbDsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ0ludnInOiByZXN1bHQuaW52ZXJ0ID0gISF2YWw7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdSdnJzJzogcmVzdWx0LnJldmVyc2UgPSAhIXZhbDsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ0NsciAnOiByZXN1bHQuY29sb3IgPSBwYXJzZUNvbG9yKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdoZ2xDJzogcmVzdWx0LmhpZ2hsaWdodENvbG9yID0gcGFyc2VDb2xvcih2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnc2R3Qyc6IHJlc3VsdC5zaGFkb3dDb2xvciA9IHBhcnNlQ29sb3IodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ1N0eWwnOiByZXN1bHQucG9zaXRpb24gPSBGU3RsLmRlY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnTWQgICc6IHJlc3VsdC5ibGVuZE1vZGUgPSBCbG5NLmRlY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnaGdsTSc6IHJlc3VsdC5oaWdobGlnaHRCbGVuZE1vZGUgPSBCbG5NLmRlY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnc2R3TSc6IHJlc3VsdC5zaGFkb3dCbGVuZE1vZGUgPSBCbG5NLmRlY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnYnZsUyc6IHJlc3VsdC5zdHlsZSA9IEJFU2wuZGVjb2RlKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdidmxEJzogcmVzdWx0LmRpcmVjdGlvbiA9IEJFU3MuZGVjb2RlKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdidmxUJzogcmVzdWx0LnRlY2huaXF1ZSA9IGJ2bFQuZGVjb2RlKHZhbCkgYXMgYW55OyBicmVhaztcclxuXHRcdFx0Y2FzZSAnR2x3VCc6IHJlc3VsdC50ZWNobmlxdWUgPSBCRVRFLmRlY29kZSh2YWwpIGFzIGFueTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2dsd1MnOiByZXN1bHQuc291cmNlID0gSUdTci5kZWNvZGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ1R5cGUnOiByZXN1bHQudHlwZSA9IEdyZFQuZGVjb2RlKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdnczk5JzogcmVzdWx0LmludGVycG9sYXRpb25NZXRob2QgPSBncmFkaWVudEludGVycG9sYXRpb25NZXRob2RUeXBlLmRlY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnT3BjdCc6IHJlc3VsdC5vcGFjaXR5ID0gcGFyc2VQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdoZ2xPJzogcmVzdWx0LmhpZ2hsaWdodE9wYWNpdHkgPSBwYXJzZVBlcmNlbnQodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3Nkd08nOiByZXN1bHQuc2hhZG93T3BhY2l0eSA9IHBhcnNlUGVyY2VudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnbGFnbCc6IHJlc3VsdC5hbmdsZSA9IHBhcnNlQW5nbGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ0FuZ2wnOiByZXN1bHQuYW5nbGUgPSBwYXJzZUFuZ2xlKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdMYWxkJzogcmVzdWx0LmFsdGl0dWRlID0gcGFyc2VBbmdsZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnU2Z0bic6IHJlc3VsdC5zb2Z0ZW4gPSBwYXJzZVVuaXRzKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdzcmdSJzogcmVzdWx0LnN0cmVuZ3RoID0gcGFyc2VQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdibHVyJzogcmVzdWx0LnNpemUgPSBwYXJzZVVuaXRzKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdOb3NlJzogcmVzdWx0Lm5vaXNlID0gcGFyc2VQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdJbnByJzogcmVzdWx0LnJhbmdlID0gcGFyc2VQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdDa210JzogcmVzdWx0LmNob2tlID0gcGFyc2VVbml0cyh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnU2hkTic6IHJlc3VsdC5qaXR0ZXIgPSBwYXJzZVBlcmNlbnQodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ0RzdG4nOiByZXN1bHQuZGlzdGFuY2UgPSBwYXJzZVVuaXRzKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdTY2wgJzogcmVzdWx0LnNjYWxlID0gcGFyc2VQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdQdHJuJzogcmVzdWx0LnBhdHRlcm4gPSB7IG5hbWU6IHZhbFsnTm0gICddLCBpZDogdmFsLklkbnQgfTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3BoYXNlJzogcmVzdWx0LnBoYXNlID0geyB4OiB2YWwuSHJ6biwgeTogdmFsLlZydGMgfTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ09mc3QnOiByZXN1bHQub2Zmc2V0ID0geyB4OiBwYXJzZVBlcmNlbnQodmFsLkhyem4pLCB5OiBwYXJzZVBlcmNlbnQodmFsLlZydGMpIH07IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdNcGdTJzpcclxuXHRcdFx0Y2FzZSAnVHJuUyc6XHJcblx0XHRcdFx0cmVzdWx0LmNvbnRvdXIgPSB7XHJcblx0XHRcdFx0XHRuYW1lOiB2YWxbJ05tICAnXSxcclxuXHRcdFx0XHRcdGN1cnZlOiAodmFsWydDcnYgJ10gYXMgYW55W10pLm1hcChwID0+ICh7IHg6IHAuSHJ6biwgeTogcC5WcnRjIH0pKSxcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdHcmFkJzogcmVzdWx0LmdyYWRpZW50ID0gcGFyc2VHcmFkaWVudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAndXNlVGV4dHVyZSc6XHJcblx0XHRcdGNhc2UgJ3VzZVNoYXBlJzpcclxuXHRcdFx0Y2FzZSAnbGF5ZXJDb25jZWFscyc6XHJcblx0XHRcdGNhc2UgJ3ByZXNlbnQnOlxyXG5cdFx0XHRjYXNlICdzaG93SW5EaWFsb2cnOlxyXG5cdFx0XHRjYXNlICdhbnRpYWxpYXNHbG9zcyc6IHJlc3VsdFtrZXldID0gdmFsOyBicmVhaztcclxuXHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRyZXBvcnRFcnJvcnMgJiYgY29uc29sZS5sb2coYEludmFsaWQgZWZmZWN0IGtleTogJyR7a2V5fScsIHZhbHVlOmAsIHZhbCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXJpYWxpemVFZmZlY3RPYmplY3Qob2JqOiBhbnksIG9iak5hbWU6IHN0cmluZywgcmVwb3J0RXJyb3JzOiBib29sZWFuKSB7XHJcblx0Y29uc3QgcmVzdWx0OiBhbnkgPSB7fTtcclxuXHJcblx0Zm9yIChjb25zdCBvYmpLZXkgb2YgT2JqZWN0LmtleXMob2JqKSkge1xyXG5cdFx0Y29uc3Qga2V5OiBrZXlvZiBBbGxFZmZlY3RzID0gb2JqS2V5IGFzIGFueTtcclxuXHRcdGNvbnN0IHZhbCA9IG9ialtrZXldO1xyXG5cclxuXHRcdHN3aXRjaCAoa2V5KSB7XHJcblx0XHRcdGNhc2UgJ2VuYWJsZWQnOiByZXN1bHQuZW5hYiA9ICEhdmFsOyBicmVhaztcclxuXHRcdFx0Y2FzZSAndXNlR2xvYmFsTGlnaHQnOiByZXN1bHQudWdsZyA9ICEhdmFsOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnYW50aWFsaWFzZWQnOiByZXN1bHQuQW50QSA9ICEhdmFsOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnYWxpZ24nOiByZXN1bHQuQWxnbiA9ICEhdmFsOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnZGl0aGVyJzogcmVzdWx0LkR0aHIgPSAhIXZhbDsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2ludmVydCc6IHJlc3VsdC5JbnZyID0gISF2YWw7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdyZXZlcnNlJzogcmVzdWx0LlJ2cnMgPSAhIXZhbDsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2NvbG9yJzogcmVzdWx0WydDbHIgJ10gPSBzZXJpYWxpemVDb2xvcih2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnaGlnaGxpZ2h0Q29sb3InOiByZXN1bHQuaGdsQyA9IHNlcmlhbGl6ZUNvbG9yKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdzaGFkb3dDb2xvcic6IHJlc3VsdC5zZHdDID0gc2VyaWFsaXplQ29sb3IodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3Bvc2l0aW9uJzogcmVzdWx0LlN0eWwgPSBGU3RsLmVuY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnYmxlbmRNb2RlJzogcmVzdWx0WydNZCAgJ10gPSBCbG5NLmVuY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnaGlnaGxpZ2h0QmxlbmRNb2RlJzogcmVzdWx0LmhnbE0gPSBCbG5NLmVuY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnc2hhZG93QmxlbmRNb2RlJzogcmVzdWx0LnNkd00gPSBCbG5NLmVuY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnc3R5bGUnOiByZXN1bHQuYnZsUyA9IEJFU2wuZW5jb2RlKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdkaXJlY3Rpb24nOiByZXN1bHQuYnZsRCA9IEJFU3MuZW5jb2RlKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICd0ZWNobmlxdWUnOlxyXG5cdFx0XHRcdGlmIChvYmpOYW1lID09PSAnYmV2ZWwnKSB7XHJcblx0XHRcdFx0XHRyZXN1bHQuYnZsVCA9IGJ2bFQuZW5jb2RlKHZhbCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHJlc3VsdC5HbHdUID0gQkVURS5lbmNvZGUodmFsKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ3NvdXJjZSc6IHJlc3VsdC5nbHdTID0gSUdTci5lbmNvZGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3R5cGUnOiByZXN1bHQuVHlwZSA9IEdyZFQuZW5jb2RlKHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdpbnRlcnBvbGF0aW9uTWV0aG9kJzogcmVzdWx0LmdzOTkgPSBncmFkaWVudEludGVycG9sYXRpb25NZXRob2RUeXBlLmVuY29kZSh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnb3BhY2l0eSc6IHJlc3VsdC5PcGN0ID0gdW5pdHNQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdoaWdobGlnaHRPcGFjaXR5JzogcmVzdWx0LmhnbE8gPSB1bml0c1BlcmNlbnQodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3NoYWRvd09wYWNpdHknOiByZXN1bHQuc2R3TyA9IHVuaXRzUGVyY2VudCh2YWwpOyBicmVhaztcclxuXHRcdFx0Y2FzZSAnYW5nbGUnOlxyXG5cdFx0XHRcdGlmIChvYmpOYW1lID09PSAnZ3JhZGllbnRPdmVybGF5Jykge1xyXG5cdFx0XHRcdFx0cmVzdWx0LkFuZ2wgPSB1bml0c0FuZ2xlKHZhbCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHJlc3VsdC5sYWdsID0gdW5pdHNBbmdsZSh2YWwpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnYWx0aXR1ZGUnOiByZXN1bHQuTGFsZCA9IHVuaXRzQW5nbGUodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3NvZnRlbic6IHJlc3VsdC5TZnRuID0gdW5pdHNWYWx1ZSh2YWwsIGtleSk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdzdHJlbmd0aCc6IHJlc3VsdC5zcmdSID0gdW5pdHNQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdzaXplJzogcmVzdWx0LmJsdXIgPSB1bml0c1ZhbHVlKHZhbCwga2V5KTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ25vaXNlJzogcmVzdWx0Lk5vc2UgPSB1bml0c1BlcmNlbnQodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ3JhbmdlJzogcmVzdWx0LklucHIgPSB1bml0c1BlcmNlbnQodmFsKTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2Nob2tlJzogcmVzdWx0LkNrbXQgPSB1bml0c1ZhbHVlKHZhbCwga2V5KTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2ppdHRlcic6IHJlc3VsdC5TaGROID0gdW5pdHNQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdkaXN0YW5jZSc6IHJlc3VsdC5Ec3RuID0gdW5pdHNWYWx1ZSh2YWwsIGtleSk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdzY2FsZSc6IHJlc3VsdFsnU2NsICddID0gdW5pdHNQZXJjZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICdwYXR0ZXJuJzogcmVzdWx0LlB0cm4gPSB7ICdObSAgJzogdmFsLm5hbWUsIElkbnQ6IHZhbC5pZCB9OyBicmVhaztcclxuXHRcdFx0Y2FzZSAncGhhc2UnOiByZXN1bHQucGhhc2UgPSB7IEhyem46IHZhbC54LCBWcnRjOiB2YWwueSB9OyBicmVhaztcclxuXHRcdFx0Y2FzZSAnb2Zmc2V0JzogcmVzdWx0Lk9mc3QgPSB7IEhyem46IHVuaXRzUGVyY2VudCh2YWwueCksIFZydGM6IHVuaXRzUGVyY2VudCh2YWwueSkgfTsgYnJlYWs7XHJcblx0XHRcdGNhc2UgJ2NvbnRvdXInOiB7XHJcblx0XHRcdFx0cmVzdWx0W29iak5hbWUgPT09ICdzYXRpbicgPyAnTXBnUycgOiAnVHJuUyddID0ge1xyXG5cdFx0XHRcdFx0J05tICAnOiAodmFsIGFzIEVmZmVjdENvbnRvdXIpLm5hbWUsXHJcblx0XHRcdFx0XHQnQ3J2ICc6ICh2YWwgYXMgRWZmZWN0Q29udG91cikuY3VydmUubWFwKHAgPT4gKHsgSHJ6bjogcC54LCBWcnRjOiBwLnkgfSkpLFxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2FzZSAnZ3JhZGllbnQnOiByZXN1bHQuR3JhZCA9IHNlcmlhbGl6ZUdyYWRpZW50KHZhbCk7IGJyZWFrO1xyXG5cdFx0XHRjYXNlICd1c2VUZXh0dXJlJzpcclxuXHRcdFx0Y2FzZSAndXNlU2hhcGUnOlxyXG5cdFx0XHRjYXNlICdsYXllckNvbmNlYWxzJzpcclxuXHRcdFx0Y2FzZSAncHJlc2VudCc6XHJcblx0XHRcdGNhc2UgJ3Nob3dJbkRpYWxvZyc6XHJcblx0XHRcdGNhc2UgJ2FudGlhbGlhc0dsb3NzJzpcclxuXHRcdFx0XHRyZXN1bHRba2V5XSA9IHZhbDtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRyZXBvcnRFcnJvcnMgJiYgY29uc29sZS5sb2coYEludmFsaWQgZWZmZWN0IGtleTogJyR7a2V5fScsIHZhbHVlOmAsIHZhbCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZUdyYWRpZW50KGdyYWQ6IERlc2NpcHRvckdyYWRpZW50KTogRWZmZWN0U29saWRHcmFkaWVudCB8IEVmZmVjdE5vaXNlR3JhZGllbnQge1xyXG5cdGlmIChncmFkLkdyZEYgPT09ICdHcmRGLkNzdFMnKSB7XHJcblx0XHRjb25zdCBzYW1wbGVzOiBudW1iZXIgPSBncmFkLkludHIgfHwgNDA5NjtcclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHR0eXBlOiAnc29saWQnLFxyXG5cdFx0XHRuYW1lOiBncmFkWydObSAgJ10sXHJcblx0XHRcdHNtb290aG5lc3M6IGdyYWQuSW50ciAvIDQwOTYsXHJcblx0XHRcdGNvbG9yU3RvcHM6IGdyYWQuQ2xycy5tYXAocyA9PiAoe1xyXG5cdFx0XHRcdGNvbG9yOiBwYXJzZUNvbG9yKHNbJ0NsciAnXSksXHJcblx0XHRcdFx0bG9jYXRpb246IHMuTGN0biAvIHNhbXBsZXMsXHJcblx0XHRcdFx0bWlkcG9pbnQ6IHMuTWRwbiAvIDEwMCxcclxuXHRcdFx0fSkpLFxyXG5cdFx0XHRvcGFjaXR5U3RvcHM6IGdyYWQuVHJucy5tYXAocyA9PiAoe1xyXG5cdFx0XHRcdG9wYWNpdHk6IHBhcnNlUGVyY2VudChzLk9wY3QpLFxyXG5cdFx0XHRcdGxvY2F0aW9uOiBzLkxjdG4gLyBzYW1wbGVzLFxyXG5cdFx0XHRcdG1pZHBvaW50OiBzLk1kcG4gLyAxMDAsXHJcblx0XHRcdH0pKSxcclxuXHRcdH07XHJcblx0fSBlbHNlIHtcclxuXHRcdHJldHVybiB7XHJcblx0XHRcdHR5cGU6ICdub2lzZScsXHJcblx0XHRcdG5hbWU6IGdyYWRbJ05tICAnXSxcclxuXHRcdFx0cm91Z2huZXNzOiBncmFkLlNtdGggLyA0MDk2LFxyXG5cdFx0XHRjb2xvck1vZGVsOiBDbHJTLmRlY29kZShncmFkLkNsclMpLFxyXG5cdFx0XHRyYW5kb21TZWVkOiBncmFkLlJuZFMsXHJcblx0XHRcdHJlc3RyaWN0Q29sb3JzOiAhIWdyYWQuVmN0QyxcclxuXHRcdFx0YWRkVHJhbnNwYXJlbmN5OiAhIWdyYWQuU2hUcixcclxuXHRcdFx0bWluOiBncmFkWydNbm0gJ10ubWFwKHggPT4geCAvIDEwMCksXHJcblx0XHRcdG1heDogZ3JhZFsnTXhtICddLm1hcCh4ID0+IHggLyAxMDApLFxyXG5cdFx0fTtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNlcmlhbGl6ZUdyYWRpZW50KGdyYWQ6IEVmZmVjdFNvbGlkR3JhZGllbnQgfCBFZmZlY3ROb2lzZUdyYWRpZW50KTogRGVzY2lwdG9yR3JhZGllbnQge1xyXG5cdGlmIChncmFkLnR5cGUgPT09ICdzb2xpZCcpIHtcclxuXHRcdGNvbnN0IHNhbXBsZXMgPSBNYXRoLnJvdW5kKChncmFkLnNtb290aG5lc3MgPz8gMSkgKiA0MDk2KTtcclxuXHRcdHJldHVybiB7XHJcblx0XHRcdCdObSAgJzogZ3JhZC5uYW1lIHx8ICcnLFxyXG5cdFx0XHRHcmRGOiAnR3JkRi5Dc3RTJyxcclxuXHRcdFx0SW50cjogc2FtcGxlcyxcclxuXHRcdFx0Q2xyczogZ3JhZC5jb2xvclN0b3BzLm1hcChzID0+ICh7XHJcblx0XHRcdFx0J0NsciAnOiBzZXJpYWxpemVDb2xvcihzLmNvbG9yKSxcclxuXHRcdFx0XHRUeXBlOiAnQ2xyeS5Vc3JTJyxcclxuXHRcdFx0XHRMY3RuOiBNYXRoLnJvdW5kKHMubG9jYXRpb24gKiBzYW1wbGVzKSxcclxuXHRcdFx0XHRNZHBuOiBNYXRoLnJvdW5kKChzLm1pZHBvaW50ID8/IDAuNSkgKiAxMDApLFxyXG5cdFx0XHR9KSksXHJcblx0XHRcdFRybnM6IGdyYWQub3BhY2l0eVN0b3BzLm1hcChzID0+ICh7XHJcblx0XHRcdFx0T3BjdDogdW5pdHNQZXJjZW50KHMub3BhY2l0eSksXHJcblx0XHRcdFx0TGN0bjogTWF0aC5yb3VuZChzLmxvY2F0aW9uICogc2FtcGxlcyksXHJcblx0XHRcdFx0TWRwbjogTWF0aC5yb3VuZCgocy5taWRwb2ludCA/PyAwLjUpICogMTAwKSxcclxuXHRcdFx0fSkpLFxyXG5cdFx0fTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0R3JkRjogJ0dyZEYuQ2xOcycsXHJcblx0XHRcdCdObSAgJzogZ3JhZC5uYW1lIHx8ICcnLFxyXG5cdFx0XHRTaFRyOiAhIWdyYWQuYWRkVHJhbnNwYXJlbmN5LFxyXG5cdFx0XHRWY3RDOiAhIWdyYWQucmVzdHJpY3RDb2xvcnMsXHJcblx0XHRcdENsclM6IENsclMuZW5jb2RlKGdyYWQuY29sb3JNb2RlbCksXHJcblx0XHRcdFJuZFM6IGdyYWQucmFuZG9tU2VlZCB8fCAwLFxyXG5cdFx0XHRTbXRoOiBNYXRoLnJvdW5kKChncmFkLnJvdWdobmVzcyA/PyAxKSAqIDQwOTYpLFxyXG5cdFx0XHQnTW5tICc6IChncmFkLm1pbiB8fCBbMCwgMCwgMCwgMF0pLm1hcCh4ID0+IHggKiAxMDApLFxyXG5cdFx0XHQnTXhtICc6IChncmFkLm1heCB8fCBbMSwgMSwgMSwgMV0pLm1hcCh4ID0+IHggKiAxMDApLFxyXG5cdFx0fTtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlR3JhZGllbnRDb250ZW50KGRlc2NyaXB0b3I6IERlc2NyaXB0b3JHcmFkaWVudENvbnRlbnQpIHtcclxuXHRjb25zdCByZXN1bHQgPSBwYXJzZUdyYWRpZW50KGRlc2NyaXB0b3IuR3JhZCkgYXMgKEVmZmVjdFNvbGlkR3JhZGllbnQgfCBFZmZlY3ROb2lzZUdyYWRpZW50KSAmIEV4dHJhR3JhZGllbnRJbmZvO1xyXG5cdHJlc3VsdC5zdHlsZSA9IEdyZFQuZGVjb2RlKGRlc2NyaXB0b3IuVHlwZSk7XHJcblx0aWYgKGRlc2NyaXB0b3IuRHRociAhPT0gdW5kZWZpbmVkKSByZXN1bHQuZGl0aGVyID0gZGVzY3JpcHRvci5EdGhyO1xyXG5cdGlmIChkZXNjcmlwdG9yLlJ2cnMgIT09IHVuZGVmaW5lZCkgcmVzdWx0LnJldmVyc2UgPSBkZXNjcmlwdG9yLlJ2cnM7XHJcblx0aWYgKGRlc2NyaXB0b3IuQW5nbCAhPT0gdW5kZWZpbmVkKSByZXN1bHQuYW5nbGUgPSBwYXJzZUFuZ2xlKGRlc2NyaXB0b3IuQW5nbCk7XHJcblx0aWYgKGRlc2NyaXB0b3JbJ1NjbCAnXSAhPT0gdW5kZWZpbmVkKSByZXN1bHQuc2NhbGUgPSBwYXJzZVBlcmNlbnQoZGVzY3JpcHRvclsnU2NsICddKTtcclxuXHRpZiAoZGVzY3JpcHRvci5BbGduICE9PSB1bmRlZmluZWQpIHJlc3VsdC5hbGlnbiA9IGRlc2NyaXB0b3IuQWxnbjtcclxuXHRpZiAoZGVzY3JpcHRvci5PZnN0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdHJlc3VsdC5vZmZzZXQgPSB7XHJcblx0XHRcdHg6IHBhcnNlUGVyY2VudChkZXNjcmlwdG9yLk9mc3QuSHJ6biksXHJcblx0XHRcdHk6IHBhcnNlUGVyY2VudChkZXNjcmlwdG9yLk9mc3QuVnJ0YylcclxuXHRcdH07XHJcblx0fVxyXG5cdHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlUGF0dGVybkNvbnRlbnQoZGVzY3JpcHRvcjogRGVzY3JpcHRvclBhdHRlcm5Db250ZW50KSB7XHJcblx0Y29uc3QgcmVzdWx0OiBFZmZlY3RQYXR0ZXJuICYgRXh0cmFQYXR0ZXJuSW5mbyA9IHtcclxuXHRcdG5hbWU6IGRlc2NyaXB0b3IuUHRyblsnTm0gICddLFxyXG5cdFx0aWQ6IGRlc2NyaXB0b3IuUHRybi5JZG50LFxyXG5cdH07XHJcblx0aWYgKGRlc2NyaXB0b3IuTG5rZCAhPT0gdW5kZWZpbmVkKSByZXN1bHQubGlua2VkID0gZGVzY3JpcHRvci5MbmtkO1xyXG5cdGlmIChkZXNjcmlwdG9yLnBoYXNlICE9PSB1bmRlZmluZWQpIHJlc3VsdC5waGFzZSA9IHsgeDogZGVzY3JpcHRvci5waGFzZS5IcnpuLCB5OiBkZXNjcmlwdG9yLnBoYXNlLlZydGMgfTtcclxuXHRyZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVmVjdG9yQ29udGVudChkZXNjcmlwdG9yOiBEZXNjcmlwdG9yVmVjdG9yQ29udGVudCk6IFZlY3RvckNvbnRlbnQge1xyXG5cdGlmICgnR3JhZCcgaW4gZGVzY3JpcHRvcikge1xyXG5cdFx0cmV0dXJuIHBhcnNlR3JhZGllbnRDb250ZW50KGRlc2NyaXB0b3IpO1xyXG5cdH0gZWxzZSBpZiAoJ1B0cm4nIGluIGRlc2NyaXB0b3IpIHtcclxuXHRcdHJldHVybiB7IHR5cGU6ICdwYXR0ZXJuJywgLi4ucGFyc2VQYXR0ZXJuQ29udGVudChkZXNjcmlwdG9yKSB9O1xyXG5cdH0gZWxzZSBpZiAoJ0NsciAnIGluIGRlc2NyaXB0b3IpIHtcclxuXHRcdHJldHVybiB7IHR5cGU6ICdjb2xvcicsIGNvbG9yOiBwYXJzZUNvbG9yKGRlc2NyaXB0b3JbJ0NsciAnXSkgfTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZlY3RvciBjb250ZW50Jyk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXJpYWxpemVHcmFkaWVudENvbnRlbnQoY29udGVudDogKEVmZmVjdFNvbGlkR3JhZGllbnQgfCBFZmZlY3ROb2lzZUdyYWRpZW50KSAmIEV4dHJhR3JhZGllbnRJbmZvKSB7XHJcblx0Y29uc3QgcmVzdWx0OiBEZXNjcmlwdG9yR3JhZGllbnRDb250ZW50ID0ge30gYXMgYW55O1xyXG5cdGlmIChjb250ZW50LmRpdGhlciAhPT0gdW5kZWZpbmVkKSByZXN1bHQuRHRociA9IGNvbnRlbnQuZGl0aGVyO1xyXG5cdGlmIChjb250ZW50LnJldmVyc2UgIT09IHVuZGVmaW5lZCkgcmVzdWx0LlJ2cnMgPSBjb250ZW50LnJldmVyc2U7XHJcblx0aWYgKGNvbnRlbnQuYW5nbGUgIT09IHVuZGVmaW5lZCkgcmVzdWx0LkFuZ2wgPSB1bml0c0FuZ2xlKGNvbnRlbnQuYW5nbGUpO1xyXG5cdHJlc3VsdC5UeXBlID0gR3JkVC5lbmNvZGUoY29udGVudC5zdHlsZSk7XHJcblx0aWYgKGNvbnRlbnQuYWxpZ24gIT09IHVuZGVmaW5lZCkgcmVzdWx0LkFsZ24gPSBjb250ZW50LmFsaWduO1xyXG5cdGlmIChjb250ZW50LnNjYWxlICE9PSB1bmRlZmluZWQpIHJlc3VsdFsnU2NsICddID0gdW5pdHNQZXJjZW50KGNvbnRlbnQuc2NhbGUpO1xyXG5cdGlmIChjb250ZW50Lm9mZnNldCkge1xyXG5cdFx0cmVzdWx0Lk9mc3QgPSB7XHJcblx0XHRcdEhyem46IHVuaXRzUGVyY2VudChjb250ZW50Lm9mZnNldC54KSxcclxuXHRcdFx0VnJ0YzogdW5pdHNQZXJjZW50KGNvbnRlbnQub2Zmc2V0LnkpLFxyXG5cdFx0fTtcclxuXHR9XHJcblx0cmVzdWx0LkdyYWQgPSBzZXJpYWxpemVHcmFkaWVudChjb250ZW50KTtcclxuXHRyZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXJpYWxpemVQYXR0ZXJuQ29udGVudChjb250ZW50OiBFZmZlY3RQYXR0ZXJuICYgRXh0cmFQYXR0ZXJuSW5mbykge1xyXG5cdGNvbnN0IHJlc3VsdDogRGVzY3JpcHRvclBhdHRlcm5Db250ZW50ID0ge1xyXG5cdFx0UHRybjoge1xyXG5cdFx0XHQnTm0gICc6IGNvbnRlbnQubmFtZSB8fCAnJyxcclxuXHRcdFx0SWRudDogY29udGVudC5pZCB8fCAnJyxcclxuXHRcdH1cclxuXHR9O1xyXG5cdGlmIChjb250ZW50LmxpbmtlZCAhPT0gdW5kZWZpbmVkKSByZXN1bHQuTG5rZCA9ICEhY29udGVudC5saW5rZWQ7XHJcblx0aWYgKGNvbnRlbnQucGhhc2UgIT09IHVuZGVmaW5lZCkgcmVzdWx0LnBoYXNlID0geyBIcnpuOiBjb250ZW50LnBoYXNlLngsIFZydGM6IGNvbnRlbnQucGhhc2UueSB9O1xyXG5cdHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVWZWN0b3JDb250ZW50KGNvbnRlbnQ6IFZlY3RvckNvbnRlbnQpOiB7IGRlc2NyaXB0b3I6IERlc2NyaXB0b3JWZWN0b3JDb250ZW50OyBrZXk6IHN0cmluZzsgfSB7XHJcblx0aWYgKGNvbnRlbnQudHlwZSA9PT0gJ2NvbG9yJykge1xyXG5cdFx0cmV0dXJuIHsga2V5OiAnU29DbycsIGRlc2NyaXB0b3I6IHsgJ0NsciAnOiBzZXJpYWxpemVDb2xvcihjb250ZW50LmNvbG9yKSB9IH07XHJcblx0fSBlbHNlIGlmIChjb250ZW50LnR5cGUgPT09ICdwYXR0ZXJuJykge1xyXG5cdFx0cmV0dXJuIHsga2V5OiAnUHRGbCcsIGRlc2NyaXB0b3I6IHNlcmlhbGl6ZVBhdHRlcm5Db250ZW50KGNvbnRlbnQpIH07XHJcblx0fSBlbHNlIHtcclxuXHRcdHJldHVybiB7IGtleTogJ0dkRmwnLCBkZXNjcmlwdG9yOiBzZXJpYWxpemVHcmFkaWVudENvbnRlbnQoY29udGVudCkgfTtcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNvbG9yKGNvbG9yOiBEZXNjcmlwdG9yQ29sb3IpOiBDb2xvciB7XHJcblx0aWYgKCdIICAgJyBpbiBjb2xvcikge1xyXG5cdFx0cmV0dXJuIHsgaDogcGFyc2VQZXJjZW50T3JBbmdsZShjb2xvclsnSCAgICddKSwgczogY29sb3IuU3RydCwgYjogY29sb3IuQnJnaCB9O1xyXG5cdH0gZWxzZSBpZiAoJ1JkICAnIGluIGNvbG9yKSB7XHJcblx0XHRyZXR1cm4geyByOiBjb2xvclsnUmQgICddLCBnOiBjb2xvclsnR3JuICddLCBiOiBjb2xvclsnQmwgICddIH07XHJcblx0fSBlbHNlIGlmICgnQ3luICcgaW4gY29sb3IpIHtcclxuXHRcdHJldHVybiB7IGM6IGNvbG9yWydDeW4gJ10sIG06IGNvbG9yLk1nbnQsIHk6IGNvbG9yWydZbHcgJ10sIGs6IGNvbG9yLkJsY2sgfTtcclxuXHR9IGVsc2UgaWYgKCdHcnkgJyBpbiBjb2xvcikge1xyXG5cdFx0cmV0dXJuIHsgazogY29sb3JbJ0dyeSAnXSB9O1xyXG5cdH0gZWxzZSBpZiAoJ0xtbmMnIGluIGNvbG9yKSB7XHJcblx0XHRyZXR1cm4geyBsOiBjb2xvci5MbW5jLCBhOiBjb2xvclsnQSAgICddLCBiOiBjb2xvclsnQiAgICddIH07XHJcblx0fSBlbHNlIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgY29sb3IgZGVzY3JpcHRvcicpO1xyXG5cdH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUNvbG9yKGNvbG9yOiBDb2xvciB8IHVuZGVmaW5lZCk6IERlc2NyaXB0b3JDb2xvciB7XHJcblx0aWYgKCFjb2xvcikge1xyXG5cdFx0cmV0dXJuIHsgJ1JkICAnOiAwLCAnR3JuICc6IDAsICdCbCAgJzogMCB9O1xyXG5cdH0gZWxzZSBpZiAoJ3InIGluIGNvbG9yKSB7XHJcblx0XHRyZXR1cm4geyAnUmQgICc6IGNvbG9yLnIgfHwgMCwgJ0dybiAnOiBjb2xvci5nIHx8IDAsICdCbCAgJzogY29sb3IuYiB8fCAwIH07XHJcblx0fSBlbHNlIGlmICgnaCcgaW4gY29sb3IpIHtcclxuXHRcdHJldHVybiB7ICdIICAgJzogdW5pdHNBbmdsZShjb2xvci5oICogMzYwKSwgU3RydDogY29sb3IucyB8fCAwLCBCcmdoOiBjb2xvci5iIHx8IDAgfTtcclxuXHR9IGVsc2UgaWYgKCdjJyBpbiBjb2xvcikge1xyXG5cdFx0cmV0dXJuIHsgJ0N5biAnOiBjb2xvci5jIHx8IDAsIE1nbnQ6IGNvbG9yLm0gfHwgMCwgJ1lsdyAnOiBjb2xvci55IHx8IDAsIEJsY2s6IGNvbG9yLmsgfHwgMCB9O1xyXG5cdH0gZWxzZSBpZiAoJ2wnIGluIGNvbG9yKSB7XHJcblx0XHRyZXR1cm4geyBMbW5jOiBjb2xvci5sIHx8IDAsICdBICAgJzogY29sb3IuYSB8fCAwLCAnQiAgICc6IGNvbG9yLmIgfHwgMCB9O1xyXG5cdH0gZWxzZSBpZiAoJ2snIGluIGNvbG9yKSB7XHJcblx0XHRyZXR1cm4geyAnR3J5ICc6IGNvbG9yLmsgfTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbG9yIHZhbHVlJyk7XHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VBbmdsZSh4OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZSkge1xyXG5cdGlmICh4ID09PSB1bmRlZmluZWQpIHJldHVybiAwO1xyXG5cdGlmICh4LnVuaXRzICE9PSAnQW5nbGUnKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdW5pdHM6ICR7eC51bml0c31gKTtcclxuXHRyZXR1cm4geC52YWx1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUGVyY2VudCh4OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZSB8IHVuZGVmaW5lZCkge1xyXG5cdGlmICh4ID09PSB1bmRlZmluZWQpIHJldHVybiAxO1xyXG5cdGlmICh4LnVuaXRzICE9PSAnUGVyY2VudCcpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB1bml0czogJHt4LnVuaXRzfWApO1xyXG5cdHJldHVybiB4LnZhbHVlIC8gMTAwO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQZXJjZW50T3JBbmdsZSh4OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZSB8IHVuZGVmaW5lZCkge1xyXG5cdGlmICh4ID09PSB1bmRlZmluZWQpIHJldHVybiAxO1xyXG5cdGlmICh4LnVuaXRzID09PSAnUGVyY2VudCcpIHJldHVybiB4LnZhbHVlIC8gMTAwO1xyXG5cdGlmICh4LnVuaXRzID09PSAnQW5nbGUnKSByZXR1cm4geC52YWx1ZSAvIDM2MDtcclxuXHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdW5pdHM6ICR7eC51bml0c31gKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVW5pdHMoeyB1bml0cywgdmFsdWUgfTogRGVzY3JpcHRvclVuaXRzVmFsdWUpOiBVbml0c1ZhbHVlIHtcclxuXHRpZiAoXHJcblx0XHR1bml0cyAhPT0gJ1BpeGVscycgJiYgdW5pdHMgIT09ICdNaWxsaW1ldGVycycgJiYgdW5pdHMgIT09ICdQb2ludHMnICYmIHVuaXRzICE9PSAnTm9uZScgJiZcclxuXHRcdHVuaXRzICE9PSAnUGljYXMnICYmIHVuaXRzICE9PSAnSW5jaGVzJyAmJiB1bml0cyAhPT0gJ0NlbnRpbWV0ZXJzJyAmJiB1bml0cyAhPT0gJ0RlbnNpdHknXHJcblx0KSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdW5pdHM6ICR7SlNPTi5zdHJpbmdpZnkoeyB1bml0cywgdmFsdWUgfSl9YCk7XHJcblx0fVxyXG5cdHJldHVybiB7IHZhbHVlLCB1bml0cyB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VVbml0c09yTnVtYmVyKHZhbHVlOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZSB8IG51bWJlciwgdW5pdHM6IFVuaXRzID0gJ1BpeGVscycpOiBVbml0c1ZhbHVlIHtcclxuXHRpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykgcmV0dXJuIHsgdmFsdWUsIHVuaXRzIH07XHJcblx0cmV0dXJuIHBhcnNlVW5pdHModmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VVbml0c1RvTnVtYmVyKHsgdW5pdHMsIHZhbHVlIH06IERlc2NyaXB0b3JVbml0c1ZhbHVlLCBleHBlY3RlZFVuaXRzOiBzdHJpbmcpOiBudW1iZXIge1xyXG5cdGlmICh1bml0cyAhPT0gZXhwZWN0ZWRVbml0cykgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHVuaXRzOiAke0pTT04uc3RyaW5naWZ5KHsgdW5pdHMsIHZhbHVlIH0pfWApO1xyXG5cdHJldHVybiB2YWx1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVuaXRzQW5nbGUodmFsdWU6IG51bWJlciB8IHVuZGVmaW5lZCk6IERlc2NyaXB0b3JVbml0c1ZhbHVlIHtcclxuXHRyZXR1cm4geyB1bml0czogJ0FuZ2xlJywgdmFsdWU6IHZhbHVlIHx8IDAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVuaXRzUGVyY2VudCh2YWx1ZTogbnVtYmVyIHwgdW5kZWZpbmVkKTogRGVzY3JpcHRvclVuaXRzVmFsdWUge1xyXG5cdHJldHVybiB7IHVuaXRzOiAnUGVyY2VudCcsIHZhbHVlOiBNYXRoLnJvdW5kKCh2YWx1ZSB8fCAwKSAqIDEwMCkgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVuaXRzVmFsdWUoeDogVW5pdHNWYWx1ZSB8IHVuZGVmaW5lZCwga2V5OiBzdHJpbmcpOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZSB7XHJcblx0aWYgKHggPT0gbnVsbCkgcmV0dXJuIHsgdW5pdHM6ICdQaXhlbHMnLCB2YWx1ZTogMCB9O1xyXG5cclxuXHRpZiAodHlwZW9mIHggIT09ICdvYmplY3QnKVxyXG5cdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbHVlOiAke0pTT04uc3RyaW5naWZ5KHgpfSAoa2V5OiAke2tleX0pIChzaG91bGQgaGF2ZSB2YWx1ZSBhbmQgdW5pdHMpYCk7XHJcblxyXG5cdGNvbnN0IHsgdW5pdHMsIHZhbHVlIH0gPSB4O1xyXG5cclxuXHRpZiAodHlwZW9mIHZhbHVlICE9PSAnbnVtYmVyJylcclxuXHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB2YWx1ZSBpbiAke0pTT04uc3RyaW5naWZ5KHgpfSAoa2V5OiAke2tleX0pYCk7XHJcblxyXG5cdGlmIChcclxuXHRcdHVuaXRzICE9PSAnUGl4ZWxzJyAmJiB1bml0cyAhPT0gJ01pbGxpbWV0ZXJzJyAmJiB1bml0cyAhPT0gJ1BvaW50cycgJiYgdW5pdHMgIT09ICdOb25lJyAmJlxyXG5cdFx0dW5pdHMgIT09ICdQaWNhcycgJiYgdW5pdHMgIT09ICdJbmNoZXMnICYmIHVuaXRzICE9PSAnQ2VudGltZXRlcnMnICYmIHVuaXRzICE9PSAnRGVuc2l0eSdcclxuXHQpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB1bml0cyBpbiAke0pTT04uc3RyaW5naWZ5KHgpfSAoa2V5OiAke2tleX0pYCk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4geyB1bml0cywgdmFsdWUgfTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IHRleHRHcmlkZGluZyA9IGNyZWF0ZUVudW08VGV4dEdyaWRkaW5nPigndGV4dEdyaWRkaW5nJywgJ25vbmUnLCB7XHJcblx0bm9uZTogJ05vbmUnLFxyXG5cdHJvdW5kOiAnUm5kICcsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IE9ybnQgPSBjcmVhdGVFbnVtPE9yaWVudGF0aW9uPignT3JudCcsICdob3Jpem9udGFsJywge1xyXG5cdGhvcml6b250YWw6ICdIcnpuJyxcclxuXHR2ZXJ0aWNhbDogJ1ZydGMnLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBBbm50ID0gY3JlYXRlRW51bTxBbnRpQWxpYXM+KCdBbm50JywgJ3NoYXJwJywge1xyXG5cdG5vbmU6ICdBbm5vJyxcclxuXHRzaGFycDogJ2FudGlBbGlhc1NoYXJwJyxcclxuXHRjcmlzcDogJ0FuQ3InLFxyXG5cdHN0cm9uZzogJ0FuU3QnLFxyXG5cdHNtb290aDogJ0FuU20nLFxyXG5cdHBsYXRmb3JtOiAnYW50aUFsaWFzUGxhdGZvcm1HcmF5JyxcclxuXHRwbGF0Zm9ybUxDRDogJ2FudGlBbGlhc1BsYXRmb3JtTENEJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3Qgd2FycFN0eWxlID0gY3JlYXRlRW51bTxXYXJwU3R5bGU+KCd3YXJwU3R5bGUnLCAnbm9uZScsIHtcclxuXHRub25lOiAnd2FycE5vbmUnLFxyXG5cdGFyYzogJ3dhcnBBcmMnLFxyXG5cdGFyY0xvd2VyOiAnd2FycEFyY0xvd2VyJyxcclxuXHRhcmNVcHBlcjogJ3dhcnBBcmNVcHBlcicsXHJcblx0YXJjaDogJ3dhcnBBcmNoJyxcclxuXHRidWxnZTogJ3dhcnBCdWxnZScsXHJcblx0c2hlbGxMb3dlcjogJ3dhcnBTaGVsbExvd2VyJyxcclxuXHRzaGVsbFVwcGVyOiAnd2FycFNoZWxsVXBwZXInLFxyXG5cdGZsYWc6ICd3YXJwRmxhZycsXHJcblx0d2F2ZTogJ3dhcnBXYXZlJyxcclxuXHRmaXNoOiAnd2FycEZpc2gnLFxyXG5cdHJpc2U6ICd3YXJwUmlzZScsXHJcblx0ZmlzaGV5ZTogJ3dhcnBGaXNoZXllJyxcclxuXHRpbmZsYXRlOiAnd2FycEluZmxhdGUnLFxyXG5cdHNxdWVlemU6ICd3YXJwU3F1ZWV6ZScsXHJcblx0dHdpc3Q6ICd3YXJwVHdpc3QnLFxyXG5cdGN1c3RvbTogJ3dhcnBDdXN0b20nLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBCbG5NID0gY3JlYXRlRW51bTxCbGVuZE1vZGU+KCdCbG5NJywgJ25vcm1hbCcsIHtcclxuXHQnbm9ybWFsJzogJ05ybWwnLFxyXG5cdCdkaXNzb2x2ZSc6ICdEc2x2JyxcclxuXHQnZGFya2VuJzogJ0Rya24nLFxyXG5cdCdtdWx0aXBseSc6ICdNbHRwJyxcclxuXHQnY29sb3IgYnVybic6ICdDQnJuJyxcclxuXHQnbGluZWFyIGJ1cm4nOiAnbGluZWFyQnVybicsXHJcblx0J2RhcmtlciBjb2xvcic6ICdkYXJrZXJDb2xvcicsXHJcblx0J2xpZ2h0ZW4nOiAnTGdobicsXHJcblx0J3NjcmVlbic6ICdTY3JuJyxcclxuXHQnY29sb3IgZG9kZ2UnOiAnQ0RkZycsXHJcblx0J2xpbmVhciBkb2RnZSc6ICdsaW5lYXJEb2RnZScsXHJcblx0J2xpZ2h0ZXIgY29sb3InOiAnbGlnaHRlckNvbG9yJyxcclxuXHQnb3ZlcmxheSc6ICdPdnJsJyxcclxuXHQnc29mdCBsaWdodCc6ICdTZnRMJyxcclxuXHQnaGFyZCBsaWdodCc6ICdIcmRMJyxcclxuXHQndml2aWQgbGlnaHQnOiAndml2aWRMaWdodCcsXHJcblx0J2xpbmVhciBsaWdodCc6ICdsaW5lYXJMaWdodCcsXHJcblx0J3BpbiBsaWdodCc6ICdwaW5MaWdodCcsXHJcblx0J2hhcmQgbWl4JzogJ2hhcmRNaXgnLFxyXG5cdCdkaWZmZXJlbmNlJzogJ0Rmcm4nLFxyXG5cdCdleGNsdXNpb24nOiAnWGNsdScsXHJcblx0J3N1YnRyYWN0JzogJ2JsZW5kU3VidHJhY3Rpb24nLFxyXG5cdCdkaXZpZGUnOiAnYmxlbmREaXZpZGUnLFxyXG5cdCdodWUnOiAnSCAgICcsXHJcblx0J3NhdHVyYXRpb24nOiAnU3RydCcsXHJcblx0J2NvbG9yJzogJ0NsciAnLFxyXG5cdCdsdW1pbm9zaXR5JzogJ0xtbnMnLFxyXG5cdC8vIHVzZWQgaW4gQUJSXHJcblx0J2xpbmVhciBoZWlnaHQnOiAnbGluZWFySGVpZ2h0JyxcclxuXHQnaGVpZ2h0JzogJ0hnaHQnLFxyXG5cdCdzdWJ0cmFjdGlvbic6ICdTYnRyJywgLy8gMm5kIHZlcnNpb24gb2Ygc3VidHJhY3QgP1xyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBCRVNsID0gY3JlYXRlRW51bTxCZXZlbFN0eWxlPignQkVTbCcsICdpbm5lciBiZXZlbCcsIHtcclxuXHQnaW5uZXIgYmV2ZWwnOiAnSW5yQicsXHJcblx0J291dGVyIGJldmVsJzogJ090ckInLFxyXG5cdCdlbWJvc3MnOiAnRW1icycsXHJcblx0J3BpbGxvdyBlbWJvc3MnOiAnUGxFYicsXHJcblx0J3N0cm9rZSBlbWJvc3MnOiAnc3Ryb2tlRW1ib3NzJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgYnZsVCA9IGNyZWF0ZUVudW08QmV2ZWxUZWNobmlxdWU+KCdidmxUJywgJ3Ntb290aCcsIHtcclxuXHQnc21vb3RoJzogJ1NmQkwnLFxyXG5cdCdjaGlzZWwgaGFyZCc6ICdQckJMJyxcclxuXHQnY2hpc2VsIHNvZnQnOiAnU2xtdCcsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IEJFU3MgPSBjcmVhdGVFbnVtPEJldmVsRGlyZWN0aW9uPignQkVTcycsICd1cCcsIHtcclxuXHR1cDogJ0luICAnLFxyXG5cdGRvd246ICdPdXQgJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgQkVURSA9IGNyZWF0ZUVudW08R2xvd1RlY2huaXF1ZT4oJ0JFVEUnLCAnc29mdGVyJywge1xyXG5cdHNvZnRlcjogJ1NmQkwnLFxyXG5cdHByZWNpc2U6ICdQckJMJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgSUdTciA9IGNyZWF0ZUVudW08R2xvd1NvdXJjZT4oJ0lHU3InLCAnZWRnZScsIHtcclxuXHRlZGdlOiAnU3JjRScsXHJcblx0Y2VudGVyOiAnU3JjQycsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IEdyZFQgPSBjcmVhdGVFbnVtPEdyYWRpZW50U3R5bGU+KCdHcmRUJywgJ2xpbmVhcicsIHtcclxuXHRsaW5lYXI6ICdMbnIgJyxcclxuXHRyYWRpYWw6ICdSZGwgJyxcclxuXHRhbmdsZTogJ0FuZ2wnLFxyXG5cdHJlZmxlY3RlZDogJ1JmbGMnLFxyXG5cdGRpYW1vbmQ6ICdEbW5kJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgYW5pbUludGVycFN0eWxlRW51bSA9IGNyZWF0ZUVudW08VGltZWxpbmVLZXlJbnRlcnBvbGF0aW9uPignYW5pbUludGVycFN0eWxlJywgJ2xpbmVhcicsIHtcclxuXHRsaW5lYXI6ICdMbnIgJyxcclxuXHRob2xkOiAnaG9sZCcsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IHN0ZFRyYWNrSUQgPSBjcmVhdGVFbnVtPFRpbWVsaW5lVHJhY2tUeXBlPignc3RkVHJhY2tJRCcsICdvcGFjaXR5Jywge1xyXG5cdG9wYWNpdHk6ICdvcGFjaXR5VHJhY2snLFxyXG5cdHN0eWxlOiAnc3R5bGVUcmFjaycsXHJcblx0c2hlZXRUcmFuc2Zvcm06ICdzaGVldFRyYW5zZm9ybVRyYWNrJyxcclxuXHRzaGVldFBvc2l0aW9uOiAnc2hlZXRQb3NpdGlvblRyYWNrJyxcclxuXHRnbG9iYWxMaWdodGluZzogJ2dsb2JhbExpZ2h0aW5nVHJhY2snLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBncmFkaWVudEludGVycG9sYXRpb25NZXRob2RUeXBlID0gY3JlYXRlRW51bTxJbnRlcnBvbGF0aW9uTWV0aG9kPignZ3JhZGllbnRJbnRlcnBvbGF0aW9uTWV0aG9kVHlwZScsICdwZXJjZXB0dWFsJywge1xyXG5cdHBlcmNlcHR1YWw6ICdQZXJjJyxcclxuXHRsaW5lYXI6ICdMbnInLFxyXG5cdGNsYXNzaWM6ICdHY2xzJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3QgQ2xyUyA9IGNyZWF0ZUVudW08J3JnYicgfCAnaHNiJyB8ICdsYWInPignQ2xyUycsICdyZ2InLCB7XHJcblx0cmdiOiAnUkdCQycsXHJcblx0aHNiOiAnSFNCbCcsXHJcblx0bGFiOiAnTGJDbCcsXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IEZTdGwgPSBjcmVhdGVFbnVtPCdpbnNpZGUnIHwgJ2NlbnRlcicgfCAnb3V0c2lkZSc+KCdGU3RsJywgJ291dHNpZGUnLCB7XHJcblx0b3V0c2lkZTogJ091dEYnLFxyXG5cdGNlbnRlcjogJ0N0ckYnLFxyXG5cdGluc2lkZTogJ0luc0YnXHJcbn0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IEZyRmwgPSBjcmVhdGVFbnVtPCdjb2xvcicgfCAnZ3JhZGllbnQnIHwgJ3BhdHRlcm4nPignRnJGbCcsICdjb2xvcicsIHtcclxuXHRjb2xvcjogJ1NDbHInLFxyXG5cdGdyYWRpZW50OiAnR3JGbCcsXHJcblx0cGF0dGVybjogJ1B0cm4nLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBzdHJva2VTdHlsZUxpbmVDYXBUeXBlID0gY3JlYXRlRW51bTxMaW5lQ2FwVHlwZT4oJ3N0cm9rZVN0eWxlTGluZUNhcFR5cGUnLCAnYnV0dCcsIHtcclxuXHRidXR0OiAnc3Ryb2tlU3R5bGVCdXR0Q2FwJyxcclxuXHRyb3VuZDogJ3N0cm9rZVN0eWxlUm91bmRDYXAnLFxyXG5cdHNxdWFyZTogJ3N0cm9rZVN0eWxlU3F1YXJlQ2FwJyxcclxufSk7XHJcblxyXG5leHBvcnQgY29uc3Qgc3Ryb2tlU3R5bGVMaW5lSm9pblR5cGUgPSBjcmVhdGVFbnVtPExpbmVKb2luVHlwZT4oJ3N0cm9rZVN0eWxlTGluZUpvaW5UeXBlJywgJ21pdGVyJywge1xyXG5cdG1pdGVyOiAnc3Ryb2tlU3R5bGVNaXRlckpvaW4nLFxyXG5cdHJvdW5kOiAnc3Ryb2tlU3R5bGVSb3VuZEpvaW4nLFxyXG5cdGJldmVsOiAnc3Ryb2tlU3R5bGVCZXZlbEpvaW4nLFxyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBzdHJva2VTdHlsZUxpbmVBbGlnbm1lbnQgPSBjcmVhdGVFbnVtPExpbmVBbGlnbm1lbnQ+KCdzdHJva2VTdHlsZUxpbmVBbGlnbm1lbnQnLCAnaW5zaWRlJywge1xyXG5cdGluc2lkZTogJ3N0cm9rZVN0eWxlQWxpZ25JbnNpZGUnLFxyXG5cdGNlbnRlcjogJ3N0cm9rZVN0eWxlQWxpZ25DZW50ZXInLFxyXG5cdG91dHNpZGU6ICdzdHJva2VTdHlsZUFsaWduT3V0c2lkZScsXHJcbn0pO1xyXG4iXSwic291cmNlUm9vdCI6IkM6XFxQcm9qZWN0c1xcZ2l0aHViXFxhZy1wc2RcXHNyYyJ9
