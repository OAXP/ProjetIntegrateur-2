import { Score } from '@common/score';
export interface Leaderboard {
    gameId: string;
    leaderboardSolo: Score[];
    leaderboardDuo: Score[];
}
