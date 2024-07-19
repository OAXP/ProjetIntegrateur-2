import { TestBed } from '@angular/core/testing';
import { BONUS_TIMER_MAX, BONUS_TIMER_MIN, INITIAL_TIMER_MAX, INITIAL_TIMER_MIN, PENALTY_TIMER_MAX, PENALTY_TIMER_MIN } from '@app/constants/consts';
import { GameConstants } from '@common/game-constants';
import { BehaviorSubject } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { SocketClientService } from './socket-client.service';
import { TimerService } from './timer.service';

describe('TimerService', () => {
    let service: TimerService;
    let clientSocketService: SocketClientService;

    beforeEach(() => {
        clientSocketService = new SocketClientService();
        clientSocketService.socket = io(environment.serverBaseUrl, { transports: ['websocket'] });
        TestBed.configureTestingModule({
            providers: [{ provide: SocketClientService, useValue: clientSocketService }],
        });
        service = TestBed.inject(TimerService);
        service.gameConstants = new BehaviorSubject<GameConstants>({
            initialTime: INITIAL_TIMER_MAX - 1,
            bonusTime: BONUS_TIMER_MAX - 1,
            penaltyTime: PENALTY_TIMER_MAX - 1,
        });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call onNewTimerConstants', () => {
        const spy = spyOn(service, 'onNewTimerConstants');
        spyOn(clientSocketService.socket, 'on').and.callFake((event, cb) => {
            cb({ initialTime: 55, bonusTime: 3, penaltyTime: 7 });
            expect(spy).toHaveBeenCalled();
            return clientSocketService.socket;
        });
        service.handleSockets();
        const newTimerConstants: GameConstants = { initialTime: 55, bonusTime: 3, penaltyTime: 7 };
        service.onNewTimerConstants(newTimerConstants);
    });

    it('should call onNewTimerConstants', () => {
        const newTimerConstants: GameConstants = { initialTime: 55, bonusTime: 3, penaltyTime: 7 };
        service.onNewTimerConstants(newTimerConstants);
        expect(service.gameConstants.value).toEqual({ initialTime: 55, bonusTime: 3, penaltyTime: 7 });
    });

    it('should call sendTimer', () => {
        const spy = spyOn(clientSocketService, 'send');
        const newTimerConstants: GameConstants = { initialTime: 55, bonusTime: 3, penaltyTime: 7 };
        service.gameConstants.next(newTimerConstants);
        service.sendTimer();
        expect(spy).toHaveBeenCalledWith('timer-updated', newTimerConstants);
    });

    it('should call initialTimerCheck and return true', () => {
        const ret: boolean = service.initialTimerCheck();
        expect(ret).toEqual(true);
    });

    it('should call initialTimerCheck and return false', () => {
        const newTimerConstants: GameConstants = { initialTime: INITIAL_TIMER_MAX, bonusTime: 3, penaltyTime: 7 };
        service.gameConstants.next(newTimerConstants);
        const ret: boolean = service.initialTimerCheck();
        expect(ret).toEqual(false);
    });

    it('should call initialTimerVerification with increment return true', () => {
        const functionCalled = 'increment';
        const ret: boolean = service.initialTimerVerification(functionCalled);
        expect(ret).toEqual(true);
    });

    it('should call initialTimerVerification with increment return true', () => {
        const newTimerConstants: GameConstants = { initialTime: INITIAL_TIMER_MIN, bonusTime: 5, penaltyTime: 5 };
        service.gameConstants.next(newTimerConstants);
        const functionCalled = 'increment';
        const ret: boolean = service.initialTimerVerification(functionCalled);
        expect(ret).toEqual(true);
    });

    it('should call initialTimerVerification with decrement return true', () => {
        const newTimerConstants: GameConstants = { initialTime: INITIAL_TIMER_MAX, bonusTime: 5, penaltyTime: 5 };
        service.gameConstants.next(newTimerConstants);
        const functionCalled = 'decrement';
        const ret: boolean = service.initialTimerVerification(functionCalled);
        expect(ret).toEqual(true);
    });

    it('should call initialTimerVerification return false', () => {
        const functionCalled = '';
        const ret: boolean = service.initialTimerVerification(functionCalled);
        expect(ret).toEqual(false);
    });

    it('should call bonusTimerCheck and return true', () => {
        const ret: boolean = service.bonusTimerCheck();
        expect(ret).toEqual(true);
    });

    it('should call bonusTimerCheck and return false', () => {
        const newTimerConstants: GameConstants = { initialTime: 60, bonusTime: BONUS_TIMER_MAX, penaltyTime: 7 };
        service.gameConstants.next(newTimerConstants);
        const ret: boolean = service.bonusTimerCheck();
        expect(ret).toEqual(false);
    });

    it('should call penaltyTimerCheck and return true', () => {
        const ret: boolean = service.penaltyTimerCheck();
        expect(ret).toEqual(true);
    });

    it('should call penaltyTimerCheck and return false', () => {
        const newTimerConstants: GameConstants = { initialTime: 5, bonusTime: 5, penaltyTime: PENALTY_TIMER_MAX };
        service.gameConstants.next(newTimerConstants);
        const ret: boolean = service.penaltyTimerCheck();
        expect(ret).toEqual(false);
    });

    it('should call bonusTimerVerification with increment return true', () => {
        const functionCalled = 'increment';
        const ret: boolean = service.bonusTimerVerification(functionCalled);
        expect(ret).toEqual(true);
    });

    it('should call bonusTimerVerification with increment return true', () => {
        const newTimerConstants: GameConstants = { initialTime: 30, bonusTime: BONUS_TIMER_MIN, penaltyTime: 5 };
        service.gameConstants.next(newTimerConstants);
        const functionCalled = 'increment';
        const ret: boolean = service.bonusTimerVerification(functionCalled);
        expect(ret).toEqual(true);
    });

    it('should call bonusTimerVerification with decrement return true', () => {
        const functionCalled = 'decrement';
        const ret: boolean = service.bonusTimerVerification(functionCalled);
        expect(ret).toEqual(true);
    });

    it('should call bonusTimerVerification with decrement return true', () => {
        const newTimerConstants: GameConstants = { initialTime: 30, bonusTime: BONUS_TIMER_MAX, penaltyTime: 5 };
        service.gameConstants.next(newTimerConstants);
        const functionCalled = 'decrement';
        const ret: boolean = service.bonusTimerVerification(functionCalled);
        expect(ret).toEqual(true);
    });

    it('should call bonusTimerVerification  return false', () => {
        const functionCalled = '';
        const ret: boolean = service.bonusTimerVerification(functionCalled);
        expect(ret).toEqual(false);
    });

    it('should call penaltyTimerVerification with increment return true', () => {
        const functionCalled = 'increment';
        const ret: boolean = service.penaltyTimerVerification(functionCalled);
        expect(ret).toEqual(true);
    });

    it('should call penaltyTimerVerification with increment return true', () => {
        const newTimerConstants: GameConstants = { initialTime: 30, bonusTime: 5, penaltyTime: PENALTY_TIMER_MIN };
        service.gameConstants.next(newTimerConstants);
        const functionCalled = 'increment';
        const ret: boolean = service.penaltyTimerVerification(functionCalled);
        expect(ret).toEqual(true);
    });

    it('should call penaltyTimerVerification with decrement return true', () => {
        const functionCalled = 'decrement';
        const ret: boolean = service.penaltyTimerVerification(functionCalled);
        expect(ret).toEqual(true);
    });

    it('should call penaltyTimerVerification with decrement return true', () => {
        const newTimerConstants: GameConstants = { initialTime: 30, bonusTime: 5, penaltyTime: PENALTY_TIMER_MAX };
        service.gameConstants.next(newTimerConstants);
        const functionCalled = 'decrement';
        const ret: boolean = service.penaltyTimerVerification(functionCalled);
        expect(ret).toEqual(true);
    });

    it('should call penaltyTimerVerification  return false', () => {
        const functionCalled = '';
        const ret: boolean = service.penaltyTimerVerification(functionCalled);
        expect(ret).toEqual(false);
    });

    it('should call increment with initial timer', () => {
        service.gameConstants = new BehaviorSubject<GameConstants>({ initialTime: 30, bonusTime: 5, penaltyTime: 5 });
        const currentValue: number = service.gameConstants.value.initialTime;
        const timerCalled = 'initialTime';
        service.increment(timerCalled);
        expect(service.gameConstants.value.initialTime).toEqual(currentValue + 1);
    });

    it('should call decrement with initial timer', () => {
        service.gameConstants = new BehaviorSubject<GameConstants>({ initialTime: 30, bonusTime: 5, penaltyTime: 5 });
        const currentValue: number = service.gameConstants.value.initialTime;
        const timerCalled = 'initialTime';
        service.decrement(timerCalled);
        expect(service.gameConstants.value.initialTime).toEqual(currentValue - 1);
    });

    it('should call increment with bonus timer', () => {
        service.gameConstants = new BehaviorSubject<GameConstants>({ initialTime: 30, bonusTime: 5, penaltyTime: 5 });
        const currentValue: number = service.gameConstants.value.bonusTime;
        const timerCalled = 'bonusTime';
        service.increment(timerCalled);
        expect(service.gameConstants.value.bonusTime).toEqual(currentValue + 1);
    });

    it('should call decrement with bonus timer', () => {
        service.gameConstants = new BehaviorSubject<GameConstants>({ initialTime: 30, bonusTime: 5, penaltyTime: 5 });
        const currentValue: number = service.gameConstants.value.bonusTime;
        const timerCalled = 'bonusTime';
        service.decrement(timerCalled);
        expect(service.gameConstants.value.bonusTime).toEqual(currentValue - 1);
    });

    it('should call increment with penalty timer', () => {
        service.gameConstants = new BehaviorSubject<GameConstants>({ initialTime: 30, bonusTime: 5, penaltyTime: 5 });
        const currentValue: number = service.gameConstants.value.penaltyTime;
        const timerCalled = 'penaltyTime';
        service.increment(timerCalled);
        expect(service.gameConstants.value.penaltyTime).toEqual(currentValue + 1);
    });
});
