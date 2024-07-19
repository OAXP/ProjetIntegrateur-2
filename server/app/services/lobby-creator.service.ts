/* eslint-disable max-params */
import { DifferencesInfo } from '@app/interfaces/differences-info';
import { GameInfo } from '@app/interfaces/game-info';
import { GameSocket } from '@app/interfaces/game-socket';
import { GameHandlerService } from '@app/services/game-handler.service';
import { GameProviderService } from '@app/services/game-provider.service';
import { SocketManagerService } from '@app/services/socket-manager.service';
import { SECOND_IN_MILLISECONDS } from '@app/utils/constants';
import { getRandomString } from '@app/utils/math.utils';
import { Coordinates } from '@common/coordinates';
import { Game } from '@common/game';
import { GameConstants } from '@common/game-constants';
import { GameMode, GameStats } from '@common/game-stats';
import { LobbyModes } from '@common/lobby-modes';
import { Player } from '@common/player';
import { Service } from 'typedi';
import { LobbyHandlerService } from './lobby-handler.service';

interface CreateGameArgs {
    socket: GameSocket;
    gameId: string;
    gameMode: LobbyModes;
    playerName: string;
}

interface LimitedGameInfo {
    gameRoomId: string;
    game: Game;
    remainingDifferentCoordinates: Coordinates[];
}

@Service()
export class LobbyCreatorService {
    private secondPlayerSocket: Map<string, GameSocket[]> = new Map<string, GameSocket[]>();
    private secondPlayerName: Map<string, string> = new Map<string, string>();
    private waitingCoopSockets: GameSocket[] = [];
    constructor(
        private socketManagerService: SocketManagerService,
        private gameHandlerService: GameHandlerService,
        private gameProviderService: GameProviderService,
        private lobbyHandlerService: LobbyHandlerService,
    ) {}

    handleSockets(): void {
        this.socketManagerService.currentSocket.asObservable().subscribe(this.onNewSocket);
    }

    onNewSocket = (socket: GameSocket) => {
        socket.on('create-game-room', async (gameId: string, gameMode: LobbyModes, playerName: string) =>
            this.createGame({ socket, gameId, gameMode, playerName }),
        );
        socket.on('close-game-room', (gameRoomId: string, wasAbandoned?: boolean) => this.closeGame(socket, gameRoomId, wasAbandoned));
        socket.on('disconnect', () => this.onDisconnect(socket));
        socket.on('request-joining-game', async (gameInfo: string[]) => this.requestSecondPlayer(socket, gameInfo));
        socket.on('second-player-accepted', async (gameId: string) => this.startGame(socket, gameId));
        socket.on('cancel-game-creation', async (gameId: string) => this.deleteGame(gameId));
        socket.on('reject-second-player', async (gameId: string) => this.rejectSecondPlayer(gameId));
        socket.on('cancel-game-request', async (gameId: string) => this.cancelGameRequest(socket, gameId));
        socket.on('request-coop', async (playerName: string) => this.onRequestCoop(socket, playerName));
        socket.on('remove-coop', this.onRemoveCoop);
        socket.on('end-coop-game', (gameRoomId: string) => this.onEndCoopGame(socket, gameRoomId));
    };

    onDisconnect(socket: GameSocket): void {
        if (socket.gameInfo) {
            if (socket.gameInfo.mode === GameMode.ClassicSolo || socket.gameInfo.mode === GameMode.LimitedSolo) {
                const startTime: number = socket.gameParams?.startTime as number;
                const gameStat: GameStats = {
                    startTime,
                    duration: Date.now() - startTime,
                    mode: socket.gameInfo.mode,
                    firstPlayerName: socket.playerName,
                    quitter: socket.playerName,
                };
                this.lobbyHandlerService.onNewHistory(gameStat);
            } else this.closeGame(socket, socket.gameInfo.gameRoomId as string, true);
        }
    }

