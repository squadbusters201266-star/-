const { getUserRole, getRoleName } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');
const { Keyboard } = require('vk-io');

module.exports = {
  command: '/ban',
  aliases: ['/бан', '/забан'],
  description: 'Заблокировать пользователя',
  async execute(context) {
    const { peerId, senderId, replyMessage, text, vk } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return context.reply('⛔ Нужна роль Модератора (20+)');

    if (parts.length < 2 && !replyMessage) return context.reply('📖 /ban @user [дни] [причина]');

    let targetId = null;
    let days = 0;
    let reason = 'Без причины';

    if (replyMessage) {
      targetId = replyMessage.senderId;
      if (parts[1] && !isNaN(parts[1])) {
        days = parseInt(parts[1]);
        reason = parts.slice(2).join(' ') || reason;
      } else {
        reason = parts.slice(1).join(' ') || reason;
      }
    } else {
      targetId = await extractNumericId(parts[1]);
      if (parts[2] && !isNaN(parts[2])) {
        days = parseInt(parts[2]);
        reason = parts.slice(3).join(' ') || reason;
      } else {
        reason = parts.slice(2).join(' ') || reason;
      }
    }

    if (!targetId) return context.reply('⛔ Не удалось определить пользователя');

    if (senderId === targetId) return context.reply('⛔ Нельзя забанить себя');

    const chatOwner = await context.getChatOwner();
    if (chatOwner === targetId) return context.reply('⛔ Нельзя забанить владельца чата');

    const targetRole = await getUserRole(peerId, targetId);
    if (userRole <= targetRole) return context.reply('⛔ Нельзя забанить пользователя с такой же или высшей ролью');

    const until = days > 0 ? Math.floor(Date.now() / 1000) + (days * 86400) : 0;

    database.query(
      'INSERT OR REPLACE INTO bans (peer_id, user_id, reason, until, admin_id) VALUES (?, ?, ?, ?, ?)',
      [peerId, targetId, reason, until, senderId],
      async (err) => {
        if (err) return context.reply('⛔ Ошибка базы данных');

        try {
          await vk.api.messages.removeChatUser({
            chat_id: peerId - 2000000000,
            member_id: targetId
          });
        } catch {}

        const targetLink = await getlink(targetId);
        const adminLink = await getlink(senderId);

        let untilText = 'Навсегда';
        if (until > 0) {
          const date = new Date(until * 1000);
          untilText = `${date.toLocaleDateString('ru-RU')}`;
        }

        const keyboard = Keyboard.builder()
          .callbackButton({
            label: '✅ Разблокировать',
            payload: JSON.stringify({ cmd: 'ban_unban', target: targetId }),
            color: Keyboard.POSITIVE_COLOR
          })
          .callbackButton({
            label: '🗑 Очистить',
            payload: JSON.stringify({ cmd: 'ban_clear', target: targetId }),
            color: Keyboard.NEGATIVE_COLOR
          })
          .callbackButton({
            label: 'ℹ️ Инфо',
            payload: JSON.stringify({ cmd: 'ban_info', target: targetId }),
            color: Keyboard.SECONDARY_COLOR
          });

        if (context.logAction) context.logAction('/ban', targetId, reason);

        context.reply({
          message: `${adminLink} заблокировал ${targetLink}.\n\nДата разблокировки: ${untilText}\nПричина: ${reason}`,
          keyboard: keyboard.inline()
        });
      }
    );
  },

  async handleCallback(context, payload) {
    if (!payload.cmd || !payload.cmd.startsWith('ban_')) return;

    const { peerId, userId } = context;
    const targetId = parseInt(payload.target);
    const action = payload.cmd;

    const userRole = await getUserRole(peerId, userId);
    if (userRole < 20) {
      return context.answer({ type: 'show_snackbar', text: '⛔ Нет прав' });
    }

    if (action === 'ban_unban') {
      database.query('DELETE FROM bans WHERE peer_id = ? AND user_id = ?', [peerId, targetId]);
      const targetLink = await getlink(targetId);
      if (context.logAction) context.logAction('/unban', targetId);
      await context.send(`✅ Разблокирован: ${targetLink}`);
      await context.answer({ type: 'show_snackbar', text: '✅ Разблокирован' });
    }

    if (action === 'ban_clear') {
      try {
        const vk = require('../shared.js').getVK();
        const messages = await vk.api.messages.getHistory({
          peer_id: peerId,
          count: 100,
          user_id: targetId
        });
        const ids = messages.items.map(m => m.id);
        if (ids.length > 0) {
          await vk.api.messages.delete({
            peer_id: peerId,
            delete_for_all: 1,
            conversation_message_ids: ids
          });
        }
        await context.answer({ type: 'show_snackbar', text: `✅ Удалено ${ids.length} сообщений` });
      } catch (e) {
        await context.answer({ type: 'show_snackbar', text: '⛔ Ошибка' });
      }
    }

    if (action === 'ban_info') {
      database.get('SELECT * FROM bans WHERE peer_id = ? AND user_id = ?', [peerId, targetId], async (err, row) => {
        if (!row) {
          await context.answer({ type: 'show_snackbar', text: '⛔ Не найден' });
          return;
        }
        const targetLink = await getlink(targetId);
        const adminLink = await getlink(row.admin_id);
        const until = row.until > 0 ? new Date(row.until * 1000).toLocaleString('ru-RU') : 'Навсегда';
        await context.send(`ℹ️ Инфо о бане:\n\n${targetLink}\nДо: ${until}\nПричина: ${row.reason}\nАдмин: ${adminLink}`);
        await context.answer({ type: 'show_snackbar', text: 'ℹ️ Инфо отправлено' });
      });
    }
  }
};
