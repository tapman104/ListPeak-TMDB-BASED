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
      setShowLeftArrow(scrollLeft > 0);
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
      className="relative mb-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-end px-[48px] mb-[20px]">
        <div>
          <h2 className="font-sans text-[18px] font-semibold text-[var(--color-text-primary)] tracking-[-0.01em]">
            {title}
          </h2>
          <div className="w-[32px] h-[2px] bg-[var(--color-accent)] rounded-[2px] mt-[6px]" />
        </div>
        <button className="font-sans text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors duration-200">
          See all &rarr;
        </button>
      </div>

      <div className="relative">
        {/* Navigation Arrows */}
        <div 
          className={`absolute left-[16px] top-1/2 -translate-y-1/2 z-30 transition-opacity duration-200 ${
            showLeftArrow && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button 
            onClick={() => scrollBy(-800)}
            className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-[rgba(7,7,13,0.8)] border border-[var(--color-border-subtle)] text-white hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <div 
          className={`absolute right-[16px] top-1/2 -translate-y-1/2 z-30 transition-opacity duration-200 ${
            showRightArrow && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button 
            onClick={() => scrollBy(800)}
            className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-[rgba(7,7,13,0.8)] border border-[var(--color-border-subtle)] text-white hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Row */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-[12px] no-scrollbar px-[48px] pb-[8px] pt-[4px]"
        >
          {isLoading ? (
            Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={`r-${i}`} />)
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
