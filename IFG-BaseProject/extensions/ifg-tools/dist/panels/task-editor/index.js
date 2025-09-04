"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_1 = require("vue");
const panelDataMap = new WeakMap();
module.exports = Editor.Panel.define({
    listeners: {
        show() {
            console.log('show');
        },
        hide() {
            console.log('hide');
        }
    },
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/task-editor/index.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/task-editor/index.css'), 'utf-8'),
    $: {
        app: '#app'
    },
    ready() {
        if (this.$.app) {
            const app = (0, vue_1.createApp)({
                template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/task-editor/app.html'), 'utf-8'),
                data() {
                    return {
                        selectedChapter: null,
                        selectedChapterTasks: [],
                        chapters: []
                    };
                },
                methods: {
                    async setSelectedChapter(chapter) {
                        var _a;
                        this.selectedChapter = chapter;
                        const tasksData = await (0, fs_extra_1.readJson)(chapter.file);
                        // TODO: proper task data types
                        // Load tasks
                        this.selectedChapterTasks = [];
                        this.selectedChapterTasks = (_a = tasksData === null || tasksData === void 0 ? void 0 : tasksData.tasks) === null || _a === void 0 ? void 0 : _a.map((taskData) => {
                            var _a, _b, _c;
                            return ({
                                id: (_a = taskData === null || taskData === void 0 ? void 0 : taskData.id) !== null && _a !== void 0 ? _a : '',
                                name: (_b = taskData === null || taskData === void 0 ? void 0 : taskData.name) !== null && _b !== void 0 ? _b : '',
                                description: (_c = taskData === null || taskData === void 0 ? void 0 : taskData.description) !== null && _c !== void 0 ? _c : ''
                            });
                        });
                    },
                    setChapters(chapters) {
                        this.chapters = chapters;
                    }
                }
            });
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
            app.component('ChapterList', (0, vue_1.defineComponent)({
                template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/task-editor/chapterList.html'), 'utf-8'),
                props: ['chapters', 'selectedChapter'],
                methods: {
                    async refreshChapters() {
                        // Load chapter assets
                        const chapterAssets = await Editor.Message.request('asset-db', 'query-assets', {
                            pattern: 'db://assets/resources/config/tasks/**/*',
                            ccType: 'cc.JsonAsset'
                        });
                        this.$emit('update-chapters', chapterAssets);
                    },
                    loadChapter(name) {
                        const chapter = this.chapters.find((c) => c.name === name);
                        if (chapter) {
                            this.$emit('select-chapter', chapter);
                        }
                    }
                },
                async mounted() {
                    await this.refreshChapters();
                }
            }));
            app.component('chapter-view', (0, vue_1.defineComponent)({
                template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/task-editor/chapterView.html'), 'utf-8'),
                props: ['selectedChapter', 'selectedChapterTasks'],
                computed: {
                    name() {
                        var _a, _b;
                        return (_b = (_a = this.selectedChapter) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'None';
                    },
                    taskList() {
                        var _a;
                        return (_a = this.selectedChapterTasks) !== null && _a !== void 0 ? _a : [];
                    }
                }
            }));
            app.component('task-list', {
                template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/task-editor/taskList.html'), 'utf-8'),
                props: ['tasks']
            });
            app.component('task-view', {
                template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/task-editor/taskView.html'), 'utf-8'),
                props: ['task']
            });
            app.mount(this.$.app);
            panelDataMap.set(this, app);
        }
    },
    beforeClose() { },
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
        }
    }
});
