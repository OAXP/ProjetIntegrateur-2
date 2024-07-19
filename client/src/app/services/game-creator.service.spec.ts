/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable max-lines */
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EndGameModalComponent } from '@app/components/end-game-modal/end-game-modal.component';
import { START_TIME_MOCK, gameMock1, gameStats1, gameStats2, gameStats3 } from '@app/constants/mock';
import { InfosService } from '@app/services/infos.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameMode, GameStats } from '@common/game-stats';
import { LobbyModes } from '@common/lobby-modes';
import { Subject } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { GameCreatorService } from './game-creator.service';
import SpyObj = jasmine.SpyObj;

const mockEmpty = () => {};
describe('GameCreatorService', () => {
    let service: GameCreatorService;
    let matDialogSpy: SpyObj<MatDialog>;
    let matDialogRefSpy: SpyObj<MatDialogRef<EndGameModalComponent>>;
    let clientSocketService: SocketClientService;
    let infoServiceSpy: SpyObj<InfosService>;

    beforeEach(() => {
        clientSocketService = new SocketClientService();
        clientSocketService.socket = io(environment.serverBaseUrl, { transports: ['websocket'] });
        infoServiceSpy = jasmine.createSpyObj('InfosService', [
            'getGame',
            'setGame',
            'setGameMode',
            'setEndGame',
            'setPlayerName',
            'getSecondPlayerName',
            'getPlayerName',
            'setSecondPlayerName',
            'getGameStats',
            'setGameParams',
            'modifyLeaderboard',
        ]);
        infoServiceSpy.setEndGame.and.callFake((value: boolean) => {
            infoServiceSpy['endGame'] = value;
        });
        infoServiceSpy.setSecondPlayerName.and.callFake((value: string) => {
            infoServiceSpy['secondPlayerName'] = value;
        });

        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', { componentInstance: { winner: '' } });
        matDialogSpy.open.and.returnValue(matDialogRefSpy);
        TestBed.configureTestingModule({
            providers: [
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: SocketClientService, useValue: clientSocketService },
                { provide: InfosService, useValue: infoServiceSpy },
            ],
        });
        service = TestBed.inject(GameCreatorService);
    });

    it('should create game room', () => {
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        spyOn(clientSocketService, 'send');
        clientSocketService.socket = io(environment.serverBaseUrl, { transports: ['websocket'] });
        spyOn(clientSocketService.socket, 'once').and.callFake((event, cb) => {
            cb('123');
            return clientSocketService.socket;
        });
        service.createGame(LobbyModes.ClassicSolo);
        expect(clientSocketService.send).toHaveBeenCalledWith('create-game-room', gameMock1.id, 'Solo', infoServiceSpy['playerName']);
        expect(clientSocketService.currentGameRoomId).toEqual('123');
        expect(clientSocketService.socket.once).toHaveBeenCalledWith('send-game-room-id', jasmine.any(Function));
    });

    it('should create game room limited', () => {
        spyOn(clientSocketService, 'send');
        clientSocketService.socket = io(environment.serverBaseUrl, { transports: ['websocket'] });
        spyOn(clientSocketService.socket, 'once').and.callFake((event, cb) => {
            cb('123');
            return clientSocketService.socket;
        });
        service.createGame(LobbyModes.LimitedSolo);
        expect(clientSocketService.send).toHaveBeenCalledWith('create-game-room', '', 'Solo Limité', infoServiceSpy['playerName']);
        expect(clientSocketService.currentGameRoomId).toEqual('123');
        expect(clientSocketService.socket.once).toHaveBeenCalledWith('send-game-room-id', jasmine.any(Function));
    });

    it('should call close-game event', () => {
        spyOn(clientSocketService, 'send');
        clientSocketService.currentGameRoomId = 'test';
        service.closeGame(true);
        expect(clientSocketService.send).toHaveBeenCalledWith('close-game-room', 'test', true);
    });

    it('should get firstPlayerSubject', () => {
        service['firstPlayerRespond'] = new Subject<undefined>();
        expect(service.firstPlayerSubject).toEqual(new Subject<undefined>());
    });

    it('should get secondPlayerNameSubject', () => {
        service['secondPlayerName'] = new Subject<string>();
        expect(service.secondPlayerNameSubject).toEqual(new Subject<string>());
    });

    it('should set stopCheatBlink ', () => {
        service.stopCheatBlinkFunc = mockEmpty;
        expect(service['stopCheatBlink']).toBeDefined();
    });

    it('should call joinGame', () => {
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        spyOn(clientSocketService, 'send');
        const name = 'test';
        service.joinGame(name);
        expect(clientSocketService.send).toHaveBeenCalled();
    });

    it('should call acceptSecondPlayer', () => {
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        spyOn(clientSocketService, 'send');
        service.acceptSecondPlayer();
        expect(clientSocketService.send).toHaveBeenCalledWith('second-player-accepted', '1');
    });

    it('should call rejectSecondPlayer', () => {
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        spyOn(clientSocketService, 'send');
        service.rejectSecondPlayer();
        expect(clientSocketService.send).toHaveBeenCalledWith('reject-second-player', '1');
    });

    it('should call cancelGameCreation', () => {
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        spyOn(clientSocketService, 'send');
        service.cancelGameCreation();
        expect(clientSocketService.send).toHaveBeenCalledWith('cancel-game-creation', '1');
    });

    it('should call cancelRequest', () => {
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        spyOn(clientSocketService, 'send');
        service.cancelRequest();
        expect(clientSocketService.send).toHaveBeenCalledWith('cancel-game-request', '1');
    });

    it('should call endMultiplayerGame with undefined', () => {
        const spyCloseGame = spyOn(service, 'closeGame');
        service['stopCheatBlink'] = () => {};
        service.endMultiplayerGame();
        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(spyCloseGame).toHaveBeenCalled();
        expect(infoServiceSpy['endGame']).toEqual(true);
    });

    it('should call endMultiplayerGame with a winner name', () => {
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        const name = 'Shady';
        const spyCloseGame = spyOn(service, 'closeGame');
        service['stopCheatBlink'] = () => {};
        service.endMultiplayerGame('socketid', name);
        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(matDialogRefSpy.componentInstance.winner).toEqual(name);
        expect(spyCloseGame).toHaveBeenCalled();
        expect(infoServiceSpy.modifyLeaderboard).toHaveBeenCalled();
        expect(infoServiceSpy['endGame']).toEqual(true);
    });

    it('should call onSecondPlayerNameAssignation and assign a name to secondPlayerName', () => {
        const name = 'Shady';
        const nameSubject = new Subject<string>();
        service['secondPlayerName'] = nameSubject;
        nameSubject.asObservable().subscribe((nameToTest: string) => {
            expect(nameToTest).toEqual(name);
        });
        service.onSecondPlayerNameAssignation(name);
    });

    it('should call onFirstPlayerRespondAssignation and assign undefined to firstPlayerRespond', () => {
        const nameSubject = new Subject<string>();
        // @ts-ignore
        service['firstPlayerRespond'] = nameSubject;
        nameSubject.asObservable().subscribe((nameToTest: unknown) => {
            expect(nameToTest).toEqual(undefined);
        });
        service.onFirstPlayerRespondAssignation();
    });

    it('should call onSecondPlayerNameAssignationEmpty and assign an empty string to secondPlayerName', () => {
        const nameSubject = new Subject<string>();
        service['secondPlayerName'] = nameSubject;
        nameSubject.asObservable().subscribe((nameToTest: string) => {
            expect(nameToTest).toEqual('');
        });
        service.onSecondPlayerNameAssignationEmpty();
    });

    it('should call onAlertGameDoesntExist with a roomId closeAll dialogs and open InvalidGameInformationComponent', () => {
        spyOn(clientSocketService.socket, 'on').and.callFake((event, cb) => {
            cb('123');
            return clientSocketService.socket;
        });
        service.onAlertGameDoesntExist('000');
        expect(matDialogSpy.closeAll).toHaveBeenCalled();
        expect(matDialogSpy.open).toHaveBeenCalled();
    });

    it('should call onSendNames', () => {
        const spy = spyOn(service, 'onSendNames');
        const firstPlayer = 'Shady';
        const secondPlayer = 'Louis';
        service.onSendNames(firstPlayer, secondPlayer);
        expect(spy).toHaveBeenCalledWith(firstPlayer, secondPlayer);
    });

    it('should call onSendNames and set the secondPlayerName to secondPlayer', () => {
        const firstPlayer = 'Shady';
        const secondPlayer = 'Louis';
        infoServiceSpy.getPlayerName.and.returnValue(firstPlayer);
        service.onSendNames(firstPlayer, secondPlayer);
        expect(infoServiceSpy['secondPlayerName']).toEqual(secondPlayer);
    });

    it('should call onSendNames and set the secondPlayerName to firstPlayer', () => {
        const firstPlayer = 'Shady';
        const secondPlayer = 'Louis';
        infoServiceSpy.setPlayerName.and.callThrough().withArgs('Autre');
        infoServiceSpy.setPlayerName('Autre');
        service.onSendNames(firstPlayer, secondPlayer);
        expect(infoServiceSpy['secondPlayerName']).toEqual(firstPlayer);
    });

    it('should call onSendRoomIdOfGame and set the sockets roomId', () => {
        const roomId = 'tester';
        service.onSendRoomIdOfGame(roomId);
        expect(clientSocketService.currentGameRoomId).toEqual(roomId);
    });

    it('closeLimitedGame() should call the appropriate functions', () => {
        service.stopCheatBlinkFunc = () => {};
        const emitSpy = spyOn(clientSocketService.socket, 'emit');
        const closeGameSpy = spyOn(service, 'closeGame').and.returnValue();
        service.closeLimitedGame(true);
        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(infoServiceSpy.setEndGame).toHaveBeenCalled();
        expect(closeGameSpy).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalled();
    });

    it('onCoopLeft() should call setGameMode', () => {
        service.onCoopLeft();
        expect(infoServiceSpy.setGameMode).toHaveBeenCalled();
    });

    it('should call setGameParams with the correct information and send new-history', () => {
        infoServiceSpy.getGameStats.and.returnValue(gameStats1);
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        infoServiceSpy.getPlayerName.and.returnValue('Louis');
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        spyOn(clientSocketService, 'send');
        const epochTime = 1680643620;
        spyOn(Date, 'now').and.returnValue(epochTime);
        const setGameParams: GameStats = {
            startTime: START_TIME_MOCK,
            duration: epochTime - START_TIME_MOCK,
            mode: GameMode.ClassicDuo,
            firstPlayerName: 'Louis',
            secondPlayerName: 'Yoda',
            quitter: 'Yoda',
            winnerPlayerName: '',
        };

        service.setGameHistory(false, false);
        expect(infoServiceSpy.setGameParams).toHaveBeenCalledOnceWith(setGameParams);
        expect(clientSocketService.send).toHaveBeenCalledOnceWith('new-history', gameStats1);
        gameMock1.isOver = false;
    });

    it('should call setGameParams with the correct information (winner) and send new-history', () => {
        infoServiceSpy.getGameStats.and.returnValue(gameStats2);
        infoServiceSpy.getPlayerName.and.returnValue('Louis');
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        spyOn(clientSocketService, 'send');
        const epochTime = 1680643620;
        spyOn(Date, 'now').and.returnValue(epochTime);
        const setGameParams: GameStats = {
            startTime: START_TIME_MOCK,
            duration: epochTime - START_TIME_MOCK,
            mode: GameMode.ClassicDuo,
            firstPlayerName: 'Louis',
            secondPlayerName: 'Yoda',
            winnerPlayerName: 'Louis',
        };

        service.setGameHistory(false, false, 'Louis');
        expect(infoServiceSpy.setGameParams).toHaveBeenCalledOnceWith(setGameParams);
        expect(clientSocketService.send).toHaveBeenCalledOnceWith('new-history', gameStats2);
        gameMock1.isOver = false;
    });

    it('should call setGameParams with the correct information (wasAbandoned) and send new-history', () => {
        infoServiceSpy.getGameStats.and.returnValue(gameStats3);
        infoServiceSpy.getPlayerName.and.returnValue('Louis');
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        spyOn(clientSocketService, 'send');
        const epochTime = 1680643620;
        spyOn(Date, 'now').and.returnValue(epochTime);
        const setGameParams: GameStats = {
            startTime: START_TIME_MOCK,
            duration: epochTime - START_TIME_MOCK,
            mode: GameMode.LimitedDuo,
            firstPlayerName: 'Louis',
            secondPlayerName: 'Yoda',
            quitter: 'Louis',
            winnerPlayerName: '',
        };

        service.setGameHistory(true, false);
        expect(infoServiceSpy.setGameParams).toHaveBeenCalledOnceWith(setGameParams);
        expect(clientSocketService.send).toHaveBeenCalledOnceWith('new-history', gameStats3);
        gameMock1.isOver = false;
    });

    it('should call setGameParams with the correct information (wasAbandonedBySecondPlayer) and send new-history', () => {
        infoServiceSpy.getGameStats.and.returnValue(gameStats3);
        infoServiceSpy.getPlayerName.and.returnValue('Louis');
        infoServiceSpy.getSecondPlayerName.and.returnValue('Yoda');
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        spyOn(clientSocketService, 'send');
        const epochTime = 1680643620;
        spyOn(Date, 'now').and.returnValue(epochTime);
        const setGameParams: GameStats = {
            startTime: START_TIME_MOCK,
            duration: epochTime - START_TIME_MOCK,
            mode: GameMode.LimitedDuo,
            firstPlayerName: 'Louis',
            secondPlayerName: 'Yoda',
            quitter: 'Yoda',
            winnerPlayerName: '',
        };

        service.setGameHistory(false, true);
        expect(infoServiceSpy.setGameParams).toHaveBeenCalledOnceWith(setGameParams);
        expect(clientSocketService.send).toHaveBeenCalledOnceWith('new-history', gameStats3);
        gameMock1.isOver = false;
    });
    it('should call setGameParams with the correct information (disconnection) and send new-history', () => {
        infoServiceSpy.getGameStats.and.returnValue(gameStats3);
        infoServiceSpy.getPlayerName.and.returnValue('Anakin');
        infoServiceSpy.getSecondPlayerName.and.returnValue('Yoda');
        infoServiceSpy.getGame.and.returnValue(gameMock1);
        spyOn(clientSocketService, 'send');
        const epochTime = 1680643620;
        spyOn(Date, 'now').and.returnValue(epochTime);
        const setGameParams: GameStats = {
            startTime: START_TIME_MOCK,
            duration: epochTime - START_TIME_MOCK,
            mode: GameMode.LimitedDuo,
            firstPlayerName: 'Louis',
            secondPlayerName: 'Yoda',
            quitter: 'Yoda',
            winnerPlayerName: '',
        };

        service.setGameHistory(false, true);
        expect(infoServiceSpy.setGameParams).toHaveBeenCalledOnceWith(setGameParams);
        expect(clientSocketService.send).toHaveBeenCalledOnceWith('new-history', gameStats3);
        gameMock1.isOver = false;
    });
});
