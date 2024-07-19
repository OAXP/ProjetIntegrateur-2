import { Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InfosService } from '@app/services/infos.service';
import { LobbyModes } from '@common/lobby-modes';
import { GameCreatorService } from '@app/services/game-creator.service';
import { MessagesService } from '@app/services/messages.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Game } from '@common/game';
import { WaitingCoopModalComponent } from '@app/components/waiting-coop-modal/waiting-coop-modal.component';

@Component({
    selector: 'app-limited-choice-modal',
    templateUrl: './limited-choice-modal.component.html',
    styleUrls: ['./limited-choice-modal.component.scss'],
})
export class LimitedChoiceModalComponent {
    private option: string;
    private playerName: string;
    private infosService: InfosService;
    private matDialog: MatDialog;
    private router: Router;
    private snackbar: MatSnackBar;
    private gameCreatorService: GameCreatorService;
    private messagesService: MessagesService;
    private socketClientService: SocketClientService;

    constructor(injector: Injector) {
        this.infosService = injector.get<InfosService>(InfosService);
        this.matDialog = injector.get<MatDialog>(MatDialog);
        this.router = injector.get<Router>(Router);
        this.snackbar = injector.get<MatSnackBar>(MatSnackBar);
        this.gameCreatorService = injector.get<GameCreatorService>(GameCreatorService);
        this.messagesService = injector.get<MessagesService>(MessagesService);
        this.socketClientService = injector.get<SocketClientService>(SocketClientService);
        this.option = '1';
    }

    get chosenMode(): string {
        return this.option;
    }

    get name(): string {
        return this.playerName;
    }

    set chosenMode(value: string) {
        this.option = value;
    }

    set name(value: string) {
        this.playerName = value;
    }

    openSnack(message: string) {
        this.snackbar.open(message, 'Fermer', { duration: 2000 });
    }

    async soloHandler() {
        this.infosService.setGameMode(LobbyModes.LimitedSolo);
        this.messagesService.resetMessages();
        this.gameCreatorService.createGame(LobbyModes.LimitedSolo);
        this.socketClientService.socket.once('init-game-limited', this.onInitGameLimited);
    }

    onInitGameLimited = async (game: Game) => {
        this.infosService.setGame(game);
        this.matDialog.closeAll();
        await this.router.navigate(['/game']);
    };

    coopHandler() {
        // try to join or show waiting modal
        this.infosService.setGameMode(LobbyModes.LimitedDuo);
        this.matDialog.closeAll();
        this.matDialog.open(WaitingCoopModalComponent, { autoFocus: false, disableClose: true });
    }

    async confirmHandler() {
        if (!this.playerName || !this.playerName.trim().length) {
            this.openSnack('Veuillez entrer un nom.');
            return;
        }

        this.infosService.setPlayerName(this.playerName);

        if (this.option === '1') {
            await this.soloHandler();
        } else {
            this.coopHandler();
        }
    }
}
