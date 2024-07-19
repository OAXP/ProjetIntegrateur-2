/* eslint-disable max-lines */

import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { DIFFERENCE_ERROR_DELAY, IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/constants/consts';
import { ActionType } from '@app/interfaces/action-type';
import { DifferenceFoundArgs } from '@app/interfaces/difference-found-args';
import { GameAction } from '@app/interfaces/game-action';
import { InfosService } from '@app/services/infos.service';
import { SoundService } from '@app/services/sound.service';
import { Coordinates } from '@common/coordinates';
import { Message } from '@common/message';
import { ReplayService } from './replay.service';
import { CanvasManager } from '@app/classes/canvas-manager';
import SpyObj = jasmine.SpyObj;

describe('ReplayService', () => {
    let service: ReplayService;
    let infosServiceSpy: SpyObj<InfosService>;
    let soundService: SpyObj<SoundService>;
    let dialog: SpyObj<MatDialog>;

    beforeEach(() => {
        infosServiceSpy = jasmine.createSpyObj('InfosService', [
            'getPlayerDifferencesFound',
            'setPlayerDifferencesFound',
            'setTotalDifferencesFound',
            'increaseDifferences',
        ]);
        soundService = jasmine.createSpyObj(['playDifferenceFoundAudio', 'playErrorAudio']);
        dialog = jasmine.createSpyObj<MatDialog>(['closeAll', 'open']);
        TestBed.configureTestingModule({
            providers: [
                { provide: InfosService, useValue: infosServiceSpy },
                { provide: SoundService, useValue: soundService },
                { provide: MatDialog, useValue: dialog },
            ],
        });
        service = TestBed.inject(ReplayService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('playbackSpeed setter should not set value if not valid', () => {
        service.playbackSpeed = 3;
        expect(service['speed']).not.toEqual(3);
    });

    it('playbackSpeed setter should set value only if authorized', () => {
        service.playbackSpeed = 2;
        expect(service['speed']).toEqual(2);
    });

    it('togglePause() should toggle isPaused correctly', () => {
        service['isPaused'] = false;
        service.togglePause();
        expect(service['isPaused']).toEqual(true);
    });

    it('togglePause() should call doNext() if is playing', () => {
        service['isPaused'] = true;
        const doNextSpy = spyOn(service, 'doNext').and.returnValue();
        service.togglePause();
        expect(doNextSpy).toHaveBeenCalled();
    });

    it('togglePause() should call blinkPixels() if is blinking', () => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>(['copyPixels', 'blinkPixels'], { context: ctxSpy });
        service['canvasManagers'] = { originalCanvasManager: canvasManager, modifiedCanvasManager: canvasManager };
        service['isPaused'] = true;
        service['isBlinking'] = true;
        const doNextSpy = spyOn(service, 'doNext').and.returnValue();
        service.togglePause();
        expect(doNextSpy).toHaveBeenCalled();
        expect(canvasManager.blinkPixels).toHaveBeenCalled();
    });

    it('togglePause() should call replay if is playing and isEnd', () => {
        service['isEnd'] = true;
        service['isPaused'] = true;
        const replaySpy = spyOn(service, 'replay');
        service.togglePause();
        expect(replaySpy).toHaveBeenCalled();
    });

    it('recordErrorFound() should push to array and set time', () => {
        const pushSpy = spyOn(service['gameActions'], 'push');
        const nowSpy = spyOn(Date, 'now');
        service.recordErrorFound({} as Coordinates);
        expect(pushSpy).toHaveBeenCalled();
        expect(nowSpy).toHaveBeenCalled();
    });

    it('recordPostMessage() should push to array and set time', () => {
        const pushSpy = spyOn(service['gameActions'], 'push');
        const nowSpy = spyOn(Date, 'now');
        service.recordPostMessage({} as Message);
        expect(pushSpy).toHaveBeenCalled();
        expect(nowSpy).toHaveBeenCalled();
    });

    it('recordToggleCheatMode() should push to array and set time', () => {
        const pushSpy = spyOn(service['gameActions'], 'push');
        const nowSpy = spyOn(Date, 'now');
        service.recordToggleCheatMode({} as Coordinates[]);
        expect(pushSpy).toHaveBeenCalled();
        expect(nowSpy).toHaveBeenCalled();
    });

    it('recordDifferenceFound() should push to array and set time', () => {
        const pushSpy = spyOn(service['gameActions'], 'push').and.callThrough();
        const nowSpy = spyOn(Date, 'now').and.callThrough();
        service.recordDifferenceFound({} as DifferenceFoundArgs);
        expect(pushSpy).toHaveBeenCalled();
        expect(nowSpy).toHaveBeenCalled();
    });

    it('recordHintRequest() should push to array and set time', () => {
        const pushSpy = spyOn(service['gameActions'], 'push').and.callThrough();
        const nowSpy = spyOn(Date, 'now').and.callThrough();
        service.recordHintRequest({ hintNumber: 1, pixelsCoordinates: [] });
        expect(pushSpy).toHaveBeenCalled();
        expect(nowSpy).toHaveBeenCalled();
    });

    it('recordEnd() should push to array and set time', () => {
        const pushSpy = spyOn(service['gameActions'], 'push');
        const nowSpy = spyOn(Date, 'now');
        service.recordEnd();
        expect(pushSpy).toHaveBeenCalled();
        expect(nowSpy).toHaveBeenCalled();
    });

    it('replay() should call correct functions', () => {
        const resetSpy = spyOn(service, 'reset');
        const setCanvasDataSpy = spyOn(service, 'setCanvasData');
        const doNextSpy = spyOn(service, 'doNext').and.returnValue();
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>([''], { context: ctxSpy });
        service['gameActions'] = [
            { actionType: ActionType.End, waitTime: 1 },
            { actionType: ActionType.PostMessage, waitTime: 1 },
        ];
        service.replay(canvasManager, canvasManager);
        expect(resetSpy).toHaveBeenCalled();
        expect(setCanvasDataSpy).toHaveBeenCalled();
        expect(doNextSpy).toHaveBeenCalled();
    });

    it('allMessages should return messages', () => {
        service['messages'] = [];
        const result = service.allMessages;
        expect(result).toEqual(service['messages']);
    });

    it('playbackSpeed should return speed', () => {
        service['speed'] = 4;
        const result = service.playbackSpeed;
        expect(result).toEqual(service['speed']);
    });

    it('isPause should return isPaused', () => {
        service['isPaused'] = false;
        const result = service.isPause;
        expect(result).toEqual(service['isPaused']);
    });

    it('hasCanvas should return bool if canvasManagers is valid', () => {
        const result = service.hasCanvas;
        expect(result).toEqual(false);
    });

    it('isReplay setter should set isReplayMode', () => {
        service.isReplay = false;
        expect(service['isReplayMode']).toEqual(false);
    });

    it('setCanvasData should call putImageData', () => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>([''], { context: ctxSpy });
        service['canvasManagers'] = { originalCanvasManager: canvasManager, modifiedCanvasManager: canvasManager };
        service.setCanvasData();
        expect(ctxSpy.putImageData).toHaveBeenCalled();
    });

    it('getCanvasData should call getImageData', () => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        service.getCanvasData(ctxSpy);
        expect(ctxSpy.getImageData).toHaveBeenCalled();
    });

    it('getCanvasData should call getImageData if is original canvas', () => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        service.getCanvasData(ctxSpy, true);
        expect(ctxSpy.getImageData).toHaveBeenCalled();
    });

    it('doAction() should call correct functions for DifferenceFound', () => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>(['copyPixels', 'blinkPixels'], { context: ctxSpy });
        service['canvasManagers'] = { originalCanvasManager: canvasManager, modifiedCanvasManager: canvasManager };
        const mockImageData = ctxSpy.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const args: DifferenceFoundArgs = {
            remainingDifferentCoordinates: [],
            originalCanvasData: mockImageData,
            differentPixels: [],
            foundByLocalPlayer: true,
        };
        const action: GameAction = { waitTime: 0, actionType: ActionType.DifferenceFound, actionParams: args };
        service.doAction(action);
        expect(soundService.playDifferenceFoundAudio).toHaveBeenCalled();
        expect(canvasManager.copyPixels).toHaveBeenCalled();
        expect(infosServiceSpy.setPlayerDifferencesFound).toHaveBeenCalled();
    });

    it('doAction() should call correct functions for DifferenceFound but not local player', () => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>(['copyPixels', 'blinkPixels'], { context: ctxSpy });
        service['canvasManagers'] = { originalCanvasManager: canvasManager, modifiedCanvasManager: canvasManager };
        // @ts-ignore
        const mockImageData = ctxSpy.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const args: DifferenceFoundArgs = {
            remainingDifferentCoordinates: [],
            originalCanvasData: mockImageData,
            differentPixels: [],
            foundByLocalPlayer: false,
        };
        const action: GameAction = { waitTime: 0, actionType: ActionType.DifferenceFound, actionParams: args };
        service.doAction(action);
        expect(soundService.playDifferenceFoundAudio).toHaveBeenCalled();
        expect(canvasManager.copyPixels).toHaveBeenCalled();
        expect(infosServiceSpy.increaseDifferences).toHaveBeenCalled();
    });

    it('doAction() should call correct functions for ErrorClicked', fakeAsync(() => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>(['copyPixels', 'blinkPixels'], { context: ctxSpy });
        service['canvasManagers'] = { originalCanvasManager: canvasManager, modifiedCanvasManager: canvasManager };
        // @ts-ignore
        const args: Coordinates = { x: 0, y: 0 };
        const action: GameAction = { waitTime: 0, actionType: ActionType.ErrorClicked, actionParams: args };
        service.doAction(action);
        tick(DIFFERENCE_ERROR_DELAY);
        expect(soundService.playErrorAudio).toHaveBeenCalled();
        flush();
    }));

    it('doAction() should call correct functions for PostMessage', fakeAsync(() => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>(['copyPixels', 'blinkPixels'], { context: ctxSpy });
        service['canvasManagers'] = { originalCanvasManager: canvasManager, modifiedCanvasManager: canvasManager };
        // @ts-ignore
        const args: Message = {} as Message;
        const action: GameAction = { waitTime: 0, actionType: ActionType.PostMessage, actionParams: args };
        service['messages'] = [];
        const unshiftSpy = spyOn(service['messages'], 'unshift');
        service.doAction(action);
        tick(DIFFERENCE_ERROR_DELAY);
        expect(unshiftSpy).toHaveBeenCalled();
        flush();
    }));

    it('doAction() should call correct functions for ToggleCheatMode', () => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>(['copyPixels', 'blinkPixels'], { context: ctxSpy });
        service['canvasManagers'] = { originalCanvasManager: canvasManager, modifiedCanvasManager: canvasManager };
        // @ts-ignore
        const args: Coordinates[] = [];
        const action: GameAction = { waitTime: 0, actionType: ActionType.ToggleCheatMode, actionParams: args };
        service.doAction(action);
        expect(canvasManager.blinkPixels).toHaveBeenCalled();
    });

    it('doAction() should call correct functions for ToggleCheatMode', () => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>(['copyPixels', 'blinkPixels'], { context: ctxSpy });
        service['canvasManagers'] = { originalCanvasManager: canvasManager, modifiedCanvasManager: canvasManager };
        const action: GameAction = { waitTime: 0, actionType: ActionType.ToggleCheatMode };
        service['stopCheatBlink'] = () => {
            // empty function
        };
        service.doAction(action);
        expect(canvasManager.blinkPixels).not.toHaveBeenCalled();
    });

    it('doAction() should call correct functions for End', () => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>(['copyPixels', 'blinkPixels'], { context: ctxSpy });
        service['canvasManagers'] = { originalCanvasManager: canvasManager, modifiedCanvasManager: canvasManager };
        const action: GameAction = { waitTime: 0, actionType: ActionType.End };
        const clearIntervalSpy = spyOn(window, 'clearInterval');
        service.doAction(action);
        expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('doAction() should call correct functions for CloseModal', () => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>(['copyPixels', 'blinkPixels'], { context: ctxSpy });
        service['canvasManagers'] = { originalCanvasManager: canvasManager, modifiedCanvasManager: canvasManager };
        const action: GameAction = { waitTime: 0, actionType: ActionType.CloseModal };
        service.doAction(action);
        expect(dialog.closeAll).toHaveBeenCalled();
    });

    it('doAction() should call correct functions for RequestHint', () => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>(['copyPixels', 'blinkPixels'], { context: ctxSpy });
        service['canvasManagers'] = { originalCanvasManager: canvasManager, modifiedCanvasManager: canvasManager };
        const action: GameAction = { waitTime: 0, actionType: ActionType.RequestHint, actionParams: { hintNumber: 1, pixelsCoordinates: [] } };
        service.doAction(action);
        expect(canvasManager.blinkPixels).toHaveBeenCalled();
    });

    it('doAction() should call correct functions for RequestHint depending on hintNumber', () => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        // @ts-ignore
        const canvasManager = jasmine.createSpyObj<CanvasManager>(['copyPixels', 'blinkPixels'], { context: ctxSpy });
        service['canvasManagers'] = { originalCanvasManager: canvasManager, modifiedCanvasManager: canvasManager };
        const action: GameAction = { waitTime: 0, actionType: ActionType.RequestHint, actionParams: { hintNumber: 0, pixelsCoordinates: [] } };
        service.doAction(action);
        expect(canvasManager.blinkPixels).toHaveBeenCalled();
        expect(dialog.open).toHaveBeenCalled();
    });

    it('doNext() should create a timeout and call itself and doAction()', fakeAsync(() => {
        const ctxSpy = jasmine.createSpyObj<CanvasRenderingContext2D>('CanvasRenderingContext2D', ['drawImage', 'getImageData', 'putImageData']);
        const doNextSpy = spyOn(service, 'doNext').and.callThrough();
        const doActionSpy = spyOn(service, 'doAction').and.callThrough();
        const mockImageData = ctxSpy.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const args: DifferenceFoundArgs = {
            remainingDifferentCoordinates: [],
            originalCanvasData: mockImageData,
            differentPixels: [],
            foundByLocalPlayer: true,
        };
        service['gameActions'] = [
            { actionType: ActionType.DifferenceFound, waitTime: 1, actionParams: args },
            { actionType: ActionType.End, waitTime: 1, actionParams: args },
        ];
        service['currentIndex'] = 0;
        service['isPaused'] = false;
        service.doNext();
        tick(1);
        expect(doNextSpy).toHaveBeenCalledTimes(2);
        expect(doActionSpy).toHaveBeenCalled();
        flush();
    }));
});
