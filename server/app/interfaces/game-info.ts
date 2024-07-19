import { Coordinates } from '@common/coordinates';
import { GameConstants } from '@common/game-constants';
import { GameMode } from '@common/game-stats';

export interface GameInfo {
    constants: GameConstants;
    timer: number;
    intervalId: NodeJS.Timeout;
    playedIndexes?: Map<number, string>;
    remainingDifferenceGroups: Map<string, number>;
    remainingGroups: Map<number, number>;
    differenceGroups: Coordinates[][];
    totalNumberOfDifferences: number;
    gameRoomId?: string;
    mode?: GameMode;
}
