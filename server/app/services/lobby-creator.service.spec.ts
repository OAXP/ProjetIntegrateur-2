/* eslint-disable max-lines */
import { DifferencesInfo } from '@app/interfaces/differences-info';
import { GameSocket } from '@app/interfaces/game-socket';
import { GameHandlerService } from '@app/services/game-handler.service';
import { GameProviderService } from '@app/services/game-provider.service';
import { LobbyCreatorService } from '@app/services/lobby-creator.service';
import { SocketManagerService } from '@app/services/socket-manager.service';
import { SECOND_IN_MILLISECONDS } from '@app/utils/constants';
import { Game } from '@common/game';
import { GameMode } from '@common/game-stats';
import { LobbyModes } from '@common/lobby-modes';
import { Player } from '@common/player';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { createServer } from 'http';
import { Done } from 'mocha';
import { Observable } from 'rxjs';
import { restore, SinonFakeTimers, spy, stub, useFakeTimers } from 'sinon';
import { io as Client, Socket as CSocket } from 'socket.io-client';
import { DifferencesService } from './differences.service';
import { LobbyHandlerService } from './lobby-handler.service';

const mockDifferencesInfo: DifferencesInfo = {
    id: 'mockId',
    remainingDifferenceGroups: new Map([['group1', 1]]),
    groups: [[{ x: 0, y: 0 }]],
};

