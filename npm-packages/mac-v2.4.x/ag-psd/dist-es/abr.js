import { BlnM, parseAngle, parsePercent, parseUnitsToNumber, readVersionAndDescriptor } from './descriptor';
import { checkSignature, createReader, readBytes, readDataRLE, readInt16, readInt32, readPascalString, readPattern, readSignature, readUint16, readUint32, readUint8, skipBytes } from './psdReader';
var dynamicsControl = ['off', 'fade', 'pen pressure', 'pen tilt', 'stylus wheel', 'initial direction', 'direction', 'initial rotation', 'rotation'];
function parseDynamics(desc) {
    return {
        control: dynamicsControl[desc.bVTy],
        steps: desc.fStp,
        jitter: parsePercent(desc.jitter),
        minimum: parsePercent(desc['Mnm ']),
    };
}
function parseBrushShape(desc) {
    var shape = {
        size: parseUnitsToNumber(desc.Dmtr, 'Pixels'),
        angle: parseAngle(desc.Angl),
        roundness: parsePercent(desc.Rndn),
        spacingOn: desc.Intr,
        spacing: parsePercent(desc.Spcn),
        flipX: desc.flipX,
        flipY: desc.flipY,
    };
    if (desc['Nm  '])
        shape.name = desc['Nm  '];
    if (desc.Hrdn)
        shape.hardness = parsePercent(desc.Hrdn);
    if (desc.sampledData)
        shape.sampledData = desc.sampledData;
    return shape;
}
export function readAbr(buffer, options) {
    var _a, _b, _c, _d;
    if (options === void 0) { options = {}; }
    var reader = createReader(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    var version = readInt16(reader);
    var samples = [];
    var brushes = [];
    var patterns = [];
    if (version === 1 || version === 2) {
        throw new Error("Unsupported ABR version (".concat(version, ")")); // TODO: ...
    }
    else if (version === 6 || version === 7 || version === 9 || version === 10) {
        var minorVersion = readInt16(reader);
        if (minorVersion !== 1 && minorVersion !== 2)
            throw new Error('Unsupported ABR minor version');
        while (reader.offset < reader.view.byteLength) {
            checkSignature(reader, '8BIM');
            var type = readSignature(reader);
            var size = readUint32(reader);
            var end = reader.offset + size;
            switch (type) {
                case 'samp': {
                    while (reader.offset < end) {
                        var brushLength = readUint32(reader);
                        while (brushLength & 3)
                            brushLength++; // pad to 4 byte alignment
                        var brushEnd = reader.offset + brushLength;
                        var id = readPascalString(reader, 1);
                        // v1 - Skip the Int16 bounds rectangle and the unknown Int16.
                        // v2 - Skip the unknown bytes.
                        skipBytes(reader, minorVersion === 1 ? 10 : 264);
                        var y = readInt32(reader);
                        var x = readInt32(reader);
                        var h = readInt32(reader) - y;
                        var w = readInt32(reader) - x;
                        if (w <= 0 || h <= 0)
                            throw new Error('Invalid bounds');
                        var depth = readInt16(reader);
                        var compression = readUint8(reader); // 0 - raw, 1 - RLE
                        var alpha = new Uint8Array(w * h);
                        if (depth === 8) {
                            if (compression === 0) {
                                alpha.set(readBytes(reader, alpha.byteLength));
                            }
                            else if (compression === 1) {
                                readDataRLE(reader, { width: w, height: h, data: alpha }, w, h, 1, [0], false);
                            }
                            else {
                                throw new Error('Invalid compression');
                            }
                        }
                        else if (depth === 16) {
                            if (compression === 0) {
                                for (var i = 0; i < alpha.byteLength; i++) {
                                    alpha[i] = readUint16(reader) >> 8; // convert to 8bit values
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
                    var desc = readVersionAndDescriptor(reader);
                    // console.log(require('util').inspect(desc, false, 99, true));
                    for (var _i = 0, _e = desc.Brsh; _i < _e.length; _i++) {
                        var brush = _e[_i];
                        var b = {
                            name: brush['Nm  '],
                            shape: parseBrushShape(brush.Brsh),
                            spacing: parsePercent(brush.Spcn),
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
                                tiltScale: parsePercent(brush.tiltScale),
                                sizeDynamics: parseDynamics(brush.szVr),
                                angleDynamics: parseDynamics(brush.angleDynamics),
                                roundnessDynamics: parseDynamics(brush.roundnessDynamics),
                                flipX: brush.flipX,
                                flipY: brush.flipY,
                                brushProjection: brush.brushProjection,
                                minimumDiameter: parsePercent(brush.minimumDiameter),
                                minimumRoundness: parsePercent(brush.minimumRoundness),
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
                                blendMode: BlnM.decode(brush.textureBlendMode),
                                depth: parsePercent(brush.textureDepth),
                                depthMinimum: parsePercent(brush.minimumDepth),
                                depthDynamics: parseDynamics(brush.textureDepthDynamics),
                                scale: parsePercent(brush.textureScale),
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
                                blendMode: BlnM.decode(db.BlnM),
                                useScatter: db.useScatter,
                                spacing: parsePercent(db.Spcn),
                                count: db['Cnt '],
                                bothAxes: db.bothAxes,
                                countDynamics: parseDynamics(db.countDynamics),
                                scatterDynamics: parseDynamics(db.scatterDynamics),
                            };
                        }
                        if (brush.useColorDynamics) {
                            b.colorDynamics = {
                                foregroundBackground: parseDynamics(brush.clVr),
                                hue: parsePercent(brush['H   ']),
                                saturation: parsePercent(brush.Strt),
                                brightness: parsePercent(brush.Brgh),
                                purity: parsePercent(brush.purity),
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
                                pressure: parsePercent(brush.brushPosePressure),
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
                                mode: BlnM.decode(to['Md  '] || 'BlnM.Nrml'),
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
                        patterns.push(readPattern(reader));
                        reader.offset = end;
                    }
                    break;
                }
                case 'phry': {
                    // TODO: what is this ?
                    var desc = readVersionAndDescriptor(reader);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFDLGtCQUFrQixFQUFFO3dCQUMvQixJQUFJLE1BQUEsSUFBSSxDQUFDLFNBQVMsMENBQUUsTUFBTSxFQUFFOzRCQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixFQUFFLElBQUksQ0FBQyxDQUFDO3lCQUM1QztxQkFDRDtvQkFDRCxNQUFNO2lCQUNOO2dCQUNEO29CQUNDLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQXVCLElBQUksQ0FBRSxDQUFDLENBQUM7YUFDaEQ7WUFFRCxtQkFBbUI7WUFDbkIsT0FBTyxJQUFJLEdBQUcsQ0FBQyxFQUFFO2dCQUNoQixNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksRUFBRSxDQUFDO2FBQ1A7U0FDRDtLQUNEO1NBQU07UUFDTixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUE0QixPQUFPLE1BQUcsQ0FBQyxDQUFDO0tBQ3hEO0lBRUQsT0FBTyxFQUFFLE9BQU8sU0FBQSxFQUFFLFFBQVEsVUFBQSxFQUFFLE9BQU8sU0FBQSxFQUFFLENBQUM7QUFDdkMsQ0FBQyIsImZpbGUiOiJhYnIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCbG5NLCBEZXNjcmlwdG9yVW5pdHNWYWx1ZSwgcGFyc2VBbmdsZSwgcGFyc2VQZXJjZW50LCBwYXJzZVVuaXRzVG9OdW1iZXIsIHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvciB9IGZyb20gJy4vZGVzY3JpcHRvcic7XHJcbmltcG9ydCB7IEJsZW5kTW9kZSwgUGF0dGVybkluZm8gfSBmcm9tICcuL3BzZCc7XHJcbmltcG9ydCB7XHJcblx0Y2hlY2tTaWduYXR1cmUsIGNyZWF0ZVJlYWRlciwgcmVhZEJ5dGVzLCByZWFkRGF0YVJMRSwgcmVhZEludDE2LCByZWFkSW50MzIsIHJlYWRQYXNjYWxTdHJpbmcsIHJlYWRQYXR0ZXJuLFxyXG5cdHJlYWRTaWduYXR1cmUsIHJlYWRVaW50MTYsIHJlYWRVaW50MzIsIHJlYWRVaW50OCwgc2tpcEJ5dGVzXHJcbn0gZnJvbSAnLi9wc2RSZWFkZXInO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBBYnIge1xyXG5cdGJydXNoZXM6IEJydXNoW107XHJcblx0c2FtcGxlczogU2FtcGxlSW5mb1tdO1xyXG5cdHBhdHRlcm5zOiBQYXR0ZXJuSW5mb1tdO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNhbXBsZUluZm8ge1xyXG5cdGlkOiBzdHJpbmc7XHJcblx0Ym91bmRzOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyB3OiBudW1iZXI7IGg6IG51bWJlcjsgfTtcclxuXHRhbHBoYTogVWludDhBcnJheTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBCcnVzaER5bmFtaWNzIHtcclxuXHRjb250cm9sOiAnb2ZmJyB8ICdmYWRlJyB8ICdwZW4gcHJlc3N1cmUnIHwgJ3BlbiB0aWx0JyB8ICdzdHlsdXMgd2hlZWwnIHwgJ2luaXRpYWwgZGlyZWN0aW9uJyB8ICdkaXJlY3Rpb24nIHwgJ2luaXRpYWwgcm90YXRpb24nIHwgJ3JvdGF0aW9uJztcclxuXHRzdGVwczogbnVtYmVyOyAvLyBmb3IgZmFkZVxyXG5cdGppdHRlcjogbnVtYmVyO1xyXG5cdG1pbmltdW06IG51bWJlcjtcclxufVxyXG5cclxuY29uc3QgZHluYW1pY3NDb250cm9sID0gWydvZmYnLCAnZmFkZScsICdwZW4gcHJlc3N1cmUnLCAncGVuIHRpbHQnLCAnc3R5bHVzIHdoZWVsJywgJ2luaXRpYWwgZGlyZWN0aW9uJywgJ2RpcmVjdGlvbicsICdpbml0aWFsIHJvdGF0aW9uJywgJ3JvdGF0aW9uJ107XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEJydXNoU2hhcGUge1xyXG5cdG5hbWU/OiBzdHJpbmc7XHJcblx0c2l6ZTogbnVtYmVyO1xyXG5cdGFuZ2xlOiBudW1iZXI7XHJcblx0cm91bmRuZXNzOiBudW1iZXI7XHJcblx0aGFyZG5lc3M/OiBudW1iZXI7XHJcblx0c3BhY2luZ09uOiBib29sZWFuO1xyXG5cdHNwYWNpbmc6IG51bWJlcjtcclxuXHRmbGlwWDogYm9vbGVhbjtcclxuXHRmbGlwWTogYm9vbGVhbjtcclxuXHRzYW1wbGVkRGF0YT86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBCcnVzaCB7XHJcblx0bmFtZTogc3RyaW5nO1xyXG5cdHNoYXBlOiBCcnVzaFNoYXBlO1xyXG5cdHNoYXBlRHluYW1pY3M/OiB7XHJcblx0XHRzaXplRHluYW1pY3M6IEJydXNoRHluYW1pY3M7XHJcblx0XHRtaW5pbXVtRGlhbWV0ZXI6IG51bWJlcjtcclxuXHRcdHRpbHRTY2FsZTogbnVtYmVyO1xyXG5cdFx0YW5nbGVEeW5hbWljczogQnJ1c2hEeW5hbWljczsgLy8gaml0dGVyIDAtMSAtPiAwLTM2MCBkZWcgP1xyXG5cdFx0cm91bmRuZXNzRHluYW1pY3M6IEJydXNoRHluYW1pY3M7XHJcblx0XHRtaW5pbXVtUm91bmRuZXNzOiBudW1iZXI7XHJcblx0XHRmbGlwWDogYm9vbGVhbjtcclxuXHRcdGZsaXBZOiBib29sZWFuO1xyXG5cdFx0YnJ1c2hQcm9qZWN0aW9uOiBib29sZWFuO1xyXG5cdH07XHJcblx0c2NhdHRlcj86IHtcclxuXHRcdGJvdGhBeGVzOiBib29sZWFuO1xyXG5cdFx0c2NhdHRlckR5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdFx0Y291bnREeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdGNvdW50OiBudW1iZXI7XHJcblx0fTtcclxuXHR0ZXh0dXJlPzoge1xyXG5cdFx0aWQ6IHN0cmluZztcclxuXHRcdG5hbWU6IHN0cmluZztcclxuXHRcdGludmVydDogYm9vbGVhbjtcclxuXHRcdHNjYWxlOiBudW1iZXI7XHJcblx0XHRicmlnaHRuZXNzOiBudW1iZXI7XHJcblx0XHRjb250cmFzdDogbnVtYmVyO1xyXG5cdFx0YmxlbmRNb2RlOiBCbGVuZE1vZGU7XHJcblx0XHRkZXB0aDogbnVtYmVyO1xyXG5cdFx0ZGVwdGhNaW5pbXVtOiBudW1iZXI7XHJcblx0XHRkZXB0aER5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdH07XHJcblx0ZHVhbEJydXNoPzoge1xyXG5cdFx0ZmxpcDogYm9vbGVhbjtcclxuXHRcdHNoYXBlOiBCcnVzaFNoYXBlO1xyXG5cdFx0YmxlbmRNb2RlOiBCbGVuZE1vZGU7XHJcblx0XHR1c2VTY2F0dGVyOiBib29sZWFuO1xyXG5cdFx0c3BhY2luZzogbnVtYmVyO1xyXG5cdFx0Y291bnQ6IG51bWJlcjtcclxuXHRcdGJvdGhBeGVzOiBib29sZWFuO1xyXG5cdFx0Y291bnREeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdHNjYXR0ZXJEeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHR9O1xyXG5cdGNvbG9yRHluYW1pY3M/OiB7XHJcblx0XHRmb3JlZ3JvdW5kQmFja2dyb3VuZDogQnJ1c2hEeW5hbWljcztcclxuXHRcdGh1ZTogbnVtYmVyO1xyXG5cdFx0c2F0dXJhdGlvbjogbnVtYmVyO1xyXG5cdFx0YnJpZ2h0bmVzczogbnVtYmVyO1xyXG5cdFx0cHVyaXR5OiBudW1iZXI7XHJcblx0XHRwZXJUaXA6IGJvb2xlYW47XHJcblx0fTtcclxuXHR0cmFuc2Zlcj86IHtcclxuXHRcdGZsb3dEeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdG9wYWNpdHlEeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdHdldG5lc3NEeW5hbWljczogQnJ1c2hEeW5hbWljcztcclxuXHRcdG1peER5bmFtaWNzOiBCcnVzaER5bmFtaWNzO1xyXG5cdH07XHJcblx0YnJ1c2hQb3NlPzoge1xyXG5cdFx0b3ZlcnJpZGVBbmdsZTogYm9vbGVhbjtcclxuXHRcdG92ZXJyaWRlVGlsdFg6IGJvb2xlYW47XHJcblx0XHRvdmVycmlkZVRpbHRZOiBib29sZWFuO1xyXG5cdFx0b3ZlcnJpZGVQcmVzc3VyZTogYm9vbGVhbjtcclxuXHRcdHByZXNzdXJlOiBudW1iZXI7XHJcblx0XHR0aWx0WDogbnVtYmVyO1xyXG5cdFx0dGlsdFk6IG51bWJlcjtcclxuXHRcdGFuZ2xlOiBudW1iZXI7XHJcblx0fTtcclxuXHRub2lzZTogYm9vbGVhbjtcclxuXHR3ZXRFZGdlczogYm9vbGVhbjtcclxuXHQvLyBUT0RPOiBidWlsZC11cFxyXG5cdC8vIFRPRE86IHNtb290aGluZ1xyXG5cdHByb3RlY3RUZXh0dXJlPzogYm9vbGVhbjtcclxuXHRzcGFjaW5nOiBudW1iZXI7XHJcblx0YnJ1c2hHcm91cD86IHVuZGVmaW5lZDsgLy8gP1xyXG5cdGludGVycHJldGF0aW9uPzogYm9vbGVhbjsgLy8gP1xyXG5cdHVzZUJydXNoU2l6ZTogYm9vbGVhbjsgLy8gP1xyXG5cdHRvb2xPcHRpb25zPzoge1xyXG5cdFx0YnJ1c2hQcmVzZXQ6IGJvb2xlYW47XHJcblx0XHRmbG93OiBudW1iZXI7IC8vIDAtMTAwXHJcblx0XHRzbW9vdGg6IG51bWJlcjsgLy8gP1xyXG5cdFx0bW9kZTogQmxlbmRNb2RlO1xyXG5cdFx0b3BhY2l0eTogbnVtYmVyOyAvLyAwLTEwMFxyXG5cdFx0c21vb3RoaW5nOiBib29sZWFuO1xyXG5cdFx0c21vb3RoaW5nVmFsdWU6IG51bWJlcjtcclxuXHRcdHNtb290aGluZ1JhZGl1c01vZGU6IGJvb2xlYW47XHJcblx0XHRzbW9vdGhpbmdDYXRjaHVwOiBib29sZWFuO1xyXG5cdFx0c21vb3RoaW5nQ2F0Y2h1cEF0RW5kOiBib29sZWFuO1xyXG5cdFx0c21vb3RoaW5nWm9vbUNvbXBlbnNhdGlvbjogYm9vbGVhbjtcclxuXHRcdHByZXNzdXJlU21vb3RoaW5nOiBib29sZWFuO1xyXG5cdFx0dXNlUHJlc3N1cmVPdmVycmlkZXNTaXplOiBib29sZWFuO1xyXG5cdFx0dXNlUHJlc3N1cmVPdmVycmlkZXNPcGFjaXR5OiBib29sZWFuO1xyXG5cdFx0dXNlTGVnYWN5OiBib29sZWFuO1xyXG5cdFx0Zmxvd0R5bmFtaWNzPzogQnJ1c2hEeW5hbWljcztcclxuXHRcdG9wYWNpdHlEeW5hbWljcz86IEJydXNoRHluYW1pY3M7XHJcblx0XHRzaXplRHluYW1pY3M/OiBCcnVzaER5bmFtaWNzO1xyXG5cdH07XHJcbn1cclxuXHJcbi8vIGludGVybmFsXHJcblxyXG5pbnRlcmZhY2UgUGhyeURlc2NyaXB0b3Ige1xyXG5cdGhpZXJhcmNoeTogKHt9IHwge1xyXG5cdFx0J05tICAnOiBzdHJpbmc7XHJcblx0XHR6dWlkOiBzdHJpbmc7XHJcblx0fSlbXTtcclxufVxyXG5cclxuaW50ZXJmYWNlIER5bmFtaWNzRGVzY3JpcHRvciB7XHJcblx0YlZUeTogbnVtYmVyO1xyXG5cdGZTdHA6IG51bWJlcjtcclxuXHRqaXR0ZXI6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdCdNbm0gJzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcbn1cclxuXHJcbmludGVyZmFjZSBCcnVzaFNoYXBlRGVzY3JpcHRvciB7XHJcblx0RG10cjogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0QW5nbDogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0Um5kbjogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0J05tICAnPzogc3RyaW5nO1xyXG5cdFNwY246IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdEludHI6IGJvb2xlYW47XHJcblx0SHJkbj86IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdGZsaXBYOiBib29sZWFuO1xyXG5cdGZsaXBZOiBib29sZWFuO1xyXG5cdHNhbXBsZWREYXRhPzogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgRGVzY0Rlc2NyaXB0b3Ige1xyXG5cdEJyc2g6IHtcclxuXHRcdCdObSAgJzogc3RyaW5nO1xyXG5cdFx0QnJzaDogQnJ1c2hTaGFwZURlc2NyaXB0b3I7XHJcblx0XHR1c2VUaXBEeW5hbWljczogYm9vbGVhbjtcclxuXHRcdGZsaXBYOiBib29sZWFuO1xyXG5cdFx0ZmxpcFk6IGJvb2xlYW47XHJcblx0XHRicnVzaFByb2plY3Rpb246IGJvb2xlYW47XHJcblx0XHRtaW5pbXVtRGlhbWV0ZXI6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0bWluaW11bVJvdW5kbmVzczogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHR0aWx0U2NhbGU6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0c3pWcjogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0YW5nbGVEeW5hbWljczogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0cm91bmRuZXNzRHluYW1pY3M6IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdHVzZVNjYXR0ZXI6IGJvb2xlYW47XHJcblx0XHRTcGNuOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdCdDbnQgJzogbnVtYmVyO1xyXG5cdFx0Ym90aEF4ZXM6IGJvb2xlYW47XHJcblx0XHRjb3VudER5bmFtaWNzOiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHRzY2F0dGVyRHluYW1pY3M6IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdGR1YWxCcnVzaDogeyB1c2VEdWFsQnJ1c2g6IGZhbHNlOyB9IHwge1xyXG5cdFx0XHR1c2VEdWFsQnJ1c2g6IHRydWU7XHJcblx0XHRcdEZsaXA6IGJvb2xlYW47XHJcblx0XHRcdEJyc2g6IEJydXNoU2hhcGVEZXNjcmlwdG9yO1xyXG5cdFx0XHRCbG5NOiBzdHJpbmc7XHJcblx0XHRcdHVzZVNjYXR0ZXI6IGJvb2xlYW47XHJcblx0XHRcdFNwY246IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0XHQnQ250ICc6IG51bWJlcjtcclxuXHRcdFx0Ym90aEF4ZXM6IGJvb2xlYW47XHJcblx0XHRcdGNvdW50RHluYW1pY3M6IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdFx0c2NhdHRlckR5bmFtaWNzOiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHR9O1xyXG5cdFx0YnJ1c2hHcm91cDogeyB1c2VCcnVzaEdyb3VwOiBmYWxzZTsgfTtcclxuXHRcdHVzZVRleHR1cmU6IGJvb2xlYW47XHJcblx0XHRUeHRDOiBib29sZWFuO1xyXG5cdFx0aW50ZXJwcmV0YXRpb246IGJvb2xlYW47XHJcblx0XHR0ZXh0dXJlQmxlbmRNb2RlOiBzdHJpbmc7XHJcblx0XHR0ZXh0dXJlRGVwdGg6IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0bWluaW11bURlcHRoOiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdHRleHR1cmVEZXB0aER5bmFtaWNzOiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHRUeHRyPzoge1xyXG5cdFx0XHQnTm0gICc6IHN0cmluZztcclxuXHRcdFx0SWRudDogc3RyaW5nO1xyXG5cdFx0fTtcclxuXHRcdHRleHR1cmVTY2FsZTogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRJbnZUOiBib29sZWFuO1xyXG5cdFx0cHJvdGVjdFRleHR1cmU6IGJvb2xlYW47XHJcblx0XHR0ZXh0dXJlQnJpZ2h0bmVzczogbnVtYmVyO1xyXG5cdFx0dGV4dHVyZUNvbnRyYXN0OiBudW1iZXI7XHJcblx0XHR1c2VQYWludER5bmFtaWNzOiBib29sZWFuO1xyXG5cdFx0cHJWcj86IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdG9wVnI/OiBEeW5hbWljc0Rlc2NyaXB0b3I7XHJcblx0XHR3dFZyPzogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0bXhWcj86IER5bmFtaWNzRGVzY3JpcHRvcjtcclxuXHRcdHVzZUNvbG9yRHluYW1pY3M6IGJvb2xlYW47XHJcblx0XHRjbFZyPzogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0J0ggICAnPzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRTdHJ0PzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRCcmdoPzogRGVzY3JpcHRvclVuaXRzVmFsdWU7XHJcblx0XHRwdXJpdHk/OiBEZXNjcmlwdG9yVW5pdHNWYWx1ZTtcclxuXHRcdGNvbG9yRHluYW1pY3NQZXJUaXA/OiB0cnVlO1xyXG5cdFx0V3RkZzogYm9vbGVhbjtcclxuXHRcdE5vc2U6IGJvb2xlYW47XHJcblx0XHQnUnB0ICc6IGJvb2xlYW47XHJcblx0XHR1c2VCcnVzaFNpemU6IGJvb2xlYW47XHJcblx0XHR1c2VCcnVzaFBvc2U6IGJvb2xlYW47XHJcblx0XHRvdmVycmlkZVBvc2VBbmdsZT86IGJvb2xlYW47XHJcblx0XHRvdmVycmlkZVBvc2VUaWx0WD86IGJvb2xlYW47XHJcblx0XHRvdmVycmlkZVBvc2VUaWx0WT86IGJvb2xlYW47XHJcblx0XHRvdmVycmlkZVBvc2VQcmVzc3VyZT86IGJvb2xlYW47XHJcblx0XHRicnVzaFBvc2VQcmVzc3VyZT86IERlc2NyaXB0b3JVbml0c1ZhbHVlO1xyXG5cdFx0YnJ1c2hQb3NlVGlsdFg/OiBudW1iZXI7XHJcblx0XHRicnVzaFBvc2VUaWx0WT86IG51bWJlcjtcclxuXHRcdGJydXNoUG9zZUFuZ2xlPzogbnVtYmVyO1xyXG5cdFx0dG9vbE9wdGlvbnM/OiB7XHJcblx0XHRcdGJydXNoUHJlc2V0OiBib29sZWFuO1xyXG5cdFx0XHRmbG93PzogbnVtYmVyO1xyXG5cdFx0XHRTbW9vPzogbnVtYmVyO1xyXG5cdFx0XHQnTWQgICc6IHN0cmluZztcclxuXHRcdFx0T3BjdD86IG51bWJlcjtcclxuXHRcdFx0c21vb3RoaW5nPzogYm9vbGVhbjtcclxuXHRcdFx0c21vb3RoaW5nVmFsdWU/OiBudW1iZXI7XHJcblx0XHRcdHNtb290aGluZ1JhZGl1c01vZGU/OiBib29sZWFuO1xyXG5cdFx0XHRzbW9vdGhpbmdDYXRjaHVwPzogYm9vbGVhbjtcclxuXHRcdFx0c21vb3RoaW5nQ2F0Y2h1cEF0RW5kPzogYm9vbGVhbjtcclxuXHRcdFx0c21vb3RoaW5nWm9vbUNvbXBlbnNhdGlvbj86IGJvb2xlYW47XHJcblx0XHRcdHByZXNzdXJlU21vb3RoaW5nPzogYm9vbGVhbjtcclxuXHRcdFx0dXNlUHJlc3N1cmVPdmVycmlkZXNTaXplPzogYm9vbGVhbjtcclxuXHRcdFx0dXNlUHJlc3N1cmVPdmVycmlkZXNPcGFjaXR5PzogYm9vbGVhbjtcclxuXHRcdFx0dXNlTGVnYWN5OiBib29sZWFuO1xyXG5cdFx0XHQnUHJzICc/OiBudW1iZXI7IC8vIFRPRE86ID8/P1xyXG5cdFx0XHRNZ2NFPzogYm9vbGVhbjsgLy8gVE9ETzogPz8/XHJcblx0XHRcdEVyc0I/OiBudW1iZXI7IC8vIFRPRE86ID8/P1xyXG5cdFx0XHRwclZyPzogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0XHRvcFZyPzogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0XHRzelZyPzogRHluYW1pY3NEZXNjcmlwdG9yO1xyXG5cdFx0fTtcclxuXHR9W107XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlRHluYW1pY3MoZGVzYzogRHluYW1pY3NEZXNjcmlwdG9yKTogQnJ1c2hEeW5hbWljcyB7XHJcblx0cmV0dXJuIHtcclxuXHRcdGNvbnRyb2w6IGR5bmFtaWNzQ29udHJvbFtkZXNjLmJWVHldIGFzIGFueSxcclxuXHRcdHN0ZXBzOiBkZXNjLmZTdHAsXHJcblx0XHRqaXR0ZXI6IHBhcnNlUGVyY2VudChkZXNjLmppdHRlciksXHJcblx0XHRtaW5pbXVtOiBwYXJzZVBlcmNlbnQoZGVzY1snTW5tICddKSxcclxuXHR9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZUJydXNoU2hhcGUoZGVzYzogQnJ1c2hTaGFwZURlc2NyaXB0b3IpOiBCcnVzaFNoYXBlIHtcclxuXHRjb25zdCBzaGFwZTogQnJ1c2hTaGFwZSA9IHtcclxuXHRcdHNpemU6IHBhcnNlVW5pdHNUb051bWJlcihkZXNjLkRtdHIsICdQaXhlbHMnKSxcclxuXHRcdGFuZ2xlOiBwYXJzZUFuZ2xlKGRlc2MuQW5nbCksXHJcblx0XHRyb3VuZG5lc3M6IHBhcnNlUGVyY2VudChkZXNjLlJuZG4pLFxyXG5cdFx0c3BhY2luZ09uOiBkZXNjLkludHIsXHJcblx0XHRzcGFjaW5nOiBwYXJzZVBlcmNlbnQoZGVzYy5TcGNuKSxcclxuXHRcdGZsaXBYOiBkZXNjLmZsaXBYLFxyXG5cdFx0ZmxpcFk6IGRlc2MuZmxpcFksXHJcblx0fTtcclxuXHJcblx0aWYgKGRlc2NbJ05tICAnXSkgc2hhcGUubmFtZSA9IGRlc2NbJ05tICAnXTtcclxuXHRpZiAoZGVzYy5IcmRuKSBzaGFwZS5oYXJkbmVzcyA9IHBhcnNlUGVyY2VudChkZXNjLkhyZG4pO1xyXG5cdGlmIChkZXNjLnNhbXBsZWREYXRhKSBzaGFwZS5zYW1wbGVkRGF0YSA9IGRlc2Muc2FtcGxlZERhdGE7XHJcblxyXG5cdHJldHVybiBzaGFwZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRBYnIoYnVmZmVyOiBBcnJheUJ1ZmZlclZpZXcsIG9wdGlvbnM6IHsgbG9nTWlzc2luZ0ZlYXR1cmVzPzogYm9vbGVhbjsgfSA9IHt9KTogQWJyIHtcclxuXHRjb25zdCByZWFkZXIgPSBjcmVhdGVSZWFkZXIoYnVmZmVyLmJ1ZmZlciwgYnVmZmVyLmJ5dGVPZmZzZXQsIGJ1ZmZlci5ieXRlTGVuZ3RoKTtcclxuXHRjb25zdCB2ZXJzaW9uID0gcmVhZEludDE2KHJlYWRlcik7XHJcblx0Y29uc3Qgc2FtcGxlczogU2FtcGxlSW5mb1tdID0gW107XHJcblx0Y29uc3QgYnJ1c2hlczogQnJ1c2hbXSA9IFtdO1xyXG5cdGNvbnN0IHBhdHRlcm5zOiBQYXR0ZXJuSW5mb1tdID0gW107XHJcblxyXG5cdGlmICh2ZXJzaW9uID09PSAxIHx8IHZlcnNpb24gPT09IDIpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgQUJSIHZlcnNpb24gKCR7dmVyc2lvbn0pYCk7IC8vIFRPRE86IC4uLlxyXG5cdH0gZWxzZSBpZiAodmVyc2lvbiA9PT0gNiB8fCB2ZXJzaW9uID09PSA3IHx8IHZlcnNpb24gPT09IDkgfHwgdmVyc2lvbiA9PT0gMTApIHtcclxuXHRcdGNvbnN0IG1pbm9yVmVyc2lvbiA9IHJlYWRJbnQxNihyZWFkZXIpO1xyXG5cdFx0aWYgKG1pbm9yVmVyc2lvbiAhPT0gMSAmJiBtaW5vclZlcnNpb24gIT09IDIpIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgQUJSIG1pbm9yIHZlcnNpb24nKTtcclxuXHJcblx0XHR3aGlsZSAocmVhZGVyLm9mZnNldCA8IHJlYWRlci52aWV3LmJ5dGVMZW5ndGgpIHtcclxuXHRcdFx0Y2hlY2tTaWduYXR1cmUocmVhZGVyLCAnOEJJTScpO1xyXG5cdFx0XHRjb25zdCB0eXBlID0gcmVhZFNpZ25hdHVyZShyZWFkZXIpIGFzICdzYW1wJyB8ICdkZXNjJyB8ICdwYXR0JyB8ICdwaHJ5JztcclxuXHRcdFx0bGV0IHNpemUgPSByZWFkVWludDMyKHJlYWRlcik7XHJcblx0XHRcdGNvbnN0IGVuZCA9IHJlYWRlci5vZmZzZXQgKyBzaXplO1xyXG5cclxuXHRcdFx0c3dpdGNoICh0eXBlKSB7XHJcblx0XHRcdFx0Y2FzZSAnc2FtcCc6IHtcclxuXHRcdFx0XHRcdHdoaWxlIChyZWFkZXIub2Zmc2V0IDwgZW5kKSB7XHJcblx0XHRcdFx0XHRcdGxldCBicnVzaExlbmd0aCA9IHJlYWRVaW50MzIocmVhZGVyKTtcclxuXHRcdFx0XHRcdFx0d2hpbGUgKGJydXNoTGVuZ3RoICYgMGIxMSkgYnJ1c2hMZW5ndGgrKzsgLy8gcGFkIHRvIDQgYnl0ZSBhbGlnbm1lbnRcclxuXHRcdFx0XHRcdFx0Y29uc3QgYnJ1c2hFbmQgPSByZWFkZXIub2Zmc2V0ICsgYnJ1c2hMZW5ndGg7XHJcblxyXG5cdFx0XHRcdFx0XHRjb25zdCBpZCA9IHJlYWRQYXNjYWxTdHJpbmcocmVhZGVyLCAxKTtcclxuXHJcblx0XHRcdFx0XHRcdC8vIHYxIC0gU2tpcCB0aGUgSW50MTYgYm91bmRzIHJlY3RhbmdsZSBhbmQgdGhlIHVua25vd24gSW50MTYuXHJcblx0XHRcdFx0XHRcdC8vIHYyIC0gU2tpcCB0aGUgdW5rbm93biBieXRlcy5cclxuXHRcdFx0XHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgbWlub3JWZXJzaW9uID09PSAxID8gMTAgOiAyNjQpO1xyXG5cclxuXHRcdFx0XHRcdFx0Y29uc3QgeSA9IHJlYWRJbnQzMihyZWFkZXIpO1xyXG5cdFx0XHRcdFx0XHRjb25zdCB4ID0gcmVhZEludDMyKHJlYWRlcik7XHJcblx0XHRcdFx0XHRcdGNvbnN0IGggPSByZWFkSW50MzIocmVhZGVyKSAtIHk7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHcgPSByZWFkSW50MzIocmVhZGVyKSAtIHg7XHJcblx0XHRcdFx0XHRcdGlmICh3IDw9IDAgfHwgaCA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYm91bmRzJyk7XHJcblxyXG5cdFx0XHRcdFx0XHRjb25zdCBkZXB0aCA9IHJlYWRJbnQxNihyZWFkZXIpO1xyXG5cdFx0XHRcdFx0XHRjb25zdCBjb21wcmVzc2lvbiA9IHJlYWRVaW50OChyZWFkZXIpOyAvLyAwIC0gcmF3LCAxIC0gUkxFXHJcblx0XHRcdFx0XHRcdGNvbnN0IGFscGhhID0gbmV3IFVpbnQ4QXJyYXkodyAqIGgpO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGRlcHRoID09PSA4KSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGNvbXByZXNzaW9uID09PSAwKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRhbHBoYS5zZXQocmVhZEJ5dGVzKHJlYWRlciwgYWxwaGEuYnl0ZUxlbmd0aCkpO1xyXG5cdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoY29tcHJlc3Npb24gPT09IDEpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHJlYWREYXRhUkxFKHJlYWRlciwgeyB3aWR0aDogdywgaGVpZ2h0OiBoLCBkYXRhOiBhbHBoYSB9LCB3LCBoLCAxLCBbMF0sIGZhbHNlKTtcclxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbXByZXNzaW9uJyk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKGRlcHRoID09PSAxNikge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChjb21wcmVzc2lvbiA9PT0gMCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBhbHBoYS5ieXRlTGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0YWxwaGFbaV0gPSByZWFkVWludDE2KHJlYWRlcikgPj4gODsgLy8gY29udmVydCB0byA4Yml0IHZhbHVlc1xyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoY29tcHJlc3Npb24gPT09IDEpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkICgxNmJpdCBSTEUpJyk7IC8vIFRPRE86IC4uLlxyXG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29tcHJlc3Npb24nKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRlcHRoJyk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdHNhbXBsZXMucHVzaCh7IGlkLCBib3VuZHM6IHsgeCwgeSwgdywgaCB9LCBhbHBoYSB9KTtcclxuXHRcdFx0XHRcdFx0cmVhZGVyLm9mZnNldCA9IGJydXNoRW5kO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhc2UgJ2Rlc2MnOiB7XHJcblx0XHRcdFx0XHRjb25zdCBkZXNjOiBEZXNjRGVzY3JpcHRvciA9IHJlYWRWZXJzaW9uQW5kRGVzY3JpcHRvcihyZWFkZXIpO1xyXG5cdFx0XHRcdFx0Ly8gY29uc29sZS5sb2cocmVxdWlyZSgndXRpbCcpLmluc3BlY3QoZGVzYywgZmFsc2UsIDk5LCB0cnVlKSk7XHJcblxyXG5cdFx0XHRcdFx0Zm9yIChjb25zdCBicnVzaCBvZiBkZXNjLkJyc2gpIHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgYjogQnJ1c2ggPSB7XHJcblx0XHRcdFx0XHRcdFx0bmFtZTogYnJ1c2hbJ05tICAnXSxcclxuXHRcdFx0XHRcdFx0XHRzaGFwZTogcGFyc2VCcnVzaFNoYXBlKGJydXNoLkJyc2gpLFxyXG5cdFx0XHRcdFx0XHRcdHNwYWNpbmc6IHBhcnNlUGVyY2VudChicnVzaC5TcGNuKSxcclxuXHRcdFx0XHRcdFx0XHQvLyBUT0RPOiBicnVzaEdyb3VwID8/P1xyXG5cdFx0XHRcdFx0XHRcdHdldEVkZ2VzOiBicnVzaC5XdGRnLFxyXG5cdFx0XHRcdFx0XHRcdG5vaXNlOiBicnVzaC5Ob3NlLFxyXG5cdFx0XHRcdFx0XHRcdC8vIFRPRE86IFR4dEMgPz8/IHNtb290aGluZyAvIGJ1aWxkLXVwID9cclxuXHRcdFx0XHRcdFx0XHQvLyBUT0RPOiAnUnB0ICcgPz8/XHJcblx0XHRcdFx0XHRcdFx0dXNlQnJ1c2hTaXplOiBicnVzaC51c2VCcnVzaFNpemUsIC8vID8/P1xyXG5cdFx0XHRcdFx0XHR9O1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGJydXNoLmludGVycHJldGF0aW9uICE9IG51bGwpIGIuaW50ZXJwcmV0YXRpb24gPSBicnVzaC5pbnRlcnByZXRhdGlvbjtcclxuXHRcdFx0XHRcdFx0aWYgKGJydXNoLnByb3RlY3RUZXh0dXJlICE9IG51bGwpIGIucHJvdGVjdFRleHR1cmUgPSBicnVzaC5wcm90ZWN0VGV4dHVyZTtcclxuXHJcblx0XHRcdFx0XHRcdGlmIChicnVzaC51c2VUaXBEeW5hbWljcykge1xyXG5cdFx0XHRcdFx0XHRcdGIuc2hhcGVEeW5hbWljcyA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdHRpbHRTY2FsZTogcGFyc2VQZXJjZW50KGJydXNoLnRpbHRTY2FsZSksXHJcblx0XHRcdFx0XHRcdFx0XHRzaXplRHluYW1pY3M6IHBhcnNlRHluYW1pY3MoYnJ1c2guc3pWciksXHJcblx0XHRcdFx0XHRcdFx0XHRhbmdsZUR5bmFtaWNzOiBwYXJzZUR5bmFtaWNzKGJydXNoLmFuZ2xlRHluYW1pY3MpLFxyXG5cdFx0XHRcdFx0XHRcdFx0cm91bmRuZXNzRHluYW1pY3M6IHBhcnNlRHluYW1pY3MoYnJ1c2gucm91bmRuZXNzRHluYW1pY3MpLFxyXG5cdFx0XHRcdFx0XHRcdFx0ZmxpcFg6IGJydXNoLmZsaXBYLFxyXG5cdFx0XHRcdFx0XHRcdFx0ZmxpcFk6IGJydXNoLmZsaXBZLFxyXG5cdFx0XHRcdFx0XHRcdFx0YnJ1c2hQcm9qZWN0aW9uOiBicnVzaC5icnVzaFByb2plY3Rpb24sXHJcblx0XHRcdFx0XHRcdFx0XHRtaW5pbXVtRGlhbWV0ZXI6IHBhcnNlUGVyY2VudChicnVzaC5taW5pbXVtRGlhbWV0ZXIpLFxyXG5cdFx0XHRcdFx0XHRcdFx0bWluaW11bVJvdW5kbmVzczogcGFyc2VQZXJjZW50KGJydXNoLm1pbmltdW1Sb3VuZG5lc3MpLFxyXG5cdFx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGlmIChicnVzaC51c2VTY2F0dGVyKSB7XHJcblx0XHRcdFx0XHRcdFx0Yi5zY2F0dGVyID0ge1xyXG5cdFx0XHRcdFx0XHRcdFx0Y291bnQ6IGJydXNoWydDbnQgJ10sXHJcblx0XHRcdFx0XHRcdFx0XHRib3RoQXhlczogYnJ1c2guYm90aEF4ZXMsXHJcblx0XHRcdFx0XHRcdFx0XHRjb3VudER5bmFtaWNzOiBwYXJzZUR5bmFtaWNzKGJydXNoLmNvdW50RHluYW1pY3MpLFxyXG5cdFx0XHRcdFx0XHRcdFx0c2NhdHRlckR5bmFtaWNzOiBwYXJzZUR5bmFtaWNzKGJydXNoLnNjYXR0ZXJEeW5hbWljcyksXHJcblx0XHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGJydXNoLnVzZVRleHR1cmUgJiYgYnJ1c2guVHh0cikge1xyXG5cdFx0XHRcdFx0XHRcdGIudGV4dHVyZSA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdGlkOiBicnVzaC5UeHRyLklkbnQsXHJcblx0XHRcdFx0XHRcdFx0XHRuYW1lOiBicnVzaC5UeHRyWydObSAgJ10sXHJcblx0XHRcdFx0XHRcdFx0XHRibGVuZE1vZGU6IEJsbk0uZGVjb2RlKGJydXNoLnRleHR1cmVCbGVuZE1vZGUpLFxyXG5cdFx0XHRcdFx0XHRcdFx0ZGVwdGg6IHBhcnNlUGVyY2VudChicnVzaC50ZXh0dXJlRGVwdGgpLFxyXG5cdFx0XHRcdFx0XHRcdFx0ZGVwdGhNaW5pbXVtOiBwYXJzZVBlcmNlbnQoYnJ1c2gubWluaW11bURlcHRoKSxcclxuXHRcdFx0XHRcdFx0XHRcdGRlcHRoRHluYW1pY3M6IHBhcnNlRHluYW1pY3MoYnJ1c2gudGV4dHVyZURlcHRoRHluYW1pY3MpLFxyXG5cdFx0XHRcdFx0XHRcdFx0c2NhbGU6IHBhcnNlUGVyY2VudChicnVzaC50ZXh0dXJlU2NhbGUpLFxyXG5cdFx0XHRcdFx0XHRcdFx0aW52ZXJ0OiBicnVzaC5JbnZULFxyXG5cdFx0XHRcdFx0XHRcdFx0YnJpZ2h0bmVzczogYnJ1c2gudGV4dHVyZUJyaWdodG5lc3MsXHJcblx0XHRcdFx0XHRcdFx0XHRjb250cmFzdDogYnJ1c2gudGV4dHVyZUNvbnRyYXN0LFxyXG5cdFx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGNvbnN0IGRiID0gYnJ1c2guZHVhbEJydXNoO1xyXG5cdFx0XHRcdFx0XHRpZiAoZGIgJiYgZGIudXNlRHVhbEJydXNoKSB7XHJcblx0XHRcdFx0XHRcdFx0Yi5kdWFsQnJ1c2ggPSB7XHJcblx0XHRcdFx0XHRcdFx0XHRmbGlwOiBkYi5GbGlwLFxyXG5cdFx0XHRcdFx0XHRcdFx0c2hhcGU6IHBhcnNlQnJ1c2hTaGFwZShkYi5CcnNoKSxcclxuXHRcdFx0XHRcdFx0XHRcdGJsZW5kTW9kZTogQmxuTS5kZWNvZGUoZGIuQmxuTSksXHJcblx0XHRcdFx0XHRcdFx0XHR1c2VTY2F0dGVyOiBkYi51c2VTY2F0dGVyLFxyXG5cdFx0XHRcdFx0XHRcdFx0c3BhY2luZzogcGFyc2VQZXJjZW50KGRiLlNwY24pLFxyXG5cdFx0XHRcdFx0XHRcdFx0Y291bnQ6IGRiWydDbnQgJ10sXHJcblx0XHRcdFx0XHRcdFx0XHRib3RoQXhlczogZGIuYm90aEF4ZXMsXHJcblx0XHRcdFx0XHRcdFx0XHRjb3VudER5bmFtaWNzOiBwYXJzZUR5bmFtaWNzKGRiLmNvdW50RHluYW1pY3MpLFxyXG5cdFx0XHRcdFx0XHRcdFx0c2NhdHRlckR5bmFtaWNzOiBwYXJzZUR5bmFtaWNzKGRiLnNjYXR0ZXJEeW5hbWljcyksXHJcblx0XHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGJydXNoLnVzZUNvbG9yRHluYW1pY3MpIHtcclxuXHRcdFx0XHRcdFx0XHRiLmNvbG9yRHluYW1pY3MgPSB7XHJcblx0XHRcdFx0XHRcdFx0XHRmb3JlZ3JvdW5kQmFja2dyb3VuZDogcGFyc2VEeW5hbWljcyhicnVzaC5jbFZyISksXHJcblx0XHRcdFx0XHRcdFx0XHRodWU6IHBhcnNlUGVyY2VudChicnVzaFsnSCAgICddISksXHJcblx0XHRcdFx0XHRcdFx0XHRzYXR1cmF0aW9uOiBwYXJzZVBlcmNlbnQoYnJ1c2guU3RydCEpLFxyXG5cdFx0XHRcdFx0XHRcdFx0YnJpZ2h0bmVzczogcGFyc2VQZXJjZW50KGJydXNoLkJyZ2ghKSxcclxuXHRcdFx0XHRcdFx0XHRcdHB1cml0eTogcGFyc2VQZXJjZW50KGJydXNoLnB1cml0eSEpLFxyXG5cdFx0XHRcdFx0XHRcdFx0cGVyVGlwOiBicnVzaC5jb2xvckR5bmFtaWNzUGVyVGlwISxcclxuXHRcdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoYnJ1c2gudXNlUGFpbnREeW5hbWljcykge1xyXG5cdFx0XHRcdFx0XHRcdGIudHJhbnNmZXIgPSB7XHJcblx0XHRcdFx0XHRcdFx0XHRmbG93RHluYW1pY3M6IHBhcnNlRHluYW1pY3MoYnJ1c2gucHJWciEpLFxyXG5cdFx0XHRcdFx0XHRcdFx0b3BhY2l0eUR5bmFtaWNzOiBwYXJzZUR5bmFtaWNzKGJydXNoLm9wVnIhKSxcclxuXHRcdFx0XHRcdFx0XHRcdHdldG5lc3NEeW5hbWljczogcGFyc2VEeW5hbWljcyhicnVzaC53dFZyISksXHJcblx0XHRcdFx0XHRcdFx0XHRtaXhEeW5hbWljczogcGFyc2VEeW5hbWljcyhicnVzaC5teFZyISksXHJcblx0XHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGJydXNoLnVzZUJydXNoUG9zZSkge1xyXG5cdFx0XHRcdFx0XHRcdGIuYnJ1c2hQb3NlID0ge1xyXG5cdFx0XHRcdFx0XHRcdFx0b3ZlcnJpZGVBbmdsZTogYnJ1c2gub3ZlcnJpZGVQb3NlQW5nbGUhLFxyXG5cdFx0XHRcdFx0XHRcdFx0b3ZlcnJpZGVUaWx0WDogYnJ1c2gub3ZlcnJpZGVQb3NlVGlsdFghLFxyXG5cdFx0XHRcdFx0XHRcdFx0b3ZlcnJpZGVUaWx0WTogYnJ1c2gub3ZlcnJpZGVQb3NlVGlsdFkhLFxyXG5cdFx0XHRcdFx0XHRcdFx0b3ZlcnJpZGVQcmVzc3VyZTogYnJ1c2gub3ZlcnJpZGVQb3NlUHJlc3N1cmUhLFxyXG5cdFx0XHRcdFx0XHRcdFx0cHJlc3N1cmU6IHBhcnNlUGVyY2VudChicnVzaC5icnVzaFBvc2VQcmVzc3VyZSEpLFxyXG5cdFx0XHRcdFx0XHRcdFx0dGlsdFg6IGJydXNoLmJydXNoUG9zZVRpbHRYISxcclxuXHRcdFx0XHRcdFx0XHRcdHRpbHRZOiBicnVzaC5icnVzaFBvc2VUaWx0WSEsXHJcblx0XHRcdFx0XHRcdFx0XHRhbmdsZTogYnJ1c2guYnJ1c2hQb3NlQW5nbGUhLFxyXG5cdFx0XHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGNvbnN0IHRvID0gYnJ1c2gudG9vbE9wdGlvbnM7XHJcblx0XHRcdFx0XHRcdGlmICh0bykge1xyXG5cdFx0XHRcdFx0XHRcdGIudG9vbE9wdGlvbnMgPSB7XHJcblx0XHRcdFx0XHRcdFx0XHRicnVzaFByZXNldDogdG8uYnJ1c2hQcmVzZXQsXHJcblx0XHRcdFx0XHRcdFx0XHRmbG93OiB0by5mbG93ID8/IDEwMCxcclxuXHRcdFx0XHRcdFx0XHRcdHNtb290aDogdG8uU21vbyA/PyAwLFxyXG5cdFx0XHRcdFx0XHRcdFx0bW9kZTogQmxuTS5kZWNvZGUodG9bJ01kICAnXSB8fCAnQmxuTS5Ocm1sJyksIC8vIHNvbWV0aW1lcyBtb2RlIGlzIG1pc3NpbmdcclxuXHRcdFx0XHRcdFx0XHRcdG9wYWNpdHk6IHRvLk9wY3QgPz8gMTAwLFxyXG5cdFx0XHRcdFx0XHRcdFx0c21vb3RoaW5nOiAhIXRvLnNtb290aGluZyxcclxuXHRcdFx0XHRcdFx0XHRcdHNtb290aGluZ1ZhbHVlOiB0by5zbW9vdGhpbmdWYWx1ZSB8fCAwLFxyXG5cdFx0XHRcdFx0XHRcdFx0c21vb3RoaW5nUmFkaXVzTW9kZTogISF0by5zbW9vdGhpbmdSYWRpdXNNb2RlLFxyXG5cdFx0XHRcdFx0XHRcdFx0c21vb3RoaW5nQ2F0Y2h1cDogISF0by5zbW9vdGhpbmdDYXRjaHVwLFxyXG5cdFx0XHRcdFx0XHRcdFx0c21vb3RoaW5nQ2F0Y2h1cEF0RW5kOiAhIXRvLnNtb290aGluZ0NhdGNodXBBdEVuZCxcclxuXHRcdFx0XHRcdFx0XHRcdHNtb290aGluZ1pvb21Db21wZW5zYXRpb246ICEhdG8uc21vb3RoaW5nWm9vbUNvbXBlbnNhdGlvbixcclxuXHRcdFx0XHRcdFx0XHRcdHByZXNzdXJlU21vb3RoaW5nOiAhIXRvLnByZXNzdXJlU21vb3RoaW5nLFxyXG5cdFx0XHRcdFx0XHRcdFx0dXNlUHJlc3N1cmVPdmVycmlkZXNTaXplOiAhIXRvLnVzZVByZXNzdXJlT3ZlcnJpZGVzU2l6ZSxcclxuXHRcdFx0XHRcdFx0XHRcdHVzZVByZXNzdXJlT3ZlcnJpZGVzT3BhY2l0eTogISF0by51c2VQcmVzc3VyZU92ZXJyaWRlc09wYWNpdHksXHJcblx0XHRcdFx0XHRcdFx0XHR1c2VMZWdhY3k6ICEhdG8udXNlTGVnYWN5LFxyXG5cdFx0XHRcdFx0XHRcdH07XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmICh0by5wclZyKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRiLnRvb2xPcHRpb25zLmZsb3dEeW5hbWljcyA9IHBhcnNlRHluYW1pY3ModG8ucHJWcik7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHRpZiAodG8ub3BWcikge1xyXG5cdFx0XHRcdFx0XHRcdFx0Yi50b29sT3B0aW9ucy5vcGFjaXR5RHluYW1pY3MgPSBwYXJzZUR5bmFtaWNzKHRvLm9wVnIpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgKHRvLnN6VnIpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGIudG9vbE9wdGlvbnMuc2l6ZUR5bmFtaWNzID0gcGFyc2VEeW5hbWljcyh0by5zelZyKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGJydXNoZXMucHVzaChiKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXNlICdwYXR0Jzoge1xyXG5cdFx0XHRcdFx0aWYgKHJlYWRlci5vZmZzZXQgPCBlbmQpIHsgLy8gVE9ETzogY2hlY2sgbXVsdGlwbGUgcGF0dGVybnNcclxuXHRcdFx0XHRcdFx0cGF0dGVybnMucHVzaChyZWFkUGF0dGVybihyZWFkZXIpKTtcclxuXHRcdFx0XHRcdFx0cmVhZGVyLm9mZnNldCA9IGVuZDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXNlICdwaHJ5Jzoge1xyXG5cdFx0XHRcdFx0Ly8gVE9ETzogd2hhdCBpcyB0aGlzID9cclxuXHRcdFx0XHRcdGNvbnN0IGRlc2M6IFBocnlEZXNjcmlwdG9yID0gcmVhZFZlcnNpb25BbmREZXNjcmlwdG9yKHJlYWRlcik7XHJcblx0XHRcdFx0XHRpZiAob3B0aW9ucy5sb2dNaXNzaW5nRmVhdHVyZXMpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGRlc2MuaGllcmFyY2h5Py5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygndW5oYW5kbGVkIHBocnkgc2VjdGlvbicsIGRlc2MpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBicnVzaCB0eXBlOiAke3R5cGV9YCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIGFsaWduIHRvIDQgYnl0ZXNcclxuXHRcdFx0d2hpbGUgKHNpemUgJSA0KSB7XHJcblx0XHRcdFx0cmVhZGVyLm9mZnNldCsrO1xyXG5cdFx0XHRcdHNpemUrKztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0gZWxzZSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIEFCUiB2ZXJzaW9uICgke3ZlcnNpb259KWApO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHsgc2FtcGxlcywgcGF0dGVybnMsIGJydXNoZXMgfTtcclxufVxyXG4iXSwic291cmNlUm9vdCI6IkM6XFxQcm9qZWN0c1xcZ2l0aHViXFxhZy1wc2RcXHNyYyJ9
