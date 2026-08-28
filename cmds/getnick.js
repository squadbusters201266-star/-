const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/getnick',
  aliases: [],
  description: 'Узнать никнейм',
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

    if (!targetId) return context.reply('📖 /getnick @user');

    database.get(
      'SELECT nick FROM nicks WHERE peer_id = ? AND user_id = ?',
      [peerId, targetId],
      async (err, row) => {
        if (!row) return context.reply('⛔ Ника нет');

        const targetLink = await getlink(targetId);
        context.reply(`📌 Ник\n\n${targetLink}\n${row.nick}`);
      }
    );
  }
};
