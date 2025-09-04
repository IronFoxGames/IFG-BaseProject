import { readFileSync, readJson } from 'fs-extra';
import { join, basename, dirname } from 'path';
import { AssetInfo } from '../../../@types/packages/asset-db/@types/public';
import { Vec3 } from '../../../@types/packages/scene/@types/public';
import { Currency } from '../../enums/Currency';
import { CatalogItem } from '../../models/CatalogItem';
import { read } from 'fs';
import { CurrencyAndAmount } from '../../models/CurrencyAndAmount';

const DINER_STORE_CATALOG = 'db://assets/resources/config/store/diner.json';
const PROP_SPRITE_ROOT_PATH = 'db://assets/art/sprites/props/**/*';
const PROP_JSON_ROOT_PATH = 'db://assets/resources/diner/props/**/*';

enum DataViewTab {
    JSONData,
    SpriteList
}

class JsonAssetDetails {
    json: any;
    asset: AssetInfo | null = null;
    spriteUUIDs: string[] = [];
    thumbnailAsset: AssetInfo | null = null;
    prefabAsset: AssetInfo | null = null;
}

class SpriteAssetDetails {
    assetInfo: AssetInfo | null = null;
    width: number = 0;
    height: number = 0;
}

let currentView = DataViewTab.JSONData;

// Asset data maps
let propSpriteMap: Map<string, SpriteAssetDetails> | null = null;
let propJsonMap: Map<string, JsonAssetDetails> | null = null;
let assetIDFilter: string | null = null;
let assetTagFilter: string | null = null;
let missingCatalogFilter: boolean = false;
let missingNamesFilter: boolean | null = null;
let missingDescriptionsFilter: boolean | null = null;
let storeCatalog: CatalogItem[] = [];

