export function orderCatalogItems(a: ICatalogItem, b: ICatalogItem): number {
    // show non-stacked before stacked
    if (a.stack !== b.stack) {
        if (a.stack) {
            return 1;
        }
        return -1;
    }
    return b.priority - a.priority;
}

export function offerHasAllTags(item: ICatalogItem, tags: string[]): boolean {
    if (!item || !item.tags || !Array.isArray(item.tags)) {
        return false;
    }

    return tags.every((tag) => item.tags.includes(tag));
}

export type FullViewOfferNode<T> =
    | {
          type: 'bundle';
          item: T;
      }
    | {
          type: 'doublestacked';
          top: T;
          bottom: T;
      }
    | {
          type: 'singlestacked';
          top: T;
      };

export type CollapsedViewOfferNode<T> =
    | FullViewOfferNode<T>
    | { type: 'expandbutton' }
    | {
          type: 'singlestackedwithexpandbutton';
          top: T;
      };

export interface ICatalogItem {
    stack: boolean;
    tags: string[];
    priority: number;
    collapsedVisible: boolean;
}

// populates nodes accordingly:
// max.4 columns
// up to 2 full columns if there are enough non-stack items
// remaining columns stacked
// final column will have an expand button if there are more nodes
export function populateCollapsed<T extends ICatalogItem>(filterTags: string[], items: ReadonlyArray<T>): CollapsedViewOfferNode<T>[] {
    const numColumns = 4;
    const maxFullColumns = 2;

    const offerNodes: CollapsedViewOfferNode<T>[] = [];
    const itemsWithTags = items.filter((item) => offerHasAllTags(item, filterTags));
    const visibleItems = itemsWithTags.filter((item) => item.collapsedVisible).sort(orderCatalogItems);
    const filteredItemsCount = itemsWithTags.length - visibleItems.length;
    const fullItems = visibleItems.filter((item) => !item.stack);
    const stackedItems = visibleItems.filter((item) => item.stack);

    for (let column = 0; column < numColumns; column++) {
        if (column < maxFullColumns && fullItems.length > 0) {
            const item = fullItems.shift();
            offerNodes.push({ type: 'bundle', item });
            continue;
        }
        if (stackedItems.length == 0) {
            if (fullItems.length > 0 || filteredItemsCount > 0) {
                offerNodes.push({ type: 'expandbutton' });
            }
            break;
        }

        const topItem = stackedItems.shift();
        const remainingColumns = numColumns - column - 1;
        const remainingFullItems = fullItems.length;
        const remainingStackedItems = stackedItems.length;
        const showExpand =
            (filteredItemsCount > 0 || remainingFullItems > 0 || remainingStackedItems > 1) &&
            (remainingColumns == 0 || remainingStackedItems == 0);
        if (showExpand) {
            offerNodes.push({ type: 'singlestackedwithexpandbutton', top: topItem });
            break;
        }
        if (stackedItems.length >= 1) {
            const bottomItem = stackedItems.shift();
            offerNodes.push({ type: 'doublestacked', top: topItem, bottom: bottomItem });
            continue;
        }
        offerNodes.push({ type: 'singlestacked', top: topItem });
    }
    return offerNodes;
}

export function populateFull<T extends ICatalogItem>(filterTags: string[], items: ReadonlyArray<T>): FullViewOfferNode<T>[] {
    const offerNodes: FullViewOfferNode<T>[] = [];
    const visibleItems = items.filter((item) => offerHasAllTags(item, filterTags)).sort(orderCatalogItems);
    for (let i = 0; i < visibleItems.length; ++i) {
        const item = visibleItems[i];
        if (!item.stack) {
            offerNodes.push({ type: 'bundle', item });
            continue;
        }
        if (i + 1 < visibleItems.length) {
            const bottom = visibleItems[++i];
            offerNodes.push({ type: 'doublestacked', top: item, bottom });
            continue;
        }
        offerNodes.push({ type: 'singlestacked', top: item });
    }
    return offerNodes;
}
