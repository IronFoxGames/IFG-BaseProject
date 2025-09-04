"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskUpdatedEventData = void 0;
class TaskUpdatedEventData {
    constructor(completed, assigned, chapterStartName = null, chapterStartId = null, chapterEndName = null, chapterEndId = null, starCost = 0) {
        this.ChapterStartName = null;
        this.ChapterStartId = null;
        this.ChapterEndName = null;
        this.ChapterEndId = null;
        this.StarCost = 0;
        this.Completed = completed;
        this.Assigned = assigned;
        this.ChapterStartName = chapterStartName;
        this.ChapterStartId = chapterStartId;
        this.ChapterEndName = chapterEndName;
        this.ChapterEndId = chapterEndId;
        this.StarCost = starCost;
    }
}
exports.TaskUpdatedEventData = TaskUpdatedEventData;
