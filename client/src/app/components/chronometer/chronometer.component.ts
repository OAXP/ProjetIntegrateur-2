import { Component, Injector } from '@angular/core';
import { SECONDS_PER_MINUTE } from '@app/constants/consts';
import { GameHandlerService } from '@app/services/game-handler.service';
import { InfosService } from '@app/services/infos.service';

@Component({
    selector: 'app-chronometer',
    templateUrl: './chronometer.component.html',
    styleUrls: ['./chronometer.component.scss'],
})
export class ChronometerComponent {
    private minutes: number;
    private seconds: number;
    private gameHandlerService: GameHandlerService;
    private infosService: InfosService;
    constructor(injector: Injector) {
        this.gameHandlerService = injector.get<GameHandlerService>(GameHandlerService);
        this.infosService = injector.get<InfosService>(InfosService);
        this.minutes = 0;
        this.seconds = 0;
        this.gameHandlerService.clock.subscribe(this.increaseTime);
    }
    get minute(): number {
        return this.minutes;
    }

    get second(): number {
        return this.seconds;
    }

    set minute(value: number) {
        this.minutes = value;
    }

    set second(value: number) {
        this.seconds = value;
    }
    increaseTime = (timer: number) => {
        timer = timer < 0 ? 0 : timer;
        this.minutes = Math.floor(timer / SECONDS_PER_MINUTE);
        this.seconds = timer % SECONDS_PER_MINUTE;
        this.infosService.setEndTime(this.minutes, this.seconds);
    };
}
