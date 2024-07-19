import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InfoBarComponent } from '@app/components/infobar/infobar.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { SideBarComponent } from '@app/components/sidebar/sidebar.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { CreationPageComponent } from '@app/pages/creation-page/creation-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { ChronometerComponent } from './components/chronometer/chronometer.component';
import { CloseGameComponent } from './components/close-game/close-game.component';
import { CluesComponent } from './components/clues/clues.component';
import { ThirdHintComponent } from './components/clues/third-hint/third-hint.component';
import { ConfigurationComponent } from './components/configuration/configuration.component';
import { DrawableCanvasComponent } from './components/drawable-canvas/drawable-canvas.component';
import { EndGameModalComponent } from './components/end-game-modal/end-game-modal.component';
import { EndLimitedModalComponent } from './components/end-limited-modal/end-limited-modal.component';
import { GameSelectionComponent } from './components/game-selection/game-selection.component';
import { GameComponent } from './components/game/game.component';
import { HistoryComponent } from './components/history/history.component';
import { InvalidGameInformationComponent } from './components/invalid-game-information/invalid-game-information.component';
import { LimitedChoiceModalComponent } from './components/limited-choice-modal/limited-choice-modal.component';
import { MessageSectionComponent } from './components/message-section/message-section.component';
import { MessagesComponent } from './components/messages/messages.component';
import { NameModalComponent } from './components/name-modal/name-modal.component';
import { PencilCaseComponent } from './components/pencil-case/pencil-case.component';
import { ValidationModalComponent } from './components/validation-modal/validation-modal.component';
import { WaitingCoopModalComponent } from './components/waiting-coop-modal/waiting-coop-modal.component';
import { WaitingRoomFirstPlayerComponent } from './components/waiting-room-first-player/waiting-room-first-player.component';
import { WaitingRoomSecondPlayerComponent } from './components/waiting-room-second-player/waiting-room-second-player.component';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        MainPageComponent,
        PlayAreaComponent,
        SideBarComponent,
        InfoBarComponent,
        ChronometerComponent,
        CluesComponent,
        MessageSectionComponent,
        GameSelectionComponent,
        GameComponent,
        ConfigurationComponent,
        PlayAreaComponent,
        SideBarComponent,
        CreationPageComponent,
        ValidationModalComponent,
        NameModalComponent,
        DrawableCanvasComponent,
        PencilCaseComponent,
        WaitingRoomFirstPlayerComponent,
        WaitingRoomSecondPlayerComponent,
        InvalidGameInformationComponent,
        EndGameModalComponent,
        MessagesComponent,
        CloseGameComponent,
        LimitedChoiceModalComponent,
        EndLimitedModalComponent,
        WaitingCoopModalComponent,
        ThirdHintComponent,
        HistoryComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        MatSnackBarModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonToggleModule,
        MatSliderModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
