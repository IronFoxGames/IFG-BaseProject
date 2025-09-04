"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelEditorController = void 0;
const fs_extra_1 = require("fs-extra");
const DeckType_1 = require("../../enums/DeckType");
const HandName_1 = require("../../enums/HandName");
const ObjectiveType_1 = require("../../enums/ObjectiveType");
const Card_1 = require("../../models/Card");
const GameObjective_1 = require("../../models/GameObjective");
const GameConfig_1 = require("../../models/GameConfig");
const CardPlacement_1 = require("../../models/CardPlacement");
const ObjectiveParams_1 = require("../../models/ObjectiveParams");
const BoardModifierType_1 = require("../../enums/BoardModifierType");
const BoardModifier_1 = require("../../models/BoardModifier");
const BoardModifierPlacement_1 = require("../../models/BoardModifierPlacement");
class LevelEditorController {
    get level() {
        return this._currentLevel;
    }
    get asset() {
        return this._currentLevelAsset;
    }
    get levelRelativePath() {
        if (this._currentLevelAssetPathOverride != null) {
            return this._currentLevelAssetPathOverride;
        }
        return this._relativePathFromAsset();
    }
    get allCards() {
        return this._allCards;
    }
    get allBoardCards() {
        return this._boardCards;
    }
    constructor() {
        this._currentLevel = null;
        this._currentLevelAsset = null;
        this._currentLevelAssetPathOverride = null;
        this._isDirty = false;
        this._allCards = [];
        this._boardCards = [];
        this._reset;
        // Build list of all cards:
        for (let suit = 1; suit <= 4; ++suit) {
            for (let rank = 1; rank <= 13; ++rank) {
                this._allCards.push(new Card_1.Card(rank, suit));
            }
        }
        // 2 jokers
        this._allCards.push(new Card_1.Card(0, 0, Card_1.CardType.Joker));
        this._allCards.push(new Card_1.Card(0, 1, Card_1.CardType.Joker));
        // Build list of all board cards (52 + wild)
        for (let suit = 1; suit <= 4; ++suit) {
            for (let rank = 1; rank <= 13; ++rank) {
                this._boardCards.push(new Card_1.Card(rank, suit));
            }
        }
        this._boardCards.push(new Card_1.Card(Card_1.Card.Wild));
    }
    isLevelLoaded() {
        return this._currentLevel != null;
    }
    isDirty() {
        return this._isDirty;
    }
    isMoveOnNextSave() {
        if (this._currentLevel == null || this._currentLevelAsset == null) {
            return false;
        }
        const pathChanged = this._currentLevelAssetPathOverride != null && this._currentLevelAssetPathOverride !== this._relativePathFromAsset();
        const nameChanged = this._currentLevelAsset.name !== `${this._currentLevel.name}.json`;
        return pathChanged || nameChanged;
    }
    createNewLevel() {
        this._currentLevel = new GameConfig_1.GameConfig();
        this._currentLevel.name = 'New level';
        this._currentLevel.description = 'New level description';
        this._currentLevel.objectives = [];
        this._currentLevelAsset = null;
        this._currentLevelAssetPathOverride = null;
        this._isDirty = true;
        return this._currentLevel;
    }
    async loadLevel(assetInfo) {
        try {
            const levelData = await (0, fs_extra_1.readJson)(assetInfo.file);
            const level = GameConfig_1.GameConfig.fromObject(levelData);
            if (level == null) {
                console.error(`Failed to load level.`);
            }
            // Data patch: any board placements of jokers now become wilds
            level.startingBoard.forEach((cp) => {
                if (cp.card && cp.card.rank === 0) {
                    cp.card.type = Card_1.CardType.Wild;
                }
            });
            // Patch jokers (each joker given unique suit to identify them as we drag and drop,
            // but in serialized form they are all suit 0).
            let jokerSuit = 0;
            level.customDeck = level.customDeck.map((card) => {
                if (card.rank === 0 && card.suit === 0) {
                    card.type = Card_1.CardType.Joker;
                    card.suit = jokerSuit;
                    jokerSuit++;
                }
                return card;
            });
            this._isDirty = false;
            this._currentLevel = level;
            this._currentLevelAsset = assetInfo;
            this._currentLevelAssetPathOverride = null;
            return this._currentLevel;
        }
        catch (error) {
            console.error(`Failed to load level with error: `, error);
            this._reset();
        }
        return null;
    }
    getLevelForSave() {
        if (this._currentLevel == null) {
            return null;
        }
        // Deep clone (probably a faster way to do this)
        let levelSaveObject = JSON.parse(JSON.stringify(this._currentLevel));
        // Patch jokers (each joker given unique suit to identify them as we drag and drop,
        // but in serialized form they are all suit 0).
        levelSaveObject.customDeck = levelSaveObject.customDeck.map((card) => {
            if (card.rank === 0) {
                card.suit = 0;
                card.type = Card_1.CardType.Joker;
            }
            return card;
        });
        // If using default deck; clear custom deck data
        if (levelSaveObject.deckType == DeckType_1.DeckType.Default) {
            levelSaveObject.customDeck = [];
        }
        // Original card is not needed in serialized data and just bloats data; so clean up
        levelSaveObject.startingBoard.forEach((cp) => {
            delete cp.originalCard;
        });
        return levelSaveObject;
    }
    setName(name) {
        if (this._currentLevel == null) {
            console.error('trying to set name, but level is not not loaded');
            return;
        }
        this._currentLevel.name = name;
        this._isDirty = true;
    }
    setRelativePathOverride(path) {
        if (this._currentLevel == null) {
            console.error('trying to set description, but level is not not loaded');
            return;
        }
        this._currentLevelAssetPathOverride = path;
        this._isDirty = true;
    }
    setDescription(desc) {
        if (this._currentLevel == null) {
            console.error('trying to set description, but level is not not loaded');
            return;
        }
        this._currentLevel.description = desc;
        this._isDirty = true;
    }
    setFreeBooster(boosterType) {
        if (this._currentLevel == null) {
            console.error('trying to set free booster, but level is not not loaded');
            return;
        }
        this._currentLevel.freeBooster = boosterType;
        this._isDirty = true;
    }
    setFreePowerup(powerupType) {
        if (this._currentLevel == null) {
            console.error('trying to set free booster, but level is not not loaded');
            return;
        }
        this._currentLevel.freePowerup = powerupType;
        this._isDirty = true;
    }
    setAssetInfo(assetInfo) {
        this._currentLevelAsset = assetInfo;
    }
    setAnchorPlaced(placeAnchor) {
        if (this._currentLevel == null) {
            console.error('trying to set anchor placed, but level is not not loaded');
            return;
        }
        this._currentLevel.placeAnchor = placeAnchor;
    }
    setDeckType(type) {
        if (this._currentLevel == null) {
            console.error('trying to set deck type, but level is not not loaded');
            return;
        }
        const deckType = LevelEditorController.StringToDeckTypeEnum(type);
        if (deckType == null) {
            console.error('unknown deck type', type);
            return;
        }
        this._currentLevel.deckType = deckType;
    }
    toggleCardInCustomDeck(card) {
        if (this._currentLevel == null) {
            return;
        }
        if (this.customDeckContainsCard(card)) {
            // Remove it
            this._currentLevel.customDeck = this._currentLevel.customDeck.filter((c) => c !== card);
            this._isDirty = true;
        }
        else {
            // Add it
            this._currentLevel.customDeck.push(card);
            this._isDirty = true;
        }
    }
    filterCustomDeck(predicate) {
        if (this._currentLevel == null) {
            return;
        }
        this._currentLevel.customDeck = [];
        this._currentLevel.customDeck = this._allCards.filter(predicate);
    }
    sortCustomDeck(comparator) {
        if (this._currentLevel == null) {
            return;
        }
        this._currentLevel.customDeck.sort(comparator);
    }
    shuffleCustomDeck() {
        if (this._currentLevel == null) {
            return;
        }
        for (let i = this._currentLevel.customDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._currentLevel.customDeck[i], this._currentLevel.customDeck[j]] = [
                this._currentLevel.customDeck[j],
                this._currentLevel.customDeck[i]
            ];
        }
    }
    customDeckContainsCard(card) {
        if (this._currentLevel == null) {
            return false;
        }
        if (this._currentLevel.customDeck.find((c) => card.equals(c)) != null) {
            return true;
        }
        return false;
    }
    addObjective() {
        if (this._currentLevel == null) {
            return false;
        }
        this._currentLevel.objectives.push(new GameObjective_1.GameObjective());
    }
    removeObjective(objective) {
        if (this._currentLevel == null) {
            return;
        }
        const index = this._currentLevel.objectives.findIndex((obj) => objective.equals(obj));
        if (index !== -1) {
            this._currentLevel.objectives.splice(index, 1);
        }
    }
    addObjectiveParam(gameObjective) {
        var _a;
        if (this._currentLevel == null) {
            return false;
        }
        const objectiveIndex = this._currentLevel.objectives.findIndex((o) => o.equals(gameObjective));
        if (objectiveIndex !== -1) {
            (_a = this._currentLevel.objectives[objectiveIndex].objectiveDataList) === null || _a === void 0 ? void 0 : _a.push(new ObjectiveParams_1.ObjectiveParams());
        }
    }
    removeObjectiveParam(param, objective) {
        var _a, _b;
        if (this._currentLevel == null) {
            return;
        }
        const index = this._currentLevel.objectives.indexOf(objective);
        if (index !== -1) {
            const newIndex = (_a = this._currentLevel.objectives[index].objectiveDataList) === null || _a === void 0 ? void 0 : _a.findIndex((parameter) => parameter === null || parameter === void 0 ? void 0 : parameter.equals(param));
            if (newIndex !== -1) {
                (_b = this._currentLevel.objectives[index].objectiveDataList) === null || _b === void 0 ? void 0 : _b.splice(newIndex, 1);
            }
        }
    }
    removeIndexFromTileParam(param, objective, index) {
        if (this._currentLevel == null) {
            return;
        }
        const objIndex = this._currentLevel.objectives.indexOf(objective);
        let paramList = null;
        if (objIndex !== -1) {
            paramList = this._currentLevel.objectives[objIndex].objectiveDataList;
        }
        if (paramList) {
            const paramIndex = paramList.indexOf(param);
            if (paramIndex !== -1) {
                let tileParam = paramList[paramIndex];
                tileParam.tileIndices.splice(index, 1);
            }
        }
    }
    resetObjectives() {
        if (this._currentLevel == null) {
            return;
        }
        this._currentLevel.objectives = [];
    }
    getCardPlacementAtIndex(index) {
        var _a;
        if (this._currentLevel == null) {
            return null;
        }
        const cardPlacement = this._currentLevel.startingBoard.find((cp) => cp.boardIndex === index);
        return (_a = cardPlacement === null || cardPlacement === void 0 ? void 0 : cardPlacement.card) !== null && _a !== void 0 ? _a : null;
    }
    addBoardCardPlacement(card, index) {
        if (this._currentLevel == null) {
            return;
        }
        this._currentLevel.startingBoard.push(new CardPlacement_1.CardPlacement(index, card));
    }
    removeBoardCardPlacement(index) {
        if (this._currentLevel == null) {
            return;
        }
        this._currentLevel.startingBoard = this._currentLevel.startingBoard.filter((cp) => cp.boardIndex !== index);
    }
    clearBoard() {
        if (this._currentLevel == null) {
            return;
        }
        this._currentLevel.startingBoard = [];
    }
    removeAllBoardModifiers() {
        if (this._currentLevel == null) {
            return;
        }
        this._currentLevel.boardModifierPlacements = [];
    }
    removeAllBoardModifiersAtIndex(index) {
        if (this._currentLevel == null) {
            return;
        }
        this._currentLevel.boardModifierPlacements = this._currentLevel.boardModifierPlacements.filter((x) => x.boardIndex != index);
    }
    hasBoardModifierAtIndex(index, boardModifier) {
        const modifiersAtIndex = this.getBoardModifiersAtIndex(index);
        return modifiersAtIndex.some((modifier) => modifier.type === boardModifier.type);
    }
    getBoardModifiersAtIndex(index) {
        let modifiers = [];
        if (this._currentLevel == null) {
            return modifiers;
        }
        modifiers = this._currentLevel.boardModifierPlacements.filter((x) => x.boardIndex == index).map((placement) => placement.modifier);
        return modifiers;
    }
    addBoardModifierAtIndex(index, boardModifier) {
        if (this._currentLevel == null || index < 0) {
            return;
        }
        // Preserve sub-type by doing a deep copy:
        const serialized = JSON.stringify(boardModifier);
        const deserialized = BoardModifier_1.BoardModifier.fromObject(JSON.parse(serialized));
        this._currentLevel.boardModifierPlacements.push(new BoardModifierPlacement_1.BoardModifierPlacement(index, deserialized));
    }
    removeBoardModifierAtIndex(index, boardModifier) {
        if (this._currentLevel == null || index < 0) {
            return;
        }
        // Remove the first matching instance at the given board index
        let matchFound = false;
        this._currentLevel.boardModifierPlacements = this._currentLevel.boardModifierPlacements.filter((bmp) => {
            if (!matchFound && bmp.boardIndex === index && bmp.modifier.equals(boardModifier)) {
                matchFound = true;
                return false;
            }
            return true;
        });
    }
    updateModifierAtIndex(index, updatedModifier) {
        if (this._currentLevel == null || index < 0) {
            return;
        }
        // Update the first matching instance at the given board index
        let matchFound = false;
        this._currentLevel.boardModifierPlacements = this._currentLevel.boardModifierPlacements.map((bmp) => {
            if (!matchFound && bmp.boardIndex === index && bmp.modifier.equals(updatedModifier)) {
                matchFound = true;
                return Object.assign(Object.assign({}, bmp), { modifier: updatedModifier });
            }
            return bmp;
        });
        console.log(`updated modifiers`, this._currentLevel.boardModifierPlacements);
    }
    _reset() {
        this._isDirty = false;
        this._currentLevel = null;
        this._currentLevelAsset = null;
        this._currentLevelAssetPathOverride = null;
    }
    _relativePathFromAsset() {
        if (!this._currentLevelAsset) {
            return '';
        }
        let relativePath = this._currentLevelAsset.path;
        relativePath = relativePath.replace('db://assets/resources/levels/', '');
        relativePath = relativePath.substring(0, relativePath.lastIndexOf('/'));
        return relativePath;
    }
    static StringToDeckTypeEnum(value) {
        return DeckType_1.DeckType[value];
    }
    static StringToObjectiveTypeEnum(value) {
        return ObjectiveType_1.ObjectiveType[value];
    }
    static StringToHandNameEnum(value) {
        return HandName_1.HandName[value];
    }
    static StringToBoardModifierType(value) {
        return BoardModifierType_1.BoardModifierType[value];
    }
}
exports.LevelEditorController = LevelEditorController;
