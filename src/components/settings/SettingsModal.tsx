import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Key, Sliders, Eye, EyeOff, KeyRound, Cloud, Database } from 'lucide-react';
import { useKeyStore } from '../../store/keyStore';
import { useFilterStore, type DramaRegion } from '../../store/filterStore';
import { useHiddenStore } from '../../store/hiddenStore';
import { useApiStatsStore } from '../../store/apiStatsStore';
import { getRateLimitStatus } from '../../lib/rateLimiter';
import { useQueryClient } from '@tanstack/react-query';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type TabType = 'profile' | 'apikey' | 'filters' | 'api' | 'data' | 'sync';

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('filters');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-[var(--color-background)] border-l border-[var(--color-border-subtle)] z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold font-display text-[var(--color-text-primary)]">Settings</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex border-b border-[var(--color-border-subtle)] px-2 overflow-x-auto shrink-0 scrollbar-hide">
              <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={16} />} label="Profile" />
              <TabButton active={activeTab === 'apikey'} onClick={() => setActiveTab('apikey')} icon={<Key size={16} />} label="API Key" />
              <TabButton active={activeTab === 'filters'} onClick={() => setActiveTab('filters')} icon={<Sliders size={16} />} label="Filters" />
              <TabButton active={activeTab === 'api'} onClick={() => setActiveTab('api')} icon={<KeyRound size={16} />} label="API" />
              <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Database size={16} />} label="Data" />
              <TabButton active={activeTab === 'sync'} onClick={() => setActiveTab('sync')} icon={<Cloud size={16} />} label="Sync" />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'profile' && <ProfileTab />}
              {activeTab === 'apikey' && <ApiKeyTab />}
              {activeTab === 'filters' && <FiltersTab />}
              {activeTab === 'api' && <ApiTab onTabChange={setActiveTab} />}
              {activeTab === 'data' && <DataTab />}
              {activeTab === 'sync' && <SyncTab />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      active ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
    }`}
  >
    {icon} {label}
  </button>
);

import { localAdapter } from '../../lib/storage/localAdapter';
import { getEndpoint, setEndpoint, clearEndpoint, pullFromEndpoint, pushToEndpoint, getToken, setToken, clearToken } from '../../lib/endpointSync';

const SyncTab = () => {
  const [url, setUrl] = useState(getEndpoint() || '');
  const [tokenInput, setTokenInput] = useState(getToken() ?? '');
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  const handleSave = async () => {
    setEndpoint(url);
    if (tokenInput) setToken(tokenInput); else clearToken();
    setSyncLog(['Pushing current data to endpoint...']);
    setSyncing(true);
    const data = await localAdapter.exportAll();
    const ok = await pushToEndpoint(data);
    setSyncLog([
      'Endpoint saved',
      ok ? 'Push successful ✓' : 'Push failed — check URL'
    ]);
    setSyncing(false);
  };

  const handlePull = async () => {
    setSyncing(true);
    setSyncLog(['Starting pull...']);
    const result = await pullFromEndpoint();
    setSyncLog(result.log);
    setSyncing(false);
  };

  const handleClear = () => {
    clearEndpoint();
    clearToken();
    setUrl('');
    setTokenInput('');
    setSyncLog(['Endpoint cleared.']);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Sync Endpoint</h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Paste your Cloudflare Worker or Apps Script URL. Same URL on any device = shared data.
        </p>
        
        <div className="flex flex-col gap-3 mb-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://listpeak-sync.username.workers.dev"
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-lg px-4 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
          <label className="text-sm font-semibold text-[var(--color-text-muted)] mt-1 -mb-1">Auth Token</label>
          <input
            type="password"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            placeholder="Your AUTH_TOKEN"
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-lg px-4 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleSave} 
            disabled={!url.trim()} 
            className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#6b4ce6] transition-colors disabled:opacity-50 text-sm"
          >
            Save Endpoint
          </button>
          
          <button 
            onClick={handlePull} 
            disabled={!url.trim() || syncing} 
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
          >
            Pull from cloud
          </button>

          <button 
            onClick={handleClear} 
            disabled={!url.trim()} 
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm ml-auto"
          >
            Clear
          </button>
        </div>

        {syncLog.length > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            fontSize: '12px',
            lineHeight: '1.8',
            fontFamily: 'monospace',
            color: 'var(--text-secondary, #aaa)'
          }}>
            {syncLog.map((line, i) => (
              <div key={i}>
                {syncing && i === syncLog.length - 1 ? '⏳ ' : '✓ '}
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileTab = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-xl font-bold text-white uppercase">
          U
        </div>
        <div>
          <div className="text-lg font-bold text-white">Local Mode</div>
          <div className="text-[var(--color-text-muted)] text-sm">Your data is stored safely on this device.</div>
        </div>
      </div>
    </div>
  );
};

const DataTab = () => {
  const [importStatus, setImportStatus] = useState<string>('');

  async function handleExport() {
    const data = await localAdapter.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listpeak-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate
      if (!data.watchlist || !Array.isArray(data.watchlist)) {
        setImportStatus('Invalid file — missing watchlist');
        return;
      }
      
      // Preview
      const msg = `Found ${data.watchlist.length} items` +
        (data.apiKey ? ', API key included' : '') +
        (data.filters ? ', filters included' : '');
      setImportStatus(msg);
      
      // Apply
      await localAdapter.importAll(data);
      setImportStatus('Import successful ✓');
    } catch {
      setImportStatus('Failed to parse file');
    }
    
    // Reset file input
    e.target.value = '';
  }

  return (
    <div className="flex flex-col gap-8">
      {/* EXPORT SECTION */}
      <div>
        <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Backup Data</h3>
        <div className="border border-[var(--color-border-subtle)] rounded-xl p-4 bg-[var(--color-surface)]/30 flex justify-between items-center">
          <div>
            <div className="text-sm font-medium text-[var(--color-text-primary)]">Export Backup</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Download a JSON file of your watchlist, filters, and API key.</div>
          </div>
          <button 
            onClick={handleExport}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white text-xs font-medium transition-colors whitespace-nowrap"
          >
            Export Backup
          </button>
        </div>
      </div>

      {/* IMPORT SECTION */}
      <div>
        <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Restore Data</h3>
        <div className="border border-[var(--color-border-subtle)] rounded-xl p-4 bg-[var(--color-surface)]/30 flex justify-between items-center gap-4">
          <div>
            <div className="text-sm font-medium text-[var(--color-text-primary)]">Import Backup</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Restore your data from a previously exported JSON file.</div>
            {importStatus && <div className="text-xs text-[var(--color-accent)] mt-2 font-mono">{importStatus}</div>}
          </div>
          <label className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors whitespace-nowrap inline-flex items-center justify-center">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <span>Import Backup</span>
          </label>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div>
        <h3 className="text-[10px] font-semibold text-red-500/50 uppercase tracking-widest mb-3">Danger Zone</h3>
        <div className="border border-red-500/20 rounded-xl p-4 bg-red-500/5 flex justify-between items-center gap-4">
          <div>
            <div className="text-sm font-medium text-red-400">Clear All Local Data</div>
            <div className="text-xs text-red-400/70 mt-0.5">Hard delete everything stored in your browser. This cannot be undone.</div>
          </div>
          <button 
            onClick={() => {
              if (window.confirm('Clear all local data? This cannot be undone.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors whitespace-nowrap"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

const ApiKeyTab = () => {
  const { apiKey, setApiKey } = useKeyStore();
  const [input, setInput] = useState('');
  const [isEditing, setIsEditing] = useState(!apiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    if (input.trim()) {
      setApiKey(input.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">TMDB API Key</h3>
      {!isEditing && apiKey ? (
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text-primary)] font-mono break-all flex justify-between items-center gap-2">
            <span>{showKey ? apiKey : `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`}</span>
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
              aria-label={showKey ? "Hide API Key" : "Show API Key"}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button onClick={() => { setInput(apiKey); setIsEditing(true); }} className="text-sm text-[var(--color-accent)] hover:underline self-start">
            Change API Key
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[var(--color-text-muted)]">
            Your TMDB API key is stored locally in your browser. It is never sent to our servers.
          </p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter TMDB API Key (v3 auth)"
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-lg px-4 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
          <button onClick={handleSave} disabled={!input.trim()} className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#6b4ce6] transition-colors disabled:opacity-50">
            Save Key
          </button>
          {apiKey && (
            <button onClick={() => setIsEditing(false)} className="text-sm text-[var(--color-text-muted)] hover:text-white mt-1">
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const REGIONS: { label: string; value: DramaRegion }[] = [
  { label: 'All', value: 'all' },
  { label: 'K-Drama', value: 'ko' },
  { label: 'J-Drama', value: 'ja' },
  { label: 'C-Drama', value: 'zh' },
  { label: 'Thai', value: 'th' },
  { label: 'Chinese', value: 'cn' },
  { label: 'Taiwanese', value: 'tw' },
];

const FiltersTab = () => {
  const { homepage, recommendations, search, tagResults, hideAdult, hideVarietyShows, hideNSFW, showTagOriginFilter, setFilter, setContentOption, setShowTagOriginFilter } = useFilterStore();
  const hiddenItems = useHiddenStore((state) => state.hiddenItems);
  const clearAllHidden = useHiddenStore((state) => state.clearAll);

  const renderSection = (title: string, scope: 'homepage' | 'recommendations' | 'search' | 'tagResults', currentValue: DramaRegion) => (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((region) => (
          <button
            key={region.value}
            onClick={() => setFilter(scope, region.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              currentValue === region.value
                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border-subtle)] hover:border-[var(--color-text-muted)]'
            }`}
          >
            {region.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      {renderSection('Homepage', 'homepage', homepage)}
      {renderSection('Recommendations', 'recommendations', recommendations)}
      {renderSection('Search', 'search', search)}
      {renderSection('Tag Results', 'tagResults', tagResults)}

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">Content Options</h3>
        <div className="flex flex-col gap-4">
          <ToggleOption label="Hide Adult Content" description="" value={hideAdult} onChange={() => setContentOption('hideAdult', !hideAdult)} />
          <ToggleOption label="Hide Variety & Reality Shows" description="" value={hideVarietyShows} onChange={() => setContentOption('hideVarietyShows', !hideVarietyShows)} />
          <ToggleOption label="Hide NSFW" description="Filters adult-oriented and explicit content" value={hideNSFW} onChange={() => setContentOption('hideNSFW', !hideNSFW)} />
          <ToggleOption label="Tag Origin Filter" description="Show language/region filter bar on tag result pages" value={showTagOriginFilter} onChange={() => setShowTagOriginFilter(!showTagOriginFilter)} />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">Hidden Items</h3>
        <div className="flex items-center justify-between border border-[var(--color-border-subtle)] rounded-xl p-4 bg-[var(--color-surface)]/30">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{hiddenItems.length} items hidden</span>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">Items you manually hid from view</span>
          </div>
          <button 
            onClick={clearAllHidden} 
            disabled={hiddenItems.length === 0}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            Clear all hidden
          </button>
        </div>
      </div>
    </div>
  );
};

