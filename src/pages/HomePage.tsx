import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useKeyStore } from '../store/keyStore';
import { useFilterStore } from '../store/filterStore';
import { useHiddenStore } from '../store/hiddenStore';
import { useDismissedStore } from '../store/dismissedStore';
import { createTMDBClient } from '../api/tmdb';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { PosterCard } from '../components/PosterCard';
import { Footer } from '../components/Footer';
import { AlertCircle } from 'lucide-react';

const NSFW_KEYWORDS = [
  'love class', 'semantic error', 'to my star', 'nobleman ryu',
  'wish you', 'where your eyes linger', 'light on me',
  'a shoulder to cry on', 'mr. heart', 'kissable lips',
  'behind cut', 'history', 'stay with me', 'roommates of poongduck',
  'tinted with you', 'you make me dance', 'unintentional love story',
  'my sweet dear', 'our dating sim', 'weak hero',
  'sotus', 'theory of love', '2gether', 'bright win',
  'bad buddy', 'kinn porsche', 'not me', 'between us',
  'only friends', 'my school president', 'the eclipse',
  'a tale of thousand stars', 'love in the air', 'bed friend',
  'my gear and your gown', 'vice versa', 'dangerous romance',
  'given', 'cherry magic', 'blue flag',
  'citrus', 'bloom into you',
  'boys love', 'bl drama', 'gl drama', 'yaoi',
];

export const HomePage: React.FC = () => {
  const apiKey = useKeyStore((state) => state.apiKey);
  const { homepage: homepageFilter, hideAdult, hideVarietyShows, hideNSFW } = useFilterStore();
  const hiddenItems = useHiddenStore((state) => state.hiddenItems);
  const dismissed = useDismissedStore((state) => state.dismissed);
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
    queryFn: async ({ signal }) => {
      const [page1, page2, page3] = await Promise.all([
        tmdb!.getTrendingWeek({ signal }, originLanguage, 1),
        tmdb!.getTrendingWeek({ signal }, originLanguage, 2),
        tmdb!.getTrendingWeek({ signal }, originLanguage, 3)
      ]);
      return {
        results: [...page1.results, ...page2.results, ...page3.results]
      };
    },
    enabled: !!apiKey,
    staleTime: 1000 * 60 * 5,
  });

  const { data: nsfwIds } = useQuery({
    queryKey: ['nsfw-exclusion-ids'],
    queryFn: ({ signal }) => tmdb!.getNSFWIds({ signal }),
    enabled: !!apiKey && hideNSFW,
    staleTime: 1000 * 60 * 60,
  });

  if (!apiKey) {
    return null;
  }

  const filterItems = (items?: any[], originLang?: string) => {
    if (!items) return [];

    const nsfwExclusionSet = new Set(nsfwIds || []);

    return items.filter((item) => {
      if (hideAdult && item.adult === true) return false;
      if (hideVarietyShows && item.genre_ids) {
        if (item.genre_ids.includes(10764) || item.genre_ids.includes(10767)) return false;
      }
      if (hideNSFW && nsfwExclusionSet.has(item.id)) return false;
      if (originLang && item.original_language !== originLang) return false;
      
      const itemType = item.media_type ?? item.type ?? (item.title ? 'movie' : 'tv');
      if (hiddenItems.some(h => h.id === item.id && h.type === itemType)) return false;
      if (dismissed.some(d => d.id === item.id && d.type === itemType)) return false;
      
      return true;
    });
  };

  let filteredTrending = filterItems(trendingWeek?.results, originLanguage);

  if (hideNSFW) {
    filteredTrending = filteredTrending.filter(item => !NSFW_KEYWORDS.some(kw =>
      item.name?.toLowerCase().includes(kw) ||
      item.title?.toLowerCase().includes(kw) ||
      item.original_name?.toLowerCase().includes(kw) ||
      item.original_title?.toLowerCase().includes(kw)
    ));
  }

  filteredTrending = filteredTrending.slice(0, 50);

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
          <div className="px-4 sm:px-8 md:px-12 max-w-[1600px] mx-auto w-full">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-4 px-2 sm:px-4">
              Trending This Week
            </h2>
            {isLoadingWeek ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-2 sm:px-4">
                <div className="text-white animate-pulse col-span-full">Loading...</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-2 sm:px-4">
                {filteredTrending.map((item, index) => (
                  <PosterCard
                    key={item.id}
                    id={item.id}
                    title={item.title || item.name}
                    posterPath={item.poster_path}
                    rank={index + 1}
                    mediaType={item.media_type}
                    voteAverage={item.vote_average}
                    className="w-full"
                    showHideMenu={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

