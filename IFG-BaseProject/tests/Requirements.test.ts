import { RequirementsService } from '../assets/scripts/services/RequirementsService';
import { CardScrambleService } from '../assets/scripts/services/CardScrambleService';
import { DinerService } from '../assets/scripts/services/DinerService';

jest.mock('../assets/scripts/services/CardScrambleService', () => {
    return {
        CardScrambleService: jest.fn().mockImplementation(() => ({
            getItemCountInInventory: jest.fn(),
            getHighestPuzzleCompleted: jest.fn(),
            initialize: jest.fn()
        }))
    };
});

jest.mock('../assets/scripts/services/DinerService', () => {
    return {
        DinerService: jest.fn().mockImplementation(() => ({
            getPropIdInNode: jest.fn(),
            isPropTaggedInNode: jest.fn()
        }))
    };
});

describe('Requirements Tests', () => {
    let cardScrambleService: CardScrambleService;
    let dinerService: DinerService;
    let requirementsService: RequirementsService;

    beforeEach(async () => {
        cardScrambleService = new CardScrambleService();
        dinerService = new DinerService();
        requirementsService = new RequirementsService(cardScrambleService, dinerService);
    });

    // DateRequirement tests

    test('Test date requirement - after success', () => {
        // After 2024-11-15T00:00:00Z
        let dateRequirement = [
            {
                requirementData: {
                    requirementType: 'date',
                    date: '2024-11-15T00:00:00Z',
                    operator: 'after'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(dateRequirement);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(true);
    });

    test('Test date requirement - after failure', () => {
        // After 2024-11-15T00:00:00Z (but now is before this date)
        jest.useFakeTimers().setSystemTime(new Date('2024-11-01T00:00:00Z').getTime());

        let dateRequirement = [
            {
                requirementData: {
                    requirementType: 'date',
                    date: '2024-11-15T00:00:00Z',
                    operator: 'after'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(dateRequirement);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(false);

        jest.useRealTimers();
    });

    test('Test date requirement - inRange success', () => {
        // In range 2024-11-01 to 2024-12-01
        jest.useFakeTimers().setSystemTime(new Date('2024-11-15T00:00:00Z').getTime());

        let dateRequirement = [
            {
                requirementData: {
                    requirementType: 'date',
                    date: '2024-11-01T00:00:00Z',
                    endDate: '2024-12-01T00:00:00Z',
                    operator: 'inRange'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(dateRequirement);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(true);

        jest.useRealTimers();
    });

    test('Test date requirement - inRange failure', () => {
        // In range 2024-11-01 to 2024-12-01 (but now is after this range)
        jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z').getTime());

        let dateRequirement = [
            {
                requirementData: {
                    requirementType: 'date',
                    date: '2024-11-01T00:00:00Z',
                    endDate: '2024-12-01T00:00:00Z',
                    operator: 'inRange'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(dateRequirement);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(false);

        jest.useRealTimers();
    });

    // InventoryRequirement tests

    test('Test inventory requirement - greaterThanEqual success', () => {
        // Mock inventory to have 5 booster_1
        (cardScrambleService.getItemCountInInventory as jest.Mock).mockImplementation((itemId) => {
            return itemId === 'booster_1' ? 5 : 0;
        });

        // >= 1 'booster_1' in inventory
        let inventoryRequirement = [
            {
                requirementData: {
                    requirementType: 'inventory',
                    itemId: 'booster_1',
                    itemCount: 1,
                    operator: 'greaterThanEqual'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(inventoryRequirement);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(true);
    });

    test('Test inventory requirement - lessThan failure', () => {
        // Mock inventory to have 5 booster_1
        (cardScrambleService.getItemCountInInventory as jest.Mock).mockImplementation((itemId) => {
            return itemId === 'booster_1' ? 5 : 0;
        });

        // < 5 'booster_1' in inventory (but inventory has exactly 5)
        let inventoryRequirement = [
            {
                requirementData: {
                    requirementType: 'inventory',
                    itemId: 'booster_1',
                    itemCount: 5,
                    operator: 'lessThan'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(inventoryRequirement);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(false);
    });

    test('Test inventory requirement - notEqual success', () => {
        // Mock inventory to have 5 booster_1
        (cardScrambleService.getItemCountInInventory as jest.Mock).mockImplementation((itemId) => {
            return itemId === 'booster_1' ? 5 : 0;
        });

        // != 3 'booster_1' in inventory
        let inventoryRequirement = [
            {
                requirementData: {
                    requirementType: 'inventory',
                    itemId: 'booster_1',
                    itemCount: 3,
                    operator: 'notEqual'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(inventoryRequirement);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(true);
    });

    // LevelRequirement tests

    test('Test level requirement - greaterThanEqual success', () => {
        // Mock highest level completed to 5
        (cardScrambleService.getHighestPuzzleCompleted as jest.Mock).mockImplementation(() => 5);

        // >= level 5
        let levelRequirement = [
            {
                requirementData: {
                    requirementType: 'level',
                    level: 5,
                    operator: 'greaterThanEqual'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(levelRequirement);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(true);
    });

    test('Test level requirement - lessThan failure', () => {
        // Mock highest level completed to 5
        (cardScrambleService.getHighestPuzzleCompleted as jest.Mock).mockImplementation(() => 5);

        // < level 5 (but completed level is 5)
        let levelRequirement = [
            {
                requirementData: {
                    requirementType: 'level',
                    level: 5,
                    operator: 'lessThan'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(levelRequirement);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(false);
    });

    test('Test level requirement - compound requirement success', () => {
        // Mock highest level completed to 5
        (cardScrambleService.getHighestPuzzleCompleted as jest.Mock).mockImplementation(() => 5);

        // Compound: >= level 5 and < level 10
        let levelRequirements = [
            {
                requirementData: {
                    requirementType: 'level',
                    level: 5,
                    operator: 'greaterThanEqual'
                }
            },
            {
                requirementData: {
                    requirementType: 'level',
                    level: 10,
                    operator: 'lessThan'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(levelRequirements);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(true);
    });

    test('Test level requirement - compound requirement failure', () => {
        // Mock highest level completed to 12
        (cardScrambleService.getHighestPuzzleCompleted as jest.Mock).mockImplementation(() => 12);

        // Compound: >= level 5 and < level 10
        let levelRequirements = [
            {
                requirementData: {
                    requirementType: 'level',
                    level: 5,
                    operator: 'greaterThanEqual'
                }
            },
            {
                requirementData: {
                    requirementType: 'level',
                    level: 10,
                    operator: 'lessThan'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(levelRequirements);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(false);
    });

    test('Test prop in node requirement - equal success', () => {
        (dinerService.getPropIdInNode as jest.Mock).mockImplementation(() => '1');

        let propInNodeRequirements = [
            {
                requirementData: {
                    requirementType: 'propInNode',
                    propId: '1',
                    nodeId: '0',
                    operator: 'equal'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(propInNodeRequirements);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(true);
    });

    test('Test prop in node requirement - notEqual success', () => {
        (dinerService.getPropIdInNode as jest.Mock).mockImplementation(() => '2');

        let propInNodeRequirements = [
            {
                requirementData: {
                    requirementType: 'propInNode',
                    propId: '1',
                    nodeId: '0',
                    operator: 'notEqual'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(propInNodeRequirements);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(true);
    });

    test('Test prop in node requirement - notEqual failure', () => {
        (dinerService.getPropIdInNode as jest.Mock).mockImplementation(() => '1');

        let propInNodeRequirements = [
            {
                requirementData: {
                    requirementType: 'propInNode',
                    propId: '1',
                    nodeId: '0',
                    operator: 'notEqual'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(propInNodeRequirements);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(false);
    });

    test('Test prop has tag in node requirement - success', () => {
        (dinerService.isPropTaggedInNode as jest.Mock).mockImplementation(() => true);

        let propHasTagInNodeRequirements = [
            {
                requirementData: {
                    requirementType: 'propHasTagInNode',
                    tag: 'soda',
                    nodeId: '0'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(propHasTagInNodeRequirements);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(true);
    });

    test('Test prop has tag in node requirement - failure', () => {
        (dinerService.isPropTaggedInNode as jest.Mock).mockImplementation(() => false);

        let propHasTagInNodeRequirements = [
            {
                requirementData: {
                    requirementType: 'propHasTagInNode',
                    tag: 'soda',
                    nodeId: '0'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(propHasTagInNodeRequirements);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(false);
    });

    // Multiple Requirements tests

    test('Test compound requirements - success', () => {
        // Mock services
        (cardScrambleService.getItemCountInInventory as jest.Mock).mockImplementation((itemId) => {
            return itemId === 'booster_1' ? 5 : 0;
        });
        (cardScrambleService.getHighestPuzzleCompleted as jest.Mock).mockImplementation(() => 10);

        // Requirements: inventory >= 1 booster_1, level >= 10
        let compoundRequirements = [
            {
                requirementData: {
                    requirementType: 'inventory',
                    itemId: 'booster_1',
                    itemCount: 1,
                    operator: 'greaterThanEqual'
                }
            },
            {
                requirementData: {
                    requirementType: 'level',
                    level: 10,
                    operator: 'greaterThanEqual'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(compoundRequirements);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(true);
    });

    test('Test compound requirements - failure', () => {
        // Mock services
        (cardScrambleService.getItemCountInInventory as jest.Mock).mockImplementation((itemId) => {
            return itemId === 'booster_1' ? 0 : 0;
        });
        (cardScrambleService.getHighestPuzzleCompleted as jest.Mock).mockImplementation(() => 5);

        // Requirements: inventory >= 1 booster_1, level >= 10
        let compoundRequirements = [
            {
                requirementData: {
                    requirementType: 'inventory',
                    itemId: 'booster_1',
                    itemCount: 1,
                    operator: 'greaterThanEqual'
                }
            },
            {
                requirementData: {
                    requirementType: 'level',
                    level: 10,
                    operator: 'greaterThanEqual'
                }
            }
        ];

        let requirements = RequirementsService.parseRequirements(compoundRequirements);
        expect(requirementsService.checkRequirementsMet(requirements)).toBe(false);
    });
});
