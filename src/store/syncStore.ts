import { create } from 'zustand';

interface SyncStore {
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  lastSyncedAt: string | null;
  pendingChanges: number;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error' | 'success') => void;
  setLastSyncedAt: (date: string | null) => void;
  incrementPending: () => void;
  clearPending: () => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  syncStatus: 'idle',
  lastSyncedAt: null,
  pendingChanges: 0,
  setSyncStatus: (status) => set({ syncStatus: status }),
  setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
  incrementPending: () => set((state) => ({ pendingChanges: state.pendingChanges + 1 })),
  clearPending: () => set({ pendingChanges: 0 }),
}));
