const { getUserRole, getRoleName, STANDARD_ROLES } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');
const cacheManager = require('../cacheManager.js');

module.exports = {
  command: '/роль',
  aliases: ['/role'],
  description: 'Выдать роль',
  async execute(context) {
    const { peerId, senderId, replyMessage, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) return context.reply('⛔ Нужна роль Владельца (100)');

    let targetId = null;
    let roleLevel = 0;

    if (replyMessage) {
      targetId = replyMessage.senderId;
      roleLevel = parseInt(parts[1]) || 0;
    } else if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
      roleLevel = parseInt(parts[2]) || 0;
    }

    if (!targetId) return context.reply('📖 /роль @user [уровень]');
    if (senderId === targetId) return context.reply('⛔ Нельзя выдать роль себе');

    const targetRole = await getUserRole(peerId, targetId);
    if (userRole <= targetRole) return context.reply('⛔ Нельзя выдать роль выше или равную своей');

    if (roleLevel < 0 || roleLevel > 100) return context.reply('⛔ Уровень 0-100');
    if (![0, 20, 40, 60, 80, 100].includes(roleLevel)) {
      return context.reply('⛔ Допустимые уровни: 0, 20, 40, 60, 80, 100');
    }

    database.query(
      'INSERT OR REPLACE INTO roles (peer_id, user_id, role_id) VALUES (?, ?, ?)',
      [peerId, targetId, roleLevel],
      async (err) => {
        if (err) return context.reply(`⛔ Ошибка: ${err.message}`);

        cacheManager.invalidate(`role_${peerId}_${targetId}`);
        const targetLink = await getlink(targetId);
        const roleName = await getRoleName(peerId, roleLevel);
        const adminLink = await getlink(senderId);
        if (context.logAction) context.logAction('/роль', targetId, `${roleName} (${roleLevel})`);
        context.reply(`✅ Роль выдана\n\n${targetLink}\nРоль: ${roleName} (${roleLevel})\nАдмин: ${adminLink}`);
      }
    );
  }
};
