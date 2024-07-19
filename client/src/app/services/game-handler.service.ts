import { EventEmitter, Injectable, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CanvasManager } from '@app/classes/canvas-manager';
import { DIFFERENCE_ERROR_DELAY } from '@app/constants/consts';
import { InfosService } from '@app/services/infos.service';
import { ReplayService } from '@app/services/replay.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { SoundService } from '@app/services/sound.service';
import { NUM_RGBA_KEYS, getDataIndex } from '@app/utils/canvas.utils';
import { Coordinates } from '@common/coordinates';
import { Game } from '@common/game';
import { GameStats } from '@common/game-stats';
import { LobbyModes } from '@common/lobby-modes';
import { Subject } from 'rxjs';
import { MessagesService } from './messages.service';

interface OnDetectDifferenceResponseArgs {
    isDifferent: boolean;
    differentPixels: Coordinates[];
    remainingDifferentCoordinates: Coordinates[];
    socketId: string;
}

interface OnStartGameParamsArgs {
    roomId: string;
    remainingDifferentCoordinates: Coordinates[];
    mode: LobbyModes;
    gameParams: GameStats;
}
@Injectable({
    providedIn: 'root',
})
export class GameHandlerService {
    private canClick: boolean;
    private originalImageData: ImageData;
    private modifiedImageData: ImageData;
    private remainingDifferentCoordinates: Coordinates[];
    private canvasManagers: { canvasManagerOriginal?: CanvasManager; canvasManagerModified?: CanvasManager };
    private mouseScreenPosition: Coordinates;
    private timer;
    private socketClientService: SocketClientService;
    private infosService: InfosService;
    private router: Router;
    private messagesService: MessagesService;
    private matDialog: MatDialog;
    private soundService: SoundService;
    private replayService: ReplayService;
    private gameChange: EventEmitter<Game>;

    private toggleCheatMode: () => void;

    constructor(injector: Injector) {
        this.socketClientService = injector.get<SocketClientService>(SocketClientService);
        this.infosService = injector.get<InfosService>(InfosService);
        this.router = injector.get<Router>(Router);
        this.matDialog = injector.get<MatDialog>(MatDialog);
        this.messagesService = injector.get<MessagesService>(MessagesService);
        this.soundService = injector.get<SoundService>(SoundService);
        this.mouseScreenPosition = { x: 0, y: 0 };
        this.canvasManagers = { canvasManagerOriginal: undefined, canvasManagerModified: undefined };
        this.timer = new Subject<number>();
        this.canClick = true;
        this.remainingDifferentCoordinates = [];
        this.replayService = injector.get<ReplayService>(ReplayService);
        this.gameChange = new EventEmitter<Game>();
    }

    get clock() {
        return this.timer.asObservable();
    }

    get remainingCoordinates(): Coordinates[] {
        return this.remainingDifferentCoordinates;
    }

    set toggleCheatModeFunc(value: () => void) {
        this.toggleCheatMode = value;
    }

    set managers(value: { canvasManagerOriginal?: CanvasManager; canvasManagerModified?: CanvasManager }) {
        this.canvasManagers = value;
    }

    set originalData(value: ImageData) {
        this.originalImageData = value;
    }

    set modifiedData(value: ImageData) {
        this.modifiedImageData = value;
    }

    getGameChangeEmitter() {
        return this.gameChange;
    }

    detectDifference(
        mousePosition: {
            mouseCanvasPosition: Coordinates;
            mouseScreenPosition: Coordinates;
        },
        gameId: string,
        canvasManagers: {
            canvasManagerOriginal: CanvasManager;
            canvasManagerModified: CanvasManager;
        },
    ) {
        if (!this.canClick) {
            return;
        }
        this.canClick = false;
        this.canvasManagers.canvasManagerOriginal = canvasManagers.canvasManagerOriginal;
        this.canvasManagers.canvasManagerModified = canvasManagers.canvasManagerModified;
        this.mouseScreenPosition.x = mousePosition.mouseScreenPosition.x;
        this.mouseScreenPosition.y = mousePosition.mouseScreenPosition.y;
        this.socketClientService.send('detect-difference', mousePosition.mouseCanvasPosition, gameId, this.socketClientService.currentGameRoomId);
    }

    setDifferenceImageData(differentPixels: Coordinates[]) {
        differentPixels.forEach((coordinate: Coordinates) => {
            const i = getDataIndex(coordinate.x, coordinate.y);
            for (let j = 0; j < NUM_RGBA_KEYS; j++) {
                this.modifiedImageData.data[i + j] = this.originalImageData.data[i + j];
            }
        });
    }

