import { SocketManagerService } from '@app/services/socket-manager.service';
import { expect } from 'chai';
import { createServer, Server } from 'http';
import { restore, spy } from 'sinon';
import { GameSocket } from '@app/interfaces/game-socket';
import { io as Client, Socket as CSocket } from 'socket.io-client';
import { Server as SocketServer } from 'socket.io';
import { Done } from 'mocha';
import { Subject } from 'rxjs';

describe('Socket Manager Service', () => {
    let socketManagerService: SocketManagerService;
    let clientSocket: CSocket;
    let serverSocket: GameSocket;
    let httpServer: Server;

    // Inspired by https://socket.io/docs/v4/testing/
    beforeEach(() => {
        httpServer = createServer();
        socketManagerService = new SocketManagerService();
    });

    afterEach(() => {
        restore();
        socketManagerService.close();
        clientSocket.close();
    });

    it('handleSockets should change the value of currentSocket', (done: Done) => {
        const nextSpy = spy(Subject.prototype, 'next');
        httpServer.listen(() => {
            socketManagerService.handleSockets(httpServer);
            socketManagerService.sio.on('connection', (socket: GameSocket) => {
                serverSocket = socket;
                expect(nextSpy.alwaysCalledWith(serverSocket)).to.equals(true);
                done();
            });
            // @ts-ignore
            const port = httpServer.address().port;
            clientSocket = Client(`http://localhost:${port}`);
            clientSocket.on('connect', () => {
                /* none */
            });
        });
    });

    it('close() should call close on the server socket', (done: Done) => {
        const closeSpy = spy(SocketServer.prototype, 'close');
        httpServer.listen(() => {
            socketManagerService.handleSockets(httpServer);
            socketManagerService.close();
            expect(closeSpy.called).to.equals(true);
            done();
        });
    });

    // it('create-game-room event should make client join a room using client id', (done) => {
    //     clientSocket.on('send-game-room-id', (gameRoomId: string) => {
    //         expect(gameRoomId).to.equals(clientSocket.id);
    //         expect(serverSocket.rooms.size).to.equals(1);
    //         done();
    //     });
    //
    //     const diffImage: BmpManager = new BmpManager(IMAGE_RES.width, IMAGE_RES.height);
    //     stub(Bmp, 'read').resolves(diffImage);
    //     stub(BmpManager.prototype, 'getPixel').returns({ r: BLACK_RGBA.r, g: BLACK_RGBA.g, b: BLACK_RGBA.b });
    //     clientSocket.emit('create-game-room', 'mockDiffImageUrl');
    // });

    // it('close-game-room event should make client leave a room using game room id', (done) => {
    //     clientSocket.emit('create-game-room');
    //     serverSocket.on('close-game-room', () => {
    //         expect(serverSocket.rooms.size).to.equals(0);
    //         done();
    //     });
    //     clientSocket.emit('close-game-room', clientSocket.id);
    // });

    // it('detect-diff event should call diffService.validateDiff', (done) => {
    //     clientSocket.emit('create-game-room');
    //     const validateStub = stub(DifferencesService.prototype, 'validateDifferences').resolves(baseValidateRes);
    //     serverSocket.on('detect-diff', async () => {
    //         expect(validateStub.called).to.equals(true);
    //         done();
    //     });
    //     clientSocket.emit('detect-diff', { x: 0, y: 0 }, '', '');
    // });
    // it('filterRemainingDiff should filter pixels from remainingDiffCoords', () => {
    //     serverSocket.remainingDiffCoords = [
    //         { x: 0, y: 0 },
    //         { x: 5, y: 5 },
    //     ];
    //     socketManagerService.filterRemainingDiff(serverSocket, [{ x: 0, y: 0 }]);
    //     // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    //     expect(serverSocket.remainingDiffCoords[0].x).to.equals(-1);
    //     // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    //     expect(serverSocket.remainingDiffCoords[0].y).to.equals(-1);
    // });
});
