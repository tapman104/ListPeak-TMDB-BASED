import React from 'react';
import type { WatchlistEntry } from '../store/watchlistStore';

interface StatusBadgeProps {
  status: WatchlistEntry['status'];
  className?: string;
}

const statusConfig: Record<WatchlistEntry['status'], { label: string; color: string; bg: string }> = {
  watching: { label: 'Watching', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  completed: { label: 'Completed', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)' },
  planning: { label: 'Planning', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.1)' },
  paused: { label: 'Paused', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.1)' },
  dropped: { label: 'Dropped', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status];
  
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-sans font-semibold tracking-wide uppercase transition-colors ${className}`}
      style={{
        backgroundColor: config.bg,
        borderColor: config.color,
        color: config.color,
      }}
    >
      <div 
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </div>
  );
};
