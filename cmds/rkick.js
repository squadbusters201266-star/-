const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/rkick',
  aliases: [],
  description: 'Кик сроком на 24ч',
  async execute(context) {
    const { peerId, senderId, replyMessage, text, vk } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 40) return context.reply('⛔ Нужна роль Администратора (40+)');

    let targetId = null;
    if (replyMessage) {
      targetId = replyMessage.senderId;
    } else if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
    }

    if (!targetId) return context.reply('📖 /rkick @user');
    if (senderId === targetId) return context.reply('⛔ Нельзя кикнуть себя');

    const chatOwner = await context.getChatOwner();
    if (chatOwner === targetId) return context.reply('⛔ Нельзя кикнуть владельца чата');

    const targetRole = await getUserRole(peerId, targetId);
    if (userRole <= targetRole) return context.reply('⛔ Нельзя кикнуть пользователя с такой же или высшей ролью');

    const until = Math.floor(Date.now() / 1000) + 86400;

    database.query(
      'INSERT OR REPLACE INTO bans (peer_id, user_id, reason, until, admin_id) VALUES (?, ?, ?, ?, ?)',
      [peerId, targetId, 'RKICK 24ч', until, senderId],
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
        if (context.logAction) context.logAction('/rkick', targetId, '24ч');
        context.reply(`🚫 RKICK\n\n${targetLink}\nДо: 24ч\nАдмин: ${adminLink}`);
      }
    );
  }
};
