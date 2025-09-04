import { CatalogItem } from '../core/model/CatalogItem';
import { PropData } from './models/PropData';

export class PropInstanceData {
    public isOwned: boolean;
    public data: PropData;
    public storeData: CatalogItem;

    constructor(isOwned: boolean, data: PropData, storeData: CatalogItem) {
        this.isOwned = isOwned;
        this.data = data;
        this.storeData = storeData;
    }
}
