export class QuickPlaySaveData {
    constructor(highScore: number, playCount: number) {
        this.highscore = highScore;
        this.playCount = playCount;
    }
    public highscore: number = 0;
    public playCount: number = 0;
}

export class DialogueSaveData {
    public dialogueId: string;
}

export class TaskProgressSaveData {
    public taskComplete: number = 0;
    public taskAssigned: boolean = false;
}

export class NodeSaveData {
    public propId: string = '';
}

export class CurrencySaveData {
    public amount: number = 0;
}

export class SaveData {
    public storyLevelsCompleted: string[] = [];
    public dialogueSaveData: DialogueSaveData[] = [];
    public quickPlaySaveData: QuickPlaySaveData = new QuickPlaySaveData(0, 0);
    public taskProgressSaveData: Map<string, TaskProgressSaveData> = new Map();
    public nodeSaveData: Map<string, NodeSaveData> = new Map();
    public roomSaveData: Map<string, boolean> = new Map();
    public inventory: Map<string, number> = new Map();
    public currencySaveData: Map<string, CurrencySaveData> = new Map();
    public settings: Map<string, unknown> = new Map();
    public tutorialSteps: Map<string, boolean> = new Map();
    public dailyPrizeClaimStatus: boolean[] = [];
    public dailyPrizeClaimOrder: number[] = [];
    public dailyPrizeLastDay: number = -1;
    public purchases: Map<string, number> = new Map();
    public lastAutoEnergyTimestamp: number = -1;

    public static fromJson(savedData: string | null): SaveData {
        const save = new SaveData();
        if (savedData) {
            const parsedData = JSON.parse(savedData) as SaveData;

            save.storyLevelsCompleted = parsedData.storyLevelsCompleted ?? [];
            save.dialogueSaveData = parsedData.dialogueSaveData ?? [];
            save.quickPlaySaveData = parsedData.quickPlaySaveData ?? new QuickPlaySaveData(0, 0);
            save.quickPlaySaveData.playCount = parsedData.quickPlaySaveData?.playCount ?? 0;
            save.taskProgressSaveData = parsedData.taskProgressSaveData ? new Map(Object.entries(parsedData.taskProgressSaveData)) : new Map();
            save.nodeSaveData = parsedData.nodeSaveData ? new Map(Object.entries(parsedData.nodeSaveData)) : new Map();
            save.roomSaveData = parsedData.roomSaveData ? new Map(Object.entries(parsedData.roomSaveData)) : new Map();
            save.inventory = parsedData.inventory ? new Map(Object.entries(parsedData.inventory)) : new Map();
            save.currencySaveData = parsedData.currencySaveData ? new Map(Object.entries(parsedData.currencySaveData)) : new Map();
            save.settings = parsedData.settings ? new Map(Object.entries(parsedData.settings)) : new Map();
            save.tutorialSteps = parsedData.tutorialSteps ? new Map(Object.entries(parsedData.tutorialSteps)) : new Map();
            save.dailyPrizeClaimStatus = parsedData.dailyPrizeClaimStatus ?? [false, false, false];
            save.dailyPrizeClaimOrder = parsedData.dailyPrizeClaimOrder ?? [0, 1, 2];
            save.dailyPrizeLastDay = parsedData.dailyPrizeLastDay ?? -1;
            save.purchases = parsedData.purchases ? new Map(Object.entries(parsedData.purchases)) : new Map();
            save.lastAutoEnergyTimestamp = parsedData.lastAutoEnergyTimestamp ?? -1;
        }
        return save;
    }

    public toJson() {
        return {
            storyLevelsCompleted: this.storyLevelsCompleted,
            dialogueSaveData: this.dialogueSaveData,
            quickPlaySaveData: this.quickPlaySaveData,
            taskProgressSaveData: Object.fromEntries(this.taskProgressSaveData),
            nodeSaveData: Object.fromEntries(this.nodeSaveData),
            roomSaveData: Object.fromEntries(this.roomSaveData),
            inventory: Object.fromEntries(this.inventory),
            currencySaveData: Object.fromEntries(this.currencySaveData),
            settings: Object.fromEntries(this.settings),
            tutorialSteps: Object.fromEntries(this.tutorialSteps),
            dailyPrizeClaimStatus: this.dailyPrizeClaimStatus,
            dailyPrizeClaimOrder: this.dailyPrizeClaimOrder,
            dailyPrizeLastDay: this.dailyPrizeLastDay,
            purchases: Object.fromEntries(this.purchases),
            lastAutoEnergyTimestamp: this.lastAutoEnergyTimestamp
        };
    }

