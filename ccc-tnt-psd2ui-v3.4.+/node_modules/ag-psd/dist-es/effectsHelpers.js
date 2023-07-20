import { toBlendMode, fromBlendMode } from './helpers';
import { checkSignature, readSignature, skipBytes, readUint16, readUint8, readUint32, readFixedPoint32, readColor } from './psdReader';
import { writeSignature, writeUint16, writeZeros, writeFixedPoint32, writeUint8, writeUint32, writeColor } from './psdWriter';
var bevelStyles = [
    undefined, 'outer bevel', 'inner bevel', 'emboss', 'pillow emboss', 'stroke emboss'
];
function readBlendMode(reader) {
    checkSignature(reader, '8BIM');
    return toBlendMode[readSignature(reader)] || 'normal';
}
function writeBlendMode(writer, mode) {
    writeSignature(writer, '8BIM');
    writeSignature(writer, fromBlendMode[mode] || 'norm');
}
function readFixedPoint8(reader) {
    return readUint8(reader) / 0xff;
}
function writeFixedPoint8(writer, value) {
    writeUint8(writer, Math.round(value * 0xff) | 0);
}
export function readEffects(reader) {
    var version = readUint16(reader);
    if (version !== 0)
        throw new Error("Invalid effects layer version: ".concat(version));
    var effectsCount = readUint16(reader);
    var effects = {};
    for (var i = 0; i < effectsCount; i++) {
        checkSignature(reader, '8BIM');
        var type = readSignature(reader);
        switch (type) {
            case 'cmnS': { // common state (see See Effects layer, common state info)
                var size = readUint32(reader);
                var version_1 = readUint32(reader);
                var visible = !!readUint8(reader);
                skipBytes(reader, 2);
                if (size !== 7 || version_1 !== 0 || !visible)
                    throw new Error("Invalid effects common state");
                break;
            }
            case 'dsdw': // drop shadow (see See Effects layer, drop shadow and inner shadow info)
            case 'isdw': { // inner shadow (see See Effects layer, drop shadow and inner shadow info)
                var blockSize = readUint32(reader);
                var version_2 = readUint32(reader);
                if (blockSize !== 41 && blockSize !== 51)
                    throw new Error("Invalid shadow size: ".concat(blockSize));
                if (version_2 !== 0 && version_2 !== 2)
                    throw new Error("Invalid shadow version: ".concat(version_2));
                var size = readFixedPoint32(reader);
                readFixedPoint32(reader); // intensity
                var angle = readFixedPoint32(reader);
                var distance = readFixedPoint32(reader);
                var color = readColor(reader);
                var blendMode = readBlendMode(reader);
                var enabled = !!readUint8(reader);
                var useGlobalLight = !!readUint8(reader);
                var opacity = readFixedPoint8(reader);
                if (blockSize >= 51)
                    readColor(reader); // native color
                var shadowInfo = {
                    size: { units: 'Pixels', value: size },
                    distance: { units: 'Pixels', value: distance },
                    angle: angle,
                    color: color,
                    blendMode: blendMode,
                    enabled: enabled,
                    useGlobalLight: useGlobalLight,
                    opacity: opacity
                };
                if (type === 'dsdw') {
                    effects.dropShadow = [shadowInfo];
                }
                else {
                    effects.innerShadow = [shadowInfo];
                }
                break;
            }
            case 'oglw': { // outer glow (see See Effects layer, outer glow info)
                var blockSize = readUint32(reader);
                var version_3 = readUint32(reader);
                if (blockSize !== 32 && blockSize !== 42)
                    throw new Error("Invalid outer glow size: ".concat(blockSize));
                if (version_3 !== 0 && version_3 !== 2)
                    throw new Error("Invalid outer glow version: ".concat(version_3));
                var size = readFixedPoint32(reader);
                readFixedPoint32(reader); // intensity
                var color = readColor(reader);
                var blendMode = readBlendMode(reader);
                var enabled = !!readUint8(reader);
                var opacity = readFixedPoint8(reader);
                if (blockSize >= 42)
                    readColor(reader); // native color
                effects.outerGlow = {
                    size: { units: 'Pixels', value: size },
                    color: color,
                    blendMode: blendMode,
                    enabled: enabled,
                    opacity: opacity
                };
                break;
            }
            case 'iglw': { // inner glow (see See Effects layer, inner glow info)
                var blockSize = readUint32(reader);
                var version_4 = readUint32(reader);
                if (blockSize !== 32 && blockSize !== 43)
                    throw new Error("Invalid inner glow size: ".concat(blockSize));
                if (version_4 !== 0 && version_4 !== 2)
                    throw new Error("Invalid inner glow version: ".concat(version_4));
                var size = readFixedPoint32(reader);
                readFixedPoint32(reader); // intensity
                var color = readColor(reader);
                var blendMode = readBlendMode(reader);
                var enabled = !!readUint8(reader);
                var opacity = readFixedPoint8(reader);
                if (blockSize >= 43) {
                    readUint8(reader); // inverted
                    readColor(reader); // native color
                }
                effects.innerGlow = {
                    size: { units: 'Pixels', value: size },
                    color: color,
                    blendMode: blendMode,
                    enabled: enabled,
                    opacity: opacity
                };
                break;
            }
            case 'bevl': { // bevel (see See Effects layer, bevel info)
                var blockSize = readUint32(reader);
                var version_5 = readUint32(reader);
                if (blockSize !== 58 && blockSize !== 78)
                    throw new Error("Invalid bevel size: ".concat(blockSize));
                if (version_5 !== 0 && version_5 !== 2)
                    throw new Error("Invalid bevel version: ".concat(version_5));
                var angle = readFixedPoint32(reader);
                var strength = readFixedPoint32(reader);
                var size = readFixedPoint32(reader);
                var highlightBlendMode = readBlendMode(reader);
                var shadowBlendMode = readBlendMode(reader);
                var highlightColor = readColor(reader);
                var shadowColor = readColor(reader);
                var style = bevelStyles[readUint8(reader)] || 'inner bevel';
                var highlightOpacity = readFixedPoint8(reader);
                var shadowOpacity = readFixedPoint8(reader);
                var enabled = !!readUint8(reader);
                var useGlobalLight = !!readUint8(reader);
                var direction = readUint8(reader) ? 'down' : 'up';
                if (blockSize >= 78) {
                    readColor(reader); // real highlight color
                    readColor(reader); // real shadow color
                }
                effects.bevel = {
                    size: { units: 'Pixels', value: size },
                    angle: angle,
                    strength: strength,
                    highlightBlendMode: highlightBlendMode,
                    shadowBlendMode: shadowBlendMode,
                    highlightColor: highlightColor,
                    shadowColor: shadowColor,
                    style: style,
                    highlightOpacity: highlightOpacity,
                    shadowOpacity: shadowOpacity,
                    enabled: enabled,
                    useGlobalLight: useGlobalLight,
                    direction: direction,
                };
                break;
            }
            case 'sofi': { // solid fill (Photoshop 7.0) (see See Effects layer, solid fill (added in Photoshop 7.0))
                var size = readUint32(reader);
                var version_6 = readUint32(reader);
                if (size !== 34)
                    throw new Error("Invalid effects solid fill info size: ".concat(size));
                if (version_6 !== 2)
                    throw new Error("Invalid effects solid fill info version: ".concat(version_6));
                var blendMode = readBlendMode(reader);
                var color = readColor(reader);
                var opacity = readFixedPoint8(reader);
                var enabled = !!readUint8(reader);
                readColor(reader); // native color
                effects.solidFill = [{ blendMode: blendMode, color: color, opacity: opacity, enabled: enabled }];
                break;
            }
            default:
                throw new Error("Invalid effect type: '".concat(type, "'"));
        }
    }
    return effects;
}
function writeShadowInfo(writer, shadow) {
    var _a;
    writeUint32(writer, 51);
    writeUint32(writer, 2);
    writeFixedPoint32(writer, shadow.size && shadow.size.value || 0);
    writeFixedPoint32(writer, 0); // intensity
    writeFixedPoint32(writer, shadow.angle || 0);
    writeFixedPoint32(writer, shadow.distance && shadow.distance.value || 0);
    writeColor(writer, shadow.color);
    writeBlendMode(writer, shadow.blendMode);
    writeUint8(writer, shadow.enabled ? 1 : 0);
    writeUint8(writer, shadow.useGlobalLight ? 1 : 0);
    writeFixedPoint8(writer, (_a = shadow.opacity) !== null && _a !== void 0 ? _a : 1);
    writeColor(writer, shadow.color); // native color
}
export function writeEffects(writer, effects) {
    var _a, _b, _c, _d, _e, _f;
    var dropShadow = (_a = effects.dropShadow) === null || _a === void 0 ? void 0 : _a[0];
    var innerShadow = (_b = effects.innerShadow) === null || _b === void 0 ? void 0 : _b[0];
    var outerGlow = effects.outerGlow;
    var innerGlow = effects.innerGlow;
    var bevel = effects.bevel;
    var solidFill = (_c = effects.solidFill) === null || _c === void 0 ? void 0 : _c[0];
    var count = 1;
    if (dropShadow)
        count++;
    if (innerShadow)
        count++;
    if (outerGlow)
        count++;
    if (innerGlow)
        count++;
    if (bevel)
        count++;
    if (solidFill)
        count++;
    writeUint16(writer, 0);
    writeUint16(writer, count);
    writeSignature(writer, '8BIM');
    writeSignature(writer, 'cmnS');
    writeUint32(writer, 7); // size
    writeUint32(writer, 0); // version
    writeUint8(writer, 1); // visible
    writeZeros(writer, 2);
    if (dropShadow) {
        writeSignature(writer, '8BIM');
        writeSignature(writer, 'dsdw');
        writeShadowInfo(writer, dropShadow);
    }
    if (innerShadow) {
        writeSignature(writer, '8BIM');
        writeSignature(writer, 'isdw');
        writeShadowInfo(writer, innerShadow);
    }
    if (outerGlow) {
        writeSignature(writer, '8BIM');
        writeSignature(writer, 'oglw');
        writeUint32(writer, 42);
        writeUint32(writer, 2);
        writeFixedPoint32(writer, ((_d = outerGlow.size) === null || _d === void 0 ? void 0 : _d.value) || 0);
        writeFixedPoint32(writer, 0); // intensity
        writeColor(writer, outerGlow.color);
        writeBlendMode(writer, outerGlow.blendMode);
        writeUint8(writer, outerGlow.enabled ? 1 : 0);
        writeFixedPoint8(writer, outerGlow.opacity || 0);
        writeColor(writer, outerGlow.color);
    }
    if (innerGlow) {
        writeSignature(writer, '8BIM');
        writeSignature(writer, 'iglw');
        writeUint32(writer, 43);
        writeUint32(writer, 2);
        writeFixedPoint32(writer, ((_e = innerGlow.size) === null || _e === void 0 ? void 0 : _e.value) || 0);
        writeFixedPoint32(writer, 0); // intensity
        writeColor(writer, innerGlow.color);
        writeBlendMode(writer, innerGlow.blendMode);
        writeUint8(writer, innerGlow.enabled ? 1 : 0);
        writeFixedPoint8(writer, innerGlow.opacity || 0);
        writeUint8(writer, 0); // inverted
        writeColor(writer, innerGlow.color);
    }
    if (bevel) {
        writeSignature(writer, '8BIM');
        writeSignature(writer, 'bevl');
        writeUint32(writer, 78);
        writeUint32(writer, 2);
        writeFixedPoint32(writer, bevel.angle || 0);
        writeFixedPoint32(writer, bevel.strength || 0);
        writeFixedPoint32(writer, ((_f = bevel.size) === null || _f === void 0 ? void 0 : _f.value) || 0);
        writeBlendMode(writer, bevel.highlightBlendMode);
        writeBlendMode(writer, bevel.shadowBlendMode);
        writeColor(writer, bevel.highlightColor);
        writeColor(writer, bevel.shadowColor);
        var style = bevelStyles.indexOf(bevel.style);
        writeUint8(writer, style <= 0 ? 1 : style);
        writeFixedPoint8(writer, bevel.highlightOpacity || 0);
        writeFixedPoint8(writer, bevel.shadowOpacity || 0);
        writeUint8(writer, bevel.enabled ? 1 : 0);
        writeUint8(writer, bevel.useGlobalLight ? 1 : 0);
        writeUint8(writer, bevel.direction === 'down' ? 1 : 0);
        writeColor(writer, bevel.highlightColor);
        writeColor(writer, bevel.shadowColor);
    }
    if (solidFill) {
        writeSignature(writer, '8BIM');
        writeSignature(writer, 'sofi');
        writeUint32(writer, 34);
        writeUint32(writer, 2);
        writeBlendMode(writer, solidFill.blendMode);
        writeColor(writer, solidFill.color);
        writeFixedPoint8(writer, solidFill.opacity || 0);
        writeUint8(writer, solidFill.enabled ? 1 : 0);
        writeColor(writer, solidFill.color);
    }
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVmZmVjdHNIZWxwZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ3ZELE9BQU8sRUFDSyxjQUFjLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUMxRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUN2QyxNQUFNLGFBQWEsQ0FBQztBQUNyQixPQUFPLEVBQ0ssY0FBYyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsaUJBQWlCLEVBQ3JFLFVBQVUsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUNuQyxNQUFNLGFBQWEsQ0FBQztBQUVyQixJQUFNLFdBQVcsR0FBaUI7SUFDakMsU0FBZ0IsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsZUFBZTtDQUMxRixDQUFDO0FBRUYsU0FBUyxhQUFhLENBQUMsTUFBaUI7SUFDdkMsY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQixPQUFPLFdBQVcsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxRQUFRLENBQUM7QUFDdkQsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLE1BQWlCLEVBQUUsSUFBd0I7SUFDbEUsY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQixjQUFjLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxJQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsTUFBaUI7SUFDekMsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2pDLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLE1BQWlCLEVBQUUsS0FBYTtJQUN6RCxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2xELENBQUM7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUFDLE1BQWlCO0lBQzVDLElBQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxJQUFJLE9BQU8sS0FBSyxDQUFDO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBa0MsT0FBTyxDQUFFLENBQUMsQ0FBQztJQUVoRixJQUFNLFlBQVksR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEMsSUFBTSxPQUFPLEdBQTBCLEVBQUUsQ0FBQztJQUUxQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3RDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDL0IsSUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRW5DLFFBQVEsSUFBSSxFQUFFO1lBQ2IsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLDBEQUEwRDtnQkFDeEUsSUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNoQyxJQUFNLFNBQU8sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ25DLElBQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3BDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXJCLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxTQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTztvQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7Z0JBQzdGLE1BQU07YUFDTjtZQUNELEtBQUssTUFBTSxDQUFDLENBQUMseUVBQXlFO1lBQ3RGLEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSwwRUFBMEU7Z0JBQ3hGLElBQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDckMsSUFBTSxTQUFPLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUVuQyxJQUFJLFNBQVMsS0FBSyxFQUFFLElBQUksU0FBUyxLQUFLLEVBQUU7b0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywrQkFBd0IsU0FBUyxDQUFFLENBQUMsQ0FBQztnQkFDL0YsSUFBSSxTQUFPLEtBQUssQ0FBQyxJQUFJLFNBQU8sS0FBSyxDQUFDO29CQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsa0NBQTJCLFNBQU8sQ0FBRSxDQUFDLENBQUM7Z0JBRTFGLElBQU0sSUFBSSxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN0QyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFlBQVk7Z0JBQ3RDLElBQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2QyxJQUFNLFFBQVEsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDMUMsSUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNoQyxJQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3hDLElBQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3BDLElBQU0sY0FBYyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzNDLElBQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxTQUFTLElBQUksRUFBRTtvQkFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxlQUFlO2dCQUN2RCxJQUFNLFVBQVUsR0FBc0I7b0JBQ3JDLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtvQkFDdEMsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFO29CQUM5QyxLQUFLLE9BQUE7b0JBQUUsS0FBSyxPQUFBO29CQUFFLFNBQVMsV0FBQTtvQkFBRSxPQUFPLFNBQUE7b0JBQUUsY0FBYyxnQkFBQTtvQkFBRSxPQUFPLFNBQUE7aUJBQ3pELENBQUM7Z0JBRUYsSUFBSSxJQUFJLEtBQUssTUFBTSxFQUFFO29CQUNwQixPQUFPLENBQUMsVUFBVSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQ2xDO3FCQUFNO29CQUNOLE9BQU8sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDbkM7Z0JBQ0QsTUFBTTthQUNOO1lBQ0QsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLHNEQUFzRDtnQkFDcEUsSUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNyQyxJQUFNLFNBQU8sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRW5DLElBQUksU0FBUyxLQUFLLEVBQUUsSUFBSSxTQUFTLEtBQUssRUFBRTtvQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG1DQUE0QixTQUFTLENBQUUsQ0FBQyxDQUFDO2dCQUNuRyxJQUFJLFNBQU8sS0FBSyxDQUFDLElBQUksU0FBTyxLQUFLLENBQUM7b0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBK0IsU0FBTyxDQUFFLENBQUMsQ0FBQztnQkFFOUYsSUFBTSxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3RDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsWUFBWTtnQkFDdEMsSUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNoQyxJQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3hDLElBQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3BDLElBQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxTQUFTLElBQUksRUFBRTtvQkFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxlQUFlO2dCQUV2RCxPQUFPLENBQUMsU0FBUyxHQUFHO29CQUNuQixJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7b0JBQ3RDLEtBQUssT0FBQTtvQkFBRSxTQUFTLFdBQUE7b0JBQUUsT0FBTyxTQUFBO29CQUFFLE9BQU8sU0FBQTtpQkFDbEMsQ0FBQztnQkFDRixNQUFNO2FBQ047WUFDRCxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsc0RBQXNEO2dCQUNwRSxJQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JDLElBQU0sU0FBTyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFbkMsSUFBSSxTQUFTLEtBQUssRUFBRSxJQUFJLFNBQVMsS0FBSyxFQUFFO29CQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQTRCLFNBQVMsQ0FBRSxDQUFDLENBQUM7Z0JBQ25HLElBQUksU0FBTyxLQUFLLENBQUMsSUFBSSxTQUFPLEtBQUssQ0FBQztvQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHNDQUErQixTQUFPLENBQUUsQ0FBQyxDQUFDO2dCQUU5RixJQUFNLElBQUksR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxZQUFZO2dCQUN0QyxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2hDLElBQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDeEMsSUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDcEMsSUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUV4QyxJQUFJLFNBQVMsSUFBSSxFQUFFLEVBQUU7b0JBQ3BCLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVc7b0JBQzlCLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLGVBQWU7aUJBQ2xDO2dCQUVELE9BQU8sQ0FBQyxTQUFTLEdBQUc7b0JBQ25CLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtvQkFDdEMsS0FBSyxPQUFBO29CQUFFLFNBQVMsV0FBQTtvQkFBRSxPQUFPLFNBQUE7b0JBQUUsT0FBTyxTQUFBO2lCQUNsQyxDQUFDO2dCQUNGLE1BQU07YUFDTjtZQUNELEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSw0Q0FBNEM7Z0JBQzFELElBQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDckMsSUFBTSxTQUFPLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUVuQyxJQUFJLFNBQVMsS0FBSyxFQUFFLElBQUksU0FBUyxLQUFLLEVBQUU7b0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBdUIsU0FBUyxDQUFFLENBQUMsQ0FBQztnQkFDOUYsSUFBSSxTQUFPLEtBQUssQ0FBQyxJQUFJLFNBQU8sS0FBSyxDQUFDO29CQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQTBCLFNBQU8sQ0FBRSxDQUFDLENBQUM7Z0JBRXpGLElBQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2QyxJQUFNLFFBQVEsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDMUMsSUFBTSxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3RDLElBQU0sa0JBQWtCLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNqRCxJQUFNLGVBQWUsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzlDLElBQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDekMsSUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN0QyxJQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksYUFBYSxDQUFDO2dCQUM5RCxJQUFNLGdCQUFnQixHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDakQsSUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM5QyxJQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNwQyxJQUFNLGNBQWMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQyxJQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUVwRCxJQUFJLFNBQVMsSUFBSSxFQUFFLEVBQUU7b0JBQ3BCLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLHVCQUF1QjtvQkFDMUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsb0JBQW9CO2lCQUN2QztnQkFFRCxPQUFPLENBQUMsS0FBSyxHQUFHO29CQUNmLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtvQkFDdEMsS0FBSyxPQUFBO29CQUFFLFFBQVEsVUFBQTtvQkFBRSxrQkFBa0Isb0JBQUE7b0JBQUUsZUFBZSxpQkFBQTtvQkFBRSxjQUFjLGdCQUFBO29CQUFFLFdBQVcsYUFBQTtvQkFDakYsS0FBSyxPQUFBO29CQUFFLGdCQUFnQixrQkFBQTtvQkFBRSxhQUFhLGVBQUE7b0JBQUUsT0FBTyxTQUFBO29CQUFFLGNBQWMsZ0JBQUE7b0JBQUUsU0FBUyxXQUFBO2lCQUMxRSxDQUFDO2dCQUNGLE1BQU07YUFDTjtZQUNELEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSwwRkFBMEY7Z0JBQ3hHLElBQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDaEMsSUFBTSxTQUFPLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUVuQyxJQUFJLElBQUksS0FBSyxFQUFFO29CQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQXlDLElBQUksQ0FBRSxDQUFDLENBQUM7Z0JBQ2xGLElBQUksU0FBTyxLQUFLLENBQUM7b0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxtREFBNEMsU0FBTyxDQUFFLENBQUMsQ0FBQztnQkFFMUYsSUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN4QyxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2hDLElBQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDeEMsSUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDcEMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsZUFBZTtnQkFFbEMsT0FBTyxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUUsU0FBUyxXQUFBLEVBQUUsS0FBSyxPQUFBLEVBQUUsT0FBTyxTQUFBLEVBQUUsT0FBTyxTQUFBLEVBQUUsQ0FBQyxDQUFDO2dCQUM3RCxNQUFNO2FBQ047WUFDRDtnQkFDQyxNQUFNLElBQUksS0FBSyxDQUFDLGdDQUF5QixJQUFJLE1BQUcsQ0FBQyxDQUFDO1NBQ25EO0tBQ0Q7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsTUFBaUIsRUFBRSxNQUF5Qjs7SUFDcEUsV0FBVyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4QixXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3ZCLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVk7SUFDMUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDN0MsaUJBQWlCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDekUsVUFBVSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDekMsVUFBVSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsRCxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsTUFBQSxNQUFNLENBQUMsT0FBTyxtQ0FBSSxDQUFDLENBQUMsQ0FBQztJQUM5QyxVQUFVLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGVBQWU7QUFDbEQsQ0FBQztBQUVELE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBaUIsRUFBRSxPQUF5Qjs7SUFDeEUsSUFBTSxVQUFVLEdBQUcsTUFBQSxPQUFPLENBQUMsVUFBVSwwQ0FBRyxDQUFDLENBQUMsQ0FBQztJQUMzQyxJQUFNLFdBQVcsR0FBRyxNQUFBLE9BQU8sQ0FBQyxXQUFXLDBDQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzdDLElBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFDcEMsSUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztJQUNwQyxJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQzVCLElBQU0sU0FBUyxHQUFHLE1BQUEsT0FBTyxDQUFDLFNBQVMsMENBQUcsQ0FBQyxDQUFDLENBQUM7SUFFekMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSSxVQUFVO1FBQUUsS0FBSyxFQUFFLENBQUM7SUFDeEIsSUFBSSxXQUFXO1FBQUUsS0FBSyxFQUFFLENBQUM7SUFDekIsSUFBSSxTQUFTO1FBQUUsS0FBSyxFQUFFLENBQUM7SUFDdkIsSUFBSSxTQUFTO1FBQUUsS0FBSyxFQUFFLENBQUM7SUFDdkIsSUFBSSxLQUFLO1FBQUUsS0FBSyxFQUFFLENBQUM7SUFDbkIsSUFBSSxTQUFTO1FBQUUsS0FBSyxFQUFFLENBQUM7SUFFdkIsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN2QixXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRTNCLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDL0IsY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQixXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTztJQUMvQixXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVTtJQUNsQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVTtJQUNqQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXRCLElBQUksVUFBVSxFQUFFO1FBQ2YsY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMvQixjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9CLGVBQWUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDcEM7SUFFRCxJQUFJLFdBQVcsRUFBRTtRQUNoQixjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9CLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDL0IsZUFBZSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztLQUNyQztJQUVELElBQUksU0FBUyxFQUFFO1FBQ2QsY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMvQixjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9CLFdBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDeEIsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QixpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQSxNQUFBLFNBQVMsQ0FBQyxJQUFJLDBDQUFFLEtBQUssS0FBSSxDQUFDLENBQUMsQ0FBQztRQUN0RCxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZO1FBQzFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5QyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqRCxVQUFVLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNwQztJQUVELElBQUksU0FBUyxFQUFFO1FBQ2QsY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMvQixjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9CLFdBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDeEIsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QixpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQSxNQUFBLFNBQVMsQ0FBQyxJQUFJLDBDQUFFLEtBQUssS0FBSSxDQUFDLENBQUMsQ0FBQztRQUN0RCxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZO1FBQzFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5QyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqRCxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVztRQUNsQyxVQUFVLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNwQztJQUVELElBQUksS0FBSyxFQUFFO1FBQ1YsY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMvQixjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9CLFdBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDeEIsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QixpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM1QyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMvQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQSxNQUFBLEtBQUssQ0FBQyxJQUFJLDBDQUFFLEtBQUssS0FBSSxDQUFDLENBQUMsQ0FBQztRQUNsRCxjQUFjLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pELGNBQWMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQzlDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3pDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3RDLElBQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQU0sQ0FBQyxDQUFDO1FBQ2hELFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3RELGdCQUFnQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ25ELFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQyxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakQsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsU0FBUyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RCxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN6QyxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUN0QztJQUVELElBQUksU0FBUyxFQUFFO1FBQ2QsY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMvQixjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9CLFdBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDeEIsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QixjQUFjLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM1QyxVQUFVLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqRCxVQUFVLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDcEM7QUFDRixDQUFDIiwiZmlsZSI6ImVmZmVjdHNIZWxwZXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTGF5ZXJFZmZlY3RzSW5mbywgQmV2ZWxTdHlsZSwgTGF5ZXJFZmZlY3RTaGFkb3cgfSBmcm9tICcuL3BzZCc7XG5pbXBvcnQgeyB0b0JsZW5kTW9kZSwgZnJvbUJsZW5kTW9kZSB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQge1xuXHRQc2RSZWFkZXIsIGNoZWNrU2lnbmF0dXJlLCByZWFkU2lnbmF0dXJlLCBza2lwQnl0ZXMsIHJlYWRVaW50MTYsIHJlYWRVaW50OCxcblx0cmVhZFVpbnQzMiwgcmVhZEZpeGVkUG9pbnQzMiwgcmVhZENvbG9yXG59IGZyb20gJy4vcHNkUmVhZGVyJztcbmltcG9ydCB7XG5cdFBzZFdyaXRlciwgd3JpdGVTaWduYXR1cmUsIHdyaXRlVWludDE2LCB3cml0ZVplcm9zLCB3cml0ZUZpeGVkUG9pbnQzMixcblx0d3JpdGVVaW50OCwgd3JpdGVVaW50MzIsIHdyaXRlQ29sb3Jcbn0gZnJvbSAnLi9wc2RXcml0ZXInO1xuXG5jb25zdCBiZXZlbFN0eWxlczogQmV2ZWxTdHlsZVtdID0gW1xuXHR1bmRlZmluZWQgYXMgYW55LCAnb3V0ZXIgYmV2ZWwnLCAnaW5uZXIgYmV2ZWwnLCAnZW1ib3NzJywgJ3BpbGxvdyBlbWJvc3MnLCAnc3Ryb2tlIGVtYm9zcydcbl07XG5cbmZ1bmN0aW9uIHJlYWRCbGVuZE1vZGUocmVhZGVyOiBQc2RSZWFkZXIpIHtcblx0Y2hlY2tTaWduYXR1cmUocmVhZGVyLCAnOEJJTScpO1xuXHRyZXR1cm4gdG9CbGVuZE1vZGVbcmVhZFNpZ25hdHVyZShyZWFkZXIpXSB8fCAnbm9ybWFsJztcbn1cblxuZnVuY3Rpb24gd3JpdGVCbGVuZE1vZGUod3JpdGVyOiBQc2RXcml0ZXIsIG1vZGU6IHN0cmluZyB8IHVuZGVmaW5lZCkge1xuXHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgZnJvbUJsZW5kTW9kZVttb2RlIV0gfHwgJ25vcm0nKTtcbn1cblxuZnVuY3Rpb24gcmVhZEZpeGVkUG9pbnQ4KHJlYWRlcjogUHNkUmVhZGVyKSB7XG5cdHJldHVybiByZWFkVWludDgocmVhZGVyKSAvIDB4ZmY7XG59XG5cbmZ1bmN0aW9uIHdyaXRlRml4ZWRQb2ludDgod3JpdGVyOiBQc2RXcml0ZXIsIHZhbHVlOiBudW1iZXIpIHtcblx0d3JpdGVVaW50OCh3cml0ZXIsIE1hdGgucm91bmQodmFsdWUgKiAweGZmKSB8IDApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEVmZmVjdHMocmVhZGVyOiBQc2RSZWFkZXIpIHtcblx0Y29uc3QgdmVyc2lvbiA9IHJlYWRVaW50MTYocmVhZGVyKTtcblx0aWYgKHZlcnNpb24gIT09IDApIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBlZmZlY3RzIGxheWVyIHZlcnNpb246ICR7dmVyc2lvbn1gKTtcblxuXHRjb25zdCBlZmZlY3RzQ291bnQgPSByZWFkVWludDE2KHJlYWRlcik7XG5cdGNvbnN0IGVmZmVjdHM6IExheWVyRWZmZWN0c0luZm8gPSA8YW55Pnt9O1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgZWZmZWN0c0NvdW50OyBpKyspIHtcblx0XHRjaGVja1NpZ25hdHVyZShyZWFkZXIsICc4QklNJyk7XG5cdFx0Y29uc3QgdHlwZSA9IHJlYWRTaWduYXR1cmUocmVhZGVyKTtcblxuXHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdFx0Y2FzZSAnY21uUyc6IHsgLy8gY29tbW9uIHN0YXRlIChzZWUgU2VlIEVmZmVjdHMgbGF5ZXIsIGNvbW1vbiBzdGF0ZSBpbmZvKVxuXHRcdFx0XHRjb25zdCBzaXplID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCB2ZXJzaW9uID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCB2aXNpYmxlID0gISFyZWFkVWludDgocmVhZGVyKTtcblx0XHRcdFx0c2tpcEJ5dGVzKHJlYWRlciwgMik7XG5cblx0XHRcdFx0aWYgKHNpemUgIT09IDcgfHwgdmVyc2lvbiAhPT0gMCB8fCAhdmlzaWJsZSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVmZmVjdHMgY29tbW9uIHN0YXRlYCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0Y2FzZSAnZHNkdyc6IC8vIGRyb3Agc2hhZG93IChzZWUgU2VlIEVmZmVjdHMgbGF5ZXIsIGRyb3Agc2hhZG93IGFuZCBpbm5lciBzaGFkb3cgaW5mbylcblx0XHRcdGNhc2UgJ2lzZHcnOiB7IC8vIGlubmVyIHNoYWRvdyAoc2VlIFNlZSBFZmZlY3RzIGxheWVyLCBkcm9wIHNoYWRvdyBhbmQgaW5uZXIgc2hhZG93IGluZm8pXG5cdFx0XHRcdGNvbnN0IGJsb2NrU2l6ZSA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgdmVyc2lvbiA9IHJlYWRVaW50MzIocmVhZGVyKTtcblxuXHRcdFx0XHRpZiAoYmxvY2tTaXplICE9PSA0MSAmJiBibG9ja1NpemUgIT09IDUxKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2hhZG93IHNpemU6ICR7YmxvY2tTaXplfWApO1xuXHRcdFx0XHRpZiAodmVyc2lvbiAhPT0gMCAmJiB2ZXJzaW9uICE9PSAyKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2hhZG93IHZlcnNpb246ICR7dmVyc2lvbn1gKTtcblxuXHRcdFx0XHRjb25zdCBzaXplID0gcmVhZEZpeGVkUG9pbnQzMihyZWFkZXIpO1xuXHRcdFx0XHRyZWFkRml4ZWRQb2ludDMyKHJlYWRlcik7IC8vIGludGVuc2l0eVxuXHRcdFx0XHRjb25zdCBhbmdsZSA9IHJlYWRGaXhlZFBvaW50MzIocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgZGlzdGFuY2UgPSByZWFkRml4ZWRQb2ludDMyKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IGNvbG9yID0gcmVhZENvbG9yKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IGJsZW5kTW9kZSA9IHJlYWRCbGVuZE1vZGUocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgZW5hYmxlZCA9ICEhcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHVzZUdsb2JhbExpZ2h0ID0gISFyZWFkVWludDgocmVhZGVyKTtcblx0XHRcdFx0Y29uc3Qgb3BhY2l0eSA9IHJlYWRGaXhlZFBvaW50OChyZWFkZXIpO1xuXHRcdFx0XHRpZiAoYmxvY2tTaXplID49IDUxKSByZWFkQ29sb3IocmVhZGVyKTsgLy8gbmF0aXZlIGNvbG9yXG5cdFx0XHRcdGNvbnN0IHNoYWRvd0luZm86IExheWVyRWZmZWN0U2hhZG93ID0ge1xuXHRcdFx0XHRcdHNpemU6IHsgdW5pdHM6ICdQaXhlbHMnLCB2YWx1ZTogc2l6ZSB9LFxuXHRcdFx0XHRcdGRpc3RhbmNlOiB7IHVuaXRzOiAnUGl4ZWxzJywgdmFsdWU6IGRpc3RhbmNlIH0sXG5cdFx0XHRcdFx0YW5nbGUsIGNvbG9yLCBibGVuZE1vZGUsIGVuYWJsZWQsIHVzZUdsb2JhbExpZ2h0LCBvcGFjaXR5XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0aWYgKHR5cGUgPT09ICdkc2R3Jykge1xuXHRcdFx0XHRcdGVmZmVjdHMuZHJvcFNoYWRvdyA9IFtzaGFkb3dJbmZvXTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRlZmZlY3RzLmlubmVyU2hhZG93ID0gW3NoYWRvd0luZm9dO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0Y2FzZSAnb2dsdyc6IHsgLy8gb3V0ZXIgZ2xvdyAoc2VlIFNlZSBFZmZlY3RzIGxheWVyLCBvdXRlciBnbG93IGluZm8pXG5cdFx0XHRcdGNvbnN0IGJsb2NrU2l6ZSA9IHJlYWRVaW50MzIocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgdmVyc2lvbiA9IHJlYWRVaW50MzIocmVhZGVyKTtcblxuXHRcdFx0XHRpZiAoYmxvY2tTaXplICE9PSAzMiAmJiBibG9ja1NpemUgIT09IDQyKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgb3V0ZXIgZ2xvdyBzaXplOiAke2Jsb2NrU2l6ZX1gKTtcblx0XHRcdFx0aWYgKHZlcnNpb24gIT09IDAgJiYgdmVyc2lvbiAhPT0gMikgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIG91dGVyIGdsb3cgdmVyc2lvbjogJHt2ZXJzaW9ufWApO1xuXG5cdFx0XHRcdGNvbnN0IHNpemUgPSByZWFkRml4ZWRQb2ludDMyKHJlYWRlcik7XG5cdFx0XHRcdHJlYWRGaXhlZFBvaW50MzIocmVhZGVyKTsgLy8gaW50ZW5zaXR5XG5cdFx0XHRcdGNvbnN0IGNvbG9yID0gcmVhZENvbG9yKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IGJsZW5kTW9kZSA9IHJlYWRCbGVuZE1vZGUocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgZW5hYmxlZCA9ICEhcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IG9wYWNpdHkgPSByZWFkRml4ZWRQb2ludDgocmVhZGVyKTtcblx0XHRcdFx0aWYgKGJsb2NrU2l6ZSA+PSA0MikgcmVhZENvbG9yKHJlYWRlcik7IC8vIG5hdGl2ZSBjb2xvclxuXG5cdFx0XHRcdGVmZmVjdHMub3V0ZXJHbG93ID0ge1xuXHRcdFx0XHRcdHNpemU6IHsgdW5pdHM6ICdQaXhlbHMnLCB2YWx1ZTogc2l6ZSB9LFxuXHRcdFx0XHRcdGNvbG9yLCBibGVuZE1vZGUsIGVuYWJsZWQsIG9wYWNpdHlcblx0XHRcdFx0fTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRjYXNlICdpZ2x3JzogeyAvLyBpbm5lciBnbG93IChzZWUgU2VlIEVmZmVjdHMgbGF5ZXIsIGlubmVyIGdsb3cgaW5mbylcblx0XHRcdFx0Y29uc3QgYmxvY2tTaXplID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCB2ZXJzaW9uID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXG5cdFx0XHRcdGlmIChibG9ja1NpemUgIT09IDMyICYmIGJsb2NrU2l6ZSAhPT0gNDMpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBpbm5lciBnbG93IHNpemU6ICR7YmxvY2tTaXplfWApO1xuXHRcdFx0XHRpZiAodmVyc2lvbiAhPT0gMCAmJiB2ZXJzaW9uICE9PSAyKSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgaW5uZXIgZ2xvdyB2ZXJzaW9uOiAke3ZlcnNpb259YCk7XG5cblx0XHRcdFx0Y29uc3Qgc2l6ZSA9IHJlYWRGaXhlZFBvaW50MzIocmVhZGVyKTtcblx0XHRcdFx0cmVhZEZpeGVkUG9pbnQzMihyZWFkZXIpOyAvLyBpbnRlbnNpdHlcblx0XHRcdFx0Y29uc3QgY29sb3IgPSByZWFkQ29sb3IocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgYmxlbmRNb2RlID0gcmVhZEJsZW5kTW9kZShyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBlbmFibGVkID0gISFyZWFkVWludDgocmVhZGVyKTtcblx0XHRcdFx0Y29uc3Qgb3BhY2l0eSA9IHJlYWRGaXhlZFBvaW50OChyZWFkZXIpO1xuXG5cdFx0XHRcdGlmIChibG9ja1NpemUgPj0gNDMpIHtcblx0XHRcdFx0XHRyZWFkVWludDgocmVhZGVyKTsgLy8gaW52ZXJ0ZWRcblx0XHRcdFx0XHRyZWFkQ29sb3IocmVhZGVyKTsgLy8gbmF0aXZlIGNvbG9yXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlZmZlY3RzLmlubmVyR2xvdyA9IHtcblx0XHRcdFx0XHRzaXplOiB7IHVuaXRzOiAnUGl4ZWxzJywgdmFsdWU6IHNpemUgfSxcblx0XHRcdFx0XHRjb2xvciwgYmxlbmRNb2RlLCBlbmFibGVkLCBvcGFjaXR5XG5cdFx0XHRcdH07XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0Y2FzZSAnYmV2bCc6IHsgLy8gYmV2ZWwgKHNlZSBTZWUgRWZmZWN0cyBsYXllciwgYmV2ZWwgaW5mbylcblx0XHRcdFx0Y29uc3QgYmxvY2tTaXplID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCB2ZXJzaW9uID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXG5cdFx0XHRcdGlmIChibG9ja1NpemUgIT09IDU4ICYmIGJsb2NrU2l6ZSAhPT0gNzgpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBiZXZlbCBzaXplOiAke2Jsb2NrU2l6ZX1gKTtcblx0XHRcdFx0aWYgKHZlcnNpb24gIT09IDAgJiYgdmVyc2lvbiAhPT0gMikgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGJldmVsIHZlcnNpb246ICR7dmVyc2lvbn1gKTtcblxuXHRcdFx0XHRjb25zdCBhbmdsZSA9IHJlYWRGaXhlZFBvaW50MzIocmVhZGVyKTtcblx0XHRcdFx0Y29uc3Qgc3RyZW5ndGggPSByZWFkRml4ZWRQb2ludDMyKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHNpemUgPSByZWFkRml4ZWRQb2ludDMyKHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IGhpZ2hsaWdodEJsZW5kTW9kZSA9IHJlYWRCbGVuZE1vZGUocmVhZGVyKTtcblx0XHRcdFx0Y29uc3Qgc2hhZG93QmxlbmRNb2RlID0gcmVhZEJsZW5kTW9kZShyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBoaWdobGlnaHRDb2xvciA9IHJlYWRDb2xvcihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBzaGFkb3dDb2xvciA9IHJlYWRDb2xvcihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBzdHlsZSA9IGJldmVsU3R5bGVzW3JlYWRVaW50OChyZWFkZXIpXSB8fCAnaW5uZXIgYmV2ZWwnO1xuXHRcdFx0XHRjb25zdCBoaWdobGlnaHRPcGFjaXR5ID0gcmVhZEZpeGVkUG9pbnQ4KHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHNoYWRvd09wYWNpdHkgPSByZWFkRml4ZWRQb2ludDgocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgZW5hYmxlZCA9ICEhcmVhZFVpbnQ4KHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IHVzZUdsb2JhbExpZ2h0ID0gISFyZWFkVWludDgocmVhZGVyKTtcblx0XHRcdFx0Y29uc3QgZGlyZWN0aW9uID0gcmVhZFVpbnQ4KHJlYWRlcikgPyAnZG93bicgOiAndXAnO1xuXG5cdFx0XHRcdGlmIChibG9ja1NpemUgPj0gNzgpIHtcblx0XHRcdFx0XHRyZWFkQ29sb3IocmVhZGVyKTsgLy8gcmVhbCBoaWdobGlnaHQgY29sb3Jcblx0XHRcdFx0XHRyZWFkQ29sb3IocmVhZGVyKTsgLy8gcmVhbCBzaGFkb3cgY29sb3Jcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVmZmVjdHMuYmV2ZWwgPSB7XG5cdFx0XHRcdFx0c2l6ZTogeyB1bml0czogJ1BpeGVscycsIHZhbHVlOiBzaXplIH0sXG5cdFx0XHRcdFx0YW5nbGUsIHN0cmVuZ3RoLCBoaWdobGlnaHRCbGVuZE1vZGUsIHNoYWRvd0JsZW5kTW9kZSwgaGlnaGxpZ2h0Q29sb3IsIHNoYWRvd0NvbG9yLFxuXHRcdFx0XHRcdHN0eWxlLCBoaWdobGlnaHRPcGFjaXR5LCBzaGFkb3dPcGFjaXR5LCBlbmFibGVkLCB1c2VHbG9iYWxMaWdodCwgZGlyZWN0aW9uLFxuXHRcdFx0XHR9O1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHRcdGNhc2UgJ3NvZmknOiB7IC8vIHNvbGlkIGZpbGwgKFBob3Rvc2hvcCA3LjApIChzZWUgU2VlIEVmZmVjdHMgbGF5ZXIsIHNvbGlkIGZpbGwgKGFkZGVkIGluIFBob3Rvc2hvcCA3LjApKVxuXHRcdFx0XHRjb25zdCBzaXplID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCB2ZXJzaW9uID0gcmVhZFVpbnQzMihyZWFkZXIpO1xuXG5cdFx0XHRcdGlmIChzaXplICE9PSAzNCkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVmZmVjdHMgc29saWQgZmlsbCBpbmZvIHNpemU6ICR7c2l6ZX1gKTtcblx0XHRcdFx0aWYgKHZlcnNpb24gIT09IDIpIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBlZmZlY3RzIHNvbGlkIGZpbGwgaW5mbyB2ZXJzaW9uOiAke3ZlcnNpb259YCk7XG5cblx0XHRcdFx0Y29uc3QgYmxlbmRNb2RlID0gcmVhZEJsZW5kTW9kZShyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBjb2xvciA9IHJlYWRDb2xvcihyZWFkZXIpO1xuXHRcdFx0XHRjb25zdCBvcGFjaXR5ID0gcmVhZEZpeGVkUG9pbnQ4KHJlYWRlcik7XG5cdFx0XHRcdGNvbnN0IGVuYWJsZWQgPSAhIXJlYWRVaW50OChyZWFkZXIpO1xuXHRcdFx0XHRyZWFkQ29sb3IocmVhZGVyKTsgLy8gbmF0aXZlIGNvbG9yXG5cblx0XHRcdFx0ZWZmZWN0cy5zb2xpZEZpbGwgPSBbeyBibGVuZE1vZGUsIGNvbG9yLCBvcGFjaXR5LCBlbmFibGVkIH1dO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBlZmZlY3QgdHlwZTogJyR7dHlwZX0nYCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGVmZmVjdHM7XG59XG5cbmZ1bmN0aW9uIHdyaXRlU2hhZG93SW5mbyh3cml0ZXI6IFBzZFdyaXRlciwgc2hhZG93OiBMYXllckVmZmVjdFNoYWRvdykge1xuXHR3cml0ZVVpbnQzMih3cml0ZXIsIDUxKTtcblx0d3JpdGVVaW50MzIod3JpdGVyLCAyKTtcblx0d3JpdGVGaXhlZFBvaW50MzIod3JpdGVyLCBzaGFkb3cuc2l6ZSAmJiBzaGFkb3cuc2l6ZS52YWx1ZSB8fCAwKTtcblx0d3JpdGVGaXhlZFBvaW50MzIod3JpdGVyLCAwKTsgLy8gaW50ZW5zaXR5XG5cdHdyaXRlRml4ZWRQb2ludDMyKHdyaXRlciwgc2hhZG93LmFuZ2xlIHx8IDApO1xuXHR3cml0ZUZpeGVkUG9pbnQzMih3cml0ZXIsIHNoYWRvdy5kaXN0YW5jZSAmJiBzaGFkb3cuZGlzdGFuY2UudmFsdWUgfHwgMCk7XG5cdHdyaXRlQ29sb3Iod3JpdGVyLCBzaGFkb3cuY29sb3IpO1xuXHR3cml0ZUJsZW5kTW9kZSh3cml0ZXIsIHNoYWRvdy5ibGVuZE1vZGUpO1xuXHR3cml0ZVVpbnQ4KHdyaXRlciwgc2hhZG93LmVuYWJsZWQgPyAxIDogMCk7XG5cdHdyaXRlVWludDgod3JpdGVyLCBzaGFkb3cudXNlR2xvYmFsTGlnaHQgPyAxIDogMCk7XG5cdHdyaXRlRml4ZWRQb2ludDgod3JpdGVyLCBzaGFkb3cub3BhY2l0eSA/PyAxKTtcblx0d3JpdGVDb2xvcih3cml0ZXIsIHNoYWRvdy5jb2xvcik7IC8vIG5hdGl2ZSBjb2xvclxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVFZmZlY3RzKHdyaXRlcjogUHNkV3JpdGVyLCBlZmZlY3RzOiBMYXllckVmZmVjdHNJbmZvKSB7XG5cdGNvbnN0IGRyb3BTaGFkb3cgPSBlZmZlY3RzLmRyb3BTaGFkb3c/LlswXTtcblx0Y29uc3QgaW5uZXJTaGFkb3cgPSBlZmZlY3RzLmlubmVyU2hhZG93Py5bMF07XG5cdGNvbnN0IG91dGVyR2xvdyA9IGVmZmVjdHMub3V0ZXJHbG93O1xuXHRjb25zdCBpbm5lckdsb3cgPSBlZmZlY3RzLmlubmVyR2xvdztcblx0Y29uc3QgYmV2ZWwgPSBlZmZlY3RzLmJldmVsO1xuXHRjb25zdCBzb2xpZEZpbGwgPSBlZmZlY3RzLnNvbGlkRmlsbD8uWzBdO1xuXG5cdGxldCBjb3VudCA9IDE7XG5cdGlmIChkcm9wU2hhZG93KSBjb3VudCsrO1xuXHRpZiAoaW5uZXJTaGFkb3cpIGNvdW50Kys7XG5cdGlmIChvdXRlckdsb3cpIGNvdW50Kys7XG5cdGlmIChpbm5lckdsb3cpIGNvdW50Kys7XG5cdGlmIChiZXZlbCkgY291bnQrKztcblx0aWYgKHNvbGlkRmlsbCkgY291bnQrKztcblxuXHR3cml0ZVVpbnQxNih3cml0ZXIsIDApO1xuXHR3cml0ZVVpbnQxNih3cml0ZXIsIGNvdW50KTtcblxuXHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJ2NtblMnKTtcblx0d3JpdGVVaW50MzIod3JpdGVyLCA3KTsgLy8gc2l6ZVxuXHR3cml0ZVVpbnQzMih3cml0ZXIsIDApOyAvLyB2ZXJzaW9uXG5cdHdyaXRlVWludDgod3JpdGVyLCAxKTsgLy8gdmlzaWJsZVxuXHR3cml0ZVplcm9zKHdyaXRlciwgMik7XG5cblx0aWYgKGRyb3BTaGFkb3cpIHtcblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnZHNkdycpO1xuXHRcdHdyaXRlU2hhZG93SW5mbyh3cml0ZXIsIGRyb3BTaGFkb3cpO1xuXHR9XG5cblx0aWYgKGlubmVyU2hhZG93KSB7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnOEJJTScpO1xuXHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJ2lzZHcnKTtcblx0XHR3cml0ZVNoYWRvd0luZm8od3JpdGVyLCBpbm5lclNoYWRvdyk7XG5cdH1cblxuXHRpZiAob3V0ZXJHbG93KSB7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnOEJJTScpO1xuXHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJ29nbHcnKTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDQyKTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDIpO1xuXHRcdHdyaXRlRml4ZWRQb2ludDMyKHdyaXRlciwgb3V0ZXJHbG93LnNpemU/LnZhbHVlIHx8IDApO1xuXHRcdHdyaXRlRml4ZWRQb2ludDMyKHdyaXRlciwgMCk7IC8vIGludGVuc2l0eVxuXHRcdHdyaXRlQ29sb3Iod3JpdGVyLCBvdXRlckdsb3cuY29sb3IpO1xuXHRcdHdyaXRlQmxlbmRNb2RlKHdyaXRlciwgb3V0ZXJHbG93LmJsZW5kTW9kZSk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIG91dGVyR2xvdy5lbmFibGVkID8gMSA6IDApO1xuXHRcdHdyaXRlRml4ZWRQb2ludDgod3JpdGVyLCBvdXRlckdsb3cub3BhY2l0eSB8fCAwKTtcblx0XHR3cml0ZUNvbG9yKHdyaXRlciwgb3V0ZXJHbG93LmNvbG9yKTtcblx0fVxuXG5cdGlmIChpbm5lckdsb3cpIHtcblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICc4QklNJyk7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnaWdsdycpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgNDMpO1xuXHRcdHdyaXRlVWludDMyKHdyaXRlciwgMik7XG5cdFx0d3JpdGVGaXhlZFBvaW50MzIod3JpdGVyLCBpbm5lckdsb3cuc2l6ZT8udmFsdWUgfHwgMCk7XG5cdFx0d3JpdGVGaXhlZFBvaW50MzIod3JpdGVyLCAwKTsgLy8gaW50ZW5zaXR5XG5cdFx0d3JpdGVDb2xvcih3cml0ZXIsIGlubmVyR2xvdy5jb2xvcik7XG5cdFx0d3JpdGVCbGVuZE1vZGUod3JpdGVyLCBpbm5lckdsb3cuYmxlbmRNb2RlKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgaW5uZXJHbG93LmVuYWJsZWQgPyAxIDogMCk7XG5cdFx0d3JpdGVGaXhlZFBvaW50OCh3cml0ZXIsIGlubmVyR2xvdy5vcGFjaXR5IHx8IDApO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCAwKTsgLy8gaW52ZXJ0ZWRcblx0XHR3cml0ZUNvbG9yKHdyaXRlciwgaW5uZXJHbG93LmNvbG9yKTtcblx0fVxuXG5cdGlmIChiZXZlbCkge1xuXHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJzhCSU0nKTtcblx0XHR3cml0ZVNpZ25hdHVyZSh3cml0ZXIsICdiZXZsJyk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCA3OCk7XG5cdFx0d3JpdGVVaW50MzIod3JpdGVyLCAyKTtcblx0XHR3cml0ZUZpeGVkUG9pbnQzMih3cml0ZXIsIGJldmVsLmFuZ2xlIHx8IDApO1xuXHRcdHdyaXRlRml4ZWRQb2ludDMyKHdyaXRlciwgYmV2ZWwuc3RyZW5ndGggfHwgMCk7XG5cdFx0d3JpdGVGaXhlZFBvaW50MzIod3JpdGVyLCBiZXZlbC5zaXplPy52YWx1ZSB8fCAwKTtcblx0XHR3cml0ZUJsZW5kTW9kZSh3cml0ZXIsIGJldmVsLmhpZ2hsaWdodEJsZW5kTW9kZSk7XG5cdFx0d3JpdGVCbGVuZE1vZGUod3JpdGVyLCBiZXZlbC5zaGFkb3dCbGVuZE1vZGUpO1xuXHRcdHdyaXRlQ29sb3Iod3JpdGVyLCBiZXZlbC5oaWdobGlnaHRDb2xvcik7XG5cdFx0d3JpdGVDb2xvcih3cml0ZXIsIGJldmVsLnNoYWRvd0NvbG9yKTtcblx0XHRjb25zdCBzdHlsZSA9IGJldmVsU3R5bGVzLmluZGV4T2YoYmV2ZWwuc3R5bGUhKTtcblx0XHR3cml0ZVVpbnQ4KHdyaXRlciwgc3R5bGUgPD0gMCA/IDEgOiBzdHlsZSk7XG5cdFx0d3JpdGVGaXhlZFBvaW50OCh3cml0ZXIsIGJldmVsLmhpZ2hsaWdodE9wYWNpdHkgfHwgMCk7XG5cdFx0d3JpdGVGaXhlZFBvaW50OCh3cml0ZXIsIGJldmVsLnNoYWRvd09wYWNpdHkgfHwgMCk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGJldmVsLmVuYWJsZWQgPyAxIDogMCk7XG5cdFx0d3JpdGVVaW50OCh3cml0ZXIsIGJldmVsLnVzZUdsb2JhbExpZ2h0ID8gMSA6IDApO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBiZXZlbC5kaXJlY3Rpb24gPT09ICdkb3duJyA/IDEgOiAwKTtcblx0XHR3cml0ZUNvbG9yKHdyaXRlciwgYmV2ZWwuaGlnaGxpZ2h0Q29sb3IpO1xuXHRcdHdyaXRlQ29sb3Iod3JpdGVyLCBiZXZlbC5zaGFkb3dDb2xvcik7XG5cdH1cblxuXHRpZiAoc29saWRGaWxsKSB7XG5cdFx0d3JpdGVTaWduYXR1cmUod3JpdGVyLCAnOEJJTScpO1xuXHRcdHdyaXRlU2lnbmF0dXJlKHdyaXRlciwgJ3NvZmknKTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDM0KTtcblx0XHR3cml0ZVVpbnQzMih3cml0ZXIsIDIpO1xuXHRcdHdyaXRlQmxlbmRNb2RlKHdyaXRlciwgc29saWRGaWxsLmJsZW5kTW9kZSk7XG5cdFx0d3JpdGVDb2xvcih3cml0ZXIsIHNvbGlkRmlsbC5jb2xvcik7XG5cdFx0d3JpdGVGaXhlZFBvaW50OCh3cml0ZXIsIHNvbGlkRmlsbC5vcGFjaXR5IHx8IDApO1xuXHRcdHdyaXRlVWludDgod3JpdGVyLCBzb2xpZEZpbGwuZW5hYmxlZCA/IDEgOiAwKTtcblx0XHR3cml0ZUNvbG9yKHdyaXRlciwgc29saWRGaWxsLmNvbG9yKTtcblx0fVxufVxuIl0sInNvdXJjZVJvb3QiOiJDOlxcUHJvamVjdHNcXGdpdGh1YlxcYWctcHNkXFxzcmMifQ==
