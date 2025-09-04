import { Prefab, Node, instantiate } from 'cc';
import { DebugMenu } from '../debug/DebugMenu';
import { DebugNodeData, DebugNodeType } from '../debug/DebugNodeData';
import { IDebugService } from './IDebugService';

export class DebugService implements IDebugService {
    private _persistentCanvasNode: Node | null = null;
    private _debugMenuPrefab: Prefab | null = null;
    private _debugNodeData: DebugNodeData[] = [];
    private _debugMenu: DebugMenu | null = null;
    private _cheats: boolean = false;
    private _cheatsActive: Map<string, boolean> = new Map();

    async initialize(cheats: boolean, debugMenuPrefab: Prefab, persistentCanvasNode: Node): Promise<void> {
        this._cheats = cheats;
        this._debugMenuPrefab = debugMenuPrefab;
        this._persistentCanvasNode = persistentCanvasNode;
    }

    public cheats(): boolean {
        return this._cheats;
    }

    public toggleCheatActive(cheat: string): boolean {
        if (!this._cheats) {
            return false;
        }

        const value = this.isCheatActive(cheat);
        this._cheatsActive.set(cheat, !value);
    }

    public isCheatActive(cheat: string): boolean {
        if (!this._cheats) {
            return false;
        }

        if (!this._cheatsActive.has(cheat)) {
            return false;
        }

        return this._cheatsActive.get(cheat);
    }

    toggleDebugMenu(): void {
        if (!this._cheats) {
            return;
        }

        if (this._debugMenu) {
            this._debugMenu.node.destroy();
            this._debugMenu = null;
        } else {
            let debugMenuNode: Node = instantiate(this._debugMenuPrefab);
            debugMenuNode.parent = this._persistentCanvasNode;
            this._debugMenu = debugMenuNode.getComponent(DebugMenu);
            this._debugMenu.buildMenu(this._debugNodeData);
        }
    }

    public addDebugLabel(label: string, group: string): DebugNodeData {
        if (!this._cheats) {
            return;
        }

        const nodeData = new DebugNodeData();
        nodeData.Label = label;
        nodeData.NodeType = DebugNodeType.Label;
        nodeData.Group = group;
        this._debugNodeData.push(nodeData);

        return nodeData;
    }

    public addDebugButton(buttonLabel: string, group: string, onPressCallback: () => void): DebugNodeData {
        if (!this._cheats) {
            return;
        }

        const nodeData = new DebugNodeData();
        nodeData.Label = buttonLabel;
        nodeData.NodeType = DebugNodeType.Button;
        nodeData.Callback = onPressCallback;
        nodeData.Group = group;

        this._debugNodeData.push(nodeData);

        return nodeData;
    }

    public addDebugButtonWithInputField(buttonLabel: string, group: string, onPressCallback: (value: string) => void): DebugNodeData {
        if (!this._cheats) {
            return;
        }

        const nodeData = new DebugNodeData();
        nodeData.Label = '';
        nodeData.NodeType = DebugNodeType.EditBox;
        nodeData.Callback = null;
        nodeData.DependantNodesData = [];
        nodeData.Group = group;

        const buttonNodeData = new DebugNodeData();
        buttonNodeData.Label = buttonLabel;
        buttonNodeData.NodeType = DebugNodeType.Button;
        buttonNodeData.Callback = (input: string) => {
            onPressCallback(input);
        };

        nodeData.DependantNodesData.push(buttonNodeData);
        this._debugNodeData.push(nodeData);

        return nodeData;
    }

    public addDebugToggle(labelText: string, group: string, onValueChangedCallback: (value: boolean) => void): DebugNodeData {
        if (!this._cheats) {
            return;
        }

        const nodeData = new DebugNodeData();
        nodeData.Label = labelText;
        nodeData.NodeType = DebugNodeType.Toggle;
        nodeData.Callback = onValueChangedCallback;
        nodeData.Group = group;

        this._debugNodeData.push(nodeData);

        return nodeData;
    }

    public addFilterableList(
        labelText: string,
        group: string,
        listItems: string[],
        onValueSelectedCallback: (index: number) => void
    ): DebugNodeData {
        if (!this._cheats) {
            return null;
        }

        const nodeData = new DebugNodeData();
        nodeData.Label = labelText;
        nodeData.NodeType = DebugNodeType.FilterableList;
        nodeData.Callback = null;
        nodeData.DependantNodesData = [];
        nodeData.Group = group;

        listItems.forEach((item, index) => {
            const buttonNodeData = new DebugNodeData();
            buttonNodeData.Label = item;
            buttonNodeData.NodeType = DebugNodeType.Button;
            buttonNodeData.Callback = (index: number) => {
                onValueSelectedCallback(index);
            };
            nodeData.DependantNodesData.push(buttonNodeData);
        });

        this._debugNodeData.push(nodeData);

        return nodeData;
    }

    public removeDebugControl(target: DebugNodeData) {
        if (!this._cheats) {
            return null;
        }

        this._debugNodeData = this._debugNodeData.filter((node) => node !== target);
    }
}
