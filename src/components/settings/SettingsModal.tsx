import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Key, Sliders, Eye, EyeOff } from 'lucide-react';
import { useKeyStore } from '../../store/keyStore';
import { useFilterStore, type DramaRegion } from '../../store/filterStore';
import { useHiddenStore } from '../../store/hiddenStore';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type TabType = 'profile' | 'apikey' | 'filters';

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
            
            <div className="flex border-b border-[var(--color-border-subtle)] px-2 overflow-x-auto shrink-0 hide-scrollbar">
              <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={16} />} label="Profile" />
              <TabButton active={activeTab === 'apikey'} onClick={() => setActiveTab('apikey')} icon={<Key size={16} />} label="API Key" />
              <TabButton active={activeTab === 'filters'} onClick={() => setActiveTab('filters')} icon={<Sliders size={16} />} label="Filters" />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'profile' && <ProfileTab />}
              {activeTab === 'apikey' && <ApiKeyTab />}
              {activeTab === 'filters' && <FiltersTab />}
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

import { exportToQR, importFromQR, generateQRDataURL } from '../../lib/qr';
import { localAdapter } from '../../lib/storage/localAdapter';

const ProfileTab = () => {
  const [qrCode, setQrCode] = useState('');
  const [importStr, setImportStr] = useState('');
  const [qrError, setQrError] = useState('');

  const handleGenerateQR = async () => {
    try {
      const payload = await localAdapter.exportAll();
      const raw = await exportToQR(payload);
      const dataUrl = await generateQRDataURL(raw);
      setQrCode(dataUrl);
      setQrError('');
    } catch (e: any) {
      setQrError(e.message);
    }
  };

  const handleImportQR = async () => {
    if (!importStr.trim()) return;
    try {
      const payload = await importFromQR(importStr.trim());
      await localAdapter.importAll(payload);
      setImportStr('');
      setQrError('');
      alert('Import successful!');
    } catch (e: any) {
      setQrError('Failed to import: Invalid payload');
    }
  };

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

      <div className="flex flex-col gap-4 border border-[var(--color-border-subtle)] rounded-xl p-5 bg-[var(--color-surface)]/50 mt-4">
        <h4 className="text-md font-bold text-white mb-2">QR Export / Import</h4>
        <div className="flex gap-2">
          <button onClick={handleGenerateQR} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            Export Watchlist
          </button>
        </div>
        
        {qrError && <p className="text-red-400 text-xs">{qrError}</p>}
        
        {qrCode && (
          <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg">
            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            <p className="text-xs text-black/60 text-center">Scan to import to another device</p>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          <textarea
            placeholder="Paste raw QR string to import..."
            value={importStr}
            onChange={e => setImportStr(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white min-h-[80px]"
          />
          <button onClick={handleImportQR} disabled={!importStr.trim()} className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            Import Payload
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
  const { homepage, recommendations, search, hideAdult, hideVarietyShows, hideNSFW, setFilter, setContentOption } = useFilterStore();
  const hiddenItems = useHiddenStore((state) => state.hiddenItems);
  const clearAllHidden = useHiddenStore((state) => state.clearAll);

  const renderSection = (title: string, scope: 'homepage' | 'recommendations' | 'search', currentValue: DramaRegion) => (
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

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">Content Options</h3>
        <div className="flex flex-col gap-4">
          <ToggleOption label="Hide Adult Content" description="" value={hideAdult} onChange={() => setContentOption('hideAdult', !hideAdult)} />
          <ToggleOption label="Hide Variety & Reality Shows" description="" value={hideVarietyShows} onChange={() => setContentOption('hideVarietyShows', !hideVarietyShows)} />
          <ToggleOption label="Hide NSFW" description="Filters adult-oriented and explicit content" value={hideNSFW} onChange={() => setContentOption('hideNSFW', !hideNSFW)} />
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
