import { promises as fs } from 'fs';
import { BMP_HEAD, IMAGE_RES, WHITE_COLOR } from '@app/utils/constants';
import { RGBA } from '@common/rgba';
import { Coordinates } from '@common/coordinates';

/**
 * This function reads the specified file asynchronously and returns a BmpManager object.
 *
 * @param path Path of the file
 * @returns BmpManager
 */
export const read = async (path: string): Promise<BmpManager> => {
    const buffer = await fs.readFile(path);
    return new BmpManager(buffer);
};

export class BmpManager {
    readonly width: number;
    readonly height: number;
    readonly pixelArrayStart: number;
    private readonly imageBuffer: Buffer;

    constructor(file: Buffer);
    constructor(width: number, height: number);
    constructor(...args: unknown[]) {
        const argsLen = args.length;
        if (argsLen === 1 && Buffer.isBuffer(args[0])) {
            this.imageBuffer = args[0];
            this.width = this.imageBuffer.readInt32LE(BMP_HEAD.widthOffset);
            this.height = this.imageBuffer.readInt32LE(BMP_HEAD.heightOffset);
        } else if (argsLen === 2 && typeof args[0] === 'number' && typeof args[1] === 'number') {
            this.width = args[0];
            this.height = args[1];

            const imgDataSize = this.width * this.height * 3;
            const fileSize = BMP_HEAD.pixelPosition + imgDataSize;
            const pixelArray = new Uint8Array(imgDataSize).fill(WHITE_COLOR); // White background

            this.imageBuffer = Buffer.alloc(fileSize);
            this.buildBmpFile(fileSize, imgDataSize, pixelArray);
        }
        this.pixelArrayStart = this.imageBuffer.readInt32LE(BMP_HEAD.pixelOffset);

        // File format verification
        this.verifyBmpFormat();
    }

    verifyBmpFormat() {
        const numBits = this.imageBuffer.readUint16LE(BMP_HEAD.numPixelOffset);
        const idField = this.imageBuffer.readUint16LE(0);
        if (
            numBits !== BMP_HEAD.numPixelValue ||
            idField !== BMP_HEAD.idFieldValue ||
            this.width !== IMAGE_RES.width ||
            Math.abs(this.height) !== IMAGE_RES.height
        ) {
            throw new Error(
                `Ce fichier n'est pas une image 24-Bit 640x480 BMP. Bits : ${numBits}; ID: ${idField}; width: ${this.width}; height: ${this.height};`,
            );
        }
    }

    buildBmpFile(fileSize: number, imgDataSize: number, pixelArray: Uint8Array) {
        this.imageBuffer.write('BM');
        this.imageBuffer.writeUInt32LE(fileSize, 2);
        this.imageBuffer.writeUInt32LE(BMP_HEAD.pixelPosition, BMP_HEAD.pixelOffset);
        this.imageBuffer.writeUInt32LE(BMP_HEAD.dibSize, BMP_HEAD.dibOffset);
        this.imageBuffer.writeInt32LE(this.width, BMP_HEAD.widthOffset);
        this.imageBuffer.writeInt32LE(this.height, BMP_HEAD.heightOffset);
        this.imageBuffer.writeUInt16LE(1, BMP_HEAD.colorPlanesOffset);
        this.imageBuffer.writeUInt16LE(BMP_HEAD.numPixelValue, BMP_HEAD.numPixelOffset);
        this.imageBuffer.writeUInt32LE(0, BMP_HEAD.compressionOffset);
        this.imageBuffer.writeUInt32LE(imgDataSize, BMP_HEAD.sizeOffset);
        this.imageBuffer.writeUInt32LE(BMP_HEAD.pixelPerMeter, BMP_HEAD.printResHOffset);
        this.imageBuffer.writeUInt32LE(BMP_HEAD.pixelPerMeter, BMP_HEAD.printResVOffset);
        this.imageBuffer.writeUInt32LE(0, BMP_HEAD.numColorsInPaletteOffset);
        this.imageBuffer.writeUInt32LE(0, BMP_HEAD.importantColorsOffset);
        this.imageBuffer.set(pixelArray, BMP_HEAD.pixelPosition);
    }

    /**
     * This method returns the pixel at coordinates (x, y) of the BMP in RGBA format.
     *
     * @param point (x, y) coordinates to get
     * @returns RGBA color of the pixel at (x, y)
     */
    getPixel(point: Coordinates): RGBA {
        const offset = this.calculateOffset(point);
        return {
            // Not sure if BGR or RGB
            b: this.imageBuffer.readUInt8(offset),
            g: this.imageBuffer.readUInt8(offset + 1),
            r: this.imageBuffer.readUInt8(offset + 2),
        };
    }

    /**
     *  This method sets the color of a given pixel at (x, y) with the values from color.
     *
     * @param point (x, y) coordinates to set
     * @param color RGBA color to set
     */
    setPixel(point: Coordinates, color: RGBA): void {
        const offset = this.calculateOffset(point);
        this.imageBuffer.writeUInt8(color.b, offset);
        this.imageBuffer.writeUInt8(color.g, offset + 1);
        this.imageBuffer.writeUInt8(color.r, offset + 2);
    }

    /**
     * This method writes a BMP file of the current BMP to the specified path.
     *
     * @param filePath Path of the file
     * @returns Current BmpManager object
     */
    async saveImage(filePath: string): Promise<BmpManager> {
        await fs.writeFile(filePath, this.imageBuffer);
        return this;
    }

    /**
     * This method returns a clone of the current BmpManager object.
     *
     * @returns Current BmpManager object
     */
    clone(): BmpManager {
        const buffer = Buffer.from(this.imageBuffer);
        return new BmpManager(buffer);
    }

    /**
     * This method iterates and calls a callback function on each pixel of the BMP.
     *
     * @param cb Function to call on each pixel
     */
    scan(cb: (x: number, y: number) => void): void {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                cb(x, y);
            }
        }
    }

    /**
     *  This method calculates the offset of where to start reading pixel data according to height sign (bottom-up or top-down).
     *
     * @param point The pixel in which we want to calculate the offset from
     * @returns Returns offset
     */
    private calculateOffset(point: Coordinates): number {
        if (this.height < 0) {
            // Windows BMPs are top-down, but this is in case we get a bottom-up BMP (Linux maybe)
            return this.pixelArrayStart + (point.x + point.y * this.width) * 3;
        }
        return this.pixelArrayStart + (point.x + (this.height - point.y - 1) * this.width) * 3;
    }
}
