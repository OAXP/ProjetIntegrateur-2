import { DifferencesInfo } from '@app/interfaces/differences-info';
import { GameInfo } from '@app/interfaces/game-info';
import { GameSocket } from '@app/interfaces/game-socket';
import { GameHandlerService } from '@app/services/game-handler.service';
import { SocketManagerService } from '@app/services/socket-manager.service';
import { Coordinates } from '@common/coordinates';
import { GameConstants } from '@common/game-constants';
import { Service } from 'typedi';

@Service()
export class GameProviderService {
    private gameConstant: GameConstants;

    constructor(private socketManagerService: SocketManagerService, private gameHandlerService: GameHandlerService) {
        this.gameConstant = { bonusTime: 5, initialTime: 30, penaltyTime: 5 };
        this.handleSockets();
    }

    get gameConstants(): GameConstants {
        return this.gameConstant;
    }

    set gameConstants(gameConstants: GameConstants) {
        this.gameConstant = gameConstants;
    }

    handleSockets(): void {
        this.socketManagerService.currentSocket.asObservable().subscribe(this.onNewSocket);
    }

    onNewSocket = (socket: GameSocket) => {
        socket.on('timer-updated', (gameConstant: GameConstants) => this.updateTimer(gameConstant));
        socket.on('get-game-constant', () => this.onGetGameConstant(socket));
    };

    provideNextLimitedGame = async (socket: GameSocket, gameRoomId: string) => {
        const games = await this.gameHandlerService.getAllGames();
        const playedIndexes = socket.gameInfo.playedIndexes as Map<number, string>;
        if (playedIndexes.size >= games.length) {
            this.socketManagerService.sio.to(gameRoomId).emit('close-limited-game', true);
            return;
        }
        let index = -1;
        do {
            index = Math.floor(Math.random() * games.length);
        } while (playedIndexes.has(index));
        const game = games[index];
        playedIndexes.set(index, game.id as string);

        const remainingDifferentCoordinates = await this.setupDifferencesInfo(socket, game.id as string);

        this.socketManagerService.sio.to(gameRoomId).emit('next-game-limited', game, remainingDifferentCoordinates);
    };

    setupDifferencesInfo = async (socket: GameSocket, gameId: string): Promise<Coordinates[]> => {
        const differencesInfo = (await this.gameHandlerService.getDifferencesInfo(gameId)) as DifferencesInfo;
        const remainingDifferenceGroups = new Map<string, number>(differencesInfo.remainingDifferenceGroups as [string, number][]);
        const remainingDifferentCoordinates: Coordinates[] = [];
        let index = 0;
        const remainingGroups = new Map<number, number>();
        for (const coords of differencesInfo.groups) {
            remainingGroups.set(index, index);
            for (const coord of coords) remainingDifferentCoordinates.push(coord);
            index++;
        }

        const currentGameInfo: GameInfo | undefined = socket.gameInfo;

        const gameInfo: GameInfo = {
            constants: {
                bonusTime: this.gameConstant.bonusTime,
                initialTime: this.gameConstant.initialTime,
                penaltyTime: this.gameConstant.penaltyTime,
            },
            differenceGroups: differencesInfo.groups,
            intervalId: currentGameInfo?.intervalId ?? ({} as NodeJS.Timeout),
            remainingDifferenceGroups,
            remainingGroups,
            timer: currentGameInfo?.timer ?? 0,
            totalNumberOfDifferences: -1,
            playedIndexes: currentGameInfo?.playedIndexes,
        };

        if (!currentGameInfo) socket.gameInfo = gameInfo;
        else Object.assign(socket.gameInfo, gameInfo);

        return remainingDifferentCoordinates;
    };

    updateTimer = (gameConstant: GameConstants) => {
        this.gameConstant = gameConstant;
        this.socketManagerService.sio.emit('new-timer-constants', this.gameConstant);
    };

    onGetGameConstant = (socket: GameSocket) => {
        this.socketManagerService.sio.to(socket.id).emit('new-timer-constants', this.gameConstant);
    };
}
