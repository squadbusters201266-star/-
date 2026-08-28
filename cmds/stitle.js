const { getUserRole } = require('./roles.js');
const { getlink } = require('../util.js');

module.exports = {
  command: '/stitle',
  aliases: ['/звание'],
  description: 'Установить название чата',
  async execute(context) {
    const { peerId, senderId, text, vk } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 40) return context.reply('⛔ Нужна роль Администратора (40+)');

    const title = parts.slice(1).join(' ');
    if (!title) return context.reply('📖 /stitle [название]');

    try {
      await vk.api.messages.edit({
        peer_id: peerId,
        title: title
      });
      if (context.logAction) context.logAction('/stitle', senderId, title);
      context.reply(`✅ Название изменено\n\n${title}`);
    } catch (e) {
      context.reply(`⛔ Ошибка: ${e.message}`);
    }
  }
};
