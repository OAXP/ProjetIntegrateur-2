export enum GameMode {
    ClassicSolo = 'Solo Classique',
    ClassicDuo = 'Duo Classique',
    LimitedSolo = 'Solo Limité',
    LimitedDuo = 'Duo Limité',
}

export interface GameStats {
    startTime: number;
    duration: number;
    mode: GameMode;
    firstPlayerName: string;
    secondPlayerName?: string;
    winnerPlayerName?: string;
    quitter?: string;
}
