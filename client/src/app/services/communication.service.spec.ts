import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { gameMock1 } from '@app/constants/mock';
import { CommunicationService } from '@app/services/communication.service';
import { DifferenceResponse } from '@common/difference-response';
import { Game } from '@common/game';
import { Message } from '@common/message';

describe('CommunicationService', () => {
    let httpMock: HttpTestingController;
    let service: CommunicationService;
    let baseUrl: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(CommunicationService);
        httpMock = TestBed.inject(HttpTestingController);
        // eslint-disable-next-line dot-notation -- baseUrl is private and we need access for the test
        baseUrl = service['baseUrl'];
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getGames should retrieve a list of games', () => {
        // @ts-ignore
        service.getGames().subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: (response: Message) => {
                expect(typeof response).toBe(typeof ([] as Game[]));
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/games`);
        expect(req.request.method).toBe('GET');
    });

    it('getDiffInto should return a DifferenceResponse', () => {
        // @ts-ignore
        service.getDifferencesInfo().subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: (response: Message) => {
                expect(typeof response).toBe(typeof ({} as DifferenceResponse));
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/differences`);
        expect(req.request.method).toBe('POST');
    });

    it('cancelGame should just send a status code', () => {
        // @ts-ignore
        service.cancelGame().subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: (response: Message) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/games/cancel`);
        expect(req.request.method).toBe('POST');
    });
    it('saveGame should just send a status code', () => {
        // @ts-ignore
        service.saveGame(gameMock1).subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: (response: Message) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/games/add`);
        expect(req.request.method).toBe('POST');
    });
    it('deleteGame should just send a status code', () => {
        // @ts-ignore
        service.deleteGame(gameMock1.id).subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: (response: Message) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/games/${gameMock1.id}`);
        expect(req.request.method).toBe('DELETE');
    });

    it('deleteGames should just send a status code', () => {
        // @ts-ignore
        service.deleteGames().subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: (response: Message) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/games/`);
        expect(req.request.method).toBe('DELETE');
    });
});
