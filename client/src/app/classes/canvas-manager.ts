import { IMAGE_HEIGHT, IMAGE_WIDTH, WAIT_TIME } from '@app/constants/consts';
import { BlinkService } from '@app/services/blink.service';
import { Coordinates } from '@common/coordinates';

interface BlinkPixelsArgs {
    pixelsCoordinates: Coordinates[];
    totalSeconds?: number;
}

interface CopyPixelsArgs {
    originalCanvas: CanvasManager;
    pixelsCoordinates: Coordinates[];
    originalImageData: ImageData;
}

export class CanvasManager {
    private readonly ctx: CanvasRenderingContext2D;
    private canvasSize: Coordinates;

    constructor(canvas: HTMLCanvasElement, private blinkService: BlinkService) {
        this.ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        this.canvasSize = { x: IMAGE_WIDTH, y: IMAGE_HEIGHT };
    }

    get context(): CanvasRenderingContext2D {
        return this.ctx;
    }

    get width(): number {
        return this.canvasSize.x;
    }

    get height(): number {
        return this.canvasSize.y;
    }

    drawImage(path: string, callback?: () => void) {
        const img = new Image();
        img.onload = () => {
            this.ctx.drawImage(img, 0, 0);
            if (callback) {
                callback();
            }
        };
        img.src = path;
        img.setAttribute('crossOrigin', '');
    }

    copyPixels(params: CopyPixelsArgs, playbackSpeed?: number) {
        const stopBlink = this.blinkPixels({ pixelsCoordinates: params.pixelsCoordinates }, playbackSpeed) as () => void;
        params.originalCanvas.blinkPixels({ pixelsCoordinates: params.pixelsCoordinates, totalSeconds: 1 }, playbackSpeed);

        setTimeout(() => {
            stopBlink();

            params.originalCanvas.ctx.putImageData(params.originalImageData, 0, 0);
            params.pixelsCoordinates.forEach((pixel: Coordinates) => {
                const pixelColor = params.originalCanvas.ctx.getImageData(pixel.x, pixel.y, 1, 1);
                this.ctx.putImageData(pixelColor, pixel.x, pixel.y);
            });
        }, WAIT_TIME / (playbackSpeed ?? 1));
    }

    blinkPixels(params: BlinkPixelsArgs, playbackSpeed?: number): void | (() => void) {
        this.blinkService.addPixels(params.pixelsCoordinates);

        if (params.totalSeconds) {
            setTimeout(() => {
                this.blinkService.removePixels(params.pixelsCoordinates);
            }, (params.totalSeconds * WAIT_TIME) / (playbackSpeed ?? 1));
        } else {
            return () => {
                this.blinkService.removePixels(params.pixelsCoordinates);
            };
        }
    }
}
