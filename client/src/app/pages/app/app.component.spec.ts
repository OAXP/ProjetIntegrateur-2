import { TestBed } from '@angular/core/testing';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppComponent } from '@app/pages/app/app.component';
import { SocketClientService } from '@app/services/socket-client.service';
import SpyObj = jasmine.SpyObj;
import { MatDialog } from '@angular/material/dialog';
import { GameHandlerService } from '@app/services/game-handler.service';

describe('AppComponent', () => {
    let component: AppComponent;
    let socketClientServiceSpy: SpyObj<SocketClientService>;
    let matDialogSpy: SpyObj<MatDialog>;
    let gameHandlerServiceSpy: SpyObj<GameHandlerService>;

    beforeEach(() => {
        socketClientServiceSpy = jasmine.createSpyObj<SocketClientService>('SocketClientService', ['connect']);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['closeAll']);
        gameHandlerServiceSpy = jasmine.createSpyObj('GameHandlerService', ['handleSocket']);

        socketClientServiceSpy.connect.and.resolveTo();
        gameHandlerServiceSpy.handleSocket.and.returnValue();

        TestBed.configureTestingModule({
            imports: [AppRoutingModule],
            declarations: [AppComponent],
            providers: [
                { provide: GameHandlerService, useValue: gameHandlerServiceSpy },
                { provide: SocketClientService, useValue: socketClientServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
            ],
        }).compileComponents();

        const fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
    });

    it('should create the app and connect to socket on Init', () => {
        component.ngOnInit();
        expect(socketClientServiceSpy.connect).toHaveBeenCalled();
    });
});
