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
  command: '/removepull',
  aliases: ['/выйтиизпулла'],
  description: 'Выйти из пулла',
  async execute(context) {
    const { peerId, senderId } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) return context.reply('⛔ Нужна роль Владельца (100)');

    const pulls = fs.readdirSync(PULLS_DIR).filter(f => f.endsWith('.json')).map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(PULLS_DIR, f), 'utf8')); } catch { return null; }
    }).filter(p => p && p.chats.includes(peerId));

    if (pulls.length === 0) return context.reply('⛔ Вы не в пулле');

    for (const pull of pulls) {
      pull.chats = pull.chats.filter(c => c !== peerId);
      savePullConfig(pull.id, pull);
    }

    if (context.logAction) context.logAction('/removepull', senderId);
    context.reply('✅ Вышли из пулла');
  }
};
