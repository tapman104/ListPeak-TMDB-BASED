import React, { useMemo } from 'react';
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



const ORIGIN_FILTERS = [
  { label: 'All',        lang: 'all' },
  { label: 'K-Drama',   lang: 'ko'  },
  { label: 'J-Drama',   lang: 'ja'  },
  { label: 'C-Drama',   lang: 'zh'  },
  { label: 'Thai',      lang: 'th'  },
  { label: 'Chinese',   lang: 'cn'  },
  { label: 'Taiwanese', lang: 'tw'  },
];

export const TagResultsPage: React.FC = () => {
  const { id } = useParams({ from: '/tag/$id' });
  const { name, type, lang, sort, minRating } = useSearch({ from: '/tag/$id' });
  const navigate = useNavigate();
  const apiKey = useKeyStore((state) => state.apiKey);
  const tmdb = useMemo(
    () => (apiKey ? createTMDBClient(apiKey) : null),
    [apiKey]
  );
  const { hideVarietyShows, showTagOriginFilter, tagResults: settingsLang } = useFilterStore();
  const hiddenItems = useHiddenStore((state) => state.hiddenItems);
  const dismissed = useDismissedStore((state) => state.dismissed);
  
  const keywordId = Number(id);
  const keywordName = name || `Tag #${id}`;

  const effectiveLang = (lang === 'all' && settingsLang !== 'all')
    ? settingsLang
    : lang;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['tag-results', keywordId, type, effectiveLang, sort, minRating],
    queryFn: async ({ pageParam = 1, signal }) => {
      const res = await tmdb!.getDiscoverByKeyword({
        keywordId,
        mediaType: type,
        page: pageParam,
        signal,
        originLanguage: effectiveLang,
        sortBy: sort,
        minRating: minRating
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



  if (hideVarietyShows) {
    filteredResults = filteredResults.filter(item => {
      if (!item.genre_ids) return true;
      return !item.genre_ids.includes(10764) && !item.genre_ids.includes(10767);
    });
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
                onClick={() => navigate({ to: '/tag/$id', params: { id: String(keywordId) }, search: { name: keywordName, type: t, lang: effectiveLang, sort, minRating } })}
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
        
        {/* Origin Filters */}
        {showTagOriginFilter && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {ORIGIN_FILTERS.map((f) => (
              <button
                key={f.lang}
                onClick={() => navigate({ to: '/tag/$id', params: { id: String(keywordId) }, search: { name: keywordName, type, lang: f.lang, sort, minRating } })}
                className={`px-4 py-1.5 rounded-full font-sans text-sm font-semibold transition-all ${
                  effectiveLang === f.lang
                    ? 'bg-[var(--color-accent)] text-black shadow-md'
                    : 'bg-[#1c1c2e] text-white/60 hover:text-white hover:bg-[#2a2a40]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Content Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <select
            value={sort}
            onChange={(e) => navigate({ to: '/tag/$id', params: { id: String(keywordId) }, search: { name: keywordName, type, lang: effectiveLang, sort: e.target.value as any, minRating } })}
            className="bg-[#1c1c2e] text-white/80 text-sm font-sans font-semibold px-4 py-2 rounded-xl border border-white/10 cursor-pointer hover:bg-[#2a2a40] transition-colors outline-none"
          >
            <option value="popularity">Most Popular</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
          </select>

          <div className="flex items-center gap-2 bg-[#1c1c2e] p-1 rounded-xl">
            {[0, 6, 7, 8].map((rating) => (
              <button
                key={rating}
                onClick={() => navigate({ to: '/tag/$id', params: { id: String(keywordId) }, search: { name: keywordName, type, lang: effectiveLang, sort, minRating: rating } })}
                className={`px-4 py-1 rounded-lg font-sans text-sm font-semibold transition-all ${
                  minRating === rating
                    ? 'bg-[var(--color-accent)] text-black shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {rating === 0 ? 'All' : `${rating}+`}
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
