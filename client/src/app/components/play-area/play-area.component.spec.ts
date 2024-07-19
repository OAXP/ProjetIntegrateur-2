import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { CanvasManager } from '@app/classes/canvas-manager';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { IMAGE_HEIGHT, IMAGE_WIDTH, MouseButton } from '@app/constants/consts';
import { gameMock1 } from '@app/constants/mock';
import { GameCreatorService } from '@app/services/game-creator.service';
import { GameHandlerService } from '@app/services/game-handler.service';
import { InfosService } from '@app/services/infos.service';
import { MouseService } from '@app/services/mouse.service';
import { Coordinates } from '@common/coordinates';
import SpyObj = jasmine.SpyObj;
import Spy = jasmine.Spy;
import { EventEmitter } from '@angular/core';
import { Game } from '@common/game';
import { ReplayService } from '@app/services/replay.service';

describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let fixture: ComponentFixture<PlayAreaComponent>;
    let mouseEvent: MouseEvent;
    let infosServiceSpy: SpyObj<InfosService>;
    let mouseServiceSpy: SpyObj<MouseService>;
    let gameHandlerServiceSpy: SpyObj<GameHandlerService>;
    let gameCreatorServiceSpy: SpyObj<GameCreatorService>;
    let matDialogSpy: SpyObj<MatDialog>;
    let replayService: SpyObj<ReplayService>;
    let getImageDataSpy: Spy;

    beforeEach(() => {
        const canvas = document.createElement('canvas');
        canvas.width = IMAGE_WIDTH;
        canvas.height = IMAGE_HEIGHT;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const mockImageData = canvas!.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, 1, 1);

        infosServiceSpy = jasmine.createSpyObj('InfosService', ['getGame', 'getEndGame']);
        infosServiceSpy.getGame.and.returnValue(gameMock1);
        mouseServiceSpy = jasmine.createSpyObj('MouseService', ['mouseHitDetect'], ['position']);
        const mockEmitter = jasmine.createSpyObj<EventEmitter<Game>>('EventEmitter', ['subscribe']);
        const mockSubscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
        mockEmitter.subscribe.and.returnValue(mockSubscription);
        gameHandlerServiceSpy = jasmine.createSpyObj('GameHandlerService', ['detectDifference', 'getGameChangeEmitter'], {
            originalImageData: mockImageData,
            modifiedImageData: mockImageData,
            remainingCoordinates: [],
        });
        gameHandlerServiceSpy.getGameChangeEmitter.and.returnValue(mockEmitter);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['closeAll']);
        gameCreatorServiceSpy = jasmine.createSpyObj('GameCreatorService', ['handleSockets', 'createGame']);
        gameCreatorServiceSpy.handleSockets.and.returnValue();
        replayService = jasmine.createSpyObj('ReplayService', ['getCanvasData', 'recordToggleCheatMode', 'replay', 'togglePause'], {
            playbackSpeed: 1,
            isPause: true,
            hasCanvas: true,
        });

        getImageDataSpy = spyOn(CanvasRenderingContext2D.prototype, 'getImageData');
        getImageDataSpy.and.returnValue(mockImageData);

        TestBed.configureTestingModule({
            declarations: [PlayAreaComponent],
            providers: [
                { provide: InfosService, useValue: infosServiceSpy },
                { provide: MouseService, useValue: mouseServiceSpy },
                { provide: GameHandlerService, useValue: gameHandlerServiceSpy },
                { provide: GameCreatorService, useValue: gameCreatorServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: ReplayService, useValue: replayService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.mouseCanvasPosition).toBeDefined();
        expect(component.mouseScreenPosition).toBeDefined();
        expect(component.originalImage).toBeDefined();
        expect(component.modifiedImage).toBeDefined();
        expect(component.canClick).toBeDefined();
    });

    it('should toggleCheatMode when t is pressed', () => {
        const keyEvent = { key: 't' } as KeyboardEvent;
        const toggleCheatModeSpy = spyOn(component, 'toggleCheatMode');
        component.buttonDetect(keyEvent);

        expect(toggleCheatModeSpy).toHaveBeenCalled();
    });

    it('initImagesData should call getImageData 4 times', () => {
        component.initImageData();

        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(getImageDataSpy).toHaveBeenCalledTimes(4);
    });

    it('toggleCheatMode should set isCheatMode to false if it is true', () => {
        component.isCheatMode = true;
        component.toggleCheatMode();
        expect(component.isCheatMode).toBe(false);
    });

    it('toggleCheatMode should set isCheatMode to true if it is false', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(CanvasManager.prototype, 'blinkPixels').and.returnValue(() => {});
        component.isCheatMode = false;
        component.toggleCheatMode();
        expect(component.isCheatMode).toBe(true);
    });

    it('toggleCheatMode should call blinkPixels if cheatMode is on', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const blinkPixelsSpy = spyOn(CanvasManager.prototype, 'blinkPixels').and.returnValue(() => {});
        component.isCheatMode = false;
        component.toggleCheatMode();
        expect(blinkPixelsSpy).toHaveBeenCalled();
    });

    it('toggleCheatMode should call stopCheatBlink if cheatMode is off', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const stopCheatBlinkSpy = spyOn(component, 'stopCheatBlink').and.callFake(() => {});
        component.isCheatMode = true;
        component.toggleCheatMode();
        expect(stopCheatBlinkSpy).toHaveBeenCalled();
    });

    it('should call drawImage() twice', () => {
        const spy = spyOn(CanvasManager.prototype, 'drawImage');
        component.ngAfterViewInit();
        expect(component.canvasManagerOriginal).toBeDefined();
        expect(component.canvasManagerModified).toBeDefined();
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should execute mouseHitDetect correctly', () => {
        const expectedPosition: Coordinates = { x: 100, y: 200 };
        const position: Coordinates = { x: 1, y: 1 };
        mouseEvent = {
            clientX: expectedPosition.x,
            clientY: expectedPosition.y,
            x: expectedPosition.x,
            y: expectedPosition.y,
            offsetX: expectedPosition.x,
            offsetY: expectedPosition.y,
            button: MouseButton.Left,
        } as MouseEvent;
        component.mouseScreenPosition = position;
        component.mouseCanvasPosition = position;
        (Object.getOwnPropertyDescriptor(mouseServiceSpy, 'position')?.get as Spy<() => Coordinates>).and.returnValue(expectedPosition);
        component.mouseHitDetect(mouseEvent);
        expect(gameHandlerServiceSpy.detectDifference).toHaveBeenCalled();
        expect(component.mouseScreenPosition).toEqual(expectedPosition);
        expect(component.mouseCanvasPosition).toEqual(expectedPosition);
    });

    it('mouseHitDetect should not change the mouse position if it is not a left click', () => {
        const expectedPosition: Coordinates = { x: 25, y: 30 };
        mouseEvent = {
            offsetX: expectedPosition.x,
            offsetY: expectedPosition.y,
            button: MouseButton.Right,
        } as MouseEvent;
        component.mouseHitDetect(mouseEvent);
        expect(component.mouseCanvasPosition).not.toEqual(expectedPosition);
        expect(component.mouseScreenPosition).not.toEqual(expectedPosition);
    });

    it('canClick should be false if enGame is true and not execute mouseHitDetect & detectDiff', () => {
        const position: Coordinates = { x: 0, y: 0 };
        mouseEvent = {
            offsetX: position.x,
            offsetY: position.y,
            button: MouseButton.Left,
        } as MouseEvent;
        infosServiceSpy.getEndGame.and.returnValue(true);
        component.mouseHitDetect(mouseEvent);
        expect(component.canClick).toBeFalsy();
        expect(mouseServiceSpy.mouseHitDetect).not.toHaveBeenCalled();
        expect(gameHandlerServiceSpy.detectDifference).not.toHaveBeenCalled();
    });

    it('get should return the right proportions', () => {
        expect(component.width).toEqual(IMAGE_WIDTH);
        expect(component.height).toEqual(IMAGE_HEIGHT);
    });

    it('replay() should call replayService replay()', () => {
        component.replay();
        expect(replayService.replay).toHaveBeenCalled();
    });

    it('togglePause() should call replayService togglePause()', () => {
        component.togglePause();
        expect(replayService.togglePause).toHaveBeenCalled();
    });

    it('replaySpeed() should return playbackSpeed', () => {
        const result = component.replaySpeed;
        expect(result).toEqual(replayService.playbackSpeed.toString());
    });

    it('isReplayPaused() should return isPause', () => {
        const result = component.isReplayPaused;
        expect(result).toEqual(replayService.isPause);
    });

    it('replayHasCanvas() should return hasCanvas', () => {
        const result = component.replayHasCanvas;
        expect(result).toEqual(replayService.hasCanvas);
    });
});
