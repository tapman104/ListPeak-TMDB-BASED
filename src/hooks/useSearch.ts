import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient, type SearchResultItem } from '../api/tmdb';

export type SearchType = 'all' | 'movie' | 'tv' | 'person';

export interface UseSearchOptions {
  query: string;
  type?: SearchType;
  genres?: number[];
  year?: string | number | null;
  minYear?: string | number | null;
  maxYear?: string | number | null;
  minRating?: number;
}

export const useSearch = ({
  query,
  type = 'all',
  genres = [],
  year = null,
  minYear = null,
  maxYear = null,
  minRating = 0,
}: UseSearchOptions) => {
  const apiKey = useKeyStore((state) => state.apiKey);
  const [rawResults, setRawResults] = useState<SearchResultItem[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchIdRef = useRef(0);

  const applyFilters = useCallback(
    (items: SearchResultItem[]): SearchResultItem[] => {
      return items.filter((item) => {
        // If it's a person
        if (item.media_type === 'person') {
          if (type === 'person') return true;
          // In 'all' tab, if strict movie/tv filters are set, filter person
          if (genres.length > 0 || (minRating && minRating > 0) || year || minYear || maxYear) {
            return false;
          }
          return true;
        }

        // For movie / tv
        const itemYearStr = item.release_date || item.first_air_date || '';
        const itemYear = itemYearStr ? parseInt(itemYearStr.slice(0, 4), 10) : null;

        // Exact year check
        if (year && (!itemYear || itemYear.toString() !== year.toString())) {
          return false;
        }

        // Min year check
        if (minYear && itemYear && itemYear < Number(minYear)) {
          return false;
        }

        // Max year check
        if (maxYear && itemYear && itemYear > Number(maxYear)) {
          return false;
        }

        // Rating check
        if (minRating > 0 && (item.vote_average === undefined || item.vote_average < minRating)) {
          return false;
        }

        // Genre check
        if (genres.length > 0) {
          if (!item.genre_ids || item.genre_ids.length === 0) {
            return false;
          }
          const hasMatchingGenre = genres.some((gId) => item.genre_ids.includes(gId));
          if (!hasMatchingGenre) {
            return false;
          }
        }

        return true;
      });
    },
    [type, genres, year, minYear, maxYear, minRating]
  );

  // Derive filtered results without extra render cycle
  const results = useMemo(() => applyFilters(rawResults), [applyFilters, rawResults]);

  // Main search effect on query/type change
  useEffect(() => {
    let isCurrent = true;
    const trimmed = query.trim();

    if (!apiKey || !trimmed) {
      queueMicrotask(() => {
        if (isCurrent) {
          setRawResults([]);
          setTotalResults(0);
          setTotalPages(0);
          setIsLoading(false);
          setIsError(false);
          setError(null);
        }
      });
      return () => {
        isCurrent = false;
      };
    }

    const tmdb = createTMDBClient(apiKey);

    const performSearch = async () => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        let fetchedItems: SearchResultItem[] = [];
        let fetchedTotalPages = 1;
        let fetchedTotalResults = 0;

        if (type === 'movie') {
          const resp = await tmdb.searchMovies(trimmed, 1, {
            primary_release_year: year || minYear || undefined,
          });
          fetchedItems = (resp.results || []).map((item) => ({ ...item, media_type: 'movie' as const }));
          fetchedTotalPages = resp.total_pages;
          fetchedTotalResults = resp.total_results;
        } else if (type === 'tv') {
          const resp = await tmdb.searchTV(trimmed, 1, {
            first_air_date_year: year || minYear || undefined,
          });
          fetchedItems = (resp.results || []).map((item) => ({ ...item, media_type: 'tv' as const }));
          fetchedTotalPages = resp.total_pages;
          fetchedTotalResults = resp.total_results;
        } else if (type === 'person') {
          const resp = await tmdb.searchPeople(trimmed, 1);
          fetchedItems = (resp.results || []).map((item) => ({ ...item, media_type: 'person' as const }));
          fetchedTotalPages = resp.total_pages;
          fetchedTotalResults = resp.total_results;
        } else {
          const resp = await tmdb.searchMulti(trimmed, 1);
          fetchedItems = resp.results || [];
          fetchedTotalPages = resp.total_pages;
          fetchedTotalResults = resp.total_results;
        }

        if (!isCurrent) return;

        setTotalPages(fetchedTotalPages);
        setTotalResults(fetchedTotalResults);
        setRawResults(fetchedItems);
        setCurrentPage(1);
      } catch (err: unknown) {
        if (!isCurrent) return;
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Unknown search error'));
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    void performSearch();

    return () => {
      isCurrent = false;
    };
  }, [apiKey, query, type, year, minYear]);

  // Load next page
  const loadMore = useCallback(async () => {
    const trimmed = query.trim();
    if (!apiKey || !trimmed || isLoading || isLoadingMore || currentPage >= totalPages) return;

    const nextPage = currentPage + 1;
    const currentFetchId = ++fetchIdRef.current;
    setIsLoadingMore(true);

    try {
      const tmdb = createTMDBClient(apiKey);
      let fetchedItems: SearchResultItem[] = [];

      if (type === 'movie') {
        const resp = await tmdb.searchMovies(trimmed, nextPage, {
          primary_release_year: year || minYear || undefined,
        });
        fetchedItems = (resp.results || []).map((item) => ({ ...item, media_type: 'movie' as const }));
      } else if (type === 'tv') {
        const resp = await tmdb.searchTV(trimmed, nextPage, {
          first_air_date_year: year || minYear || undefined,
        });
        fetchedItems = (resp.results || []).map((item) => ({ ...item, media_type: 'tv' as const }));
      } else if (type === 'person') {
        const resp = await tmdb.searchPeople(trimmed, nextPage);
        fetchedItems = (resp.results || []).map((item) => ({ ...item, media_type: 'person' as const }));
      } else {
        const resp = await tmdb.searchMulti(trimmed, nextPage);
        fetchedItems = resp.results || [];
      }

      if (currentFetchId !== fetchIdRef.current) return;

      setRawResults((prev) => {
        const combined = [...prev, ...fetchedItems];
        const seen = new Set<string>();
        const unique: SearchResultItem[] = [];
        for (const item of combined) {
          const key = `${item.id}-${item.media_type || type}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }
        return unique;
      });
      setCurrentPage(nextPage);
    } catch {
      // Ignore load more error or keep previous results
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [apiKey, query, type, year, minYear, isLoading, isLoadingMore, currentPage, totalPages]);

  const refetch = useCallback(() => {
    setCurrentPage(1);
    setIsLoading(true);
    setIsError(false);
    setError(null);
    const trimmed = query.trim();
    if (!apiKey || !trimmed) {
      setIsLoading(false);
      return;
    }
    const tmdb = createTMDBClient(apiKey);
    const perform = async () => {
      try {
        let fetchedItems: SearchResultItem[] = [];
        let fetchedTotalPages = 1;
        let fetchedTotalResults = 0;
        if (type === 'movie') {
          const resp = await tmdb.searchMovies(trimmed, 1, { primary_release_year: year || minYear || undefined });
          fetchedItems = (resp.results || []).map((item) => ({ ...item, media_type: 'movie' as const }));
          fetchedTotalPages = resp.total_pages;
          fetchedTotalResults = resp.total_results;
        } else if (type === 'tv') {
          const resp = await tmdb.searchTV(trimmed, 1, { first_air_date_year: year || minYear || undefined });
          fetchedItems = (resp.results || []).map((item) => ({ ...item, media_type: 'tv' as const }));
          fetchedTotalPages = resp.total_pages;
          fetchedTotalResults = resp.total_results;
        } else if (type === 'person') {
          const resp = await tmdb.searchPeople(trimmed, 1);
          fetchedItems = (resp.results || []).map((item) => ({ ...item, media_type: 'person' as const }));
          fetchedTotalPages = resp.total_pages;
          fetchedTotalResults = resp.total_results;
        } else {
          const resp = await tmdb.searchMulti(trimmed, 1);
          fetchedItems = resp.results || [];
          fetchedTotalPages = resp.total_pages;
          fetchedTotalResults = resp.total_results;
        }
        setTotalPages(fetchedTotalPages);
        setTotalResults(fetchedTotalResults);
        setRawResults(fetchedItems);
      } catch (err: unknown) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Unknown search error'));
      } finally {
        setIsLoading(false);
      }
    };
    void perform();
  }, [apiKey, query, type, year, minYear]);

  const hasMore = currentPage < totalPages;

  return {
    results,
    totalResults: (genres.length > 0 || (minRating && minRating > 0) || year || minYear || maxYear) ? results.length : totalResults,
    totalPages,
    currentPage,
    isLoading,
    isLoadingMore,
    isError,
    error,
    loadMore,
    hasMore,
    refetch,
  };
};
