import { Injectable, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanvasManager } from '@app/classes/canvas-manager';
import { ThirdHintComponent } from '@app/components/clues/third-hint/third-hint.component';
import { HALF, IMAGE_HEIGHT, IMAGE_WIDTH, NUMBER_OF_CLUES, QUARTER } from '@app/constants/consts';
import { GameHandlerService } from '@app/services/game-handler.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { getDataIndex } from '@app/utils/canvas.utils';
import { Coordinates } from '@common/coordinates';
import { RGBA } from '@common/rgba';
import { BehaviorSubject, Observable } from 'rxjs';

interface InitArgs {
    startX: number;
    startY: number;
    width: number;
    height: number;
}

@Injectable({
    providedIn: 'root',
})
export class HintService {
    hintUpdate: Observable<number>;
    private originalCanvasManager: CanvasManager;
    private modifiedCanvasManager: CanvasManager;
    private originalRGB: RGBA;
    private modifiedRGB: RGBA;
    private remainingHints: BehaviorSubject<number>;
    private dialog: MatDialog;
    private gameHandlerService: GameHandlerService;
    private socketClientService: SocketClientService;
    constructor(injector: Injector) {
        this.socketClientService = injector.get<SocketClientService>(SocketClientService);
        this.gameHandlerService = injector.get<GameHandlerService>(GameHandlerService);
        this.dialog = injector.get<MatDialog>(MatDialog);
        this.remainingHints = new BehaviorSubject<number>(NUMBER_OF_CLUES);
        this.remainingHints.next(NUMBER_OF_CLUES);
        this.hintUpdate = this.remainingHints.asObservable();
        this.originalRGB = { r: 0, g: 0, b: 0, a: 255 };
        this.modifiedRGB = { r: 0, g: 0, b: 0, a: 255 };
    }
    get original() {
        return this.originalRGB;
    }
    get modified() {
        return this.modifiedRGB;
    }
    getHints() {
        return this.remainingHints.value;
    }
    useHint() {
        if (this.remainingHints.value > 0) {
            this.remainingHints.next(this.remainingHints.value - 1);
            this.socketClientService.send('use-hint', this.socketClientService.currentGameRoomId);
        }
    }
    initHintPixels(remainingHints: number) {
        let pixelCoordinates: Coordinates[] = [];
        const remainingCoordinates = this.gameHandlerService.remainingCoordinates;
        const randomCoordinate = this.setRandomCoordinate(remainingCoordinates);
        const middleX = IMAGE_WIDTH / HALF;
        const middleY = IMAGE_HEIGHT / HALF;

        const quarterX = IMAGE_WIDTH / QUARTER;
        const quarterY = IMAGE_HEIGHT / QUARTER;
        const quarter = {
            x: Math.floor(randomCoordinate.x / middleX),
            y: Math.floor(randomCoordinate.y / middleY),
        };
        const subQuarter = {
            x: Math.floor(randomCoordinate.x / quarterX),
            y: Math.floor(randomCoordinate.y / quarterY),
        };
        switch (remainingHints) {
            case 2: {
                pixelCoordinates = this.initQuarter({
                    startX: quarter.x * middleX,
                    startY: quarter.y * middleY,
                    width: middleX,
                    height: middleY,
                });
                break;
            }
            case 1: {
                pixelCoordinates = this.initQuarter({
                    startX: subQuarter.x * quarterX,
                    startY: subQuarter.y * quarterY,
                    width: quarterX,
                    height: quarterY,
                });
                break;
            }
            case 0: {
                this.setImageData(randomCoordinate);
                this.dialog.open(ThirdHintComponent);
                break;
            }
        }
        return pixelCoordinates;
    }
    setImageData(randomCoordinate: Coordinates) {
        const index = getDataIndex(randomCoordinate.x, randomCoordinate.y);
        let imageData = this.originalCanvasManager.context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.originalRGB.r = imageData.data[index];
        this.originalRGB.g = imageData.data[index + 1];
        this.originalRGB.b = imageData.data[index + 2];
        imageData = this.modifiedCanvasManager.context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.modifiedRGB.r = imageData.data[index];
        this.modifiedRGB.g = imageData.data[index + 1];
        this.modifiedRGB.b = imageData.data[index + 2];
    }
    setRandomCoordinate(remainingCoordinates: Coordinates[]) {
        let randomCoordinate = remainingCoordinates[Math.floor(Math.random() * remainingCoordinates.length)];
        const originalImageData = this.originalCanvasManager.context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const modifiedImageData = this.modifiedCanvasManager.context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        while (this.isSameColor(randomCoordinate, originalImageData.data, modifiedImageData.data)) {
            randomCoordinate = remainingCoordinates[Math.floor(Math.random() * remainingCoordinates.length)];
        }
        return randomCoordinate;
    }
    isSameColor(randomCoordinate: Coordinates, originalImageData: Uint8ClampedArray, modifiedImageData: Uint8ClampedArray) {
        const index = getDataIndex(randomCoordinate.x, randomCoordinate.y);
        return (
            originalImageData[index] === modifiedImageData[index] &&
            originalImageData[index + 1] === modifiedImageData[index + 1] &&
            originalImageData[index + 2] === modifiedImageData[index + 2]
        );
    }
    setCanvasManagers(originalCanvasManager: CanvasManager, modifiedCanvasManager: CanvasManager) {
        this.originalCanvasManager = originalCanvasManager;
        this.modifiedCanvasManager = modifiedCanvasManager;
    }
    initQuarter(initCoord: InitArgs) {
        const pixelCoordinates: Coordinates[] = [];
        for (let y = initCoord.startY; y < initCoord.startY + initCoord.height; y++) {
            for (let x = initCoord.startX; x < initCoord.startX + initCoord.width; x++) {
                pixelCoordinates.push({ x, y });
            }
        }
        return pixelCoordinates;
    }
    resetHints() {
        this.remainingHints.next(NUMBER_OF_CLUES);
    }
}
