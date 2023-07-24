"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAbr = void 0;
var descriptor_1 = require("./descriptor");
var psdReader_1 = require("./psdReader");
var dynamicsControl = ['off', 'fade', 'pen pressure', 'pen tilt', 'stylus wheel', 'initial direction', 'direction', 'initial rotation', 'rotation'];
function parseDynamics(desc) {
    return {
        control: dynamicsControl[desc.bVTy],
        steps: desc.fStp,
        jitter: (0, descriptor_1.parsePercent)(desc.jitter),
        minimum: (0, descriptor_1.parsePercent)(desc['Mnm ']),
    };
}
function parseBrushShape(desc) {
    var shape = {
        size: (0, descriptor_1.parseUnitsToNumber)(desc.Dmtr, 'Pixels'),
        angle: (0, descriptor_1.parseAngle)(desc.Angl),
        roundness: (0, descriptor_1.parsePercent)(desc.Rndn),
        spacingOn: desc.Intr,
        spacing: (0, descriptor_1.parsePercent)(desc.Spcn),
        flipX: desc.flipX,
        flipY: desc.flipY,
    };
    if (desc['Nm  '])
        shape.name = desc['Nm  '];
    if (desc.Hrdn)
        shape.hardness = (0, descriptor_1.parsePercent)(desc.Hrdn);
    if (desc.sampledData)
        shape.sampledData = desc.sampledData;
    return shape;
}
function readAbr(buffer, options) {
    var _a, _b, _c, _d;
    if (options === void 0) { options = {}; }
    var reader = (0, psdReader_1.createReader)(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    var version = (0, psdReader_1.readInt16)(reader);
    var samples = [];
    var brushes = [];
    var patterns = [];
    if (version === 1 || version === 2) {
        throw new Error("Unsupported ABR version (".concat(version, ")")); // TODO: ...
    }
    else if (version === 6 || version === 7 || version === 9 || version === 10) {
        var minorVersion = (0, psdReader_1.readInt16)(reader);
        if (minorVersion !== 1 && minorVersion !== 2)
            throw new Error('Unsupported ABR minor version');
        while (reader.offset < reader.view.byteLength) {
            (0, psdReader_1.checkSignature)(reader, '8BIM');
            var type = (0, psdReader_1.readSignature)(reader);
            var size = (0, psdReader_1.readUint32)(reader);
            var end = reader.offset + size;
            switch (type) {
                case 'samp': {
                    while (reader.offset < end) {
                        var brushLength = (0, psdReader_1.readUint32)(reader);
                        while (brushLength & 3)
                            brushLength++; // pad to 4 byte alignment
                        var brushEnd = reader.offset + brushLength;
                        var id = (0, psdReader_1.readPascalString)(reader, 1);
                        // v1 - Skip the Int16 bounds rectangle and the unknown Int16.
                        // v2 - Skip the unknown bytes.
                        (0, psdReader_1.skipBytes)(reader, minorVersion === 1 ? 10 : 264);
                        var y = (0, psdReader_1.readInt32)(reader);
                        var x = (0, psdReader_1.readInt32)(reader);
                        var h = (0, psdReader_1.readInt32)(reader) - y;
                        var w = (0, psdReader_1.readInt32)(reader) - x;
                        if (w <= 0 || h <= 0)
                            throw new Error('Invalid bounds');
                        var depth = (0, psdReader_1.readInt16)(reader);
                        var compression = (0, psdReader_1.readUint8)(reader); // 0 - raw, 1 - RLE
                        var alpha = new Uint8Array(w * h);
                        if (depth === 8) {
                            if (compression === 0) {
                                alpha.set((0, psdReader_1.readBytes)(reader, alpha.byteLength));
                            }
                            else if (compression === 1) {
                                (0, psdReader_1.readDataRLE)(reader, { width: w, height: h, data: alpha }, w, h, 1, [0], false);
                            }
                            else {
                                throw new Error('Invalid compression');
                            }
                        }
                        else if (depth === 16) {
                            if (compression === 0) {
                                for (var i = 0; i < alpha.byteLength; i++) {
                                    alpha[i] = (0, psdReader_1.readUint16)(reader) >> 8; // convert to 8bit values
                                }
                            }
                            else if (compression === 1) {
                                throw new Error('not implemented (16bit RLE)'); // TODO: ...
                            }
                            else {
                                throw new Error('Invalid compression');
                            }
                        }
                        else {
                            throw new Error('Invalid depth');
                        }
                        samples.push({ id: id, bounds: { x: x, y: y, w: w, h: h }, alpha: alpha });
                        reader.offset = brushEnd;
                    }
                    break;
                }
                case 'desc': {
                    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
                    // console.log(require('util').inspect(desc, false, 99, true));
                    for (var _i = 0, _e = desc.Brsh; _i < _e.length; _i++) {
                        var brush = _e[_i];
                        var b = {
                            name: brush['Nm  '],
                            shape: parseBrushShape(brush.Brsh),
                            spacing: (0, descriptor_1.parsePercent)(brush.Spcn),
                            // TODO: brushGroup ???
                            wetEdges: brush.Wtdg,
                            noise: brush.Nose,
                            // TODO: TxtC ??? smoothing / build-up ?
                            // TODO: 'Rpt ' ???
                            useBrushSize: brush.useBrushSize, // ???
                        };
                        if (brush.interpretation != null)
                            b.interpretation = brush.interpretation;
                        if (brush.protectTexture != null)
                            b.protectTexture = brush.protectTexture;
                        if (brush.useTipDynamics) {
                            b.shapeDynamics = {
                                tiltScale: (0, descriptor_1.parsePercent)(brush.tiltScale),
                                sizeDynamics: parseDynamics(brush.szVr),
                                angleDynamics: parseDynamics(brush.angleDynamics),
                                roundnessDynamics: parseDynamics(brush.roundnessDynamics),
                                flipX: brush.flipX,
                                flipY: brush.flipY,
                                brushProjection: brush.brushProjection,
                                minimumDiameter: (0, descriptor_1.parsePercent)(brush.minimumDiameter),
                                minimumRoundness: (0, descriptor_1.parsePercent)(brush.minimumRoundness),
                            };
                        }
                        if (brush.useScatter) {
                            b.scatter = {
                                count: brush['Cnt '],
                                bothAxes: brush.bothAxes,
                                countDynamics: parseDynamics(brush.countDynamics),
                                scatterDynamics: parseDynamics(brush.scatterDynamics),
                            };
                        }
                        if (brush.useTexture && brush.Txtr) {
                            b.texture = {
                                id: brush.Txtr.Idnt,
                                name: brush.Txtr['Nm  '],
                                blendMode: descriptor_1.BlnM.decode(brush.textureBlendMode),
                                depth: (0, descriptor_1.parsePercent)(brush.textureDepth),
                                depthMinimum: (0, descriptor_1.parsePercent)(brush.minimumDepth),
                                depthDynamics: parseDynamics(brush.textureDepthDynamics),
                                scale: (0, descriptor_1.parsePercent)(brush.textureScale),
                                invert: brush.InvT,
                                brightness: brush.textureBrightness,
                                contrast: brush.textureContrast,
                            };
                        }
                        var db = brush.dualBrush;
                        if (db && db.useDualBrush) {
                            b.dualBrush = {
                                flip: db.Flip,
                                shape: parseBrushShape(db.Brsh),
                                blendMode: descriptor_1.BlnM.decode(db.BlnM),
                                useScatter: db.useScatter,
                                spacing: (0, descriptor_1.parsePercent)(db.Spcn),
                                count: db['Cnt '],
                                bothAxes: db.bothAxes,
                                countDynamics: parseDynamics(db.countDynamics),
                                scatterDynamics: parseDynamics(db.scatterDynamics),
                            };
                        }
                        if (brush.useColorDynamics) {
                            b.colorDynamics = {
                                foregroundBackground: parseDynamics(brush.clVr),
                                hue: (0, descriptor_1.parsePercent)(brush['H   ']),
                                saturation: (0, descriptor_1.parsePercent)(brush.Strt),
                                brightness: (0, descriptor_1.parsePercent)(brush.Brgh),
                                purity: (0, descriptor_1.parsePercent)(brush.purity),
                                perTip: brush.colorDynamicsPerTip,
                            };
                        }
                        if (brush.usePaintDynamics) {
                            b.transfer = {
                                flowDynamics: parseDynamics(brush.prVr),
                                opacityDynamics: parseDynamics(brush.opVr),
                                wetnessDynamics: parseDynamics(brush.wtVr),
                                mixDynamics: parseDynamics(brush.mxVr),
                            };
                        }
                        if (brush.useBrushPose) {
                            b.brushPose = {
                                overrideAngle: brush.overridePoseAngle,
                                overrideTiltX: brush.overridePoseTiltX,
                                overrideTiltY: brush.overridePoseTiltY,
                                overridePressure: brush.overridePosePressure,
                                pressure: (0, descriptor_1.parsePercent)(brush.brushPosePressure),
                                tiltX: brush.brushPoseTiltX,
                                tiltY: brush.brushPoseTiltY,
                                angle: brush.brushPoseAngle,
                            };
                        }
                        var to = brush.toolOptions;
                        if (to) {
                            b.toolOptions = {
                                brushPreset: to.brushPreset,
                                flow: (_a = to.flow) !== null && _a !== void 0 ? _a : 100,
                                smooth: (_b = to.Smoo) !== null && _b !== void 0 ? _b : 0,
                                mode: descriptor_1.BlnM.decode(to['Md  '] || 'BlnM.Nrml'),
                                opacity: (_c = to.Opct) !== null && _c !== void 0 ? _c : 100,
                                smoothing: !!to.smoothing,
                                smoothingValue: to.smoothingValue || 0,
                                smoothingRadiusMode: !!to.smoothingRadiusMode,
                                smoothingCatchup: !!to.smoothingCatchup,
                                smoothingCatchupAtEnd: !!to.smoothingCatchupAtEnd,
                                smoothingZoomCompensation: !!to.smoothingZoomCompensation,
                                pressureSmoothing: !!to.pressureSmoothing,
                                usePressureOverridesSize: !!to.usePressureOverridesSize,
                                usePressureOverridesOpacity: !!to.usePressureOverridesOpacity,
                                useLegacy: !!to.useLegacy,
                            };
                            if (to.prVr) {
                                b.toolOptions.flowDynamics = parseDynamics(to.prVr);
                            }
                            if (to.opVr) {
                                b.toolOptions.opacityDynamics = parseDynamics(to.opVr);
                            }
                            if (to.szVr) {
                                b.toolOptions.sizeDynamics = parseDynamics(to.szVr);
                            }
                        }
                        brushes.push(b);
                    }
                    break;
                }
                case 'patt': {
                    if (reader.offset < end) { // TODO: check multiple patterns
                        patterns.push((0, psdReader_1.readPattern)(reader));
                        reader.offset = end;
                    }
                    break;
                }
                case 'phry': {
                    // TODO: what is this ?
                    var desc = (0, descriptor_1.readVersionAndDescriptor)(reader);
                    if (options.logMissingFeatures) {
                        if ((_d = desc.hierarchy) === null || _d === void 0 ? void 0 : _d.length) {
                            console.log('unhandled phry section', desc);
                        }
                    }
                    break;
                }
                default:
                    throw new Error("Invalid brush type: ".concat(type));
            }
            // align to 4 bytes
            while (size % 4) {
                reader.offset++;
                size++;
            }
        }
    }
    else {
        throw new Error("Unsupported ABR version (".concat(version, ")"));
    }
    return { samples: samples, patterns: patterns, brushes: brushes };
}
exports.readAbr = readAbr;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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O29CQUM5RCxJQUFJLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRTt3QkFDL0IsSUFBSSxNQUFBLElBQUksQ0FBQyxTQUFTLDBDQUFFLE1BQU0sRUFBRTs0QkFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLENBQUMsQ0FBQzt5QkFDNUM7cUJBQ0Q7b0JBQ0QsTUFBTTtpQkFDTjtnQkFDRDtvQkFDQyxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUF1QixJQUFJLENBQUUsQ0FBQyxDQUFDO2FBQ2hEO1lBRUQsbUJBQW1CO1lBQ25CLE9BQU8sSUFBSSxHQUFHLENBQUMsRUFBRTtnQkFDaEIsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNoQixJQUFJLEVBQUUsQ0FBQzthQUNQO1NBQ0Q7S0FDRDtTQUFNO1FBQ04sTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBNEIsT0FBTyxNQUFHLENBQUMsQ0FBQztLQUN4RDtJQUVELE9BQU8sRUFBRSxPQUFPLFNBQUEsRUFBRSxRQUFRLFVBQUEsRUFBRSxPQUFPLFNBQUEsRUFBRSxDQUFDO0FBQ3ZDLENBQUM7QUFwUEQsMEJBb1BDIiwiZmlsZSI6ImFici5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJsbk0sIERlc2NyaXB0b3JVbml0c1ZhbHVlLCBwYXJzZUFuZ2xlLCBwYXJzZVBlcmNlbnQsIHBhcnNlVW5pdHNUb051bWJlciwgcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yIH0gZnJvbSAnLi9kZXNjcmlwdG9yJztcclxuaW1wb3J0IHsgQmxlbmRNb2RlLCBQYXR0ZXJuSW5mbyB9IGZyb20gJy4vcHNkJztcclxuaW1wb3J0IHtcclxuXHRjaGVja1NpZ25hdHVyZSwgY3JlYXRlUmVhZGVyLCByZWFkQnl0ZXMsIHJlYWREYXRhUkxFLCByZWFkSW50MTYsIHJlYWRJbnQzMiwgcmVhZFBhc2NhbFN0cmluZywgcmVhZFBhdHRlcm4sXHJcblx0cmVhZFNpZ25hdHVyZSwgcmVhZFVpbnQxNiwgcmVhZFVpbnQzMiwgcmVhZFVpbnQ4LCBza2lwQnl0ZXNcclxufSBmcm9tICcuL3BzZFJlYWRlcic7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFiciB7XHJcblx0YnJ1c2hlczogQnJ1c2hbXTtcclxuXHRzYW1wbGVzOiBTYW1wbGVJbmZvW107XHJcblx0cGF0dGVybnM6IFBhdHRlcm5JbmZvW107XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2FtcGxlSW5mbyB7XHJcblx0aWQ6IHN0cmluZztcclxuXHRib3VuZHM6IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IHc6IG51bWJlcjsgaDogbnVtYmVyOyB9O1xyXG5cdGFscGhhOiBVaW50OEFycmF5O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEJydXNoRHluYW1pY3Mge1xyXG5cdGNvbnRyb2w6ICdvZmYnIHwgJ2ZhZGUnIHwgJ3BlbiBwcmVzc3VyZScgfCAncGVuIHRpbHQnIHwgJ3N0eWx1cyB3aGVlbCcgfCAnaW5pdGlhbCBkaXJlY3Rpb24nIHwgJ2RpcmVjdGlvbicgfCAnaW5pdGlhbCByb3RhdGlvbicgfCAncm90YXRpb24nO1xyXG5cdHN0ZXBzOiBudW1iZXI7IC8vIGZvciBmYWRlXHJcblx0aml0dGVyOiBudW1iZXI7XHJcblx0bWluaW11bTogbnVtYmVyO1xyXG59XHJcblxyXG5jb25zdCBkeW5hbWljc0NvbnRyb2wgPSBbJ29mZicsICdmYWRlJywgJ3BlbiBwcmVzc3VyZScsICdwZW4gdGlsdCcsICdzdHlsdXMgd2hlZWwnLCAnaW5pdGlhbCBkaXJlY3Rpb24nLCAnZGlyZWN0aW9uJywgJ2luaXRpYWwgcm90YXRpb24nLCAncm90YXRpb24nXTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQnJ1c2hTaGFwZSB7XHJcblx0bmFtZT86IHN0cmluZztcclxuXHRzaXplOiBudW1iZXI7XHJcblx0YW5nbGU6IG51bWJlcjtcclxuXHRyb3VuZG5lc3M6IG51bWJlcjtcclxuXHRoYXJkbmVzcz86IG51bWJlcjtcclxuXHRzcGFjaW5nT246IGJvb2xlYW47XHJcblx0c3BhY2luZzogbnVtYmVyO1xyXG5cdGZsaXBYOiBib29sZWFuO1xyXG5cdGZsaXBZOiBib29sZWFuO1xyXG5cdHNhbXBsZWREYXRhPzogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEJydXNoIHtcclxuXHRuYW1lOiBzdHJpbmc7XHJcblx0c2hhcGU6IEJydXNoU2hhcGU7XHJcblx0c2hhcGVEeW5hbWljcz86IHtcclxuXHRcdHNpemVEeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdG1pbmltdW1EaWFtZXRlcjogbnVtYmVyO1xyXG5cdFx0dGlsdFNjYWxlOiBudW1iZXI7XHJcblx0XHRhbmdsZUR5bmFtaWNzOiBCcnVzaER5bmFtaWNzOyAvLyBqaXR0ZXIgMC0xIC0+IDAtMzYwIGRlZyA/XHJcblx0XHRyb3VuZG5lc3NEeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdG1pbmltdW1Sb3VuZG5lc3M6IG51bWJlcjtcclxuXHRcdGZsaXBYOiBib29sZWFuO1xyXG5cdFx0ZmxpcFk6IGJvb2xlYW47XHJcblx0XHRicnVzaFByb2plY3Rpb246IGJvb2xlYW47XHJcblx0fTtcclxuXHRzY2F0dGVyPzoge1xyXG5cdFx0Ym90aEF4ZXM6IGJvb2xlYW47XHJcblx0XHRzY2F0dGVyRHluYW1pY3M6IEJydXNoRHluYW1pY3M7XHJcblx0XHRjb3VudER5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdFx0Y291bnQ6IG51bWJlcjtcclxuXHR9O1xyXG5cdHRleHR1cmU/OiB7XHJcblx0XHRpZDogc3RyaW5nO1xyXG5cdFx0bmFtZTogc3RyaW5nO1xyXG5cdFx0aW52ZXJ0OiBib29sZWFuO1xyXG5cdFx0c2NhbGU6IG51bWJlcjtcclxuXHRcdGJyaWdodG5lc3M6IG51bWJlcjtcclxuXHRcdGNvbnRyYXN0OiBudW1iZXI7XHJcblx0XHRibGVuZE1vZGU6IEJsZW5kTW9kZTtcclxuXHRcdGRlcHRoOiBudW1iZXI7XHJcblx0XHRkZXB0aE1pbmltdW06IG51bWJlcjtcclxuXHRcdGRlcHRoRHluYW1pY3M6IEJydXNoRHluYW1pY3M7XHJcblx0fTtcclxuXHRkdWFsQnJ1c2g/OiB7XHJcblx0XHRmbGlwOiBib29sZWFuO1xyXG5cdFx0c2hhcGU6IEJydXNoU2hhcGU7XHJcblx0XHRibGVuZE1vZGU6IEJsZW5kTW9kZTtcclxuXHRcdHVzZVNjYXR0ZXI6IGJvb2xlYW47XHJcblx0XHRzcGFjaW5nOiBudW1iZXI7XHJcblx0XHRjb3VudDogbnVtYmVyO1xyXG5cdFx0Ym90aEF4ZXM6IGJvb2xlYW47XHJcblx0XHRjb3VudER5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdFx0c2NhdHRlckR5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdH07XHJcblx0Y29sb3JEeW5hbWljcz86IHtcclxuXHRcdGZvcmVncm91bmRCYWNrZ3JvdW5kOiBCcnVzaER5bmFtaWNzO1xyXG5cdFx0aHVlOiBudW1iZXI7XHJcblx0XHRzYXR1cmF0aW9uOiBudW1iZXI7XHJcblx0XHRicmlnaHRuZXNzOiBudW1iZXI7XHJcblx0XHRwdXJpdHk6IG51bWJlcjtcclxuXHRcdHBlclRpcDogYm9vbGVhbjtcclxuXHR9O1xyXG5cdHRyYW5zZmVyPzoge1xyXG5cdFx0Zmxvd0R5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdFx0b3BhY2l0eUR5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdFx0d2V0bmVzc0R5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdFx0bWl4RHluYW1pY3M6IEJydXNoRHluYW1pY3M7XHJcblx0fTtcclxuXHRicnVzaFBvc2U/OiB7XHJcblx0XHRvdmVycmlkZUFuZ2xlOiBib29sZWFuO1xyXG5cdFx0b3ZlcnJpZGVUaWx0WDogYm9vbGVhbjtcclxuXHRcdG92ZXJyaWRlVGlsdFk6IGJvb2xlYW47XHJcblx0XHRvdmVycmlkZVByZXNzdXJlOiBib29sZWFuO1xyXG5cdFx0cHJlc3N1cmU6IG51bWJlcjtcclxuXHRcdHRpbHRYOiBudW1iZXI7XHJcblx0XHR0aWx0WTogbnVtYmVyO1xyXG5cdFx0YW5nbGU6IG51bWJlcjtcclxuXHR9O1xyXG5cdG5vaXNlOiBib29sZWFuO1xyXG5cdHdldEVkZ2VzOiBib29sZWFuO1xyXG5cdC8vIFRPRE86IGJ1aWxkLXVwXHJcblx0Ly8gVE9ETzogc21vb3RoaW5nXHJcblx0cHJvdGVjdFRleHR1cmU/OiBib29sZWFuO1xyXG5cdHNwYWNpbmc6IG51bWJlcjtcclxuXHRicnVzaEdyb3VwPzogdW5kZWZpbmVkOyAvLyA/XHJcblx0aW50ZXJwcmV0YXRpb24/OiBib29sZWFuOyAvLyA/XHJcblx0dXNlQnJ1c2hTaXplOiBib29sZWFuOyAvLyA/XHJcblx0dG9vbE9wdGlvbnM/OiB7XHJcblx0XHRicnVzaFByZXNldDogYm9vbGVhbjtcclxuXHRcdGZsb3c6IG51bWJlcjsgLy8gMC0xMDBcclxuXHRcdHNtb290aDogbnVtYmVyOyAvLyA/XHJcblx0XHRtb2RlOiBCbGVuZE1vZGU7XHJcblx0XHRvcGFjaXR5OiBudW1iZXI7IC8vIDAtMTAwXHJcblx0XHRzbW9vdGhpbmc6IGJvb2xlYW47XHJcblx0XHRzbW9vdGhpbmdWYWx1ZTogbnVtYmVyO1xyXG5cdFx0c21vb3RoaW5nUmFkaXVzTW9kZTogYm9vbGVhbjtcclxuXHRcdHNtb290aGluZ0NhdGNodXA6IGJvb2xlYW47XHJcblx0XHRzbW9vdGhpbmdDYXRjaHVwQXRFbmQ6IGJvb2xlYW47XHJcblx0XHRzbW9vdGhpbmdab29tQ29tcGVuc2F0aW9uOiBib29sZWFuO1xyXG5cdFx0cHJlc3N1cmVTbW9vdGhpbmc6IGJvb2xlYW47XHJcblx0XHR1c2VQcmVzc3VyZU92ZXJyaWRlc1NpemU6IGJvb2xlYW47XHJcblx0XHR1c2VQcmVzc3VyZU92ZXJyaWRlc09wYWNpdHk6IGJvb2xlYW47XHJcblx0XHR1c2VMZWdhY3k6IGJvb2xlYW47XHJcblx0XHRmbG93RHluYW1pY3M/OiBCcnVzaER5bmFtaWNzO1xyXG5cdFx0b3BhY2l0eUR5bmFtaWNzPzogQnJ1c2hEeW5hbWljcztcclxuXHRcdHNpemVEeW5hbWljcz86IEJydXNoRHluYW1pY3M7XHJcblx0fTtcclxufVxyXG5cclxuLy8gaW50ZXJuYWxcclxuXHJcbmludGVyZmFjZSBQaHJ5RGVzY3JpcHRvciB7XHJcblx0aGllcmFyY2h5OiAoe30gfCB7XHJcblx0XHQnTm0gICc6IHN0cmluZztcclxuXHRcdHp1aWQ6IHN0cmluZztcclxuXHR9KVtdO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgRHluYW1pY3NEZXNjcmlwdG9yIHtcclxuXHRiVlR5OiBudW1iZXI7XHJcblx0ZlN0cDogbnVtYmVyO1xyXG5cdGppdHRlcjogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0J01ubSAnOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxufVxyXG5cclxuaW50ZXJmYWNlIEJydXNoU2hhcGVEZXNjcmlwdG9yIHtcclxuXHREbXRyOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRBbmdsOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRSbmRuOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHQnTm0gICc/OiBzdHJpbmc7XHJcblx0U3BjbjogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0SW50cjogYm9vbGVhbjtcclxuXHRIcmRuPzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0ZmxpcFg6IGJvb2xlYW47XHJcblx0ZmxpcFk6IGJvb2xlYW47XHJcblx0c2FtcGxlZERhdGE/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBEZXNjRGVzY3JpcHRvciB7XHJcblx0QnJzaDoge1xyXG5cdFx0J05tICAnOiBzdHJpbmc7XHJcblx0XHRCcnNoOiBCcnVzaFNoYXBlRGVzY3JpcHRvcjtcclxuXHRcdHVzZVRpcER5bmFtaWNzOiBib29sZWFuO1xyXG5cdFx0ZmxpcFg6IGJvb2xlYW47XHJcblx0XHRmbGlwWTogYm9vbGVhbjtcclxuXHRcdGJydXNoUHJvamVjdGlvbjogYm9vbGVhbjtcclxuXHRcdG1pbmltdW1EaWFtZXRlcjogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRtaW5pbXVtUm91bmRuZXNzOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdHRpbHRTY2FsZTogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRzelZyOiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHRhbmdsZUR5bmFtaWNzOiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHRyb3VuZG5lc3NEeW5hbWljczogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0dXNlU2NhdHRlcjogYm9vbGVhbjtcclxuXHRcdFNwY246IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0J0NudCAnOiBudW1iZXI7XHJcblx0XHRib3RoQXhlczogYm9vbGVhbjtcclxuXHRcdGNvdW50RHluYW1pY3M6IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdHNjYXR0ZXJEeW5hbWljczogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0ZHVhbEJydXNoOiB7IHVzZUR1YWxCcnVzaDogZmFsc2U7IH0gfCB7XHJcblx0XHRcdHVzZUR1YWxCcnVzaDogdHJ1ZTtcclxuXHRcdFx0RmxpcDogYm9vbGVhbjtcclxuXHRcdFx0QnJzaDogQnJ1c2hTaGFwZURlc2NyaXB0b3I7XHJcblx0XHRcdEJsbk06IHN0cmluZztcclxuXHRcdFx0dXNlU2NhdHRlcjogYm9vbGVhbjtcclxuXHRcdFx0U3BjbjogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRcdCdDbnQgJzogbnVtYmVyO1xyXG5cdFx0XHRib3RoQXhlczogYm9vbGVhbjtcclxuXHRcdFx0Y291bnREeW5hbWljczogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0XHRzY2F0dGVyRHluYW1pY3M6IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdH07XHJcblx0XHRicnVzaEdyb3VwOiB7IHVzZUJydXNoR3JvdXA6IGZhbHNlOyB9O1xyXG5cdFx0dXNlVGV4dHVyZTogYm9vbGVhbjtcclxuXHRcdFR4dEM6IGJvb2xlYW47XHJcblx0XHRpbnRlcnByZXRhdGlvbjogYm9vbGVhbjtcclxuXHRcdHRleHR1cmVCbGVuZE1vZGU6IHN0cmluZztcclxuXHRcdHRleHR1cmVEZXB0aDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRtaW5pbXVtRGVwdGg6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0dGV4dHVyZURlcHRoRHluYW1pY3M6IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdFR4dHI/OiB7XHJcblx0XHRcdCdObSAgJzogc3RyaW5nO1xyXG5cdFx0XHRJZG50OiBzdHJpbmc7XHJcblx0XHR9O1xyXG5cdFx0dGV4dHVyZVNjYWxlOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdEludlQ6IGJvb2xlYW47XHJcblx0XHRwcm90ZWN0VGV4dHVyZTogYm9vbGVhbjtcclxuXHRcdHRleHR1cmVCcmlnaHRuZXNzOiBudW1iZXI7XHJcblx0XHR0ZXh0dXJlQ29udHJhc3Q6IG51bWJlcjtcclxuXHRcdHVzZVBhaW50RHluYW1pY3M6IGJvb2xlYW47XHJcblx0XHRwclZyPzogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0b3BWcj86IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdHd0VnI/OiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHRteFZyPzogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0dXNlQ29sb3JEeW5hbWljczogYm9vbGVhbjtcclxuXHRcdGNsVnI/OiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHQnSCAgICc/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdFN0cnQ/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdEJyZ2g/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdHB1cml0eT86IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0Y29sb3JEeW5hbWljc1BlclRpcD86IHRydWU7XHJcblx0XHRXdGRnOiBib29sZWFuO1xyXG5cdFx0Tm9zZTogYm9vbGVhbjtcclxuXHRcdCdScHQgJzogYm9vbGVhbjtcclxuXHRcdHVzZUJydXNoU2l6ZTogYm9vbGVhbjtcclxuXHRcdHVzZUJydXNoUG9zZTogYm9vbGVhbjtcclxuXHRcdG92ZXJyaWRlUG9zZUFuZ2xlPzogYm9vbGVhbjtcclxuXHRcdG92ZXJyaWRlUG9zZVRpbHRYPzogYm9vbGVhbjtcclxuXHRcdG92ZXJyaWRlUG9zZVRpbHRZPzogYm9vbGVhbjtcclxuXHRcdG92ZXJyaWRlUG9zZVByZXNzdXJlPzogYm9vbGVhbjtcclxuXHRcdGJydXNoUG9zZVByZXNzdXJlPzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRicnVzaFBvc2VUaWx0WD86IG51bWJlcjtcclxuXHRcdGJydXNoUG9zZVRpbHRZPzogbnVtYmVyO1xyXG5cdFx0YnJ1c2hQb3NlQW5nbGU/OiBudW1iZXI7XHJcblx0XHR0b29sT3B0aW9ucz86IHtcclxuXHRcdFx0YnJ1c2hQcmVzZXQ6IGJvb2xlYW47XHJcblx0XHRcdGZsb3c/OiBudW1iZXI7XHJcblx0XHRcdFNtb28/OiBudW1iZXI7XHJcblx0XHRcdCdNZCAgJzogc3RyaW5nO1xyXG5cdFx0XHRPcGN0PzogbnVtYmVyO1xyXG5cdFx0XHRzbW9vdGhpbmc/OiBib29sZWFuO1xyXG5cdFx0XHRzbW9vdGhpbmdWYWx1ZT86IG51bWJlcjtcclxuXHRcdFx0c21vb3RoaW5nUmFkaXVzTW9kZT86IGJvb2xlYW47XHJcblx0XHRcdHNtb290aGluZ0NhdGNodXA/OiBib29sZWFuO1xyXG5cdFx0XHRzbW9vdGhpbmdDYXRjaHVwQXRFbmQ/OiBib29sZWFuO1xyXG5cdFx0XHRzbW9vdGhpbmdab29tQ29tcGVuc2F0aW9uPzogYm9vbGVhbjtcclxuXHRcdFx0cHJlc3N1cmVTbW9vdGhpbmc/OiBib29sZWFuO1xyXG5cdFx0XHR1c2VQcmVzc3VyZU92ZXJyaWRlc1NpemU/OiBib29sZWFuO1xyXG5cdFx0XHR1c2VQcmVzc3VyZU92ZXJyaWRlc09wYWNpdHk/OiBib29sZWFuO1xyXG5cdFx0XHR1c2VMZWdhY3k6IGJvb2xlYW47XHJcblx0XHRcdCdQcnMgJz86IG51bWJlcjsgLy8gVE9ETzogPz8/XHJcblx0XHRcdE1nY0U/OiBib29sZWFuOyAvLyBUT0RPOiA/Pz9cclxuXHRcdFx0RXJzQj86IG51bWJlcjsgLy8gVE9ETzogPz8/XHJcblx0XHRcdHByVnI/OiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHRcdG9wVnI/OiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHRcdHN6VnI/OiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHR9O1xyXG5cdH1bXTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VEeW5hbWljcyhkZXNjOiBEeW5hbWljc0Rlc2NyaXB0b3IpOiBCcnVzaER5bmFtaWNzIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0Y29udHJvbDogZHluYW1pY3NDb250cm9sW2Rlc2MuYlZUeV0gYXMgYW55LFxyXG5cdFx0c3RlcHM6IGRlc2MuZlN0cCxcclxuXHRcdGppdHRlcjogcGFyc2VQZXJjZW50KGRlc2Muaml0dGVyKSxcclxuXHRcdG1pbmltdW06IHBhcnNlUGVyY2VudChkZXNjWydNbm0gJ10pLFxyXG5cdH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlQnJ1c2hTaGFwZShkZXNjOiBCcnVzaFNoYXBlRGVzY3JpcHRvcik6IEJydXNoU2hhcGUge1xyXG5cdGNvbnN0IHNoYXBlOiBCcnVzaFNoYXBlID0ge1xyXG5cdFx0c2l6ZTogcGFyc2VVbml0c1RvTnVtYmVyKGRlc2MuRG10ciwgJ1BpeGVscycpLFxyXG5cdFx0YW5nbGU6IHBhcnNlQW5nbGUoZGVzYy5BbmdsKSxcclxuXHRcdHJvdW5kbmVzczogcGFyc2VQZXJjZW50KGRlc2MuUm5kbiksXHJcblx0XHRzcGFjaW5nT246IGRlc2MuSW50cixcclxuXHRcdHNwYWNpbmc6IHBhcnNlUGVyY2VudChkZXNjLlNwY24pLFxyXG5cdFx0ZmxpcFg6IGRlc2MuZmxpcFgsXHJcblx0XHRmbGlwWTogZGVzYy5mbGlwWSxcclxuXHR9O1xyXG5cclxuXHRpZiAoZGVzY1snTm0gICddKSBzaGFwZS5uYW1lID0gZGVzY1snTm0gICddO1xyXG5cdGlmIChkZXNjLkhyZG4pIHNoYXBlLmhhcmRuZXNzID0gcGFyc2VQZXJjZW50KGRlc2MuSHJkbik7XHJcblx0aWYgKGRlc2Muc2FtcGxlZERhdGEpIHNoYXBlLnNhbXBsZWREYXRhID0gZGVzYy5zYW1wbGVkRGF0YTtcclxuXHJcblx0cmV0dXJuIHNoYXBlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVhZEFicihidWZmZXI6IEFycmF5QnVmZmVyVmlldywgb3B0aW9uczogeyBsb2dNaXNzaW5nRmVhdHVyZXM/OiBib29sZWFuOyB9ID0ge30pOiBBYnIge1xyXG5cdGNvbnN0IHJlYWRlciA9IGNyZWF0ZVJlYWRlcihidWZmZXIuYnVmZmVyLCBidWZmZXIuYnl0ZU9mZnNldCwgYnVmZmVyLmJ5dGVMZW5ndGgpO1xyXG5cdGNvbnN0IHZlcnNpb24gPSByZWFkSW50MTYocmVhZGVyKTtcclxuXHRjb25zdCBzYW1wbGVzOiBTYW1wbGVJbmZvW10gPSBbXTtcclxuXHRjb25zdCBicnVzaGVzOiBCcnVzaFtdID0gW107XHJcblx0Y29uc3QgcGF0dGVybnM6IFBhdHRlcm5JbmZvW10gPSBbXTtcclxuXHJcblx0aWYgKHZlcnNpb24gPT09IDEgfHwgdmVyc2lvbiA9PT0gMikge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBBQlIgdmVyc2lvbiAoJHt2ZXJzaW9ufSlgKTsgLy8gVE9ETzogLi4uXHJcblx0fSBlbHNlIGlmICh2ZXJzaW9uID09PSA2IHx8IHZlcnNpb24gPT09IDcgfHwgdmVyc2lvbiA9PT0gOSB8fCB2ZXJzaW9uID09PSAxMCkge1xyXG5cdFx0Y29uc3QgbWlub3JWZXJzaW9uID0gcmVhZEludDE2KHJlYWRlcik7XHJcblx0XHRpZiAobWlub3JWZXJzaW9uICE9PSAxICYmIG1pbm9yVmVyc2lvbiAhPT0gMikgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBBQlIgbWlub3IgdmVyc2lvbicpO1xyXG5cclxuXHRcdHdoaWxlIChyZWFkZXIub2Zmc2V0IDwgcmVhZGVyLnZpZXcuYnl0ZUxlbmd0aCkge1xyXG5cdFx0XHRjaGVja1NpZ25hdHVyZShyZWFkZXIsICc4QklNJyk7XHJcblx0XHRcdGNvbnN0IHR5cGUgPSByZWFkU2lnbmF0dXJlKHJlYWRlcikgYXMgJ3NhbXAnIHwgJ2Rlc2MnIHwgJ3BhdHQnIHwgJ3BocnknO1xyXG5cdFx0XHRsZXQgc2l6ZSA9IHJlYWRVaW50MzIocmVhZGVyKTtcclxuXHRcdFx0Y29uc3QgZW5kID0gcmVhZGVyLm9mZnNldCArIHNpemU7XHJcblxyXG5cdFx0XHRzd2l0Y2ggKHR5cGUpIHtcclxuXHRcdFx0XHRjYXNlICdzYW1wJzoge1xyXG5cdFx0XHRcdFx0d2hpbGUgKHJlYWRlci5vZmZzZXQgPCBlbmQpIHtcclxuXHRcdFx0XHRcdFx0bGV0IGJydXNoTGVuZ3RoID0gcmVhZFVpbnQzMihyZWFkZXIpO1xyXG5cdFx0XHRcdFx0XHR3aGlsZSAoYnJ1c2hMZW5ndGggJiAwYjExKSBicnVzaExlbmd0aCsrOyAvLyBwYWQgdG8gNCBieXRlIGFsaWdubWVudFxyXG5cdFx0XHRcdFx0XHRjb25zdCBicnVzaEVuZCA9IHJlYWRlci5vZmZzZXQgKyBicnVzaExlbmd0aDtcclxuXHJcblx0XHRcdFx0XHRcdGNvbnN0IGlkID0gcmVhZFBhc2NhbFN0cmluZyhyZWFkZXIsIDEpO1xyXG5cclxuXHRcdFx0XHRcdFx0Ly8gdjEgLSBTa2lwIHRoZSBJbnQxNiBib3VuZHMgcmVjdGFuZ2xlIGFuZCB0aGUgdW5rbm93biBJbnQxNi5cclxuXHRcdFx0XHRcdFx0Ly8gdjIgLSBTa2lwIHRoZSB1bmtub3duIGJ5dGVzLlxyXG5cdFx0XHRcdFx0XHRza2lwQnl0ZXMocmVhZGVyLCBtaW5vclZlcnNpb24gPT09IDEgPyAxMCA6IDI2NCk7XHJcblxyXG5cdFx0XHRcdFx0XHRjb25zdCB5ID0gcmVhZEludDMyKHJlYWRlcik7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHggPSByZWFkSW50MzIocmVhZGVyKTtcclxuXHRcdFx0XHRcdFx0Y29uc3QgaCA9IHJlYWRJbnQzMihyZWFkZXIpIC0geTtcclxuXHRcdFx0XHRcdFx0Y29uc3QgdyA9IHJlYWRJbnQzMihyZWFkZXIpIC0geDtcclxuXHRcdFx0XHRcdFx0aWYgKHcgPD0gMCB8fCBoIDw9IDApIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBib3VuZHMnKTtcclxuXHJcblx0XHRcdFx0XHRcdGNvbnN0IGRlcHRoID0gcmVhZEludDE2KHJlYWRlcik7XHJcblx0XHRcdFx0XHRcdGNvbnN0IGNvbXByZXNzaW9uID0gcmVhZFVpbnQ4KHJlYWRlcik7IC8vIDAgLSByYXcsIDEgLSBSTEVcclxuXHRcdFx0XHRcdFx0Y29uc3QgYWxwaGEgPSBuZXcgVWludDhBcnJheSh3ICogaCk7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoZGVwdGggPT09IDgpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoY29tcHJlc3Npb24gPT09IDApIHtcclxuXHRcdFx0XHRcdFx0XHRcdGFscGhhLnNldChyZWFkQnl0ZXMocmVhZGVyLCBhbHBoYS5ieXRlTGVuZ3RoKSk7XHJcblx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmIChjb21wcmVzc2lvbiA9PT0gMSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0cmVhZERhdGFSTEUocmVhZGVyLCB7IHdpZHRoOiB3LCBoZWlnaHQ6IGgsIGRhdGE6IGFscGhhIH0sIHcsIGgsIDEsIFswXSwgZmFsc2UpO1xyXG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29tcHJlc3Npb24nKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoZGVwdGggPT09IDE2KSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGNvbXByZXNzaW9uID09PSAwKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGFscGhhLmJ5dGVMZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRhbHBoYVtpXSA9IHJlYWRVaW50MTYocmVhZGVyKSA+PiA4OyAvLyBjb252ZXJ0IHRvIDhiaXQgdmFsdWVzXHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmIChjb21wcmVzc2lvbiA9PT0gMSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdub3QgaW1wbGVtZW50ZWQgKDE2Yml0IFJMRSknKTsgLy8gVE9ETzogLi4uXHJcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb21wcmVzc2lvbicpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGVwdGgnKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0c2FtcGxlcy5wdXNoKHsgaWQsIGJvdW5kczogeyB4LCB5LCB3LCBoIH0sIGFscGhhIH0pO1xyXG5cdFx0XHRcdFx0XHRyZWFkZXIub2Zmc2V0ID0gYnJ1c2hFbmQ7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FzZSAnZGVzYyc6IHtcclxuXHRcdFx0XHRcdGNvbnN0IGRlc2M6IERlc2NEZXNjcmlwdG9yID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcik7XHJcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhyZXF1aXJlKCd1dGlsJykuaW5zcGVjdChkZXNjLCBmYWxzZSwgOTksIHRydWUpKTtcclxuXHJcblx0XHRcdFx0XHRmb3IgKGNvbnN0IGJydXNoIG9mIGRlc2MuQnJzaCkge1xyXG5cdFx0XHRcdFx0XHRjb25zdCBiOiBCcnVzaCA9IHtcclxuXHRcdFx0XHRcdFx0XHRuYW1lOiBicnVzaFsnTm0gICddLFxyXG5cdFx0XHRcdFx0XHRcdHNoYXBlOiBwYXJzZUJydXNoU2hhcGUoYnJ1c2guQnJzaCksXHJcblx0XHRcdFx0XHRcdFx0c3BhY2luZzogcGFyc2VQZXJjZW50KGJydXNoLlNwY24pLFxyXG5cdFx0XHRcdFx0XHRcdC8vIFRPRE86IGJydXNoR3JvdXAgPz8/XHJcblx0XHRcdFx0XHRcdFx0d2V0RWRnZXM6IGJydXNoLld0ZGcsXHJcblx0XHRcdFx0XHRcdFx0bm9pc2U6IGJydXNoLk5vc2UsXHJcblx0XHRcdFx0XHRcdFx0Ly8gVE9ETzogVHh0QyA/Pz8gc21vb3RoaW5nIC8gYnVpbGQtdXAgP1xyXG5cdFx0XHRcdFx0XHRcdC8vIFRPRE86ICdScHQgJyA/Pz9cclxuXHRcdFx0XHRcdFx0XHR1c2VCcnVzaFNpemU6IGJydXNoLnVzZUJydXNoU2l6ZSwgLy8gPz8/XHJcblx0XHRcdFx0XHRcdH07XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoYnJ1c2guaW50ZXJwcmV0YXRpb24gIT0gbnVsbCkgYi5pbnRlcnByZXRhdGlvbiA9IGJydXNoLmludGVycHJldGF0aW9uO1xyXG5cdFx0XHRcdFx0XHRpZiAoYnJ1c2gucHJvdGVjdFRleHR1cmUgIT0gbnVsbCkgYi5wcm90ZWN0VGV4dHVyZSA9IGJydXNoLnByb3RlY3RUZXh0dXJlO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGJydXNoLnVzZVRpcER5bmFtaWNzKSB7XHJcblx0XHRcdFx0XHRcdFx0Yi5zaGFwZUR5bmFtaWNzID0ge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGlsdFNjYWxlOiBwYXJzZVBlcmNlbnQoYnJ1c2gudGlsdFNjYWxlKSxcclxuXHRcdFx0XHRcdFx0XHRcdHNpemVEeW5hbWljczogcGFyc2VEeW5hbWljcyhicnVzaC5zelZyKSxcclxuXHRcdFx0XHRcdFx0XHRcdGFuZ2xlRHluYW1pY3M6IHBhcnNlRHluYW1pY3MoYnJ1c2guYW5nbGVEeW5hbWljcyksXHJcblx0XHRcdFx0XHRcdFx0XHRyb3VuZG5lc3NEeW5hbWljczogcGFyc2VEeW5hbWljcyhicnVzaC5yb3VuZG5lc3NEeW5hbWljcyksXHJcblx0XHRcdFx0XHRcdFx0XHRmbGlwWDogYnJ1c2guZmxpcFgsXHJcblx0XHRcdFx0XHRcdFx0XHRmbGlwWTogYnJ1c2guZmxpcFksXHJcblx0XHRcdFx0XHRcdFx0XHRicnVzaFByb2plY3Rpb246IGJydXNoLmJydXNoUHJvamVjdGlvbixcclxuXHRcdFx0XHRcdFx0XHRcdG1pbmltdW1EaWFtZXRlcjogcGFyc2VQZXJjZW50KGJydXNoLm1pbmltdW1EaWFtZXRlciksXHJcblx0XHRcdFx0XHRcdFx0XHRtaW5pbXVtUm91bmRuZXNzOiBwYXJzZVBlcmNlbnQoYnJ1c2gubWluaW11bVJvdW5kbmVzcyksXHJcblx0XHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGJydXNoLnVzZVNjYXR0ZXIpIHtcclxuXHRcdFx0XHRcdFx0XHRiLnNjYXR0ZXIgPSB7XHJcblx0XHRcdFx0XHRcdFx0XHRjb3VudDogYnJ1c2hbJ0NudCAnXSxcclxuXHRcdFx0XHRcdFx0XHRcdGJvdGhBeGVzOiBicnVzaC5ib3RoQXhlcyxcclxuXHRcdFx0XHRcdFx0XHRcdGNvdW50RHluYW1pY3M6IHBhcnNlRHluYW1pY3MoYnJ1c2guY291bnREeW5hbWljcyksXHJcblx0XHRcdFx0XHRcdFx0XHRzY2F0dGVyRHluYW1pY3M6IHBhcnNlRHluYW1pY3MoYnJ1c2guc2NhdHRlckR5bmFtaWNzKSxcclxuXHRcdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoYnJ1c2gudXNlVGV4dHVyZSAmJiBicnVzaC5UeHRyKSB7XHJcblx0XHRcdFx0XHRcdFx0Yi50ZXh0dXJlID0ge1xyXG5cdFx0XHRcdFx0XHRcdFx0aWQ6IGJydXNoLlR4dHIuSWRudCxcclxuXHRcdFx0XHRcdFx0XHRcdG5hbWU6IGJydXNoLlR4dHJbJ05tICAnXSxcclxuXHRcdFx0XHRcdFx0XHRcdGJsZW5kTW9kZTogQmxuTS5kZWNvZGUoYnJ1c2gudGV4dHVyZUJsZW5kTW9kZSksXHJcblx0XHRcdFx0XHRcdFx0XHRkZXB0aDogcGFyc2VQZXJjZW50KGJydXNoLnRleHR1cmVEZXB0aCksXHJcblx0XHRcdFx0XHRcdFx0XHRkZXB0aE1pbmltdW06IHBhcnNlUGVyY2VudChicnVzaC5taW5pbXVtRGVwdGgpLFxyXG5cdFx0XHRcdFx0XHRcdFx0ZGVwdGhEeW5hbWljczogcGFyc2VEeW5hbWljcyhicnVzaC50ZXh0dXJlRGVwdGhEeW5hbWljcyksXHJcblx0XHRcdFx0XHRcdFx0XHRzY2FsZTogcGFyc2VQZXJjZW50KGJydXNoLnRleHR1cmVTY2FsZSksXHJcblx0XHRcdFx0XHRcdFx0XHRpbnZlcnQ6IGJydXNoLkludlQsXHJcblx0XHRcdFx0XHRcdFx0XHRicmlnaHRuZXNzOiBicnVzaC50ZXh0dXJlQnJpZ2h0bmVzcyxcclxuXHRcdFx0XHRcdFx0XHRcdGNvbnRyYXN0OiBicnVzaC50ZXh0dXJlQ29udHJhc3QsXHJcblx0XHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0Y29uc3QgZGIgPSBicnVzaC5kdWFsQnJ1c2g7XHJcblx0XHRcdFx0XHRcdGlmIChkYiAmJiBkYi51c2VEdWFsQnJ1c2gpIHtcclxuXHRcdFx0XHRcdFx0XHRiLmR1YWxCcnVzaCA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdGZsaXA6IGRiLkZsaXAsXHJcblx0XHRcdFx0XHRcdFx0XHRzaGFwZTogcGFyc2VCcnVzaFNoYXBlKGRiLkJyc2gpLFxyXG5cdFx0XHRcdFx0XHRcdFx0YmxlbmRNb2RlOiBCbG5NLmRlY29kZShkYi5CbG5NKSxcclxuXHRcdFx0XHRcdFx0XHRcdHVzZVNjYXR0ZXI6IGRiLnVzZVNjYXR0ZXIsXHJcblx0XHRcdFx0XHRcdFx0XHRzcGFjaW5nOiBwYXJzZVBlcmNlbnQoZGIuU3BjbiksXHJcblx0XHRcdFx0XHRcdFx0XHRjb3VudDogZGJbJ0NudCAnXSxcclxuXHRcdFx0XHRcdFx0XHRcdGJvdGhBeGVzOiBkYi5ib3RoQXhlcyxcclxuXHRcdFx0XHRcdFx0XHRcdGNvdW50RHluYW1pY3M6IHBhcnNlRHluYW1pY3MoZGIuY291bnREeW5hbWljcyksXHJcblx0XHRcdFx0XHRcdFx0XHRzY2F0dGVyRHluYW1pY3M6IHBhcnNlRHluYW1pY3MoZGIuc2NhdHRlckR5bmFtaWNzKSxcclxuXHRcdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoYnJ1c2gudXNlQ29sb3JEeW5hbWljcykge1xyXG5cdFx0XHRcdFx0XHRcdGIuY29sb3JEeW5hbWljcyA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdGZvcmVncm91bmRCYWNrZ3JvdW5kOiBwYXJzZUR5bmFtaWNzKGJydXNoLmNsVnIhKSxcclxuXHRcdFx0XHRcdFx0XHRcdGh1ZTogcGFyc2VQZXJjZW50KGJydXNoWydIICAgJ10hKSxcclxuXHRcdFx0XHRcdFx0XHRcdHNhdHVyYXRpb246IHBhcnNlUGVyY2VudChicnVzaC5TdHJ0ISksXHJcblx0XHRcdFx0XHRcdFx0XHRicmlnaHRuZXNzOiBwYXJzZVBlcmNlbnQoYnJ1c2guQnJnaCEpLFxyXG5cdFx0XHRcdFx0XHRcdFx0cHVyaXR5OiBwYXJzZVBlcmNlbnQoYnJ1c2gucHVyaXR5ISksXHJcblx0XHRcdFx0XHRcdFx0XHRwZXJUaXA6IGJydXNoLmNvbG9yRHluYW1pY3NQZXJUaXAhLFxyXG5cdFx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGlmIChicnVzaC51c2VQYWludER5bmFtaWNzKSB7XHJcblx0XHRcdFx0XHRcdFx0Yi50cmFuc2ZlciA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdGZsb3dEeW5hbWljczogcGFyc2VEeW5hbWljcyhicnVzaC5wclZyISksXHJcblx0XHRcdFx0XHRcdFx0XHRvcGFjaXR5RHluYW1pY3M6IHBhcnNlRHluYW1pY3MoYnJ1c2gub3BWciEpLFxyXG5cdFx0XHRcdFx0XHRcdFx0d2V0bmVzc0R5bmFtaWNzOiBwYXJzZUR5bmFtaWNzKGJydXNoLnd0VnIhKSxcclxuXHRcdFx0XHRcdFx0XHRcdG1peER5bmFtaWNzOiBwYXJzZUR5bmFtaWNzKGJydXNoLm14VnIhKSxcclxuXHRcdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoYnJ1c2gudXNlQnJ1c2hQb3NlKSB7XHJcblx0XHRcdFx0XHRcdFx0Yi5icnVzaFBvc2UgPSB7XHJcblx0XHRcdFx0XHRcdFx0XHRvdmVycmlkZUFuZ2xlOiBicnVzaC5vdmVycmlkZVBvc2VBbmdsZSEsXHJcblx0XHRcdFx0XHRcdFx0XHRvdmVycmlkZVRpbHRYOiBicnVzaC5vdmVycmlkZVBvc2VUaWx0WCEsXHJcblx0XHRcdFx0XHRcdFx0XHRvdmVycmlkZVRpbHRZOiBicnVzaC5vdmVycmlkZVBvc2VUaWx0WSEsXHJcblx0XHRcdFx0XHRcdFx0XHRvdmVycmlkZVByZXNzdXJlOiBicnVzaC5vdmVycmlkZVBvc2VQcmVzc3VyZSEsXHJcblx0XHRcdFx0XHRcdFx0XHRwcmVzc3VyZTogcGFyc2VQZXJjZW50KGJydXNoLmJydXNoUG9zZVByZXNzdXJlISksXHJcblx0XHRcdFx0XHRcdFx0XHR0aWx0WDogYnJ1c2guYnJ1c2hQb3NlVGlsdFghLFxyXG5cdFx0XHRcdFx0XHRcdFx0dGlsdFk6IGJydXNoLmJydXNoUG9zZVRpbHRZISxcclxuXHRcdFx0XHRcdFx0XHRcdGFuZ2xlOiBicnVzaC5icnVzaFBvc2VBbmdsZSEsXHJcblx0XHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0Y29uc3QgdG8gPSBicnVzaC50b29sT3B0aW9ucztcclxuXHRcdFx0XHRcdFx0aWYgKHRvKSB7XHJcblx0XHRcdFx0XHRcdFx0Yi50b29sT3B0aW9ucyA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdGJydXNoUHJlc2V0OiB0by5icnVzaFByZXNldCxcclxuXHRcdFx0XHRcdFx0XHRcdGZsb3c6IHRvLmZsb3cgPz8gMTAwLFxyXG5cdFx0XHRcdFx0XHRcdFx0c21vb3RoOiB0by5TbW9vID8/IDAsXHJcblx0XHRcdFx0XHRcdFx0XHRtb2RlOiBCbG5NLmRlY29kZSh0b1snTWQgICddIHx8ICdCbG5NLk5ybWwnKSwgLy8gc29tZXRpbWVzIG1vZGUgaXMgbWlzc2luZ1xyXG5cdFx0XHRcdFx0XHRcdFx0b3BhY2l0eTogdG8uT3BjdCA/PyAxMDAsXHJcblx0XHRcdFx0XHRcdFx0XHRzbW9vdGhpbmc6ICEhdG8uc21vb3RoaW5nLFxyXG5cdFx0XHRcdFx0XHRcdFx0c21vb3RoaW5nVmFsdWU6IHRvLnNtb290aGluZ1ZhbHVlIHx8IDAsXHJcblx0XHRcdFx0XHRcdFx0XHRzbW9vdGhpbmdSYWRpdXNNb2RlOiAhIXRvLnNtb290aGluZ1JhZGl1c01vZGUsXHJcblx0XHRcdFx0XHRcdFx0XHRzbW9vdGhpbmdDYXRjaHVwOiAhIXRvLnNtb290aGluZ0NhdGNodXAsXHJcblx0XHRcdFx0XHRcdFx0XHRzbW9vdGhpbmdDYXRjaHVwQXRFbmQ6ICEhdG8uc21vb3RoaW5nQ2F0Y2h1cEF0RW5kLFxyXG5cdFx0XHRcdFx0XHRcdFx0c21vb3RoaW5nWm9vbUNvbXBlbnNhdGlvbjogISF0by5zbW9vdGhpbmdab29tQ29tcGVuc2F0aW9uLFxyXG5cdFx0XHRcdFx0XHRcdFx0cHJlc3N1cmVTbW9vdGhpbmc6ICEhdG8ucHJlc3N1cmVTbW9vdGhpbmcsXHJcblx0XHRcdFx0XHRcdFx0XHR1c2VQcmVzc3VyZU92ZXJyaWRlc1NpemU6ICEhdG8udXNlUHJlc3N1cmVPdmVycmlkZXNTaXplLFxyXG5cdFx0XHRcdFx0XHRcdFx0dXNlUHJlc3N1cmVPdmVycmlkZXNPcGFjaXR5OiAhIXRvLnVzZVByZXNzdXJlT3ZlcnJpZGVzT3BhY2l0eSxcclxuXHRcdFx0XHRcdFx0XHRcdHVzZUxlZ2FjeTogISF0by51c2VMZWdhY3ksXHJcblx0XHRcdFx0XHRcdFx0fTtcclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKHRvLnByVnIpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGIudG9vbE9wdGlvbnMuZmxvd0R5bmFtaWNzID0gcGFyc2VEeW5hbWljcyh0by5wclZyKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmICh0by5vcFZyKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRiLnRvb2xPcHRpb25zLm9wYWNpdHlEeW5hbWljcyA9IHBhcnNlRHluYW1pY3ModG8ub3BWcik7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHRpZiAodG8uc3pWcikge1xyXG5cdFx0XHRcdFx0XHRcdFx0Yi50b29sT3B0aW9ucy5zaXplRHluYW1pY3MgPSBwYXJzZUR5bmFtaWNzKHRvLnN6VnIpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0YnJ1c2hlcy5wdXNoKGIpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhc2UgJ3BhdHQnOiB7XHJcblx0XHRcdFx0XHRpZiAocmVhZGVyLm9mZnNldCA8IGVuZCkgeyAvLyBUT0RPOiBjaGVjayBtdWx0aXBsZSBwYXR0ZXJuc1xyXG5cdFx0XHRcdFx0XHRwYXR0ZXJucy5wdXNoKHJlYWRQYXR0ZXJuKHJlYWRlcikpO1xyXG5cdFx0XHRcdFx0XHRyZWFkZXIub2Zmc2V0ID0gZW5kO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhc2UgJ3BocnknOiB7XHJcblx0XHRcdFx0XHQvLyBUT0RPOiB3aGF0IGlzIHRoaXMgP1xyXG5cdFx0XHRcdFx0Y29uc3QgZGVzYzogUGhyeURlc2NyaXB0b3IgPSByZWFkVmVyc2lvbkFuZERlc2NyaXB0b3IocmVhZGVyKTtcclxuXHRcdFx0XHRcdGlmIChvcHRpb25zLmxvZ01pc3NpbmdGZWF0dXJlcykge1xyXG5cdFx0XHRcdFx0XHRpZiAoZGVzYy5oaWVyYXJjaHk/Lmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCd1bmhhbmRsZWQgcGhyeSBzZWN0aW9uJywgZGVzYyk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGJydXNoIHR5cGU6ICR7dHlwZX1gKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gYWxpZ24gdG8gNCBieXRlc1xyXG5cdFx0XHR3aGlsZSAoc2l6ZSAlIDQpIHtcclxuXHRcdFx0XHRyZWFkZXIub2Zmc2V0Kys7XHJcblx0XHRcdFx0c2l6ZSsrO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSBlbHNlIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgQUJSIHZlcnNpb24gKCR7dmVyc2lvbn0pYCk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4geyBzYW1wbGVzLCBwYXR0ZXJucywgYnJ1c2hlcyB9O1xyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiQzpcXFByb2plY3RzXFxnaXRodWJcXGFnLXBzZFxcc3JjIn0=