    onRequestCoop = async (socket: GameSocket, playerName: string) => {
        socket.playerName = playerName;
        if (this.waitingCoopSockets.length > 0) {
            // prepare game and send names
            const otherSocket = this.waitingCoopSockets.shift() as GameSocket;
            const { gameRoomId, game, remainingDifferentCoordinates } = await this.createLimitedGame({
                socket,
                gameId: '',
                gameMode: LobbyModes.LimitedDuo,
                playerName,
            });
            const gameParams: GameStats = {
                startTime: Date.now(),
                duration: 0,
                mode: GameMode.LimitedDuo,
                firstPlayerName: otherSocket.playerName,
                secondPlayerName: playerName,
            };
            otherSocket.gameInfo = socket.gameInfo;
            otherSocket.join(gameRoomId);
            otherSocket.emit('send-game-room-id', gameRoomId);
            this.socketManagerService.sio.to(gameRoomId).emit('send-names', socket.playerName, otherSocket.playerName);
            this.socketManagerService.sio.to(gameRoomId).emit('game-found-coop', game);
            this.socketManagerService.sio
                .to(gameRoomId)
                .emit('start-game', { roomId: gameRoomId, remainingDifferentCoordinates, mode: LobbyModes.LimitedDuo, gameParams });
            return;
        }
        this.waitingCoopSockets.push(socket);
    };

    onRemoveCoop = () => {
        this.waitingCoopSockets.shift(); // Should only be one
    };

    async createLimitedGame(params: CreateGameArgs): Promise<LimitedGameInfo> {
        const gameRoomId = params.socket.id + getRandomString();
        params.socket.join(gameRoomId);
        // Select random game START
        const games = await this.gameHandlerService.getAllGames();
        const randomIndex = Math.floor(Math.random() * games.length);
        const game = games[randomIndex];
        const remainingDifferentCoordinates = await this.gameProviderService.setupDifferencesInfo(params.socket, game.id as string);
        params.socket.gameInfo.playedIndexes = new Map<number, string>();
        params.socket.gameInfo.playedIndexes.set(randomIndex, game.id as string);
        // Select random game END
        params.socket.emit('send-game-room-id', gameRoomId);
        params.socket.gameInfo.gameRoomId = gameRoomId;
        params.socket.gameInfo.timer = (params.socket.gameInfo.constants as GameConstants).initialTime;
        const gameInfo = params.socket.gameInfo;
        params.socket.gameInfo.intervalId = setInterval(() => {
            this.socketManagerService.sio.to(gameRoomId).emit('chrono', --gameInfo.timer);
            if (gameInfo.timer <= 0) {
                this.socketManagerService.sio.to(gameRoomId).emit('close-limited-game', false);
                this.clearGameInfo(gameInfo);
            }
        }, SECOND_IN_MILLISECONDS);

        if (params.gameMode === LobbyModes.LimitedSolo) {
            const gameParams: GameStats = {
                startTime: Date.now(),
                duration: 0,
                mode: GameMode.LimitedSolo,
                firstPlayerName: params.playerName,
            };
            params.socket.gameParams = gameParams;
            params.socket.gameInfo.mode = GameMode.LimitedSolo;
            this.socketManagerService.sio.to(gameRoomId).emit('init-game-limited', game);
            this.socketManagerService.sio
                .to(gameRoomId)
                .emit('start-game', { roomId: gameRoomId, remainingDifferentCoordinates, mode: LobbyModes.LimitedSolo, gameParams });
        }

        return { gameRoomId, game, remainingDifferentCoordinates };
    }

    async createGame(params: CreateGameArgs): Promise<void> {
        params.socket.playerName = params.playerName;
        if (params.gameMode === LobbyModes.LimitedSolo || params.gameMode === LobbyModes.LimitedDuo) {
            await this.createLimitedGame(params);
            return;
        }
        const gameRoomId = params.socket.id;
        params.socket.join(gameRoomId);
        const remainingDifferentCoordinates = await this.gameProviderService.setupDifferencesInfo(params.socket, params.gameId);
        params.socket.emit('send-game-room-id', gameRoomId);
        const gameParams: GameStats = {
            startTime: 0,
            mode: GameMode.ClassicSolo,
            duration: 0,
            firstPlayerName: params.playerName,
        };
        switch (params.gameMode) {
            case LobbyModes.ClassicSolo:
                params.socket.gameInfo.timer = 0;
                params.socket.gameInfo.totalNumberOfDifferences = params.socket.gameInfo.remainingGroups.size;
                params.socket.gameInfo.mode = GameMode.ClassicSolo;
                params.socket.gameInfo.intervalId = setInterval(() => {
                    params.socket.emit('chrono', ++params.socket.gameInfo.timer);
                }, SECOND_IN_MILLISECONDS);
                gameParams.startTime = Date.now();
                params.socket.gameParams = gameParams;
                this.socketManagerService.sio
                    .to(gameRoomId)
                    .emit('start-game', { roomId: gameRoomId, remainingDifferentCoordinates, mode: LobbyModes.ClassicSolo, gameParams });
                break;
            case LobbyModes.ClassicDuo: {
                const games = await this.gameHandlerService.getAllGames();
                const newGameIndex = await this.gameHandlerService.getGameIndexBasedOnGameId(games, params.gameId);
                games[newGameIndex].available = true;
                games[newGameIndex].firstPlayer = new Player(params.socket.id);
                await this.gameHandlerService.writeGamesInJson(games);
                params.socket.broadcast.emit('game-created', params.gameId);
                break;
            }
        }
    }

