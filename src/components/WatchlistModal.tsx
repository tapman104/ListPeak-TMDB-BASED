import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Star, XCircle } from 'lucide-react';
import { useWatchlistStore, type WatchlistEntry } from '../store/watchlistStore';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZE } from '../lib/constants';

interface WatchlistModalProps {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  year: string;
  totalEpisodes?: number;
  onClose: () => void;
}

const STATUS_CONFIG: {
  value: WatchlistEntry['status'];
  label: string;
  color: string;
  bg: string;
  selectedBg: string;
  selectedText: string;
}[] = [
  { value: 'watching',  label: 'Watching',  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  selectedBg: '#1d4ed8', selectedText: '#bfdbfe' },
  { value: 'completed', label: 'Completed', color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  selectedBg: '#15803d', selectedText: '#bbf7d0' },
  { value: 'planning',  label: 'Planning',  color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', selectedBg: '#6d28d9', selectedText: '#ddd6fe' },
  { value: 'paused',    label: 'Paused',    color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  selectedBg: '#c2410c', selectedText: '#fed7aa' },
  { value: 'dropped',   label: 'Dropped',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', selectedBg: '#991b1b', selectedText: '#fecaca' },
];

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

  const [status, setStatus]     = useState<WatchlistEntry['status']>(existingEntry?.status || 'planning');
  const [rating, setRating]     = useState<number | null>(existingEntry?.rating ?? null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [progress, setProgress] = useState<number | null>(existingEntry?.progress ?? null);
  const [rewatches, setRewatches]   = useState<number>(existingEntry?.rewatches ?? 0);
  const [startDate, setStartDate]   = useState<string>(existingEntry?.startDate ?? '');
  const [endDate, setEndDate]       = useState<string>(existingEntry?.endDate ?? '');
  const [notes, setNotes]           = useState<string>(existingEntry?.notes ?? '');

  const isTV = type === 'tv';
  const posterUrl = posterPath ? `${TMDB_IMAGE_BASE}${TMDB_POSTER_SIZE}${posterPath}` : null;
  const displayRating = hoverRating ?? rating;

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
      progress: isTV ? progress : null,
      rewatches: isTV ? rewatches : undefined,
      startDate: isTV && startDate ? startDate : undefined,
      endDate: isTV && status === 'completed' && endDate ? endDate : undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const handleRemove = () => {
    store.remove(id, type);
    onClose();
  };

  const statusCfg = STATUS_CONFIG.find((s) => s.value === status)!;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-[500px] bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col z-10"
          style={{ minWidth: 'min(480px, calc(100vw - 32px))' }}
        >
          {/* ── HEADER ── */}
          <div className="flex items-center gap-4 p-5 border-b border-white/8">
            {/* Poster thumbnail */}
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={title}
                className="w-[60px] h-[90px] object-cover rounded-lg shrink-0 shadow-lg border border-white/10"
              />
            ) : (
              <div className="w-[60px] h-[90px] rounded-lg bg-white/5 border border-white/10 shrink-0 flex items-center justify-center text-white/20 text-xs font-sans text-center px-1">
                No Image
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2
                className="text-white font-sans font-bold text-base sm:text-lg leading-snug"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {year && <span className="text-white/50 text-xs font-sans">{year}</span>}
                {year && <span className="text-white/25 text-xs">·</span>}
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-white/8 text-white/50 uppercase tracking-wider font-sans">
                  {type === 'tv' ? 'Series' : 'Movie'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── BODY ── */}
          <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">

            {/* Status Pills */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-semibold font-sans">Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_CONFIG.map((s) => {
                  const selected = status === s.value;
                  return (
                    <button
                      key={s.value}
                      onClick={() => setStatus(s.value)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold font-sans transition-all duration-150 border"
                      style={
                        selected
                          ? {
                              background: s.selectedBg,
                              borderColor: s.color,
                              color: s.selectedText,
                              boxShadow: `0 0 10px ${s.color}40`,
                            }
                          : {
                              background: s.bg,
                              borderColor: `${s.color}40`,
                              color: s.color,
                            }
                      }
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-semibold font-sans">Your Rating</label>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-0.5"
                  onMouseLeave={() => setHoverRating(null)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => {
                    const active = displayRating !== null && r <= displayRating;
                    return (
                      <button
                        key={r}
                        onClick={() => setRating(r === rating ? null : r)}
                        onMouseEnter={() => setHoverRating(r)}
                        className="w-6 h-6 flex items-center justify-center transition-all duration-100 hover:scale-110"
                        style={{ color: active ? '#f5c518' : 'rgba(255,255,255,0.15)' }}
                      >
                        <Star
                          size={16}
                          fill={active ? '#f5c518' : 'none'}
                          stroke={active ? '#f5c518' : 'rgba(255,255,255,0.2)'}
                          strokeWidth={1.5}
                        />
                      </button>
                    );
                  })}
                </div>
                {displayRating !== null ? (
                  <span className="text-[#f5c518] font-bold text-sm font-sans tabular-nums">{displayRating}/10</span>
                ) : (
                  <span className="text-white/25 text-sm font-sans">No rating</span>
                )}
                {rating !== null && (
                  <button
                    onClick={() => { setRating(null); setHoverRating(null); }}
                    className="text-white/30 hover:text-red-400 transition-colors ml-1"
                    title="Clear rating"
                  >
                    <XCircle size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* TV-only fields */}
            {isTV && (
              <>
                {/* Episodes Watched */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-semibold font-sans">Episodes Watched</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={totalEpisodes ?? 9999}
                      value={progress ?? ''}
                      onChange={(e) => setProgress(e.target.value ? parseInt(e.target.value, 10) : null)}
                      className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                      placeholder="0"
                    />
                    <span className="text-white/40 font-sans text-sm">/ {totalEpisodes ?? '?'}</span>
                  </div>
                </div>

                {/* Rewatches */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-semibold font-sans">Rewatches</label>
                  <input
                    type="number"
                    min={0}
                    value={rewatches}
                    onChange={(e) => setRewatches(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                    placeholder="0"
                  />
                </div>

                {/* Start Date */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-semibold font-sans">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-48 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors [color-scheme:dark]"
                  />
                </div>

                {/* End Date (only when completed) */}
                <div className="flex flex-col gap-2">
                  <label className={`text-[10px] uppercase tracking-widest font-semibold font-sans ${status === 'completed' ? 'text-white/40' : 'text-white/20'}`}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={status !== 'completed'}
                    className="w-48 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed [color-scheme:dark]"
                  />
                </div>
              </>
            )}

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-semibold font-sans">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Your thoughts, comments..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white/90 font-sans text-sm placeholder:text-white/25 focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
              />
              <span className="text-[10px] text-white/25 font-sans self-end">{notes.length}/500</span>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="p-4 border-t border-white/8 flex flex-col gap-2.5">
            <button
              onClick={handleSave}
              className="w-full py-3 rounded-xl font-sans font-bold text-sm text-white transition-all hover:brightness-110 active:scale-98"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
            >
              Save to Watchlist
            </button>
            {existingEntry && (
              <button
                onClick={handleRemove}
                className="w-full py-2.5 rounded-xl font-sans font-medium text-sm text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  <Trash2 size={14} />
                  Remove from Watchlist
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};


