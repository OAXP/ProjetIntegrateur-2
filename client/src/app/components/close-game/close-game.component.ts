import { Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { GameCreatorService } from '@app/services/game-creator.service';
import { InfosService } from '@app/services/infos.service';
import { ReplayService } from '@app/services/replay.service';

@Component({
    selector: 'app-close-game',
    templateUrl: './close-game.component.html',
    styleUrls: ['./close-game.component.scss'],
})
export class CloseGameComponent {
    private infosService: InfosService;
    private router: Router;
    private dialog: MatDialog;
    private gameCreatorService: GameCreatorService;
    private replayService: ReplayService;
    constructor(injector: Injector) {
        this.infosService = injector.get<InfosService>(InfosService);
        this.router = injector.get<Router>(Router);
        this.dialog = injector.get<MatDialog>(MatDialog);
        this.gameCreatorService = injector.get<GameCreatorService>(GameCreatorService);
        this.replayService = injector.get<ReplayService>(ReplayService);
    }
    get gameStatus() {
        return this.infosService.getEndGame();
    }

    set gameStatus(value: boolean) {
        this.infosService.setEndGame(value);
    }

    close() {
        this.dialog.closeAll();
    }

    exitGame() {
        this.dialog.closeAll();
        this.infosService.setEndGame(true);
        this.gameCreatorService.closeGame(true);
        this.replayService.reset();
        this.router.navigate(['/home']);
    }
}
