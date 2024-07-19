import { Coordinates } from '@common/coordinates';

export interface DifferenceFoundArgs {
    originalCanvasData: ImageData;
    differentPixels: Coordinates[];
    remainingDifferentCoordinates: Coordinates[];
    foundByLocalPlayer: boolean;
}
