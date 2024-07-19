import { AfterViewInit, Component, ElementRef, HostListener, Injector, OnDestroy, ViewChild } from '@angular/core';
import { CanvasManager } from '@app/classes/canvas-manager';
import { IMAGE_HEIGHT, IMAGE_WIDTH, MouseButton } from '@app/constants/consts';
import { BlinkService } from '@app/services/blink.service';
import { GameCreatorService } from '@app/services/game-creator.service';
import { GameHandlerService } from '@app/services/game-handler.service';
import { InfosService } from '@app/services/infos.service';
import { MessagesService } from '@app/services/messages.service';
import { MouseService } from '@app/services/mouse.service';
import { Coordinates } from '@common/coordinates';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { Game } from '@common/game';
import { ReplayService } from '@app/services/replay.service';
import { HintService } from '@app/services/hint.service';

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
})
export class PlayAreaComponent implements AfterViewInit, OnDestroy {
    @ViewChild('originalCanvas', { static: false }) private originalCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('originalFg', { static: false }) private originalFg!: ElementRef<HTMLCanvasElement>;
    @ViewChild('modifiedCanvas', { static: false }) private modifiedCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('modifiedFg', { static: false }) private modifiedFg!: ElementRef<HTMLCanvasElement>;

    stopCheatBlink: () => void;
    private mousePositionOnCanvas: Coordinates;
    private mousePositionOnScreen: Coordinates;
    private image1: string;
    private image2: string;
    private isClickable: boolean;
    private cheatMode: boolean;
    private originalCanvasManager: CanvasManager;
    private modifiedCanvasManager: CanvasManager;
    private mouseService: MouseService;
    private infosService: InfosService;
    private gameHandlerService: GameHandlerService;
    private gameCreatorService: GameCreatorService;
    private messagesService: MessagesService;
    private hintService: HintService;
    private readonly blinkService: BlinkService;
    private gameChangeSubscription: Subscription;
    private hintChangeSubcription: Subscription;
    private replayService: ReplayService;

    private canvasSize: Coordinates;
    constructor(injector: Injector) {
        this.mouseService = injector.get<MouseService>(MouseService);
        this.infosService = injector.get<InfosService>(InfosService);
        this.gameHandlerService = injector.get<GameHandlerService>(GameHandlerService);
        this.gameHandlerService.toggleCheatModeFunc = () => {
            this.toggleCheatMode();
        };
        this.gameCreatorService = injector.get<GameCreatorService>(GameCreatorService);
        this.replayService = injector.get<ReplayService>(ReplayService);
        this.gameCreatorService.stopCheatBlinkFunc = () => {
            if (this.cheatMode) this.toggleCheatMode();
        };
        this.blinkService = injector.get<BlinkService>(BlinkService);
        this.messagesService = injector.get<MessagesService>(MessagesService);
        this.hintService = injector.get<HintService>(HintService);
        this.image1 = environment.serverBaseUrl + this.infosService.getGame().image1Url;
        this.image2 = environment.serverBaseUrl + this.infosService.getGame().image2Url;
        this.stopCheatBlink = () => {
            /* empty function */
        };
        this.isClickable = true;
        this.cheatMode = false;
        this.mousePositionOnCanvas = { x: 0, y: 0 };
        this.mousePositionOnScreen = { x: 0, y: 0 };
        this.canvasSize = { x: IMAGE_WIDTH, y: IMAGE_HEIGHT };
        this.replaySpeed = '1';
    }

    get width(): number {
        return this.canvasSize.x;
    }

    get height(): number {
        return this.canvasSize.y;
    }

    get mouseCanvasPosition(): Coordinates {
        return this.mousePositionOnCanvas;
    }

    get mouseScreenPosition(): Coordinates {
        return this.mousePositionOnScreen;
    }

    get canClick(): boolean {
        return this.isClickable;
    }

    get isCheatMode(): boolean {
        return this.cheatMode;
    }

    get canvasManagerOriginal(): CanvasManager {
        return this.originalCanvasManager;
    }

    get canvasManagerModified(): CanvasManager {
        return this.modifiedCanvasManager;
    }

    get originalImage(): string {
        return this.image1;
    }

    get modifiedImage(): string {
        return this.image2;
    }

    get isReplayMode(): boolean {
        return this.replayService.isReplay;
    }

    get replaySpeed(): string {
        return this.replayService.playbackSpeed.toString();
    }

    get isReplayPaused(): boolean {
        return this.replayService.isPause;
    }

    get replayHasCanvas(): boolean {
        return this.replayService.hasCanvas;
    }

