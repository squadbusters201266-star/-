const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/rfilter',
  aliases: [],
  description: 'Удалить слово из фильтра',
  async execute(context) {
    const { peerId, senderId, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return;

    if (!parts[1]) return context.reply('📖 /rfilter [слово]');

    const word = parts[1].toLowerCase();

    database.get(
      'SELECT filter FROM chat_settings WHERE peer_id = ?',
      [peerId],
      (err, row) => {
        let currentFilter = row?.filter || '';
        const words = currentFilter ? currentFilter.split(',') : [];
        const index = words.indexOf(word);
        if (index > -1) {
          words.splice(index, 1);
        }
        const newFilter = words.join(',');

        database.query(
          'INSERT OR REPLACE INTO chat_settings (peer_id, filter) VALUES (?, ?)',
          [peerId, newFilter],
          async (err) => {
            if (err) return context.reply('⛔ Ошибка');
            context.reply(`✅ Фильтр удалён\n\n${word}`);
          }
        );
      }
    );
  }
};
