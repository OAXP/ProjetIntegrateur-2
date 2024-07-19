import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { GameSelectorService } from '@app/services/game-selector.service';
import { Game } from '@common/game';
import { BehaviorSubject } from 'rxjs';
import { GameSelectionComponent } from './game-selection.component';

import SpyObj = jasmine.SpyObj;

describe('GameSelectionComponent', () => {
    let gameSelectorServiceSpy: SpyObj<GameSelectorService>;
    let component: GameSelectionComponent;
    let fixture: ComponentFixture<GameSelectionComponent>;

    beforeEach(() => {
        gameSelectorServiceSpy = jasmine.createSpyObj('GameSelectorService', ['arrowLeft', 'arrowRight']);
        gameSelectorServiceSpy = jasmine.createSpyObj('GameSelectorService', ['arrowLeft', 'arrowRight', 'fetchGames']);
        gameSelectorServiceSpy.gamesToDisplay = new BehaviorSubject<Game[]>([]);
        gameSelectorServiceSpy.disableArrow = new BehaviorSubject<boolean[]>([false, false]);
        TestBed.configureTestingModule({
            declarations: [GameSelectionComponent],
            providers: [{ provide: GameSelectorService, useValue: gameSelectorServiceSpy }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(GameSelectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create with initial values', () => {
        expect(component).toBeTruthy();
        expect(component.games).toEqual([]);
        expect(component.arrowToDisable).toEqual([false, false]);
    });

    it('setter should change gameList', () => {
        component.games = [];
        expect(component['gameList']).toEqual([]);
    });

    it('should call arrowLeft function', () => {
        const spy = spyOn(component, 'arrowLeft').and.callThrough();

        const button = fixture.debugElement.query(By.css('#left_arrow'));
        button.triggerEventHandler('click');

        fixture.whenStable().then(() => {
            expect(spy).toHaveBeenCalled();
        });

        expect(gameSelectorServiceSpy.arrowLeft).toHaveBeenCalled();
    });

    it('should call arrowLeft function', () => {
        const spy = spyOn(component, 'arrowRight').and.callThrough();

        const button = fixture.debugElement.query(By.css('#right_arrow'));
        button.triggerEventHandler('click');

        fixture.whenStable().then(() => {
            expect(spy).toHaveBeenCalled();
        });

        expect(gameSelectorServiceSpy.arrowRight).toHaveBeenCalled();
    });

    it('should disabled both button arrow', () => {
        component.arrowToDisable = [true, true];
        fixture.detectChanges();

        const leftArrow = fixture.debugElement.query(By.css('#left_arrow'));
        const rightArrow = fixture.debugElement.query(By.css('#right_arrow'));

        expect(leftArrow.properties['disabled']).toEqual(true);
        expect(rightArrow.properties['disabled']).toEqual(true);
    });

    it('should not disabled button arrow', () => {
        component.arrowToDisable = [false, false];
        fixture.detectChanges();

        const leftArrow = fixture.debugElement.query(By.css('#left_arrow'));
        const rightArrow = fixture.debugElement.query(By.css('#right_arrow'));

        expect(leftArrow.properties['disabled']).toEqual(false);
        expect(rightArrow.properties['disabled']).toEqual(false);
    });

    it('should disabled right button arrow', () => {
        component.arrowToDisable = [false, true];
        fixture.detectChanges();

        const leftArrow = fixture.debugElement.query(By.css('#left_arrow'));
        const rightArrow = fixture.debugElement.query(By.css('#right_arrow'));

        expect(leftArrow.properties['disabled']).toEqual(false);
        expect(rightArrow.properties['disabled']).toEqual(true);
    });
});
