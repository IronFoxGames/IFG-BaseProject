import { _decorator, Button, CCFloat, instantiate, Node, Prefab, ScrollView, SpriteFrame } from 'cc';
import { AppConfig } from '../../config/AppConfig';
import { EntitlementType } from '../../core/enums/EntitlementType';
import { UpsellOrigin } from '../../core/enums/UpsellOrigin';
import { CatalogItem } from '../../core/model/CatalogItem';
import { ICardScrambleService } from '../../services/ICardScrambleService';
import { IStore } from '../../services/IStore';
import { StoreOfferBundle } from '../../ui/StoreOfferBundle';
import { populateCollapsed, populateFull } from './StoreScreenControllerUtils';
import { StoreStackedOffer } from './StoreStackedOffers';
import { ViewController } from './ViewController';

const { ccclass, property } = _decorator;

@ccclass('StoreScreenController')
export class StoreScreenController extends ViewController {
    @property({ type: Button, visible: true, group: 'Buttons' })
    private _closeButton: Button;

    @property({ type: Button, visible: true, group: 'Buttons' })
    private _clubBannerButton: Button;

    @property({ type: Prefab, visible: true })
    private _storeListingPrefab: Prefab;

    @property({ type: Prefab, visible: true })
    private _stackedListingPrefab: Prefab;

    @property({ type: Node, visible: true })
    private _contentRoot: Node;

    @property({ type: Node, visible: true })
    private _purchasingScrim: Node;

    @property({ type: SpriteFrame, visible: true })
    private _fpoSprite: SpriteFrame;

    @property({ type: ScrollView, visible: true })
    private _scrollView: ScrollView;

    @property({ type: CCFloat, visible: true })
    private _fadeDuration: number = 0.5;

    @property({ type: CCFloat, visible: true })
    private _fadeDelayIncrement: number = 0.1;

    @property({ type: Node, visible: true })
    private _premiumMembershipDiscountBadge: Node;

    private _config: AppConfig;
    private _store: IStore;
    private _cardScrambleService: ICardScrambleService;
    private _collapsed: boolean = true;
    private _allItems: CatalogItem[] = [];
    private _tags: string[] = [];

    private _onCloseCallback?: () => void;

    protected start(): void {
        this._closeButton.node.on(Button.EventType.CLICK, this._onCloseButtonPressedCallback, this);
        this._clubBannerButton.node.on(
            Button.EventType.CLICK,
            () => {
                let origin = UpsellOrigin.None;
                if (this._tags.includes('coins')) {
                    origin = UpsellOrigin.CoinPurchase;
                } else if (this._tags.includes('energy')) {
                    origin = UpsellOrigin.EnergyPurchase;
                }
                this._cardScrambleService.openPlatformPremiumRegistration(origin);
            },
            this
        );
        this.show();
    }

    public async init(
        appConfig: AppConfig,
        store: IStore,
        tags: string[],
        cardScrambleService: ICardScrambleService,
        onCloseCallback: () => void
    ) {
        this._config = appConfig;
        this._store = store;
        this._tags = tags;
        this._cardScrambleService = cardScrambleService;

        this._premiumMembershipDiscountBadge.active = cardScrambleService.getUserEntitlement() !== EntitlementType.Premium;

        this._contentRoot.destroyAllChildren();
        store.getCatalog().then((catalog) => {
            this._allItems = catalog;
            this._refreshOffers();
        });

        this._onCloseCallback = onCloseCallback;
    }

    public async show() {
        await super.show();
    }

    public async hide(): Promise<void> {
        await super.hide();
    }

    private _populateCollapsed(filterTags: string[]): Promise<Node>[] {
        const offerNodes = populateCollapsed(filterTags, this._allItems);

        return offerNodes.map((offerNode) => {
            switch (offerNode.type) {
                case 'bundle':
                    return this._createBundleOfferPrefab(offerNode.item);
                case 'doublestacked':
                    return this._createStackedOfferPrefab(offerNode.top, offerNode.bottom, false);
                case 'singlestacked':
                    return this._createStackedOfferPrefab(offerNode.top, null, false);
                case 'singlestackedwithexpandbutton':
                    return this._createStackedOfferPrefab(offerNode.top, null, true);
                case 'expandbutton':
                    return this._createMoreOffersPrefab();
            }
        });
    }

    private _populateFull(filterTags: string[]): Promise<Node>[] {
        const offerNodes = populateFull(filterTags, this._allItems);
        return offerNodes.map((offerNode) => {
            switch (offerNode.type) {
                case 'bundle':
                    return this._createBundleOfferPrefab(offerNode.item);
                case 'doublestacked':
                    return this._createStackedOfferPrefab(offerNode.top, offerNode.bottom, false);
                case 'singlestacked':
                    return this._createStackedOfferPrefab(offerNode.top, null, false);
            }
        });
    }

