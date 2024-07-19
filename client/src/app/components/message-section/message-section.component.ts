import { Component, ElementRef, Injector, ViewChild } from '@angular/core';
import { InfosService } from '@app/services/infos.service';
import { MessagesService } from '@app/services/messages.service';

@Component({
    selector: 'app-message-section',
    templateUrl: './message-section.component.html',
    styleUrls: ['./message-section.component.scss'],
})
export class MessageSectionComponent {
    @ViewChild('inputText') private inputText: ElementRef;
    private text: string;
    private infosService: InfosService;
    private messagesService: MessagesService;
    constructor(injector: Injector) {
        this.infosService = injector.get<InfosService>(InfosService);
        this.messagesService = injector.get<MessagesService>(MessagesService);
    }
    set input(value: string) {
        this.text = value;
    }

    setIsTyping(isTyping: boolean): void {
        this.messagesService.setIsTyping(isTyping);
    }

    getGameMode() {
        return this.infosService.getGameMode();
    }

    getEndGame() {
        return this.infosService.getEndGame();
    }
    isDuoMode() {
        return this.getGameMode() === 'Duo' || this.getGameMode() === 'Duo Limité';
    }

    sendMessage() {
        if (this.inputText.nativeElement.value.length > 0) {
            this.messagesService.sendMessage({
                title: this.infosService.getPlayerName(),
                body: this.text,
                date: Date.now(),
            });
        }
        this.inputText.nativeElement.value = '';
        this.input = '';
        this.setIsTyping(false);
    }
}
