import { ComparisonOperator } from '../models/requirements/ComparisonOperator';
import { DateOperator, DateRequirement } from '../models/requirements/DateRequirement';
import { DialogueOperator, DialogueRequirement } from '../models/requirements/DialogueRequirement';
import { InventoryRequirement } from '../models/requirements/InventoryRequirement';
import { LevelIdComparisonOperator, LevelIdRequirement } from '../models/requirements/LevelIdRequirement';
import { LevelRequirement } from '../models/requirements/LevelRequirement';
import { PropHasTagInNodeRequirement } from '../models/requirements/PropHasTagInNodeRequirement';
import { PropInNodeRequirement } from '../models/requirements/PropInNodeRequirement';
import { RequirementType } from '../models/requirements/RequirementType';
import { StringComparisonOperator } from '../models/requirements/StringComparisonOperator';
import { TaskCompleteRequirement } from '../models/requirements/TaskCompleteRequirement';
import { TutorialOperator, TutorialRequirement } from '../models/requirements/TutorialRequirement';
import { DialogueLine, DialogueSection, DialogueSet, DialogueType, SideOfScreen } from './DialogueSet';
import { QuickPlaySessionsRequirement } from '../models/requirements/QuickPlaySessionsRequirement';

const LINETYPE_CHAPTER: string = 'CHAPTER';
const LINETYPE_LOCATION: string = 'LOCATION';
const LINETYPE_NAME: string = 'NAME';
const LINETYPE_FORMAT: string = 'FORMAT';
const LINETYPE_REPEATABLE: string = 'REPEATABLE';
const LINETYPE_REQUIREMENT_LEVEL: string = 'LEVEL_REQUIREMENT';
const LINETYPE_REQUIREMENT_LEVELID: string = 'LEVELID_REQUIREMENT';
const LINETYPE_REQUIREMENT_DIALOGUE: string = 'DIALOGUE_REQUIREMENT';
const LINETYPE_REQUIREMENT_INVENTORY: string = 'INVENTORY_REQUIREMENT';
const LINETYPE_REQUIREMENT_DATE: string = 'DATE_REQUIREMENT';
const LINETYPE_REQUIREMENT_PROPINNODE: string = 'PROPINNODE_REQUIREMENT';
const LINETYPE_REQUIREMENT_PROPHASTAGINNODE: string = 'PROPHASTAGINNODE_REQUIREMENT';
const LINETYPE_REQUIREMENT_TASKCOMPLETE: string = 'TASKCOMPLETE_REQUIREMENT';
const LINETYPE_REQUIREMENT_TUTORIAL: string = 'TUTORIAL_REQUIREMENT';
const LINETYPE_REQUIREMENT_QUICKPLAYSESSIONS: string = 'QUICKPLAYSESSIONS_REQUIREMENT';
const LINETYPE_INDEX: string = 'Index';
const LEVEL_DINER: string = 'DINER';
const JSON_SAVE_PATH: string = 'db://assets/resources/dialogueSets/';

const isNullOrWhiteSpace = (str: string | null | undefined): boolean => {
    return !str || str.trim().length === 0;
};

const isNullOrEmpty = (str: string | null | undefined): boolean => {
    return !str || str.length === 0;
};

export class DialogueJsonConverter {
    private chapterTitle: string = '';
    private currentDialogueSet: DialogueSet = new DialogueSet();
    private chapterNum: number = 0;
    private dialogueLocation: string = '';
    private dialogueName: string = '';

    private previousSpeaker: string = '';
    private previousSide: string = '';
    private previousDialogueType: DialogueType = DialogueType.Speaking;
    private dialogueLines: DialogueLine[] = [];
    private dialogueJsons: Array<{ name: string; json: string }> = [];

