import { Application } from '@app/app';
import { LeaderboardService } from '@app/services/leaderboard.service';
import { baseLeaderboard } from '@app/utils/constants';
import { Leaderboard } from '@common/leaderboard';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import { afterEach } from 'mocha';
import { createStubInstance, restore, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

describe('LeaderboardController', () => {
    let leaderboardService: SinonStubbedInstance<LeaderboardService>;
    let expressApp: Express.Application;

    const mockLeaderboard: Leaderboard = {
        gameId: '1',
        leaderboardSolo: baseLeaderboard,
        leaderboardDuo: baseLeaderboard,
    };

    beforeEach(async () => {
        leaderboardService = createStubInstance(LeaderboardService);
        const app = Container.get(Application);
        Object.defineProperty(app['leaderboardController'], 'leaderboardService', { value: leaderboardService });
        expressApp = app.app;
    });
    afterEach(() => {
        restore();
    });

    it('should return a leaderboard on valid get request to /api/leaderboards/:id', async () => {
        leaderboardService.getLeaderboardById.resolves();
        return supertest(expressApp)
            .get('/api/leaderboards/id')
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal('');
            });
    });

    it('should return NO CONTENT if there is no file on get request to /api/leaderboards/:id', async () => {
        leaderboardService.getLeaderboardById.throws('ENOENT');
        return supertest(expressApp).get('/api/leaderboards/id').expect(StatusCodes.NO_CONTENT);
    });

    it('should return Internal Server Error if there is any error on the server on get request to /api/leaderboards/:id', async () => {
        leaderboardService.getLeaderboardById.throws();
        return supertest(expressApp).get('/api/leaderboards/id').expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should add a leaderboard on valid post request to /api/leaderboards/add', async () => {
        leaderboardService.addLeaderboard.resolves();
        return supertest(expressApp)
            .post('/api/leaderboards/add')
            .send(mockLeaderboard)
            .set('Accept', 'application/json')
            .expect(StatusCodes.CREATED);
    });

    it('should return an error on invalid post request to /api/leaderboards/add', async () => {
        leaderboardService.addLeaderboard.rejects();
        return supertest(expressApp)
            .post('/api/leaderboards/add')
            .send(mockLeaderboard)
            .set('Accept', 'application/json')
            .expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return NO CONTENT if leaderboard was deleted on delete request to /api/leaderboards/:id', async () => {
        leaderboardService.deleteLeaderboards.resolves();
        return supertest(expressApp).delete('/api/leaderboards/123').expect(StatusCodes.NO_CONTENT);
    });

    it('should return NOT_FOUND if there is any error on the server on delete request to /api/leaderboards/:id', async () => {
        leaderboardService.deleteLeaderboards.throws();
        return supertest(expressApp).delete('/api/leaderboards/1234').expect(StatusCodes.NOT_FOUND);
    });

    it('should return NO CONTENT if leaderboard was deleted on delete request to /api/leaderboards/', async () => {
        leaderboardService.deleteAll.resolves();
        return supertest(expressApp).delete('/api/leaderboards/').expect(StatusCodes.NO_CONTENT);
    });

    it('should return NOT_FOUND if there is any error on the server on delete request to /api/leaderboards/', async () => {
        leaderboardService.deleteAll.throws();
        return supertest(expressApp).delete('/api/leaderboards/').expect(StatusCodes.NOT_FOUND);
    });

    it('should modify leaderboard on valid put request to /api/leaderboards/:id', async () => {
        leaderboardService.modifyLeaderboard.resolves();
        return supertest(expressApp)
            .put('/api/leaderboards/id')
            .send(mockLeaderboard)
            .set('Accept', 'application/json')
            .expect(StatusCodes.NO_CONTENT);
    });

    it('should return an error on invalid put request to /api/leaderboards/:id', async () => {
        leaderboardService.modifyLeaderboard.throws();
        return supertest(expressApp)
            .put('/api/leaderboards/id')
            .send(mockLeaderboard)
            .set('Accept', 'application/json')
            .expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should reset leaderboard on valid patch request to /api/leaderboards/:id', async () => {
        leaderboardService.resetLeaderboards.resolves();
        return supertest(expressApp)
            .patch('/api/leaderboards/id')
            .send(mockLeaderboard)
            .set('Accept', 'application/json')
            .expect(StatusCodes.NO_CONTENT);
    });

    it('should return an error on invalid patch request to /api/leaderboards/:id', async () => {
        leaderboardService.resetLeaderboards.throws();
        return supertest(expressApp)
            .patch('/api/leaderboards/id')
            .send(mockLeaderboard)
            .set('Accept', 'application/json')
            .expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });
});