    private _populateOld(filterTags: string[]): Promise<Node>[] {
        let visibleItems = this._allItems
            .filter((item) => this._offerHasAllTags(item, filterTags) && (item.collapsedVisible || !this._collapsed))
            .sort((a, b) => b.priority - a.priority);

        let numCollapsedVisibleFullBundles = 0;
        let numCollapsedVisibleStackedBundles = 0;

        let offerNodes: Promise<Node>[] = [];
        for (let i = 0; i < visibleItems.length; ++i) {
            const item = visibleItems[i];
            if (!this._offerHasAllTags(item, filterTags)) {
                continue;
            }
            if (!item.collapsedVisible && this._collapsed) {
                continue;
            }

            // This is really sketchy. But.. our collapsed view supports 2 full bundles + 3 stacked bundles.
            // The thing is, some bundles are one time purchase. So show the ones that are flagged as collapsed
            // visible, but only if they fit. Then once the one time purchases are made, the other offers join the collapsed view.
            if (this._collapsed) {
                if (item.stack) {
                    numCollapsedVisibleStackedBundles++;
                    if (numCollapsedVisibleStackedBundles > 3) {
                        continue;
                    }
                } else {
                    numCollapsedVisibleFullBundles++;
                    if (numCollapsedVisibleFullBundles > 2) {
                        continue;
                    }
                }
            }

            if (!item.stack) {
                offerNodes.push(this._createBundleOfferPrefab(item));
            } else {
                let bottomItem = null;
                if (i < visibleItems.length - 1 && visibleItems[i + 1].stack) {
                    bottomItem = visibleItems[i + 1];
                    ++i;
                }
                offerNodes.push(this._createStackedOfferPrefab(item, bottomItem, this._collapsed));
            }
        }
        return offerNodes;
    }

    private async _refreshOffers() {
        this._contentRoot.destroyAllChildren();

        // Kill scrolling while we repopulate offers to avoid messing with the layout resizing
        const brake = this._scrollView.brake;
        const bounceDuration = this._scrollView.bounceDuration;
        this._scrollView.inertia = false;
        this._scrollView.elastic = false;
        this._scrollView.stopAutoScroll();

        if (this._tags.length > 0) {
            this._collapsed = false;
        }

        // Filter offers: always filter 'store' + any other tags requested when we show the screen (i.e. only coins, only energy, etc.)
        const filterTags: string[] = ['store', ...this._tags];

        const offerNodes: Promise<Node>[] = this._collapsed ? this._populateCollapsed(filterTags) : this._populateFull(filterTags);

        // Wait for all offers to load then parent them under the scroll view and fade them in sequentially
        const nodes = await Promise.all(offerNodes);
        let fadeInDelay = 0;
        nodes.forEach((node) => {
            node.parent = this._contentRoot;
            const stackedOffer = node.getComponent(StoreStackedOffer);
            if (stackedOffer) {
                stackedOffer.fadeIn(fadeInDelay, fadeInDelay + this._fadeDelayIncrement, this._fadeDuration);
                fadeInDelay += 2 * this._fadeDelayIncrement;
            }
            const bundleOffer = node.getComponent(StoreOfferBundle);
            if (bundleOffer) {
                bundleOffer.fadeIn(fadeInDelay, this._fadeDuration);
                fadeInDelay += this._fadeDelayIncrement;
            }
        });

        // Re-enable scrolling inertia after layout resolves
        this._scrollView.scheduleOnce(() => {
            this._scrollView.scrollToPercentHorizontal(0, 0, false);
            this._scrollView.brake = brake;
            this._scrollView.bounceDuration = bounceDuration;
            this._scrollView.inertia = true;
            this._scrollView.elastic = true;
        }, 0.1);
    }

    private async _createMoreOffersPrefab(): Promise<Node> {
        const listing = instantiate(this._stackedListingPrefab);

        const offerComponent = listing.getComponent(StoreStackedOffer);
        await offerComponent.init(
            this._config,
            null,
            null,
            this._fpoSprite,
            true,
            false,
            this._expandStore.bind(this),
            this._onPurchaseOffer.bind(this)
        );

        return listing;
    }

    private async _createStackedOfferPrefab(item1: CatalogItem, item2: CatalogItem, showExpand: boolean): Promise<Node> {
        const listing = instantiate(this._stackedListingPrefab);

        const offerComponent = listing.getComponent(StoreStackedOffer);
        await offerComponent.init(
            this._config,
            item1,
            item2,
            this._fpoSprite,
            false,
            item2 == null && showExpand,
            this._expandStore.bind(this),
            this._onPurchaseOffer.bind(this)
        );

        return listing;
    }

    private async _createBundleOfferPrefab(item: CatalogItem): Promise<Node> {
        const listing = instantiate(this._storeListingPrefab);

        const bundleComponent = listing.getComponent(StoreOfferBundle);
        await bundleComponent.init(this._config, item, this._fpoSprite, (purchasedItem) => {
            this._onPurchaseOffer(purchasedItem);
        });

        return listing;
    }

    private _expandStore() {
        this._collapsed = false;
        this._refreshOffers();
    }

    private _offerHasAllTags(item: CatalogItem, tags: string[]): boolean {
        if (!item || !item.tags || !Array.isArray(item.tags)) {
            return false;
        }

        return tags.every((tag) => item.tags.includes(tag));
    }

    private async _onCloseButtonPressedCallback() {
        await this.hide();
        this._onCloseCallback?.call(this);
    }

    private _onPurchaseOffer(item: CatalogItem) {
        this._purchasingScrim.active = true;
        this._store.purchase(item, 'store').then((result) => {
            this._purchasingScrim.active = false;

            // Refresh offers on purchase in case any offers are one time purchase
            if (result) {
                this._contentRoot.destroyAllChildren();
                this._store.getCatalog().then((catalog) => {
                    this._allItems = catalog;
                    this._refreshOffers();
                });
            }
        });
    }
}
