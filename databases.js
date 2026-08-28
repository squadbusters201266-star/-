const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'database.sqlite');

const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('⛔ Ошибка подключения к БД:', err.message);
  else console.log('✅ База данных подключена');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      peer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (peer_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bans (
      peer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reason TEXT DEFAULT 'Не указана',
      until INTEGER NOT NULL DEFAULT 0,
      admin_id INTEGER NOT NULL,
      PRIMARY KEY (peer_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS warns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      peer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reason TEXT DEFAULT 'Не указана',
      admin_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS mutes (
      peer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      until INTEGER NOT NULL DEFAULT 0,
      reason TEXT DEFAULT 'Не указана',
      admin_id INTEGER NOT NULL,
      PRIMARY KEY (peer_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS vigs (
      peer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      until INTEGER NOT NULL DEFAULT 0,
      reason TEXT DEFAULT 'Не указана',
      admin_id INTEGER NOT NULL,
      PRIMARY KEY (peer_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS nicks (
      peer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      nick TEXT NOT NULL,
      PRIMARY KEY (peer_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chat_settings (
      peer_id INTEGER NOT NULL PRIMARY KEY,
      rules TEXT DEFAULT '',
      welcome TEXT DEFAULT '',
      filter TEXT DEFAULT '',
      mention_enabled INTEGER DEFAULT 0,
      silence_until INTEGER DEFAULT 0,
      owner_id INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS command_priorities (
      peer_id INTEGER NOT NULL,
      command TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 40,
      PRIMARY KEY (peer_id, command)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stats (
      peer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      messages INTEGER DEFAULT 0,
      PRIMARY KEY (peer_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      peer_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      admin_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      details TEXT DEFAULT '',
      timestamp INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS publics (
      peer_id INTEGER NOT NULL,
      public_id TEXT NOT NULL,
      PRIMARY KEY (peer_id, public_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS mentions (
      peer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      enabled INTEGER DEFAULT 1,
      PRIMARY KEY (peer_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sysadmins (
      userid INT PRIMARY KEY,
      access INT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sysbanned (
      userid INT PRIMARY KEY,
      time BIGINT NOT NULL,
      reason VARCHAR(255) DEFAULT 'Не указана',
      who INT NOT NULL
    )
  `);
});

function query(sql, params = [], callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  db.run(sql, params, function(err) {
    if (callback) callback(err, this);
  });
}

function all(sql, params = [], callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  db.all(sql, params, callback);
}

function get(sql, params = [], callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  db.get(sql, params, callback);
}

module.exports = { query, all, get, db };
