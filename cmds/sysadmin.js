const database = require('../databases.js');

const SYS_ACCESS = {
  1: 'Агент',
  2: 'Предуправляющий',
  3: 'Архитектор'
};

function checkSysAccess(userId) {
  return new Promise((resolve) => {
    database.get(
      'SELECT access FROM sysadmins WHERE userid = ?',
      [userId],
      (err, row) => {
        resolve(row ? row.access : 0);
      }
    );
  }
  );
}

function isSysBanned(userId) {
  return new Promise((resolve) => {
    database.get(
      'SELECT * FROM sysbanned WHERE userid = ?',
      [userId],
      (err, row) => {
        if (!row) return resolve(null);
        const now = Math.floor(Date.now() / 1000);
        if (row.time !== 0 && now > row.time) {
          database.query('DELETE FROM sysbanned WHERE userid = ?', [userId]);
          return resolve(null);
        }
        resolve(row);
      }
    );
  });
}

module.exports = { checkSysAccess, isSysBanned, SYS_ACCESS };
