/* eslint-disable @typescript-eslint/naming-convention */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialog } from '@angular/material/dialog';
import { gameStats1, gameStats2 } from '@app/constants/mock';
import { HistoryService } from '@app/services/history.service';
import { GameStats } from '@common/game-stats';
import { BehaviorSubject } from 'rxjs';
import { HistoryComponent } from './history.component';
import SpyObj = jasmine.SpyObj;

describe('HistoryComponent', () => {
    let historyServiceSpy: SpyObj<HistoryService>;
    let matDialogSpy: SpyObj<MatDialog>;
    let component: HistoryComponent;
    let fixture: ComponentFixture<HistoryComponent>;

    beforeEach(() => {
        historyServiceSpy = jasmine.createSpyObj('HistoryService', ['gamesStats', 'reset']);
        historyServiceSpy.gamesStats = new BehaviorSubject<GameStats[]>([gameStats1]);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['closeAll']);

        TestBed.configureTestingModule({
            declarations: [HistoryComponent],
            providers: [
                { provide: HistoryService, useValue: historyServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(HistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return line-through and normal', () => {
        const styleReturned = component.setStyle(gameStats1, 'Yoda');
        expect(styleReturned).toEqual({
            'text-decoration': 'line-through',
            'font-weight': 'normal',
        });
    });

    it('should return normal and bold', () => {
        const styleReturned = component.setStyle(gameStats2, 'Louis');
        expect(styleReturned).toEqual({
            'text-decoration': 'normal',
            'font-weight': 'bold',
        });
    });

    it('should return Date and time', () => {
        const epochTime = 1680636368;
        const date = new Date(epochTime).toLocaleString('en-GB');
        expect(component.reformatDate(epochTime)).toEqual(date);
    });

    it('should call resetHistory', () => {
        component.resetHistory();
        expect(historyServiceSpy.reset).toHaveBeenCalled();
    });

    it('should call closeAll', () => {
        component.close();
        expect(matDialogSpy.closeAll).toHaveBeenCalled();
    });
});
