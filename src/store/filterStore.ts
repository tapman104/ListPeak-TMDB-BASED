import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { debouncedSync } from '../lib/endpointSync';

export type DramaRegion = 'all' | 'ko' | 'ja' | 'zh' | 'th' | 'cn' | 'tw';

interface FilterStore {
  homepage: DramaRegion;
  recommendations: DramaRegion;
  search: DramaRegion;
  tagResults: DramaRegion;
  hideAdult: boolean;
  hideVarietyShows: boolean;
  hideNSFW: boolean;
  showTagOriginFilter: boolean;
  setFilter: (scope: 'homepage' | 'recommendations' | 'search' | 'tagResults', value: DramaRegion) => void;
  setContentOption: (key: 'hideAdult' | 'hideVarietyShows' | 'hideNSFW', value: boolean) => void;
  setShowTagOriginFilter: (v: boolean) => void;
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      homepage: 'all',
      recommendations: 'all',
      search: 'all',
      tagResults: 'all',
      hideAdult: true,
      hideVarietyShows: false,
      hideNSFW: true,
      showTagOriginFilter: false,
      setFilter: (scope, value) => {
        set((state) => ({ ...state, [scope]: value }));
        debouncedSync();
      },
      setContentOption: (key, value) => {
        set((state) => ({ ...state, [key]: value }));
        debouncedSync();
      },
      setShowTagOriginFilter: (v) => {
        set((state) => ({ ...state, showTagOriginFilter: v }));
        debouncedSync();
      },
    }),
    {
      name: 'listpeak_filters',
    }
  )
);
