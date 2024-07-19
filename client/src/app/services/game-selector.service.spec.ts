import { TestBed } from '@angular/core/testing';
import { NUMBER_OF_GAMES_TO_DISPLAY } from '@app/constants/fiche';
import { gameMock1, gamesMock1, gamesMock2 } from '@app/constants/mock';
import { Game } from '@common/game';
import { BehaviorSubject } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { CommunicationService } from './communication.service';
import { GameSelectorService } from './game-selector.service';
import { SocketClientService } from './socket-client.service';

import SpyObj = jasmine.SpyObj;

describe('GameSelectorService', () => {
    let communicationServiceSpy: SpyObj<CommunicationService>;
    let service: GameSelectorService;
    let clientSocketService: SocketClientService;

    beforeEach(() => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getGames']);
        communicationServiceSpy.getGames.and.returnValue(new BehaviorSubject<Game[]>(gamesMock1));
        clientSocketService = new SocketClientService();
        clientSocketService.socket = io(environment.serverBaseUrl, { transports: ['websocket'] });
        TestBed.configureTestingModule({
            providers: [
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: SocketClientService, useValue: clientSocketService },
            ],
        });
        service = TestBed.inject(GameSelectorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should assign the received games', () => {
        service.fetchGames();
        expect(service['games'].value).toEqual(gamesMock1);
    });

    it('should call selectFiche with appropriate startIndex', () => {
        const spy = spyOn(service, 'selectGames');
        service['startIndex'] = 1;

        service.arrowLeft();
        expect(spy).toHaveBeenCalledOnceWith(1 - NUMBER_OF_GAMES_TO_DISPLAY);
    });

    it('should call selectFiche with appropriate startIndex', () => {
        const spy = spyOn(service, 'selectGames');
        service['startIndex'] = 0;

        service['games'].next(gamesMock2);
        service.arrowRight();

        expect(spy).toHaveBeenCalledWith(NUMBER_OF_GAMES_TO_DISPLAY);
    });

    it('should pass the first two games', () => {
        const spy = spyOn(service, 'disableArrowBasedOnPosition');

        service.fetchGames();
        service.selectGames(0);

        expect(service.gamesToDisplay.value).toEqual(gamesMock1);
        expect(spy).toHaveBeenCalledWith(0, NUMBER_OF_GAMES_TO_DISPLAY);
    });

    it('should pass the next four games', () => {
        const spy = spyOn(service, 'disableArrowBasedOnPosition');

        service['games'].next(gamesMock2);
        service.selectGames(NUMBER_OF_GAMES_TO_DISPLAY);

        expect(service.gamesToDisplay.value).toEqual(gamesMock2.slice(NUMBER_OF_GAMES_TO_DISPLAY, 2 * NUMBER_OF_GAMES_TO_DISPLAY));
        expect(spy).toHaveBeenCalledWith(NUMBER_OF_GAMES_TO_DISPLAY, 2 * NUMBER_OF_GAMES_TO_DISPLAY);
    });

    it('should disabled both button', () => {
        service.fetchGames();
        service.disableArrowBasedOnPosition(0, NUMBER_OF_GAMES_TO_DISPLAY);
        expect(service.disableArrow.value).toEqual([true, true]);
    });

    it('should disabled left button', () => {
        service['games'].next(gamesMock2);
        service.disableArrowBasedOnPosition(0, NUMBER_OF_GAMES_TO_DISPLAY);
        expect(service.disableArrow.value).toEqual([true, false]);
    });

    it('should disabled right button', () => {
        service['games'].next(gamesMock2);
        service.disableArrowBasedOnPosition(NUMBER_OF_GAMES_TO_DISPLAY, 2 * NUMBER_OF_GAMES_TO_DISPLAY);
        expect(service.disableArrow.value).toEqual([false, true]);
    });

    it('should not disabled button', () => {
        service['games'].next(gamesMock2);
        service.disableArrowBasedOnPosition(NUMBER_OF_GAMES_TO_DISPLAY - 1, 2 * NUMBER_OF_GAMES_TO_DISPLAY - 1);
        expect(service.disableArrow.value).toEqual([false, false]);
    });

    it('removeGame', () => {
        service['games'].next(gamesMock1);
        const previousLength: number = service['games'].value.length;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        service.onGameRemove(gameMock1.id!);
        expect(service['games'].value.length).toEqual(previousLength - 1);
    });

    it('should update the game availability', () => {
        service.fetchGames();
        service.updateGameAvailability(true, '1');
        service.selectGames(1);
        expect(service.gamesToDisplay.value[0].available).toEqual(true);
    });

    it('should call selectGames', () => {
        const selectGamesSpy = spyOn(service, 'selectGames');
        service.fetchGames();
        service.onGameRemove('1');
        expect(selectGamesSpy).toHaveBeenCalled();
    });

    it('should call updateGameAvailability with true and gameId', () => {
        const updateGameAvailabilitySpy = spyOn(service, 'updateGameAvailability');
        service.onGameStart('1');
        expect(updateGameAvailabilitySpy).toHaveBeenCalledOnceWith(true, '1');
    });

    it('should call updateGameAvailability with false and gameId', () => {
        const updateGameAvailabilitySpy = spyOn(service, 'updateGameAvailability');
        service.unEnableGame('1');
        expect(updateGameAvailabilitySpy).toHaveBeenCalledOnceWith(false, '1');
    });
});
