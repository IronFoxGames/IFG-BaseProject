"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseResult = exports.PurchaseStatus = void 0;
var PurchaseStatus;
(function (PurchaseStatus) {
    PurchaseStatus[PurchaseStatus["Error"] = 0] = "Error";
    PurchaseStatus[PurchaseStatus["Success"] = 1] = "Success";
    PurchaseStatus[PurchaseStatus["InsufficientCurrency"] = 2] = "InsufficientCurrency";
    PurchaseStatus[PurchaseStatus["Cancelled"] = 3] = "Cancelled";
})(PurchaseStatus = exports.PurchaseStatus || (exports.PurchaseStatus = {}));
class PurchaseResult {
    get Status() {
        return this._status;
    }
    get Message() {
        return this._message;
    }
    constructor(status, message = '') {
        this._status = PurchaseStatus.Error;
        this._message = '';
        this._status = status;
        this._message = message;
    }
}
exports.PurchaseResult = PurchaseResult;
