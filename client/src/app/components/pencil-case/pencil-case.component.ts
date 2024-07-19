import { Component, EventEmitter, Output } from '@angular/core';
import { DrawMode, DrawService } from '@app/services/draw.service';
import { MatButtonToggleChange } from '@angular/material/button-toggle';

@Component({
    selector: 'app-pencil-case',
    templateUrl: './pencil-case.component.html',
    styleUrls: ['./pencil-case.component.scss'],
})
export class PencilCaseComponent {
    @Output() copyCanvas = new EventEmitter();
    @Output() clearCanvas = new EventEmitter();

    @Output() switch = new EventEmitter();
    constructor(private readonly drawService: DrawService) {}
    get color() {
        return this.drawService.drawColor;
    }

    isUndoDisabled(): boolean {
        return this.drawService.getPointer() <= 0;
    }

    isRedoDisabled(): boolean {
        return this.drawService.getPointer() >= this.drawService.commands.length - 1;
    }

    changeMode(event: MatButtonToggleChange) {
        const mode = event.value;
        switch (mode) {
            case 'pencil':
                this.drawService.drawMode = DrawMode.Pencil;
                break;
            case 'eraser':
                this.drawService.drawMode = DrawMode.Eraser;
                break;
            case 'rectangle':
                this.drawService.drawMode = DrawMode.Rectangle;
                break;
            case 'fill':
                this.drawService.drawMode = DrawMode.Fill;
                break;
            case 'none':
                this.drawService.drawMode = DrawMode.None;
                break;
        }
    }

    changeColor(event: Event) {
        this.drawService.drawColor = (event.target as HTMLInputElement).value;
        this.drawService.generateCircleCanvas();
    }

    getThickness() {
        return this.drawService.drawThickness;
    }

    changeThickness(value: number | null) {
        this.drawService.drawThickness = value as number;
        this.drawService.generateCircleCanvas();
    }

    undo() {
        this.drawService.undo();
    }

    redo() {
        this.drawService.redo();
    }
}
