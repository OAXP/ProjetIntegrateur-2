import { GameHandlerService } from '@app/services/game-handler.service';
import { SocketManagerService } from '@app/services/socket-manager.service';
import { DifferenceResponse } from '@common/difference-response';
import { Game } from '@common/game';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class GameHandlerController {
    router: Router;

    constructor(private readonly gameHandlerService: GameHandlerService, private socketManagerService: SocketManagerService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        /**
         * @swagger
         * tags:
         *   - name: GameHandler
         *     description: Game creator End Point
         */

        /**
         * @swagger
         * definitions:
         *  Game:
         *    type: object
         *    properties:
         *      name:
         *        type: string
         *        description: The name of the game
         *      diffPixelsCount:
         *        type: integer
         *        format: int32
         *        description: The number of different pixels between the two images
         *      numDiff:
         *        type: integer
         *        format: int32
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
         *      diffImageUrl:
         *        type: string
         *        description: The URL of the difference image
         */

        /**
         * @swagger
         * definitions:
         *  Game:
         *    type: object
         *    properties:
         *      name:
         *        type: string
         *        description: The name of the game
         *      diffPixelsCount:
         *        type: integer
         *        format: int32
         *        description: The number of different pixels between the two images
         *      numDiff:
         *        type: integer
         *        format: int32
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
         *      diffImageUrl:
         *        type: string
         *        description: The URL of the difference image
         */

        /**
         * @swagger
         *
         * /api/games:
         *     get:
         *          description: Returns all games
         *          tags:
         *            - GameHandler
         *          responses:
         *              200:
         *                  description: success
         *                  application/json:
         *                      schema:
         *                          type: array
         *                          items:
         *                              $ref: '#/definitions/Game'
         *
         */
        this.router.get('/', async (req: Request, res: Response) => {
            try {
                const games = await this.gameHandlerService.getAllGames();
                res.status(StatusCodes.OK).json(games);
            } catch (e) {
                if (e.name === 'ENOENT' || e.code === 'ENOENT') {
                    res.sendStatus(StatusCodes.NO_CONTENT);
                    return;
                }
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        /**
         * @swagger
         *
         * /api/games/add:
         *     post:
         *          description: Adds the game to games.json
         *          tags:
         *            - GameHandler
         *          requestBody:
         *              content:
         *                  application/json:
         *                      schema:
         *                          $ref: '#/definitions/Game'
         *          responses:
         *              201:
         *                  description: success
         *
         */
        this.router.post('/add', async (req: Request, res: Response) => {
            const data: Game = req.body;

            try {
                await this.gameHandlerService.saveGame(data);
                res.sendStatus(StatusCodes.CREATED);
            } catch (e) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: e.message }).send();
            }
        });

        /**
         * @swagger
         *
         * /api/games/cancel:
         *     post:
         *          description: Cancels the provided info by deleting created files
         *          tags:
         *            - GameHandler
         *          requestBody:
         *              content:
         *                  application/json:
         *                      schema:
         *                          $ref: '#/definitions/DiffResponse'
         *          responses:
         *              200:
         *                  description: success
         *
         */
        this.router.post('/cancel', async (req: Request, res: Response) => {
            const data: DifferenceResponse = req.body;

            try {
                await this.gameHandlerService.cancelGame(data);
                res.sendStatus(StatusCodes.NO_CONTENT);
            } catch (e) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: e.message }).send();
            }
        });

        /**
         * @swagger
         *
         * /api/games/{gameId}:
         *      delete:
         *          description: Deletes a game using the provided ID
         *          tags:
         *            - GameHandler
         *          parameters:
         *            - in: path
         *              name: gameId
         *              required: true
         *              schema:
         *                  type: string
         *              description: The game ID
         *          responses:
         *              400:
         *                  description: No ID provided
         *              200:
         *                  description: The game was deleted
         *              500:
         *                  description: Server Error
         */
        this.router.delete('/:gameId', async (req: Request, res: Response) => {
            const gameId = req.params.gameId;

            try {
                await this.gameHandlerService.deleteGame(gameId);
                this.socketManagerService.sio.emit('game-delete', gameId);

                res.sendStatus(StatusCodes.NO_CONTENT);
            } catch (e) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });

        /**
         * @swagger
         *
         * /api/games/:
         *      delete:
         *          description: Deletes all games
         *          tags:
         *            - GameHandler
         *
         *          responses:
         *              204:
         *                  description: The game was deleted
         *
         *              500:
         *                  description: Server Error
         */
        this.router.delete('/', async (req: Request, res: Response) => {
            try {
                await this.gameHandlerService.deleteGames();
                res.sendStatus(StatusCodes.NO_CONTENT);
            } catch (e) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });
    }
}
