import { Prefab, Node } from 'cc';
import { DebugNodeData } from '../debug/DebugNodeData';

export interface IDebugService {
    initialize(cheats: boolean, debugMenuPrefab: Prefab, persistentCanvasNode: Node): Promise<void>;

    cheats(): boolean;
    toggleCheatActive(cheat: string): boolean;
    isCheatActive(cheat: string): boolean;

    toggleDebugMenu(): void;

    addDebugLabel(label: string, group: string): DebugNodeData;
    addDebugButton(labelText: string, group: string, onPressCallback: () => void): DebugNodeData;
    addDebugButtonWithInputField(labelText: string, group: string, onPressCallback: (value: string) => void): DebugNodeData;
    addDebugToggle(labelText: string, group: string, onValueChangedCallback: (value: boolean) => void): DebugNodeData;
    addFilterableList(labelText: string, group: string, listItems: string[], onValueSelectedCallback: (index: number) => void): DebugNodeData;
    removeDebugControl(target: DebugNodeData);
}
