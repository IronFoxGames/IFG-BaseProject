import { _decorator, Component, Node, SpriteFrame, Button, JsonAsset, Prefab, Label } from 'cc';
import { UIElementAnimator } from '../game/ui/UIElementAnimator';
import { instantiate } from 'cc';
import { RichText } from 'cc';
import { resources } from 'cc';
import { Sprite } from 'cc';
import { ScrollView } from 'cc';
import { ResourceLoader } from '../utils/ResourceLoader';
import { logger } from '../logging';
import { HowToPlayScoreEntry } from './HowToPlayScoreEntry';
import { HandName, HandNameToString, HandNameToSpritePath, HandNameTipString } from '../core/enums/HandName';
import { RankedHandScorer } from '../core/RankedHandScorer';
import { HowToPlayBoosterPowerupEntry } from './HowtoPlayBoosterPowerupEntry';
import { HowToPlayTableOfContentsEntry } from './HowToPlayTableOfContentsEntry';
import { Services } from '../state/Services';
import { CCFloat } from 'cc';
import { director } from 'cc';
import { Director } from 'cc';
import { Vec2 } from 'cc';
import { Requirement } from '../core/model/requirements/Requirement';
import { RequirementFactory } from '../core/model/requirements/RequirementFactory';
const { ccclass, property } = _decorator;

interface IndexItem {
    title: string;
    id: string;
}

enum HandNamesForHowToPlay {
    Singleton = 'Singleton',
    OnePair = 'OnePair',
    TwoPair = 'TwoPair',
    ThreeOfAKind = 'ThreeOfAKind',
    Straight = 'Straight',
    Flush = 'Flush',
    FullHouse = 'FullHouse',
    FourOfAKind = 'FourOfAKind',
    StraightFlush = 'StraightFlush',
    FiveOfAKind = 'FiveOfAKind'
}

@ccclass('HowToPlayScreenController')
export class HowToPlayScreenController extends Component {
    private _onCloseCallback?: () => void;

    @property({ visible: true, serializable: true, group: 'View Setup' })
    private _jsonData: string = '';

    @property({ type: UIElementAnimator, group: 'View Setup' })
    public UIElementAnimators: UIElementAnimator[] = [];

    @property({ type: Node, visible: true, group: 'View Setup' })
    private _scrim: Node;

    @property({ type: Label, visible: true, group: 'View Setup' })
    private title: Label;

    @property({ type: ScrollView, visible: true, group: 'View Setup' })
    private _mainContentScrollView: ScrollView = null;

    @property({ type: ScrollView, visible: true, group: 'View Setup' })
    private _tableOfContentScrollView: ScrollView = null;

    @property({ type: Node, visible: true, group: 'View Setup' })
    private _tableOfContentListContent: Node = null;

    @property({ type: Prefab, visible: true, group: 'View Setup' })
    private _tableOfContentItemPrefab: Prefab = null;

    @property({ type: CCFloat, visible: true, group: 'View Setup' })
    private _tabActiveRightOffset: number = 0;

    @property({ type: CCFloat, visible: true, group: 'View Setup' })
    private _tabInactiveRightOffset: number = 0;

    @property({ type: Button, visible: true, group: 'View Setup' })
    private _closeButton: Button = null;

    @property({ type: Node, visible: true, group: 'View Setup' })
    private _contentContainer: Node = null;

    @property({ type: Prefab, visible: true, group: 'Pages Setup' })
    private _headerPrefab: Prefab = null;

    @property({ type: Prefab, visible: true, group: 'Pages Setup' })
    private _paragraphPrefab: Prefab = null;

    @property({ type: Prefab, visible: true, group: 'Pages Setup' })
    private _boosterPowerupPrefab: Prefab = null;

    @property({ type: Prefab, visible: true, group: 'Pages Setup' })
    private _imagePrefab: Prefab = null;

    @property({ type: Prefab, visible: true, group: 'Pages Setup' })
    private _indexPageTitlePrefab: Prefab = null;

    @property({ type: Prefab, visible: true, group: 'Pages Setup' })
    private _handScorePrefab: Prefab = null;

    private _currentPage: string = '';

    private _pageList: string[] = [];

    private _pageIndexList: IndexItem[] = [];

    private _loadedJson: JsonAsset = null;

    private _services: Services = null;

    private _log = logger.child('HowToPlayScreenController');

    private _onCloseHowToPlayCallback: () => void;

    start() {
        this._closeButton.node.on('click', this._onCloseButtonPressedCallback, this);
    }

    public async show(isInGameplay: boolean, services: Services, onCloseCallback: () => void) {
        if (this.node) {
            this.node.active = false;
        } else {
            this._log.error('Node is not defined!');
        }

        if (isInGameplay) {
            //TODO: Handle gameplay specific logic like pausing or anything else here
        }

        this._services = services;
        this._onCloseHowToPlayCallback = onCloseCallback;
        this._scrim.active = true;

        // Wait for JSON data to load before setting up the index view
        if (!this._loadedJson) {
            await this._loadJsonData();
        }

        this.node.active = true;
        this._playInAnimation();
    }

