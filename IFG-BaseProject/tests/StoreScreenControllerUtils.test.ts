import { CollapsedViewOfferNode, ICatalogItem, populateCollapsed } from '../assets/scripts/game/ui/StoreScreenControllerUtils';

describe('populateCollapsed', () => {
    const stacked0 = { collapsedVisible: true, priority: 0, stack: true, tags: ['a'] };
    const stacked1 = { collapsedVisible: true, priority: 1, stack: true, tags: ['a'] };
    const stacked2 = { collapsedVisible: true, priority: 2, stack: true, tags: ['a'] };
    const stacked3 = { collapsedVisible: true, priority: 3, stack: true, tags: ['a'] };
    const stacked4 = { collapsedVisible: true, priority: 4, stack: true, tags: ['a'] };
    const stacked5 = { collapsedVisible: true, priority: 5, stack: true, tags: ['a'] };
    const stacked6 = { collapsedVisible: true, priority: 6, stack: true, tags: ['a'] };
    const stacked7 = { collapsedVisible: true, priority: 7, stack: true, tags: ['a'] };
    const stacked8 = { collapsedVisible: true, priority: 8, stack: true, tags: ['a'] };
    const stacked9 = { collapsedVisible: true, priority: 9, stack: true, tags: ['a'] };
    const full0 = { collapsedVisible: true, priority: 0, stack: false, tags: ['a'] };
    const full1 = { collapsedVisible: true, priority: 1, stack: false, tags: ['a'] };
    const full2 = { collapsedVisible: true, priority: 2, stack: false, tags: ['a'] };
    const full3 = { collapsedVisible: true, priority: 3, stack: false, tags: ['a'] };
    const full4 = { collapsedVisible: true, priority: 4, stack: false, tags: ['a'] };
    const full5 = { collapsedVisible: true, priority: 5, stack: false, tags: ['a'] };
    const notVisible0 = { collapsedVisible: false, priority: 5, stack: false, tags: ['a'] };

    it('shows expand button when the only thing not visible is a non-collapsedVisible item', () => {
        expect(populateCollapsed(['a'], [stacked0, notVisible0])).toStrictEqual([
            { type: 'singlestackedwithexpandbutton', top: stacked0 } satisfies CollapsedViewOfferNode<ICatalogItem>
        ]);
    });
    it('displays the expand button when there are only full bundles, but more non-collapsedVisible items', () => {
        expect(populateCollapsed([], [notVisible0, full4, full5])).toStrictEqual([
            { type: 'bundle', item: full5 },
            { type: 'bundle', item: full4 },
            { type: 'expandbutton' }
        ]);
    });
    it('handles all items being filtered out', () => {
        expect(populateCollapsed(['b'], [stacked0])).toStrictEqual([]);
    });
    it('handles a single stacked item', () => {
        expect(populateCollapsed(['a'], [stacked0])).toStrictEqual([
            {
                type: 'singlestacked',
                top: stacked0
            }
        ]);
    });
    it('displays the expand button when there are only full bundles, but more than can be displayed', () => {
        expect(populateCollapsed([], [full1, full2, full3, full4, full5])).toStrictEqual([
            { type: 'bundle', item: full5 },
            { type: 'bundle', item: full4 },
            { type: 'expandbutton' }
        ]);
    });
    it('displays 3 double stacked entries and a single entry plus expand button when there are not full entries', () => {
        expect(
            populateCollapsed([], [stacked1, stacked0, stacked2, stacked3, stacked4, stacked5, stacked6, stacked7, stacked8, stacked9])
        ).toStrictEqual([
            {
                type: 'doublestacked',
                top: stacked9,
                bottom: stacked8
            },
            {
                type: 'doublestacked',
                top: stacked7,
                bottom: stacked6
            },
            {
                type: 'doublestacked',
                top: stacked5,
                bottom: stacked4
            },
            {
                type: 'singlestackedwithexpandbutton',
                top: stacked3
            }
        ]);
    });

    it('displays all stacked and no expand button when there are exactly enough stack entries', () => {
        expect(populateCollapsed([], [stacked2, stacked3, stacked4, stacked5, stacked6, stacked7, stacked8, stacked9])).toStrictEqual([
            {
                type: 'doublestacked',
                top: stacked9,
                bottom: stacked8
            },
            {
                type: 'doublestacked',
                top: stacked7,
                bottom: stacked6
            },
            {
                type: 'doublestacked',
                top: stacked5,
                bottom: stacked4
            },
            {
                type: 'doublestacked',
                top: stacked3,
                bottom: stacked2
            }
        ]);
    });

    it('displays a single bundle if that is all there is, and the remaining double stacked or with the expand button', () => {
        expect(populateCollapsed([], [full1, stacked0, stacked1, stacked2, stacked3, stacked4, stacked5, stacked6])).toStrictEqual([
            {
                type: 'bundle',
                item: full1
            },
            {
                type: 'doublestacked',
                top: stacked6,
                bottom: stacked5
            },
            {
                type: 'doublestacked',
                top: stacked4,
                bottom: stacked3
            },
            {
                type: 'singlestackedwithexpandbutton',
                top: stacked2
            }
        ]);
    });

    it('shows the expand button if there are more full entries to display but no more stacked entries to display', () => {
        expect(populateCollapsed([], [full2, full1, full0, stacked1, stacked2, stacked3])).toStrictEqual([
            {
                type: 'bundle',
                item: full2
            },
            {
                type: 'bundle',
                item: full1
            },
            {
                type: 'doublestacked',
                top: stacked3,
                bottom: stacked2
            },
            {
                type: 'singlestackedwithexpandbutton',
                top: stacked1
            }
        ]);
    });
});
