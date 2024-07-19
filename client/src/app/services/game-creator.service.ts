import { Injectable, Injector } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EndGameModalComponent } from '@app/components/end-game-modal/end-game-modal.component';
import { EndLimitedModalComponent } from '@app/components/end-limited-modal/end-limited-modal.component';
import { InvalidGameInformationComponent } from '@app/components/invalid-game-information/invalid-game-information.component';
import { InfosService } from '@app/services/infos.service';
import { MessagesService } from '@app/services/messages.service';
import { ReplayService } from '@app/services/replay.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimerService } from '@app/services/timer.service';
import { LobbyModes } from '@common/lobby-modes';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameCreatorService {
    private secondPlayerName: Subject<string>;
    private firstPlayerRespond: Subject<undefined>;
    private stopCheatBlink: () => void;
    private modalDialog: MatDialogRef<EndGameModalComponent> | MatDialogRef<EndLimitedModalComponent> | undefined;
    private socketClientService: SocketClientService;
    private infosService: InfosService;
    private matDialog: MatDialog;
    private messagesService: MessagesService;
    private replayService: ReplayService;
    private timerService: TimerService;

    constructor(injector: Injector) {
        this.socketClientService = injector.get<SocketClientService>(SocketClientService);
        this.infosService = injector.get<InfosService>(InfosService);
        this.matDialog = injector.get<MatDialog>(MatDialog);
        this.messagesService = injector.get<MessagesService>(MessagesService);
        this.replayService = injector.get<ReplayService>(ReplayService);
        this.timerService = injector.get<TimerService>(TimerService);
        this.secondPlayerName = new Subject<string>();
        this.firstPlayerRespond = new Subject<undefined>();
        this.handleSockets();
    }

    get firstPlayerSubject(): Subject<undefined> {
        return this.firstPlayerRespond;
    }

    get secondPlayerNameSubject(): Subject<string> {
        return this.secondPlayerName;
    }

    set stopCheatBlinkFunc(value: () => void) {
        this.stopCheatBlink = value;
    }

    createGame(gameMode: LobbyModes) {
        this.replayService.hintPenalty = this.timerService.gameConstants.value.penaltyTime;
        if (gameMode === LobbyModes.LimitedSolo || gameMode === LobbyModes.LimitedDuo) {
            this.socketClientService.send('create-game-room', '', gameMode, this.infosService.getPlayerName());
        } else {
            this.socketClientService.send('create-game-room', this.infosService.getGame().id, gameMode, this.infosService.getPlayerName());
        }
        this.socketClientService.socket.once('send-game-room-id', (roomId: string) => {
            this.socketClientService.currentGameRoomId = roomId;
        });
    }

    joinGame(playerName: string): void {
        this.socketClientService.send('request-joining-game', [this.infosService.getGame().id, playerName]);
    }

    acceptSecondPlayer(): void {
        this.socketClientService.send('second-player-accepted', this.infosService.getGame().id);
    }

    rejectSecondPlayer(): void {
        this.socketClientService.send('reject-second-player', this.infosService.getGame().id);
        this.secondPlayerName.next('');
    }

    cancelGameCreation(): void {
        this.socketClientService.send('cancel-game-creation', this.infosService.getGame().id);
    }

    cancelRequest(): void {
        this.socketClientService.send('cancel-game-request', this.infosService.getGame().id);
    }

    closeGame = (wasAbandoned: boolean, wasAbandonedbySecondPlayer?: boolean, winner?: string) => {
        if (wasAbandoned) {
            this.infosService.wasAbandoned = wasAbandoned;
            this.messagesService.sendMessage({
                title: 'event',
                body: this.infosService.getPlayerName() + ' a abandonné la partie',
                date: Date.now(),
            });
        }
        this.replayService.recordEnd();
        this.socketClientService.send('close-game-room', this.socketClientService.currentGameRoomId, wasAbandoned);
        this.setGameHistory(wasAbandoned, wasAbandonedbySecondPlayer, winner);
    };

    setGameHistory(wasAbandoned: boolean, wasAbandonedbySecondPlayer?: boolean, winner?: string): void {
        const gameStats = this.infosService.getGameStats();
        if (gameStats && (this.infosService.getPlayerName() === gameStats.firstPlayerName || wasAbandonedbySecondPlayer)) {
            if (wasAbandoned) gameStats.quitter = this.infosService.getPlayerName();
            else if (wasAbandonedbySecondPlayer) gameStats.quitter = this.infosService.getSecondPlayerName();
            gameStats.duration = Date.now() - gameStats.startTime;
            gameStats.winnerPlayerName = winner ?? '';
            this.infosService.setGameParams(gameStats);
            const currentGame = this.infosService.getGame();
            if (!currentGame.isOver) {
                this.socketClientService.send('new-history', this.infosService.getGameStats());
                currentGame.isOver = true;
            }
        }
    }

    closeLimitedGame = (hasWon: boolean) => {
        this.modalDialog = this.matDialog.open(EndLimitedModalComponent);
        (this.modalDialog.componentInstance as EndLimitedModalComponent).hasWon = hasWon;
        this.infosService.setEndGame(true);
        this.closeGame(false);
        this.stopCheatBlink();
        this.socketClientService.socket.emit('end-coop-game', this.socketClientService.currentGameRoomId);
        this.socketClientService.currentGameRoomId = '';
    };

    endMultiplayerGame = (socketId?: string, winner?: string, wasAbandonedbySecondPlayer?: boolean) => {
        this.infosService.winner = winner ?? this.infosService.getPlayerName();
        this.infosService.modifyLeaderboard(socketId);
        this.modalDialog = this.matDialog.open(EndGameModalComponent);
        (this.modalDialog.componentInstance as EndGameModalComponent).winner = winner ?? this.infosService.winner;
        this.closeGame(false, wasAbandonedbySecondPlayer, winner);
        this.infosService.setEndGame(true);
        this.stopCheatBlink();
    };

    handleSockets() {
        this.socketClientService.socket.on('player-request', this.onSecondPlayerNameAssignation);
        this.socketClientService.socket.on('second-player-rejected', this.onFirstPlayerRespondAssignation);
        this.socketClientService.socket.on('request-canceled', this.onSecondPlayerNameAssignationEmpty);
        this.socketClientService.socket.on('alert-game-no-longer-exist', this.onAlertGameDoesntExist);
        this.socketClientService.socket.on('send-names', this.onSendNames);
        this.socketClientService.socket.on('end-multiplayer-game', this.endMultiplayerGame);
        this.socketClientService.socket.on('close-game', this.closeGame);
        this.socketClientService.socket.on('close-limited-game', this.closeLimitedGame);
        this.socketClientService.socket.on('coop-left', this.onCoopLeft);
    }

    onCoopLeft = () => {
        this.infosService.setGameMode(LobbyModes.LimitedSolo);
        this.setGameHistory(false, true);
    };

    onSendRoomIdOfGame = (roomId: string) => {
        this.socketClientService.currentGameRoomId = roomId;
    };

    onSecondPlayerNameAssignation = (playerName: string) => {
        this.secondPlayerName.next(playerName);
    };

    onFirstPlayerRespondAssignation = () => {
        this.firstPlayerRespond.next(undefined);
    };

    onSecondPlayerNameAssignationEmpty = () => {
        this.secondPlayerName.next('');
    };

    onAlertGameDoesntExist = (roomId: string) => {
        if (this.socketClientService.socket.id !== roomId) {
            this.matDialog.closeAll();
            this.matDialog.open(InvalidGameInformationComponent, { autoFocus: false, disableClose: true });
        }
    };

    onSendNames = (firstPlayer: string, secondPlayer: string) => {
        if (this.infosService.getPlayerName() === firstPlayer) {
            this.infosService.setSecondPlayerName(secondPlayer);
        } else {
            this.infosService.setSecondPlayerName(firstPlayer);
        }
    };
}
