import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DifferenceResponse } from '@common/difference-response';
import { Game } from '@common/game';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    private readonly baseUrl: string;

    constructor(private readonly http: HttpClient) {
        this.baseUrl = environment.serverUrl;
    }

    getGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.baseUrl}/games`);
    }

    getDifferencesInfo(image1: string, image2: string, radius: number): Observable<HttpResponse<DifferenceResponse>> {
        const body = {
            radius,
            image1,
            image2,
        };
        return this.http.post<DifferenceResponse>(`${this.baseUrl}/differences`, body, { observe: 'response', responseType: 'json' });
    }

    cancelGame(game: DifferenceResponse): Observable<HttpResponse<object>> {
        return this.http.post(`${this.baseUrl}/games/cancel`, game, { observe: 'response', responseType: 'json' });
    }

    saveGame(game: Game): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/games/add`, game, { observe: 'response', responseType: 'text' });
    }

    deleteGame(id: string): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/games/${id}`, { observe: 'response', responseType: 'text' });
    }

    deleteGames(): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/games/`, { observe: 'response', responseType: 'text' });
    }
}
