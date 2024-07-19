import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientModule } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ThirdHintComponent } from './third-hint.component';
import SpyObj = jasmine.SpyObj;

describe('ThirdHintComponent', () => {
    let component: ThirdHintComponent;
    let fixture: ComponentFixture<ThirdHintComponent>;
    let dialogSpy: SpyObj<MatDialog>;
    let routerSpy: SpyObj<Router>;

    beforeEach(async () => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['closeAll']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        await TestBed.configureTestingModule({
            declarations: [ThirdHintComponent],
            imports: [HttpClientModule],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: MatDialog, useValue: dialogSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ThirdHintComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close dialog', () => {
        component.close();
        expect(dialogSpy.closeAll).toHaveBeenCalled();
    });

    it('should return red value', () => {
        component['originalRGB'].r = 2;
        const value = component.original.r;
        expect(value).toEqual(2);
    });
});
