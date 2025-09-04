import { _decorator, Component } from 'cc';
// Assuming you have an App class defined somewhere in your project
import { App } from './App';
import { StateTransitionData } from './StateTransitionData';

const { ccclass, property } = _decorator;

@ccclass
export class BaseState extends Component {
    protected app: App;
    protected data: StateTransitionData;

    onLoad() {}

    start() {}

    public Init(app: App, data: StateTransitionData) {
        this.app = app;
        this.data = data;
    }

    public async EnterState() {}

    public ExitState() {}
}