describe('Lobby creator service', () => {
    let service: LobbyCreatorService;
    let socketManagerService: SocketManagerService;
    let gameHandlerService: GameHandlerService;
    let gameProviderService: GameProviderService;
    let lobbyHandlerService: LobbyHandlerService;
    let differencesService: DifferencesService;
    let serverSocket: GameSocket;
    let clientSocket: CSocket;
    let clock: SinonFakeTimers;

    const mockGame: Game = {
        id: '1',
        name: 'Game',
        differentPixelsCount: 1,
        numberOfDifferences: 2,
        difficulty: 'facile',
        image1Url: 'url',
        image2Url: 'url2',
        differenceImageUrl: 'diffUrl',
        firstPlayer: new Player('room1'),
    };

    beforeEach((done) => {
        stub(fs, 'writeFile').resolves();
        const httpServer = createServer();
        socketManagerService = new SocketManagerService();
        gameHandlerService = new GameHandlerService();
        differencesService = new DifferencesService();
        gameProviderService = new GameProviderService(socketManagerService, gameHandlerService);
        lobbyHandlerService = new LobbyHandlerService(socketManagerService, differencesService, gameProviderService);
        service = new LobbyCreatorService(socketManagerService, gameHandlerService, gameProviderService, lobbyHandlerService);
        httpServer.listen(() => {
            socketManagerService.handleSockets(httpServer);
            socketManagerService.sio.on('connection', (socket: GameSocket) => {
                serverSocket = socket;
                serverSocket.gameInfo = {
                    constants: { bonusTime: 5, initialTime: 30, penaltyTime: 5 },
                    playedIndexes: undefined,
                    remainingDifferenceGroups: new Map<string, number>(),
                    remainingGroups: new Map<number, number>(),
                    differenceGroups: [],
                    totalNumberOfDifferences: 0,
                    intervalId: {} as NodeJS.Timeout,
                    timer: 0,
                };
            });
            // @ts-ignore
            const port = httpServer.address().port;
            clientSocket = Client(`http://localhost:${port}`);
            clientSocket.on('connect', done);
        });
    });

    afterEach(() => {
        restore();
        socketManagerService.close();
        clientSocket.close();
    });

    it('startGame should setup sockets, game info and emit the correct events.', async () => {
        clock = useFakeTimers();
        service['secondPlayerSocket'].set('room1', [serverSocket, serverSocket]);
        const mockRemainingGroups = new Map<number, number>([[0, 0]]);
        const getAllGamesSpy = stub(gameHandlerService, 'getAllGames').resolves([mockGame]);
        const getGameIndexSpy = stub(gameHandlerService, 'getGameIndexBasedOnGameId').resolves(0);
        const writeGamesInJsonSpy = stub(gameHandlerService, 'writeGamesInJson').resolves();
        const emptySecondPlayerSpy = stub(service, 'emptySecondPlayerSocket').resolves();
        const getDifferencesSpy = stub(gameHandlerService, 'getDifferencesInfo').resolves(mockDifferencesInfo);
        serverSocket.gameInfo.remainingGroups = mockRemainingGroups;
        await service.startGame(serverSocket, 'mockGameId');
        clock.tick(SECOND_IN_MILLISECONDS);
        expect(getAllGamesSpy.called).to.equals(true);
        expect(getGameIndexSpy.called).to.equals(true);
        expect(writeGamesInJsonSpy.called).to.equals(true);
        expect(emptySecondPlayerSpy.called).to.equals(true);
        expect(getDifferencesSpy.called).to.equals(true);
        expect(serverSocket.numberOfDifferencesFound).to.equals(0);
        expect(serverSocket.gameInfo.totalNumberOfDifferences).to.equals(mockRemainingGroups.size);
        expect(serverSocket.gameInfo.timer).to.equals(1);
    });

    it('handleSockets should subscribe to currentSocket subject', () => {
        const subscribeSpy = spy(Observable.prototype, 'subscribe');
        service.handleSockets();
        expect(subscribeSpy.called).to.equals(true);
    });

    it('onNewSocket() should add 11 event listeners to the socket', (done: Done) => {
        const NUMBER_OF_ON_CALLS = 11;
        const onSpy = spy(serverSocket, 'on');
        const createGameStub = stub(service, 'createGame').resolves();
        const closeGameStub = stub(service, 'closeGame').resolves();
        const requestSecondPlayerStub = stub(service, 'requestSecondPlayer').resolves();
        const startGameStub = stub(service, 'startGame').resolves();
        const deleteGameStub = stub(service, 'deleteGame').resolves();
        const rejectSecondPlayerStub = stub(service, 'rejectSecondPlayer').resolves();
        const cancelGameRequestStub = stub(service, 'cancelGameRequest').resolves();
        const onRequestCoopStub = stub(service, 'onRequestCoop').resolves();
        const onRemoveCoopStub = stub(service, 'onRemoveCoop').resolves();
        const onEndCoopGameStub = stub(service, 'onEndCoopGame').resolves();
        service.onNewSocket(serverSocket);
        expect(onSpy.callCount).to.equals(NUMBER_OF_ON_CALLS);
        serverSocket.on('create-game-room', () => {
            expect(createGameStub.called).to.equals(true);
        });
        serverSocket.on('close-game-room', () => {
            expect(closeGameStub.called).to.equals(true);
        });
        serverSocket.on('request-joining-game', () => {
            expect(requestSecondPlayerStub.called).to.equals(true);
        });
        serverSocket.on('second-player-accepted', () => {
            expect(startGameStub.called).to.equals(true);
        });
        serverSocket.on('cancel-game-creation', () => {
            expect(deleteGameStub.called).to.equals(true);
        });
        serverSocket.on('reject-second-player', () => {
            expect(rejectSecondPlayerStub.called).to.equals(true);
        });
        serverSocket.on('cancel-game-request', () => {
            expect(cancelGameRequestStub.called).to.equals(true);
        });
        serverSocket.on('request-coop', () => {
            expect(onRequestCoopStub.called).to.equals(true);
        });
        serverSocket.on('remove-coop', () => {
            expect(onRemoveCoopStub.called).to.equals(true);
        });
        serverSocket.on('end-coop-game', () => {
            expect(onEndCoopGameStub.called).to.equals(true);
            done();
        });
        clientSocket.emit('create-game-room');
        clientSocket.emit('close-game-room');
        clientSocket.emit('request-joining-game');
        clientSocket.emit('second-player-accepted');
        clientSocket.emit('cancel-game-creation');
        clientSocket.emit('reject-second-player');
        clientSocket.emit('cancel-game-request');
        clientSocket.emit('request-coop');
        clientSocket.emit('remove-coop');
        clientSocket.emit('end-coop-game');
    });

    it('createGame should call createLimitedGame() if solo limited game mode', async () => {
        const createLimitedGameStub = stub(service, 'createLimitedGame').resolves();
        await service.createGame({ socket: serverSocket, gameId: 'someGameId', gameMode: LobbyModes.LimitedSolo, playerName: 'somePlayerName' });
        expect(createLimitedGameStub.called).to.equals(true);
    });

    it('createGame should call createLimitedGame() if coop limited game mode', async () => {
        const createLimitedGameStub = stub(service, 'createLimitedGame').resolves();
        await service.createGame({ socket: serverSocket, gameId: 'someGameId', gameMode: LobbyModes.LimitedDuo, playerName: 'somePlayerName' });
        expect(createLimitedGameStub.called).to.equals(true);
    });

    it('createGame should retrieve necessary information to create a game', async () => {
        stub(gameHandlerService, 'writeGamesInJson').resolves();
        const getDifferencesSpy = stub(gameHandlerService, 'getDifferencesInfo').resolves(mockDifferencesInfo);
        await service.createGame({ socket: serverSocket, gameId: 'someGameId', gameMode: LobbyModes.ClassicSolo, playerName: 'somePlayerName' });
        expect(serverSocket.gameInfo.remainingGroups).to.not.equals(undefined);
        expect(getDifferencesSpy.called).to.equals(true);
    });

    it('createGame should emit a chrono event and a start-game event for the ClassicSolo mode', async () => {
        clock = useFakeTimers();
        stub(gameHandlerService, 'writeGamesInJson').resolves();
        const socketEmitSpy = spy(serverSocket, 'emit');
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const serverEmitSpy = spy(room, 'emit');
        stub(gameHandlerService, 'getDifferencesInfo').resolves(mockDifferencesInfo);
        await service.createGame({ socket: serverSocket, gameId: 'someGameId', gameMode: LobbyModes.ClassicSolo, playerName: 'somePlayerName' });
        clock.tick(SECOND_IN_MILLISECONDS);
        expect(socketEmitSpy.secondCall.firstArg).to.equals('chrono');
        expect(serverEmitSpy.firstCall.firstArg).to.equals('start-game');
    });

    it('createGame should write in games json for the ClassicDuo mode', async () => {
        stub(gameHandlerService, 'getDifferencesInfo').resolves(mockDifferencesInfo);
        stub(gameHandlerService, 'getAllGames').resolves([mockGame]);
        stub(gameHandlerService, 'getGameIndexBasedOnGameId').resolves(0);
        const writeGamesStub = stub(gameHandlerService, 'writeGamesInJson').resolves();
        await service.createGame({ socket: serverSocket, gameId: 'someGameId', gameMode: LobbyModes.ClassicDuo, playerName: 'somePlayerName' });
        expect(writeGamesStub.called).to.equals(true);
    });

    it('closeGame() should make the socket leave the gameRoomId', () => {
        const leaveSpy = spy(serverSocket, 'leave');
        service.closeGame(serverSocket, 'someGameId');
        expect(leaveSpy.alwaysCalledWithMatch('someGameId')).to.equals(true);
    });

    it('closeGame() should emit an end-multiplayer-game event if there are two players and one abandoned', () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const serverEmitSpy = spy(room, 'emit');
        stub(socketManagerService.sio.sockets.adapter.rooms, 'get').returns(new Set(['0']));
        service.closeGame(serverSocket, '', true);
        expect(serverEmitSpy.alwaysCalledWithMatch('end-multiplayer-game')).to.equals(true);
    });

    it('closeGame() should emit a coop-left event if it was a limited game', () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const serverEmitSpy = spy(room, 'emit');
        stub(socketManagerService.sio.sockets.adapter.rooms, 'get').returns(new Set(['0']));
        serverSocket.gameInfo.playedIndexes = new Map<number, string>();
        service.closeGame(serverSocket, '', true);
        expect(serverEmitSpy.alwaysCalledWithMatch('coop-left')).to.equals(true);
    });

    it('requestSecondPlayer should emit an alert if there are no more players', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const serverEmitSpy = spy(room, 'emit');
        // @ts-ignore
        mockGame.firstPlayer.socketId = '';
        const getAllGamesSpy = stub(gameHandlerService, 'getAllGames').resolves([mockGame]);
        const getGameIndexSpy = stub(gameHandlerService, 'getGameIndexBasedOnGameId').resolves(0);
        await service.requestSecondPlayer(serverSocket, ['name1', 'name2']);
        expect(getAllGamesSpy.called).to.equals(true);
        expect(getGameIndexSpy.called).to.equals(true);
        expect(serverEmitSpy.called).to.equals(true);
    });

    it('requestSecondPlayer should add sockets to secondPlayer Map', async () => {
        stub(service['secondPlayerSocket'], 'get').returns([]);
        stub(gameHandlerService, 'getAllGames').resolves([mockGame]);
        stub(gameHandlerService, 'getGameIndexBasedOnGameId').resolves(0);
        const joinSpy = stub(serverSocket, 'join').resolves();
        // @ts-ignore
        const setSpy = stub(Map.prototype, 'set');
        await service.requestSecondPlayer(serverSocket, ['name1', 'name2']);
        expect(setSpy.called).to.equals(true);
        expect(joinSpy.called).to.equals(true);
    });

    it('deleteGame should find game then remove it.', async () => {
        const getAllGamesSpy = stub(gameHandlerService, 'getAllGames').resolves([mockGame]);
        const getGameIndexSpy = stub(gameHandlerService, 'getGameIndexBasedOnGameId').resolves(0);
        const writeGamesInJsonSpy = stub(gameHandlerService, 'writeGamesInJson').resolves();
        const emptySecondPlayerSpy = stub(service, 'emptySecondPlayerSocket').resolves();
        const emitSpy = stub(socketManagerService.sio, 'emit').resolves();
        await service.deleteGame('mockGameId');
        expect(getAllGamesSpy.called).to.equals(true);
        expect(getGameIndexSpy.called).to.equals(true);
        expect(writeGamesInJsonSpy.called).to.equals(true);
        expect(emptySecondPlayerSpy.called).to.equals(true);
        expect(emitSpy.called).to.equals(true);
    });

    it('rejectSecondPlayer should make excess players leave the room', async () => {
        stub(service['secondPlayerSocket'], 'get').returns([serverSocket, serverSocket]);
        const getAllGamesSpy = stub(gameHandlerService, 'getAllGames').resolves([mockGame]);
        const getGameIndexSpy = stub(gameHandlerService, 'getGameIndexBasedOnGameId').resolves(0);
        const leaveSpy = stub(serverSocket, 'leave').resolves();
        await service.rejectSecondPlayer('mockGameId');
        expect(getAllGamesSpy.called).to.equals(true);
        expect(getGameIndexSpy.called).to.equals(true);
        expect(leaveSpy.called).to.equals(true);
    });

    it('cancelGameRequest should remove the socket that cancelled the request', async () => {
        stub(service['secondPlayerSocket'], 'get').returns([serverSocket, serverSocket]);
        const getAllGamesSpy = stub(gameHandlerService, 'getAllGames').resolves([mockGame]);
        const getGameIndexSpy = stub(gameHandlerService, 'getGameIndexBasedOnGameId').resolves(0);
        const filterSpy = stub(Array.prototype, 'filter').resolves();
        const leaveSpy = stub(serverSocket, 'leave').resolves();
        const deleteSpy = stub(Map.prototype, 'delete').resolves();
        await service.cancelGameRequest(serverSocket, 'mockGameId');
        expect(getAllGamesSpy.called).to.equals(true);
        expect(getGameIndexSpy.called).to.equals(true);
        expect(filterSpy.called).to.equals(true);
        expect(leaveSpy.called).to.equals(true);
        expect(deleteSpy.called).to.equals(true);
    });

    it('cancelGameRequest should emit player-request if there are multiple waiting sockets', async () => {
        stub(gameHandlerService, 'getAllGames').resolves([mockGame]);
        stub(gameHandlerService, 'getGameIndexBasedOnGameId').resolves(0);
        const serverSocket1 = { ...serverSocket, id: 'mockId' };
        // @ts-ignore
        stub(service['secondPlayerSocket'], 'get').returns([serverSocket, serverSocket1]);
        const room = socketManagerService.sio.to('room1');
        stub(socketManagerService.sio, 'to').returns(room);
        const serverEmitSpy = spy(room, 'emit');
        await service.cancelGameRequest(serverSocket, 'mockGameId');
        expect(serverEmitSpy.called).to.equals(true);
    });

    it('emptySecondPlayerSocket should empty secondPlayerSocket map', async () => {
        service['secondPlayerSocket'].set('room1', [serverSocket, serverSocket]);
        const deleteSpy = stub(Map.prototype, 'delete').resolves();
        const leaveSpy = stub(serverSocket, 'leave').resolves();
        service.emptySecondPlayerSocket('room1');
        expect(deleteSpy.called).to.equals(true);
        expect(leaveSpy.called).to.equals(true);
    });

    it('emptySecondPlayerSocket should do nothing if the room is empty', async () => {
        const deleteSpy = stub(Map.prototype, 'delete').resolves();
        const leaveSpy = stub(serverSocket, 'leave').resolves();
        service.emptySecondPlayerSocket('room1');
        expect(deleteSpy.called).to.equals(false);
        expect(leaveSpy.called).to.equals(false);
    });

    it('onEndCoopGame() should make socket leave room', async () => {
        const leaveSpy = stub(serverSocket, 'leave').resolves();
        service.onEndCoopGame(serverSocket, 'room1');
        expect(leaveSpy.alwaysCalledWithMatch('room1')).to.equals(true);
    });

    it('clearGameInfo() should reset values of gameInfo', async () => {
        const clearSpy = stub(Map.prototype, 'clear');
        service.clearGameInfo(serverSocket.gameInfo);
        expect(clearSpy.callCount).to.equals(2);
        expect(serverSocket.gameInfo.differenceGroups).to.deep.equals([]);
        expect(serverSocket.gameInfo.totalNumberOfDifferences).to.equals(0);
        expect(serverSocket.gameInfo.playedIndexes).to.equals(undefined);
    });

    it('onRemoveCoop() should shift waitingCoopSockets', async () => {
        service['waitingCoopSockets'] = [serverSocket];
        const shiftSpy = spy(Array.prototype, 'shift');
        service.onRemoveCoop();
        expect(shiftSpy.called).to.equals(true);
    });

    it('onRequestCoop() should emit to gameRoomId 3 times if there are waiting players', async () => {
        stub(service, 'createLimitedGame').resolves({ gameRoomId: '', game: mockGame, remainingDifferentCoordinates: [] });
        const room = socketManagerService.sio.to('room1');
        stub(socketManagerService.sio, 'to').returns(room);
        const serverEmitSpy = spy(room, 'emit');
        service['waitingCoopSockets'] = [serverSocket];
        await service.onRequestCoop(serverSocket, '');
        expect(serverEmitSpy.callCount).to.equals(3);
    });

    it('onRequestCoop() should push to waitingCoopSockets if there are no waiting players', async () => {
        stub(service, 'createLimitedGame').resolves({ gameRoomId: '', game: mockGame, remainingDifferentCoordinates: [] });
        service['waitingCoopSockets'] = [];
        const pushSpy = spy(Array.prototype, 'push');
        await service.onRequestCoop(serverSocket, '');
        expect(pushSpy.called).to.equals(true);
    });

    it('createLimitedGame should setup the game', async () => {
        clock = useFakeTimers();
        const getAllGamesSpy = stub(gameHandlerService, 'getAllGames').resolves([mockGame]);
        const setupDifferencesInfoSpy = stub(gameProviderService, 'setupDifferencesInfo').resolves();
        await service.createLimitedGame({
            socket: serverSocket,
            gameId: 'mockGameId',
            playerName: 'somePlayer',
            gameMode: LobbyModes.LimitedSolo,
        });
        clock.tick(SECOND_IN_MILLISECONDS);
        expect(getAllGamesSpy.called).to.equals(true);
        expect(setupDifferencesInfoSpy.called).to.equals(true);
        expect(serverSocket.gameInfo.playedIndexes).to.not.equals(undefined);
        expect(serverSocket.gameInfo.timer).to.equals(serverSocket.gameInfo.constants.initialTime - 1);
        expect(serverSocket.gameInfo.intervalId).to.not.equals(undefined);
    });

    it('createLimitedGame should end game if timer hits 0', async () => {
        clock = useFakeTimers();
        const room = socketManagerService.sio.to('room1');
        stub(socketManagerService.sio, 'to').returns(room);
        const serverEmitSpy = spy(room, 'emit');
        stub(gameHandlerService, 'getAllGames').resolves([mockGame]);
        stub(gameProviderService, 'setupDifferencesInfo').resolves();
        const clearGameInfoStub = stub(service, 'clearGameInfo').returns();
        serverSocket.gameInfo.constants.initialTime = 1;
        await service.createLimitedGame({
            socket: serverSocket,
            gameId: 'mockGameId',
            playerName: 'somePlayer',
            gameMode: LobbyModes.LimitedDuo,
        });
        clock.tick(SECOND_IN_MILLISECONDS);
        expect(serverEmitSpy.calledWith('close-limited-game', false)).to.equals(true);
        expect(clearGameInfoStub.called).to.equals(true);
    });

    it('onDisconnect should call closeGame', () => {
        serverSocket.gameInfo.mode = GameMode.ClassicDuo;
        const closeGameStub = stub(service, 'closeGame');
        service.onDisconnect(serverSocket);
        expect(closeGameStub.called).to.equals(true);
    });

    it('onDisconnect should call onNewHistory', () => {
        serverSocket.gameInfo.mode = GameMode.ClassicSolo;
        const lobbyHandlerServiceStub = stub(lobbyHandlerService, 'onNewHistory');
        service.onDisconnect(serverSocket);
        expect(lobbyHandlerServiceStub.called).to.equals(true);
    });
});
