import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawableCanvasComponent } from './drawable-canvas.component';
import { DrawMode, DrawService } from '@app/services/draw.service';
import { MouseButton } from '@app/constants/consts';
import SpyObj = jasmine.SpyObj;

describe('DrawableCanvasComponent', () => {
    let component: DrawableCanvasComponent;
    let fixture: ComponentFixture<DrawableCanvasComponent>;
    let frontContextSpy: SpyObj<CanvasRenderingContext2D>;
    let backContextSpy: SpyObj<CanvasRenderingContext2D>;

    const INIT_POINT = { x: 0, y: 0 };

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DrawableCanvasComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DrawableCanvasComponent);
        component = fixture.componentInstance;
        frontContextSpy = jasmine.createSpyObj('CanvasRenderingContext2D', ['clearRect', 'drawImage', 'getImageData']);
        backContextSpy = jasmine.createSpyObj('CanvasRenderingContext2D', ['clearRect', 'drawImage', 'getImageData']);
        fixture.detectChanges();
        component['frontContext'] = frontContextSpy;
        component['backgroundContext'] = backContextSpy;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('foregroundCtx should return frontContext value', () => {
        const value = component.foregroundCtx;
        expect(value).toEqual(frontContextSpy);
    });

    it('backgroundCtx should return backgroundContext value', () => {
        const value = component.backgroundCtx;
        expect(value).toEqual(backContextSpy);
    });

    it('ngAfterViewInit() should set drawMode to None', () => {
        component.ngAfterViewInit();
        expect(component['drawService'].drawMode).toEqual(DrawMode.None);
    });

    it('clear() should call clearRect() on the fg and bg context', () => {
        component.clear();
        expect(frontContextSpy.clearRect).toHaveBeenCalled();
        expect(backContextSpy.clearRect).toHaveBeenCalled();
    });

    it('drawBackImage() should call drawImage() on the bg context', () => {
        component.drawBackImage(new Image());
        expect(backContextSpy.drawImage).toHaveBeenCalled();
    });

    it('handleMouseUp() should not call drawService.do() if it is not a left click', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], { button: MouseButton.Middle });
        const doSpy = spyOn(DrawService.prototype, 'do');
        component['isDown'] = true;
        component.handleMouseUp(event);
        expect(doSpy).not.toHaveBeenCalled();
    });

    it('handleMouseUp() should call drawService.do() if it is a left click', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], { button: MouseButton.Left });
        const doSpy = spyOn(DrawService.prototype, 'do');
        component['isDown'] = true;
        component.handleMouseUp(event);
        expect(doSpy).toHaveBeenCalled();
    });

    it('handleMouseUp() should not call drawService.do() if isDown is false', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], { button: MouseButton.Left });
        const doSpy = spyOn(DrawService.prototype, 'do');
        component['isDown'] = false;
        component.handleMouseUp(event);
        expect(doSpy).not.toHaveBeenCalled();
    });

    it('handleMouseDown() should not set isDown to true if it is not a left click', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], { button: MouseButton.Middle });
        component['drawService'].drawMode = DrawMode.Pencil;
        component['isDown'] = false;
        component.handleMouseDown(event);
        expect(component['isDown']).toEqual(false);
    });

    it('handleMouseDown() should not set isDown to true if drawMode is None', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], { button: MouseButton.Left });
        component['drawService'].drawMode = DrawMode.None;
        component['isDown'] = false;
        component.handleMouseDown(event);
        expect(component['isDown']).toEqual(false);
    });

    it('handleMouseDown() should set isDown to true if it is a left click', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], { button: MouseButton.Left });
        component['drawService'].drawMode = DrawMode.Pencil;
        component['isDown'] = false;
        component.handleMouseDown(event);
        expect(component['isDown']).toEqual(true);
    });

    it('handleMouseDown() should call fill if drawMode is Fill', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], { button: MouseButton.Left });
        component['drawService'].drawMode = DrawMode.Fill;
        const fillSpy = spyOn(DrawService.prototype, 'fill');
        component.handleMouseDown(event);
        expect(fillSpy).toHaveBeenCalled();
    });

    it('handleMouseDown() should call getImageData if drawMode is Rectangle', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], { button: MouseButton.Left });
        component['drawService'].drawMode = DrawMode.Rectangle;
        component.handleMouseDown(event);
        expect(frontContextSpy.getImageData).toHaveBeenCalled();
    });

    it('handleMouseMove() should not call any method if isDown is false', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], { button: MouseButton.Left });
        const pencilSpy = spyOn(DrawService.prototype, 'pencil');
        const eraserSpy = spyOn(DrawService.prototype, 'eraser');
        const drawRectangleSpy = spyOn(DrawService.prototype, 'drawRectangle');
        component['isDown'] = false;
        component.handleMouseMove(event);
        expect(pencilSpy).not.toHaveBeenCalled();
        expect(eraserSpy).not.toHaveBeenCalled();
        expect(drawRectangleSpy).not.toHaveBeenCalled();
    });

    it('handleMouseMove() should call pencil() if drawMode is Pencil', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], {
            button: MouseButton.Left,
            offsetX: 0,
            offsetY: 0,
            shiftKey: true,
        });
        const pencilSpy = spyOn(DrawService.prototype, 'pencil');
        component['drawService'].drawMode = DrawMode.Pencil;
        component['isDown'] = true;
        component.handleMouseMove(event);
        expect(pencilSpy).toHaveBeenCalled();
    });

    it('handleMouseMove() should call eraser() if drawMode is Eraser', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], {
            button: MouseButton.Left,
            offsetX: 0,
            offsetY: 0,
            shiftKey: true,
        });
        const eraserSpy = spyOn(DrawService.prototype, 'eraser');
        component['drawService'].drawMode = DrawMode.Eraser;
        component['isDown'] = true;
        component.handleMouseMove(event);
        expect(eraserSpy).toHaveBeenCalled();
    });

    it('handleMouseMove() should call drawRectangle() if drawMode is Rectangle', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], {
            button: MouseButton.Left,
            offsetX: 0,
            offsetY: 0,
            shiftKey: true,
        });
        const drawRectangleSpy = spyOn(DrawService.prototype, 'drawRectangle');
        component['drawService'].drawMode = DrawMode.Rectangle;
        component['isDown'] = true;
        component.handleMouseMove(event);
        expect(drawRectangleSpy).toHaveBeenCalled();
    });

    it('handleMouseEnter() should set initPoint to offsetX and offsetY if drawMode is not Rectangle', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], {
            button: MouseButton.Left,
            offsetX: 1,
            offsetY: 1,
            shiftKey: true,
        });
        component['drawService'].drawMode = DrawMode.Pencil;
        component['drawService']['previousPoint'] = INIT_POINT;
        component.handleMouseEnter(event);
        expect(component['drawService']['previousPoint']).toEqual({ x: event.offsetX, y: event.offsetY });
    });

    it('handleMouseEnter() should not set initPoint to offsetX and offsetY if drawMode is Rectangle', () => {
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault', 'stopPropagation'], {
            button: MouseButton.Left,
            offsetX: 1,
            offsetY: 1,
            shiftKey: true,
        });
        component['drawService'].drawMode = DrawMode.Rectangle;
        component['drawService']['previousPoint'] = INIT_POINT;
        component.handleMouseEnter(event);
        expect(component['drawService']['previousPoint']).not.toEqual({ x: event.offsetX, y: event.offsetY });
    });
});
