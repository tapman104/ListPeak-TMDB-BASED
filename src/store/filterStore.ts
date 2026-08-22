import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DramaRegion = 'all' | 'ko' | 'ja' | 'zh' | 'th' | 'cn' | 'tw';

interface FilterStore {
  homepage: DramaRegion;
  recommendations: DramaRegion;
  search: DramaRegion;
  hideAdult: boolean;
  hideVarietyShows: boolean;
  hideBL: boolean;
  hideLesbian: boolean;
  setFilter: (scope: 'homepage' | 'recommendations' | 'search', value: DramaRegion) => void;
  setContentOption: (key: 'hideAdult' | 'hideVarietyShows' | 'hideBL' | 'hideLesbian', value: boolean) => void;
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      homepage: 'all',
      recommendations: 'all',
      search: 'all',
      hideAdult: true,
      hideVarietyShows: false,
      hideBL: false,
      hideLesbian: false,
      setFilter: (scope, value) => set((state) => ({ ...state, [scope]: value })),
      setContentOption: (key, value) => set((state) => ({ ...state, [key]: value })),
    }),
    {
      name: 'listpeak_filters',
    }
  )
);
