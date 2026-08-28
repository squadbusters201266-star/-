const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/online',
  aliases: ['/онлайн'],
  description: 'Кто онлайн',
  async execute(context) {
    const { peerId, senderId, vk } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return context.reply('⛔ Нужна роль Модератора (20+)');

    try {
      const members = await vk.api.messages.getConversationMembers({
        peer_id: peerId,
        fields: 'online'
      });

      const memberIds = members.items.map(m => m.member_id);
      const onlineMembers = members.items.filter(m => m.online);
      const offlineMembers = members.items.filter(m => !m.online);

      let userNames = {};
      try {
        const users = await vk.api.users.get({ user_ids: memberIds.join(','), fields: 'photo_50' });
        for (const user of users) {
          userNames[user.id] = `${user.first_name} ${user.last_name}`;
        }
      } catch {}

      let online = [];
      let offline = [];

      for (const member of onlineMembers) {
        const name = userNames[member.member_id] || `id${member.member_id}`;
        online.push(`🟢 [id${member.member_id}|${name}]`);
      }

      for (const member of offlineMembers) {
        const name = userNames[member.member_id] || `id${member.member_id}`;
        offline.push(`⚫ [id${member.member_id}|${name}]`);
      }

      let msg = `🟢 Онлайн (${online.length}):\n`;
      msg += online.join('\n') || '— Никого\n';
      msg += `\n⚫ Оффлайн (${offline.length}):\n`;
      msg += offline.join('\n') || '— Никого';

      context.reply(msg);
    } catch (e) {
      context.reply(`⛔ Ошибка: ${e.message}`);
    }
  }
};
