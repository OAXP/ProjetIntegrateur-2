import { expect } from 'chai';
import { afterEach } from 'mocha';
import { MongoClient } from 'mongodb';
import { restore, spy, stub } from 'sinon';
import { MongoService } from './mongo.service';

describe('Mongo service', () => {
    let mongoService: MongoService;

    beforeEach(() => {
        mongoService = new MongoService();
        mongoService.start();
    });

    afterEach(async () => {
        restore();
    });

    it('getter should return database', async () => {
        expect(mongoService.database).to.equal(mongoService['db']);
    });

    it('start should connect to database', async () => {
        const clientSpy = spy(MongoClient.prototype, 'connect');
        mongoService.start();
        expect(clientSpy.called).to.equal(true);
    });

    it('start should throw error on catch', async () => {
        let error: object = {};
        stub(MongoClient.prototype, 'connect').throws('error');
        try {
            await mongoService.start();
        } catch (e) {
            error = e;
        }
        expect(error).to.have.property('name').equals('Error');
        expect(error).to.have.property('message').equals('Database connection error');
    });

    it('closeConnection should close client', async () => {
        const clientSpy = spy(MongoClient.prototype, 'close');
        mongoService.closeConnection();
        expect(clientSpy.called).to.equal(true);
    });
});
