const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/mtop',
  aliases: ['/топ'],
  description: 'Топ по сообщениям',
  async execute(context) {
    const { peerId, senderId, vk } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return context.reply('⛔ Нужна роль Модератора (20+)');

    database.all(
      'SELECT user_id, messages FROM stats WHERE peer_id = ? ORDER BY messages DESC LIMIT 20',
      [peerId],
      async (err, rows) => {
        if (!rows || rows.length === 0) return context.reply('— Нет данных');

        const userIds = rows.map(r => r.user_id);
        let userNames = {};
        try {
          const users = await vk.api.users.get({ user_ids: userIds.join(',') });
          for (const user of users) {
            userNames[user.id] = `${user.first_name} ${user.last_name}`;
          }
        } catch {}

        let msg = `Топ сообщений:\n\n`;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const name = userNames[row.user_id] || `id${row.user_id}`;
          msg += `${i + 1}. [id${row.user_id}|${name}] — ${row.messages}\n`;
        }
        context.reply(msg);
      }
    );
  }
};
