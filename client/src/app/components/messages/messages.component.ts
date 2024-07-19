import { Component, Injector } from '@angular/core';
import { InfosService } from '@app/services/infos.service';
import { MessagesService } from '@app/services/messages.service';
import { ReplayService } from '@app/services/replay.service';

@Component({
    selector: 'app-messages',
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent {
    private infosService: InfosService;
    private messagesService: MessagesService;
    private replayService: ReplayService;

    constructor(injector: Injector) {
        this.infosService = injector.get<InfosService>(InfosService);
        this.messagesService = injector.get<MessagesService>(MessagesService);
        this.replayService = injector.get<ReplayService>(ReplayService);
    }
    getSecondPlayerName() {
        return this.infosService.getSecondPlayerName();
    }
    getPlayerName() {
        return this.infosService.getPlayerName();
    }
    getMessages() {
        if (this.replayService.isReplay) return this.replayService.allMessages;
        return this.messagesService.getMessages();
    }
}