module.exports = Editor.Panel.define({
    listeners: {
        show() {},
        hide() {}
    },
    template: readFileSync(join(__dirname, '../../../static/template/assets-panel/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/assets-panel/index.css'), 'utf-8'),
    $: {
        titleName: '#titleName',
        assetTab: '#assetTab',
        assetIDFilter: '#assetIDFilter',
        assetTagFilter: '#assetTagFilter',
        missingCatalogEntriesFilter: '#missingCatalogEntries',
        missingNamesFilter: '#missingNames',
        missingDescriptionsFilter: '#missingDescriptions',
        refreshAssetsButton: '#refreshAssetsButton',
        assetTable: '#assetTable',
        assetList: '#assetList',
        propSpriteTable: '#propSpriteTable',
        propSpriteList: '#propSpriteList'
    },
    methods: {
        updateName(name: string) {
            this.$.titleName!.innerHTML = name;
        },
        async _refreshAssets() {
            propSpriteMap = await this._collectPropSpriteData();
            propJsonMap = await this._collectPropJsonData();
        },
        async _renderAssetList(view: DataViewTab) {
            this.$.propSpriteList!.innerHTML = '';
            this.$.assetList!.innerHTML = '';
            try {
                storeCatalog = await this._loadStoreCatalog();

                if (propSpriteMap == null) {
                    propSpriteMap = await this._collectPropSpriteData();
                }
                if (propJsonMap == null) {
                    propJsonMap = await this._collectPropJsonData();
                }

                switch (view) {
                    case DataViewTab.JSONData:
                        this.$.assetTable!.style.display = '';
                        this.$.propSpriteTable!.style.display = 'none';
                        this._renderPropJson(propJsonMap);
                        break;
                    case DataViewTab.SpriteList:
                        this.$.assetTable!.style.display = 'none';
                        this.$.propSpriteTable!.style.display = '';
                        this._renderPropSprite(propSpriteMap);
                        break;
                }
            } catch (error) {
                console.error('Error querying assets in directory:', error);
            }
        },
        async _loadStoreCatalog(): Promise<CatalogItem[]> {
            const asset = await Editor.Message.request('asset-db', 'query-asset-info', DINER_STORE_CATALOG);
            if (!asset) {
                console.error(`Failed to load diner.json`);
                return [];
            }

            let dinerCatalogData = readFileSync(asset.file, 'utf-8');
            if (!dinerCatalogData) {
                console.error(`Failed to read ${asset.file}`);
                return [];
            }

            let dinerCatalogJson = JSON.parse(dinerCatalogData);
            if (!dinerCatalogJson || !dinerCatalogJson.items || !Array.isArray(dinerCatalogJson.items)) {
                console.error(`Failed to parse ${asset.file}`);
                return [];
            }

            return dinerCatalogJson.items.map((item: any) => CatalogItem.fromObject(item));
        },
        async _saveStoreCatalog(): Promise<void> {
            storeCatalog.sort((a, b) => a.id.localeCompare(b.id));
            const catalog = { items: storeCatalog };
            await Editor.Message.request('asset-db', 'save-asset', DINER_STORE_CATALOG, JSON.stringify(catalog, null, 4));
            console.log(`Saved store catalog`);
        },
        _getStoreCatalogItem(propData: JsonAssetDetails): CatalogItem | null {
            const name = propData?.asset?.name;
            if (!name) {
                return null;
            }

            const itemId = basename(name, '.json');
            const item = storeCatalog.find((item) => item.id === itemId);
            if (!item) {
                return null;
            }

            return item;
        },
        async _collectPropSpriteData(): Promise<Map<string, { assetInfo: AssetInfo; width: number; height: number }>> {
            const assets = await Editor.Message.request('asset-db', 'query-assets', {
                pattern: PROP_SPRITE_ROOT_PATH,
                ccType: 'cc.SpriteFrame'
            });

            const propSpriteMap: Map<string, { assetInfo: AssetInfo; width: number; height: number }> = new Map();
            await Promise.all(
                assets.map(async (asset) => {
                    const meta = await Editor.Message.request('asset-db', 'query-asset-info', asset.uuid);
                    if (meta?.library?.['.json']) {
                        const jsonPath = meta.library['.json']; // Get the actual file path

                        try {
                            const jsonData = await readJson(jsonPath);
                            const width = jsonData?.content?.originalSize?.width || -1;
                            const height = jsonData?.content?.originalSize?.height || -1;
                            propSpriteMap.set(asset.uuid, { assetInfo: asset, width: width, height: height });
                        } catch (error) {
                            console.error(`Error reading ${jsonPath}:`, error);
                        }
                    }
                })
            );
            return propSpriteMap;
        },
        _thumbnailPathToAssetPath(path: string): string {
            // Turn 'diner/thumbnails/fpo-soda-machine-lvl2-thumbnail/spriteFrame'
            // into 'db://assets/resources/diner/thumbnails/fpo-soda-machine-lvl2-thumbnail.png'
            const basePath = dirname(path);
            const fileName = basename(basePath) + '.png';
            return `db://assets/resources/${join(dirname(basePath), fileName)}`;
        },
        _assetPathToResourceRelativePath(path: string): string {
            // Turn 'db://assets/resources/diner/prefabs/fpo-service-bar-lvl2-thumbnail'
            // into 'diner/thumbnails/fpo-service-bar-lvl2-thumbnail'
            return path.replace(/^db:\/\/assets\/resources\//, '');
        },
        async _collectPropJsonData(): Promise<Map<string, JsonAssetDetails>> {
            const assets = await Editor.Message.request('asset-db', 'query-assets', {
                pattern: PROP_JSON_ROOT_PATH,
                ccType: 'cc.JsonAsset'
            });

            const map: Map<string, JsonAssetDetails> = new Map();
            await Promise.all(
                assets.map(async (asset) => {
                    const jsonData = await readJson(asset.file);
                    const prefabPath = `db://assets/resources/${jsonData.assetFilePath}.prefab`;
                    const prefabAssetInfo = await Editor.Message.request('asset-db', 'query-asset-info', prefabPath);
                    const thumbnailPath = this._thumbnailPathToAssetPath(jsonData.thumbnailFilePath);
                    const thumbnailAssetInfo = await Editor.Message.request('asset-db', 'query-asset-info', thumbnailPath);

                    const jsonAssetDetails = new JsonAssetDetails();
                    jsonAssetDetails.json = jsonData;
                    jsonAssetDetails.asset = asset;
                    jsonAssetDetails.thumbnailAsset = thumbnailAssetInfo;
                    jsonAssetDetails.prefabAsset = prefabAssetInfo;

                    if (prefabAssetInfo?.library?.['.json']) {
                        const jsonPath = prefabAssetInfo.library['.json'];
                        try {
                            const prefabJson = await readJson(jsonPath);
                            const spriteFrameUUIDs = this._extractSpriteFrames(prefabJson);
                            jsonAssetDetails.spriteUUIDs = spriteFrameUUIDs;
                        } catch (error) {
                            console.error(`Error reading prefab JSON: ${error}`);
                        }
                    } else {
                        console.warn(`No prefab JSON found for path: ${prefabPath}`);
                    }

                    map.set(asset.uuid, jsonAssetDetails);
                })
            );
            return map;
        },
        _renderPropSprite(data: Map<string, SpriteAssetDetails>) {
            Array.from(data.entries())
                .sort(([, a], [, b]) => b.width * b.height - a.width * a.height) // Sort by size
                .forEach(([key, value]) => {
                    const div = this._createPropSpriteDataRow(value);
                    if (div) {
                        this.$.propSpriteList!.append(div!);
                    }
                });
        },
        _createPropSpriteDataRow(propData: SpriteAssetDetails): Element | null {
            if (propData == null || propData.assetInfo == null) {
                return null;
            }

            const propSpriteComponent = this._loadHTMLTemplate(`../../../static/template/components/prop-sprite-data.html`);
            if (!propSpriteComponent) {
                throw new Error('Could not find prop-sprite-data.html');
            }

            const setField = (selector: string, value: string) => {
                const field = propSpriteComponent.querySelector(selector);
                if (field) field.innerHTML = value;
            };

            // Set static fields
            setField('#prop-sprite-name', propData.assetInfo.displayName ?? '~missing~');
            setField('#prop-width', propData.width.toString() ?? '');
            setField('#prop-height', propData.height.toString() ?? '');
            const image = propSpriteComponent.querySelector<HTMLDivElement>('#prop-image') as any;
            if (image && propData?.assetInfo) {
                image.setAttribute('value', propData?.assetInfo.uuid);
            }

            return propSpriteComponent;
        },
        _renderPropJson(data: Map<string, JsonAssetDetails>) {
            Array.from(data.entries())
                .filter(([_, value]) => !assetIDFilter || assetIDFilter == '' || value.json.id.includes(assetIDFilter)) // Filter by ID
                .filter(([_, value]) => !assetTagFilter || assetTagFilter == '' || value.json.tags.includes(assetTagFilter)) // Filter by tag
                .filter(([_, value]) => !missingCatalogFilter || !this._getStoreCatalogItem(value)) // Filter missing catalog
                .filter(([_, value]) => !missingNamesFilter || this._getStoreCatalogItem(value)?.name === '') // Filter missing names
                .filter(([_, value]) => !missingDescriptionsFilter || this._getStoreCatalogItem(value)?.description === '') // Filter missing descriptions
                .sort(([, a], [, b]) => a.json.id.localeCompare(b.json.id)) // Sort by id
                .forEach(([key, value]) => {
                    const div = this._createPropDataRow(value, async (propAsset: JsonAssetDetails, field: string, value: any) => {
                        if (!propAsset || !propAsset.asset) {
                            return;
                        }

                        propAsset.json[field] = value;
                        await Editor.Message.request('asset-db', 'save-asset', propAsset.asset.url, JSON.stringify(propAsset.json, null, 4));
                        console.log(`Saved[${propAsset?.asset?.name}] ${field}=${value}`);
                    });
                    if (div) {
                        this.$.assetList!.append(div!);
                    }
                });
        },
        _createPropDataRow(
            propData: JsonAssetDetails,
            onUpdate: (propAsset: JsonAssetDetails, field: string, value: any) => void
        ): Element | null {
            if (propData == null || propData.json == null) {
                return null;
            }

            const propJsonComponent = this._loadHTMLTemplate(`../../../static/template/components/prop-data.html`);
            if (!propJsonComponent) {
                throw new Error('Could not find prop-data.html');
            }

            const setField = (selector: string, value: string) => {
                const field = propJsonComponent.querySelector(selector);
                if (field) field.innerHTML = value;
            };

            // Set static fields
            setField('#prop-id', propData?.json?.id ?? '~missing~');
            setField('#prop-requirements', propData?.json?.requirements?.toString() ?? '');
            setField('#prop-assetFilePath', propData?.json?.assetFilePath ?? '');

            const thumbnailImage = propJsonComponent.querySelector<HTMLDivElement>('#prop-thumbnail') as any;
            const thumbnail = propJsonComponent.querySelector<HTMLDivElement>('#prop-thumbnailFilePath') as any;
            if (thumbnail && thumbnailImage) {
                if (propData?.thumbnailAsset) {
                    thumbnail.setAttribute('value', propData?.thumbnailAsset.uuid);
                    thumbnailImage.setAttribute('value', propData?.thumbnailAsset.url);
                }

                thumbnail.addEventListener('change', async () => {
                    const info = await Editor.Message.request('asset-db', 'query-asset-info', thumbnail.value);
                    if (info && info.path != null) {
                        thumbnailImage.setAttribute('value', info.url);
                        onUpdate(propData, 'thumbnailFilePath', `${this._assetPathToResourceRelativePath(info.path)}/spriteFrame`);
                    }
                });
            }

            const prefabAsset = propJsonComponent.querySelector<HTMLDivElement>('#prop-assetFilePath') as any;
            if (prefabAsset) {
                if (propData?.prefabAsset) {
                    prefabAsset.setAttribute('value', propData?.prefabAsset.uuid);
                }

                prefabAsset.addEventListener('change', async () => {
                    const info = await Editor.Message.request('asset-db', 'query-asset-info', prefabAsset.value);
                    if (info && info.path != null) {
                        onUpdate(propData, 'assetFilePath', this._assetPathToResourceRelativePath(info.path));
                    }
                });
            }

            // Handle tags input
            const tagsInput = propJsonComponent.querySelector<HTMLInputElement>('#prop-tags');
            if (tagsInput) {
                tagsInput.value = propData?.json?.tags?.join(', ') ?? '';
                tagsInput.addEventListener('input', () => {
                    const tags = tagsInput.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter((tag) => /^[a-zA-Z0-9_-]+$/.test(tag));
                    onUpdate(propData, 'tags', tags);
                });
            }

            // Some prop fields are stored in the store catalog as opposed to asset JSONs
            const detailsCell = propJsonComponent.querySelector<HTMLInputElement>('#prop-details-cell');
            const createCatalog = propJsonComponent.querySelector<HTMLInputElement>('#prop-create-catalog-cell');

            const catalogItem = this._getStoreCatalogItem(propData);
            if (catalogItem) {
                createCatalog!.style.display = 'none';

                // Name
                const propName = propJsonComponent.querySelector<HTMLInputElement>('#prop-name');
                if (propName) {
                    propName.value = catalogItem.name;
                    propName.addEventListener('input', async () => {
                        catalogItem.name = propName.value;
                        await this._saveStoreCatalog();
                    });
                }

                // Description
                const propDescription = propJsonComponent.querySelector<HTMLInputElement>('#prop-description');
                if (propDescription) {
                    propDescription.value = catalogItem.description;
                    propDescription.addEventListener('input', async () => {
                        catalogItem.description = propDescription.value;
                        await this._saveStoreCatalog();
                    });
                }

                // Populate currency dropdown
                const currencySelect = propJsonComponent.querySelector<HTMLSelectElement>('#prop-currency');
                if (currencySelect) {
                    Object.values(Currency).forEach((currency) => {
                        const option = document.createElement('option');
                        option.value = currency;
                        option.textContent = currency.charAt(0).toUpperCase() + currency.slice(1);
                        currencySelect.appendChild(option);
                    });

                    currencySelect.value = catalogItem.cost.currency;
                    currencySelect.addEventListener('change', async () => {
                        const selectedCurrency = currencySelect.value as Currency;
                        catalogItem.cost = new CurrencyAndAmount(selectedCurrency, catalogItem.cost.amount);
                        await this._saveStoreCatalog();
                    });
                }
                // Handle cost input
                const costInput = propJsonComponent.querySelector<HTMLInputElement>('#prop-cost');
                if (costInput) {
                    costInput.value = `${catalogItem.cost.amount}`;
                    costInput.addEventListener('input', async () => {
                        const cost = parseFloat(costInput.value);
                        if (!isNaN(cost) && cost >= 0) {
                            catalogItem.cost = new CurrencyAndAmount(catalogItem.cost.currency, cost);
                            await this._saveStoreCatalog();
                        }
                    });
                }
            } else {
                // Hide details and cost and show a button to create the catalog item
                detailsCell!.style.display = 'none';
                createCatalog!.style.display = '';

                const createCatalogButton = propJsonComponent.querySelector<HTMLInputElement>('#prop-create-catalog-button');
                if (createCatalogButton) {
                    createCatalogButton.addEventListener('click', async (event) => {
                        const name = propData?.asset?.name;
                        const thumbnailPath = propData?.thumbnailAsset?.uuid;
                        if (name && thumbnailPath) {
                            const info = await Editor.Message.request('asset-db', 'query-asset-info', thumbnailPath);
                            if (info && info.path != null) {
                                const itemId = basename(name, '.json');
                                const spritePath = `${this._assetPathToResourceRelativePath(info.path)}/spriteFrame`;
                                const item = CatalogItem.fromAsset(
                                    itemId,
                                    propData?.json?.id,
                                    '',
                                    new CurrencyAndAmount(Currency.Coins, 100),
                                    spritePath,
                                    ['diner']
                                );
                                storeCatalog.push(item);
                                await this._saveStoreCatalog();
                                this._renderAssetList(currentView);
                            }
                        }
                    });
                }
            }

            return propJsonComponent;
        },
        _extractSpriteFrames(prefabJson: any): string[] {
            const spriteFrameUUIDs: string[] = [];
            for (const obj of prefabJson) {
                if (obj.__type__ === 'cc.SpriteRenderer' && obj._spriteFrame) {
                    const spriteFrameUUID = obj._spriteFrame.__uuid__;
                    if (spriteFrameUUID) {
                        spriteFrameUUIDs.push(spriteFrameUUID);
                    }
                }
            }
            return spriteFrameUUIDs;
        },
        _loadHTMLTemplate(path: string): Element | null {
            const templateContent = readFileSync(join(__dirname, path), 'utf-8');
            if (!templateContent) {
                console.error('Failed to load template: ', path);
                return null;
            }

            const template = document.createElement('template');
            template.innerHTML = templateContent.trim();
            return template.content.firstElementChild;
        }
    },
    async ready() {
        await this._refreshAssets();
        this._renderAssetList(currentView);

        this.$.assetIDFilter!.addEventListener('input', (event) => {
            assetIDFilter = (event.target as HTMLInputElement)!.value;
            this._renderAssetList(currentView);
        });

        this.$.assetTagFilter!.addEventListener('input', (event) => {
            assetTagFilter = (event.target as HTMLInputElement)!.value;
            this._renderAssetList(currentView);
        });
        this.$.missingCatalogEntriesFilter!.addEventListener('change', (event) => {
            missingCatalogFilter = (event.target as HTMLInputElement).checked;
            this._renderAssetList(currentView);
        });
        this.$.missingNamesFilter!.addEventListener('change', (event) => {
            missingNamesFilter = (event.target as HTMLInputElement).checked;
            this._renderAssetList(currentView);
        });
        this.$.missingDescriptionsFilter!.addEventListener('change', (event) => {
            missingDescriptionsFilter = (event.target as HTMLInputElement).checked;
            this._renderAssetList(currentView);
        });

        this.$.assetTab!.addEventListener('confirm', (event) => {
            const value = (event.target as HTMLInputElement)!.value;
            const tab = Number(value) in DataViewTab ? (Number(value) as DataViewTab) : undefined;
            if (tab != null) {
                currentView = tab;
                this._renderAssetList(currentView);
            }
        });
        this.$.refreshAssetsButton!.addEventListener('confirm', async (event) => {
            await this._refreshAssets();
            this._renderAssetList(currentView);
        });
    },
    beforeClose() {},
    close() {}
});
