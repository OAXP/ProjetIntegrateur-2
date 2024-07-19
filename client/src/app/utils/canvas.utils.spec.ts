import { getDataIndex, mergeFrontBackCanvas, NUM_RGBA_KEYS } from '@app/utils/canvas.utils';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/constants/consts';

describe('Canvas Utils', () => {
    it('getDataIndex should return the good index', () => {
        expect(getDataIndex(0, 0)).toBe(0);
        expect(getDataIndex(1, 0)).toBe(NUM_RGBA_KEYS);
        expect(getDataIndex(1, 1)).toBe((1 + IMAGE_WIDTH) * NUM_RGBA_KEYS);
    });

    it('mergeFrontBackCanvas() should keep frontData in front of backData if not transparent', () => {
        const numPixels = IMAGE_WIDTH * IMAGE_HEIGHT;
        const numData = 4; // RGBA
        const frontData = new Uint8ClampedArray(numPixels * numData);
        frontData[2] = 1;
        frontData[3] = 1;
        const backData = new Uint8ClampedArray(numPixels * numData);
        backData[2] = 2;
        backData[3] = 1;

        const numAlphaPerH = IMAGE_WIDTH / numData;

        const result = mergeFrontBackCanvas(frontData, backData);
        const index = numPixels * 3 - numPixels / numAlphaPerH;

        expect(result[index]).toEqual(1);
    });
});
