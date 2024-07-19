import { Application } from '@app/app';
import { GameHandlerService } from '@app/services/game-handler.service';
import { SocketManagerService } from '@app/services/socket-manager.service';
import { Game } from '@common/game';
import { Player } from '@common/player';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import { afterEach } from 'mocha';
import { createStubInstance, restore, SinonStubbedInstance } from 'sinon';
import { Server } from 'socket.io';
import * as supertest from 'supertest';
import { Container } from 'typedi';

describe('GameHandlerController', () => {
    let gameHandlerService: SinonStubbedInstance<GameHandlerService>;
    let socketManagerService: SinonStubbedInstance<SocketManagerService>;
    let expressApp: Express.Application;

    const game: Game = {
        name: 'Game Name',
        differentPixelsCount: 1,
        numberOfDifferences: 1,
        difficulty: 'facile',
        image1Url: 'original.bmp',
        image2Url: 'modified.bmp',
        differenceImageUrl: 'diff.bmp',
        firstPlayer: new Player(),
    };

    beforeEach(async () => {
        gameHandlerService = createStubInstance(GameHandlerService);
        socketManagerService = createStubInstance(SocketManagerService);
        const app = Container.get(Application);
        Object.defineProperty(app['gameHandlerController'], 'gameHandlerService', { value: gameHandlerService });
        Object.defineProperty(app['gameHandlerController'], 'socketManagerService', { value: socketManagerService });
        expressApp = app.app;
    });
    afterEach(() => {
        restore();
    });

    it('should should return an array of games on valid get request to /api/games', async () => {
        gameHandlerService.getAllGames.resolves([]);
        return supertest(expressApp)
            .get('/api/games')
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal([]);
            });
    });

    it('should return NO CONTENT if there is no file on get request to /api/games', async () => {
        gameHandlerService.getAllGames.throws('ENOENT');
        return supertest(expressApp).get('/api/games').expect(StatusCodes.NO_CONTENT);
    });

    it('should return Internal Server Error if there is any error on the server on get request to /api/games', async () => {
        gameHandlerService.getAllGames.throws();
        return supertest(expressApp).get('/api/games').expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should create game on valid post request to /api/games/add', async () => {
        gameHandlerService.saveGame.resolves();
        return supertest(expressApp).post('/api/games/add').send(game).set('Accept', 'application/json').expect(StatusCodes.CREATED);
    });

    it('should return an error on invalid post request to /api/games/add', async () => {
        gameHandlerService.saveGame.rejects();
        return supertest(expressApp).post('/api/games/add').send(game).set('Accept', 'application/json').expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should cancel game on valid post request to /api/games/cancel', async () => {
        gameHandlerService.cancelGame.resolves();
        return supertest(expressApp).post('/api/games/cancel').send(game).set('Accept', 'application/json').expect(StatusCodes.NO_CONTENT);
    });

    it('should return an error on invalid post request to /api/games/cancel', async () => {
        gameHandlerService.cancelGame.rejects();
        return supertest(expressApp).post('/api/games/cancel').send(game).set('Accept', 'application/json').expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return NO CONTENT if game was not found on delete request to /api/games/:gameId', async () => {
        const serverStub = createStubInstance(Server);
        serverStub.emit.resolves();
        socketManagerService.sio = serverStub;
        gameHandlerService.deleteGame.resolves(false);
        return supertest(expressApp).delete('/api/games/1234').expect(StatusCodes.NO_CONTENT);
    });

    it('should return NOT FOUND if there is any error on the server on delete request to /api/games/:gameId', async () => {
        gameHandlerService.deleteGame.throws();
        return supertest(expressApp).delete('/api/games/1234').expect(StatusCodes.NOT_FOUND);
    });

    it('should return NO CONTENT if game was deleted on delete request to /api/games/', async () => {
        const serverStub = createStubInstance(Server);
        serverStub.emit.resolves();
        socketManagerService.sio = serverStub;
        gameHandlerService.deleteGames.resolves();
        return supertest(expressApp).delete('/api/games/').expect(StatusCodes.NO_CONTENT);
    });

    it('should return NOT_FOUND if there is any error on the server on delete request to /api/games/', async () => {
        gameHandlerService.deleteGames.throws();
        return supertest(expressApp).delete('/api/games/').expect(StatusCodes.NOT_FOUND);
    });
});
