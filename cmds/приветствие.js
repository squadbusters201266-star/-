const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/приветствие',
  aliases: ['/welcome'],
  description: 'Приветствие',
  async execute(context) {
    const { peerId, senderId, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);

    if (parts[1] && userRole >= 60) {
      const welcomeText = parts.slice(1).join(' ');
      database.query(
        'INSERT OR REPLACE INTO chat_settings (peer_id, welcome) VALUES (?, ?)',
        [peerId, welcomeText],
        async (err) => {
          if (err) return context.reply('⛔ Ошибка');
          context.reply(`✅ Приветствие установлено\n\n${welcomeText}`);
        }
      );
      return;
    }

    database.get(
      'SELECT welcome FROM chat_settings WHERE peer_id = ?',
      [peerId],
      async (err, row) => {
        if (!row || !row.welcome) {
          return context.reply('👋 Приветствие не установлено');
        }
        context.reply(`👋 Приветствие:\n\n${row.welcome}`);
      }
    );
  }
};