    public static updatePuzzleCompletion(saveData: SaveData, puzzleIndex: number, puzzleId: string, complete: boolean): SaveData {
        if (!complete) {
            return saveData;
        }

        if (!puzzleId || puzzleId == '') {
            return saveData;
        }

        if (!saveData.storyLevelsCompleted.includes(puzzleId)) {
            saveData.storyLevelsCompleted.push(puzzleId);
        }

        return saveData;
    }

    public static updateQuickPlaySaveData(saveData: SaveData, score: number): SaveData {
        if (!saveData.quickPlaySaveData) {
            saveData.quickPlaySaveData = new QuickPlaySaveData(0, 0);
        }

        if (score > saveData.quickPlaySaveData.highscore) {
            saveData.quickPlaySaveData.highscore = score;
        }

        saveData.quickPlaySaveData.playCount++;

        return saveData;
    }

    public static updateTaskCompletion(saveData: SaveData, taskId: string, completed: number, assigned: boolean): SaveData {
        if (!saveData.taskProgressSaveData.has(taskId)) {
            saveData.taskProgressSaveData.set(taskId, new TaskProgressSaveData());
        }

        // Update the task's completion status
        const taskData = saveData.taskProgressSaveData.get(taskId);
        if (taskData) {
            taskData.taskComplete = completed;
            taskData.taskAssigned = assigned;
        }

        return saveData;
    }

    public static updateNodeContents(saveData: SaveData, nodeId: string, propId: string): SaveData {
        if (!saveData.nodeSaveData.has(nodeId)) {
            saveData.nodeSaveData.set(nodeId, new NodeSaveData());
        }

        const nodeData = saveData.nodeSaveData.get(nodeId);
        if (nodeData) {
            nodeData.propId = propId;
        }

        return saveData;
    }

    public static addSeenDialogue(saveData: SaveData, dialogueId: string): SaveData {
        const existingSeenDialogue = saveData.dialogueSaveData.find((data) => data.dialogueId === dialogueId);

        if (existingSeenDialogue == undefined || existingSeenDialogue == null) {
            const dialogueSave = new DialogueSaveData();
            dialogueSave.dialogueId = dialogueId;

            saveData.dialogueSaveData.push(dialogueSave);
        }

        return saveData;
    }

    public static incrementCurrencyAmount(saveData: SaveData, currencyName: string, increment: number): SaveData {
        if (!saveData.currencySaveData.has(currencyName)) {
            saveData.currencySaveData.set(currencyName, new CurrencySaveData());
        }

        const currencyData = saveData.currencySaveData.get(currencyName);
        if (currencyData) {
            currencyData.amount = Math.max(0, currencyData.amount + increment);
        }

        return saveData;
    }

    public static decrementCurrencyAmount(saveData: SaveData, currencyName: string, increment: number): SaveData {
        return this.incrementCurrencyAmount(saveData, currencyName, -increment);
    }

    public static incrementInventoryItemCount(saveData: SaveData, itemId: string, increment: number): SaveData {
        if (!saveData.inventory.has(itemId)) {
            saveData.inventory.set(itemId, Math.max(0, increment));
        } else {
            const currentAmount = saveData.inventory.get(itemId);
            saveData.inventory.set(itemId, Math.max(0, currentAmount + increment));
        }
        return saveData;
    }

    public static getPurchaseCount(saveData: SaveData, catalogItemId: string): number {
        if (!saveData.purchases.has(catalogItemId)) {
            return 0;
        }
        return saveData.purchases.get(catalogItemId);
    }

    public static incrementPurchaseCount(saveData: SaveData, catalogItemId: string): SaveData {
        if (!saveData.purchases.has(catalogItemId)) {
            saveData.purchases.set(catalogItemId, 1);
        } else {
            const currentAmount = saveData.purchases.get(catalogItemId);
            saveData.purchases.set(catalogItemId, currentAmount + 1);
        }
        return saveData;
    }
}
