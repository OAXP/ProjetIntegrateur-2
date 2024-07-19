import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimitedChoiceModalComponent } from './limited-choice-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import SpyObj = jasmine.SpyObj;
import { GameCreatorService } from '@app/services/game-creator.service';
import { InfosService } from '@app/services/infos.service';
import { LobbyModes } from '@common/lobby-modes';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MessagesService } from '@app/services/messages.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { gameMock1 } from '@app/constants/mock';

describe('LimitedChoiceModalComponent', () => {
    let component: LimitedChoiceModalComponent;
    let fixture: ComponentFixture<LimitedChoiceModalComponent>;
    let routerSpy: SpyObj<Router>;
    let snackbarSpy: SpyObj<MatSnackBar>;
    let matDialogSpy: SpyObj<MatDialog>;
    let gameCreatorSpy: SpyObj<GameCreatorService>;
    let infosServiceSpy: SpyObj<InfosService>;
    let messagesServiceSpy: SpyObj<MessagesService>;
    let socketClientServiceSpy: SpyObj<SocketClientService>;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const mockFunction = () => {};

    beforeEach(() => {
        // @ts-ignore
        matDialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['closeAll', 'open']);
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
        routerSpy.navigate.and.resolveTo();
        snackbarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
        gameCreatorSpy = jasmine.createSpyObj<GameCreatorService>('GameCreatorService', ['createGame']);
        gameCreatorSpy.createGame.and.returnValue();
        infosServiceSpy = jasmine.createSpyObj<InfosService>('InfosService', ['setGameMode', 'setPlayerName', 'setGame']);
        infosServiceSpy.setGameMode.and.callFake((value: LobbyModes) => {
            infosServiceSpy['gameMode'] = value;
        });
        infosServiceSpy.setPlayerName.and.callFake((value: string) => {
            infosServiceSpy['playerName'] = value;
        });
        messagesServiceSpy = jasmine.createSpyObj<MessagesService>('MessagesService', ['resetMessages']);
        socketClientServiceSpy = jasmine.createSpyObj('SocketClientService', ['send', 'on']);
        socketClientServiceSpy.socket = io(environment.serverBaseUrl, { transports: ['websocket'] });

        TestBed.configureTestingModule({
            declarations: [LimitedChoiceModalComponent],
            providers: [
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: Router, useValue: routerSpy },
                { provide: MatSnackBar, useValue: snackbarSpy },
                { provide: GameCreatorService, useValue: gameCreatorSpy },
                { provide: InfosService, useValue: infosServiceSpy },
                { provide: MessagesService, useValue: messagesServiceSpy },
                { provide: SocketClientService, useValue: socketClientServiceSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(LimitedChoiceModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('chosenMode should return option value', () => {
        component['option'] = '2';
        expect(component.chosenMode).toEqual(component['option']);
    });

    it('name should return playerName value', () => {
        component['playerName'] = 'name';
        expect(component.name).toEqual(component['playerName']);
    });

    it('chosenMode should set option value', () => {
        component['option'] = '2';
        component.chosenMode = '1';
        expect(component['option']).toEqual('1');
    });

    it('name should set playerName value', () => {
        component['playerName'] = 'name';
        component.name = 'name1';
        expect(component['playerName']).toEqual('name1');
    });

    it('should open with the correct message', () => {
        const message = 'Test message';
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        snackbarSpy.open.and.callFake(() => {});
        component.openSnack(message);
        expect(snackbarSpy.open).toHaveBeenCalledWith(message, 'Fermer', { duration: 2000 });
    });

    it('soloHandler() should call the correct functions', async () => {
        // @ts-ignore
        const onceSpy = spyOn(socketClientServiceSpy.socket, 'once').and.callFake(mockFunction);

        await component.soloHandler();

        expect(infosServiceSpy.setGameMode).toHaveBeenCalled();
        expect(messagesServiceSpy.resetMessages).toHaveBeenCalled();
        expect(gameCreatorSpy.createGame).toHaveBeenCalled();
        expect(onceSpy).toHaveBeenCalled();
    });

    it('onInitGameLimited() should call the correct functions', async () => {
        await component.onInitGameLimited(gameMock1);

        expect(infosServiceSpy.setGame).toHaveBeenCalled();
        expect(matDialogSpy.closeAll).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('coopHandler() should call the correct functions', async () => {
        await component.coopHandler();

        expect(infosServiceSpy.setGameMode).toHaveBeenCalled();
        expect(matDialogSpy.closeAll).toHaveBeenCalled();
        expect(matDialogSpy.open).toHaveBeenCalled();
    });

    it('confirmHandler() should not call setPlayerName if name is invalid and call openSnack', async () => {
        const openSnackSpy = spyOn(component, 'openSnack').and.returnValue();
        spyOn(component, 'soloHandler').and.resolveTo();
        spyOn(component, 'coopHandler').and.returnValue();

        component['playerName'] = ' ';

        await component.confirmHandler();

        expect(infosServiceSpy.setPlayerName).not.toHaveBeenCalled();
        expect(openSnackSpy).toHaveBeenCalled();
    });

    it('confirmHandler() should call setPlayerName if name is valid', async () => {
        const openSnackSpy = spyOn(component, 'openSnack').and.returnValue();
        spyOn(component, 'soloHandler').and.resolveTo();
        spyOn(component, 'coopHandler').and.returnValue();

        component['playerName'] = 'name';

        await component.confirmHandler();

        expect(infosServiceSpy.setPlayerName).toHaveBeenCalled();
        expect(openSnackSpy).not.toHaveBeenCalled();
    });

    it('confirmHandler() should call soloHandler if name is valid and option is 1', async () => {
        const soloHandlerSpy = spyOn(component, 'soloHandler').and.resolveTo();

        component['playerName'] = 'name';
        component['option'] = '1';

        await component.confirmHandler();

        expect(soloHandlerSpy).toHaveBeenCalled();
    });

    it('confirmHandler() should call coopHandler if name is valid and option is 2', async () => {
        const coopHandlerSpy = spyOn(component, 'coopHandler').and.resolveTo();

        component['playerName'] = 'name';
        component['option'] = '2';

        await component.confirmHandler();

        expect(coopHandlerSpy).toHaveBeenCalled();
    });
});
