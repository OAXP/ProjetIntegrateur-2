import { Injectable } from '@angular/core';
import { IMAGE_HEIGHT, IMAGE_WIDTH, NUMBER_OF_BLINKS, WAIT_TIME } from '@app/constants/consts';
import { getDataIndex } from '@app/utils/canvas.utils';
import { Coordinates } from '@common/coordinates';

@Injectable({
    providedIn: 'root',
})
export class BlinkService {
    private counter: number;
    private ctx: CanvasRenderingContext2D;
    private otherCtx: CanvasRenderingContext2D;
    private imageData: ImageData;
    private blinkImageData: ImageData;
    private intervalId: number | undefined;
    private isBlinking: boolean;
    private readonly switchInterval: number;

    constructor() {
        this.switchInterval = WAIT_TIME / (NUMBER_OF_BLINKS * 2);
        this.counter = 0;
        this.isBlinking = true;
    }

    setContexts(ctx: CanvasRenderingContext2D, otherCtx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.otherCtx = otherCtx;
        this.imageData = ctx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.blinkImageData = otherCtx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    addPixels(pixelsCoordinates: Coordinates[], playbackSpeed?: number) {
        this.counter++;
        if (this.counter === 1 && !this.intervalId) {
            this.startInterval(playbackSpeed);
        }
        pixelsCoordinates.forEach((coord: Coordinates) => {
            const index = getDataIndex(coord.x, coord.y);
            this.blinkImageData.data[index] = 255;
            this.blinkImageData.data[index + 1] = 0;
            this.blinkImageData.data[index + 2] = 0;
            this.blinkImageData.data[index + 3] = 255;
        });
    }

    removePixels(pixelsCoordinates: Coordinates[]) {
        this.counter--;
        pixelsCoordinates.forEach((coord: Coordinates) => {
            const index = getDataIndex(coord.x, coord.y);
            this.blinkImageData.data[index] = 0;
            this.blinkImageData.data[index + 1] = 0;
            this.blinkImageData.data[index + 2] = 0;
            this.blinkImageData.data[index + 3] = 0;
        });
        if (this.counter === 0) {
            this.stopInterval();
        }
    }

    toggleBlink() {
        if (this.isBlinking) {
            this.ctx.putImageData(this.imageData, 0, 0);
            this.otherCtx.putImageData(this.imageData, 0, 0);
        } else {
            this.ctx.putImageData(this.blinkImageData, 0, 0);
            this.otherCtx.putImageData(this.blinkImageData, 0, 0);
        }
        this.isBlinking = !this.isBlinking;
    }

    startInterval(playbackSpeed?: number) {
        this.intervalId = window.setInterval(() => {
            this.toggleBlink();
        }, this.switchInterval / (playbackSpeed ?? 1));
    }

    stopInterval() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        this.ctx.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.otherCtx.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }
}
