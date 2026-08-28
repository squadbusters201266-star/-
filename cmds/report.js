const { getUserRole } = require('./roles.js');
const { getlink } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/report',
  aliases: ['/репорт', '/жалоба'],
  description: 'Отправить репорт',
  async execute(context) {
    const { peerId, senderId, text, vk } = context;
    const parts = text.trim().split(/\s+/);

    const reportText = parts.slice(1).join(' ');
    if (!reportText) return context.reply('📖 /report [текст]');

    const senderLink = await getlink(senderId);

    database.get(
      'SELECT public_id FROM publics WHERE peer_id = ?',
      [peerId],
      async (err, row) => {
        if (row) {
          try {
            await vk.api.wall.post({
              owner_id: -parseInt(row.public_id),
              message: `📢 Репорт\n\nОт: ${senderLink}\n\n${reportText}`
            });
            context.reply('✅ Репорт отправлен');
          } catch {
            context.reply('⛔ Не удалось отправить репорт');
          }
        } else {
          context.reply('📢 Репорт\n\n' + reportText + '\n\nОт: ' + senderLink);
        }
      }
    );
  }
};
