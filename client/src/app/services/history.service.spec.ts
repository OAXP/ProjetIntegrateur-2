import { TestBed } from '@angular/core/testing';

import { gameStatsMock } from '@app/constants/mock';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { HistoryService } from './history.service';
import { SocketClientService } from './socket-client.service';

describe('HistoryService', () => {
    let service: HistoryService;
    let clientSocketService: SocketClientService;

    beforeEach(() => {
        clientSocketService = new SocketClientService();
        clientSocketService.socket = io(environment.serverBaseUrl, { transports: ['websocket'] });
        TestBed.configureTestingModule({
            providers: [{ provide: SocketClientService, useValue: clientSocketService }],
        });
        service = TestBed.inject(HistoryService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should send resed-history', () => {
        spyOn(clientSocketService, 'send');
        service.reset();
        expect(clientSocketService.send).toHaveBeenCalledOnceWith('reset-history');
    });

    it('should pass received gameStats', () => {
        service.onNewHistory(gameStatsMock);
        expect(service.gamesStats.value).toEqual(gameStatsMock);
    });

    it('should empty gameStats', () => {
        service.onResetHistory();
        expect(service.gamesStats.value).toEqual([]);
    });
});
