"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { },
    },
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/template-editor/index.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/template-editor/index.css'), 'utf-8'),
    $: {
        titleName: '#titleName',
        changeTextButton: '#changeTextButton'
    },
    methods: {
        updateName(name) {
            this.$.titleName.innerHTML = name;
        }
    },
    async ready() {
        this.$.changeTextButton.addEventListener('confirm', (event) => {
            this.updateName('Text is changed');
        });
    },
    beforeClose() { },
    close() { },
});
