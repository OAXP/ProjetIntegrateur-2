export interface DifferenceResponse {
    id?: string
    differentPixelsCount: number;
    numberOfDifferences: number;
    difficulty: string;
    image1Url: string;
    image2Url: string;
    differenceImageUrl: string;
}
