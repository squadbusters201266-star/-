const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/unvig',
  aliases: [],
  description: 'Снять виг',
  async execute(context) {
    const { peerId, senderId, replyMessage, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 60) return context.reply('⛔ Нужна роль Ст. Администратора (60+)');

    let targetId = null;
    if (replyMessage) {
      targetId = replyMessage.senderId;
    } else if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
    }

    if (!targetId) return context.reply('📖 /unvig @user');

    database.query(
      'DELETE FROM vigs WHERE peer_id = ? AND user_id = ?',
      [peerId, targetId],
      async (err) => {
        if (err) return context.reply(`⛔ Ошибка: ${err.message}`);

        const targetLink = await getlink(targetId);
        const adminLink = await getlink(senderId);
        if (context.logAction) context.logAction('/unvig', targetId);
        context.reply(`✅ Виг снят\n\n${targetLink}\nАдмин: ${adminLink}`);
      }
    );
  }
};
