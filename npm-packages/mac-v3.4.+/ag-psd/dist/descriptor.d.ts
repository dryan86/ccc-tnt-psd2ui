import { AntiAlias, BevelDirection, BevelStyle, BevelTechnique, BlendMode, Color, GlowSource, GlowTechnique, GradientStyle, InterpolationMethod, LayerEffectsInfo, LineAlignment, LineCapType, LineJoinType, Orientation, TextGridding, TimelineKeyInterpolation, TimelineTrack, TimelineTrackType, Units, UnitsValue, VectorContent, WarpStyle } from './psd';
import { PsdReader } from './psdReader';
import { PsdWriter } from './psdWriter';
export declare function setLogErrors(value: boolean): void;
export declare function readAsciiStringOrClassId(reader: PsdReader): string;
export declare function readDescriptorStructure(reader: PsdReader): any;
export declare function writeDescriptorStructure(writer: PsdWriter, name: string, classId: string, value: any, root: string): void;
export declare function readVersionAndDescriptor(reader: PsdReader): any;
export declare function writeVersionAndDescriptor(writer: PsdWriter, name: string, classID: string, descriptor: any, root?: string): void;
export type DescriptorUnits = 'Angle' | 'Density' | 'Distance' | 'None' | 'Percent' | 'Pixels' | 'Millimeters' | 'Points' | 'Picas' | 'Inches' | 'Centimeters';
export interface DescriptorUnitsValue {
    units: DescriptorUnits;
    value: number;
}
export type DescriptorColor = {
    'Rd  ': number;
    'Grn ': number;
    'Bl  ': number;
} | {
    'H   ': DescriptorUnitsValue;
    Strt: number;
    Brgh: number;
} | {
    'Cyn ': number;
    Mgnt: number;
    'Ylw ': number;
    Blck: number;
} | {
    'Gry ': number;
} | {
    Lmnc: number;
    'A   ': number;
    'B   ': number;
} | {
    redFloat: number;
    greenFloat: number;
    blueFloat: number;
};
export interface DesciptorPattern {
    'Nm  ': string;
    Idnt: string;
}
export type DesciptorGradient = {
    'Nm  ': string;
    GrdF: 'GrdF.CstS';
    Intr: number;
    Clrs: {
        'Clr ': DescriptorColor;
        Type: 'Clry.UsrS';
        Lctn: number;
        Mdpn: number;
    }[];
    Trns: {
        Opct: DescriptorUnitsValue;
        Lctn: number;
        Mdpn: number;
    }[];
} | {
    GrdF: 'GrdF.ClNs';
    Smth: number;
    'Nm  ': string;
    ClrS: string;
    RndS: number;
    VctC?: boolean;
    ShTr?: boolean;
    'Mnm ': number[];
    'Mxm ': number[];
};
export interface DescriptorColorContent {
    'Clr ': DescriptorColor;
}
export interface DescriptorGradientContent {
    Grad: DesciptorGradient;
    Type: string;
    Dthr?: boolean;
    Rvrs?: boolean;
    Angl?: DescriptorUnitsValue;
    'Scl '?: DescriptorUnitsValue;
    Algn?: boolean;
    Ofst?: {
        Hrzn: DescriptorUnitsValue;
        Vrtc: DescriptorUnitsValue;
    };
}
export interface DescriptorPatternContent {
    Ptrn: DesciptorPattern;
    Lnkd?: boolean;
    phase?: {
        Hrzn: number;
        Vrtc: number;
    };
}
export type DescriptorVectorContent = DescriptorColorContent | DescriptorGradientContent | DescriptorPatternContent;
export interface StrokeDescriptor {
    strokeStyleVersion: number;
    strokeEnabled: boolean;
    fillEnabled: boolean;
    strokeStyleLineWidth: DescriptorUnitsValue;
    strokeStyleLineDashOffset: DescriptorUnitsValue;
    strokeStyleMiterLimit: number;
    strokeStyleLineCapType: string;
    strokeStyleLineJoinType: string;
    strokeStyleLineAlignment: string;
    strokeStyleScaleLock: boolean;
    strokeStyleStrokeAdjust: boolean;
    strokeStyleLineDashSet: DescriptorUnitsValue[];
    strokeStyleBlendMode: string;
    strokeStyleOpacity: DescriptorUnitsValue;
    strokeStyleContent: DescriptorVectorContent;
    strokeStyleResolution: number;
}
export interface TextDescriptor {
    'Txt ': string;
    textGridding: string;
    Ornt: string;
    AntA: string;
    TextIndex: number;
    EngineData?: Uint8Array;
}
export interface WarpDescriptor {
    warpStyle: string;
    warpValue?: number;
    warpValues?: number[];
    warpPerspective: number;
    warpPerspectiveOther: number;
    warpRotate: string;
    bounds?: {
        'Top ': DescriptorUnitsValue;
        Left: DescriptorUnitsValue;
        Btom: DescriptorUnitsValue;
        Rght: DescriptorUnitsValue;
    };
    uOrder: number;
    vOrder: number;
    customEnvelopeWarp?: {
        meshPoints: {
            type: 'Hrzn' | 'Vrtc';
            values: number[];
        }[];
    };
}
export interface QuiltWarpDescriptor extends WarpDescriptor {
    deformNumRows: number;
    deformNumCols: number;
    customEnvelopeWarp: {
        quiltSliceX: {
            type: 'quiltSliceX';
            values: number[];
        }[];
        quiltSliceY: {
            type: 'quiltSliceY';
            values: number[];
        }[];
        meshPoints: {
            type: 'Hrzn' | 'Vrtc';
            values: number[];
        }[];
    };
}
export interface FractionDescriptor {
    numerator: number;
    denominator: number;
}
export interface HrznVrtcDescriptor {
    Hrzn: number;
    Vrtc: number;
}
export interface FrameDescriptor {
    FrLs: number[];
    enab?: boolean;
    IMsk?: {
        Ofst: HrznVrtcDescriptor;
    };
    VMsk?: {
        Ofst: HrznVrtcDescriptor;
    };
    Ofst?: HrznVrtcDescriptor;
    FXRf?: HrznVrtcDescriptor;
    Lefx?: Lfx2Descriptor;
    blendOptions?: {
        Opct: DescriptorUnitsValue;
    };
}
export interface FrameListDescriptor {
    LaID: number;
    LaSt: FrameDescriptor[];
}
export declare function horzVrtcToXY(hv: HrznVrtcDescriptor): {
    x: number;
    y: number;
};
export declare function xyToHorzVrtc(xy: {
    x: number;
    y: number;
}): HrznVrtcDescriptor;
export type TimelineAnimKeyDescriptor = {
    Type: 'keyType.Opct';
    Opct: DescriptorUnitsValue;
} | {
    Type: 'keyType.Trnf';
    'Scl ': HrznVrtcDescriptor;
    Skew: HrznVrtcDescriptor;
    rotation: number;
    translation: HrznVrtcDescriptor;
} | {
    Type: 'keyType.Pstn';
    Hrzn: number;
    Vrtc: number;
} | {
    Type: 'keyType.sheetStyle';
    sheetStyle: {
        Vrsn: number;
        Lefx?: Lfx2Descriptor;
        blendOptions: {};
    };
} | {
    Type: 'keyType.globalLighting';
    gblA: number;
    globalAltitude: number;
};
export interface TimelineKeyDescriptor {
    Vrsn: 1;
    animInterpStyle: 'animInterpStyle.Lnr ' | 'animInterpStyle.hold';
    time: FractionDescriptor;
    animKey: TimelineAnimKeyDescriptor;
    selected: boolean;
}
export interface TimelineTrackDescriptor {
    trackID: 'stdTrackID.globalLightingTrack' | 'stdTrackID.opacityTrack' | 'stdTrackID.styleTrack' | 'stdTrackID.sheetTransformTrack' | 'stdTrackID.sheetPositionTrack';
    Vrsn: 1;
    enab: boolean;
    Effc: boolean;
    effectParams?: {
        keyList: TimelineKeyDescriptor[];
        fillCanvas: boolean;
        zoomOrigin: number;
    };
    keyList: TimelineKeyDescriptor[];
}
export interface TimeScopeDescriptor {
    Vrsn: 1;
    Strt: FractionDescriptor;
    duration: FractionDescriptor;
    inTime: FractionDescriptor;
    outTime: FractionDescriptor;
}
export interface TimelineDescriptor {
    Vrsn: 1;
    timeScope: TimeScopeDescriptor;
    autoScope: boolean;
    audioLevel: number;
    LyrI: number;
    trackList?: TimelineTrackDescriptor[];
}
export interface EffectDescriptor extends Partial<DescriptorGradientContent>, Partial<DescriptorPatternContent> {
    enab?: boolean;
    Styl: string;
    PntT?: string;
    'Md  '?: string;
    Opct?: DescriptorUnitsValue;
    'Sz  '?: DescriptorUnitsValue;
    'Clr '?: DescriptorColor;
    present?: boolean;
    showInDialog?: boolean;
    overprint?: boolean;
}
export interface Lfx2Descriptor {
    'Scl '?: DescriptorUnitsValue;
    masterFXSwitch?: boolean;
    DrSh?: EffectDescriptor;
    IrSh?: EffectDescriptor;
    OrGl?: EffectDescriptor;
    IrGl?: EffectDescriptor;
    ebbl?: EffectDescriptor;
    SoFi?: EffectDescriptor;
    patternFill?: EffectDescriptor;
    GrFl?: EffectDescriptor;
    ChFX?: EffectDescriptor;
    FrFX?: EffectDescriptor;
}
export interface LmfxDescriptor {
    'Scl '?: DescriptorUnitsValue;
    masterFXSwitch?: boolean;
    numModifyingFX?: number;
    OrGl?: EffectDescriptor;
    IrGl?: EffectDescriptor;
    ebbl?: EffectDescriptor;
    ChFX?: EffectDescriptor;
    dropShadowMulti?: EffectDescriptor[];
    innerShadowMulti?: EffectDescriptor[];
    solidFillMulti?: EffectDescriptor[];
    gradientFillMulti?: EffectDescriptor[];
    frameFXMulti?: EffectDescriptor[];
    patternFill?: EffectDescriptor;
}
export declare function serializeEffects(e: LayerEffectsInfo, log: boolean, multi: boolean): Lfx2Descriptor & LmfxDescriptor;
export declare function parseEffects(info: Lfx2Descriptor & LmfxDescriptor, log: boolean): LayerEffectsInfo;
export declare function parseTrackList(trackList: TimelineTrackDescriptor[], logMissingFeatures: boolean): TimelineTrack[];
export declare function serializeTrackList(tracks: TimelineTrack[]): TimelineTrackDescriptor[];
export declare function parseVectorContent(descriptor: DescriptorVectorContent): VectorContent;
export declare function serializeVectorContent(content: VectorContent): {
    descriptor: DescriptorVectorContent;
    key: string;
};
export declare function parseColor(color: DescriptorColor): Color;
export declare function serializeColor(color: Color | undefined): DescriptorColor;
export declare function parseAngle(x: DescriptorUnitsValue): number;
export declare function parsePercent(x: DescriptorUnitsValue | undefined): number;
export declare function parsePercentOrAngle(x: DescriptorUnitsValue | undefined): number;
export declare function parseUnits({ units, value }: DescriptorUnitsValue): UnitsValue;
export declare function parseUnitsOrNumber(value: DescriptorUnitsValue | number, units?: Units): UnitsValue;
export declare function parseUnitsToNumber({ units, value }: DescriptorUnitsValue, expectedUnits: string): number;
export declare function unitsAngle(value: number | undefined): DescriptorUnitsValue;
export declare function unitsPercent(value: number | undefined): DescriptorUnitsValue;
export declare function unitsValue(x: UnitsValue | undefined, key: string): DescriptorUnitsValue;
export declare const textGridding: {
    decode: (val: string) => TextGridding;
    encode: (val: TextGridding | undefined) => string;
};
export declare const Ornt: {
    decode: (val: string) => Orientation;
    encode: (val: Orientation | undefined) => string;
};
export declare const Annt: {
    decode: (val: string) => AntiAlias;
    encode: (val: AntiAlias | undefined) => string;
};
export declare const warpStyle: {
    decode: (val: string) => WarpStyle;
    encode: (val: WarpStyle | undefined) => string;
};
export declare const BlnM: {
    decode: (val: string) => BlendMode;
    encode: (val: BlendMode | undefined) => string;
};
export declare const BESl: {
    decode: (val: string) => BevelStyle;
    encode: (val: BevelStyle | undefined) => string;
};
export declare const bvlT: {
    decode: (val: string) => BevelTechnique;
    encode: (val: BevelTechnique | undefined) => string;
};
export declare const BESs: {
    decode: (val: string) => BevelDirection;
    encode: (val: BevelDirection | undefined) => string;
};
export declare const BETE: {
    decode: (val: string) => GlowTechnique;
    encode: (val: GlowTechnique | undefined) => string;
};
export declare const IGSr: {
    decode: (val: string) => GlowSource;
    encode: (val: GlowSource | undefined) => string;
};
export declare const GrdT: {
    decode: (val: string) => GradientStyle;
    encode: (val: GradientStyle | undefined) => string;
};
export declare const animInterpStyleEnum: {
    decode: (val: string) => TimelineKeyInterpolation;
    encode: (val: TimelineKeyInterpolation | undefined) => string;
};
export declare const stdTrackID: {
    decode: (val: string) => TimelineTrackType;
    encode: (val: TimelineTrackType | undefined) => string;
};
export declare const gradientInterpolationMethodType: {
    decode: (val: string) => InterpolationMethod;
    encode: (val: InterpolationMethod | undefined) => string;
};
export declare const ClrS: {
    decode: (val: string) => "rgb" | "hsb" | "lab";
    encode: (val: "rgb" | "hsb" | "lab" | undefined) => string;
};
export declare const FStl: {
    decode: (val: string) => "center" | "inside" | "outside";
    encode: (val: "center" | "inside" | "outside" | undefined) => string;
};
export declare const FrFl: {
    decode: (val: string) => "color" | "pattern" | "gradient";
    encode: (val: "color" | "pattern" | "gradient" | undefined) => string;
};
export declare const ESliceType: {
    decode: (val: string) => "image" | "noImage";
    encode: (val: "image" | "noImage" | undefined) => string;
};
export declare const ESliceHorzAlign: {
    decode: (val: string) => "default";
    encode: (val: "default" | undefined) => string;
};
export declare const ESliceVertAlign: {
    decode: (val: string) => "default";
    encode: (val: "default" | undefined) => string;
};
export declare const ESliceOrigin: {
    decode: (val: string) => "userGenerated" | "autoGenerated" | "layer";
    encode: (val: "userGenerated" | "autoGenerated" | "layer" | undefined) => string;
};
export declare const ESliceBGColorType: {
    decode: (val: string) => "none" | "color" | "matte";
    encode: (val: "none" | "color" | "matte" | undefined) => string;
};
export declare const strokeStyleLineCapType: {
    decode: (val: string) => LineCapType;
    encode: (val: LineCapType | undefined) => string;
};
export declare const strokeStyleLineJoinType: {
    decode: (val: string) => LineJoinType;
    encode: (val: LineJoinType | undefined) => string;
};
export declare const strokeStyleLineAlignment: {
    decode: (val: string) => LineAlignment;
    encode: (val: LineAlignment | undefined) => string;
};
