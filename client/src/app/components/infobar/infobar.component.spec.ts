import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { CloseGameComponent } from '@app/components/close-game/close-game.component';
import { gameMock1 } from '@app/constants/mock';
import { LobbyModes } from '@common/lobby-modes';
import { InfoBarComponent } from './infobar.component';
import SpyObj = jasmine.SpyObj;

describe('InfoBarComponent', () => {
    let component: InfoBarComponent;
    let fixture: ComponentFixture<InfoBarComponent>;
    let routerSpy: SpyObj<Router>;
    let dialogSpy: SpyObj<MatDialog>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        TestBed.configureTestingModule({
            declarations: [InfoBarComponent],
            imports: [HttpClientModule],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: MatDialog, useValue: dialogSpy },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(InfoBarComponent);
        component = fixture.componentInstance;
        component['infosService']['game'] = gameMock1;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('abandonGame should be called by click event on button', () => {
        const spy = spyOn(component, 'abandonGame');
        const button = fixture.debugElement.nativeElement.querySelector('button');
        button.click();
        expect(spy).toHaveBeenCalled();
    });

    it('abandonGame should open closeGameComponent', () => {
        component.abandonGame();
        expect(dialogSpy.open).toHaveBeenCalledWith(CloseGameComponent);
    });

    it('should initialize the correct elements', () => {
        component['infosService']['gameMode'] = LobbyModes.ClassicSolo;
        component['infosService']['playerName'] = 'Lala';
        fixture.detectChanges();
        const container = fixture.debugElement.query(By.css('#infobar-container'));
        const containerChildren = container.nativeElement.childNodes;
        const mode = fixture.debugElement.query(By.css('#mode')).nativeElement;
        const difficulty = fixture.debugElement.query(By.css('#difficulty')).nativeElement;
        const player = fixture.debugElement.query(By.css('#player')).nativeElement;
        const logo = fixture.debugElement.query(By.css('#logo')).nativeElement;
        const logoChildren = fixture.debugElement.query(By.css('#logo')).nativeElement.childNodes;
        const img = fixture.nativeElement.querySelector('img');
        const button = fixture.nativeElement.querySelector('button');
        const span = fixture.nativeElement.querySelector('span');
        expect(container).toBeTruthy();
        expect(containerChildren).toContain(mode);
        expect(containerChildren).toContain(difficulty);
        expect(containerChildren).toContain(player);
        expect(containerChildren).toContain(logo);
        expect(containerChildren).toContain(button);
        expect(mode).toBeTruthy();
        expect(mode.textContent).toContain(component['infosService']['gameMode']);
        expect(difficulty).toBeTruthy();
        expect(difficulty.textContent).toContain(component['infosService']['game']['difficulty']);
        expect(player).toBeTruthy();
        expect(player.textContent).toContain(component['infosService']['playerName']);
        expect(logo).toBeTruthy();
        expect(logoChildren).toContain(img);
        expect(img).toBeTruthy();
        expect(button).toBeTruthy();
        expect(span).toBeTruthy();
    });

    it('button should display the correct message at end of the game', () => {
        component['infosService']['endGame'] = true;
        fixture.detectChanges();
        const span = fixture.debugElement.query(By.css('#leave')).nativeElement;
        expect(span).toBeTruthy();
        expect(span.textContent).toEqual('Quitter la partie');
    });

    it('button should display the correct message during the game', () => {
        component['infosService']['endGame'] = false;
        fixture.detectChanges();
        const span = fixture.debugElement.query(By.css('#abandon')).nativeElement;
        expect(span).toBeTruthy();
        expect(span.textContent).toEqual('Abandonner la partie');
    });
});
