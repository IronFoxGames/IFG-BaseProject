export class ItemAndAmount {
    public id: string;
    public amount: number;

    constructor(id: string, amount: number) {
        this.id = id;
        this.amount = amount;
    }

    public static fromObject(obj: any): ItemAndAmount {
        if (obj?.id == null || obj?.amount == null) {
            throw new Error(`Invalid ItemAndAmoun id=${obj?.id} amount=${obj?.amount}`);
        }

        return new ItemAndAmount(obj.id, obj.amount);
    }
}
