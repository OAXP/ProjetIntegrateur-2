import { TestBed } from '@angular/core/testing';

import { BmpService } from './bmp.service';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/constants/consts';

describe('BmpService', () => {
    let service: BmpService;
    let fileSpy: SpyObj<File>;

    const BMP_HEAD = {
        headerEnd: 54,
        widthOffset: 18,
        heightOffset: 22,
        numPixelOffset: 28,
        numPixelValue: 24,
        idFieldValue: 19778, // BM
    };

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(BmpService);
        fileSpy = createSpyObj<File>('File', ['arrayBuffer']);
    });

    const createMockFile = (header: { id: number; numPixels: number; width: number; height: number }): ArrayBuffer => {
        const view = new DataView(new ArrayBuffer(BMP_HEAD.headerEnd));

        view.setUint16(0, header.id, true);
        view.setUint16(BMP_HEAD.numPixelOffset, header.numPixels, true);
        view.setUint32(BMP_HEAD.widthOffset, header.width, true);
        view.setInt32(BMP_HEAD.heightOffset, header.height, true);

        return view.buffer;
    };

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('verifyBmp should return false if no file was provided', (done) => {
        service.verifyBmp(undefined).then((result) => {
            expect(result).toBe(false);
            done();
        });
    });

    it('verifyBmp should return false if the file is not valid', (done) => {
        fileSpy.arrayBuffer.and.resolveTo(new ArrayBuffer(BMP_HEAD.headerEnd));
        service.verifyBmp(fileSpy).then((result) => {
            expect(result).toBe(false);
            done();
        });
    });

    it('verifyBmp should return false if the Bmp is not 640x480', (done) => {
        const arrayBuffer = createMockFile({
            id: BMP_HEAD.idFieldValue,
            numPixels: BMP_HEAD.numPixelValue,
            width: 0,
            height: 0,
        });

        fileSpy.arrayBuffer.and.resolveTo(arrayBuffer);
        service.verifyBmp(fileSpy).then((result) => {
            expect(result).toBe(false);
            done();
        });
    });

    it('verifyBmp should return false if the Bmp bit depth is not 24', (done) => {
        const arrayBuffer = createMockFile({
            id: BMP_HEAD.idFieldValue,
            numPixels: 0,
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
        });

        fileSpy.arrayBuffer.and.resolveTo(arrayBuffer);
        service.verifyBmp(fileSpy).then((result) => {
            expect(result).toBe(false);
            done();
        });
    });

    it('verifyBmp should return false if the Bmp ID is not correct', (done) => {
        const arrayBuffer = createMockFile({
            id: 0,
            numPixels: BMP_HEAD.numPixelValue,
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
        });

        fileSpy.arrayBuffer.and.resolveTo(arrayBuffer);
        service.verifyBmp(fileSpy).then((result) => {
            expect(result).toBe(false);
            done();
        });
    });

    it('verifyBmp should return true if the Bmp is 640x480 and 24 bits', (done) => {
        const arrayBuffer = createMockFile({
            id: BMP_HEAD.idFieldValue,
            numPixels: BMP_HEAD.numPixelValue,
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
        });

        fileSpy.arrayBuffer.and.resolveTo(arrayBuffer);
        service.verifyBmp(fileSpy).then((result) => {
            expect(result).toBe(true);
            done();
        });
    });
});
