import { TestBed } from '@angular/core/testing';
import { MessagesService } from '@app/services/messages.service';
import { ReplayService } from '@app/services/replay.service';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { SocketClientService } from './socket-client.service';
import SpyObj = jasmine.SpyObj;

describe('MessagesService', () => {
    let service: MessagesService;
    let socketClientServiceSpy: SpyObj<SocketClientService>;
    let replayService: SpyObj<ReplayService>;

    beforeEach(() => {
        socketClientServiceSpy = jasmine.createSpyObj('SocketClientService', ['send', 'on']);
        replayService = jasmine.createSpyObj('ReplayService', ['recordPostMessage']);
        TestBed.configureTestingModule({
            providers: [
                { provide: SocketClientService, useValue: socketClientServiceSpy },
                { provide: ReplayService, useValue: replayService },
            ],
        });
        service = TestBed.inject(MessagesService);
        service['socketClientService'].socket = io(environment.serverBaseUrl, { transports: ['websocket'] });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getIsTyping should return isTyping', () => {
        service.setIsTyping(true);
        expect(service.getIsTyping()).toEqual(true);
    });

    it('setIsTyping should modify the value of isTyping', () => {
        service.setIsTyping(false);
        expect(service.getIsTyping()).toEqual(false);
        service.setIsTyping(true);
        expect(service.getIsTyping()).toEqual(true);
    });

    it('resetMessages should reset array', () => {
        service['messages'] = [{ title: 'event', body: 'message', date: Date.now() }];
        service.resetMessages();
        expect(service.getMessages()).toEqual([]);
    });

    it('sendMessage should call socketClientService.send-message', () => {
        const currentDate = Date.now();
        service.sendMessage({ title: 'event', body: 'message', date: currentDate });
        expect(socketClientServiceSpy.send).toHaveBeenCalledWith('send-message', service['socketClientService']['currentGameRoomId'], {
            title: 'event',
            body: 'message',
            date: currentDate,
        });
    });

    it('handleMessageReceive should call socketClientService.socket.on', () => {
        const spy = spyOn(service['socketClientService'].socket, 'on');
        service.handleMessageReceive();
        expect(spy).toHaveBeenCalledWith('send-message', service.onMessageReceive);
    });

    it('onMessageReceive should add message to messages array', () => {
        const currentDate = Date.now();
        const message = { title: 'event', body: 'message', date: currentDate };
        service.onMessageReceive(message);
        expect(service.getMessages()[0]).toEqual(message);
    });

    it('should call sendNewRecord and send the event', () => {
        const currentDate = Date.now();
        service.sendNewRecord({ title: 'event', body: 'message', date: currentDate });
        expect(socketClientServiceSpy.send).toHaveBeenCalledWith('new-record', {
            title: 'event',
            body: 'message',
            date: currentDate,
        });
    });
});
