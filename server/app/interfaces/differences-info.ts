import { Coordinates } from '@common/coordinates';

export interface DifferencesInfo {
    id: string;
    remainingDifferenceGroups: Map<string, number> | [string, number][];
    groups: Coordinates[][];
}
