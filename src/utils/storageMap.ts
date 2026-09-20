import { storageGet, storageSet } from './storage';

/**
 * Read-modify-write of one entry inside a map stored under a single key
 * (the RSS and calendar caches), serialised per key.
 *
 * Callers used to load the whole map, fetch, then write the map back.
 * Two feeds fetched in parallel each held a copy from before the other's
 * write, so the slower one erased the faster one's entry every time.
 * Queuing the writes and re-reading the map right before each one means
 * every entry survives, whatever order the fetches finish in.
 */
const queues = new Map<string, Promise<void>>();

export function updateStoredMapEntry<T>(key: string, entryKey: string, value: T): Promise<void> {
  const previous = queues.get(key) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(async () => {
      const map = (await storageGet<Record<string, T>>(key, {})) || {};
      map[entryKey] = value;
      await storageSet(key, map);
    });
  queues.set(key, next);
  // Let the queue drop the reference once it has drained.
  void next.finally(() => {
    if (queues.get(key) === next) queues.delete(key);
  });
  return next;
}
