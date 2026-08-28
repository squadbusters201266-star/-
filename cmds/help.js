const { getUserRole, getRoleName, STANDARD_ROLES } = require('./roles.js');
const { getlink } = require('../util.js');

const roleEmojis = {
  0: '👤',
  20: '🛡️',
  40: '👑',
  60: '⚔️',
  80: '🔱',
  100: '💎'
};

module.exports = {
  command: '/help',
  aliases: ['/помощь', '/команды', '/h'],
  description: 'Показать список команд',
  async execute(context) {
    const { peerId, senderId, text } = context;
    const args = text.trim().split(/\s+/).slice(1);
    const query = args[0]?.toLowerCase();

    const userRole = await getUserRole(peerId, senderId);

    if (query) {
      const roleEntries = Object.entries(STANDARD_ROLES);
      const found = roleEntries.find(([id, name]) =>
        name.toLowerCase().includes(query) || id === query
      );

      if (found) {
        const [roleId, roleName] = found;
        const emoji = roleEmojis[roleId] || '📌';
        return context.reply(`${emoji} ${roleName} (уровень ${roleId})\n\nИспользуйте /help для полного списка`);
      }
    }

    const userRoleName = await getRoleName(peerId, userRole);
    const emoji = roleEmojis[userRole] || '👤';

    let msg = `📋 Conference Manager\n\n`;
    msg += `Ваша роль: ${emoji} ${userRoleName} (${userRole})\n\n`;

    msg += `🛡 Модератор:\n`;
    msg += `/kick — кикнуть\n`;
    msg += `/ban — заблокировать\n`;
    msg += `/unban — разблокировать\n`;
    msg += `/banlist — список банов\n`;
    msg += `/getban — инфо о бане\n`;
    msg += `/warn — предупреждение\n`;
    msg += `/unwarn — снять предупреждение\n`;
    msg += `/getwarn — инфо о варнах\n`;
    msg += `/warnlist — список варнов\n`;
    msg += `/staff — персонал\n`;
    msg += `/clearchat — очистка чата\n`;
    msg += `/mute — замутить\n`;
    msg += `/unmute — снять мут\n`;
    msg += `/online — кто онлайн\n`;
    msg += `/stats — статистика\n`;
    msg += `/reg — регистрация\n\n`;

    if (userRole >= 40) {
      msg += `✏ Администратор:\n`;
      msg += `/addadmin — выдать админа\n`;
      msg += `/stitle — название чата\n`;
      msg += `/rtitle — сброс названия\n`;
      msg += `/filter — фильтр слов\n`;
      msg += `/rfilter — удалить фильтр\n`;
      msg += `/flist — список фильтров\n`;
      msg += `/logs — логи\n`;
      msg += `/mention — упоминания\n`;
      msg += `/mentionlist — список упоминаний\n`;
      msg += `/rkick — кик на 24ч\n\n`;
    }

    if (userRole >= 60) {
      msg += `🌟 Ст. Модератор:\n`;
      msg += `/addmoder — выдать модератора\n`;
      msg += `/removerole — снять роль\n`;
      msg += `/правила — правила чата\n`;
      msg += `/приветствие — приветствие\n`;
      msg += `/silence — режим тишины\n`;
      msg += `/vig — выдать виг\n`;
      msg += `/unvig — снять виг\n`;
      msg += `/getvig — инфо о виге\n`;
      msg += `/viglist — список вигов\n`;
      msg += `/setnick — установить ник\n`;
      msg += `/rnick — сбросить ник\n`;
      msg += `/getnick — узнать ник\n`;
      msg += `/nicklist — список ников\n`;
      msg += `/nonicks — без ников\n`;
      msg += `/getbynick — найти по нику\n`;
      msg += `/inactive — неактивные\n`;
      msg += `/clear — очистка сообщений\n\n`;
    }

    if (userRole >= 100) {
      msg += `👑 Владелец:\n`;
      msg += `/addspec — выдать ст. админа\n`;
      msg += `/роль — выдать роль\n`;
      msg += `/команды — управление командами\n`;
      msg += `/demote — снять роль\n`;
      msg += `/settings — настройки\n`;
      msg += `/setpublic — установить паблик\n`;
      msg += `/removepublic — удалить паблик\n`;
      msg += `/checkpublic — проверить паблик\n`;
      msg += `/mtop — топ сообщений\n`;
      msg += `/editowner — сменить владельца\n`;
      msg += `/editcmd — настроить команды\n`;
    }

    context.reply(msg);
  }
};
