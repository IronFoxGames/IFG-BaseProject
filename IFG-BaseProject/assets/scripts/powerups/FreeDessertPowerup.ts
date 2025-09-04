import { _decorator, Node } from 'cc';
import { Powerup } from './Powerup';
import { Card, HandName, MatchOperations } from '../core';
import { CardScrambleGameController } from '../game/CardScrambleGameController';
import { PowerupType } from '../core/enums/BoosterType';
import { PowerupUsageContext } from '../core/model/PowerupUsageContext';
import { Prefab } from 'cc';
import { instantiate } from 'cc';
import { logger } from '../logging';
import { FreeDessertHandSelector } from '../game/ui/FreeDessertHandSelector';
import { HandNameToString } from '../core/enums/HandName';
import { director } from 'cc';
import { TutorialService } from '../services/TutorialService';
const { ccclass } = _decorator;

@ccclass('FreeDessertPowerup')
export class FreeDessertPowerup extends Powerup {
    private _handOptionsPrefab: Prefab = null;
    private _handOptionsInstance: Node = null;
    private _handSelectorComponent: FreeDessertHandSelector = null;
    private _selectedHandToPlay: HandName = HandName.Invalid;
    private _handMap: Map<HandName, Card[]> = new Map();
    private _handScores: Map<HandName, number> = new Map();
    private _log = logger.child('FreeDessertPowerup');

    public constructor(gameController: CardScrambleGameController, handOptionsPrefab: Prefab) {
        super(gameController);
        this._powerupType = PowerupType.FreeDessert;
        this._handOptionsPrefab = handOptionsPrefab;
    }

    public PreparePowerup(tutorialService?: TutorialService) {
        this._isPreparing = true;
        this._handOptionsInstance = instantiate(this._handOptionsPrefab);
        this._handOptionsInstance.parent = this._gameController.uiManager.HUD.node;
        this._handSelectorComponent = this._handOptionsInstance.getComponent(FreeDessertHandSelector);
        this._handSelectorComponent.node.on(FreeDessertHandSelector.OnMenuClosedEvent, this.CancelPreparation, this);
        this._handSelectorComponent.node.on(FreeDessertHandSelector.OnConfirmCompleteEvent, this._onPowerupApplied, this);
        this._handSelectorComponent.node.on(FreeDessertHandSelector.OnHandConfirmedEvent, this._onHandConfirmed, this);
        this._handSelectorComponent.setTutorialService(tutorialService);
        this._handSelectorComponent.playOpenAnim();

        this._gameController.uiManager.HUD.updateGoalsLayeringForFreeDessert();

        const handNames: HandName[] = [];
        const handScores: number[] = [];

        handNames.push(HandName.Singleton);
        handNames.push(HandName.OnePair);
        handNames.push(HandName.TwoPair);
        handNames.push(HandName.ThreeOfAKind);
        handNames.push(HandName.Straight);
        handNames.push(HandName.Flush);
        handNames.push(HandName.FullHouse);
        handNames.push(HandName.FourOfAKind);
        handNames.push(HandName.StraightFlush);
        handNames.push(HandName.RoyalFlush);
        handNames.push(HandName.FiveOfAKind);

        handNames.forEach((handName) => {
            this._handMap.set(handName, this._getHandFromHandName(handName));

            let score = this._gameController.handScorer.scoreHand(this._handMap.get(handName)).score;
            this._handScores.set(handName, score);
            handScores.push(score);
        });

        this._handSelectorComponent.setHandOptions(handNames, handScores);
    }

    public CancelPreparation() {
        if (this._isPreparing) {
            if (this._handOptionsInstance) {
                this._handSelectorComponent.node.off(FreeDessertHandSelector.OnMenuClosedEvent, this.CancelPreparation, this);
                this._handSelectorComponent.node.off(FreeDessertHandSelector.OnConfirmCompleteEvent, this._onPowerupApplied, this);
                this._handSelectorComponent.node.off(FreeDessertHandSelector.OnHandConfirmedEvent, this._onHandConfirmed, this);
                this._handOptionsInstance.destroy();
                this._handOptionsInstance = null;
                this._handSelectorComponent = null;

                this._gameController.uiManager.HUD.resetGoalsLayering();
                director.emit(Powerup.OnPowerupPreparedEvent, false);
            }

            this._isPreparing = false;
        }
    }

    public ApplyPowerup() {
        this._isPreparing = false;

        this._gameController.uiManager.HUD.resetGoalsLayering();
        const handToPlay = this._handMap.get(this._selectedHandToPlay);

        let powerupUsageContext = new PowerupUsageContext(this._powerupType, true, null);
        let powerupUsages: PowerupUsageContext[] = [];
        powerupUsages.push(powerupUsageContext);

        MatchOperations.ScoreExtraHand(this._gameController, handToPlay, powerupUsages);
        this._handSelectorComponent.node.off(FreeDessertHandSelector.OnMenuClosedEvent, this.CancelPreparation, this);
        this._handSelectorComponent.node.off(FreeDessertHandSelector.OnConfirmCompleteEvent, this._onPowerupApplied, this);
        this._handSelectorComponent.node.off(FreeDessertHandSelector.OnHandConfirmedEvent, this._onHandConfirmed, this);
        this._handOptionsInstance.destroy();
        this._handOptionsInstance = null;
        this._handSelectorComponent = null;

        this._gameController.onFreeDessertApplicationComplete();
    }

