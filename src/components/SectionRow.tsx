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
}

export const SectionRow: React.FC<SectionRowProps> = ({ title, items, isLoading, showRank = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

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

  const scrollBy = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section 
      className="relative mb-8 sm:mb-12 max-w-[1600px] mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

      <div className="relative group">
        {/* Navigation Arrows (Desktop only) */}
        <div 
          className={`hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 transition-opacity duration-200 ${
            showLeftArrow && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button 
            onClick={() => scrollBy(-600)}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[rgba(7,7,13,0.85)] border border-[var(--color-border-subtle)] text-white hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition-colors cursor-pointer shadow-lg backdrop-blur-sm"
            aria-label="Scroll Left"
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        <div 
          className={`hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 transition-opacity duration-200 ${
            showRightArrow && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button 
            onClick={() => scrollBy(600)}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[rgba(7,7,13,0.85)] border border-[var(--color-border-subtle)] text-white hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition-colors cursor-pointer shadow-lg backdrop-blur-sm"
            aria-label="Scroll Right"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Row with snap scroll */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-2.5 sm:gap-3.5 no-scrollbar px-4 sm:px-8 md:px-12 pb-3 pt-1 snap-x snap-mandatory"
        >
          {isLoading ? (
            Array.from({ length: 14 }).map((_, i) => <SkeletonCard key={`r-${i}`} />)
          ) : (
            items.map((item, index) => (
              <PosterCard
                key={item.id}
                id={item.id}
                title={item.title || item.name}
                posterPath={item.poster_path}
                rank={showRank ? index + 1 : undefined}
                mediaType={item.media_type}
                voteAverage={item.vote_average}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

