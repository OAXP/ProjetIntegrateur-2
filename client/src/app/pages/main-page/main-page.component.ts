import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LimitedChoiceModalComponent } from '@app/components/limited-choice-modal/limited-choice-modal.component';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    readonly title: string = 'LOG2990';

    constructor(private matDialog: MatDialog) {}

    askLimitedChoice() {
        this.matDialog.open(LimitedChoiceModalComponent, { autoFocus: false });
    }
}
