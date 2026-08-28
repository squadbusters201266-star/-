const { getUserRole, setUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');

module.exports = {
  command: '/addspec',
  aliases: ['/спец'],
  description: 'Выдать ст. администратора',
  async execute(context) {
    const { peerId, senderId, replyMessage, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) return context.reply('⛔ Нужна роль Владельца (100)');

    let targetId = null;
    if (replyMessage) {
      targetId = replyMessage.senderId;
    } else if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
    }

    if (!targetId) return context.reply('📖 /addspec @user');

    const targetRole = await getUserRole(peerId, targetId);
    if (userRole <= targetRole) return context.reply('⛔ Нельзя выдать роль выше или равную своей');

    await setUserRole(peerId, targetId, 60);
    const targetLink = await getlink(targetId);
    if (context.logAction) context.logAction('/addspec', targetId);
    context.reply(`✅ Ст. Администратор выдан\n\n${targetLink}`);
  }
};
