const shared = require('./shared.js');

async function getlink(userId) {
  try {
    const vk = shared.getVK();
    const users = await vk.api.users.get({ user_ids: userId });
    if (users && users[0]) {
      return `[id${userId}|${users[0].first_name} ${users[0].last_name}]`;
    }
  } catch {}
  return `[id${userId}|Пользователь]`;
}

function extractNumericId(text) {
  if (!text) return null;
  if (typeof text === 'number') return text;
  const str = String(text);
  const match = str.match(/id(\d+)/);
  if (match) return parseInt(match[1]);
  const num = parseInt(str);
  return isNaN(num) || num <= 0 ? null : num;
}

function parseDuration(str) {
  if (!str) return 0;
  const match = str.match(/^(\d+)([mhdwy]?)$/i);
  if (!match) return parseInt(str) || 0;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 'm': return val * 60;
    case 'h': return val * 3600;
    case 'd': return val * 86400;
    case 'w': return val * 604800;
    case 'y': return val * 31536000;
    default: return val;
  }
}

module.exports = { getlink, extractNumericId, parseDuration };
