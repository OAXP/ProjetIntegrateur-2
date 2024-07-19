import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, HostListener, Injector, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { DrawableCanvasComponent } from '@app/components/drawable-canvas/drawable-canvas.component';
import { ValidationModalComponent } from '@app/components/validation-modal/validation-modal.component';
import { IMAGE_HEIGHT, IMAGE_WIDTH, INITIAL_RADIUS, PIXEL_DATA_OFFSET } from '@app/constants/consts';
import { BmpService } from '@app/services/bmp.service';
import { CommunicationService } from '@app/services/communication.service';
import { DrawService } from '@app/services/draw.service';
import { canvasLayersToBase64Bmp } from '@app/utils/canvas.utils';
import { DifferenceResponse } from '@common/difference-response';

@Component({
    selector: 'app-creation-page',
    templateUrl: './creation-page.component.html',
    styleUrls: ['./creation-page.component.scss'],
})
export class CreationPageComponent implements AfterViewInit, OnDestroy {
    @ViewChild('originalCanvas') originalDrawableCanvas: DrawableCanvasComponent;
    @ViewChild('modifiedCanvas') modifiedDrawableCanvas: DrawableCanvasComponent;
    @ViewChild('originalInput') originalImageInput: ElementRef<HTMLInputElement>;
    @ViewChild('modifiedInput') modifiedImageInput: ElementRef<HTMLInputElement>;
    @ViewChild('fullInput') imagesInput: ElementRef<HTMLInputElement>;
    private matDialog: MatDialog;
    private radius: number;
    private readonly dialogConfig;
    private modalDialog: MatDialogRef<ValidationModalComponent> | undefined;
    private image1File: File | undefined;
    private image2File: File | undefined;
    private bmpService: BmpService;
    private readonly communicationService: CommunicationService;
    private router: Router;
    private snackbar: MatSnackBar;
    private drawService: DrawService;

    constructor(injector: Injector) {
        this.bmpService = injector.get<BmpService>(BmpService);
        this.communicationService = injector.get<CommunicationService>(CommunicationService);
        this.router = injector.get<Router>(Router);
        this.matDialog = injector.get<MatDialog>(MatDialog);
        this.snackbar = injector.get<MatSnackBar>(MatSnackBar);
        this.drawService = injector.get<DrawService>(DrawService);
        this.radius = INITIAL_RADIUS;
        this.dialogConfig = new MatDialogConfig();
    }

    @HostListener('window:keyup', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        const buttonPressed = event.key.toLowerCase();
        if (event.ctrlKey && event.shiftKey && buttonPressed === 'z') {
            this.drawService.redo();
        } else if (event.ctrlKey && buttonPressed === 'z') {
            this.drawService.undo();
        }
    }
    copyCanvas(srcCanvas: string) {
        if (this.drawService.getPointer() <= 0) return;
        if (srcCanvas === 'original') {
            this.drawService.context = this.modifiedDrawableCanvas.foregroundCtx;
            this.drawService.copyCanvas(this.originalDrawableCanvas.foregroundCtx);
        } else {
            this.drawService.context = this.originalDrawableCanvas.foregroundCtx;
            this.drawService.copyCanvas(this.modifiedDrawableCanvas.foregroundCtx);
        }
        this.drawService.do();
    }
    clearCanvas(canvas: string) {
        if (this.drawService.getPointer() <= 0) return;
        switch (canvas) {
            case 'original': {
                this.drawService.context = this.originalDrawableCanvas.foregroundCtx;
                this.drawService.clearCanvas();
                break;
            }
            case 'modified': {
                this.drawService.context = this.modifiedDrawableCanvas.foregroundCtx;
                this.drawService.clearCanvas();
                break;
            }
            case 'both': {
                this.drawService.context = this.originalDrawableCanvas.foregroundCtx;
                this.drawService.clearCanvas();
                this.drawService.context = this.modifiedDrawableCanvas.foregroundCtx;
                this.drawService.clearCanvas();
                break;
            }
        }
        this.drawService.do();
    }
    switchCanvas() {
        const originalImageData = this.originalDrawableCanvas.foregroundCtx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const modifiedImageData = this.modifiedDrawableCanvas.foregroundCtx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.originalDrawableCanvas.foregroundCtx.putImageData(modifiedImageData, 0, 0);
        this.modifiedDrawableCanvas.foregroundCtx.putImageData(originalImageData, 0, 0);
        this.drawService.do();
    }

    ngAfterViewInit() {
        this.drawService.initModifications(this.originalDrawableCanvas.foregroundCtx, this.modifiedDrawableCanvas.foregroundCtx);
    }

    ngOnDestroy() {
        this.drawService.clearModifications();
    }

