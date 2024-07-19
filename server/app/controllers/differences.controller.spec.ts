import { Application } from '@app/app';
import { testRequest, testRequestError } from '@app/controllers/testData/differences-controller-test-data';
import { DifferencesService } from '@app/services/differences.service';
import { DifferenceResponse } from '@common/difference-response';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { StatusCodes } from 'http-status-codes';
import { afterEach } from 'mocha';
import { createStubInstance, restore, SinonStubbedInstance, stub } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

describe('DifferencesController', () => {
    let differencesService: SinonStubbedInstance<DifferencesService>;
    let expressApp: Express.Application;
    const baseDiff: DifferenceResponse = {
        differentPixelsCount: 1,
        numberOfDifferences: 1,
        difficulty: 'facile',
        image1Url: 'original.bmp',
        image2Url: 'modified.bmp',
        differenceImageUrl: 'diff.bmp',
    };

    beforeEach(async () => {
        differencesService = createStubInstance(DifferencesService);
        differencesService.detectDifferences.resolves(baseDiff);
        stub(fs, 'mkdir').resolves();
        stub(fs, 'writeFile').resolves();
        const app = Container.get(Application);
        Object.defineProperty(app['differencesController'], 'differencesService', { value: differencesService });
        expressApp = app.app;
    });

    afterEach(() => {
        restore();
    });

    it('should return a DiffResponse', async () => {
        return supertest(expressApp)
            .post('/api/differences')
            .send(testRequest)
            .set('Accept', 'application/json')
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equals(baseDiff);
            });
    });
    it('should return an error', async () => {
        restore();
        return supertest(expressApp)
            .post('/api/differences')
            .send(testRequestError)
            .set('Accept', 'application/json')
            .expect(StatusCodes.BAD_REQUEST);
    });
});