    public showDeeplinkedPage(isInGameplay: boolean, services: Services, onCloseCallback: () => void, pageID: string) {
        this.show(isInGameplay, services, onCloseCallback);
        this._currentPage = pageID;
        this._setupPageView(pageID);
        this._setActiveTab(this._pageList.indexOf(pageID));
        this._mainContentScrollView.scrollToTop();
    }

    private async _loadJsonData() {
        if (!this._jsonData) {
            this._log.error('How To Play Json is undefined');
            return;
        }

        try {
            this._loadedJson = await ResourceLoader.load(this._jsonData, JsonAsset);
        } catch (error) {
            this._log.error(`Error loading how to play data: ${this._jsonData} with err: `, error);
            return;
        }

        const howToPlayJson = this._loadedJson.json;

        if (!howToPlayJson.pages || !Array.isArray(howToPlayJson.pages)) {
            this._log.error('How To Play Json pages are undefined or not an array');
            return;
        }

        // Iterate through each page in json and add each page to the pageIndexList
        howToPlayJson.pages.forEach((page: any, index: number) => {
            let reqs: Requirement[] = [];
            if (Array.isArray(page.requirements)) {
                reqs = page.requirements.map((o: any) => RequirementFactory.fromObject(o));
            }

            let requirementsMet = this._services.requirementsService.checkRequirementsMet(reqs);

            if (!requirementsMet) {
                this._log.info(`Page ${index} requirements not met, skipping:`, page);
                return;
            }

            if (!page.pageid || !page.pagetitle) {
                this._log.error(`Page ${index} does not have a valid pageid or pagetitle:`, page);
                return;
            }

            this._pageIndexList.push({
                title: page.pagetitle,
                id: page.pageid
            });
            this._pageList.push(page.pageid);
        });
        this._setupTableOfContents();
    }

    private async _setupTableOfContents() {
        this._tableOfContentListContent.destroyAllChildren();

        this._pageIndexList.forEach((item, idx) => {
            let indexItem = null;

            if (!this._tableOfContentItemPrefab) {
                this._log.error('Table of Content Item Prefab is not assigned!');
            }

            indexItem = instantiate(this._tableOfContentItemPrefab);
            if (!indexItem) {
                this._log.error(`Failed to instantiate prefab for item at index ${idx}`);
            }

            if (!indexItem.getComponent(HowToPlayTableOfContentsEntry)) {
                this._log.error(`HowToPlayTableOfContentsEntry component missing on prefab for item: ${item.title}`);
            }

            let entry = indexItem.getComponent(HowToPlayTableOfContentsEntry);

            let button = indexItem.getComponent(Button);
            if (!button) {
                this._log.error(`Button component missing on prefab for item: ${item.title}`);
            }
            button.node.on('click', () => {
                this._setupPageView(item.id);
            });

            entry.init(item.title);

            entry.setActive(false, this._tabInactiveRightOffset);

            indexItem.parent = this._tableOfContentListContent;
        });
        this._currentPage = this._pageList[0];
        this._setupPageView(this._currentPage);

        await new Promise((resolve) => {
            director.once(Director.EVENT_AFTER_UPDATE, resolve);
        });

        this._tableOfContentScrollView.scrollToTop();
        this._setActiveTab(0);
    }

