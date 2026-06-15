const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Suppress experimental warning for sqlite
process.removeAllListeners('warning');
process.on('warning', (w) => {
  if (w.name === 'ExperimentalWarning' && w.message.includes('SQLite')) return;
  console.warn(w);
});

let db;

function getDatabase() {
  if (db) return db;

  const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../data/abcl_pd.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  db = new DatabaseSync(dbPath);

  // WAL mode and foreign keys via raw exec
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  return db;
}

function runMigrations() {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS officers (
      id TEXT PRIMARY KEY,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      branch TEXT NOT NULL,
      role TEXT DEFAULT 'credit_officer',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      app_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      mobile_no TEXT NOT NULL,
      product TEXT NOT NULL,
      loan_amount REAL,
      branch TEXT,
      location TEXT,
      employment_type TEXT NOT NULL DEFAULT 'salaried',
      residence_address TEXT,
      office_address TEXT,
      status TEXT DEFAULT 'pending',
      assigned_officer_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (assigned_officer_id) REFERENCES officers(id)
    );

    CREATE TABLE IF NOT EXISTS pd_links (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      mobile_no TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      is_used INTEGER DEFAULT 0,
      triggered_by TEXT NOT NULL,
      triggered_at TEXT DEFAULT (datetime('now')),
      sms_sid TEXT,
      session_video TEXT,
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (triggered_by) REFERENCES officers(id)
    );

    CREATE TABLE IF NOT EXISTS otp_sessions (
      id TEXT PRIMARY KEY,
      pd_link_id TEXT NOT NULL,
      mobile_no TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (pd_link_id) REFERENCES pd_links(id)
    );

    CREATE TABLE IF NOT EXISTS pd_submissions (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      pd_link_id TEXT NOT NULL,
      residence_type TEXT,
      years_at_residence TEXT,
      residence_ownership TEXT,
      locality_type TEXT,
      employer_name TEXT,
      designation TEXT,
      years_employed TEXT,
      monthly_income TEXT,
      business_name TEXT,
      business_type TEXT,
      years_in_business TEXT,
      monthly_turnover TEXT,
      family_members INTEGER,
      dependents INTEGER,
      existing_loans TEXT,
      loan_purpose TEXT,
      interaction_quality TEXT,
      customer_cooperative INTEGER DEFAULT 1,
      additional_notes TEXT,
      photos TEXT DEFAULT '[]',
      submitted_at TEXT,
      pd_outcome TEXT,
      outcome_remarks TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (pd_link_id) REFERENCES pd_links(id)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      performed_by TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('[DB] Migrations complete');
}

module.exports = { getDatabase, runMigrations };
