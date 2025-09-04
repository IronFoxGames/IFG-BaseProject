"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnumIndex = exports.ObjectiveType = void 0;
var ObjectiveType;
(function (ObjectiveType) {
    ObjectiveType["Score"] = "Score";
    ObjectiveType["HandPlayedAny"] = "HandPlayedAny";
    ObjectiveType["HandPlayed"] = "HandPlayed";
    ObjectiveType["TurnLimit"] = "TurnLimit";
    ObjectiveType["HandPlayedWithScore"] = "HandPlayedWithScore";
    ObjectiveType["CardPlayed"] = "CardPlayed";
    ObjectiveType["TilePlacement"] = "TilePlacement";
    ObjectiveType["CardPlayedWithHand"] = "CardPlayedWithHand";
})(ObjectiveType = exports.ObjectiveType || (exports.ObjectiveType = {}));
function getEnumIndex(enumObj, value) {
    return Object.values(enumObj).indexOf(value);
}
exports.getEnumIndex = getEnumIndex;
