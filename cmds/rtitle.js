const { getUserRole } = require('./roles.js');

module.exports = {
  command: '/rtitle',
  aliases: [],
  description: 'Сбросить название чата',
  async execute(context) {
    const { peerId, senderId, vk } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 40) return context.reply('⛔ Нужна роль Администратора (40+)');

    try {
      await vk.api.messages.edit({
        peer_id: peerId,
        title: 'Беседа'
      });
      if (context.logAction) context.logAction('/rtitle', senderId);
      context.reply('✅ Название сброшено');
    } catch (e) {
      context.reply(`⛔ Ошибка: ${e.message}`);
    }
  }
};
