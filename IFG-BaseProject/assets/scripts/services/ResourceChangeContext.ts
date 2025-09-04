export const ResourceItemType = [
    'task',
    'level',
    'store',
    'timer',
    'debug',
    'store',
    'decorationstore',
    'dailyreward',
    'pregameupsell',
    'giveupupsell',
    'ingameupsell'
] as const;
export type ResourceItemType = (typeof ResourceItemType)[number];

// Map of ResourceItemType -> fields for that ResourceItemType
// eslint-disable-next-line unused-imports/no-unused-vars
const ResourceContextMap = {
    task: { taskId: '' },
    level: { levelId: '' },
    store: { sku: '' },
    decorationstore: { sku: '' },
    debug: {} as Record<never, never>,
    timer: { id: '' },
    dailyreward: { sku: '' },
    pregameupsell: { sku: '' },
    giveupupsell: { sku: '' },
    ingameupsell: { sku: '' }
} satisfies { [K in ResourceItemType]: object };

// Transform ResourceContextMap into a type where the key (i.e the ResourceItemType) is combined with the fields
type CompleteMap = {
    [K in ResourceItemType]: { type: K } & (typeof ResourceContextMap)[K];
};

export type ResourceChangeContext = CompleteMap[ResourceItemType];

export function extractId(context: ResourceChangeContext) {
    switch (context.type) {
        case 'task':
            return context.taskId;
        case 'level':
            return context.levelId;
        case 'store':
        case 'decorationstore':
        case 'dailyreward':
        case 'pregameupsell':
        case 'giveupupsell':
        case 'ingameupsell':
            return context.sku;
        case 'debug':
            return 'debug';
        case 'timer':
            return context.id;
    }
}
