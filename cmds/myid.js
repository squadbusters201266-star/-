module.exports = {
  command: '/myid',
  aliases: ['/мойid'],
  description: 'Показать мой ID',
  async execute(context) {
    const { senderId } = context;
    context.reply(`🆔 Ваш ID: ${senderId}`);
  }
};
