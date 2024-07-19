import { Injectable, Injector } from '@angular/core';
import { ReplayService } from '@app/services/replay.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Message } from '@common/message';

@Injectable({
    providedIn: 'root',
})
export class MessagesService {
    private messages: Message[];
    private isTyping: boolean;
    private socketClientService: SocketClientService;
    private replayService: ReplayService;
    constructor(injector: Injector) {
        this.socketClientService = injector.get<SocketClientService>(SocketClientService);
        this.replayService = injector.get<ReplayService>(ReplayService);
        this.messages = [];
        this.isTyping = false;
    }

    getMessages() {
        return this.messages;
    }
    resetMessages() {
        this.messages = [];
    }
    sendMessage(message: Message) {
        this.socketClientService.send('send-message', this.socketClientService.currentGameRoomId, message);
    }

    sendNewRecord(message: Message) {
        this.socketClientService.send('new-record', message);
    }

    getIsTyping(): boolean {
        return this.isTyping;
    }

    setIsTyping(isTyping: boolean): void {
        this.isTyping = isTyping;
    }

    handleMessageReceive() {
        this.socketClientService.socket.on('send-message', this.onMessageReceive);
    }

    onMessageReceive = (message: Message) => {
        this.replayService.recordPostMessage(message);
        this.messages.unshift(message);
    };
}
