const { checkSysAccess, SYS_ACCESS } = require('./sysadmin.js');
const { getlink } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/sysadmins',
  aliases: [],
  description: 'Список sys админов',
  async execute(context) {
    const senderAccess = await checkSysAccess(context.senderId || context.userId);
    if (senderAccess < 1) return;

    database.all('SELECT userid, access FROM sysadmins', [], async (err, rows) => {
      if (!rows || rows.length === 0) return context.reply('— Sys админов нет');

      let msg = '👥 Sys администраторы:\n\n';
      for (const row of rows) {
        const link = await getlink(row.userid);
        msg += `• ${link} — ${SYS_ACCESS[row.access] || row.access}\n`;
      }
      context.reply(msg);
    });
  }
};
