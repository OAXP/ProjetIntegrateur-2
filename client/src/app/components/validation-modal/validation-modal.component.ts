import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, Injector, Input, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { baseLeaderboard } from '@app/constants/consts';
import { CommunicationService } from '@app/services/communication.service';
import { GameSelectorService } from '@app/services/game-selector.service';
import { LeaderboardService } from '@app/services/leaderboard.service';
import { DifferenceResponse } from '@common/difference-response';
import { Game } from '@common/game';
import { Leaderboard } from '@common/leaderboard';
import { Player } from '@common/player';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-validation-modal',
    templateUrl: './validation-modal.component.html',
    styleUrls: ['./validation-modal.component.scss'],
})
export class ValidationModalComponent implements AfterViewInit {
    @Input() differenceResponse: DifferenceResponse = {
        id: '',
        differentPixelsCount: 0,
        numberOfDifferences: 0,
        difficulty: '',
        image1Url: '',
        image2Url: '',
        differenceImageUrl: '',
    };

    @ViewChild('gameName') gameNameInput: ElementRef;

    readonly baseUrl;
    private gameName: string;
    private dialogRef: MatDialogRef<ValidationModalComponent>;
    private readonly communicationService: CommunicationService;
    private readonly gameSelectorService: GameSelectorService;
    private readonly leaderboardService: LeaderboardService;
    private router: Router;
    private snackbar: MatSnackBar;
    private isSaved: boolean;

    constructor(injector: Injector) {
        this.dialogRef = injector.get<MatDialogRef<ValidationModalComponent>>(MatDialogRef<ValidationModalComponent>);
        this.communicationService = injector.get<CommunicationService>(CommunicationService);
        this.gameSelectorService = injector.get<GameSelectorService>(GameSelectorService);
        this.leaderboardService = injector.get<LeaderboardService>(LeaderboardService);
        this.router = injector.get<Router>(Router);
        this.snackbar = injector.get<MatSnackBar>(MatSnackBar);
        this.isSaved = false;
        this.baseUrl = environment.serverBaseUrl;
    }

    ngAfterViewInit() {
        this.dialogRef.beforeClosed().subscribe(() => {
            if (!this.isSaved) {
                this.closeModal();
            }
        });
    }

    openSnack(message: string) {
        this.snackbar.open(message, 'Fermer', { duration: 2000 });
    }

    async saveGame(): Promise<void> {
        this.gameName = this.gameNameInput.nativeElement.value;

        if (this.gameName.trim()) {
            const game: Game = {
                name: this.gameName,
                ...this.differenceResponse,
                firstPlayer: new Player(),
            };
            const leaderboard: Leaderboard = {
                gameId: game.id as string,
                leaderboardSolo: baseLeaderboard,
                leaderboardDuo: baseLeaderboard,
            };
            this.communicationService.saveGame(game).subscribe({
                next: () => {
                    this.gameSelectorService.fetchGames();
                },
                error: (error: HttpErrorResponse) => {
                    this.openSnack(error.error.error);
                },
            });
            this.leaderboardService.addLeaderboard(leaderboard).subscribe({});
            this.isSaved = true;
            this.dialogRef.close();
            await this.router.navigate(['/config']);
        } else {
            this.openSnack('Veuillez entrer un nom de jeu valide');
        }
    }
    closeModal(): void {
        this.communicationService.cancelGame(this.differenceResponse).subscribe({
            error: (err: HttpErrorResponse) => {
                this.openSnack(err.error.error);
            },
        });
        this.dialogRef.close();
    }
}
