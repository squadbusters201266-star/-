const { getUserRole } = require('./roles.js');
const fs = require('fs');
const path = require('path');

const PULLS_DIR = path.join(__dirname, '../data/pulls');

function getPullConfig(pullId) {
  const file = path.join(PULLS_DIR, `${pullId}.json`);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function savePullConfig(pullId, config) {
  fs.writeFileSync(path.join(PULLS_DIR, `${pullId}.json`), JSON.stringify(config, null, 2));
}

module.exports = {
  command: '/pull',
  aliases: ['/пул'],
  description: 'Подключить чат к пуллу',
  async execute(context) {
    const { peerId, senderId, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) return context.reply('⛔ Нужна роль Владельца (100)');

    if (!parts[1]) return context.reply('📖 /pull [id_пулла]');

    const pullId = parts[1];
    const pull = getPullConfig(pullId);

    if (!pull) return context.reply('⛔ Пулл не найден');

    if (pull.chats.includes(peerId)) {
      return context.reply('⛔ Чата уже в пулле');
    }

    pull.chats.push(peerId);
    savePullConfig(pullId, pull);

    if (context.logAction) context.logAction('/pull', senderId, pullId);
    context.reply(`✅ Чата добавлен в пулл\n\n${pull.name}\nЧатов: ${pull.chats.length}`);
  }
};
