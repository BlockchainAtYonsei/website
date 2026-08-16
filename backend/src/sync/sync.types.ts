export type RunStats = {
  created: number;
  updated: number;
  archived: number;
  /* Rows that never became content by design — template rows, unmapped pages.
     Routine; a skip is not a problem to chase. */
  skipped: number;
  /* Rows that SHOULD be on the site and aren't: the page mapped cleanly and
     the database refused the write. Counted apart from skipped because the
     two used to share a number, and a story silently missing for a day read
     as "26 template rows, as usual". */
  failed: number;
  warnings: string[];
};

export function newStats(): RunStats {
  return { created: 0, updated: 0, archived: 0, skipped: 0, failed: 0, warnings: [] };
}

export type SyncOptions = {
  /* Only pages edited on/after this instant (incremental). Absent = full. */
  since?: Date;
  /* Full mode also reconciles deletions: rows whose Notion page vanished
     from the query get archived/hidden. */
  full: boolean;
};
