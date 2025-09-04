"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const Currency_1 = require("../../enums/Currency");
const CatalogItem_1 = require("../../models/CatalogItem");
const CurrencyAndAmount_1 = require("../../models/CurrencyAndAmount");
const DINER_STORE_CATALOG = 'db://assets/resources/config/store/diner.json';
const PROP_SPRITE_ROOT_PATH = 'db://assets/art/sprites/props/**/*';
const PROP_JSON_ROOT_PATH = 'db://assets/resources/diner/props/**/*';
var DataViewTab;
(function (DataViewTab) {
    DataViewTab[DataViewTab["JSONData"] = 0] = "JSONData";
    DataViewTab[DataViewTab["SpriteList"] = 1] = "SpriteList";
})(DataViewTab || (DataViewTab = {}));
class JsonAssetDetails {
    constructor() {
        this.asset = null;
        this.spriteUUIDs = [];
        this.thumbnailAsset = null;
        this.prefabAsset = null;
    }
}
class SpriteAssetDetails {
    constructor() {
        this.assetInfo = null;
        this.width = 0;
        this.height = 0;
    }
}
let currentView = DataViewTab.JSONData;
// Asset data maps
let propSpriteMap = null;
let propJsonMap = null;
let assetIDFilter = null;
let assetTagFilter = null;
let missingCatalogFilter = false;
let missingNamesFilter = null;
let missingDescriptionsFilter = null;
let storeCatalog = [];
module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { }
    },
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/assets-panel/index.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/assets-panel/index.css'), 'utf-8'),
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
        updateName(name) {
            this.$.titleName.innerHTML = name;
        },
        async _refreshAssets() {
            propSpriteMap = await this._collectPropSpriteData();
            propJsonMap = await this._collectPropJsonData();
        },
        async _renderAssetList(view) {
            this.$.propSpriteList.innerHTML = '';
            this.$.assetList.innerHTML = '';
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
                        this.$.assetTable.style.display = '';
                        this.$.propSpriteTable.style.display = 'none';
                        this._renderPropJson(propJsonMap);
                        break;
                    case DataViewTab.SpriteList:
                        this.$.assetTable.style.display = 'none';
                        this.$.propSpriteTable.style.display = '';
                        this._renderPropSprite(propSpriteMap);
                        break;
                }
            }
            catch (error) {
                console.error('Error querying assets in directory:', error);
            }
        },
        async _loadStoreCatalog() {
            const asset = await Editor.Message.request('asset-db', 'query-asset-info', DINER_STORE_CATALOG);
            if (!asset) {
                console.error(`Failed to load diner.json`);
                return [];
            }
            let dinerCatalogData = (0, fs_extra_1.readFileSync)(asset.file, 'utf-8');
            if (!dinerCatalogData) {
                console.error(`Failed to read ${asset.file}`);
                return [];
            }
            let dinerCatalogJson = JSON.parse(dinerCatalogData);
            if (!dinerCatalogJson || !dinerCatalogJson.items || !Array.isArray(dinerCatalogJson.items)) {
                console.error(`Failed to parse ${asset.file}`);
                return [];
            }
            return dinerCatalogJson.items.map((item) => CatalogItem_1.CatalogItem.fromObject(item));
        },
        async _saveStoreCatalog() {
            storeCatalog.sort((a, b) => a.id.localeCompare(b.id));
            const catalog = { items: storeCatalog };
            await Editor.Message.request('asset-db', 'save-asset', DINER_STORE_CATALOG, JSON.stringify(catalog, null, 4));
            console.log(`Saved store catalog`);
        },
        _getStoreCatalogItem(propData) {
            var _a;
            const name = (_a = propData === null || propData === void 0 ? void 0 : propData.asset) === null || _a === void 0 ? void 0 : _a.name;
            if (!name) {
                return null;
            }
            const itemId = (0, path_1.basename)(name, '.json');
            const item = storeCatalog.find((item) => item.id === itemId);
            if (!item) {
                return null;
            }
            return item;
        },
        async _collectPropSpriteData() {
            const assets = await Editor.Message.request('asset-db', 'query-assets', {
                pattern: PROP_SPRITE_ROOT_PATH,
                ccType: 'cc.SpriteFrame'
            });
            const propSpriteMap = new Map();
            await Promise.all(assets.map(async (asset) => {
                var _a, _b, _c, _d, _e;
                const meta = await Editor.Message.request('asset-db', 'query-asset-info', asset.uuid);
                if ((_a = meta === null || meta === void 0 ? void 0 : meta.library) === null || _a === void 0 ? void 0 : _a['.json']) {
                    const jsonPath = meta.library['.json']; // Get the actual file path
                    try {
                        const jsonData = await (0, fs_extra_1.readJson)(jsonPath);
                        const width = ((_c = (_b = jsonData === null || jsonData === void 0 ? void 0 : jsonData.content) === null || _b === void 0 ? void 0 : _b.originalSize) === null || _c === void 0 ? void 0 : _c.width) || -1;
                        const height = ((_e = (_d = jsonData === null || jsonData === void 0 ? void 0 : jsonData.content) === null || _d === void 0 ? void 0 : _d.originalSize) === null || _e === void 0 ? void 0 : _e.height) || -1;
                        propSpriteMap.set(asset.uuid, { assetInfo: asset, width: width, height: height });
                    }
                    catch (error) {
                        console.error(`Error reading ${jsonPath}:`, error);
                    }
                }
            }));
            return propSpriteMap;
        },
        _thumbnailPathToAssetPath(path) {
            // Turn 'diner/thumbnails/fpo-soda-machine-lvl2-thumbnail/spriteFrame'
            // into 'db://assets/resources/diner/thumbnails/fpo-soda-machine-lvl2-thumbnail.png'
            const basePath = (0, path_1.dirname)(path);
            const fileName = (0, path_1.basename)(basePath) + '.png';
            return `db://assets/resources/${(0, path_1.join)((0, path_1.dirname)(basePath), fileName)}`;
        },
        _assetPathToResourceRelativePath(path) {
            // Turn 'db://assets/resources/diner/prefabs/fpo-service-bar-lvl2-thumbnail'
            // into 'diner/thumbnails/fpo-service-bar-lvl2-thumbnail'
            return path.replace(/^db:\/\/assets\/resources\//, '');
        },
        async _collectPropJsonData() {
            const assets = await Editor.Message.request('asset-db', 'query-assets', {
                pattern: PROP_JSON_ROOT_PATH,
                ccType: 'cc.JsonAsset'
            });
            const map = new Map();
            await Promise.all(assets.map(async (asset) => {
                var _a;
                const jsonData = await (0, fs_extra_1.readJson)(asset.file);
                const prefabPath = `db://assets/resources/${jsonData.assetFilePath}.prefab`;
                const prefabAssetInfo = await Editor.Message.request('asset-db', 'query-asset-info', prefabPath);
                const thumbnailPath = this._thumbnailPathToAssetPath(jsonData.thumbnailFilePath);
                const thumbnailAssetInfo = await Editor.Message.request('asset-db', 'query-asset-info', thumbnailPath);
                const jsonAssetDetails = new JsonAssetDetails();
                jsonAssetDetails.json = jsonData;
                jsonAssetDetails.asset = asset;
                jsonAssetDetails.thumbnailAsset = thumbnailAssetInfo;
                jsonAssetDetails.prefabAsset = prefabAssetInfo;
                if ((_a = prefabAssetInfo === null || prefabAssetInfo === void 0 ? void 0 : prefabAssetInfo.library) === null || _a === void 0 ? void 0 : _a['.json']) {
                    const jsonPath = prefabAssetInfo.library['.json'];
                    try {
                        const prefabJson = await (0, fs_extra_1.readJson)(jsonPath);
                        const spriteFrameUUIDs = this._extractSpriteFrames(prefabJson);
                        jsonAssetDetails.spriteUUIDs = spriteFrameUUIDs;
                    }
                    catch (error) {
                        console.error(`Error reading prefab JSON: ${error}`);
                    }
                }
                else {
                    console.warn(`No prefab JSON found for path: ${prefabPath}`);
                }
                map.set(asset.uuid, jsonAssetDetails);
            }));
            return map;
        },
        _renderPropSprite(data) {
            Array.from(data.entries())
                .sort(([, a], [, b]) => b.width * b.height - a.width * a.height) // Sort by size
                .forEach(([key, value]) => {
                const div = this._createPropSpriteDataRow(value);
                if (div) {
                    this.$.propSpriteList.append(div);
                }
            });
        },
        _createPropSpriteDataRow(propData) {
            var _a, _b, _c;
            if (propData == null || propData.assetInfo == null) {
                return null;
            }
            const propSpriteComponent = this._loadHTMLTemplate(`../../../static/template/components/prop-sprite-data.html`);
            if (!propSpriteComponent) {
                throw new Error('Could not find prop-sprite-data.html');
            }
            const setField = (selector, value) => {
                const field = propSpriteComponent.querySelector(selector);
                if (field)
                    field.innerHTML = value;
            };
            // Set static fields
            setField('#prop-sprite-name', (_a = propData.assetInfo.displayName) !== null && _a !== void 0 ? _a : '~missing~');
            setField('#prop-width', (_b = propData.width.toString()) !== null && _b !== void 0 ? _b : '');
            setField('#prop-height', (_c = propData.height.toString()) !== null && _c !== void 0 ? _c : '');
            const image = propSpriteComponent.querySelector('#prop-image');
            if (image && (propData === null || propData === void 0 ? void 0 : propData.assetInfo)) {
                image.setAttribute('value', propData === null || propData === void 0 ? void 0 : propData.assetInfo.uuid);
            }
            return propSpriteComponent;
        },
        _renderPropJson(data) {
            Array.from(data.entries())
                .filter(([_, value]) => !assetIDFilter || assetIDFilter == '' || value.json.id.includes(assetIDFilter)) // Filter by ID
                .filter(([_, value]) => !assetTagFilter || assetTagFilter == '' || value.json.tags.includes(assetTagFilter)) // Filter by tag
                .filter(([_, value]) => !missingCatalogFilter || !this._getStoreCatalogItem(value)) // Filter missing catalog
                .filter(([_, value]) => { var _a; return !missingNamesFilter || ((_a = this._getStoreCatalogItem(value)) === null || _a === void 0 ? void 0 : _a.name) === ''; }) // Filter missing names
                .filter(([_, value]) => { var _a; return !missingDescriptionsFilter || ((_a = this._getStoreCatalogItem(value)) === null || _a === void 0 ? void 0 : _a.description) === ''; }) // Filter missing descriptions
                .sort(([, a], [, b]) => a.json.id.localeCompare(b.json.id)) // Sort by id
                .forEach(([key, value]) => {
                const div = this._createPropDataRow(value, async (propAsset, field, value) => {
                    var _a;
                    if (!propAsset || !propAsset.asset) {
                        return;
                    }
                    propAsset.json[field] = value;
                    await Editor.Message.request('asset-db', 'save-asset', propAsset.asset.url, JSON.stringify(propAsset.json, null, 4));
                    console.log(`Saved[${(_a = propAsset === null || propAsset === void 0 ? void 0 : propAsset.asset) === null || _a === void 0 ? void 0 : _a.name}] ${field}=${value}`);
                });
                if (div) {
                    this.$.assetList.append(div);
                }
            });
        },
        _createPropDataRow(propData, onUpdate) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            if (propData == null || propData.json == null) {
                return null;
            }
            const propJsonComponent = this._loadHTMLTemplate(`../../../static/template/components/prop-data.html`);
            if (!propJsonComponent) {
                throw new Error('Could not find prop-data.html');
            }
            const setField = (selector, value) => {
                const field = propJsonComponent.querySelector(selector);
                if (field)
                    field.innerHTML = value;
            };
            // Set static fields
            setField('#prop-id', (_b = (_a = propData === null || propData === void 0 ? void 0 : propData.json) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : '~missing~');
            setField('#prop-requirements', (_e = (_d = (_c = propData === null || propData === void 0 ? void 0 : propData.json) === null || _c === void 0 ? void 0 : _c.requirements) === null || _d === void 0 ? void 0 : _d.toString()) !== null && _e !== void 0 ? _e : '');
            setField('#prop-assetFilePath', (_g = (_f = propData === null || propData === void 0 ? void 0 : propData.json) === null || _f === void 0 ? void 0 : _f.assetFilePath) !== null && _g !== void 0 ? _g : '');
            const thumbnailImage = propJsonComponent.querySelector('#prop-thumbnail');
            const thumbnail = propJsonComponent.querySelector('#prop-thumbnailFilePath');
            if (thumbnail && thumbnailImage) {
                if (propData === null || propData === void 0 ? void 0 : propData.thumbnailAsset) {
                    thumbnail.setAttribute('value', propData === null || propData === void 0 ? void 0 : propData.thumbnailAsset.uuid);
                    thumbnailImage.setAttribute('value', propData === null || propData === void 0 ? void 0 : propData.thumbnailAsset.url);
                }
                thumbnail.addEventListener('change', async () => {
                    const info = await Editor.Message.request('asset-db', 'query-asset-info', thumbnail.value);
                    if (info && info.path != null) {
                        thumbnailImage.setAttribute('value', info.url);
                        onUpdate(propData, 'thumbnailFilePath', `${this._assetPathToResourceRelativePath(info.path)}/spriteFrame`);
                    }
                });
            }
            const prefabAsset = propJsonComponent.querySelector('#prop-assetFilePath');
            if (prefabAsset) {
                if (propData === null || propData === void 0 ? void 0 : propData.prefabAsset) {
                    prefabAsset.setAttribute('value', propData === null || propData === void 0 ? void 0 : propData.prefabAsset.uuid);
                }
                prefabAsset.addEventListener('change', async () => {
                    const info = await Editor.Message.request('asset-db', 'query-asset-info', prefabAsset.value);
                    if (info && info.path != null) {
                        onUpdate(propData, 'assetFilePath', this._assetPathToResourceRelativePath(info.path));
                    }
                });
            }
            // Handle tags input
            const tagsInput = propJsonComponent.querySelector('#prop-tags');
            if (tagsInput) {
                tagsInput.value = (_k = (_j = (_h = propData === null || propData === void 0 ? void 0 : propData.json) === null || _h === void 0 ? void 0 : _h.tags) === null || _j === void 0 ? void 0 : _j.join(', ')) !== null && _k !== void 0 ? _k : '';
                tagsInput.addEventListener('input', () => {
                    const tags = tagsInput.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter((tag) => /^[a-zA-Z0-9_-]+$/.test(tag));
                    onUpdate(propData, 'tags', tags);
                });
            }
            // Some prop fields are stored in the store catalog as opposed to asset JSONs
            const detailsCell = propJsonComponent.querySelector('#prop-details-cell');
            const createCatalog = propJsonComponent.querySelector('#prop-create-catalog-cell');
            const catalogItem = this._getStoreCatalogItem(propData);
            if (catalogItem) {
                createCatalog.style.display = 'none';
                // Name
                const propName = propJsonComponent.querySelector('#prop-name');
                if (propName) {
                    propName.value = catalogItem.name;
                    propName.addEventListener('input', async () => {
                        catalogItem.name = propName.value;
                        await this._saveStoreCatalog();
                    });
                }
                // Description
                const propDescription = propJsonComponent.querySelector('#prop-description');
                if (propDescription) {
                    propDescription.value = catalogItem.description;
                    propDescription.addEventListener('input', async () => {
                        catalogItem.description = propDescription.value;
                        await this._saveStoreCatalog();
                    });
                }
                // Populate currency dropdown
                const currencySelect = propJsonComponent.querySelector('#prop-currency');
                if (currencySelect) {
                    Object.values(Currency_1.Currency).forEach((currency) => {
                        const option = document.createElement('option');
                        option.value = currency;
                        option.textContent = currency.charAt(0).toUpperCase() + currency.slice(1);
                        currencySelect.appendChild(option);
                    });
                    currencySelect.value = catalogItem.cost.currency;
                    currencySelect.addEventListener('change', async () => {
                        const selectedCurrency = currencySelect.value;
                        catalogItem.cost = new CurrencyAndAmount_1.CurrencyAndAmount(selectedCurrency, catalogItem.cost.amount);
                        await this._saveStoreCatalog();
                    });
                }
                // Handle cost input
                const costInput = propJsonComponent.querySelector('#prop-cost');
                if (costInput) {
                    costInput.value = `${catalogItem.cost.amount}`;
                    costInput.addEventListener('input', async () => {
                        const cost = parseFloat(costInput.value);
                        if (!isNaN(cost) && cost >= 0) {
                            catalogItem.cost = new CurrencyAndAmount_1.CurrencyAndAmount(catalogItem.cost.currency, cost);
                            await this._saveStoreCatalog();
                        }
                    });
                }
            }
            else {
                // Hide details and cost and show a button to create the catalog item
                detailsCell.style.display = 'none';
                createCatalog.style.display = '';
                const createCatalogButton = propJsonComponent.querySelector('#prop-create-catalog-button');
                if (createCatalogButton) {
                    createCatalogButton.addEventListener('click', async (event) => {
                        var _a, _b, _c;
                        const name = (_a = propData === null || propData === void 0 ? void 0 : propData.asset) === null || _a === void 0 ? void 0 : _a.name;
                        const thumbnailPath = (_b = propData === null || propData === void 0 ? void 0 : propData.thumbnailAsset) === null || _b === void 0 ? void 0 : _b.uuid;
                        if (name && thumbnailPath) {
                            const info = await Editor.Message.request('asset-db', 'query-asset-info', thumbnailPath);
                            if (info && info.path != null) {
                                const itemId = (0, path_1.basename)(name, '.json');
                                const spritePath = `${this._assetPathToResourceRelativePath(info.path)}/spriteFrame`;
                                const item = CatalogItem_1.CatalogItem.fromAsset(itemId, (_c = propData === null || propData === void 0 ? void 0 : propData.json) === null || _c === void 0 ? void 0 : _c.id, '', new CurrencyAndAmount_1.CurrencyAndAmount(Currency_1.Currency.Coins, 100), spritePath, ['diner']);
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
        _extractSpriteFrames(prefabJson) {
            const spriteFrameUUIDs = [];
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
        _loadHTMLTemplate(path) {
            const templateContent = (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, path), 'utf-8');
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
        this.$.assetIDFilter.addEventListener('input', (event) => {
            assetIDFilter = event.target.value;
            this._renderAssetList(currentView);
        });
        this.$.assetTagFilter.addEventListener('input', (event) => {
            assetTagFilter = event.target.value;
            this._renderAssetList(currentView);
        });
        this.$.missingCatalogEntriesFilter.addEventListener('change', (event) => {
            missingCatalogFilter = event.target.checked;
            this._renderAssetList(currentView);
        });
        this.$.missingNamesFilter.addEventListener('change', (event) => {
            missingNamesFilter = event.target.checked;
            this._renderAssetList(currentView);
        });
        this.$.missingDescriptionsFilter.addEventListener('change', (event) => {
            missingDescriptionsFilter = event.target.checked;
            this._renderAssetList(currentView);
        });
        this.$.assetTab.addEventListener('confirm', (event) => {
            const value = event.target.value;
            const tab = Number(value) in DataViewTab ? Number(value) : undefined;
            if (tab != null) {
                currentView = tab;
                this._renderAssetList(currentView);
            }
        });
        this.$.refreshAssetsButton.addEventListener('confirm', async (event) => {
            await this._refreshAssets();
            this._renderAssetList(currentView);
        });
    },
    beforeClose() { },
    close() { }
});
