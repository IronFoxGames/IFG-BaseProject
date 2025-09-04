"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileListSelector = void 0;
class FileListSelector {
    constructor() {
        this.treeData = [];
        this.filteredTreeData = [];
        this.onFileSelected = () => { };
    }
    buildFileSelectorUI(rootTreeElement, assetList, onFileSelected) {
        this.uiTree = rootTreeElement;
        this.onFileSelected = onFileSelected;
        this.treeData = [];
        // Process each asset and build the tree
        assetList.forEach((asset) => {
            const relativePath = asset.path.replace('db://assets/resources/levels/', '');
            const pathParts = relativePath.split('/');
            if (pathParts.length === 1) {
                pathParts.unshift('_root');
            }
            FileListSelector._addNodeToTree(this.treeData, pathParts, asset);
        });
        // Setup the 'text' element of the tree item
        this.uiTree.setTemplate('text', `<span class="file"></span><span class="folder"></span>`);
        this.uiTree.setTemplateInit('text', ($text) => {
            $text.$file = $text.querySelector('.file');
            $text.$folder = $text.querySelector('.folder');
        });
        this.uiTree.setRender('text', ($text, data) => {
            $text.$folder.innerHTML = data.detail.directory ? data.detail.value : '';
            $text.$file.innerHTML = data.detail.directory ? '' : data.detail.value;
        });
        // Set the 'right' element of the tree item
        this.uiTree.setTemplate('right', '<ui-button class="blue" value="load">Open</ui-button>');
        this.uiTree.setTemplateInit('right', ($right) => {
            $right.$loadButton = $right.querySelector('ui-button');
            $right.$loadButton.addEventListener('click', () => {
                this.onFileSelected($right.data.detail.asset);
            });
        });
        this.uiTree.setRender('right', ($right, data) => {
            if (data.detail.directory) {
                $right.$loadButton.style.display = 'none';
            }
            else {
                $right.$loadButton.style.display = '';
            }
        });
        // Set the tree data
        this.uiTree.tree = this.treeData;
        // Additional styling
        this.uiTree.css = `    
        .text > .folder {
            margin-left: 10px;
            cursor: pointer;
            color: #f4a261; /* Soft orange for folders */
        }
    
        .text > .file {
            color: #c5cbe3; /* Soft light blue for files */
        }
    `;
    }
    filterTree(searchPattern) {
        const regex = new RegExp(searchPattern, 'i');
        const filterNode = (node) => {
            if (!node.children || node.children.length === 0) {
                return regex.test(node.detail.value) ? node : null;
            }
            const filteredChildren = node.children.map(filterNode).filter(Boolean);
            if (filteredChildren.length > 0 || regex.test(node.detail.value)) {
                return Object.assign(Object.assign({}, node), { children: filteredChildren });
            }
            return null;
        };
        this.filteredTreeData = this.treeData.map(filterNode).filter(Boolean);
        this.uiTree.tree = this.filteredTreeData;
    }
    static _addNodeToTree(tree, pathParts, asset) {
        if (pathParts.length === 0)
            return;
        const currentPart = pathParts[0];
        const existingNode = tree.find((node) => node.detail.value === currentPart);
        if (!existingNode) {
            const newNode = {
                detail: {
                    value: currentPart,
                    directory: pathParts.length > 1,
                    asset: pathParts.length === 1 ? asset : null
                },
                showArrow: pathParts.length > 1,
                children: []
            };
            tree.push(newNode);
            if (pathParts.length > 1) {
                FileListSelector._addNodeToTree(newNode.children, pathParts.slice(1), asset);
            }
        }
        else {
            FileListSelector._addNodeToTree(existingNode.children, pathParts.slice(1), asset);
        }
    }
}
exports.FileListSelector = FileListSelector;
