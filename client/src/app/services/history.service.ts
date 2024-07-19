import { Injectable } from '@angular/core';
import { GameStats } from '@common/game-stats';
import { BehaviorSubject } from 'rxjs';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class HistoryService {
    gamesStats: BehaviorSubject<GameStats[]>;

    constructor(private socketClientService: SocketClientService) {
        this.gamesStats = new BehaviorSubject<GameStats[]>([]);
        this.handleSockets();
        this.socketClientService.send('get-history');
    }

    onNewHistory = (history: GameStats[]) => {
        this.gamesStats.next([...this.gamesStats.value, ...history]);
    };

    reset(): void {
        this.socketClientService.send('reset-history');
    }

    onResetHistory = () => {
        this.gamesStats.next([]);
    };

    handleSockets(): void {
        this.socketClientService.socket.on('new-history-available', this.onNewHistory);
        this.socketClientService.socket.on('reset-history', this.onResetHistory);
    }
}
