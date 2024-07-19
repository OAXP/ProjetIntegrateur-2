import { DifferencesInfo } from '@app/interfaces/differences-info';
import { GameSocket } from '@app/interfaces/game-socket';
import { GameHandlerService } from '@app/services/game-handler.service';
import { GameProviderService } from '@app/services/game-provider.service';
import { SocketManagerService } from '@app/services/socket-manager.service';
import { Game } from '@common/game';
import { GameConstants } from '@common/game-constants';
import { Player } from '@common/player';
import { expect } from 'chai';
import { createServer } from 'http';
import { Done } from 'mocha';
import { restore, spy, stub } from 'sinon';
import { Socket as CSocket, io as Client } from 'socket.io-client';

const INIT_POINT = { x: 0, y: 0 };

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

const mockDifferenceInfo: DifferencesInfo = {
    id: '1',
    remainingDifferenceGroups: new Map<string, number>(),
    groups: [[INIT_POINT]],
};

describe('Game provider service', () => {
    let service: GameProviderService;
    let socketManagerService: SocketManagerService;
    let gameHandlerService: GameHandlerService;
    let serverSocket: GameSocket;
    let clientSocket: CSocket;

    beforeEach((done) => {
        const httpServer = createServer();
        socketManagerService = new SocketManagerService();
        gameHandlerService = new GameHandlerService();
        service = new GameProviderService(socketManagerService, gameHandlerService);
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

    it('provideNextLimitedGame should find the next game and setup its difference info', async () => {
        stub(gameHandlerService, 'getAllGames').resolves([mockGame]);
        serverSocket.gameInfo.playedIndexes = new Map<number, string>();
        const setupDifferencesInfoSpy = stub(service, 'setupDifferencesInfo').resolves();
        await service.provideNextLimitedGame(serverSocket, '');
        expect(setupDifferencesInfoSpy.called).to.equals(true);
    });

    it('provideNextLimitedGame should emit an event if there are no more games left', async () => {
        const getAllGamesSpy = stub(gameHandlerService, 'getAllGames').resolves([mockGame]);
        serverSocket.gameInfo.playedIndexes = new Map<number, string>();
        serverSocket.gameInfo.playedIndexes.set(1, 'mockGameId');
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const serverEmitSpy = spy(room, 'emit');
        await service.provideNextLimitedGame(serverSocket, '');
        expect(getAllGamesSpy.called).to.equals(true);
        expect(serverEmitSpy.called).to.equals(true);
    });

    it('setupDifferencesInfo() should return the good value of remainingDifferentCoordinates', async () => {
        stub(gameHandlerService, 'getDifferencesInfo').resolves(mockDifferenceInfo);
        const remainingDifferentCoordinates = await service.setupDifferencesInfo(serverSocket, '');
        expect(remainingDifferentCoordinates).to.deep.equals([INIT_POINT]);
    });

    it('setupDifferencesInfo() should set gameInfo timer to 0 if nonexistent', async () => {
        stub(gameHandlerService, 'getDifferencesInfo').resolves(mockDifferenceInfo);
        // @ts-ignore
        serverSocket.gameInfo = undefined;
        await service.setupDifferencesInfo(serverSocket, '');
        expect(serverSocket.gameInfo.timer).to.equals(0);
    });

    it('setupDifferencesInfo() should set gameInfo timer to current value if existent', async () => {
        stub(gameHandlerService, 'getDifferencesInfo').resolves(mockDifferenceInfo);
        // @ts-ignore
        serverSocket.gameInfo.timer = 2;
        await service.setupDifferencesInfo(serverSocket, '');
        expect(serverSocket.gameInfo.timer).to.equals(2);
    });

    it('should call updateTimer and update the constants', () => {
        const newGameConstants: GameConstants = { initialTime: 35, bonusTime: 7, penaltyTime: 7 };
        const onSpy = stub(socketManagerService.sio, 'emit').resolves();
        service.updateTimer(newGameConstants);
        expect(service.gameConstants).to.equals(newGameConstants);
        expect(onSpy.called).to.equals(true);
        expect(onSpy.firstCall.lastArg).to.equals(newGameConstants);
    });

    it('should call onGetGameConstant', () => {
        const newGameConstants: GameConstants = { initialTime: 35, bonusTime: 7, penaltyTime: 7 };
        service.gameConstants = newGameConstants;
        const room = socketManagerService.sio.to('');
        stub(socketManagerService.sio, 'to').returns(room);
        const serverEmitSpy = spy(room, 'emit');

        service.onGetGameConstant(serverSocket);
        expect(serverEmitSpy.called).to.equals(true);
        expect(serverEmitSpy.firstCall.firstArg).to.equals('new-timer-constants');
        expect(serverEmitSpy.firstCall.lastArg).to.equals(newGameConstants);
    });

    it('onNewSocket() should add 2 event listeners to the socket', (done: Done) => {
        const NUMBER_OF_ON_CALLS = 2;
        const onSpy = spy(serverSocket, 'on');
        const timerUpdatedStub = stub(service, 'updateTimer').resolves();
        const getGameConstantStub = stub(service, 'onGetGameConstant').resolves();
        service.onNewSocket(serverSocket);
        expect(onSpy.callCount).to.equals(NUMBER_OF_ON_CALLS);
        serverSocket.on('timer-updated', () => {
            expect(timerUpdatedStub.called).to.equals(true);
        });
        serverSocket.on('get-game-constant', () => {
            expect(getGameConstantStub.called).to.equals(true);
            done();
        });
        clientSocket.emit('timer-updated');
        clientSocket.emit('get-game-constant');
    });
});
