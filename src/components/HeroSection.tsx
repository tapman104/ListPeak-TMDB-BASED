import React from 'react';
import { motion } from 'motion/react';
import { PlayCircle, Plus, Star } from 'lucide-react';
import type { TMDBMedia } from '../api/tmdb';
import { TMDB_IMAGE_BASE, TMDB_BACKDROP_SIZE } from '../lib/constants';
import { useNavigate } from '@tanstack/react-router';

interface HeroSectionProps {
  item: TMDBMedia | null;
  isLoading: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ item, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading || !item) {
    return <div className="min-h-[480px] sm:min-h-[560px] md:h-[88vh] w-full bg-[var(--color-surface)] animate-pulse" />;
  }

  const backdropUrl = item.backdrop_path ? `${TMDB_IMAGE_BASE}${TMDB_BACKDROP_SIZE}${item.backdrop_path}` : '';
  const title = item.title || item.name;
  const releaseYear = (item.release_date || item.first_air_date || '').substring(0, 4);
  const mediaType = item.media_type === 'tv' ? 'SERIES' : 'MOVIE';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: "easeOut" as const } 
    }
  };

  const handleHeroClick = () => {
    navigate({
      to: '/detail/$id',
      params: { id: item.id.toString() },
      search: { type: item.media_type || 'movie' }
    });
  };

  return (
    <div className="relative min-h-[500px] sm:min-h-[580px] md:h-[88vh] w-full overflow-hidden bg-[var(--color-background)]">
      {/* Backdrop Image */}
      <div className="absolute inset-0 w-full h-full">
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover object-top"
          />
        )}
      </div>
      
      {/* Gradient Overlays */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, rgba(7,7,13,0.95) 0%, rgba(7,7,13,0.7) 40%, rgba(7,7,13,0.2) 75%, transparent 100%)'
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(7,7,13,1) 0%, rgba(7,7,13,0.4) 30%, transparent 60%)'
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(7,7,13,0.6) 0%, transparent 25%)'
        }}
      />

      {/* Content */}
      <div className="absolute bottom-6 sm:bottom-10 md:bottom-[14%] left-4 sm:left-8 md:left-[8%] lg:left-[10%] right-4 md:right-auto z-10 max-w-3xl">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-3 sm:gap-4"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span className="inline-block px-2.5 py-1 bg-[var(--color-accent)] rounded-full text-white font-display text-[10px] sm:text-[11px] tracking-wider uppercase leading-none">
              TRENDING #1
            </span>
          </motion.div>
          
          {/* Title */}
          <motion.h1 
            variants={itemVariants}
            className="font-display font-bold text-white leading-[0.92] tracking-tight break-words whitespace-normal max-w-full"
            style={{ fontSize: 'clamp(2.2rem, 5.5vw, 5.2rem)' }}
          >
            <span className="line-clamp-2">{title}</span>
          </motion.h1>
          
          {/* Metadata Row */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 sm:gap-4 text-[var(--color-text-muted)] font-sans text-xs sm:text-sm flex-wrap">
            {item.vote_average > 0 && (
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <Star fill="#f5c518" stroke="none" size={14} />
                <span>{item.vote_average.toFixed(1)}</span>
              </div>
            )}
            {item.vote_average > 0 && <span>&middot;</span>}
            {releaseYear && (
              <>
                <span>{releaseYear}</span>
                <span>&middot;</span>
              </>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)] leading-none flex items-center h-[20px]">
              {mediaType}
            </span>
          </motion.div>
          
          {/* Overview */}
          {item.overview && (
            <motion.p 
              variants={itemVariants}
              className="text-[var(--color-text-muted)] font-sans text-xs sm:text-sm md:text-base leading-[1.5] line-clamp-2 md:line-clamp-3 max-w-2xl text-[#c4c4d4]"
            >
              {item.overview}
            </motion.p>
          )}
          
          {/* Buttons */}
          <motion.div variants={itemVariants} className="flex items-center gap-2.5 sm:gap-3 mt-1 sm:mt-2 flex-wrap">
            <button 
              onClick={handleHeroClick}
              className="flex items-center justify-center gap-2 min-h-[44px] px-5 sm:px-6 bg-white hover:bg-white/90 active:scale-[0.98] text-[#07070d] rounded-full font-sans font-semibold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <PlayCircle size={18} />
              View Details
            </button>
            <button 
              onClick={handleHeroClick}
              className="flex items-center justify-center gap-2 min-h-[44px] px-5 sm:px-6 bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white border border-white/20 rounded-full font-sans font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <Plus size={18} />
              My List
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

