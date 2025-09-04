import { _decorator, Animation, AnimationClip, Button, Color, Component, instantiate, Label, Node, Prefab, Sprite, SpriteFrame } from 'cc';
import { SoundManager } from '../../audio/SoundManager';
import { Currency } from '../../core/enums/Currency';
import { EntitlementType } from '../../core/enums/EntitlementType';
import { Event } from '../../core/Event';
import { logger } from '../../logging';
import { ICardScrambleService } from '../../services/ICardScrambleService';
import { RequirementsService } from '../../services/RequirementsService';
import { UIOverlayService } from '../../services/UIOverlayService';
import { DinerSceneController } from '../DinerSceneController';
import { IDinerNode } from '../IDinerNode';
import { PropCatalogue } from '../PropCatalogue';
import { PropInstanceData } from '../PropInstanceData';
import { PropScrollEntry } from './PropScrollEntry';
const { ccclass, property } = _decorator;

@ccclass('PropSelectorView')
export class PropSelectorView extends Component {
    public OnSwapProp: (propInstanceData: PropInstanceData) => void;

    public PropSwappedEvent: Event = new Event();

    @property({ type: Node, visible: true })
    private _propEntryHandle: Node;

    @property({ type: Prefab, visible: true })
    private _propEntryPrefab: Prefab;

    @property({ type: Button, visible: true })
    private _propActionButton: Button;

    @property({ type: Label, visible: true })
    private _propActionButtonLabel: Label;

    @property({ type: Node, visible: true })
    private _propActionCurrencyIconNode: Node;

    @property({ type: Sprite, visible: true })
    private _propActionCurrencyIcon: Sprite;

    @property({ type: Sprite, visible: true })
    private _propActionCurrencyIconShadow: Sprite;

    @property({ type: Label, visible: true })
    private _propActionCurrencyLabel: Label;

    @property({ type: Color, visible: true })
    private _insufficientFundsColor: Color;

    @property({ type: Animation, visible: true })
    private _propSelectorAnimation: Animation;

    @property({ type: Node, visible: true })
    private _actionButtonContainer: Node;

    @property({ type: SpriteFrame, visible: true })
    private currencyIcons: SpriteFrame[] = [];

    private _currentEntries: PropScrollEntry[] = [];

    private _currentSelectedDinerNode: IDinerNode = null;

    private _dinerSceneController: DinerSceneController;
    private _cardScrambleService: ICardScrambleService;
    private _propCatalog: PropCatalogue;
    private _requirementsService: RequirementsService;
    private _uiOverlayService: UIOverlayService;
    private _onSwapPropHandler: () => void;
    private _log = logger.child('PropSelectorView');
    private _animationClips: AnimationClip[] = [];
    private _actionButtonVisible: boolean = false;
    private _isPremiumUser: boolean = false;

    public init(
        dinerSceneController: DinerSceneController,
        cardScrambleService: ICardScrambleService,
        propCatalog: PropCatalogue,
        requirementsService: RequirementsService,
        uiOverlayService: UIOverlayService
    ) {
        this._dinerSceneController = dinerSceneController;
        this._cardScrambleService = cardScrambleService;
        this._propCatalog = propCatalog;
        this._requirementsService = requirementsService;
        this._uiOverlayService = uiOverlayService;

        this._animationClips = this._propSelectorAnimation.clips;

        this._isPremiumUser = this._cardScrambleService.getUserEntitlement() === EntitlementType.Premium;

        this._propActionButton.node.on(Button.EventType.CLICK, this._onSwapPropButtonPressedCallback, this);
    }

    public show() {
        if (this._propSelectorAnimation) {
            this._propSelectorAnimation.play(this._animationClips[0].name);
        } else {
            this._log.error('Prop Selector Animation is not defined!');
        }
        this.node.active = true;
        this._clearActionButton();
    }

    public hide(onComplete?: () => void) {
        if (this._propSelectorAnimation) {
            this._propSelectorAnimation.play(this._animationClips[1].name);
        } else {
            this._log.error('Prop Selector Animation is not defined!');
            if (onComplete) {
                onComplete();
                return;
            }
        }

        this._propSelectorAnimation.once(Animation.EventType.FINISHED, () => {
            this._hideNode();
            if (onComplete) {
                onComplete();
            }
        });
    }

    public switch() {
        if (this._propSelectorAnimation) {
            this._propSelectorAnimation.play(this._animationClips[2].name);
        } else {
            this._log.error('Prop Selector Animation is not defined!');
        }
        this._clearActionButton();
    }

    public hideActionButton() {
        if (this._propSelectorAnimation) {
            this._propSelectorAnimation.play(this._animationClips[3].name);
        } else {
            this._log.error('Prop Selector Animation is not defined!');
        }
        // Await the animation to finish before hiding the node
        this._propSelectorAnimation.once(Animation.EventType.FINISHED, () => {
            if (this._actionButtonContainer) {
                this._actionButtonContainer.active = false;
            } else {
                this._log.error('Swap Button Container is not defined!');
            }
            this._actionButtonVisible = false;
        });
    }

