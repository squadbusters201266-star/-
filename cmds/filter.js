const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/filter',
  aliases: ['/фильтр'],
  description: 'Добавить слово в фильтр',
  async execute(context) {
    const { peerId, senderId, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 40) return context.reply('⛔ Нужна роль Администратора (40+)');

    if (!parts[1]) return context.reply('📖 /filter [слово]');

    const word = parts[1].toLowerCase();

    database.get(
      'SELECT filter FROM chat_settings WHERE peer_id = ?',
      [peerId],
      (err, row) => {
        let currentFilter = row?.filter || '';
        const words = currentFilter ? currentFilter.split(',') : [];
        if (!words.includes(word)) {
          words.push(word);
        }
        const newFilter = words.join(',');

        database.query(
          'UPDATE chat_settings SET filter = ? WHERE peer_id = ?',
          [newFilter, peerId],
          async (err) => {
            if (err) return context.reply('⛔ Ошибка');
            if (context.logAction) context.logAction('/filter', senderId, word);
            context.reply(`✅ Фильтр добавлен\n\n${word}`);
          }
        );
      }
    );
  }
};
