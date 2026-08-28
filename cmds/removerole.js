const { getUserRole, setUserRole } = require('./roles.js');
const { getlink, extractNumericId } = require('../util.js');

module.exports = {
  command: '/removerole',
  aliases: ['/удалитьроль'],
  description: 'Снять роль',
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

    if (!targetId) return context.reply('📖 /removerole @user');

    const targetRole = await getUserRole(peerId, targetId);
    if (userRole <= targetRole) return context.reply('⛔ Нельзя снять роль пользователю с такой же или высшей ролью');

    await setUserRole(peerId, targetId, 0);
    const targetLink = await getlink(targetId);
    if (context.logAction) context.logAction('/removerole', targetId);
    context.reply(`✅ Роль снята\n\n${targetLink}`);
  }
};