    private async _setupPageView(pageID: string) {
        // Clear the content container before setting up the new page
        this._contentContainer.destroyAllChildren();

        const howToPlayJson = this._loadedJson.json;

        // For the page with the correct page id, iterate over the content array and instantiate the appropriate prefabs
        const page = howToPlayJson.pages.find((p: any) => p.pageid === pageID);
        if (!page || !page.content || !Array.isArray(page.content)) {
            this._log.error(`Page ${pageID} has no valid content array:`, page?.content);
            return;
        }

        // Kill scrolling while we repopulate offers to avoid messing with the layout resizing
        const brake = this._tableOfContentScrollView.brake;
        const bounceDuration = this._tableOfContentScrollView.bounceDuration;
        this._tableOfContentScrollView.inertia = false;
        this._tableOfContentScrollView.elastic = false;
        this._tableOfContentScrollView.stopAutoScroll();

        page.content.forEach((item: any) => {
            switch (item.type) {
                case 'handscores': {
                    for (const handName in HandNamesForHowToPlay) {
                        const handScore = instantiate(this._handScorePrefab);
                        const howToPlayScoreEntry = handScore.getComponent(HowToPlayScoreEntry);

                        // Load the sprite frame for the hand name
                        const spritePath = HandNameToSpritePath(handName as HandName);
                        let sprite = null;
                        resources.load(spritePath, SpriteFrame, (err, spriteFrame) => {
                            if (err) {
                                this._log.error(`Failed to load sprite frame at path: ${spritePath}`, { err });
                                return;
                            }
                            sprite = spriteFrame;
                            howToPlayScoreEntry.setSpriteFrame(sprite);
                        });

                        if (howToPlayScoreEntry) {
                            howToPlayScoreEntry.init(
                                HandNameToString(handName as HandName),
                                HandNameTipString(handName as HandName),
                                RankedHandScorer.HandBaseValues.get(handName as HandName) || 0
                            );
                        }

                        handScore.parent = this._contentContainer;
                    }
                    break;
                }
                case 'paragraph': {
                    let paragraph = instantiate(this._paragraphPrefab);
                    paragraph.parent = this._contentContainer;
                    paragraph.getComponent(Label).string = item.text;
                    break;
                }
                case 'header': {
                    let header = instantiate(this._headerPrefab);
                    header.parent = this._contentContainer;
                    header.getComponent(Label).string = item.text;
                    break;
                }
                case 'boosterpowerup': {
                    let boosterPowerup = instantiate(this._boosterPowerupPrefab);
                    let entryController = boosterPowerup.getComponent(HowToPlayBoosterPowerupEntry);
                    entryController.init(item.name, item.description);
                    resources.load(item.spritepath, SpriteFrame, (err, spriteFrame) => {
                        if (err) {
                            this._log.error(`Failed to load image at path: ${item.src}`, err);
                            return;
                        }
                        entryController.setSpriteFrame(spriteFrame);
                        boosterPowerup.parent = this._contentContainer;
                    });
                    break;
                }
                case 'image': {
                    let image = instantiate(this._imagePrefab);
                    let spriteImage = image.getComponent(Sprite);
                    image.parent = this._contentContainer;

                    resources.load(item.src, SpriteFrame, (err, spriteFrame) => {
                        if (err) {
                            this._log.error(`Failed to load image at path: ${item.src}`, err);
                            return;
                        }
                        spriteImage.spriteFrame = spriteFrame;
                    });
                    break;
                }
                default:
                    this._log.warn(`Unsupported content type: ${item.type}`);
                    break;
            }
        });

        //Wait one frame to allow the layout to resolve before scrolling
        await new Promise((resolve) => {
            director.once(Director.EVENT_AFTER_UPDATE, resolve);
        });

        // Find this pageid in the pageListMap and set the currentPage to the index
        this._currentPage = pageID;
        this._setActiveTab(this._pageList.indexOf(this._currentPage));
        this._mainContentScrollView.scrollToTop();

        // Re-enable scrolling inertia after layout resolves
        this._tableOfContentScrollView.scheduleOnce(() => {
            this._tableOfContentScrollView.scrollToPercentHorizontal(0, 0, false);
            this._tableOfContentScrollView.brake = brake;
            this._tableOfContentScrollView.bounceDuration = bounceDuration;
            this._tableOfContentScrollView.inertia = true;
            this._tableOfContentScrollView.elastic = true;
        }, 0.1);
    }

    private _setActiveTab(index: number) {
        this._pageIndexList.forEach((item, idx) => {
            let entry = this._tableOfContentListContent.children[idx].getComponent(HowToPlayTableOfContentsEntry);
            if (idx === index) {
                entry.setActive(true, this._tabActiveRightOffset);
            } else {
                entry.setActive(false, this._tabInactiveRightOffset);
            }
        });
    }

    private _goToNextPage() {
        const currentIndex = this._pageList.indexOf(this._currentPage);
        const nextPageIndex = currentIndex + 1;

        //nextpageindex is larger than the pageList length, return the first item in the array instead
        if (nextPageIndex >= this._pageList.length) {
            this._setupPageView(this._pageList[0]);
        } else {
            this._setupPageView(this._pageList[nextPageIndex]);
        }
    }

    private _goToPrevPage() {
        const currentIndex = this._pageList.indexOf(this._currentPage);
        const prevPageIndex = currentIndex - 1;

        //prevpageindex is less than 0, return the last item in the array instead
        if (prevPageIndex < 0) {
            this._setupPageView(this._pageList[this._pageList.length - 1]);
        } else {
            this._setupPageView(this._pageList[prevPageIndex]);
        }
    }

    private _onCloseButtonPressedCallback() {
        this._playOutAnimation();
        this._onCloseHowToPlayCallback?.call(this);
    }

    private _playInAnimation() {
        this.UIElementAnimators.forEach((animator) => {
            animator.PlayInAnimation();
        });
    }

    private _playOutAnimation() {
        this._scrim.active = false;
        this.UIElementAnimators.forEach((animator) => {
            animator.PlayOutAnimation();
        });
    }

    public hide() {
        if (this.node) {
            this.node.active = false;
        } else {
            this._log.error('Node is not defined!');
        }
    }
}
