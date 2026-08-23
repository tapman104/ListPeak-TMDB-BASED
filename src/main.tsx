import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import './index.css';

// Apply theme before hydration to prevent FOUC
const saved = localStorage.getItem('listpeak_theme');
const theme = saved ? JSON.parse(saved)?.state?.theme : 'dark';
if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');

// Background sync listener
import { syncToCloud } from './lib/sync';
window.addEventListener('focus', () => {
  syncToCloud();
});

// Import the generated route tree
import { routeTree } from './routeTree.gen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 0,
      gcTime: 1000 * 60 * 60 * 24 * 7,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ 
        persister, 
        maxAge: 1000 * 60 * 60 * 24 * 7,
        buster: 'v1',
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const hasFilter = query.queryKey[1] && query.queryKey[1] !== 'all';
            return !hasFilter && query.state.status === 'success';
          }
        }
      }}
    >
      <RouterProvider router={router} />
    </PersistQueryClientProvider>
  </React.StrictMode>
);
