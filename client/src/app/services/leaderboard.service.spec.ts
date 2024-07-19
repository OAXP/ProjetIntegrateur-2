import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { baseLeaderboard } from '@app/constants/consts';
import { Leaderboard } from '@common/leaderboard';
import { LeaderboardService } from './leaderboard.service';

describe('LeaderboardService', () => {
    let httpMock: HttpTestingController;
    let service: LeaderboardService;
    let baseUrl: string;
    const mockLeaderboard: Leaderboard = {
        gameId: '1',
        leaderboardSolo: baseLeaderboard,
        leaderboardDuo: baseLeaderboard,
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, HttpClientTestingModule],
        });
        service = TestBed.inject(LeaderboardService);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = service['baseUrl'];
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getLeaderboardById should return leaderboard', () => {
        service.getLeaderboardById(mockLeaderboard.gameId).subscribe({
            next: (response) => {
                expect(typeof response).toBe(typeof ({} as Leaderboard));
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/leaderboards/${mockLeaderboard.gameId}`);
        expect(req.request.method).toBe('GET');
    });

    it('reset should reset the values of leaderboards', () => {
        service.reset(mockLeaderboard.gameId).subscribe({
            next: (response) => {
                expect(typeof response).toBe(typeof ({} as object));
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/leaderboards/${mockLeaderboard.gameId}`);
        expect(req.request.method).toBe('PATCH');
    });

    it('modifyLeaderboard should modify game leaderboard', () => {
        const leaderboard = {
            gameId: '2',
            leaderboardSolo: baseLeaderboard,
            leaderboardDuo: baseLeaderboard,
        };
        service.modifyLeaderboard(mockLeaderboard.gameId, leaderboard).subscribe({
            next: (response) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/leaderboards/${mockLeaderboard.gameId}`);
        expect(req.request.method).toBe('PUT');
    });

    it('addLeaderboard add leaderboard to game', () => {
        service.addLeaderboard(mockLeaderboard).subscribe({
            next: (response) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/leaderboards/add`);
        expect(req.request.method).toBe('POST');
    });

    it('deleteLeaderboards should game leaderboards', () => {
        service.deleteLeaderboards(mockLeaderboard.gameId).subscribe({
            next: (response) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/leaderboards/${mockLeaderboard.gameId}`);
        expect(req.request.method).toBe('DELETE');
    });

    it('deleteAll should delete all leaderboards', () => {
        service.deleteAll().subscribe({
            next: (response) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/leaderboards/`);
        expect(req.request.method).toBe('DELETE');
    });
});
