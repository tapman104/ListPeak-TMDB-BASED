import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DismissedItem {
  id: number;
  type: 'movie' | 'tv';
}

interface DismissedStore {
  dismissed: DismissedItem[];
  dismiss: (id: number, type: 'movie' | 'tv') => void;
  isDismissed: (id: number, type: 'movie' | 'tv') => boolean;
}

export const useDismissedStore = create<DismissedStore>()(
  persist(
    (set, get) => ({
      dismissed: [],
      dismiss: (id, type) => set((state) => {
        if (!state.dismissed.find(item => item.id === id && item.type === type)) {
          return { dismissed: [...state.dismissed, { id, type }] };
        }
        return state;
      }),
      isDismissed: (id, type) => {
        return get().dismissed.some(item => item.id === id && item.type === type);
      },
    }),
    {
      name: 'listpeak_dismissed',
    }
  )
);
