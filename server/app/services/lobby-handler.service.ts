import { GameSocket } from '@app/interfaces/game-socket';
import { HistoryJson } from '@app/interfaces/history-json';
import { DifferencesService } from '@app/services/differences.service';
import { HISTORY_JSON, TWO_MINUTES_IN_SECONDS } from '@app/utils/constants';
import { clamp } from '@app/utils/math.utils';
import { Coordinates } from '@common/coordinates';
import { GameStats } from '@common/game-stats';
import { Message } from '@common/message';
import { promises as fs } from 'fs';
import { Service } from 'typedi';
import { GameProviderService } from './game-provider.service';
import { SocketManagerService } from './socket-manager.service';

interface DetectDifferenceArgs {
    socket: GameSocket;
    mousePosition: Coordinates;
    gameId: string;
    gameRoomId: string;
}

interface ChangeLimitedTimerArgs {
    socket: GameSocket;
    isDifferent: boolean;
    gameRoomId: string;
    hintAsked: boolean;
}

@Service()
export class LobbyHandlerService {
    constructor(
        private socketManagerService: SocketManagerService,
        private differencesService: DifferencesService,
        private gameProviderService: GameProviderService,
    ) {}

    handleSockets(): void {
        this.socketManagerService.currentSocket.asObservable().subscribe(this.onNewSocket);
    }

    onNewSocket = (socket: GameSocket) => {
        socket.on('detect-difference', async (mousePosition: Coordinates, gameId: string, gameRoomId: string) =>
            this.detectDifference({ socket, mousePosition, gameId, gameRoomId }),
        );
        socket.on('send-message', this.sendMessage);
        socket.on('new-record', this.onNewRecord);
        socket.on('new-history', this.onNewHistory);
        socket.on('get-history', async () => this.onGetHistory(socket));
        socket.on('reset-history', this.onResetHistory);
        socket.on('use-hint', (gameRoomId: string) => this.changeLimitedTimer({ socket, isDifferent: false, gameRoomId, hintAsked: true }));
    };

    sendMessage = (roomId: string, message: Message) => {
        this.socketManagerService.sio.to(roomId).emit('send-message', message);
    };

    onNewRecord = (message: Message) => {
        this.socketManagerService.sio.emit('send-message', message);
    };

    async detectDifference(params: DetectDifferenceArgs) {
        const result = await this.differencesService.validateDifferences(params.mousePosition, params.socket);
        const remainingDifferentCoordinates = this.filterRemainingDifferences(params.socket, result.groupIndex);
        if (result.isDifferent) params.socket.numberOfDifferencesFound++;
        this.socketManagerService.sio.to(params.gameRoomId).emit('detect-difference-response', {
            isDifferent: result.isDifferent,
            differentPixels: result.differentPixels,
            remainingDifferentCoordinates,
            socketId: params.socket.id,
        });
        const isSoloGame = this.socketManagerService.sio.sockets.adapter.rooms.get(params.gameRoomId)?.size === 1;
        const isClassicGame = !params.socket.gameInfo.playedIndexes;
        if (isClassicGame) {
            if (!isSoloGame && params.socket.numberOfDifferencesFound >= Math.ceil(params.socket.gameInfo.totalNumberOfDifferences / 2))
                this.socketManagerService.sio.to(params.gameRoomId).emit('end-multiplayer-game', params.socket.id, params.socket.playerName);
            if (params.socket.numberOfDifferencesFound === params.socket.gameInfo.totalNumberOfDifferences)
                this.socketManagerService.sio.to(params.gameRoomId).emit('close-game');
        } else if (result.isDifferent) {
            await this.gameProviderService.provideNextLimitedGame(params.socket, params.gameRoomId);
        }
        if (!isClassicGame)
            this.changeLimitedTimer({ socket: params.socket, isDifferent: result.isDifferent, gameRoomId: params.gameRoomId, hintAsked: false });
    }

    changeLimitedTimer = (params: ChangeLimitedTimerArgs) => {
        const isClassicGame = !params.socket.gameInfo.playedIndexes;
        if (params.isDifferent) {
            params.socket.gameInfo.timer += params.socket.gameInfo.constants.bonusTime as number;
        } else if (params.hintAsked) {
            if (isClassicGame) {
                params.socket.gameInfo.timer += params.socket.gameInfo.constants.penaltyTime as number;
            } else {
                params.socket.gameInfo.timer -= params.socket.gameInfo.constants.penaltyTime as number;
            }
        }
        params.socket.gameInfo.timer = clamp(params.socket.gameInfo.timer, 0, TWO_MINUTES_IN_SECONDS);
        this.socketManagerService.sio.to(params.gameRoomId).emit('chrono', params.socket.gameInfo.timer);
    };

    filterRemainingDifferences(socket: GameSocket, groupIndex: number): Coordinates[] {
        socket.gameInfo.remainingGroups.delete(groupIndex);

        const remainingDifferentCoordinates: Coordinates[] = [];
        const len = socket.gameInfo.differenceGroups.length;
        for (let i = 0; i < len; i++) {
            if (!socket.gameInfo.remainingGroups.has(i)) continue;
            remainingDifferentCoordinates.push(...socket.gameInfo.differenceGroups[i]);
        }

        return remainingDifferentCoordinates;
    }

    async getHistoryJsonFile(): Promise<HistoryJson> {
        try {
            const file = await fs.readFile(HISTORY_JSON, 'utf-8');
            return JSON.parse(file);
        } catch (e) {
            return { history: [] };
        }
    }

    async writeHistoryInJson(history: GameStats[]): Promise<void> {
        const jsonFile: HistoryJson = { history };
        await fs.writeFile(HISTORY_JSON, JSON.stringify(jsonFile));
    }

    onNewHistory = async (history: GameStats) => {
        try {
            // Check if file already exists
            await fs.access(HISTORY_JSON);
        } catch (e) {
            if (e.code === 'ENOENT' || e.name === 'ENOENT') {
                await this.writeHistoryInJson([]);
            } else {
                throw e;
            }
        }

        const historyJsonFIle = await this.getHistoryJsonFile();
        historyJsonFIle.history.push(history);
        await this.writeHistoryInJson(historyJsonFIle.history);
        this.socketManagerService.sio.emit('new-history-available', [history]);
    };

    onGetHistory = async (socket: GameSocket) => {
        const historyJson = await this.getHistoryJsonFile();
        this.socketManagerService.sio.to(socket.id).emit('new-history-available', historyJson.history);
    };

    onResetHistory = async () => {
        await this.writeHistoryInJson([]);
        this.socketManagerService.sio.emit('reset-history');
    };
}
