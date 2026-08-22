import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useFilterStore, type DramaRegion } from '../store/filterStore';

interface FilterSettingsProps {
  open: boolean;
  onClose: () => void;
}

const REGIONS: { label: string; value: DramaRegion }[] = [
  { label: 'All', value: 'all' },
  { label: 'K-Drama', value: 'ko' },
  { label: 'J-Drama', value: 'ja' },
  { label: 'C-Drama', value: 'zh' },
  { label: 'Thai', value: 'th' },
  { label: 'Chinese', value: 'cn' },
  { label: 'Taiwanese', value: 'tw' },
];

export const FilterSettings: React.FC<FilterSettingsProps> = ({ open, onClose }) => {
  const { homepage, recommendations, search, hideAdult, hideVarietyShows, hideBL, hideLesbian, setFilter, setContentOption } = useFilterStore();

  const renderSection = (title: string, scope: 'homepage' | 'recommendations' | 'search', currentValue: DramaRegion) => (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((region) => (
          <button
            key={region.value}
            onClick={() => {
              console.log('Filter clicked:', scope, region.value);
              setFilter(scope, region.value);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              currentValue === region.value
                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border-subtle)] hover:border-[var(--color-text-muted)]'
            }`}
          >
            {region.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[var(--color-background)] border-l border-[var(--color-border-subtle)] z-[101] shadow-2xl overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold font-display text-[var(--color-text-primary)]">Content Filters</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {renderSection('Homepage', 'homepage', homepage)}
              {renderSection('Recommendations', 'recommendations', recommendations)}
              {renderSection('Search', 'search', search)}

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">Content Options</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">Hide Adult Content</span>
                    <button
                      onClick={() => setContentOption('hideAdult', !hideAdult)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        hideAdult ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface)] border border-[var(--color-border-subtle)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          hideAdult ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">Hide Variety & Reality Shows</span>
                    <button
                      onClick={() => setContentOption('hideVarietyShows', !hideVarietyShows)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        hideVarietyShows ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface)] border border-[var(--color-border-subtle)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          hideVarietyShows ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col mr-4">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">Hide BL / Boys Love</span>
                      <span className="text-xs text-[var(--color-text-muted)] mt-0.5">Filters known BL/GL titles by keyword</span>
                    </div>
                    <button
                      onClick={() => setContentOption('hideBL', !hideBL)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        hideBL ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface)] border border-[var(--color-border-subtle)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          hideBL ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col mr-4">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">Hide Yuri / GL Content</span>
                      <span className="text-xs text-[var(--color-text-muted)] mt-0.5">Filters known BL/GL titles by keyword</span>
                    </div>
                    <button
                      onClick={() => setContentOption('hideLesbian', !hideLesbian)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        hideLesbian ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface)] border border-[var(--color-border-subtle)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          hideLesbian ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
