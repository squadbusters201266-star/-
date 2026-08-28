const { checkSysAccess } = require('./sysadmin.js');
const { extractNumericId } = require('./ban.js');
const database = require('../databases.js');

module.exports = {
  command: '/delsysadmin',
  aliases: [],
  description: 'Удалить sys админа',
  async execute(context) {
    const { text } = context;
    const parts = text.trim().split(/\s+/);

    const senderAccess = await checkSysAccess(context.senderId || context.userId);
    if (senderAccess < 3) return;

    let targetId = null;
    if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
    }

    if (!targetId) {
      return context.reply('📖 /delsysadmin @user');
    }

    database.query('DELETE FROM sysadmins WHERE userid = ?', [targetId]);
    context.reply(`✅ Sys админ удалён\n\nID: ${targetId}`);
  }
};
