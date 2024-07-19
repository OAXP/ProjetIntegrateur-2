import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanvasManager } from '@app/classes/canvas-manager';
import { ThirdHintComponent } from '@app/components/clues/third-hint/third-hint.component';
import { DIFFERENCE_ERROR_DELAY, IMAGE_HEIGHT, IMAGE_WIDTH, WAIT_TIME } from '@app/constants/consts';
import { ActionType } from '@app/interfaces/action-type';
import { DifferenceFoundArgs } from '@app/interfaces/difference-found-args';
import { GameAction } from '@app/interfaces/game-action';
import { HintRequestedArgs } from '@app/interfaces/hint-requested-args';
import { PlaybackSpeed } from '@app/interfaces/playback-speed';
import { InfosService } from '@app/services/infos.service';
import { SoundService } from '@app/services/sound.service';
import { Coordinates } from '@common/coordinates';
import { Message } from '@common/message';

@Injectable({
    providedIn: 'root',
})
export class ReplayService {
    stopCheatBlink: () => void;
    private time: number;
    private gameActions: GameAction[];
    private speed: number;
    private isPaused: boolean;
    private messages: Message[];
    private isReplayMode: boolean;
    private currentIndex: number;
    private canvasManagers: { originalCanvasManager: CanvasManager; modifiedCanvasManager: CanvasManager } | undefined;
    private originalCanvasData: ImageData;
    private modifiedCanvasData: ImageData;
    private currentTimeoutId: number;
    private clockIntervalId: number;
    private replayClock: number;
    private penaltyTime: number;
    private isEnd: boolean;
    private isBlinking: boolean;
    private remainingDifferentCoordinates: Coordinates[];
    private hints: number;

    constructor(private infoService: InfosService, private soundService: SoundService, private dialog: MatDialog) {
        this.time = 0;
        this.gameActions = [];
        this.speed = 1;
        this.isPaused = true;
        this.isReplayMode = false;
        this.currentIndex = 0;
        this.replayClock = 0;
        this.penaltyTime = 0;
        this.isEnd = false;
        this.isBlinking = false;
        this.remainingDifferentCoordinates = [];
        this.hints = 0;
    }

    get actionTime() {
        return Date.now() - this.time;
    }

    get allMessages(): Message[] {
        return this.messages;
    }

    get playbackSpeed(): number {
        return this.speed;
    }

    get isReplay(): boolean {
        return this.isReplayMode;
    }

    get isPause(): boolean {
        return this.isPaused;
    }
    get hasCanvas() {
        return !!this.canvasManagers;
    }

    get clock() {
        return this.replayClock;
    }
    get hint() {
        return this.hints;
    }
    set isReplay(value: boolean) {
        this.isReplayMode = value;
        this.infoService.isReplayMode = value;
    }
    set playbackSpeed(value: number) {
        if (value === PlaybackSpeed.Normal || value === PlaybackSpeed.Fast || value === PlaybackSpeed.UltraFast) this.speed = value;
    }

    set hintPenalty(value: number) {
        this.penaltyTime = value;
    }

    getCanvasData(context: CanvasRenderingContext2D, isOriginalCanvas?: boolean) {
        if (isOriginalCanvas) this.originalCanvasData = context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        else this.modifiedCanvasData = context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    setCanvasData() {
        this.canvasManagers?.originalCanvasManager.context.putImageData(this.originalCanvasData, 0, 0);
        this.canvasManagers?.modifiedCanvasManager.context.putImageData(this.modifiedCanvasData, 0, 0);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            if (this.isBlinking) {
                this.stopCheatBlink = this.canvasManagers?.originalCanvasManager.blinkPixels(
                    {
                        pixelsCoordinates: this.remainingDifferentCoordinates,
                    },
                    this.speed,
                ) as () => void;
            }
            this.currentIndex = Math.max(0, this.currentIndex - 1);
            if (this.isEnd) {
                this.replay(this.canvasManagers?.originalCanvasManager as CanvasManager, this.canvasManagers?.modifiedCanvasManager as CanvasManager);
                return;
            }
            this.clockIntervalId = window.setInterval(() => {
                this.replayClock++;
            }, WAIT_TIME / this.speed);
            this.doNext();
        } else {
            clearTimeout(this.currentTimeoutId);
            clearInterval(this.clockIntervalId);
            if (this.isBlinking) {
                this.stopCheatBlink();
                this.stopCheatBlink = () => {
                    // remove function
                };
            }
        }
    }

    startReplayTime() {
        this.isEnd = false;
        this.isReplay = false;
        this.isPaused = true;
        this.speed = PlaybackSpeed.Normal;
        this.time = Date.now();
        this.gameActions.length = 0;
        this.stopCheatBlink = () => {
            /* empty function */
        };
        this.currentIndex = 0;
    }

    recordErrorFound(mousePosition: Coordinates) {
        this.gameActions.push({ waitTime: this.actionTime, actionType: ActionType.ErrorClicked, actionParams: mousePosition });
        this.time = Date.now();
    }

    recordPostMessage(message: Message) {
        this.gameActions.push({ waitTime: this.actionTime, actionType: ActionType.PostMessage, actionParams: message });
        this.time = Date.now();
    }

    recordToggleCheatMode(remainingDifferentCoordinates?: Coordinates[]) {
        this.gameActions.push({ waitTime: this.actionTime, actionType: ActionType.ToggleCheatMode, actionParams: remainingDifferentCoordinates });
        this.time = Date.now();
    }

