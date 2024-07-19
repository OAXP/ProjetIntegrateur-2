import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GameCreatorService } from '@app/services/game-creator.service';
import { InfosService } from '@app/services/infos.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-waiting-room-second-player',
    templateUrl: './waiting-room-second-player.component.html',
    styleUrls: ['./waiting-room-second-player.component.scss'],
})
export class WaitingRoomSecondPlayerComponent implements OnInit, OnDestroy {
    private rejected: boolean;
    private subscription: Subscription;
    private matDialog: MatDialog;
    private gameCreatorService: GameCreatorService;
    private infosService: InfosService;
    private socketClientService: SocketClientService;
    private snackbar: MatSnackBar;
    constructor(injector: Injector) {
        this.rejected = false;
        this.matDialog = injector.get<MatDialog>(MatDialog);
        this.gameCreatorService = injector.get<GameCreatorService>(GameCreatorService);
        this.infosService = injector.get<InfosService>(InfosService);
        this.socketClientService = injector.get<SocketClientService>(SocketClientService);
        this.snackbar = injector.get<MatSnackBar>(MatSnackBar);
    }

    get wasRejected(): boolean {
        return this.rejected;
    }

    ngOnInit(): void {
        this.subscription = this.gameCreatorService.firstPlayerSubject.asObservable().subscribe(this.onRejection);
        this.socketClientService.socket.on('game-delete', this.onGameDeletion);
    }

    onRejection = () => {
        this.rejected = true;
    };

    onGameDeletion = (gameId: string) => {
        if (this.infosService.getGame().id === gameId) {
            this.matDialog.closeAll();
            this.snackbar.open('Le jeu a été supprimé.', 'Fermer', { duration: 2000 });
        }
    };

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.socketClientService.socket.removeListener('game-delete');
    }

    cancel(): void {
        this.gameCreatorService.cancelRequest();
        this.matDialog.closeAll();
    }
}
