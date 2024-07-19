import { GameInfo } from '@app/interfaces/game-info';
import { GameStats } from '@common/game-stats';
import { Socket } from 'socket.io';

export interface GameSocket extends Socket {
    numberOfDifferencesFound: number;
    playerName: string;
    gameInfo: GameInfo;
    gameParams?: GameStats;
}
