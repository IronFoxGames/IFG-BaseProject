import { RoomAndNodeAndProp } from '../core/model/RoomAndNodeAndProp';
import { CompletionSequenceEvent } from './CompletionSequenceEvent';
import { CompletionSequenceEventType } from './CompletionSequenceEventType';
import { ForceSwapPropsCompletionSequenceEventData } from './models/ForceSwapPropsCompletionSequenceEventData';

export class ForceSwapPropsCompletionSequenceEvent extends CompletionSequenceEvent {
    public eventData: ForceSwapPropsCompletionSequenceEventData;

    constructor(data: ForceSwapPropsCompletionSequenceEventData) {
        super();
        this.eventData = data;
    }

    public getType(): CompletionSequenceEventType {
        return CompletionSequenceEventType.ForceSwapProps;
    }

    public static fromObject(obj: any, contextPath: string = '<unknown forceswap event>'): ForceSwapPropsCompletionSequenceEvent {
        if (!Array.isArray(obj.eventData.locationAndPropIds) || obj.eventData.locationAndPropIds.length == 0) {
            throw new Error(`ForceSwapPropsCompletionSequenceEvent: 'locationAndPropIds' is required at ${contextPath}`);
        }

        let locationAndPropIds = obj.eventData.locationAndPropIds.map((lpi: any, i: number) => {
            try {
                return RoomAndNodeAndProp.fromObject(lpi, `${contextPath} > locationAndPropIds[${i}]`);
            } catch (err) {
                throw new Error(
                    `Invalid RoomAndNodeAndProp at ${contextPath} > locationAndPropIds[${i}]: ${err instanceof Error ? err.stack : err}`
                );
            }
        });

        return new ForceSwapPropsCompletionSequenceEvent(
            new ForceSwapPropsCompletionSequenceEventData(CompletionSequenceEventType.ForceSwapProps, locationAndPropIds)
        );
    }
}
