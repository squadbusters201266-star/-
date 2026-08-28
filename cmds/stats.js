const { getUserRole } = require('./roles.js');
const { getlink } = require('../util.js');
const database = require('../databases.js');

module.exports = {
  command: '/stats',
  aliases: ['/стата', '/статистика'],
  description: 'Статистика чата',
  async execute(context) {
    const { peerId, senderId, vk } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 20) return context.reply('⛔ Нужна роль Модератора (20+)');

    try {
      const members = await vk.api.messages.getConversationMembers({ peer_id: peerId });
      const totalMembers = members.count || members.items.length;

      database.all(
        'SELECT COUNT(*) as count FROM bans WHERE peer_id = ?',
        [peerId],
        (err, banRows) => {
          const banCount = banRows[0]?.count || 0;
          database.all(
            'SELECT COUNT(*) as count FROM warns WHERE peer_id = ?',
            [peerId],
            (err, warnRows) => {
              const warnCount = warnRows[0]?.count || 0;
              database.all(
                'SELECT COUNT(*) as count FROM mutes WHERE peer_id = ?',
                [peerId],
                (err, muteRows) => {
                  const muteCount = muteRows[0]?.count || 0;
                  database.all(
                    'SELECT COUNT(*) as count FROM roles WHERE peer_id = ? AND role_id > 0',
                    [peerId],
                    (err, roleRows) => {
                      const roleCount = roleRows[0]?.count || 0;

                      let msg = `Статистика чата:\n\n`;
                      msg += `Участников: ${totalMembers}\n`;
                      msg += `Персонал: ${roleCount}\n`;
                      msg += `Забанено: ${banCount}\n`;
                      msg += `Предупреждений: ${warnCount}\n`;
                      msg += `Замучено: ${muteCount}`;

                      context.reply(msg);
                    }
                  );
                }
              );
            }
          );
        }
      );
    } catch (e) {
      context.reply(`⛔ Ошибка: ${e.message}`);
    }
  }
};
