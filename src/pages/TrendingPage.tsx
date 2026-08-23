import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useKeyStore } from '../store/keyStore';
import { useFilterStore } from '../store/filterStore';
import { createTMDBClient } from '../api/tmdb';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PosterCard } from '../components/PosterCard';
import { useHiddenStore } from '../store/hiddenStore';
import { useDismissedStore } from '../store/dismissedStore';

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

export const TrendingPage: React.FC = () => {
  const apiKey = useKeyStore((state) => state.apiKey);
  const tmdb = apiKey ? createTMDBClient(apiKey) : null;
  const { hideNSFW } = useFilterStore();
  const hiddenItems = useHiddenStore((state) => state.hiddenItems);
  const dismissed = useDismissedStore((state) => state.dismissed);

  const { data: trendingWeek, isLoading } = useQuery({
    queryKey: ['trending-week-multiple'],
    queryFn: async ({ signal }) => {
      // Fetching 3 pages to get at least 50 results (20 items per page)
      const [page1, page2, page3] = await Promise.all([
        tmdb!.getTrendingWeek({ signal }, undefined, 1),
        tmdb!.getTrendingWeek({ signal }, undefined, 2),
        tmdb!.getTrendingWeek({ signal }, undefined, 3)
      ]);
      return {
        results: [...page1.results, ...page2.results, ...page3.results]
      };
    },
    enabled: !!apiKey,
    staleTime: 1000 * 60 * 5,
  });

  if (!apiKey) return null;

  let filteredTrending = trendingWeek?.results?.filter(item => {
    const type = item.media_type ?? 'movie';
    if (hiddenItems.some(h => h.id === item.id && h.type === type)) return false;
    if (dismissed.some(d => d.id === item.id && d.type === type)) return false;
    return true;
  }) || [];

  if (hideNSFW) {
    filteredTrending = filteredTrending.filter(item => !NSFW_KEYWORDS.some(kw => {
      const i = item as any;
      return i.name?.toLowerCase().includes(kw) ||
        i.title?.toLowerCase().includes(kw) ||
        i.original_name?.toLowerCase().includes(kw) ||
        i.original_title?.toLowerCase().includes(kw);
    }));
  }

  filteredTrending = filteredTrending.slice(0, 50);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12 px-4 sm:px-8 md:px-12 max-w-[1600px] mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-6">
          Trending This Week
        </h1>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            <div className="text-white animate-pulse">Loading trending...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
      </main>

      <Footer />
    </div>
  );
};
