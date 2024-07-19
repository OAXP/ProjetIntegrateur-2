import { HttpClient } from '@angular/common/http';
import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CanvasManager } from '@app/classes/canvas-manager';
import { DIFFERENCE_ERROR_DELAY } from '@app/constants/consts';
import { MessagesService } from '@app/services/messages.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameMode } from '@common/game-stats';
import { LobbyModes } from '@common/lobby-modes';
import { Player } from '@common/player';
import { Subject } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { GameHandlerService } from './game-handler.service';
import { InfosService } from './infos.service';
import SpyObj = jasmine.SpyObj;

describe('GameHandlerService', () => {
    let service: GameHandlerService;
    let matDialog: SpyObj<MatDialog>;
    let clientSocketService: SocketClientService;
    let canvasManager: SpyObj<CanvasManager>;
    let router: SpyObj<Router>;
    let messagesService: SpyObj<MessagesService>;

    const mousePosition = {
        mouseCanvasPosition: { x: 0, y: 0 },
        mouseScreenPosition: { x: 0, y: 0 },
    };
    const gameId = 'gameId';
    const canvasManagers = {
        // @ts-ignore
        canvasManagerOriginal: canvasManager,
        // @ts-ignore
        canvasManagerModified: canvasManager,
    };

    const mockGame = {
        name: 'Game',
        differentPixelsCount: 1,
        numberOfDifferences: 2,
        difficulty: 'facile',
        image1Url: 'url',
        image2Url: 'url2',
        differenceImageUrl: 'diffUrl',
        firstPlayer: new Player(),
    };

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(Audio.prototype, 'play').and.callFake(() => {});
        clientSocketService = new SocketClientService();
        canvasManager = jasmine.createSpyObj('CanvasManager', ['copyPixels']);
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        canvasManager.copyPixels.and.callFake(() => {});

        canvasManagers.canvasManagerOriginal = canvasManager;
        canvasManagers.canvasManagerModified = canvasManager;

        matDialog = jasmine.createSpyObj('MatDialog', ['closeAll']);
        router = jasmine.createSpyObj('Router', ['navigate']);
        messagesService = jasmine.createSpyObj('MessagesService', ['sendMessage', 'handleMessageReceive', 'resetMessages']);

        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [
                { provide: MatDialog, useValue: matDialog },
                { provide: SocketClientService, useValue: clientSocketService },
                { provide: Router, useValue: router },
                { provide: MessagesService, useValue: messagesService },
                { provide: HttpClient, useValue: {} },
            ],
        });
        service = TestBed.inject(GameHandlerService);
        service['remainingDifferentCoordinates'] = [];
        service['infosService'].setGame(mockGame);
        spyOn(service['infosService'], 'increaseDifferences').and.returnValue();
        jasmine.clock().uninstall();
        jasmine.clock().install();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should exit detectDiff if canClick is false', () => {
        service['canClick'] = false;
        const spy = spyOn(clientSocketService, 'send');
        service.detectDifference(mousePosition, gameId, canvasManagers);
        expect(spy).not.toHaveBeenCalled();
    });

    it('should send if canClick is true', () => {
        service['canClick'] = true;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(service, 'setDifferenceImageData').and.callFake(() => {});
        clientSocketService.socket = io(environment.serverBaseUrl, { transports: ['websocket'] });
        spyOn(clientSocketService.socket, 'on').and.callFake((event, cb) => {
            expect(event).toBe('detect-diff-res');
            cb(true, [{ x: 0, y: 0 }], [{ x: 0, y: 0 }]);
            return clientSocketService.socket;
        });
        spyOn(clientSocketService, 'send');
        service.detectDifference(mousePosition, gameId, canvasManagers);
        expect(service['canClick']).toBeFalse();
        expect(clientSocketService.send).toHaveBeenCalled();
    });

    it('setDiffImageData should copy data from original image to modified', () => {
        service['modifiedImageData'] = new ImageData(new Uint8ClampedArray([0, 0, 0, 0]), 1, 1);
        service['originalImageData'] = new ImageData(new Uint8ClampedArray([1, 1, 1, 1]), 1, 1);
        service.setDifferenceImageData([{ x: 0, y: 0 }]);
        expect(service['modifiedImageData'].data).toEqual(new Uint8ClampedArray([1, 1, 1, 1]));
    });

    it('onstartgame should set values', () => {
        const id = '1';
        const coords = [{ x: 1, y: 1 }];
        const gameParams = { startTime: 5, duration: 5, mode: GameMode.ClassicSolo, firstPlayerName: '' };
        service.onStartGame({ roomId: id, remainingDifferentCoordinates: coords, mode: LobbyModes.ClassicDuo, gameParams });
        expect(clientSocketService.currentGameRoomId).toEqual(id);
        expect(service.remainingCoordinates).toEqual(coords);
        expect(matDialog.closeAll).toHaveBeenCalled();
    });

    it('onDetectDiffResponse is diff', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(service, 'setDifferenceImageData').and.callFake(() => {});
        const coords = [{ x: 1, y: 1 }];
        const socket = jasmine.createSpyObj('Socket', ['emit', 'on']);
        socket.id = '1';
        clientSocketService.socket = socket;
        service['infosService']['gameMode'] = LobbyModes.ClassicSolo;
        const spy = spyOn(service['infosService'], 'setPlayerDifferencesFound');
        spyOn(InfosService.prototype, 'getPlayerDifferencesFound').and.returnValue(1);
        service['infosService'].getPlayerDifferencesFound();
        service.onDetectDifferenceResponse({ isDifferent: true, differentPixels: coords, remainingDifferentCoordinates: coords, socketId: '1' });
        jasmine.clock().tick(DIFFERENCE_ERROR_DELAY);
        expect(service['canClick']).toBeTrue();
        expect(spy).toHaveBeenCalled();
        expect(messagesService.sendMessage).toHaveBeenCalled();
    });

    it('onDetectDiffResponse is diff', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(service, 'setDifferenceImageData').and.callFake(() => {});
        const coords = [{ x: 1, y: 1 }];
        const socket = jasmine.createSpyObj('Socket', ['emit', 'on']);
        socket.id = '1';
        clientSocketService.socket = socket;
        service['infosService']['gameMode'] = LobbyModes.ClassicDuo;
        service.onDetectDifferenceResponse({ isDifferent: true, differentPixels: coords, remainingDifferentCoordinates: coords, socketId: '1' });
        jasmine.clock().tick(DIFFERENCE_ERROR_DELAY);
        expect(service['canClick']).toBeTrue();
        expect(messagesService.sendMessage).toHaveBeenCalled();
    });

    it('onDetectDiffResponse is not diff', () => {
        const coords = [{ x: 1, y: 1 }];
        const socket = jasmine.createSpyObj('Socket', ['emit', 'on']);
        socket.id = '1';
        clientSocketService.socket = socket;
        service.onDetectDifferenceResponse({ isDifferent: false, differentPixels: coords, remainingDifferentCoordinates: coords, socketId: '1' });
        jasmine.clock().tick(DIFFERENCE_ERROR_DELAY);
        expect(service['canClick']).toBeTrue();
    });

    it('onDetectDiffResponse should send error message if is not diff', () => {
        const coords = [{ x: 1, y: 1 }];
        const socket = jasmine.createSpyObj('Socket', ['emit', 'on']);
        socket.id = '1';
        clientSocketService.socket = socket;
        service['infosService']['gameMode'] = LobbyModes.ClassicSolo;
        service.onDetectDifferenceResponse({ isDifferent: false, differentPixels: coords, remainingDifferentCoordinates: coords, socketId: '1' });
        jasmine.clock().tick(DIFFERENCE_ERROR_DELAY);
        expect(service['canClick']).toBeTrue();
    });

    it('get clock should return clock', () => {
        const subject = new Subject<number>();
        service['timer'] = subject;
        expect(service.clock).toEqual(subject.asObservable());
    });

    it('handleSocket should send message', () => {
        clientSocketService.socket = jasmine.createSpyObj('Socket', ['emit', 'on']);
        service.handleSocket();
        expect(messagesService.handleMessageReceive).toHaveBeenCalled();
    });

    it('onChrono should call next on timer', () => {
        spyOn(service['timer'], 'next');
        service.onChrono(1);
        expect(service['timer'].next).toHaveBeenCalledWith(1);
    });

    it('set managers should set', () => {
        service.managers = {};
        expect(service['canvasManagers']).toEqual({});
    });

    it('should set original image data', () => {
        const canvas = document.createElement('canvas');
        const imageData = (canvas.getContext('2d') as CanvasRenderingContext2D).createImageData(1, 1);
        service.originalData = imageData;
        service.modifiedData = imageData;
        expect(service['originalImageData']).toEqual(imageData);
        expect(service['modifiedImageData']).toEqual(imageData);
    });

    it('getGameChangeEmitter() should return gameChange', () => {
        service['gameChange'] = new EventEmitter();
        const result = service.getGameChangeEmitter();
        expect(result).toEqual(service['gameChange']);
    });

    it('onNextGameLimited() should assign object and emit gameChange event', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        service['toggleCheatMode'] = () => {};
        service['gameChange'] = new EventEmitter();
        const emitSpy = spyOn(service['gameChange'], 'emit');
        const assignSpy = spyOn(Object, 'assign');
        service.onNextGameLimited(mockGame, []);
        expect(assignSpy).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalled();
    });
});
