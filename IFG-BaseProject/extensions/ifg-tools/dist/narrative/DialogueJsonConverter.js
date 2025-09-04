"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogueJsonConverter = void 0;
const ComparisonOperator_1 = require("../models/requirements/ComparisonOperator");
const DateRequirement_1 = require("../models/requirements/DateRequirement");
const DialogueRequirement_1 = require("../models/requirements/DialogueRequirement");
const InventoryRequirement_1 = require("../models/requirements/InventoryRequirement");
const LevelIdRequirement_1 = require("../models/requirements/LevelIdRequirement");
const LevelRequirement_1 = require("../models/requirements/LevelRequirement");
const PropHasTagInNodeRequirement_1 = require("../models/requirements/PropHasTagInNodeRequirement");
const PropInNodeRequirement_1 = require("../models/requirements/PropInNodeRequirement");
const RequirementType_1 = require("../models/requirements/RequirementType");
const StringComparisonOperator_1 = require("../models/requirements/StringComparisonOperator");
const TaskCompleteRequirement_1 = require("../models/requirements/TaskCompleteRequirement");
const TutorialRequirement_1 = require("../models/requirements/TutorialRequirement");
const DialogueSet_1 = require("./DialogueSet");
const QuickPlaySessionsRequirement_1 = require("../models/requirements/QuickPlaySessionsRequirement");
const LINETYPE_CHAPTER = 'CHAPTER';
const LINETYPE_LOCATION = 'LOCATION';
const LINETYPE_NAME = 'NAME';
const LINETYPE_FORMAT = 'FORMAT';
const LINETYPE_REPEATABLE = 'REPEATABLE';
const LINETYPE_REQUIREMENT_LEVEL = 'LEVEL_REQUIREMENT';
const LINETYPE_REQUIREMENT_LEVELID = 'LEVELID_REQUIREMENT';
const LINETYPE_REQUIREMENT_DIALOGUE = 'DIALOGUE_REQUIREMENT';
const LINETYPE_REQUIREMENT_INVENTORY = 'INVENTORY_REQUIREMENT';
const LINETYPE_REQUIREMENT_DATE = 'DATE_REQUIREMENT';
const LINETYPE_REQUIREMENT_PROPINNODE = 'PROPINNODE_REQUIREMENT';
const LINETYPE_REQUIREMENT_PROPHASTAGINNODE = 'PROPHASTAGINNODE_REQUIREMENT';
const LINETYPE_REQUIREMENT_TASKCOMPLETE = 'TASKCOMPLETE_REQUIREMENT';
const LINETYPE_REQUIREMENT_TUTORIAL = 'TUTORIAL_REQUIREMENT';
const LINETYPE_REQUIREMENT_QUICKPLAYSESSIONS = 'QUICKPLAYSESSIONS_REQUIREMENT';
const LINETYPE_INDEX = 'Index';
const LEVEL_DINER = 'DINER';
const JSON_SAVE_PATH = 'db://assets/resources/dialogueSets/';
const isNullOrWhiteSpace = (str) => {
    return !str || str.trim().length === 0;
};
const isNullOrEmpty = (str) => {
    return !str || str.length === 0;
};
class DialogueJsonConverter {
    constructor() {
        this.chapterTitle = '';
        this.currentDialogueSet = new DialogueSet_1.DialogueSet();
        this.chapterNum = 0;
        this.dialogueLocation = '';
        this.dialogueName = '';
        this.previousSpeaker = '';
        this.previousSide = '';
        this.previousDialogueType = DialogueSet_1.DialogueType.Speaking;
        this.dialogueLines = [];
        this.dialogueJsons = [];
    }
    async ParseJsonFiles(csvContent, fileName) {
        this.dialogueLines = [];
        this.chapterTitle = '';
        this.chapterNum = 0;
        this.resetParseState(fileName);
        let addingDialogue = false;
        let lineNumber = 0;
        let totalBoths = 0;
        this.previousSpeaker = '';
        this.previousSide = '';
        this.previousDialogueType = DialogueSet_1.DialogueType.Speaking;
        const lines = csvContent.split('\n');
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
                const dialogueId = `Chapter${this.chapterNum}-${this.dialogueName}`;
                this.currentDialogueSet.dialogueId = dialogueId;
                const jsonString = JSON.stringify(this.currentDialogueSet, null, 2).replace(/\\\\/g, '\\'); // Replace double backslashes with single backslashes
                const assetName = `Chapter${this.chapterNum}-${this.dialogueName.toUpperCase()}.json`;
                this.dialogueJsons.push({ name: assetName, json: jsonString });
                addingDialogue = false;
                continue;
            }
            let lineType = '';
            if (fields.length > 0) {
                lineType = fields[0];
            }
            if (lineType === LINETYPE_CHAPTER) {
                if (fields.length < 3 || isNullOrEmpty(fields[1]) || isNullOrEmpty(fields[2])) {
                    console.error(`Error: Dialogue ${this.dialogueName} missing Chapter Title or Number at [${lineNumber}:${fileName}]`);
                }
                else {
                    const parsedValue = parseInt(fields[1], 10);
                    if (isNaN(parsedValue)) {
                        console.error(`Invalid Chapter Num at [${lineNumber}:${fileName}]`);
                    }
                    else {
                        this.chapterNum = parsedValue;
                    }
                    this.chapterTitle = fields[2];
                }
            }
            else if (lineType === LINETYPE_LOCATION) {
                this.resetParseState(fileName);
                addingDialogue = false;
                if (fields.length < 2 || isNullOrEmpty(fields[1])) {
                    console.error(`Dialogue ${this.dialogueName} missing Location at [${lineNumber}:${fileName}]`);
                }
                this.dialogueLocation = fields[1];
            }
            else if (lineType === LINETYPE_NAME) {
                if (fields.length < 2 || isNullOrEmpty(fields[1])) {
                    console.error(`Dialogue ${this.dialogueName} missing Name at [${lineNumber}:${fileName}]`);
                }
                else {
                    this.dialogueName = fields[1];
                }
            }
            else if (lineType === LINETYPE_FORMAT) {
                let dialogueFormat = '';
                if (fields.length < 2 || isNullOrEmpty(fields[1])) {
                    console.error(`Dialogue ${this.dialogueName} missing Type at [${lineNumber}:${fileName}]`);
                }
                else {
                    dialogueFormat = fields[1];
                }
                if (dialogueFormat.toLowerCase() !== 'phone' && dialogueFormat.toLowerCase() !== 'default') {
                    console.error(`Dialogue ${this.dialogueName} error. Dialogue format must be 'phone' or 'default' at [${lineNumber}:${fileName}]`);
                }
                else {
                    this.currentDialogueSet.dialogueFormat = dialogueFormat;
                }
            }
            else if (lineType === LINETYPE_REPEATABLE) {
                let repeatableString = '';
                if (fields.length < 2 || isNullOrEmpty(fields[1])) {
                    console.error(`Dialogue ${this.dialogueName} missing Repeatable Boolean at [${lineNumber}:${fileName}]`);
                }
                else {
                    repeatableString = fields[1];
                }
                if (repeatableString.toLowerCase() !== 'true' && repeatableString.toLowerCase() !== 'false') {
                    console.error(`Dialogue ${this.dialogueName}. Repeatable boolean must be 'true' or 'false' at [${lineNumber}:${fileName}]`);
                }
                else {
                    this.currentDialogueSet.repeatable = this.parseStringToBool(repeatableString);
                }
            }
            else if (lineType === LINETYPE_REQUIREMENT_LEVEL) {
                this.handleRequirementLinetype(RequirementType_1.RequirementType.Level, fields, lineNumber, fileName);
            }
            else if (lineType === LINETYPE_REQUIREMENT_LEVELID) {
                this.handleRequirementLinetype(RequirementType_1.RequirementType.LevelId, fields, lineNumber, fileName);
            }
            else if (lineType === LINETYPE_REQUIREMENT_DIALOGUE) {
                this.handleRequirementLinetype(RequirementType_1.RequirementType.Dialogue, fields, lineNumber, fileName);
            }
            else if (lineType === LINETYPE_REQUIREMENT_INVENTORY) {
                this.handleRequirementLinetype(RequirementType_1.RequirementType.Inventory, fields, lineNumber, fileName);
            }
            else if (lineType === LINETYPE_REQUIREMENT_DATE) {
                this.handleRequirementLinetype(RequirementType_1.RequirementType.Date, fields, lineNumber, fileName);
            }
            else if (lineType === LINETYPE_REQUIREMENT_PROPINNODE) {
                this.handleRequirementLinetype(RequirementType_1.RequirementType.PropInNode, fields, lineNumber, fileName);
            }
            else if (lineType === LINETYPE_REQUIREMENT_PROPHASTAGINNODE) {
                this.handleRequirementLinetype(RequirementType_1.RequirementType.PropHasTagInNode, fields, lineNumber, fileName);
            }
            else if (lineType === LINETYPE_REQUIREMENT_TASKCOMPLETE) {
                this.handleRequirementLinetype(RequirementType_1.RequirementType.TaskComplete, fields, lineNumber, fileName);
            }
            else if (lineType === LINETYPE_REQUIREMENT_TUTORIAL) {
                this.handleRequirementLinetype(RequirementType_1.RequirementType.Tutorial, fields, lineNumber, fileName);
            }
            else if (lineType === LINETYPE_REQUIREMENT_QUICKPLAYSESSIONS) {
                this.handleRequirementLinetype(RequirementType_1.RequirementType.QuickPlaySessions, fields, lineNumber, fileName);
            }
            else if (lineType === LINETYPE_INDEX) {
                addingDialogue = true;
            }
            else if (!addingDialogue) {
                if (lineType != '') {
                    console.error(`Invalid line type at [${lineNumber}:${fileName}] `, lineType);
                }
            }
            else {
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
                    if (dialogueType === DialogueSet_1.DialogueType.Speaking) {
                        if (side.toLowerCase() != 'left' &&
                            side.toLowerCase() != 'right' &&
                            side.toLowerCase() != 'both' &&
                            side.toLowerCase() != 'none') {
                            console.error(`Dialogue ${this.dialogueName}. Error at [${lineNumber}:${fileName}]: For Speaking dialogue, Side must be set to Left, Right, Or Both.`);
                        }
                    }
                    //checks if a new section should be made
                    if (side.toLowerCase() != 'both') {
                        if ((this.previousSpeaker != speaker || this.previousSide != side) && this.dialogueLines.length > 0) {
                            this.createNewSingleDialogueSection(this.previousSpeaker, this.previousSide, this.previousDialogueType);
                            this.dialogueLines = [];
                        }
                        let dialogueLineToAdd = new DialogueSet_1.DialogueLine();
                        dialogueLineToAdd.line = dialogue;
                        dialogueLineToAdd.characterSprites = [expression];
                        this.dialogueLines.push(dialogueLineToAdd);
                    }
                    else if (side.toLowerCase() === 'both' && this.previousSide.toLowerCase() != 'both' && totalBoths % 2 === 0) {
                        totalBoths++;
                        if (this.dialogueLines.length > 0) {
                            this.createNewSingleDialogueSection(this.previousSpeaker, this.previousSide, this.previousDialogueType);
                            this.dialogueLines = [];
                        }
                        let dialogueLineToAdd = new DialogueSet_1.DialogueLine();
                        dialogueLineToAdd.line = dialogue;
                        dialogueLineToAdd.characterSprites = [expression];
                        this.dialogueLines.push(dialogueLineToAdd);
                    }
                    else if (side.toLowerCase() === 'both' && this.previousSide.toLowerCase() === 'both' && totalBoths % 2 != 0) {
                        totalBoths++;
                        this.dialogueLines[this.dialogueLines.length - 1].characterSprites.push(expression);
                        this.createNewMultiDialogueSection(this.previousSpeaker, speaker);
                        this.dialogueLines = [];
                    }
                    else {
                        console.error(`Dialogue ${this.dialogueName}. Error at [${lineNumber}:${fileName}]: There is no matching line labeled Both that corresponds to this line`);
                    }
                    this.previousSpeaker = speaker;
                    this.previousSide = side;
                    this.previousDialogueType = dialogueType;
                    if (unskippable != '' && !isNullOrWhiteSpace(unskippable)) {
                        if (unskippable && unskippable.toLowerCase() === 'true') {
                            this.dialogueLines[this.dialogueLines.length - 1].unskippable = true;
                        }
                    }
                    else {
                        console.error(`Dialogue ${this.dialogueName}. Error at [${lineNumber}:${fileName}]: Unskippable is not set to true or false, using default value of false`);
                    }
                }
                catch (err) {
                    console.error(`Dialogue ${this.dialogueName}.Error: ` + err);
                }
            }
        }
        return this.dialogueJsons;
    }
    createNewSingleDialogueSection(speaker, side, dialogueType) {
        let section = new DialogueSet_1.DialogueSection();
        section.characterSide = side.toLowerCase() === 'left' ? DialogueSet_1.SideOfScreen.Left : DialogueSet_1.SideOfScreen.Right;
        section.characterNames = [this.toTitleCaseNoSpaces(speaker)];
        section.dialogueType = dialogueType;
        section.lines = this.dialogueLines;
        this.currentDialogueSet.dialogueSections.push(section);
    }
    createNewMultiDialogueSection(leftSpeaker, rightSpeaker) {
        let section = new DialogueSet_1.DialogueSection();
        section.characterSide = DialogueSet_1.SideOfScreen.Both;
        section.characterNames = [leftSpeaker, rightSpeaker];
        section.dialogueType = DialogueSet_1.DialogueType.Speaking;
        section.lines = this.dialogueLines;
        this.currentDialogueSet.dialogueSections.push(section);
    }
    async SaveJsonsAsDialogueSets(dialogueJsons) {
        for (const dialogueJson of dialogueJsons) {
            try {
                let chapterNum = 0;
                const parsedValue = parseInt(dialogueJson.name.charAt(7), 10);
                if (isNaN(parsedValue)) {
                    console.error(`Dialogue ${this.dialogueName}. Cannot Parse Chapter Num Successfully`);
                }
                else {
                    chapterNum = parsedValue;
                }
                if (chapterNum === 0) {
                    console.log(`Dialogue ${this.dialogueName}. Error: Chapter Num not parsed correctly or invalid`);
                }
                const fullFilePath = JSON_SAVE_PATH + `chapter${chapterNum}/${dialogueJson.name}`;
                const exists = await Editor.Message.request('asset-db', 'query-asset-info', fullFilePath);
                if (exists) {
                    await Editor.Message.request('asset-db', 'save-asset', fullFilePath, dialogueJson.json);
                }
                else {
                    await Editor.Message.send('asset-db', 'create-asset', fullFilePath, dialogueJson.json);
                    await Editor.Message.request('asset-db', 'refresh-asset', fullFilePath);
                }
                console.log('DialogueSet saved to JSON file successfully: ' + fullFilePath);
            }
            catch (error) {
                console.error(`Dialogue ${this.dialogueName}. Error writing JSON to file:`, error);
            }
        }
    }
    static parseLine(line) {
        let fields = [];
        let inQuotes = false;
        let field = '';
        for (let i = 0; i < line.length; i++) {
            let currentChar = line[i];
            if (currentChar == '"' && (i == 0 || line[i - 1] != '\\')) {
                inQuotes = !inQuotes;
            }
            else if (currentChar == ',' && !inQuotes) {
                fields.push(field.trim());
                field = '';
            }
            else {
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
    toTitleCaseNoSpaces(input) {
        if (isNullOrEmpty(input)) {
            return '';
        }
        // Match words ending with a space or hyphen, or camel case boundaries
        const parts = input.match(/([A-Z]?[a-z]+[ _-]?|[A-Z]+(?![a-z])[ _-]?|[A-Z]?[a-z]+|[A-Z]+)/g);
        if (!parts)
            return input;
        return parts
            .map((part) => {
            if (/^[- _]+$/.test(part))
                return part;
            const firstChar = part[0].toUpperCase();
            const rest = part.slice(1).toLowerCase();
            return firstChar + rest;
        })
            .join('');
    }
    parseStringToBool(value) {
        if (value.toLowerCase() === 'true') {
            return true;
        }
        else if (value.toLowerCase() === 'false') {
            return false;
        }
        console.error(`Dialogue ${this.dialogueName}. Error: Failed to parse string as bool: '" + value + "'. Defaulting to false`);
        return false;
    }
    handleRequirementLinetype(requirementType, fields, lineNumber, fileName) {
        //Remove the LineType from the fields
        fields.splice(0, 1);
        switch (requirementType) {
            case RequirementType_1.RequirementType.Level:
                this.parseLevelRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType_1.RequirementType.LevelId:
                this.parseLevelIdRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType_1.RequirementType.Dialogue:
                this.parseDialogueRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType_1.RequirementType.Date:
                this.parseDateRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType_1.RequirementType.Inventory:
                this.parseInventoryRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType_1.RequirementType.PropHasTagInNode:
                this.parsePropHasTagInNodeRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType_1.RequirementType.PropInNode:
                this.parsePropInNodeRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType_1.RequirementType.TaskComplete:
                this.parseTaskRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType_1.RequirementType.Tutorial:
                this.parseTutorialRequirement(fields, lineNumber, fileName);
                break;
            case RequirementType_1.RequirementType.QuickPlaySessions:
                this.parseQuickPlaySessionsRequirement(fields, lineNumber, fileName);
                break;
        }
    }
    parseLevelRequirement(fields, lineNumber, fileName) {
        let level = 0;
        let operator = ComparisonOperator_1.ComparisonOperator.equal;
        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }
        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];
            if (paramName === 'operator') {
                if (paramValue in ComparisonOperator_1.ComparisonOperator) {
                    operator = paramValue;
                }
                else {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid LevelRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'equal'`);
                }
            }
            else if (paramName === 'level') {
                level = Number(paramValue);
                if (isNaN(level)) {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid LevelRequirement Level Number at [${lineNumber}:${fileName}]`);
                }
            }
            else {
                console.error(`Dialogue ${this.dialogueName}. Error: Invalid LevelRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`);
            }
            //remove the handled fields from the list
            fields.splice(0, 2);
        }
        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(`Dialogue ${this.dialogueName}. Error: LevelRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`);
        }
        let levelRequirementData = new LevelRequirement_1.LevelRequirement(RequirementType_1.RequirementType.Level, level, operator);
        this.currentDialogueSet.requirements.push(levelRequirementData);
    }
    parseDialogueRequirement(fields, lineNumber, fileName) {
        let dialogueId = '';
        let operator = DialogueRequirement_1.DialogueOperator.hasSeen;
        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }
        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];
            if (paramName === 'operator') {
                if (paramValue in DialogueRequirement_1.DialogueOperator) {
                    operator = paramValue;
                }
                else {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid DialogueRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'hasSeen'`);
                }
            }
            else if (paramName === 'dialogueId') {
                dialogueId = paramValue;
            }
            else {
                console.error(`Dialogue ${this.dialogueName}. Error: Invalid DialogueRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`);
            }
            //remove the handled fields from the list
            fields.splice(0, 2);
        }
        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(`Dialogue ${this.dialogueName}. Error: DialogueRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`);
        }
        let dialogueRequirementData = new DialogueRequirement_1.DialogueRequirement(RequirementType_1.RequirementType.Dialogue, dialogueId, operator);
        this.currentDialogueSet.requirements.push(dialogueRequirementData);
    }
    parseLevelIdRequirement(fields, lineNumber, fileName) {
        let levelId = '';
        let operator = LevelIdRequirement_1.LevelIdComparisonOperator.complete;
        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }
        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];
            if (paramName === 'operator') {
                if (paramValue in LevelIdRequirement_1.LevelIdComparisonOperator) {
                    operator = paramValue;
                }
                else {
                    console.error(`LevelId ${this.dialogueName}. Error: Invalid LevelIdRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'complete'`);
                }
            }
            else if (paramName === 'levelId') {
                levelId = paramValue;
            }
            else {
                console.error(`Dialogue ${this.dialogueName}. Error: Invalid LevelIdRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`);
            }
            //remove the handled fields from the list
            fields.splice(0, 2);
        }
        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(`Dialogue ${this.dialogueName}. Error: LevelIdRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`);
        }
        let dialogueRequirementData = new LevelIdRequirement_1.LevelIdRequirement(RequirementType_1.RequirementType.LevelId, levelId, operator);
        this.currentDialogueSet.requirements.push(dialogueRequirementData);
    }
    parseDateRequirement(fields, lineNumber, fileName) {
        let date = new Date();
        let endDate = new Date();
        let dateOperator = DateRequirement_1.DateOperator.after;
        const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }
        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];
            if (paramName === 'operator') {
                if (paramValue in DateRequirement_1.DateOperator) {
                    dateOperator = paramValue;
                }
                else {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid DateRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'after'`);
                }
            }
            else if (paramName === 'date') {
                //Checks if the given string is a valid ISO 8601 Date
                if (dateRegex.test(paramValue)) {
                    date = new Date(paramValue);
                    if (isNaN(date.getTime())) {
                        console.error(`Dialogue ${this.dialogueName}. Error: Invalid DateRequirement Date at [${lineNumber}:${fileName}]`);
                    }
                }
                else {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid DateRequirement Date at [${lineNumber}:${fileName}]`);
                }
            }
            else if (paramName === 'endDate') {
                //Checks if the given string is a valid ISO 8601 Date
                if (dateRegex.test(paramValue)) {
                    endDate = new Date(paramValue);
                    if (isNaN(endDate.getTime())) {
                        console.error(`Dialogue ${this.dialogueName}. Error: Invalid DateRequirement EndDate at [${lineNumber}:${fileName}]`);
                    }
                }
                else {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid DateRequirement End Date at [${lineNumber}:${fileName}]`);
                }
            }
            else {
                console.error(`Dialogue ${this.dialogueName}. Error: Invalid DateRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`);
            }
            //remove the handled fields from the list
            fields.splice(0, 2);
        }
        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(`Dialogue ${this.dialogueName}. Error: DateRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`);
        }
        let dateRequirementData = new DateRequirement_1.DateRequirement(RequirementType_1.RequirementType.Date, date, endDate, dateOperator);
        this.currentDialogueSet.requirements.push(dateRequirementData);
    }
    parseInventoryRequirement(fields, lineNumber, fileName) {
        let itemId = '';
        let itemCount = 0;
        let operator = ComparisonOperator_1.ComparisonOperator.equal;
        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }
        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];
            if (paramName === 'operator') {
                if (paramValue in ComparisonOperator_1.ComparisonOperator) {
                    operator = paramValue;
                }
                else {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid InventoryRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'equal'`);
                }
            }
            else if (paramName === 'itemId') {
                itemId = paramValue;
            }
            else if (paramName === 'itemCount') {
                itemCount = Number(paramValue);
                if (isNaN(itemCount)) {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid InventoryRequirement Item Count Value at [${lineNumber}:${fileName}]`);
                }
            }
            else {
                console.error(`Dialogue ${this.dialogueName}. Error: Invalid InventoryRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`);
            }
            //remove the handled fields from the list
            fields.splice(0, 2);
        }
        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(`Dialogue ${this.dialogueName}. Error: InventoryRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`);
        }
        let inventoryRequirementData = new InventoryRequirement_1.InventoryRequirement(RequirementType_1.RequirementType.Inventory, itemId, itemCount, operator);
        this.currentDialogueSet.requirements.push(inventoryRequirementData);
    }
    parsePropInNodeRequirement(fields, lineNumber, fileName) {
        let propId = '';
        let nodeId = '';
        let operator = StringComparisonOperator_1.StringComparisonOperator.equal;
        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }
        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];
            if (paramName === 'operator') {
                if (paramValue in StringComparisonOperator_1.StringComparisonOperator) {
                    operator = paramValue;
                }
                else {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid PropInNodeRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'equal'`);
                }
            }
            else if (paramName === 'propId') {
                propId = paramValue;
            }
            else if (paramName === 'nodeId') {
                nodeId = paramValue;
            }
            else {
                console.error(`Dialogue ${this.dialogueName}. Error: Invalid PropInNodeRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`);
            }
            //remove the handled fields from the list
            fields.splice(0, 2);
        }
        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(`Dialogue ${this.dialogueName}. Error: PropInNodeRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`);
        }
        let propInNodeRequirementData = new PropInNodeRequirement_1.PropInNodeRequirement(RequirementType_1.RequirementType.PropInNode, propId, nodeId, operator);
        this.currentDialogueSet.requirements.push(propInNodeRequirementData);
    }
    parseTaskRequirement(fields, lineNumber, fileName) {
        let taskId = '';
        let operator = StringComparisonOperator_1.StringComparisonOperator.equal;
        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }
        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];
            if (paramName === 'taskId') {
                taskId = paramValue;
            }
            else {
                console.error(`Dialogue ${this.dialogueName}. Error: Invalid TaskRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`);
            }
            //remove the handled fields from the list
            fields.splice(0, 2);
        }
        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(`Dialogue ${this.dialogueName}. Error: TaskRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`);
        }
        let taskRequirementData = new TaskCompleteRequirement_1.TaskCompleteRequirement(RequirementType_1.RequirementType.TaskComplete, taskId);
        this.currentDialogueSet.requirements.push(taskRequirementData);
    }
    parseTutorialRequirement(fields, lineNumber, fileName) {
        let tutorialId = '';
        let operator = TutorialRequirement_1.TutorialOperator.hasSeen;
        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }
        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];
            if (paramName === 'operator') {
                if (paramValue in TutorialRequirement_1.TutorialOperator) {
                    operator = paramValue;
                }
                else {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid TutorialRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'hasSeen'`);
                }
            }
            else if (paramName === 'tutorialId') {
                tutorialId = paramValue;
            }
            else {
                console.error(`Dialogue ${this.dialogueName}. Error: Invalid TutorialRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`);
            }
            //remove the handled fields from the list
            fields.splice(0, 2);
        }
        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(`Dialogue ${this.dialogueName}. Error: TutorialRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`);
        }
        let tutorialRequirementData = new TutorialRequirement_1.TutorialRequirement(RequirementType_1.RequirementType.Tutorial, tutorialId, operator);
        this.currentDialogueSet.requirements.push(tutorialRequirementData);
    }
    parseQuickPlaySessionsRequirement(fields, lineNumber, fileName) {
        let playCount = 0;
        let operator = ComparisonOperator_1.ComparisonOperator.equal;
        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }
        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];
            if (paramName === 'operator') {
                if (paramValue in ComparisonOperator_1.ComparisonOperator) {
                    operator = paramValue;
                }
                else {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid QuickPlaySessionsRequirement Operator at [${lineNumber}:${fileName}]. Defaulting to 'equal'`);
                }
            }
            else if (paramName === 'playCount') {
                playCount = Number(paramValue);
                if (isNaN(playCount)) {
                    console.error(`Dialogue ${this.dialogueName}. Error: Invalid QuickPlaySessionsRequirement PlayCount Number at [${lineNumber}:${fileName}]`);
                }
            }
            else {
                console.error(`Dialogue ${this.dialogueName}. Error: Invalid QuickPlaySessionsRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`);
            }
            //remove the handled fields from the list
            fields.splice(0, 2);
        }
        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(`Dialogue ${this.dialogueName}. Error: QuickPlaySessionsRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`);
        }
        let quickPlaySessionsReqData = new QuickPlaySessionsRequirement_1.QuickPlaySessionsRequirement(RequirementType_1.RequirementType.QuickPlaySessions, playCount, operator);
        this.currentDialogueSet.requirements.push(quickPlaySessionsReqData);
    }
    parsePropHasTagInNodeRequirement(fields, lineNumber, fileName) {
        let nodeId = '';
        let tag = '';
        // Trim whitespace cells
        while (fields.length > 0 && fields[fields.length - 1].trim() === '') {
            fields.pop();
        }
        while (fields.length >= 2) {
            const paramName = fields[0];
            const paramValue = fields[1];
            if (paramName === 'nodeId') {
                nodeId = paramValue;
            }
            else if (paramName === 'tag') {
                tag = paramValue;
            }
            else {
                console.error(`Dialogue ${this.dialogueName}. Error: Invalid PropHasTagInNodeRequirement Parameter Name at [${lineNumber}:${fileName}]. (${paramName})`);
            }
            //remove the handled fields from the list
            fields.splice(0, 2);
        }
        //if there are any leftover fields, that means the parameters were not set up correctly in the google sheets
        if (fields.length > 0) {
            console.error(`Dialogue ${this.dialogueName}. Error: PropHasTagInNodeRequirement Parameter values do not match up with their names correctly at [${lineNumber}:${fileName}]`);
        }
        let propHasTagInNodeRequirementData = new PropHasTagInNodeRequirement_1.PropHasTagInNodeRequirement(RequirementType_1.RequirementType.PropHasTagInNode, tag, nodeId);
        this.currentDialogueSet.requirements.push(propHasTagInNodeRequirementData);
    }
    resetParseState(fileName) {
        this.dialogueLocation = '';
        this.dialogueName = '';
        this.currentDialogueSet = new DialogueSet_1.DialogueSet();
        this.currentDialogueSet.dialogueSections = [];
        this.currentDialogueSet.sourceFile = fileName;
    }
}
exports.DialogueJsonConverter = DialogueJsonConverter;
