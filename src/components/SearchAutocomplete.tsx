import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, History, Film, Tv, User, Loader2, ArrowRight, Trash2, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient, type SearchResultItem } from '../api/tmdb';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { TMDB_IMAGE_BASE } from '../lib/constants';
import { useHiddenStore } from '../store/hiddenStore';
import { useDismissedStore } from '../store/dismissedStore';

interface SearchAutocompleteProps {
  initialValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  onSearchSubmit?: (query: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
  isInNavbar?: boolean;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  initialValue = '',
  placeholder = 'Search movies, TV, actors...',
  autoFocus = false,
  className = '',
  inputClassName = '',
  onSearchSubmit,
  onClear,
  showClearButton = true,
  isInNavbar = false,
}) => {
  const navigate = useNavigate();
  const apiKey = useKeyStore((state) => state.apiKey);
  const hiddenItems = useHiddenStore((state) => state.hiddenItems);
  const dismissed = useDismissedStore((state) => state.dismissed);
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

  const [query, setQuery] = useState(initialValue);
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initialValue if changed from outside
  if (prevInitialValue !== initialValue) {
    setPrevInitialValue(initialValue);
    setQuery(initialValue);
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!apiKey || trimmed.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const tmdb = createTMDBClient(apiKey);
        const resp = await tmdb.searchMulti(trimmed, 1);
        const items = (resp.results || [])
          .filter(item => {
            if (item.media_type === 'person') return true;
            const type = (item.media_type as 'movie' | 'tv') ?? 'movie';
            return !useHiddenStore.getState().isHidden(item.id, type) && 
                   !useDismissedStore.getState().isDismissed(item.id, type);
          })
          .slice(0, 6);
        setSuggestions(items);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey]
  );

  // Debounced input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(val);
      }, 350);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (query.trim().length >= 2 && suggestions.length === 0) {
      fetchSuggestions(query);
    }
  };

  const executeSearch = (targetQuery: string) => {
    const trimmed = targetQuery.trim();
    if (!trimmed) return;
    addToHistory(trimmed);
    setIsOpen(false);
    setSelectedIndex(-1);

    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
    } else {
      navigate({
        to: '/search',
        search: { q: trimmed },
      });
    }
  };

  const handleSelectSuggestion = (item: SearchResultItem) => {
    const title = item.media_type === 'person' ? item.name : item.title || item.name || '';
    if (title) addToHistory(title);
    setIsOpen(false);
    setSelectedIndex(-1);

    if (item.media_type === 'person') {
      navigate({
        to: '/person/$id',
        params: { id: item.id.toString() },
      });
    } else {
      navigate({
        to: '/detail/$id',
        params: { id: item.id.toString() },
        search: { type: item.media_type || 'movie' },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const showSuggestions = query.trim().length >= 2 && suggestions.length > 0;
    const showSeeAll = query.trim().length >= 2;
    const totalItems = showSuggestions ? suggestions.length + (showSeeAll ? 1 : 0) : 0;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (totalItems > 0) {
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (totalItems > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        executeSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
    if (onClear) onClear();
  };

  const showRecentHistory = isOpen && query.trim().length < 2 && history.length > 0;
  const showSuggestionsList = isOpen && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input container */}
      <div className="relative flex items-center w-full">
        <Search
          size={16}
          className="absolute left-3.5 text-[var(--color-text-muted)] pointer-events-none shrink-0"
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] text-sm rounded-full pl-10 pr-10 py-2.5 outline-none transition-all duration-200 shadow-inner ${inputClassName}`}
        />

        {/* Clear (X) button / Spinner / Advanced Search */}
        <div className="absolute right-3 flex items-center gap-1.5">
          {isLoading && <Loader2 size={14} className="text-[var(--color-accent)] animate-spin" />}
          
          {!isLoading && showClearButton && query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-card)] transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Clear search input"
            >
              <X size={14} />
            </button>
          )}

          {isInNavbar && (
            <>
              {query.length > 0 && <div className="w-px h-3.5 bg-[var(--color-border-subtle)] mx-0.5" />}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate({ to: '/search', search: query ? { q: query } : undefined });
                }}
                className="p-1 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-card)] transition-colors cursor-pointer flex items-center justify-center"
                title="Advanced Search with Filters"
                aria-label="Advanced Search"
              >
                <SlidersHorizontal size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {(showRecentHistory || showSuggestionsList) && (
        <div
          className={`absolute left-0 right-0 top-full mt-2 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50 transition-all ${
            isInNavbar ? 'w-full min-w-[300px] sm:min-w-[360px] md:min-w-[400px]' : 'w-full'
          }`}
          style={{ maxHeight: '75vh', overflowY: 'auto' }}
        >
          {/* Recent Search History Section */}
          {showRecentHistory && (
            <div className="p-2 sm:p-3">
              <div className="flex items-center justify-between px-3 py-1.5 mb-1 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <History size={13} />
                  Recent Searches
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearHistory();
                  }}
                  className="flex items-center gap-1 text-[11px] text-red-400/80 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 size={12} />
                  Clear all
                </button>
              </div>

              <div className="flex flex-col gap-0.5">
                {history.map((term) => (
                  <div
                    key={term}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--color-card)] group cursor-pointer transition-colors text-sm text-[var(--color-text-primary)]"
                    onClick={() => {
                      setQuery(term);
                      executeSearch(term);
                    }}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <History size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] shrink-0" />
                      <span className="truncate">{term}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(term);
                      }}
                      className="p-1 rounded text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer shrink-0"
                      aria-label={`Remove ${term} from history`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Autocomplete Suggestions Section */}
          {showSuggestionsList && (
            <div className="py-2">
              {suggestions.length > 0 ? (
                <div className="flex flex-col">
                  {suggestions.filter(item => {
                    if (item.media_type === 'person') return true;
                    const hType = (item.media_type as 'movie' | 'tv') ?? 'movie';
                    return !hiddenItems.some(h => h.id === item.id && h.type === hType) &&
                           !dismissed.some(d => d.id === item.id && d.type === hType);
                  }).map((item, index) => {
                    const isSelected = selectedIndex === index;
                    const isPerson = item.media_type === 'person';
                    const title = isPerson ? item.name : item.title || item.name || 'Untitled';
                    const dateStr = !isPerson ? item.release_date || item.first_air_date : null;
                    const year = dateStr ? dateStr.slice(0, 4) : null;
                    const imagePath = isPerson ? item.profile_path : item.poster_path;
                    const imgUrl = imagePath ? `${TMDB_IMAGE_BASE}w92${imagePath}` : null;

                    return (
                      <div
                        key={`${item.id}-${item.media_type || 'item'}`}
                        onClick={() => handleSelectSuggestion(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex items-center gap-3 px-3.5 py-2 cursor-pointer transition-colors ${
                          isSelected ? 'bg-[var(--color-card)]' : 'hover:bg-[var(--color-card)]'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="shrink-0 flex items-center justify-center bg-[var(--color-card-hover)] overflow-hidden">
                          {isPerson ? (
                            imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={title}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[var(--color-accent-dim)] flex items-center justify-center text-[var(--color-accent)]">
                                <User size={16} />
                              </div>
                            )
                          ) : imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={title}
                              className="w-8 h-12 rounded object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-8 h-12 rounded bg-[var(--color-card)] flex items-center justify-center text-[var(--color-text-muted)]">
                              {item.media_type === 'tv' ? <Tv size={14} /> : <Film size={14} />}
                            </div>
                          )}
                        </div>

                        {/* Title & info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--color-text-primary)] truncate font-sans">
                            {title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mt-0.5">
                            {isPerson ? (
                              <span>{item.known_for_department || 'Actor / Crew'}</span>
                            ) : (
                              <>
                                {year && <span>{year}</span>}
                                {year && <span>•</span>}
                                <span className="uppercase text-[10px] tracking-wide font-semibold text-[#a78bfa]">
                                  {item.media_type === 'tv' ? 'Series' : 'Movie'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* "See all results for '{query}'" */}
                  <div
                    onClick={() => executeSearch(query)}
                    onMouseEnter={() => setSelectedIndex(suggestions.length)}
                    className={`flex items-center justify-between px-4 py-3 mt-1 border-t border-[var(--color-border-subtle)] text-sm font-medium text-[var(--color-accent)] cursor-pointer transition-colors ${
                      selectedIndex === suggestions.length ? 'bg-[var(--color-card)]' : 'hover:bg-[var(--color-card)]'
                    }`}
                  >
                    <span className="truncate">
                      See all results for &ldquo;{query}&rdquo;
                    </span>
                    <ArrowRight size={15} className="shrink-0 ml-2" />
                  </div>
                </div>
              ) : !isLoading ? (
                <div className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
                  No direct matches found.
                  <button
                    type="button"
                    onClick={() => executeSearch(query)}
                    className="block mx-auto mt-2 text-xs font-semibold text-[var(--color-accent)] hover:underline cursor-pointer"
                  >
                    Search all categories &rarr;
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
