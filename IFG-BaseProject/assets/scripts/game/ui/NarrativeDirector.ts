import {
    _decorator,
    Animation,
    Button,
    CCInteger,
    Color,
    Component,
    EventTouch,
    instantiate,
    Label,
    Node,
    Prefab,
    resources,
    RichText,
    Sprite,
    SpriteFrame,
    tween,
    Tween,
    UIOpacity,
    Vec3,
    Widget
} from 'cc';
import { DialogueLine, DialogueSection, DialogueSet, DialogueType, SideOfScreen } from 'db://assets/scripts/narrative/DialogueSet';
import { SoundManager } from '../../audio/SoundManager';
import { FadeType } from '../../diner/ui/ScreenFader';
import { logger } from '../../logging';
import { ICardScrambleService } from '../../services/ICardScrambleService';
import { UIOverlayService } from '../../services/UIOverlayService';
import { App } from '../../state/App';
import { PhoneHUD } from '../../ui/PhoneHUD';
import { ChapterStartedView } from './ChapterStartedView';

const { ccclass, property } = _decorator;

@ccclass('NarrativeDirector')
export class NarrativeDirector extends Component {
    @property(Label)
    private leftSideName: Label | null = null;

    @property(Label)
    private rightSideName: Label | null = null;

    @property(Label)
    private tapToContinueText: Label | null = null;

    @property(Node)
    private centerSpriteContainer: Node | null = null;

    @property(Sprite)
    private centerSprite: Sprite | null = null;

    @property(Label)
    private textBox: Label | null = null;

    @property(Label)
    private nonDialogueText: Label | null = null;

    @property(Sprite)
    private leftCharacter: Sprite | null = null;

    @property(Sprite)
    private rightCharacter: Sprite | null = null;

    @property(Node)
    private textBoxNode: Node | null = null;

    @property(SpriteFrame)
    private fallbackSprite: SpriteFrame | null = null;

    @property(SpriteFrame)
    private fallbackPhoneSprite: SpriteFrame | null = null;

    @property(Vec3)
    private leftInPosition: Vec3 | null = null;

    @property(Vec3)
    private rightInPosition: Vec3 | null = null;

    @property(Vec3)
    private leftOutPosition: Vec3 | null = null;

    @property(Vec3)
    private rightOutPosition: Vec3 | null = null;

    @property(Button)
    private skipDialogueButton: Button | null = null;

    @property(Prefab)
    private phoneHUDPrefab: Prefab | null = null;

    @property(Node)
    private letterParentNode: Node | null = null;

    @property(RichText)
    private letterTextBox: RichText | null = null;

    @property(Animation)
    private letterAnimator: Animation | null = null;

    @property(Node)
    private scrim: Node | null = null;

    @property(Prefab)
    private chapterStartedPrefab: Prefab | null = null;

    @property({ type: SpriteFrame, visible: true })
    private rightSpeakerSprite: SpriteFrame = null;

    @property({ type: SpriteFrame, visible: true })
    private leftSpeakerSprite: SpriteFrame = null;

    @property({ type: CCInteger, visible: true, tooltip: 'The widget left indentation for the text when the left speech bubble is being used.' })
    private leftTextBoxIndent: number = 0;

    @property({
        type: CCInteger,
        visible: true,
        tooltip: 'The widget left indentation for the text when the right speech bubble is being used.'
    })
    private rightTextBoxIndent: number = 0;

    @property({ visible: true, tooltip: 'The default offset of the text box from the left side of the screen' })
    private defaultTextLeftOffset: number = 0;

    @property({ visible: true, tooltip: 'The phone offset of the text box from the left side of the screen' })
    private phoneTextLeftOffset: number = 0;

    @property({ visible: true, tooltip: 'The default offset of the text box from the top of the screen' })
    private defaultTextTopOffset: number = 0;

    @property({ visible: true, tooltip: 'The phone offset of the text box from the top of the screen' })
    private phoneTextTopOffset: number = 0;

    @property({ visible: true, tooltip: 'The dcolor for the text box in normal conversation' })
    private defaultTextBoxColor: Color = new Color(255, 255, 255, 255);

    @property({ visible: true, tooltip: 'The color for the text box in phone conversation' })
    private phoneTextBoxColor: Color = new Color(0, 0, 0, 255);

    private isTyping: boolean = false;
    private letterDisplayed: boolean = false;
    private loaded: boolean = false;
    private currentDialogueSet: DialogueSet;
    private currentSection: DialogueSection;
    private currentLine: DialogueLine;
    private previousLeftAnimation: string = '';
    private previousRightAnimation: string = '';
    private previousLeftSpeaker: string;
    private previousRightSpeaker: string;
    private _app: App = null;
    private cardScrambleService: ICardScrambleService | null = null;
    private uiOverlayService: UIOverlayService = null;
    private dialogueId: string = '';
    private _shouldSendDialogueSeenEvent: boolean = true;
    private _dialogueFormat: string = '';
    private _phoneHUDInstance: PhoneHUD = null;
    private _phoneHUDNode: Node;
    private _typingStarted: boolean = false;
    private _callerTalkingTween: Tween<Node> = null;
    private _log = logger.child('NarrativeDirector');

