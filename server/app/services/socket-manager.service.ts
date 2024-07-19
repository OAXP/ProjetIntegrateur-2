import { GameSocket } from '@app/interfaces/game-socket';
import { MAX_HTTP_BUFFER_SIZE } from '@app/utils/constants';
import * as http from 'http';
import { Subject } from 'rxjs';
import * as io from 'socket.io';
import { Service } from 'typedi';

@Service()
export class SocketManagerService {
    sio: io.Server;
    currentSocket = new Subject<GameSocket>();

    handleSockets(server: http.Server): void {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] }, maxHttpBufferSize: MAX_HTTP_BUFFER_SIZE });
        this.sio.on('connection', (socket: GameSocket) => {
            socket.numberOfDifferencesFound = 0;
            this.currentSocket.next(socket);
        });
    }

    close(): void {
        this.sio.close();
    }
}
