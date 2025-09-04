import { AppConfig } from '../config/AppConfig';
import { StoreConfig } from '../config/StoreConfig';
import { Currency } from '../core/enums/Currency';
import { EntitlementType } from '../core/enums/EntitlementType';
import { PurchaseResult, PurchaseStatus } from '../core/enums/PurchaseResult';
import { UpsellOrigin } from '../core/enums/UpsellOrigin';
import { CatalogItem } from '../core/model/CatalogItem';
import { CurrencyAndAmount } from '../core/model/CurrencyAndAmount';
import { UpsellItemConfig } from '../core/model/UpsellItemConfig';
import { PopupLayout, PopupResult, PopupType } from '../game/ui/GeneralPopup';
import { logger } from '../logging';
import { IBackend } from './IBackend';
import { IStore, StoreType, UpsellOffer } from './IStore';
import { UIOverlayService } from './UIOverlayService';

export class Store implements IStore {
    private _backend: IBackend;
    private _overlayService: UIOverlayService;
    private _storeConfig: StoreConfig;
    private _log = logger.child('Store');

    async initialize(config: AppConfig, overlayService: UIOverlayService, backend: IBackend): Promise<void> {
        this._backend = backend;
        this._overlayService = overlayService;
        this._storeConfig = config.storeConfig;
    }

    public showPlatformStore() {
        this._backend.openStore();
    }

    public async getCurrencyBalances(): Promise<CurrencyAndAmount[]> {
        const balances = await this._backend.getCurrencyBalances();
        return balances;
    }

    public async getCatalog(): Promise<CatalogItem[]> {
        const catalog = await this._backend.getCatalog();
        return catalog;
    }

    public async getCatalogItem(id: string): Promise<CatalogItem> {
        const catalog = await this._backend.getCatalog();
        const item = catalog.find((ci) => ci.id === id);
        return item ?? null;
    }

    public getUpsellConfig(itemId: string): UpsellItemConfig {
        const upsellConfig = this._storeConfig.upsells.find((gmi) => gmi.itemId === itemId);
        return upsellConfig ?? null;
    }

    public async getNextUpsell(itemId: string, numInRoundPurchases): Promise<UpsellOffer | null> {
        const upsellConfig = this._storeConfig.upsells.find((gmi) => gmi.itemId === itemId) ?? null;
        if (!upsellConfig) {
            this._log.warn(`No upsell found for itemId`, { itemId });
            return null;
        }

        const catalog = await this._backend.getCatalog();

        let coinsBalance = 0;
        let gemsBalance = 0;
        const currencyBalances = await this._backend.getCurrencyBalances();
        currencyBalances.forEach((balance) => {
            if (balance.currency === Currency.Gems) {
                gemsBalance = balance.amount;
            } else if (balance.currency === Currency.Coins) {
                coinsBalance = balance.amount;
            }
        });

        const numCatalogIds = upsellConfig.catalogItemIds.length;
        const catalogItemIndex = Math.min(numInRoundPurchases, numCatalogIds - 1);
        for (let i = catalogItemIndex; i < numCatalogIds; i++) {
            const catalogItemId = upsellConfig.catalogItemIds[i];
            const catalogItem = catalog.find((item) => item.id === catalogItemId);
            if (!catalogItem) continue;

            const currency = catalogItem.cost.currency;
            const cost = catalogItem.cost.amount;

            if (currency === Currency.Coins && coinsBalance >= cost) {
                return new UpsellOffer(itemId, upsellConfig, catalogItem);
            }
            if (currency === Currency.Gems) {
                return new UpsellOffer(itemId, upsellConfig, catalogItem);
            }
        }

        return null;
    }

    public async purchase(catalogItem: CatalogItem, storeType: StoreType): Promise<boolean> {
        const suppressConfirmationMessage = false;
        if (catalogItem.isUpsell && this._backend.getUserEntitlement() !== EntitlementType.Premium) {
            this._showUpsellConfirmation();
            return false;
        }

        if (catalogItem.cost.currency === Currency.Gems) {
            const enoughGems = catalogItem.cost.amount <= (await this._backend.getCurrencyBalance(Currency.Gems));

            if (!enoughGems) {
                const confirmationResult = await this._showStoreRedirectConfirmation();

                if (confirmationResult) {
                    this._backend.redirectToPremiumCurrencyStore();
                    return false;
                } else {
                    return false;
                }
            }

            if (!suppressConfirmationMessage) {
                const confirmationResult = await this._showGemPurchaseConfirmation(catalogItem);

                if (!confirmationResult) {
                    return false;
                }
            }
        }

        const result = await this._backend.purchase(catalogItem, storeType);
        switch (result.Status) {
            case PurchaseStatus.InsufficientCurrency:
            case PurchaseStatus.Error:
                await this._showStoreError(catalogItem, result);
                break;
            case PurchaseStatus.Success:
                if (this._backend.showPurchaseSuccessPopup()) {
                    this._showStoreSuccess();
                }
                break;
            case PurchaseStatus.Cancelled:
                break;
        }

        return result.Status === PurchaseStatus.Success;
    }

    public _showUpsellConfirmation(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this._overlayService.showGeneralPopup(
                PopupType.OK_Other,
                'Club Exclusive!',
                'This item is only available to Club members. Upgrade to Club to unlock this item and many more exclusive features!',
                'dialogueSprites/Viola-Happy/spriteFrame',
                (result) => {
                    if (result === PopupResult.Other) {
                        this._backend.openPlatformPremiumRegistration(UpsellOrigin.Cosmetics);
                    }
                },
                PopupLayout.Horizontal,
                'Okay',
                null,
                'Upgrade Now!'
            );
        });
    }

    public async _showGemPurchaseConfirmation(catalogItem: CatalogItem): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this._overlayService.showGeneralPopup(
                PopupType.OK_Cancel,
                'Spending Gems',
                `Are you sure you want to spend ${catalogItem.cost.amount} gems?`,
                null,
                async (result: PopupResult) => {
                    switch (result) {
                        case PopupResult.OK: {
                            resolve(true);
                            break;
                        }
                        default: {
                            resolve(false);
                            break;
                        }
                    }
                },
                PopupLayout.Vertical
            );
        });
    }

    public async _showStoreRedirectConfirmation(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this._overlayService.showGeneralPopup(
                PopupType.OK_Other,
                'Not Enough Gems',
                `You don't have enough Gems. Would you like to get more?`,
                null,
                async (result: PopupResult) => {
                    switch (result) {
                        case PopupResult.Other: {
                            resolve(true);
                            break;
                        }
                        default: {
                            resolve(false);
                            break;
                        }
                    }
                },
                PopupLayout.Vertical,
                'No Thanks',
                '',
                'Get Gems'
            );
        });
    }

    private async _showStoreError(catalogItem: CatalogItem, purchaseResult: PurchaseResult) {
        return new Promise<void>((resolve) => {
            const message = purchaseResult.Message !== '' ? purchaseResult.Message : `Failed to purchase ${catalogItem.name}`;
            this._overlayService.showGeneralPopup(
                PopupType.OK,
                'Error',
                message,
                null,
                () => {
                    resolve();
                },
                PopupLayout.Vertical
            );
        });
    }

    private _showStoreSuccess() {
        this._overlayService.showGeneralPopup(PopupType.OK, 'Success', 'Purchase Successful!', null, () => {}, PopupLayout.Vertical);
    }
}
