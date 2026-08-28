const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/nicklist',
  aliases: [],
  description: 'Список никнеймов',
  async execute(context) {
    const { peerId, senderId, vk } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 60) return context.reply('⛔ Нужна роль Ст. Администратора (60+)');

    database.all(
      'SELECT user_id, nick FROM nicks WHERE peer_id = ? ORDER BY nick ASC LIMIT 50',
      [peerId],
      async (err, rows) => {
        if (!rows || rows.length === 0) return context.reply('— Никнеймов нет');

        const userIds = rows.map(r => r.user_id);
        let userNames = {};
        try {
          const users = await vk.api.users.get({ user_ids: userIds.join(',') });
          for (const user of users) {
            userNames[user.id] = `${user.first_name} ${user.last_name}`;
          }
        } catch {}

        let msg = `Никнеймы (${rows.length}):\n\n`;
        for (const row of rows) {
          const name = userNames[row.user_id] || `id${row.user_id}`;
          msg += `• [id${row.user_id}|${name}] — ${row.nick}\n`;
        }
        context.reply(msg);
      }
    );
  }
};
