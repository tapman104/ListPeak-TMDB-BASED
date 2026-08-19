import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div 
      className="w-[130px] min-[375px]:w-[140px] min-[425px]:w-[150px] sm:w-[165px] md:w-[180px] shrink-0 aspect-[2/3] rounded-[var(--radius)] overflow-hidden animate-shimmer snap-start"
      style={{
        background: 'linear-gradient(90deg, var(--color-card) 0%, var(--color-card-hover) 50%, var(--color-card) 100%)',
        backgroundSize: '200% 100%'
      }}
    />
  );
};

