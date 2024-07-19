import { Coordinates } from '@common/coordinates';

export interface ValidateDifferenceResponse {
    isDifferent: boolean;
    differentPixels: Coordinates[];
    groupIndex: number;
}
