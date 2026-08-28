const { getUserRole, getRoleName } = require('./roles.js');
const { getlink, extractNumericId, parseDuration } = require('../util.js');
const database = require('../databases.js');
const cacheManager = require('../cacheManager.js');

module.exports = {
  command: '/kick',
  aliases: ['/кик'],
  description: 'Исключить пользователя из беседы',
  async execute(context) {
    const { peerId, senderId, replyMessage, text, vk } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return context.reply('⛔ Нужна роль Модератора (20+)');

    let targetId = null;
    let reason = 'Без причины';

    if (replyMessage) {
      targetId = replyMessage.senderId;
      reason = parts.slice(1).join(' ') || reason;
    } else if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
      reason = parts.slice(2).join(' ') || reason;
    }

    if (!targetId) return context.reply('📖 /kick @user [причина]');

    if (senderId === targetId) return context.reply('⛔ Нельзя кикнуть себя');

    const chatOwner = await context.getChatOwner();
    if (chatOwner === targetId) return context.reply('⛔ Нельзя кикнуть владельца чата');

    const targetRole = await getUserRole(peerId, targetId);
    if (userRole <= targetRole) return context.reply('⛔ Нельзя кикнуть пользователя с такой же или высшей ролью');

    try {
      await vk.api.messages.removeChatUser({
        chat_id: peerId - 2000000000,
        member_id: targetId
      });

      const targetLink = await getlink(targetId);
      const adminLink = await getlink(senderId);

      if (context.logAction) context.logAction('/kick', targetId, reason);
      context.reply(`🚫 Кик\n\n${targetLink}\nПричина: ${reason}\nАдмин: ${adminLink}`);
    } catch (e) {
      context.reply(`⛔ Ошибка: ${e.message}`);
    }
  }
};
