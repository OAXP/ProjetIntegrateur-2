import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { GameCreatorService } from '@app/services/game-creator.service';
import { CloseGameComponent } from './close-game.component';
import SpyObj = jasmine.SpyObj;

describe('CloseGameComponent', () => {
    let gameCreatorServiceSpy: SpyObj<GameCreatorService>;
    let component: CloseGameComponent;
    let fixture: ComponentFixture<CloseGameComponent>;
    let dialogSpy: SpyObj<MatDialog>;
    let routerSpy: SpyObj<Router>;

    beforeEach(async () => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['closeAll']);
        gameCreatorServiceSpy = jasmine.createSpyObj('GameCreatorService', ['closeGame']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            declarations: [CloseGameComponent],
            imports: [HttpClientModule],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: Router, useValue: routerSpy },
                { provide: GameCreatorService, useValue: gameCreatorServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CloseGameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('close should close the dialog', () => {
        component.close();
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });

    it('exitGame should close the dialog', () => {
        component.exitGame();
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });
    it('exitGame should modify the value of InfosService.endgame', () => {
        component.gameStatus = false;
        component.exitGame();
        expect(component.gameStatus).toEqual(true);
    });

    it('exitGame should call gameHandlerService.closeGame()', () => {
        component.exitGame();
        expect(gameCreatorServiceSpy.closeGame).toHaveBeenCalled();
    });

    it('exitGame should navigate to home', () => {
        component.exitGame();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should initialize the correct elements', () => {
        component.gameStatus = false;
        fixture.detectChanges();
        const modal = fixture.debugElement.query(By.css('.modal'));
        const modalChildren = modal.nativeElement.childNodes;
        const exitMessage = fixture.debugElement.query(By.css('.exit-message')).nativeElement;
        const paragraph = fixture.nativeElement.querySelector('p');
        const closeButton = fixture.debugElement.query(By.css('#close-button')).nativeElement;
        const cancelButton = fixture.debugElement.query(By.css('#cancel-button')).nativeElement;
        expect(modal).toBeTruthy();
        expect(exitMessage).toBeTruthy();
        expect(paragraph).toBeTruthy();
        expect(closeButton).toBeTruthy();
        expect(cancelButton).toBeTruthy();
        expect(modalChildren[0]).toEqual(exitMessage);
        expect(modalChildren[1]).toEqual(closeButton);
        expect(modalChildren[2]).toEqual(cancelButton);
        expect(exitMessage.childNodes[0]).toEqual(paragraph);
        expect(closeButton.textContent).toEqual('Oui');
        expect(cancelButton.textContent).toEqual('Non');
    });

    it('p element should show the correct text when game is abandoned', () => {
        component.gameStatus = false;
        fixture.detectChanges();
        const paragraph = fixture.nativeElement.querySelector('p');
        expect(paragraph).toBeTruthy();
        expect(paragraph.textContent).toEqual('Abandonner ?');
    });

    it('p element should show the correct text at end of game', () => {
        component.gameStatus = true;
        fixture.detectChanges();
        const paragraph = fixture.nativeElement.querySelector('p');
        expect(paragraph).toBeTruthy();
        expect(paragraph.textContent).toEqual('Quitter ?');
    });

    it('exitGame should be called on click', () => {
        fixture.detectChanges();
        const closeButton = fixture.debugElement.query(By.css('#close-button')).nativeElement;
        const spy = spyOn(component, 'exitGame');
        closeButton.click();
        expect(spy).toHaveBeenCalled();
    });

    it('close should be called on click', () => {
        fixture.detectChanges();
        const cancelButton = fixture.debugElement.query(By.css('#cancel-button')).nativeElement;
        const spy = spyOn(component, 'close');
        cancelButton.click();
        expect(spy).toHaveBeenCalled();
    });
});
