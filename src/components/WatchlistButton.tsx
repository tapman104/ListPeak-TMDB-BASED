import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useWatchlistStore } from '../store/watchlistStore';
import { StatusBadge } from './StatusBadge';
import { WatchlistModal } from './WatchlistModal';

interface WatchlistButtonProps {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  year: string;
  totalEpisodes?: number;
}

export const WatchlistButton: React.FC<WatchlistButtonProps> = ({
  id,
  type,
  title,
  posterPath,
  year,
  totalEpisodes,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const existingEntry = useWatchlistStore((state) => state.getEntry(id, type));

  return (
    <>
      {existingEntry ? (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalOpen(true); }}
          className="cursor-pointer transition-transform hover:scale-105 active:scale-95 border-none bg-transparent p-0 m-0"
        >
          <StatusBadge status={existingEntry.status} className="!px-4 !py-2.5 !text-xs !shadow-md" />
        </button>
      ) : (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalOpen(true); }}
          className="w-full sm:w-auto flex-1 sm:flex-none min-h-[44px] px-5 sm:px-6 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white font-sans font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer shadow-md"
        >
          <Plus size={16} />
          Add to List
        </button>
      )}

      {modalOpen && (
        <WatchlistModal
          id={id}
          type={type}
          title={title}
          posterPath={posterPath}
          year={year}
          totalEpisodes={totalEpisodes}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
