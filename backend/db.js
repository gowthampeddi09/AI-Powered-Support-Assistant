const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "support.db");

let db;

function getDatabase() {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    )
  `);

  return db;
}

function createSession(sessionId) {
  const db = getDatabase();
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO sessions (id) VALUES (?)"
  );
  stmt.run(sessionId);
}

function updateSessionTimestamp(sessionId) {
  const db = getDatabase();
  const stmt = db.prepare(
    "UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  );
  stmt.run(sessionId);
}

function insertMessage(sessionId, role, content) {
  const db = getDatabase();
  const stmt = db.prepare(
    "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)"
  );
  stmt.run(sessionId, role, content);
}

function getRecentMessages(sessionId, limit = 10) {
  const db = getDatabase();
  const stmt = db.prepare(
    `SELECT role, content, created_at FROM messages
     WHERE session_id = ?
     ORDER BY id DESC
     LIMIT ?`
  );
  const rows = stmt.all(sessionId, limit);
  return rows.reverse();
}

function getAllMessages(sessionId) {
  const db = getDatabase();
  const stmt = db.prepare(
    `SELECT id, role, content, created_at FROM messages
     WHERE session_id = ?
     ORDER BY id ASC`
  );
  return stmt.all(sessionId);
}

function getAllSessions() {
  const db = getDatabase();
  const stmt = db.prepare(
    `SELECT id, created_at, updated_at FROM sessions
     ORDER BY updated_at DESC`
  );
  return stmt.all();
}

module.exports = {
  getDatabase,
  createSession,
  updateSessionTimestamp,
  insertMessage,
  getRecentMessages,
  getAllMessages,
  getAllSessions,
};
