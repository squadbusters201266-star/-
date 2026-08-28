const { getUserRole } = require('./roles.js');
const database = require('../databases.js');
const { getlink } = require('../util.js');

module.exports = {
  command: '/logs',
  aliases: ['/логи'],
  description: 'Логи действий',
  async execute(context) {
    const { peerId, senderId, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return;

    const limit = parseInt(parts[1]) || 20;

    database.all(
      'SELECT * FROM logs WHERE peer_id = ? ORDER BY timestamp DESC LIMIT ?',
      [peerId, limit],
      async (err, rows) => {
        if (!rows || rows.length === 0) return context.reply('— Логов нет');

        let msg = `📋 Логи (${rows.length}):\n\n`;
        for (const row of rows) {
          const adminLink = await getlink(row.admin_id);
          const targetLink = await getlink(row.target_id);
          const date = new Date(row.timestamp * 1000).toLocaleString('ru-RU');
          msg += `• ${date} — ${row.action}\n  ${adminLink} → ${targetLink}\n`;
        }
        context.reply(msg);
      }
    );
  }
};