    public showActionButton() {
        if (this._actionButtonContainer) {
            this._actionButtonContainer.active = true;
        } else {
            this._log.error('Swap Button Container is not defined!');
        }

        if (this._propSelectorAnimation) {
            this._propSelectorAnimation.play(this._animationClips[4].name);
        } else {
            this._log.error('Prop Selector Animation is not defined!');
        }

        this._actionButtonVisible = true;
    }

    private _hideNode() {
        if (this.node) {
            this.node.active = false;
        } else {
            this._log.error('Node is not defined!');
        }
    }

    public cleanupForNextUsage() {
        this._currentSelectedDinerNode?.hidePropPreview();
        this._currentSelectedDinerNode = null;

        this._clearAllPropEntries();
    }

    public setSelectedDinerNode(dinerNode: IDinerNode) {
        this._currentSelectedDinerNode = dinerNode;
    }

    public async createNewPropEntry(propInstanceData: PropInstanceData, taskContextDoesNotExist: boolean) {
        let entryPrefab = instantiate(this._propEntryPrefab);

        //Append the entry to the handle
        entryPrefab.setParent(this._propEntryHandle);

        let entry = entryPrefab.getComponent(PropScrollEntry);
        await entry.init(
            propInstanceData,
            this._requirementsService,
            this._uiOverlayService,
            this._currentSelectedDinerNode?.getCurrentPropData()?.id,
            this._isPremiumUser
        );

        const propData = propInstanceData?.data;
        if (propData == null) {
            this._log.warn(
                'The Prop Data in this Prop Entry is null, this will be interpreted as the "none" option. You should only see this message once per Node selection.'
            );

            if (this._currentSelectedDinerNode?.getCurrentPropData() === null) {
                entry.makeSelected();
            }
        } else {
            if (this._currentSelectedDinerNode?.getCurrentPropData()?.id === propData.id) {
                entry.makeSelected();
            }
        }

        //Make the node preview the prop immediately when it's clicked, and setup a callback for the Swap button to finalize the change.
        entry.OnPropEntryButtonPressed = () => {
            this._onPropSelected(entry, propInstanceData, taskContextDoesNotExist);
        };

        this._currentEntries.push(entry);
    }

    private async _onPropSelected(entry: PropScrollEntry, propInstanceData: PropInstanceData, taskContextDoesNotExist: boolean) {
        const propData = propInstanceData?.data;

        // Set all prop buttons non-interactable
        this._currentEntries.forEach((e: PropScrollEntry) => {
            e.setInteractable(false);
            e.deselect();
        });

        entry.makeSelected();

        // Once the prop is swapped, mark the buttons interactable again
        if (propData) {
            await this._currentSelectedDinerNode.showPreviewProp(propData);
        } else {
            this._currentSelectedDinerNode.showPreviewNone();
        }

        this._currentEntries.forEach((e: PropScrollEntry) => {
            e.setInteractable(true);
        });

        this._onSwapPropHandler = async () => {
            this._onPropActionButton(entry, propInstanceData, taskContextDoesNotExist);
        };
        this._updateActionButton(propInstanceData);
    }

    private async _onPropActionButton(entry: PropScrollEntry, propInstanceData: PropInstanceData, taskContextDoesNotExist: boolean) {
        const propData = propInstanceData?.data;

        // Reqs not met; TODO:
        if (!this._requirementsService.checkRequirementsMet(propData?.requirements || [])) {
            this._log.warn('You need to meet the Requirements in order to place this prop!'); //TODO: Open up some sort of prompt, likely contextual, like allow them to buy it if it's just currency for example...
            return;
        }

        // Not owned; buy it or open the coin store
        if (propInstanceData && !propInstanceData.isOwned) {
            this._setActionButtonInteractable(false);

            let totalCoins = await this._cardScrambleService.getCurrencyBalance(Currency.Coins);
            //TODO: We should move this coin check into the Store service
            if (!propInstanceData.storeData.isUpsell && totalCoins < propInstanceData.storeData.cost.amount) {
                await this._dinerSceneController.openCoinStore();
            } else {
                const result = await this._propCatalog.purchaseProp(propInstanceData);
                if (result) {
                    await this._makeSwap(propInstanceData, taskContextDoesNotExist);
                }
            }

            //This prevents a null ref in the case that a task context closes the screen.
            if (this._currentSelectedDinerNode) {
                this._updateActionButton(propInstanceData);
                this._setActionButtonInteractable(true);
            }

            return;
        }

        // Owned + Reqs met: SWAP!
        await this._makeSwap(propInstanceData, taskContextDoesNotExist);
    }

