import { TestBed } from '@angular/core/testing';
import { MouseButton } from '@app/constants/consts';
import { MouseService } from './mouse.service';
import { Coordinates } from '@common/coordinates';

let mouseEvent: MouseEvent;

describe('MouseService', () => {
    let service: MouseService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MouseService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('position should return mousePosition', () => {
        const result = service.position;
        expect(result).toEqual(service['mousePosition']);
    });

    it('should change mousePosition if left', () => {
        const expectedPosition: Coordinates = { x: 100, y: 200 };
        mouseEvent = {
            clientX: expectedPosition.x,
            clientY: expectedPosition.y,
            x: expectedPosition.x,
            y: expectedPosition.y,
            offsetX: expectedPosition.x,
            offsetY: expectedPosition.y,
            button: MouseButton.Left,
        } as MouseEvent;
        service.mouseHitDetect(mouseEvent);
        expect(service['mousePosition']).toEqual(expectedPosition);
    });

    it('should not change mousePosition value if not left', () => {
        const expectedPosition: Coordinates = { x: 100, y: 200 };
        mouseEvent = {
            clientX: expectedPosition.x,
            clientY: expectedPosition.y,
            x: expectedPosition.x,
            y: expectedPosition.y,
            offsetX: expectedPosition.x,
            offsetY: expectedPosition.y,
            button: MouseButton.Right,
        } as MouseEvent;
        service.mouseHitDetect(mouseEvent);
        expect(service['mousePosition']).not.toEqual(expectedPosition);
    });
});