    public async ParseJsonFiles(csvContent: string, fileName: string) {
        this.dialogueLines = [];
        this.chapterTitle = '';
        this.chapterNum = 0;

        this.resetParseState(fileName);

        let addingDialogue: boolean = false;
        let lineNumber: number = 0;
        let totalBoths: number = 0;

        this.previousSpeaker = '';
        this.previousSide = '';
        this.previousDialogueType = DialogueType.Speaking;

        const lines: string[] = csvContent.split('\n');

        for (const line of lines) {
            const index = lines.indexOf(line);
            ++lineNumber;

            const fields = DialogueJsonConverter.parseLine(line);

            // End of dialogue? Save the current dialogue set result
            if (addingDialogue && (fields.length == 0 || isNullOrWhiteSpace(fields[0]))) {
                if (this.dialogueLines.length > 0) {
                    this.createNewSingleDialogueSection(this.previousSpeaker, this.previousSide, this.previousDialogueType);

                    this.dialogueLines = [];
                }

                const dialogueId: string = `Chapter${this.chapterNum}-${this.dialogueName}`;
                this.currentDialogueSet.dialogueId = dialogueId;

                const jsonString = JSON.stringify(this.currentDialogueSet, null, 2).replace(/\\\\/g, '\\'); // Replace double backslashes with single backslashes
                const assetName: string = `Chapter${this.chapterNum}-${this.dialogueName.toUpperCase()}.json`;
                this.dialogueJsons.push({ name: assetName, json: jsonString });
                addingDialogue = false;
                continue;
            }

            let lineType: string = '';

            if (fields.length > 0) {
                lineType = fields[0];
            }

            if (lineType === LINETYPE_CHAPTER) {
                if (fields.length < 3 || isNullOrEmpty(fields[1]) || isNullOrEmpty(fields[2])) {
                    console.error(`Error: Dialogue ${this.dialogueName} missing Chapter Title or Number at [${lineNumber}:${fileName}]`);
                } else {
                    const parsedValue = parseInt(fields[1], 10);

                    if (isNaN(parsedValue)) {
                        console.error(`Invalid Chapter Num at [${lineNumber}:${fileName}]`);
                    } else {
                        this.chapterNum = parsedValue;
                    }

                    this.chapterTitle = fields[2];
                }
            } else if (lineType === LINETYPE_LOCATION) {
                this.resetParseState(fileName);
                addingDialogue = false;

                if (fields.length < 2 || isNullOrEmpty(fields[1])) {
                    console.error(`Dialogue ${this.dialogueName} missing Location at [${lineNumber}:${fileName}]`);
                }

                this.dialogueLocation = fields[1];
            } else if (lineType === LINETYPE_NAME) {
                if (fields.length < 2 || isNullOrEmpty(fields[1])) {
                    console.error(`Dialogue ${this.dialogueName} missing Name at [${lineNumber}:${fileName}]`);
                } else {
                    this.dialogueName = fields[1];
                }
            } else if (lineType === LINETYPE_FORMAT) {
                let dialogueFormat: string = '';

                if (fields.length < 2 || isNullOrEmpty(fields[1])) {
                    console.error(`Dialogue ${this.dialogueName} missing Type at [${lineNumber}:${fileName}]`);
                } else {
                    dialogueFormat = fields[1];
                }

                if (dialogueFormat.toLowerCase() !== 'phone' && dialogueFormat.toLowerCase() !== 'default') {
                    console.error(
                        `Dialogue ${this.dialogueName} error. Dialogue format must be 'phone' or 'default' at [${lineNumber}:${fileName}]`
                    );
                } else {
                    this.currentDialogueSet.dialogueFormat = dialogueFormat;
                }
            } else if (lineType === LINETYPE_REPEATABLE) {
                let repeatableString: string = '';

                if (fields.length < 2 || isNullOrEmpty(fields[1])) {
                    console.error(`Dialogue ${this.dialogueName} missing Repeatable Boolean at [${lineNumber}:${fileName}]`);
                } else {
                    repeatableString = fields[1];
                }

                if (repeatableString.toLowerCase() !== 'true' && repeatableString.toLowerCase() !== 'false') {
                    console.error(`Dialogue ${this.dialogueName}. Repeatable boolean must be 'true' or 'false' at [${lineNumber}:${fileName}]`);
                } else {
                    this.currentDialogueSet.repeatable = this.parseStringToBool(repeatableString);
                }
            } else if (lineType === LINETYPE_REQUIREMENT_LEVEL) {
                this.handleRequirementLinetype(RequirementType.Level, fields, lineNumber, fileName);
            } else if (lineType === LINETYPE_REQUIREMENT_LEVELID) {
                this.handleRequirementLinetype(RequirementType.LevelId, fields, lineNumber, fileName);
            } else if (lineType === LINETYPE_REQUIREMENT_DIALOGUE) {
                this.handleRequirementLinetype(RequirementType.Dialogue, fields, lineNumber, fileName);
            } else if (lineType === LINETYPE_REQUIREMENT_INVENTORY) {
                this.handleRequirementLinetype(RequirementType.Inventory, fields, lineNumber, fileName);
            } else if (lineType === LINETYPE_REQUIREMENT_DATE) {
                this.handleRequirementLinetype(RequirementType.Date, fields, lineNumber, fileName);
            } else if (lineType === LINETYPE_REQUIREMENT_PROPINNODE) {
                this.handleRequirementLinetype(RequirementType.PropInNode, fields, lineNumber, fileName);
            } else if (lineType === LINETYPE_REQUIREMENT_PROPHASTAGINNODE) {
                this.handleRequirementLinetype(RequirementType.PropHasTagInNode, fields, lineNumber, fileName);
            } else if (lineType === LINETYPE_REQUIREMENT_TASKCOMPLETE) {
                this.handleRequirementLinetype(RequirementType.TaskComplete, fields, lineNumber, fileName);
            } else if (lineType === LINETYPE_REQUIREMENT_TUTORIAL) {
                this.handleRequirementLinetype(RequirementType.Tutorial, fields, lineNumber, fileName);
            } else if (lineType === LINETYPE_REQUIREMENT_QUICKPLAYSESSIONS) {
                this.handleRequirementLinetype(RequirementType.QuickPlaySessions, fields, lineNumber, fileName);
            } else if (lineType === LINETYPE_INDEX) {
                addingDialogue = true;
            } else if (!addingDialogue) {
                if (lineType != '') {
                    console.error(`Invalid line type at [${lineNumber}:${fileName}] `, lineType);
                }
            } else {
                // addingDialogue
                try {
                    let lineIndex = fields[0];
                    let speaker = fields[1];
                    let expression = fields[2];
                    let side = fields[3];
                    let dialogueType = fields[4];
                    let unskippable = fields[5];
                    let dialogue = fields[6];

                    speaker = this.toTitleCaseNoSpaces(speaker);
                    expression = this.toTitleCaseNoSpaces(expression);
                    dialogueType = this.toTitleCaseNoSpaces(dialogueType);

                    if (speaker === 'None') {
                        side = 'None';
                    }

                    if (dialogueType === DialogueType.Speaking) {
                        if (
                            side.toLowerCase() != 'left' &&
                            side.toLowerCase() != 'right' &&
                            side.toLowerCase() != 'both' &&
                            side.toLowerCase() != 'none'
                        ) {
                            console.error(
                                `Dialogue ${this.dialogueName}. Error at [${lineNumber}:${fileName}]: For Speaking dialogue, Side must be set to Left, Right, Or Both.`
                            );
                        }
                    }

                    //checks if a new section should be made
                    if (side.toLowerCase() != 'both') {
                        if ((this.previousSpeaker != speaker || this.previousSide != side) && this.dialogueLines.length > 0) {
                            this.createNewSingleDialogueSection(this.previousSpeaker, this.previousSide, this.previousDialogueType);
                            this.dialogueLines = [];
                        }

                        let dialogueLineToAdd = new DialogueLine();
                        dialogueLineToAdd.line = dialogue;
                        dialogueLineToAdd.characterSprites = [expression];

                        this.dialogueLines.push(dialogueLineToAdd);
                    } else if (side.toLowerCase() === 'both' && this.previousSide.toLowerCase() != 'both' && totalBoths % 2 === 0) {
                        totalBoths++;

                        if (this.dialogueLines.length > 0) {
                            this.createNewSingleDialogueSection(this.previousSpeaker, this.previousSide, this.previousDialogueType);
                            this.dialogueLines = [];
                        }

                        let dialogueLineToAdd = new DialogueLine();
                        dialogueLineToAdd.line = dialogue;
                        dialogueLineToAdd.characterSprites = [expression];

                        this.dialogueLines.push(dialogueLineToAdd);
                    } else if (side.toLowerCase() === 'both' && this.previousSide.toLowerCase() === 'both' && totalBoths % 2 != 0) {
                        totalBoths++;

                        this.dialogueLines[this.dialogueLines.length - 1].characterSprites.push(expression);

                        this.createNewMultiDialogueSection(this.previousSpeaker, speaker);

                        this.dialogueLines = [];
                    } else {
                        console.error(
                            `Dialogue ${this.dialogueName}. Error at [${lineNumber}:${fileName}]: There is no matching line labeled Both that corresponds to this line`
                        );
                    }

                    this.previousSpeaker = speaker;
                    this.previousSide = side;
                    this.previousDialogueType = dialogueType as DialogueType;

                    if (unskippable != '' && !isNullOrWhiteSpace(unskippable)) {
                        if (unskippable && unskippable.toLowerCase() === 'true') {
                            this.dialogueLines[this.dialogueLines.length - 1].unskippable = true;
                        }
                    } else {
                        console.error(
                            `Dialogue ${this.dialogueName}. Error at [${lineNumber}:${fileName}]: Unskippable is not set to true or false, using default value of false`
                        );
                    }
                } catch (err) {
                    console.error(`Dialogue ${this.dialogueName}.Error: ` + err);
                }
            }
        }

        return this.dialogueJsons;
    }

