export const IMG_FOLDER = 'assets/img/';
export const GAMES_JSON = 'assets/games.json';
export const DIFFERENCES_JSON = 'assets/differences.json';
export const HISTORY_JSON = 'assets/history.json';
export const BLACK_RGBA = { r: 0, g: 0, b: 0 };
export const IMAGE_RES = { width: 640, height: 480 };
export const DIFFICULT_LEVEL = { ratio: 0.15, numDiff: 7 };
export const WHITE_COLOR = 255;
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
export const VISITED_COLOR = 100;
export const ACCEPTED_RADIUS = {
    none: 0,
    low: 3,
    medium: 9,
    high: 15,
};
export const DIFFERENCES_NUMBER_RANGE = {
    min: 3,
    max: 9,
};
export const DEFAULT_INDEX = -1;
export const MAX_RANDOM = 123456;
export const CHARACTERS_RANGE = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const CHARACTERS_RANGE_LEN = CHARACTERS_RANGE.length;
export const MAX_HTTP_BUFFER_SIZE = 1e7;
export const BASE_TEN = 10;
export const SECOND_IN_MILLISECONDS = 1000;
export const TWO_MINUTES_IN_SECONDS = 120;
export const DB_URL = 'mongodb+srv://equipe105projet2:9%3F%25hR4VP2bSs%21cv@cluster.ro84psw.mongodb.net/';
export const DB_COLLECTION = 'leaderboards';
export const DB_NAME = 'project2_database';
export const baseLeaderboard = [
    { player: 'no_name', minutes: 5, seconds: 50 },
    { player: 'no_name', minutes: 5, seconds: 50 },
    { player: 'no_name', minutes: 5, seconds: 50 },
];
