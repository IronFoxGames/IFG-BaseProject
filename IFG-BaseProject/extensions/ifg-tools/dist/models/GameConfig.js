"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameConfig = void 0;
const GameObjective_1 = require("./GameObjective");
const Card_1 = require("./Card");
const DeckType_1 = require("../enums/DeckType");
const CardPlacement_1 = require("./CardPlacement");
const BoardModifierPlacement_1 = require("./BoardModifierPlacement");
const BoosterType_1 = require("../enums/BoosterType");
const LevelDifficulty_1 = require("../enums/LevelDifficulty");
class GameConfig {
    constructor() {
        this.name = '';
        this.description = '';
        this.difficulty = LevelDifficulty_1.LevelDifficulty.Normal;
        this.handSize = GameConfig.DEFAULT_HAND_SIZE;
        this.hasBot = false;
        this.placeAnchor = true;
        this.objectives = [];
        this.deckType = DeckType_1.DeckType.Default;
        this.customDeck = [];
        this.startingBoard = [];
        this.boardModifierPlacements = [];
        this.freeBooster = BoosterType_1.BoosterType.None;
        this.freePowerup = BoosterType_1.PowerupType.None;
        this.appliedBoosters = [];
        // Grid specials
        this.gridSpecialsEnabled = false;
        this.gridSpecialsHidden = false;
    }
    static fromObject(obj) {
        console.log(`CSB: from object: `, obj);
        const config = new GameConfig();
        config.name = obj.name;
        config.description = obj.description;
        config.difficulty = Object.values(LevelDifficulty_1.LevelDifficulty).includes(obj.difficulty)
            ? obj.difficulty
            : LevelDifficulty_1.LevelDifficulty.Normal;
        config.placeAnchor = obj.placeAnchor;
        config.deckType = obj.deckType;
        config.handSize = obj.handSize || GameConfig.DEFAULT_HAND_SIZE;
        config.gridSpecialsEnabled = obj.gridSpecialsEnabled;
        config.gridSpecialsHidden = obj.gridSpecialsHidden;
        config.freeBooster = obj.freeBooster;
        config.freePowerup = obj.freePowerup;
        if (Array.isArray(obj.objectives)) {
            config.objectives = obj.objectives.map((o) => GameObjective_1.GameObjective.fromObject(o));
        }
        if (Array.isArray(obj.customDeck)) {
            config.customDeck = obj.customDeck.map((c) => Card_1.Card.fromObject(c));
        }
        if (Array.isArray(obj.startingBoard)) {
            config.startingBoard = obj.startingBoard.map((cp) => CardPlacement_1.CardPlacement.fromObject(cp));
        }
        if (Array.isArray(obj.boardModifierPlacements)) {
            config.boardModifierPlacements = obj.boardModifierPlacements.map((bmp) => BoardModifierPlacement_1.BoardModifierPlacement.fromObject(bmp));
        }
        if (Array.isArray(obj.appliedBoosters)) {
            config.appliedBoosters = [];
            obj.appliedBoosters.forEach((booster) => {
                if (Object.values(BoosterType_1.BoosterType).includes(booster)) {
                    config.appliedBoosters.push(booster);
                }
                else {
                    throw new Error(`Given BoosterType is not valid: ${booster}`);
                }
            });
        }
        return config;
    }
}
exports.GameConfig = GameConfig;
GameConfig.DEFAULT_HAND_SIZE = 7;
