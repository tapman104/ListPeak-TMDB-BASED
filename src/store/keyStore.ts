import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface KeyStore {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

export const useKeyStore = create<KeyStore>()(
  persist(
    (set) => ({
      apiKey: null,
      setApiKey: (key) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: null }),
    }),
    {
      name: 'listpeak_tmdb_key',
    }
  )
);
