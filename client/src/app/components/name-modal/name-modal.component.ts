import { Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { WaitingRoomFirstPlayerComponent } from '@app/components/waiting-room-first-player/waiting-room-first-player.component';
import { WaitingRoomSecondPlayerComponent } from '@app/components/waiting-room-second-player/waiting-room-second-player.component';
import { GameCreatorService } from '@app/services/game-creator.service';
import { InfosService } from '@app/services/infos.service';
import { MessagesService } from '@app/services/messages.service';
import { LobbyModes } from '@common/lobby-modes';
import { ReplayService } from '@app/services/replay.service';

@Component({
    selector: 'app-name-modal',
    templateUrl: './name-modal.component.html',
    styleUrls: ['./name-modal.component.scss'],
})
export class NameModalComponent {
    private playerName: string;
    private infosService: InfosService;
    private matDialog: MatDialog;
    private router: Router;
    private gameCreatorService: GameCreatorService;
    private messagesService: MessagesService;
    private replayService: ReplayService;
    constructor(injector: Injector) {
        this.infosService = injector.get<InfosService>(InfosService);
        this.matDialog = injector.get<MatDialog>(MatDialog);
        this.router = injector.get<Router>(Router);
        this.gameCreatorService = injector.get<GameCreatorService>(GameCreatorService);
        this.messagesService = injector.get<MessagesService>(MessagesService);
        this.replayService = injector.get<ReplayService>(ReplayService);
    }

    get name(): string {
        return this.playerName;
    }

    set name(value: string) {
        this.playerName = value;
    }

    play(): void {
        this.infosService.setPlayerName(this.playerName);
        this.matDialog.closeAll();
        if (this.infosService.getGameMode() === LobbyModes.ClassicSolo) {
            this.messagesService.resetMessages();
            this.gameCreatorService.createGame(LobbyModes.ClassicSolo);
            this.router.navigate(['/game']);
            this.replayService.startReplayTime();
        } else {
            this.openWaitingRoom();
        }
    }

    verifyPlayerName() {
        if (!this.playerName || !this.playerName.trim().length) {
            window.alert("Vous n'avez pas entré de nom");
        } else {
            this.play();
        }
    }

    openWaitingRoom(): void {
        if (this.infosService.getGame().available || this.infosService.getGameMode() === LobbyModes.DuoJoin) {
            this.gameCreatorService.joinGame(this.playerName);
            this.matDialog.open(WaitingRoomSecondPlayerComponent, { autoFocus: false, disableClose: true });
        } else {
            this.gameCreatorService.createGame(LobbyModes.ClassicDuo);
            this.matDialog.open(WaitingRoomFirstPlayerComponent, { autoFocus: false, disableClose: true });
        }
    }
}
