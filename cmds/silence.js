const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/silence',
  aliases: ['/тишина'],
  description: 'Режим тишины',
  async execute(context) {
    const { peerId, senderId, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 60) return context.reply('⛔ Нужна роль Ст. Администратора (60+)');

    if (parts[1] && parts[1].toLowerCase() === 'off') {
      database.query(
        'UPDATE chat_settings SET silence_until = 0 WHERE peer_id = ?',
        [peerId],
        async (err) => {
          if (err) return context.reply('⛔ Ошибка');
          if (context.logAction) context.logAction('/silence', senderId, 'Выключен');
          context.reply('✅ Режим тишины выключен');
        }
      );
      return;
    }

    const minutes = parseInt(parts[1]) || 10;
    const until = Math.floor(Date.now() / 1000) + (minutes * 60);

    database.query(
      'UPDATE chat_settings SET silence_until = ? WHERE peer_id = ?',
      [until, peerId],
      async (err) => {
        if (err) return context.reply('⛔ Ошибка');
        if (context.logAction) context.logAction('/silence', senderId, `${minutes} мин`);
        context.reply(`🔇 Режим тишины включён на ${minutes} мин`);
      }
    );
  }
};
