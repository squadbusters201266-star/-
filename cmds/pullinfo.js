const { getUserRole } = require('./roles.js');
const fs = require('fs');
const path = require('path');

const PULLS_DIR = path.join(__dirname, '../data/pulls');

function getPullConfig(pullId) {
  const file = path.join(PULLS_DIR, `${pullId}.json`);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

module.exports = {
  command: '/pullinfo',
  aliases: ['/пулинфо'],
  description: 'Информация о пулле',
  async execute(context) {
    const { peerId, senderId, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return;

    if (!parts[1]) {
      const pulls = fs.readdirSync(PULLS_DIR).filter(f => f.endsWith('.json')).map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(PULLS_DIR, f), 'utf8')); } catch { return null; }
      }).filter(p => p && p.chats.includes(peerId));

      if (pulls.length === 0) return context.reply('📖 /pullinfo [id_пулла]');

      const pull = pulls[0];
      return context.reply(`📋 Пулл: ${pull.name}\n💬 Чатов: ${pull.chats.length}\n🆔 ${pull.id}`);
    }

    const pullId = parts[1];
    const pull = getPullConfig(pullId);

    if (!pull) return context.reply('⛔ Пулл не найден');

    let msg = `📋 ${pull.name}\n\n`;
    msg += `🆔 ID: ${pull.id}\n`;
    msg += `💬 Чатов: ${pull.chats.length}\n\n`;
    msg += `Список чатов:\n`;
    for (const chatId of pull.chats) {
      msg += `• ${chatId}\n`;
    }

    context.reply(msg);
  }
};
