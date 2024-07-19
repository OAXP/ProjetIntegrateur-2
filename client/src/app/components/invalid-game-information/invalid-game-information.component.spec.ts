import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvalidGameInformationComponent } from './invalid-game-information.component';

describe('InvalidGameInformationComponent', () => {
    let component: InvalidGameInformationComponent;
    let fixture: ComponentFixture<InvalidGameInformationComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [InvalidGameInformationComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(InvalidGameInformationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
