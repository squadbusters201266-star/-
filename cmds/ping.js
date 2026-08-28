module.exports = {
  command: '/ping',
  aliases: ['/пинг'],
  description: 'Проверить работу бота',
  async execute(context) {
    const start = Date.now();
    context.reply('🏓 Понг...').then(() => {
      const time = Date.now() - start;
      context.send(`🏓 Понг!\n⏱ ${time}мс`);
    });
  }
};
