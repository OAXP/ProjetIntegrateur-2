import { Component, Injector, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HintService } from '@app/services/hint.service';
import { RGBA } from '@common/rgba';
import { ReplayService } from '@app/services/replay.service';

@Component({
    selector: 'app-third-hint',
    templateUrl: './third-hint.component.html',
    styleUrls: ['./third-hint.component.scss'],
})
export class ThirdHintComponent implements OnInit {
    private originalRGB: RGBA = { r: 0, g: 0, b: 0, a: 255 };
    private modifiedRGB: RGBA = { r: 0, g: 0, b: 0, a: 255 };
    private dialog: MatDialog;
    private hintService: HintService;
    private replayService: ReplayService;
    constructor(injector: Injector) {
        this.dialog = injector.get<MatDialog>(MatDialog);
        this.hintService = injector.get<HintService>(HintService);
        this.replayService = injector.get<ReplayService>(ReplayService);
    }
    get original() {
        return this.originalRGB;
    }
    get modified() {
        return this.modifiedRGB;
    }
    ngOnInit() {
        this.originalRGB.r = this.hintService.original.r;
        this.originalRGB.g = this.hintService.original.g;
        this.originalRGB.b = this.hintService.original.b;
        this.modifiedRGB.r = this.hintService.modified.r;
        this.modifiedRGB.g = this.hintService.modified.g;
        this.modifiedRGB.b = this.hintService.modified.b;
    }
    close() {
        this.dialog.closeAll();
        this.replayService.recordCloseModal();
    }
}
