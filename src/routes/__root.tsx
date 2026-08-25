import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { getEndpoint } from '../lib/endpointSync';
import { useWatchlistStore } from '../store/watchlistStore';
import { useKeyStore } from '../store/keyStore';
import { startBackgroundPrefetch } from '../lib/bgPrefetch';

const RootComponent = () => {
  const router = useRouter();
  const [showRateLimit, setShowRateLimit] = useState(false);

  useEffect(() => {
    const handleRateLimit = () => {
      setShowRateLimit(true);
      setTimeout(() => setShowRateLimit(false), 4000);
    };

    window.addEventListener('tmdb-rate-limit', handleRateLimit);
    return () => window.removeEventListener('tmdb-rate-limit', handleRateLimit);
  }, []);

  useEffect(() => {
    const init = async () => {
      const hasKey = !!useKeyStore.getState().apiKey;
      const hasEndpoint = !!getEndpoint();

      // No key and no endpoint = new user → setup
      if (!hasKey && !hasEndpoint) {
        router.navigate({ to: '/setup' });
        return;
      }

      // Has endpoint but no local data = returning user → setup (returning path)
      if (hasEndpoint && useWatchlistStore.getState().getAllEntries().length === 0) {
        router.navigate({ to: '/setup', search: { returning: true } });
        return;
      }

      // Has everything locally → start bg prefetch silently
      if (hasKey) startBackgroundPrefetch();
    };
    init();
  }, []);
  
  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={router.state.location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-[var(--color-background)] min-h-screen"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showRateLimit && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-[72px] left-1/2 z-[100] flex items-center gap-[8px] bg-[#1c1c2e] border border-[rgba(124,92,252,0.4)] rounded-[10px] px-[20px] py-[10px]"
          >
            <AlertCircle size={14} className="text-[#f59e0b]" />
            <span className="font-sans font-medium text-[13px] text-[#eeeef5]">
              Slow down — TMDB rate limit hit. Retrying shortly...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
