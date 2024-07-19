import { Injectable } from '@angular/core';
import { MouseButton } from '@app/constants/consts';
import { Coordinates } from '@common/coordinates';

@Injectable({
    providedIn: 'root',
})
export class MouseService {
    private mousePosition: Coordinates;
    constructor() {
        this.mousePosition = { x: 0, y: 0 };
    }

    get position(): Coordinates {
        return this.mousePosition;
    }

    mouseHitDetect(event: MouseEvent) {
        if (event.button === MouseButton.Left) {
            this.mousePosition = { x: event.offsetX, y: event.offsetY };
        }
    }
}
