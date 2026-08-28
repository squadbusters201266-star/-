const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/clear',
  aliases: ['/очистить'],
  description: 'Очистить сообщения',
  async execute(context) {
    const { peerId, senderId, text, vk } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 60) return context.reply('⛔ Нужна роль Ст. Администратора (60+)');

    const count = parseInt(parts[1]) || 100;
    if (count < 1 || count > 100) return context.reply('📖 /clear [1-100]');

    try {
      const messages = await vk.api.messages.getHistory({
        peer_id: peerId,
        count: count + 1
      });

      const ids = messages.items.slice(0, count).map(m => m.id);
      if (ids.length === 0) return context.reply('— Нечего удалять');

      await vk.api.messages.delete({
        peer_id: peerId,
        delete_for_all: 1,
        conversation_message_ids: ids
      });

      if (context.logAction) context.logAction('/clear', senderId, `${ids.length} сообщений`);
      context.reply(`✅ Удалено ${ids.length} сообщений`);
    } catch (e) {
      context.reply(`⛔ Ошибка: ${e.message}`);
    }
  }
};
