import { DifferencesInfo } from '@app/interfaces/differences-info';
import { DifferencesJson } from '@app/interfaces/differences-json';
import { GamesJson } from '@app/interfaces/games-json';
import { DIFFERENCES_JSON, GAMES_JSON } from '@app/utils/constants';
import { deleteFolder, deleteImages } from '@app/utils/file-manager.utils';
import { DifferenceResponse } from '@common/difference-response';
import { Game } from '@common/game';
import { promises as fs } from 'fs';
import { Service } from 'typedi';

@Service()
export class GameHandlerService {
    async deleteGame(gameId: string): Promise<boolean> {
        const games: Game[] = (await this.getGamesJsonFile()).games;
        const gameIndex = await this.getGameIndexBasedOnGameId(games, gameId);
        const differences: DifferencesInfo[] = (await this.getDifferencesJsonFile()).differences;
        const diffInfoIndex = await this.getDifferencesIndexBasedOnGameId(differences, gameId);
        const ERROR_INDEX = -1;

        if (gameIndex === ERROR_INDEX) {
            return false;
        }

        const game = games[gameIndex];

        await deleteImages(game.image1Url, game.image2Url, game.differenceImageUrl);

        games.splice(gameIndex, 1);
        differences.splice(diffInfoIndex, 1);

        await this.writeGamesInJson(games);
        await this.writeDifferencesInJson(differences);

        return true;
    }

    async deleteGames() {
        await deleteFolder();
        await this.writeGamesInJson([]);
        await this.writeDifferencesInJson([]);
    }

    async saveGame(gameInfo: Game): Promise<void> {
        try {
            // Check if file already exists
            await fs.access(GAMES_JSON);
            await fs.access(DIFFERENCES_JSON);
        } catch (e) {
            if (e.code === 'ENOENT' || e.name === 'ENOENT') {
                await this.writeGamesInJson([]);
                await this.writeDifferencesInJson([]);
            } else {
                throw e;
            }
        }

        const gamesJsonFile = await this.getGamesJsonFile();
        const differencesJsonFile = await this.getDifferencesJsonFile();

        const cachedDifferenceInfo = await this.getCachedDifferenceInfo(gameInfo.id as string);

        gamesJsonFile.games.push(gameInfo);
        differencesJsonFile.differences.push(cachedDifferenceInfo);
        await this.writeGamesInJson(gamesJsonFile.games);
        await this.writeDifferencesInJson(differencesJsonFile.differences);
    }

    async getCachedDifferenceInfo(id: string): Promise<DifferencesInfo> {
        const filePath = 'assets/' + id + '.json';
        const file = await fs.readFile(filePath, 'utf-8');
        const differencesInfo: DifferencesInfo = JSON.parse(file);

        await fs.rm(filePath, { force: true }); // Deleted cached DiffInfo
        return differencesInfo;
    }

    async cancelGame(data: DifferenceResponse): Promise<void> {
        await deleteImages(data.image1Url, data.image2Url, data.differenceImageUrl);
        await fs.rm('assets/' + data.id + '.json', { force: true });
    }

    async getDifferencesInfo(id: string): Promise<DifferencesInfo | undefined> {
        // read
        const file = await fs.readFile(DIFFERENCES_JSON, 'utf-8');
        const differences: DifferencesInfo[] = JSON.parse(file).differences;

        let result: DifferencesInfo | undefined;
        const len = differences.length; // For loop instead of find() for performance (large array)
        for (let i = 0; i < len; i++) {
            if (differences[i].id === id) {
                result = differences[i];
                break;
            }
        }

        return result;
    }

    async getGameIndexBasedOnGameId(games: Game[], gameId: string): Promise<number> {
        return games.findIndex((game: Game) => game.id === gameId);
    }

    async getDifferencesIndexBasedOnGameId(differences: DifferencesInfo[], gameId: string): Promise<number> {
        return differences.findIndex((difference: DifferencesInfo) => difference.id === gameId);
    }

    async getGamesJsonFile(): Promise<GamesJson> {
        try {
            const file = await fs.readFile(GAMES_JSON, 'utf-8');
            return JSON.parse(file);
        } catch (e) {
            return { games: [] };
        }
    }

    async getDifferencesJsonFile(): Promise<DifferencesJson> {
        try {
            const file = await fs.readFile(DIFFERENCES_JSON, 'utf-8');
            return JSON.parse(file);
        } catch (e) {
            return { differences: [] };
        }
    }

    async getAllGames(): Promise<Game[]> {
        const jsonFile = await this.getGamesJsonFile();
        return jsonFile['games'];
    }

    async writeGamesInJson(games: Game[]): Promise<void> {
        const jsonFile: GamesJson = { games };
        await fs.writeFile(GAMES_JSON, JSON.stringify(jsonFile));
    }

    async writeDifferencesInJson(differences: DifferencesInfo[]): Promise<void> {
        const jsonFile: DifferencesJson = { differences };
        await fs.writeFile(DIFFERENCES_JSON, JSON.stringify(jsonFile));
    }
}