    private async _makeSwap(propInstanceData: PropInstanceData, taskContextDoesNotExist: boolean) {
        const propData = propInstanceData?.data;

        this._setActionButtonInteractable(false);
        this._currentSelectedDinerNode.hidePropPreview();
        await this._currentSelectedDinerNode.swapToProp(propData, taskContextDoesNotExist);
        SoundManager.instance.playSound('SFX_BuildMode_PropPlaced');
        this._currentSelectedDinerNode.playSwapAnimation();
        this.PropSwappedEvent.invoke();
        this.OnSwapProp?.call(this, propInstanceData);
        const propId = propData?.id;
        this._updateEntryVisuals(propId);
    }

    private _setActionButtonInteractable(interactable: boolean) {
        this._propActionButton.interactable = interactable;
        if (!interactable) {
            this.hideActionButton();
        }
    }

    private _updateEntryVisuals(currentPropID: string) {
        this._currentEntries.forEach((entry: PropScrollEntry) => {
            entry.updateVisuals(currentPropID);
        });
    }

    private async _updateActionButton(propInstanceData: PropInstanceData) {
        this._propActionButton.interactable = false;

        // None option
        if (propInstanceData == null) {
            const currentPropData = this._currentSelectedDinerNode.getCurrentPropData();
            if (currentPropData) {
                this._propActionCurrencyIconNode.active = false;
                this._propActionCurrencyLabel.node.active = false;
                this._propActionButtonLabel.string = 'Set Empty';
                this._propActionButton.interactable = true;
                this._propActionButton.node.active = true;
                if (!this._actionButtonVisible) {
                    this.showActionButton();
                }
            } else {
                this._propActionButton.node.active = false;
                this._propActionButton.interactable = false;
                if (this._actionButtonVisible) {
                    this.hideActionButton();
                }
            }
            return;
        }

        if (propInstanceData.isOwned) {
            this._propActionButtonLabel.string = 'Swap';
            this._propActionCurrencyIconNode.active = false;
            this._propActionCurrencyLabel.node.active = false;
            if (this._currentSelectedDinerNode.getCurrentPropData()?.id === propInstanceData.data.id) {
                this._clearActionButton();
            } else {
                this._propActionButton.interactable = true;
                this._propActionButton.node.active = true;
                if (!this._actionButtonVisible) {
                    this.showActionButton();
                }
            }
        } else {
            this._propActionButton.interactable = true;

            // Set the right currency icon based on the propInstanceData
            switch (propInstanceData.storeData.cost.currency) {
                case Currency.Coins:
                    this._propActionCurrencyIcon.spriteFrame = this.currencyIcons[0];
                    this._propActionCurrencyIconShadow.spriteFrame = this.currencyIcons[0];
                    break;
                case Currency.Gems:
                    this._propActionCurrencyIcon.spriteFrame = this.currencyIcons[1];
                    this._propActionCurrencyIconShadow.spriteFrame = this.currencyIcons[1];
                    break;
                default:
                    this._log.warn(`Unknown currency type: ${propInstanceData.storeData.cost.currency}`);
                    this._propActionCurrencyIcon = null;
                    break;
            }

            if (propInstanceData.storeData.cost.amount > 0) {
                this._propActionCurrencyIconNode.active = true;
                this._propActionButtonLabel.string = 'Buy';
                this._propActionCurrencyLabel.node.active = true;
                this._propActionCurrencyLabel.string = `${propInstanceData.storeData.cost.amount}`;
            } else {
                this._propActionCurrencyIconNode.active = false;
                this._propActionButtonLabel.string = 'Free';
                this._propActionCurrencyLabel.node.active = false;
            }

            // If the prop is a club exclusive and they are not club, show the upsell label
            if (propInstanceData.storeData.isUpsell && this._isPremiumUser !== true) {
                this._propActionCurrencyIconNode.active = true;
                this._propActionCurrencyLabel.node.active = false;
                this._propActionCurrencyIcon.spriteFrame = this.currencyIcons[2]; // Item 2 is the club icon
                this._propActionCurrencyIconShadow.spriteFrame = this.currencyIcons[2];
                this._propActionButtonLabel.string = 'CLUB';
            }

            let totalCoins = await this._cardScrambleService.getCurrencyBalance(Currency.Coins);
            if (totalCoins < propInstanceData.storeData.cost.amount) {
                this._propActionCurrencyLabel.color = this._insufficientFundsColor;
            } else {
                this._propActionCurrencyLabel.color = Color.WHITE;
            }
            this._propActionButton.interactable = true;
            this._propActionButton.node.active = true;
            if (!this._actionButtonVisible) {
                this.showActionButton();
            }
        }
    }

    private _clearActionButton() {
        this._propActionButton.interactable = false;
        this._propActionButton.node.active = false;
        if (this._actionButtonVisible) {
            this.hideActionButton();
        }
    }

    private _clearAllPropEntries() {
        //Make this clear the list of prop entries so that there's no leftover data between transitions between selected nodes
        if (this._propEntryHandle) {
            this._propEntryHandle.destroyAllChildren();
        }
        this._currentEntries = [];
        this._clearActionButton();
    }

    private _onSwapPropButtonPressedCallback() {
        this._onSwapPropHandler?.call(this);
    }
}
