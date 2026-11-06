CREATE TABLE IF NOT EXISTS ref_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL,
  visited_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ref_visits_ref_time
  ON ref_visits (ref, visited_at);