const ToggleOption = ({ label, description, value, onChange }: { label: string, description: string, value: boolean, onChange: () => void }) => (
  <div className="flex items-center justify-between">
    <div className="flex flex-col mr-4">
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
      {description && <span className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</span>}
    </div>
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        value ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface)] border border-[var(--color-border-subtle)]'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const ApiTab = ({ onTabChange }: { onTabChange: (tab: TabType) => void }) => {
  const { apiKey } = useKeyStore();
  const stats = useApiStatsStore();
  const [rateLimit, setRateLimit] = useState(() => getRateLimitStatus());
  const queryClient = useQueryClient();

  const handleHardReset = () => {
    if (window.confirm('Are you sure you want to clear all cached API data? This will force a full refresh on next load.')) {
      queryClient.clear();
      localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
      window.location.reload();
    }
  };

  const usagePercent = Math.min(100, (rateLimit.used / rateLimit.max) * 100);
  let progressColor = "bg-green-500";
  if (rateLimit.used >= 30) progressColor = "bg-red-500";
  else if (rateLimit.used >= 20) progressColor = "bg-yellow-500";

  return (
    <div className="flex flex-col gap-8">
      {/* SECTION 1: CONNECTION STATUS */}
      <div>
        <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Connection Status</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-[var(--color-border-subtle)] rounded-xl p-4 bg-[var(--color-surface)]/30 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${apiKey ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {apiKey ? 'Connected' : 'No API Key'}
              </span>
              {apiKey && (
                <span className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">
                  key: {apiKey.slice(0, 4)}...{apiKey.slice(-4)}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => onTabChange('apikey')}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors whitespace-nowrap"
          >
            {apiKey ? 'Change Key' : 'Set up API Key'}
          </button>
        </div>
      </div>

      {/* SECTION 2: SESSION STATS */}
      <div>
        <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Session Stats</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">{stats.totalRequests}</span>
            <span className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">Requests made</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">{stats.cacheHits}</span>
            <span className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">Cache Hits</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">{stats.rateLimitHits}</span>
            <span className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">Throttled</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: RATE LIMIT */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Rate Limit (Current Window)</h3>
          <button 
            onClick={() => setRateLimit(getRateLimitStatus())}
            className="text-[10px] bg-white/5 hover:bg-white/10 text-white/70 px-2 py-1 rounded transition-colors"
          >
            Refresh
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-[var(--color-text-muted)]">API Usage</span>
            <span className="text-[var(--color-text-primary)]">{rateLimit.used} / {rateLimit.max}</span>
          </div>
          <div className="bg-white/10 rounded-full h-1.5 w-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${progressColor}`} 
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: LAST ERROR */}
      <div>
        <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Last Error</h3>
        {stats.lastError ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-sm font-bold text-red-400 flex items-center gap-2">
                <span className="text-lg leading-none">⚠</span> Error at {stats.lastError.time}
              </span>
              <button 
                onClick={stats.clearLastError}
                className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 py-1 rounded transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="text-xs font-mono text-red-300/70 bg-black/20 p-2 rounded break-all">
              {stats.lastError.endpoint}
            </div>
            <div className="text-sm text-red-200">
              {stats.lastError.message}
            </div>
          </div>
        ) : (
          <div className="text-sm text-[var(--color-text-muted)] italic p-3 text-center border border-dashed border-[var(--color-border-subtle)] rounded-lg">
            No errors in current session
          </div>
        )}
      </div>

      {/* SECTION 5: CACHE RESET */}
      <div>
        <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Maintenance</h3>
        <div className="border border-[var(--color-border-subtle)] rounded-xl p-4 bg-[var(--color-surface)]/30 flex justify-between items-center">
          <div>
            <div className="text-sm font-medium text-[var(--color-text-primary)]">Hard Reset Cache</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Clear all downloaded TMDB data and force a fresh sync.</div>
          </div>
          <button 
            onClick={handleHardReset}
            className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors whitespace-nowrap"
          >
            Reset Cache
          </button>
        </div>
      </div>
    </div>
  );
};
