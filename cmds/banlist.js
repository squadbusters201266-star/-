const { getUserRole } = require('./roles.js');
const { getlink } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/banlist',
  aliases: ['/банлист'],
  description: 'Список заблокированных',
  async execute(context) {
    const { peerId, senderId } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return;

    database.all(
      'SELECT * FROM bans WHERE peer_id = ? ORDER BY rowid DESC LIMIT 20',
      [peerId],
      async (err, rows) => {
        if (err) return context.reply('⛔ Ошибка');
        if (!rows || rows.length === 0) return context.reply('— Забаненных нет');

        let msg = `📋 Забаненные (${rows.length}):\n\n`;
        for (const row of rows) {
          const targetLink = await getlink(row.user_id);
          const until = row.until > 0 ? new Date(row.until * 1000).toLocaleDateString('ru-RU') : 'навсегда';
          msg += `• ${targetLink} — до ${until}\n  Причина: ${row.reason}\n`;
        }
        context.reply(msg);
      }
    );
  }
};
