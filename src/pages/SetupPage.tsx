import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient } from '../api/tmdb';

export const SetupPage: React.FC = () => {
  const [apiKey, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setKeyStore = useKeyStore((state) => state.setApiKey);
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const client = createTMDBClient(apiKey);
      await client.verifyKey();
      
      setKeyStore(apiKey);
      navigate({ to: '/' });
    } catch {
      setError('Invalid key. Get one free at themoviedb.org');
    } finally {
      setIsLoading(false);
    }

  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[var(--color-card)] p-6 sm:p-8 rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] mx-auto"
      >
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-12 h-12 bg-[var(--color-accent-dim)] rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <KeyRound className="text-[var(--color-accent)]" size={24} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display tracking-wide mb-1 sm:mb-2 text-white">ListPeak</h1>
          <p className="text-[var(--color-text-muted)] text-center text-xs sm:text-sm">
            Your key, your data. Nothing leaves your browser.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4 sm:space-y-6">
          <motion.div
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Paste your TMDb API key"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3.5 pr-12 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all min-h-[48px]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors w-10 h-10 flex items-center justify-center cursor-pointer"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-xs sm:text-sm mt-2 text-center">{error}</p>
            )}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || !apiKey.trim()}
            className="w-full bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] cursor-pointer text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Verifying...
              </>
            ) : (
              'Verify & Continue'
            )}
          </motion.button>
        </form>

        <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3 sm:gap-4">
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs sm:text-sm transition-colors py-1.5 flex items-center min-h-[44px]"
          >
            Get a free TMDb API key →
          </a>
          <p className="text-[var(--color-text-muted)]/60 text-[11px] sm:text-xs text-center leading-relaxed">
            Your API key is stored only in your browser's localStorage. We never see it.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

