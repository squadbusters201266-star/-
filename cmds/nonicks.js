const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/nonicks',
  aliases: [],
  description: 'Пользователи без ников',
  async execute(context) {
    const { peerId, senderId, vk } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 60) return context.reply('⛔ Нужна роль Ст. Администратора (60+)');

    try {
      const members = await vk.api.messages.getConversationMembers({ peer_id: peerId });
      const nickedUsers = await new Promise((resolve) => {
        database.all(
          'SELECT user_id FROM nicks WHERE peer_id = ?',
          [peerId],
          (err, rows) => resolve(rows ? rows.map(r => r.user_id) : [])
        );
      });

      const noNick = members.items.filter(m => !nickedUsers.includes(m.member_id));

      if (noNick.length === 0) return context.reply('✅ У всех есть ники');

      const noNickIds = noNick.map(m => m.member_id);
      let userNames = {};
      try {
        const users = await vk.api.users.get({ user_ids: noNickIds.join(',') });
        for (const user of users) {
          userNames[user.id] = `${user.first_name} ${user.last_name}`;
        }
      } catch {}

      let msg = `Без ников (${noNick.length}):\n\n`;
      for (const member of noNick.slice(0, 20)) {
        const name = userNames[member.member_id] || `id${member.member_id}`;
        msg += `• [id${member.member_id}|${name}]\n`;
      }
      if (noNick.length > 20) msg += `\n...и ещё ${noNick.length - 20}`;

      context.reply(msg);
    } catch (e) {
      context.reply(`⛔ Ошибка: ${e.message}`);
    }
  }
};
