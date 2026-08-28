const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/warn',
  aliases: ['/варн'],
  description: 'Выдать предупреждение',
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

    if (!targetId) return context.reply('📖 /warn @user [причина]');
    if (senderId === targetId) return context.reply('⛔ Нельзя выдать варн себе');

    const chatOwner = await context.getChatOwner();
    if (chatOwner === targetId) return context.reply('⛔ Нельзя выдать варн владельцу чата');

    const targetRole = await getUserRole(peerId, targetId);
    if (userRole <= targetRole) return context.reply('⛔ Нельзя выдать варн пользователю с такой же или высшей ролью');

    const now = Math.floor(Date.now() / 1000);

    database.query(
      'INSERT INTO warns (peer_id, user_id, reason, admin_id, created_at) VALUES (?, ?, ?, ?, ?)',
      [peerId, targetId, reason, senderId, now],
      async (err) => {
        if (err) return context.reply(`⛔ Ошибка: ${err.message}`);

        database.all(
          'SELECT COUNT(*) as count FROM warns WHERE peer_id = ? AND user_id = ?',
          [peerId, targetId],
          async (err, rows) => {
            const warnCount = rows[0]?.count || 0;
            const targetLink = await getlink(targetId);
            const adminLink = await getlink(senderId);

            let msg = `⚠️ Предупреждение\n\n${targetLink}\n${warnCount}/3\nПричина: ${reason}\nАдмин: ${adminLink}`;

            if (warnCount >= 3) {
              database.query('DELETE FROM warns WHERE peer_id = ? AND user_id = ?', [peerId, targetId]);
              database.query(
                'INSERT OR REPLACE INTO bans (peer_id, user_id, reason, until, admin_id) VALUES (?, ?, ?, 0, ?)',
                [peerId, targetId, 'Автобан за 3 варна', senderId]
              );
              try {
                await vk.api.messages.removeChatUser({
                  chat_id: peerId - 2000000000,
                  member_id: targetId
                });
              } catch {}
              msg += `\n\n🚫 Автоматический бан (3/3)`;
            }

            if (context.logAction) context.logAction('/warn', targetId, `${warnCount}/3 - ${reason}`);
            context.reply(msg);
          }
        );
      }
    );
  }
};
