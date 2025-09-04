import { readFileSync } from 'fs-extra';
import { join } from 'path';

module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { },
    },
    template: readFileSync(join(__dirname, '../../../static/template/template-editor/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/template-editor/index.css'), 'utf-8'),
    $: {
        titleName: '#titleName',
        changeTextButton: '#changeTextButton'
    },
    methods: {
        updateName(name: string) {
            this.$.titleName!.innerHTML = name;
        }
    },
    async ready() {
        this.$.changeTextButton!.addEventListener('confirm', (event) => {
            this.updateName('Text is changed');
        });
    },
    beforeClose() { },
    close() { },
});
