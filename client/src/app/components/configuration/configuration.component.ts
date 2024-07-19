import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HistoryComponent } from '@app/components/history/history.component';
import { BONUS_TIMER_MAX, BONUS_TIMER_MIN, INITIAL_TIMER_MAX, INITIAL_TIMER_MIN, PENALTY_TIMER_MAX, PENALTY_TIMER_MIN } from '@app/constants/consts';
import { CommunicationService } from '@app/services/communication.service';
import { GameSelectorService } from '@app/services/game-selector.service';
import { LeaderboardService } from '@app/services/leaderboard.service';
import { TimerService } from '@app/services/timer.service';
import { Game } from '@common/game';
import { GameConstants } from '@common/game-constants';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-configuration',
    templateUrl: './configuration.component.html',
    styleUrls: ['./configuration.component.scss'],
})
export class ConfigurationComponent implements OnInit, OnDestroy {
    private gameList: Game[] = [];
    private subscriptionGame: Subscription = new Subscription();
    private subscriptionToArrowDisabler: Subscription = new Subscription();
    private subscriptionToGameConstants: Subscription = new Subscription();
    private disableArrow: boolean[];
    private gameConstants: GameConstants;
    private deleteConfirmation: boolean;
    private resetConfirmation: boolean;
    private gameSelectorService: GameSelectorService;
    private timerService: TimerService;
    private leaderboardService: LeaderboardService;
    private communicationService: CommunicationService;
    private matDialog: MatDialog;

    private constants = [INITIAL_TIMER_MIN, INITIAL_TIMER_MAX, BONUS_TIMER_MIN, BONUS_TIMER_MAX, PENALTY_TIMER_MIN, PENALTY_TIMER_MAX];
    constructor(injector: Injector) {
        this.gameSelectorService = injector.get<GameSelectorService>(GameSelectorService);
        this.timerService = injector.get<TimerService>(TimerService);
        this.leaderboardService = injector.get<LeaderboardService>(LeaderboardService);
        this.communicationService = injector.get<CommunicationService>(CommunicationService);
        this.matDialog = injector.get<MatDialog>(MatDialog);
        this.deleteConfirmation = false;
        this.resetConfirmation = false;
        this.gameConstant = { initialTime: 30, bonusTime: 5, penaltyTime: 5 };
    }

    get deletionConfirmation(): boolean {
        return this.deleteConfirmation;
    }
    get resettingConfirmation(): boolean {
        return this.resetConfirmation;
    }

    get boundsConstants(): number[] {
        return this.constants;
    }

    get games(): Game[] {
        return this.gameList;
    }

    get arrowToDisable(): boolean[] {
        return this.disableArrow;
    }

    get gameConstant(): GameConstants {
        return this.gameConstants;
    }

    set gameConstant(gameConstant: GameConstants) {
        this.gameConstants = gameConstant;
    }

    set reset(confirm: boolean) {
        this.resetConfirmation = confirm;
    }

    set deleteConfirm(confirm: boolean) {
        this.deleteConfirmation = confirm;
    }

    confirmDelete() {
        this.deleteConfirmation = !this.deleteConfirmation;
    }

    confirmReset() {
        this.resetConfirmation = !this.resetConfirmation;
    }
    cancel() {
        this.deleteConfirmation = !this.deleteConfirmation;
        this.resetConfirmation = !this.resetConfirmation;
    }

    increment(timerToIncrement: string): void {
        this.timerService.increment(timerToIncrement);
        this.timerService.sendTimer();
    }

    decrement(timerToDecrement: string): void {
        this.timerService.decrement(timerToDecrement);
        this.timerService.sendTimer();
    }

    deleteGames() {
        this.communicationService.deleteGames().subscribe({
            next: () => {
                this.leaderboardService.deleteAll().subscribe({
                    next: () => {
                        this.gameSelectorService.fetchGames();
                    },
                });
            },
        });
        this.gameList = [];
        this.confirmDelete();
    }

    resetGames() {
        this.games.forEach((element) => {
            this.leaderboardService.reset(element.id as string).subscribe({
                next: () => {
                    this.gameSelectorService.fetchGames();
                },
            });
        });
        this.confirmReset();
    }

    ngOnInit(): void {
        this.subscriptionGame = this.gameSelectorService.gamesToDisplay.subscribe((games: Game[]) => {
            this.gameList = games;
        });

        this.subscriptionToArrowDisabler = this.gameSelectorService.disableArrow.subscribe((arrowToDisable: boolean[]) => {
            this.disableArrow = arrowToDisable;
        });

        this.subscriptionToGameConstants = this.timerService.gameConstants.subscribe((gameConstant: GameConstants) => {
            this.gameConstants = gameConstant;
        });

        this.gameSelectorService.fetchGames();
    }

    ngOnDestroy(): void {
        this.subscriptionGame.unsubscribe();
        this.subscriptionToArrowDisabler.unsubscribe();
        this.subscriptionToGameConstants.unsubscribe();
    }

    arrowLeft(): void {
        this.gameSelectorService.arrowLeft();
    }

    arrowRight(): void {
        this.gameSelectorService.arrowRight();
    }

    openHistoryModal(): void {
        this.matDialog.open(HistoryComponent, { disableClose: true, autoFocus: false, maxHeight: '85vh' });
    }
}
