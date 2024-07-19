import { Component, OnDestroy, OnInit } from '@angular/core';
import { GameSelectorService } from '@app/services/game-selector.service';
import { Game } from '@common/game';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-section',
    templateUrl: './game-selection.component.html',
    styleUrls: ['./game-selection.component.scss'],
})
export class GameSelectionComponent implements OnInit, OnDestroy {
    private gameList: Game[] = [];
    private subscriptionGame: Subscription = new Subscription();
    private subscriptionToArrowDisabler: Subscription = new Subscription();
    private disableArrow: boolean[];
    constructor(private gameSelectorService: GameSelectorService) {}

    get games(): Game[] {
        return this.gameList;
    }

    get arrowToDisable(): boolean[] {
        return this.disableArrow;
    }

    set games(value: Game[]) {
        this.gameList = value;
    }

    set arrowToDisable(value: boolean[]) {
        this.disableArrow = value;
    }

    ngOnInit(): void {
        this.subscriptionGame = this.gameSelectorService.gamesToDisplay.subscribe((games: Game[]) => {
            this.gameList = games;
        });

        this.subscriptionToArrowDisabler = this.gameSelectorService.disableArrow.subscribe((arrowToDisable: boolean[]) => {
            this.disableArrow = arrowToDisable;
        });

        this.gameSelectorService.fetchGames();
    }
    ngOnDestroy(): void {
        this.subscriptionGame.unsubscribe();
        this.subscriptionToArrowDisabler.unsubscribe();
    }

    arrowLeft(): void {
        this.gameSelectorService.arrowLeft();
    }

    arrowRight(): void {
        this.gameSelectorService.arrowRight();
    }
}
