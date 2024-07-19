import { Coordinates } from '@common/coordinates';
import { ActionType } from '@app/interfaces/action-type';
import { DifferenceFoundArgs } from '@app/interfaces/difference-found-args';
import { Message } from '@common/message';
import { HintRequestedArgs } from '@app/interfaces/hint-requested-args';

export interface GameAction {
    waitTime: number;
    actionType: ActionType;
    actionParams?: Message | Coordinates | Coordinates[] | DifferenceFoundArgs | HintRequestedArgs | number;
    hasBeenReplayed?: boolean;
}
