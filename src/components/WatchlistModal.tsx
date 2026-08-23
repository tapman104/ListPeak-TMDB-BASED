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
  selectedBg: string;
  selectedText: string;
}[] = [
  { value: 'watching',  label: 'Watching',  color: '#60a5fa', selectedBg: '#1d4ed8', selectedText: '#bfdbfe' },
  { value: 'completed', label: 'Completed', color: '#4ade80', selectedBg: '#15803d', selectedText: '#bbf7d0' },
  { value: 'planning',  label: 'Planning',  color: '#a78bfa', selectedBg: '#6d28d9', selectedText: '#ddd6fe' },
  { value: 'paused',    label: 'Paused',    color: '#fb923c', selectedBg: '#c2410c', selectedText: '#fed7aa' },
  { value: 'dropped',   label: 'Dropped',   color: '#f87171', selectedBg: '#991b1b', selectedText: '#fecaca' },
];

// Shared input class for compact fields
const inputCls = 'w-full bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 text-sm text-white/90 font-sans focus:outline-none focus:border-white/25 transition-colors placeholder:text-white/25';

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

  const [status, setStatus]           = useState<WatchlistEntry['status']>(existingEntry?.status || 'planning');
  const [rating, setRating]           = useState<number | null>(existingEntry?.rating ?? null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [progress, setProgress]       = useState<number | null>(existingEntry?.progress ?? null);
  const [rewatches, setRewatches]     = useState<number>(existingEntry?.rewatches ?? 0);
  const [startDate, setStartDate]     = useState<string>(existingEntry?.startDate ?? '');
  const [endDate, setEndDate]         = useState<string>(existingEntry?.endDate ?? '');
  const [notes, setNotes]             = useState<string>(existingEntry?.notes ?? '');

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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-[420px] bg-[#0d0d0f] border border-white/8 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden flex flex-col z-10"
        >
          {/* â”€â”€ HEADER â”€â”€ */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3.5 border-b border-white/6">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={title}
                className="w-[52px] h-[78px] object-cover rounded-lg shrink-0 shadow-md border border-white/8"
              />
            ) : (
              <div className="w-[52px] h-[78px] rounded-lg bg-white/5 border border-white/8 shrink-0 flex items-center justify-center text-white/20 text-[10px] font-sans text-center leading-tight px-1">
                No Image
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2
                className="text-white font-semibold text-base leading-snug font-sans"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {title}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                {year && <span className="text-white/45 text-xs font-sans">{year}</span>}
                {year && <span className="text-white/20 text-xs">Â·</span>}
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/6 text-white/40 uppercase tracking-wider font-sans">
                  {type === 'tv' ? 'Series' : 'Movie'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-white/30 hover:text-white/80 hover:bg-white/8 transition-colors shrink-0 self-start mt-0.5"
            >
              <X size={15} />
            </button>
          </div>

          {/* â”€â”€ BODY â”€â”€ */}
          <div className="px-4 pt-3.5 pb-4 flex flex-col gap-3.5">

            {/* Status Pills â€” no label */}
            <div className="flex flex-wrap gap-1.5">
              {STATUS_CONFIG.map((s) => {
                const selected = status === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setStatus(s.value)}
                    className="px-3 py-1 rounded-full text-xs font-medium font-sans transition-all duration-150 border"
                    style={
                      selected
                        ? {
                            background: s.selectedBg,
                            borderColor: s.color,
                            color: s.selectedText,
                            boxShadow: `0 0 8px ${s.color}35`,
                          }
                        : {
                            background: 'rgba(255,255,255,0.04)',
                            borderColor: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.4)',
                          }
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Rating â€” single compact inline row, no label */}
            <div
              className="flex items-center gap-1.5"
              onMouseLeave={() => setHoverRating(null)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => {
                const active = displayRating !== null && r <= displayRating;
                return (
                  <button
                    key={r}
                    onClick={() => setRating(r === rating ? null : r)}
                    onMouseEnter={() => setHoverRating(r)}
                    className="w-5 h-5 flex items-center justify-center transition-transform duration-75 hover:scale-115"
                  >
                    <Star
                      size={14}
                      fill={active ? '#f5c518' : 'none'}
                      stroke={active ? '#f5c518' : 'rgba(255,255,255,0.2)'}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
              <span className="text-xs text-white/40 font-sans tabular-nums ml-0.5">
                {displayRating !== null ? `${displayRating} / 10` : 'No rating'}
              </span>
              {rating !== null && (
                <button
                  onClick={() => { setRating(null); setHoverRating(null); }}
                  className="text-white/20 hover:text-red-400 transition-colors"
                  title="Clear rating"
                >
                  <XCircle size={12} />
                </button>
              )}
            </div>

            {/* TV-only fields â€” 2-column grid */}
            {isTV && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                {/* Episodes Watched */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-white/35 font-semibold font-sans">Episodes</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={totalEpisodes ?? 9999}
                      value={progress ?? ''}
                      onChange={(e) => setProgress(e.target.value ? parseInt(e.target.value, 10) : null)}
                      placeholder="0"
                      className={inputCls}
                    />
                    <span className="text-white/30 text-xs font-sans whitespace-nowrap shrink-0">
                      /{totalEpisodes ?? '?'}
                    </span>
                  </div>
                </div>

                {/* Rewatches */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-white/35 font-semibold font-sans">Rewatches</label>
                  <input
                    type="number"
                    min={0}
                    value={rewatches}
                    onChange={(e) => setRewatches(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>

                {/* Start Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-white/35 font-semibold font-sans">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`${inputCls} [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-20 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                  />
                </div>

                {/* End Date */}
                <div className="flex flex-col gap-1">
                  <label className={`text-[10px] uppercase tracking-wider font-semibold font-sans ${status === 'completed' ? 'text-white/35' : 'text-white/18'}`}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={status !== 'completed'}
                    className={`${inputCls} [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-20 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed`}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-white/35 font-semibold font-sans">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                rows={2}
                placeholder="Your thoughts, comments..."
                className="w-full bg-white/5 border border-white/8 rounded-lg px-2.5 py-2 text-sm text-white/90 font-sans placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors resize-none"
              />
              <span className="text-[10px] text-white/25 font-sans self-end">{notes.length}/500</span>
            </div>
          </div>

          {/* â”€â”€ FOOTER â”€â”€ */}
          <div className="px-4 pb-4 flex flex-col gap-2">
            <button
              onClick={handleSave}
              className="w-full h-10 rounded-xl font-sans font-medium text-sm text-white transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
              }}
            >
              Save to Watchlist
            </button>
            {existingEntry && (
              <button
                onClick={handleRemove}
                className="w-full h-8 rounded-xl font-sans font-medium text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/8 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={12} />
                Remove from Watchlist
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
