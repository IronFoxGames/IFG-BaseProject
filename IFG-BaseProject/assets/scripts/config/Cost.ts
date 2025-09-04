export class Cost {
    public currency: string = "";
    public amount: number = 0;

    public static fromObject(obj: any): Cost {
        const cost = new Cost();

        cost.currency = obj.currency;

        const parsedAmount = Number(obj.amount);
        if (isNaN(parsedAmount)) {
            throw new Error(`Invalid amount: ${obj.amount}`);
        }

        cost.amount = parsedAmount;

        return cost;
    }
}