import { LeaderboardService } from '@app/services/leaderboard.service';
import { Leaderboard } from '@common/leaderboard';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class LeaderboardController {
    router: Router;

    constructor(private readonly leaderboardService: LeaderboardService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/:id', async (req: Request, res: Response) => {
            try {
                const leaderboard = await this.leaderboardService.getLeaderboardById(req.params.id);
                res.status(StatusCodes.OK).json(leaderboard);
            } catch (e) {
                if (e.name === 'ENOENT' || e.code === 'ENOENT') {
                    res.sendStatus(StatusCodes.NO_CONTENT);
                    return;
                }
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.post('/add', async (req: Request, res: Response) => {
            const data: Leaderboard = req.body;
            try {
                await this.leaderboardService.addLeaderboard(data);
                res.sendStatus(StatusCodes.CREATED);
            } catch (e) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: e.message }).send();
            }
        });

        this.router.delete('/:id', async (req: Request, res: Response) => {
            const gameId = req.params.id;
            try {
                await this.leaderboardService.deleteLeaderboards(gameId);
                res.sendStatus(StatusCodes.NO_CONTENT);
            } catch (e) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });

        this.router.delete('/', async (req: Request, res: Response) => {
            try {
                await this.leaderboardService.deleteAll();
                res.sendStatus(StatusCodes.NO_CONTENT);
            } catch (e) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });

        this.router.put('/:id', async (req: Request, res: Response) => {
            const gameId = req.params.id;
            const leaderboard = req.body;
            try {
                await this.leaderboardService.modifyLeaderboard(gameId, leaderboard);
                res.sendStatus(StatusCodes.NO_CONTENT);
            } catch (e) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.patch('/:id', async (req: Request, res: Response) => {
            const gameId = req.params.id;
            try {
                await this.leaderboardService.resetLeaderboards(gameId);
                res.sendStatus(StatusCodes.NO_CONTENT);
            } catch (e) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });
    }
}
