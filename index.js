require('dotenv').config();
const { VK } = require('vk-io');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const database = require('./databases.js');
const shared = require('./shared.js');

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  console.error('⛔ Токен не найден в .env');
  process.exit(1);
}

const vk = new VK({ token: TOKEN });
shared.setVK(vk);

const botId = 1060048895; 
const commands = [];
const PUBLIC_CMDS = ['/help', '/ping', '/test', '/myid', '/chatid', '/reg', '/report'];

const cmdsDir = path.join(__dirname, 'cmds');
const RU_ALIASES = {
  '/kick': ['/кик'],
  '/ban': ['/бан', '/забан'],
  '/unban': ['/разбан'],
  '/banlist': ['/банлист'],
  '/getban': ['/получитьбан'],
  '/warn': ['/варн'],
  '/unwarn': ['/разварн'],
  '/getwarn': ['/получитьварн'],
  '/warnlist': ['/варнлист'],
  '/staff': ['/персонал'],
  '/mute': ['/мут'],
  '/unmute': ['/размут'],
  '/online': ['/онлайн'],
  '/stats': ['/стата', '/статистика'],
  '/reg': ['/регистрация'],
  '/addmoder': ['/модер'],
  '/removerole': ['/удалитьроль'],
  '/правила': ['/rules'],
  '/приветствие': ['/welcome'],
  '/silence': ['/тишина'],
  '/addadmin': ['/админ'],
  '/stitle': ['/звание'],
  '/filter': ['/фильтр'],
  '/logs': ['/логи'],
  '/mention': ['/упоминание'],
  '/addspec': ['/спец'],
  '/роль': ['/role'],
  '/demote': ['/разжаловать'],
  '/settings': ['/настройки'],
  '/mtop': ['/топ'],
  '/help': ['/помощь', '/команды', '/h']
};

fs.readdirSync(cmdsDir).forEach(file => {
  if (file.endsWith('.js')) {
    try {
      const cmd = require(path.join(cmdsDir, file));
      if (cmd.command && RU_ALIASES[cmd.command]) {
        cmd.aliases = cmd.aliases || [];
        RU_ALIASES[cmd.command].forEach(alias => {
          if (!cmd.aliases.includes(alias)) cmd.aliases.push(alias);
        });
      }
      commands.push(cmd);
      console.log(`[LOAD] ${cmd.command || file}`);
    } catch (e) {
      console.error(`[ERROR] ${file}:`, e.message);
    }
  }
});

console.log(`Загружено ${commands.length} команд`);

const PULLS_DIR = path.join(__dirname, 'data', 'pulls');

function getPullForChat(peerId) {
  if (!fs.existsSync(PULLS_DIR)) return null;
  const files = fs.readdirSync(PULLS_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const pull = JSON.parse(fs.readFileSync(path.join(PULLS_DIR, file), 'utf8'));
      if (pull.chats && pull.chats.includes(peerId)) return pull;
    } catch {}
  }
  return null;
}

async function sendToPull(pull, message, excludePeerId) {
  for (const peerId of pull.chats) {
    if (peerId === excludePeerId) continue;
    try {
      await vk.api.messages.send({
        peer_id: peerId,
        message: message,
        random_id: Math.floor(Math.random() * 2e9)
      });
    } catch {}
  }
}

function getChatOwner(peerId) {
  return new Promise(async (resolve) => {
    try {
      const chatInfo = await vk.api.messages.getConversationsById({ peer_ids: [peerId] });
      resolve(chatInfo.items[0]?.chat_settings?.owner_id || null);
    } catch {
      resolve(null);
    }
  });
}

function logAction(peerId, action, adminId, targetId, details) {
  const now = Math.floor(Date.now() / 1000);
  database.query(
    'INSERT INTO logs (peer_id, action, admin_id, target_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    [peerId, action, adminId, targetId, details || '', now]
  );
}

