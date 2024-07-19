import { Coordinates } from '@common/coordinates';

export interface Cache {
    id: string;
    remainingDifferenceGroups: Map<string, number> | [string, number][];
    groups: Coordinates[][];
}
