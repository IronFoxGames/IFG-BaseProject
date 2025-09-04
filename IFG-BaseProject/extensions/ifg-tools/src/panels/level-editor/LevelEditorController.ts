import { readJson } from 'fs-extra';

import { DeckType } from '../../enums/DeckType';
import { HandName } from '../../enums/HandName';
import { ObjectiveType } from '../../enums/ObjectiveType';
import { Card, CardType } from '../../models/Card';
import { GameObjective } from '../../models/GameObjective';
import { GameConfig } from '../../models/GameConfig';
import { CardPlacement } from '../../models/CardPlacement';
import { CardPlayedObjectiveParams, ObjectiveParams, TilePlacedObjectiveParams } from '../../models/ObjectiveParams';
import { BoardModifierType } from '../../enums/BoardModifierType';
import { BoardModifier } from '../../models/BoardModifier';
import { BoardModifierPlacement } from '../../models/BoardModifierPlacement';
import { AssetInfo } from '../../../@types/packages/asset-db/@types/public';
import { BoosterType, PowerupType } from '../../enums/BoosterType';

export class LevelEditorController {
    private _currentLevel: GameConfig | null = null;
    private _currentLevelAsset: AssetInfo | null = null;
    private _currentLevelAssetPathOverride: string | null = null;
    private _isDirty: boolean = false;
    private _allCards: Card[] = [];
    private _boardCards: Card[] = [];

    public get level(): GameConfig | null {
        return this._currentLevel;
    }

    public get asset(): AssetInfo | null {
        return this._currentLevelAsset;
    }

    public get levelRelativePath(): string {
        if (this._currentLevelAssetPathOverride != null) {
            return this._currentLevelAssetPathOverride;
        }

        return this._relativePathFromAsset();
    }

    public get allCards(): Card[] {
        return this._allCards;
    }

    public get allBoardCards(): Card[] {
        return this._boardCards;
    }

    constructor() {
        this._reset;

        // Build list of all cards:
        for (let suit = 1; suit <= 4; ++suit) {
            for (let rank = 1; rank <= 13; ++rank) {
                this._allCards.push(new Card(rank, suit));
            }
        }
        // 2 jokers
        this._allCards.push(new Card(0, 0, CardType.Joker));
        this._allCards.push(new Card(0, 1, CardType.Joker));

        // Build list of all board cards (52 + wild)
        for (let suit = 1; suit <= 4; ++suit) {
            for (let rank = 1; rank <= 13; ++rank) {
                this._boardCards.push(new Card(rank, suit));
            }
        }
        this._boardCards.push(new Card(Card.Wild));
    }

    public isLevelLoaded(): boolean {
        return this._currentLevel != null;
    }

    public isDirty(): boolean {
        return this._isDirty;
    }

    public isMoveOnNextSave(): boolean {
        if (this._currentLevel == null || this._currentLevelAsset == null) {
            return false;
        }

        const pathChanged = this._currentLevelAssetPathOverride != null && this._currentLevelAssetPathOverride !== this._relativePathFromAsset();
        const nameChanged = this._currentLevelAsset.name !== `${this._currentLevel.name}.json`;
        return pathChanged || nameChanged;
    }

    public createNewLevel(): GameConfig {
        this._currentLevel = new GameConfig();
        this._currentLevel.name = 'New level';
        this._currentLevel.description = 'New level description';
        this._currentLevel.objectives = [];

        this._currentLevelAsset = null;
        this._currentLevelAssetPathOverride = null;

        this._isDirty = true;
        return this._currentLevel;
    }

