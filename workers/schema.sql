-- Oath Inventory System - D1 Database Schema

-- Peptides table - main inventory
CREATE TABLE IF NOT EXISTS peptides (
  peptideId TEXT PRIMARY KEY,
  peptideName TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  labeledCount INTEGER DEFAULT 0,
  batchNumber TEXT,
  shelfLocation TEXT,
  dateAdded TEXT,
  lastModified TEXT,
  notes TEXT,
  coa TEXT,
  sku TEXT,
  coaFile TEXT,
  msdsFile TEXT,
  sdsFile TEXT,
  hplcFile TEXT,
  tlcFile TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Exclusions table - patterns to exclude from inventory
CREATE TABLE IF NOT EXISTS exclusions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT UNIQUE NOT NULL,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Labels history table - track labeling operations
CREATE TABLE IF NOT EXISTS label_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  peptideId TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  action TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  notes TEXT,
  FOREIGN KEY (peptideId) REFERENCES peptides(peptideId) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_peptides_name ON peptides(peptideName);
CREATE INDEX IF NOT EXISTS idx_peptides_quantity ON peptides(quantity);
CREATE INDEX IF NOT EXISTS idx_peptides_labeled ON peptides(labeledCount);
CREATE INDEX IF NOT EXISTS idx_label_history_peptide ON label_history(peptideId);
CREATE INDEX IF NOT EXISTS idx_label_history_timestamp ON label_history(timestamp);
