import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZE } from '../lib/constants';

interface PosterCardProps {
  id: number;
  title?: string;
  posterPath: string | null;
  rank?: number;
  mediaType?: 'movie' | 'tv';
  voteAverage?: number;
  className?: string;
}

export const PosterCard: React.FC<PosterCardProps> = ({ id, title, posterPath, rank, mediaType = 'movie', voteAverage, className }) => {
  const navigate = useNavigate();
  const imageUrl = posterPath ? `${TMDB_IMAGE_BASE}${TMDB_POSTER_SIZE}${posterPath}` : null;

  const handleClick = () => {
    navigate({
      to: '/detail/$id',
      params: { id: id.toString() },
      search: { type: mediaType }
    });
  };

  const containerClasses = className || "w-[130px] min-[375px]:w-[140px] min-[425px]:w-[150px] sm:w-[165px] md:w-[180px] shrink-0";

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`relative aspect-[2/3] rounded-[var(--radius)] overflow-hidden cursor-pointer group bg-[var(--color-card)] snap-start select-none shadow-md ${containerClasses}`}
    >
      {/* Poster Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title || 'Movie poster'}
          loading="lazy"
          className="w-full h-full object-cover relative z-0 block"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] p-3 text-center text-xs font-sans">
          {title}
        </div>
      )}

      {/* Rank Badge */}
      {rank !== undefined && (
        <div 
          className="absolute bottom-[4px] left-[6px] text-[42px] sm:text-[52px] leading-[1] font-display text-white opacity-45 z-10 pointer-events-none select-none"
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.95)' }}
        >
          {rank}
        </div>
      )}

      {/* Always visible subtle score badge for mobile, full hover overlay for desktop */}
      {voteAverage !== undefined && voteAverage > 0 && (
        <div className="md:hidden absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-sans font-bold text-white">
          <Star fill="#f5c518" stroke="none" size={10} />
          <span>{voteAverage.toFixed(1)}</span>
        </div>
      )}

      {/* Hover Overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none hidden md:block"
        style={{
          background: 'linear-gradient(to top, rgba(7,7,13,0.95) 0%, rgba(7,7,13,0.4) 50%, transparent 100%)'
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 
            className="text-white font-sans font-bold text-xs sm:text-sm leading-snug mb-1.5"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)'
            }}
          >
            {title}
          </h3>
          
          <div className="inline-block mb-1.5 px-1.5 py-0.5 rounded bg-[rgba(124,92,252,0.2)] border border-[rgba(124,92,252,0.5)] text-[#a78bfa] text-[9px] uppercase tracking-wider font-semibold">
            {mediaType === 'tv' ? 'SERIES' : 'MOVIE'}
          </div>

          {voteAverage !== undefined && voteAverage > 0 && (
            <div className="flex items-center gap-1 text-[#9898b0] text-[11px]">
              <Star fill="#f5c518" stroke="none" size={11} className="text-[#f5c518]" />
              <span>{voteAverage.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

