import { clamp, distanceFromCenter } from '@app/utils/math.utils';
import { IMAGE_RES } from '@app/utils/constants';
import { RGBA } from '@common/rgba';
import { Coordinates } from '@common/coordinates';
import { compareColors } from '@app/utils/image-processing.utils';

export interface DrawCircleArgs {
    center: Coordinates;
    color: RGBA;
    radius: number;
    filler: (point: Coordinates, color: RGBA) => void;
    getColor: (point: Coordinates) => RGBA;
    maxWidth?: number;
    maxHeight?: number;
}

export const drawCircle = (params: DrawCircleArgs) => {
    params.maxWidth = params.maxWidth ?? IMAGE_RES.width;
    params.maxHeight = params.maxHeight ?? IMAGE_RES.height;
    for (let x = clamp(params.center.x - params.radius, 0, params.maxWidth); x < clamp(params.center.x + params.radius, 0, params.maxWidth); x++) {
        for (
            let y = clamp(params.center.y - params.radius, 0, params.maxHeight);
            y < clamp(params.center.y + params.radius, 0, params.maxHeight);
            y++
        ) {
            const color = params.getColor({ x, y });
            if (compareColors(color, params.color)) {
                continue;
            }

            const dist = distanceFromCenter({ x, y }, params.center);

            if (dist <= params.radius) {
                params.filler({ x, y }, params.color);
            }
        }
    }
};
