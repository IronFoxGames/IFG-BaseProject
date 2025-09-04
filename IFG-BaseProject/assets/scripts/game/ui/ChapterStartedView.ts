import { resources } from 'cc';
import { _decorator, Component, Node, Animation, Sprite, SpriteFrame, Label, director } from 'cc';
import { logger } from '../../logging';
const { ccclass, property } = _decorator;

@ccclass('ChapterStartedView')
export class ChapterStartedView extends Component {
    @property(Sprite)
    public Background: Sprite | null = null;

    @property(Sprite)
    public Character: Sprite | null = null;

    @property(Sprite)
    public CharacterShadow: Sprite | null = null;

    @property(Label)
    public ChapterTitle: Label | null = null;

    @property(Label)
    public ChapterSubTitle: Label | null = null;

    @property(Animation)
    public AnimationComponent: Animation | null = null;

    private _defaultBackgroundSpritePath: string = 'backgrounds/bg-inside-diner/spriteFrame';

    private _log = logger.child('ChapterStartedView');

    init(characterSprite: SpriteFrame, chapterTitle: string, chapterSubTitle: string, backgroundSpritePath?: string, onComplete?: () => void) {
        if (this.ChapterTitle) {
            this.ChapterTitle.string = chapterTitle;
        }
        if (this.ChapterSubTitle) {
            this.ChapterSubTitle.string = chapterSubTitle;
        }
        if (this.Character) {
            this.Character.spriteFrame = characterSprite;
        }
        if (this.CharacterShadow) {
            this.CharacterShadow.spriteFrame = characterSprite;
        }

        if (this.AnimationComponent) {
            this.AnimationComponent.play('fullscreen-chapter-start-idle');
        }

        // Load the background sprite, if none can be loaded or the path is empty the dafult sprite will be used
        if (backgroundSpritePath == null || backgroundSpritePath == '' || backgroundSpritePath == undefined) {
            this.loadSprite(this._defaultBackgroundSpritePath, (spriteFrame) => {
                if (this.Background) {
                    this.Background.spriteFrame = spriteFrame;
                }
                if (onComplete) {
                    onComplete();
                }
            });
        } else {
            this.loadSprite(backgroundSpritePath, (spriteFrame) => {
                if (this.Background) {
                    this.Background.spriteFrame = spriteFrame;
                }
                if (onComplete) {
                    onComplete();
                }
            });
        }
    }

    loadSprite(path: string, onComplete?: (spriteFrame: SpriteFrame) => void) {
        resources.load(path, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                this._log.error(`Failed to load sprite: "${path}"`, err);
                if (onComplete) {
                    onComplete(null);
                }
                return;
            }
            if (onComplete) {
                onComplete(spriteFrame);
            }
        });
    }

    public async playAnimation(onComplete?: () => void) {
        if (!this.AnimationComponent) {
            this._log.error('AnimationComponent is not set.');
            if (onComplete) {
                onComplete();
            }
            return;
        }

        this.AnimationComponent.play('fullscreen-chapter-start');

        await new Promise<void>((resolve) => {
            const onAnimationFinished = () => {
                this.AnimationComponent.off(Animation.EventType.FINISHED, onAnimationFinished);
                resolve();
            };

            this.AnimationComponent.on(Animation.EventType.FINISHED, onAnimationFinished);
        });

        if (onComplete) {
            onComplete();
        }
    }

    stopAnimation() {
        if (this.AnimationComponent) {
            this.AnimationComponent.stop();
        }
    }
}
