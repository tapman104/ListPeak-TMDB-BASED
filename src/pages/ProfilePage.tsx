import React, { useState } from 'react';
import { Download, Bookmark, Settings } from 'lucide-react';
import { useWatchlistStore, type WatchlistEntry } from '../store/watchlistStore';
import { useAuthStore } from '../store/authStore';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PosterCard } from '../components/PosterCard';
import { SettingsModal } from '../components/settings/SettingsModal';

const statuses: WatchlistEntry['status'][] = ['watching', 'completed', 'planning', 'paused', 'dropped'];

export const ProfilePage: React.FC = () => {
  const store = useWatchlistStore();
  const allEntries = store.getAllEntries();
  const [activeTab, setActiveTab] = useState<WatchlistEntry['status']>('watching');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const totalCount = allEntries.length;
  const completedCount = store.getByStatus('completed').length;
  const watchingCount = store.getByStatus('watching').length;

  const currentTabEntries = store.getByStatus(activeTab).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const handleExport = () => {
    const dataStr = JSON.stringify(allEntries, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'listpeak-watchlist.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getStatusColor = (status: WatchlistEntry['status']) => {
    switch(status) {
      case 'watching': return '#3B82F6';
      case 'completed': return '#22C55E';
      case 'planning': return '#A855F7';
      case 'paused': return '#EAB308';
      case 'dropped': return '#EF4444';
      default: return '#fff';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 md:px-12 pt-24 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            {useAuthStore.getState().user?.avatarUrl ? (
              <img src={useAuthStore.getState().user!.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-xl font-bold text-white uppercase">
                {useAuthStore.getState().user?.email?.[0] || 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-1">
                  {useAuthStore.getState().user?.username || 'My Profile'}
                </h1>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                  <Settings size={20} />
                </button>
              </div>
              <p className="text-[var(--color-text-muted)] font-sans">
                {useAuthStore.getState().user?.email || 'Manage your personal watchlist and progress.'}
                {useAuthStore.getState().storageMode === 'cloud' && <span className="ml-2 text-xs text-blue-400">Synced to cloud</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl p-4 shadow-lg shrink-0">
            <div className="flex flex-col items-center px-4 border-r border-[var(--color-border-subtle)]">
              <span className="text-2xl font-display font-bold text-white">{totalCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Total</span>
            </div>
            <div className="flex flex-col items-center px-4 border-r border-[var(--color-border-subtle)]">
              <span className="text-2xl font-display font-bold text-[#22C55E]">{completedCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Completed</span>
            </div>
            <div className="flex flex-col items-center px-4">
              <span className="text-2xl font-display font-bold text-[#3B82F6]">{watchingCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Watching</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] mb-8 pb-4 overflow-x-auto gap-4 hide-scrollbar">
          <div className="flex gap-2 min-w-max">
            {statuses.map(status => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`px-4 py-2 rounded-full font-sans text-sm font-semibold capitalize transition-colors border ${
                  activeTab === status 
                  ? 'bg-[var(--color-accent-dim)] border-[var(--color-accent)] text-white' 
                  : 'bg-transparent border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(status) }} />
                  {status}
                </div>
              </button>
            ))}
          </div>

          <button 
            onClick={handleExport}
            className="hidden md:flex shrink-0 items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] hover:bg-white/5 text-white/80 transition-colors font-sans text-sm"
          >
            <Download size={14} />
            Export JSON
          </button>
        </div>

        {currentTabEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Bookmark size={24} className="text-white/20" />
            </div>
            <h3 className="text-xl font-display text-white mb-2">No entries yet</h3>
            <p className="text-[var(--color-text-muted)] font-sans max-w-sm">
              You haven't marked any shows or movies as '{activeTab}' yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 min-[425px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 sm:gap-6">
            {currentTabEntries.map((entry) => (
              <div key={`${entry.type}-${entry.id}`} className="flex flex-col gap-2 relative">
                <PosterCard
                  id={entry.id}
                  title={entry.title}
                  posterPath={entry.posterPath}
                  mediaType={entry.type}
                  voteAverage={entry.rating || undefined}
                  className="w-full"
                />
                
                {entry.type === 'tv' && entry.status === 'watching' && entry.progress !== null && (
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-sans font-bold text-white shadow-lg pointer-events-none z-10">
                    Ep {entry.progress}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </main>

      <Footer />
      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
