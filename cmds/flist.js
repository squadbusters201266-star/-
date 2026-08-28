const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/flist',
  aliases: [],
  description: 'Список фильтров',
  async execute(context) {
    const { peerId, senderId } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return;

    database.get(
      'SELECT filter FROM chat_settings WHERE peer_id = ?',
      [peerId],
      (err, row) => {
        const words = row?.filter ? row.filter.split(',').filter(w => w) : [];
        if (words.length === 0) return context.reply('— Фильтров нет');

        let msg = `🚫 Фильтры (${words.length}):\n\n`;
        msg += words.map(w => `• ${w}`).join('\n');
        context.reply(msg);
      }
    );
  }
};
