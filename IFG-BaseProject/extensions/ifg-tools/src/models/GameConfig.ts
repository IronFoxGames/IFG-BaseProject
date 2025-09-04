import { BoosterType, PowerupType } from '../enums/BoosterType';
import { DeckType } from '../enums/DeckType';
import { LevelDifficulty } from '../enums/LevelDifficulty';
import { BoardModifierPlacement } from './BoardModifierPlacement';
import { Card } from './Card';
import { CardPlacement } from './CardPlacement';
import { GameObjective } from './GameObjective';

export class GameConfig {
    public static DEFAULT_HAND_SIZE: number = 7;

    public name: string = '';
    public description: string = '';
    public difficulty: LevelDifficulty = LevelDifficulty.Normal;
    public handSize: number = GameConfig.DEFAULT_HAND_SIZE;
    public hasBot: boolean = false;
    public placeAnchor: boolean = true;
    public objectives: GameObjective[] = [];
    public deckType: DeckType = DeckType.Default;
    public customDeck: Card[] = [];
    public startingBoard: CardPlacement[] = [];
    public boardModifierPlacements: BoardModifierPlacement[] = [];
    public freeBooster: BoosterType = BoosterType.None;
    public freePowerup: PowerupType = PowerupType.None;
    public appliedBoosters: BoosterType[] = [];

    // Grid specials
    public gridSpecialsEnabled: boolean = false;
    public gridSpecialsHidden: boolean = false;

    public static fromObject(obj: any): GameConfig {
        const config = new GameConfig();
        config.name = obj.name;
        config.description = obj.description;
        config.difficulty = Object.values(LevelDifficulty).includes(obj.difficulty)
            ? (obj.difficulty as LevelDifficulty)
            : LevelDifficulty.Normal;
        config.placeAnchor = obj.placeAnchor;
        config.deckType = obj.deckType;
        config.handSize = obj.handSize || GameConfig.DEFAULT_HAND_SIZE;
        config.gridSpecialsEnabled = obj.gridSpecialsEnabled;
        config.gridSpecialsHidden = obj.gridSpecialsHidden;
        config.freeBooster = obj.freeBooster;
        config.freePowerup = obj.freePowerup;

        if (Array.isArray(obj.objectives)) {
            config.objectives = obj.objectives.map((o: any) => GameObjective.fromObject(o));
        }
        if (Array.isArray(obj.customDeck)) {
            config.customDeck = obj.customDeck.map((c: any) => Card.fromObject(c));
        }
        if (Array.isArray(obj.startingBoard)) {
            config.startingBoard = obj.startingBoard.map((cp: any) => CardPlacement.fromObject(cp));
        }
        if (Array.isArray(obj.boardModifierPlacements)) {
            config.boardModifierPlacements = obj.boardModifierPlacements.map((bmp: any) => BoardModifierPlacement.fromObject(bmp));
        }
        if (Array.isArray(obj.appliedBoosters)) {
            config.appliedBoosters = [];

            obj.appliedBoosters.forEach((booster: any) => {
                if (Object.values(BoosterType).includes(booster as BoosterType)) {
                    config.appliedBoosters.push(booster);
                } else {
                    throw new Error(`Given BoosterType is not valid: ${booster}`);
                }
            });
        }

        return config;
    }
}
