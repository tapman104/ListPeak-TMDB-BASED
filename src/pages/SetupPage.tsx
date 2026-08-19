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
    } catch (err) {
      setError('Invalid key. Get one free at themoviedb.org');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card p-8 rounded-2xl shadow-2xl border border-[var(--color-border-subtle)]"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="text-accent" size={24} />
          </div>
          <h1 className="text-3xl font-display tracking-wide mb-2">CineKey</h1>
          <p className="text-text-muted text-center text-sm">
            Your key, your data. Nothing leaves your browser.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
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
                className="w-full bg-surface border border-[var(--color-border-subtle)] rounded-lg px-4 py-3 pr-12 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
            )}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || !apiKey.trim()}
            className="w-full bg-accent hover:bg-[#6b4ce6] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Verifying...
              </>
            ) : (
              'Verify & Continue'
            )}
          </motion.button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-text-primary text-sm transition-colors"
          >
            Get a free TMDb API key →
          </a>
          <p className="text-text-muted/60 text-xs text-center">
            Your API key is stored only in your browser's localStorage. We never see it.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