    private _getHandFromHandName(handName: HandName): Card[] {
        const handToPlay: Card[] = [];
        let handComplete: boolean = false;

        switch (handName) {
            case HandName.Singleton: {
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));

                while (!handComplete) {
                    let randomRank = this._gameController.random.nextInt(2, 14);
                    let randomSuit = this._gameController.random.nextInt(1, 5);

                    if (
                        !handToPlay.find((card) => card.rank === randomRank) &&
                        handToPlay.filter((card) => card.suit === randomSuit).length < 4
                    ) {
                        handToPlay.push(new Card(randomRank, randomSuit));

                        if (handToPlay.length === 5) {
                            handComplete = true;
                        }
                    }
                }

                break;
            }
            case HandName.OnePair: {
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));

                while (!handComplete) {
                    let randomRank = this._gameController.random.nextInt(2, 14);
                    let randomSuit = this._gameController.random.nextInt(1, 5);

                    if (
                        !handToPlay.find((card) => card.rank === randomRank) &&
                        handToPlay.filter((card) => card.suit === randomSuit).length < 4
                    ) {
                        handToPlay.push(new Card(randomRank, randomSuit));

                        if (handToPlay.length === 5) {
                            handComplete = true;
                        }
                    }
                }

                break;
            }
            case HandName.TwoPair: {
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(13, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(13, this._gameController.random.nextInt(1, 5)));

                while (!handComplete) {
                    let randomRank = this._gameController.random.nextInt(2, 13);
                    let randomSuit = this._gameController.random.nextInt(1, 5);

                    if (handToPlay.filter((card) => card.suit === randomSuit).length < 4) {
                        handToPlay.push(new Card(randomRank, randomSuit));

                        if (handToPlay.length === 5) {
                            handComplete = true;
                        }
                    }
                }

                break;
            }
            case HandName.ThreeOfAKind: {
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));

                while (!handComplete) {
                    let randomRank = this._gameController.random.nextInt(2, 14);
                    let randomSuit = this._gameController.random.nextInt(1, 5);

                    if (
                        !handToPlay.find((card) => card.rank === randomRank) &&
                        handToPlay.filter((card) => card.suit === randomSuit).length < 4
                    ) {
                        handToPlay.push(new Card(randomRank, randomSuit));

                        if (handToPlay.length === 5) {
                            handComplete = true;
                        }
                    }
                }

                break;
            }
            case HandName.Straight: {
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(13, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(12, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(11, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(10, this._gameController.random.nextInt(1, 5)));

                while (!handComplete) {
                    if (handToPlay.filter((card) => card.suit === handToPlay[0].suit).length < 5) {
                        handComplete = true;
                    } else {
                        handToPlay[0].suit = this._gameController.random.nextInt(1, 5);
                    }
                }

                break;
            }
            case HandName.Flush: {
                let randomSuit = this._gameController.random.nextInt(1, 5);

                handToPlay.push(new Card(1, randomSuit));
                handToPlay.push(new Card(13, randomSuit));
                handToPlay.push(new Card(12, randomSuit));
                handToPlay.push(new Card(11, randomSuit));
                handToPlay.push(new Card(9, randomSuit));

                break;
            }
            case HandName.FullHouse: {
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(13, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(13, this._gameController.random.nextInt(1, 5)));

                break;
            }
            case HandName.FourOfAKind: {
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(this._gameController.random.nextInt(2, 14), this._gameController.random.nextInt(1, 5)));

                break;
            }
            case HandName.StraightFlush: {
                let randomSuit = this._gameController.random.nextInt(1, 5);

                handToPlay.push(new Card(1, randomSuit));
                handToPlay.push(new Card(13, randomSuit));
                handToPlay.push(new Card(12, randomSuit));
                handToPlay.push(new Card(11, randomSuit));
                handToPlay.push(new Card(10, randomSuit));

                break;
            }
            case HandName.RoyalFlush: {
                let randomSuit = this._gameController.random.nextInt(1, 5);

                handToPlay.push(new Card(1, randomSuit));
                handToPlay.push(new Card(13, randomSuit));
                handToPlay.push(new Card(12, randomSuit));
                handToPlay.push(new Card(11, randomSuit));
                handToPlay.push(new Card(10, randomSuit));

                break;
            }
            case HandName.FiveOfAKind: {
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));
                handToPlay.push(new Card(1, this._gameController.random.nextInt(1, 5)));

                break;
            }
            default: {
                this._log.error(`FreeDessertPowerup: Selected Hand Type Not Valid (${this._selectedHandToPlay})`);

                break;
            }
        }

        return handToPlay;
    }

    private _onHandConfirmed(handName: HandName) {
        if (this._gameController.giveUpView && this._gameController.giveUpView.node) {
            this._gameController.giveUpView.node.active = false;
        }
        this._selectedHandToPlay = handName;
        this._handSelectorComponent.setHandInfo(HandNameToString(handName), this._handScores.get(handName), this._handMap.get(handName));
    }

    private async _onPowerupApplied() {
        if (this._gameController.giveUpView && this._gameController.giveUpView.node) {
            await this._gameController.giveUpView.onPowerupUsed(this);
        } else {
            await this._gameController.uiManager.HUD.onPowerupUsed(this);
        }
    }
}