    private createNewSingleDialogueSection(speaker: string, side: string, dialogueType: DialogueType) {
        let section: DialogueSection = new DialogueSection();

        section.characterSide = side.toLowerCase() === 'left' ? SideOfScreen.Left : SideOfScreen.Right;
        section.characterNames = [this.toTitleCaseNoSpaces(speaker)];
        section.dialogueType = dialogueType;
        section.lines = this.dialogueLines;

        this.currentDialogueSet.dialogueSections.push(section);
    }

    private createNewMultiDialogueSection(leftSpeaker: string, rightSpeaker: string) {
        let section: DialogueSection = new DialogueSection();

        section.characterSide = SideOfScreen.Both;
        section.characterNames = [leftSpeaker, rightSpeaker];
        section.dialogueType = DialogueType.Speaking;
        section.lines = this.dialogueLines;

        this.currentDialogueSet.dialogueSections.push(section);
    }

    public async SaveJsonsAsDialogueSets(dialogueJsons: { name: string; json: string }[]) {
        for (const dialogueJson of dialogueJsons) {
            try {
                let chapterNum: number = 0;
                const parsedValue = parseInt(dialogueJson.name.charAt(7), 10);

                if (isNaN(parsedValue)) {
                    console.error(`Dialogue ${this.dialogueName}. Cannot Parse Chapter Num Successfully`);
                } else {
                    chapterNum = parsedValue;
                }

                if (chapterNum === 0) {
                    console.log(`Dialogue ${this.dialogueName}. Error: Chapter Num not parsed correctly or invalid`);
                }

                const fullFilePath: string = JSON_SAVE_PATH + `chapter${chapterNum}/${dialogueJson.name}`;
                const exists = await Editor.Message.request('asset-db', 'query-asset-info', fullFilePath);

                if (exists) {
                    await Editor.Message.request('asset-db', 'save-asset', fullFilePath, dialogueJson.json);
                } else {
                    await Editor.Message.send('asset-db', 'create-asset', fullFilePath, dialogueJson.json);
                    await Editor.Message.request('asset-db', 'refresh-asset', fullFilePath);
                }

                console.log('DialogueSet saved to JSON file successfully: ' + fullFilePath);
            } catch (error) {
                console.error(`Dialogue ${this.dialogueName}. Error writing JSON to file:`, error);
            }
        }
    }

