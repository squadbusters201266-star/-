const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/getwarn',
  aliases: [],
  description: 'Информация о предупреждениях',
  async execute(context) {
    const { peerId, senderId, replyMessage, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return;

    let targetId = null;
    if (replyMessage) {
      targetId = replyMessage.senderId;
    } else if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
    }

    if (!targetId) return context.reply('📖 /getwarn @user');

    database.all(
      'SELECT * FROM warns WHERE peer_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 10',
      [peerId, targetId],
      async (err, rows) => {
        if (!rows || rows.length === 0) return context.reply('— Предупреждений нет');

        const targetLink = await getlink(targetId);
        let msg = `⚠️ Предупреждения ${targetLink} (${rows.length}):\n\n`;
        for (const row of rows) {
          const date = new Date(row.created_at * 1000).toLocaleString('ru-RU');
          msg += `• ${date} — ${row.reason}\n`;
        }
        context.reply(msg);
      }
    );
  }
};
