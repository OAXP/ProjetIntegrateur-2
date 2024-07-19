import { TestBed } from '@angular/core/testing';

import { HintService } from './hint.service';
import { GameHandlerService } from '@app/services/game-handler.service';
import SpyObj = jasmine.SpyObj;
import { SocketClientService } from '@app/services/socket-client.service';
import { MatDialog } from '@angular/material/dialog';
import { IMAGE_HEIGHT, IMAGE_WIDTH, NUMBER_OF_CLUES } from '@app/constants/consts';
import { RGBA } from '@common/rgba';
import { CanvasManager } from '@app/classes/canvas-manager';

describe('HintService', () => {
    let service: HintService;
    let dialog: SpyObj<MatDialog>;
    let gameHandlerServiceSpy: SpyObj<GameHandlerService>;
    let socketClientServiceSpy: SpyObj<SocketClientService>;

    beforeEach(() => {
        dialog = jasmine.createSpyObj('MatDialog', ['open']);
        gameHandlerServiceSpy = jasmine.createSpyObj('GameHandlerService', ['remainingCoordinates']);
        socketClientServiceSpy = jasmine.createSpyObj('SocketClientService', ['send']);
        TestBed.configureTestingModule({
            providers: [
                { provide: MatDialog, useValue: dialog },
                { provide: GameHandlerService, useValue: gameHandlerServiceSpy },
                { provide: SocketClientService, useValue: socketClientServiceSpy },
            ],
        });
        service = TestBed.inject(HintService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return correct number of hints', () => {
        expect(service.getHints()).toEqual(NUMBER_OF_CLUES);
    });

    it('useHint should subtract remainingHints', () => {
        service.useHint();
        expect(service.getHints()).toEqual(NUMBER_OF_CLUES - 1);
    });

    it('initHintPixels with 2 remainingHints calls initQuarter with correct params', () => {
        Object.defineProperty(gameHandlerServiceSpy, 'remainingCoordinates', {
            get: () => {
                return [{ x: 1, y: 1 }];
            },
        });
        const spy = spyOn(service, 'initQuarter');
        spyOn(service, 'setRandomCoordinate').and.returnValue({ x: 0, y: 0 });
        service.initHintPixels(2);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(spy).toHaveBeenCalledOnceWith({ startX: 0, startY: 0, width: 320, height: 240 });
    });

    it('initHintPixels with 1 remainingHints calls initQuarter with correct params', () => {
        Object.defineProperty(gameHandlerServiceSpy, 'remainingCoordinates', {
            get: () => {
                return [{ x: 1, y: 1 }];
            },
        });
        const spy = spyOn(service, 'initQuarter');
        spyOn(service, 'setRandomCoordinate').and.returnValue({ x: 0, y: 0 });
        service.initHintPixels(1);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(spy).toHaveBeenCalledOnceWith({ startX: 0, startY: 0, width: 160, height: 120 });
    });

    it('initHintPixels with 0 remainingHints opens dialog', () => {
        Object.defineProperty(gameHandlerServiceSpy, 'remainingCoordinates', {
            get: () => {
                return [{ x: 1, y: 1 }];
            },
        });
        const imageData = new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const data1 = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255]);
        // // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const data2 = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255]);
        imageData.data.set(data1);
        const imageData2 = new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT);
        imageData2.data.set(data2);

        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['getImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>([], { context: ctxSpy });

        const ctxSpy1 = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['getImageData']);
        // @ts-ignore
        const canvasManager1 = jasmine.createSpyObj<CanvasManager>([], { context: ctxSpy1 });

        ctxSpy.getImageData.and.returnValue(imageData);
        ctxSpy1.getImageData.and.returnValue(imageData2);

        service.setCanvasManagers(canvasManager, canvasManager1);
        spyOn(service, 'isSameColor').and.returnValue(false);
        service.initHintPixels(0);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(dialog.open).toHaveBeenCalled();
    });

    it('initQuarter should work correctly', () => {
        expect(service.initQuarter({ startX: 1, startY: 1, width: 1, height: 1 })).toEqual([{ x: 1, y: 1 }]);
    });

    it('resetHints() should reset hints', () => {
        service['remainingHints'].next(1);
        service.resetHints();
        expect(service.getHints()).toEqual(NUMBER_OF_CLUES);
    });

    it('get original() should return original', () => {
        const rgb: RGBA = { r: 0, g: 0, b: 0, a: 255 };
        service['originalRGB'] = rgb;
        expect(service.original).toEqual(rgb);
    });

    it('get modified() should return modified', () => {
        const rgb: RGBA = { r: 0, g: 0, b: 0, a: 255 };
        service['modifiedRGB'] = rgb;
        expect(service.modified).toEqual(rgb);
    });

    it('isSameColor should return true if it is the same color', () => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const data1 = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255]);

        const result = service.isSameColor({ x: 0, y: 0 }, data1, data1);

        expect(result).toEqual(true);
    });

    it('isSameColor should return false if it is not the same color', () => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const data1 = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255]);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const data2 = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255]);

        const result = service.isSameColor({ x: 0, y: 0 }, data1, data2);

        expect(result).toEqual(false);
    });
});
