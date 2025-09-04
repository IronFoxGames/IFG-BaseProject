export class TaskUpdatedEventData {
    public Completed: number;
    public Assigned: boolean;
    public ChapterStartName: string | null = null;
    public ChapterStartId: string | null = null;
    public ChapterEndName: string | null = null;
    public ChapterEndId: string | null = null;
    public StarCost: number = 0;

    constructor(
        completed: number,
        assigned: boolean,
        chapterStartName: string | null = null,
        chapterStartId: string | null = null,
        chapterEndName: string | null = null,
        chapterEndId: string | null = null,
        starCost: number = 0
    ) {
        this.Completed = completed;
        this.Assigned = assigned;
        this.ChapterStartName = chapterStartName;
        this.ChapterStartId = chapterStartId;
        this.ChapterEndName = chapterEndName;
        this.ChapterEndId = chapterEndId;
        this.StarCost = starCost;
    }
}
