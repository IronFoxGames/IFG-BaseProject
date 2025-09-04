export class RoomAndNodeAndProp {
    public roomId: string;
    public nodeId: string;
    public propId: string;

    constructor(roomId: string, nodeId: string, propId: string) {
        this.roomId = roomId;
        this.nodeId = nodeId;
        this.propId = propId;
    }

    public static fromObject(obj: any, contextPath: string = '<unknown RoomAndNodeAndProp>'): RoomAndNodeAndProp {
        if (obj?.roomId == null || obj?.nodeId == null || obj?.propId == null) {
            throw new Error(
                `Invalid RoomAndNodeAndProp at ${contextPath}: roomId[${obj?.roomId}] nodeId[${obj?.nodeId}] propId[${obj?.propId}]`
            );
        }

        return new RoomAndNodeAndProp(obj.roomId, obj.nodeId, obj.propId);
    }
}
