"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
// @ts-ignore
const checker_1 = require("./types/buildtime/checker");
const name = 'ifg-tools';
exports.methods = {
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
        (0, checker_1.check)(Editor.Project.path, (path, schema, iter) => {
            console.error(path, iter ? JSON.stringify((0, checker_1.expandError)(iter), null, 2) : '');
        });
        console.log('Complete!');
    }
};
function load() { }
exports.load = load;
function unload() { }
exports.unload = unload;
