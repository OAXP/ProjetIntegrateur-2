import { HttpClientModule } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { SideBarComponent } from '@app/components/sidebar/sidebar.component';
import { Game } from '@common/game';
import { LobbyModes } from '@common/lobby-modes';

describe('SidebarComponent', () => {
    let component: SideBarComponent;
    let fixture: ComponentFixture<SideBarComponent>;
    const game: Game = {
        name: 'Game Name',
        differentPixelsCount: 1,
        numberOfDifferences: 10,
        difficulty: 'facile',
        image1Url: 'original.bmp',
        image2Url: 'modified.bmp',
        differenceImageUrl: 'diff.bmp',
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [SideBarComponent],
            imports: [MatDialogModule, HttpClientModule],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(SideBarComponent);
        component = fixture.componentInstance;
        component['infosService']['game'] = game;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize the correct elements', () => {
        component['infosService']['gameMode'] = LobbyModes.ClassicSolo;
        fixture.detectChanges();
        const container = fixture.debugElement.query(By.css('#sidebar-container'));
        const containerChildren = container.nativeElement.childNodes;
        const timer = fixture.debugElement.query(By.css('#timer')).nativeElement;
        const clues = fixture.debugElement.query(By.css('#clues')).nativeElement;
        const counter = fixture.debugElement.query(By.css('#solo-counter')).nativeElement;
        expect(container).toBeTruthy();
        expect(containerChildren).toContain(timer);
        expect(containerChildren).toContain(clues);
        expect(containerChildren).toContain(counter);
        expect(timer).toBeTruthy();
        expect(clues).toBeTruthy();
        expect(counter).toBeTruthy();
    });

    it('should display the amount of differences found in duo mode', () => {
        component['infosService']['gameMode'] = LobbyModes.ClassicDuo;
        component['infosService']['playerDifferencesFound'] = 3;
        component['infosService']['totalDifferencesFound'] = 4;
        fixture.detectChanges();
        const firstCounter = fixture.debugElement.query(By.css('#first-player-counter')).nativeElement;
        const secondCounter = fixture.debugElement.query(By.css('#second-player-counter')).nativeElement;
        expect(firstCounter.textContent).toContain(component.getDifferences());
        expect(firstCounter.textContent).toContain(component.getGameDifferences());
        expect(secondCounter.textContent).toContain(component.getTotalDifferencesFound() - component.getDifferences());
        expect(secondCounter.textContent).toContain(component.getGameDifferences());
    });

    it('should display the amount of differences found in solo mode', () => {
        component['infosService']['gameMode'] = LobbyModes.ClassicSolo;
        component['infosService']['playerDifferencesFound'] = 3;
        fixture.detectChanges();
        const counter = fixture.debugElement.query(By.css('#solo-counter')).nativeElement;
        expect(counter.textContent).toContain(component.getDifferences());
        expect(counter.textContent).toContain(component.getGameDifferences());
    });

    it('second should return clock value', () => {
        expect(component.second).toEqual(0);
    });

    it('minute should return clock value', () => {
        expect(component.minute).toEqual(0);
    });
});
