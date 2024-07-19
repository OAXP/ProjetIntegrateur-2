import { baseLeaderboard, DB_COLLECTION } from '@app/utils/constants';
import { Leaderboard } from '@common/leaderboard';
import { Collection } from 'mongodb';
import { Service } from 'typedi';
import { MongoService } from './mongo.service';

@Service()
export class LeaderboardService {
    constructor(private mongoService: MongoService) {}

    get collection(): Collection {
        return this.mongoService.database.collection(DB_COLLECTION);
    }

    async getLeaderboardById(id: string) {
        const leaderboard = await this.collection.findOne({ gameId: id });
        if (leaderboard === null) {
            this.addLeaderboard({
                gameId: id,
                leaderboardSolo: baseLeaderboard,
                leaderboardDuo: baseLeaderboard,
            });
        }
        return this.collection.findOne({ gameId: id });
    }

    async addLeaderboard(leaderboard: Leaderboard) {
        await this.collection.insertOne(leaderboard);
    }

    async deleteLeaderboards(id: string) {
        return this.collection.findOneAndDelete({ gameId: id });
    }

    async deleteAll() {
        return this.collection.deleteMany({});
    }

    async modifyLeaderboard(id: string, leaderboard: Leaderboard) {
        const filter = { gameId: id };
        await this.collection.updateOne(filter, {
            $set: {
                leaderboardSolo: leaderboard.leaderboardSolo,
                leaderboardDuo: leaderboard.leaderboardDuo,
            },
        });
    }

    async resetLeaderboards(id: string) {
        const filter = { gameId: id };
        await this.collection.updateOne(filter, {
            $set: {
                gameId: id,
                leaderboardSolo: baseLeaderboard,
                leaderboardDuo: baseLeaderboard,
            },
        });
    }
}
