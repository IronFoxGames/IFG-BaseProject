import { readFileSync, readJson } from 'fs-extra';
import { join } from 'path';
import { createApp, App, defineComponent } from 'vue';
import { AssetInfo } from '../../../@types/packages/asset-db/@types/public';
const panelDataMap = new WeakMap<any, App>();

module.exports = Editor.Panel.define({
    listeners: {
        show() {
            console.log('show');
        },
        hide() {
            console.log('hide');
        }
    },
    template: readFileSync(join(__dirname, '../../../static/template/task-editor/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/task-editor/index.css'), 'utf-8'),
    $: {
        app: '#app'
    },
    ready() {
        if (this.$.app) {
            const app = createApp({
                template: readFileSync(join(__dirname, '../../../static/template/task-editor/app.html'), 'utf-8'),
                data() {
                    return {
                        selectedChapter: null,
                        selectedChapterTasks: [],
                        chapters: []
                    };
                },
                methods: {
                    async setSelectedChapter(chapter: any) {
                        this.selectedChapter = chapter;

                        const tasksData = await readJson(chapter.file);

                        // TODO: proper task data types

                        // Load tasks
                        this.selectedChapterTasks = [];
                        this.selectedChapterTasks = tasksData?.tasks?.map((taskData: any) => ({
                            id: taskData?.id ?? '',
                            name: taskData?.name ?? '',
                            description: taskData?.description ?? ''
                        }));
                    },
                    setChapters(chapters: any[]) {
                        this.chapters = chapters;
                    }
                }
            });
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
            app.component(
                'ChapterList',
                defineComponent({
                    template: readFileSync(join(__dirname, '../../../static/template/task-editor/chapterList.html'), 'utf-8'),
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
                        loadChapter(name: string) {
                            const chapter = this.chapters.find((c: any) => c.name === name);
                            if (chapter) {
                                this.$emit('select-chapter', chapter);
                            }
                        }
                    },
                    async mounted() {
                        await this.refreshChapters();
                    }
                })
            );
            app.component(
                'chapter-view',
                defineComponent({
                    template: readFileSync(join(__dirname, '../../../static/template/task-editor/chapterView.html'), 'utf-8'),
                    props: ['selectedChapter', 'selectedChapterTasks'],
                    computed: {
                        name() {
                            return this.selectedChapter?.name ?? 'None';
                        },
                        taskList() {
                            return this.selectedChapterTasks ?? [];
                        }
                    }
                })
            );
            app.component('task-list', {
                template: readFileSync(join(__dirname, '../../../static/template/task-editor/taskList.html'), 'utf-8'),
                props: ['tasks']
            });
            app.component('task-view', {
                template: readFileSync(join(__dirname, '../../../static/template/task-editor/taskView.html'), 'utf-8'),
                props: ['task']
            });
            app.mount(this.$.app);
            panelDataMap.set(this, app);
        }
    },
    beforeClose() {},
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
        }
    }
});
