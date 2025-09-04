import { Static, Type } from '@sinclair/typebox';
import { Identifier } from './TIdentifier';
import { JsonResourcePath } from './TJsonResourcePath';
import { PrefabResourcePath } from './TPrefabResourcePath';
import { Reference } from './TReference';
import { SpriteResourcePath } from './TSpriteResourcePath';
import { TextureResourcePath } from './TTextureResourcePath';

const HandNameValues = {
    Invalid: 'Invalid',
    Singleton: 'Singleton',
    OnePair: 'OnePair',
    TwoPair: 'TwoPair',
    ThreeOfAKind: 'ThreeOfAKind',
    Straight: 'Straight',
    Flush: 'Flush',
    FullHouse: 'FullHouse',
    FourOfAKind: 'FourOfAKind',
    StraightFlush: 'StraightFlush',
    FiveOfAKind: 'FiveOfAKind',

    // Special hands that are variants of above. HandAnalyzer only returns the above hands.
    Lowball: 'Lowball',
    PaiGow: 'PaiGow',
    Wheel: 'Wheel',
    Broadway: 'Broadway',
    SteelWheel: 'SteelWheel',
    RoyalFlush: 'RoyalFlush',
    QuadDeuces: 'QuadDeuces',
    QuadAces: 'QuadAces',
    QuintAces: 'QuintAces'
} as const;

export const HandName = Type.Enum(HandNameValues);

export type HandName = Static<typeof HandName>;

export const DateRequirement = Type.Intersect(
    [
        Type.Object({
            requirementType: Type.Literal('date'),
            date: Type.Date()
        }),
        Type.Union([
            Type.Object(
                {
                    operator: Type.Union([Type.Literal('before'), Type.Literal('after')])
                },
                {
                    additionalProperties: false
                }
            ),
            Type.Object(
                {
                    operator: Type.Literal('inRange'),
                    endDate: Type.Date()
                },
                {
                    additionalProperties: false
                }
            )
        ])
    ],
    {
        // causes a crash inside TypeBox -- checking unevaluated properties on undefined
        // unevaluatedProperties: false
    }
);

export const ComparisonOperator = Type.Union([
    Type.Literal('equal'),
    Type.Literal('notEqual'),
    Type.Literal('lessThan'),
    Type.Literal('lessThanEqual'),
    Type.Literal('greaterThan'),
    Type.Literal('greaterThanEqual')
]);

export const LevelRequirement = Type.Object(
    {
        requirementType: Type.Literal('level'),
        level: Type.Number(),
        operator: ComparisonOperator
    },
    {
        additionalProperties: false
    }
);

export const LevelIdRequirement = Type.Object(
    {
        requirementType: Type.Literal('levelId'),
        levelId: Reference('Level'),
        operator: Type.Union([Type.Literal('complete'), Type.Literal('incomplete'), Type.Literal('isNext')])
    },
    {
        additionalProperties: false
    }
);

export const InventoryRequirement = Type.Object(
    {
        requirementType: Type.Literal('inventory'),
        itemId: Reference('Item'),
        itemCount: Type.Number(),
        operator: ComparisonOperator
    },
    {
        additionalProperties: false
    }
);

export const PropInNodeRequirement = Type.Object(
    {
        requirementType: Type.Literal('propInNode'),
        propId: Reference('Prop'),
        nodeId: Reference('Node'),
        operator: Type.Union([Type.Literal('equal'), Type.Literal('notEqual'), Type.Literal('contains'), Type.Literal('startsWith')])
    },
    {
        additionalProperties: false
    }
);

export const PropHasTagInNodeRequirement = Type.Object(
    {
        requirementType: Type.Literal('propHasTagInNode'),
        tag: Reference('PropTag'),
        nodeId: Reference('Node')
    },
    {
        additionalProperties: false
    }
);

export const DialogueRequirement = Type.Object(
    {
        requirementType: Type.Literal('dialogue'),
        dialogueId: Reference('Dialogue'),
        operator: Type.Union([Type.Literal('hasSeen'), Type.Literal('hasNotSeen')])
    },
    {
        additionalProperties: false
    }
);

