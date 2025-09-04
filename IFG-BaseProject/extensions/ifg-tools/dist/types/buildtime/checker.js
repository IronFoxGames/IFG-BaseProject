"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandError = exports.check = void 0;
const typebox_1 = require("@sinclair/typebox");
const errors_1 = require("@sinclair/typebox/errors");
const value_1 = require("@sinclair/typebox/value");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const definitions_1 = require("../runtime/definitions");
const identifiers_1 = require("../runtime/identifiers");
const registerErrorFunction_1 = require("./registerErrorFunction");
const registerTypes_1 = require("./registerTypes");
function check(pathPrefix, errorHandler) {
    (0, identifiers_1.reset)();
    (0, registerTypes_1.registerTypes)(typebox_1.TypeRegistry.Set, pathPrefix);
    (0, registerErrorFunction_1.registerErrorFunctions)(errors_1.SetErrorFunction, errors_1.DefaultErrorFunction, pathPrefix);
    (0, identifiers_1.addIdentifier)('Item', 'powerup_dailyprize');
    (0, identifiers_1.addIdentifier)('Level', 'freeplay');
    let errors = 0;
    function checkAll() {
        checkDirectory(path_1.default.join(pathPrefix, 'assets/resources/dialogueSets'), definitions_1.DialogueSet);
        checkDirectory(path_1.default.join(pathPrefix, 'assets/resources/config/tasks'), definitions_1.Chapter);
        checkDirectory(path_1.default.join(pathPrefix, 'assets/resources/config/store'), definitions_1.StoreConfig, ['internal.json']);
        check(path_1.default.join(pathPrefix, 'assets/resources/config/store/internal.json'), definitions_1.InternalStoreConfig);
        checkDirectory(path_1.default.join(pathPrefix, 'assets/resources/config/items'), definitions_1.ItemConfig);
        checkDirectory(path_1.default.join(pathPrefix, 'assets/resources/diner/props'), definitions_1.PropData);
        checkDirectory(path_1.default.join(pathPrefix, 'assets/resources/diner/nodes'), definitions_1.NodeData);
        checkDirectory(path_1.default.join(pathPrefix, 'assets/resources/levels/lists'), definitions_1.LevelList);
        check(path_1.default.join(pathPrefix, 'assets/resources/config/tutorial.json'), definitions_1.TutorialData);
        check(path_1.default.join(pathPrefix, 'assets/resources/config/dailyPrizes.json'), definitions_1.DailyPrizeConfig);
        // appConfig.json is not a complete AppConfig, so Type.Partial to make all fields optional
        // could be more precise
        check(path_1.default.join(pathPrefix, 'assets/resources/config/appConfig.json'), typebox_1.Type.Partial(definitions_1.AppConfig));
    }
    (0, identifiers_1.setMode)('collect');
    checkAll();
    if (errors > 0) {
        return;
    }
    (0, identifiers_1.setMode)('verify');
    checkAll();
    if (errors > 0) {
        return;
    }
    checkTaskCSEs(pathPrefix);
    /**
     * Recursively finds all .json files under a directory.
     * @param dir - The starting directory path.
     * @param fileList - Internal accumulator for recursive traversal.
     * @returns Array of absolute paths to JSON files.
     */
    function findAllJsonFiles(dir, exclude, fileList) {
        const entries = (0, fs_1.readdirSync)(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (exclude.includes(entry.name)) {
                continue;
            }
            const fullPath = path_1.default.join(dir, entry.name);
            if (entry.isDirectory()) {
                findAllJsonFiles(fullPath, exclude, fileList);
            }
            else if (entry.isFile() && entry.name.endsWith('.json')) {
                fileList.push(fullPath);
            }
        }
        return fileList;
    }
    function check(path, schema) {
        const data = (0, fs_1.readFileSync)(path, 'utf-8');
        const parsed = JSON.parse(data);
        if (!value_1.Value.Check(schema, parsed)) {
            errors++;
            errorHandler(path, schema, value_1.Value.Errors(schema, parsed));
        }
    }
    function checkDirectory(path, schema, exclude = []) {
        const files = findAllJsonFiles(path, exclude, []);
        files.forEach((file) => check(file, schema));
    }
    // console.log(JSON.stringify(getIdentifiers(), replacer, 2));
    // function replacer(key: string, value: any) {
    //   if (value instanceof Set) {
    //     return [...value];
    //   }
    //   return value;
    // }
    function checkTaskCSEs(pathPrefix) {
        var _a;
        (0, identifiers_1.setMode)('noop');
        const taskSchema = definitions_1.Chapter;
        const taskFiles = findAllJsonFiles(path_1.default.join(pathPrefix, 'assets/resources/config/tasks'), [], []);
        let chapters = {};
        taskFiles.forEach((path) => {
            const data = (0, fs_1.readFileSync)(path, 'utf-8');
            const parsed = JSON.parse(data);
            if (!value_1.Value.Check(taskSchema, parsed)) {
                errorHandler(path, taskSchema, value_1.Value.Errors(taskSchema, parsed));
                return;
            }
            chapters[path] = parsed;
        });
        const nodeFiles = findAllJsonFiles(path_1.default.join(pathPrefix, 'assets/resources/diner/nodes'), [], []);
        const nodeSchema = definitions_1.NodeData;
        let nodes = [];
        nodeFiles.forEach((path) => {
            const data = (0, fs_1.readFileSync)(path, 'utf-8');
            const parsed = JSON.parse(data);
            if (!value_1.Value.Check(nodeSchema, parsed)) {
                errorHandler(path, nodeSchema, value_1.Value.Errors(nodeSchema, parsed));
                return;
            }
            nodes.push(parsed);
        });
        const propFiles = findAllJsonFiles(path_1.default.join(pathPrefix, 'assets/resources/diner/props'), [], []);
        const propSchema = definitions_1.PropData;
        let props = [];
        propFiles.forEach((path) => {
            const data = (0, fs_1.readFileSync)(path, 'utf-8');
            const parsed = JSON.parse(data);
            if (!value_1.Value.Check(propSchema, parsed)) {
                errorHandler(path, propSchema, value_1.Value.Errors(propSchema, parsed));
                return;
            }
            props.push(parsed);
        });
        const storeFile = path_1.default.join(pathPrefix, 'assets/resources/config/store/diner.json');
        const storeSchema = definitions_1.StoreConfig;
        const storeData = (0, fs_1.readFileSync)(storeFile, 'utf-8');
        const parsedStore = JSON.parse(storeData);
        if (!value_1.Value.Check(storeSchema, parsedStore)) {
            errorHandler(storeFile, storeSchema, value_1.Value.Errors(storeSchema, parsedStore));
            return;
        }
        let storeConfig = parsedStore;
        for (const path in chapters) {
            let completionSequenceEventErrors = [];
            let insufficientPropsFound = false;
            let noFreePropsFound = false;
            for (const task of chapters[path].tasks) {
                for (const sequence of task.completionSequences) {
                    for (const event of sequence.events) {
                        if (event.eventData.eventType !== 'placeProp') {
                            continue;
                        }
                        const nodeId = event.eventData.nodeId;
                        const node = nodes.find((n) => n.id === nodeId);
                        let minimumPropCount = 1;
                        if (node === null || node === void 0 ? void 0 : node.isStatic) {
                            minimumPropCount = 2;
                        }
                        const validPropsForNode = props.filter((p) => node === null || node === void 0 ? void 0 : node.tags.every((v) => { var _a; return (_a = p.tags) === null || _a === void 0 ? void 0 : _a.includes(v); }));
                        const eventTags = event.eventData.propTags;
                        const validPropsForEvent = validPropsForNode.filter((p) => eventTags.every((v) => { var _a; return (_a = p.tags) === null || _a === void 0 ? void 0 : _a.includes(v); }));
                        if (validPropsForEvent.length < minimumPropCount) {
                            insufficientPropsFound = true;
                            completionSequenceEventErrors.push(`Could not find enough valid props to satisfy the minimum requirment of ${minimumPropCount} for Place Prop Event in Completion Sequence of ${task.name}.`);
                        }
                        let freePropFound = false;
                        for (const prop of validPropsForEvent) {
                            let storeItem = (_a = storeConfig.items) === null || _a === void 0 ? void 0 : _a.find((i) => i.contents.find((c) => c.id === prop.id));
                            if ((storeItem === null || storeItem === void 0 ? void 0 : storeItem.cost.amount) === 0 && (storeItem === null || storeItem === void 0 ? void 0 : storeItem.cost.currency) === 'coins') {
                                freePropFound = true;
                            }
                        }
                        if (!freePropFound) {
                            noFreePropsFound = true;
                            completionSequenceEventErrors.push(`Could not find any free props to choose for Place Prop Event in Completion Sequence of ${task.id}.`);
                        }
                    }
                }
            }
            if (completionSequenceEventErrors.length > 0) {
                if (insufficientPropsFound) {
                    completionSequenceEventErrors.push('Please ensure there are sufficient props tagged to match each event.');
                }
                if (noFreePropsFound) {
                    completionSequenceEventErrors.push('Please ensure there is at least one free prop to choose that is not the expected active prop in each event.');
                }
                errorHandler(`Error(s) found in ${chapters[path].name} at path "${path}":\n${JSON.stringify(completionSequenceEventErrors, null, '  ')}`, null, null);
            }
        }
    }
}
exports.check = check;
function expandError(errors) {
    return Array.from(errors).map((valueError) => {
        return Object.assign(Object.assign({}, valueError), { schema: undefined, errors: valueError.errors.flatMap((err) => expandError(err)) });
    });
}
exports.expandError = expandError;
