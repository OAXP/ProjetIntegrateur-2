import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitingCoopModalComponent } from './waiting-coop-modal.component';
import SpyObj = jasmine.SpyObj;
import { MatDialogRef } from '@angular/material/dialog';
import { InfosService } from '@app/services/infos.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Game } from '@common/game';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { gameMock1 } from '@app/constants/mock';

describe('WaitingCoopModalComponent', () => {
    let component: WaitingCoopModalComponent;
    let fixture: ComponentFixture<WaitingCoopModalComponent>;
    let dialogRefSpy: SpyObj<MatDialogRef<WaitingCoopModalComponent>>;
    let infosServiceSpy: SpyObj<InfosService>;
    let socketClientServiceSpy: SpyObj<SocketClientService>;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const mockFunction = () => {};

    beforeEach(() => {
        infosServiceSpy = jasmine.createSpyObj<InfosService>('InfosService', ['getPlayerName', 'setGame']);
        infosServiceSpy.setGame.and.callFake((value: Game) => {
            infosServiceSpy['game'] = value;
        });
        dialogRefSpy = jasmine.createSpyObj<MatDialogRef<WaitingCoopModalComponent>>('MatDialogRef', ['close']);
        socketClientServiceSpy = jasmine.createSpyObj('SocketClientService', ['send', 'on']);
        socketClientServiceSpy.socket = io(environment.serverBaseUrl, { transports: ['websocket'] });

        TestBed.configureTestingModule({
            declarations: [WaitingCoopModalComponent],
            providers: [
                { provide: SocketClientService, useValue: socketClientServiceSpy },
                { provide: InfosService, useValue: infosServiceSpy },
                { provide: MatDialogRef, useValue: dialogRefSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingCoopModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit() should emit once and enable two event listeners', () => {
        // @ts-ignore
        const emitSpy = spyOn(socketClientServiceSpy.socket, 'emit').and.callFake(mockFunction);
        // @ts-ignore
        const onceSpy = spyOn(socketClientServiceSpy.socket, 'once').and.callFake(mockFunction);
        component.ngOnInit();
        expect(emitSpy).toHaveBeenCalledTimes(1);
        expect(onceSpy).toHaveBeenCalledTimes(2);
    });

    it('ngOnDestroy() should remove event listeners', () => {
        // @ts-ignore
        const removeListenerSpy = spyOn(socketClientServiceSpy.socket, 'removeListener').and.callFake(mockFunction);
        component.ngOnDestroy();
        expect(removeListenerSpy).toHaveBeenCalledTimes(2);
    });

    it('onGameFoundCoop() should set game and close modal', () => {
        component.onGameFoundCoop(gameMock1);
        expect(infosServiceSpy.setGame).toHaveBeenCalled();
        expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('onGameRoomId() should set currentGameRoomId correctly', () => {
        component.onGameRoomId('room');
        expect(socketClientServiceSpy.currentGameRoomId).toEqual('room');
    });

    it('cancel() should emit and close modal', () => {
        // @ts-ignore
        const emitSpy = spyOn(socketClientServiceSpy.socket, 'emit').and.callFake(mockFunction);
        component.cancel();
        expect(emitSpy).toHaveBeenCalled();
        expect(dialogRefSpy.close).toHaveBeenCalled();
    });
});
