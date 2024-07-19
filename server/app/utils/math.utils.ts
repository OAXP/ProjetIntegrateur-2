import { Coordinates } from '@common/coordinates';
import { CHARACTERS_RANGE, CHARACTERS_RANGE_LEN, MAX_RANDOM } from '@app/utils/constants';

export const clamp = (x: number, min: number, max: number): number => Math.min(Math.max(x, min), max);

export const distanceFromCenter = (point: Coordinates, center: Coordinates): number => {
    return Math.hypot(center.x - point.x, center.y - point.y);
};

export const generateFileName = (str: string): string => {
    str = str.replace('.', '');
    return str + Math.floor(Math.random() * MAX_RANDOM) + '.bmp';
};

export const getRandomString = (): string => {
    let res = '';
    const MAX_LEN = 7;
    const STRING_LEN = Math.floor(Math.random() * MAX_LEN) + 1;
    let count = 0;

    while (count < STRING_LEN) {
        res += CHARACTERS_RANGE.charAt(Math.floor(Math.random() * CHARACTERS_RANGE_LEN));
        count++;
    }

    return res;
};
