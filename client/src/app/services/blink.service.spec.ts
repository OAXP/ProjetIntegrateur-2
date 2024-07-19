import { TestBed } from '@angular/core/testing';
import { BlinkService } from './blink.service';
import SpyObj = jasmine.SpyObj;
import { ALPHA_VISIBLE, IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/constants/consts';
import { Coordinates } from '@common/coordinates';
import { getDataIndex } from '@app/utils/canvas.utils';

describe('BlinkService', () => {
    let service: BlinkService;
    let ctxSpy: SpyObj<CanvasRenderingContext2D>;
    let imageDataSpy: SpyObj<ImageData>;

    const INIT_POINT: Coordinates = { x: 0, y: 0 };

    beforeEach(() => {
        ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', [
            'drawImage',
            'getImageData',
            'putImageData',
            'clearRect',
        ]);
        const data = new Uint8ClampedArray(IMAGE_WIDTH * IMAGE_HEIGHT * 3);
        imageDataSpy = jasmine.createSpyObj('ImageData', [''], { data });
        TestBed.configureTestingModule({});
        service = TestBed.inject(BlinkService);
        service['ctx'] = ctxSpy;
        service['otherCtx'] = ctxSpy;
        service['blinkImageData'] = imageDataSpy;
        jasmine.clock().uninstall();
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('setContexts() should call getImageData() 2 times', () => {
        service.setContexts(ctxSpy, ctxSpy);
        expect(ctxSpy.getImageData).toHaveBeenCalledTimes(2);
    });

    it('addPixels() should call startInterval() if it is the first group added', () => {
        service['counter'] = 0;
        const startIntervalSpy = spyOn(service, 'startInterval').and.returnValue();
        service.addPixels([]);
        expect(startIntervalSpy).toHaveBeenCalled();
    });

    it('addPixels() should not call startInterval() if it is not the first group added', () => {
        service['counter'] = 1;
        const startIntervalSpy = spyOn(service, 'startInterval').and.returnValue();
        service.addPixels([]);
        expect(startIntervalSpy).not.toHaveBeenCalled();
    });

    it('addPixels() should set pixels of blinkImageData', () => {
        service['counter'] = 1;
        service.addPixels([INIT_POINT]);
        expect(service['blinkImageData'].data[getDataIndex(INIT_POINT.x, INIT_POINT.y)]).toEqual(ALPHA_VISIBLE);
    });

    it('removePixels() should call stopInterval() if it is the last group removed', () => {
        service['counter'] = 1;
        const stopIntervalSpy = spyOn(service, 'stopInterval').and.returnValue();
        service.removePixels([]);
        expect(service['counter']).toEqual(0);
        expect(stopIntervalSpy).toHaveBeenCalled();
    });

    it('removePixels() should not call stopInterval() if it is not the last group removed', () => {
        service['counter'] = 2;
        const stopIntervalSpy = spyOn(service, 'stopInterval').and.returnValue();
        service.removePixels([]);
        expect(service['counter']).toEqual(1);
        expect(stopIntervalSpy).not.toHaveBeenCalled();
    });

    it('removePixels() should set pixels of blinkImageData', () => {
        service['counter'] = 2;
        service['blinkImageData'].data[getDataIndex(INIT_POINT.x, INIT_POINT.y)] = ALPHA_VISIBLE;
        service.removePixels([INIT_POINT]);
        expect(service['blinkImageData'].data[getDataIndex(INIT_POINT.x, INIT_POINT.y)]).toEqual(0);
    });

    it('toggleBlink() should toggle isBlinking', () => {
        service['isBlinking'] = true;
        service.toggleBlink();
        expect(service['isBlinking']).toEqual(false);
    });

    it('toggleBlink() should call putImageData 2 times if isBlinking is true', () => {
        service['isBlinking'] = true;
        service.toggleBlink();
        expect(ctxSpy.putImageData).toHaveBeenCalledTimes(2);
    });

    it('toggleBlink() should call putImageData 2 times if isBlinking is false', () => {
        service['isBlinking'] = false;
        service.toggleBlink();
        expect(ctxSpy.putImageData).toHaveBeenCalledTimes(2);
    });

    it('startInterval() should call toggleBlink()', () => {
        const toggleBlinkSpy = spyOn(service, 'toggleBlink').and.returnValue();
        service.startInterval();
        jasmine.clock().tick(service['switchInterval']);
        expect(toggleBlinkSpy).toHaveBeenCalled();
    });

    it('stopInterval() should call clearRect() 2 times', () => {
        service['intervalId'] = 1;
        service.stopInterval();
        expect(ctxSpy.clearRect).toHaveBeenCalledTimes(2);
    });
});
