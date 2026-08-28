const { getUserRole } = require('./roles.js');
const { getlink } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/viglist',
  aliases: [],
  description: 'Список вигов',
  async execute(context) {
    const { peerId, senderId } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return;

    database.all(
      'SELECT * FROM vigs WHERE peer_id = ? ORDER BY rowid DESC LIMIT 20',
      [peerId],
      async (err, rows) => {
        if (!rows || rows.length === 0) return context.reply('— Вигов нет');

        let msg = `📋 Виги (${rows.length}):\n\n`;
        for (const row of rows) {
          const targetLink = await getlink(row.user_id);
          const until = new Date(row.until * 1000).toLocaleString('ru-RU');
          msg += `• ${targetLink} — до ${until}\n  Причина: ${row.reason}\n`;
        }
        context.reply(msg);
      }
    );
  }
};