    recordDifferenceFound(differenceFoundArgs: DifferenceFoundArgs) {
        this.gameActions.push({ waitTime: this.actionTime, actionType: ActionType.DifferenceFound, actionParams: differenceFoundArgs });
        this.time = Date.now();
    }

    recordHintRequest(hintRequestedArgs: HintRequestedArgs) {
        this.gameActions.push({ waitTime: this.actionTime, actionType: ActionType.RequestHint, actionParams: hintRequestedArgs });
        this.time = Date.now();
    }

    recordEnd() {
        this.gameActions.push({ waitTime: this.actionTime, actionType: ActionType.End });
    }

    recordCloseModal() {
        this.gameActions.push({ waitTime: this.actionTime, actionType: ActionType.CloseModal });
        this.time = Date.now();
    }

    reset() {
        this.isEnd = false;
        this.isReplay = false;
        this.isPaused = false;
        this.messages = [];
        this.gameActions.forEach((action: GameAction) => {
            action.hasBeenReplayed = false;
        });
        this.currentIndex = 0;
        this.infoService.setPlayerDifferencesFound(0);
        this.infoService.setTotalDifferencesFound(0);
        this.canvasManagers = undefined;
        this.replayClock = 0;
        this.hints = 3;
        clearTimeout(this.currentTimeoutId);
        clearInterval(this.clockIntervalId);
    }

    moveToEnd(index: number) {
        this.gameActions.push(this.gameActions.splice(index, 1)[0]);
    }

    replay(originalCanvasManager: CanvasManager, modifiedCanvasManager: CanvasManager) {
        const endIndex = this.gameActions.length - 1;
        if (this.gameActions[endIndex].actionType !== ActionType.End) {
            const index = this.gameActions.findIndex((action: GameAction) => action.actionType === ActionType.End);
            this.moveToEnd(index);
        }
        this.reset();
        this.clockIntervalId = window.setInterval(() => {
            this.replayClock++;
        }, WAIT_TIME / this.speed);
        this.isReplay = true;
        this.canvasManagers = { originalCanvasManager, modifiedCanvasManager };
        this.setCanvasData();
        clearTimeout(this.currentTimeoutId);
        this.doNext();
    }

    doNext() {
        const action = this.gameActions[this.currentIndex];
        this.currentTimeoutId = window.setTimeout(() => {
            if (!action.hasBeenReplayed) this.doAction(action);
            action.hasBeenReplayed = true;
            if (++this.currentIndex <= this.gameActions.length && !this.isPaused) {
                this.doNext();
            }
        }, action.waitTime / this.speed);
    }

    doAction(action: GameAction) {
        switch (action.actionType) {
            case ActionType.DifferenceFound: {
                this.soundService.playDifferenceFoundAudio(this.speed);
                const args = action.actionParams as DifferenceFoundArgs;
                this.remainingDifferentCoordinates = args.remainingDifferentCoordinates;
                this.canvasManagers?.modifiedCanvasManager.copyPixels(
                    {
                        originalCanvas: this.canvasManagers?.originalCanvasManager,
                        pixelsCoordinates: args.differentPixels,
                        originalImageData: args.originalCanvasData,
                    },
                    this.speed,
                );
                if (args.foundByLocalPlayer) this.infoService.setPlayerDifferencesFound(this.infoService.getPlayerDifferencesFound() + 1);
                this.infoService.increaseDifferences();
                break;
            }
            case ActionType.ErrorClicked: {
                this.soundService.playErrorAudio(this.speed);
                const mousePosition = action.actionParams as Coordinates;
                const errorElement = document.createElement('p');
                errorElement.innerText = 'ERREUR';
                errorElement.style.left = mousePosition.x + 'px';
                errorElement.style.top = mousePosition.y + 'px';
                errorElement.style.position = 'fixed';
                errorElement.style.color = 'red';
                errorElement.style.backgroundColor = 'white';
                document.body.appendChild(errorElement);
                setTimeout(() => {
                    errorElement.remove();
                }, DIFFERENCE_ERROR_DELAY / this.speed);
                break;
            }
            case ActionType.PostMessage: {
                const message = action.actionParams as Message;
                this.messages.unshift(message);
                break;
            }
            case ActionType.ToggleCheatMode: {
                this.remainingDifferentCoordinates = action?.actionParams as Coordinates[];

                if (this.remainingDifferentCoordinates) {
                    this.isBlinking = true;
                    this.stopCheatBlink = this.canvasManagers?.originalCanvasManager.blinkPixels(
                        {
                            pixelsCoordinates: this.remainingDifferentCoordinates,
                        },
                        this.speed,
                    ) as () => void;
                } else {
                    this.isBlinking = false;
                    this.stopCheatBlink();
                    this.stopCheatBlink = () => {
                        // remove function
                    };
                }
                break;
            }
            case ActionType.RequestHint: {
                this.hints--;
                const { hintNumber, pixelsCoordinates } = action.actionParams as HintRequestedArgs;
                this.canvasManagers?.originalCanvasManager.blinkPixels({ pixelsCoordinates, totalSeconds: 1 });
                if (!hintNumber) this.dialog.open(ThirdHintComponent);
                this.replayClock += this.penaltyTime;
                break;
            }
            case ActionType.CloseModal: {
                this.dialog.closeAll();
                break;
            }
            case ActionType.End: {
                clearInterval(this.clockIntervalId);
                this.isPaused = true;
                this.isEnd = true;
                this.dialog.closeAll();
            }
        }
    }
}
