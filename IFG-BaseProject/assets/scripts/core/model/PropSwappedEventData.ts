import { NodeData } from '../../diner/models/NodeData';
import { PropData } from '../../diner/models/PropData';

export class PropSwappedEventData {
    public PropId: string;
    public PropData: PropData | null = null;
    public NodeData: NodeData | null = null;

    constructor(propId: string, propData: PropData | null = null, nodeData: NodeData | null = null) {
        this.PropId = propId;
        this.PropData = propData;
        this.NodeData = nodeData;
    }
}
