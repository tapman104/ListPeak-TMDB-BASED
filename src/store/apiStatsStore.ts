import { create } from 'zustand';

interface ApiStatsState {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  lastError: { message: string; endpoint: string; time: string } | null;
  rateLimitHits: number;
  incrementRequests: () => void;
  incrementCacheHits: () => void;
  incrementCacheMisses: () => void;
  incrementRateLimitHits: () => void;
  setLastError: (error: { message: string; endpoint: string; time: string }) => void;
  clearLastError: () => void;
}

export const useApiStatsStore = create<ApiStatsState>((set) => ({
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  lastError: null,
  rateLimitHits: 0,
  incrementRequests: () => set((state) => ({ totalRequests: state.totalRequests + 1 })),
  incrementCacheHits: () => set((state) => ({ cacheHits: state.cacheHits + 1 })),
  incrementCacheMisses: () => set((state) => ({ cacheMisses: state.cacheMisses + 1 })),
  incrementRateLimitHits: () => set((state) => ({ rateLimitHits: state.rateLimitHits + 1 })),
  setLastError: (error) => set({ lastError: error }),
  clearLastError: () => set({ lastError: null }),
}));
