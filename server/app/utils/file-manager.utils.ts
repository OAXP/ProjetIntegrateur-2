import { IMG_FOLDER } from '@app/utils/constants';
import { promises as fs } from 'fs';

export interface SaveImagesArgs {
    image1Base64: string;
    image2Base64: string;
    image1Url: string;
    image2Url: string;
}

export const saveImages = async (params: SaveImagesArgs) => {
    const image1 = Buffer.from(params.image1Base64, 'base64');
    const image2 = Buffer.from(params.image2Base64, 'base64');

    await fs.mkdir(IMG_FOLDER, { recursive: true });
    await fs.writeFile(params.image1Url, image1);
    await fs.writeFile(params.image2Url, image2);
};

export const deleteImages = async (image1Url: string, image2Url: string, differencesImage?: string) => {
    await fs.rm(image1Url, { force: true });
    await fs.rm(image2Url, { force: true });
    if (differencesImage) await fs.rm(differencesImage, { force: true });
};

export const deleteFolder = async () => {
    await fs.rm(IMG_FOLDER, { recursive: true });
};
