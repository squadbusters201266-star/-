const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/setpublic',
  aliases: [],
  description: 'Установить паблик для репортов',
  async execute(context) {
    const { peerId, senderId, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) return context.reply('⛔ Нужна роль Владельца (100)');

    const publicId = parts[1]?.replace('club', '').replace('vk.com/', '');
    if (!publicId) return context.reply('📖 /setpublic [club_id]');

    database.query(
      'INSERT OR REPLACE INTO publics (peer_id, public_id) VALUES (?, ?)',
      [peerId, publicId],
      async (err) => {
        if (err) return context.reply('⛔ Ошибка');
        if (context.logAction) context.logAction('/setpublic', senderId, publicId);
        context.reply(`✅ Паблик установлен\n\nclub${publicId}`);
      }
    );
  }
};
