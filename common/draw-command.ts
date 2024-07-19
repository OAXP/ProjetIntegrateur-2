export interface DrawCommand {
    ctx: CanvasRenderingContext2D;
    imageData: ImageData;
    otherCtx: CanvasRenderingContext2D;
    otherImageData: ImageData;
}
