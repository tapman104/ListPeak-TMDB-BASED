import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WatchlistEntry {
  id: number;
  type: 'movie' | 'tv';
  status: 'watching' | 'completed' | 'planning' | 'paused' | 'dropped';
  rating: number | null;
  progress: number | null;
  addedAt: string;
  updatedAt: string;
  title: string;
  posterPath: string | null;
  year: string;
  // New optional tracking fields
  rewatches?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

interface WatchlistState {
  entries: Record<string, WatchlistEntry>;
  upsert: (entry: Omit<WatchlistEntry, 'addedAt' | 'updatedAt'>) => void;
  remove: (id: number, type: 'movie' | 'tv') => void;
  getEntry: (id: number, type: 'movie' | 'tv') => WatchlistEntry | undefined;
  getByStatus: (status: WatchlistEntry['status']) => WatchlistEntry[];
  getAllEntries: () => WatchlistEntry[];
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      entries: {},
      upsert: (entry) => set((state) => {
        const key = `${entry.type}-${entry.id}`;
        const existing = state.entries[key];
        const now = new Date().toISOString();
        return {
          entries: {
            ...state.entries,
            [key]: {
              ...existing,
              ...entry,
              addedAt: existing ? existing.addedAt : now,
              updatedAt: now,
            },
          },
        };
      }),
      remove: (id, type) => set((state) => {
        const key = `${type}-${id}`;
        const newEntries = { ...state.entries };
        delete newEntries[key];
        return { entries: newEntries };
      }),
      getEntry: (id, type) => {
        const key = `${type}-${id}`;
        return get().entries[key];
      },
      getByStatus: (status) => {
        return Object.values(get().entries).filter((entry) => entry.status === status);
      },
      getAllEntries: () => {
        return Object.values(get().entries);
      },
    }),
    {
      name: 'listpeak_watchlist',
    }
  )
);
