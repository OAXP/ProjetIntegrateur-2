import { Cache } from '@app/interfaces/cache-object';
import { DifferencesInfo } from '@app/interfaces/differences-info';
import { GameSocket } from '@app/interfaces/game-socket';
import { ValidateDifferenceResponse } from '@app/interfaces/validate-difference-response';
import * as Bmp from '@app/utils/bmp-manager.utils';
import { ACCEPTED_RADIUS, BLACK_RGBA, DEFAULT_INDEX, DIFFICULT_LEVEL, IMAGE_RES, IMG_FOLDER, VISITED_COLOR } from '@app/utils/constants';
import { DrawCircleArgs, drawCircle } from '@app/utils/draw.utils';
import { deleteImages } from '@app/utils/file-manager.utils';
import { FloodFillArgs, compareColors, floodFill, isBlackColor } from '@app/utils/image-processing.utils';
import { generateFileName, getRandomString } from '@app/utils/math.utils';
import { Coordinates } from '@common/coordinates';
import { DifferenceResponse } from '@common/difference-response';
import { promises as fs } from 'fs';
import { Service } from 'typedi';

@Service()
export class DifferencesService {
    /**
     * This method compares two images and generates a difference image
     *
     * @param image1Url Original image to compare
     * @param image2Url Modified image to compare
     * @param radius Expansion radius to group up close pixels
     * @returns DifferenceResponse An object with the number of different pixels, groups and the difference image
     */
    async detectDifferences(image1Url: string, image2Url: string, radius: number): Promise<DifferenceResponse> {
        if (
            radius !== ACCEPTED_RADIUS.none &&
            radius !== ACCEPTED_RADIUS.low &&
            radius !== ACCEPTED_RADIUS.medium &&
            radius !== ACCEPTED_RADIUS.high
        ) {
            await deleteImages(image1Url, image2Url);
            throw new Error("Le rayon d'élargissement doit être de 0, 3, 9 ou 15.");
        }

        const image1 = await Bmp.read(image1Url);
        const image2 = await Bmp.read(image2Url);

        let differentPixelsCount = 0;
        const differenceImage = new Bmp.BmpManager(IMAGE_RES.width, IMAGE_RES.height);

        // Loop to iterate through the width and the height of the images
        for (let x = 0; x < IMAGE_RES.width; x++) {
            for (let y = 0; y < IMAGE_RES.height; y++) {
                const pixel1 = image1.getPixel({ x, y });
                const pixel2 = image2.getPixel({ x, y });

                if (!compareColors(pixel1, pixel2)) {
                    differentPixelsCount++;
                    differenceImage.setPixel({ x, y }, BLACK_RGBA);
                    if (radius > 0) {
                        const args: DrawCircleArgs = {
                            center: { x, y },
                            color: BLACK_RGBA,
                            filler: (point, color) => {
                                return differenceImage.setPixel(point, color);
                            },
                            getColor: (point) => {
                                return differenceImage.getPixel(point);
                            },
                            radius,
                        };
                        drawCircle(args);
                    }
                }
            }
        }

        const remainingDifferenceGroups = new Map<string, number>();
        const groups: Coordinates[][] = [];

        // Calculates the number of black pixel blocks
        const differenceImageCopy = differenceImage.clone();
        const isVisited = (point: Coordinates) =>
            differenceImageCopy.getPixel({ x: point.x, y: point.y }) === { r: VISITED_COLOR, g: VISITED_COLOR, b: VISITED_COLOR };
        const filler = (point: Coordinates) => {
            differenceImageCopy.setPixel({ x: point.x, y: point.y }, { r: VISITED_COLOR, g: VISITED_COLOR, b: VISITED_COLOR });
            const currentGroupIndex = groups.length - 1;
            groups[currentGroupIndex] = groups[currentGroupIndex] ?? [];
            groups[currentGroupIndex].push(point);
            remainingDifferenceGroups.set(`${point.x}-${point.y}`, currentGroupIndex);
        };

        // Did not reuse Coordinates for parameters x and y because the arrow function requires it
        differenceImage.scan((x, y) => {
            const color = differenceImageCopy.getPixel({ x, y });
            if (isBlackColor(color) && !isVisited({ x, y })) {
                groups.push([]);
                const args: FloodFillArgs = {
                    x,
                    y,
                    filler,
                    isVisited,
                    getColor: (point) => {
                        return differenceImageCopy.getPixel(point);
                    },
                };
                floodFill(args);
            }
        });

        await fs.mkdir(IMG_FOLDER, { recursive: true });
        const generatedFileName = IMG_FOLDER + generateFileName(`${Date.now()}`);
        await differenceImage.saveImage(generatedFileName);

        // generate game ID
        const randomString = getRandomString();
        const id = `${Date.now()}${randomString}`;

        const numberOfDifferences = groups.length;

        await this.cacheDiffInfo({ id, remainingDifferenceGroups, groups });

        return {
            id,
            differentPixelsCount,
            numberOfDifferences,
            difficulty: this.detectDifficulty(differentPixelsCount, numberOfDifferences),
            image1Url,
            image2Url,
            differenceImageUrl: generatedFileName,
        };
    }

    async cacheDiffInfo(differencesInfo: DifferencesInfo) {
        const cachedObject: Cache = {
            id: differencesInfo.id,
            remainingDifferenceGroups: Array.from(differencesInfo.remainingDifferenceGroups as Map<string, number>),
            groups: differencesInfo.groups,
        };
        const filePath = 'assets/' + differencesInfo.id + '.json';
        await fs.writeFile(filePath, JSON.stringify(cachedObject));
    }

    /**
     * This method determines the level of difficulty according to differentPixelsCount and numberOfDifferences
     *
     * @param differentPixelsCount The number of different pixels
     * @param numberOfDifferences The number of different groups
     * @returns The level of difficulty
     */
    detectDifficulty(differentPixelsCount: number, numberOfDifferences: number): string {
        const differenceAreaRatio = differentPixelsCount / (IMAGE_RES.width * IMAGE_RES.height);
        const level = numberOfDifferences >= DIFFICULT_LEVEL.numDiff && differenceAreaRatio <= DIFFICULT_LEVEL.ratio;
        return level ? 'difficile' : 'facile'; // Reason for French: website is in French language
    }

    async validateDifferences(point: Coordinates, socket: GameSocket): Promise<ValidateDifferenceResponse> {
        const groupIndex = socket.gameInfo.remainingDifferenceGroups.get(`${point.x}-${point.y}`) ?? DEFAULT_INDEX;

        if (groupIndex === DEFAULT_INDEX) {
            return {
                isDifferent: false,
                differentPixels: [],
                groupIndex,
            };
        }
        let isDifferent = false;

        if (!socket.gameInfo.remainingGroups.has(groupIndex)) {
            return {
                isDifferent,
                differentPixels: [],
                groupIndex,
            };
        }

        isDifferent = true;

        const differentPixels = socket.gameInfo.differenceGroups[groupIndex]; // get groups

        return {
            isDifferent,
            differentPixels,
            groupIndex,
        };
    }
}