export const ChapterCompleteRequirement = Type.Object(
    {
        requirementType: Type.Literal('chapterComplete'),
        chapterId: Reference('Chapter')
    },
    {
        additionalProperties: false
    }
);

export const TaskCompleteRequirement = Type.Object(
    {
        requirementType: Type.Literal('taskComplete'),
        taskId: Reference('Task')
    },
    {
        additionalProperties: false
    }
);

export const AccountRequirement = Type.Object(
    {
        requirementType: Type.Literal('account'),
        entitlement: Type.Union([Type.Literal('Guest'), Type.Literal('Free'), Type.Literal('Premium')]),
        operator: ComparisonOperator
    },
    {
        additionalProperties: false
    }
);

export const TutorialRequirement = Type.Object(
    {
        requirementType: Type.Literal('tutorial'),
        tutorialId: Reference('Tutorial'),
        operator: Type.Union([Type.Literal('hasSeen'), Type.Literal('hasNotSeen')])
    },
    {
        additionalProperties: false
    }
);

export const QuickPlaySessionsRequirement = Type.Object(
    {
        requirementType: Type.Literal('quickPlaySessions'),
        playCount: Type.Number(),
        operator: ComparisonOperator
    },
    {
        additionalProperties: false
    }
);

export const Requirement = Type.Union(
    [
        DateRequirement,
        LevelRequirement,
        LevelIdRequirement,
        InventoryRequirement,
        PropInNodeRequirement,
        PropHasTagInNodeRequirement,
        DialogueRequirement,
        ChapterCompleteRequirement,
        TaskCompleteRequirement,
        AccountRequirement,
        TutorialRequirement,
        QuickPlaySessionsRequirement
    ],
    {
        additionalProperties: false
    }
);

export const RequirementContainer = Type.Union([
    Type.Object(
        {
            requirementData: Requirement
        },
        {
            additionalProperties: false
        }
    ),
    Requirement
]);

export const TutorialTrigger = Type.Union([
    Type.Object(
        {
            type: Type.Literal('onStateEnter'),
            state: Type.String() // TODO: refine?
        },
        {
            additionalProperties: false
        }
    ),
    Type.Object(
        {
            type: Type.Literal('onMenuOpened'),
            menuId: Type.String() // TODO: refine?
        },
        {
            additionalProperties: false
        }
    ),
    Type.Object(
        {
            type: Type.Literal('onGameStart'),
            puzzle: Reference('Level')
        },
        {
            additionalProperties: false
        }
    ),
    Type.Object(
        {
            type: Type.Literal('onHandPlaced'),
            puzzle: Reference('Level'),
            // TODO: these should be mutually exclusive
            hand: Type.Optional(Type.Number()),
            handName: Type.Optional(HandName)
        },
        {
            additionalProperties: false
        }
    ),
    Type.Object(
        {
            type: Type.Literal('onCardPlaced'),
            puzzle: Reference('Level')
        },
        {
            additionalProperties: false
        }
    ),
    Type.Object(
        {
            type: Type.Literal('onHandScoreTallied'),
            puzzle: Reference('Level'),
            // TODO: these should be mutually exclusive
            hand: Type.Optional(Type.Number()),
            handName: Type.Optional(HandName)
        },
        {
            additionalProperties: false
        }
    ),
    Type.Object(
        {
            type: Type.Literal('onHandSubmitted'),
            puzzle: Reference('Level'),
            // TODO: these should be mutually exclusive
            hand: Type.Optional(Type.Number()),
            handName: Type.Optional(HandName)
        },
        {
            additionalProperties: false
        }
    ),
    Type.Object(
        {
            type: Type.Literal('onDialogue'),
            dialogueId: Reference('Dialogue')
        },
        {
            additionalProperties: false
        }
    )
]);

export const TutorialStep = Type.Union([Type.Literal('overlay'), Type.Literal('dragInstructor')]);

