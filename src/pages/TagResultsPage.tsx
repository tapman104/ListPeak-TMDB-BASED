import React from 'react';
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useKeyStore } from '../store/keyStore';
import { useFilterStore } from '../store/filterStore';
import { useHiddenStore } from '../store/hiddenStore';
import { useDismissedStore } from '../store/dismissedStore';
import { createTMDBClient } from '../api/tmdb';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PosterCard } from '../components/PosterCard';
import { ArrowLeft } from 'lucide-react';

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

export const TagResultsPage: React.FC = () => {
  const { id } = useParams({ from: '/tag/$id' });
  const { name, type } = useSearch({ from: '/tag/$id' }) as { name?: string; type: 'all' | 'movie' | 'tv' };
  const navigate = useNavigate();
  const apiKey = useKeyStore((state) => state.apiKey);
  const tmdb = apiKey ? createTMDBClient(apiKey) : null;
  const { hideNSFW } = useFilterStore();
  const hiddenItems = useHiddenStore((state) => state.hiddenItems);
  const dismissed = useDismissedStore((state) => state.dismissed);
  
  const keywordId = Number(id);
  const keywordName = name || `Tag #${id}`;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['tag-results', keywordId, type],
    queryFn: async ({ pageParam = 1, signal }) => {
      const res = await tmdb!.getDiscoverByKeyword({
        keywordId,
        mediaType: type,
        page: pageParam,
        signal
      });
      return res;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!apiKey && !!tmdb,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  if (!apiKey) return null;

  // Flatten and filter results
  const allResults = data?.pages.flatMap(page => page.results) || [];
  
  let filteredResults = allResults.filter(item => {
    const mediaType = item.media_type ?? (item.title ? 'movie' : 'tv');
    if (hiddenItems.some(h => h.id === item.id && h.type === mediaType)) return false;
    if (dismissed.some(d => d.id === item.id && d.type === mediaType)) return false;
    return true;
  });

  if (hideNSFW) {
    filteredResults = filteredResults.filter(item => !NSFW_KEYWORDS.some(kw => {
      const i = item as any;
      return i.name?.toLowerCase().includes(kw) ||
        i.title?.toLowerCase().includes(kw) ||
        i.original_name?.toLowerCase().includes(kw) ||
        i.original_title?.toLowerCase().includes(kw);
    }));
  }

  const totalResults = data?.pages[0]?.total_results || 0;

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12 px-4 sm:px-8 md:px-12 max-w-[1600px] mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: '/' })}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors w-fit font-sans text-sm font-medium mb-2"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div className="flex items-baseline gap-4 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-white uppercase tracking-wide">
                #{keywordName}
              </h1>
              {!isLoading && (
                <span className="text-white/60 font-sans font-medium">
                  {totalResults} titles
                </span>
              )}
            </div>
          </div>
          
          {/* Type Filter Tabs */}
          <div className="flex items-center bg-[#1c1c2e] p-1 rounded-xl w-fit">
            {(['all', 'tv', 'movie'] as const).map((t) => (
              <button
                key={t}
                onClick={() => navigate({ to: '/tag/$id', params: { id: String(keywordId) }, search: { name: keywordName, type: t } })}
                className={`px-6 py-2 rounded-lg font-sans text-sm font-semibold capitalize transition-all ${
                  type === t
                    ? 'bg-[var(--color-accent)] text-black shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {t === 'tv' ? 'Drama' : t}
              </button>
            ))}
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            <div className="text-white animate-pulse">Loading results...</div>
          </div>
        ) : isError ? (
          <div className="text-white/60 py-10 text-center font-sans">
            Could not load results. Please try again.
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-white/60 py-10 text-center font-sans">
            No results found for this tag.
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 w-full">
              {filteredResults.map((item) => (
                <PosterCard
                  key={`${item.id}-${item.media_type}`}
                  id={item.id}
                  title={item.title || item.name}
                  posterPath={item.poster_path}
                  mediaType={item.media_type as 'movie' | 'tv'}
                  voteAverage={item.vote_average}
                  className="w-full"
                  showHideMenu={true}
                />
              ))}
            </div>
            
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mt-12 px-8 py-3 rounded-full bg-[#1c1c2e] hover:bg-[#2a2a40] text-white font-sans font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 shadow-lg"
              >
                {isFetchingNextPage ? 'Loading more...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
