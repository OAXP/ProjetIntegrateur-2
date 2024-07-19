import { Component, Injector, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { GameCreatorService } from '@app/services/game-creator.service';

@Component({
    selector: 'app-end-limited-modal',
    templateUrl: './end-limited-modal.component.html',
    styleUrls: ['./end-limited-modal.component.scss'],
})
export class EndLimitedModalComponent {
    @Input() hasWon: boolean;
    private router: Router;
    private dialog: MatDialog;
    private gameCreatorService: GameCreatorService;
    constructor(injector: Injector) {
        this.router = injector.get<Router>(Router);
        this.dialog = injector.get<MatDialog>(MatDialog);
        this.gameCreatorService = injector.get<GameCreatorService>(GameCreatorService);
        this.hasWon = false;
    }
    closeGame() {
        this.dialog.closeAll();
        this.router.navigate(['/home']);
        this.gameCreatorService.closeGame(false);
    }
}
