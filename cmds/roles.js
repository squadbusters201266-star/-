const database = require('../databases.js');
const cacheManager = require('../cacheManager.js');

const STANDARD_ROLES = {
  0: 'Участник',
  20: 'Модератор',
  40: 'Администратор',
  60: 'Ст. Администратор',
  80: 'Руководитель',
  100: 'Основатель'
};

function getUserRole(peerId, userId) {
  return new Promise((resolve) => {
    const cacheKey = `role_${peerId}_${userId}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return resolve(cached);

    database.get(
      'SELECT role_id FROM roles WHERE peer_id = ? AND user_id = ?',
      [peerId, userId],
      (err, row) => {
        const roleId = row ? row.role_id : 0;
        cacheManager.set(cacheKey, roleId);
        resolve(roleId);
      }
    );
  });
}

function getRoleName(peerId, roleId) {
  return Promise.resolve(STANDARD_ROLES[roleId] || `Роль ${roleId}`);
}

function getAllCustomRoles(peerId) {
  return Promise.resolve([]);
}

function addCustomRole(peerId, roleId, roleName) {
  return Promise.resolve({ success: false, message: 'Кастомные роли отключены' });
}

function deleteCustomRole(peerId, roleId) {
  return Promise.resolve({ success: false });
}

function checkIfTableExists(peerId, tableName) {
  return Promise.resolve(true);
}

function setUserRole(peerId, userId, roleId) {
  return new Promise((resolve) => {
    database.query(
      'INSERT OR REPLACE INTO roles (peer_id, user_id, role_id) VALUES (?, ?, ?)',
      [peerId, userId, roleId],
      (err) => {
        cacheManager.invalidate(`role_${peerId}_${userId}`);
        resolve(!err);
      }
    );
  });
}

module.exports = {
  getUserRole,
  setUserRole,
  getRoleName,
  getAllCustomRoles,
  addCustomRole,
  deleteCustomRole,
  checkIfTableExists,
  STANDARD_ROLES
};
