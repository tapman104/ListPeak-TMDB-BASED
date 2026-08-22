import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useKeyStore } from '../store/keyStore';
import { useFilterStore } from '../store/filterStore';
import { createTMDBClient } from '../api/tmdb';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { SectionRow } from '../components/SectionRow';
import { Footer } from '../components/Footer';
import { AlertCircle } from 'lucide-react';

export const HomePage: React.FC = () => {
  const apiKey = useKeyStore((state) => state.apiKey);
  const { homepage: homepageFilter, hideAdult, hideVarietyShows, hideBL, hideLesbian } = useFilterStore();
  const navigate = useNavigate();

  const tmdb = apiKey ? createTMDBClient(apiKey) : null;
  const VALID_REGIONS = ['all', 'ko', 'ja', 'zh', 'th', 'cn', 'tw'];
  const safeHomepageFilter = VALID_REGIONS.includes(homepageFilter) ? homepageFilter : 'all';

  const REGION_TO_LANG: Partial<Record<string, string>> = { cn: 'zh', tw: 'zh' };
  const originLanguage = safeHomepageFilter === 'all'
    ? undefined
    : (REGION_TO_LANG[safeHomepageFilter] ?? safeHomepageFilter);

  const { data: trendingWeek, isLoading: isLoadingWeek, error: errorWeek } = useQuery({
    queryKey: ['trending-week', safeHomepageFilter],
    queryFn: ({ signal }) => tmdb!.getTrendingWeek({ signal }, originLanguage),
    enabled: !!apiKey,
    staleTime: 1000 * 60 * 5,
  });

  const { data: blIds } = useQuery({
    queryKey: ['bl-exclusion-ids'],
    queryFn: ({ signal }) => tmdb!.getBLIds({ signal }),
    enabled: !!apiKey && hideBL,
    staleTime: 1000 * 60 * 60,
  });

  const { data: glIds } = useQuery({
    queryKey: ['gl-exclusion-ids'],
    queryFn: ({ signal }) => tmdb!.getGLIds({ signal }),
    enabled: !!apiKey && hideLesbian,
    staleTime: 1000 * 60 * 60,
  });

  if (!apiKey) {
    return null;
  }

  const filterItems = (items?: any[], originLang?: string) => {
    if (!items) return [];

    const blExclusionSet = new Set(blIds || []);
    const glExclusionSet = new Set(glIds || []);

    return items.filter((item) => {
      if (hideAdult && item.adult === true) return false;
      if (hideVarietyShows && item.genre_ids) {
        if (item.genre_ids.includes(10764) || item.genre_ids.includes(10767)) return false;
      }
      if (hideBL && blExclusionSet.has(item.id)) return false;
      if (hideLesbian && glExclusionSet.has(item.id)) return false;
      if (originLang && item.original_language !== originLang) return false;
      return true;
    });
  };

  const filteredTrending = filterItems(trendingWeek?.results, originLanguage);
  const heroItem = filteredTrending[0] || null;

  const hasAuthError = errorWeek?.message === 'API key invalid or expired';

  if (hasAuthError) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 sm:p-8 max-w-md text-center">
          <AlertCircle className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2 font-display tracking-wide">API key invalid or expired</h2>
          <p className="text-red-200 mb-6 text-sm">Please update your TMDb API key to continue.</p>
          <button 
            onClick={() => {
              useKeyStore.getState().clearApiKey();
              navigate({ to: '/setup' });
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors cursor-pointer min-h-[44px]"
          >
            Update Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-1">
        <HeroSection item={heroItem} isLoading={isLoadingWeek} />
        
        <div className="mt-[-2.5rem] sm:mt-[-3.5rem] md:mt-[-5rem] relative z-20 space-y-1 sm:space-y-2">
          <SectionRow 
            title="Trending This Week" 
            items={filteredTrending} 
            isLoading={isLoadingWeek}
            showRank={true}
          />
          

        </div>
      </main>

      <Footer />
    </div>
  );
};

