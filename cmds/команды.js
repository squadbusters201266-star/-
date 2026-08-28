const { getUserRole } = require('./roles.js');
const { getlink } = require('../util.js');

module.exports = {
  command: '/команды',
  aliases: ['/commands'],
  description: 'Список команд',
  async execute(context) {
    const { peerId, senderId } = context;

    const userRole = await getUserRole(peerId, senderId);

    let msg = `📋 Доступные команды:\n\n`;

    msg += `🛡 /kick — кик\n`;
    msg += `🚫 /ban — бан\n`;
    msg += `✅ /unban — разбан\n`;
    msg += `📋 /banlist — банлист\n`;
    msg += `🔍 /getban — инфо о бане\n`;
    msg += `⚠️ /warn — варн\n`;
    msg += `⚠️ /unwarn — снять варн\n`;
    msg += `🔍 /getwarn — инфо о варнах\n`;
    msg += `📋 /warnlist — список варнов\n`;
    msg += `👥 /staff — персонал\n`;
    msg += `🧹 /clearchat — очистить чат\n`;
    msg += `🔇 /mute — мут\n`;
    msg += `🔇 /unmute — снять мут\n`;
    msg += `🟢 /online — онлайн\n`;
    msg += `📊 /stats — статистика\n`;
    msg += `📝 /reg — регистрация\n`;

    if (userRole >= 60) {
      msg += `\n🌟 Ст. модератор:\n`;
      msg += `🛡️ /addmoder — выдать модератора\n`;
      msg += `❌ /removerole — снять роль\n`;
      msg += `📜 /правила — правила\n`;
      msg += `👋 /приветствие — приветствие\n`;
      msg += `🔇 /silence — тишина\n`;
      msg += `⏰ /vig — виг\n`;
      msg += `⏰ /unvig — снять виг\n`;
      msg += `⏰ /getvig — инфо о виге\n`;
      msg += `⏰ /viglist — список вигов\n`;
      msg += `📛 /setnick — установить ник\n`;
      msg += `📛 /rnick — сбросить ник\n`;
      msg += `📛 /getnick — узнать ник\n`;
      msg += `📛 /nicklist — список ников\n`;
      msg += `📛 /nonicks — без ников\n`;
      msg += `🔍 /getbynick — найти по нику\n`;
      msg += `😴 /inactive — неактивные\n`;
      msg += `🧹 /clear — очистить сообщения\n`;
    }

    if (userRole >= 40) {
      msg += `\n✏️ Администратор:\n`;
      msg += `👑 /addadmin — выдать админа\n`;
      msg += `📛 /stitle — название чата\n`;
      msg += `📛 /rtitle — сброс названия\n`;
      msg += `🚫 /filter — фильтр\n`;
      msg += `🚫 /rfilter — удалить фильтр\n`;
      msg += `🚫 /flist — список фильтров\n`;
      msg += `📜 /logs — логи\n`;
      msg += `🔔 /mention — упоминания\n`;
      msg += `🔔 /mentionlist — список упоминаний\n`;
      msg += `🚫 /rkick — кик на 24ч\n`;
    }

    if (userRole >= 100) {
      msg += `\n👑 Владелец:\n`;
      msg += `⭐ /addspec — выдать ст. админа\n`;
      msg += `⭐ /роль — выдать роль\n`;
      msg += `❌ /demote — снять роль\n`;
      msg += `⚙️ /settings — настройки\n`;
      msg += `📢 /setpublic — установить паблик\n`;
      msg += `📢 /removepublic — удалить паблик\n`;
      msg += `📢 /checkpublic — проверить паблик\n`;
      msg += `📊 /mtop — топ сообщений\n`;
    }

    context.reply(msg);
  }
};
