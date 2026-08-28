const { getUserRole, getRoleName } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');
const cacheManager = require('../cacheManager.js');

module.exports = {
  command: '/demote',
  aliases: ['/разжаловать'],
  description: 'Снять роль',
  async execute(context) {
    const { peerId, senderId, replyMessage, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) return context.reply('⛔ Нужна роль Владельца (100)');

    let targetId = null;
    if (replyMessage) {
      targetId = replyMessage.senderId;
    } else if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
    }

    if (!targetId) return context.reply('📖 /demote @user');
    if (senderId === targetId) return context.reply('⛔ Нельзя снять роль с себя');

    const targetRole = await getUserRole(peerId, targetId);
    if (userRole <= targetRole) return context.reply('⛔ Нельзя снять роль пользователю с такой же или высшей ролью');

    database.query(
      'UPDATE roles SET role_id = 0 WHERE peer_id = ? AND user_id = ?',
      [peerId, targetId],
      async (err) => {
        if (err) return context.reply(`⛔ Ошибка: ${err.message}`);

        cacheManager.invalidate(`role_${peerId}_${targetId}`);
        const targetLink = await getlink(targetId);
        const adminLink = await getlink(senderId);
        if (context.logAction) context.logAction('/demote', targetId);
        context.reply(`✅ Роль снята\n\n${targetLink}\nАдмин: ${adminLink}`);
      }
    );
  }
};