    private static parseLine(line: string): string[] {
        let fields: string[] = [];
        let inQuotes: boolean = false;
        let field: string = '';

        for (let i = 0; i < line.length; i++) {
            let currentChar = line[i];

            if (currentChar == '"' && (i == 0 || line[i - 1] != '\\')) {
                inQuotes = !inQuotes;
            } else if (currentChar == ',' && !inQuotes) {
                fields.push(field.trim());
                field = '';
            } else {
                field += currentChar;
            }
        }

        field = field.trim();

        // Add the last field
        if (field && field.length > 0) {
            fields.push(field);
        }

        return fields;
    }

    private toTitleCaseNoSpaces(input: string): string {
        if (isNullOrEmpty(input)) {
            return '';
        }

        // Match words ending with a space or hyphen, or camel case boundaries
        const parts = input.match(/([A-Z]?[a-z]+[ _-]?|[A-Z]+(?![a-z])[ _-]?|[A-Z]?[a-z]+|[A-Z]+)/g);

        if (!parts) return input;

        return parts
            .map((part) => {
                if (/^[- _]+$/.test(part)) return part;
                const firstChar = part[0].toUpperCase();
                const rest = part.slice(1).toLowerCase();
                return firstChar + rest;
            })
            .join('');
    }

    private parseStringToBool(value: string): boolean {
        if (value.toLowerCase() === 'true') {
            return true;
        } else if (value.toLowerCase() === 'false') {
            return false;
        }

        console.error(`Dialogue ${this.dialogueName}. Error: Failed to parse string as bool: '" + value + "'. Defaulting to false`);
        return false;
    }

