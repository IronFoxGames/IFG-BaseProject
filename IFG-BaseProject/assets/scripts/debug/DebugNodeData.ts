import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DebugNodeData')
export class DebugNodeData {
    public Label: string;
    public NodeType: DebugNodeType;
    public Callback: any;
    public DependantNodesData: DebugNodeData[];
    public Group: string;
}

export enum DebugNodeType {
    Label,
    Button,
    Toggle,
    EditBox,
    FilterableList
}
