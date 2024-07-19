import { Component, HostListener, Injector, OnDestroy, OnInit } from '@angular/core';
import { HintService } from '@app/services/hint.service';
import { InfosService } from '@app/services/infos.service';
import { MessagesService } from '@app/services/messages.service';
import { ReplayService } from '@app/services/replay.service';
import { TimerService } from '@app/services/timer.service';
import { GameConstants } from '@common/game-constants';
import { LobbyModes } from '@common/lobby-modes';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-clues',
    templateUrl: './clues.component.html',
    styleUrls: ['./clues.component.scss'],
})
export class CluesComponent implements OnInit, OnDestroy {
    private infosService: InfosService;
    private hintService: HintService;
    private messagesService: MessagesService;
    private timerService: TimerService;
    private replayService: ReplayService;
    private gameConstants: GameConstants;
    private subscriptionToGameConstants: Subscription;

    constructor(injector: Injector) {
        this.infosService = injector.get<InfosService>(InfosService);
        this.messagesService = injector.get<MessagesService>(MessagesService);
        this.hintService = injector.get<HintService>(HintService);
        this.timerService = injector.get<TimerService>(TimerService);
        this.replayService = injector.get<ReplayService>(ReplayService);
    }

    get penaltyTime(): number {
        return this.gameConstants.penaltyTime;
    }

    @HostListener('window:keydown', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        if (
            event.key === 'i' &&
            !this.messagesService.getIsTyping() &&
            !this.infosService.getEndGame() &&
            this.hintService.getHints() > 0 &&
            !this.replayService.isReplay
        ) {
            this.useHint();
        }
    }

    ngOnInit() {
        this.subscriptionToGameConstants = this.timerService.gameConstants.subscribe((gameConstant: GameConstants) => {
            this.gameConstants = gameConstant;
        });
    }

    ngOnDestroy() {
        this.hintService.resetHints();
        this.subscriptionToGameConstants.unsubscribe();
    }

    getHints(): number {
        return this.replayService.isReplay ? this.replayService.hint : this.hintService.getHints();
    }

    isSolo(): boolean {
        const mode = this.infosService.getGameMode();
        return mode === LobbyModes.ClassicSolo || mode === LobbyModes.LimitedSolo;
    }

    isReplay(): boolean {
        return this.replayService.isReplay;
    }

    useHint() {
        this.messagesService.sendMessage({ title: 'event', body: 'Indice utilisé', date: Date.now() });
        this.hintService.useHint();
    }
}
