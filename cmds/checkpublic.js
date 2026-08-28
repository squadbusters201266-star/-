const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/checkpublic',
  aliases: [],
  description: 'Проверить паблик',
  async execute(context) {
    const { peerId, senderId } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) return context.reply('⛔ Нужна роль Владельца (100)');

    database.get(
      'SELECT public_id FROM publics WHERE peer_id = ?',
      [peerId],
      async (err, row) => {
        if (!row) return context.reply('⛔ Паблик не установлен');
        context.reply(`Паблик: club${row.public_id}`);
      }
    );
  }
};
