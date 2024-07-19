import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EndLimitedModalComponent } from './end-limited-modal.component';
import { MatDialog } from '@angular/material/dialog';
import SpyObj = jasmine.SpyObj;
import { GameCreatorService } from '@app/services/game-creator.service';
import { Router } from '@angular/router';

describe('EndLimitedModalComponent', () => {
    let component: EndLimitedModalComponent;
    let fixture: ComponentFixture<EndLimitedModalComponent>;
    let matDialogSpy: SpyObj<MatDialog>;
    let gameCreatorSpy: SpyObj<GameCreatorService>;
    let routerSpy: SpyObj<Router>;

    beforeEach(() => {
        matDialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['closeAll']);
        gameCreatorSpy = jasmine.createSpyObj<GameCreatorService>('GameCreatorService', ['closeGame']);
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
        routerSpy.navigate.and.resolveTo();

        TestBed.configureTestingModule({
            declarations: [EndLimitedModalComponent],
            providers: [
                { provide: GameCreatorService, useValue: gameCreatorSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EndLimitedModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('closeGame() should close modal and game and navigate', () => {
        component.closeGame();
        expect(matDialogSpy.closeAll).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalled();
        expect(gameCreatorSpy.closeGame).toHaveBeenCalled();
    });
});