    clearGameInfo(gameInfo: GameInfo) {
        gameInfo.remainingDifferenceGroups.clear();
        gameInfo.remainingGroups.clear();
        gameInfo.differenceGroups = [];
        gameInfo.totalNumberOfDifferences = 0;
        gameInfo.playedIndexes = undefined;
        gameInfo.gameRoomId = undefined;
        clearInterval(gameInfo.intervalId);
    }

    onEndCoopGame = (socket: GameSocket, gameRoomId: string) => {
        socket.leave(gameRoomId);
    };

    closeGame(socket: GameSocket, gameRoomId: string, wasAbandoned?: boolean) {
        const isClassicGame = !socket.gameInfo.playedIndexes;
        const intervalId = socket.gameInfo.intervalId;
        socket.gameInfo = {} as GameInfo;
        socket.playerName = '';
        socket.numberOfDifferencesFound = 0;
        socket.leave(gameRoomId);
        if (isClassicGame) clearInterval(intervalId);
        else if (wasAbandoned) this.socketManagerService.sio.to(gameRoomId).emit('coop-left');

        if (this.socketManagerService.sio.sockets.adapter.rooms.get(gameRoomId)?.size === 1 && wasAbandoned && isClassicGame)
            this.socketManagerService.sio.to(gameRoomId).emit('end-multiplayer-game', socket.id, undefined, wasAbandoned);
    }

    async requestSecondPlayer(socket: GameSocket, gameInfo: string[]): Promise<void> {
        socket.playerName = gameInfo[1];
        const games = await this.gameHandlerService.getAllGames();
        const newGameIndex = await this.gameHandlerService.getGameIndexBasedOnGameId(games, gameInfo[0]);
        const currentGame = games[newGameIndex];
        if (!(currentGame.firstPlayer as Player).socketId.length) this.socketManagerService.sio.to(socket.id).emit('alert-game-no-longer-exist');
        this.secondPlayerName.set(socket.id, gameInfo[1]);
        const roomId = (currentGame.firstPlayer as Player).socketId;
        const waitingPlayers = this.secondPlayerSocket.get(roomId) ?? [];
        const oldestPlayerWaiting: GameSocket = waitingPlayers && waitingPlayers.length > 0 ? (waitingPlayers[0] as GameSocket) : socket;
        this.secondPlayerSocket.set(roomId, [...(waitingPlayers as GameSocket[]), ...[socket]]);
        socket.join(roomId);
        this.socketManagerService.sio.to(roomId).emit('player-request', this.secondPlayerName.get(oldestPlayerWaiting.id));
    }