cron.schedule('* * * * *', async () => {
  const now = Math.floor(Date.now() / 1000);
  database.all('SELECT * FROM bans WHERE until > 0 AND until <= ?', [now], async (err, rows) => {
    if (err || !rows) return;
    for (const row of rows) {
      database.query('DELETE FROM bans WHERE peer_id = ? AND user_id = ?', [row.peer_id, row.user_id]);
      try {
        const link = await vk.api.users.get({ user_ids: row.user_id });
        const name = link[0] ? `${link[0].first_name} ${link[0].last_name}` : row.user_id;
        await vk.api.messages.send({
          peer_id: row.peer_id,
          message: `Автоматическая разблокировка: ${name}`,
          random_id: Math.floor(Math.random() * 2e9)
        });
      } catch {}
    }
  });

  database.all('SELECT * FROM vigs WHERE until > 0 AND until <= ?', [now], async (err, rows) => {
    if (err || !rows) return;
    for (const row of rows) {
      database.query('DELETE FROM vigs WHERE peer_id = ? AND user_id = ?', [row.peer_id, row.user_id]);
      try {
        const link = await vk.api.users.get({ user_ids: row.user_id });
        const name = link[0] ? `${link[0].first_name} ${link[0].last_name}` : row.user_id;
        await vk.api.messages.send({
          peer_id: row.peer_id,
          message: `Снят виг: ${name}`,
          random_id: Math.floor(Math.random() * 2e9)
        });
      } catch {}
    }
  });

  database.all('SELECT * FROM mutes WHERE until > 0 AND until <= ?', [now], async (err, rows) => {
    if (err || !rows) return;
    for (const row of rows) {
      database.query('DELETE FROM mutes WHERE peer_id = ? AND user_id = ?', [row.peer_id, row.user_id]);
    }
  });

  database.all('SELECT * FROM chat_settings WHERE silence_until > 0 AND silence_until <= ?', [now], (err, rows) => {
    if (err || !rows) return;
    for (const row of rows) {
      database.query('UPDATE chat_settings SET silence_until = 0 WHERE peer_id = ?', [row.peer_id]);
    }
  });
});

vk.updates.on('message_new', async (context) => {
  try {
    if (context.isFromGroup) return;

    const text = context.text?.trim() || '';
    if (!text) return;

    const peerId = context.peerId;
    const senderId = context.senderId;

    const command = commands.find(cmd => {
      if (cmd.command && text.toLowerCase().startsWith(cmd.command.toLowerCase())) return true;
      if (cmd.aliases) {
        for (const alias of cmd.aliases) {
          if (text.toLowerCase().startsWith(alias.toLowerCase())) return true;
        }
      }
      return false;
    });

    if (command) {
      const { getUserRole } = require('./cmds/roles.js');
      const userRole = await getUserRole(peerId, senderId);
      const chatOwner = await getChatOwner(peerId);

      const isPublicCmd = PUBLIC_CMDS.some(cmd =>
        text.toLowerCase().startsWith(cmd.toLowerCase())
      );

      const isSettings = command.command === '/settings';

      const canUse = isPublicCmd || userRole > 0 || chatOwner === senderId;
      const canUseSettings = userRole >= 100 || chatOwner === senderId;

      if (!canUse || (isSettings && !canUseSettings)) return;

      console.log(`[CMD] ${command.command} by ${senderId} in ${peerId}`);

      context.reply = async (msg) => {
        try {
          await context.send(msg);
        } catch (e) {
          console.error(`[REPLY ERROR] ${command.command}:`, e.message);
        }
      };

      context.sendToPull = async (msg) => {
        const pull = getPullForChat(peerId);
        if (pull) {
          await sendToPull(pull, msg, peerId);
        }
      };

      context.botId = botId;
      context.vk = vk;
      context.getChatOwner = () => getChatOwner(peerId);
      context.logAction = (action, targetId, details) => logAction(peerId, action, senderId, targetId, details);

      await command.execute(context);
    }
  } catch (e) {
    console.error('[ERROR]', e);
  }
});

vk.updates.on('message_event', async (context) => {
  try {
    let payload = context.eventPayload || context.messagePayload || context.payload;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch {}
    }
    if (!payload) return;

    if (payload.cmd === 'settings') {
      const settingsCmd = commands.find(c => c.command === '/settings');
      if (settingsCmd && settingsCmd.handleCallback) {
        return await settingsCmd.handleCallback(context, payload);
      }
    }

    if (payload.cmd === 'settings_set') {
      const settingsCmd = commands.find(c => c.command === '/settings');
      if (settingsCmd && settingsCmd.handleSettingsSet) {
        return await settingsCmd.handleSettingsSet(context, payload);
      }
    }

    if (payload.cmd && payload.cmd.startsWith('ban_')) {
      const banCmd = commands.find(c => c.command === '/ban');
      if (banCmd && banCmd.handleCallback) {
        return await banCmd.handleCallback(context, payload);
      }
    }

    const cmd = commands.find(c => c.handleCallback);
    if (cmd && cmd.handleCallback) {
      await cmd.handleCallback(context, payload);
    }
  } catch (e) {
    console.error('[CALLBACK ERROR]', e);
  }
});

async function main() {
  try {
    const { initSysAdmin } = require('./sysadmin_init.js');
    initSysAdmin();
    console.log('Бот запущен');
    await vk.updates.start();
  } catch (e) {
    console.error('[FATAL]', e.message);
    process.exit(1);
  }
}

main();