    private _onDialogueSeenCallback: () => void;

    private loadedSprites: Map<string, SpriteFrame> = new Map();

    private _tweens: Tween<unknown>[] = [];

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.skipDialogueButton.node.on(Button.EventType.CLICK, this._onDialogueSkipped, this);

        this.leftCharacter.enabled = false;
        this.rightCharacter.enabled = false;
        this.leftSideName.enabled = false;
        this.rightSideName.enabled = false;
        this.tapToContinueText.enabled = false;
        this.textBoxNode.active = false;
        this.nonDialogueText.node.active = false;
        this.letterParentNode.active = false;
    }

    async start() {
        this.textBox.node.active = false;
        this.skipDialogueButton.node.active = false;
        this.centerSpriteContainer.active = false;
        this.centerSprite.getComponent(UIOpacity).opacity = 0;
    }

    public Init(cardScrambleService: ICardScrambleService, uiOverlayService: UIOverlayService, app: App) {
        this.cardScrambleService = cardScrambleService;
        this.uiOverlayService = uiOverlayService;
        this._app = app;
        this.getComponent(Widget).target = this.uiOverlayService.getOverlayContainer();
    }

    public PlayDialogueSequence(dialogueSet: DialogueSet, sendDialogueSeenEvent: boolean = true, onDialogueSeenEvent: () => void = null) {
        this.dialogueId = dialogueSet.dialogueId;
        this.currentDialogueSet = dialogueSet;
        this.currentSection = this.currentDialogueSet.dialogueSections[0];
        this.currentLine = this.currentSection.lines[0];
        this._shouldSendDialogueSeenEvent = sendDialogueSeenEvent;
        this._onDialogueSeenCallback = onDialogueSeenEvent;
        this._dialogueFormat = this.currentDialogueSet.dialogueFormat;

        this.loadAllSprites();
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        for (const tween of this._tweens) {
            tween.stop();
        }
        this._tweens = [];
    }

    async nextAction() {
        if (!Object.values(DialogueType).includes(this.currentSection.dialogueType)) {
            this._log.error(
                `Invalid dialogue type: ${this.currentSection.dialogueType} is not recognized.\nCheck spelling and ensure Dialogue type is one word in Title case. Accepted values are: ${Object.values(DialogueType).join('\n ')}`
            );
        }

        //Disable touch events and the skip button for all special cases
        this.skipDialogueButton.node.active = false;
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);

        //CHAPTERSTARTEDVIEW
        if (this.currentSection.dialogueType == DialogueType.ChapterStart) {
            this.moveCharactersOffScreen();
            if (this._phoneHUDInstance) {
                this._phoneHUDInstance.node.active = false;
            }
            this.textBoxNode.active = false;
            this.tapToContinueText.enabled = false;
            this.centerSpriteContainer.active = false;
            this.skipDialogueButton.node.active = false;
            this.nonDialogueText.node.active = false;

            const characterSprite = this.getSprite(
                this.getSpriteName(this.currentSection.characterNames[0], this.currentLine.characterSprites[0])
            );
            const chapterDetails = this.currentLine.line.split(':');
            const chapterStartedView = instantiate(this.chapterStartedPrefab);
            const chapterStartedViewScript = chapterStartedView.getComponent(ChapterStartedView);
            //Optionally pass in a background sprite path, if we want to use different backgrounds in the future
            chapterStartedViewScript.init(characterSprite, chapterDetails[0], chapterDetails[1], chapterDetails[2], () => {
                this.scrim.active = false;
                chapterStartedView.parent = this.node;
                chapterStartedViewScript.playAnimation(() => {
                    chapterStartedViewScript.stopAnimation();
                    chapterStartedView.destroy();
                    this.onTouchStart();
                });
            });
            return;
        }

        // SFX
        // If the current line is a sound effect, play it and skip to the next line
        if (this.currentSection.dialogueType == DialogueType.SFX) {
            if (this.currentSection.characterNames[0].toLowerCase() === 'play_sfx') {
                SoundManager.instance.playSound(this.currentLine.line);
                this.onTouchStart();
                return;
            }
        }

        //LETTER
        // If the current line is a letter, display it and wait for the user to tap to continue
        if (this.currentSection.dialogueType == DialogueType.Letter) {
            // Hide normal dialogue nodes
            this.textBoxNode.active = false;
            this.tapToContinueText.enabled = false;
            this.centerSpriteContainer.active = false;
            this.skipDialogueButton.node.active = false;

            this.letterTextBox.string = this.currentLine.line;
            this.letterParentNode.active = true;
            this.letterAnimator.play('dialogue-letter-in');
            this.letterDisplayed = true;

            //Wait until the letter animation is done and re-enable the tap to continue
            this.letterAnimator.on(Animation.EventType.FINISHED, () => {
                this.tapToContinueText.enabled = true;
                this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
            });
        }

        //MUSIC
        if (this.currentSection.dialogueType == DialogueType.Music) {
            if (this.currentSection.characterNames[0].toLowerCase() === 'play_music') {
                SoundManager.instance.playMusic(this.currentLine.line);
                this.onTouchStart();
                return;
            }

            if (this.currentSection.characterNames[0].toLowerCase() === 'fadeout_music') {
                let fadeOutTime = parseFloat(this.currentLine.line);
                if (isNaN(fadeOutTime)) {
                    this._log.error('Music FadeOut time is not a number, using default value of 1 second');
                    fadeOutTime = 1;
                }
                SoundManager.instance.fadeOutCurrentMusic(fadeOutTime);
                this.onTouchStart();
                return;
            }

            if (this.currentSection.characterNames[0].toLowerCase() === 'fadein_music') {
                let fadeInTime = parseFloat(this.currentLine.line);
                if (isNaN(fadeInTime)) {
                    this._log.error('Music FadeIn time is not a number, using default value of 1 second');
                    fadeInTime = 1;
                }
                SoundManager.instance.fadeInCurrentMusic(fadeInTime);
                this.onTouchStart();
                return;
            }

            if (this.currentSection.characterNames[0].toLowerCase() === 'stop_music') {
                SoundManager.instance.stopAllMusic();
                this.onTouchStart();
                return;
            }
        }

        //SCRIM
        if (this.currentSection.dialogueType == DialogueType.Scrim) {
            if (this.currentSection.characterNames[0].toLowerCase() === 'show') {
                this.scrim.active = true;
            }

            if (this.currentSection.characterNames[0].toLowerCase() === 'hide') {
                this.scrim.active = false;
            }
            this.onTouchStart();
            return;
        }

        //CAMERA FOCUS
        if (this.currentSection.dialogueType == DialogueType.CameraFocus) {
            this.textBoxNode.active = false;
            this.tapToContinueText.enabled = false;
            this.centerSpriteContainer.active = false;
            this.skipDialogueButton.node.active = false;
            this.nonDialogueText.node.active = false;
            this.scrim.active = false;

            // If the character is "room" then get the room name from the line
            if (this.currentSection.characterNames[0].toLowerCase() === 'camerafocus_room') {
                this._app.Services.dinerService.focusOnRoom(this.currentLine.line.toLowerCase(), () => {
                    this.onTouchStart();
                    this.scrim.active = false;
                    return;
                });
            }

            // If the character is "node" then split the currentLine.line by : left of colon is room name, right of colon is node name
            // Example: "room:node" will focus on the node in the room
            if (this.currentSection.characterNames[0].toLowerCase() === 'camerafocus_node') {
                const roomAndNode = this.currentLine.line.split(':');
                if (roomAndNode.length > 1) {
                    const roomName = roomAndNode[0].toLowerCase();
                    const nodeName = roomAndNode[1].toLowerCase();
                    this._app.Services.dinerService.focusOnNode(roomName, nodeName, () => {
                        this.onTouchStart();
                        this.scrim.active = false;
                        return;
                    });
                }
            }
        }

        // CAMERA SHAKE
        if (this.currentSection.dialogueType == DialogueType.CameraShake) {
            this.textBoxNode.active = false;
            this.tapToContinueText.enabled = false;
            this.centerSpriteContainer.active = false;
            this.skipDialogueButton.node.active = false;
            this.nonDialogueText.node.active = false;

            let shakeTimeAndIntensity = this.currentLine.line.split(':');

            let shakeTime = parseFloat(shakeTimeAndIntensity[0]);
            if (isNaN(shakeTime)) {
                this._log.error('Shake time is not a number, using default value of 1 second');
                shakeTime = 1;
            }

            let shakeIntensity = parseFloat(shakeTimeAndIntensity[1]);
            if (isNaN(shakeIntensity)) {
                this._log.error('Shake intensity is not a number, using default value of 20');
                shakeIntensity = 20;
            }

            this._app.Services.dinerService.shakeCamera(shakeTime, shakeIntensity, () => {});
            // Don't wait for the callback, just move on to the next line
            // So we can have for example *CRASH* shown in exposition text while the shake happens in the camera controller
            this.onTouchStart();
            return;
        }

        // SCREEN FADES
        if (this.currentSection.dialogueType == DialogueType.Fade) {
            this.moveCharactersOffScreen();
            this.textBoxNode.active = false;
            this.tapToContinueText.enabled = false;
            this.centerSpriteContainer.active = false;
            this.skipDialogueButton.node.active = false;
            this.nonDialogueText.node.active = false;

            // Fade Out
            if (this.currentSection.characterNames[0].toLowerCase() === 'fadeout_screen') {
                //Hide dialogue text box and send all characters off screen

                let fadeOutTime = parseFloat(this.currentLine.line);
                if (isNaN(fadeOutTime)) {
                    this._log.error('FadeOut time is not a number, using default value of 1 second');
                    fadeOutTime = 1;
                }

                this.uiOverlayService.fadeScreen(FadeType.FADE_OUT, fadeOutTime, () => {
                    this.onTouchStart();
                });
                return;
            }

            // Fade In
            if (this.currentSection.characterNames[0].toLowerCase() === 'fadein_screen') {
                let fadeInTime = parseFloat(this.currentLine.line);
                if (isNaN(fadeInTime)) {
                    this._log.error('FadeIn time is not a number, using default value of 1 second');
                    fadeInTime = 1;
                }
                this.uiOverlayService.fadeScreen(FadeType.FADE_IN, fadeInTime, () => {
                    this.onTouchStart();
                });
                return;
            }

            //Fade out and back
            if (this.currentSection.characterNames[0].toLowerCase() === 'fadeoutin_screen') {
                let fadeTime = parseFloat(this.currentLine.line);
                if (isNaN(fadeTime)) {
                    this._log.error('FadeOut time is not a number, using default value of 1 second');
                    fadeTime = 1;
                }
                this.uiOverlayService.fadeScreen(FadeType.FADE_OUT_IN, fadeTime, () => {
                    this.onTouchStart();
                });
                return;
            }
        }

        // SPRITES
        if (this.currentSection.dialogueType == DialogueType.Sprite) {
            this.moveCharactersOffScreen();
            this.textBoxNode.active = false;
            this.tapToContinueText.enabled = false;
            this.centerSpriteContainer.active = false;
            this.nonDialogueText.node.active = false;
            this.scrim.active = false;

            const uiOpacity = this.centerSprite.getComponent(UIOpacity);
            if (this.currentLine.line == '') {
                this.centerSpriteContainer.active = false;
                uiOpacity.opacity = 0;
                this._log.error('Sprite event defined but no sprite name provided');
                return;
            }

            // Use the current line as the sprite path, with /resources assumed as the root
            uiOpacity.opacity = 0;
            this.centerSpriteContainer.active = false;
            const timeAndPath = this.currentLine.line.split(':');
            const time = parseFloat(timeAndPath[0]);
            const spritePath = `${timeAndPath[1]}/spriteFrame`;
            let timeDivided = 0;
            if (isNaN(time)) {
                timeDivided = 1;
                this._log.error('Sprite time is not a number, using default value of 1 second per step');
            } else {
                timeDivided = time / 3;
            }
            resources.load(spritePath, SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    this._log.error(`Failed to load sprite: "${spritePath}"`, err);

                    return;
                }

                if (!spriteFrame) {
                    const error = new Error('Sprite for Sprite narrative event not found!');
                    this._log.error(error.message);
                    return;
                }
                this.centerSprite.spriteFrame = spriteFrame;
                this.centerSpriteContainer.active = true;

                let tweenSpriteOpacity = tween(uiOpacity)
                    .to(timeDivided, { opacity: 255 })
                    .delay(timeDivided)
                    .to(timeDivided, { opacity: 0 })
                    .call(() => {
                        this.onTouchStart();
                        return;
                    });

                this._tweens.push(tweenSpriteOpacity);
                tweenSpriteOpacity.start();
            });
        }

        //Reenable touch events if the current section is not a special case
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);

        // EXPOSITION
        if (this.currentSection.dialogueType == DialogueType.Exposition) {
            this.isTyping = true;
            this.textBoxNode.active = false;
            this.tapToContinueText.enabled = false;
            this.nonDialogueText.string = '';
            this.nonDialogueText.node.active = true;
            while (this.nonDialogueText.string != this.currentLine.line && this.isTyping) {
                this.nonDialogueText.string += this.currentLine.line[this.nonDialogueText.string.length];
                await delay(25);
            }
            this.isTyping = false;
            this.tapToContinueText.enabled = true;
            return;
        }

        //DIALOGUE
        if (this.currentSection.dialogueType == DialogueType.Speaking) {
            this.scrim.active = true;
            this.isTyping = true;
            this.textBox.string = '';
            this.textBoxNode.active = true;
            this.textBox.node.active = true;
            this.nonDialogueText.node.active = false;
            this.popTextBox();

            if (this.currentSection.characterSide == SideOfScreen.Left) {
                if (this._dialogueFormat.toLowerCase() === 'phone') {
                    this.leftCharacter.node.active = false;
                    if (this._callerTalkingTween === null) {
                        this.setPhoneFocus(true, 0.25);
                    }

                    if (this._phoneHUDInstance && this.currentLine.unskippable === true) {
                        this._phoneHUDInstance.callAppScreen.setEndCallButtonVisible(false);
                    } else if (this._phoneHUDInstance && this.currentLine.unskippable === false) {
                        this._phoneHUDInstance.callAppScreen.setEndCallButtonVisible(true);
                    }
                }

                if (!this.leftCharacter.enabled || this.previousLeftSpeaker != this.currentSection.characterNames[0]) {
                    this.previousLeftAnimation = '';

                    if (this.previousLeftAnimation != 'Dialogue_EnterLeft') {
                        this.leftCharacter.node.position = this.leftOutPosition;
                        this.leftCharacter.enabled = true;

                        this.setFocus(true, true, 0.05);
                        let tweenLeftCharIn = tween(this.leftCharacter.node).to(0.25, { position: this.leftInPosition });
                        this._tweens.push(tweenLeftCharIn);
                        tweenLeftCharIn.start();
                        this.previousLeftAnimation = 'Dialogue_EnterLeft';
                    }
                }

                if (this.previousLeftAnimation != 'Dialogue_FocusInLeft' && this.previousLeftAnimation != 'Dialogue_EnterLeft') {
                    this.setFocus(true, true, 0.25);
                }

                if (this.previousRightAnimation != 'Dialogue_FocusOutRight' && this.rightCharacter.enabled) {
                    this.setFocus(false, false, 0.25);
                }

                this.leftCharacter.enabled = true;
                this.leftCharacter.spriteFrame = this.getSprite(
                    this.getSpriteName(this.currentSection.characterNames[0], this.currentLine.characterSprites[0])
                );
                this.leftSideName.string = this.currentSection.characterNames[0];
                this.previousLeftSpeaker = this.currentSection.characterNames[0];
                this.leftSideName.enabled = true;
                this.setTextBoxSpriteRightFacing(false);
                this.rightSideName.enabled = false;
            } else if (this.currentSection.characterSide == SideOfScreen.Right) {
                if (this._dialogueFormat.toLowerCase() === 'phone') {
                    this.setPhoneFocus(false, 0.25);
                }

                if (!this.rightCharacter.enabled || this.previousRightSpeaker != this.currentSection.characterNames[0]) {
                    this.previousRightAnimation = '';

                    if (this.previousRightAnimation != 'Dialogue_EnterRight') {
                        this.rightCharacter.node.position = this.rightOutPosition;
                        this.rightCharacter.enabled = true;

                        this.setFocus(false, true, 0.05);
                        let tweenRighCharIn = tween(this.rightCharacter.node).to(0.25, { position: this.rightInPosition });
                        this._tweens.push(tweenRighCharIn);
                        tweenRighCharIn.start();
                        this.previousRightAnimation = 'Dialogue_EnterRight';
                    }
                }

                if (this.previousRightAnimation != 'Dialogue_FocusInRight' && this.previousRightAnimation != 'Dialogue_EnterRight') {
                    this.setFocus(false, true, 0.25);
                }

                if (this.previousLeftAnimation != 'Dialogue_FocusOutLeft' && this.leftCharacter.enabled) {
                    this.setFocus(true, false, 0.25);
                }

                this.rightCharacter.enabled = true;
                this.rightCharacter.spriteFrame = this.getSprite(
                    this.getSpriteName(this.currentSection.characterNames[0], this.currentLine.characterSprites[0])
                );
                this.rightSideName.string = this.currentSection.characterNames[0];
                this.previousRightSpeaker = this.currentSection.characterNames[0];
                this.leftSideName.enabled = false;
                this.setTextBoxSpriteRightFacing(true);
                this.rightSideName.enabled = true;
            } else {
                if (this._dialogueFormat.toLowerCase() === 'phone') {
                    this.leftCharacter.node.active = false;
                    if (this._callerTalkingTween === null) {
                        this.setPhoneFocus(true, 0.25);
                    }
                }

                if (!this.leftCharacter.enabled || this.previousLeftSpeaker != this.currentSection.characterNames[0]) {
                    this.previousLeftAnimation = '';

                    if (this.previousLeftAnimation != 'Dialogue_EnterLeft') {
                        this.leftCharacter.enabled = true;

                        this.setFocus(true, true, 0.05);
                        let tweenLeftCharInPhone = tween(this.leftCharacter.node).to(0.25, { position: this.leftInPosition });
                        this._tweens.push(tweenLeftCharInPhone);
                        tweenLeftCharInPhone.start();
                        this.previousLeftAnimation = 'Dialogue_EnterLeft';
                    }
                }
                if (!this.rightCharacter.enabled || this.previousRightSpeaker != this.currentSection.characterNames[1]) {
                    this.previousRightAnimation = '';

                    if (this.previousRightAnimation != 'Dialogue_EnterRight') {
                        this.rightCharacter.enabled = true;

                        this.setFocus(false, true, 0.05);
                        let tweenRightCharInPhone = tween(this.rightCharacter.node).to(0.25, { position: this.rightInPosition });
                        this._tweens.push(tweenRightCharInPhone);
                        tweenRightCharInPhone.start();
                        this.previousRightAnimation = 'Dialogue_EnterRight';
                    }
                }

                if (this.previousLeftAnimation != 'Dialogue_FocusInLeft') {
                    this.setFocus(true, true, 0.25);
                }
                if (this.previousRightAnimation != 'Dialogue_FocusInRight') {
                    this.setFocus(false, true, 0.25);
                }

                this.leftCharacter.enabled = true;
                this.rightCharacter.enabled = true;
                this.leftCharacter.spriteFrame = this.getSprite(
                    this.getSpriteName(this.currentSection.characterNames[0], this.currentLine.characterSprites[0])
                );
                this.rightCharacter.spriteFrame = this.getSprite(
                    this.getSpriteName(this.currentSection.characterNames[1], this.currentLine.characterSprites[1])
                );
                this.leftSideName.string = this.currentSection.characterNames[0];
                this.rightSideName.string = this.currentSection.characterNames[1];
                this.previousLeftSpeaker = this.currentSection.characterNames[0];
                this.previousRightSpeaker = this.currentSection.characterNames[1];
                this.leftSideName.enabled = true;
                this.rightSideName.enabled = true;
            }

            while (this.textBox.string != this.currentLine.line && this.isTyping) {
                this.textBox.string += this.currentLine.line[this.textBox.string.length];
                await delay(25);
            }
            this.isTyping = false;
            this.tapToContinueText.enabled = true;
        } else {
            this.leftCharacter.enabled = false;
            this.rightCharacter.enabled = false;
            this.leftSideName.enabled = false;
            this.rightSideName.enabled = false;
        }

        function delay(ms: number) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }
    }

    private async onTouchStart(_event?: EventTouch) {
        if (this.letterDisplayed) {
            this.letterDisplayed = false;
            this.tapToContinueText.enabled = false;
            this.letterAnimator.play('dialogue-letter-out');
            this.letterAnimator.on(Animation.EventType.FINISHED, () => {
                this.letterParentNode.active = false;
            });
        }

        if (this.isTyping) {
            //Skips current typing anim and displays the full text
            this.isTyping = false;
            this.textBox.string = this.currentLine.line;
            this.nonDialogueText.string = this.currentLine.line;
            this.tapToContinueText.enabled = true;
            if (this.currentLine.unskippable != true && this._dialogueFormat.toLowerCase() != 'phone') {
                this.skipDialogueButton.node.active = true;
            }
            return;
        }

        if (!this._typingStarted) {
            return;
        }

        const isLastLine = this.currentLine == this.currentSection.lines[this.currentSection.lines.length - 1];
        const isLastSection =
            this.currentSection == this.currentDialogueSet.dialogueSections[this.currentDialogueSet.dialogueSections.length - 1];

        if (isLastLine && isLastSection) {
            if (!this._shouldSendDialogueSeenEvent) {
                this._cleanup();
            } else {
                // Don't clean up until we've saved the dialogue seen event and fired the callback
                await this.cardScrambleService.onDialogueSeen(this.dialogueId).then(() => {
                    this._onDialogueSeenCallback?.call(this);
                    this._cleanup();
                });
            }
            return;
        }

        if (isLastLine) {
            let previousSectionIndex: number = this.currentDialogueSet.dialogueSections.indexOf(this.currentSection);
            this.currentSection = this.currentDialogueSet.dialogueSections[previousSectionIndex + 1];
            this.currentLine = this.currentSection.lines[0];
        } else {
            let previousLineIndex: number = this.currentSection.lines.indexOf(this.currentLine);
            this.currentLine = this.currentSection.lines[previousLineIndex + 1];
        }

        this.centerSpriteContainer.active = false;
        this.tapToContinueText.enabled = false;
        await this.nextAction();
    }

    private _cleanup(skipped = false) {
        this.node.emit('dialogue-complete', this.cardScrambleService, () => {});
        this.cardScrambleService.sendGa4Event({
            game_event_type: 'dialogue',
            game_event_location: skipped ? `${this.dialogueId}_skipped` : `${this.dialogueId}_completed`
        });

        if (skipped) {
            this.skipDialogueButton.node.off(Button.EventType.CLICK, this._onDialogueSkipped, this);

            //Sending this with the line number, is there a better way?
            this.cardScrambleService.sendGa4Event({
                game_event_type: 'dialogue',
                game_event_location: `${this.dialogueId}-dialogueEvent_${this.currentSection.lines.indexOf(this.currentLine) + 1}_skipped`
            });
        }

        if (this._phoneHUDInstance) {
            if (skipped) {
                this._phoneHUDInstance
                    .getComponent(PhoneHUD)
                    .callAppScreen.node.off(PhoneHUD.OnPhoneCallEndedEvent, this._onDialogueSkipped, this);
                this._phoneHUDInstance.node.off(PhoneHUD.OnPhoneCallEndedEvent, this._onDialogueSkipped, this);
            }
            this._phoneHUDInstance.node.destroy();
        }

        this.node.destroy();
    }

    private _onDialogueSkipped() {
        if (!this._shouldSendDialogueSeenEvent) {
            this._cleanup(true);
        } else {
            // Don't clean up until we've saved the dialogue seen event and fired the callback
            this.cardScrambleService.onDialogueSeen(this.dialogueId).then(() => {
                this._onDialogueSeenCallback?.call(this);
                this._cleanup(true);
            });
        }
    }

    //TODO: This should be reafactored to load a single sprite at a time as needed, it currenty causes long wait times
    // Ideally we load the sprite for each next line while the current line is being typed
    private loadAllSprites() {
        let spritesToLoad: string[] = [];

        this.currentDialogueSet.dialogueSections.forEach((section) => {
            section.lines.forEach((line) => {
                if (section.dialogueType == DialogueType.Speaking || section.dialogueType == DialogueType.ChapterStart) {
                    line.characterSprites.forEach((sprite, index) => {
                        const spriteName = this.getSpriteName(section.characterNames[index], sprite);
                        spritesToLoad.push(spriteName);
                    });
                }
            });
        });

        this.loadDialogueSprite(spritesToLoad[0], spritesToLoad);
    }

    private loadDialogueSprite(sprite: string, spritesToLoad: string[]) {
        const path = `dialogueSprites/${sprite}/spriteFrame`;
        resources.load(path, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                this._log.error(`Failed to load sprite: "${sprite}"`, err);

                spritesToLoad.splice(0, 1);
                this.preDisplaySetup(spritesToLoad);

                return;
            }

            if (!spriteFrame) {
                const error = new Error('Sprite not found!');
                this._log.error(error.message);
                return;
            }

            this.loadedSprites.set(sprite, spriteFrame);
            spritesToLoad.splice(0, 1);

            this.preDisplaySetup(spritesToLoad);
        });
    }

    private popTextBox() {
        this.textBoxNode.eulerAngles = Vec3.ZERO;
        this.textBoxNode.scale = Vec3.ONE;

        let textBoxIn = tween(this.textBoxNode)
            .to(0.125, { scale: new Vec3(1.1, 1.1, 1.1) })
            .call(() => {
                tween(this.textBoxNode).to(0.125, { scale: Vec3.ONE }).start();
            });
        this._tweens.push(textBoxIn);
        textBoxIn.start();

        let textBoxWobble = tween(this.textBoxNode)
            .to(0.1, { eulerAngles: new Vec3(0, 0, 3) })
            .to(0.1, { eulerAngles: new Vec3(0, 0, -3) })
            .to(0.05, { eulerAngles: new Vec3(0, 0, 0) });
        this._tweens.push(textBoxWobble);
        textBoxWobble.start();
    }

    private setPhoneFocus(isFocusingIn: boolean, duration: number) {
        const phoneTweenNode = this._phoneHUDInstance.phoneNode;
        const phoneScaleNode = phoneTweenNode.parent;

        if (isFocusingIn) {
            this._phoneHUDInstance.dimPhoneCall(false);
            let phoneScaleUp = tween(phoneScaleNode).to(duration, { scale: new Vec3(1, 1, 1) });
            this._tweens.push(phoneScaleUp);
            phoneScaleUp.start();
        } else {
            this._phoneHUDInstance.dimPhoneCall(true);
            let phoneScaleDown = tween(phoneScaleNode).to(duration, { scale: new Vec3(0.75, 0.75, 0.75) });
            this._tweens.push(phoneScaleDown);
            phoneScaleDown.start();
        }
    }

    private setFocus(isLeft: boolean, isFocusingIn: boolean, duration: number) {
        if (isLeft && isFocusingIn) {
            const color = this.leftCharacter.color.clone();

            let leftCharFocusInColor = tween(color)
                .to(duration, { r: 255, g: 255, b: 255, a: 255 })
                .call(() => {
                    this.leftCharacter.color = color;
                });
            this._tweens.push(leftCharFocusInColor);
            leftCharFocusInColor.start();

            let leftCharFocusInScale = tween(this.leftCharacter.node).to(duration, { scale: new Vec3(-1, 1, 1) });
            this._tweens.push(leftCharFocusInScale);
            leftCharFocusInScale.start();

            this.previousLeftAnimation = 'Dialogue_FocusInLeft';
        } else if (isLeft && !isFocusingIn) {
            const color = this.leftCharacter.color.clone();

            let leftCharFocusOutColor = tween(color)
                .to(duration, { r: 100, g: 100, b: 100, a: 255 })
                .call(() => {
                    this.leftCharacter.color = color;
                });
            this._tweens.push(leftCharFocusOutColor);
            leftCharFocusOutColor.start();

            let leftCharFocusOutScale = tween(this.leftCharacter.node).to(duration, { scale: new Vec3(-0.75, 0.75, 0.75) });
            this._tweens.push(leftCharFocusOutScale);
            leftCharFocusOutScale.start();

            this.previousLeftAnimation = 'Dialogue_FocusOutLeft';
        } else if (!isLeft && isFocusingIn) {
            const color = this.rightCharacter.color.clone();

            let rightCharFocusInColor = tween(color)
                .to(duration, { r: 255, g: 255, b: 255, a: 255 })
                .call(() => {
                    this.rightCharacter.color = color;
                });
            this._tweens.push(rightCharFocusInColor);
            rightCharFocusInColor.start();

            let rightCharFocusInScale = tween(this.rightCharacter.node).to(duration, { scale: new Vec3(1, 1, 1) });
            this._tweens.push(rightCharFocusInScale);
            rightCharFocusInScale.start();

            this.previousRightAnimation = 'Dialogue_FocusInRight';
        } else if (!isLeft && !isFocusingIn) {
            const color = this.rightCharacter.color.clone();

            let rightChatFocusOutColor = tween(color)
                .to(duration, { r: 100, g: 100, b: 100, a: 255 })
                .call(() => {
                    this.rightCharacter.color = color;
                });
            this._tweens.push(rightChatFocusOutColor);
            rightChatFocusOutColor.start();

            let ricghCharFocusOutScale = tween(this.rightCharacter.node).to(duration, { scale: new Vec3(0.75, 0.75, 0.75) });
            this._tweens.push(ricghCharFocusOutScale);
            ricghCharFocusOutScale.start();

            this.previousRightAnimation = 'Dialogue_FocusOutRight';
        }
    }

    private async preDisplaySetup(spritesToLoad: string[]) {
        if (spritesToLoad.length > 0) {
            this.loadDialogueSprite(spritesToLoad[0], spritesToLoad);
        } else {
            this.loaded = true;

            this.cardScrambleService.sendGa4Event({
                game_event_type: 'dialogue',
                game_event_location: `${this.dialogueId}_showed`
            });

            if (this._dialogueFormat.toLowerCase() === 'phone') {
                this.setTextBoxToPhoneColor(true);
                this.textBoxNode.active = false;
                this._phoneHUDNode = instantiate(this.phoneHUDPrefab);
                this._phoneHUDInstance = this._phoneHUDNode.getComponent(PhoneHUD);
                this._phoneHUDInstance.init();
                this._phoneHUDNode.parent = this.node.parent;

                this.textBoxNode.getComponent(Widget).left = this.phoneTextLeftOffset;
                this.textBoxNode.getComponent(Widget).top = this.phoneTextTopOffset;

                let callerName: string = '';
                let callerSprite: SpriteFrame = null;
                for (const dialogueSection of this.currentDialogueSet.dialogueSections) {
                    if (dialogueSection.characterSide === SideOfScreen.Left) {
                        callerName = dialogueSection.characterNames[0];
                        callerSprite = this.getSprite(
                            this.getSpriteName(dialogueSection.characterNames[0], dialogueSection.lines[0].characterSprites[0])
                        );
                        break;
                    }
                }

                this.skipDialogueButton.node.active = false;
                this._phoneHUDInstance.showPhoneCallScreen();
                this._phoneHUDInstance.setPhoneCallIncoming(callerName, callerSprite);
                this._phoneHUDInstance.callAppScreen.node.on(PhoneHUD.OnPhoneCallAnsweredEvent, this._onPhoneAnswered, this);
                this._phoneHUDInstance.callAppScreen.node.on(PhoneHUD.OnPhoneCallEndedEvent, this._onDialogueSkipped, this);
            } else {
                this.setTextBoxToPhoneColor(false);
                this._typingStarted = true;
                this.textBoxNode.active = true;
                await this.nextAction();
            }
        }
    }

    private setTextBoxSpriteRightFacing(isRight: boolean) {
        // Setting the spriteFrame UVx flip doesn't work for some reason, and we can't negative scale the node because sliced sprites don't work with negative scale
        if (isRight) {
            this.textBoxNode.getComponent(Sprite).spriteFrame = this.rightSpeakerSprite;
            this.textBox.getComponent(Widget).left = this.rightTextBoxIndent;
        } else {
            this.textBoxNode.getComponent(Sprite).spriteFrame = this.leftSpeakerSprite;
            this.textBox.getComponent(Widget).left = this.leftTextBoxIndent;
        }
    }

    private setTextBoxToPhoneColor(isPhone: boolean) {
        if (isPhone) {
            this.textBoxNode.getComponent(Sprite).color = this.phoneTextBoxColor;
        } else {
            this.textBoxNode.getComponent(Sprite).color = this.defaultTextBoxColor;
        }
    }

    private moveCharactersOffScreen() {
        let tweenLeftCharOut = tween(this.leftCharacter.node).to(0.25, { position: this.leftOutPosition });
        this._tweens.push(tweenLeftCharOut);
        tweenLeftCharOut.start();
        this.previousLeftAnimation = '';
        this.previousLeftSpeaker = '';
        let tweenRightCharOut = tween(this.rightCharacter.node).to(0.25, { position: this.rightOutPosition });
        this._tweens.push(tweenRightCharOut);
        tweenRightCharOut.start();
        this.previousRightAnimation = '';
        this.previousRightSpeaker = '';
    }

    private async _onPhoneAnswered() {
        this._phoneHUDInstance.callAppScreen.node.off(PhoneHUD.OnPhoneCallAnsweredEvent, this._onPhoneAnswered, this);
        this._typingStarted = true;
        this.textBoxNode.active = true;

        await this.nextAction();
    }

    private getSpriteName(speaker: string, expression: string): string {
        return `${speaker}-${expression}`;
    }

    private getSprite(spriteToLoad: string): SpriteFrame {
        if (this.loadedSprites.has(spriteToLoad)) {
            return this.loadedSprites.get(spriteToLoad);
        }

        this._log.warn(`Warning: Sprite ${spriteToLoad} has not been loaded, using fallback`);

        if (this._dialogueFormat.toLowerCase() === 'phone') {
            return this.fallbackPhoneSprite;
        }

        return this.fallbackSprite;
    }
}