    async startGame(player1Socket: GameSocket, gameId: string): Promise<void> {
        const gameParams: GameStats = {
            startTime: 0,
            mode: GameMode.ClassicDuo,
            duration: 0,
            firstPlayerName: player1Socket.playerName,
        };
        const games = await this.gameHandlerService.getAllGames();
        const newGameIndex = await this.gameHandlerService.getGameIndexBasedOnGameId(games, gameId);
        const currentGame = games[newGameIndex];
        currentGame.available = false;
        const roomId = (currentGame.firstPlayer as Player).socketId;
        currentGame.firstPlayer = new Player();
        games[newGameIndex] = currentGame;
        await this.gameHandlerService.writeGamesInJson(games);
        const player2Socket = this.secondPlayerSocket.get(roomId)?.shift() as GameSocket;
        gameParams.secondPlayerName = player2Socket.playerName;
        this.secondPlayerSocket
            .get(roomId)
            ?.forEach((socket: GameSocket) => this.socketManagerService.sio.to(socket.id).emit('alert-game-no-longer-exist'));
        this.emptySecondPlayerSocket(roomId);
        player2Socket.gameInfo = player1Socket.gameInfo;

        const totalNumGroups = player1Socket.gameInfo.remainingGroups.size;
        player1Socket.numberOfDifferencesFound = 0;
        player2Socket.numberOfDifferencesFound = 0;
        player1Socket.gameInfo.gameRoomId = roomId;
        player2Socket.gameInfo.gameRoomId = roomId;
        player1Socket.gameInfo.totalNumberOfDifferences = totalNumGroups;
        player1Socket.gameInfo.timer = 0;
        player1Socket.gameInfo.intervalId = setInterval(() => {
            this.socketManagerService.sio.to(roomId).emit('chrono', ++player1Socket.gameInfo.timer);
        }, SECOND_IN_MILLISECONDS);

        const differencesInfo = (await this.gameHandlerService.getDifferencesInfo(gameId)) as DifferencesInfo;
        const remainingDifferentCoordinates: Coordinates[] = [];
        for (const coordinates of differencesInfo.groups) {
            for (const coordinate of coordinates) remainingDifferentCoordinates.push(coordinate);
        }
        gameParams.startTime = Date.now();
        this.socketManagerService.sio
            .to(roomId)
            .emit('start-game', { roomId, remainingDifferentCoordinates, mode: LobbyModes.ClassicDuo, gameParams });
        this.socketManagerService.sio.to(roomId).emit('send-names', player1Socket.playerName, player2Socket.playerName);
        this.socketManagerService.sio.except(roomId).emit('game-started', gameId);
    }

    async deleteGame(gameId: string): Promise<void> {
        const games = await this.gameHandlerService.getAllGames();
        const gameIndex = await this.gameHandlerService.getGameIndexBasedOnGameId(games, gameId);
        const roomId = (games[gameIndex].firstPlayer as Player).socketId;
        games[gameIndex].firstPlayer = new Player();
        games[gameIndex].available = false;
        await this.gameHandlerService.writeGamesInJson(games);
        this.socketManagerService.sio.to(roomId).emit('alert-game-no-longer-exist', roomId);
        this.emptySecondPlayerSocket(roomId);
        this.socketManagerService.sio.emit('game-cancel', gameId);
    }

    async rejectSecondPlayer(gameId: string): Promise<void> {
        const games = await this.gameHandlerService.getAllGames();
        const gameIndex = await this.gameHandlerService.getGameIndexBasedOnGameId(games, gameId);
        const roomId = (games[gameIndex].firstPlayer as Player).socketId;
        const waitingPlayers = this.secondPlayerSocket.get(roomId);
        const oldestPlayerWaiting: GameSocket | undefined = waitingPlayers && waitingPlayers.length > 0 ? waitingPlayers.shift() : undefined;
        if (oldestPlayerWaiting) {
            oldestPlayerWaiting.leave(roomId);
            this.socketManagerService.sio.to(oldestPlayerWaiting.id).emit('second-player-rejected', gameId);
        }
        await this.gameHandlerService.writeGamesInJson(games);
        if (waitingPlayers && waitingPlayers.length > 0)
            this.socketManagerService.sio.to(roomId).emit('player-request', this.secondPlayerName.get(waitingPlayers[0].id));
    }

    async cancelGameRequest(socket: GameSocket, gameId: string): Promise<void> {
        const games = await this.gameHandlerService.getAllGames();
        const gameIndex = await this.gameHandlerService.getGameIndexBasedOnGameId(games, gameId);
        const roomId = (games[gameIndex].firstPlayer as Player).socketId;
        let waitingPlayers = this.secondPlayerSocket.get(roomId);
        if (waitingPlayers) {
            waitingPlayers = waitingPlayers.filter((gameSocket: GameSocket) => gameSocket.id !== socket.id);
            this.secondPlayerSocket.set(roomId, waitingPlayers);
            if (!waitingPlayers.length) this.socketManagerService.sio.to(roomId).emit('request-canceled');
            else this.socketManagerService.sio.to(roomId).emit('player-request', this.secondPlayerName.get(waitingPlayers[0].id));
        }
        socket.leave(roomId);
        this.secondPlayerName.delete(this.secondPlayerName.get(socket.id) as string);
    }

    emptySecondPlayerSocket(roomId: string): void {
        const secondPlayerSocket = this.secondPlayerSocket.get(roomId);
        if (secondPlayerSocket) {
            secondPlayerSocket.forEach((socket: GameSocket) => socket.leave(roomId));
            this.secondPlayerSocket.delete(roomId);
        }
    }
}
