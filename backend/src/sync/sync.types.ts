export type RunStats = {
  created: number;
  updated: number;
  archived: number;
  skipped: number;
  warnings: string[];
};

export function newStats(): RunStats {
  return { created: 0, updated: 0, archived: 0, skipped: 0, warnings: [] };
}

export type SyncOptions = {
  /* Only pages edited on/after this instant (incremental). Absent = full. */
  since?: Date;
  /* Full mode also reconciles deletions: rows whose Notion page vanished
     from the query get archived/hidden. */
  full: boolean;
};
