import { Application } from '@app/app';
import { LobbyCreatorService } from '@app/services/lobby-creator.service';
import { BASE_TEN } from '@app/utils/constants';
import * as http from 'http';
import { AddressInfo } from 'net';
import { Inject, Service } from 'typedi';
import { LobbyHandlerService } from './services/lobby-handler.service';
import { MongoService } from './services/mongo.service';
import { SocketManagerService } from './services/socket-manager.service';

@Service()
export class Server {
    private static readonly appPort: string | number | boolean = Server.normalizePort(process.env.PORT || '3000');
    @Inject()
    private socketManagerService: SocketManagerService;
    @Inject()
    private lobbyHandlerService: LobbyHandlerService;
    @Inject()
    private lobbyCreatorService: LobbyCreatorService;
    @Inject()
    private mongoService: MongoService;
    private server: http.Server;

    constructor(private readonly application: Application) {}

    private static normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, BASE_TEN) : val;
        if (isNaN(port)) {
            return val;
        } else if (port >= 0) {
            return port;
        } else {
            return false;
        }
    }

    async init(): Promise<void> {
        this.application.app.set('port', Server.appPort);

        this.server = http.createServer(this.application.app);
        this.mongoService.start();
        this.socketManagerService.handleSockets(this.server);
        this.lobbyCreatorService.handleSockets();
        this.lobbyHandlerService.handleSockets();

        this.server.listen(Server.appPort);
        this.server.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        this.server.on('listening', () => this.onListening());
    }

    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind: string = typeof Server.appPort === 'string' ? 'Pipe ' + Server.appPort : 'Port ' + Server.appPort;
        switch (error.code) {
            case 'EACCES':
                // eslint-disable-next-line no-console
                console.error(`${bind} requires elevated privileges`); // no-console added for server logs
                process.exit(1);
                break;
            case 'EADDRINUSE':
                // eslint-disable-next-line no-console
                console.error(`${bind} is already in use`); // no-console added for server logs
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * When server starts listening on port
     */
    private onListening(): void {
        const addr = this.server.address() as AddressInfo;
        const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        // eslint-disable-next-line no-console
        console.log(`Listening on ${bind}`); // no-console added for server logs
    }
}
