import React from 'react';
import { motion } from 'motion/react';
import { PlayCircle, Plus, Star } from 'lucide-react';
import type { TMDBMedia } from '../api/tmdb';
import { TMDB_IMAGE_BASE, TMDB_BACKDROP_SIZE } from '../lib/constants';

interface HeroSectionProps {
  item: TMDBMedia | null;
  isLoading: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ item, isLoading }) => {
  if (isLoading || !item) {
    return <div className="min-h-[560px] h-[88vh] w-full bg-[var(--color-surface)] animate-pulse" />;
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

  return (
    <div className="relative min-h-[560px] h-[88vh] w-full overflow-hidden bg-[var(--color-background)]">
      {/* Backdrop Image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={backdropUrl}
          alt={title}
          className="w-full h-full object-cover object-top"
        />
      </div>
      
      {/* Gradient Overlays */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, rgba(7,7,13,0.95) 0%, rgba(7,7,13,0.4) 60%, transparent 100%)'
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(7,7,13,1) 0%, transparent 40%)'
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(7,7,13,0.3) 0%, transparent 20%)'
        }}
      />

      {/* Content */}
      <div className="absolute bottom-[15%] left-[10%] z-10 max-w-3xl pr-4">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <span className="inline-block px-3 py-1 bg-[var(--color-accent)] rounded-full text-white font-display text-[11px] tracking-wider uppercase leading-none">
              TRENDING #1
            </span>
          </motion.div>
          
          {/* Title */}
          <motion.h1 
            variants={itemVariants}
            className="font-display font-bold text-white leading-[0.9]"
            style={{ fontSize: 'clamp(48px, 6vw, 88px)' }}
          >
            <span className="line-clamp-2">{title}</span>
          </motion.h1>
          
          {/* Metadata Row */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 text-[var(--color-muted)] font-sans text-[15px]">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <Star fill="#f5c518" stroke="none" size={14} />
              <span>{item.vote_average.toFixed(1)}</span>
            </div>
            <span>&middot;</span>
            <span>{releaseYear}</span>
            <span>&middot;</span>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)] leading-none flex items-center h-[20px]">
              {mediaType}
            </span>
          </motion.div>
          
          {/* Overview */}
          <motion.p 
            variants={itemVariants}
            className="text-[var(--color-muted)] font-sans text-[14px] leading-[1.6] line-clamp-2 max-w-2xl"
          >
            {item.overview}
          </motion.p>
          
          {/* Buttons */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 mt-2">
            <button className="flex items-center justify-center gap-2 h-[44px] px-6 bg-white hover:bg-white/90 hover:scale-[1.03] text-[#07070d] rounded-full font-sans font-semibold text-[14px] transition-all">
              <PlayCircle size={18} />
              Play Trailer
            </button>
            <button className="flex items-center justify-center gap-2 h-[44px] px-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full font-sans font-semibold text-[14px] transition-colors">
              <Plus size={18} />
              My List
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
