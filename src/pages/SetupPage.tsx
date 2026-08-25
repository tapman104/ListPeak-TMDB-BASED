import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, Eye, EyeOff, Loader2, Cloud, User } from 'lucide-react';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient } from '../api/tmdb';
import { Route } from '../routes/setup';
import { setEndpoint, pullFromEndpoint, pushToEndpoint } from '../lib/endpointSync';
import { startBackgroundPrefetch } from '../lib/bgPrefetch';
import { localAdapter } from '../lib/storage/localAdapter';

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

export const SetupPage: React.FC = () => {
  const { returning } = Route.useSearch();
  const [view, setView] = useState<'landing' | 'new-step1' | 'new-step2' | 'new-step3' | 'done' | 'restore' | 'restore-apikey'>(
    returning ? 'restore' : 'landing'
  );

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [endpointInput, setEndpointInput] = useState(() => localStorage.getItem('listpeak_sync_endpoint') || '');
  const [usernameInput, setUsernameInput] = useState(() => localStorage.getItem('listpeak_sync_username') || '');
  const [passwordInput, setPasswordInput] = useState(() => localStorage.getItem('listpeak_sync_password') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const setKeyStore = useKeyStore((state) => state.setApiKey);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(false);
    setError(null);
    setLogs([]);
  }, [view]);

  const onComplete = () => {
    startBackgroundPrefetch();
    navigate({ to: '/' });
  };

  const handleVerifyKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const client = createTMDBClient(apiKey);
      await client.verifyKey();
      
      setKeyStore(apiKey);
      if (view === 'new-step2') {
        setView('new-step3');
      } else if (view === 'restore-apikey') {
        setView('done');
      }
    } catch {
      setError('Invalid key. Get one free at themoviedb.org');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectNew = async () => {
    if (!endpointInput.trim()) return;
    setIsLoading(true);
    setLogs(['Testing connection...']);
    try {
      setEndpoint(endpointInput.trim());
      localStorage.setItem('listpeak_sync_username', usernameInput.trim());
      localStorage.setItem('listpeak_sync_password', passwordInput);
      
      const data = await localAdapter.exportAll();
      const success = await pushToEndpoint(data);
      
      if (success) {
        setLogs(prev => [...prev, 'Push successful ✓']);
        setTimeout(() => setView('done'), 1000);
      } else {
        setLogs(prev => [...prev, 'Push failed — check URL']);
        setIsLoading(false);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, err.message]);
      setIsLoading(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endpointInput.trim()) return;
    
    setIsLoading(true);
    setLogs(['Connecting to endpoint...']);
    try {
      setEndpoint(endpointInput.trim());
      localStorage.setItem('listpeak_sync_username', usernameInput.trim());
      localStorage.setItem('listpeak_sync_password', passwordInput);
      const res = await pullFromEndpoint();
      setLogs(res.log);
      
      if (res.success) {
        if (res.data && res.data.apiKey) {
          setKeyStore(res.data.apiKey);
          setTimeout(() => setView('done'), 1000);
        } else {
          setTimeout(() => setView('restore-apikey'), 1000);
        }
      } else {
        setError('Failed to restore data.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
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
        className="w-full max-w-[420px] p-6 sm:p-8 rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] mx-auto overflow-hidden relative"
      >
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[var(--color-accent-dim)] rounded-full flex items-center justify-center mb-4">
                <Cloud className="text-[var(--color-accent)]" size={32} />
              </div>
              <h1 className="text-3xl font-display tracking-wide mb-2 text-white">ListPeak</h1>
              <p className="text-[var(--color-text-muted)] text-center text-sm mb-8">
                Your private watch history, synced everywhere.
              </p>

              <div className="w-full space-y-4">
                <button
                  onClick={() => setView('new-step1')}
                  className="w-full bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition-colors min-h-[48px] text-sm cursor-pointer"
                >
                  Get Started
                </button>
                <button
                  onClick={() => setView('restore')}
                  className="w-full border border-[rgba(255,255,255,0.3)] text-white hover:bg-[rgba(255,255,255,0.1)] font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition-colors min-h-[48px] text-sm cursor-pointer"
                >
                  I already have my data →
                </button>
              </div>
            </motion.div>
          )}

          {view === 'new-step1' && (
            <motion.div key="new-step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <button 
                type="button"
                onClick={() => setView('landing')}
                className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 text-[var(--color-text-muted)] hover:text-white text-xs py-1 px-2 transition-colors cursor-pointer z-10 font-medium"
              >
                ← Back
              </button>
              <div className="flex flex-col items-center mb-6 sm:mb-8 mt-2">
                <div className="w-12 h-12 bg-[var(--color-accent-dim)] rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <User className="text-[var(--color-accent)]" size={24} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-display tracking-wide mb-1 sm:mb-2 text-white">Create Account</h1>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all min-h-[48px]"
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Choose a password"
                    className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all min-h-[48px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white transition-colors w-10 h-10 flex items-center justify-center cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                <button
                  onClick={() => setView('new-step2')}
                  disabled={!usernameInput.trim() || !passwordInput}
                  className="w-full bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[48px] text-sm cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {view === 'new-step2' && (
            <motion.div key="new-step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <button 
                type="button"
                onClick={() => setView('new-step1')}
                className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 text-[var(--color-text-muted)] hover:text-white text-xs py-1 px-2 transition-colors cursor-pointer z-10 font-medium"
              >
                ← Back
              </button>
              <div className="flex flex-col items-center mb-6 sm:mb-8 mt-2">
                <div className="w-12 h-12 bg-[var(--color-accent-dim)] rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <KeyRound className="text-[var(--color-accent)]" size={24} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-display tracking-wide mb-1 sm:mb-2 text-white">TMDB API Key</h1>
                <p className="text-[var(--color-text-muted)] text-center text-xs sm:text-sm">
                  Your key, your data. Nothing leaves your browser.
                </p>
              </div>

              <form onSubmit={handleVerifyKey} className="space-y-4 sm:space-y-6">
                <div>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
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
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !apiKey.trim()}
                  className="w-full bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] cursor-pointer text-sm"
                >
                  {isLoading ? <><Loader2 className="animate-spin" size={18} />Verifying...</> : 'Next →'}
                </button>
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
          )}

          {view === 'new-step3' && (
            <motion.div key="new-step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <button 
                type="button"
                onClick={() => setView('new-step2')}
                className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 text-[var(--color-text-muted)] hover:text-white text-xs py-1 px-2 transition-colors cursor-pointer z-10 font-medium"
              >
                ← Back
              </button>
              <div className="flex flex-col items-center mb-6 sm:mb-8 mt-2">
                <div className="w-12 h-12 bg-[var(--color-accent-dim)] rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <Cloud className="text-[var(--color-accent)]" size={24} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-display tracking-wide mb-1 sm:mb-2 text-white">Sync Endpoint</h1>
                <p className="text-[var(--color-text-muted)] text-center text-xs sm:text-sm">
                  Optional — skip if you don't have one
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <input
                  type="text"
                  value={endpointInput}
                  onChange={(e) => setEndpointInput(e.target.value)}
                  placeholder="https://your-worker.workers.dev"
                  className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all min-h-[48px]"
                />

                {logs.length > 0 && (
                  <div className="bg-[rgba(0,0,0,0.3)] border border-[var(--color-border-subtle)] rounded-lg p-3 max-h-32 overflow-y-auto font-mono text-[10px] text-gray-300">
                    {logs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setView('done')}
                    disabled={isLoading}
                    className="flex-1 whitespace-nowrap bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-white font-sans font-medium px-2 rounded-xl transition-colors disabled:opacity-50 text-[13px] sm:text-sm min-h-[48px] flex items-center justify-center cursor-pointer"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={handleConnectNew}
                    disabled={isLoading || !endpointInput.trim()}
                    className="flex-1 whitespace-nowrap bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold px-2 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-[13px] sm:text-sm min-h-[48px] cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Connect & Continue'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'restore' && (
            <motion.div key="restore" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {!returning && (
                <button 
                  type="button"
                  onClick={() => setView('landing')}
                  className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 text-[var(--color-text-muted)] hover:text-white text-xs py-1 px-2 transition-colors cursor-pointer z-10 font-medium"
                >
                  ← Back
                </button>
              )}
              <div className="flex flex-col items-center mb-6 mt-2">
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
                  disabled={isLoading}
                  className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all min-h-[48px] disabled:opacity-50"
                />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Username"
                  disabled={isLoading}
                  className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all min-h-[48px] disabled:opacity-50"
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Password"
                    disabled={isLoading}
                    className="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all min-h-[48px] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white transition-colors w-10 h-10 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && <p className="text-red-400 text-xs sm:text-sm mt-2 text-center">{error}</p>}

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

                <button
                  type="submit"
                  disabled={isLoading || !endpointInput.trim()}
                  className="w-full bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[48px] text-sm cursor-pointer"
                >
                  {isLoading ? <><Loader2 className="animate-spin" size={18} /> Connecting...</> : 'Connect & Restore'}
                </button>
              </form>
            </motion.div>
          )}

          {view === 'restore-apikey' && (
            <motion.div key="restore-apikey" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex flex-col items-center mb-6 sm:mb-8 mt-2">
                <div className="w-12 h-12 bg-[var(--color-accent-dim)] rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <KeyRound className="text-[var(--color-accent)]" size={24} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-display tracking-wide mb-1 sm:mb-2 text-white">Enter API Key</h1>
                <p className="text-[var(--color-text-muted)] text-center text-xs sm:text-sm">
                  Your data was restored. Enter your TMDB API key to continue.
                </p>
              </div>

              <form onSubmit={handleVerifyKey} className="space-y-4 sm:space-y-6">
                <div>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
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
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !apiKey.trim()}
                  className="w-full bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] cursor-pointer text-sm"
                >
                  {isLoading ? <><Loader2 className="animate-spin" size={18} />Verifying...</> : 'Enter App'}
                </button>
              </form>
            </motion.div>
          )}

          {view === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-green-500 text-2xl">✓</span>
              </div>
              <h1 className="text-3xl font-display tracking-wide mb-2 text-white">You're all set</h1>
              <div className="w-full mt-8">
                <button
                  onClick={onComplete}
                  className="w-full bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white font-sans font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition-colors min-h-[48px] text-sm cursor-pointer"
                >
                  Enter App
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
