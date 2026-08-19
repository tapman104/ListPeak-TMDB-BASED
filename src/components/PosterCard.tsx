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
}

export const PosterCard: React.FC<PosterCardProps> = ({ id, title, posterPath, rank, mediaType = 'movie', voteAverage }) => {
  const navigate = useNavigate();
  const imageUrl = posterPath ? `${TMDB_IMAGE_BASE}${TMDB_POSTER_SIZE}${posterPath}` : null;

  const handleClick = () => {
    navigate({
      to: '/detail/$id',
      params: { id: id.toString() },
      search: { type: mediaType }
    });
  };

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ scale: 1.04, y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative w-[160px] shrink-0 aspect-[2/3] rounded-[var(--radius)] overflow-hidden cursor-pointer group bg-[var(--color-card)]"
    >
      {/* Poster Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title || 'Movie poster'}
          loading="lazy"
          className="w-full h-full object-cover relative z-0"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] p-4 text-center text-sm font-sans">
          {title}
        </div>
      )}

      {/* Rank Badge */}
      {rank !== undefined && (
        <div 
          className="absolute bottom-[6px] left-[8px] text-[56px] leading-[1] font-display text-white opacity-45 z-10 pointer-events-none select-none"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
        >
          {rank}
        </div>
      )}

      {/* Hover Overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-250 z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(7,7,13,0.95) 0%, rgba(7,7,13,0.3) 50%, transparent 100%)'
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 px-[10px] pt-[12px] pb-[14px]">
          <h3 
            className="text-white font-sans font-[700] text-[15px] leading-[1.3] mb-[6px]"
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
          
          <div className="inline-block mb-[6px] px-[7px] py-[2px] rounded-[4px] bg-[rgba(124,92,252,0.2)] border border-[rgba(124,92,252,0.5)] text-[#a78bfa] text-[10px] uppercase tracking-[0.06em]">
            {mediaType === 'tv' ? 'SERIES' : 'MOVIE'}
          </div>

          {voteAverage !== undefined && voteAverage > 0 && (
            <div className="flex items-center gap-[4px] text-[#9898b0] text-[12px]">
              <Star fill="#f5c518" stroke="none" size={12} className="text-[#f5c518]" />
              <span>{voteAverage.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
