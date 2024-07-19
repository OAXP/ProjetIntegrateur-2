import { RGBA } from '@common/rgba';

export const SECONDS_PER_MINUTE = 60;
export const WAIT_TIME = 1000;
export const DIFFERENCE_ERROR_DELAY = 1000;
export const DIFFERENCE_INTERVAL_TIME = 600;
export const NUMBER_OF_BLINKS = 4;
export const NUMBER_OF_CLUES = 3;
export const IMAGE_WIDTH = 640;
export const IMAGE_HEIGHT = 480;
export const DEFAULT_INDEX = -1;
export const PIXEL_DATA_OFFSET = 4;
export const MATERIAL_PREBUILT_THEMES = [
    {
        value: 'indigo-pink-theme',
        label: 'Indigo & Pink',
    },
    {
        value: 'deeppurple-amber-theme',
        label: 'Deep Purple & Amber',
    },
    {
        value: 'pink-bluegrey-theme',
        label: 'Pink & Blue-grey',
    },
    {
        value: 'purple-green-theme',
        label: 'Purple & Green',
    },
];
export enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2,
    Back = 3,
    Forward = 4,
}
export const BLACK_RGBA: RGBA = {
    r: 0,
    g: 0,
    b: 0,
    a: 255,
};

export const BMP_HEAD = {
    // header 24-Bit BMP took from https://en.wikipedia.org/wiki/BMP_file_format
    pixelPosition: 54,
    pixelOffset: 10,
    widthOffset: 18,
    heightOffset: 22,
    dibOffset: 14,
    dibSize: 40,
    colorPlanesOffset: 26,
    numPixelOffset: 28,
    numPixelValue: 24,
    compressionOffset: 30,
    sizeOffset: 34,
    pixelPerMeter: 2835,
    numColorsInPaletteOffset: 46,
    importantColorsOffset: 50,
    printResHOffset: 38,
    printResVOffset: 42,
    idFieldValue: 19778, // BM
};

export const ALPHA_VISIBLE = 255;
export const DEFAULT_THICKNESS = 13; // Also change in pencil case html
export const ID_LENGTH = 10;

export const INITIAL_TIMER_MIN = 15;
export const INITIAL_TIMER_MAX = 60;
export const PENALTY_TIMER_MIN = 2;
export const PENALTY_TIMER_MAX = 10;
export const BONUS_TIMER_MIN = 2;
export const BONUS_TIMER_MAX = 8;
export const MS_TO_SEC = 1000;
export const baseLeaderboard = [
    { player: 'no_name', minutes: 5, seconds: 50 },
    { player: 'no_name', minutes: 5, seconds: 50 },
    { player: 'no_name', minutes: 5, seconds: 50 },
];

export const INITIAL_RADIUS = 3;

export const HALF = 2;
export const QUARTER = 4;
