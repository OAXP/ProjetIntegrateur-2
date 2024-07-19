import { HttpClientModule, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CommunicationService } from '@app/services/communication.service';
import { GameSelectorService } from '@app/services/game-selector.service';
import { LeaderboardService } from '@app/services/leaderboard.service';
import { of, throwError } from 'rxjs';
import { ValidationModalComponent } from './validation-modal.component';
import SpyObj = jasmine.SpyObj;

describe('ValidationModalComponent', () => {
    let validationModal: ValidationModalComponent;
    let fixture: ComponentFixture<ValidationModalComponent>;
    let dialogRefSpy: SpyObj<MatDialogRef<ValidationModalComponent>>;
    let communicationServiceSpy: SpyObj<CommunicationService>;
    let gameSelectorServiceSpy: SpyObj<GameSelectorService>;
    let routerSpy: SpyObj<Router>;
    let snackbarSpy: SpyObj<MatSnackBar>;
    let leaderboardServiceSpy: SpyObj<LeaderboardService>;
    const errorMessage = 'Error';

    beforeEach(() => {
        // @ts-ignore
        dialogRefSpy = jasmine.createSpyObj<MatDialogRef<ValidationModalComponent>>('MatDialogRef', ['close', 'beforeClosed', 'subscribe']);
        dialogRefSpy.beforeClosed.and.returnValue(of({}));
        communicationServiceSpy = jasmine.createSpyObj<CommunicationService>('CommunicationService', ['saveGame', 'cancelGame', 'getGames']);
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
        snackbarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
        gameSelectorServiceSpy = jasmine.createSpyObj<GameSelectorService>('GameSelectorService', ['fetchGames']);
        leaderboardServiceSpy = jasmine.createSpyObj<LeaderboardService>('LeaderboardService', ['addLeaderboard']);

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        gameSelectorServiceSpy.fetchGames.and.callFake(() => {});

        TestBed.configureTestingModule({
            declarations: [ValidationModalComponent],
            imports: [HttpClientModule],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: MatSnackBar, useValue: snackbarSpy },
                { provide: GameSelectorService, useValue: gameSelectorServiceSpy },
                { provide: LeaderboardService, useValue: leaderboardServiceSpy },
            ],
        });
        fixture = TestBed.createComponent(ValidationModalComponent);
        validationModal = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(validationModal).toBeTruthy();
    });

    it('should ask for a valid name when none were given', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const spy = spyOn(validationModal, 'openSnack').and.callFake(() => {});
        validationModal.gameNameInput.nativeElement.value = '';
        await validationModal.saveGame();
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith('Veuillez entrer un nom de jeu valide');
    });

    it('should create game when a valid name is provided', async () => {
        // @ts-ignore
        leaderboardServiceSpy.addLeaderboard.and.returnValue(of(new HttpResponse<string>()));
        communicationServiceSpy.saveGame.and.returnValue(of(new HttpResponse<string>({ status: 201, body: '' })));
        validationModal.gameNameInput.nativeElement.value = 'Valid Game name';
        await validationModal.saveGame();
        expect(communicationServiceSpy.saveGame).toHaveBeenCalled();
        expect(leaderboardServiceSpy.addLeaderboard).toHaveBeenCalled();
        expect(gameSelectorServiceSpy.fetchGames).toHaveBeenCalled();
        expect(validationModal['isSaved']).toBeTruthy();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('saveGame should handle errors', async () => {
        leaderboardServiceSpy.addLeaderboard.and.returnValue(of(new HttpResponse<string>()));
        const spy = spyOn(validationModal, 'openSnack');
        validationModal.gameNameInput.nativeElement.value = 'Valid Game name';
        // @ts-ignore
        communicationServiceSpy.saveGame.and.returnValue(
            // eslint-disable-next-line deprecation/deprecation
            throwError(
                new HttpErrorResponse({
                    error: { error: errorMessage },
                }),
            ),
        );
        await validationModal.saveGame();
        expect(spy).toHaveBeenCalledWith(errorMessage);
    });
    it('should cancel game when closing modal', async () => {
        communicationServiceSpy.cancelGame.and.returnValue(of(new HttpResponse<object>({ status: 204, body: {} })));
        validationModal.closeModal();
        expect(communicationServiceSpy.cancelGame).toHaveBeenCalled();
    });

    it('closeModal should handle errors', () => {
        const spy = spyOn(validationModal, 'openSnack');
        communicationServiceSpy.cancelGame.and.returnValue(
            // eslint-disable-next-line deprecation/deprecation
            throwError(
                new HttpErrorResponse({
                    error: { error: errorMessage },
                }),
            ),
        );
        validationModal.closeModal();
        expect(spy).toHaveBeenCalledWith(errorMessage);
    });

    it('should open with the correct message', () => {
        const message = 'Test message';
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        snackbarSpy.open.and.callFake(() => {});
        validationModal.openSnack(message);
        expect(snackbarSpy.open).toHaveBeenCalledWith(message, 'Fermer', { duration: 2000 });
    });
});
