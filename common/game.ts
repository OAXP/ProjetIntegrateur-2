import { Player } from '@common/player';
export interface Game {
    id?: string;
    name: string;
    available?: boolean;
    differentPixelsCount: number;
    numberOfDifferences: number;
    difficulty: string;
    image1Url: string;
    image2Url: string;
    differenceImageUrl: string;
    firstPlayer?: Player;
    isOver?: boolean;
}
