const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/правила',
  aliases: ['/rules'],
  description: 'Правила чата',
  async execute(context) {
    const { peerId, senderId, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);

    if (parts[1] && userRole >= 80) {
      const rulesText = parts.slice(1).join(' ');
      database.query(
        'INSERT OR REPLACE INTO chat_settings (peer_id, rules) VALUES (?, ?)',
        [peerId, rulesText],
        async (err) => {
          if (err) return context.reply('⛔ Ошибка');
          context.reply(`✅ Правила установлены\n\n${rulesText}`);
        }
      );
      return;
    }

    database.get(
      'SELECT rules FROM chat_settings WHERE peer_id = ?',
      [peerId],
      async (err, row) => {
        if (!row || !row.rules) {
          return context.reply('📋 Правила чата не установлены');
        }
        context.reply(`📋 Правила чата:\n\n${row.rules}`);
      }
    );
  }
};
