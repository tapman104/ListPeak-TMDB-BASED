import type { WatchlistEntry } from '../../store/watchlistStore';

export interface FilterState {
  homepage: string;
  recommendations: string;
  search: string;
  hideAdult: boolean;
  hideVarietyShows: boolean;
  hideNSFW: boolean;
}

export interface ExportPayload {
  version: number;
  exportedAt: string;
  watchlist: WatchlistEntry[];
  filters: FilterState;
  apiKey: string | null;
}

export interface StorageAdapter {
  getWatchlist(): Promise<WatchlistEntry[]>;
  saveWatchlistEntry(entry: WatchlistEntry): Promise<void>;
  removeWatchlistEntry(id: number, type: 'movie' | 'tv'): Promise<void>;
  getApiKey(): Promise<string | null>;
  saveApiKey(key: string): Promise<void>;
  exportAll(): Promise<ExportPayload>;
  importAll(payload: ExportPayload): Promise<void>;
}
