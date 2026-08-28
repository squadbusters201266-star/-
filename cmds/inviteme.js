const { getUserRole } = require('./roles.js');

module.exports = {
  command: '/inviteme',
  aliases: ['/пригласить'],
  description: 'Пригласить в беседу',
  async execute(context) {
    const { peerId, senderId, vk } = context;
    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return context.reply('⛔ Нужна роль Модератора (20+)');

    try {
      const link = await vk.api.messages.getInviteLink({
        peer_id: peerId,
        expire: 86400
      });
      context.reply(`Приглашение:\n\n${link.link}`);
    } catch (e) {
      context.reply(`⛔ Ошибка: ${e.message}`);
    }
  }
};
