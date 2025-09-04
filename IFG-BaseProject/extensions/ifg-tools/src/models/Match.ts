import {MatchState} from './MatchState';

export class Match {
    creationTime: string;
    state: MatchState;
    isComplete: boolean = false;
    playerWon: boolean = false;
    hasBot: boolean = false;

    constructor() {
        this.creationTime = new Date().toISOString();
        this.state = new MatchState();
    }
}