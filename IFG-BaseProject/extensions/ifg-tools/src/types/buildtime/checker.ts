import { Static, TSchema, Type, TypeRegistry } from '@sinclair/typebox';
import { DefaultErrorFunction, SetErrorFunction, ValueError, ValueErrorIterator } from '@sinclair/typebox/errors';
import { Value } from '@sinclair/typebox/value';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import {
    AppConfig,
    Chapter,
    DailyPrizeConfig,
    DialogueSet,
    InternalStoreConfig,
    ItemConfig,
    LevelList,
    NodeData,
    PropData,
    StoreConfig,
    TutorialData
} from '../runtime/definitions';
import { addIdentifier, mode, reset, setMode } from '../runtime/identifiers';
import { registerErrorFunctions } from './registerErrorFunction';
import { registerTypes } from './registerTypes';

export function check(
    pathPrefix: string,
    errorHandler: (path: string, schema: TSchema | null, errorIterator: ValueErrorIterator | null) => void
) {
    reset();
    registerTypes(TypeRegistry.Set, pathPrefix);
    registerErrorFunctions(SetErrorFunction, DefaultErrorFunction, pathPrefix);

    addIdentifier('Item', 'powerup_dailyprize');
    addIdentifier('Level', 'freeplay');

    let errors = 0;

    function checkAll() {
        checkDirectory(path.join(pathPrefix, 'assets/resources/dialogueSets'), DialogueSet);
        checkDirectory(path.join(pathPrefix, 'assets/resources/config/tasks'), Chapter);
        checkDirectory(path.join(pathPrefix, 'assets/resources/config/store'), StoreConfig, ['internal.json']);
        check(path.join(pathPrefix, 'assets/resources/config/store/internal.json'), InternalStoreConfig);
        checkDirectory(path.join(pathPrefix, 'assets/resources/config/items'), ItemConfig);
        checkDirectory(path.join(pathPrefix, 'assets/resources/diner/props'), PropData);
        checkDirectory(path.join(pathPrefix, 'assets/resources/diner/nodes'), NodeData);
        checkDirectory(path.join(pathPrefix, 'assets/resources/levels/lists'), LevelList);
        check(path.join(pathPrefix, 'assets/resources/config/tutorial.json'), TutorialData);
        check(path.join(pathPrefix, 'assets/resources/config/dailyPrizes.json'), DailyPrizeConfig);
        // appConfig.json is not a complete AppConfig, so Type.Partial to make all fields optional
        // could be more precise
        check(path.join(pathPrefix, 'assets/resources/config/appConfig.json'), Type.Partial(AppConfig));
    }

    setMode('collect');
    checkAll();

    if (errors > 0) {
        return;
    }

    setMode('verify');
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
    function findAllJsonFiles(dir: string, exclude: string[], fileList: string[]): string[] {
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (exclude.includes(entry.name)) {
                continue;
            }
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                findAllJsonFiles(fullPath, exclude, fileList);
            } else if (entry.isFile() && entry.name.endsWith('.json')) {
                fileList.push(fullPath);
            }
        }

        return fileList;
    }

    function check(path: string, schema: TSchema) {
        const data = readFileSync(path, 'utf-8');
        const parsed = JSON.parse(data);
        if (!Value.Check(schema, parsed)) {
            errors++;
            errorHandler(path, schema, Value.Errors(schema, parsed));
        }
    }

    function checkDirectory(path: string, schema: TSchema, exclude: string[] = []) {
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

    function checkTaskCSEs(pathPrefix: string) {
        setMode('noop');
        type Chapter = Static<typeof Chapter>;
        const taskSchema = Chapter;
        const taskFiles = findAllJsonFiles(path.join(pathPrefix, 'assets/resources/config/tasks'), [], []);
        let chapters: Record<string, Chapter> = {};
        taskFiles.forEach((path) => {
            const data = readFileSync(path, 'utf-8');
            const parsed = JSON.parse(data);
            if (!Value.Check(taskSchema, parsed)) {
                errorHandler(path, taskSchema, Value.Errors(taskSchema, parsed));
                return;
            }
            chapters[path] = parsed;
        });

        const nodeFiles = findAllJsonFiles(path.join(pathPrefix, 'assets/resources/diner/nodes'), [], []);
        type NodeData = Static<typeof NodeData>;
        const nodeSchema = NodeData;
        let nodes: NodeData[] = [];
        nodeFiles.forEach((path) => {
            const data = readFileSync(path, 'utf-8');
            const parsed = JSON.parse(data);
            if (!Value.Check(nodeSchema, parsed)) {
                errorHandler(path, nodeSchema, Value.Errors(nodeSchema, parsed));
                return;
            }
            nodes.push(parsed);
        });

        const propFiles = findAllJsonFiles(path.join(pathPrefix, 'assets/resources/diner/props'), [], []);
        type PropData = Static<typeof PropData>;
        const propSchema = PropData;
        let props: PropData[] = [];
        propFiles.forEach((path) => {
            const data = readFileSync(path, 'utf-8');
            const parsed = JSON.parse(data);
            if (!Value.Check(propSchema, parsed)) {
                errorHandler(path, propSchema, Value.Errors(propSchema, parsed));
                return;
            }
            props.push(parsed);
        });

        const storeFile = path.join(pathPrefix, 'assets/resources/config/store/diner.json');
        type StoreConfig = Static<typeof StoreConfig>;
        const storeSchema = StoreConfig;

        const storeData = readFileSync(storeFile, 'utf-8');
        const parsedStore = JSON.parse(storeData);
        if (!Value.Check(storeSchema, parsedStore)) {
            errorHandler(storeFile, storeSchema, Value.Errors(storeSchema, parsedStore));
            return;
        }
        let storeConfig: StoreConfig = parsedStore;

        for (const path in chapters) {
            let completionSequenceEventErrors: string[] = [];
            let insufficientPropsFound: boolean = false;
            let noFreePropsFound: boolean = false;
            for (const task of chapters[path].tasks) {
                for (const sequence of task.completionSequences) {
                    for (const event of sequence.events) {
                        if (event.eventData.eventType !== 'placeProp') {
                            continue;
                        }

                        const nodeId = event.eventData.nodeId;
                        const node = nodes.find((n) => n.id === nodeId);

                        let minimumPropCount: number = 1;

                        if (node?.isStatic) {
                            minimumPropCount = 2;
                        }

                        const validPropsForNode = props.filter((p) => node?.tags.every((v) => p.tags?.includes(v)));

                        const eventTags = event.eventData.propTags;
                        const validPropsForEvent = validPropsForNode.filter((p) => eventTags.every((v) => p.tags?.includes(v)));

                        if (validPropsForEvent.length < minimumPropCount) {
                            insufficientPropsFound = true;
                            completionSequenceEventErrors.push(
                                `Could not find enough valid props to satisfy the minimum requirment of ${minimumPropCount} for Place Prop Event in Completion Sequence of ${task.name}.`
                            );
                        }

                        let freePropFound = false;
                        for (const prop of validPropsForEvent) {
                            let storeItem = storeConfig.items?.find((i) => i.contents.find((c) => c.id === prop.id));
                            if (storeItem?.cost.amount === 0 && storeItem?.cost.currency === 'coins') {
                                freePropFound = true;
                            }
                        }

                        if (!freePropFound) {
                            noFreePropsFound = true;
                            completionSequenceEventErrors.push(
                                `Could not find any free props to choose for Place Prop Event in Completion Sequence of ${task.id}.`
                            );
                        }
                    }
                }
            }

            if (completionSequenceEventErrors.length > 0) {
                if (insufficientPropsFound) {
                    completionSequenceEventErrors.push('Please ensure there are sufficient props tagged to match each event.');
                }

                if (noFreePropsFound) {
                    completionSequenceEventErrors.push(
                        'Please ensure there is at least one free prop to choose that is not the expected active prop in each event.'
                    );
                }

                errorHandler(
                    `Error(s) found in ${chapters[path].name} at path "${path}":\n${JSON.stringify(completionSequenceEventErrors, null, '  ')}`,
                    null,
                    null
                );
            }
        }
    }
}

export function expandError(errors: ValueErrorIterator): Omit<ValueError, 'errors' | 'schema'>[] {
    return Array.from(errors).map((valueError) => {
        return {
            ...valueError,
            schema: undefined,
            errors: valueError.errors.flatMap((err) => expandError(err))
        };
    });
}
