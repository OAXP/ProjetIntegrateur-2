import { baseLeaderboard } from '@app/utils/constants';
import { Leaderboard } from '@common/leaderboard';
import { expect } from 'chai';
import { afterEach } from 'mocha';
import { Collection } from 'mongodb';
import { restore, stub } from 'sinon';
import { LeaderboardService } from './leaderboard.service';
import { MongoService } from './mongo.service';

describe('Leaderboard service', () => {
    let leaderboardService: LeaderboardService;
    let mongoService: MongoService;
    const mockLeaderboard: Leaderboard = {
        gameId: '1',
        leaderboardSolo: baseLeaderboard,
        leaderboardDuo: baseLeaderboard,
    };

    beforeEach(async () => {
        mongoService = new MongoService();
        leaderboardService = new LeaderboardService(mongoService);
        await mongoService.start();
    });

    afterEach(async () => {
        restore();
        mongoService.closeConnection();
    });

    it('getLeaderboardById should call findOne', async () => {
        const findOneStub = stub(Collection.prototype, 'findOne').resolves();
        leaderboardService.getLeaderboardById(mockLeaderboard.gameId);
        expect(findOneStub.called).to.equals(true);
    });

    it('getLeaderboardById should call addLeaderboard if findOne returns null', async () => {
        stub(Collection.prototype, 'findOne').callsFake(() => {
            return null;
        });
        const addStub = stub(leaderboardService, 'addLeaderboard').resolves();
        await leaderboardService.getLeaderboardById(mockLeaderboard.gameId);
        expect(addStub.called).to.equals(true);
    });

    it('addLeaderboardById should call insertOne', async () => {
        const insertStub = stub(Collection.prototype, 'insertOne').resolves();
        leaderboardService.addLeaderboard(mockLeaderboard);
        expect(insertStub.called).to.equal(true);
    });

    it('deleteLeaderboards should call findOneAndDelete', async () => {
        const deleteStub = stub(Collection.prototype, 'findOneAndDelete').resolves();
        leaderboardService.deleteLeaderboards(mockLeaderboard.gameId);
        expect(deleteStub.called).to.equal(true);
    });

    it('deleteAll should call deleteMany', async () => {
        const deleteStub = stub(Collection.prototype, 'deleteMany').resolves();
        leaderboardService.deleteAll();
        expect(deleteStub.called).to.equal(true);
    });

    it('modifyLeaderboard should call updateOne', async () => {
        const modifyStub = stub(Collection.prototype, 'updateOne').resolves();
        leaderboardService.modifyLeaderboard(mockLeaderboard.gameId, mockLeaderboard);
        expect(modifyStub.called).to.equal(true);
    });

    it('resetLeaderboards should call updateOne', async () => {
        const resetStub = stub(Collection.prototype, 'updateOne').resolves();
        leaderboardService.resetLeaderboards(mockLeaderboard.gameId);
        expect(resetStub.called).to.equal(true);
    });
});
