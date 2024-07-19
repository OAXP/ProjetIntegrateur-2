import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { gameMock1 } from '@app/constants/mock';
import { GameCreatorService } from '@app/services/game-creator.service';
import { InfosService } from '@app/services/infos.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Subject } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { WaitingRoomFirstPlayerComponent } from './waiting-room-first-player.component';
import SpyObj = jasmine.SpyObj;

describe('WaitingRoomFirstPlayerComponent', () => {
    let component: WaitingRoomFirstPlayerComponent;
    let fixture: ComponentFixture<WaitingRoomFirstPlayerComponent>;
    let gameCreatorServiceSpy: SpyObj<GameCreatorService>;
    let matDialogSpy: SpyObj<MatDialog>;
    let infosServiceSpy: SpyObj<InfosService>;
    let snackBarSpy: SpyObj<MatSnackBar>;
    let clientSocketServiceSpy: SocketClientService;

    beforeEach(() => {
        infosServiceSpy = jasmine.createSpyObj('InfosService', ['setGameMode', 'getGame'], { game: gameMock1 });
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['closeAll', 'open']);
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
        clientSocketServiceSpy = new SocketClientService();
        gameCreatorServiceSpy = jasmine.createSpyObj('GameCreatorService', [
            'handleSockets',
            'cancelGameCreation',
            'acceptSecondPlayer',
            'rejectSecondPlayer',
            'secondPlayerNameSubject',
        ]);
        gameCreatorServiceSpy.handleSockets.and.returnValue();
        gameCreatorServiceSpy.handleSockets.and.returnValue();
        // @ts-ignore
        gameCreatorServiceSpy['secondPlayerNameSubject'] = new Subject<undefined>();
        clientSocketServiceSpy.socket = io(environment.serverBaseUrl, { transports: ['websocket'] });

        TestBed.configureTestingModule({
            declarations: [WaitingRoomFirstPlayerComponent],
            providers: [
                { provide: GameCreatorService, useValue: gameCreatorServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
                { provide: InfosService, useValue: infosServiceSpy },
                { provide: SocketClientService, useValue: clientSocketServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingRoomFirstPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call cancel', () => {
        component.cancel();
        expect(gameCreatorServiceSpy.cancelGameCreation).toHaveBeenCalled();
    });

    it('should call acceptSecondPlayer', () => {
        component.acceptPlayer();
        expect(gameCreatorServiceSpy.acceptSecondPlayer).toHaveBeenCalled();
    });

    it('should call rejectSecondPlayer', () => {
        component.rejectPlayer();
        expect(gameCreatorServiceSpy.rejectSecondPlayer).toHaveBeenCalled();
    });

    it('should call closeAll and snackBar.open', () => {
        const gameIdMock = '1';
        infosServiceSpy.getGame.and.returnValue(gameMock1);
        infosServiceSpy.getGame().id = gameIdMock;
        component.onGameDeletion(gameIdMock);
        expect(matDialogSpy.closeAll).toHaveBeenCalled();
        expect(snackBarSpy.open).toHaveBeenCalled();
    });

    it('should call onNameAssignation and set a name', () => {
        const name = 'Shady';
        component.onNameAssignation(name);
        expect(component.secondUserName).toEqual(name);
    });
});
