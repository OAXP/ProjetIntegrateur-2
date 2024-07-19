import { Injectable, Injector, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EndGameModalComponent } from '@app/components/end-game-modal/end-game-modal.component';
import { LeaderboardService } from '@app/services/leaderboard.service';
import { Game } from '@common/game';
import { GameStats } from '@common/game-stats';
import { LobbyModes } from '@common/lobby-modes';
import { Score } from '@common/score';
import { MessagesService } from './messages.service';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class InfosService {
    @Input() winner: string;
    @Input() wasAbandoned: boolean;

    private gameMode: LobbyModes;
    private playerName: string;
    private secondPlayerName: string;
    private totalDifferencesFound: number;
    private playerDifferencesFound: number;
    private endGame: boolean;
    private game: Game;
    private dialog: MatDialog;
    private minutes: number;
    private seconds: number;
    private leaderboardService: LeaderboardService;
    private gameStats: GameStats;
    private socketClientService: SocketClientService;
    private isReplay: boolean;
    private won: boolean;

    constructor(private injector: Injector) {
        this.dialog = injector.get<MatDialog>(MatDialog);
        this.leaderboardService = injector.get<LeaderboardService>(LeaderboardService);
        this.socketClientService = injector.get<SocketClientService>(SocketClientService);
        this.winner = '';
        this.won = false;
        this.isReplay = false;
    }

    get wonTheGame() {
        return this.won;
    }

    set isReplayMode(value: boolean) {
        this.isReplay = value;
    }

    set setWonTheGame(value: boolean) {
        this.won = value;
    }

    setGameMode(mode: LobbyModes | string) {
        this.gameMode = mode as LobbyModes;
    }

    setGame(game: Game) {
        this.endGame = false;
        this.game = game;
        this.playerDifferencesFound = 0;
        this.totalDifferencesFound = 0;
    }
    setPlayerName(playerName: string) {
        this.playerName = playerName;
    }
    setSecondPlayerName(secondPlayerName: string) {
        this.secondPlayerName = secondPlayerName;
    }
    setEndGame(end: boolean) {
        this.endGame = end;
    }
    setPlayerDifferencesFound(playerDiff: number) {
        this.playerDifferencesFound = playerDiff;
    }

    setTotalDifferencesFound(value: number) {
        this.totalDifferencesFound = value;
    }
    setEndTime(minutes: number, seconds: number) {
        this.minutes = minutes;
        this.seconds = seconds;
    }

    setWinner(value: string) {
        this.winner = value;
    }

    getGameMode() {
        return this.gameMode;
    }
    getPlayerName() {
        return this.playerName;
    }
    getSecondPlayerName() {
        return this.secondPlayerName;
    }
    getGameDifferences() {
        return this.game.numberOfDifferences;
    }
    getTotalDifferencesFound() {
        return this.totalDifferencesFound;
    }
    getPlayerDifferencesFound() {
        return this.playerDifferencesFound;
    }
    getEndGame() {
        return this.endGame;
    }
    getGame() {
        return this.game;
    }
    getDifficulty() {
        return this.game.difficulty;
    }
    getWinner() {
        return this.winner;
    }

    increaseDifferences() {
        if (this.totalDifferencesFound < this.game.numberOfDifferences || this.isLimitedMode()) {
            this.totalDifferencesFound += 1;
        }
        this.verifyEnding();
    }

    verifyEnding() {
        if (this.playerDifferencesFound === this.game.numberOfDifferences) {
            this.endGame = true;
            if (!this.isReplay) {
                this.modifyLeaderboard();
                if (this.gameMode === LobbyModes.ClassicSolo) this.won = true;
                if (!this.isLimitedMode()) this.dialog.open(EndGameModalComponent);
            }
        }
    }

    isLimitedMode(): boolean {
        return this.gameMode === LobbyModes.LimitedSolo || this.gameMode === LobbyModes.LimitedDuo;
    }

    modifyLeaderboard(socketId?: string) {
        if (!this.wasAbandoned && (this.socketClientService.socket.id === socketId || this.gameMode === LobbyModes.ClassicSolo)) {
            this.won = true;
            this.leaderboardService.getLeaderboardById(this.getGame().id as string).subscribe({
                next: (leaderboard) => {
                    if (this.gameMode === LobbyModes.ClassicDuo) {
                        leaderboard.leaderboardDuo.every((score, index) => {
                            if ((this.minutes === score.minutes && this.seconds < score.seconds) || this.minutes < score.minutes) {
                                const newScore: Score = { player: this.winner, minutes: this.minutes, seconds: this.seconds };
                                switch (index) {
                                    case 0: {
                                        leaderboard.leaderboardDuo[index + 2] = leaderboard.leaderboardDuo[index + 1];
                                        leaderboard.leaderboardDuo[index + 1] = score;
                                        leaderboard.leaderboardDuo[index] = newScore;

                                        break;
                                    }
                                    case 1: {
                                        leaderboard.leaderboardDuo[index + 1] = score;
                                        leaderboard.leaderboardDuo[index] = newScore;

                                        break;
                                    }
                                    case 2: {
                                        leaderboard.leaderboardDuo[index] = newScore;

                                        break;
                                    }
                                }
                                this.leaderboardService.modifyLeaderboard(this.getGame().id as string, leaderboard).subscribe({
                                    next: () => {
                                        this.sendNewRecord(index);
                                    },
                                });
                                return false;
                            } else if (
                                this.minutes === score.minutes &&
                                this.seconds === score.seconds &&
                                leaderboard.leaderboardDuo[index + 1].minutes !== this.minutes &&
                                leaderboard.leaderboardDuo[index + 1].seconds !== this.seconds
                            ) {
                                const newScore: Score = { player: this.winner, minutes: this.minutes, seconds: this.seconds };
                                switch (index) {
                                    case 0: {
                                        leaderboard.leaderboardDuo[index + 2] = leaderboard.leaderboardDuo[index + 1];
                                        leaderboard.leaderboardDuo[index + 1] = newScore;

                                        break;
                                    }
                                    case 1: {
                                        leaderboard.leaderboardDuo[index + 1] = newScore;
                                        break;
                                    }
                                }
                                if (index < 2) {
                                    this.leaderboardService.modifyLeaderboard(this.getGame().id as string, leaderboard).subscribe({
                                        next: () => {
                                            this.sendNewRecord(index + 1);
                                        },
                                    });
                                }
                                return false;
                            }
                            return true;
                        });
                    } else if (this.gameMode === LobbyModes.ClassicSolo) {
                        leaderboard.leaderboardSolo.every((score, index) => {
                            if ((this.minutes === score.minutes && this.seconds < score.seconds) || this.minutes < score.minutes) {
                                const newScore: Score = { player: this.playerName, minutes: this.minutes, seconds: this.seconds };
                                switch (index) {
                                    case 0: {
                                        leaderboard.leaderboardSolo[index + 2] = leaderboard.leaderboardSolo[index + 1];
                                        leaderboard.leaderboardSolo[index + 1] = score;
                                        leaderboard.leaderboardSolo[index] = newScore;

                                        break;
                                    }
                                    case 1: {
                                        leaderboard.leaderboardSolo[index + 1] = score;
                                        leaderboard.leaderboardSolo[index] = newScore;

                                        break;
                                    }
                                    case 2: {
                                        leaderboard.leaderboardSolo[index] = newScore;

                                        break;
                                    }
                                }
                                this.leaderboardService.modifyLeaderboard(this.getGame().id as string, leaderboard).subscribe({
                                    next: () => {
                                        this.sendNewRecord(index);
                                    },
                                });
                                return false;
                            } else if (
                                this.minutes === score.minutes &&
                                this.seconds === score.seconds &&
                                leaderboard.leaderboardSolo[index + 1].minutes !== this.minutes &&
                                leaderboard.leaderboardSolo[index + 1].seconds !== this.seconds
                            ) {
                                const newScore: Score = { player: this.playerName, minutes: this.minutes, seconds: this.seconds };
                                switch (index) {
                                    case 0: {
                                        leaderboard.leaderboardSolo[index + 2] = leaderboard.leaderboardSolo[index + 1];
                                        leaderboard.leaderboardSolo[index + 1] = newScore;
                                        break;
                                    }
                                    case 1: {
                                        leaderboard.leaderboardSolo[index + 1] = newScore;
                                        break;
                                    }
                                }
                                if (index < 2) {
                                    this.leaderboardService.modifyLeaderboard(this.getGame().id as string, leaderboard).subscribe({
                                        next: () => {
                                            this.sendNewRecord(index + 1);
                                        },
                                    });
                                }
                                return false;
                            }
                            return true;
                        });
                    }
                },
            });
        } else {
            this.won = false;
        }
    }

    sendNewRecord(index: number) {
        const messageService = this.injector.get<MessagesService>(MessagesService);
        let position = '';
        position = index === 0 ? 'ère' : 'ème';
        messageService.sendNewRecord({
            title: 'record',
            body:
                this.playerName +
                ' obtient la ' +
                (index + 1) +
                '' +
                position +
                ' place dans les meilleurs temps du jeu ' +
                this.game.name +
                ' en ' +
                this.gameMode,
            date: Date.now(),
        });
    }

    setGameParams(gameParams: GameStats): void {
        this.gameStats = gameParams;
    }

    getGameStats(): GameStats {
        return this.gameStats;
    }
}
