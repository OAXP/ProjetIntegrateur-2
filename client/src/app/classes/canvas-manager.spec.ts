import { CanvasManager } from './canvas-manager';
import { IMAGE_HEIGHT, IMAGE_WIDTH, WAIT_TIME } from '@app/constants/consts';
import { Coordinates } from '@common/coordinates';
import { BlinkService } from '@app/services/blink.service';
import SpyObj = jasmine.SpyObj;
import createSpy = jasmine.createSpy;

describe('CanvasManager', () => {
    let canvasManager: CanvasManager;
    let ctxSpy: SpyObj<CanvasRenderingContext2D>;
    let pixelsCoordinates: Coordinates[];
    let mockImageData: ImageData;
    let blinkServiceSpy: SpyObj<BlinkService>;

    beforeEach(() => {
        blinkServiceSpy = jasmine.createSpyObj('BlinkService', ['addPixels', 'removePixels']);
        const canvas = document.createElement('canvas');
        canvas.width = IMAGE_WIDTH;
        canvas.height = IMAGE_HEIGHT;
        canvasManager = new CanvasManager(canvas, blinkServiceSpy);
        ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        canvasManager['ctx'] = ctxSpy;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ctxSpy.getImageData.and.returnValue(canvas!.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, 1, 1));
        ctxSpy.putImageData.and.returnValue();

        mockImageData = canvasManager['ctx'].getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

        pixelsCoordinates = [{ x: 0, y: 0 }];
        spyOn(window, 'setInterval').and.callThrough();
        spyOn(window, 'setTimeout').and.callThrough();
        jasmine.clock().uninstall();
        jasmine.clock().install();
    });
    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should create an instance and have a height and width of 640x480', () => {
        expect(canvasManager).toBeTruthy();
        expect(canvasManager.width).toBe(IMAGE_WIDTH);
        expect(canvasManager.height).toBe(IMAGE_HEIGHT);
    });

    it('drawImage() should draw the given image in the canvas', () => {
        const path = 'image.jpg';
        const img = new Image();
        spyOn(window, 'Image').and.returnValue(img);
        canvasManager.drawImage(path);
        img.dispatchEvent(new Event('load'));

        // @ts-ignore
        expect(ctxSpy.drawImage).toHaveBeenCalledWith(jasmine.any(HTMLImageElement), 0, 0);
    });

    it('drawImage() should draw the given image in the canvas and call the callback()', () => {
        const path = 'image.jpg';
        const img = new Image();
        const callback = createSpy();
        spyOn(window, 'Image').and.returnValue(img);
        canvasManager.drawImage(path, callback);
        img.dispatchEvent(new Event('load'));

        // @ts-ignore
        expect(ctxSpy.drawImage).toHaveBeenCalledWith(jasmine.any(HTMLImageElement), 0, 0);
        expect(callback).toHaveBeenCalled();
    });

    it('copyPixels should call putImageData() in the timer', () => {
        canvasManager.copyPixels({ originalCanvas: canvasManager, pixelsCoordinates, originalImageData: mockImageData });

        jasmine.clock().tick(WAIT_TIME);
        expect(ctxSpy.putImageData).toHaveBeenCalled();
    });

    it('copyPixels should call blinkPixels()', () => {
        const blinkPixelsSpy = spyOn(canvasManager, 'blinkPixels');
        canvasManager.copyPixels({ originalCanvas: canvasManager, pixelsCoordinates, originalImageData: mockImageData });

        expect(blinkPixelsSpy).toHaveBeenCalled();
    });

    it('blinkPixels should also blink the otherCanvas if specified', () => {
        const canvas = document.createElement('canvas');
        canvas.width = IMAGE_WIDTH;
        canvas.height = IMAGE_HEIGHT;
        const otherCanvasManager = new CanvasManager(canvas, blinkServiceSpy);
        const otherCtx = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        otherCtx.getImageData.and.returnValue(canvas!.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, 1, 1));
        otherCtx.putImageData.and.returnValue();
        // @ts-ignore
        otherCanvasManager['ctx'] = otherCtx;

        const redImageData = canvasManager['ctx'].getImageData(0, 0, 1, 1);
        redImageData.data[0] = 255; // R
        redImageData.data[1] = 0; // G
        redImageData.data[2] = 0; // B
        redImageData.data[3] = 255; // A

        pixelsCoordinates = [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ];

        otherCanvasManager.blinkPixels({
            pixelsCoordinates,
            totalSeconds: 1,
        });
        jasmine.clock().tick(WAIT_TIME);

        expect(blinkServiceSpy.addPixels).toHaveBeenCalled();
        expect(blinkServiceSpy.removePixels).toHaveBeenCalled();
    });

    // it('should clear the intervals and timeouts at the correct time', () => {
    //     canvasManager.copyPixels(canvasManager, pixelsCoordinates, mockImageData);
    //     const intervalSpy = spyOn(window, 'clearInterval');
    //
    //     jasmine.clock().tick(DIFFERENCE_INTERVAL_TIME * NUMBER_OF_BLINKS);
    //     expect(intervalSpy).toHaveBeenCalledTimes(2);
    //
    //     jasmine.clock().tick(DIFFERENCE_INTERVAL_TIME * (NUMBER_OF_BLINKS + 2));
    //     expect(intervalSpy).toHaveBeenCalledTimes(2);
    // });

    it('getContext should return ctx', () => {
        expect(canvasManager.context).toEqual(ctxSpy);
    });
});
