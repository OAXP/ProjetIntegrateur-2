import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SoundService {
    private readonly differenceFoundSound;
    private readonly errorSound;
    constructor() {
        this.differenceFoundSound = 'assets/good-diff-sound.mp3';
        this.errorSound = 'assets/wrong-diff-sound.mp3';
    }

    playDifferenceFoundAudio(playbackSpeed?: number) {
        const audio = new Audio(this.differenceFoundSound);
        audio.playbackRate = playbackSpeed ?? 1;
        audio.play();
    }

    playErrorAudio(playbackSpeed?: number) {
        const audio = new Audio(this.errorSound);
        audio.playbackRate = playbackSpeed ?? 1;
        audio.play();
    }
}
