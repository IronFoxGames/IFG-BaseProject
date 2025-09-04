export class UpsellItemConfig {
    public itemId: string = '';
    public catalogItemIds: string[] = [];
    public upsellText: string = '';

    public static fromObject(obj: any): UpsellItemConfig {
        if (obj?.itemId == null || obj?.catalogItemIds == null || obj?.upsellText == null) {
            throw new Error(`Invalid UpsellItemConfig[id=${obj?.itemId}]: missing catalogItemIds or upsellText`);
        }

        let item = new UpsellItemConfig();
        item.itemId = obj?.itemId || '';
        if (Array.isArray(obj.catalogItemIds)) {
            item.catalogItemIds = obj.catalogItemIds.map((id: string) => id);
        } else {
            item.catalogItemIds = [];
        }
        item.upsellText = obj?.upsellText || '';
        return item;
    }
}
