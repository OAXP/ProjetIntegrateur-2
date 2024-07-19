import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CreationPageComponent } from './creation-page.component';
import { CommunicationService } from '@app/services/communication.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BmpService } from '@app/services/bmp.service';
import SpyObj = jasmine.SpyObj;
import { of, throwError } from 'rxjs';
import { DifferenceResponse } from '@common/difference-response';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DrawService } from '@app/services/draw.service';
import { DrawableCanvasComponent } from '@app/components/drawable-canvas/drawable-canvas.component';
import { Component } from '@angular/core';

@Component({
    selector: 'app-pencil-case',
    template: '',
})
class MockPencilCaseComponent {}

describe('CreationPageComponent', () => {
    let component: CreationPageComponent;
    let fixture: ComponentFixture<CreationPageComponent>;
    let bmpService: SpyObj<BmpService>;
    let snackbar: SpyObj<MatSnackBar>;
    let matDialog: SpyObj<MatDialog>;
    let drawService: SpyObj<DrawService>;
    let communicationService: SpyObj<CommunicationService>;
    const router = {
        navigate: jasmine.createSpy('navigate'),
    };
    const baseDiff: DifferenceResponse = {
        differentPixelsCount: 1,
        numberOfDifferences: 1,
        difficulty: 'facile',
        image1Url: 'original.bmp',
        image2Url: 'modified.bmp',
        differenceImageUrl: 'diff.bmp',
    };

    beforeEach(() => {
        bmpService = jasmine.createSpyObj('bmpService', ['verifyBmp']);
        snackbar = jasmine.createSpyObj('snackbar', ['open']);
        matDialog = jasmine.createSpyObj('matDialog', ['open']);
        drawService = jasmine.createSpyObj('drawService', [
            'redo',
            'undo',
            'do',
            'getPointer',
            'context',
            'copyCanvas',
            'clearCanvas',
            'clearModifications',
            'initModifications',
        ]);
        communicationService = jasmine.createSpyObj('communicationService', ['getDifferencesInfo']);
        communicationService.getDifferencesInfo.and.returnValue(of(new HttpResponse({ body: baseDiff })));

        TestBed.configureTestingModule({
            declarations: [CreationPageComponent, DrawableCanvasComponent, MockPencilCaseComponent],
            imports: [MatFormFieldModule, MatInputModule, RouterTestingModule, BrowserAnimationsModule],
            providers: [
                { provide: MatDialog, useValue: matDialog },
                { provide: CommunicationService, useValue: communicationService },
                { provide: MatSnackBar, useValue: snackbar },
                { provide: BmpService, useValue: bmpService },
                { provide: DrawService, useValue: drawService },
                { provide: Router, useValue: router },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(CreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(true).toBe(true);
    });

    it('should navigate to the config route and reload the page', async () => {
        await component.returnConfig();
        expect(router.navigate).toHaveBeenCalledWith(['/config']);
    });

    it('should call returnConfig() when clicked', () => {
        const button = fixture.debugElement.query(By.css('button')).nativeElement;
        const returnConfigSpy = spyOn(component, 'returnConfig');
        button.click();
        expect(returnConfigSpy).toHaveBeenCalled();
    });

    it('upload should correctly upload file', () => {
        const input = fixture.debugElement.query(By.css('input#originalImage')).nativeElement;
        const uploadSpy = spyOn(component, 'upload');
        expect(input.type).toBe('file');
        expect(input.accept).toBe('image/bmp');
        input.dispatchEvent(new Event('change'));
        expect(uploadSpy).toHaveBeenCalledWith(jasmine.any(Event), '#original');
    });

    it('should open a snackbar with the correct message if file type is not BMP', async () => {
        const event = { target: { files: [{ type: 'image/jpeg' }], value: '' } } as unknown as Event;
        // spyOn(component, 'fileToBase64').and.returnValue(Promise.resolve('base64'));
        bmpService.verifyBmp.and.returnValue(Promise.resolve(false));

        await component.upload(event, '#og');

        expect(snackbar.open).toHaveBeenCalledWith('Fichier de mauvais format, seuls les fichiers BMP 24-bit 640x480 sont acceptés', 'Fermer', {
            duration: 2000,
        });
    });

    it('should call readAsDataURL', (done) => {
        const file = new Blob(['foo'], { type: 'image/bmp' });
        const event = { target: { files: [file], value: '' } as unknown as HTMLInputElement };
        bmpService.verifyBmp.and.returnValue(Promise.resolve(true));
        const spy = spyOn(FileReader.prototype, 'readAsDataURL');
        component.upload(event as unknown as Event, '#og').then(() => {
            expect(spy).toHaveBeenCalled();
            done();
        });
    });

    it('setImage should draw image on original canvas if the correct id is given', () => {
        const file = new Blob(['foo'], { type: 'image/bmp' }) as File;
        const image = new Image();
        const originalCanvasDrawSpy = spyOn(component.originalDrawableCanvas, 'drawBackImage');
        component.setImage('#original', file, image);
        expect(originalCanvasDrawSpy).toHaveBeenCalled();
        expect(component['image1File']).toEqual(file);
    });

    it('setImage should draw image on modified canvas if the correct id is given', () => {
        const file = new Blob(['foo'], { type: 'image/bmp' }) as File;
        const image = new Image();
        const modifiedCanvasDrawSpy = spyOn(component.modifiedDrawableCanvas, 'drawBackImage');
        component.setImage('#modified', file, image);
        expect(modifiedCanvasDrawSpy).toHaveBeenCalled();
        expect(component['image2File']).toEqual(file);
    });

    it('openModal should open modal', () => {
        const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of({}), close: null });
        dialogRefSpyObj.componentInstance = { body: '' };
        const dialogSpy = matDialog.open.and.returnValue(dialogRefSpyObj);
        component.openModal(baseDiff);
        expect(component['modalDialog']).toBeDefined();
        expect(dialogSpy).toHaveBeenCalled();
    });

    it('getDifferences should open validation modal if 2 valid images were provided', async () => {
        // spyOn(component, 'fileToBase64').and.returnValue(Promise.resolve('base64'));
        component['image1File'] = new File([], 'test');
        component['image2File'] = new File([], 'test');
        const openModalSpy = spyOn(component, 'openModal');
        await component.getDifferences();
        expect(openModalSpy).toHaveBeenCalled();
    });

    it('getDiff should manage errors', async () => {
        const openSnackSpy = spyOn(component, 'openSnack');
        component['image1File'] = new File([], 'test');
        component['image2File'] = new File([], 'test');
        communicationService.getDifferencesInfo.and.returnValue(
            // eslint-disable-next-line deprecation/deprecation
            throwError(
                new HttpErrorResponse({
                    error: { error: 'Error' },
                }),
            ),
        );
        await component.getDifferences();
        expect(openSnackSpy).toHaveBeenCalledWith('Error');
    });

    it('getDifferences should call openSnack if no images were provided', async () => {
        const openSnackSpy = spyOn(component, 'openSnack');
        await component.getDifferences();
        expect(openSnackSpy).toHaveBeenCalled();
    });

    it('clear should clear inputs and background images', () => {
        const originalCanvasClearSpy = spyOn(component.originalDrawableCanvas, 'clear');
        const modifiedCanvasClearSpy = spyOn(component.modifiedDrawableCanvas, 'clear');
        const file = new Blob(['foo'], { type: 'image/bmp' }) as File;
        component['image1File'] = file;
        component['image2File'] = file;
        component.clear();
        expect(component.originalImageInput.nativeElement.value).toEqual('');
        expect(component.modifiedImageInput.nativeElement.value).toEqual('');
        expect(component['image1File']).toBeUndefined();
        expect(component['image2File']).toBeUndefined();
        expect(originalCanvasClearSpy).toHaveBeenCalled();
        expect(modifiedCanvasClearSpy).toHaveBeenCalled();
    });

    it('updateRadius should update the expansion radius according to the input value', () => {
        expect(component['radius']).toBe(3);
        const inputElement: HTMLInputElement = document.createElement('input');
        inputElement.value = '9';
        const event = { target: inputElement };
        component.updateRadius(event as unknown as Event);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(component['radius']).toBe(9);
    });
    it('setBlankContext should create a blank white image', () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        component.setBlankContext(context);
        expect(context.fillStyle).toEqual('#ffffff');
    });

    it('key combination control + z should call undo', () => {
        const keyboardEvent = new KeyboardEvent('keyup', { key: 'z', ctrlKey: true });
        component.buttonDetect(keyboardEvent);
        expect(drawService.undo).toHaveBeenCalled();
    });

    it('key combination control + shift + z should call redo', () => {
        const keyboardEvent = new KeyboardEvent('keyup', { key: 'z', shiftKey: true, ctrlKey: true });
        component.buttonDetect(keyboardEvent);
        expect(drawService.redo).toHaveBeenCalled();
    });

    it('copyCanvas should do nothing if commandPointer is 0', () => {
        drawService.getPointer.and.returnValue(0);
        component.copyCanvas('original');
        expect(drawService.copyCanvas).toHaveBeenCalledTimes(0);
    });

    it('copyCanvas should copy original canvas into modified canvas canvas source is original', () => {
        drawService.getPointer.and.returnValue(1);
        component.copyCanvas('original');
        expect(drawService.copyCanvas).toHaveBeenCalledOnceWith(component.originalDrawableCanvas.foregroundCtx);
    });

    it('copyCanvas should copy modified canvas into original canvas canvas source is modified', () => {
        drawService.getPointer.and.returnValue(1);
        component.copyCanvas('modified');
        expect(drawService.copyCanvas).toHaveBeenCalledOnceWith(component.modifiedDrawableCanvas.foregroundCtx);
    });

    it('clearCanvas should do nothing if commandPointer is 0', () => {
        drawService.getPointer.and.returnValue(0);
        component.clearCanvas('original');
        expect(drawService.clearCanvas).toHaveBeenCalledTimes(0);
    });

    it('clearCanvas should clear original canvas if canvas source is original', () => {
        drawService.getPointer.and.returnValue(1);
        component.clearCanvas('original');
        expect(drawService.clearCanvas).toHaveBeenCalled();
        expect(drawService.context).toEqual(component.originalDrawableCanvas.foregroundCtx);
    });
    it('clearCanvas should clear modified canvas if canvas source is modified', () => {
        drawService.getPointer.and.returnValue(1);
        component.clearCanvas('modified');
        expect(drawService.clearCanvas).toHaveBeenCalled();
        expect(drawService.context).toEqual(component.modifiedDrawableCanvas.foregroundCtx);
    });

    it("clearCanvas should clear both canvas' if canvas source is both", () => {
        drawService.getPointer.and.returnValue(1);
        component.clearCanvas('both');
        expect(drawService.clearCanvas).toHaveBeenCalledTimes(2);
    });

    it('switchCanvas should interchange context imageData', () => {
        const originalContextDataSpy = spyOn(component.originalDrawableCanvas.foregroundCtx, 'putImageData');
        const modifiedContextDataSpy = spyOn(component.modifiedDrawableCanvas.foregroundCtx, 'putImageData');
        component.switchCanvas();
        expect(originalContextDataSpy).toHaveBeenCalled();
        expect(modifiedContextDataSpy).toHaveBeenCalled();
    });

    it('isEmptyCanvas should return false if the canvas was drawn on', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        context.fillStyle = 'red';
        context.fillRect(0, 0, 1, 1);
        const isEmpty = component.isEmptyCanvas(context);
        expect(isEmpty).toBeFalsy();
    });
});
