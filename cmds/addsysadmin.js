const { checkSysAccess } = require('./sysadmin.js');
const { extractNumericId } = require('./ban.js');
const database = require('../databases.js');

module.exports = {
  command: '/addsysadmin',
  aliases: ['/sysadmin'],
  description: 'Добавить sys админа',
  async execute(context) {
    const { text } = context;
    const parts = text.trim().split(/\s+/);

    const senderAccess = await checkSysAccess(context.senderId || context.userId);
    if (senderAccess < 3) return;

    let targetId = null;
    let level = 1;

    if (parts[1]) {
      targetId = await extractNumericId(parts[1]);
    }

    if (parts[2]) {
      level = parseInt(parts[2]) || 1;
    }

    if (!targetId || level < 1 || level > 3) {
      return context.reply('📖 /addsysadmin @user [1-3]\n\n1 - Агент\n2 - Предуправляющий\n3 - Архитектор');
    }

    database.query('INSERT OR REPLACE INTO sysadmins (userid, access) VALUES (?, ?)', [targetId, level]);
    context.reply(`✅ Sys админ добавлен\n\nID: ${targetId}\nУровень: ${level}`);
  }
};
