import { Requirement } from '../models/requirements/Requirement';
import { RequirementFactory } from '../models/requirements/RequirementFactory';

export class DialogueSet {
    public dialogueSections: DialogueSection[] = [];
    public sourceFile: string = '';
    public dialogueId: string = '';
    public repeatable: boolean = false;
    public dialogueFormat: string = ''; //Should always only be either 'Phone' or 'Default'
    public requirements: Requirement[] = [];

    public initFromJson(json: any) {
        try {
            const dialogueSet: DialogueSet = JSON.parse(JSON.stringify(json));

            if (!dialogueSet.sourceFile || dialogueSet.sourceFile === '') {
                console.error('Error: Source File is either empty or null');
                return;
            }

            if (!dialogueSet.dialogueSections || dialogueSet.dialogueSections.length <= 0) {
                console.error('Error: Dialogue Sections is either empty or null');
                return;
            }

            if (!dialogueSet.dialogueId || dialogueSet.dialogueId === '') {
                console.error('Error: Dialogue ID is either empty or null');
                return;
            }

            if (dialogueSet.repeatable === null || dialogueSet.repeatable === undefined) {
                console.error('Error: Repeatable boolean is undefined or null');
                return;
            }

            if (dialogueSet.dialogueFormat === null || dialogueSet.dialogueFormat === undefined) {
                console.error('Error: Dialogue Type is undefined or null');
                return;
            }

            // if (!dialogueSet.requirements) {
            //     console.error('Error: Requirement List is null');
            //     return;
            // }

            dialogueSet.dialogueSections.forEach((section, index) => {
                if (!section.characterNames || section.characterNames.length <= 0) {
                    console.error('Error: Character Names is either empty or null at Section index: ' + index);
                    return;
                }

                if (!section.lines || section.lines.length <= 0) {
                    console.error('Error: Lines array is either empty or null at Section index: ' + index);
                    return;
                }

                if (section.dialogueType == null) {
                    console.error('Error: Dialogue Type is null at Section index: ' + index);
                    return;
                }

                if (section.characterSide == null) {
                    console.error('Error: Character Side is null at Section index: ' + index);
                    return;
                }

                section.lines.forEach((line, index) => {
                    if (!line.line || line.line.length <= 0) {
                        console.error('Error: Line is null or empty at Line index: ' + index);
                        return;
                    }

                    if (!line.characterSprites || line.characterSprites.length <= 0) {
                        console.error('Error: Character Sprites is either empty or null at Line index: ' + index);
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
            console.error('Error Parsing Dialogue JSON: ' + err);
        }
    }

    public initFromString(json: string) {
        try {
            const dialogueSet: DialogueSet = JSON.parse(json);

            if (!dialogueSet.sourceFile || dialogueSet.sourceFile === '') {
                console.error('Error: Source File is either empty or null');
                return;
            }

            if (!dialogueSet.dialogueSections || dialogueSet.dialogueSections.length <= 0) {
                console.error('Error: Dialogue Sections is either empty or null');
                return;
            }

            if (!dialogueSet.dialogueId || dialogueSet.dialogueId === '') {
                console.error('Error: Dialogue ID is either empty or null');
                return;
            }

            if (dialogueSet.repeatable === null || dialogueSet.repeatable === undefined) {
                console.error('Error: Repeatable boolean is undefined or null');
                return;
            }

            if (dialogueSet.dialogueFormat === null || dialogueSet.dialogueFormat === undefined) {
                console.error('Error: Dialogue Type is undefined or null');
                return;
            }

            // if (!dialogueSet.requirements) {
            //     console.error('Error: Requirement List is null');
            //     return;
            // }

            dialogueSet.dialogueSections.forEach((section, index) => {
                if (!section.characterNames || section.characterNames.length <= 0) {
                    console.error('Error: Character Names is either empty or null at Section index: ' + index);
                    return;
                }

                if (!section.lines || section.lines.length <= 0) {
                    console.error('Error: Lines array is either empty or null at Section index: ' + index);
                    return;
                }

                if (section.dialogueType == null) {
                    console.error('Error: Dialogue Type is null at Section index: ' + index);
                    return;
                }

                if (section.characterSide == null) {
                    console.error('Error: Character Side is null at Section index: ' + index);
                    return;
                }

                section.lines.forEach((line, index) => {
                    if (!line.line || line.line.length <= 0) {
                        console.error('Error: Line is null or empty at Line index: ' + index);
                        return;
                    }

                    if (!line.characterSprites || line.characterSprites.length <= 0) {
                        console.error('Error: Character Sprites is either empty or null at Line index: ' + index);
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
            console.error('Error Parsing Dialogue JSON: ' + err);
        }
    }
}

export class DialogueSection {
    public characterSide: SideOfScreen = SideOfScreen.Left;
    public characterNames: string[] = [];
    public dialogueType: DialogueType = DialogueType.Speaking;
    public lines: DialogueLine[] = [];
}

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