    onDetectDifferenceResponse = (params: OnDetectDifferenceResponseArgs) => {
        if (params.isDifferent) {
            if (params.socketId === this.socketClientService.socket.id) {
                if (this.infosService.getGameMode() !== 'Solo' && this.infosService.getGameMode() !== 'Solo Limité') {
                    this.messagesService.sendMessage({
                        title: 'event',
                        body: 'Différence trouvée par ' + this.infosService.getPlayerName(),
                        date: Date.now(),
                    });
                } else {
                    this.messagesService.sendMessage({ title: 'event', body: 'Différence trouvée', date: Date.now() });
                }
                if (this.infosService.getPlayerDifferencesFound()) {
                    this.infosService.setPlayerDifferencesFound(this.infosService.getPlayerDifferencesFound() + 1);
                } else {
                    this.infosService.setPlayerDifferencesFound(1);
                }
            }
            this.canClick = true;
            this.setDifferenceImageData(params.differentPixels);
            this.soundService.playDifferenceFoundAudio();
            if (!this.infosService.isLimitedMode()) {
                this.canvasManagers.canvasManagerModified?.copyPixels({
                    originalCanvas: this.canvasManagers.canvasManagerOriginal as CanvasManager,
                    pixelsCoordinates: params.differentPixels,
                    originalImageData: this.originalImageData,
                });
                this.replayService.recordDifferenceFound({
                    differentPixels: params.differentPixels,
                    originalCanvasData: this.originalImageData,
                    remainingDifferentCoordinates: params.remainingDifferentCoordinates,
                    foundByLocalPlayer: params.socketId === this.socketClientService.socket.id,
                });
            }
            this.infosService.increaseDifferences();
            if (this.infosService.isLimitedMode()) return;
            // Did a loop to keep original array reference
            params.remainingDifferentCoordinates.forEach((coordinate, index) => {
                this.remainingDifferentCoordinates[index] = coordinate;
            });
            this.remainingDifferentCoordinates.length = params.remainingDifferentCoordinates.length;
        } else if (!params.isDifferent && params.socketId === this.socketClientService.socket.id) {
            if (this.infosService.getGameMode() !== 'Solo' && this.infosService.getGameMode() !== 'Solo Limité') {
                this.messagesService.sendMessage({ title: 'event', body: 'Erreur par ' + this.infosService.getPlayerName(), date: Date.now() });
            } else {
                this.messagesService.sendMessage({ title: 'event', body: 'Erreur', date: Date.now() });
            }
            this.replayService.recordErrorFound({ x: this.mouseScreenPosition.x, y: this.mouseScreenPosition.y });
            this.soundService.playErrorAudio();
            this.canClick = false;
            // show error
            const errorParagraphElement = document.createElement('p');
            errorParagraphElement.innerText = 'ERREUR';
            errorParagraphElement.style.left = this.mouseScreenPosition.x + 'px';
            errorParagraphElement.style.top = this.mouseScreenPosition.y + 'px';
            errorParagraphElement.style.position = 'fixed';
            errorParagraphElement.style.color = 'red';
            errorParagraphElement.style.backgroundColor = 'white';
            document.body.appendChild(errorParagraphElement);
            // end show error
            setTimeout(() => {
                errorParagraphElement.remove();
                this.canClick = true;
            }, DIFFERENCE_ERROR_DELAY);
        }
    };

    onStartGame = (params: OnStartGameParamsArgs) => {
        this.socketClientService.currentGameRoomId = params.roomId;
        this.remainingDifferentCoordinates = params.remainingDifferentCoordinates;
        this.infosService.setGameMode(params.mode);
        this.infosService.setGameParams(params.gameParams);
        if (params.mode !== LobbyModes.ClassicSolo && params.mode !== LobbyModes.LimitedSolo) {
            this.matDialog.closeAll();
            this.router.navigate(['/game']);
            this.replayService.startReplayTime();
            this.messagesService.resetMessages();
        }
    };

    onChrono = (timer: number) => {
        this.timer.next(timer);
    };

    onNextGameLimited = (game: Game, remainingDifferentCoordinates: Coordinates[]) => {
        const currentGame = this.infosService.getGame();
        Object.assign(currentGame, game);
        this.remainingDifferentCoordinates = remainingDifferentCoordinates;
        this.toggleCheatMode();
        this.toggleCheatMode();
        // Rerender canvas
        this.gameChange.emit(game);
    };

    handleSocket(): void {
        this.socketClientService.socket.on('chrono', this.onChrono);
        this.socketClientService.socket.on('start-game', this.onStartGame);
        this.socketClientService.socket.on('detect-difference-response', this.onDetectDifferenceResponse);
        this.socketClientService.socket.on('next-game-limited', this.onNextGameLimited);
        this.messagesService.handleMessageReceive();
    }
}
