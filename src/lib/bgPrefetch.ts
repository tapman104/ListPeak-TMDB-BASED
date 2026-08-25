import { createTMDBClient } from '../api/tmdb';
import { useWatchlistStore } from '../store/watchlistStore';
import { useKeyStore } from '../store/keyStore';

const RATE = 30; // req/sec
const INTERVAL = 1000 / RATE;

export async function startBackgroundPrefetch(
  onProgress?: (done: number, total: number) => void
) {
  const apiKey = useKeyStore.getState().apiKey;
  if (!apiKey) return;

  const items = useWatchlistStore.getState().getAllEntries();
  // Only fetch items missing poster or title
  const missing = items.filter(i => !i.posterPath || !i.title);
  if (missing.length === 0) return;

  const client = createTMDBClient(apiKey);

  let done = 0;
  for (const item of missing) {
    await new Promise(res => setTimeout(res, INTERVAL));
    try {
      const detail = await client.getMediaDetails(String(item.id), item.type);
      if (detail) {
        useWatchlistStore.getState().upsert({
          ...item,
          title: detail.title ?? detail.name ?? item.title,
          posterPath: detail.poster_path ?? item.posterPath,
        });
      }
    } catch { /* skip failed items silently */ }
    done++;
    onProgress?.(done, missing.length);
  }
}
