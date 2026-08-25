import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, Eye, EyeOff, Loader2, Cloud, ArrowRight } from 'lucide-react';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient } from '../api/tmdb';
import { Route } from '../routes/setup';
import { setEndpoint, pullFromEndpoint } from '../lib/endpointSync';
import { startBackgroundPrefetch } from '../lib/bgPrefetch';

const bgStyle = {
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

const cardStyle = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(12px)',
  paddingBottom: '32px',
};

const NewUserFlow: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [apiKey, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [endpointInput, setEndpointInput] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
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
      setStep(2);
    } catch {
      setError('Invalid key. Get one free at themoviedb.org');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate({ to: '/' });
  };

  const handleConnect = async () => {
    if (!endpointInput.trim()) return;
    setIsLoading(true);
    setLogs(['Testing connection...']);
    try {
      setEndpoint(endpointInput.trim());
      const res = await pullFromEndpoint();
      setLogs(res.log);
      if (res.success) {
        setTimeout(() => navigate({ to: '/' }), 1000);
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, err.message]);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6" style={bgStyle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={cardStyle}
        className="w-full max-w-[420px] p-6 sm:p-8 rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] mx-auto"
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="relative">
              {onBack && (
                <button 
                  type="button"
                  onClick={onBack}
                  className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 text-[var(--color-text-muted)] hover:text-white text-xs py-1 px-2 transition-colors cursor-pointer z-10 font-medium"
                >
                  ← Back
                </button>
              )}
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
                <motion.div animate={error ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Paste your TMDb API key"
                      className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all min-h-[48px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white transition-colors w-10 h-10 flex items-center justify-center cursor-pointer"
                    >
                      {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {error && <p className="text-red-400 text-xs sm:text-sm mt-2 text-center">{error}</p>}
                </motion.div>

                <div className="flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading || !apiKey.trim()}
                    className="w-full bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] cursor-pointer text-sm"
                  >
                    {isLoading ? <><Loader2 className="animate-spin" size={18} />Verifying...</> : 'Verify & Continue'}
                  </motion.button>
                </div>
              </form>

              <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3 sm:gap-4">
                <a
                  href="https://www.themoviedb.org/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-text-muted)] hover:text-white text-xs sm:text-sm transition-colors py-1.5 flex items-center min-h-[44px]"
                >
                  Get a free TMDb API key →
                </a>
              </div>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex flex-col items-center mb-6 sm:mb-8">
                <div className="w-12 h-12 bg-[var(--color-accent-dim)] rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <Cloud className="text-[var(--color-accent)]" size={24} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-display tracking-wide mb-1 sm:mb-2 text-white">Sync Endpoint</h1>
                <p className="text-[var(--color-text-muted)] text-center text-xs sm:text-sm">
                  Optional: Connect a custom sync worker.
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <input
                    type="text"
                    value={endpointInput}
                    onChange={(e) => setEndpointInput(e.target.value)}
                    placeholder="https://your-worker.workers.dev"
                    className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all min-h-[48px]"
                  />
                </div>

                {logs.length > 0 && (
                  <div className="bg-[rgba(0,0,0,0.3)] border border-[var(--color-border-subtle)] rounded-lg p-3 max-h-32 overflow-y-auto font-mono text-[10px] text-gray-300">
                    {logs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 w-full">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSkip}
                    disabled={isLoading}
                    className="flex-1 whitespace-nowrap bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-white font-sans font-medium px-2 rounded-xl transition-colors disabled:opacity-50 text-[13px] sm:text-sm min-h-[48px] flex items-center justify-center cursor-pointer"
                  >
                    Skip for now
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConnect}
                    disabled={isLoading || !endpointInput.trim()}
                    className="flex-1 whitespace-nowrap bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold px-2 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-[13px] sm:text-sm min-h-[48px] cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Connect & Continue'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const ReturningUserFlow: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isPulling, setIsPulling] = useState(true);
  const [pullSuccess, setPullSuccess] = useState(false);
  const [prefetchStats, setPrefetchStats] = useState<{ done: number; total: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const doPull = async () => {
      setLogs(['Connecting to endpoint...']);
      const res = await pullFromEndpoint();
      if (!mounted) return;
      
      setLogs(res.log);
      setIsPulling(false);
      setPullSuccess(res.success);

      if (res.success) {
        startBackgroundPrefetch((done, total) => {
          if (mounted) setPrefetchStats({ done, total });
        });
      }
    };
    doPull();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6" style={bgStyle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={cardStyle}
        className="w-full max-w-[420px] p-6 sm:p-8 rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] mx-auto flex flex-col items-center"
      >
        <div className="w-12 h-12 bg-[var(--color-accent-dim)] rounded-full flex items-center justify-center mb-3 sm:mb-4">
          <Cloud className="text-[var(--color-accent)]" size={24} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-display tracking-wide mb-1 sm:mb-2 text-white">Welcome back</h1>
        <p className="text-[var(--color-text-muted)] text-center text-xs sm:text-sm mb-6">
          Fetching your data...
        </p>

        <div className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--color-border-subtle)] rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-[10px] text-gray-300 mb-6 flex flex-col gap-1">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
          {isPulling && (
            <div className="flex items-center gap-2 text-[var(--color-accent)] mt-1">
              <Loader2 className="animate-spin" size={10} />
              <span>Working...</span>
            </div>
          )}
        </div>

        {pullSuccess && prefetchStats && prefetchStats.total > 0 && (
          <div className="w-full text-center mb-6">
            <p className="text-sm text-white mb-2 font-medium">Loading library... {prefetchStats.done} / {prefetchStats.total}</p>
            <div className="w-full bg-[rgba(255,255,255,0.1)] rounded-full h-1.5 overflow-hidden">
              <motion.div 
                className="h-full bg-[var(--color-accent)]"
                initial={{ width: 0 }}
                animate={{ width: `${(prefetchStats.done / prefetchStats.total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        <AnimatePresence>
          {!isPulling && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate({ to: '/' })}
              className="w-full bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[48px] cursor-pointer text-sm"
            >
              Enter App <ArrowRight size={18} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const LandingFlow: React.FC<{ onStart: () => void; onRestore: () => void }> = ({ onStart, onRestore }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6" style={bgStyle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={cardStyle}
        className="w-full max-w-[420px] p-6 sm:p-8 rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] mx-auto flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-[var(--color-accent-dim)] rounded-full flex items-center justify-center mb-4">
          <Cloud className="text-[var(--color-accent)]" size={32} />
        </div>
        <h1 className="text-3xl font-display tracking-wide mb-2 text-white">ListPeak</h1>
        <p className="text-[var(--color-text-muted)] text-center text-sm mb-8">
          Your private watch history, synced everywhere.
        </p>

        <div className="w-full space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="w-full bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition-colors min-h-[48px] text-sm cursor-pointer"
          >
            Get Started
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestore}
            className="w-full border border-[rgba(255,255,255,0.3)] text-white hover:bg-[rgba(255,255,255,0.1)] font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition-colors min-h-[48px] text-sm cursor-pointer"
          >
            I already have my data →
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const RestoreDataFlow: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [endpointInput, setEndpointInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [pullSuccess, setPullSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endpointInput.trim()) return;
    
    setIsLoading(true);
    setLogs(['Connecting to endpoint...']);
    try {
      setEndpoint(endpointInput.trim());
      const res = await pullFromEndpoint();
      setLogs(res.log);
      setPullSuccess(res.success);
    } catch (err: any) {
      setLogs(prev => [...prev, err.message]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6" style={bgStyle}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={cardStyle}
        className="w-full max-w-[420px] p-6 sm:p-8 rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] mx-auto"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-[var(--color-accent-dim)] rounded-full flex items-center justify-center mb-4">
            <Cloud className="text-[var(--color-accent)]" size={24} />
          </div>
          <h1 className="text-2xl font-display tracking-wide mb-2 text-white">Restore Data</h1>
          <p className="text-[var(--color-text-muted)] text-center text-sm">
            Enter your sync endpoint URL
          </p>
        </div>

        <form onSubmit={handleRestore} className="space-y-4">
          <input
            type="text"
            value={endpointInput}
            onChange={(e) => setEndpointInput(e.target.value)}
            placeholder="https://your-worker.workers.dev"
            disabled={isLoading || pullSuccess}
            className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all min-h-[48px] disabled:opacity-50"
          />

          {logs.length > 0 && (
            <div className="bg-[rgba(0,0,0,0.3)] border border-[var(--color-border-subtle)] rounded-lg p-3 max-h-32 overflow-y-auto font-mono text-[10px] text-gray-300 flex flex-col gap-1">
              {logs.map((log, i) => <div key={i}>{log}</div>)}
              {isLoading && (
                <div className="flex items-center gap-2 text-[var(--color-accent)] mt-1">
                  <Loader2 className="animate-spin" size={10} />
                  <span>Working...</span>
                </div>
              )}
            </div>
          )}

          {!pullSuccess ? (
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || !endpointInput.trim()}
                className="w-full bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[48px] text-sm cursor-pointer"
              >
                {isLoading ? <><Loader2 className="animate-spin" size={18} /> Connecting...</> : 'Connect & Restore'}
              </motion.button>
              {!isLoading && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full text-[var(--color-text-muted)] hover:text-white text-sm py-2 transition-colors cursor-pointer"
                >
                  ← Back
                </button>
              )}
            </div>
          ) : (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate({ to: '/' })}
              type="button"
              className="w-full bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[48px] text-sm cursor-pointer"
            >
              Enter App <ArrowRight size={18} />
            </motion.button>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export const SetupPage: React.FC = () => {
  const { returning } = Route.useSearch();
  const [view, setView] = useState<'landing' | 'new' | 'restore'>('landing');

  if (returning) {
    return <ReturningUserFlow />;
  }
  
  if (view === 'new') return <NewUserFlow />;
  if (view === 'restore') return <RestoreDataFlow onBack={() => setView('landing')} />;
  
  return <LandingFlow onStart={() => setView('new')} onRestore={() => setView('restore')} />;
};
