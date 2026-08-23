import type { StorageAdapter, ExportPayload } from './adapter';
import { useWatchlistStore, type WatchlistEntry } from '../../store/watchlistStore';
import { useKeyStore } from '../../store/keyStore';
import { useFilterStore } from '../../store/filterStore';

export const localAdapter: StorageAdapter = {
  async getWatchlist() {
    return useWatchlistStore.getState().getAllEntries();
  },

  async saveWatchlistEntry(entry: WatchlistEntry) {
    // Need to convert addedAt and updatedAt back to Date or handle correctly if the store handles it.
    // The store's upsert uses Omit<WatchlistEntry, 'addedAt' | 'updatedAt'>.
    // We should bypass upsert to preserve the timestamps during sync.
    const state = useWatchlistStore.getState();
    const key = `${entry.type}-${entry.id}`;
    
    useWatchlistStore.setState({
      entries: {
        ...state.entries,
        [key]: entry,
      }
    });
  },

  async removeWatchlistEntry(id: number, type: 'movie' | 'tv') {
    useWatchlistStore.getState().remove(id, type);
  },

  async getApiKey() {
    return useKeyStore.getState().apiKey;
  },

  async saveApiKey(key: string) {
    useKeyStore.getState().setApiKey(key);
  },

  async exportAll(): Promise<ExportPayload> {
    const watchlist = useWatchlistStore.getState().getAllEntries();
    const apiKey = useKeyStore.getState().apiKey;
    const filterState = useFilterStore.getState();
    
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      watchlist,
      apiKey,
      filters: {
        homepage: filterState.homepage,
        recommendations: filterState.recommendations,
        search: filterState.search,
        hideAdult: filterState.hideAdult,
        hideVarietyShows: filterState.hideVarietyShows,
        hideNSFW: filterState.hideNSFW,
      }
    };
  },

  async importAll(payload: ExportPayload) {
    // Import API Key
    if (payload.apiKey) {
      useKeyStore.getState().setApiKey(payload.apiKey);
    }
    
    // Import Filters
    if (payload.filters) {
      useFilterStore.setState(payload.filters as any);
    }
    
    // Import Watchlist
    if (payload.watchlist && Array.isArray(payload.watchlist)) {
      const state = useWatchlistStore.getState();
      const newEntries = { ...state.entries };
      
      payload.watchlist.forEach(entry => {
        const key = `${entry.type}-${entry.id}`;
        newEntries[key] = entry;
      });
      
      useWatchlistStore.setState({ entries: newEntries });
    }
  }
};
