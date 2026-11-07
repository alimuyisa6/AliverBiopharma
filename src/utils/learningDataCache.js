const cache = new Map();
const DEFAULT_TTL = 120000;
const MAX_ENTRIES = 60;

export function getLearningData(key, { allowStale = false } = {}) {
  const entry = cache.get(key);
  if (!entry) return null;

  const fresh = Date.now() - entry.timestamp < entry.ttl;
  if (!fresh && !allowStale) return null;

  entry.accessedAt = Date.now();
  return entry.data;
}

export function setLearningData(key, data, ttl = DEFAULT_TTL) {
  if (data === undefined || data === null) return data;

  cache.set(key, {
    data,
    timestamp: Date.now(),
    accessedAt: Date.now(),
    ttl
  });

  if (cache.size > MAX_ENTRIES) {
    const oldest = [...cache.entries()]
      .sort((a, b) => a[1].accessedAt - b[1].accessedAt)
      .slice(0, cache.size - MAX_ENTRIES);
    oldest.forEach(([entryKey]) => cache.delete(entryKey));
  }

  return data;
}

export function clearLearningData(pattern) {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}
