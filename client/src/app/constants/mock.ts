import { Game } from '@common/game';
import { GameMode, GameStats } from '@common/game-stats';
import { Player } from '@common/player';

export const gameMock1: Game = {
    id: '1',
    name: 'Car',
    difficulty: 'facile',
    differentPixelsCount: 50,
    numberOfDifferences: 3,
    image1Url: '',
    image2Url: '',
    differenceImageUrl: '',
    firstPlayer: new Player(),
    available: true,
};

export const gameMock2: Game = {
    id: '2',
    name: 'Doggo',
    difficulty: 'intermédiaire',
    differentPixelsCount: 5,
    numberOfDifferences: 3,
    image1Url: '',
    image2Url: '',
    differenceImageUrl: '',
    firstPlayer: new Player(),
};

export const gamesMock1: Game[] = [gameMock1, gameMock2];

export const gamesMock2: Game[] = [gameMock1, gameMock2, gameMock2, gameMock2, gameMock2, gameMock1, gameMock1, gameMock1];

export const START_TIME_MOCK = 1680636368;

export const gameStats1: GameStats = {
    startTime: START_TIME_MOCK,
    duration: 10.564,
    mode: GameMode.ClassicDuo,
    firstPlayerName: 'Louis',
    secondPlayerName: 'Yoda',
    quitter: 'Yoda',
};

export const gameStats2: GameStats = {
    startTime: START_TIME_MOCK,
    duration: 10.564,
    mode: GameMode.ClassicDuo,
    firstPlayerName: 'Louis',
    secondPlayerName: 'Yoda',
    winnerPlayerName: 'Louis',
};

export const gameStats3: GameStats = {
    startTime: START_TIME_MOCK,
    duration: 10.564,
    mode: GameMode.LimitedDuo,
    firstPlayerName: 'Louis',
    secondPlayerName: 'Yoda',
};

export const gameStatsMock: GameStats[] = [gameStats1];
