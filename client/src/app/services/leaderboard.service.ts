import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Leaderboard } from '@common/leaderboard';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class LeaderboardService {
    private readonly baseUrl: string;

    constructor(private readonly http: HttpClient) {
        this.baseUrl = environment.serverUrl;
    }

    getLeaderboardById(id: string): Observable<Leaderboard> {
        return this.http.get<Leaderboard>(`${this.baseUrl}/leaderboards/${id}`);
    }

    reset(id: string): Observable<object> {
        return this.http.patch(`${this.baseUrl}/leaderboards/${id}`, { observe: 'response', responseType: 'json' });
    }

    modifyLeaderboard(id: string, leaderboard: Leaderboard): Observable<HttpResponse<object>> {
        return this.http.put(`${this.baseUrl}/leaderboards/${id}`, leaderboard, { observe: 'response', responseType: 'json' });
    }

    addLeaderboard(leaderboard: Leaderboard): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/leaderboards/add`, leaderboard, { observe: 'response', responseType: 'text' });
    }

    deleteLeaderboards(id: string): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/leaderboards/${id}`, { observe: 'response', responseType: 'text' });
    }

    deleteAll(): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/leaderboards/`, { observe: 'response', responseType: 'text' });
    }
}
