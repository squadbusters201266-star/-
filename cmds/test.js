const database = require('../databases.js');

module.exports = {
  command: '/test',
  aliases: [],
  description: 'Тестовая команда',
  async execute(context) {
    context.reply('✅ Бот работает');
  }
};
