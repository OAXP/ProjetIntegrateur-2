import { BLACK_RGBA, IMAGE_RES } from '@app/utils/constants';
import { RGBA } from '@common/rgba';
import { Coordinates } from '@common/coordinates';

export interface FloodFillArgs {
    x: number;
    y: number;
    filler: (point: Coordinates) => void;
    isVisited: (point: Coordinates) => boolean;
    getColor: (point: Coordinates) => RGBA;
}

export const floodFill = (params: FloodFillArgs): void => {
    const queue = [{ x: params.x, y: params.y }];
    while (queue.length > 0) {
        const pixel = queue.shift() as Coordinates; // should not be undefined

        if (isOutsidePixelBounds(pixel) || params.isVisited({ x: pixel.x, y: pixel.y })) {
            continue;
        }
        const pixelColor = params.getColor({ x: pixel.x, y: pixel.y });
        if (!isBlackColor(pixelColor)) {
            continue;
        }
        params.filler({ x: pixel.x, y: pixel.y });
        queue.push({ x: pixel.x + 1, y: pixel.y });
        queue.push({ x: pixel.x - 1, y: pixel.y });
        queue.push({ x: pixel.x, y: pixel.y + 1 });
        queue.push({ x: pixel.x, y: pixel.y - 1 });
        queue.push({ x: pixel.x + 1, y: pixel.y + 1 });
        queue.push({ x: pixel.x - 1, y: pixel.y - 1 });
        queue.push({ x: pixel.x + 1, y: pixel.y - 1 });
        queue.push({ x: pixel.x - 1, y: pixel.y + 1 });
    }
};

export const compareColors = (pixel1: RGBA, pixel2: RGBA): boolean => {
    return pixel1.r === pixel2.r && pixel1.g === pixel2.g && pixel1.b === pixel2.b;
};

export const isBlackColor = (color: RGBA): boolean => {
    return compareColors(color, BLACK_RGBA);
};

export const isOutsidePixelBounds = (pixel: Coordinates): boolean => {
    return pixel.x < 0 || pixel.x >= IMAGE_RES.width || pixel.y < 0 || pixel.y >= IMAGE_RES.height;
};
