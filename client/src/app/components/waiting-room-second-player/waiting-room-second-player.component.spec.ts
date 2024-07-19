import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { gameMock1 } from '@app/constants/mock';
import { GameCreatorService } from '@app/services/game-creator.service';
import { InfosService } from '@app/services/infos.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Subject } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { WaitingRoomSecondPlayerComponent } from './waiting-room-second-player.component';
import SpyObj = jasmine.SpyObj;

describe('WaitingRoomSecondPlayerComponent', () => {
    let component: WaitingRoomSecondPlayerComponent;
    let fixture: ComponentFixture<WaitingRoomSecondPlayerComponent>;

    let infosServiceSpy: SpyObj<InfosService>;
    let matDialogSpy: SpyObj<MatDialog>;
    let routerSpy: SpyObj<Router>;
    let gameCreatorServiceSpy: SpyObj<GameCreatorService>;
    let snackMock: SpyObj<MatSnackBar>;
    let clientSocketService: SocketClientService;

    beforeEach(() => {
        infosServiceSpy = jasmine.createSpyObj('InfosService', ['setGameMode', 'getGame'], { game: gameMock1 });
        infosServiceSpy.getGame.and.returnValue(gameMock1);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['closeAll', 'open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        snackMock = jasmine.createSpyObj('MatSnackBar', ['open']);
        gameCreatorServiceSpy = jasmine.createSpyObj('GameCreatorService', [
            'handleSockets',
            'createGame',
            'joinGame',
            'firstPlayerSubject',
            'cancelRequest',
        ]);
        clientSocketService = new SocketClientService();
        gameCreatorServiceSpy.handleSockets.and.returnValue();
        // @ts-ignore
        gameCreatorServiceSpy['firstPlayerSubject'] = new Subject<undefined>();
        clientSocketService.socket = io(environment.serverBaseUrl, { transports: ['websocket'] });

        TestBed.configureTestingModule({
            declarations: [WaitingRoomSecondPlayerComponent],
            providers: [
                { provide: GameCreatorService, useValue: gameCreatorServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: InfosService, useValue: infosServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: MatSnackBar, useValue: snackMock },
                { provide: SocketClientService, useValue: clientSocketService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingRoomSecondPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call getter', () => {
        const reject = false;
        component['rejected'] = reject;
        expect(component.wasRejected).toEqual(reject);
    });

    it('should set rejected to false', () => {
        component.onRejection();
        expect(component.wasRejected).toEqual(true);
    });

    it('should call closeAll and snackBar.open', () => {
        const gameIdMock = '1';
        infosServiceSpy['game'].id = gameIdMock;
        component.onGameDeletion(gameIdMock);
        expect(matDialogSpy.closeAll).toHaveBeenCalled();
        expect(snackMock.open).toHaveBeenCalled();
    });

    it('should call cancelRequest and closeAll', () => {
        component.cancel();
        expect(gameCreatorServiceSpy.cancelRequest).toHaveBeenCalled();
        expect(matDialogSpy.closeAll).toHaveBeenCalled();
    });
});
