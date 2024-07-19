import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HintService } from '@app/services/hint.service';
import { ReplayService } from '@app/services/replay.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimerService } from '@app/services/timer.service';
import { GameConstants } from '@common/game-constants';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CluesComponent } from './clues.component';
import SpyObj = jasmine.SpyObj;

describe('CluesComponent', () => {
    let component: CluesComponent;
    let fixture: ComponentFixture<CluesComponent>;
    let routerSpy: SpyObj<Router>;
    let dialogSpy: SpyObj<MatDialog>;
    let socketClientServiceSpy: SpyObj<SocketClientService>;
    let timerServiceSpy: SpyObj<TimerService>;
    let hintServiceSpy: SpyObj<HintService>;
    let replayServiceSpy: SpyObj<ReplayService>;
    let subscriptionToGameConstants: Subscription;

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        hintServiceSpy = jasmine.createSpyObj('HintService', ['getHints', 'useHint', 'resetHints']);
        socketClientServiceSpy = jasmine.createSpyObj('SocketClientService', ['send', 'on']);
        timerServiceSpy = jasmine.createSpyObj('TimerService', ['handleSockets']);
        replayServiceSpy = jasmine.createSpyObj('ReplayService', ['']);
        const gameConstants: GameConstants = { penaltyTime: 5, bonusTime: 5, initialTime: 120 };
        const gameConstantsSubject = new BehaviorSubject<GameConstants>(gameConstants);
        timerServiceSpy.gameConstants = gameConstantsSubject;
        subscriptionToGameConstants = timerServiceSpy.gameConstants.subscribe();
        await TestBed.configureTestingModule({
            declarations: [CluesComponent],
            imports: [HttpClientModule],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: SocketClientService, useValue: socketClientServiceSpy },
                { provide: TimerService, useValue: timerServiceSpy },
                { provide: HintService, useValue: hintServiceSpy },
                { provide: ReplayService, useValue: replayServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CluesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        subscriptionToGameConstants.unsubscribe();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return penaltyTime', () => {
        expect(component.penaltyTime).toEqual(component['gameConstants'].penaltyTime);
    });

    it('should return hints', () => {
        const numberOfHints = 3;
        hintServiceSpy.getHints.and.returnValue(numberOfHints);
        const returnValue = component.getHints();
        expect(returnValue).toEqual(numberOfHints);
    });

    it('should return replayService.isReplay', () => {
        replayServiceSpy.isReplay = true;
        const returnValue = component.isReplay();
        expect(returnValue).toBeTruthy();
    });

    it('should use hint', () => {
        component.useHint();
        expect(hintServiceSpy.useHint).toHaveBeenCalled();
    });

    it('should call useHint method when i key is pressed', () => {
        const clues = 5;
        spyOn(component, 'useHint');
        const event = new KeyboardEvent('keydown', { key: 'i' });
        component['messagesService']['isTyping'] = false;
        component['infosService']['endGame'] = false;
        hintServiceSpy.getHints.and.returnValue(clues);
        window.dispatchEvent(event);
        expect(component.useHint).toHaveBeenCalled();
    });
});
