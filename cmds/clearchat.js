const { getUserRole } = require('./roles.js');

module.exports = {
  command: '/clearchat',
  aliases: ['/очиститьчат'],
  description: 'Очистить чат',
  async execute(context) {
    const { peerId, senderId, vk } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return context.reply('⛔ Нужна роль Модератора (20+)');

    try {
      let deleted = 0;
      let hasMore = true;

      while (hasMore) {
        const messages = await vk.api.messages.getHistory({
          peer_id: peerId,
          count: 100
        });

        if (!messages.items || messages.items.length === 0) {
          hasMore = false;
          break;
        }

        const ids = messages.items.map(m => m.id);
        if (ids.length === 0) {
          hasMore = false;
          break;
        }

        try {
          await vk.api.messages.delete({
            peer_id: peerId,
            delete_for_all: 1,
            conversation_message_ids: ids
          });
          deleted += ids.length;
        } catch {
          hasMore = false;
        }
      }

      if (context.logAction) context.logAction('/clearchat', senderId, `Удалено ${deleted} сообщений`);
      context.reply(`✅ Чат очищен. Удалено ${deleted} сообщений`);
    } catch (e) {
      context.reply(`⛔ Ошибка: ${e.message}`);
    }
  }
};
