import { Component, OnInit } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameHandlerService } from '@app/services/game-handler.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    constructor(private socketClientService: SocketClientService, private gameHandlerService: GameHandlerService) {}

    ngOnInit() {
        this.socketClientService.connect().then(() => {
            this.gameHandlerService.handleSocket();
        });
    }
}
