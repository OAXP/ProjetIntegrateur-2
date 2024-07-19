import { Injectable } from '@angular/core';
import { ALPHA_VISIBLE, DEFAULT_INDEX, DEFAULT_THICKNESS, IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/constants/consts';
import { compareColors, getDataIndex } from '@app/utils/canvas.utils';
import { Coordinates } from '@common/coordinates';
import { DrawCommand } from '@common/draw-command';
import { RGBA } from '@common/rgba';

export enum DrawMode {
    None,
    Pencil,
    Rectangle,
    Eraser,
    Fill,
}

@Injectable({
    providedIn: 'root',
})
export class DrawService {
    private ctx: CanvasRenderingContext2D;
    private mode: DrawMode;
    private color: string;
    private readonly modifications: DrawCommand[];
    private commandPointer: number;
    private thickness: number;
    private previousPoint: Coordinates;
    private beforeRectangleData: ImageData;
    private circleCanvas: HTMLCanvasElement;
    private canvasSize: Coordinates;

    constructor() {
        this.commandPointer = DEFAULT_INDEX;
        this.thickness = DEFAULT_THICKNESS;
        this.canvasSize = { x: IMAGE_WIDTH, y: IMAGE_HEIGHT };
        this.mode = DrawMode.None;
        this.color = '#000000';
        this.modifications = [];
        this.generateCircleCanvas();
    }

    get width(): number {
        return this.canvasSize.x;
    }

    get height(): number {
        return this.canvasSize.y;
    }

    get drawMode(): DrawMode {
        return this.mode;
    }

    get context(): CanvasRenderingContext2D {
        return this.ctx;
    }

    get commands(): DrawCommand[] {
        return this.modifications;
    }

    get drawThickness(): number {
        return this.thickness;
    }
    get drawColor(): string {
        return this.color;
    }

    set drawMode(value: DrawMode) {
        this.mode = value;
    }

    set context(value: CanvasRenderingContext2D) {
        this.ctx = value;
    }

    set drawColor(value: string) {
        this.color = value;
    }

    set drawThickness(value: number) {
        this.thickness = Math.floor(value);
    }

    set initPoint(value: Coordinates) {
        this.previousPoint = value;
    }

    set initImageData(value: ImageData) {
        this.beforeRectangleData = value;
    }

    getPointer(): number {
        return this.commandPointer;
    }

    initModifications(ctx: CanvasRenderingContext2D, otherCtx: CanvasRenderingContext2D) {
        this.commandPointer = 0;
        const imageData = ctx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const otherImageData = otherCtx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.modifications[0] = {
            ctx,
            imageData,
            otherCtx,
            otherImageData,
        };
        this.modifications.length = 1;
    }

    clearModifications() {
        this.modifications.length = 0;
        this.commandPointer = DEFAULT_INDEX;
    }

    applyCurrentModification() {
        const { ctx, imageData, otherCtx, otherImageData } = this.modifications[this.commandPointer];
        ctx.putImageData(imageData, 0, 0);
        otherCtx.putImageData(otherImageData, 0, 0);
    }

    undo() {
        if (this.commandPointer <= 0) return;
        this.commandPointer--;
        this.applyCurrentModification();
    }

    redo() {
        if (this.commandPointer >= this.modifications.length - 1) return;
        this.commandPointer++;
        this.applyCurrentModification();
    }

    do() {
        const imageData = this.ctx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const { ctx, otherCtx } = this.modifications[this.commandPointer];
        const isOther = this.ctx !== ctx;
        const otherImageData = (isOther ? ctx : otherCtx).getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

        const command: DrawCommand = {
            ctx: this.ctx,
            imageData,
            otherCtx: isOther ? ctx : otherCtx,
            otherImageData,
        };

        this.commandPointer++;
        this.modifications[this.commandPointer] = command;
        this.modifications.length = this.commandPointer + 1;
    }

    getDistance(previousPoint: Coordinates, currentPoint: Coordinates) {
        return Math.sqrt(Math.pow(currentPoint.x - previousPoint.x, 2) + Math.pow(currentPoint.y - previousPoint.y, 2));
    }

    generateCircleCanvas() {
        const diameter = this.thickness + 1;
        const radius = diameter / 2;
        this.circleCanvas = document.createElement('canvas');
        this.circleCanvas.width = diameter;
        this.circleCanvas.height = diameter;
        const circleCanvasContext = this.circleCanvas.getContext('2d') as CanvasRenderingContext2D;
        const centerX = radius;
        const centerY = radius;

        for (let i = 0; i < diameter; i++) {
            for (let j = 0; j < diameter; j++) {
                const dx = i - centerX;
                const dy = j - centerY;
                const distance = this.getDistance({ x: 0, y: 0 }, { x: dx, y: dy });

                if (distance <= radius) {
                    circleCanvasContext.fillStyle = this.color;
                    circleCanvasContext.fillRect(i, j, 1, 1);
                }
            }
        }
    }

    // Drawing without anti-aliasing inspired by  : https://medium.com/@kozo002/how-to-draw-without-antialiasing-on-html5-canvas-cf13294a8e58
    pencil(currentPoint: Coordinates) {
        this.ctx.globalCompositeOperation = 'source-over';
        const distance = this.getDistance(this.previousPoint, currentPoint);
        const angle = Math.atan2(currentPoint.x - this.previousPoint.x, currentPoint.y - this.previousPoint.y);
        for (let i = 0; i < distance; i += this.thickness / 2) {
            const x = this.previousPoint.x + Math.sin(angle) * i - this.thickness / 2;
            const y = this.previousPoint.y + Math.cos(angle) * i - this.thickness / 2;
            this.context.drawImage(this.circleCanvas, Math.round(x), Math.round(y));
        }
        this.previousPoint = currentPoint;
    }

    eraser(currentPoint: Coordinates) {
        this.ctx.beginPath();
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.moveTo(this.previousPoint.x, this.previousPoint.y);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.thickness;
        this.ctx.lineCap = 'square';
        this.ctx.lineJoin = 'miter';
        this.ctx.lineTo(currentPoint.x, currentPoint.y);
        this.ctx.stroke();
        this.previousPoint = currentPoint;
    }

    drawRectangle(currentPosition: Coordinates, isSquare: boolean) {
        this.ctx.beginPath();
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.putImageData(this.beforeRectangleData, 0, 0);
        this.ctx.lineCap = 'square';
        this.ctx.fillStyle = this.color;
        this.ctx.lineWidth = 1;
        const width = currentPosition.x - this.previousPoint.x;
        const height = currentPosition.y - this.previousPoint.y;
        if (isSquare) {
            const max = Math.max(Math.abs(width), Math.abs(height));
            const widthSign = Math.sign(width);
            const heightSign = Math.sign(height);
            this.ctx.fillRect(this.previousPoint.x, this.previousPoint.y, max * widthSign, max * heightSign);
        } else {
            this.ctx.fillRect(this.previousPoint.x, this.previousPoint.y, width, height);
        }
    }

    fill(currentPosition: Coordinates) {
        const imageData = this.ctx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const rgbColor = this.hexToRgb(this.color);
        let index = getDataIndex(currentPosition.x, currentPosition.y);
        const floodColor: RGBA = {
            r: imageData.data[index],
            g: imageData.data[index + 1],
            b: imageData.data[index + 2],
            a: imageData.data[index + 3],
        };
        const queue = [currentPosition];
        while (queue.length > 0) {
            const pixel = queue.shift() ?? { x: 0, y: 0 }; // should not be undefined
            index = getDataIndex(pixel.x, pixel.y);
            const currentColor: RGBA = {
                r: imageData.data[index],
                g: imageData.data[index + 1],
                b: imageData.data[index + 2],
                a: imageData.data[index + 3],
            };

            if (this.isInCanvas(pixel.x, pixel.y) || compareColors(currentColor, rgbColor)) {
                continue;
            }

            if (!compareColors(currentColor, floodColor)) {
                continue;
            }

            imageData.data[index] = rgbColor.r;
            imageData.data[index + 1] = rgbColor.g;
            imageData.data[index + 2] = rgbColor.b;
            imageData.data[index + 3] = ALPHA_VISIBLE;

            queue.push({ x: pixel.x + 1, y: pixel.y });
            queue.push({ x: pixel.x - 1, y: pixel.y });
            queue.push({ x: pixel.x, y: pixel.y + 1 });
            queue.push({ x: pixel.x, y: pixel.y - 1 });
            queue.push({ x: pixel.x + 1, y: pixel.y + 1 });
            queue.push({ x: pixel.x - 1, y: pixel.y - 1 });
            queue.push({ x: pixel.x + 1, y: pixel.y - 1 });
            queue.push({ x: pixel.x - 1, y: pixel.y + 1 });
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    isInCanvas(xCoordinate: number, yCoordinate: number): boolean {
        return xCoordinate < 0 || xCoordinate >= IMAGE_WIDTH || yCoordinate < 0 || yCoordinate >= IMAGE_HEIGHT;
    }

    // Code inspired by : https://stackoverflow.com/a/5624139
    hexToRgb(hexColor: string): RGBA {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor) ?? ['0', '0', '0', '0'];
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: 255,
        };
    }

    copyCanvas(srcCtx: CanvasRenderingContext2D) {
        this.ctx.putImageData(srcCtx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT), 0, 0);
    }
    clearCanvas() {
        this.ctx.beginPath();
        this.ctx.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }
}
