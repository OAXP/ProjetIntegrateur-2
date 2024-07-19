import { BMP_HEAD, IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/constants/consts';
import { RGBA } from '@common/rgba';

export const NUM_RGBA_KEYS = 4;
const imageDataSize = IMAGE_WIDTH * IMAGE_HEIGHT * 3;
const fileSize = BMP_HEAD.pixelPosition + imageDataSize;

export const getDataIndex = (x: number, y: number): number => {
    return (x + y * IMAGE_WIDTH) * NUM_RGBA_KEYS;
};

export const mergeFrontBackCanvas = (frontData: Uint8ClampedArray, backData: Uint8ClampedArray): Uint8Array => {
    const numPixels = IMAGE_WIDTH * IMAGE_HEIGHT;
    const mergedData = new Uint8Array(numPixels * 3); // BGR each pixel for BMP

    for (let y = IMAGE_HEIGHT - 1, j = 0; y >= 0; y--) {
        for (let x = 0; x < IMAGE_WIDTH; x++, j += 3) {
            const index = getDataIndex(x, y);
            const data = frontData[index + 3] === 0 ? backData : frontData;

            mergedData[j] = data[index + 2]; // B
            mergedData[j + 1] = data[index + 1]; // G
            mergedData[j + 2] = data[index]; // R
        }
    }

    return mergedData;
};

const generateBmpHeader = (): Uint8Array => {
    const bmpHeader = new ArrayBuffer(BMP_HEAD.pixelPosition);
    const bmpHeaderView = new DataView(bmpHeader);
    bmpHeaderView.setInt16(0, BMP_HEAD.idFieldValue, true);
    bmpHeaderView.setUint32(2, fileSize, true);
    bmpHeaderView.setUint32(BMP_HEAD.pixelOffset, BMP_HEAD.pixelPosition, true);
    bmpHeaderView.setUint32(BMP_HEAD.dibOffset, BMP_HEAD.dibSize, true);
    bmpHeaderView.setInt32(BMP_HEAD.widthOffset, IMAGE_WIDTH, true);
    bmpHeaderView.setInt32(BMP_HEAD.heightOffset, IMAGE_HEIGHT, true);
    bmpHeaderView.setUint16(BMP_HEAD.colorPlanesOffset, 1, true);
    bmpHeaderView.setUint16(BMP_HEAD.numPixelOffset, BMP_HEAD.numPixelValue, true);
    bmpHeaderView.setUint32(BMP_HEAD.compressionOffset, 0, true);
    bmpHeaderView.setUint32(BMP_HEAD.sizeOffset, imageDataSize, true);
    bmpHeaderView.setUint32(BMP_HEAD.printResHOffset, BMP_HEAD.pixelPerMeter, true);
    bmpHeaderView.setUint32(BMP_HEAD.printResVOffset, BMP_HEAD.pixelPerMeter, true);
    bmpHeaderView.setUint32(BMP_HEAD.numColorsInPaletteOffset, 0, true);
    bmpHeaderView.setUint32(BMP_HEAD.importantColorsOffset, 0, true);

    return new Uint8Array(bmpHeaderView.buffer);
};

const uint8ArrayToBase64 = (array: Uint8Array): string => {
    const bytes = new Uint8Array(array);
    let tmp = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        tmp += String.fromCharCode(bytes[i]);
    }

    return window.btoa(tmp);
};

export const canvasLayersToBase64Bmp = (frontCanvasData: Uint8ClampedArray, backCanvasData: Uint8ClampedArray): string => {
    const bmpFileData = new Uint8Array(fileSize);
    const bmpHeader = generateBmpHeader();
    const bmpData = mergeFrontBackCanvas(frontCanvasData, backCanvasData);
    bmpFileData.set(bmpHeader);
    bmpFileData.set(bmpData, BMP_HEAD.pixelPosition);

    return uint8ArrayToBase64(bmpFileData);
};

export const compareColors = (pixel1: RGBA, pixel2: RGBA): boolean => {
    return pixel1.r === pixel2.r && pixel1.g === pixel2.g && pixel1.b === pixel2.b && pixel1.a === pixel2.a;
};
