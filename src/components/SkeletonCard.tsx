import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div 
      className="w-[160px] shrink-0 aspect-[2/3] rounded-[var(--radius)] overflow-hidden animate-shimmer"
      style={{
        background: 'linear-gradient(90deg, var(--color-card) 0%, var(--color-card-hover) 50%, var(--color-card) 100%)',
        backgroundSize: '200% 100%'
      }}
    />
  );
};
