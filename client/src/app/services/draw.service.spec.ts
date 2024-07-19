import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/constants/consts';
import { DrawMode, DrawService } from '@app/services/draw.service';
import { Coordinates } from '@common/coordinates';
import { DrawCommand } from '@common/draw-command';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const mockEmpty = () => {};

interface MockCanvasInfo {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    imageData: ImageData;
}
const getMockCanvasInfo = (): MockCanvasInfo => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    const imageData = context.getImageData(0, 0, 1, 1);
    return { canvas, context, imageData };
};

describe('DrawService', () => {
    let service: DrawService;
    let ctxStub: CanvasRenderingContext2D;

    const CANVAS_WIDTH = IMAGE_WIDTH;
    const CANVAS_HEIGHT = IMAGE_HEIGHT;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DrawService);
        ctxStub = CanvasTestHelper.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        service.context = ctxStub;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it(' width should return the width of the grid canvas', () => {
        expect(service.width).toEqual(CANVAS_WIDTH);
    });

    it(' height should return the height of the grid canvas', () => {
        expect(service.height).toEqual(CANVAS_HEIGHT);
    });

    it('getters should retrieve the attribute', () => {
        service['canvasSize'].x = 0;
        service['canvasSize'].y = 1;
        service['mode'] = DrawMode.Rectangle;
        const { context } = getMockCanvasInfo();
        service['ctx'] = context;
        const mockDrawCommand = [] as DrawCommand[];
        // @ts-ignore
        service['modifications'] = mockDrawCommand;
        service['thickness'] = 1;
        service['commandPointer'] = 1;
        expect(service.width).toEqual(0);
        expect(service.height).toEqual(1);
        expect(service.drawMode).toEqual(DrawMode.Rectangle);
        expect(service.context).toEqual(context);
        expect(service.commands).toEqual(mockDrawCommand);
        expect(service.drawThickness).toEqual(1);
        expect(service.getPointer()).toEqual(1);
    });

    it('setters should change the attribute', () => {
        service.drawMode = DrawMode.Rectangle;
        const { context, imageData } = getMockCanvasInfo();
        service.context = context;
        const mockColor = 'some color';
        service.drawColor = mockColor;
        service.drawThickness = 1;
        const mockPoint: Coordinates = { x: 0, y: 1 };
        service.initPoint = mockPoint;
        service.initImageData = imageData;
        expect(service['mode']).toEqual(DrawMode.Rectangle);
        expect(service['thickness']).toEqual(1);
        expect(service['previousPoint']).toEqual(mockPoint);
        expect(service['beforeRectangleData']).toEqual(imageData);
        expect(service['color']).toEqual(mockColor);
    });

    it('initModifications should setup contexts and command stack', () => {
        const { context } = getMockCanvasInfo();
        // @ts-ignore
        const contextGetImageDataSpy = spyOn(context, 'getImageData').and.callFake(mockEmpty);
        const { context: otherContext } = getMockCanvasInfo();
        // @ts-ignore
        const otherContextGetImageDataSpy = spyOn(otherContext, 'getImageData').and.callFake(mockEmpty);
        service.initModifications(context, otherContext);
        expect(contextGetImageDataSpy).toHaveBeenCalled();
        expect(otherContextGetImageDataSpy).toHaveBeenCalled();
        expect(service.getPointer()).toEqual(0);
        expect(service.commands.length).toEqual(1);
    });

    it('clearModifications should reset command stack', () => {
        service.clearModifications();
        expect(service.commands.length).toEqual(0);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(service.getPointer()).toEqual(-1);
    });

    it('applyCurrentModification should change context image data', () => {
        const { context, imageData } = getMockCanvasInfo();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const contextPutImageDataSpy = spyOn(context, 'putImageData').and.callFake(mockEmpty);
        const { context: otherContext, imageData: otherImageData } = getMockCanvasInfo();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const otherContextPutImageDataSpy = spyOn(otherContext, 'putImageData').and.callFake(mockEmpty);
        service['commandPointer'] = 0;
        // @ts-ignore
        service['modifications'] = [{ ctx: context, imageData, otherCtx: otherContext, otherImageData }];
        service.applyCurrentModification();
        expect(contextPutImageDataSpy).toHaveBeenCalled();
        expect(otherContextPutImageDataSpy).toHaveBeenCalled();
    });

    it('undo should do nothing if commandPointer is less or equal to 0', () => {
        service['commandPointer'] = 0;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const applyCurrentModificationSpy = spyOn(service, 'applyCurrentModification').and.callFake(mockEmpty);
        service.undo();
        expect(applyCurrentModificationSpy).toHaveBeenCalledTimes(0);
    });

    it('undo should decrement commandPointer and apply modifications', () => {
        service['commandPointer'] = 1;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const applyCurrentModificationSpy = spyOn(service, 'applyCurrentModification').and.callFake(mockEmpty);
        service.undo();
        expect(applyCurrentModificationSpy).toHaveBeenCalled();
        expect(service['commandPointer']).toEqual(0);
    });

    it('redo should do nothing if commandPointer is at the top of the stack', () => {
        service['commandPointer'] = 1;
        service['modifications'].length = 1;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const applyCurrentModificationSpy = spyOn(service, 'applyCurrentModification').and.callFake(mockEmpty);
        service.redo();
        expect(applyCurrentModificationSpy).toHaveBeenCalledTimes(0);
    });

    it('redo should increment commandPointer and apply modifications', () => {
        service['commandPointer'] = 0;
        service['modifications'].length = 2;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const applyCurrentModificationSpy = spyOn(service, 'applyCurrentModification').and.callFake(mockEmpty);
        service.redo();
        expect(applyCurrentModificationSpy).toHaveBeenCalled();
    });

    it('do should modify contexts and increment commandPointer', () => {
        const { context, imageData } = getMockCanvasInfo();
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const contextGetImageDataSpy = spyOn(context, 'getImageData').and.callFake(mockEmpty);
        const { context: otherContext, imageData: otherImageData } = getMockCanvasInfo();
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const otherContextGetImageDataSpy = spyOn(otherContext, 'getImageData').and.callFake(mockEmpty);
        service['commandPointer'] = 0;
        service['ctx'] = context;
        // @ts-ignore
        service['modifications'] = [{ ctx: context, imageData, otherCtx: otherContext, otherImageData }];
        service.do();
        expect(contextGetImageDataSpy).toHaveBeenCalled();
        expect(otherContextGetImageDataSpy).toHaveBeenCalled();
        expect(service['commandPointer']).toEqual(1);
    });

    it('pencil should drawImage', () => {
        service['previousPoint'] = { x: 0, y: 0 };
        const getDistanceSpy = spyOn(service, 'getDistance').and.returnValue(1);
        const { context } = getMockCanvasInfo();
        service['ctx'] = context;
        service['thickness'] = 1;
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const drawImageSpy = spyOn(context, 'drawImage').and.callFake(mockEmpty);
        const currentPoint = { x: 1, y: 0 };
        service.pencil(currentPoint);
        expect(getDistanceSpy).toHaveBeenCalled();
        expect(drawImageSpy).toHaveBeenCalled();
        expect(service['previousPoint']).toEqual(currentPoint);
    });

    it('eraser should setup parameters', () => {
        service['previousPoint'] = { x: 0, y: 0 };
        service['thickness'] = 1;
        const mockColor = '#000001';
        service['color'] = mockColor;
        const currentPoint = { x: 1, y: 0 };
        const { context } = getMockCanvasInfo();
        service['ctx'] = context;
        service.eraser(currentPoint);
        expect(service['previousPoint']).toEqual(currentPoint);
        expect(context.lineCap).toEqual('square');
        expect(context.lineJoin).toEqual('miter');
        expect(context.strokeStyle).toEqual(mockColor);
        expect(context.lineWidth).toEqual(1);
    });

    it('drawRectangle should setup parameters and draw a square if isSquare is true', () => {
        service['previousPoint'] = { x: 0, y: 0 };
        const mockColor = '#000001';
        service['color'] = mockColor;
        const currentPoint = { x: 1, y: 0 };
        const { context } = getMockCanvasInfo();
        const putImageDataSpy = spyOn(context, 'putImageData').and.callFake(mockEmpty);
        service['ctx'] = context;
        const absSpy = spyOn(Math, 'abs');
        service.drawRectangle(currentPoint, true);
        expect(context.lineCap).toEqual('square');
        expect(context.fillStyle).toEqual(mockColor);
        expect(context.lineWidth).toEqual(1);
        expect(absSpy).toHaveBeenCalled();
        expect(putImageDataSpy).toHaveBeenCalled();
    });

    it("drawRectangle shouldn't make square if isSquare is false", () => {
        service['previousPoint'] = { x: 0, y: 0 };
        const currentPoint = { x: 1, y: 0 };
        const { context } = getMockCanvasInfo();
        spyOn(context, 'putImageData').and.callFake(mockEmpty);
        service['ctx'] = context;
        const absSpy = spyOn(Math, 'abs');
        const maxSpy = spyOn(Math, 'max');
        service.drawRectangle(currentPoint, false);
        expect(absSpy).toHaveBeenCalledTimes(0);
        expect(maxSpy).toHaveBeenCalledTimes(0);
    });

    it('fill should fill neighboring pixels', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 1;
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const imageData = context.createImageData(3, 1);
        const data = imageData.data;
        const MAX_RGBA_VALUE = 255;
        data[0] = 0;
        data[1] = 0;
        data[2] = 0;
        data[3] = MAX_RGBA_VALUE; // black pixel
        data[4] = MAX_RGBA_VALUE;
        data[5] = 0;
        data[6] = 0;
        data[7] = MAX_RGBA_VALUE; // red pixel
        data[8] = MAX_RGBA_VALUE;
        data[9] = 0;
        data[10] = 0;
        data[11] = MAX_RGBA_VALUE; // red pixel
        context.putImageData(imageData, 0, 0);
        service['ctx'] = context;
        service['color'] = '#0000FF';
        service.fill({ x: 2, y: 0 });
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const newImageData = service['ctx'].getImageData(0, 0, 3, 1).data;
        expect(newImageData[0]).toEqual(0);
        expect(newImageData[1]).toEqual(0);
        expect(newImageData[2]).toEqual(0);
        expect(newImageData[3]).toEqual(MAX_RGBA_VALUE); // Should remain a black pixel
        expect(newImageData[4]).toEqual(0);
        expect(newImageData[5]).toEqual(0);
        expect(newImageData[6]).toEqual(MAX_RGBA_VALUE);
        expect(newImageData[7]).toEqual(MAX_RGBA_VALUE); // Should turn into a blue pixel
        expect(newImageData[8]).toEqual(0);
        expect(newImageData[9]).toEqual(0);
        expect(newImageData[10]).toEqual(MAX_RGBA_VALUE);
        expect(newImageData[11]).toEqual(MAX_RGBA_VALUE); // Should turn into a blue pixel
    });

    it('copyCanvas should copy source context into current context', () => {
        const { context: sourceContext } = getMockCanvasInfo();
        const { context } = getMockCanvasInfo();
        service['ctx'] = context;
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const putImageDataSpy = spyOn(context, 'putImageData').and.callFake(mockEmpty);
        service.copyCanvas(sourceContext);
        expect(putImageDataSpy).toHaveBeenCalled();
    });

    it('clearCanvas should clear the entire canvas', () => {
        const { context } = getMockCanvasInfo();
        service['ctx'] = context;
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const clearRectSpy = spyOn(context, 'clearRect').and.callFake(mockEmpty);
        service.clearCanvas();
        expect(clearRectSpy).toHaveBeenCalledOnceWith(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    });
});
