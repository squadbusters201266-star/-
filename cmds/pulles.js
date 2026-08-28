const fs = require('fs');
const path = require('path');

const PULLS_DIR = path.join(__dirname, '../data/pulls');

function listPulls() {
  if (!fs.existsSync(PULLS_DIR)) return [];
  return fs.readdirSync(PULLS_DIR).filter(f => f.endsWith('.json')).map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(PULLS_DIR, f), 'utf8')); } catch { return null; }
  }).filter(Boolean);
}

module.exports = {
  command: '/pulles',
  aliases: ['/пулы'],
  description: 'Список пуллов',
  async execute(context) {
    const pulls = listPulls();
    if (pulls.length === 0) return context.reply('— Пуллов нет\n\n/newpull [название]');

    let msg = `📋 Пуллы (${pulls.length}):\n\n`;
    for (const pull of pulls) {
      msg += `• ${pull.name} — ${pull.chats.length} чатов\n`;
      msg += `  🆔 ${pull.id}\n`;
    }
    context.reply(msg);
  }
};
