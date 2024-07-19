/* eslint-disable @typescript-eslint/naming-convention */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MS_TO_SEC } from '@app/constants/consts';
import { HistoryService } from '@app/services/history.service';
import { GameStats } from '@common/game-stats';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-history',
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit, OnDestroy {
    private gamesStats: GameStats[];
    private subscription: Subscription;
    private resetConfirmation: boolean;
    constructor(private historyService: HistoryService, private matDialog: MatDialog) {}
    get gamesStatistics(): GameStats[] {
        return this.gamesStats;
    }

    get resettingConfirmation(): boolean {
        return this.resetConfirmation;
    }

    ngOnInit(): void {
        this.subscription = this.historyService.gamesStats.asObservable().subscribe(this.onSubscription);
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    setStyle(currentGame: GameStats, player?: string): { [klass: string]: unknown } {
        return {
            'text-decoration': currentGame.quitter === player ? 'line-through' : 'normal',
            'font-weight': currentGame.winnerPlayerName === player ? 'bold' : 'normal',
        };
    }

    onSubscription = (gameParams: GameStats[]) => {
        this.gamesStats = gameParams;
    };

    reformatDate(time: number): string {
        return new Date(time).toLocaleString('en-GB');
    }

    reformatDuration(time: number): string {
        return (time / MS_TO_SEC).toFixed(2);
    }

    resetHistory(): void {
        this.historyService.reset();
        this.toggleResetConfirmation();
    }

    toggleResetConfirmation(): void {
        this.resetConfirmation = !this.resetConfirmation;
    }

    close(): void {
        this.matDialog.closeAll();
    }
}
