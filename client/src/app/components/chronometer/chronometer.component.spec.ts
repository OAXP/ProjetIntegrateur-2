import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { SECONDS_PER_MINUTE } from '@app/constants/consts';
import { ChronometerComponent } from './chronometer.component';

describe('ChronometerComponent', () => {
    let component: ChronometerComponent;
    let fixture: ComponentFixture<ChronometerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChronometerComponent],
            imports: [MatDialogModule, RouterTestingModule, HttpClientModule],
        }).compileComponents();

        fixture = TestBed.createComponent(ChronometerComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should add a digit to minutes every 60 seconds', () => {
        const minutesBefore = component.minute;
        component.second = SECONDS_PER_MINUTE;
        component.increaseTime(SECONDS_PER_MINUTE + 1);
        fixture.detectChanges();
        expect(component.minute).toEqual(minutesBefore + 1);
    });

    it('should reset seconds every minute', () => {
        component.second = SECONDS_PER_MINUTE;
        component.increaseTime(SECONDS_PER_MINUTE + 1);
        fixture.detectChanges();
        expect(component.second).toEqual(1);
    });

    it('should clamp time if negative', () => {
        component.second = 0;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        component.increaseTime(-1);
        fixture.detectChanges();
        expect(component.second).toEqual(0);
    });

    it('should contain the correct elements', () => {
        fixture.detectChanges();
        const div = fixture.nativeElement.querySelector('div');
        const element = fixture.debugElement.query(By.css('.under-ten-minutes'));
        const element2 = fixture.debugElement.query(By.css('.under-ten-seconds'));
        expect(element.nativeNode.textContent).toContain(0);
        expect(element2.nativeNode.textContent).toContain(0);
        expect(div.textContent).toContain(component.minute);
    });

    it('should display the right spans (min < 10, sec < 10)', () => {
        component.minute = 0;
        component.second = 0;
        fixture.detectChanges();
        const element = fixture.debugElement.query(By.css('.under-ten-minutes'));
        const element2 = fixture.debugElement.query(By.css('.under-ten-seconds'));
        expect(element).toBeTruthy();
        expect(element2).toBeTruthy();
    });

    it('should display the right spans (min = 10, sec < 10)', () => {
        component.minute = 10;
        component.second = 0;
        fixture.detectChanges();
        const element = fixture.debugElement.query(By.css('.under-ten-minutes'));
        const element2 = fixture.debugElement.query(By.css('.under-ten-seconds'));
        expect(element).toBeFalsy();
        expect(element2).toBeTruthy();
    });

    it('should display the right spans (min < 10, sec = 10)', () => {
        component.minute = 0;
        component.second = 10;
        fixture.detectChanges();
        const element = fixture.debugElement.query(By.css('.under-ten-minutes'));
        const element2 = fixture.debugElement.query(By.css('.under-ten-seconds'));
        expect(element).toBeTruthy();
        expect(element2).toBeFalsy();
    });

    it('should display the right spans (min = 10, sec = 10)', () => {
        component.minute = 10;
        component.second = 10;
        fixture.detectChanges();
        const element = fixture.debugElement.query(By.css('.under-ten-minutes'));
        const element2 = fixture.debugElement.query(By.css('.under-ten-seconds'));
        expect(element).toBeFalsy();
        expect(element2).toBeFalsy();
    });
});