    private handleRequirementLinetype(requirementType: RequirementType, fields: string[], lineNumber: number, fileName: string) {
        //Remove the LineType from the fields
        fields.splice(0, 1);

        switch (requirementType) {
            case RequirementType.Level:
                this.parseLevelRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType.LevelId:
                this.parseLevelIdRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType.Dialogue:
                this.parseDialogueRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType.Date:
                this.parseDateRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType.Inventory:
                this.parseInventoryRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType.PropHasTagInNode:
                this.parsePropHasTagInNodeRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType.PropInNode:
                this.parsePropInNodeRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType.TaskComplete:
                this.parseTaskRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType.Tutorial:
                this.parseTutorialRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType.QuickPlaySessions:
                this.parseQuickPlaySessionsRequirement(fields, lineNumber, fileName);
                break;
        }
    }

    private parseLevelRequirement(fields: string[], lineNumber: number, fileName: string) {
        let level: number = 0;
        let operator: ComparisonOperator = ComparisonOperator.equal;

        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }

        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];

            if (paramName === 'operator') {
                if (paramValue in ComparisonOperator) {
                    operator = paramValue as ComparisonOperator;
                } else {
                    console.error(
                        `Dialogue ${this.dialogueName}. Error: Invalid LevelRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'equal'`
                    );
                }
            } else if (paramName === 'level') {
                level = Number(paramValue);

                if (isNaN(level)) {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid LevelRequirement Level Number at [${lineNumber}:${fileName}]`);
                }
            } else {
                console.error(
                    `Dialogue ${this.dialogueName}. Error: Invalid LevelRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`
                );
            }

            //remove the handled fields from the list
            fields.splice(0, 2);
        }

        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(
                `Dialogue ${this.dialogueName}. Error: LevelRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`
            );
        }

        let levelRequirementData: LevelRequirement = new LevelRequirement(RequirementType.Level, level, operator);
        this.currentDialogueSet.requirements.push(levelRequirementData);
    }

    private parseDialogueRequirement(fields: string[], lineNumber: number, fileName: string) {
        let dialogueId: string = '';
        let operator: DialogueOperator = DialogueOperator.hasSeen;

        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }

        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];

            if (paramName === 'operator') {
                if (paramValue in DialogueOperator) {
                    operator = paramValue as DialogueOperator;
                } else {
                    console.error(
                        `Dialogue ${this.dialogueName}. Error: Invalid DialogueRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'hasSeen'`
                    );
                }
            } else if (paramName === 'dialogueId') {
                dialogueId = paramValue;
            } else {
                console.error(
                    `Dialogue ${this.dialogueName}. Error: Invalid DialogueRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`
                );
            }

            //remove the handled fields from the list
            fields.splice(0, 2);
        }

        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(
                `Dialogue ${this.dialogueName}. Error: DialogueRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`
            );
        }

        let dialogueRequirementData: DialogueRequirement = new DialogueRequirement(RequirementType.Dialogue, dialogueId, operator);
        this.currentDialogueSet.requirements.push(dialogueRequirementData);
    }

    private parseLevelIdRequirement(fields: string[], lineNumber: number, fileName: string) {
        let levelId: string = '';
        let operator: LevelIdComparisonOperator = LevelIdComparisonOperator.complete;

        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }

        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];

            if (paramName === 'operator') {
                if (paramValue in LevelIdComparisonOperator) {
                    operator = paramValue as LevelIdComparisonOperator;
                } else {
                    console.error(
                        `LevelId ${this.dialogueName}. Error: Invalid LevelIdRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'complete'`
                    );
                }
            } else if (paramName === 'levelId') {
                levelId = paramValue;
            } else {
                console.error(
                    `Dialogue ${this.dialogueName}. Error: Invalid LevelIdRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`
                );
            }

            //remove the handled fields from the list
            fields.splice(0, 2);
        }

        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(
                `Dialogue ${this.dialogueName}. Error: LevelIdRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`
            );
        }

        let dialogueRequirementData: LevelIdRequirement = new LevelIdRequirement(RequirementType.LevelId, levelId, operator);
        this.currentDialogueSet.requirements.push(dialogueRequirementData);
    }

    private parseDateRequirement(fields: string[], lineNumber: number, fileName: string) {
        let date: Date = new Date();
        let endDate: Date = new Date();
        let dateOperator: DateOperator = DateOperator.after;
        const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }

        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];

            if (paramName === 'operator') {
                if (paramValue in DateOperator) {
                    dateOperator = paramValue as DateOperator;
                } else {
                    console.error(
                        `Dialogue ${this.dialogueName}. Error: Invalid DateRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'after'`
                    );
                }
            } else if (paramName === 'date') {
                //Checks if the given string is a valid ISO 8601 Date
                if (dateRegex.test(paramValue)) {
                    date = new Date(paramValue);

                    if (isNaN(date.getTime())) {
                        console.error(`Dialogue ${this.dialogueName}. Error: Invalid DateRequirement Date at [${lineNumber}:${fileName}]`);
                    }
                } else {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid DateRequirement Date at [${lineNumber}:${fileName}]`);
                }
            } else if (paramName === 'endDate') {
                //Checks if the given string is a valid ISO 8601 Date
                if (dateRegex.test(paramValue)) {
                    endDate = new Date(paramValue);

                    if (isNaN(endDate.getTime())) {
                        console.error(`Dialogue ${this.dialogueName}. Error: Invalid DateRequirement EndDate at [${lineNumber}:${fileName}]`);
                    }
                } else {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid DateRequirement End Date at [${lineNumber}:${fileName}]`);
                }
            } else {
                console.error(
                    `Dialogue ${this.dialogueName}. Error: Invalid DateRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`
                );
            }

            //remove the handled fields from the list
            fields.splice(0, 2);
        }

        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(
                `Dialogue ${this.dialogueName}. Error: DateRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`
            );
        }

        let dateRequirementData: DateRequirement = new DateRequirement(RequirementType.Date, date, endDate, dateOperator);
        this.currentDialogueSet.requirements.push(dateRequirementData);
    }

    private parseInventoryRequirement(fields: string[], lineNumber: number, fileName: string) {
        let itemId: string = '';
        let itemCount: number = 0;
        let operator: ComparisonOperator = ComparisonOperator.equal;

        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }

        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];

            if (paramName === 'operator') {
                if (paramValue in ComparisonOperator) {
                    operator = paramValue as ComparisonOperator;
                } else {
                    console.error(
                        `Dialogue ${this.dialogueName}. Error: Invalid InventoryRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'equal'`
                    );
                }
            } else if (paramName === 'itemId') {
                itemId = paramValue;
            } else if (paramName === 'itemCount') {
                itemCount = Number(paramValue);

                if (isNaN(itemCount)) {
                    console.error(
                        `Dialogue ${this.dialogueName}. Error: Invalid InventoryRequirement Item Count Value at [${lineNumber}:${fileName}]`
                    );
                }
            } else {
                console.error(
                    `Dialogue ${this.dialogueName}. Error: Invalid InventoryRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`
                );
            }

            //remove the handled fields from the list
            fields.splice(0, 2);
        }

        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(
                `Dialogue ${this.dialogueName}. Error: InventoryRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`
            );
        }

        let inventoryRequirementData: InventoryRequirement = new InventoryRequirement(RequirementType.Inventory, itemId, itemCount, operator);
        this.currentDialogueSet.requirements.push(inventoryRequirementData);
    }

    private parsePropInNodeRequirement(fields: string[], lineNumber: number, fileName: string) {
        let propId: string = '';
        let nodeId: string = '';
        let operator: StringComparisonOperator = StringComparisonOperator.equal;

        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }

        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];

            if (paramName === 'operator') {
                if (paramValue in StringComparisonOperator) {
                    operator = paramValue as StringComparisonOperator;
                } else {
                    console.error(
                        `Dialogue ${this.dialogueName}. Error: Invalid PropInNodeRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'equal'`
                    );
                }
            } else if (paramName === 'propId') {
                propId = paramValue;
            } else if (paramName === 'nodeId') {
                nodeId = paramValue;
            } else {
                console.error(
                    `Dialogue ${this.dialogueName}. Error: Invalid PropInNodeRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`
                );
            }

            //remove the handled fields from the list
            fields.splice(0, 2);
        }

        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(
                `Dialogue ${this.dialogueName}. Error: PropInNodeRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`
            );
        }

        let propInNodeRequirementData: PropInNodeRequirement = new PropInNodeRequirement(RequirementType.PropInNode, propId, nodeId, operator);
        this.currentDialogueSet.requirements.push(propInNodeRequirementData);
    }

    private parseTaskRequirement(fields: string[], lineNumber: number, fileName: string) {
        let taskId: string = '';
        let operator: StringComparisonOperator = StringComparisonOperator.equal;

        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }

        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];

            if (paramName === 'taskId') {
                taskId = paramValue;
            } else {
                console.error(
                    `Dialogue ${this.dialogueName}. Error: Invalid TaskRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`
                );
            }

            //remove the handled fields from the list
            fields.splice(0, 2);
        }

        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(
                `Dialogue ${this.dialogueName}. Error: TaskRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`
            );
        }

        let taskRequirementData: TaskCompleteRequirement = new TaskCompleteRequirement(RequirementType.TaskComplete, taskId);
        this.currentDialogueSet.requirements.push(taskRequirementData);
    }

    private parseTutorialRequirement(fields: string[], lineNumber: number, fileName: string) {
        let tutorialId: string = '';
        let operator: TutorialOperator = TutorialOperator.hasSeen;

        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }

        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];

            if (paramName === 'operator') {
                if (paramValue in TutorialOperator) {
                    operator = paramValue as TutorialOperator;
                } else {
                    console.error(
                        `Dialogue ${this.dialogueName}. Error: Invalid TutorialRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'hasSeen'`
                    );
                }
            } else if (paramName === 'tutorialId') {
                tutorialId = paramValue;
            } else {
                console.error(
                    `Dialogue ${this.dialogueName}. Error: Invalid TutorialRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`
                );
            }

            //remove the handled fields from the list
            fields.splice(0, 2);
        }

        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(
                `Dialogue ${this.dialogueName}. Error: TutorialRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`
            );
        }

        let tutorialRequirementData: TutorialRequirement = new TutorialRequirement(RequirementType.Tutorial, tutorialId, operator);
        this.currentDialogueSet.requirements.push(tutorialRequirementData);
    }

    private parseQuickPlaySessionsRequirement(fields: string[], lineNumber: number, fileName: string) {
        let playCount: number = 0;
        let operator: ComparisonOperator = ComparisonOperator.equal;

        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }

        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];

            if (paramName === 'operator') {
                if (paramValue in ComparisonOperator) {
                    operator = paramValue as ComparisonOperator;
                } else {
                    console.error(
                        `Dialogue ${this.dialogueName}. Error: Invalid QuickPlaySessionsRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'equal'`
                    );
                }
            } else if (paramName === 'playCount') {
                playCount = Number(paramValue);

                if (isNaN(playCount)) {
                    console.error(
                        `Dialogue ${this.dialogueName}. Error: Invalid QuickPlaySessionsRequirement PlayCount Number at [${lineNumber}:${fileName}]`
                    );
                }
            } else {
                console.error(
                    `Dialogue ${this.dialogueName}. Error: Invalid QuickPlaySessionsRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`
                );
            }

            //remove the handled fields from the list
            fields.splice(0, 2);
        }

        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(
                `Dialogue ${this.dialogueName}. Error: QuickPlaySessionsRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`
            );
        }

        let quickPlaySessionsReqData: QuickPlaySessionsRequirement = new QuickPlaySessionsRequirement(
            RequirementType.QuickPlaySessions,
            playCount,
            operator
        );
        this.currentDialogueSet.requirements.push(quickPlaySessionsReqData);
    }

    private parsePropHasTagInNodeRequirement(fields: string[], lineNumber: number, fileName: string) {
        let nodeId: string = '';
        let tag: string = '';

        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }

        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];

            if (paramName === 'nodeId') {
                nodeId = paramValue;
            } else if (paramName === 'tag') {
                tag = paramValue;
            } else {
                console.error(
                    `Dialogue ${this.dialogueName}. Error: Invalid PropHasTagInNodeRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`
                );
            }

            //remove the handled fields from the list
            fields.splice(0, 2);
        }

        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(
                `Dialogue ${this.dialogueName}. Error: PropHasTagInNodeRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`
            );
        }

        let propHasTagInNodeRequirementData: PropHasTagInNodeRequirement = new PropHasTagInNodeRequirement(
            RequirementType.PropHasTagInNode,
            tag,
            nodeId
        );
        this.currentDialogueSet.requirements.push(propHasTagInNodeRequirementData);
    }

    private resetParseState(fileName: string) {
        this.dialogueLocation = '';
        this.dialogueName = '';
        this.currentDialogueSet = new DialogueSet();
        this.currentDialogueSet.dialogueSections = [];

        this.currentDialogueSet.sourceFile = fileName;
    }
}
