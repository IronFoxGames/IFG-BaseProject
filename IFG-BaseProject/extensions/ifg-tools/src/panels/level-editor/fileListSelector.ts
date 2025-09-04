import { AssetInfo } from '../../../@types/packages/asset-db/@types/public';

export class FileListSelector {
    private treeData: any[] = [];
    private filteredTreeData: any[] = [];
    private uiTree: any;
    private onFileSelected: (assetInfo: AssetInfo) => void = () => {};

    public buildFileSelectorUI(rootTreeElement: HTMLElement, assetList: AssetInfo[], onFileSelected: (assetInfo: AssetInfo) => void) {
        this.uiTree = rootTreeElement as any;
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
        this.uiTree.setTemplateInit('text', ($text: any) => {
            $text.$file = $text.querySelector('.file');
            $text.$folder = $text.querySelector('.folder');
        });
        this.uiTree.setRender('text', ($text: any, data: any) => {
            $text.$folder.innerHTML = data.detail.directory ? data.detail.value : '';
            $text.$file.innerHTML = data.detail.directory ? '' : data.detail.value;
        });

        // Set the 'right' element of the tree item
        this.uiTree.setTemplate('right', '<ui-button class="blue" value="load">Open</ui-button>');
        this.uiTree.setTemplateInit('right', ($right: any) => {
            $right.$loadButton = $right.querySelector('ui-button');
            $right.$loadButton.addEventListener('click', () => {
                this.onFileSelected($right.data.detail.asset);
            });
        });

        this.uiTree.setRender('right', ($right: any, data: any) => {
            if (data.detail.directory) {
                $right.$loadButton.style.display = 'none';
            } else {
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

    public filterTree(searchPattern: string) {
        const regex = new RegExp(searchPattern, 'i');

        const filterNode = (node: any): any => {
            if (!node.children || node.children.length === 0) {
                return regex.test(node.detail.value) ? node : null;
            }

            const filteredChildren = node.children.map(filterNode).filter(Boolean);
            if (filteredChildren.length > 0 || regex.test(node.detail.value)) {
                return { ...node, children: filteredChildren };
            }

            return null;
        };

        this.filteredTreeData = this.treeData.map(filterNode).filter(Boolean);
        this.uiTree.tree = this.filteredTreeData;
    }

    private static _addNodeToTree(
        tree: {
            detail: { value: string; directory: boolean; asset: AssetInfo | null };
            showArrow: boolean;
            children: any[];
        }[],
        pathParts: string[],
        asset: AssetInfo
    ) {
        if (pathParts.length === 0) return;

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
        } else {
            FileListSelector._addNodeToTree(existingNode.children, pathParts.slice(1), asset);
        }
    }
}
