const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/unban',
  aliases: ['/разбан'],
  description: 'Разблокировать пользователя',
  async execute(context) {
    const { peerId, senderId, replyMessage, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return context.reply('⛔ Нужна роль Модератора (20+)');

    let targetId = null;
    if (replyMessage) {
      targetId = replyMessage.senderId;
    } else if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
    }

    if (!targetId) return context.reply('📖 /unban @user');

    database.query(
      'DELETE FROM bans WHERE peer_id = ? AND user_id = ?',
      [peerId, targetId],
      async (err) => {
        if (err) return context.reply(`⛔ Ошибка: ${err.message}`);

        const targetLink = await getlink(targetId);
        const adminLink = await getlink(senderId);
        if (context.logAction) context.logAction('/unban', targetId);
        context.reply(`✅ Разбан\n\n${targetLink}\nАдмин: ${adminLink}`);
      }
    );
  }
};
