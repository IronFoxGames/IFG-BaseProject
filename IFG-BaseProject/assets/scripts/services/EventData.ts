export type EventData =
    | {
          game_event_type: 'click';
          game_event_location: 'lobby-store' | 'lobby-settings' | 'lobby-tasks' | 'lobby-dailyGift' | 'lobby-decoration' | 'settings-sound';
      }
    | {
          game_event_type: 'dialogue';
          game_event_location: `${string}_skipped` | `${string}_completed` | `${string}-dialogueEvent_${number}_skipped` | `${string}_showed`;
      }
    | {
          game_event_type: 'ftue';
          game_event_location: `ftueEvent_${string}_started` | `ftueEvent_${string}_completed`;
      }
    | {
          game_event_type: 'static-swap' | 'decoration-swap';
          game_event_location: `${string}_${string}_${string}`; // chapter_node_prop
      }
    | {
          game_event_type: 'task-complete';
          taskId: string;
      }
    | {
          game_event_type: 'task-unlock';
          taskId: string;
      }
    | {
          game_event_type: 'chapter-complete';
          chapterId: string;
          chapterName: string;
      }
    | {
          game_event_type: 'chapter-unlock';
          chapterId: string;
          chapterName: string;
      };
