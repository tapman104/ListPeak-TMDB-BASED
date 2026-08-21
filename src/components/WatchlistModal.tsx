import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Trash2, Star } from 'lucide-react';
import { useWatchlistStore, type WatchlistEntry } from '../store/watchlistStore';
import { StatusBadge } from './StatusBadge';

interface WatchlistModalProps {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  year: string;
  totalEpisodes?: number;
  onClose: () => void;
}

const statuses: WatchlistEntry['status'][] = ['watching', 'completed', 'planning', 'paused', 'dropped'];

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  id,
  type,
  title,
  posterPath,
  year,
  totalEpisodes,
  onClose,
}) => {
  const store = useWatchlistStore();
  const existingEntry = store.getEntry(id, type);

  const [status, setStatus] = useState<WatchlistEntry['status']>(existingEntry?.status || 'planning');
  const [rating, setRating] = useState<number | null>(existingEntry?.rating || null);
  const [progress, setProgress] = useState<number | null>(existingEntry?.progress || null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    store.upsert({
      id,
      type,
      title,
      posterPath,
      year,
      status,
      rating,
      progress: type === 'tv' && status === 'watching' ? progress : null,
    });
    onClose();
  };

  const handleRemove = () => {
    store.remove(id, type);
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)] bg-[rgba(255,255,255,0.02)]">
            <h2 className="text-white font-sans font-bold text-lg line-clamp-1">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 flex flex-col gap-6">
            {/* Status Picker */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs text-white/60 uppercase tracking-wider font-semibold font-sans">Status</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`transition-all rounded-full p-[2px] ${
                      status === s ? 'ring-2 ring-[var(--color-accent)] bg-[var(--color-accent-dim)]' : 'hover:bg-white/5 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <StatusBadge status={s} />
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs text-white/60 uppercase tracking-wider font-semibold font-sans">Your Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRating(r === rating ? null : r)}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                      rating && r <= rating ? 'text-[#f5c518]' : 'text-white/20 hover:text-white/40'
                    }`}
                  >
                    <Star size={20} fill={rating && r <= rating ? '#f5c518' : 'none'} />
                  </button>
                ))}
              </div>
              <span className="text-xs text-white/40">{rating ? `${rating} / 10` : 'No rating'}</span>
            </div>

            {/* Progress (Only for TV Series if Watching) */}
            {type === 'tv' && status === 'watching' && (
              <div className="flex flex-col gap-2.5">
                <label className="text-xs text-white/60 uppercase tracking-wider font-semibold font-sans">Episodes Watched</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max={totalEpisodes || 9999}
                    value={progress || ''}
                    onChange={(e) => setProgress(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                    placeholder="0"
                  />
                  <span className="text-white/60 font-sans text-sm">
                    / {totalEpisodes || '?'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[rgba(255,255,255,0.02)] flex items-center justify-between">
            {existingEntry ? (
              <button
                onClick={handleRemove}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors font-sans font-medium text-sm"
              >
                <Trash2 size={16} />
                Remove
              </button>
            ) : (
              <div /> // Spacer if no remove button
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] hover:bg-[#6b4ce6] text-white transition-colors font-sans font-medium text-sm shadow-md"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  // Use document.body to render the portal so it breaks out of hidden overflows
  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
