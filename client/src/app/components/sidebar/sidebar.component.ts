import { Component, Injector } from '@angular/core';
import { InfosService } from '@app/services/infos.service';
import { ReplayService } from '@app/services/replay.service';
import { SECONDS_PER_MINUTE } from '@app/constants/consts';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SideBarComponent {
    private infosService: InfosService;
    private replayService: ReplayService;
    constructor(injector: Injector) {
        this.infosService = injector.get<InfosService>(InfosService);
        this.replayService = injector.get<ReplayService>(ReplayService);
    }

    get isReplay() {
        return this.replayService.isReplay;
    }
    get second() {
        return this.replayService.clock % SECONDS_PER_MINUTE;
    }

    get minute() {
        return Math.floor(this.replayService.clock / SECONDS_PER_MINUTE);
    }

    getDifferences() {
        return this.infosService.getPlayerDifferencesFound();
    }
    getGameDifferences() {
        return this.infosService.getGameDifferences();
    }
    getTotalDifferencesFound() {
        return this.infosService.getTotalDifferencesFound();
    }
    getGameMode() {
        return this.infosService.getGameMode();
    }
    getSecondPlayerName() {
        return this.infosService.getSecondPlayerName();
    }
}