// TODO: many of these fields are mutually exclusive or have some relationship based on their values
// ideally we encode those relationships in the definition
export const TutorialMessage = Type.Object(
    {
        trigger: TutorialTrigger,
        stepType: Type.Optional(TutorialStep),
        requirements: Type.Optional(Type.Array(RequirementContainer)),
        id: Identifier('Tutorial'),
        title: Type.Optional(Type.String()),
        message: Type.Optional(Type.String()),
        image: Type.Optional(SpriteResourcePath()),
        characterTutorial: Type.Optional(Type.Literal(true)),
        characterSpritePath: Type.Optional(SpriteResourcePath()),
        lightboxShape: Type.Optional(
            Type.Union([Type.Literal('full'), Type.Literal('curved-rectangle'), Type.Literal('rectangle'), Type.Literal('ellipse')])
        ),
        lightboxDelay: Type.Optional(Type.Number()),
        cursorAlignment: Type.Optional(
            Type.Union([Type.Literal('none'), Type.Literal('left'), Type.Literal('right'), Type.Literal('top'), Type.Literal('bottom')])
        ),
        lightboxTarget: Type.Optional(Type.String()),
        stepAdvance: Type.Optional(Type.Union([Type.Literal('ok'), Type.Literal('control-interaction')])),
        hasFollowup: Type.Optional(Type.Boolean()),
        triggerSave: Type.Optional(Type.Boolean()),
        messageOffsetX: Type.Optional(Type.Number()),
        messageOffsetY: Type.Optional(Type.Number()),
        dragInstructorCardSlotStart: Type.Optional(Type.Number()),
        dragInstructorBoardTileIndexTarget: Type.Optional(Type.Number())
    },
    {
        additionalProperties: false
    }
);

export const TutorialData = Type.Object(
    {
        events: Type.Array(TutorialMessage)
    },
    {
        additionalProperties: false
    }
);

export const NodeData = Type.Intersect(
    [
        Type.Union([
            Type.Object({
                isStatic: Type.Literal(true),
                defaultPropId: Reference('Prop')
            }),
            Type.Object({
                isStatic: Type.Literal(false),
                defaultPropId: Type.Literal('')
            })
        ]),
        Type.Object({
            id: Identifier('Node'),
            tags: Type.Array(Reference('PropTag')),
            requirements: Type.Array(RequirementContainer)
        })
    ],
    {
        unevaluatedProperties: false
    }
);

export const ItemType = Type.Union([Type.Literal('currency'), Type.Literal('booster'), Type.Literal('powerup'), Type.Literal('task')]);
export type ItemType = Static<typeof ItemType>;

export const ItemInfo = Type.Intersect(
    [
        Type.Union([
            Type.Object({
                type: Type.Literal('currency'),
                id: Identifier('Currency')
            }),
            Type.Object({
                type: Type.Literal('booster'),
                id: Identifier('Booster')
            }),
            Type.Object({
                type: Type.Literal('powerup'),
                id: Identifier('Powerup')
            }),
            Type.Object({
                type: Type.Literal('task'),
                id: Identifier('Task')
            })
        ]),
        Type.Object({
            name: Type.String(),
            externalId: Type.Optional(Type.String()),
            sprite: SpriteResourcePath(),
            requirements: Type.Optional(Type.Array(RequirementContainer)),
            tooltip: Type.Optional(Type.String()),
            isCurrency: Type.Optional(Type.Boolean())
        })
    ],
    {
        unevaluatedProperties: false
    }
);

export type ItemInfo = Static<typeof ItemInfo>;

export const ItemConfig = Type.Object({
    items: Type.Optional(Type.Array(ItemInfo))
});

export const GameOverScreenData = Type.Object(
    {
        winCharacters: Type.Array(SpriteResourcePath()),
        lossCharacters: Type.Array(SpriteResourcePath()),
        prologueCharacter: SpriteResourcePath(),
        prologueEndCharacter: SpriteResourcePath(),
        prologueEndRequirements: Type.Array(RequirementContainer),
        prologueCompleteRequirements: Type.Array(RequirementContainer)
    },
    {
        $id: 'GameOverScreenData',
        additionalProperties: false
    }
);

export const SideOfScreen = Type.Enum({
    Left: 0,
    Right: 1,
    Both: 2
});

export const DialogueLine = Type.Object(
    {
        line: Type.RegExp(/.+/), // non-empty string
        characterSprites: Type.Array(Type.String()),
        unskippable: Type.Optional(Type.Boolean())
    },
    {
        additionalProperties: false
    }
);