    set replaySpeed(value: string) {
        this.replayService.playbackSpeed = +value;
    }

    set isCheatMode(value: boolean) {
        this.cheatMode = value;
    }

    set mouseCanvasPosition(value: Coordinates) {
        this.mousePositionOnCanvas = value;
    }

    set mouseScreenPosition(value: Coordinates) {
        this.mousePositionOnScreen = value;
    }

    @HostListener('window:keydown', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        if (event.key === 't' && !this.messagesService.getIsTyping() && !this.infosService.getEndGame()) {
            this.toggleCheatMode();
        }
    }

    ngAfterViewInit(): void {
        this.originalCanvasManager = new CanvasManager(this.originalCanvas.nativeElement, this.blinkService);
        this.modifiedCanvasManager = new CanvasManager(this.modifiedCanvas.nativeElement, this.blinkService);
        this.gameHandlerService.managers = {
            canvasManagerOriginal: this.originalCanvasManager,
            canvasManagerModified: this.modifiedCanvasManager,
        };
        this.originalCanvasManager.drawImage(this.image1, this.initImageData);
        this.modifiedCanvasManager.drawImage(this.image2, this.initImageData);
        const ctx = this.originalFg.nativeElement.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        const otherCtx = this.modifiedFg.nativeElement.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        this.blinkService.setContexts(ctx, otherCtx);
        this.gameChangeSubscription = this.gameHandlerService.getGameChangeEmitter().subscribe((game: Game) => {
            this.image1 = environment.serverBaseUrl + game.image1Url;
            this.image2 = environment.serverBaseUrl + game.image2Url;
            this.originalCanvasManager.drawImage(this.image1, this.initImageData);
            this.modifiedCanvasManager.drawImage(this.image2, this.initImageData);
        });
        this.hintService.setCanvasManagers(this.originalCanvasManager, this.modifiedCanvasManager);
        this.hintChangeSubcription = this.hintService.hintUpdate.subscribe((remainingHints) => {
            this.flashHint(remainingHints);
        });
    }

    ngOnDestroy() {
        this.stopCheatBlink();
        this.gameChangeSubscription.unsubscribe();
        this.hintChangeSubcription.unsubscribe();
    }

    initImageData = () => {
        this.gameHandlerService.originalData = this.originalCanvasManager.context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.gameHandlerService.modifiedData = this.modifiedCanvasManager.context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.replayService.getCanvasData(this.originalCanvasManager.context, true);
        this.replayService.getCanvasData(this.modifiedCanvasManager.context);
    };

    toggleCheatMode() {
        this.cheatMode = !this.cheatMode;
        if (this.cheatMode) {
            this.stopCheatBlink = this.originalCanvasManager.blinkPixels({
                pixelsCoordinates: this.gameHandlerService.remainingCoordinates,
            }) as () => void;
            this.replayService.recordToggleCheatMode([...this.gameHandlerService.remainingCoordinates]);
        } else {
            this.stopCheatBlink();
            this.stopCheatBlink = () => {
                // remove function
            };
            this.replayService.recordToggleCheatMode();
        }
    }

    flashHint(remainingHints: number) {
        if (remainingHints !== 3) {
            const pixelsCoordinates = this.hintService.initHintPixels(remainingHints);
            this.originalCanvasManager.blinkPixels({ pixelsCoordinates, totalSeconds: 1 });
            this.replayService.recordHintRequest({ hintNumber: remainingHints, pixelsCoordinates });
        }
    }

    mouseHitDetect(event: MouseEvent) {
        if (event.button !== MouseButton.Left) {
            return;
        }
        if (this.infosService.getEndGame()) {
            this.isClickable = false;
        }
        if (this.isClickable) {
            this.mousePositionOnScreen.x = event.x;
            this.mousePositionOnScreen.y = event.y;
            this.mouseService.mouseHitDetect(event);
            this.mousePositionOnCanvas = this.mouseService.position;
            this.gameHandlerService.detectDifference(
                {
                    mouseCanvasPosition: this.mousePositionOnCanvas,
                    mouseScreenPosition: this.mousePositionOnScreen,
                },
                this.infosService.getGame().id as string,
                {
                    canvasManagerOriginal: this.originalCanvasManager,
                    canvasManagerModified: this.modifiedCanvasManager,
                },
            );
        }
    }

    replay() {
        this.replayService.replay(this.originalCanvasManager, this.modifiedCanvasManager);
    }

    togglePause() {
        this.replayService.togglePause();
    }
}
