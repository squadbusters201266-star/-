const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/mentionlist',
  aliases: [],
  description: 'Список упоминаний',
  async execute(context) {
    const { peerId, senderId, vk } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 40) return context.reply('⛔ Нужна роль Администратора (40+)');

    database.all(
      'SELECT user_id, enabled FROM mentions WHERE peer_id = ?',
      [peerId],
      async (err, rows) => {
        if (!rows || rows.length === 0) return context.reply('— Список пуст');

        const userIds = rows.map(r => r.user_id);
        let userNames = {};
        try {
          const users = await vk.api.users.get({ user_ids: userIds.join(',') });
          for (const user of users) {
            userNames[user.id] = `${user.first_name} ${user.last_name}`;
          }
        } catch {}

        let msg = `Упоминания:\n\n`;
        for (const row of rows) {
          const status = row.enabled ? '✅' : '❌';
          const name = userNames[row.user_id] || `id${row.user_id}`;
          msg += `• ${status} [id${row.user_id}|${name}]\n`;
        }
        context.reply(msg);
      }
    );
  }
};