export const DialogueSection = Type.Object(
    {
        characterSide: SideOfScreen,
        characterNames: Type.Array(Type.String()),
        lines: Type.Array(DialogueLine),
        dialogueType: Type.Union([
            Type.Literal('Speaking'),
            Type.Literal('Exposition'),
            Type.Literal('Scrim'),
            Type.Literal('Sprite'),
            Type.Literal('Fade'),
            Type.Literal('Sfx'),
            Type.Literal('Letter'),
            Type.Literal('Music'),
            Type.Literal('Camerafocus'),
            Type.Literal('Camerashake'),
            Type.Literal('Chapterstart')
        ])
    },
    {
        additionalProperties: false
    }
);

export const DialogueSet = Type.Object(
    {
        dialogueId: Identifier('Dialogue'),
        sourceFile: Type.String(),
        dialogueSections: Type.Array(DialogueSection),
        repeatable: Type.Boolean(),
        dialogueFormat: Type.Union([
            Type.Literal('Phone'),
            Type.Literal('Default'),
            Type.Literal('') // the code supports this, but ideally we require a valid value and make it optional
        ]),
        requirements: Type.Array(RequirementContainer)
    },
    {
        $id: 'DialogueSet',
        additionalProperties: false
    }
);

export const CompletionSequenceEvent = Type.Object(
    {
        eventData: Type.Union([
            Type.Object(
                {
                    eventType: Type.Literal('dialogue'),
                    dialogueId: Reference('Dialogue')
                },
                {
                    additionalProperties: false
                }
            ),
            Type.Object(
                {
                    eventType: Type.Literal('none')
                },
                {
                    additionalProperties: false
                }
            ),
            Type.Object(
                {
                    eventType: Type.Literal('interactableItems'),
                    itemId: Reference('Task'),
                    roomId: Type.String(), // TODO: Reference?
                    spawnIds: Type.Array(Type.String(), { minItems: 1 }), // TODO: Reference?
                    iconId: Reference('Item') // TODO: specific item type?
                },
                {
                    additionalProperties: false
                }
            ),
            Type.Object(
                {
                    eventType: Type.Literal('placeProp'),
                    roomId: Type.String(), // TODO: Reference?
                    nodeId: Reference('Node'),
                    propTags: Type.Array(Reference('PropTag'), { minItems: 1 })
                },
                {
                    additionalProperties: false
                }
            ),
            Type.Object(
                {
                    eventType: Type.Literal('focusOnItem'),
                    itemId: Reference('Task'),
                    roomId: Type.String(), // TODO: Reference?
                    spawnId: Type.String() // TODO: Reference?
                },
                {
                    additionalProperties: false
                }
            ),
            Type.Object(
                {
                    eventType: Type.Literal('forceSwapProps'),
                    locationAndPropIds: Type.Array(
                        Type.Object(
                            {
                                roomId: Type.String(), // TODO: Reference?
                                nodeId: Reference('Node'),
                                propId: Reference('Prop')
                            },
                            {
                                additionalProperties: false
                            }
                        ),
                        {
                            minItems: 1
                        }
                    )
                },
                {
                    additionalProperties: false
                }
            ),
            Type.Object(
                {
                    eventType: Type.Literal('unlockRoom'),
                    roomId: Type.String() // TODO: Reference?
                },
                {
                    additionalProperties: false
                }
            ),
            Type.Object(
                {
                    eventType: Type.Literal('endGamePopup'),
                    title: Type.String(),
                    message: Type.String(),
                    spritePath: SpriteResourcePath()
                },
                {
                    additionalProperties: false
                }
            )
        ])
    },
    {
        $id: 'CompletionSequenceEvent',
        additionalProperties: false
    }
);

export const CompletionSequence = Type.Object(
    {
        events: Type.Array(CompletionSequenceEvent)
    },
    {
        $id: 'CompletionSequence',
        additionalProperties: false
    }
);

export const TaskData = Type.Object(
    {
        id: Identifier('Task'),
        name: Type.String(),
        iconId: Reference('Task'),
        description: Type.String(),
        unlockRequirements: Type.Array(RequirementContainer),
        starCost: Type.Number({ minimum: 0 }),
        completionCount: Type.Number({ minimum: 0 }),
        completionSequences: Type.Array(CompletionSequence),
        chapterStartTask: Type.Optional(Reference('Chapter')),
        chapterEndTask: Type.Optional(Reference('Chapter'))
    },
    {
        $id: 'TaskData',
        additionalProperties: false
    }
);

