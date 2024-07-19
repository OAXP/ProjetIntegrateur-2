import { Injectable } from '@angular/core';
import { BONUS_TIMER_MAX, BONUS_TIMER_MIN, INITIAL_TIMER_MAX, INITIAL_TIMER_MIN, PENALTY_TIMER_MAX, PENALTY_TIMER_MIN } from '@app/constants/consts';
import { GameConstants } from '@common/game-constants';
import { BehaviorSubject } from 'rxjs';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class TimerService {
    gameConstants: BehaviorSubject<GameConstants>;

    constructor(private socketClientService: SocketClientService) {
        this.handleSockets();
        this.socketClientService.send('get-game-constant');
        this.gameConstants = new BehaviorSubject<GameConstants>({ bonusTime: 5, initialTime: 30, penaltyTime: 5 });
    }

    handleSockets(): void {
        this.socketClientService.socket.on('new-timer-constants', (gameConstants: GameConstants) => this.onNewTimerConstants(gameConstants));
    }

    onNewTimerConstants = (gameConstant: GameConstants) => {
        this.gameConstants.next(gameConstant);
    };

    sendTimer(): void {
        this.socketClientService.send('timer-updated', this.gameConstants.value);
    }

    increment(timerToIncrement: string): void {
        const functionCalled = 'increment';
        if (timerToIncrement === 'initialTime' && this.initialTimerVerification(functionCalled)) this.gameConstants.value.initialTime++;
        else if (timerToIncrement === 'bonusTime' && this.bonusTimerVerification(functionCalled)) this.gameConstants.value.bonusTime++;
        else if (timerToIncrement === 'penaltyTime' && this.penaltyTimerVerification(functionCalled)) this.gameConstants.value.penaltyTime++;
    }

    decrement(timerToDecrement: string): void {
        const functionCalled = 'decrement';
        if (timerToDecrement === 'initialTime' && this.initialTimerVerification(functionCalled)) this.gameConstants.value.initialTime--;
        else if (timerToDecrement === 'bonusTime' && this.bonusTimerVerification(functionCalled)) this.gameConstants.value.bonusTime--;
        else if (timerToDecrement === 'penaltyTime' && this.penaltyTimerVerification(functionCalled)) this.gameConstants.value.penaltyTime--;
    }

    initialTimerVerification(functionCalled: string): boolean {
        if (functionCalled === 'increment') {
            return this.initialTimerCheck() || this.gameConstants.value.initialTime === INITIAL_TIMER_MIN;
        } else if (functionCalled === 'decrement') {
            return this.initialTimerCheck() || this.gameConstants.value.initialTime === INITIAL_TIMER_MAX;
        }
        return false;
    }

    initialTimerCheck(): boolean {
        return this.gameConstants.value.initialTime > INITIAL_TIMER_MIN && this.gameConstants.value.initialTime < INITIAL_TIMER_MAX;
    }

    bonusTimerVerification(functionCalled: string): boolean {
        if (functionCalled === 'increment') {
            return this.bonusTimerCheck() || this.gameConstants.value.bonusTime === BONUS_TIMER_MIN;
        } else if (functionCalled === 'decrement') {
            return this.bonusTimerCheck() || this.gameConstants.value.bonusTime === BONUS_TIMER_MAX;
        }
        return false;
    }

    bonusTimerCheck(): boolean {
        return this.gameConstants.value.bonusTime > BONUS_TIMER_MIN && this.gameConstants.value.bonusTime < BONUS_TIMER_MAX;
    }

    penaltyTimerVerification(functionCalled: string): boolean {
        if (functionCalled === 'increment') {
            return this.penaltyTimerCheck() || this.gameConstants.value.penaltyTime === PENALTY_TIMER_MIN;
        } else if (functionCalled === 'decrement') {
            return this.penaltyTimerCheck() || this.gameConstants.value.penaltyTime === PENALTY_TIMER_MAX;
        }
        return false;
    }

    penaltyTimerCheck(): boolean {
        return this.gameConstants.value.penaltyTime > PENALTY_TIMER_MIN && this.gameConstants.value.penaltyTime < PENALTY_TIMER_MAX;
    }
}
