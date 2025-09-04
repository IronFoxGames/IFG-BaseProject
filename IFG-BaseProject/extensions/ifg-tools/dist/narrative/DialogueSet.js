"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogueType = exports.SideOfScreen = exports.DialogueLine = exports.DialogueSection = exports.DialogueSet = void 0;
const RequirementFactory_1 = require("../models/requirements/RequirementFactory");
class DialogueSet {
    constructor() {
        this.dialogueSections = [];
        this.sourceFile = '';
        this.dialogueId = '';
        this.repeatable = false;
        this.dialogueFormat = ''; //Should always only be either 'Phone' or 'Default'
        this.requirements = [];
    }
    initFromJson(json) {
        try {
            const dialogueSet = JSON.parse(JSON.stringify(json));
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
                this.requirements = dialogueSet.requirements.map((o) => RequirementFactory_1.RequirementFactory.fromObject(o));
            }
        }
        catch (err) {
            console.error('Error Parsing Dialogue JSON: ' + err);
        }
    }
    initFromString(json) {
        try {
            const dialogueSet = JSON.parse(json);
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
                this.requirements = dialogueSet.requirements.map((o) => RequirementFactory_1.RequirementFactory.fromObject(o));
            }
        }
        catch (err) {
            console.error('Error Parsing Dialogue JSON: ' + err);
        }
    }
}
exports.DialogueSet = DialogueSet;
class DialogueSection {
    constructor() {
        this.characterSide = SideOfScreen.Left;
        this.characterNames = [];
        this.dialogueType = DialogueType.Speaking;
        this.lines = [];
    }
}
exports.DialogueSection = DialogueSection;
class DialogueLine {
    constructor() {
        this.line = '';
        this.characterSprites = [];
        this.unskippable = false;
    }
}
exports.DialogueLine = DialogueLine;
var SideOfScreen;
(function (SideOfScreen) {
    SideOfScreen[SideOfScreen["Left"] = 0] = "Left";
    SideOfScreen[SideOfScreen["Right"] = 1] = "Right";
    SideOfScreen[SideOfScreen["Both"] = 2] = "Both";
})(SideOfScreen = exports.SideOfScreen || (exports.SideOfScreen = {}));
//Strings must all be title case no spaces
var DialogueType;
(function (DialogueType) {
    DialogueType["Speaking"] = "Speaking";
    DialogueType["Exposition"] = "Exposition";
    DialogueType["Scrim"] = "Scrim";
    DialogueType["Sprite"] = "Sprite";
    DialogueType["Fade"] = "Fade";
    DialogueType["SFX"] = "Sfx";
    DialogueType["Letter"] = "Letter";
    DialogueType["Music"] = "Music";
    DialogueType["CameraFocus"] = "Camerafocus";
    DialogueType["CameraShake"] = "Camerashake";
    DialogueType["ChapterStart"] = "Chapterstart";
})(DialogueType = exports.DialogueType || (exports.DialogueType = {}));
