import { DifferencesService } from '@app/services/differences.service';
import { IMG_FOLDER } from '@app/utils/constants';
import { generateFileName } from '@app/utils/math.utils';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import { deleteImages, saveImages, SaveImagesArgs } from '@app/utils/file-manager.utils';

@Service()
export class DifferencesController {
    router: Router;

    constructor(private readonly differencesService: DifferencesService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        /**
         * @swagger
         * tags:
         *   - name: Difference
         *     description: Difference image End Point
         */

        /**
         * @swagger
         * definitions:
         *  DifferenceResponse:
         *    type: object
         *    properties:
         *      differentPixelsCount:
         *        type: integer
         *        description: The number of different pixels between the two images
         *      numberOfDifferences:
         *        type: integer
         *        description: The total number of differences between the two images
         *      difficulty:
         *        type: string
         *        description: The difficulty level of the comparison
         *      image1Url:
         *        type: string
         *        description: The URL of the first image
         *      image2Url:
         *        type: string
         *        description: The URL of the second image
         *      differenceImageUrl:
         *        type: string
         *        description: The URL of the difference image
         */

        /**
         * @swagger
         *
         * /api/diff:
         *   post:
         *     description: Upload two 24-bit BMP images in Base64 format and find the differences
         *     tags:
         *       - Difference
         *     requestBody:
         *       content:
         *          application/json:
         *              schema:
         *                  type: object
         *                  properties:
         *                      radius:
         *                          type: number
         *                          description: expansion radius
         *                      image1:
         *                          type: string
         *                          description: first image in base64 format
         *                      image2:
         *                          type: string
         *                          description: second image in base64 format
         *     responses:
         *       200:
         *         schema:
         *          $ref: '#/definitions/DifferenceResponse'
         *
         */
        this.router.post('/', async (req: Request, res: Response) => {
            // object of 2 images and radius
            const data = req.body;
            const image1Url = IMG_FOLDER + generateFileName(`${Date.now()}`);
            const image2Url = IMG_FOLDER + generateFileName(`${Date.now()}`);
            try {
                // Removes the base64 header
                data.image1 = data.image1.split(',')[1] ?? data.image1;
                data.image2 = data.image2.split(',')[1] ?? data.image2;

                const args: SaveImagesArgs = {
                    image1Base64: data.image1,
                    image2Base64: data.image2,
                    image1Url,
                    image2Url,
                };
                await saveImages(args);

                const differentPixels = await this.differencesService.detectDifferences(image1Url, image2Url, data.radius);

                res.status(StatusCodes.OK);
                res.json(differentPixels);
            } catch (error) {
                await deleteImages(image1Url, image2Url);
                res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
            }
        });
    }
}
