const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

module.exports = {
  command: '/removepublic',
  aliases: [],
  description: 'Удалить паблик',
  async execute(context) {
    const { peerId, senderId } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) return context.reply('⛔ Нужна роль Владельца (100)');

    database.query(
      'DELETE FROM publics WHERE peer_id = ?',
      [peerId],
      async (err) => {
        if (err) return context.reply('⛔ Ошибка');
        if (context.logAction) context.logAction('/removepublic', senderId);
        context.reply('✅ Паблик удалён');
      }
    );
  }
};
