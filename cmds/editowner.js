const { getUserRole } = require('./roles.js');
const { extractNumericId } = require('../util.js');
const database = require('../databases.js');
const cacheManager = require('../cacheManager.js');

module.exports = {
  command: '/editowner',
  aliases: [],
  description: 'Сменить владельца беседы',
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

    if (!targetId) return context.reply('📖 /editowner @user');
    if (senderId === targetId) return context.reply('⛔ Вы уже владелец');

    database.query(
      'UPDATE chat_settings SET owner_id = ? WHERE peer_id = ?',
      [targetId, peerId],
      async (err) => {
        if (err) return context.reply('⛔ Ошибка');

        database.query(
          'INSERT OR REPLACE INTO roles (peer_id, user_id, role_id) VALUES (?, ?, 100)',
          [peerId, targetId],
          async (err) => {
            cacheManager.invalidate(`role_${peerId}_${targetId}`);
            if (context.logAction) context.logAction('/editowner', targetId);
            context.reply('✅ Владелец изменён');
          }
        );
      }
    );
  }
};
