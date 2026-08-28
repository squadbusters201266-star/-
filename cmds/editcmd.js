const { getUserRole } = require('./roles.js');
const database = require('../databases.js');

const DEFAULT_PRIORITIES = {
  '/kick': 20,
  '/ban': 20,
  '/unban': 20,
  '/banlist': 20,
  '/getban': 20,
  '/warn': 20,
  '/unwarn': 20,
  '/getwarn': 20,
  '/warnlist': 20,
  '/staff': 20,
  '/clearchat': 20,
  '/mute': 20,
  '/unmute': 20,
  '/online': 20,
  '/stats': 20,
  '/reg': 0,
  '/addmoder': 80,
  '/removerole': 80,
  '/правила': 60,
  '/приветствие': 60,
  '/silence': 60,
  '/vig': 60,
  '/unvig': 60,
  '/getvig': 60,
  '/viglist': 60,
  '/setnick': 60,
  '/rnick': 60,
  '/getnick': 60,
  '/nicklist': 60,
  '/nonicks': 60,
  '/getbynick': 60,
  '/inactive': 60,
  '/clear': 60,
  '/addadmin': 80,
  '/stitle': 40,
  '/rtitle': 40,
  '/filter': 40,
  '/rfilter': 40,
  '/flist': 40,
  '/logs': 40,
  '/mention': 40,
  '/mentionlist': 40,
  '/rkick': 40,
  '/addspec': 100,
  '/роль': 100,
  '/demote': 100,
  '/settings': 100,
  '/setpublic': 100,
  '/removepublic': 100,
  '/checkpublic': 100,
  '/mtop': 100,
  '/editowner': 100,
  '/editcmd': 100
};

module.exports = {
  command: '/editcmd',
  aliases: ['/изменитькоманду'],
  description: 'Настроить права команды',
  async execute(context) {
    const { peerId, senderId, text } = context;
    const parts = text.trim().split(/\s+/);

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) return context.reply('⛔ Нужна роль Владельца (100)');

    if (parts.length < 3) {
      let msg = `⚙️ /editcmd [команда] [приоритет]\n\n`;
      msg += `Доступные приоритеты:\n`;
      msg += `0 — Участник\n`;
      msg += `20 — Модератор\n`;
      msg += `40 — Администратор\n`;
      msg += `60 — Ст. Администратор\n`;
      msg += `80 — Руководитель\n`;
      msg += `100 — Владелец\n\n`;
      msg += `Пример: /editcmd /kick 40`;
      return context.reply(msg);
    }

    const cmd = parts[1].toLowerCase();
    const priority = parseInt(parts[2]);

    if (!DEFAULT_PRIORITIES[cmd]) {
      return context.reply('⛔ Неизвестная команда');
    }

    if (isNaN(priority) || priority < 0 || priority > 100) {
      return context.reply('⛔ Приоритет 0-100');
    }

    database.query(
      'INSERT OR REPLACE INTO command_priorities (peer_id, command, priority) VALUES (?, ?, ?)',
      [peerId, cmd, priority],
      async (err) => {
        if (err) return context.reply('⛔ Ошибка');
        if (context.logAction) context.logAction('/editcmd', senderId, `${cmd} → ${priority}`);
        context.reply(`✅ Приоритет изменён\n\n${cmd} → ${priority}`);
      }
    );
  }
};
