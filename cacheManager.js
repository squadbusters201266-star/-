const cache = new Map();
const TTL = 60000;

function get(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > TTL) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value) {
  cache.set(key, { value, time: Date.now() });
}

function invalidate(key) {
  cache.delete(key);
}

function invalidatePattern(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

module.exports = { get, set, invalidate, invalidatePattern };
