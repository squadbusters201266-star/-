const database = require('../databases.js');
const { getUserRole } = require('./roles.js');

const fs = require('fs');
const path = require('path');

const PULLS_DIR = path.join(__dirname, '../data/pulls');
if (!fs.existsSync(PULLS_DIR)) fs.mkdirSync(PULLS_DIR, { recursive: true });

function getPullConfig(pullId) {
  const file = path.join(PULLS_DIR, `${pullId}.json`);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function savePullConfig(pullId, config) {
  fs.writeFileSync(path.join(PULLS_DIR, `${pullId}.json`), JSON.stringify(config, null, 2));
}

module.exports = {
  command: '/newpull',
  aliases: ['/создатьпул'],
  description: 'Создать пулл',
  async execute(context) {
    const { peerId, senderId, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) return context.reply('⛔ Нужна роль Владельца (100)');

    if (!parts[1]) return context.reply('📖 /newpull [название]');

    const pullName = parts.slice(1).join(' ');
    const pullId = Date.now().toString(36);

    const config = {
      id: pullId,
      name: pullName,
      owner: peerId,
      chats: [peerId],
      created_at: Date.now()
    };

    savePullConfig(pullId, config);

    if (context.logAction) context.logAction('/newpull', senderId, pullName);
    context.reply(`✅ Пулл создан\n\n${pullName}\n${pullId}\n\nИспользуйте /pull ${pullId} для подключения`);
  }
};
