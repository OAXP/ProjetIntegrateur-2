import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PencilCaseComponent } from './pencil-case.component';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DrawMode, DrawService } from '@app/services/draw.service';
import { DrawCommand } from '@common/draw-command';
import SpyObj = jasmine.SpyObj;

describe('PencilCaseComponent', () => {
    let component: PencilCaseComponent;
    let fixture: ComponentFixture<PencilCaseComponent>;
    let drawService: SpyObj<DrawService>;

    beforeEach(() => {
        drawService = jasmine.createSpyObj('drawService', [
            'redo',
            'undo',
            'getPointer',
            'drawColor',
            'drawMode',
            'generateCircleCanvas',
            'drawThickness',
            'commands',
        ]);

        TestBed.configureTestingModule({
            declarations: [PencilCaseComponent],
            imports: [MatSliderModule, MatIconModule, MatButtonToggleModule, MatTooltipModule],
            providers: [{ provide: DrawService, useValue: drawService }],
        }).compileComponents();

        fixture = TestBed.createComponent(PencilCaseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('isUndoDisabled should return true if the stack is empty', () => {
        drawService.getPointer.and.returnValue(0);
        const isUndoDisabled = component.isUndoDisabled();
        expect(isUndoDisabled).toBeTruthy();
    });

    it("isUndoDisabled should return false if the stack isn't empty", () => {
        drawService.getPointer.and.returnValue(1);
        const isUndoDisabled = component.isUndoDisabled();
        expect(isUndoDisabled).toBeFalsy();
    });

    it('isRedoDisabled should return true if pointer is at the top of the stack', () => {
        drawService.getPointer.and.returnValue(0);
        // @ts-ignore
        drawService['modifications'] = [] as DrawCommand[];
        const isUndoDisabled = component.isUndoDisabled();
        expect(isUndoDisabled).toBeTruthy();
    });

    it("isRedoDisabled should return false if pointer isn't at the top of the stack", () => {
        // @ts-ignore
        drawService['modifications'] = [] as DrawCommand[];
        const isUndoDisabled = component.isUndoDisabled();
        expect(isUndoDisabled).toBeFalsy();
    });

    it('changeMode should change drawing mode to pencil if mat button was toggled to pencil', () => {
        // @ts-ignore
        const event = new MatButtonToggleChange(null, false);
        event.value = 'pencil';
        component.changeMode(event);
        expect(drawService['drawMode']).toEqual(DrawMode.Pencil);
    });

    it('changeMode should change drawing mode to eraser if mat button was toggled to eraser', () => {
        // @ts-ignore
        const event = new MatButtonToggleChange(null, false);
        event.value = 'eraser';
        component.changeMode(event);
        expect(drawService['drawMode']).toEqual(DrawMode.Eraser);
    });

    it('changeMode should change drawing mode to rectangle if mat button was toggled to rectangle', () => {
        // @ts-ignore
        const event = new MatButtonToggleChange(null, false);
        event.value = 'rectangle';
        component.changeMode(event);
        expect(drawService['drawMode']).toEqual(DrawMode.Rectangle);
    });

    it('changeMode should change drawing mode to fill if mat button was toggled to fill', () => {
        // @ts-ignore
        const event = new MatButtonToggleChange(null, false);
        event.value = 'fill';
        component.changeMode(event);
        expect(drawService['drawMode']).toEqual(DrawMode.Fill);
    });

    it('changeMode should change drawing mode to none if mat button was toggled to none', () => {
        // @ts-ignore
        const event = new MatButtonToggleChange(null, false);
        event.value = 'none';
        component.changeMode(event);
        expect(drawService['drawMode']).toEqual(DrawMode.None);
    });

    it('changeColor should call generateCircleCanvas', () => {
        const input = {
            value: '#FFFFFF',
        };
        const event = new Event('change');
        Object.defineProperty(event, 'target', {
            value: input,
            writable: false,
        });
        component.changeColor(event);
        expect(drawService.generateCircleCanvas).toHaveBeenCalled();
    });

    it('getThickness should return the correct thickness', () => {
        drawService.drawThickness = 1;
        const thickness = component.getThickness();
        expect(thickness).toEqual(1);
    });

    it('changeThickness should change the thickness', () => {
        drawService.drawThickness = 1;
        component.changeThickness(0);
        expect(drawService.drawThickness).toEqual(0);
    });

    it('undo should call drawService.undo', () => {
        component.undo();
        expect(drawService.undo).toHaveBeenCalled();
    });

    it('redo should call drawService.redo', () => {
        component.redo();
        expect(drawService.redo).toHaveBeenCalled();
    });
});
