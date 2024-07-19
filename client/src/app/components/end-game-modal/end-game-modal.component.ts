import { Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { GameCreatorService } from '@app/services/game-creator.service';
import { InfosService } from '@app/services/infos.service';
import { ReplayService } from '@app/services/replay.service';

@Component({
    selector: 'app-end-game-modal',
    templateUrl: './end-game-modal.component.html',
    styleUrls: ['./end-game-modal.component.scss'],
})
export class EndGameModalComponent {
    private router: Router;
    private dialog: MatDialog;
    private infosService: InfosService;
    private gameCreatorService: GameCreatorService;
    private replayService: ReplayService;

    constructor(injector: Injector) {
        this.router = injector.get<Router>(Router);
        this.dialog = injector.get<MatDialog>(MatDialog);
        this.infosService = injector.get<InfosService>(InfosService);
        this.gameCreatorService = injector.get<GameCreatorService>(GameCreatorService);
        this.replayService = injector.get<ReplayService>(ReplayService);
    }
    get playerName() {
        return this.infosService.getPlayerName();
    }
    get winner() {
        return this.infosService.getWinner();
    }

    get won() {
        return this.infosService.wonTheGame;
    }
    set winner(value: string) {
        this.infosService.setWinner(value);
    }
    closeGame() {
        this.dialog.closeAll();
        this.router.navigate(['/home']);
        this.gameCreatorService.closeGame(false);
    }

    replayGame() {
        this.dialog.closeAll();
        this.replayService.isReplay = true;
    }
}
