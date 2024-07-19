import { Injectable } from '@angular/core';
import { BMP_HEAD, IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/constants/consts';

@Injectable({
    providedIn: 'root',
})
export class BmpService {
    async verifyBmp(file: File | undefined): Promise<boolean> {
        if (!file) {
            return false;
        }
        const view = new DataView(await file.arrayBuffer());
        return (
            view.getUint16(0, true) === BMP_HEAD.idFieldValue &&
            view.getUint16(BMP_HEAD.numPixelOffset, true) === BMP_HEAD.numPixelValue &&
            view.getUint32(BMP_HEAD.widthOffset, true) === IMAGE_WIDTH &&
            Math.abs(view.getInt32(BMP_HEAD.heightOffset, true)) === IMAGE_HEIGHT
        );
    }
}
