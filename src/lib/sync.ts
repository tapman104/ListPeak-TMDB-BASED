import { supabaseAdapter } from './storage/supabaseAdapter';
import { localAdapter } from './storage/localAdapter';
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';

export async function syncToCloud() {
  const { setSyncStatus, setLastSyncedAt } = useSyncStore.getState();
  const { user, storageMode } = useAuthStore.getState();

  if (!user || storageMode !== 'cloud') return;

  setSyncStatus('syncing');

  try {
    const cloudWatchlist = await supabaseAdapter.getWatchlist();
    const localWatchlist = await localAdapter.getWatchlist();

    const merged = new Map<string, any>();

    // Put cloud items
    for (const item of cloudWatchlist) {
      merged.set(`${item.type}-${item.id}`, item);
    }

    // Merge local items, resolving conflicts by updatedAt
    for (const localItem of localWatchlist) {
      const key = `${localItem.type}-${localItem.id}`;
      const cloudItem = merged.get(key);
      
      if (!cloudItem) {
        merged.set(key, localItem);
      } else {
        const localDate = new Date(localItem.updatedAt).getTime();
        const cloudDate = new Date(cloudItem.updatedAt).getTime();
        if (localDate > cloudDate) {
          merged.set(key, localItem);
        }
      }
    }

    // Write merged items back to local and cloud
    for (const entry of merged.values()) {
      await supabaseAdapter.saveWatchlistEntry(entry);
    }

    setLastSyncedAt(new Date().toISOString());
    setSyncStatus('success');
  } catch (error) {
    console.error('Sync failed', error);
    setSyncStatus('error');
  }
}
