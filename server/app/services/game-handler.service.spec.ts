import { DifferencesInfo } from '@app/interfaces/differences-info';
import { GameHandlerService } from '@app/services/game-handler.service';
import * as fm from '@app/utils/file-manager.utils';
import { DifferenceResponse } from '@common/difference-response';
import { Game } from '@common/game';
import { Player } from '@common/player';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { afterEach } from 'mocha';
import { restore, spy, stub } from 'sinon';

describe('Game handler service', () => {
    let gameHandlerService: GameHandlerService;

    const mockGame: Game = {
        id: '1',
        name: 'Game',
        differentPixelsCount: 1,
        numberOfDifferences: 2,
        difficulty: 'facile',
        image1Url: 'url',
        image2Url: 'url2',
        differenceImageUrl: 'diffUrl',
        firstPlayer: new Player(),
    };

    const mockDifferenceResponse: DifferenceResponse = {
        differentPixelsCount: 1,
        numberOfDifferences: 2,
        difficulty: 'facile',
        image1Url: 'url',
        image2Url: 'url2',
        differenceImageUrl: 'diffUrl',
    };

    const mockDifferencesInfo: DifferencesInfo = { groups: [], remainingDifferenceGroups: [], id: '1' };

    beforeEach(() => {
        gameHandlerService = new GameHandlerService();
    });

    afterEach(async () => {
        restore();
    });

    it('saveGame() should create a json file if it does not exist and put the game info', async () => {
        stub(fs, 'access').throws('ENOENT');
        const gameWriteFileStub = stub(gameHandlerService, 'writeGamesInJson').resolves();
        const differenceWriteFileStub = stub(gameHandlerService, 'writeDifferencesInJson').resolves();
        stub(gameHandlerService, 'getCachedDifferenceInfo').resolves({
            groups: [],
            id: '',
            remainingDifferenceGroups: [],
        });
        stub(gameHandlerService, 'getGamesJsonFile').resolves({ games: [] });
        stub(gameHandlerService, 'getDifferencesJsonFile').resolves({ differences: [] });

        await gameHandlerService.saveGame(mockGame);

        expect(gameWriteFileStub.callCount).to.equals(2);
        expect(differenceWriteFileStub.callCount).to.equals(2);
    });

    it('saveGame() should append the games array in the json file if it does exist', async () => {
        stub(fs, 'access').resolves();
        const gameWriteFileStub = stub(gameHandlerService, 'writeGamesInJson').resolves();
        const differenceWriteFileStub = stub(gameHandlerService, 'writeDifferencesInJson').resolves();
        stub(gameHandlerService, 'getCachedDifferenceInfo').resolves({
            groups: [],
            id: '',
            remainingDifferenceGroups: [],
        });
        stub(gameHandlerService, 'getGamesJsonFile').resolves({ games: [] });
        stub(gameHandlerService, 'getDifferencesJsonFile').resolves({ differences: [] });

        await gameHandlerService.saveGame(mockGame);

        expect(gameWriteFileStub.callCount).to.equals(1);
        expect(differenceWriteFileStub.callCount).to.equals(1);
    });

    it('saveGame() should throw an error if it is not ENOENT', async () => {
        stub(fs, 'access').throws('gameError');
        stub(fs, 'readFile').resolves('{ "games": [] }');
        stub(fs, 'writeFile').resolves();

        let error: object = {};
        try {
            await gameHandlerService.saveGame(mockGame);
        } catch (e) {
            error = e;
        }

        expect(error).to.have.property('name').equals('gameError');
    });

    it('sendGames() should return an array of games found in the games json', async () => {
        stub(fs, 'readFile').resolves('{ "games": [] }');
        const result = await gameHandlerService.getAllGames();

        expect(result).to.deep.equals([]);
    });

    it('deleteGame() should return true if the game was deleted', async () => {
        stub(gameHandlerService, 'getGamesJsonFile').resolves({ games: [mockGame] });
        stub(gameHandlerService, 'getDifferencesJsonFile').resolves({ differences: [] });
        stub(fm, 'deleteImages').resolves();
        stub(gameHandlerService, 'writeGamesInJson').resolves();
        stub(gameHandlerService, 'writeDifferencesInJson').resolves();
        const result = await gameHandlerService.deleteGame('1');

        expect(result).to.equals(true);
    });

    it('deleteGame() should return false if the game was not found', async () => {
        stub(gameHandlerService, 'getGamesJsonFile').resolves({ games: [] });
        stub(gameHandlerService, 'getDifferencesJsonFile').resolves({ differences: [] });
        stub(gameHandlerService, 'writeGamesInJson').resolves();
        stub(gameHandlerService, 'writeDifferencesInJson').resolves();
        const result = await gameHandlerService.deleteGame('2');

        expect(result).to.equals(false);
    });

    it('cancelGame() should use deleteImages to delete all 3 created files and fs.rm to remove cache', async () => {
        const deleteImagesSpy = spy(fm, 'deleteImages');
        const fsRmSpy = spy(fs, 'rm');
        await gameHandlerService.cancelGame(mockDifferenceResponse);

        expect(deleteImagesSpy.called).equals(true);
        expect(fsRmSpy.called).equals(true);
    });

    it('getCachedDifferenceInfo() should delete and return the cached DifferencesInfo', async () => {
        stub(fs, 'readFile').resolves(JSON.stringify(mockDifferencesInfo));
        const fsRmSpy = spy(fs, 'rm');
        const result = await gameHandlerService.getCachedDifferenceInfo('');
        expect(fsRmSpy.called).to.equals(true);
        expect(result).to.deep.equals(mockDifferencesInfo);
    });

    it('getDifferencesInfo() should return the good DifferencesInfo for the id', async () => {
        const differencesInfo = { differences: [mockDifferencesInfo] };
        stub(fs, 'readFile').resolves(JSON.stringify(differencesInfo));
        const result = await gameHandlerService.getDifferencesInfo('1');

        expect(result).to.deep.equals(mockDifferencesInfo);
    });

    it('getDifferencesInfo() should return undefined if the id was not found', async () => {
        const mockDifferencesInfo2 = structuredClone(mockDifferencesInfo);
        mockDifferencesInfo2.id = '2';
        const differencesInfo = { differences: [mockDifferencesInfo2] };
        stub(fs, 'readFile').resolves(JSON.stringify(differencesInfo));
        const result = await gameHandlerService.getDifferencesInfo('1');

        expect(result).to.equals(undefined);
    });

    it('getDifferencesIndexBasedOnGameId() should provide the correct index for the id', async () => {
        const differences: DifferencesInfo[] = [mockDifferencesInfo];
        const result = await gameHandlerService.getDifferencesIndexBasedOnGameId(differences, '1');
        expect(result).to.equals(0);
    });

    it('getGameIndexBasedOnGameId() should provide the correct index for the id', async () => {
        const games: Game[] = [mockGame];
        const result = await gameHandlerService.getGameIndexBasedOnGameId(games, '1');
        expect(result).to.equals(0);
    });

    it('getGamesJsonFile() should return the games', async () => {
        const games: Game[] = [mockGame];
        stub(fs, 'readFile').resolves(JSON.stringify({ games }));
        const result = await gameHandlerService.getGamesJsonFile();
        expect(result['games']).to.deep.equals(games);
    });

    it('getGamesJsonFile() should return empty games if the file is not found', async () => {
        stub(fs, 'readFile').throws();
        const result = await gameHandlerService.getGamesJsonFile();
        expect(result['games']).to.deep.equals([]);
    });

    it('getDifferencesJsonFile() should return the differences', async () => {
        const differences: DifferencesInfo[] = [mockDifferencesInfo];
        stub(fs, 'readFile').resolves(JSON.stringify({ differences }));
        const result = await gameHandlerService.getDifferencesJsonFile();
        expect(result['differences']).to.deep.equals(differences);
    });

    it('getDifferencesJsonFile() should return empty differences if the file is not found', async () => {
        stub(fs, 'readFile').throws();
        const result = await gameHandlerService.getDifferencesJsonFile();
        expect(result['differences']).to.deep.equals([]);
    });

    it('writeGamesInJson() should call fs.writeFile', async () => {
        const fsWriteFileStub = stub(fs, 'writeFile').resolves();
        await gameHandlerService.writeGamesInJson([]);
        expect(fsWriteFileStub.called).to.equals(true);
    });

    it('writeDifferencesInJson() should call fs.writeFile', async () => {
        const fsWriteFileStub = stub(fs, 'writeFile').resolves();
        await gameHandlerService.writeDifferencesInJson([]);
        expect(fsWriteFileStub.called).to.equals(true);
    });

    it('deleteGames should call deleteFolder, writeGamesInJson and writeDifferencesInJson', async () => {
        const fsRmStub = stub(fs, 'rm').resolves();
        const writeGamesInJsonStub = stub(gameHandlerService, 'writeGamesInJson').resolves();
        const writeDifferencesInJsonStub = stub(gameHandlerService, 'writeDifferencesInJson').resolves();
        await gameHandlerService.deleteGames();
        expect(fsRmStub.called).to.equals(true);
        expect(writeGamesInJsonStub.called).to.equals(true);
        expect(writeDifferencesInJsonStub.called).to.equals(true);
    });
});
