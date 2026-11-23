import type { SchemaMigration } from './schema-migrations'

/** The room's schema, version by version. */
export const ROOM_OBJECT_MIGRATIONS: readonly SchemaMigration[] = [
  [
    // One row at most: the room this object holds, once opened.
    'CREATE TABLE room (id INTEGER PRIMARY KEY CHECK (id = 1), code TEXT NOT NULL, screen_token TEXT NOT NULL)',
    'CREATE TABLE seats (seat_id TEXT PRIMARY KEY, session_id TEXT NOT NULL UNIQUE, slot INTEGER NOT NULL UNIQUE)'
  ],
  [
    'ALTER TABLE room ADD COLUMN erase_at_ms INTEGER',
    'ALTER TABLE seats ADD COLUMN absent_since_ms INTEGER'
  ]
]
