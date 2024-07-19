import { DifferencesService } from '@app/services/differences.service';
import * as Bmp from '@app/utils/bmp-manager.utils';
import { promises as fs } from 'fs';
import { expect } from 'chai';
import { restore, stub } from 'sinon';
import { afterEach, before } from 'mocha';
import { ACCEPTED_RADIUS, BLACK_RGBA, DIFFICULT_LEVEL, IMAGE_RES } from '@app/utils/constants';
import { Coordinates } from '@common/coordinates';
import { GameSocket } from '@app/interfaces/game-socket';
import { GameInfo } from '@app/interfaces/game-info';

describe('Differences service', () => {
    let differencesService: DifferencesService;
    const REJECTED_RADIUS = {
        negative: -1,
        large: 9999,
        decimal: 0.5,
        close: 4,
        far: 39,
    };
    // 73 rows of black pixels makes it so that area of differences is greater than 15%
    const NUM_BLACK_ROWS = 73;
    const SURFACE_AREA_LIMIT = IMAGE_RES.width * IMAGE_RES.height * DIFFICULT_LEVEL.ratio;
    const IMG_TEST_FOLDER = 'assets/img/';
    let mockSocket: GameSocket;
    const ORIGIN_POINT: Coordinates = { x: 0, y: 0 };
    const overLimit = (numPixels: number) => numPixels > SURFACE_AREA_LIMIT;
    const createMockImages = () => {
        const mockWhiteImage = new Bmp.BmpManager(IMAGE_RES.width, IMAGE_RES.height);
        const mockModImage = new Bmp.BmpManager(IMAGE_RES.width, IMAGE_RES.height);
        const whiteImageUrl = IMG_TEST_FOLDER + 'mockWhiteImage.bmp';
        const modImageUrl = IMG_TEST_FOLDER + 'mockModImage.bmp';
        return { mockWhiteImage, mockModImage, whiteImageUrl, modImageUrl };
    };

    const set6PixelsBlack = (mockModImage: Bmp.BmpManager) => {
        mockModImage.setPixel({ x: 0, y: IMAGE_RES.height - 1 }, BLACK_RGBA);
        mockModImage.setPixel({ x: 33, y: IMAGE_RES.height - 1 }, BLACK_RGBA);
        mockModImage.setPixel({ x: 66, y: IMAGE_RES.height - 1 }, BLACK_RGBA);
        mockModImage.setPixel({ x: 99, y: IMAGE_RES.height - 1 }, BLACK_RGBA);
        mockModImage.setPixel({ x: 102, y: IMAGE_RES.height - 1 }, BLACK_RGBA);
        mockModImage.setPixel({ x: 135, y: IMAGE_RES.height - 1 }, BLACK_RGBA);
    };

    const set15SurfaceArea = (mockModImage: Bmp.BmpManager) => {
        mockModImage.scan((x, y) => {
            if (y < NUM_BLACK_ROWS) {
                mockModImage.setPixel({ x, y }, BLACK_RGBA);
            }
        });
    };

    const removeGeneratedImages = async (whiteImageUrl: string, modImageUrl: string, diffImageUrl?: string) => {
        await fs.rm(whiteImageUrl, { force: true });
        await fs.rm(modImageUrl, { force: true });
        if (diffImageUrl) await fs.rm(diffImageUrl, { force: true });
    };

    before(async () => {
        restore();
        await fs.mkdir(IMG_TEST_FOLDER, { recursive: true });
    });
    beforeEach(async () => {
        differencesService = new DifferencesService();
        const gameInfo: GameInfo = {
            constants: { bonusTime: 5, initialTime: 30, penaltyTime: 5 },
            playedIndexes: undefined,
            remainingDifferenceGroups: new Map<string, number>(),
            remainingGroups: new Map<number, number>(),
            differenceGroups: [],
            totalNumberOfDifferences: 0,
            intervalId: {} as NodeJS.Timeout,
            timer: 0,
        };
        mockSocket = {
            numberOfDifferencesFound: 0,
            playerName: '',
            gameInfo,
        } as unknown as GameSocket;
    });

    afterEach(() => {
        restore();
    });

    it('should handle Error if both images are not 640x480', async () => {
        let error: object = {};
        stub(differencesService, 'cacheDiffInfo').resolves();
        try {
            const mockImage = new Bmp.BmpManager(0, 0);
            stub(Bmp, 'read').resolves(mockImage);
            await differencesService.detectDifferences('', '', ACCEPTED_RADIUS.none);
        } catch (e) {
            error = e;
        }
        expect(error).to.be.an('Error');
    });

    it('should return difficult if 7 or more differences or 15% or less differences surface area', async () => {
        stub(differencesService, 'cacheDiffInfo').resolves();
        const { mockWhiteImage, mockModImage, whiteImageUrl, modImageUrl } = createMockImages();
        // Coloring 7 non-neighboring pixels black, so that mockModImage has 7 differences that spans less than 15% of the area
        set6PixelsBlack(mockModImage);
        mockModImage.setPixel({ x: 0, y: 12 }, BLACK_RGBA);

        await mockWhiteImage.saveImage(whiteImageUrl);
        await mockModImage.saveImage(modImageUrl);
        const { differentPixelsCount, numberOfDifferences, difficulty, differenceImageUrl } = await differencesService.detectDifferences(
            whiteImageUrl,
            modImageUrl,
            ACCEPTED_RADIUS.none,
        );
        await removeGeneratedImages(whiteImageUrl, modImageUrl, differenceImageUrl);
        expect(difficulty).to.equals('difficile');
        expect(overLimit(differentPixelsCount)).to.equals(false);
        expect(numberOfDifferences >= DIFFICULT_LEVEL.numDiff).to.equals(true);
    });

    it('should return the correct number of differences and different pixels', async () => {
        stub(differencesService, 'cacheDiffInfo').resolves();
        const differentPixels = 5;
        const { mockWhiteImage, mockModImage, whiteImageUrl, modImageUrl } = createMockImages();
        mockModImage.setPixel({ x: 0, y: 0 }, BLACK_RGBA);
        mockModImage.setPixel({ x: 0, y: 7 }, BLACK_RGBA);
        mockModImage.setPixel({ x: 0, y: 14 }, BLACK_RGBA);
        mockModImage.setPixel({ x: 0, y: 21 }, BLACK_RGBA);
        mockModImage.setPixel({ x: 0, y: 22 }, BLACK_RGBA);

        await mockWhiteImage.saveImage(whiteImageUrl);
        await mockModImage.saveImage(modImageUrl);
        const { differentPixelsCount, numberOfDifferences, differenceImageUrl } = await differencesService.detectDifferences(
            whiteImageUrl,
            modImageUrl,
            ACCEPTED_RADIUS.low,
        );
        await removeGeneratedImages(whiteImageUrl, modImageUrl, differenceImageUrl);
        expect(differentPixelsCount).to.equals(differentPixels);
        expect(numberOfDifferences).to.equals(differentPixelsCount - 1);
    });

    it('should return easy if 6 or less differences or 15% or less differences surface area', async () => {
        stub(differencesService, 'cacheDiffInfo').resolves();
        const { mockWhiteImage, mockModImage, whiteImageUrl, modImageUrl } = createMockImages();
        set6PixelsBlack(mockModImage);
        await mockWhiteImage.saveImage(whiteImageUrl);
        await mockModImage.saveImage(modImageUrl);
        const { differentPixelsCount, numberOfDifferences, difficulty, differenceImageUrl } = await differencesService.detectDifferences(
            whiteImageUrl,
            modImageUrl,
            ACCEPTED_RADIUS.none,
        );

        await removeGeneratedImages(whiteImageUrl, modImageUrl, differenceImageUrl);

        expect(difficulty).to.equals('facile');
        expect(overLimit(differentPixelsCount)).to.equals(false);
        expect(numberOfDifferences < DIFFICULT_LEVEL.numDiff).to.equals(true);
    });

    it('should return easy if 6 or less differences or 15% or more differences surface area', async () => {
        stub(differencesService, 'cacheDiffInfo').resolves();
        const { mockWhiteImage, mockModImage, whiteImageUrl, modImageUrl } = createMockImages();
        set6PixelsBlack(mockModImage);
        mockModImage.setPixel({ x: 135, y: IMAGE_RES.height - 1 }, { r: 255, b: 255, g: 255 });
        set15SurfaceArea(mockModImage);
        await mockWhiteImage.saveImage(whiteImageUrl);
        await mockModImage.saveImage(modImageUrl);
        const { differentPixelsCount, numberOfDifferences, difficulty, differenceImageUrl } = await differencesService.detectDifferences(
            whiteImageUrl,
            modImageUrl,
            ACCEPTED_RADIUS.medium,
        );

        await removeGeneratedImages(whiteImageUrl, modImageUrl, differenceImageUrl);

        expect(difficulty).to.equals('facile');
        expect(overLimit(differentPixelsCount)).to.equals(true);
        expect(numberOfDifferences < DIFFICULT_LEVEL.numDiff).to.equals(true);
    });

    it('should return easy if 7 or more differences or 15% or more differences surface area', async () => {
        stub(differencesService, 'cacheDiffInfo').resolves();
        const { mockWhiteImage, mockModImage, whiteImageUrl, modImageUrl } = createMockImages();
        mockModImage.setPixel({ x: 0, y: 0 }, BLACK_RGBA);
        set6PixelsBlack(mockModImage);
        set15SurfaceArea(mockModImage);
        await mockWhiteImage.saveImage(whiteImageUrl);
        await mockModImage.saveImage(modImageUrl);
        const { differentPixelsCount, numberOfDifferences, difficulty, differenceImageUrl } = await differencesService.detectDifferences(
            whiteImageUrl,
            modImageUrl,
            ACCEPTED_RADIUS.none,
        );

        await removeGeneratedImages(whiteImageUrl, modImageUrl, differenceImageUrl);

        expect(difficulty).to.equals('facile');
        expect(overLimit(differentPixelsCount)).to.equals(true);
        expect(numberOfDifferences < DIFFICULT_LEVEL.numDiff).to.equals(false);
    });

    it('radius should either be 0, 3, 9 or 15', async () => {
        stub(differencesService, 'cacheDiffInfo').resolves();
        const { mockWhiteImage, mockModImage, whiteImageUrl, modImageUrl } = createMockImages();
        set6PixelsBlack(mockModImage);
        await mockWhiteImage.saveImage(whiteImageUrl);
        await mockModImage.saveImage(modImageUrl);
        const tests = [
            ACCEPTED_RADIUS.none,
            ACCEPTED_RADIUS.low,
            ACCEPTED_RADIUS.medium,
            ACCEPTED_RADIUS.high,
            REJECTED_RADIUS.negative,
            REJECTED_RADIUS.large,
            REJECTED_RADIUS.decimal,
            REJECTED_RADIUS.close,
            REJECTED_RADIUS.far,
        ];
        const results: boolean[] = new Array(tests.length);

        for (let i = 0; i < tests.length; i++) {
            try {
                const { differenceImageUrl } = await differencesService.detectDifferences(whiteImageUrl, modImageUrl, tests[i]);
                await fs.rm(differenceImageUrl, { force: true });
                results[i] = true;
            } catch (e) {
                results[i] = false;
            }
        }
        await removeGeneratedImages(whiteImageUrl, modImageUrl);

        // Manually checking to know which part is problematic
        expect(results[0]).to.equals(true);
        expect(results[1]).to.equals(true);
        expect(results[2]).to.equals(true);
        expect(results[3]).to.equals(true);
        expect(results[4]).to.equals(false);
        expect(results[5]).to.equals(false);
        expect(results[6]).to.equals(false);
        expect(results[7]).to.equals(false);
        expect(results[8]).to.equals(false);
    });

    it("should return false if a difference wasn't clicked", async () => {
        mockSocket.gameInfo.remainingDifferenceGroups.set(`${ORIGIN_POINT.x}-${ORIGIN_POINT.y}`, 0);

        const validateResponse = await differencesService.validateDifferences(ORIGIN_POINT, mockSocket);

        expect(validateResponse.isDifferent).to.equals(false);
    });

    it('should return true if a difference was clicked', async () => {
        mockSocket.gameInfo.remainingDifferenceGroups.set(`${ORIGIN_POINT.x}-${ORIGIN_POINT.y}`, 0);
        mockSocket.gameInfo.remainingGroups.set(0, 0);
        mockSocket.gameInfo.differenceGroups = [[]];

        const validateResponse = await differencesService.validateDifferences(ORIGIN_POINT, mockSocket);

        expect(validateResponse.isDifferent).to.equals(true);
    });

    it('should return false and an empty array if no valid gameId was received', async () => {
        const validateResponse = await differencesService.validateDifferences(ORIGIN_POINT, mockSocket);

        expect(validateResponse.isDifferent).to.equals(false);
        expect(validateResponse.differentPixels.length).to.equals(0);
    });

    it('should return false if the difference was already clicked', async () => {
        mockSocket.gameInfo.remainingDifferenceGroups.set(`${ORIGIN_POINT.x}-${ORIGIN_POINT.y}`, 0);

        const validateResponse = await differencesService.validateDifferences(ORIGIN_POINT, mockSocket);

        expect(validateResponse.isDifferent).to.equals(false);
    });

    it('should return all neighboring pixels', async () => {
        mockSocket.gameInfo.remainingDifferenceGroups.set(`${ORIGIN_POINT.x}-${ORIGIN_POINT.y}`, 0);
        mockSocket.gameInfo.remainingGroups.set(0, 0);
        mockSocket.gameInfo.differenceGroups = [[ORIGIN_POINT, ORIGIN_POINT]];

        const validateResponse = await differencesService.validateDifferences(ORIGIN_POINT, mockSocket);

        expect(validateResponse.differentPixels.length).to.equals(2);
    });

    it('cacheDiffInfo() should call fs.writeFile', () => {
        const fsWriteFileStub = stub(fs, 'writeFile').resolves();
        differencesService.cacheDiffInfo({ groups: [], id: '', remainingDifferenceGroups: new Map() });
        expect(fsWriteFileStub.called).to.equals(true);
    });
});
