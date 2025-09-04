// @ts-ignore
import { check, expandError } from './types/buildtime/checker';

const name = 'ifg-tools';

export const methods: { [key: string]: (...any: any) => any } = {
    openLevelEditorPanel() {
        Editor.Panel.open(name + '.level-editor', {
            width: 1400,
            height: 900
        });
    },
    openTemplateEditorPanel() {
        Editor.Panel.open(name + '.template-editor');
    },
    openDialogueImporterPanel() {
        Editor.Panel.open(name + '.dialogue-importer');
    },
    openAssetsPanel() {
        Editor.Panel.open(name + '.assets-panel');
    },
    openTaskEditorPanel() {
        Editor.Panel.open(name + '.task-editor');
    },
    checkConfigs() {
        console.log('Checking configs...');
        check(Editor.Project.path, (path, schema, iter) => {
            console.error(path, iter ? JSON.stringify(expandError(iter), null, 2) : '');
        });
        console.log('Complete!');
    }
};

export function load() {}

export function unload() {}
