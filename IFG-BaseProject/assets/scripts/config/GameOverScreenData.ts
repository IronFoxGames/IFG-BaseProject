import { RequirementFactory } from '../core/model/requirements/RequirementFactory';

export class GameOverScreenData {
    winCharacters: string[];
    lossCharacters: string[];
    prologueCharacter: string;
    prologueEndCharacter: string;
    prologueEndRequirements: [] = []; // Are they still in the prologue but at the end
    prologueCompleteRequirements: [] = []; // Have they completed the prologue

    public static fromObject(obj: any): GameOverScreenData {
        let gameOverScreenData = new GameOverScreenData();

        if (Array.isArray(obj.winCharacters)) {
            gameOverScreenData.winCharacters = obj.winCharacters;
        } else {
            gameOverScreenData.winCharacters = [];
        }

        if (Array.isArray(obj.lossCharacters)) {
            gameOverScreenData.lossCharacters = obj.lossCharacters;
        } else {
            gameOverScreenData.lossCharacters = [];
        }

        if (typeof obj.prologueCharacter === 'string') {
            gameOverScreenData.prologueCharacter = obj.prologueCharacter;
        } else {
            gameOverScreenData.prologueCharacter = '';
        }

        if (typeof obj.prologueEndCharacter === 'string') {
            gameOverScreenData.prologueEndCharacter = obj.prologueEndCharacter;
        } else {
            gameOverScreenData.prologueEndCharacter = '';
        }

        if (Array.isArray(obj.prologueEndRequirements)) {
            gameOverScreenData.prologueEndRequirements = obj.prologueEndRequirements.map((o: any) => RequirementFactory.fromObject(o));
        }

        if (Array.isArray(obj.prologueCompleteRequirements)) {
            gameOverScreenData.prologueCompleteRequirements = obj.prologueCompleteRequirements.map((o: any) => RequirementFactory.fromObject(o));
        }

        return gameOverScreenData;
    }
}
