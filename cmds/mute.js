const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/mute',
  aliases: ['/мут'],
  description: 'Замутить пользователя',
  async execute(context) {
    const { peerId, senderId, replyMessage, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return context.reply('⛔ Нужна роль Модератора (20+)');

    let targetId = null;
    let duration = 3600;
    let reason = 'Без причины';

    if (replyMessage) {
      targetId = replyMessage.senderId;
      if (parts[1]) {
        const parsed = parseInt(parts[1]);
        if (!isNaN(parsed)) {
          duration = parsed * 60;
          reason = parts.slice(2).join(' ') || reason;
        } else {
          reason = parts.slice(1).join(' ') || reason;
        }
      }
    } else if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
      if (!targetId) return context.reply('⛔ Не удалось определить пользователя');
      if (parts[2] && !isNaN(parts[2])) {
        duration = parseInt(parts[2]) * 60;
        reason = parts.slice(3).join(' ') || reason;
      } else {
        reason = parts.slice(2).join(' ') || reason;
      }
    }

    if (!targetId) return context.reply('📖 /mute @user [минуты] [причина]');
    if (senderId === targetId) return context.reply('⛔ Нельзя замутить себя');

    const chatOwner = await context.getChatOwner();
    if (chatOwner === targetId) return context.reply('⛔ Нельзя замутить владельца чата');

    const targetRole = await getUserRole(peerId, targetId);
    if (userRole <= targetRole) return context.reply('⛔ Нельзя замутить пользователя с такой же или высшей ролью');

    const until = Math.floor(Date.now() / 1000) + duration;

    database.query(
      'INSERT OR REPLACE INTO mutes (peer_id, user_id, until, reason, admin_id) VALUES (?, ?, ?, ?, ?)',
      [peerId, targetId, until, reason, senderId],
      async (err) => {
        if (err) return context.reply(`⛔ Ошибка: ${err.message}`);

        const targetLink = await getlink(targetId);
        const adminLink = await getlink(senderId);
        const mins = duration / 60;

        if (context.logAction) context.logAction('/mute', targetId, `${mins} мин - ${reason}`);
        context.reply(`🔇 Мут\n\n${targetLink}\nНа ${mins} мин\nПричина: ${reason}\nАдмин: ${adminLink}`);
      }
    );
  }
};
