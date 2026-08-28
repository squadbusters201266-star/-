const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/getvig',
  aliases: [],
  description: 'Информация о виге',
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

    if (!targetId) return context.reply('📖 /getvig @user');

    database.get(
      'SELECT * FROM vigs WHERE peer_id = ? AND user_id = ?',
      [peerId, targetId],
      async (err, row) => {
        if (!row) return context.reply('⛔ Не в виге');

        const targetLink = await getlink(row.user_id);
        const adminLink = await getlink(row.admin_id);
        const until = new Date(row.until * 1000).toLocaleString('ru-RU');

        context.reply(`📋 Виг\n\n${targetLink}\nДо: ${until}\nПричина: ${row.reason}\nАдмин: ${adminLink}`);
      }
    );
  }
};
