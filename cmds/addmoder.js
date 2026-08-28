const { getUserRole, setUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');

module.exports = {
  command: '/addmoder',
  aliases: ['/модер'],
  description: 'Выдать модератора',
  async execute(context) {
    const { peerId, senderId, replyMessage, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 80) return context.reply('⛔ Нужна роль Руководителя (80+)');

    let targetId = null;
    if (replyMessage) {
      targetId = replyMessage.senderId;
    } else if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
    }

    if (!targetId) return context.reply('📖 /addmoder @user');

    const targetRole = await getUserRole(peerId, targetId);
    if (userRole <= targetRole) return context.reply('⛔ Нельзя выдать роль выше или равную своей');

    await setUserRole(peerId, targetId, 20);
    const targetLink = await getlink(targetId);
    if (context.logAction) context.logAction('/addmoder', targetId);
    context.reply(`✅ Модератор выдан\n\n${targetLink}`);
  }
};
