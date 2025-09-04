"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const BoardModifierType_1 = require("../../enums/BoardModifierType");
const BoosterType_1 = require("../../enums/BoosterType");
const DeckType_1 = require("../../enums/DeckType");
const HandName_1 = require("../../enums/HandName");
const ObjectiveType_1 = require("../../enums/ObjectiveType");
const BoardModifier_1 = require("../../models/BoardModifier");
const Card_1 = require("../../models/Card");
const GameConfig_1 = require("../../models/GameConfig");
const ObjectiveParams_1 = require("../../models/ObjectiveParams");
const fileListSelector_1 = require("./fileListSelector");
const LevelEditorController_1 = require("./LevelEditorController");
let levelEditorController = new LevelEditorController_1.LevelEditorController();
let fileListSelector = new fileListSelector_1.FileListSelector();
let currentLevelNameFilter = null;
let currentGridTile = null;
let currentGridTileIndex = -1;
let levelAssets = [];
let isMouseDown = false;
let currentBoardModifierBrush = null;
let boardModifierBrushSettings = new Map();
// Board visibility flags
let boardVisibilityShowCards = true;
let boardVisibilityShowModifiers = true;
let boardVisibilityShowGridIndices = false;
let initializedBoardGrid = false;
let initializedBoardDraggableCardView = false;
let gridTiles = [];
let cards = [];
const LEVEL_RESOURCE_PREFIX = 'db://';
const LEVEL_RESOURCE_PATH = 'assets/resources/levels/';
const LEVEL_RESOURCES_REGEX = 'db://assets/resources/levels/**/*';
const JOKER_SPRITE = 'db://assets/art/gameplay/cards/card-joker.png';
const WILD_SPRITE = 'db://assets/art/gameplay/cards/card_wild.png';
const SUIT_SPRITES = [
    'db://assets/art/gameplay/cards/card-joker.png',
    'db://assets/art/gameplay/cards/card-bg-clubs.png',
    'db://assets/art/gameplay/cards/card-bg-diamonds.png',
    'db://assets/art/gameplay/cards/card-bg-hearts.png',
    'db://assets/art/gameplay/cards/card-bg-spades.png'
];
// non-serialized data from loaded level
module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { }
    },
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/level-editor/index.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/level-editor/index.css'), 'utf-8'),
    $: {
        levelLoaded: false,
        app: '#app',
        text: '#text',
        nameFilter: '#nameFilter',
        levelDetails: '#levelDetails',
        levelName: '#levelName',
        levelPath: '#levelPath',
        levelDescription: '#levelDescription',
        newButton: '#newButton',
        saveButton: '#saveButton',
        deleteButton: '#deleteButton',
        playTestButton: '#playTestButton',
        stopTestButton: '#stopTestButton',
        scrollableList: '#scrollableList',
        customDeck: '#customDeck',
        deck: '#deck',
        deckType: '#deckType',
        deckCardList: '#deckCardList',
        refreshLevelList: '#refreshLevelList',
        reserializeAll: '#reserializeAll',
        levelFileTreeView: '#levelFileTreeView',
        // Deck sorting UI
        allCardsButton: '#allCardsButton',
        noCardsButton: '#noCardsButton',
        clubsOnlyButton: '#clubsOnlyButton',
        diamondsOnlyButton: '#diamondsOnlyButton',
        heartsOnlyButton: '#heartsOnlyButton',
        spadesOnlyButton: '#spadesOnlyButton',
        lowToHighSortButton: '#lowToHighSortButton',
        highToLowSortButton: '#highToLowSortButton',
        shuffleDeckButton: '#shuffleDeckButton',
        // Objective UI
        objectiveTemplate: '#objectiveTemplate',
        scoreObjectiveTemplate: '#scoreObjectiveTemplate',
        handsPlayedObjectiveTemplate: '#handsPlayedObjectiveTemplate',
        handPlayedAnyObjectiveTemplate: '#handPlayedAnyObjectiveTemplate',
        turnLimitObjectiveTemplate: '#turnLimitObjectiveTemplate',
        cardsPlayedObjectiveTemplate: '#cardsPlayedObjectiveTemplate',
        cardsPlayedWithHandObjectiveTemplate: '#cardsPlayedWithHandObjectiveTemplate',
        handPlayedWithScoreObjectiveTemplate: '#handPlayedWithScoreObjectiveTemplate',
        tilePlacementObjectiveTemplate: '#tilePlacementObjectiveTemplate',
        addObjectiveButton: '#addObjective',
        resetObjectivesButton: '#resetObjectives',
        objectiveList: '#objectiveList',
        objectiveParamTemplate: '#objectiveParam',
        addParamButton: '#addParam',
        // Gameboard
        board: '#board',
        boardCardList: '#boardCardList',
        removeAllCardsFromBoard: '#removeAllCardsFromBoard',
        placeAnchorTile: '#placeAnchorTile',
        // Board modifiers
        addModifierButton: '#addModifierButton',
        modifierTypeSelect: '#modifierTypeSelect',
        selectedGridCell: '#selectedGridCell',
        activeModifiersList: '#activeModifiersList',
        // Modifiers Toolbar
        modifierClearAllButton: '#modifierClearAllButton',
        modifierBrushes: '#modifierBrushes',
        // Boosters/Powerups
        boosterTypeSelect: '#boosterTypeSelect',
        powerupTypeSelect: '#powerupTypeSelect',
        // Board visibility flags
        boardVisibilityShowCards: '#boardVisibilityShowCards',
        boardVisibilityShowModifiers: '#boardVisibilityShowModifiers',
        boardVisibilityShowGridIndices: '#boardVisibilityShowGridIndices'
    },
    methods: {
        _buildGameConfig() {
            let gameConfig = new GameConfig_1.GameConfig();
            gameConfig.name = this.$.levelName.value;
            gameConfig.description = this.$.levelDescription.value;
            return gameConfig;
        },
        _buildAssetPath(config) {
            const path = LEVEL_RESOURCE_PREFIX + path_1.posix.join(LEVEL_RESOURCE_PATH, levelEditorController.levelRelativePath, `${config.name}.json`);
            return path;
        },
        _loadHTMLTemplate(path) {
            const templateContent = (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, path), 'utf-8');
            if (!templateContent) {
                console.error('Failed to load template: ', path);
                return;
            }
            const template = document.createElement('template');
            template.innerHTML = templateContent.trim();
            return template.content.firstElementChild;
        },
        async updateLevelList(fetch, filter) {
            let self = this;
            try {
                if (fetch) {
                    levelAssets = await Editor.Message.request('asset-db', 'query-assets', {
                        pattern: LEVEL_RESOURCES_REGEX,
                        ccType: 'cc.JsonAsset'
                    });
                    fileListSelector.buildFileSelectorUI(self.$.levelFileTreeView, levelAssets, (selectedAsset) => {
                        self.loadLevelFromAsset(selectedAsset);
                    });
                }
                if (filter) {
                    fileListSelector.filterTree(filter);
                }
            }
            catch (error) {
                console.error('Error querying assets in directory:', error);
            }
        },
        async reserializeAllLevels() {
            let self = this;
            console.log(`Reserializing all levels...`);
            try {
                levelAssets = await Editor.Message.request('asset-db', 'query-assets', {
                    pattern: LEVEL_RESOURCES_REGEX,
                    ccType: 'cc.JsonAsset'
                });
                for (const assetInfo of levelAssets) {
                    console.log(`Loading: ${assetInfo.file}`);
                    await levelEditorController.loadLevel(assetInfo);
                    console.log(`Saving: ${assetInfo.file}`);
                    await this.saveLevel();
                    console.log(`Done: ${assetInfo.file}`);
                }
            }
            catch (error) {
                console.error('Error processing levels:', error);
            }
            console.log(`Reserializing all levels... DONE`);
        },
        async createNewLevel() {
            levelEditorController.createNewLevel();
            this.updateLevelUI();
        },
        async loadLevelFromAsset(assetInfo) {
            currentGridTile = null;
            currentGridTileIndex = -1;
            currentBoardModifierBrush = null;
            await levelEditorController.loadLevel(assetInfo);
            this.updateLevelUI();
        },
        async deleteLevel() {
            const gameConfig = this._buildGameConfig();
            const assetPath = this._buildAssetPath(gameConfig);
            try {
                const exists = await Editor.Message.request('asset-db', 'query-asset-info', assetPath);
                if (exists) {
                    await Editor.Message.request('asset-db', 'delete-asset', assetPath);
                    await Editor.Message.request('asset-db', 'refresh-asset', assetPath);
                }
                await this.updateLevelList(true, currentLevelNameFilter);
            }
            catch (err) {
                console.error('Error while deleting asset:', err);
            }
        },
        async setTestPlayLevel() {
            await this.saveLevel();
            const gameConfig = this._buildGameConfig();
            const levelPath = this._buildAssetPath(gameConfig).replace('db://assets/resources/', '').replace('.json', '');
            try {
                const assetPath = 'db://assets/resources/test-play.json';
                const content = {
                    level: levelPath
                };
                const exists = await Editor.Message.request('asset-db', 'query-asset-info', assetPath);
                if (exists) {
                    await Editor.Message.request('asset-db', 'save-asset', assetPath, JSON.stringify(content, null, 2));
                }
                else {
                    await Editor.Message.request('asset-db', 'create-asset', assetPath, JSON.stringify(content, null, 2));
                }
                console.log(`Created play-test.json for level: ${levelPath}`);
            }
            catch (error) {
                console.error('Error creating play-test.json:', error);
            }
            Editor.Dialog.info('Quick play level set. Please press Play in the Editor to continue.', { buttons: ['Ok'] });
        },
        async clearTestPlayLevel() {
            try {
                const assetPath = 'db://assets/resources/test-play.json';
                const exists = await Editor.Message.request('asset-db', 'query-asset-info', assetPath);
                if (exists) {
                    await Editor.Message.request('asset-db', 'delete-asset', assetPath);
                }
                console.log(`Cleared play-test.json`);
            }
            catch (error) {
                console.error('Error clearing play-test.json file: ', error);
            }
        },
        async saveLevel() {
            if (levelEditorController.isLevelLoaded() == false) {
                console.error('level is not loaded');
                return;
            }
            const levelData = levelEditorController.getLevelForSave();
            if (levelData == null) {
                console.error('level data is null');
                return;
            }
            const assetPath = this._buildAssetPath(levelData);
            const json = JSON.stringify(levelData);
            try {
                const exists = await Editor.Message.request('asset-db', 'query-asset-info', assetPath);
                // If the path or file name is moved; delete the previous asset before saving in the new location
                const isMoved = levelEditorController.isMoveOnNextSave();
                if (isMoved) {
                    const prevAssetPath = levelEditorController.asset.source;
                    const prevAssetExists = await Editor.Message.request('asset-db', 'query-asset-info', prevAssetPath);
                    if (prevAssetExists) {
                        console.log('File moved; deleting from: ', prevAssetPath);
                        await Editor.Message.request('asset-db', 'delete-asset', prevAssetPath);
                        await Editor.Message.request('asset-db', 'refresh-asset', prevAssetPath);
                    }
                }
                if (exists) {
                    console.log('Updating file: ', assetPath);
                    await Editor.Message.request('asset-db', 'save-asset', assetPath, json);
                }
                else {
                    console.log('Writing file to: ', assetPath);
                    await Editor.Message.send('asset-db', 'create-asset', assetPath, json);
                    await Editor.Message.request('asset-db', 'refresh-asset', assetPath);
                    const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', assetPath);
                    if (assetInfo) {
                        levelEditorController.setAssetInfo(assetInfo);
                    }
                }
                await this.updateLevelList(true, currentLevelNameFilter);
            }
            catch (err) {
                console.error('Error while checking or saving/creating asset:', err);
            }
        },
        updateLevelUI() {
            const level = levelEditorController.level;
            if (level == null) {
                this.$.saveButton.style.display = 'none';
                this.$.deleteButton.style.display = 'none';
                this.$.levelDetails.style.display = 'none';
                this.$.playTestButton.style.display = 'none';
                this.$.stopTestButton.style.display = 'none';
                return;
            }
            this.$.saveButton.style.display = '';
            this.$.deleteButton.style.display = '';
            this.$.levelDetails.style.display = '';
            this.$.playTestButton.style.display = '';
            this.$.stopTestButton.style.display = '';
            this.$.levelName.value = level.name;
            this.$.levelPath.value = levelEditorController.levelRelativePath;
            this.$.levelDescription.value = level.description;
            this.$.deckType.value = level.deckType;
            this.$.boosterTypeSelect.value = level.freeBooster;
            this.$.powerupTypeSelect.value = level.freePowerup;
            this.$.placeAnchorTile.checked = level.placeAnchor;
            this.updateObjectiveUI(level);
            this.updateCustomDeckUI(level);
            this.updateStartingBoardUI(level);
            this.updateBoosterPowerupUI(level);
        },
        async updateCustomDeckUI(level) {
            if (level == null) {
                return;
            }
            let self = this;
            // Hide the custom deck UI
            if (level.deckType != DeckType_1.DeckType.Custom) {
                this.$.customDeck.style.display = 'none';
                return;
            }
            // Show and refresh the custom deck UI
            this.$.customDeck.style.display = '';
            // Create card elements if we haven't already
            if (cards.length == 0) {
                levelEditorController.allCards.forEach((card) => {
                    let cardVisual = this.createCardDiv(card, () => self.toggleCard(card));
                    cards.push([card, cardVisual]);
                });
            }
            self.$.deck.innerHTML = '';
            self.$.deckCardList.innerHTML = '';
            // Put the deck cards in the correct order
            level.customDeck.forEach((card) => {
                var _a;
                const cardVisual = cards.find((c) => c[0].equals(card));
                (_a = self.$.deck) === null || _a === void 0 ? void 0 : _a.append(cardVisual[1]);
            });
            // Put the remaining cards not in the deck here
            cards.forEach((card) => {
                var _a;
                if (levelEditorController.customDeckContainsCard(card[0]) == false) {
                    (_a = self.$.deckCardList) === null || _a === void 0 ? void 0 : _a.append(card[1]);
                }
            });
        },
        toggleCard(card) {
            var _a, _b, _c;
            const cardAndVisual = cards.find((cardAndVisual) => cardAndVisual[0].equals(card));
            if (!cardAndVisual) {
                return;
            }
            const cardVisual = cardAndVisual[1];
            levelEditorController.toggleCardInCustomDeck(card);
            (_a = cardVisual.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(cardVisual);
            if (levelEditorController.customDeckContainsCard(card)) {
                (_b = this.$.deck) === null || _b === void 0 ? void 0 : _b.append(cardVisual);
            }
            else {
                (_c = this.$.deckCardList) === null || _c === void 0 ? void 0 : _c.append(cardVisual);
            }
        },
        updateObjectiveUI(level) {
            if (level == null) {
                return;
            }
            // Wipe and rebuild the UI. We could be smarter here if this isn't performant.
            this.$.objectiveList.innerHTML = '';
            level.objectives.forEach((objective, index) => {
                var _a, _b;
                const objectiveDiv = this.createObjectiveDiv(objective, index);
                (_a = objective.objectiveDataList) === null || _a === void 0 ? void 0 : _a.forEach((param, i) => {
                    const paramDiv = this.createObjectiveParam(param, objective, i);
                    objectiveDiv.append(paramDiv);
                });
                (_b = this.$.objectiveList) === null || _b === void 0 ? void 0 : _b.append(objectiveDiv);
            });
        },
        updateBoosterPowerupUI(level) {
            this.$.boosterTypeSelect.innerHTML = '';
            Object.values(BoosterType_1.BoosterType).forEach((value) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                this.$.boosterTypeSelect.appendChild(option);
            });
            this.$.powerupTypeSelect.innerHTML = '';
            Object.values(BoosterType_1.PowerupType).forEach((value) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                this.$.powerupTypeSelect.appendChild(option);
            });
        },
        updateStartingBoardUI(level) {
            if (level == null) {
                return;
            }
            if (!initializedBoardGrid) {
                const gridContainer = document.createElement('div');
                gridContainer.className = 'grid-container';
                this.$.board.append(gridContainer);
                for (let y = 12; y >= 0; --y) {
                    for (let x = 0; x < 13; ++x) {
                        const boardIndex = this.boardCoordsToBoardIndex(x, y);
                        const gridTile = document.createElement('ui-drag-area');
                        gridTile.setAttribute('id', `boardTile_${x}_${y}`);
                        gridTile.setAttribute('droppable', 'type-board');
                        gridTile.addEventListener('drop', (event) => {
                            this.onDrop(x, y, event);
                        });
                        const gridContents = document.createElement('div');
                        gridContents.setAttribute('id', 'board-tile');
                        gridContents.classList.add('gridContentParent');
                        // checkerboard pattern:
                        if (y % 2 == 0) {
                            gridContents.classList.add(`board-tile-${x % 2}`);
                        }
                        else {
                            const index = x % 2 === 0 ? 2 : 0;
                            gridContents.classList.add(`board-tile-${index}`);
                        }
                        // card container
                        const cardContainer = document.createElement('div');
                        cardContainer.classList.add('gridContentContainer', 'cardContainer');
                        cardContainer.setAttribute('id', `cardContainer`);
                        gridContents.append(cardContainer);
                        // blocker container
                        const modifierContainer = document.createElement('div');
                        modifierContainer.classList.add('gridContentContainer', 'modifierContainer');
                        modifierContainer.setAttribute('id', `modifierContainer`);
                        gridContents.append(modifierContainer);
                        // debug text container
                        const debugTextContainer = document.createElement('div');
                        debugTextContainer.classList.add('debugText');
                        debugTextContainer.textContent = `${boardIndex}`;
                        gridContents.append(debugTextContainer);
                        gridTile.append(gridContents);
                        gridContainer === null || gridContainer === void 0 ? void 0 : gridContainer.append(gridTile);
                        gridTiles[boardIndex] = gridTile;
                    }
                }
                initializedBoardGrid = true;
            }
            // Visibility options
            gridTiles.forEach((gridTile, index) => {
                const debugTextContainer = gridTile.querySelector('.debugText');
                if (debugTextContainer) {
                    debugTextContainer.style.display = boardVisibilityShowGridIndices ? '' : 'none';
                }
                const modifierContainer = gridTile.querySelector('.modifierContainer');
                if (modifierContainer) {
                    modifierContainer.style.display = boardVisibilityShowModifiers ? '' : 'none';
                }
                const cardContainer = gridTile.querySelector('.cardContainer');
                if (cardContainer) {
                    cardContainer.style.display = boardVisibilityShowCards ? '' : 'none';
                }
            });
            // Board card list
            if (!initializedBoardDraggableCardView) {
                this.$.boardCardList.innerHTML = '';
                levelEditorController.allBoardCards.forEach((card) => {
                    const cardDiv = document.createElement('ui-drag-item');
                    cardDiv.setAttribute('id', `card_${card.rank}_${card.suit}_`);
                    cardDiv.setAttribute('type', 'type-board');
                    cardDiv.setAttribute('value', 'card_${card.rank}_${card.suit}');
                    cardDiv.className = 'card';
                    const cardImage = document.createElement('ui-image');
                    this.setCardSprite(cardImage, card);
                    const cardText = document.createElement('div');
                    cardText.className = 'text';
                    cardText.textContent = `${card.rankString()}`;
                    cardDiv.append(cardImage);
                    cardDiv.append(cardText);
                    cardDiv.addEventListener('dragstart', (event) => {
                        this.onCardDragStart(card, event);
                    });
                    this.$.boardCardList.append(cardDiv);
                });
                // Populate modifier select list
                this.$.modifierTypeSelect.innerHTML = '';
                Object.values(BoardModifierType_1.BoardModifierType)
                    .filter((bmt) => bmt !== BoardModifierType_1.BoardModifierType.None)
                    .forEach((value) => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    this.$.modifierTypeSelect.appendChild(option);
                });
                this.$.modifierTypeSelect.value = BoardModifierType_1.BoardModifierType.HandMultiplier;
                initializedBoardDraggableCardView = true;
            }
            gridTiles.forEach((gridTile, index) => {
                const gridRoot = gridTile.querySelector('#board-tile');
                const cardContainer = gridTile.querySelector('#cardContainer');
                const modifierContainer = gridTile.querySelector('#modifierContainer');
                if (!gridRoot || !cardContainer || !modifierContainer) {
                    return;
                }
                const updateModifierList = (modifiers) => {
                    currentGridTile = gridRoot;
                    currentGridTileIndex = index;
                    this.$.selectedGridCell.innerText = `Cell: ${index}`;
                    this.$.activeModifiersList.innerHTML = '';
                    modifiers.forEach((m) => {
                        const modifierControl = this.createModifierEditDiv(m, index, true, (modifier) => {
                            levelEditorController.updateModifierAtIndex(index, modifier);
                            this.updateStartingBoardUI(levelEditorController.level);
                        }, () => {
                            levelEditorController.removeBoardModifierAtIndex(index, m);
                            this.updateStartingBoardUI(levelEditorController.level);
                        });
                        this.$.activeModifiersList.append(modifierControl);
                    });
                };
                const visualizeModifiers = (modifiers) => {
                    modifierContainer.innerHTML = '';
                    var modifier = modifiers === null || modifiers === void 0 ? void 0 : modifiers[0];
                    if (modifier) {
                        const modifierVisual = this.createModifierDiv(modifier, modifiers.length, index);
                        modifierContainer.append(modifierVisual);
                    }
                };
                // When clicking a grid tile, if we've got a modifier brush, paint the tile otherwise select it for display of modifiers list
                const onGridTileClick = () => {
                    if (currentGridTile != null) {
                        currentGridTile.classList.remove('board-tile-selected');
                    }
                    currentGridTile = gridRoot;
                    currentGridTile.classList.add('board-tile-selected');
                    currentGridTileIndex = index;
                    if (currentBoardModifierBrush != null) {
                        if (currentBoardModifierBrush == BoardModifierType_1.BoardModifierType.None) {
                            levelEditorController.removeAllBoardModifiersAtIndex(currentGridTileIndex);
                            const modifiers = levelEditorController.getBoardModifiersAtIndex(index);
                            visualizeModifiers(modifiers);
                            updateModifierList(modifiers);
                        }
                        else {
                            let modifier = new BoardModifier_1.BoardModifier(currentBoardModifierBrush);
                            // Use the settings if there are some for this modifier
                            const modifierBrushSettings = boardModifierBrushSettings.get(currentBoardModifierBrush);
                            if (modifierBrushSettings) {
                                modifier = modifierBrushSettings;
                            }
                            if (!levelEditorController.hasBoardModifierAtIndex(currentGridTileIndex, modifier)) {
                                levelEditorController.addBoardModifierAtIndex(currentGridTileIndex, modifier);
                                const modifiers = levelEditorController.getBoardModifiersAtIndex(index);
                                visualizeModifiers(modifiers);
                                updateModifierList(modifiers);
                            }
                            else {
                                const modifiers = levelEditorController.getBoardModifiersAtIndex(index);
                                updateModifierList(modifiers);
                            }
                        }
                    }
                    else {
                        const modifiers = levelEditorController.getBoardModifiersAtIndex(index);
                        updateModifierList(modifiers);
                    }
                };
                const modifiers = levelEditorController.getBoardModifiersAtIndex(index);
                gridRoot.addEventListener('click', onGridTileClick);
                gridRoot.addEventListener('mousedown', () => {
                    isMouseDown = true;
                });
                document.addEventListener('mouseup', () => {
                    isMouseDown = false;
                });
                gridRoot.addEventListener('mousemove', () => {
                    if (isMouseDown) {
                        onGridTileClick();
                    }
                });
                if (currentGridTileIndex === index) {
                    updateModifierList(modifiers);
                }
                cardContainer.innerHTML = '';
                var card = levelEditorController.getCardPlacementAtIndex(index);
                if (card) {
                    const cardVisual = this.createCardDiv(card, () => {
                        // TODO: don't want to do this
                        levelEditorController.removeBoardCardPlacement(index);
                        this.updateStartingBoardUI(levelEditorController.level);
                    });
                    cardContainer.append(cardVisual);
                }
                visualizeModifiers(modifiers);
            });
            // Modifiers toolbar
            // Populate modifiers toolbar list
            this.$.modifierBrushes.innerHTML = '';
            let currentSelectedButton = null;
            Object.values(BoardModifierType_1.BoardModifierType).forEach((value) => {
                // Not a placeable modifier type
                if (value === BoardModifierType_1.BoardModifierType.BurnedTile) {
                    return;
                }
                const optionButton = document.createElement('div');
                optionButton.textContent = value;
                optionButton.classList.add('brush', 'brush-inactive');
                optionButton.setAttribute('id', `${value}`);
                if (value !== BoardModifierType_1.BoardModifierType.None && value !== BoardModifierType_1.BoardModifierType.Null) {
                    let boardModifier = boardModifierBrushSettings.get(value);
                    if (!boardModifier) {
                        boardModifier = new BoardModifier_1.BoardModifier(value);
                        boardModifier = BoardModifier_1.BoardModifier.fromObject(boardModifier); // To type convert
                        boardModifierBrushSettings.set(value, boardModifier);
                    }
                    const modifierPropertyEditor = this.createModifierEditDiv(boardModifier, -1, false, (modifier) => {
                        boardModifier = modifier;
                    });
                    optionButton.append(modifierPropertyEditor);
                }
                optionButton.addEventListener('click', (event) => {
                    // Ignore clicks from child elements
                    if (event.target !== optionButton) {
                        return;
                    }
                    // Toggle off if same button clicked again
                    if (currentBoardModifierBrush === value) {
                        optionButton.classList.remove('brush-active');
                        optionButton.classList.add('brush-inactive');
                        currentBoardModifierBrush = null;
                        currentSelectedButton = null;
                        return;
                    }
                    // Clear previous selection
                    if (currentSelectedButton) {
                        currentSelectedButton.classList.remove('brush-active');
                        currentSelectedButton.classList.add('brush-inactive');
                    }
                    // Set new selection
                    currentBoardModifierBrush = value;
                    optionButton.classList.remove('brush-inactive');
                    optionButton.classList.add('brush-active');
                    currentSelectedButton = optionButton;
                });
                this.$.modifierBrushes.appendChild(optionButton);
            });
        },
        createModifierDiv(modifier, modifierCount, index) {
            const modifierDiv = document.createElement('div');
            modifierDiv.className = 'modifier';
            const modifierText = document.createElement('div');
            modifierText.className = 'modifierText';
            modifierDiv.append(modifierText);
            switch (modifier.type) {
                case BoardModifierType_1.BoardModifierType.HandMultiplier:
                    modifierText.textContent = `Hand x${modifier.multiplier}`;
                    break;
                case BoardModifierType_1.BoardModifierType.BreakableWall:
                    const breakableWall = modifier;
                    const requiredSuit = breakableWall.requiredSuit === -1
                        ? 'Any'
                        : breakableWall.requiredSuit === 0
                            ? 'Inv'
                            : Card_1.Card.Suits[breakableWall.requiredSuit - 1];
                    const requiredRank = breakableWall.requiredRank === -1
                        ? 'Any'
                        : breakableWall.requiredRank === 0
                            ? 'Inv'
                            : Card_1.Card.Ranks[breakableWall.requiredRank - 1];
                    modifierText.textContent = `Wall S:${requiredSuit} R:${requiredRank}`;
                    break;
                default:
                    modifierText.textContent = `${modifier.type}`;
            }
            if (modifierCount > 1) {
                const modifierCountText = document.createElement('div');
                modifierCountText.textContent = `(+${modifierCount - 1})`;
                modifierCountText.className = 'modifierCounterText';
                modifierDiv.append(modifierCountText);
            }
            return modifierDiv;
        },
        createModifierEditDiv(modifier, index, showDelete = true, onModifierChange = () => { }, onDelete = () => { }) {
            console.log(`CSB: createModifierEditDiv ${modifier}`, modifier);
            const templateDiv = this._loadHTMLTemplate(`../../../static/template/level-editor/components/modifier-${modifier.type}.html`);
            if (!templateDiv) {
                throw new Error('Template does not contain a .modifierEdit element.');
            }
            const deleteButton = templateDiv.querySelector('#modifier-delete');
            if (deleteButton) {
                deleteButton.style.display = showDelete ? '' : 'none';
                deleteButton.addEventListener('click', onDelete);
            }
            // Base modifier options
            const modifierExpiresOption = templateDiv.querySelector('#modifier-expires');
            const modifierExpiresTurnCountInput = templateDiv.querySelector('#modifier-expires-turn-count');
            if (modifierExpiresOption) {
                modifierExpiresOption.setAttribute('value', modifier.expires.toString());
                modifierExpiresOption.addEventListener('confirm', (event) => {
                    const expires = event.target.checked;
                    if (expires !== modifier.expires) {
                        modifier.expires = expires;
                        if (expires) {
                            modifier.expiresTurnCount = 0;
                        }
                        onModifierChange(modifier);
                    }
                });
            }
            if (modifierExpiresTurnCountInput) {
                modifierExpiresTurnCountInput.setAttribute('value', modifier.expires ? modifier.expiresTurnCount.toString() : '0');
                if (modifier.expires) {
                    modifierExpiresTurnCountInput.removeAttribute('disabled');
                }
                else {
                    modifierExpiresTurnCountInput.setAttribute('disabled', 'true');
                }
                modifierExpiresTurnCountInput.addEventListener('confirm', (event) => {
                    let turnCount = parseInt(event.target.value, 10);
                    turnCount = isNaN(turnCount) ? 0 : turnCount;
                    if (turnCount !== modifier.expiresTurnCount) {
                        modifier.expiresTurnCount = turnCount;
                        onModifierChange(modifier);
                    }
                });
            }
            // Multiplier modifier options
            if (modifier.type === BoardModifierType_1.BoardModifierType.BreakableWall) {
                let breakableWallModifier = modifier;
                const reinforcedInput = templateDiv.querySelector('#modifier-reinforced');
                const requiredRankInput = templateDiv.querySelector('#modifier-requiredRank');
                const requiredSuitInput = templateDiv.querySelector('#modifier-requiredSuit');
                breakableWallModifier.boardIndex = index;
                if (reinforcedInput) {
                    reinforcedInput.setAttribute('value', breakableWallModifier.reinforced.toString());
                    reinforcedInput.addEventListener('confirm', (event) => {
                        const reinforced = event.target.checked;
                        if (reinforced !== breakableWallModifier.reinforced) {
                            breakableWallModifier.reinforced = reinforced;
                            onModifierChange(modifier);
                        }
                    });
                }
                if (requiredRankInput) {
                    requiredRankInput.setAttribute('value', breakableWallModifier.requiredRank.toString());
                    requiredRankInput.addEventListener('confirm', (event) => {
                        const requiredRank = parseInt(event.target.value);
                        if (requiredRank !== breakableWallModifier.requiredRank) {
                            breakableWallModifier.requiredRank = requiredRank;
                            onModifierChange(modifier);
                        }
                    });
                }
                if (requiredSuitInput) {
                    requiredSuitInput.setAttribute('value', breakableWallModifier.requiredSuit.toString());
                    requiredSuitInput.addEventListener('confirm', (event) => {
                        const requiredSuit = parseInt(event.target.value);
                        if (requiredSuit !== breakableWallModifier.requiredSuit) {
                            breakableWallModifier.requiredSuit = requiredSuit;
                            onModifierChange(modifier);
                        }
                    });
                }
            }
            else if (modifier.type === BoardModifierType_1.BoardModifierType.HandMultiplier) {
                let handMultiplierModifier = modifier;
                const modifierMultiplierInput = templateDiv.querySelector('#modifier-multiplier');
                if (modifierMultiplierInput) {
                    modifierMultiplierInput.setAttribute('value', handMultiplierModifier.multiplier.toString());
                    modifierMultiplierInput.addEventListener('confirm', (event) => {
                        const multiplier = parseInt(event.target.value);
                        if (multiplier !== handMultiplierModifier.multiplier) {
                            handMultiplierModifier.multiplier = multiplier;
                            onModifierChange(modifier);
                        }
                    });
                }
            }
            return templateDiv;
        },
        createCardDiv(card, onClick) {
            let self = this;
            const cardDiv = document.createElement('div');
            cardDiv.classList.add(`card`, 'child');
            //cardDiv.addEventListener('click', onClick);
            cardDiv.addEventListener('mousedown', (event) => {
                const isControlClick = event.ctrlKey || event.metaKey;
                if (event.button === 0 && isControlClick) {
                    onClick();
                }
            });
            const cardImg = document.createElement('ui-image');
            this.setCardSprite(cardImg, card);
            const cardText = document.createElement('div');
            cardText.className = 'text';
            cardText.textContent = `${card.rankString()}`;
            cardDiv.append(cardImg);
            cardDiv.append(cardText);
            return cardDiv;
        },
        createObjectiveDiv(gameObjective, index) {
            var _a;
            let self = this;
            // Clone the hidden template
            let objectiveDiv = (_a = this.$.objectiveTemplate) === null || _a === void 0 ? void 0 : _a.cloneNode(true);
            objectiveDiv.style.display = '';
            // Set the title
            let objectiveTitle = objectiveDiv.querySelector('#objectiveNumber');
            objectiveTitle.innerHTML = 'Goal ' + (index + 1);
            // Add Param Handler
            let addParamButton = objectiveDiv.querySelector('#addParam');
            addParamButton === null || addParamButton === void 0 ? void 0 : addParamButton.addEventListener('confirm', () => {
                levelEditorController.addObjectiveParam(gameObjective);
                self.updateObjectiveUI(levelEditorController.level);
            });
            // Delete handler
            let deleteButton = objectiveDiv.querySelector('#deleteObjective');
            deleteButton === null || deleteButton === void 0 ? void 0 : deleteButton.addEventListener('confirm', () => {
                levelEditorController.removeObjective(gameObjective);
                self.updateObjectiveUI(levelEditorController.level);
            });
            return objectiveDiv;
        },
        createObjectiveParam(param, objective, index) {
            var _a;
            let self = this;
            // Clone the hidden template
            let paramDiv = (_a = this.$.objectiveParamTemplate) === null || _a === void 0 ? void 0 : _a.cloneNode(true);
            paramDiv.style.display = '';
            // Set the select menu
            let objectiveSelect = paramDiv.querySelector('#objectiveCategory');
            objectiveSelect === null || objectiveSelect === void 0 ? void 0 : objectiveSelect.setAttribute('value', param.objectiveType);
            objectiveSelect === null || objectiveSelect === void 0 ? void 0 : objectiveSelect.addEventListener('change', (event) => {
                const objectiveCategory = LevelEditorController_1.LevelEditorController.StringToObjectiveTypeEnum(event.target.value);
                if (objectiveCategory) {
                    param.objectiveType = objectiveCategory;
                    switch (param.objectiveType) {
                        case ObjectiveType_1.ObjectiveType.Score:
                            param = new ObjectiveParams_1.ScoreObjectiveParams();
                            break;
                        case ObjectiveType_1.ObjectiveType.HandPlayed:
                            param = new ObjectiveParams_1.HandsPlayedObjectiveParams();
                            break;
                        case ObjectiveType_1.ObjectiveType.TurnLimit:
                            param = new ObjectiveParams_1.TurnLimitObjectiveParams();
                            break;
                        case ObjectiveType_1.ObjectiveType.HandPlayedWithScore:
                            param = new ObjectiveParams_1.HandPlayedWithScoreObjectiveParams();
                            break;
                        case ObjectiveType_1.ObjectiveType.HandPlayedAny:
                            param = new ObjectiveParams_1.HandPlayedAnyObjectiveParams();
                            break;
                        case ObjectiveType_1.ObjectiveType.CardPlayed:
                            param = new ObjectiveParams_1.CardPlayedObjectiveParams();
                            break;
                        case ObjectiveType_1.ObjectiveType.TilePlacement:
                            param = new ObjectiveParams_1.TilePlacedObjectiveParams();
                            break;
                    }
                    this.updateObjectiveUI(levelEditorController.level);
                }
            });
            // Set the title
            let objectiveTitle = paramDiv.querySelector('#paramNumber');
            objectiveTitle.innerHTML = 'Objective ' + (index + 1);
            // Add the options based from the enum
            Object.values(ObjectiveType_1.ObjectiveType).forEach((value) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                objectiveSelect.appendChild(option);
            });
            // Set properties
            let objectiveOptions = paramDiv.querySelector('#objectiveOptions');
            objectiveOptions.innerHTML = '';
            switch (param.objectiveType) {
                case ObjectiveType_1.ObjectiveType.Score: {
                    let objectiveDiv = this.createScoreObjectiveDiv(param);
                    objectiveOptions === null || objectiveOptions === void 0 ? void 0 : objectiveOptions.append(objectiveDiv);
                    break;
                }
                case ObjectiveType_1.ObjectiveType.HandPlayed: {
                    let objectiveDiv = this.createHandsPlayedObjectiveDiv(param);
                    objectiveOptions === null || objectiveOptions === void 0 ? void 0 : objectiveOptions.append(objectiveDiv);
                    break;
                }
                case ObjectiveType_1.ObjectiveType.TurnLimit: {
                    let objectiveDiv = this.createTurnLimitObjectiveDiv(param);
                    objectiveOptions === null || objectiveOptions === void 0 ? void 0 : objectiveOptions.append(objectiveDiv);
                    break;
                }
                case ObjectiveType_1.ObjectiveType.HandPlayedWithScore: {
                    let objectiveDiv = this.createHandPlayedWithScoreObjectiveDiv(param);
                    objectiveOptions === null || objectiveOptions === void 0 ? void 0 : objectiveOptions.append(objectiveDiv);
                    break;
                }
                case ObjectiveType_1.ObjectiveType.HandPlayedAny: {
                    let objectiveDiv = this.createHandPlayedAnyObjectiveDiv(param);
                    objectiveOptions === null || objectiveOptions === void 0 ? void 0 : objectiveOptions.append(objectiveDiv);
                    break;
                }
                case ObjectiveType_1.ObjectiveType.CardPlayed: {
                    let objectiveDiv = this.createCardPlayedObjectiveDiv(param);
                    objectiveOptions === null || objectiveOptions === void 0 ? void 0 : objectiveOptions.append(objectiveDiv);
                    break;
                }
                case ObjectiveType_1.ObjectiveType.TilePlacement: {
                    let objectiveDiv = this.createTilePlacementObjectiveDiv(param, objective);
                    objectiveOptions === null || objectiveOptions === void 0 ? void 0 : objectiveOptions.append(objectiveDiv);
                    break;
                }
                case ObjectiveType_1.ObjectiveType.CardPlayedWithHand: {
                    let objectiveDiv = this.createCardPlayedWithHandObjectiveDiv(param);
                    objectiveOptions === null || objectiveOptions === void 0 ? void 0 : objectiveOptions.append(objectiveDiv);
                    break;
                }
            }
            // Delete handler
            let deleteButton = paramDiv.querySelector('#deleteParam');
            deleteButton === null || deleteButton === void 0 ? void 0 : deleteButton.addEventListener('confirm', () => {
                levelEditorController.removeObjectiveParam(param, objective);
                self.updateObjectiveUI(levelEditorController.level);
            });
            return paramDiv;
        },
        createScoreObjectiveDiv(objective) {
            var _a;
            let objectiveDiv = (_a = this.$.scoreObjectiveTemplate) === null || _a === void 0 ? void 0 : _a.cloneNode(true);
            objectiveDiv.style.display = '';
            let scoreObjective = objective;
            if (scoreObjective) {
                const scoreElem = objectiveDiv.querySelector('#scoreObjectiveScore');
                scoreElem === null || scoreElem === void 0 ? void 0 : scoreElem.setAttribute('value', '' + scoreObjective.score);
                scoreElem === null || scoreElem === void 0 ? void 0 : scoreElem.addEventListener('input', (event) => {
                    scoreObjective.score = +event.target.value;
                });
            }
            return objectiveDiv;
        },
        createHandsPlayedObjectiveDiv(objective) {
            var _a;
            let objectiveDiv = (_a = this.$.handsPlayedObjectiveTemplate) === null || _a === void 0 ? void 0 : _a.cloneNode(true);
            objectiveDiv.style.display = '';
            let handPlayedObjective = objective;
            if (handPlayedObjective) {
                const handNameSelect = objectiveDiv.querySelector('#handsPlayedObjectiveHandName');
                handNameSelect === null || handNameSelect === void 0 ? void 0 : handNameSelect.setAttribute('value', '' + handPlayedObjective.hand);
                handNameSelect === null || handNameSelect === void 0 ? void 0 : handNameSelect.addEventListener('change', (event) => {
                    const handName = LevelEditorController_1.LevelEditorController.StringToHandNameEnum(event.target.value);
                    if (handName) {
                        handPlayedObjective.hand = handName;
                    }
                });
                Object.values(HandName_1.HandName).forEach((value) => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    handNameSelect.appendChild(option);
                });
                const countElem = objectiveDiv.querySelector('#handsPlayedObjectiveCount');
                countElem === null || countElem === void 0 ? void 0 : countElem.setAttribute('value', '' + handPlayedObjective.count);
                countElem === null || countElem === void 0 ? void 0 : countElem.addEventListener('input', (event) => {
                    handPlayedObjective.count = +event.target.value;
                });
            }
            return objectiveDiv;
        },
        createHandPlayedAnyObjectiveDiv(objective) {
            var _a;
            let objectiveDiv = (_a = this.$.handPlayedAnyObjectiveTemplate) === null || _a === void 0 ? void 0 : _a.cloneNode(true);
            objectiveDiv.style.display = '';
            let handPlayedAnyObjective = objective;
            if (handPlayedAnyObjective) {
                const countElem = objectiveDiv.querySelector('#handPlayedAnyObjectiveCount');
                countElem === null || countElem === void 0 ? void 0 : countElem.setAttribute('value', '' + handPlayedAnyObjective.count);
                countElem === null || countElem === void 0 ? void 0 : countElem.addEventListener('input', (event) => {
                    handPlayedAnyObjective.count = +event.target.value;
                });
            }
            return objectiveDiv;
        },
        createTurnLimitObjectiveDiv(objective) {
            var _a;
            let objectiveDiv = (_a = this.$.turnLimitObjectiveTemplate) === null || _a === void 0 ? void 0 : _a.cloneNode(true);
            objectiveDiv.style.display = '';
            let turnObjective = objective;
            if (turnObjective) {
                const turnElem = objectiveDiv.querySelector('#turnLimitObjectiveValue');
                turnElem === null || turnElem === void 0 ? void 0 : turnElem.setAttribute('value', '' + turnObjective.turnLimit);
                turnElem === null || turnElem === void 0 ? void 0 : turnElem.addEventListener('input', (event) => {
                    turnObjective.turnLimit = +event.target.value;
                });
            }
            return objectiveDiv;
        },
        createCardPlayedObjectiveDiv(objective) {
            var _a;
            let objectiveDiv = (_a = this.$.cardsPlayedObjectiveTemplate) === null || _a === void 0 ? void 0 : _a.cloneNode(true);
            objectiveDiv.style.display = '';
            let cardPlayedObjective = objective;
            if (cardPlayedObjective) {
                const rankElem = objectiveDiv.querySelector('#cardsPlayedObjectiveRank');
                rankElem === null || rankElem === void 0 ? void 0 : rankElem.setAttribute('value', '' + cardPlayedObjective.rank);
                rankElem === null || rankElem === void 0 ? void 0 : rankElem.addEventListener('input', (event) => {
                    cardPlayedObjective.rank = +event.target.value;
                });
                const suitElem = objectiveDiv.querySelector('#cardsPlayedObjectiveSuit');
                suitElem === null || suitElem === void 0 ? void 0 : suitElem.setAttribute('value', '' + cardPlayedObjective.suit);
                suitElem === null || suitElem === void 0 ? void 0 : suitElem.addEventListener('input', (event) => {
                    cardPlayedObjective.suit = +event.target.value;
                });
                const countElem = objectiveDiv.querySelector('#cardsPlayedObjectiveCount');
                countElem === null || countElem === void 0 ? void 0 : countElem.setAttribute('value', '' + cardPlayedObjective.count);
                countElem === null || countElem === void 0 ? void 0 : countElem.addEventListener('input', (event) => {
                    cardPlayedObjective.count = +event.target.value;
                });
            }
            return objectiveDiv;
        },
        createCardPlayedWithHandObjectiveDiv(objective) {
            var _a;
            let objectiveDiv = (_a = this.$.cardsPlayedWithHandObjectiveTemplate) === null || _a === void 0 ? void 0 : _a.cloneNode(true);
            objectiveDiv.style.display = '';
            let cardPlayedObjective = objective;
            if (cardPlayedObjective) {
                const rankElem = objectiveDiv.querySelector('#cardsPlayedWithHandObjectiveRank');
                rankElem === null || rankElem === void 0 ? void 0 : rankElem.setAttribute('value', '' + cardPlayedObjective.rank);
                rankElem === null || rankElem === void 0 ? void 0 : rankElem.addEventListener('input', (event) => {
                    cardPlayedObjective.rank = +event.target.value;
                });
                const suitElem = objectiveDiv.querySelector('#cardsPlayedWithHandObjectiveSuit');
                suitElem === null || suitElem === void 0 ? void 0 : suitElem.setAttribute('value', '' + cardPlayedObjective.suit);
                suitElem === null || suitElem === void 0 ? void 0 : suitElem.addEventListener('input', (event) => {
                    cardPlayedObjective.suit = +event.target.value;
                });
                const countElem = objectiveDiv.querySelector('#cardsPlayedWithHandObjectiveCount');
                countElem === null || countElem === void 0 ? void 0 : countElem.setAttribute('value', '' + cardPlayedObjective.count);
                countElem === null || countElem === void 0 ? void 0 : countElem.addEventListener('input', (event) => {
                    cardPlayedObjective.count = +event.target.value;
                });
                const handNameSelect = objectiveDiv.querySelector('#cardsPlayedWithHandObjectiveHandName');
                handNameSelect === null || handNameSelect === void 0 ? void 0 : handNameSelect.setAttribute('value', '' + cardPlayedObjective.hand);
                handNameSelect === null || handNameSelect === void 0 ? void 0 : handNameSelect.addEventListener('change', (event) => {
                    const handName = LevelEditorController_1.LevelEditorController.StringToHandNameEnum(event.target.value);
                    if (handName) {
                        cardPlayedObjective.hand = handName;
                    }
                });
                Object.values(HandName_1.HandName).forEach((value) => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    handNameSelect.appendChild(option);
                });
            }
            return objectiveDiv;
        },
        createTilePlacementObjectiveDiv(objective, gameObjective) {
            var _a;
            let self = this;
            let objectiveDiv = (_a = this.$.tilePlacementObjectiveTemplate) === null || _a === void 0 ? void 0 : _a.cloneNode(true);
            objectiveDiv.style.display = '';
            let tilePlacementObjective = objective;
            if (tilePlacementObjective) {
                if (!tilePlacementObjective.tileIndices) {
                    tilePlacementObjective.tileIndices = [];
                }
                //Fill existing Indices
                tilePlacementObjective.tileIndices.forEach((tileIndex) => {
                    const inputParent = objectiveDiv.querySelector('#tileIndexList');
                    if (inputParent) {
                        const children = inputParent.children;
                        const childList = Array.from(children);
                        const childIndex = childList.length;
                        const inputField = document.createElement('ui-input');
                        inputField.setAttribute('id', `tileIndex${childIndex}`);
                        inputField.setAttribute('style', 'width: 200px');
                        inputField.setAttribute('value', tileIndex.toString());
                        inputField === null || inputField === void 0 ? void 0 : inputField.addEventListener('input', (event) => {
                            tilePlacementObjective.tileIndices[childIndex] = +event.target.value;
                        });
                        const deleteButton = document.createElement('ui-button');
                        deleteButton.setAttribute('id', `removeTileIndex${childIndex}`);
                        deleteButton.setAttribute('class', 'red');
                        deleteButton.innerHTML = 'Remove Tile';
                        deleteButton.addEventListener('confirm', () => {
                            levelEditorController.removeIndexFromTileParam(objective, gameObjective, childIndex);
                            self.updateObjectiveUI(levelEditorController.level);
                        });
                        const indexDiv = document.createElement('div');
                        indexDiv.setAttribute('class', 'tile-index-param-entry');
                        indexDiv.appendChild(inputField);
                        indexDiv.appendChild(deleteButton);
                        inputParent.appendChild(indexDiv);
                    }
                });
                //Add button and logic to add new indices
                const addTileButton = objectiveDiv.querySelector('#addTileIndex');
                addTileButton === null || addTileButton === void 0 ? void 0 : addTileButton.addEventListener('confirm', () => {
                    const inputParent = objectiveDiv.querySelector('#tileIndexList');
                    if (inputParent) {
                        const children = inputParent.children;
                        const childList = Array.from(children);
                        const childIndex = childList.length;
                        const inputField = document.createElement('ui-input');
                        inputField.setAttribute('id', `tileIndex${childIndex}`);
                        inputField.setAttribute('style', 'width: 200px');
                        inputField.setAttribute('value', '0');
                        inputField === null || inputField === void 0 ? void 0 : inputField.addEventListener('input', (event) => {
                            tilePlacementObjective.tileIndices[childIndex] = +event.target.value;
                        });
                        const deleteButton = document.createElement('ui-button');
                        deleteButton.setAttribute('id', `removeTileIndex${childIndex}`);
                        deleteButton.setAttribute('class', 'red');
                        deleteButton.innerHTML = 'Remove Tile';
                        deleteButton.addEventListener('confirm', () => {
                            levelEditorController.removeIndexFromTileParam(objective, gameObjective, childIndex);
                            self.updateObjectiveUI(levelEditorController.level);
                        });
                        const indexDiv = document.createElement('div');
                        indexDiv.setAttribute('class', 'tile-index-param-entry');
                        tilePlacementObjective.tileIndices.push(0);
                        indexDiv.appendChild(inputField);
                        indexDiv.appendChild(deleteButton);
                        inputParent.appendChild(indexDiv);
                    }
                });
            }
            return objectiveDiv;
        },
        createHandPlayedWithScoreObjectiveDiv(objective) {
            var _a;
            let objectiveDiv = (_a = this.$.handPlayedWithScoreObjectiveTemplate) === null || _a === void 0 ? void 0 : _a.cloneNode(true);
            objectiveDiv.style.display = '';
            let handPlayedWithScoreObjective = objective;
            if (handPlayedWithScoreObjective) {
                const handNameSelect = objectiveDiv.querySelector('#handsPlayedWithScoreObjectiveHandName');
                handNameSelect === null || handNameSelect === void 0 ? void 0 : handNameSelect.setAttribute('value', '' + handPlayedWithScoreObjective.hand);
                handNameSelect === null || handNameSelect === void 0 ? void 0 : handNameSelect.addEventListener('change', (event) => {
                    const handName = LevelEditorController_1.LevelEditorController.StringToHandNameEnum(event.target.value);
                    if (handName) {
                        handPlayedWithScoreObjective.hand = handName;
                    }
                });
                Object.values(HandName_1.HandName).forEach((value) => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    handNameSelect.appendChild(option);
                });
                const scoreElem = objectiveDiv.querySelector('#handsPlayedWithScoreObjectiveScore');
                scoreElem === null || scoreElem === void 0 ? void 0 : scoreElem.setAttribute('value', '' + handPlayedWithScoreObjective.score);
                scoreElem === null || scoreElem === void 0 ? void 0 : scoreElem.addEventListener('input', (event) => {
                    handPlayedWithScoreObjective.score = +event.target.value;
                });
            }
            return objectiveDiv;
        },
        async getAssetPath(assetUrl) {
            var _a;
            let filePath = '';
            try {
                const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', assetUrl);
                filePath = (_a = assetInfo === null || assetInfo === void 0 ? void 0 : assetInfo.file) !== null && _a !== void 0 ? _a : '';
            }
            catch (error) {
                console.error('Error fetching asset URL:', error);
            }
            return filePath;
        },
        onCardDragStart(card, event) {
            var _a;
            const cardData = JSON.stringify(card);
            (_a = event === null || event === void 0 ? void 0 : event.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData('card', cardData);
        },
        onModifierDragStart(boardModifier, event) {
            var _a;
            const modifierData = JSON.stringify(boardModifier);
            (_a = event === null || event === void 0 ? void 0 : event.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData('modifier', modifierData);
        },
        onDrop(x, y, event) {
            var _a, _b;
            console.log(`onDrop ${x}, ${y}`);
            const cardData = (_a = event === null || event === void 0 ? void 0 : event.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData('card');
            const modifierData = (_b = event === null || event === void 0 ? void 0 : event.dataTransfer) === null || _b === void 0 ? void 0 : _b.getData('modifier');
            const boardIndex = this.boardCoordsToBoardIndex(x, y);
            if (cardData) {
                const value = JSON.parse(cardData);
                const card = Card_1.Card.fromObject(value);
                levelEditorController.addBoardCardPlacement(card, boardIndex);
                this.updateStartingBoardUI(levelEditorController.level);
            }
            else if (modifierData) {
                const value = JSON.parse(modifierData);
                const modifier = BoardModifier_1.BoardModifier.fromObject(value);
                console.log(`dropped modifier = `, modifier);
            }
        },
        boardCoordsToBoardIndex(x, y) {
            return x + y * 13;
        },
        boardIndexToBoardCoords(index) {
            const x = index % 13;
            const y = Math.floor(index / 13);
            return { x, y };
        },
        setCardSprite(cardImage, card) {
            switch (card.type) {
                case Card_1.CardType.Joker:
                    cardImage.setAttribute('value', JOKER_SPRITE);
                    break;
                case Card_1.CardType.Wild:
                    cardImage.setAttribute('value', WILD_SPRITE);
                    break;
                case Card_1.CardType.Regular:
                    cardImage.setAttribute('value', SUIT_SPRITES[card.suit]);
                    break;
            }
        }
    },
    async ready() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        await this.updateLevelList(true, currentLevelNameFilter);
        this.updateLevelUI();
        this.$.nameFilter.addEventListener('input', (event) => {
            currentLevelNameFilter = event.target.value;
            this.updateLevelList(false, currentLevelNameFilter);
        });
        this.$.levelName.addEventListener('input', (event) => {
            levelEditorController.setName(event.target.value);
            this.updateLevelUI();
        });
        this.$.levelPath.addEventListener('input', (event) => {
            levelEditorController.setRelativePathOverride(event.target.value);
            this.updateLevelUI();
        });
        this.$.levelDescription.addEventListener('input', (event) => {
            levelEditorController.setDescription(event.target.value);
            this.updateLevelUI();
        });
        (_a = this.$.deckType) === null || _a === void 0 ? void 0 : _a.addEventListener('change', (event) => {
            levelEditorController.setDeckType(event.target.value);
            this.updateLevelUI();
        });
        (_b = this.$.boosterTypeSelect) === null || _b === void 0 ? void 0 : _b.addEventListener('change', (event) => {
            levelEditorController.setFreeBooster(event.target.value);
            this.updateLevelUI();
        });
        (_c = this.$.powerupTypeSelect) === null || _c === void 0 ? void 0 : _c.addEventListener('change', (event) => {
            levelEditorController.setFreePowerup(event.target.value);
            this.updateLevelUI();
        });
        (_d = this.$.allCardsButton) === null || _d === void 0 ? void 0 : _d.addEventListener('confirm', () => {
            levelEditorController.filterCustomDeck(() => true);
            this.updateLevelUI();
        });
        (_e = this.$.noCardsButton) === null || _e === void 0 ? void 0 : _e.addEventListener('confirm', () => {
            levelEditorController.filterCustomDeck(() => false);
            this.updateLevelUI();
        });
        (_f = this.$.clubsOnlyButton) === null || _f === void 0 ? void 0 : _f.addEventListener('confirm', () => {
            levelEditorController.filterCustomDeck((c) => c.suit == 1 && c.rank > 0);
            this.updateLevelUI();
        });
        (_g = this.$.diamondsOnlyButton) === null || _g === void 0 ? void 0 : _g.addEventListener('confirm', () => {
            levelEditorController.filterCustomDeck((c) => c.suit == 2 && c.rank > 0);
            this.updateLevelUI();
        });
        (_h = this.$.heartsOnlyButton) === null || _h === void 0 ? void 0 : _h.addEventListener('confirm', () => {
            levelEditorController.filterCustomDeck((c) => c.suit == 3 && c.rank > 0);
            this.updateLevelUI();
        });
        (_j = this.$.spadesOnlyButton) === null || _j === void 0 ? void 0 : _j.addEventListener('confirm', () => {
            levelEditorController.filterCustomDeck((c) => c.suit == 4 && c.rank > 0);
            this.updateLevelUI();
        });
        (_k = this.$.lowToHighSortButton) === null || _k === void 0 ? void 0 : _k.addEventListener('confirm', () => {
            levelEditorController.sortCustomDeck((c1, c2) => 100 * (c1.suit - c2.suit) + (c1.rank - c2.rank));
            this.updateLevelUI();
        });
        (_l = this.$.highToLowSortButton) === null || _l === void 0 ? void 0 : _l.addEventListener('confirm', () => {
            levelEditorController.sortCustomDeck((c2, c1) => 100 * (c1.suit - c2.suit) + (c1.rank - c2.rank));
            this.updateLevelUI();
        });
        (_m = this.$.shuffleDeckButton) === null || _m === void 0 ? void 0 : _m.addEventListener('confirm', () => {
            levelEditorController.shuffleCustomDeck();
            this.updateLevelUI();
        });
        this.$.refreshLevelList.addEventListener('confirm', () => {
            this.updateLevelList(true, currentLevelNameFilter);
        });
        this.$.reserializeAll.addEventListener('confirm', () => {
            this.reserializeAllLevels();
        });
        this.$.newButton.addEventListener('confirm', () => {
            this.createNewLevel();
        });
        this.$.saveButton.addEventListener('confirm', () => {
            this.saveLevel();
        });
        this.$.deleteButton.addEventListener('confirm', () => {
            this.deleteLevel();
        });
        this.$.playTestButton.addEventListener('confirm', () => {
            this.setTestPlayLevel();
        });
        this.$.stopTestButton.addEventListener('confirm', () => {
            this.clearTestPlayLevel();
        });
        this.$.addObjectiveButton.addEventListener('confirm', () => {
            levelEditorController.addObjective();
            this.updateObjectiveUI(levelEditorController.level);
        });
        this.$.resetObjectivesButton.addEventListener('confirm', () => {
            levelEditorController.resetObjectives();
            this.updateObjectiveUI(levelEditorController.level);
        });
        this.$.removeAllCardsFromBoard.addEventListener('confirm', () => {
            levelEditorController.clearBoard();
            this.updateStartingBoardUI(levelEditorController.level);
        });
        this.$.placeAnchorTile.addEventListener('change', (event) => {
            levelEditorController.setAnchorPlaced(event.target.value === 'true' ? true : false);
        });
        this.$.addModifierButton.addEventListener('confirm', () => {
            const modifierType = LevelEditorController_1.LevelEditorController.StringToBoardModifierType(this.$.modifierTypeSelect.value);
            const newModifier = BoardModifier_1.BoardModifier.fromObject({ type: modifierType });
            levelEditorController.addBoardModifierAtIndex(currentGridTileIndex, new BoardModifier_1.BoardModifier(modifierType));
            this.updateStartingBoardUI(levelEditorController.level);
        });
        this.$.modifierClearAllButton.addEventListener('click', () => {
            currentBoardModifierBrush = null;
            levelEditorController.removeAllBoardModifiers();
            this.updateStartingBoardUI(levelEditorController.level);
        });
        this.$.boardVisibilityShowCards.addEventListener('change', (event) => {
            const value = event.target.value;
            boardVisibilityShowCards = typeof value === 'boolean' ? value : value === 'true';
            this.updateStartingBoardUI(levelEditorController.level);
        });
        this.$.boardVisibilityShowModifiers.addEventListener('change', (event) => {
            const value = event.target.value;
            boardVisibilityShowModifiers = typeof value === 'boolean' ? value : value === 'true';
            this.updateStartingBoardUI(levelEditorController.level);
        });
        this.$.boardVisibilityShowGridIndices.addEventListener('change', (event) => {
            const value = event.target.value;
            boardVisibilityShowGridIndices = typeof value === 'boolean' ? value : value === 'true';
            this.updateStartingBoardUI(levelEditorController.level);
        });
    },
    beforeClose() { },
    close() { }
});
