import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GameCreatorService } from '@app/services/game-creator.service';
import { InfosService } from '@app/services/infos.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-waiting-room-first-player',
    templateUrl: './waiting-room-first-player.component.html',
    styleUrls: ['./waiting-room-first-player.component.scss'],
})
export class WaitingRoomFirstPlayerComponent implements OnInit, OnDestroy {
    private secondPlayerName: string;
    private subscription: Subscription;
    private gameCreatorService: GameCreatorService;
    private socketClientService: SocketClientService;
    private matDialog: MatDialog;
    private infosService: InfosService;
    private snackbar: MatSnackBar;
    constructor(injector: Injector) {
        this.gameCreatorService = injector.get<GameCreatorService>(GameCreatorService);
        this.socketClientService = injector.get<SocketClientService>(SocketClientService);
        this.matDialog = injector.get<MatDialog>(MatDialog);
        this.infosService = injector.get<InfosService>(InfosService);
        this.snackbar = injector.get<MatSnackBar>(MatSnackBar);
        this.secondPlayerName = '';
    }

    get secondUserName(): string {
        return this.secondPlayerName;
    }

    ngOnInit(): void {
        this.subscription = this.gameCreatorService.secondPlayerNameSubject.asObservable().subscribe(this.onNameAssignation);
        this.socketClientService.socket.on('game-delete', this.onGameDeletion);
    }
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.socketClientService.socket.removeListener('game-delete');
    }

    cancel(): void {
        this.gameCreatorService.cancelGameCreation();
    }

    acceptPlayer(): void {
        this.gameCreatorService.acceptSecondPlayer();
    }

    rejectPlayer(): void {
        this.gameCreatorService.rejectSecondPlayer();
    }

    onNameAssignation = (playerName: string) => {
        this.secondPlayerName = playerName;
    };

    onGameDeletion = (gameId: string) => {
        if (this.infosService.getGame().id === gameId) {
            this.matDialog.closeAll();
            this.snackbar.open('Le jeu a été supprimé.', 'Fermer', { duration: 2000 });
        }
    };
}
