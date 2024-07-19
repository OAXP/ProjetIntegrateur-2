import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SocketClientService } from '@app/services/socket-client.service';
import { InfosService } from '@app/services/infos.service';
import { Game } from '@common/game';

@Component({
    selector: 'app-waiting-coop-modal',
    templateUrl: './waiting-coop-modal.component.html',
    styleUrls: ['./waiting-coop-modal.component.scss'],
})
export class WaitingCoopModalComponent implements OnInit, OnDestroy {
    private dialogRef: MatDialogRef<WaitingCoopModalComponent>;
    private socketClientService: SocketClientService;
    private infosService: InfosService;
    constructor(injector: Injector) {
        this.dialogRef = injector.get<MatDialogRef<WaitingCoopModalComponent>>(MatDialogRef<WaitingCoopModalComponent>);
        this.socketClientService = injector.get<SocketClientService>(SocketClientService);
        this.infosService = injector.get<InfosService>(InfosService);
    }

    ngOnInit() {
        this.socketClientService.socket.emit('request-coop', this.infosService.getPlayerName());
        this.socketClientService.socket.once('game-found-coop', this.onGameFoundCoop);
        this.socketClientService.socket.once('send-game-room-id', this.onGameRoomId);
    }

    ngOnDestroy() {
        this.socketClientService.socket.removeListener('game-found-coop');
        this.socketClientService.socket.removeListener('send-game-room-id');
    }

    onGameFoundCoop = (game: Game) => {
        this.infosService.setGame(game);
        this.dialogRef.close();
    };

    onGameRoomId = (gameRoomId: string) => {
        this.socketClientService.currentGameRoomId = gameRoomId;
    };

    cancel() {
        this.socketClientService.socket.emit('remove-coop');
        this.dialogRef.close();
    }
}
