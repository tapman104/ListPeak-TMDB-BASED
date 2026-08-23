import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HiddenItem {
  id: number;
  type: 'movie' | 'tv';
}

interface HiddenStore {
  hiddenItems: HiddenItem[];
  hideItem: (id: number, type: 'movie' | 'tv') => void;
  unhideItem: (id: number, type: 'movie' | 'tv') => void;
  isHidden: (id: number, type: 'movie' | 'tv') => boolean;
  clearAll: () => void;
}

export const useHiddenStore = create<HiddenStore>()(
  persist(
    (set, get) => ({
      hiddenItems: [],
      hideItem: (id, type) => set((state) => {
        if (!state.hiddenItems.find(item => item.id === id && item.type === type)) {
          return { hiddenItems: [...state.hiddenItems, { id, type }] };
        }
        return state;
      }),
      unhideItem: (id, type) => set((state) => ({
        hiddenItems: state.hiddenItems.filter(item => !(item.id === id && item.type === type))
      })),
      isHidden: (id, type) => {
        return get().hiddenItems.some(item => item.id === id && item.type === type);
      },
      clearAll: () => set({ hiddenItems: [] }),
    }),
    {
      name: 'listpeak_hidden',
    }
  )
);
