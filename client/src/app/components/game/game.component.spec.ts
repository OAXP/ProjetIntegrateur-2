import { HttpClientModule, HttpResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { baseLeaderboard } from '@app/constants/consts';
import { gameMock1 } from '@app/constants/mock';
import { CommunicationService } from '@app/services/communication.service';
import { GameCreatorService } from '@app/services/game-creator.service';
import { GameSelectorService } from '@app/services/game-selector.service';
import { InfosService } from '@app/services/infos.service';
import { LeaderboardService } from '@app/services/leaderboard.service';
import { LobbyModes } from '@common/lobby-modes';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GameComponent } from './game.component';
import SpyObj = jasmine.SpyObj;

describe('GameComponent', () => {
    const response = {
        gameId: '2',
        leaderboardSolo: baseLeaderboard,
        leaderboardDuo: baseLeaderboard,
    };
    let component: GameComponent;
    let fixture: ComponentFixture<GameComponent>;
    let dialogSpy: SpyObj<MatDialog>;
    let infosServiceSpy: SpyObj<InfosService>;
    let gameCreatorSpy: SpyObj<GameCreatorService>;
    let communicationServiceSpy: SpyObj<CommunicationService>;
    let gameSelectorServiceSpy: SpyObj<GameSelectorService>;
    let leaderboardServiceSpy: SpyObj<LeaderboardService>;

    beforeEach(() => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        infosServiceSpy = jasmine.createSpyObj('InfosService', ['setGame']);
        gameCreatorSpy = jasmine.createSpyObj('GameCreatorService', ['createGame']);
        infosServiceSpy = jasmine.createSpyObj('InfosService', ['setGame', 'setGameMode']);
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['deleteGame', 'deleteGames']);
        gameSelectorServiceSpy = jasmine.createSpyObj('GameSelectorService', ['fetchGames']);
        leaderboardServiceSpy = jasmine.createSpyObj('LeaderboardService', ['getLeaderboardById', 'reset', 'deleteLeaderboards']);

        TestBed.configureTestingModule({
            declarations: [GameComponent],
            imports: [HttpClientModule],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: InfosService, useValue: infosServiceSpy },
                { provide: GameCreatorService, useValue: gameCreatorSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: GameSelectorService, useValue: gameSelectorServiceSpy },
                { provide: LeaderboardService, useValue: leaderboardServiceSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(GameComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        component.gameInput = gameMock1;
        const spy = spyOn(component, 'getGameLeaderboards');
        fixture.detectChanges();
        leaderboardServiceSpy.getLeaderboardById.and.returnValue(of(response));

        expect(spy).toHaveBeenCalled();
        expect(component).toBeTruthy();
    });

    it('openDialog should call the correct functions', () => {
        component.gameInput = gameMock1;

        component.openDialog(LobbyModes.ClassicSolo);
        expect(infosServiceSpy.setGame).toHaveBeenCalledWith(component.gameInput);
        expect(infosServiceSpy.setGameMode).toHaveBeenCalledWith(LobbyModes.ClassicSolo);
        expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('confirmDeletion should toggle the deleteConfirmation property', () => {
        component.gameInput = gameMock1;

        component['deleteConfirmation'] = false;
        component.confirmDeletion();
        expect(component['deleteConfirmation']).toBeTruthy();
    });

    it('confirmReset should toggle the resetConfirmation property', () => {
        component.gameInput = gameMock1;

        component['resetConfirmation'] = true;
        component.confirmReset();
        expect(component['deleteConfirmation']).toBeFalsy();
    });

    it('deletionConfirmation should return deleteConfirmation value', () => {
        const value = component.deletionConfirmation;
        expect(value).toEqual(component['deleteConfirmation']);
    });

    it('resettingConfirmation should return resetConfirmation value', () => {
        const value = component.resettingConfirmation;
        expect(value).toEqual(component['resetConfirmation']);
    });
    it('deleteGame should call communicationService.deleteGame and deleteLeaderboards on success', () => {
        component.gameInput = gameMock1;
        const spy = spyOn(component, 'deleteLeaderboards');
        communicationServiceSpy.deleteGame.and.returnValue(of(new HttpResponse<string>()));
        component.deleteGame('id');
        expect(spy).toHaveBeenCalled();
        expect(communicationServiceSpy.deleteGame).toHaveBeenCalledWith('id');
    });

    it('getGameLeaderboards should call leaderboardService.getLeaderboardById', () => {
        component.gameInput = gameMock1;
        leaderboardServiceSpy.getLeaderboardById.and.returnValue(of(response));

        component.getGameLeaderboards('id');
        expect(leaderboardServiceSpy.getLeaderboardById).toHaveBeenCalled();
        expect(component['leaderboard']).toBeTruthy();
    });

    it('resetLeaderboards should call leaderboardService.reset and communicationService.fetchGames on success', () => {
        component.gameInput = gameMock1;
        leaderboardServiceSpy.reset.and.returnValue(of(new Object()));

        component.resetLeaderboards('id');
        expect(leaderboardServiceSpy.reset).toHaveBeenCalled();
        expect(gameSelectorServiceSpy.fetchGames).toHaveBeenCalled();
    });

    it('deleteLeaderboards should call leaderboardService.deleteLeaderboards and communicationService.fetchGames on success', () => {
        component.gameInput = gameMock1;

        leaderboardServiceSpy.deleteLeaderboards.and.returnValue(of(new HttpResponse<string>()));

        component.deleteLeaderboards('id');
        expect(leaderboardServiceSpy.deleteLeaderboards).toHaveBeenCalled();
        expect(gameSelectorServiceSpy.fetchGames).toHaveBeenCalled();
    });

    it('serverEnvironment should return environment.serverBaseUrl value', () => {
        component.gameInput = gameMock1;

        const value = component.serverEnvironment;
        expect(value).toEqual(environment.serverBaseUrl);
    });
});
