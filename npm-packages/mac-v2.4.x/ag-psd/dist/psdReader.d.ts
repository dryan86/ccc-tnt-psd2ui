import { Psd, ColorMode, ReadOptions, Color, PatternInfo } from './psd';
import { PixelData } from './helpers';
export declare const supportedColorModes: ColorMode[];
export interface PsdReader {
    offset: number;
    view: DataView;
    strict: boolean;
    debug: boolean;
}
export declare function createReader(buffer: ArrayBuffer, offset?: number, length?: number): PsdReader;
export declare function warnOrThrow(reader: PsdReader, message: string): void;
export declare function readUint8(reader: PsdReader): number;
export declare function peekUint8(reader: PsdReader): number;
export declare function readInt16(reader: PsdReader): number;
export declare function readUint16(reader: PsdReader): number;
export declare function readInt32(reader: PsdReader): number;
export declare function readInt32LE(reader: PsdReader): number;
export declare function readUint32(reader: PsdReader): number;
export declare function readFloat32(reader: PsdReader): number;
export declare function readFloat64(reader: PsdReader): number;
export declare function readFixedPoint32(reader: PsdReader): number;
export declare function readFixedPointPath32(reader: PsdReader): number;
export declare function readBytes(reader: PsdReader, length: number): Uint8Array;
export declare function readSignature(reader: PsdReader): string;
export declare function readPascalString(reader: PsdReader, padTo: number): string;
export declare function readUnicodeString(reader: PsdReader): string;
export declare function readUnicodeStringWithLength(reader: PsdReader, length: number): string;
export declare function readAsciiString(reader: PsdReader, length: number): string;
export declare function skipBytes(reader: PsdReader, count: number): void;
export declare function checkSignature(reader: PsdReader, a: string, b?: string): void;
export declare function readPsd(reader: PsdReader, options?: ReadOptions): Psd;
export declare function readDataZipWithoutPrediction(reader: PsdReader, length: number, pixelData: PixelData | undefined, width: number, height: number, step: number, offset: number): void;
export declare function readDataRLE(reader: PsdReader, pixelData: PixelData | undefined, _width: number, height: number, step: number, offsets: number[], large: boolean): void;
export declare function readSection<T>(reader: PsdReader, round: number, func: (left: () => number) => T, skipEmpty?: boolean, eightBytes?: boolean): T | undefined;
export declare function readColor(reader: PsdReader): Color;
export declare function readPattern(reader: PsdReader): PatternInfo;
