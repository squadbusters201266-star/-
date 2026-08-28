const database = require('../databases.js');
const { getlink } = require('../util.js');

module.exports = {
  command: '/reg',
  aliases: ['/регистрация'],
  description: 'Регистрация пользователя',
  async execute(context) {
    const { peerId, senderId, vk } = context;

    database.get(
      'SELECT role_id FROM roles WHERE peer_id = ? AND user_id = ?',
      [peerId, senderId],
      async (err, row) => {
        if (row && row.role_id > 0) {
          return context.reply('⛔ Вы уже зарегистрированы');
        }

        database.query(
          'INSERT OR IGNORE INTO roles (peer_id, user_id, role_id) VALUES (?, ?, 0)',
          [peerId, senderId],
          async (err) => {
            if (err) return context.reply('⛔ Ошибка');

            const userLink = await getlink(senderId);
            context.reply(`✅ Регистрация заверена\n\n👤 ${userLink}\n🆔 ${senderId}`);
          }
        );
      }
    );
  }
};
