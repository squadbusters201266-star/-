const database = require('./databases.js');

const DEFAULT_FOUNDER = 823989835;

function initSysAdmin() {
  database.get('SELECT access FROM sysadmins WHERE userid = ?', [DEFAULT_FOUNDER], (err, row) => {
    if (!row) {
      database.query('INSERT INTO sysadmins (userid, access) VALUES (?, 3)', [DEFAULT_FOUNDER]);
      console.log('✅ Sys админ (Основатель) добавлен');
    }
  });
}

module.exports = { initSysAdmin };
