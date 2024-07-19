import { Component, Injector, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommunicationService } from '@app/services/communication.service';
import { GameSelectorService } from '@app/services/game-selector.service';
import { InfosService } from '@app/services/infos.service';
import { LeaderboardService } from '@app/services/leaderboard.service';
import { Game } from '@common/game';
import { Leaderboard } from '@common/leaderboard';
import { LobbyModes } from '@common/lobby-modes';
import { NameModalComponent } from 'src/app/components/name-modal/name-modal.component';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
    @Input() gameInput: Game;
    @Input() leaderboard: Leaderboard;
    @Input() config: boolean;
    private deleteConfirmation: boolean;
    private resetConfirmation: boolean;
    private dialog: MatDialog;
    private infosService: InfosService;
    private communicationService: CommunicationService;
    private gameSelectorService: GameSelectorService;
    private leaderboardService: LeaderboardService;

    constructor(injector: Injector) {
        this.dialog = injector.get<MatDialog>(MatDialog);
        this.infosService = injector.get<InfosService>(InfosService);
        this.communicationService = injector.get<CommunicationService>(CommunicationService);
        this.gameSelectorService = injector.get<GameSelectorService>(GameSelectorService);
        this.leaderboardService = injector.get<LeaderboardService>(LeaderboardService);
        this.deleteConfirmation = false;
        this.resetConfirmation = false;
    }

    get deletionConfirmation(): boolean {
        return this.deleteConfirmation;
    }

    get resettingConfirmation(): boolean {
        return this.resetConfirmation;
    }

    get serverEnvironment(): string {
        return environment.serverBaseUrl;
    }

    openDialog(mode: LobbyModes | string): void {
        this.infosService.setGame(this.gameInput);
        this.infosService.setGameMode(mode);
        this.dialog.open(NameModalComponent, {});
    }

    confirmDeletion() {
        this.deleteConfirmation = !this.deleteConfirmation;
    }

    confirmReset() {
        this.resetConfirmation = !this.resetConfirmation;
    }

    deleteGame(id: string): void {
        this.communicationService.deleteGame(id).subscribe({
            next: () => {
                this.deleteLeaderboards(this.gameInput.id as string);
            },
        });
    }

    getGameLeaderboards(id: string) {
        this.leaderboardService.getLeaderboardById(id).subscribe({
            next: (leaderboard) => {
                this.leaderboard = leaderboard as Leaderboard;
            },
        });
    }

    resetLeaderboards(id: string) {
        this.leaderboardService.reset(id).subscribe({
            next: () => {
                this.gameSelectorService.fetchGames();
            },
        });
    }

    deleteLeaderboards(id: string) {
        this.leaderboardService.deleteLeaderboards(id).subscribe({
            next: () => {
                this.gameSelectorService.fetchGames();
            },
        });
    }

    ngOnInit() {
        this.getGameLeaderboards(this.gameInput.id as string);
    }
}
