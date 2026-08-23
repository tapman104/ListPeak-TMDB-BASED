import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
}

interface AuthStore {
  user: User | null;
  storageMode: 'local' | 'cloud';
  isFirstSignup: boolean;
  consentGiven: boolean;
  setUser: (user: User | null) => void;
  setStorageMode: (mode: 'local' | 'cloud') => void;
  setConsentGiven: (consent: boolean) => void;
  setFirstSignup: (isFirst: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      storageMode: 'local',
      isFirstSignup: true,
      consentGiven: false,
      setUser: (user) => set({ user }),
      setStorageMode: (mode) => set({ storageMode: mode }),
      setConsentGiven: (consent) => set({ consentGiven: consent }),
      setFirstSignup: (isFirst) => set({ isFirstSignup: isFirst }),
      logout: () => set({ user: null, storageMode: 'local' }),
    }),
    {
      name: 'listpeak_auth',
    }
  )
);
