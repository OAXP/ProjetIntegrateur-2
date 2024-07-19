import { HttpResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { gameMock1 } from '@app/constants/mock';
import { CommunicationService } from '@app/services/communication.service';
import { GameSelectorService } from '@app/services/game-selector.service';
import { LeaderboardService } from '@app/services/leaderboard.service';
import { TimerService } from '@app/services/timer.service';
import { Game } from '@common/game';
import { GameConstants } from '@common/game-constants';
import { BehaviorSubject, of } from 'rxjs';
import { ConfigurationComponent } from './configuration.component';
import SpyObj = jasmine.SpyObj;

describe('ConfigurationComponent', () => {
    let gameSelectorServiceSpy: SpyObj<GameSelectorService>;
    let timerServiceSpy: SpyObj<TimerService>;
    let leaderboardServiceSpy: SpyObj<LeaderboardService>;
    let communicationServiceSpy: SpyObj<CommunicationService>;
    let dialog: SpyObj<MatDialog>;
    let component: ConfigurationComponent;
    let fixture: ComponentFixture<ConfigurationComponent>;

    beforeEach(() => {
        gameSelectorServiceSpy = jasmine.createSpyObj('GameSelectorService', ['arrowLeft', 'arrowRight', 'fetchGames'], {
            gamesToDisplay: new BehaviorSubject<Game[]>([]),
            disableArrow: new BehaviorSubject<boolean[]>([false, false]),
        });
        timerServiceSpy = jasmine.createSpyObj('TimerService', ['arrowLeft', 'arrowRight', 'fetchGames', 'increment', 'decrement', 'sendTimer'], {
            gameConstants: new BehaviorSubject<GameConstants>({ bonusTime: 5, initialTime: 30, penaltyTime: 5 }),
        });
        dialog = jasmine.createSpyObj<MatDialog>(['open']);
        gameSelectorServiceSpy.gamesToDisplay = new BehaviorSubject<Game[]>([]);
        gameSelectorServiceSpy.disableArrow = new BehaviorSubject<boolean[]>([false, false]);
        timerServiceSpy.gameConstants = new BehaviorSubject<GameConstants>({ bonusTime: 5, initialTime: 30, penaltyTime: 5 });

        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['deleteGames']);
        leaderboardServiceSpy = jasmine.createSpyObj('LeaderboardService', ['deleteAll', 'reset']);

        TestBed.configureTestingModule({
            declarations: [ConfigurationComponent],
            providers: [
                { provide: MatDialog, useValue: dialog },
                { provide: MatIconModule, useValue: {} },
                { provide: GameSelectorService, useValue: gameSelectorServiceSpy },
                { provide: TimerService, useValue: timerServiceSpy },
                { provide: LeaderboardService, useValue: leaderboardServiceSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(ConfigurationComponent);
        component = fixture.componentInstance;
        component.gameConstant = { initialTime: 30, bonusTime: 5, penaltyTime: 5 };
        timerServiceSpy.gameConstants = new BehaviorSubject<GameConstants>({ initialTime: 30, bonusTime: 5, penaltyTime: 5 });
        fixture.detectChanges();
    });

    it('should create with initial values', () => {
        expect(component).toBeTruthy();
        expect(component.games).toEqual([]);
    });

    it('should call arrowLeft function', () => {
        const spy = spyOn(component, 'arrowLeft').and.callThrough();

        const button = fixture.debugElement.query(By.css('#left_arrow'));
        button.triggerEventHandler('click');

        fixture.whenStable().then(() => {
            expect(spy).toHaveBeenCalled();
        });

        expect(gameSelectorServiceSpy.arrowLeft).toHaveBeenCalled();
    });

    it('should call arrowLeft function', () => {
        const spy = spyOn(component, 'arrowRight').and.callThrough();

        const button = fixture.debugElement.query(By.css('#right_arrow'));
        button.triggerEventHandler('click');

        fixture.whenStable().then(() => {
            expect(spy).toHaveBeenCalled();
        });

        expect(gameSelectorServiceSpy.arrowRight).toHaveBeenCalled();
    });

    it('should modify resetConfirmation based on confirm boolean', () => {
        const bool = true;
        component.reset = bool;
        expect(component.resettingConfirmation).toEqual(bool);
    });

    it('should modify resetConfirmation based on confirm boolean', () => {
        const bool = false;
        component.reset = bool;
        expect(component.resettingConfirmation).toEqual(bool);
    });

    it('should call confirmDelete and change the bool value to opposite', () => {
        const bool = false;
        component.reset = bool;
        component.confirmDelete();
        expect(component.deletionConfirmation).toEqual(!bool);
    });

    it('should call confirmReset and change the bool value to opposite', () => {
        const bool = false;
        component.reset = bool;
        component.confirmReset();
        expect(component.resettingConfirmation).toEqual(!bool);
    });

    it('should call cancel and change the bool value to opposite', () => {
        const bool = false;
        component.reset = bool;
        component.deleteConfirm = bool;
        component.cancel();
        expect(component.resettingConfirmation).toEqual(!bool);
        expect(component.deletionConfirmation).toEqual(!bool);
    });

    it('should call increment on button click', () => {
        fixture.detectChanges();
        const incButtonInitialTime = fixture.debugElement.query(By.css('#init-inc')).nativeElement;
        const spy = spyOn(component, 'increment');
        incButtonInitialTime.click();
        expect(spy).toHaveBeenCalled();
    });

    it('should call decrement on button click', () => {
        fixture.detectChanges();
        const decButtonInitialTime = fixture.debugElement.query(By.css('#init-dec')).nativeElement;
        const spy = spyOn(component, 'decrement');
        decButtonInitialTime.click();
        expect(spy).toHaveBeenCalled();
    });

    it('should call increment with initialTime', () => {
        const timer = 'initialTime';
        component.increment('initialTime');
        expect(timerServiceSpy.increment).toHaveBeenCalledWith(timer);
        expect(timerServiceSpy.sendTimer).toHaveBeenCalled();
    });

    it('should call decrement with initialTime', () => {
        const timer = 'initialTime';
        component.decrement('initialTime');
        expect(timerServiceSpy.decrement).toHaveBeenCalledWith(timer);
        expect(timerServiceSpy.sendTimer).toHaveBeenCalled();
    });

    it('should call openHistoryModal', () => {
        component.openHistoryModal();
        expect(dialog.open).toHaveBeenCalled();
    });

    it('deleteGames should call communicationService.deleteGames, deleteAll and fetchGames', () => {
        communicationServiceSpy.deleteGames.and.returnValue(of(new HttpResponse<string>()));
        leaderboardServiceSpy.deleteAll.and.returnValue(of(new HttpResponse<string>()));
        const spy = spyOn(component, 'confirmDelete');
        component.deleteGames();
        expect(communicationServiceSpy.deleteGames).toHaveBeenCalled();
        expect(leaderboardServiceSpy.deleteAll).toHaveBeenCalled();
        expect(gameSelectorServiceSpy.fetchGames).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
        expect(component.games).toEqual([]);
    });

    it('resetGames should call leaderboardService.reset', () => {
        component['gameList'] = [gameMock1];
        leaderboardServiceSpy.reset.and.returnValue(of(new Object()));
        const spy = spyOn(component, 'confirmReset');
        component.resetGames();
        expect(leaderboardServiceSpy.reset).toHaveBeenCalled();
        expect(gameSelectorServiceSpy.fetchGames).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
    });
});
