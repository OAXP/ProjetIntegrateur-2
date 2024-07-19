import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { IMAGE_HEIGHT, IMAGE_WIDTH, MouseButton } from '@app/constants/consts';
import { DrawMode, DrawService } from '@app/services/draw.service';

@Component({
    selector: 'app-drawable-canvas',
    templateUrl: './drawable-canvas.component.html',
    styleUrls: ['./drawable-canvas.component.scss'],
})
export class DrawableCanvasComponent implements AfterViewInit {
    @ViewChild('background') private backgroundCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild('foreground') private foregroundCanvas: ElementRef<HTMLCanvasElement>;
    private frontContext: CanvasRenderingContext2D;
    private backgroundContext: CanvasRenderingContext2D;
    private isDown: boolean;

    constructor(private readonly drawService: DrawService) {}

    get foregroundCtx(): CanvasRenderingContext2D {
        return this.frontContext;
    }

    get backgroundCtx(): CanvasRenderingContext2D {
        return this.backgroundContext;
    }

    @HostListener('window:mouseup', ['$event'])
    handleMouseUp(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        if (event.button !== MouseButton.Left) {
            return;
        }

        if (!this.isDown) {
            return;
        }

        this.isDown = false;
        this.drawService.do();
    }

    ngAfterViewInit(): void {
        this.frontContext = this.foregroundCanvas.nativeElement.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        this.backgroundContext = this.backgroundCanvas.nativeElement.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
        this.drawService.drawMode = DrawMode.None;
    }

    handleMouseDown(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        if (event.button !== MouseButton.Left) {
            return;
        }

        if (this.drawService.drawMode === DrawMode.None) return;

        this.drawService.context = this.frontContext;
        this.isDown = true;

        if (this.drawService.drawMode === DrawMode.Fill) {
            this.drawService.fill({ x: event.offsetX, y: event.offsetY });
            return;
        }

        this.drawService.initPoint = { x: event.offsetX, y: event.offsetY };
        if (this.drawService.drawMode === DrawMode.Rectangle) {
            this.drawService.initImageData = this.frontContext.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        }
    }

    handleMouseMove(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        if (!this.isDown) {
            return;
        }

        switch (this.drawService.drawMode) {
            case DrawMode.Pencil:
                this.drawService.pencil({ x: event.offsetX, y: event.offsetY });
                break;
            case DrawMode.Eraser:
                this.drawService.eraser({ x: event.offsetX, y: event.offsetY });
                break;
            case DrawMode.Rectangle:
                this.drawService.drawRectangle({ x: event.offsetX, y: event.offsetY }, event.shiftKey);
                break;
        }
    }

    handleMouseEnter(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        if (this.drawService.drawMode !== DrawMode.Rectangle) this.drawService.initPoint = { x: event.offsetX, y: event.offsetY };
    }

    clear() {
        this.backgroundContext.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.frontContext.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    drawBackImage(image: HTMLImageElement) {
        this.backgroundContext.drawImage(image, 0, 0);
    }
}
