const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/inactive',
  aliases: ['/неактив'],
  description: 'Неактивные участники',
  async execute(context) {
    const { peerId, senderId, vk } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return context.reply('⛔ Нужна роль Модератора (20+)');

    try {
      const members = await vk.api.messages.getConversationMembers({ peer_id: peerId });
      const now = Math.floor(Date.now() / 1000);
      const sevenDays = 7 * 86400;

      let inactiveIds = [];
      for (const member of members.items) {
        const lastSeen = member.last_seen || 0;
        if (lastSeen > 0 && (now - lastSeen) > sevenDays) {
          inactiveIds.push({ id: member.member_id, lastSeen });
        }
      }

      if (inactiveIds.length === 0) return context.reply('✅ Все активны');

      let userNames = {};
      try {
        const ids = inactiveIds.map(i => i.id);
        const users = await vk.api.users.get({ user_ids: ids.join(',') });
        for (const user of users) {
          userNames[user.id] = `${user.first_name} ${user.last_name}`;
        }
      } catch {}

      let inactive = inactiveIds.map(i => ({
        id: i.id,
        name: userNames[i.id] || `id${i.id}`,
        days: Math.floor((now - i.lastSeen) / 86400)
      }));

      inactive.sort((a, b) => b.days - a.days);

      let msg = `Неактивные (${inactive.length}):\n\n`;
      for (const u of inactive.slice(0, 20)) {
        msg += `• [id${u.id}|${u.name}] — ${u.days} дн.\n`;
      }
      if (inactive.length > 20) msg += `\n...и ещё ${inactive.length - 20}`;

      context.reply(msg);
    } catch (e) {
      context.reply(`⛔ Ошибка: ${e.message}`);
    }
  }
};
