const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/unwarn',
  aliases: ['/разварн'],
  description: 'Снять предупреждение',
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

    if (!targetId) return context.reply('📖 /unwarn @user');

    database.query(
      'DELETE FROM warns WHERE id = (SELECT id FROM warns WHERE peer_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1)',
      [peerId, targetId],
      async (err) => {
        if (err) return context.reply(`⛔ Ошибка: ${err.message}`);

        const targetLink = await getlink(targetId);
        const adminLink = await getlink(senderId);
        context.reply(`✅ Предупреждение снято\n\n${targetLink}\nАдмин: ${adminLink}`);
      }
    );
  }
};
