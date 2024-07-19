import { formatDate } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { MessagesComponent } from './messages.component';

describe('EventMessagesComponent', () => {
    let component: MessagesComponent;
    let fixture: ComponentFixture<MessagesComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [MessagesComponent],
            imports: [MatDialogModule, HttpClientModule],
        }).compileComponents();

        fixture = TestBed.createComponent(MessagesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize the correct elements', () => {
        component['messagesService']['messages'] = [{ title: 'event', body: 'message', date: Date.now() }];
        fixture.detectChanges();
        const container = fixture.debugElement.query(By.css('#message-container')).nativeElement;
        const message = fixture.debugElement.query(By.css('.message')).nativeElement;
        const span = fixture.nativeElement.querySelector('span');
        const paragraph = fixture.nativeElement.querySelector('p');
        expect(container).toBeTruthy();
        expect(message).toBeTruthy();
        expect(span).toBeTruthy();
        expect(paragraph).toBeTruthy();
        expect(container.childNodes).toContain(message);
        expect(message.childNodes).toContain(span);
        expect(message.childNodes).toContain(paragraph);
    });
    it('span element should show date in right format', () => {
        const currentDate = Date.now();
        component['messagesService']['messages'] = [{ title: 'event', body: 'message', date: currentDate }];
        const date = formatDate(currentDate, 'hh:mm:ss', 'en-US');
        fixture.detectChanges();
        const span = fixture.nativeElement.querySelector('span');
        expect(span.textContent).toEqual(date);
    });

    it('p element should show body only on event message', () => {
        component['messagesService']['messages'] = [{ title: 'event', body: 'message', date: Date.now() }];
        const message = component['messagesService']['messages'][0];
        fixture.detectChanges();
        const paragraph = fixture.nativeElement.querySelector('p');
        expect(paragraph.textContent).toEqual(message.body);
    });

    it('p element should show title and body on player message', () => {
        component['infosService']['playerName'] = 'Carlos';
        component['messagesService']['messages'] = [{ title: 'Carlos', body: 'message', date: Date.now() }];
        const message = component['messagesService']['messages'][0];
        fixture.detectChanges();
        const paragraph = fixture.nativeElement.querySelector('p');
        expect(paragraph.textContent).toEqual(message.title + ' : ' + message.body);
    });

    it('p element should display the right player', () => {
        component['infosService']['playerName'] = 'Carlos';
        component['infosService']['secondPlayerName'] = 'Gabriel';
        component['messagesService']['messages'] = [{ title: 'Carlos', body: 'message', date: Date.now() }];
        fixture.detectChanges();
        const correctMessage = fixture.debugElement.query(By.css('.firstPlayerMessage'));
        const wrongMessage = fixture.debugElement.query(By.css('.secondPlayerMessage'));
        expect(correctMessage).toBeTruthy();
        expect(wrongMessage).toBeFalsy();
    });

    it('p element should display new record', () => {
        component['messagesService']['messages'] = [{ title: 'record', body: 'message', date: Date.now() }];
        fixture.detectChanges();
        const correctMessage = fixture.debugElement.query(By.css('.record'));
        expect(correctMessage).toBeTruthy();
    });

    it('getMessages() should return replay messages if replay mode', () => {
        component['replayService']['messages'] = [];
        component['replayService'].isReplay = true;
        expect(component.getMessages()).toEqual(component['replayService']['messages']);
    });
});
