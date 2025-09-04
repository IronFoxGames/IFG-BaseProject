"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardinalDirection = exports.Direction = void 0;
var Direction;
(function (Direction) {
    Direction[Direction["None"] = -1] = "None";
    Direction[Direction["Horizontal"] = 0] = "Horizontal";
    Direction[Direction["Vertical"] = 1] = "Vertical";
})(Direction = exports.Direction || (exports.Direction = {}));
var CardinalDirection;
(function (CardinalDirection) {
    CardinalDirection[CardinalDirection["North"] = 0] = "North";
    CardinalDirection[CardinalDirection["South"] = 1] = "South";
    CardinalDirection[CardinalDirection["East"] = 2] = "East";
    CardinalDirection[CardinalDirection["West"] = 3] = "West";
})(CardinalDirection = exports.CardinalDirection || (exports.CardinalDirection = {}));
