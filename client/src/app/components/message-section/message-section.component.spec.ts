import { HttpClientModule } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { MessagesService } from '@app/services/messages.service';
import { LobbyModes } from '@common/lobby-modes';
import { MessageSectionComponent } from './message-section.component';
import SpyObj = jasmine.SpyObj;

describe('MessageSectionComponent', () => {
    let component: MessageSectionComponent;
    let fixture: ComponentFixture<MessageSectionComponent>;
    let messagesServiceSpy: SpyObj<MessagesService>;

    beforeEach(() => {
        messagesServiceSpy = jasmine.createSpyObj('MessagesService', ['setIsTyping', 'sendMessage']);

        TestBed.configureTestingModule({
            declarations: [MessageSectionComponent],
            imports: [MatDialogModule, HttpClientModule],
            providers: [{ provide: MessagesService, useValue: messagesServiceSpy }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageSectionComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('sendMessage should call gameHandlerService.sendMessage()', () => {
        component['infosService']['gameMode'] = LobbyModes.ClassicDuo;
        component['infosService']['endGame'] = false;
        component['infosService']['playerName'] = 'Dude';
        fixture.detectChanges();
        component['inputText'].nativeElement.value = 'blablabla';
        component['text'] = 'blablabla';
        component.sendMessage();
        expect(messagesServiceSpy.sendMessage).toHaveBeenCalled();
    });

    it('sendMessage should not call gameHandlerService.sendMessage() if text.length < 0', () => {
        component['infosService'].setGameMode(LobbyModes.ClassicDuo);
        component['infosService'].setEndGame(false);
        fixture.detectChanges();
        component['inputText'].nativeElement.value = '';
        component.sendMessage();
        expect(messagesServiceSpy.sendMessage).not.toHaveBeenCalled();
    });

    it('sendMessage should reset text and call setIsTyping correctly', () => {
        const spy = spyOn(component, 'setIsTyping');
        component['infosService'].setGameMode(LobbyModes.ClassicDuo);
        component['infosService'].setEndGame(false);
        fixture.detectChanges();
        component['inputText'].nativeElement.value = 'blablabla';
        component.sendMessage();
        expect(component['text']).toEqual('');
        expect(spy).toHaveBeenCalledWith(false);
    });

    it('setIsTyping should send boolean to messagesService', () => {
        component.setIsTyping(true);
        expect(messagesServiceSpy.setIsTyping).toHaveBeenCalledWith(true);
    });

    it('should initialize the correct elements in solo game', () => {
        component['infosService']['gameMode'] = LobbyModes.ClassicSolo;
        fixture.detectChanges();
        const container = fixture.debugElement.query(By.css('#message-section')).nativeElement;
        const containerChildren = container.childNodes;

        const messageTitle = fixture.debugElement.query(By.css('#message-section-title')).nativeElement;
        const messageTitleChild = messageTitle.childNodes[0];
        const title = fixture.debugElement.query(By.css('#title')).nativeElement;

        const messageZone = fixture.debugElement.query(By.css('#message-zone')).nativeElement;
        const messageZoneChildren = messageZone.childNodes;
        const messageDisplay = fixture.debugElement.query(By.css('#message-display')).nativeElement;

        const messageBox = fixture.debugElement.query(By.css('#message-box')).nativeElement;
        const messageBoxChildren = messageBox.childNodes;
        const textarea = fixture.nativeElement.querySelector('textarea');
        const button = fixture.nativeElement.querySelector('button');

        expect(container).toBeTruthy();
        expect(messageTitle).toBeTruthy();
        expect(messageZone).toBeTruthy();
        expect(messageBox).toBeTruthy();
        expect(containerChildren).toContain(messageTitle);
        expect(containerChildren).toContain(messageZone);
        expect(containerChildren).toContain(messageBox);

        expect(title).toBeTruthy();
        expect(messageTitleChild).toEqual(title);

        expect(messageDisplay).toBeTruthy();
        expect(messageZoneChildren).toContain(messageDisplay);

        expect(textarea).toBeTruthy();
        expect(button).toBeTruthy();
        expect(messageBoxChildren).toContain(textarea);
        expect(messageBoxChildren).toContain(button);

        expect(title.textContent).toEqual('Messages');
        expect(textarea.placeholder).toEqual('Tapez un message');
    });

    it('should initialize message box and button correctly in duo mode', () => {
        component['infosService']['gameMode'] = LobbyModes.ClassicDuo;
        component['infosService']['endGame'] = false;
        fixture.detectChanges();
        const enabledTextArea = fixture.debugElement.query(By.css('.enabled-text-area'));
        const disabledTextArea = fixture.debugElement.query(By.css('.disabled-text-area'));
        const button = fixture.nativeElement.querySelector('button');
        expect(enabledTextArea).toBeTruthy();
        expect(disabledTextArea).toBeFalsy();
        expect(button.disabled).toBeFalsy();
    });

    it('should initialize message box and button correctly in solo mode', () => {
        component['infosService']['gameMode'] = LobbyModes.ClassicSolo;
        fixture.detectChanges();
        const enabledTextArea = fixture.debugElement.query(By.css('.enabled-text-area'));
        const disabledTextArea = fixture.debugElement.query(By.css('.disabled-text-area'));
        const button = fixture.nativeElement.querySelector('button');
        expect(disabledTextArea).toBeTruthy();
        expect(enabledTextArea).toBeFalsy();
        expect(button.disabled).toBeTruthy();
    });

    it('textarea should call setIsTyping on change', () => {
        component['infosService']['gameMode'] = LobbyModes.ClassicDuo;
        component['infosService']['endGame'] = false;
        const spy = spyOn(component, 'setIsTyping');
        fixture.detectChanges();
        const enabledTextArea = fixture.debugElement.query(By.css('.enabled-text-area'));
        enabledTextArea.nativeElement.dispatchEvent(new Event('change'));
        expect(spy).toHaveBeenCalledWith(false);
    });

    it('textarea should call setIsTyping on click', () => {
        component['infosService']['gameMode'] = LobbyModes.ClassicDuo;
        component['infosService']['endGame'] = false;
        fixture.detectChanges();
        const enabledTextArea = fixture.debugElement.query(By.css('.enabled-text-area')).nativeElement;
        enabledTextArea.click();
        expect(messagesServiceSpy.setIsTyping).toHaveBeenCalledWith(true);
    });

    it('should display disabled typing area when game ends', () => {
        component['infosService']['gameMode'] = LobbyModes.ClassicDuo;
        component['infosService']['endGame'] = true;
        fixture.detectChanges();
        const enabledTextArea = fixture.debugElement.query(By.css('.enabled-text-area'));
        const disabledTextArea = fixture.debugElement.query(By.css('.disabled-text-area'));
        const button = fixture.nativeElement.querySelector('button');
        expect(disabledTextArea).toBeTruthy();
        expect(enabledTextArea).toBeFalsy();
        expect(button.disabled).toBeTruthy();
    });

    it('button should send message on click', () => {
        component['infosService']['gameMode'] = LobbyModes.ClassicDuo;
        component['infosService']['endGame'] = false;
        fixture.detectChanges();
        const spy = spyOn(component, 'sendMessage');
        const button = fixture.nativeElement.querySelector('button');
        button.click();
        expect(spy).toHaveBeenCalled();
    });
});
