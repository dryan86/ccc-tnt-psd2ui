export declare type BlendMode = 'pass through' | 'normal' | 'dissolve' | 'darken' | 'multiply' | 'color burn' | 'linear burn' | 'darker color' | 'lighten' | 'screen' | 'color dodge' | 'linear dodge' | 'lighter color' | 'overlay' | 'soft light' | 'hard light' | 'vivid light' | 'linear light' | 'pin light' | 'hard mix' | 'difference' | 'exclusion' | 'subtract' | 'divide' | 'hue' | 'saturation' | 'color' | 'luminosity';
export declare const enum ColorMode {
    Bitmap = 0,
    Grayscale = 1,
    Indexed = 2,
    RGB = 3,
    CMYK = 4,
    Multichannel = 7,
    Duotone = 8,
    Lab = 9
}
export declare const enum SectionDividerType {
    Other = 0,
    OpenFolder = 1,
    ClosedFolder = 2,
    BoundingSectionDivider = 3
}
export declare type RGBA = {
    r: number;
    g: number;
    b: number;
    a: number;
};
export declare type RGB = {
    r: number;
    g: number;
    b: number;
};
export declare type HSB = {
    h: number;
    s: number;
    b: number;
};
export declare type CMYK = {
    c: number;
    m: number;
    y: number;
    k: number;
};
export declare type LAB = {
    l: number;
    a: number;
    b: number;
};
export declare type Grayscale = {
    k: number;
};
export declare type Color = RGBA | RGB | HSB | CMYK | LAB | Grayscale;
export interface EffectContour {
    name: string;
    curve: {
        x: number;
        y: number;
    }[];
}
export interface EffectPattern {
    name: string;
    id: string;
}
export interface LayerEffectShadow {
    present?: boolean;
    showInDialog?: boolean;
    enabled?: boolean;
    size?: UnitsValue;
    angle?: number;
    distance?: UnitsValue;
    color?: Color;
    blendMode?: BlendMode;
    opacity?: number;
    useGlobalLight?: boolean;
    antialiased?: boolean;
    contour?: EffectContour;
    choke?: UnitsValue;
    layerConceals?: boolean;
}
export interface LayerEffectsOuterGlow {
    present?: boolean;
    showInDialog?: boolean;
    enabled?: boolean;
    size?: UnitsValue;
    color?: Color;
    blendMode?: BlendMode;
    opacity?: number;
    source?: GlowSource;
    antialiased?: boolean;
    noise?: number;
    range?: number;
    choke?: UnitsValue;
    jitter?: number;
    contour?: EffectContour;
}
export interface LayerEffectInnerGlow {
    present?: boolean;
    showInDialog?: boolean;
    enabled?: boolean;
    size?: UnitsValue;
    color?: Color;
    blendMode?: BlendMode;
    opacity?: number;
    source?: GlowSource;
    technique?: GlowTechnique;
    antialiased?: boolean;
    noise?: number;
    range?: number;
    choke?: UnitsValue;
    jitter?: number;
    contour?: EffectContour;
}
export interface LayerEffectBevel {
    present?: boolean;
    showInDialog?: boolean;
    enabled?: boolean;
    size?: UnitsValue;
    angle?: number;
    strength?: number;
    highlightBlendMode?: BlendMode;
    shadowBlendMode?: BlendMode;
    highlightColor?: Color;
    shadowColor?: Color;
    style?: BevelStyle;
    highlightOpacity?: number;
    shadowOpacity?: number;
    soften?: UnitsValue;
    useGlobalLight?: boolean;
    altitude?: number;
    technique?: BevelTechnique;
    direction?: BevelDirection;
    useTexture?: boolean;
    useShape?: boolean;
    antialiasGloss?: boolean;
    contour?: EffectContour;
}
export interface LayerEffectSolidFill {
    present?: boolean;
    showInDialog?: boolean;
    enabled?: boolean;
    blendMode?: BlendMode;
    color?: Color;
    opacity?: number;
}
export interface LayerEffectStroke {
    present?: boolean;
    showInDialog?: boolean;
    enabled?: boolean;
    overprint?: boolean;
    size?: UnitsValue;
    position?: 'inside' | 'center' | 'outside';
    fillType?: 'color' | 'gradient' | 'pattern';
    blendMode?: BlendMode;
    opacity?: number;
    color?: Color;
    gradient?: (EffectSolidGradient | EffectNoiseGradient) & ExtraGradientInfo;
    pattern?: EffectPattern & {};
}
export interface LayerEffectSatin {
    present?: boolean;
    showInDialog?: boolean;
    enabled?: boolean;
    size?: UnitsValue;
    blendMode?: BlendMode;
    color?: Color;
    antialiased?: boolean;
    opacity?: number;
    distance?: UnitsValue;
    invert?: boolean;
    angle?: number;
    contour?: EffectContour;
}
export interface LayerEffectPatternOverlay {
    present?: boolean;
    showInDialog?: boolean;
    enabled?: boolean;
    blendMode?: BlendMode;
    opacity?: number;
    scale?: number;
    pattern?: EffectPattern;
    phase?: {
        x: number;
        y: number;
    };
    align?: boolean;
}
export interface EffectSolidGradient {
    name: string;
    type: 'solid';
    smoothness?: number;
    colorStops: ColorStop[];
    opacityStops: OpacityStop[];
}
export interface EffectNoiseGradient {
    name: string;
    type: 'noise';
    roughness?: number;
    colorModel?: 'rgb' | 'hsb' | 'lab';
    randomSeed?: number;
    restrictColors?: boolean;
    addTransparency?: boolean;
    min: number[];
    max: number[];
}
export interface LayerEffectGradientOverlay {
    present?: boolean;
    showInDialog?: boolean;
    enabled?: boolean;
    blendMode?: string;
    opacity?: number;
    align?: boolean;
    scale?: number;
    dither?: boolean;
    reverse?: boolean;
    type?: GradientStyle;
    offset?: {
        x: number;
        y: number;
    };
    gradient?: EffectSolidGradient | EffectNoiseGradient;
    interpolationMethod?: InterpolationMethod;
}
export interface LayerEffectsInfo {
    disabled?: boolean;
    scale?: number;
    dropShadow?: LayerEffectShadow[];
    innerShadow?: LayerEffectShadow[];
    outerGlow?: LayerEffectsOuterGlow;
    innerGlow?: LayerEffectInnerGlow;
    bevel?: LayerEffectBevel;
    solidFill?: LayerEffectSolidFill[];
    satin?: LayerEffectSatin;
    stroke?: LayerEffectStroke[];
    gradientOverlay?: LayerEffectGradientOverlay[];
    patternOverlay?: LayerEffectPatternOverlay;
}
export interface LayerMaskData {
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
    defaultColor?: number;
    disabled?: boolean;
    positionRelativeToLayer?: boolean;
    fromVectorData?: boolean;
    userMaskDensity?: number;
    userMaskFeather?: number;
    vectorMaskDensity?: number;
    vectorMaskFeather?: number;
    canvas?: HTMLCanvasElement;
    imageData?: ImageData;
}
export declare type TextGridding = 'none' | 'round';
export declare type Orientation = 'horizontal' | 'vertical';
export declare type AntiAlias = 'none' | 'sharp' | 'crisp' | 'strong' | 'smooth' | 'platform' | 'platformLCD';
export declare type WarpStyle = 'none' | 'arc' | 'arcLower' | 'arcUpper' | 'arch' | 'bulge' | 'shellLower' | 'shellUpper' | 'flag' | 'wave' | 'fish' | 'rise' | 'fisheye' | 'inflate' | 'squeeze' | 'twist' | 'custom';
export declare type BevelStyle = 'outer bevel' | 'inner bevel' | 'emboss' | 'pillow emboss' | 'stroke emboss';
export declare type BevelTechnique = 'smooth' | 'chisel hard' | 'chisel soft';
export declare type BevelDirection = 'up' | 'down';
export declare type GlowTechnique = 'softer' | 'precise';
export declare type GlowSource = 'edge' | 'center';
export declare type GradientStyle = 'linear' | 'radial' | 'angle' | 'reflected' | 'diamond';
export declare type Justification = 'left' | 'right' | 'center';
export declare type LineCapType = 'butt' | 'round' | 'square';
export declare type LineJoinType = 'miter' | 'round' | 'bevel';
export declare type LineAlignment = 'inside' | 'center' | 'outside';
export declare type InterpolationMethod = 'classic' | 'perceptual' | 'linear';
export interface Warp {
    style?: WarpStyle;
    value?: number;
    perspective?: number;
    perspectiveOther?: number;
    rotate?: Orientation;
    bounds?: {
        top: UnitsValue;
        left: UnitsValue;
        bottom: UnitsValue;
        right: UnitsValue;
    };
    uOrder?: number;
    vOrder?: number;
    deformNumRows?: number;
    deformNumCols?: number;
    customEnvelopeWarp?: {
        quiltSliceX?: number[];
        quiltSliceY?: number[];
        meshPoints: {
            x: number;
            y: number;
        }[];
    };
}
export interface Animations {
    frames: {
        id: number;
        delay: number;
        dispose?: 'auto' | 'none' | 'dispose';
    }[];
    animations: {
        id: number;
        frames: number[];
        repeats?: number;
        activeFrame?: number;
    }[];
}
export interface Font {
    name: string;
    script?: number;
    type?: number;
    synthetic?: number;
}
export interface ParagraphStyle {
    justification?: Justification;
    firstLineIndent?: number;
    startIndent?: number;
    endIndent?: number;
    spaceBefore?: number;
    spaceAfter?: number;
    autoHyphenate?: boolean;
    hyphenatedWordSize?: number;
    preHyphen?: number;
    postHyphen?: number;
    consecutiveHyphens?: number;
    zone?: number;
    wordSpacing?: number[];
    letterSpacing?: number[];
    glyphSpacing?: number[];
    autoLeading?: number;
    leadingType?: number;
    hanging?: boolean;
    burasagari?: boolean;
    kinsokuOrder?: number;
    everyLineComposer?: boolean;
}
export interface ParagraphStyleRun {
    length: number;
    style: ParagraphStyle;
}
export interface TextStyle {
    font?: Font;
    fontSize?: number;
    fauxBold?: boolean;
    fauxItalic?: boolean;
    autoLeading?: boolean;
    leading?: number;
    horizontalScale?: number;
    verticalScale?: number;
    tracking?: number;
    autoKerning?: boolean;
    kerning?: number;
    baselineShift?: number;
    fontCaps?: number;
    fontBaseline?: number;
    underline?: boolean;
    strikethrough?: boolean;
    ligatures?: boolean;
    dLigatures?: boolean;
    baselineDirection?: number;
    tsume?: number;
    styleRunAlignment?: number;
    language?: number;
    noBreak?: boolean;
    fillColor?: Color;
    strokeColor?: Color;
    fillFlag?: boolean;
    strokeFlag?: boolean;
    fillFirst?: boolean;
    yUnderline?: number;
    outlineWidth?: number;
    characterDirection?: number;
    hindiNumbers?: boolean;
    kashida?: number;
    diacriticPos?: number;
}
export interface TextStyleRun {
    length: number;
    style: TextStyle;
}
export interface TextGridInfo {
    isOn?: boolean;
    show?: boolean;
    size?: number;
    leading?: number;
    color?: Color;
    leadingFillColor?: Color;
    alignLineHeightToGridFlags?: boolean;
}
export interface LayerTextData {
    text: string;
    transform?: number[];
    antiAlias?: AntiAlias;
    gridding?: TextGridding;
    orientation?: Orientation;
    index?: number;
    warp?: Warp;
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
    gridInfo?: TextGridInfo;
    useFractionalGlyphWidths?: boolean;
    style?: TextStyle;
    styleRuns?: TextStyleRun[];
    paragraphStyle?: ParagraphStyle;
    paragraphStyleRuns?: ParagraphStyleRun[];
    superscriptSize?: number;
    superscriptPosition?: number;
    subscriptSize?: number;
    subscriptPosition?: number;
    smallCapSize?: number;
    shapeType?: 'point' | 'box';
    pointBase?: number[];
    boxBounds?: number[];
}
export interface PatternInfo {
    name: string;
    id: string;
    x: number;
    y: number;
    bounds: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    data: Uint8Array;
}
export interface BezierKnot {
    linked: boolean;
    points: number[];
}
export declare type BooleanOperation = 'exclude' | 'combine' | 'subtract' | 'intersect';
export interface BezierPath {
    open: boolean;
    operation: BooleanOperation;
    knots: BezierKnot[];
}
export interface ExtraGradientInfo {
    style?: GradientStyle;
    scale?: number;
    angle?: number;
    dither?: boolean;
    reverse?: boolean;
    align?: boolean;
    offset?: {
        x: number;
        y: number;
    };
}
export interface ExtraPatternInfo {
    linked?: boolean;
    phase?: {
        x: number;
        y: number;
    };
}
export declare type VectorContent = {
    type: 'color';
    color: Color;
} | (EffectSolidGradient & ExtraGradientInfo) | (EffectNoiseGradient & ExtraGradientInfo) | (EffectPattern & {
    type: 'pattern';
} & ExtraPatternInfo);
export declare type RenderingIntent = 'perceptual' | 'saturation' | 'relative colorimetric' | 'absolute colorimetric';
export declare type Units = 'Pixels' | 'Points' | 'Picas' | 'Millimeters' | 'Centimeters' | 'Inches' | 'None' | 'Density';
export interface UnitsValue {
    units: Units;
    value: number;
}
export interface BrightnessAdjustment {
    type: 'brightness/contrast';
    brightness?: number;
    contrast?: number;
    meanValue?: number;
    useLegacy?: boolean;
    labColorOnly?: boolean;
    auto?: boolean;
}
export interface LevelsAdjustmentChannel {
    shadowInput: number;
    highlightInput: number;
    shadowOutput: number;
    highlightOutput: number;
    midtoneInput: number;
}
export interface PresetInfo {
    presetKind?: number;
    presetFileName?: string;
}
export interface LevelsAdjustment extends PresetInfo {
    type: 'levels';
    rgb?: LevelsAdjustmentChannel;
    red?: LevelsAdjustmentChannel;
    green?: LevelsAdjustmentChannel;
    blue?: LevelsAdjustmentChannel;
}
export declare type CurvesAdjustmentChannel = {
    input: number;
    output: number;
}[];
export interface CurvesAdjustment extends PresetInfo {
    type: 'curves';
    rgb?: CurvesAdjustmentChannel;
    red?: CurvesAdjustmentChannel;
    green?: CurvesAdjustmentChannel;
    blue?: CurvesAdjustmentChannel;
}
export interface ExposureAdjustment extends PresetInfo {
    type: 'exposure';
    exposure?: number;
    offset?: number;
    gamma?: number;
}
export interface VibranceAdjustment {
    type: 'vibrance';
    vibrance?: number;
    saturation?: number;
}
export interface HueSaturationAdjustmentChannel {
    a: number;
    b: number;
    c: number;
    d: number;
    hue: number;
    saturation: number;
    lightness: number;
}
export interface HueSaturationAdjustment extends PresetInfo {
    type: 'hue/saturation';
    master?: HueSaturationAdjustmentChannel;
    reds?: HueSaturationAdjustmentChannel;
    yellows?: HueSaturationAdjustmentChannel;
    greens?: HueSaturationAdjustmentChannel;
    cyans?: HueSaturationAdjustmentChannel;
    blues?: HueSaturationAdjustmentChannel;
    magentas?: HueSaturationAdjustmentChannel;
}
export interface ColorBalanceValues {
    cyanRed: number;
    magentaGreen: number;
    yellowBlue: number;
}
export interface ColorBalanceAdjustment {
    type: 'color balance';
    shadows?: ColorBalanceValues;
    midtones?: ColorBalanceValues;
    highlights?: ColorBalanceValues;
    preserveLuminosity?: boolean;
}
export interface BlackAndWhiteAdjustment extends PresetInfo {
    type: 'black & white';
    reds?: number;
    yellows?: number;
    greens?: number;
    cyans?: number;
    blues?: number;
    magentas?: number;
    useTint?: boolean;
    tintColor?: Color;
}
export interface PhotoFilterAdjustment {
    type: 'photo filter';
    color?: Color;
    density?: number;
    preserveLuminosity?: boolean;
}
export interface ChannelMixerChannel {
    red: number;
    green: number;
    blue: number;
    constant: number;
}
export interface ChannelMixerAdjustment extends PresetInfo {
    type: 'channel mixer';
    monochrome?: boolean;
    red?: ChannelMixerChannel;
    green?: ChannelMixerChannel;
    blue?: ChannelMixerChannel;
    gray?: ChannelMixerChannel;
}
export interface ColorLookupAdjustment {
    type: 'color lookup';
    lookupType?: '3dlut' | 'abstractProfile' | 'deviceLinkProfile';
    name?: string;
    dither?: boolean;
    profile?: Uint8Array;
    lutFormat?: 'look' | 'cube' | '3dl';
    dataOrder?: 'rgb' | 'bgr';
    tableOrder?: 'rgb' | 'bgr';
    lut3DFileData?: Uint8Array;
    lut3DFileName?: string;
}
export interface InvertAdjustment {
    type: 'invert';
}
export interface PosterizeAdjustment {
    type: 'posterize';
    levels?: number;
}
export interface ThresholdAdjustment {
    type: 'threshold';
    level?: number;
}
export interface ColorStop {
    color: Color;
    location: number;
    midpoint: number;
}
export interface OpacityStop {
    opacity: number;
    location: number;
    midpoint: number;
}
export interface GradientMapAdjustment {
    type: 'gradient map';
    name?: string;
    gradientType: 'solid' | 'noise';
    dither?: boolean;
    reverse?: boolean;
    smoothness?: number;
    colorStops?: ColorStop[];
    opacityStops?: OpacityStop[];
    roughness?: number;
    colorModel?: 'rgb' | 'hsb' | 'lab';
    randomSeed?: number;
    restrictColors?: boolean;
    addTransparency?: boolean;
    min?: number[];
    max?: number[];
}
export interface SelectiveColorAdjustment {
    type: 'selective color';
    mode?: 'relative' | 'absolute';
    reds?: CMYK;
    yellows?: CMYK;
    greens?: CMYK;
    cyans?: CMYK;
    blues?: CMYK;
    magentas?: CMYK;
    whites?: CMYK;
    neutrals?: CMYK;
    blacks?: CMYK;
}
export interface LinkedFile {
    id: string;
    name: string;
    type?: string;
    creator?: string;
    data?: Uint8Array;
    time?: Date;
    descriptor?: {
        compInfo: {
            compID: number;
            originalCompID: number;
        };
    };
    childDocumentID?: string;
    assetModTime?: number;
    assetLockedState?: number;
}
export declare type PlacedLayerType = 'unknown' | 'vector' | 'raster' | 'image stack';
export interface PlacedLayer {
    id: string;
    placed?: string;
    type: PlacedLayerType;
    pageNumber?: number;
    totalPages?: number;
    frameStep?: {
        numerator: number;
        denominator: number;
    };
    duration?: {
        numerator: number;
        denominator: number;
    };
    frameCount?: number;
    transform: number[];
    nonAffineTransform?: number[];
    width?: number;
    height?: number;
    resolution?: UnitsValue;
    warp?: Warp;
    crop?: number;
    comp?: number;
    compInfo?: {
        compID: number;
        originalCompID: number;
    };
}
export declare type AdjustmentLayer = BrightnessAdjustment | LevelsAdjustment | CurvesAdjustment | ExposureAdjustment | VibranceAdjustment | HueSaturationAdjustment | ColorBalanceAdjustment | BlackAndWhiteAdjustment | PhotoFilterAdjustment | ChannelMixerAdjustment | ColorLookupAdjustment | InvertAdjustment | PosterizeAdjustment | ThresholdAdjustment | GradientMapAdjustment | SelectiveColorAdjustment;
export declare type LayerColor = 'none' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'violet' | 'gray';
export interface KeyDescriptorItem {
    keyShapeInvalidated?: boolean;
    keyOriginType?: number;
    keyOriginResolution?: number;
    keyOriginRRectRadii?: {
        topRight: UnitsValue;
        topLeft: UnitsValue;
        bottomLeft: UnitsValue;
        bottomRight: UnitsValue;
    };
    keyOriginShapeBoundingBox?: {
        top: UnitsValue;
        left: UnitsValue;
        bottom: UnitsValue;
        right: UnitsValue;
    };
    keyOriginBoxCorners?: {
        x: number;
        y: number;
    }[];
    transform?: number[];
}
export interface LayerVectorMask {
    invert?: boolean;
    notLink?: boolean;
    disable?: boolean;
    fillStartsWithAllPixels?: boolean;
    clipboard?: {
        top: number;
        left: number;
        bottom: number;
        right: number;
        resolution: number;
    };
    paths: BezierPath[];
}
export interface AnimationFrame {
    frames: number[];
    enable?: boolean;
    offset?: {
        x: number;
        y: number;
    };
    referencePoint?: {
        x: number;
        y: number;
    };
    opacity?: number;
    effects?: LayerEffectsInfo;
}
export interface Fraction {
    numerator: number;
    denominator: number;
}
export declare type TimelineKeyInterpolation = 'linear' | 'hold';
export declare type TimelineKey = {
    interpolation: TimelineKeyInterpolation;
    time: Fraction;
    selected?: boolean;
} & ({
    type: 'opacity';
    value: number;
} | {
    type: 'position';
    x: number;
    y: number;
} | {
    type: 'transform';
    scale: {
        x: number;
        y: number;
    };
    skew: {
        x: number;
        y: number;
    };
    rotation: number;
    translation: {
        x: number;
        y: number;
    };
} | {
    type: 'style';
    style?: LayerEffectsInfo;
} | {
    type: 'globalLighting';
    globalAngle: number;
    globalAltitude: number;
});
export declare type TimelineTrackType = 'opacity' | 'style' | 'sheetTransform' | 'sheetPosition' | 'globalLighting';
export interface TimelineTrack {
    type: TimelineTrackType;
    enabled?: boolean;
    effectParams?: {
        keys: TimelineKey[];
        fillCanvas: boolean;
        zoomOrigin: number;
    };
    keys: TimelineKey[];
}
export interface Timeline {
    start: Fraction;
    duration: Fraction;
    inTime: Fraction;
    outTime: Fraction;
    autoScope: boolean;
    audioLevel: number;
    tracks?: TimelineTrack[];
}
export interface LayerAdditionalInfo {
    name?: string;
    nameSource?: string;
    id?: number;
    version?: number;
    mask?: LayerMaskData;
    blendClippendElements?: boolean;
    blendInteriorElements?: boolean;
    knockout?: boolean;
    layerMaskAsGlobalMask?: boolean;
    protected?: {
        transparency?: boolean;
        composite?: boolean;
        position?: boolean;
        artboards?: boolean;
    };
    layerColor?: LayerColor;
    referencePoint?: {
        x: number;
        y: number;
    };
    sectionDivider?: {
        type: SectionDividerType;
        key?: string;
        subType?: number;
    };
    filterMask?: {
        colorSpace: Color;
        opacity: number;
    };
    effects?: LayerEffectsInfo;
    text?: LayerTextData;
    patterns?: PatternInfo[];
    vectorFill?: VectorContent;
    vectorStroke?: {
        strokeEnabled?: boolean;
        fillEnabled?: boolean;
        lineWidth?: UnitsValue;
        lineDashOffset?: UnitsValue;
        miterLimit?: number;
        lineCapType?: LineCapType;
        lineJoinType?: LineJoinType;
        lineAlignment?: LineAlignment;
        scaleLock?: boolean;
        strokeAdjust?: boolean;
        lineDashSet?: UnitsValue[];
        blendMode?: BlendMode;
        opacity?: number;
        content?: VectorContent;
        resolution?: number;
    };
    vectorMask?: LayerVectorMask;
    usingAlignedRendering?: boolean;
    timestamp?: number;
    pathList?: {}[];
    adjustment?: AdjustmentLayer;
    placedLayer?: PlacedLayer;
    vectorOrigination?: {
        keyDescriptorList: KeyDescriptorItem[];
    };
    compositorUsed?: {
        description: string;
        reason: string;
        engine: string;
        enableCompCore: string;
        enableCompCoreGPU: string;
        compCoreSupport: string;
        compCoreGPUSupport: string;
    };
    artboard?: {
        rect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
        guideIndices?: any[];
        presetName?: string;
        color?: Color;
        backgroundType?: number;
    };
    fillOpacity?: number;
    transparencyShapesLayer?: boolean;
    channelBlendingRestrictions?: number[];
    animationFrames?: AnimationFrame[];
    animationFrameFlags?: {
        propagateFrameOne?: boolean;
        unifyLayerPosition?: boolean;
        unifyLayerStyle?: boolean;
        unifyLayerVisibility?: boolean;
    };
    timeline?: Timeline;
    engineData?: string;
}
export interface ImageResources {
    layerState?: number;
    layersGroup?: number[];
    layerSelectionIds?: number[];
    layerGroupsEnabledId?: number[];
    versionInfo?: {
        hasRealMergedData: boolean;
        writerName: string;
        readerName: string;
        fileVersion: number;
    };
    alphaIdentifiers?: number[];
    alphaChannelNames?: string[];
    globalAngle?: number;
    globalAltitude?: number;
    pixelAspectRatio?: {
        aspect: number;
    };
    urlsList?: any[];
    gridAndGuidesInformation?: {
        grid?: {
            horizontal: number;
            vertical: number;
        };
        guides?: {
            location: number;
            direction: 'horizontal' | 'vertical';
        }[];
    };
    resolutionInfo?: {
        horizontalResolution: number;
        horizontalResolutionUnit: 'PPI' | 'PPCM';
        widthUnit: 'Inches' | 'Centimeters' | 'Points' | 'Picas' | 'Columns';
        verticalResolution: number;
        verticalResolutionUnit: 'PPI' | 'PPCM';
        heightUnit: 'Inches' | 'Centimeters' | 'Points' | 'Picas' | 'Columns';
    };
    thumbnail?: HTMLCanvasElement;
    thumbnailRaw?: {
        width: number;
        height: number;
        data: Uint8Array;
    };
    captionDigest?: string;
    xmpMetadata?: string;
    printScale?: {
        style?: 'centered' | 'size to fit' | 'user defined';
        x?: number;
        y?: number;
        scale?: number;
    };
    printInformation?: {
        printerManagesColors?: boolean;
        printerName?: string;
        printerProfile?: string;
        printSixteenBit?: boolean;
        renderingIntent?: RenderingIntent;
        hardProof?: boolean;
        blackPointCompensation?: boolean;
        proofSetup?: {
            builtin: string;
        } | {
            profile: string;
            renderingIntent?: RenderingIntent;
            blackPointCompensation?: boolean;
            paperWhite?: boolean;
        };
    };
    backgroundColor?: Color;
    idsSeedNumber?: number;
    printFlags?: {
        labels?: boolean;
        cropMarks?: boolean;
        colorBars?: boolean;
        registrationMarks?: boolean;
        negative?: boolean;
        flip?: boolean;
        interpolate?: boolean;
        caption?: boolean;
        printFlags?: boolean;
    };
    iccUntaggedProfile?: boolean;
    pathSelectionState?: string[];
    imageReadyVariables?: string;
    imageReadyDataSets?: string;
    animations?: Animations;
    onionSkins?: {
        enabled: boolean;
        framesBefore: number;
        framesAfter: number;
        frameSpacing: number;
        minOpacity: number;
        maxOpacity: number;
        blendMode: BlendMode;
    };
    timelineInformation?: {
        enabled: boolean;
        frameStep: Fraction;
        frameRate: number;
        time: Fraction;
        duration: Fraction;
        workInTime: Fraction;
        workOutTime: Fraction;
        repeats: number;
        hasMotion: boolean;
        globalTracks: TimelineTrack[];
        audioClipGroups?: {
            id: string;
            muted: boolean;
            audioClips: {
                id: string;
                start: Fraction;
                duration: Fraction;
                inTime: Fraction;
                outTime: Fraction;
                muted: boolean;
                audioLevel: number;
                frameReader: {
                    type: number;
                    mediaDescriptor: string;
                    link: {
                        name: string;
                        fullPath: string;
                        relativePath: string;
                    };
                };
            }[];
        }[];
    };
    sheetDisclosure?: {
        sheetTimelineOptions?: {
            sheetID: number;
            sheetDisclosed: boolean;
            lightsDisclosed: boolean;
            meshesDisclosed: boolean;
            materialsDisclosed: boolean;
        }[];
    };
}
export interface GlobalLayerMaskInfo {
    overlayColorSpace: number;
    colorSpace1: number;
    colorSpace2: number;
    colorSpace3: number;
    colorSpace4: number;
    opacity: number;
    kind: number;
}
export interface Annotation {
    type: 'text' | 'sound';
    open: boolean;
    iconLocation: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
    popupLocation: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
    color: Color;
    author: string;
    name: string;
    date: string;
    data: string | Uint8Array;
}
export interface Layer extends LayerAdditionalInfo {
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
    blendMode?: BlendMode;
    opacity?: number;
    transparencyProtected?: boolean;
    hidden?: boolean;
    clipping?: boolean;
    canvas?: HTMLCanvasElement;
    imageData?: ImageData;
    children?: Layer[];
    /** Applies only for layer groups. */
    opened?: boolean;
}
export interface Psd extends LayerAdditionalInfo {
    width: number;
    height: number;
    channels?: number;
    bitsPerChannel?: number;
    colorMode?: ColorMode;
    children?: Layer[];
    canvas?: HTMLCanvasElement;
    imageData?: ImageData;
    imageResources?: ImageResources;
    linkedFiles?: LinkedFile[];
    artboards?: {
        count: number;
        autoExpandOffset?: {
            horizontal: number;
            vertical: number;
        };
        origin?: {
            horizontal: number;
            vertical: number;
        };
        autoExpandEnabled?: boolean;
        autoNestEnabled?: boolean;
        autoPositionEnabled?: boolean;
        shrinkwrapOnSaveEnabled?: boolean;
        docDefaultNewArtboardBackgroundColor?: Color;
        docDefaultNewArtboardBackgroundType?: number;
    };
    globalLayerMaskInfo?: GlobalLayerMaskInfo;
    annotations?: Annotation[];
}
export interface ReadOptions {
    /** Does not load layer image data. */
    skipLayerImageData?: boolean;
    /** Does not load composite image data. */
    skipCompositeImageData?: boolean;
    /** Does not load thumbnail. */
    skipThumbnail?: boolean;
    /** Does not load linked files (used in smart-objects). */
    skipLinkedFilesData?: boolean;
    /** Throws exception if features are missing. */
    throwForMissingFeatures?: boolean;
    /** Logs if features are missing. */
    logMissingFeatures?: boolean;
    /** Keep image data as byte array instead of canvas.
     * (image data will appear in `imageData` fields instead of `canvas` fields)
     * This avoids issues with canvas premultiplied alpha corrupting image data. */
    useImageData?: boolean;
    /** Loads thumbnail raw data instead of decoding it's content into canvas.
     * `thumnailRaw` field is used instead. */
    useRawThumbnail?: boolean;
    /** Usend only for development. */
    logDevFeatures?: boolean;
}
export interface WriteOptions {
    /** Automatically generates thumbnail from composite image. */
    generateThumbnail?: boolean;
    /** Trims transparent pixels from layer image data. */
    trimImageData?: boolean;
    /** Invalidates text layer data, forcing Photoshop to redraw them on load.
     *  Use this option if you're updating loaded text layer properties. */
    invalidateTextLayers?: boolean;
    /** Logs if features are missing. */
    logMissingFeatures?: boolean;
    /** Forces bottom layer to be treated as layer and not background even when it's missing any transparency
     * 	(by default Photoshop treats bottom layer as background it it doesn't have any transparent pixels). */
    noBackground?: boolean;
    /** Saves document as PSB (Large Document Format) file. */
    psb?: boolean;
    /** Uses zip compression when writing PSD file, will result in smaller file size but may be incompatible
     *  with some software. It may also be significantly slower. */
    compress?: boolean;
}