const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/getbynick',
  aliases: [],
  description: 'Найти пользователя по нику',
  async execute(context) {
    const { peerId, senderId, text, vk } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 60) return context.reply('⛔ Нужна роль Ст. Администратора (60+)');

    if (!parts[1]) return context.reply('📖 /getbynick [ник]');

    const nick = parts.slice(1).join(' ');

    database.all(
      'SELECT user_id FROM nicks WHERE peer_id = ? AND nick LIKE ?',
      [peerId, `%${nick}%`],
      async (err, rows) => {
        if (!rows || rows.length === 0) return context.reply('⛔ Не найдено');

        const userIds = rows.map(r => r.user_id);
        let userNames = {};
        try {
          const users = await vk.api.users.get({ user_ids: userIds.join(',') });
          for (const user of users) {
            userNames[user.id] = `${user.first_name} ${user.last_name}`;
          }
        } catch {}

        let msg = `Найдено (${rows.length}):\n\n`;
        for (const row of rows) {
          const name = userNames[row.user_id] || `id${row.user_id}`;
          msg += `• [id${row.user_id}|${name}]\n`;
        }
        context.reply(msg);
      }
    );
  }
};
