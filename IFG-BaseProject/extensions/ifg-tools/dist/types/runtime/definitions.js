"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureConfig = exports.CrazyGamesConfig = exports.GameAnalyticsConfig = exports.DailyPrizeConfig = exports.DailyPrize = exports.RewardItem = exports.LevelList = exports.Level = exports.InternalStoreConfig = exports.StoreConfig = exports.UpsellItemConfig = exports.InternalCatalogItem = exports.CatalogItem = exports.ItemAndAmount = exports.CurrencyAndAmount = exports.PropData = exports.RefsObject = exports.Chapter = exports.TaskData = exports.CompletionSequence = exports.CompletionSequenceEvent = exports.DialogueSet = exports.DialogueSection = exports.DialogueLine = exports.SideOfScreen = exports.GameOverScreenData = exports.ItemConfig = exports.ItemInfo = exports.ItemType = exports.NodeData = exports.TutorialData = exports.TutorialMessage = exports.TutorialStep = exports.TutorialTrigger = exports.RequirementContainer = exports.Requirement = exports.QuickPlaySessionsRequirement = exports.TutorialRequirement = exports.AccountRequirement = exports.TaskCompleteRequirement = exports.ChapterCompleteRequirement = exports.DialogueRequirement = exports.PropHasTagInNodeRequirement = exports.PropInNodeRequirement = exports.InventoryRequirement = exports.LevelIdRequirement = exports.LevelRequirement = exports.ComparisonOperator = exports.DateRequirement = exports.HandName = void 0;
exports.AppConfig = exports.FTUEConfig = exports.HudConfig = void 0;
const typebox_1 = require("@sinclair/typebox");
const TIdentifier_1 = require("./TIdentifier");
const TJsonResourcePath_1 = require("./TJsonResourcePath");
const TPrefabResourcePath_1 = require("./TPrefabResourcePath");
const TReference_1 = require("./TReference");
const TSpriteResourcePath_1 = require("./TSpriteResourcePath");
const TTextureResourcePath_1 = require("./TTextureResourcePath");
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
};
exports.HandName = typebox_1.Type.Enum(HandNameValues);
exports.DateRequirement = typebox_1.Type.Intersect([
    typebox_1.Type.Object({
        requirementType: typebox_1.Type.Literal('date'),
        date: typebox_1.Type.Date()
    }),
    typebox_1.Type.Union([
        typebox_1.Type.Object({
            operator: typebox_1.Type.Union([typebox_1.Type.Literal('before'), typebox_1.Type.Literal('after')])
        }, {
            additionalProperties: false
        }),
        typebox_1.Type.Object({
            operator: typebox_1.Type.Literal('inRange'),
            endDate: typebox_1.Type.Date()
        }, {
            additionalProperties: false
        })
    ])
], {
// causes a crash inside TypeBox -- checking unevaluated properties on undefined
// unevaluatedProperties: false
});
exports.ComparisonOperator = typebox_1.Type.Union([
    typebox_1.Type.Literal('equal'),
    typebox_1.Type.Literal('notEqual'),
    typebox_1.Type.Literal('lessThan'),
    typebox_1.Type.Literal('lessThanEqual'),
    typebox_1.Type.Literal('greaterThan'),
    typebox_1.Type.Literal('greaterThanEqual')
]);
exports.LevelRequirement = typebox_1.Type.Object({
    requirementType: typebox_1.Type.Literal('level'),
    level: typebox_1.Type.Number(),
    operator: exports.ComparisonOperator
}, {
    additionalProperties: false
});
exports.LevelIdRequirement = typebox_1.Type.Object({
    requirementType: typebox_1.Type.Literal('levelId'),
    levelId: (0, TReference_1.Reference)('Level'),
    operator: typebox_1.Type.Union([typebox_1.Type.Literal('complete'), typebox_1.Type.Literal('incomplete'), typebox_1.Type.Literal('isNext')])
}, {
    additionalProperties: false
});
exports.InventoryRequirement = typebox_1.Type.Object({
    requirementType: typebox_1.Type.Literal('inventory'),
    itemId: (0, TReference_1.Reference)('Item'),
    itemCount: typebox_1.Type.Number(),
    operator: exports.ComparisonOperator
}, {
    additionalProperties: false
});
exports.PropInNodeRequirement = typebox_1.Type.Object({
    requirementType: typebox_1.Type.Literal('propInNode'),
    propId: (0, TReference_1.Reference)('Prop'),
    nodeId: (0, TReference_1.Reference)('Node'),
    operator: typebox_1.Type.Union([typebox_1.Type.Literal('equal'), typebox_1.Type.Literal('notEqual'), typebox_1.Type.Literal('contains'), typebox_1.Type.Literal('startsWith')])
}, {
    additionalProperties: false
});
exports.PropHasTagInNodeRequirement = typebox_1.Type.Object({
    requirementType: typebox_1.Type.Literal('propHasTagInNode'),
    tag: (0, TReference_1.Reference)('PropTag'),
    nodeId: (0, TReference_1.Reference)('Node')
}, {
    additionalProperties: false
});
exports.DialogueRequirement = typebox_1.Type.Object({
    requirementType: typebox_1.Type.Literal('dialogue'),
    dialogueId: (0, TReference_1.Reference)('Dialogue'),
    operator: typebox_1.Type.Union([typebox_1.Type.Literal('hasSeen'), typebox_1.Type.Literal('hasNotSeen')])
}, {
    additionalProperties: false
});
exports.ChapterCompleteRequirement = typebox_1.Type.Object({
    requirementType: typebox_1.Type.Literal('chapterComplete'),
    chapterId: (0, TReference_1.Reference)('Chapter')
}, {
    additionalProperties: false
});
exports.TaskCompleteRequirement = typebox_1.Type.Object({
    requirementType: typebox_1.Type.Literal('taskComplete'),
    taskId: (0, TReference_1.Reference)('Task')
}, {
    additionalProperties: false
});
exports.AccountRequirement = typebox_1.Type.Object({
    requirementType: typebox_1.Type.Literal('account'),
    entitlement: typebox_1.Type.Union([typebox_1.Type.Literal('Guest'), typebox_1.Type.Literal('Free'), typebox_1.Type.Literal('Premium')]),
    operator: exports.ComparisonOperator
}, {
    additionalProperties: false
});
exports.TutorialRequirement = typebox_1.Type.Object({
    requirementType: typebox_1.Type.Literal('tutorial'),
    tutorialId: (0, TReference_1.Reference)('Tutorial'),
    operator: typebox_1.Type.Union([typebox_1.Type.Literal('hasSeen'), typebox_1.Type.Literal('hasNotSeen')])
}, {
    additionalProperties: false
});
exports.QuickPlaySessionsRequirement = typebox_1.Type.Object({
    requirementType: typebox_1.Type.Literal('quickPlaySessions'),
    playCount: typebox_1.Type.Number(),
    operator: exports.ComparisonOperator
}, {
    additionalProperties: false
});
exports.Requirement = typebox_1.Type.Union([
    exports.DateRequirement,
    exports.LevelRequirement,
    exports.LevelIdRequirement,
    exports.InventoryRequirement,
    exports.PropInNodeRequirement,
    exports.PropHasTagInNodeRequirement,
    exports.DialogueRequirement,
    exports.ChapterCompleteRequirement,
    exports.TaskCompleteRequirement,
    exports.AccountRequirement,
    exports.TutorialRequirement,
    exports.QuickPlaySessionsRequirement
], {
    additionalProperties: false
});
exports.RequirementContainer = typebox_1.Type.Union([
    typebox_1.Type.Object({
        requirementData: exports.Requirement
    }, {
        additionalProperties: false
    }),
    exports.Requirement
]);
exports.TutorialTrigger = typebox_1.Type.Union([
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal('onStateEnter'),
        state: typebox_1.Type.String() // TODO: refine?
    }, {
        additionalProperties: false
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal('onMenuOpened'),
        menuId: typebox_1.Type.String() // TODO: refine?
    }, {
        additionalProperties: false
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal('onGameStart'),
        puzzle: (0, TReference_1.Reference)('Level')
    }, {
        additionalProperties: false
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal('onHandPlaced'),
        puzzle: (0, TReference_1.Reference)('Level'),
        // TODO: these should be mutually exclusive
        hand: typebox_1.Type.Optional(typebox_1.Type.Number()),
        handName: typebox_1.Type.Optional(exports.HandName)
    }, {
        additionalProperties: false
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal('onCardPlaced'),
        puzzle: (0, TReference_1.Reference)('Level')
    }, {
        additionalProperties: false
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal('onHandScoreTallied'),
        puzzle: (0, TReference_1.Reference)('Level'),
        // TODO: these should be mutually exclusive
        hand: typebox_1.Type.Optional(typebox_1.Type.Number()),
        handName: typebox_1.Type.Optional(exports.HandName)
    }, {
        additionalProperties: false
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal('onHandSubmitted'),
        puzzle: (0, TReference_1.Reference)('Level'),
        // TODO: these should be mutually exclusive
        hand: typebox_1.Type.Optional(typebox_1.Type.Number()),
        handName: typebox_1.Type.Optional(exports.HandName)
    }, {
        additionalProperties: false
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal('onDialogue'),
        dialogueId: (0, TReference_1.Reference)('Dialogue')
    }, {
        additionalProperties: false
    })
]);
exports.TutorialStep = typebox_1.Type.Union([typebox_1.Type.Literal('overlay'), typebox_1.Type.Literal('dragInstructor')]);
// TODO: many of these fields are mutually exclusive or have some relationship based on their values
// ideally we encode those relationships in the definition
exports.TutorialMessage = typebox_1.Type.Object({
    trigger: exports.TutorialTrigger,
    stepType: typebox_1.Type.Optional(exports.TutorialStep),
    requirements: typebox_1.Type.Optional(typebox_1.Type.Array(exports.RequirementContainer)),
    id: (0, TIdentifier_1.Identifier)('Tutorial'),
    title: typebox_1.Type.Optional(typebox_1.Type.String()),
    message: typebox_1.Type.Optional(typebox_1.Type.String()),
    image: typebox_1.Type.Optional((0, TSpriteResourcePath_1.SpriteResourcePath)()),
    characterTutorial: typebox_1.Type.Optional(typebox_1.Type.Literal(true)),
    characterSpritePath: typebox_1.Type.Optional((0, TSpriteResourcePath_1.SpriteResourcePath)()),
    lightboxShape: typebox_1.Type.Optional(typebox_1.Type.Union([typebox_1.Type.Literal('full'), typebox_1.Type.Literal('curved-rectangle'), typebox_1.Type.Literal('rectangle'), typebox_1.Type.Literal('ellipse')])),
    lightboxDelay: typebox_1.Type.Optional(typebox_1.Type.Number()),
    cursorAlignment: typebox_1.Type.Optional(typebox_1.Type.Union([typebox_1.Type.Literal('none'), typebox_1.Type.Literal('left'), typebox_1.Type.Literal('right'), typebox_1.Type.Literal('top'), typebox_1.Type.Literal('bottom')])),
    lightboxTarget: typebox_1.Type.Optional(typebox_1.Type.String()),
    stepAdvance: typebox_1.Type.Optional(typebox_1.Type.Union([typebox_1.Type.Literal('ok'), typebox_1.Type.Literal('control-interaction')])),
    hasFollowup: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    triggerSave: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    messageOffsetX: typebox_1.Type.Optional(typebox_1.Type.Number()),
    messageOffsetY: typebox_1.Type.Optional(typebox_1.Type.Number()),
    dragInstructorCardSlotStart: typebox_1.Type.Optional(typebox_1.Type.Number()),
    dragInstructorBoardTileIndexTarget: typebox_1.Type.Optional(typebox_1.Type.Number())
}, {
    additionalProperties: false
});
exports.TutorialData = typebox_1.Type.Object({
    events: typebox_1.Type.Array(exports.TutorialMessage)
}, {
    additionalProperties: false
});
exports.NodeData = typebox_1.Type.Intersect([
    typebox_1.Type.Union([
        typebox_1.Type.Object({
            isStatic: typebox_1.Type.Literal(true),
            defaultPropId: (0, TReference_1.Reference)('Prop')
        }),
        typebox_1.Type.Object({
            isStatic: typebox_1.Type.Literal(false),
            defaultPropId: typebox_1.Type.Literal('')
        })
    ]),
    typebox_1.Type.Object({
        id: (0, TIdentifier_1.Identifier)('Node'),
        tags: typebox_1.Type.Array((0, TReference_1.Reference)('PropTag')),
        requirements: typebox_1.Type.Array(exports.RequirementContainer)
    })
], {
    unevaluatedProperties: false
});
exports.ItemType = typebox_1.Type.Union([typebox_1.Type.Literal('currency'), typebox_1.Type.Literal('booster'), typebox_1.Type.Literal('powerup'), typebox_1.Type.Literal('task')]);
exports.ItemInfo = typebox_1.Type.Intersect([
    typebox_1.Type.Union([
        typebox_1.Type.Object({
            type: typebox_1.Type.Literal('currency'),
            id: (0, TIdentifier_1.Identifier)('Currency')
        }),
        typebox_1.Type.Object({
            type: typebox_1.Type.Literal('booster'),
            id: (0, TIdentifier_1.Identifier)('Booster')
        }),
        typebox_1.Type.Object({
            type: typebox_1.Type.Literal('powerup'),
            id: (0, TIdentifier_1.Identifier)('Powerup')
        }),
        typebox_1.Type.Object({
            type: typebox_1.Type.Literal('task'),
            id: (0, TIdentifier_1.Identifier)('Task')
        })
    ]),
    typebox_1.Type.Object({
        name: typebox_1.Type.String(),
        externalId: typebox_1.Type.Optional(typebox_1.Type.String()),
        sprite: (0, TSpriteResourcePath_1.SpriteResourcePath)(),
        requirements: typebox_1.Type.Optional(typebox_1.Type.Array(exports.RequirementContainer)),
        tooltip: typebox_1.Type.Optional(typebox_1.Type.String()),
        isCurrency: typebox_1.Type.Optional(typebox_1.Type.Boolean())
    })
], {
    unevaluatedProperties: false
});
exports.ItemConfig = typebox_1.Type.Object({
    items: typebox_1.Type.Optional(typebox_1.Type.Array(exports.ItemInfo))
});
exports.GameOverScreenData = typebox_1.Type.Object({
    winCharacters: typebox_1.Type.Array((0, TSpriteResourcePath_1.SpriteResourcePath)()),
    lossCharacters: typebox_1.Type.Array((0, TSpriteResourcePath_1.SpriteResourcePath)()),
    prologueCharacter: (0, TSpriteResourcePath_1.SpriteResourcePath)(),
    prologueEndCharacter: (0, TSpriteResourcePath_1.SpriteResourcePath)(),
    prologueEndRequirements: typebox_1.Type.Array(exports.RequirementContainer),
    prologueCompleteRequirements: typebox_1.Type.Array(exports.RequirementContainer)
}, {
    $id: 'GameOverScreenData',
    additionalProperties: false
});
exports.SideOfScreen = typebox_1.Type.Enum({
    Left: 0,
    Right: 1,
    Both: 2
});
exports.DialogueLine = typebox_1.Type.Object({
    line: typebox_1.Type.RegExp(/.+/),
    characterSprites: typebox_1.Type.Array(typebox_1.Type.String()),
    unskippable: typebox_1.Type.Optional(typebox_1.Type.Boolean())
}, {
    additionalProperties: false
});
exports.DialogueSection = typebox_1.Type.Object({
    characterSide: exports.SideOfScreen,
    characterNames: typebox_1.Type.Array(typebox_1.Type.String()),
    lines: typebox_1.Type.Array(exports.DialogueLine),
    dialogueType: typebox_1.Type.Union([
        typebox_1.Type.Literal('Speaking'),
        typebox_1.Type.Literal('Exposition'),
        typebox_1.Type.Literal('Scrim'),
        typebox_1.Type.Literal('Sprite'),
        typebox_1.Type.Literal('Fade'),
        typebox_1.Type.Literal('Sfx'),
        typebox_1.Type.Literal('Letter'),
        typebox_1.Type.Literal('Music'),
        typebox_1.Type.Literal('Camerafocus'),
        typebox_1.Type.Literal('Camerashake'),
        typebox_1.Type.Literal('Chapterstart')
    ])
}, {
    additionalProperties: false
});
exports.DialogueSet = typebox_1.Type.Object({
    dialogueId: (0, TIdentifier_1.Identifier)('Dialogue'),
    sourceFile: typebox_1.Type.String(),
    dialogueSections: typebox_1.Type.Array(exports.DialogueSection),
    repeatable: typebox_1.Type.Boolean(),
    dialogueFormat: typebox_1.Type.Union([
        typebox_1.Type.Literal('Phone'),
        typebox_1.Type.Literal('Default'),
        typebox_1.Type.Literal('') // the code supports this, but ideally we require a valid value and make it optional
    ]),
    requirements: typebox_1.Type.Array(exports.RequirementContainer)
}, {
    $id: 'DialogueSet',
    additionalProperties: false
});
exports.CompletionSequenceEvent = typebox_1.Type.Object({
    eventData: typebox_1.Type.Union([
        typebox_1.Type.Object({
            eventType: typebox_1.Type.Literal('dialogue'),
            dialogueId: (0, TReference_1.Reference)('Dialogue')
        }, {
            additionalProperties: false
        }),
        typebox_1.Type.Object({
            eventType: typebox_1.Type.Literal('none')
        }, {
            additionalProperties: false
        }),
        typebox_1.Type.Object({
            eventType: typebox_1.Type.Literal('interactableItems'),
            itemId: (0, TReference_1.Reference)('Task'),
            roomId: typebox_1.Type.String(),
            spawnIds: typebox_1.Type.Array(typebox_1.Type.String(), { minItems: 1 }),
            iconId: (0, TReference_1.Reference)('Item') // TODO: specific item type?
        }, {
            additionalProperties: false
        }),
        typebox_1.Type.Object({
            eventType: typebox_1.Type.Literal('placeProp'),
            roomId: typebox_1.Type.String(),
            nodeId: (0, TReference_1.Reference)('Node'),
            propTags: typebox_1.Type.Array((0, TReference_1.Reference)('PropTag'), { minItems: 1 })
        }, {
            additionalProperties: false
        }),
        typebox_1.Type.Object({
            eventType: typebox_1.Type.Literal('focusOnItem'),
            itemId: (0, TReference_1.Reference)('Task'),
            roomId: typebox_1.Type.String(),
            spawnId: typebox_1.Type.String() // TODO: Reference?
        }, {
            additionalProperties: false
        }),
        typebox_1.Type.Object({
            eventType: typebox_1.Type.Literal('forceSwapProps'),
            locationAndPropIds: typebox_1.Type.Array(typebox_1.Type.Object({
                roomId: typebox_1.Type.String(),
                nodeId: (0, TReference_1.Reference)('Node'),
                propId: (0, TReference_1.Reference)('Prop')
            }, {
                additionalProperties: false
            }), {
                minItems: 1
            })
        }, {
            additionalProperties: false
        }),
        typebox_1.Type.Object({
            eventType: typebox_1.Type.Literal('unlockRoom'),
            roomId: typebox_1.Type.String() // TODO: Reference?
        }, {
            additionalProperties: false
        }),
        typebox_1.Type.Object({
            eventType: typebox_1.Type.Literal('endGamePopup'),
            title: typebox_1.Type.String(),
            message: typebox_1.Type.String(),
            spritePath: (0, TSpriteResourcePath_1.SpriteResourcePath)()
        }, {
            additionalProperties: false
        })
    ])
}, {
    $id: 'CompletionSequenceEvent',
    additionalProperties: false
});
exports.CompletionSequence = typebox_1.Type.Object({
    events: typebox_1.Type.Array(exports.CompletionSequenceEvent)
}, {
    $id: 'CompletionSequence',
    additionalProperties: false
});
exports.TaskData = typebox_1.Type.Object({
    id: (0, TIdentifier_1.Identifier)('Task'),
    name: typebox_1.Type.String(),
    iconId: (0, TReference_1.Reference)('Task'),
    description: typebox_1.Type.String(),
    unlockRequirements: typebox_1.Type.Array(exports.RequirementContainer),
    starCost: typebox_1.Type.Number({ minimum: 0 }),
    completionCount: typebox_1.Type.Number({ minimum: 0 }),
    completionSequences: typebox_1.Type.Array(exports.CompletionSequence),
    chapterStartTask: typebox_1.Type.Optional((0, TReference_1.Reference)('Chapter')),
    chapterEndTask: typebox_1.Type.Optional((0, TReference_1.Reference)('Chapter'))
}, {
    $id: 'TaskData',
    additionalProperties: false
});
exports.Chapter = typebox_1.Type.Object({
    id: (0, TIdentifier_1.Identifier)('Chapter'),
    name: typebox_1.Type.String(),
    tasks: typebox_1.Type.Array(exports.TaskData)
}, {
    $id: 'Chapter',
    additionalProperties: false
});
exports.RefsObject = typebox_1.Type.Object({
    refs: typebox_1.Type.Array((0, TJsonResourcePath_1.JsonResourcePath)())
}, {
    $id: 'RefsObject',
    additionalProperties: false
});
exports.PropData = typebox_1.Type.Object({
    id: (0, TIdentifier_1.Identifier)('Prop'),
    tags: typebox_1.Type.Optional(typebox_1.Type.Array((0, TIdentifier_1.Identifier)('PropTag'))),
    requirements: typebox_1.Type.Optional(typebox_1.Type.Array(exports.RequirementContainer)),
    visibilityRequirements: typebox_1.Type.Optional(typebox_1.Type.Array(exports.RequirementContainer)),
    assetFilePath: typebox_1.Type.Union([(0, TPrefabResourcePath_1.PrefabResourcePath)(), (0, TTextureResourcePath_1.TextureResourcePath)()]),
    thumbnailFilePath: (0, TSpriteResourcePath_1.SpriteResourcePath)()
}, {
    additionalProperties: false
});
exports.CurrencyAndAmount = typebox_1.Type.Object({
    currency: (0, TReference_1.Reference)('Currency'),
    amount: typebox_1.Type.Number()
}, {
    additionalProperties: false
});
exports.ItemAndAmount = typebox_1.Type.Object({
    id: (0, TReference_1.Reference)('Item'),
    amount: typebox_1.Type.Number()
}, {
    additionalProperties: false
});
const catalogItemFields = {
    id: (0, TIdentifier_1.Identifier)('CatalogItem'),
    name: typebox_1.Type.String(),
    description: typebox_1.Type.String(),
    cost: exports.CurrencyAndAmount,
    sprite: (0, TSpriteResourcePath_1.SpriteResourcePath)(),
    contents: typebox_1.Type.Array(exports.ItemAndAmount),
    tags: typebox_1.Type.Array(typebox_1.Type.String()),
    valueTag: typebox_1.Type.Optional(typebox_1.Type.String()),
    externalIds: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    stack: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    priority: typebox_1.Type.Optional(typebox_1.Type.Number()),
    collapsedVisible: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    isUpsell: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    maxPurchaseCount: typebox_1.Type.Optional(typebox_1.Type.Number())
};
exports.CatalogItem = typebox_1.Type.Object(catalogItemFields, {
    additionalProperties: false
});
const internalCatalogItemFields = Object.assign(Object.assign({}, catalogItemFields), { sprite: typebox_1.Type.Literal('') });
exports.InternalCatalogItem = typebox_1.Type.Object(internalCatalogItemFields, {
    additionalProperties: false
});
exports.UpsellItemConfig = typebox_1.Type.Object({
    itemId: (0, TIdentifier_1.Identifier)('UpsellItem'),
    catalogItemIds: typebox_1.Type.Array((0, TReference_1.Reference)('CatalogItem')),
    upsellText: typebox_1.Type.String()
}, {
    additionalProperties: false
});
exports.StoreConfig = typebox_1.Type.Object({
    items: typebox_1.Type.Optional(typebox_1.Type.Array(exports.CatalogItem)),
    upsells: typebox_1.Type.Optional(typebox_1.Type.Array(exports.UpsellItemConfig)),
    refs: typebox_1.Type.Optional(typebox_1.Type.Array((0, TJsonResourcePath_1.JsonResourcePath)()))
}, {
    $id: 'StoreConfig',
    additionalProperties: false
});
exports.InternalStoreConfig = typebox_1.Type.Object({
    items: typebox_1.Type.Optional(typebox_1.Type.Array(exports.InternalCatalogItem)),
    upsells: typebox_1.Type.Optional(typebox_1.Type.Array(exports.UpsellItemConfig)),
    refs: typebox_1.Type.Optional(typebox_1.Type.Array((0, TJsonResourcePath_1.JsonResourcePath)()))
}, {
    $id: 'StoreConfig',
    additionalProperties: false
});
exports.Level = typebox_1.Type.Object({
    id: (0, TIdentifier_1.Identifier)('Level'),
    name: typebox_1.Type.String(),
    path: (0, TJsonResourcePath_1.JsonResourcePath)(),
    cost: exports.CurrencyAndAmount,
    requirements: typebox_1.Type.Optional(typebox_1.Type.Array(exports.RequirementContainer)),
    note: typebox_1.Type.Optional(typebox_1.Type.String())
}, {
    additionalProperties: false
});
exports.LevelList = typebox_1.Type.Object({
    note: typebox_1.Type.Optional(typebox_1.Type.String()),
    levels: typebox_1.Type.Array(exports.Level)
}, {
    additionalProperties: false
});
exports.RewardItem = typebox_1.Type.Object({
    count: typebox_1.Type.Number(),
    itemId: typebox_1.Type.String() // an xsolla sku
}, {
    additionalProperties: false
});
exports.DailyPrize = typebox_1.Type.Object({
    day: typebox_1.Type.Number(),
    rewardIndex: typebox_1.Type.Number(),
    free: exports.RewardItem,
    club: exports.RewardItem
}, {
    additionalProperties: false
});
exports.DailyPrizeConfig = typebox_1.Type.Object({
    rewards: typebox_1.Type.Optional(typebox_1.Type.Array(exports.DailyPrize)),
    refs: typebox_1.Type.Optional(typebox_1.Type.Array((0, TJsonResourcePath_1.JsonResourcePath)()))
}, {
    additionalProperties: false
});
exports.GameAnalyticsConfig = typebox_1.Type.Object({
    enabled: typebox_1.Type.Boolean(),
    key: typebox_1.Type.String(),
    secret: typebox_1.Type.String(),
    verboseLog: typebox_1.Type.Boolean(),
    infoLog: typebox_1.Type.Boolean(),
    sendBusinessEvents: typebox_1.Type.Boolean()
}, {
    additionalProperties: false
});
exports.CrazyGamesConfig = typebox_1.Type.Object({
    enabled: typebox_1.Type.Boolean(),
    xsolla: typebox_1.Type.Object({
        projectId: typebox_1.Type.String(),
        loginId: typebox_1.Type.String(),
        clientId: typebox_1.Type.Number(),
        redirectURI: typebox_1.Type.String(),
        enableSandbox: typebox_1.Type.Boolean(),
        enableInAppBrowser: typebox_1.Type.Boolean(),
        paymentUISettings: typebox_1.Type.Object({
            theme: typebox_1.Type.String()
        }, {
            additionalProperties: false
        })
    }),
    debug: typebox_1.Type.Optional(typebox_1.Type.Object({
        email: typebox_1.Type.String(),
        password: typebox_1.Type.String(),
        projectId: typebox_1.Type.String()
    }, {
        additionalProperties: false
    })),
    gameanalytics: exports.GameAnalyticsConfig
}, {
    additionalProperties: false
});
exports.FeatureConfig = typebox_1.Type.Object({
    unlockString: typebox_1.Type.String(),
    unlockPopupTitle: typebox_1.Type.String(),
    unlockPopupMessage: typebox_1.Type.String(),
    unlockPopupSpritePath: typebox_1.Type.String(),
    requirements: typebox_1.Type.Array(exports.RequirementContainer)
}, {
    additionalProperties: false
});
exports.HudConfig = typebox_1.Type.Object({
    quickplayFeatureConfig: exports.FeatureConfig,
    storeFeatureConfig: exports.FeatureConfig,
    dailyMysteryPrizeFeatureConfig: exports.FeatureConfig,
    buildModeFeatureConfig: exports.FeatureConfig,
    puzzleDetailsFeatureConfig: exports.FeatureConfig,
    energyRevealFeatureConfig: exports.FeatureConfig
}, {
    additionalProperties: false
});
exports.FTUEConfig = typebox_1.Type.Object({
    dragReminderTimeout: typebox_1.Type.Number()
});
exports.AppConfig = typebox_1.Type.Partial(typebox_1.Type.Object({
    pogoSDK: typebox_1.Type.Object({}, { additionalProperties: true }),
    crazyGamesSDK: exports.CrazyGamesConfig,
    minLoadingScreenTimeMS: typebox_1.Type.Number({ minimum: 0 }),
    loadingScreenTips: typebox_1.Type.Array(typebox_1.Type.String()),
    gameOverScreenData: exports.GameOverScreenData,
    darcyDailyRewardPhrases: typebox_1.Type.Array(typebox_1.Type.String()),
    cheats: typebox_1.Type.Union([typebox_1.Type.Boolean(), typebox_1.Type.Literal('true'), typebox_1.Type.Literal('false')]),
    env: typebox_1.Type.String(),
    buildNumber: typebox_1.Type.Number({ minimum: 0 }),
    timestamp: typebox_1.Type.String(),
    branch: typebox_1.Type.String(),
    commit: typebox_1.Type.String(),
    skipDiner: typebox_1.Type.Boolean(),
    store: exports.StoreConfig,
    items: exports.RefsObject,
    tasks: exports.RefsObject,
    levels: exports.RefsObject,
    quickPlayConfigPath: (0, TJsonResourcePath_1.JsonResourcePath)(),
    hudConfig: exports.HudConfig,
    initialRoomUnlocks: typebox_1.Type.Array(typebox_1.Type.String()),
    introDialogue: typebox_1.Type.String(),
    handTierList: typebox_1.Type.Array(typebox_1.Type.Any()),
    puzzleRewards: typebox_1.Type.Any(),
    maximumHandSize: typebox_1.Type.Number(),
    guestLimitLevelId: (0, TReference_1.Reference)('Level'),
    guestLimitMessage: typebox_1.Type.String(),
    endOfStoryMessage: typebox_1.Type.String(),
    migrateGuestSaveData: typebox_1.Type.Boolean(),
    burningFoodScoreLossAmount: typebox_1.Type.Number(),
    dailyPrizeConfig: exports.DailyPrizeConfig,
    ftueConfig: exports.FTUEConfig
}, {
    $id: 'AppConfig',
    additionalProperties: false
}));
