import { TestBed } from '@angular/core/testing';

import { SoundService } from './sound.service';

describe('SoundService', () => {
    let service: SoundService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SoundService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should play difference found audio', () => {
        spyOn(window.HTMLMediaElement.prototype, 'play').and.resolveTo();
        service.playDifferenceFoundAudio();
        expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });

    it('should play error audio', () => {
        spyOn(window.HTMLMediaElement.prototype, 'play').and.resolveTo();
        service.playErrorAudio();
        expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });

    it('should play difference found audio faster if speed is provided', async () => {
        spyOn(window.HTMLMediaElement.prototype, 'play').and.resolveTo();
        const audioConstructorSpy = spyOn(window, 'Audio').and.callThrough();
        const playbackSpeed = 2;
        service.playDifferenceFoundAudio(playbackSpeed);
        expect(audioConstructorSpy).toHaveBeenCalled();
    });
});
