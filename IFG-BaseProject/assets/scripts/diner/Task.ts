import { TaskData } from './models/TaskData';

export enum TaskState {
    Unavailable = 'Unavailable',
    Available = 'Available',
    Assigned = 'Assigned',
    Collectable = 'Collectable',
    Complete = 'Complete'
}

export class Task {
    public get isValid(): boolean {
        return this._valid;
    }

    private _data: TaskData;
    private _state: TaskState;
    private _valid: boolean = true;

    public constructor(data: TaskData) {
        this._data = data;
        this._state = TaskState.Unavailable;
    }

    public setState(state: TaskState) {
        this._state = state;
    }

    public setValidity(valid: boolean) {
        this._valid = valid;
    }

    public get data(): TaskData {
        return this._data;
    }

    public get state(): TaskState {
        return this._state;
    }
}