export const Chapter = Type.Object(
    {
        id: Identifier('Chapter'),
        name: Type.String(),
        tasks: Type.Array(TaskData)
    },
    {
        $id: 'Chapter',
        additionalProperties: false
    }
);

export const RefsObject = Type.Object(
    {
        refs: Type.Array(JsonResourcePath())
    },
    {
        $id: 'RefsObject',
        additionalProperties: false
    }
);

export const PropData = Type.Object(
    {
        id: Identifier('Prop'),
        tags: Type.Optional(Type.Array(Identifier('PropTag'))),
        requirements: Type.Optional(Type.Array(RequirementContainer)),
        visibilityRequirements: Type.Optional(Type.Array(RequirementContainer)),
        assetFilePath: Type.Union([PrefabResourcePath(), TextureResourcePath()]),
        thumbnailFilePath: SpriteResourcePath()
    },
    {
        additionalProperties: false
    }
);

export const CurrencyAndAmount = Type.Object(
    {
        currency: Reference('Currency'),
        amount: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export const ItemAndAmount = Type.Object(
    {
        id: Reference('Item'),
        amount: Type.Number()
    },
    {
        additionalProperties: false
    }
);

const catalogItemFields = {
    id: Identifier('CatalogItem'),
    name: Type.String(),
    description: Type.String(),
    cost: CurrencyAndAmount,
    sprite: SpriteResourcePath(),
    contents: Type.Array(ItemAndAmount),
    tags: Type.Array(Type.String()),
    valueTag: Type.Optional(Type.String()),
    externalIds: Type.Optional(Type.Array(Type.String())),
    stack: Type.Optional(Type.Boolean()),
    priority: Type.Optional(Type.Number()),
    collapsedVisible: Type.Optional(Type.Boolean()),
    isUpsell: Type.Optional(Type.Boolean()),
    maxPurchaseCount: Type.Optional(Type.Number())
};

export const CatalogItem = Type.Object(catalogItemFields, {
    additionalProperties: false
});

const internalCatalogItemFields = {
    ...catalogItemFields,
    sprite: Type.Literal('')
};

export const InternalCatalogItem = Type.Object(internalCatalogItemFields, {
    additionalProperties: false
});

export const UpsellItemConfig = Type.Object(
    {
        itemId: Identifier('UpsellItem'),
        catalogItemIds: Type.Array(Reference('CatalogItem')),
        upsellText: Type.String()
    },
    {
        additionalProperties: false
    }
);

export const StoreConfig = Type.Object(
    {
        items: Type.Optional(Type.Array(CatalogItem)),
        upsells: Type.Optional(Type.Array(UpsellItemConfig)),
        refs: Type.Optional(Type.Array(JsonResourcePath()))
    },
    {
        $id: 'StoreConfig',
        additionalProperties: false
    }
);

export const InternalStoreConfig = Type.Object(
    {
        items: Type.Optional(Type.Array(InternalCatalogItem)),
        upsells: Type.Optional(Type.Array(UpsellItemConfig)),
        refs: Type.Optional(Type.Array(JsonResourcePath()))
    },
    {
        $id: 'StoreConfig',
        additionalProperties: false
    }
);

export const Level = Type.Object(
    {
        id: Identifier('Level'),
        name: Type.String(),
        path: JsonResourcePath(),
        cost: CurrencyAndAmount,
        requirements: Type.Optional(Type.Array(RequirementContainer)),
        note: Type.Optional(Type.String())
    },
    {
        additionalProperties: false
    }
);

export const LevelList = Type.Object(
    {
        note: Type.Optional(Type.String()),
        levels: Type.Array(Level)
    },
    {
        additionalProperties: false
    }
);

export const RewardItem = Type.Object(
    {
        count: Type.Number(),
        itemId: Type.String() // an xsolla sku
    },
    {
        additionalProperties: false
    }
);

export const DailyPrize = Type.Object(
    {
        day: Type.Number(),
        rewardIndex: Type.Number(),
        free: RewardItem,
        club: RewardItem
    },
    {
        additionalProperties: false
    }
);

export const DailyPrizeConfig = Type.Object(
    {
        rewards: Type.Optional(Type.Array(DailyPrize)),
        refs: Type.Optional(Type.Array(JsonResourcePath()))
    },
    {
        additionalProperties: false
    }
);

export const GameAnalyticsConfig = Type.Object(
    {
        enabled: Type.Boolean(),
        key: Type.String(),
        secret: Type.String(),
        verboseLog: Type.Boolean(),
        infoLog: Type.Boolean(),
        sendBusinessEvents: Type.Boolean()
    },
    {
        additionalProperties: false
    }
);
export const CrazyGamesConfig = Type.Object(
    {
        enabled: Type.Boolean(),
        xsolla: Type.Object({
            projectId: Type.String(),
            loginId: Type.String(),
            clientId: Type.Number(),
            redirectURI: Type.String(),
            enableSandbox: Type.Boolean(),
            enableInAppBrowser: Type.Boolean(),
            paymentUISettings: Type.Object(
                {
                    theme: Type.String()
                },
                {
                    additionalProperties: false
                }
            )
        }),
        debug: Type.Optional(
            Type.Object(
                {
                    email: Type.String(),
                    password: Type.String(),
                    projectId: Type.String()
                },
                {
                    additionalProperties: false
                }
            )
        ),
        gameanalytics: GameAnalyticsConfig
    },
    {
        additionalProperties: false
    }
);

export const FeatureConfig = Type.Object(
    {
        unlockString: Type.String(),
        unlockPopupTitle: Type.String(),
        unlockPopupMessage: Type.String(),
        unlockPopupSpritePath: Type.String(),
        requirements: Type.Array(RequirementContainer)
    },
    {
        additionalProperties: false
    }
);

export const HudConfig = Type.Object(
    {
        quickplayFeatureConfig: FeatureConfig,
        storeFeatureConfig: FeatureConfig,
        dailyMysteryPrizeFeatureConfig: FeatureConfig,
        buildModeFeatureConfig: FeatureConfig,
        puzzleDetailsFeatureConfig: FeatureConfig,
        energyRevealFeatureConfig: FeatureConfig
    },
    {
        additionalProperties: false
    }
);

export const HintsConfigType = Type.Object({
    enableDragReminder: Type.Boolean(),
    dragReminderTimeout: Type.Number()
});

export const AppConfig = Type.Partial(
    Type.Object(
        {
            pogoSDK: Type.Object({}, { additionalProperties: true }),
            crazyGamesSDK: CrazyGamesConfig,
            minLoadingScreenTimeMS: Type.Number({ minimum: 0 }),
            loadingScreenTips: Type.Array(Type.String()),
            gameOverScreenData: GameOverScreenData,
            darcyDailyRewardPhrases: Type.Array(Type.String()),
            cheats: Type.Union([Type.Boolean(), Type.Literal('true'), Type.Literal('false')]),
            env: Type.String(),
            buildNumber: Type.Number({ minimum: 0 }),
            timestamp: Type.String(),
            branch: Type.String(),
            commit: Type.String(),
            skipDiner: Type.Boolean(),
            store: StoreConfig,
            items: RefsObject,
            tasks: RefsObject,
            levels: RefsObject,
            quickPlayConfigPath: JsonResourcePath(),
            hudConfig: HudConfig,
            initialRoomUnlocks: Type.Array(Type.String()),
            introDialogue: Type.String(),
            handTierList: Type.Array(Type.Any()),
            puzzleRewards: Type.Any(),
            maximumHandSize: Type.Number(),
            guestLimitLevelId: Reference('Level'),
            guestLimitMessage: Type.String(),
            endOfStoryMessage: Type.String(),
            migrateGuestSaveData: Type.Boolean(),
            burningFoodScoreLossAmount: Type.Number(),
            dailyPrizeConfig: DailyPrizeConfig,
            hintsConfig: HintsConfigType
        },
        {
            $id: 'AppConfig',
            additionalProperties: false
        }
    )
);

// this shouldn't be necessary
// eslint-disable-next-line no-redeclare
export type AppConfig = Static<typeof AppConfig>;
