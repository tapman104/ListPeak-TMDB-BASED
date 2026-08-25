import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { debouncedSync } from '../lib/endpointSync';

interface KeyStore {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

export const useKeyStore = create<KeyStore>()(
  persist(
    (set) => ({
      apiKey: null,
      setApiKey: (key) => {
        set({ apiKey: key });
        debouncedSync();
      },
      clearApiKey: () => {
        set({ apiKey: null });
        debouncedSync();
      },
    }),
    {
      name: 'listpeak_tmdb_key',
    }
  )
);
