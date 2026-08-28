const { getUserRole } = require('./roles.js');
const database = require('../databases.js');
const cacheManager = require('../cacheManager.js');

module.exports = {
  command: '/start',
  aliases: [],
  description: 'Инициализация бота в чате',
  async execute(context) {
    const { peerId, senderId, vk } = context;

    try {
      const chatInfo = await vk.api.messages.getConversationsById({ peer_ids: [peerId] });
      const ownerId = chatInfo.items[0]?.chat_settings?.owner_id;

      if (senderId !== ownerId) {
        return context.reply('⛔ Только владелец чата может активировать бота');
      }

      database.get('SELECT role_id FROM roles WHERE peer_id = ? AND user_id = ?', [peerId, ownerId], async (err, row) => {
        if (row && row.role_id > 0) {
          return context.reply('✅ Бот уже активирован');
        }

        database.query(
          'INSERT OR IGNORE INTO chat_settings (peer_id, owner_id) VALUES (?, ?)',
          [peerId, ownerId],
          (err) => {
            database.query(
              'INSERT OR REPLACE INTO roles (peer_id, user_id, role_id) VALUES (?, ?, 100)',
              [peerId, ownerId],
              (err) => {
                cacheManager.invalidate(`role_${peerId}_${ownerId}`);
                context.reply('✅ Conference Manager активирован\n\n/help');
              }
            );
          }
        );
      });
    } catch (e) {
      console.error('/start error:', e);
      context.reply('⛔ Ошибка при активации');
    }
  }
};
