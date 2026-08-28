const { getUserRole, getRoleName } = require('./roles.js');
const { getlink } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/staff',
  aliases: ['/персонал'],
  description: 'Список персонала',
  async execute(context) {
    const { peerId, senderId } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return context.reply('⛔ Нужна роль Модератора (20+)');

    database.all(
      'SELECT user_id, role_id FROM roles WHERE peer_id = ? AND role_id > 0 ORDER BY role_id DESC',
      [peerId],
      async (err, rows) => {
        if (!rows || rows.length === 0) return context.reply('— Персонала нет');

        const groups = {
          100: { name: 'Основатель:', users: [] },
          80: { name: 'Руководитель:', users: [] },
          60: { name: 'Ст. Администраторы:', users: [] },
          40: { name: 'Администраторы:', users: [] },
          20: { name: 'Модераторы:', users: [] }
        };

        for (const row of rows) {
          const userLink = await getlink(row.user_id);
          if (groups[row.role_id]) {
            groups[row.role_id].users.push(userLink);
          }
        }

        let msg = '';
        for (const [level, group] of Object.entries(groups)) {
          if (group.users.length > 0) {
            msg += `${group.name}\n`;
            msg += `— ${group.users.join('\n— ')}\n\n`;
          }
        }

        context.reply(msg.trim());
      }
    );
  }
};