    public async loadLevel(assetInfo: AssetInfo): Promise<GameConfig | null> {
        try {
            const levelData = await readJson(assetInfo.file);

            const level = GameConfig.fromObject(levelData);

            if (level == null) {
                console.error(`Failed to load level.`);
            }

            // Data patch: any board placements of jokers now become wilds
            level.startingBoard.forEach((cp) => {
                if (cp.card && cp.card.rank === 0) {
                    cp.card.type = CardType.Wild;
                }
            });

            // Patch jokers (each joker given unique suit to identify them as we drag and drop,
            // but in serialized form they are all suit 0).
            let jokerSuit = 0;
            level.customDeck = level.customDeck.map((card) => {
                if (card.rank === 0 && card.suit === 0) {
                    card.type = CardType.Joker;
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
        } catch (error) {
            console.error(`Failed to load level with error: `, error);
            this._reset();
        }

        return null;
    }

    public getLevelForSave(): GameConfig | null {
        if (this._currentLevel == null) {
            return null;
        }

        // Deep clone (probably a faster way to do this)
        let levelSaveObject = JSON.parse(JSON.stringify(this._currentLevel)) as GameConfig;

        // Patch jokers (each joker given unique suit to identify them as we drag and drop,
        // but in serialized form they are all suit 0).
        levelSaveObject.customDeck = levelSaveObject.customDeck.map((card) => {
            if (card.rank === 0) {
                card.suit = 0;
                card.type = CardType.Joker;
            }
            return card;
        });

        // If using default deck; clear custom deck data
        if (levelSaveObject.deckType == DeckType.Default) {
            levelSaveObject.customDeck = [];
        }

        // Original card is not needed in serialized data and just bloats data; so clean up
        levelSaveObject.startingBoard.forEach((cp) => {
            delete cp.originalCard;
        });

        return levelSaveObject;
    }

    public setName(name: string) {
        if (this._currentLevel == null) {
            console.error('trying to set name, but level is not not loaded');
            return;
        }

        this._currentLevel.name = name;
        this._isDirty = true;
    }

    public setRelativePathOverride(path: string) {
        if (this._currentLevel == null) {
            console.error('trying to set description, but level is not not loaded');
            return;
        }

        this._currentLevelAssetPathOverride = path;
        this._isDirty = true;
    }

    public setDescription(desc: string) {
        if (this._currentLevel == null) {
            console.error('trying to set description, but level is not not loaded');
            return;
        }

        this._currentLevel.description = desc;
        this._isDirty = true;
    }

    public setFreeBooster(boosterType: BoosterType) {
        if (this._currentLevel == null) {
            console.error('trying to set free booster, but level is not not loaded');
            return;
        }

        this._currentLevel.freeBooster = boosterType;
        this._isDirty = true;
    }

    public setFreePowerup(powerupType: PowerupType) {
        if (this._currentLevel == null) {
            console.error('trying to set free booster, but level is not not loaded');
            return;
        }

        this._currentLevel.freePowerup = powerupType;
        this._isDirty = true;
    }

    public setAssetInfo(assetInfo: AssetInfo) {
        this._currentLevelAsset = assetInfo;
    }

    public setAnchorPlaced(placeAnchor: boolean) {
        if (this._currentLevel == null) {
            console.error('trying to set anchor placed, but level is not not loaded');
            return;
        }

        this._currentLevel.placeAnchor = placeAnchor;
    }

    public setDeckType(type: string) {
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

    public toggleCardInCustomDeck(card: Card) {
        if (this._currentLevel == null) {
            return;
        }

        if (this.customDeckContainsCard(card)) {
            // Remove it
            this._currentLevel.customDeck = this._currentLevel.customDeck.filter((c) => c !== card);
            this._isDirty = true;
        } else {
            // Add it
            this._currentLevel.customDeck.push(card);
            this._isDirty = true;
        }
    }

    public filterCustomDeck(predicate: (card: Card) => boolean) {
        if (this._currentLevel == null) {
            return;
        }

        this._currentLevel.customDeck = [];
        this._currentLevel.customDeck = this._allCards.filter(predicate);
    }

    public sortCustomDeck(comparator: (a: Card, b: Card) => number) {
        if (this._currentLevel == null) {
            return;
        }

        this._currentLevel.customDeck.sort(comparator);
    }

    public shuffleCustomDeck() {
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

    public customDeckContainsCard(card: Card) {
        if (this._currentLevel == null) {
            return false;
        }

        if (this._currentLevel.customDeck.find((c) => card.equals(c)) != null) {
            return true;
        }

        return false;
    }

    public addObjective() {
        if (this._currentLevel == null) {
            return false;
        }

        this._currentLevel.objectives.push(new GameObjective());
    }

    public removeObjective(objective: GameObjective) {
        if (this._currentLevel == null) {
            return;
        }

        const index = this._currentLevel.objectives.findIndex((obj: GameObjective) => objective.equals(obj));
        if (index !== -1) {
            this._currentLevel.objectives.splice(index, 1);
        }
    }

    public addObjectiveParam(gameObjective: GameObjective) {
        if (this._currentLevel == null) {
            return false;
        }

        const objectiveIndex = this._currentLevel.objectives.findIndex((o) => o.equals(gameObjective));

        if (objectiveIndex !== -1) {
            this._currentLevel.objectives[objectiveIndex].objectiveDataList?.push(new ObjectiveParams());
        }
    }

    public removeObjectiveParam(param: ObjectiveParams, objective: GameObjective) {
        if (this._currentLevel == null) {
            return;
        }

        const index = this._currentLevel.objectives.indexOf(objective);

        if (index !== -1) {
            const newIndex = this._currentLevel.objectives[index].objectiveDataList?.findIndex((parameter: ObjectiveParams) =>
                parameter?.equals(param)
            );

            if (newIndex !== -1) {
                this._currentLevel.objectives[index].objectiveDataList?.splice(newIndex!, 1);
            }
        }
    }

    public removeIndexFromTileParam(param: ObjectiveParams, objective: GameObjective, index: number) {
        if (this._currentLevel == null) {
            return;
        }

        const objIndex = this._currentLevel.objectives.indexOf(objective);
        let paramList: ObjectiveParams[] | null = null;

        if (objIndex !== -1) {
            paramList = this._currentLevel.objectives[objIndex].objectiveDataList;
        }

        if (paramList) {
            const paramIndex = paramList.indexOf(param);

            if (paramIndex !== -1) {
                let tileParam = paramList[paramIndex] as TilePlacedObjectiveParams;
                tileParam.tileIndices.splice(index, 1);
            }
        }
    }

    public resetObjectives() {
        if (this._currentLevel == null) {
            return;
        }

        this._currentLevel.objectives = [];
    }

    public getCardPlacementAtIndex(index: number): Card | null {
        if (this._currentLevel == null) {
            return null;
        }

        const cardPlacement = this._currentLevel.startingBoard.find((cp) => cp.boardIndex === index);
        return cardPlacement?.card ?? null;
    }

    public addBoardCardPlacement(card: Card, index: number) {
        if (this._currentLevel == null) {
            return;
        }

        this._currentLevel.startingBoard.push(new CardPlacement(index, card));
    }

    public removeBoardCardPlacement(index: number) {
        if (this._currentLevel == null) {
            return;
        }

        this._currentLevel.startingBoard = this._currentLevel.startingBoard.filter((cp: CardPlacement) => cp.boardIndex !== index);
    }

    public clearBoard() {
        if (this._currentLevel == null) {
            return;
        }
        this._currentLevel.startingBoard = [];
    }

    public removeAllBoardModifiers() {
        if (this._currentLevel == null) {
            return;
        }
        this._currentLevel.boardModifierPlacements = [];
    }

    public removeAllBoardModifiersAtIndex(index: number) {
        if (this._currentLevel == null) {
            return;
        }
        this._currentLevel.boardModifierPlacements = this._currentLevel.boardModifierPlacements.filter((x) => x.boardIndex != index);
    }

    public hasBoardModifierAtIndex(index: number, boardModifier: BoardModifier): boolean {
        const modifiersAtIndex = this.getBoardModifiersAtIndex(index);
        return modifiersAtIndex.some((modifier) => modifier.type === boardModifier.type);
    }

    public getBoardModifiersAtIndex(index: number): BoardModifier[] {
        let modifiers: BoardModifier[] = [];
        if (this._currentLevel == null) {
            return modifiers;
        }

        modifiers = this._currentLevel.boardModifierPlacements.filter((x) => x.boardIndex == index).map((placement) => placement.modifier);
        return modifiers;
    }

    public addBoardModifierAtIndex(index: number, boardModifier: BoardModifier) {
        if (this._currentLevel == null || index < 0) {
            return;
        }

        // Preserve sub-type by doing a deep copy:
        const serialized = JSON.stringify(boardModifier);
        const deserialized = BoardModifier.fromObject(JSON.parse(serialized));

        this._currentLevel.boardModifierPlacements.push(new BoardModifierPlacement(index, deserialized));
    }

    public removeBoardModifierAtIndex(index: number, boardModifier: BoardModifier) {
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

    public updateModifierAtIndex(index: number, updatedModifier: BoardModifier) {
        if (this._currentLevel == null || index < 0) {
            return;
        }

        // Update the first matching instance at the given board index
        let matchFound = false;
        this._currentLevel.boardModifierPlacements = this._currentLevel.boardModifierPlacements.map((bmp) => {
            if (!matchFound && bmp.boardIndex === index && bmp.modifier.equals(updatedModifier)) {
                matchFound = true;
                return {
                    ...bmp,
                    modifier: updatedModifier
                };
            }
            return bmp;
        });

        console.log(`updated modifiers`, this._currentLevel.boardModifierPlacements);
    }

    private _reset() {
        this._isDirty = false;
        this._currentLevel = null;
        this._currentLevelAsset = null;
        this._currentLevelAssetPathOverride = null;
    }

    private _relativePathFromAsset() {
        if (!this._currentLevelAsset) {
            return '';
        }

        let relativePath = this._currentLevelAsset.path;
        relativePath = relativePath.replace('db://assets/resources/levels/', '');
        relativePath = relativePath.substring(0, relativePath.lastIndexOf('/'));
        return relativePath;
    }

    public static StringToDeckTypeEnum(value: string): DeckType | undefined {
        return DeckType[value as keyof typeof DeckType];
    }

    public static StringToObjectiveTypeEnum(value: string): ObjectiveType | undefined {
        return ObjectiveType[value as keyof typeof ObjectiveType];
    }

    public static StringToHandNameEnum(value: string): HandName | undefined {
        return HandName[value as keyof typeof HandName];
    }

    public static StringToBoardModifierType(value: string): BoardModifierType | undefined {
        return BoardModifierType[value as keyof typeof BoardModifierType];
    }
}
