module.exports = {
  command: '/chatid',
  aliases: ['/id', '/айди'],
  description: 'Показать ID чата',
  async execute(context) {
    const { peerId } = context;
    const chatId = peerId - 2000000000;
    context.reply(`🆔 ID беседы: ${chatId}\npeer_id: ${peerId}`);
  }
};
