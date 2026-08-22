import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PosterCard } from './PosterCard';
import { SkeletonCard } from './SkeletonCard';
import type { TMDBMedia } from '../api/tmdb';

interface SectionRowProps {
  title: string;
  items: TMDBMedia[];
  isLoading: boolean;
  showRank?: boolean;
  mediaType?: 'movie' | 'tv';
}

export const SectionRow: React.FC<SectionRowProps> = ({ title, items, isLoading, showRank = false, mediaType }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [items]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = Math.max(scrollRef.current.clientWidth * 0.75, 600);
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <section 
      className="relative mb-8 sm:mb-12 max-w-[1600px] mx-auto group"
    >
      <div className="flex justify-between items-end px-4 sm:px-8 md:px-12 mb-3 sm:mb-4">
        <div>
          <h2 className="font-sans text-base sm:text-lg md:text-xl font-semibold text-[var(--color-text-primary)] tracking-[-0.01em]">
            {title}
          </h2>
          <div className="w-7 sm:w-8 h-[2px] bg-[var(--color-accent)] rounded-[2px] mt-1.5" />
        </div>
        <button 
          className="font-sans text-xs sm:text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors py-2 px-1 min-h-[44px] flex items-center cursor-pointer"
        >
          See all &rarr;
        </button>
      </div>

      <div className="relative">
        {/* Navigation Arrows (Desktop only) */}
        {showLeftArrow && (
          <div
            className="hidden md:flex absolute left-0 top-0 bottom-0 w-24 z-30 items-center justify-start pl-4 lg:pl-8 bg-gradient-to-r from-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <button 
              onClick={() => scrollByAmount('left')}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-[rgba(7,7,13,0.85)] border border-[var(--color-border-subtle)] text-white hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition-colors cursor-pointer shadow-lg backdrop-blur-sm pointer-events-auto"
              aria-label="Scroll Left"
            >
              <ChevronLeft size={22} />
            </button>
          </div>
        )}

        {showRightArrow && (
          <div
            className="hidden md:flex absolute right-0 top-0 bottom-0 w-24 z-30 items-center justify-end pr-4 lg:pr-8 bg-gradient-to-l from-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <button 
              onClick={() => scrollByAmount('right')}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-[rgba(7,7,13,0.85)] border border-[var(--color-border-subtle)] text-white hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition-colors cursor-pointer shadow-lg backdrop-blur-sm pointer-events-auto"
              aria-label="Scroll Right"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        )}

        {/* Row with snap scroll */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-2.5 sm:gap-3.5 px-4 sm:px-8 md:px-12 pb-6 pt-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
          }}
        >
          {isLoading ? (
            Array.from({ length: 14 }).map((_, i) => <SkeletonCard key={`r-${i}`} className="w-36 sm:w-40 md:w-44 shrink-0" />)
          ) : (
            items.map((item, index) => (
              <PosterCard
                key={item.id}
                id={item.id}
                title={item.title || item.name}
                posterPath={item.poster_path}
                rank={showRank ? index + 1 : undefined}
                mediaType={item.media_type ?? mediaType}
                voteAverage={item.vote_average}
                adult={item.adult}
                genreIds={item.genre_ids}
                className="w-36 sm:w-40 md:w-44 shrink-0"
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

