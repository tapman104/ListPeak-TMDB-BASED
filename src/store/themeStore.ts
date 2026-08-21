import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => {
        if (theme === 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        set({ theme });
      },
      toggle: () => set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        if (newTheme === 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        return { theme: newTheme };
      }),
    }),
    {
      name: 'listpeak_theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      }
    }
  )
);
