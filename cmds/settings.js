const { getUserRole } = require('./roles.js');
const database = require('../databases.js');
const { Keyboard } = require('vk-io');

module.exports = {
  command: '/settings',
  aliases: ['/настройки'],
  description: 'Настройки чата',
  async execute(context) {
    const { peerId, senderId } = context;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) return context.reply('⛔ Нужна роль Владельца (100)');

    const keyboard = Keyboard.builder()
      .callbackButton({
        label: '📋 Правила',
        payload: JSON.stringify({ cmd: 'settings', action: 'rules' }),
        color: Keyboard.SECONDARY_COLOR
      })
      .callbackButton({
        label: '👋 Приветствие',
        payload: JSON.stringify({ cmd: 'settings', action: 'welcome' }),
        color: Keyboard.SECONDARY_COLOR
      })
      .row()
      .callbackButton({
        label: '🚫 Фильтр',
        payload: JSON.stringify({ cmd: 'settings', action: 'filter' }),
        color: Keyboard.SECONDARY_COLOR
      })
      .callbackButton({
        label: '🔔 Упоминания',
        payload: JSON.stringify({ cmd: 'settings', action: 'mention' }),
        color: Keyboard.SECONDARY_COLOR
      })
      .row()
      .callbackButton({
        label: '🔇 Тишина',
        payload: JSON.stringify({ cmd: 'settings', action: 'silence' }),
        color: Keyboard.SECONDARY_COLOR
      })
      .callbackButton({
        label: '❌ Сброс',
        payload: JSON.stringify({ cmd: 'settings', action: 'clear' }),
        color: Keyboard.NEGATIVE_COLOR
      });

    context.reply({
      message: '⚙️ Настройки чата\n\nВыберите категорию:',
      keyboard: keyboard.inline()
    });
  },

  async handleCallback(context, payload) {
    if (payload.cmd !== 'settings') return;

    const { peerId, senderId } = context;
    const action = payload.action;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) {
      return context.answer({ type: 'show_snackbar', text: '⛔ Нет прав' });
    }

    const keyboard = Keyboard.builder()
      .callbackButton({
        label: '✅ Включить',
        payload: JSON.stringify({ cmd: 'settings_set', action, value: 'on' }),
        color: Keyboard.POSITIVE_COLOR
      })
      .callbackButton({
        label: '❌ Выключить',
        payload: JSON.stringify({ cmd: 'settings_set', action, value: 'off' }),
        color: Keyboard.NEGATIVE_COLOR
      })
      .row()
      .callbackButton({
        label: '⬅️ Назад',
        payload: JSON.stringify({ cmd: 'settings', action: 'menu' }),
        color: Keyboard.PRIMARY_COLOR
      });

    const titles = {
      rules: '📋 Правила',
      welcome: '👋 Приветствие',
      filter: '🚫 Фильтр',
      mention: '🔔 Упоминания',
      silence: '🔇 Тишина',
      clear: '❌ Сброс'
    };

    await context.send({
      message: `${titles[action]} — выберите действие:`,
      keyboard: keyboard.inline()
    });

    await context.answer({ type: 'show_snackbar', text: `${titles[action]}` });
  },

  async handleSettingsSet(context, payload) {
    const { peerId, senderId } = context;
    const { action, value } = payload;

    const userRole = await getUserRole(peerId, senderId);
    if (userRole < 100) {
      return context.answer({ type: 'show_snackbar', text: '⛔ Нет прав' });
    }

    if (action === 'filter') {
      database.query('UPDATE chat_settings SET filter = ? WHERE peer_id = ?', [value === 'on' ? '1' : '', peerId]);
      context.answer({ type: 'show_snackbar', text: `✅ Фильтр ${value === 'on' ? 'включён' : 'выключен'}` });
    } else if (action === 'mention') {
      database.query('UPDATE chat_settings SET mention_enabled = ? WHERE peer_id = ?', [value === 'on' ? 1 : 0, peerId]);
      context.answer({ type: 'show_snackbar', text: `✅ Упоминания ${value === 'on' ? 'включены' : 'выключены'}` });
    } else if (action === 'silence') {
      if (value === 'off') {
        database.query('UPDATE chat_settings SET silence_until = 0 WHERE peer_id = ?', [peerId]);
        context.answer({ type: 'show_snackbar', text: '✅ Тишина выключена' });
      } else {
        const until = Math.floor(Date.now() / 1000) + 600;
        database.query('UPDATE chat_settings SET silence_until = ? WHERE peer_id = ?', [until, peerId]);
        context.answer({ type: 'show_snackbar', text: '✅ Тишина включена на 10 мин' });
      }
    } else if (action === 'clear') {
      database.query('UPDATE chat_settings SET rules = "", welcome = "", filter = "", mention_enabled = 0, silence_until = 0 WHERE peer_id = ?', [peerId]);
      context.answer({ type: 'show_snackbar', text: '✅ Настройки сброшены' });
    } else {
      context.answer({ type: 'show_snackbar', text: '⏳ Введите текст в чат' });
    }
  }
};
