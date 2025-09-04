import { _decorator } from 'cc';
import { Requirement } from '../core/model/requirements/Requirement';
import { RequirementFactory } from '../core/model/requirements/RequirementFactory';
import { logger } from '../logging';
const { ccclass, property } = _decorator;

@ccclass('DialogueSet')
export class DialogueSet {
    public dialogueSections: DialogueSection[] = [];
    public sourceFile: string = '';
    public dialogueId: string = '';
    public repeatable: boolean = false;
    public dialogueFormat: string = ''; //Should always only be either 'Phone' or 'Default'
    public requirements: Requirement[] = [];
    private _log = logger.child('DialogueSet');

    public initFromJson(json: string): boolean {
        try {
            const dialogueSet: DialogueSet = JSON.parse(json);

            if (!dialogueSet.sourceFile || dialogueSet.sourceFile === '') {
                this._log.error('Error: Source File is either empty or null');
                return false;
            }

            if (!dialogueSet.dialogueSections || dialogueSet.dialogueSections.length <= 0) {
                this._log.error('Error: Dialogue Sections is either empty or null');
                return false;
            }

            if (!dialogueSet.dialogueId || dialogueSet.dialogueId === '') {
                this._log.error('Error: Dialogue ID is either empty or null');
                return false;
            }

            if (dialogueSet.repeatable === null || dialogueSet.repeatable === undefined) {
                this._log.error(`Error: DialogueId[${dialogueSet.dialogueId}] Repeatable boolean is undefined or null`);
                return false;
            }

            if (dialogueSet.dialogueFormat === null || dialogueSet.dialogueFormat === undefined) {
                this._log.error(`Error: DialogueId[${dialogueSet.dialogueId}] Dialogue Type is undefined or null`);
                return false;
            }

            if (!dialogueSet.requirements) {
                this._log.error(`Error: DialogueId[${dialogueSet.dialogueId}] Requirement List is null`);
                return false;
            }

            dialogueSet.dialogueSections.forEach((section, index) => {
                if (!section.characterNames || section.characterNames.length <= 0) {
                    this._log.error('Error: Character Names is either empty or null at Section index: ' + index);
                    return false;
                }

                if (!section.lines || section.lines.length <= 0) {
                    this._log.error('Error: Lines array is either empty or null at Section index: ' + index);
                    return false;
                }

                if (section.dialogueType == null) {
                    this._log.error('Error: Dialogue Type is null at Section index: ' + index);
                    return false;
                }

                if (section.characterSide == null) {
                    this._log.error('Error: Character Side is null at Section index: ' + index);
                    return false;
                }

                section.lines.forEach((line, index) => {
                    if (!line.line || line.line.length <= 0) {
                        this._log.error('Error: Line is null or empty at Line index: ' + index);
                        return;
                    }

                    if (!line.characterSprites || line.characterSprites.length <= 0) {
                        this._log.error('Error: Character Sprites is either empty or null at Line index: ' + index);
                        return;
                    }
                });
            });

            this.dialogueSections = dialogueSet.dialogueSections;
            this.sourceFile = dialogueSet.sourceFile;
            this.repeatable = dialogueSet.repeatable;
            this.dialogueFormat = dialogueSet.dialogueFormat;
            this.dialogueId = dialogueSet.dialogueId;
            if (Array.isArray(dialogueSet.requirements)) {
                this.requirements = dialogueSet.requirements.map((o: any) => RequirementFactory.fromObject(o));
            }
        } catch (err) {
            this._log.error('Error Parsing Dialogue JSON: ' + err);
            return false;
        }

        return true;
    }
}

@ccclass('DialogueSection')
export class DialogueSection {
    public characterSide: SideOfScreen;
    public characterNames: string[] = [];
    public dialogueType: DialogueType;
    public lines: DialogueLine[] = [];
}

@ccclass('DialogueLine')
export class DialogueLine {
    public line: string = '';
    public characterSprites: string[] = [];
    public unskippable: boolean = false;
}

export enum SideOfScreen {
    Left,
    Right,
    Both
}

//Strings must all be title case no spaces
export enum DialogueType {
    Speaking = 'Speaking',
    Exposition = 'Exposition',
    Scrim = 'Scrim',
    Sprite = 'Sprite',
    Fade = 'Fade',
    SFX = 'Sfx',
    Letter = 'Letter',
    Music = 'Music',
    CameraFocus = 'Camerafocus',
    CameraShake = 'Camerashake',
    ChapterStart = 'Chapterstart'
}
