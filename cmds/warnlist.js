const { getUserRole } = require('./roles.js');
const { getlink } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/warnlist',
  aliases: ['/варнлист'],
  description: 'Список предупреждений',
  async execute(context) {
    const { peerId, senderId, vk } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return context.reply('⛔ Нужна роль Модератора (20+)');

    database.all(
      `SELECT user_id, COUNT(*) as count FROM warns WHERE peer_id = ? GROUP BY user_id ORDER BY count DESC LIMIT 20`,
      [peerId],
      async (err, rows) => {
        if (!rows || rows.length === 0) return context.reply('— Предупреждений нет');

        const userIds = rows.map(r => r.user_id);
        let userNames = {};
        try {
          const users = await vk.api.users.get({ user_ids: userIds.join(',') });
          for (const user of users) {
            userNames[user.id] = `${user.first_name} ${user.last_name}`;
          }
        } catch {}

        let msg = `Предупреждения:\n\n`;
        for (const row of rows) {
          const name = userNames[row.user_id] || `id${row.user_id}`;
          msg += `• [id${row.user_id}|${name}] — ${row.count}/3\n`;
        }
        context.reply(msg);
      }
    );
  }
};
