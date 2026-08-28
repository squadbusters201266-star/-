const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/vig',
  aliases: [],
  description: 'Выдать виг (временный бан)',
  async execute(context) {
    const { peerId, senderId, replyMessage, text, vk } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 60) return context.reply('⛔ Нужна роль Ст. Администратора (60+)');

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

    if (!targetId) return context.reply('📖 /vig @user [минуты] [причина]');
    if (senderId === targetId) return context.reply('⛔ Нельзя выдать виг себе');

    const chatOwner = await context.getChatOwner();
    if (chatOwner === targetId) return context.reply('⛔ Нельзя выдать виг владельцу чата');

    const targetRole = await getUserRole(peerId, targetId);
    if (userRole <= targetRole) return context.reply('⛔ Нельзя выдать виг пользователю с такой же или высшей ролью');

    const until = Math.floor(Date.now() / 1000) + duration;

    database.query(
      'INSERT OR REPLACE INTO vigs (peer_id, user_id, until, reason, admin_id) VALUES (?, ?, ?, ?, ?)',
      [peerId, targetId, until, reason, senderId],
      async (err) => {
        if (err) return context.reply(`⛔ Ошибка: ${err.message}`);

        try {
          await vk.api.messages.removeChatUser({
            chat_id: peerId - 2000000000,
            member_id: targetId
          });
        } catch {}

        const targetLink = await getlink(targetId);
        const adminLink = await getlink(senderId);
        const mins = duration / 60;

        if (context.logAction) context.logAction('/vig', targetId, `${mins} мин - ${reason}`);
        context.reply(`🔨 Виг\n\n${targetLink}\nНа ${mins} мин\nПричина: ${reason}\nАдмин: ${adminLink}`);
      }
    );
  }
};
