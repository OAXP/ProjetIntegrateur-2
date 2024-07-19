import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { gameMock1 } from '@app/constants/mock';
import { GameCreatorService } from '@app/services/game-creator.service';
import { InfosService } from '@app/services/infos.service';
import { LobbyModes } from '@common/lobby-modes';
import { NameModalComponent } from './name-modal.component';
import SpyObj = jasmine.SpyObj;
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('NameModalComponent', () => {
    let infosServiceSpy: SpyObj<InfosService>;
    let matDialogSpy: SpyObj<MatDialog>;
    let routerSpy: SpyObj<Router>;
    let component: NameModalComponent;
    let fixture: ComponentFixture<NameModalComponent>;
    let gameCreatorServiceSpy: SpyObj<GameCreatorService>;

    beforeEach(() => {
        infosServiceSpy = jasmine.createSpyObj('InfosService', ['setGameMode', 'setPlayerName', 'setGameMode', 'getGameMode', 'getGame'], {
            game: gameMock1,
        });
        infosServiceSpy.getGame.and.returnValue(gameMock1);
        infosServiceSpy.setPlayerName.and.callFake((value: string) => {
            infosServiceSpy['playerName'] = value;
        });
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['closeAll', 'open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        gameCreatorServiceSpy = jasmine.createSpyObj('GameCreatorService', ['handleSockets', 'createGame', 'joinGame']);
        gameCreatorServiceSpy.handleSockets.and.returnValue();

        TestBed.configureTestingModule({
            declarations: [NameModalComponent],
            providers: [
                { provide: GameCreatorService, useValue: gameCreatorServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: InfosService, useValue: infosServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(NameModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set and get name', () => {
        const name = 'Shady';
        component.name = name;
        expect(component['playerName']).toEqual(name);
    });

    it('should call verifyPlayerName when button is clicked', (done) => {
        const spy = spyOn(component, 'verifyPlayerName');

        const button = fixture.debugElement.query(By.css('#next'));
        button.triggerEventHandler('click');

        fixture.whenStable().then(() => {
            expect(spy).toHaveBeenCalled();
            done();
        });
    });

    it('should alert when no name is provided', () => {
        component['playerName'] = '';
        const spy = spyOn(window, 'alert');

        component.verifyPlayerName();

        expect(spy).toHaveBeenCalled();
    });

    it('should alert when an invalid name is provided', () => {
        component['playerName'] = '   ';
        const spy = spyOn(window, 'alert');

        component.verifyPlayerName();

        expect(spy).toHaveBeenCalled();
    });

    it('should call play when a valid user name is provided', () => {
        component['playerName'] = 'Louis';
        const spy = spyOn(component, 'play');

        component.verifyPlayerName();

        expect(spy).toHaveBeenCalled();
    });

    it('play should set game infos and navigate to game page with ClassicSolo', () => {
        component['playerName'] = 'Louis';
        infosServiceSpy.getGameMode.and.returnValue(LobbyModes.ClassicSolo);
        component.verifyPlayerName();

        expect(infosServiceSpy['playerName']).toEqual('Louis');
        expect(gameCreatorServiceSpy.createGame).toHaveBeenCalledOnceWith(LobbyModes.ClassicSolo);
        expect(matDialogSpy.closeAll).toHaveBeenCalled();
        expect(gameCreatorServiceSpy.createGame).toHaveBeenCalledWith(LobbyModes.ClassicSolo);
        expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/game']);
    });

    it('play should set game infos and navigate to game page with ClassicSolo', () => {
        const spy = spyOn(component, 'openWaitingRoom');
        component['playerName'] = 'Louis';
        infosServiceSpy.getGameMode.and.returnValue(LobbyModes.ClassicDuo);
        component.verifyPlayerName();

        expect(infosServiceSpy['playerName']).toEqual('Louis');
        expect(spy).toHaveBeenCalled();
    });

    it('should call createGame with ClassicSolo mode and navigate to /game', () => {
        infosServiceSpy.getGameMode.and.returnValue(LobbyModes.ClassicSolo);
        component.play();

        expect(gameCreatorServiceSpy.createGame).toHaveBeenCalledOnceWith(LobbyModes.ClassicSolo);
        expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('should call openWaitingRoom with a game available or gameMode DuoJoin', () => {
        const name = 'Shady';
        component['playerName'] = name;
        infosServiceSpy['gameMode'] = LobbyModes.DuoJoin;
        component.openWaitingRoom();

        expect(gameCreatorServiceSpy.joinGame).toHaveBeenCalledOnceWith(name);
        expect(matDialogSpy.open).toHaveBeenCalled();
    });

    it('should call openWaitingRoom with no games available and gameMode isnt DuoJoin', () => {
        const name = 'Shady';
        component['playerName'] = name;
        infosServiceSpy['gameMode'] = LobbyModes.ClassicSolo;
        infosServiceSpy['game'].available = false;
        component.openWaitingRoom();

        expect(matDialogSpy.open).toHaveBeenCalled();
    });
});
