import { _decorator, Button, Component, EditBox, instantiate, Label, Node, Prefab, Toggle } from 'cc';
import { DebugNodeData, DebugNodeType } from 'db://assets/scripts/debug/DebugNodeData';
import { logger } from '../logging';

const { ccclass, property } = _decorator;

@ccclass('DebugMenu')
export class DebugMenu extends Component {
    @property(Node)
    private mainPanel: Node | null = null;

    @property(Node)
    private tabParent: Node | null = null;

    @property(Node)
    private uiParent: Node | null = null;

    @property(Prefab)
    private tabButtonPrefab: Prefab | null = null;

    @property(Prefab)
    private labelPrefab: Prefab | null = null;

    @property(Prefab)
    private buttonPrefab: Prefab | null = null;

    @property(Prefab)
    private inputFieldPrefab: Prefab | null = null;

    @property(Prefab)
    private togglePrefab: Prefab | null = null;

    private _nodeData: DebugNodeData[];
    private _log = logger.child('DebugMenu');

    onLoad() {}

    onDestroy() {}

    public buildMenu(nodeData: DebugNodeData[], selectedTab: string = null) {
        this._nodeData = nodeData;

        // Create menu tabs
        const groups = Array.from(new Set(nodeData.map((item) => item.Group)));
        groups.forEach((group, i) => {
            this._createTabNode(group, () => {
                this._onTabSelected(group);
            });
        });

        if (groups.length < 1) {
            return;
        }

        if (!selectedTab) {
            selectedTab = groups[0];
        }

        this._buildMenuContent(selectedTab);
    }

    private _buildMenuContent(tabGroup: string) {
        this.uiParent.destroyAllChildren();
        this._nodeData.forEach((node, i) => {
            if (!node || node.Group != tabGroup) {
                return;
            }

            switch (node.NodeType) {
                case DebugNodeType.Label:
                    this._createLabelNode(node.Label);
                    break;
                case DebugNodeType.Button:
                    this._createButtonNode(node.Label, node.Callback);
                    break;
                case DebugNodeType.Toggle:
                    this._createToggleNode(node.Label, node.Callback);
                    break;
                case DebugNodeType.EditBox:
                    {
                        const inputNode = this._createEditBoxNode();
                        const inputField = inputNode.getComponent(EditBox);
                        node.DependantNodesData.forEach((dependantNode, i) => {
                            if (dependantNode.NodeType == DebugNodeType.Button) {
                                this._createButtonNode(dependantNode.Label, () => {
                                    dependantNode.Callback(inputField.string);
                                });
                            }
                        });
                    }
                    break;
                case DebugNodeType.FilterableList: {
                    const inputNode = this._createEditBoxNode();
                    const inputField = inputNode.getComponent(EditBox);
                    const message = inputNode.getChildByName('Text').getComponent(Label);

                    let filterableNodes: any[] = [];
                    node.DependantNodesData.forEach((dependantNode, i) => {
                        if (dependantNode.NodeType == DebugNodeType.Button) {
                            const buttonNode = this._createButtonNode(dependantNode.Label, () => {
                                dependantNode.Callback(i);
                            });
                            filterableNodes.push({ node: buttonNode, nodeData: dependantNode });
                        }
                    });

                    inputNode.on(EditBox.EventType.TEXT_CHANGED, () => {
                        message.string = inputField.string;
                        filterableNodes.forEach((node) => {
                            node.node.removeFromParent();
                        });

                        filterableNodes.forEach((node) => {
                            const nodeData = node.nodeData as DebugNodeData;
                            if (nodeData.Label.includes(inputField.string)) {
                                this.uiParent.addChild(node.node);
                            }
                        });
                    });
                    break;
                }
            }
        });
    }

    private _createTabNode(label: string, onPressCallback: any): Node {
        if (this.tabButtonPrefab) {
            const tabNode: Node = instantiate(this.tabButtonPrefab);

            tabNode.getComponentInChildren(Label).string = label;
            tabNode.on(Button.EventType.CLICK, onPressCallback);

            this.tabParent.addChild(tabNode);
            return tabNode;
        }
        this._log.error('Error: Tab Prefab Is Not Defined');
    }

    private _createLabelNode(label: string) {
        if (this.labelPrefab) {
            const labelNode: Node = instantiate(this.labelPrefab);

            labelNode.getComponentInChildren(Label).string = label;

            this.uiParent.addChild(labelNode);

            return labelNode;
        }

        this._log.error('Error: Label Prefab Is Not Defined');
    }

    private _createButtonNode(buttonLabel: string, onPressCallback: any): Node {
        if (this.buttonPrefab) {
            const buttonNode: Node = instantiate(this.buttonPrefab);

            buttonNode.getComponentInChildren(Label).string = buttonLabel;
            buttonNode.on(Button.EventType.CLICK, onPressCallback);

            this.uiParent.addChild(buttonNode);

            return buttonNode;
        }

        this._log.error('Error: Button Prefab Is Not Defined');
    }

    private _createEditBoxNode(): Node {
        if (this.inputFieldPrefab) {
            const inputNode: Node = instantiate(this.inputFieldPrefab);
            const inputField = inputNode.getComponent(EditBox);
            inputField.placeholder = 'Enter Value...';

            this.uiParent.addChild(inputNode);

            return inputNode;
        }

        this._log.error('Error: InputField Prefab Is Not Defined');
    }

    private _createToggleNode(labelText: string, onValueChangedCallback: (value: boolean) => void): Node {
        if (this.togglePrefab) {
            const checkboxNode: Node = instantiate(this.togglePrefab);
            checkboxNode.getComponentInChildren(Label).string = labelText;
            const toggle = checkboxNode.getComponent(Toggle);

            if (toggle) {
                checkboxNode.on('toggle', () => {
                    onValueChangedCallback(toggle.isChecked);
                });
            }

            this.uiParent.addChild(checkboxNode);
            return checkboxNode;
        }
    }

    private _onTabSelected(group: string) {
        this._buildMenuContent(group);
    }
}
