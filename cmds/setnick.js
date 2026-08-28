const { getUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/setnick',
  aliases: ['/ник'],
  description: 'Установить никнейм',
  async execute(context) {
    const { peerId, senderId, replyMessage, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return;

    let targetId = null;
    let nick = null;

    if (replyMessage) {
      targetId = replyMessage.senderId;
      nick = parts.slice(1).join(' ');
    } else if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
      nick = parts.slice(2).join(' ');
    }

    if (!targetId || !nick) return context.reply('📖 /setnick @user [ник]');

    database.query(
      'INSERT OR REPLACE INTO nicks (peer_id, user_id, nick) VALUES (?, ?, ?)',
      [peerId, targetId, nick],
      async (err) => {
        if (err) return context.reply(`⛔ Ошибка: ${err.message}`);

        const targetLink = await getlink(targetId);
        const adminLink = await getlink(senderId);
        context.reply(`✅ Ник установлен\n\n${targetLink}\nНик: ${nick}\nАдмин: ${adminLink}`);
      }
    );
  }
};
