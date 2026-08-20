import React, { useState, useMemo } from 'react';
import { useNavigate, useSearch as useRouteSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  SlidersHorizontal,
  Star,
  RefreshCw,
  Search as SearchIcon,
  User,
  Film,
  Tv,
  Users,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient, type TMDBPerson } from '../api/tmdb';
import { useSearch, type SearchType } from '../hooks/useSearch';
import { SearchAutocomplete } from '../components/SearchAutocomplete';
import { PosterCard } from '../components/PosterCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { Footer } from '../components/Footer';
import { TMDB_IMAGE_BASE, TMDB_POSTER_SIZE } from '../lib/constants';

interface SearchRouteParams {
  q?: string;
}

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const routeSearch = useRouteSearch({ strict: false }) as SearchRouteParams;

  const apiKey = useKeyStore((state) => state.apiKey);
  const tmdb = apiKey ? createTMDBClient(apiKey) : null;

  // Local search state
  const routeQuery = routeSearch?.q ?? '';
  const [searchQuery, setSearchQuery] = useState(routeQuery);
  const [prevRouteQuery, setPrevRouteQuery] = useState(routeQuery);
  const [selectedType, setSelectedType] = useState<SearchType>('all');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [minYear, setMinYear] = useState<string>('');
  const [maxYear, setMaxYear] = useState<string>('');
  const [filterPanelOpen, setFilterPanelOpen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  // Sync route query change
  if (prevRouteQuery !== routeQuery) {
    setPrevRouteQuery(routeQuery);
    setSearchQuery(routeQuery);
  }

  // Fetch Genres
  const { data: movieGenresData } = useQuery({
    queryKey: ['movie-genres'],
    queryFn: ({ signal }) => tmdb!.getMovieGenres({ signal }),
    enabled: !!tmdb,
    staleTime: 1000 * 60 * 60,
  });

  const { data: tvGenresData } = useQuery({
    queryKey: ['tv-genres'],
    queryFn: ({ signal }) => tmdb!.getTVGenres({ signal }),
    enabled: !!tmdb,
    staleTime: 1000 * 60 * 60,
  });

  // Calculate combined or type-specific genres
  const availableGenres = useMemo(() => {
    const movieGenres = movieGenresData?.genres || [];
    const tvGenres = tvGenresData?.genres || [];

    if (selectedType === 'movie') return movieGenres;
    if (selectedType === 'tv') return tvGenres;
    if (selectedType === 'person') return [];

    // Deduplicate by ID for 'all'
    const map = new Map<number, string>();
    for (const g of [...movieGenres, ...tvGenres]) {
      map.set(g.id, g.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [movieGenresData, tvGenresData, selectedType]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedGenres.length > 0) count += selectedGenres.length;
    if (minRating > 0) count += 1;
    if (minYear.trim().length > 0) count += 1;
    if (maxYear.trim().length > 0) count += 1;
    return count;
  }, [selectedGenres, minRating, minYear, maxYear]);

  // Perform search
  const {
    results,
    totalResults,
    isLoading,
    isLoadingMore,
    isError,
    loadMore,
    hasMore,
    refetch,
  } = useSearch({
    query: searchQuery,
    type: selectedType,
    genres: selectedGenres,
    minRating: minRating > 0 ? minRating : undefined,
    minYear: minYear.trim() ? minYear.trim() : undefined,
    maxYear: maxYear.trim() ? maxYear.trim() : undefined,
  });

  const handleQuerySubmit = (newQuery: string) => {
    setSearchQuery(newQuery);
    navigate({
      to: '/search',
      search: { q: newQuery },
    });
  };

  const handleClearAllFilters = () => {
    setSelectedGenres([]);
    setMinRating(0);
    setMinYear('');
    setMaxYear('');
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((gId) => gId !== id) : [...prev, id]
    );
  };

  const handleTypeChange = (type: SearchType) => {
    setSelectedType(type);
    // Reset genres that might not apply
    setSelectedGenres([]);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: '/' });
    }
  };

  // Render Person item card
  const renderPersonCard = (person: TMDBPerson) => {
    const imageUrl = person.profile_path
      ? `${TMDB_IMAGE_BASE}${TMDB_POSTER_SIZE}${person.profile_path}`
      : null;

    return (
      <motion.div
        key={`person-${person.id}`}
        onClick={() =>
          navigate({
            to: '/person/$id',
            params: { id: person.id.toString() },
          })
        }
        whileHover={{ scale: 1.04, y: -4 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full aspect-[2/3] rounded-[var(--radius)] overflow-hidden cursor-pointer group bg-[var(--color-card)] snap-start select-none shadow-md border border-[var(--color-border-subtle)]"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={person.name}
            loading="lazy"
            className="w-full h-full object-cover relative z-0 block"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-card)] text-[var(--color-accent)] p-3 text-center">
            <User size={36} className="text-[var(--color-accent)] mb-2 opacity-80" />
            <span className="text-xs font-sans text-[var(--color-text-muted)] line-clamp-2 px-1">
              {person.name}
            </span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-end p-3"
          style={{
            background:
              'linear-gradient(to top, rgba(7,7,13,0.95) 0%, rgba(7,7,13,0.4) 50%, transparent 100%)',
          }}
        >
          <h3
            className="text-white font-sans font-bold text-xs sm:text-sm leading-snug line-clamp-2 mb-1"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
          >
            {person.name}
          </h3>
          <div className="inline-flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-[rgba(16,185,129,0.2)] border border-[rgba(16,185,129,0.5)] text-[#6ee7b7] text-[9px] uppercase tracking-wider font-semibold">
              {person.known_for_department || 'Actor'}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col justify-between text-[var(--color-text-primary)]">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-[rgba(7,7,13,0.95)] backdrop-blur-xl border-b border-[var(--color-border-subtle)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-3.5 flex items-center gap-3 sm:gap-4">
          {/* Back button (>= 44px touch target) */}
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-full text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-card)] transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Search Input with Autocomplete */}
          <div className="flex-1 max-w-3xl">
            <SearchAutocomplete
              initialValue={searchQuery}
              autoFocus={true}
              placeholder="Search movies, TV shows, people..."
              onSearchSubmit={handleQuerySubmit}
              onClear={() => handleQuerySubmit('')}
            />
          </div>
        </div>


      </header>

      {/* Main Results Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6">
        {/* Results Header / Stats */}
        {searchQuery.trim().length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
                {isLoading ? (
                  <span>Searching for &ldquo;{searchQuery}&rdquo;...</span>
                ) : (
                  <span>
                    Results for &ldquo;<span className="text-[var(--color-accent)]">{searchQuery}</span>&rdquo;
                  </span>
                )}
              </h1>
              {!isLoading && totalResults !== undefined && (
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1 font-sans">
                  Showing {results.length} of {totalResults} matches
                </p>
              )}
            </div>
          </div>
        )}

        {/* Query Empty State (Initial state before typing) */}
        {!searchQuery.trim() && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-accent)] mb-4 shadow-lg">
              <SearchIcon size={28} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-sans text-[var(--color-text-primary)] mb-2">
              Find your next favorite movie or show
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
              Search by title, character, actor, director, or use filters to discover top-rated entertainment.
            </p>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && searchQuery.trim().length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5 md:gap-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonCard key={`skel-${index}`} className="w-full" />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 max-w-md">
              <h3 className="text-base font-bold text-white mb-1.5 font-sans">
                Search request failed
              </h3>
              <p className="text-xs sm:text-sm text-red-200/80 mb-4">
                We encountered an issue fetching results from TMDb. Please verify your connection or API key.
              </p>
              <button
                type="button"
                onClick={refetch}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/80 text-white text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State (No results match) */}
        {!isLoading && !isError && searchQuery.trim().length > 0 && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-text-muted)] mb-4">
              <SearchIcon size={28} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-sans text-white mb-2">
              No results found for &ldquo;{searchQuery}&rdquo;
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] max-w-md mb-5">
              We couldn&apos;t find any titles matching your query. Check for typos or search with a different keyword.
            </p>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && !isError && results.length > 0 && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5 md:gap-6">
              {results.map((item) => {
                if (item.media_type === 'person') {
                  return renderPersonCard(item as TMDBPerson);
                }

                return (
                  <PosterCard
                    key={`${item.id}-${item.media_type || selectedType}`}
                    id={item.id}
                    title={item.title || item.name}
                    posterPath={item.poster_path}
                    mediaType={item.media_type || (selectedType === 'tv' ? 'tv' : 'movie')}
                    voteAverage={item.vote_average}
                    className="w-full"
                  />
                );
              })}
            </div>

            {/* Pagination / Load More */}
            <div className="mt-10 mb-6 flex flex-col items-center justify-center gap-3">
              {isLoadingMore && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5 md:gap-6 w-full mb-6">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonCard key={`more-skel-${index}`} className="w-full" />
                  ))}
                </div>
              )}

              {hasMore && !isLoadingMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  className="w-full sm:w-auto sm:min-w-[240px] px-8 py-3.5 rounded-xl bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50 text-white text-sm font-semibold transition-all shadow-md cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
                >
                  Load More Results
                </button>
              )}

              {!hasMore && results.length > 0 && (
                <p className="text-xs text-[var(--color-text-muted)] font-medium">
                  You&apos;ve reached the end of the results.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
