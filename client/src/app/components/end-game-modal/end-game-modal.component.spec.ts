import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { GameCreatorService } from '@app/services/game-creator.service';
import { EndGameModalComponent } from './end-game-modal.component';
import SpyObj = jasmine.SpyObj;

describe('EndGameModalComponent', () => {
    let component: EndGameModalComponent;
    let fixture: ComponentFixture<EndGameModalComponent>;
    let gameCreatorServiceSpy: SpyObj<GameCreatorService>;
    let dialogSpy: SpyObj<MatDialog>;
    let routerSpy: SpyObj<Router>;

    beforeEach(() => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['closeAll']);
        gameCreatorServiceSpy = jasmine.createSpyObj('GameCreatorService', ['closeGame']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            declarations: [EndGameModalComponent],
            imports: [HttpClientModule],
            providers: [
                { provide: MatDialog, useValue: dialogSpy },
                { provide: Router, useValue: routerSpy },
                { provide: GameCreatorService, useValue: gameCreatorServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EndGameModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('closeGame should close the dialog', () => {
        component.closeGame();
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });

    it('closeGame should navigate to home', () => {
        component.closeGame();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });
    it('closeGame should call gameCreatorService.closeGame()', () => {
        component.closeGame();
        expect(gameCreatorServiceSpy.closeGame).toHaveBeenCalled();
    });

    it('should initialize the correct elements', () => {
        fixture.detectChanges();
        component['infosService'].winner = component.playerName;
        const container = fixture.debugElement.query(By.css('.mat-dialog-content'));
        const containerChildren = container.nativeElement.childNodes;
        const endGame = fixture.debugElement.query(By.css('#end-game')).nativeElement;
        const paragraph = fixture.nativeElement.querySelector('p');
        const button = fixture.debugElement.query(By.css('.mat-raised-button')).nativeElement;
        expect(container).toBeTruthy();
        expect(endGame).toBeTruthy();
        expect(button).toBeTruthy();
        expect(containerChildren[0]).toEqual(endGame);
        expect(containerChildren[1]).toEqual(button);
        expect(paragraph).toBeTruthy();
        expect(endGame.childNodes).toContain(paragraph);
        expect(button.textContent).toEqual("Retour à l'accueil");
    });

    it('p element should show the correct when current player wins', () => {
        component['infosService'].winner = component.playerName;
        component['infosService']['won'] = true;
        fixture.detectChanges();
        const paragraph = fixture.nativeElement.querySelector('p');
        expect(paragraph).toBeTruthy();
        expect(paragraph.textContent).toEqual('Vous avez gagné !');
    });

    it('p element should show the correct text when opponent wins', () => {
        component['infosService'].winner = 'Niko';
        component['infosService']['won'] = false;
        fixture.detectChanges();
        const paragraph = fixture.nativeElement.querySelector('p');
        expect(paragraph).toBeTruthy();
        expect(paragraph.textContent).toEqual('Niko a gagné la partie');
    });

    it('replayGame should close the dialog', () => {
        component.replayGame();
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });

    it('set winner should change infosService.winner', () => {
        component.winner = 'MVP';
        expect(component['infosService'].getWinner()).toEqual('MVP');
    });
});
