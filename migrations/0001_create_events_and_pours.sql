-- The whole persistent model. Ticket 10.
--
-- There is deliberately NO table for Impressions: a Taster's ratings, notes and
-- descriptors never leave their device (ADR-0002). Its absence is the decision,
-- not an oversight — do not "fix" it.
--
-- There is also no lifecycle column. An Event has no states (ticket 05): it
-- exists once created, and its QR opens forever.

CREATE TABLE IF NOT EXISTS events (
  id         TEXT PRIMARY KEY,
  -- Six characters of Crockford base32. Public by necessity: Tasters are
  -- unauthenticated, so anyone with the code can read the Lineup.
  code       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  date       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pours (
  id       TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  -- A Pour carries its own wine details; there is no Wine catalogue to join to.
  name     TEXT NOT NULL,
  producer TEXT NOT NULL DEFAULT '',
  vintage  TEXT NOT NULL DEFAULT '',
  grape    TEXT NOT NULL DEFAULT '',
  country  TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_pours_event ON pours (event_id, position);
