/* eslint-disable max-lines */
import { GameSocket } from '@app/interfaces/game-socket';
import { DifferencesService } from '@app/services/differences.service';
import { GameHandlerService } from '@app/services/game-handler.service';
import { GameProviderService } from '@app/services/game-provider.service';
import { LobbyHandlerService } from '@app/services/lobby-handler.service';
import { SocketManagerService } from '@app/services/socket-manager.service';
import { GameMode, GameStats } from '@common/game-stats';
import { Message } from '@common/message';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { createServer } from 'http';
import { Done } from 'mocha';
import { Observable } from 'rxjs';
import { SinonStubbedInstance, createStubInstance, restore, spy, stub } from 'sinon';
import { Socket as CSocket, io as Client } from 'socket.io-client';

describe('Lobby handler service', () => {
    const START_TIME_MOCK = 1680636368;

    const gameStatsMock: GameStats = {
        startTime: START_TIME_MOCK,
        duration: 10.564,
        mode: GameMode.ClassicDuo,
        firstPlayerName: 'Louis',
        secondPlayerName: 'Yoda',
        quitter: 'Yoda',
    };

    let service: LobbyHandlerService;
    let socketManagerService: SocketManagerService;
    let differencesService: SinonStubbedInstance<DifferencesService>;
    let gameProviderService: GameProviderService;
    let clientSocket: CSocket;
    let serverSocket: GameSocket;
    const ORIGIN_POINT = { x: 0, y: 0 };
    const ONE_POINT = { x: 1, y: 1 };

    // Inspired by https://socket.io/docs/v4/testing/
    beforeEach((done: Done) => {
        const httpServer = createServer();
        socketManagerService = new SocketManagerService();
        differencesService = createStubInstance(DifferencesService);
        gameProviderService = new GameProviderService(socketManagerService, new GameHandlerService());
        service = new LobbyHandlerService(socketManagerService, differencesService, gameProviderService);
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

    it('onNewSocket() should add 7 event listeners to the socket', (done: Done) => {
        const NUMBER_OF_ON_CALLS = 7;
        const onSpy = spy(serverSocket, 'on');
        const detectDifferenceStub = stub(service, 'detectDifference').resolves();
        const sendMessageStub = stub(service, 'sendMessage').resolves();
        const onNewRecordStub = stub(service, 'onNewRecord').resolves();
        const onNewHistoryStub = stub(service, 'onNewHistory').resolves();
        const onGetHistoryStub = stub(service, 'onGetHistory').resolves();
        const onResetHistoryStub = stub(service, 'onResetHistory').resolves();
        const changeLimitedTimerStub = stub(service, 'changeLimitedTimer').resolves();
        service.onNewSocket(serverSocket);
        expect(onSpy.callCount).to.equals(NUMBER_OF_ON_CALLS);
        serverSocket.on('detect-difference', () => {
            expect(detectDifferenceStub.called).to.equals(true);
        });
        serverSocket.on('send-message', () => {
            expect(sendMessageStub.called).to.equals(true);
        });
        serverSocket.on('new-record', () => {
            expect(onNewRecordStub.called).to.equals(true);
        });
        serverSocket.on('new-history', () => {
            expect(onNewHistoryStub.called).to.equals(true);
        });
        serverSocket.on('get-history', () => {
            expect(onGetHistoryStub.called).to.equals(true);
        });
        serverSocket.on('reset-history', () => {
            expect(onResetHistoryStub.called).to.equals(true);
        });
        serverSocket.on('use-hint', () => {
            expect(changeLimitedTimerStub.called).to.equals(true);
            done();
        });
        clientSocket.emit('detect-difference');
        clientSocket.emit('send-message');
        clientSocket.emit('new-record');
        clientSocket.emit('new-history');
        clientSocket.emit('get-history');
        clientSocket.emit('reset-history');
        clientSocket.emit('use-hint');
    });

    it('handleSockets() should subscribe to currentSocket subject', () => {
        const subscribeSpy = spy(Observable.prototype, 'subscribe');
        service.handleSockets();
        expect(subscribeSpy.called).to.equals(true);
    });

    it('sendMessage() should emit an event with the good message', () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const emitSpy = spy(room, 'emit');
        const mockMessage: Message = { body: '', date: 0, title: '' };
        service.sendMessage('', mockMessage);
        expect(emitSpy.alwaysCalledWithMatch('send-message', mockMessage)).to.equals(true);
    });

    it('detectDifference() should call differencesService.validateDifferences() and filterRemainingDifferences()', async () => {
        const validateDifferenceStub = differencesService.validateDifferences.resolves({
            differentPixels: [],
            groupIndex: 0,
            isDifferent: false,
        });
        const filterRemainingSpy = stub(service, 'filterRemainingDifferences').returns([]);
        await service.detectDifference({ gameId: '', gameRoomId: '', mousePosition: ORIGIN_POINT, socket: serverSocket });
        expect(validateDifferenceStub.called).to.equals(true);
        expect(filterRemainingSpy.called).to.equals(true);
    });

    it('detectDifference() should increment numberOfDifferencesFound if a difference is found', async () => {
        differencesService.validateDifferences.resolves({
            differentPixels: [],
            groupIndex: 0,
            isDifferent: true,
        });
        stub(service, 'filterRemainingDifferences').returns([]);
        serverSocket.numberOfDifferencesFound = 0;
        await service.detectDifference({ gameId: '', gameRoomId: '', mousePosition: ORIGIN_POINT, socket: serverSocket });
        expect(serverSocket.numberOfDifferencesFound).to.equals(1);
    });

    it('detectDifference() should not increment numberOfDifferencesFound if a difference is not found', async () => {
        differencesService.validateDifferences.resolves({
            differentPixels: [],
            groupIndex: 0,
            isDifferent: false,
        });
        stub(service, 'filterRemainingDifferences').returns([]);
        serverSocket.numberOfDifferencesFound = 0;
        await service.detectDifference({ gameId: '', gameRoomId: '', mousePosition: ORIGIN_POINT, socket: serverSocket });
        expect(serverSocket.numberOfDifferencesFound).to.equals(0);
    });

    it('detectDifference() should emit 2 times if a duo game is won', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const emitSpy = spy(room, 'emit');
        differencesService.validateDifferences.resolves({
            differentPixels: [],
            groupIndex: 0,
            isDifferent: true,
        });
        stub(service, 'filterRemainingDifferences').returns([]);
        stub(socketManagerService.sio.sockets.adapter.rooms, 'get').returns(new Set(['0', '1']));
        serverSocket.numberOfDifferencesFound = 2;
        serverSocket.gameInfo.totalNumberOfDifferences = 1;
        await service.detectDifference({ gameId: '', gameRoomId: '', mousePosition: ORIGIN_POINT, socket: serverSocket });
        expect(emitSpy.callCount).to.equals(2);
    });

    it('detectDifference() should emit 1 time if a duo game is not won', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const emitSpy = spy(room, 'emit');
        differencesService.validateDifferences.resolves({
            differentPixels: [],
            groupIndex: 0,
            isDifferent: false,
        });
        stub(service, 'filterRemainingDifferences').returns([]);
        stub(socketManagerService.sio.sockets.adapter.rooms, 'get').returns(new Set(['0', '1']));
        serverSocket.numberOfDifferencesFound = 0;
        serverSocket.gameInfo.totalNumberOfDifferences = 2;
        await service.detectDifference({ gameId: '', gameRoomId: '', mousePosition: ORIGIN_POINT, socket: serverSocket });
        expect(emitSpy.callCount).to.equals(1);
    });

    it('detectDifference() should emit 2 times if a solo game is won', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const emitSpy = spy(room, 'emit');
        differencesService.validateDifferences.resolves({
            differentPixels: [],
            groupIndex: 0,
            isDifferent: false,
        });
        stub(service, 'filterRemainingDifferences').returns([]);
        stub(socketManagerService.sio.sockets.adapter.rooms, 'get').returns(new Set(['0']));
        serverSocket.numberOfDifferencesFound = 2;
        serverSocket.gameInfo.totalNumberOfDifferences = 2;
        await service.detectDifference({ gameId: '', gameRoomId: '', mousePosition: ORIGIN_POINT, socket: serverSocket });
        expect(emitSpy.callCount).to.equals(2);
    });

    it('detectDifference() should emit 1 time if a solo game is not won', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const emitSpy = spy(room, 'emit');
        differencesService.validateDifferences.resolves({
            differentPixels: [],
            groupIndex: 0,
            isDifferent: true,
        });
        stub(service, 'filterRemainingDifferences').returns([]);
        stub(socketManagerService.sio.sockets.adapter.rooms, 'get').returns(new Set(['0']));
        serverSocket.numberOfDifferencesFound = 0;
        serverSocket.gameInfo.totalNumberOfDifferences = 2;
        await service.detectDifference({ gameId: '', gameRoomId: '', mousePosition: ORIGIN_POINT, socket: serverSocket });
        expect(emitSpy.callCount).to.equals(1);
    });

    it('detectDifference() should emit 1 time if a it is a limited game', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const emitSpy = spy(room, 'emit');
        differencesService.validateDifferences.resolves({
            differentPixels: [],
            groupIndex: 0,
            isDifferent: false,
        });
        stub(service, 'changeLimitedTimer').returns();
        stub(service, 'filterRemainingDifferences').returns([]);
        stub(socketManagerService.sio.sockets.adapter.rooms, 'get').returns(new Set(['0', '1']));
        serverSocket.numberOfDifferencesFound = 0;
        serverSocket.gameInfo.totalNumberOfDifferences = 2;
        serverSocket.gameInfo.playedIndexes = new Map<number, string>();
        await service.detectDifference({ gameId: '', gameRoomId: '', mousePosition: ORIGIN_POINT, socket: serverSocket });
        expect(emitSpy.callCount).to.equals(1);
    });

    it('detectDifference() should call provideNextLimitedGame() if a it is a limited game and a difference is found', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        differencesService.validateDifferences.resolves({
            differentPixels: [],
            groupIndex: 0,
            isDifferent: true,
        });
        stub(service, 'changeLimitedTimer').returns();
        stub(service, 'filterRemainingDifferences').returns([]);
        stub(socketManagerService.sio.sockets.adapter.rooms, 'get').returns(new Set(['0', '1']));
        serverSocket.numberOfDifferencesFound = 0;
        serverSocket.gameInfo.totalNumberOfDifferences = 2;
        serverSocket.gameInfo.playedIndexes = new Map<number, string>();
        const provideNextLimitedGameStub = stub(gameProviderService, 'provideNextLimitedGame').resolves();
        await service.detectDifference({ gameId: '', gameRoomId: '', mousePosition: ORIGIN_POINT, socket: serverSocket });
        expect(provideNextLimitedGameStub.called).to.equals(true);
    });

    it('detectDifference() should call changeLimitedTimer() if a it is a limited game and a difference is found', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        differencesService.validateDifferences.resolves({
            differentPixels: [],
            groupIndex: 0,
            isDifferent: true,
        });
        const changeLimitedTimderStub = stub(service, 'changeLimitedTimer').returns();
        stub(service, 'filterRemainingDifferences').returns([]);
        stub(socketManagerService.sio.sockets.adapter.rooms, 'get').returns(new Set(['0', '1']));
        serverSocket.numberOfDifferencesFound = 0;
        serverSocket.gameInfo.totalNumberOfDifferences = 2;
        serverSocket.gameInfo.playedIndexes = new Map<number, string>();
        await service.detectDifference({ gameId: '', gameRoomId: '', mousePosition: ORIGIN_POINT, socket: serverSocket });
        expect(changeLimitedTimderStub.called).to.equals(true);
    });

    it('detectDifference() should call changeLimitedTimer() if a it is a limited game and a difference is not found', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        differencesService.validateDifferences.resolves({
            differentPixels: [],
            groupIndex: 0,
            isDifferent: false,
        });
        const changeLimitedTimderStub = stub(service, 'changeLimitedTimer').returns();
        stub(service, 'filterRemainingDifferences').returns([]);
        stub(socketManagerService.sio.sockets.adapter.rooms, 'get').returns(new Set(['0', '1']));
        serverSocket.numberOfDifferencesFound = 0;
        serverSocket.gameInfo.totalNumberOfDifferences = 2;
        serverSocket.gameInfo.playedIndexes = new Map<number, string>();
        await service.detectDifference({ gameId: '', gameRoomId: '', mousePosition: ORIGIN_POINT, socket: serverSocket });
        expect(changeLimitedTimderStub.called).to.equals(true);
    });

    it('changeLimitedTimer() should emit timer', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const emitSpy = spy(room, 'emit');
        service.changeLimitedTimer({ socket: serverSocket, isDifferent: false, gameRoomId: '', hintAsked: false });
        expect(emitSpy.called).to.equals(true);
    });

    it('changeLimitedTimer() should add bonus time if a difference is found', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const initTimer = serverSocket.gameInfo.timer;
        service.changeLimitedTimer({ socket: serverSocket, isDifferent: true, gameRoomId: '', hintAsked: false });
        expect(serverSocket.gameInfo.timer).to.equals(initTimer + serverSocket.gameInfo.constants.bonusTime);
    });

    it('changeLimitedTimer() should add time if a hint is used in Classic', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const initTimer = serverSocket.gameInfo.timer;
        service.changeLimitedTimer({ socket: serverSocket, isDifferent: false, gameRoomId: '', hintAsked: true });
        expect(serverSocket.gameInfo.timer).to.equals(initTimer + serverSocket.gameInfo.constants.bonusTime);
    });

    it('changeLimitedTimer() should subtract time if a hint is used in Limited', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        serverSocket.gameInfo.timer = 120;
        serverSocket.gameInfo.playedIndexes = new Map<number, string>();
        const initTimer = serverSocket.gameInfo.timer;
        service.changeLimitedTimer({ socket: serverSocket, isDifferent: false, gameRoomId: '', hintAsked: true });
        expect(serverSocket.gameInfo.timer).to.equals(initTimer - serverSocket.gameInfo.constants.bonusTime);
    });

    it('changeLimitedTimer() should do nothing if a difference is not found', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        serverSocket.gameInfo.timer = 120;
        const initTimer = serverSocket.gameInfo.timer;
        service.changeLimitedTimer({ socket: serverSocket, isDifferent: false, gameRoomId: '', hintAsked: false });
        expect(serverSocket.gameInfo.timer).to.equals(initTimer);
    });

    it('changeLimitedTimer() should set timer to a max of 2:00', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        serverSocket.gameInfo.timer = 119;
        service.changeLimitedTimer({ socket: serverSocket, isDifferent: true, gameRoomId: '', hintAsked: false });
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(serverSocket.gameInfo.timer).to.equals(120);
    });

    it('changeLimitedTimer() should set timer to a min of 0:00', async () => {
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        serverSocket.gameInfo.timer = 0;
        service.changeLimitedTimer({ socket: serverSocket, isDifferent: false, gameRoomId: '', hintAsked: false });
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(serverSocket.gameInfo.timer).to.equals(0);
    });

    it('filterRemainingDifferences() should remove the group and return a filtered array', () => {
        serverSocket.gameInfo.remainingGroups = new Map([
            [0, 0],
            [1, 1],
        ]);
        serverSocket.gameInfo.differenceGroups = [[ORIGIN_POINT], [ONE_POINT]];

        const result = service.filterRemainingDifferences(serverSocket, 0);
        expect(serverSocket.gameInfo.remainingGroups.size).to.equals(1);
        expect(result.length).to.equals(1);
        expect(result[0]).to.equals(ONE_POINT);
    });

    it('should call onNewRecord', () => {
        const currentDate = Date.now();
        const message: Message = {
            title: '',
            body: '',
            date: currentDate,
        };
        const emitSpy = spy(socketManagerService.sio, 'emit');
        service.onNewRecord(message);
        expect(emitSpy.alwaysCalledWithMatch('send-message', message)).to.equals(true);
    });

    it('getHistoryJsonFile() should return the gameStat', async () => {
        const gameStat: GameStats[] = [gameStatsMock];
        stub(fs, 'readFile').resolves(JSON.stringify({ history: gameStat }));
        const result = await service.getHistoryJsonFile();
        expect(result['history']).to.deep.equals(gameStat);
    });

    it('getGamesJsonFile() should return empty games if the file is not found', async () => {
        stub(fs, 'readFile').throws();
        const result = await service.getHistoryJsonFile();
        expect(result['history']).to.deep.equals([]);
    });

    it('writeHistoryInJson() should call fs.writeFile', async () => {
        const fsWriteFileStub = stub(fs, 'writeFile').resolves();
        await service.writeHistoryInJson([]);
        expect(fsWriteFileStub.called).to.equals(true);
    });

    it('onNewHistory should create a json file if does not exist and put the history', async () => {
        stub(fs, 'access').throws('ENOENT');
        const gameWriteFileStub = stub(service, 'writeHistoryInJson').resolves();
        stub(service, 'getHistoryJsonFile').resolves({ history: [] });

        await service.onNewHistory(gameStatsMock);
        expect(gameWriteFileStub.callCount).to.equals(2);
    });

    it('onNewHistory should append the history array in the json file if it does exist', async () => {
        stub(fs, 'access').resolves();
        const gameWriteFileStub = stub(service, 'writeHistoryInJson').resolves();
        stub(service, 'getHistoryJsonFile').resolves({ history: [] });

        await service.onNewHistory(gameStatsMock);
        expect(gameWriteFileStub.callCount).to.equals(1);
    });

    it('onNewHistory should throw an error if it is not ENOENT', async () => {
        stub(fs, 'access').throws('error');
        stub(fs, 'readFile').resolves('{ "history": [] }');
        stub(fs, 'writeFile').resolves();

        let error: object = {};
        try {
            await service.onNewHistory(gameStatsMock);
        } catch (e) {
            error = e;
        }

        expect(error).to.have.property('name').equals('error');
    });

    it('onGetHistory should call getHistoryJsonFile and send the history', async () => {
        const gameHistoryStub = stub(service, 'getHistoryJsonFile').resolves({ history: [] });
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const emitSpy = spy(room, 'emit');
        await service.onGetHistory(serverSocket);
        expect(gameHistoryStub.called);
        expect(emitSpy.called);
    });

    it('onResetHistory should call writeHistoryInJson and reset-history event', async () => {
        const gameHistoryStub = stub(service, 'writeHistoryInJson');
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const emitSpy = spy(room, 'emit');
        await service.onResetHistory();
        expect(gameHistoryStub.called);
        expect(emitSpy.called);
    });
});
