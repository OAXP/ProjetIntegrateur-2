/* eslint-disable max-lines */
import { HttpClientModule, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { EndGameModalComponent } from '@app/components/end-game-modal/end-game-modal.component';
import { baseLeaderboard } from '@app/constants/consts';
import { gameMock1, gameMock2 } from '@app/constants/mock';
import { GameMode, GameStats } from '@common/game-stats';
import { Leaderboard } from '@common/leaderboard';
import { LobbyModes } from '@common/lobby-modes';
import { of } from 'rxjs';
import { InfosService } from './infos.service';
import { LeaderboardService } from './leaderboard.service';
import { MessagesService } from './messages.service';
import SpyObj = jasmine.SpyObj;

describe('InfosService', () => {
    let service: InfosService;
    let dialogSpy: SpyObj<MatDialog>;
    let messageServiceSpy: SpyObj<MessagesService>;

    beforeEach(() => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        messageServiceSpy = jasmine.createSpyObj('MessagesService', ['sendNewRecord']);
        TestBed.configureTestingModule({
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: MessagesService, useValue: messageServiceSpy },
            ],
            imports: [HttpClientModule],
        });
        service = TestBed.inject(InfosService);
        service['socketClientService'].connect();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set game values when setGame is called', () => {
        service.setGame(gameMock2);
        expect(service['game']['difficulty']).toEqual(gameMock2.difficulty);
        expect(service['game']['numberOfDifferences']).toEqual(gameMock2.numberOfDifferences);
        expect(service['endGame']).toEqual(false);
        expect(service['game']).toEqual(gameMock2);
        expect(service['totalDifferencesFound']).toEqual(0);
    });

    it('should set gameMode through setGameMode', () => {
        service.setGameMode(LobbyModes.ClassicDuo);
        expect(service['gameMode']).toEqual(LobbyModes.ClassicDuo);
    });
    it('should set playerName through setPlayerName', () => {
        service.setPlayerName('Player');
        expect(service['playerName']).toEqual('Player');
    });
    it('should set secondPlayerName through setSecondPlayerName', () => {
        service.setSecondPlayerName('Player2');
        expect(service['secondPlayerName']).toEqual('Player2');
    });

    it('should set endGame through setEndGame', () => {
        service.setEndGame(false);
        expect(service['endGame']).toBeFalsy();
    });
    it('should set differences found by player through playerDifferencesFound', () => {
        service.setPlayerDifferencesFound(3);
        expect(service['playerDifferencesFound']).toEqual(3);
    });

    it('should return the game', () => {
        service.setGame(gameMock1);
        expect(service.getGame()).toEqual(service['game']);
    });

    it('should increase differences found when inferior to game differences', () => {
        service.setGame(gameMock2);
        const newDifferencesValue = service['totalDifferencesFound'] + 1;
        service.increaseDifferences();
        expect(service['totalDifferencesFound']).toEqual(newDifferencesValue);
    });

    it('should not increase differences found when equal to game differences', () => {
        service.setGame(gameMock2);
        service['totalDifferencesFound'] = gameMock2.numberOfDifferences;
        service.increaseDifferences();
        const differences = gameMock2.numberOfDifferences;
        expect(service['totalDifferencesFound']).toEqual(differences);
    });

    it('should call verifyEnding when increasing differences', () => {
        const spy = spyOn(service, 'verifyEnding');
        service.setGame(gameMock2);
        service['totalDifferencesFound'] = 0;
        service.increaseDifferences();
        expect(spy).toHaveBeenCalled();
    });

    it('should not end the game when number of differences found are not equal to game differences in solo mode', () => {
        service.setGame(gameMock1);
        service['gameMode'] = LobbyModes.ClassicSolo;
        service.verifyEnding();
        expect(service['endGame']).toEqual(false);
        expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should end the game when number of differences found are equal to game differences in solo mode', () => {
        service.setGame(gameMock2);
        service['gameMode'] = LobbyModes.ClassicSolo;
        service['seconds'] = 10;
        service['minutes'] = 10;
        service['playerName'] = 'player';
        service['winner'] = service['playerName'];
        service['playerDifferencesFound'] = service['game']['numberOfDifferences'];
        service.verifyEnding();
        expect(service['endGame']).toEqual(true);
        expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('verifyEnding should call modifyLeaderboard at end of game', () => {
        const spy = spyOn(service, 'modifyLeaderboard');
        service.setGame(gameMock2);
        service['gameMode'] = LobbyModes.ClassicSolo;
        service['seconds'] = 10;
        service['minutes'] = 10;
        service['playerName'] = 'player';
        service['winner'] = service['playerName'];
        service['playerDifferencesFound'] = service['game']['numberOfDifferences'];
        service.verifyEnding();
        expect(spy).toHaveBeenCalled();
    });

    it('should open CongratsMessageComponent in solo mode', () => {
        service.setGame(gameMock2);
        service['gameMode'] = LobbyModes.ClassicSolo;
        service['seconds'] = 10;
        service['minutes'] = 10;
        service['playerName'] = 'player';
        service['winner'] = service['playerName'];
        service['playerDifferencesFound'] = service['game']['numberOfDifferences'];
        service.verifyEnding();
        expect(dialogSpy.open).toHaveBeenCalledWith(EndGameModalComponent);
    });

    it('modifyLeaderboard should modify infosService.won to false if player abandoned', () => {
        service['wasAbandoned'] = true;
        service.modifyLeaderboard();
        expect(service['won']).toEqual(false);
    });

    it('modifyLeaderboard should call leaderboardService getLeaderboard and modifyLeaderboard in solo mode', () => {
        const response: Leaderboard = {
            gameId: '1',
            leaderboardSolo: baseLeaderboard,
            leaderboardDuo: baseLeaderboard,
        };
        service.setGame(gameMock2);
        service['gameMode'] = LobbyModes.ClassicSolo;
        service['seconds'] = 0;
        service['minutes'] = 0;
        service['playerName'] = 'player';
        const getLeaderboardSpy = spyOn(LeaderboardService.prototype, 'getLeaderboardById').and.returnValue(of(response));
        const modifyLeaderboardSpy = spyOn(LeaderboardService.prototype, 'modifyLeaderboard').and.returnValue(of(new HttpResponse<object>()));
        service.modifyLeaderboard();
        expect(getLeaderboardSpy).toHaveBeenCalled();
        expect(modifyLeaderboardSpy).toHaveBeenCalled();
        expect(response.leaderboardSolo[0]).toEqual({ player: 'player', minutes: 0, seconds: 0 });
        expect(service['won']).toEqual(true);
    });

    it('modifyLeaderboard should call leaderboardService getLeaderboard and modifyLeaderboard in duo mode', () => {
        const response: Leaderboard = {
            gameId: '1',
            leaderboardSolo: baseLeaderboard,
            leaderboardDuo: baseLeaderboard,
        };
        service.setGame(gameMock2);
        service['gameMode'] = LobbyModes.ClassicDuo;
        service['socketClientService'].socket.id = 'id';
        service['seconds'] = 0;
        service['minutes'] = 0;
        service['winner'] = 'player';
        const getLeaderboardSpy = spyOn(LeaderboardService.prototype, 'getLeaderboardById').and.returnValue(of(response));
        const modifyLeaderboardSpy = spyOn(LeaderboardService.prototype, 'modifyLeaderboard');
        service.modifyLeaderboard('id');
        expect(getLeaderboardSpy).toHaveBeenCalled();
        expect(modifyLeaderboardSpy).toHaveBeenCalled();
        expect(response.leaderboardDuo[0]).toEqual({ player: 'player', minutes: 0, seconds: 0 });
        expect(service['won']).toEqual(true);
    });

    it('modifyLeaderboard should update all positions in duo mode', () => {
        const response: Leaderboard = {
            gameId: '2',
            leaderboardSolo: baseLeaderboard,
            leaderboardDuo: [
                { player: 'no_name', minutes: 0, seconds: 45 },
                { player: 'no_name', minutes: 0, seconds: 47 },
                { player: 'no_name', minutes: 0, seconds: 50 },
            ],
        };
        service['gameMode'] = LobbyModes.ClassicDuo;
        service.setGame(gameMock2);
        service['socketClientService'].socket.id = 'id';
        service['seconds'] = 40;
        service['minutes'] = 0;
        service['winner'] = 'player';
        const spy = spyOn(service, 'sendNewRecord');
        spyOn(LeaderboardService.prototype, 'getLeaderboardById').and.returnValue(of(response));
        spyOn(LeaderboardService.prototype, 'modifyLeaderboard').and.returnValue(of(new HttpResponse<object>()));
        service.modifyLeaderboard('id');
        expect(response.leaderboardDuo[1]).toEqual({ player: 'no_name', minutes: 0, seconds: 45 });
        expect(response.leaderboardDuo[2]).toEqual({ player: 'no_name', minutes: 0, seconds: 47 });
        expect(service['won']).toEqual(true);
        expect(spy).toHaveBeenCalled();
    });

    it('modifyLeaderboard should update the second position in duo mode', () => {
        const response: Leaderboard = {
            gameId: '2',
            leaderboardSolo: baseLeaderboard,
            leaderboardDuo: [
                { player: 'no_name', minutes: 0, seconds: 0 },
                { player: 'no_name', minutes: 5, seconds: 50 },
                { player: 'no_name', minutes: 5, seconds: 50 },
            ],
        };
        service['gameMode'] = LobbyModes.ClassicDuo;
        service.setGame(gameMock2);
        service['socketClientService'].socket.id = 'id';
        service['seconds'] = 40;
        service['minutes'] = 5;
        service['winner'] = 'player';
        spyOn(LeaderboardService.prototype, 'getLeaderboardById').and.returnValue(of(response));
        spyOn(LeaderboardService.prototype, 'modifyLeaderboard').and.returnValue(of(new HttpResponse<object>()));
        service.modifyLeaderboard('id');
        expect(response.leaderboardDuo[1]).toEqual({ player: 'player', minutes: 5, seconds: 40 });
        expect(service['won']).toEqual(true);
    });

    it('modifyLeaderboard should update the third position in duo mode', () => {
        const response: Leaderboard = {
            gameId: '2',
            leaderboardSolo: baseLeaderboard,
            leaderboardDuo: [
                { player: 'no_name', minutes: 0, seconds: 0 },
                { player: 'no_name', minutes: 0, seconds: 0 },
                { player: 'no_name', minutes: 5, seconds: 50 },
            ],
        };
        service.setGame(gameMock2);
        service['gameMode'] = LobbyModes.ClassicDuo;
        service['socketClientService'].socket.id = 'id';
        service['seconds'] = 0;
        service['minutes'] = 0;
        service['winner'] = 'player';
        spyOn(LeaderboardService.prototype, 'getLeaderboardById').and.returnValue(of(response));
        spyOn(LeaderboardService.prototype, 'modifyLeaderboard').and.returnValue(of(new HttpResponse<object>()));
        service.modifyLeaderboard('id');
        expect(response.leaderboardDuo[2]).toEqual({ player: 'player', minutes: 0, seconds: 0 });
        expect(service['won']).toEqual(true);
    });

    it('modifyLeaderboard should update the second position when first and second scores are equal in duo mode', () => {
        const response: Leaderboard = {
            gameId: '2',
            leaderboardSolo: baseLeaderboard,
            leaderboardDuo: [
                { player: 'no_name', minutes: 0, seconds: 0 },
                { player: 'no_name', minutes: 5, seconds: 50 },
                { player: 'no_name', minutes: 5, seconds: 50 },
            ],
        };
        service.setGame(gameMock2);
        service['gameMode'] = LobbyModes.ClassicDuo;
        service['socketClientService'].socket.id = 'id';
        service['seconds'] = 0;
        service['minutes'] = 0;
        service['winner'] = 'player';
        const spy = spyOn(service, 'sendNewRecord');
        spyOn(LeaderboardService.prototype, 'getLeaderboardById').and.returnValue(of(response));
        spyOn(LeaderboardService.prototype, 'modifyLeaderboard').and.returnValue(of(new HttpResponse<object>()));
        service.modifyLeaderboard('id');
        expect(response.leaderboardDuo[1]).toEqual({ player: 'player', minutes: 0, seconds: 0 });
        expect(service['won']).toEqual(true);
        expect(spy).toHaveBeenCalled();
    });

    it('modifyLeaderboard should update the last position when second and third scores are equal in duo mode', () => {
        const response: Leaderboard = {
            gameId: '2',
            leaderboardSolo: baseLeaderboard,
            leaderboardDuo: [
                { player: 'no_name', minutes: 0, seconds: 0 },
                { player: 'no_name', minutes: 5, seconds: 40 },
                { player: 'no_name', minutes: 5, seconds: 50 },
            ],
        };
        service.setGame(gameMock2);
        service['gameMode'] = LobbyModes.ClassicDuo;
        service['socketClientService'].socket.id = 'id';
        service['seconds'] = 40;
        service['minutes'] = 5;
        service['playerName'] = 'player';
        service['winner'] = service['playerName'];
        spyOn(LeaderboardService.prototype, 'getLeaderboardById').and.returnValue(of(response));
        spyOn(LeaderboardService.prototype, 'modifyLeaderboard').and.returnValue(of(new HttpResponse<object>()));
        service.modifyLeaderboard('id');
        expect(response.leaderboardDuo[2]).toEqual({ player: 'player', minutes: 5, seconds: 40 });
        expect(service['won']).toEqual(true);
    });

    it('modifyLeaderboard should update all positions in solo mode', () => {
        const response: Leaderboard = {
            gameId: '2',
            leaderboardSolo: [
                { player: 'no_name', minutes: 0, seconds: 45 },
                { player: 'no_name', minutes: 0, seconds: 47 },
                { player: 'no_name', minutes: 0, seconds: 50 },
            ],
            leaderboardDuo: baseLeaderboard,
        };
        service['gameMode'] = LobbyModes.ClassicSolo;
        service.setGame(gameMock2);
        service['seconds'] = 40;
        service['minutes'] = 0;
        service['playerName'] = 'player';
        spyOn(LeaderboardService.prototype, 'getLeaderboardById').and.returnValue(of(response));
        spyOn(LeaderboardService.prototype, 'modifyLeaderboard').and.returnValue(of(new HttpResponse<object>()));
        service.modifyLeaderboard('id');
        expect(response.leaderboardSolo[1]).toEqual({ player: 'no_name', minutes: 0, seconds: 45 });
        expect(response.leaderboardSolo[2]).toEqual({ player: 'no_name', minutes: 0, seconds: 47 });
        expect(service['won']).toEqual(true);
    });

    it('modifyLeaderboard should update the second position in solo mode', () => {
        const response: Leaderboard = {
            gameId: '2',
            leaderboardSolo: [
                { player: 'no_name', minutes: 0, seconds: 0 },
                { player: 'no_name', minutes: 5, seconds: 50 },
                { player: 'no_name', minutes: 5, seconds: 50 },
            ],
            leaderboardDuo: baseLeaderboard,
        };
        service['gameMode'] = LobbyModes.ClassicSolo;
        service.setGame(gameMock2);
        service['seconds'] = 40;
        service['minutes'] = 5;
        service['playerName'] = 'player';
        const spy = spyOn(service, 'sendNewRecord');
        spyOn(LeaderboardService.prototype, 'getLeaderboardById').and.returnValue(of(response));
        spyOn(LeaderboardService.prototype, 'modifyLeaderboard').and.returnValue(of(new HttpResponse<object>()));
        service.modifyLeaderboard('id');
        expect(response.leaderboardSolo[1]).toEqual({ player: 'player', minutes: 5, seconds: 40 });
        expect(service['won']).toEqual(true);
        expect(spy).toHaveBeenCalled();
    });

    it('modifyLeaderboard should update the third position in solo mode', () => {
        const response: Leaderboard = {
            gameId: '2',
            leaderboardSolo: [
                { player: 'no_name', minutes: 0, seconds: 0 },
                { player: 'no_name', minutes: 0, seconds: 0 },
                { player: 'no_name', minutes: 5, seconds: 50 },
            ],
            leaderboardDuo: baseLeaderboard,
        };
        service.setGame(gameMock2);
        service['gameMode'] = LobbyModes.ClassicSolo;
        service['seconds'] = 0;
        service['minutes'] = 0;
        service['playerName'] = 'player';
        spyOn(LeaderboardService.prototype, 'getLeaderboardById').and.returnValue(of(response));
        spyOn(LeaderboardService.prototype, 'modifyLeaderboard').and.returnValue(of(new HttpResponse<object>()));
        service.modifyLeaderboard('id');
        expect(response.leaderboardSolo[2]).toEqual({ player: 'player', minutes: 0, seconds: 0 });
        expect(service['won']).toEqual(true);
    });

    it('modifyLeaderboard should update the second position when first and second scores are equal in solo mode', () => {
        const response: Leaderboard = {
            gameId: '2',
            leaderboardSolo: [
                { player: 'no_name', minutes: 0, seconds: 0 },
                { player: 'no_name', minutes: 5, seconds: 50 },
                { player: 'no_name', minutes: 5, seconds: 50 },
            ],
            leaderboardDuo: baseLeaderboard,
        };
        service.setGame(gameMock2);
        service['gameMode'] = LobbyModes.ClassicSolo;
        service['seconds'] = 0;
        service['minutes'] = 0;
        service['playerName'] = 'player';
        const spy = spyOn(service, 'sendNewRecord');
        spyOn(LeaderboardService.prototype, 'getLeaderboardById').and.returnValue(of(response));
        spyOn(LeaderboardService.prototype, 'modifyLeaderboard').and.returnValue(of(new HttpResponse<object>()));
        service.modifyLeaderboard('id');
        expect(response.leaderboardSolo[1]).toEqual({ player: 'player', minutes: 0, seconds: 0 });
        expect(service['won']).toEqual(true);
        expect(spy).toHaveBeenCalled();
    });

    it('modifyLeaderboard should update the last position when second and third scores are equal in solo mode', () => {
        const response: Leaderboard = {
            gameId: '2',
            leaderboardSolo: [
                { player: 'no_name', minutes: 0, seconds: 0 },
                { player: 'no_name', minutes: 5, seconds: 40 },
                { player: 'no_name', minutes: 5, seconds: 50 },
            ],
            leaderboardDuo: baseLeaderboard,
        };
        service.setGame(gameMock2);
        service['gameMode'] = LobbyModes.ClassicSolo;
        service['seconds'] = 40;
        service['minutes'] = 5;
        service['playerName'] = 'player';
        spyOn(LeaderboardService.prototype, 'getLeaderboardById').and.returnValue(of(response));
        spyOn(LeaderboardService.prototype, 'modifyLeaderboard').and.returnValue(of(new HttpResponse<object>()));
        service.modifyLeaderboard('id');
        expect(response.leaderboardSolo[2]).toEqual({ player: 'player', minutes: 5, seconds: 40 });
        expect(service['won']).toEqual(true);
    });

    it('should call getter wonTheGame and should be false by default', () => {
        const bool = true;
        service.setWonTheGame = bool;
        expect(service.wonTheGame).toEqual(bool);
    });

    it('should call setGameMode', () => {
        const lobbyMode: LobbyModes = LobbyModes.ClassicSolo;
        service.setGameMode(lobbyMode);
        expect(service['gameMode']).toEqual(lobbyMode);
    });

    it('should call setGame', () => {
        const game = gameMock1;
        service.setGame(game);
        expect(service['endGame']).toEqual(false);
        expect(service['game']).toEqual(game);
        expect(service['playerDifferencesFound']).toEqual(0);
        expect(service['totalDifferencesFound']).toEqual(0);
    });

    it('should call setPlayerName', () => {
        const name = 'Shady';
        service.setPlayerName(name);
        expect(service['playerName']).toEqual(name);
    });

    it('should call setSecondPlayerName', () => {
        const name = 'Shady';
        service.setSecondPlayerName(name);
        expect(service['secondPlayerName']).toEqual(name);
    });

    it('should call setEndGame', () => {
        const bool = true;
        service.setEndGame(bool);
        expect(service['endGame']).toEqual(bool);
    });

    it('should call setPlayerDifferencesFound', () => {
        const diffFound = 5;
        service.setPlayerDifferencesFound(diffFound);
        expect(service['playerDifferencesFound']).toEqual(diffFound);
    });

    it('should call setTotalDifferencesFound', () => {
        const totalDiffFound = 5;
        service.setTotalDifferencesFound(totalDiffFound);
        expect(service['totalDifferencesFound']).toEqual(totalDiffFound);
    });

    it('should call setEndTime', () => {
        const minutes = 1;
        const seconds = 30;
        service.setEndTime(minutes, seconds);
        expect(service['minutes']).toEqual(minutes);
        expect(service['seconds']).toEqual(seconds);
    });

    it('should call setWinner', () => {
        const winner = 'Shady';
        service.setWinner(winner);
        expect(service['winner']).toEqual(winner);
    });

    it('should call getGameMode', () => {
        const lobbyMode: LobbyModes = LobbyModes.ClassicSolo;
        service['gameMode'] = lobbyMode;
        expect(service.getGameMode()).toEqual(lobbyMode);
    });

    it('should call getPlayerName', () => {
        const playerName = 'Shady';
        service['playerName'] = playerName;
        expect(service.getPlayerName()).toEqual(playerName);
    });

    it('should call getSecondPlayerName', () => {
        const playerName = 'Shady';
        service['secondPlayerName'] = playerName;
        expect(service.getSecondPlayerName()).toEqual(playerName);
    });

    it('should call getGameDifferences', () => {
        service['game'] = gameMock1;
        expect(service.getGameDifferences()).toEqual(gameMock1.numberOfDifferences);
    });

    it('should call getTotalDifferencesFound', () => {
        const diff = 5;
        service['totalDifferencesFound'] = diff;
        expect(service.getTotalDifferencesFound()).toEqual(diff);
    });

    it('should call getPlayerDifferencesFound', () => {
        const diff = 5;
        service['playerDifferencesFound'] = diff;
        expect(service.getPlayerDifferencesFound()).toEqual(diff);
    });

    it('should call getEndGame', () => {
        const bool = true;
        service['endGame'] = bool;
        expect(service.getEndGame()).toEqual(bool);
    });

    it('should call getDifficulty', () => {
        service['game'] = gameMock1;
        expect(service.getDifficulty()).toEqual(gameMock1.difficulty);
    });

    it('should call getWinner', () => {
        const winner = 'Shady';
        service['winner'] = winner;
        expect(service.getWinner()).toEqual(winner);
    });

    it('should call setGameParams', () => {
        const gameParam: GameStats = {
            startTime: 30,
            duration: 5,
            mode: GameMode.ClassicSolo,
            firstPlayerName: 'Shady',
        };
        service.setGameParams(gameParam);
        expect(service['gameStats']['startTime']).toEqual(gameParam.startTime);
        expect(service['gameStats']['duration']).toEqual(gameParam.duration);
        expect(service['gameStats']['mode']).toEqual(GameMode.ClassicSolo);
        expect(service['gameStats']['firstPlayerName']).toEqual(gameParam.firstPlayerName);
    });

    it('should call getGameStats', () => {
        const gameParam: GameStats = {
            startTime: 30,
            duration: 5,
            mode: GameMode.ClassicSolo,
            firstPlayerName: 'Shady',
        };
        service['gameStats'] = gameParam;
        expect(service.getGameStats()).toEqual(gameParam);
    });

    it('should call sendNewRecord with index = 0', () => {
        const index = 0;
        const position = 'ère';
        service['game'] = gameMock1;
        const currentDate = 20230804;
        spyOn(Date, 'now').and.returnValue(currentDate);
        service.sendNewRecord(index);
        expect(messageServiceSpy.sendNewRecord).toHaveBeenCalledWith({
            title: 'record',
            body:
                service.getPlayerName() +
                ' obtient la ' +
                (index + 1) +
                '' +
                position +
                ' place dans les meilleurs temps du jeu ' +
                service['game']['name'] +
                ' en ' +
                service.getGameMode(),
            date: Date.now(),
        });
    });

    it('should call sendNewRecord with index != 0', () => {
        const index = 10;
        const position = 'ème';
        service['game'] = gameMock1;
        const currentDate = 20230804;
        spyOn(Date, 'now').and.returnValue(currentDate);
        service.sendNewRecord(index);
        expect(messageServiceSpy.sendNewRecord).toHaveBeenCalledWith({
            title: 'record',
            body:
                service.getPlayerName() +
                ' obtient la ' +
                (index + 1) +
                '' +
                position +
                ' place dans les meilleurs temps du jeu ' +
                service['game']['name'] +
                ' en ' +
                service.getGameMode(),
            date: Date.now(),
        });
    });
});