    openModal(diffResponse: DifferenceResponse): void {
        this.dialogConfig.id = 'validation-modal-component';
        this.dialogConfig.height = '80vh';
        this.dialogConfig.width = '70vw';
        this.modalDialog = this.matDialog.open(ValidationModalComponent, this.dialogConfig);
        (this.modalDialog.componentInstance as ValidationModalComponent).differenceResponse = diffResponse;
    }

    openSnack(message: string) {
        this.snackbar.open(message, 'Fermer', { duration: 2000 });
    }

    async upload(event: Event, imageSource: string): Promise<void> {
        const reader = new FileReader();
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file || file.type !== 'image/bmp' || !(await this.bmpService.verifyBmp(file))) {
            this.openSnack('Fichier de mauvais format, seuls les fichiers BMP 24-bit 640x480 sont acceptés');
            (event.target as HTMLInputElement).value = '';
            return;
        }
        reader.addEventListener('load', this.setImageSource(imageSource, file));
        reader.readAsDataURL(file);
    }
    setImageSource(imageSource: string, file: File): (event: ProgressEvent<FileReader>) => void {
        return (event: ProgressEvent<FileReader>) => {
            const image = new Image();
            const result = event.target?.result;
            image.onload = () => {
                this.setImage(imageSource, file, image);
            };
            image.src = result as string;
        };
    }

    setImage(imageId: string, file: File, imgSrc: HTMLImageElement) {
        if (imageId === '#original') {
            this.originalDrawableCanvas.drawBackImage(imgSrc);
            this.image1File = file;
        } else if (imageId === '#modified') {
            this.modifiedDrawableCanvas.drawBackImage(imgSrc);
            this.image2File = file;
        }
    }

    isEmptyCanvas(context: CanvasRenderingContext2D) {
        const imageData = context.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        const pixels = imageData.data;

        let isCanvasEmpty = true;
        for (let i = 0; i < pixels.length; i += PIXEL_DATA_OFFSET) {
            if (pixels[i + 3] !== 0) {
                isCanvasEmpty = false;
                break;
            }
        }
        return isCanvasEmpty;
    }

    setBlankContext(context: CanvasRenderingContext2D) {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    async getDifferences(): Promise<void> {
        const originalCanvasIsEmpty = this.isEmptyCanvas(this.originalDrawableCanvas.foregroundCtx);
        const modifiedCanvasIsEmpty = this.isEmptyCanvas(this.modifiedDrawableCanvas.foregroundCtx);
        if (this.hasEmptyCanvas(originalCanvasIsEmpty, modifiedCanvasIsEmpty) && !this.hasImageFiles()) this.openSnack('Veuillez créer deux images');
        else {
            if (!this.image1File) this.setBlankContext(this.originalDrawableCanvas.backgroundCtx);
            if (!this.image2File) this.setBlankContext(this.modifiedDrawableCanvas.backgroundCtx);
            const originalFrontData = this.originalDrawableCanvas.foregroundCtx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT).data;
            const originalBackData = this.originalDrawableCanvas.backgroundCtx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT).data;
            const modifiedFrontData = this.modifiedDrawableCanvas.foregroundCtx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT).data;
            const modifiedBackData = this.modifiedDrawableCanvas.backgroundCtx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT).data;
            const originalImageBase64 = canvasLayersToBase64Bmp(originalFrontData, originalBackData);
            const modifiedImageBase64 = canvasLayersToBase64Bmp(modifiedFrontData, modifiedBackData);
            this.communicationService.getDifferencesInfo(originalImageBase64, modifiedImageBase64, this.radius).subscribe({
                next: (response) => {
                    this.openModal(response.body as DifferenceResponse);
                },
                error: (err: HttpErrorResponse) => {
                    this.openSnack(err.error.error);
                },
            });
        }
    }

    hasEmptyCanvas(originalCanvasIsEmpty: boolean, modifiedCanvasIsEmpty: boolean): boolean {
        return originalCanvasIsEmpty && modifiedCanvasIsEmpty;
    }

    hasImageFiles(): File | undefined {
        return this.image1File && this.image2File;
    }

    updateRadius(event: Event): void {
        this.radius = +(event.target as HTMLInputElement).value;
    }

    clear(): void {
        this.originalImageInput.nativeElement.value = '';
        this.modifiedImageInput.nativeElement.value = '';
        this.imagesInput.nativeElement.value = '';
        this.image1File = undefined;
        this.image2File = undefined;
        this.originalDrawableCanvas.clear();
        this.modifiedDrawableCanvas.clear();
    }

    async returnConfig(): Promise<void> {
        await this.router.navigate(['/config']);
    }
}
