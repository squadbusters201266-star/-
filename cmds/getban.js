const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/getban',
  aliases: [],
  description: 'Информация о бане',
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

    if (!targetId) return context.reply('📖 /getban @user');

    database.get(
      'SELECT * FROM bans WHERE peer_id = ? AND user_id = ?',
      [peerId, targetId],
      async (err, row) => {
        if (!row) return context.reply('⛔ Не забанен');

        const targetLink = await getlink(row.user_id);
        const adminLink = await getlink(row.admin_id);
        const until = row.until > 0 ? new Date(row.until * 1000).toLocaleString('ru-RU') : 'навсегда';

        context.reply(`📋 Бан\n\n${targetLink}\nДо: ${until}\nПричина: ${row.reason}\nАдмин: ${adminLink}`);
      }
    );
  }
};
