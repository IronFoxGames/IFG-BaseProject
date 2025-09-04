"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomAndNodeAndProp = void 0;
class RoomAndNodeAndProp {
    constructor(roomId, nodeId, propId) {
        this.roomId = roomId;
        this.nodeId = nodeId;
        this.propId = propId;
    }
    static fromObject(obj, contextPath = '<unknown RoomAndNodeAndProp>') {
        if ((obj === null || obj === void 0 ? void 0 : obj.roomId) == null || (obj === null || obj === void 0 ? void 0 : obj.nodeId) == null || (obj === null || obj === void 0 ? void 0 : obj.propId) == null) {
            throw new Error(`Invalid RoomAndNodeAndProp at ${contextPath}: roomId[${obj === null || obj === void 0 ? void 0 : obj.roomId}] nodeId[${obj === null || obj === void 0 ? void 0 : obj.nodeId}] propId[${obj === null || obj === void 0 ? void 0 : obj.propId}]`);
        }
        return new RoomAndNodeAndProp(obj.roomId, obj.nodeId, obj.propId);
    }
}
exports.RoomAndNodeAndProp = RoomAndNodeAndProp;
