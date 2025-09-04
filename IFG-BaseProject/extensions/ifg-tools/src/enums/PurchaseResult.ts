export enum PurchaseStatus {
    Error,
    Success,
    InsufficientCurrency,
    Cancelled
}

export class PurchaseResult {
    private _status: PurchaseStatus = PurchaseStatus.Error;
    private _message: string = '';

    public get Status(): PurchaseStatus {
        return this._status;
    }

    public get Message(): string {
        return this._message;
    }

    constructor(status: PurchaseStatus, message: string = '') {
        this._status = status;
        this._message = message;
    }
}
