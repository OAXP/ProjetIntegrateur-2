import { Injectable } from '@angular/core';
import { NUMBER_OF_GAMES_TO_DISPLAY } from '@app/constants/fiche';
import { CommunicationService } from '@app/services/communication.service';
import { Game } from '@common/game';
import { BehaviorSubject } from 'rxjs';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class GameSelectorService {
    gamesToDisplay: BehaviorSubject<Game[]>;
    disableArrow: BehaviorSubject<boolean[]>;
    private games: BehaviorSubject<Game[]>;
    private startIndex: number;
    private currentNumberOfGamesToDisplay: number;

    constructor(private communicationService: CommunicationService, private socketClientService: SocketClientService) {
        this.handleSocket();
        this.gamesToDisplay = new BehaviorSubject<Game[]>([]);
        this.disableArrow = new BehaviorSubject<boolean[]>([false, false]);
        this.games = new BehaviorSubject<Game[]>([]);
        this.startIndex = 0;
        this.currentNumberOfGamesToDisplay = NUMBER_OF_GAMES_TO_DISPLAY;
    }

    fetchGames(): void {
        this.communicationService.getGames().subscribe({
            next: (games: Game[]) => {
                this.games.next(games);
                this.selectGames(this.startIndex);
            },
        });
    }

    arrowLeft(): void {
        if (this.startIndex !== 0) {
            this.startIndex -= NUMBER_OF_GAMES_TO_DISPLAY;
            this.selectGames(this.startIndex);
        }
    }

    arrowRight(): void {
        if (this.startIndex + NUMBER_OF_GAMES_TO_DISPLAY < this.games.value.length) {
            this.startIndex += NUMBER_OF_GAMES_TO_DISPLAY;
            this.selectGames(this.startIndex);
        }
    }

    selectGames(startIndex: number): void {
        const endIndex = startIndex + NUMBER_OF_GAMES_TO_DISPLAY;
        this.currentNumberOfGamesToDisplay = endIndex > this.games.value.length ? endIndex - (endIndex - this.games.value.length) : endIndex;
        this.gamesToDisplay.next(this.games.value.slice(startIndex, this.currentNumberOfGamesToDisplay));
        this.disableArrowBasedOnPosition(startIndex, endIndex);
    }

    disableArrowBasedOnPosition(startIndex: number, endIndex: number) {
        let disableLeft = false;
        let disableRight = false;
        if (!startIndex) disableLeft = true;
        if (endIndex >= this.games.value.length) disableRight = true;
        this.disableArrow.next([disableLeft, disableRight]);
    }

    updateGameAvailability = (availability: boolean, gameId: string) => {
        const gameToUpdate = this.games.value.find((game: Game) => game.id === gameId) as Game;
        gameToUpdate.available = availability;
        const newGames = this.games.value.filter((game: Game) => game.id !== gameId);
        newGames.push(gameToUpdate);
        this.games.next(newGames);
    };

    onGameRemove = (gameId: string) => {
        const newGames = this.games.value.filter((game: Game) => game.id !== gameId);
        this.games.next(newGames);
        this.selectGames(this.startIndex);
    };

    onGameStart = (gameId: string) => {
        this.updateGameAvailability(true, gameId);
    };

    unEnableGame = (gameId: string) => {
        this.updateGameAvailability(false, gameId);
    };

    handleSocket(): void {
        this.socketClientService.socket.on('game-created', this.onGameStart);
        this.socketClientService.socket.on('game-cancel', this.unEnableGame);
        this.socketClientService.socket.on('game-started', this.unEnableGame);
        this.socketClientService.socket.on('game-delete', this.onGameRemove);
    }
}
