const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/mention',
  aliases: ['/упоминание'],
  description: 'Управление упоминаниями',
  async execute(context) {
    const { peerId, senderId, replyMessage, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 40) return context.reply('⛔ Нужна роль Администратора (40+)');

    if (parts[1] && parts[1].toLowerCase() === 'on') {
      database.query(
        'UPDATE chat_settings SET mention_enabled = 1 WHERE peer_id = ?',
        [peerId],
        async (err) => {
          if (err) return context.reply('⛔ Ошибка');
          if (context.logAction) context.logAction('/mention', senderId, 'Включены');
          context.reply('✅ Упоминания включены');
        }
      );
      return;
    }

    if (parts[1] && parts[1].toLowerCase() === 'off') {
      database.query(
        'UPDATE chat_settings SET mention_enabled = 0 WHERE peer_id = ?',
        [peerId],
        async (err) => {
          if (err) return context.reply('⛔ Ошибка');
          if (context.logAction) context.logAction('/mention', senderId, 'Выключены');
          context.reply('✅ Упоминания выключены');
        }
      );
      return;
    }

    let targetId = null;
    if (replyMessage) {
      targetId = replyMessage.senderId;
    } else if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
    }

    if (targetId) {
      database.query(
        'INSERT OR REPLACE INTO mentions (peer_id, user_id, enabled) VALUES (?, ?, 1)',
        [peerId, targetId],
        async (err) => {
          if (err) return context.reply('⛔ Ошибка');
          const targetLink = await getlink(targetId);
          context.reply(`✅ Упоминания для ${targetLink} включены`);
        }
      );
      return;
    }

    context.reply('📖 /mention on|off|@user');
  }
};
