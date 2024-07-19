import { Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CloseGameComponent } from '@app/components/close-game/close-game.component';
import { InfosService } from '@app/services/infos.service';
import { LobbyModes } from '@common/lobby-modes';
import { ReplayService } from '@app/services/replay.service';

@Component({
    providers: [],
    selector: 'app-infobar',
    templateUrl: './infobar.component.html',
    styleUrls: ['./infobar.component.scss'],
})
export class InfoBarComponent {
    private infosService: InfosService;
    private dialog: MatDialog;
    private replayService: ReplayService;
    constructor(injector: Injector) {
        this.infosService = injector.get<InfosService>(InfosService);
        this.replayService = injector.get<ReplayService>(ReplayService);
        this.dialog = injector.get<MatDialog>(MatDialog);
    }

    getReplayMode() {
        return this.replayService.isReplay;
    }
    getGameMode() {
        return this.infosService.getGameMode();
    }
    getDifficulty() {
        return this.infosService.getDifficulty();
    }
    getPlayerName() {
        return this.infosService.getPlayerName();
    }
    getEndGame() {
        return this.infosService.getEndGame();
    }
    abandonGame() {
        this.dialog.open(CloseGameComponent);
    }

    isClassicGame(): boolean {
        const mode = this.getGameMode();
        return mode === LobbyModes.ClassicSolo || mode === LobbyModes.ClassicDuo;
    }
}
