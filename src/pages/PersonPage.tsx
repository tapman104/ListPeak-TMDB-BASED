import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, AlertCircle, ChevronLeft, ChevronRight, User, Home, Search as SearchIcon, X, Star } from 'lucide-react';
import { useKeyStore } from '../store/keyStore';
import { useHiddenStore } from '../store/hiddenStore';
import { useDismissedStore } from '../store/dismissedStore';
import { createTMDBClient, type PersonCredit } from '../api/tmdb';
import { TMDB_IMAGE_BASE } from '../lib/constants';
import { PosterCard } from '../components/PosterCard';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.45, ease: "easeOut" as const } 
  }
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
    }
    const fallbackDate = new Date(dateString);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return dateString;
  } catch {
    return dateString || '';
  }
};

const calculateAge = (birthDate?: string | null, deathDate?: string | null) => {
  if (!birthDate) return null;
  try {
    const parts = birthDate.split('-');
    const bYear = Number(parts[0]);
    const bMonth = parts[1] ? Number(parts[1]) - 1 : 0;
    const bDay = parts[2] ? Number(parts[2]) : 1;
    const birth = new Date(bYear, bMonth, bDay);
    if (isNaN(birth.getTime())) return null;

    let end = new Date();
    if (deathDate) {
      const dParts = deathDate.split('-');
      const dYear = Number(dParts[0]);
      const dMonth = dParts[1] ? Number(dParts[1]) - 1 : 0;
      const dDay = dParts[2] ? Number(dParts[2]) : 1;
      const death = new Date(dYear, dMonth, dDay);
      if (!isNaN(death.getTime())) {
        end = death;
      }
    }

    let age = end.getFullYear() - birth.getFullYear();
    const m = end.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    return isNaN(age) || age < 0 ? null : age;
  } catch {
    return null;
  }
};

// Variety / Reality genre IDs from TMDB
const VARIETY_GENRE_IDS = new Set([10764, 10767]);

const getYear = (credit: PersonCredit): number => {
  const d = credit.release_date || credit.first_air_date;
  if (!d) return 0;
  const y = parseInt(d.slice(0, 4), 10);
  return isNaN(y) ? 0 : y;
};

type SortMode = 'year_desc' | 'year_asc' | 'rating_desc';
type FilmographyTab = 'all' | 'drama' | 'movies' | 'tv';

const sortCredits = (credits: PersonCredit[], sort: SortMode): PersonCredit[] => {
  return [...credits].sort((a, b) => {
    if (sort === 'year_desc') return getYear(b) - getYear(a);
    if (sort === 'year_asc') return getYear(a) - getYear(b);
    // rating_desc
    return (b.vote_average || 0) - (a.vote_average || 0);
  });
};

// ─────────────────────────────────────────────
// FilmographyRow — single vertical list item
// ─────────────────────────────────────────────
// Role inference helper (cast-only heuristic, no extra data needed)
const inferRole = (credit: PersonCredit): string | null => {
  if (!credit.character) return null;
  const ch = credit.character.toLowerCase();
  if (ch.includes('cameo') || ch.includes('herself') || ch.includes('himself') || ch.includes('themselves')) return 'Cameo';
  if (credit.episode_count != null) {
    if (credit.episode_count >= 10) return 'Main Role';
    if (credit.episode_count >= 3) return 'Support';
    return 'Guest';
  }
  return null;
};

const FilmographyRow: React.FC<{
  credit: PersonCredit;
  onNavigate: (id: number, type: 'movie' | 'tv') => void;
  showRoleBadge?: boolean;
}> = ({ credit, onNavigate, showRoleBadge = true }) => {
  const title = credit.title || credit.name || 'Untitled';
  const year = getYear(credit);
  const mediaType = credit.media_type === 'movie' ? 'movie' : 'tv';
  const thumbUrl = credit.poster_path
    ? `${TMDB_IMAGE_BASE}w92${credit.poster_path}`
    : null;
  const rating = credit.vote_average && credit.vote_average > 0
    ? credit.vote_average.toFixed(1)
    : null;
  const role = showRoleBadge ? inferRole(credit) : null;

  return (
    <motion.button
      onClick={() => onNavigate(credit.id, mediaType)}
      className="w-full flex items-center gap-4 px-2 sm:px-4 py-3 rounded-lg
                 hover:bg-white/[0.04] active:bg-white/[0.06]
                 transition-colors duration-150 text-left group cursor-pointer"
      whileHover={{ x: 1 }}
      transition={{ duration: 0.12 }}
    >
      {/* Thumbnail */}
      <div className="w-[72px] h-[104px] rounded-lg overflow-hidden shrink-0 bg-white/[0.06]">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={title}
            className="w-full h-full object-cover block"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-white/[0.04]" />
        )}
      </div>

      {/* Year — fixed width, mono */}
      <span className="w-12 shrink-0 text-white/60 text-sm font-mono tabular-nums">
        {year > 0 ? year : '—'}
      </span>

      {/* Title + character — flex-1 */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-base font-medium leading-snug truncate group-hover:text-white transition-colors">
          {title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {(credit.character || credit.job) && (
            <span className="text-white/50 text-sm leading-none truncate">
              {credit.character ? `as ${credit.character}` : credit.job}
            </span>
          )}
          {role && (
            <span className="shrink-0 px-1.5 py-0.5 text-xs leading-none text-white/40 bg-white/5 border border-white/10 rounded">
              {role}
            </span>
          )}
        </div>
      </div>

      {/* Episode count — fixed width */}
      <span className="w-8 shrink-0 text-center text-white/50 text-sm tabular-nums">
        {credit.episode_count != null && credit.episode_count > 0 ? `${credit.episode_count}ep` : ''}
      </span>

      {/* Rating — fixed width */}
      <div className="w-12 shrink-0 flex items-center justify-end gap-0.5">
        {rating && (
          <>
            <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />
            <span className="text-white text-sm tabular-nums font-semibold">{rating}</span>
          </>
        )}
      </div>
    </motion.button>
  );
};

// ─────────────────────────────────────────────
// FilmographyListSection — section header + rows
// ─────────────────────────────────────────────
const FilmographyListSection: React.FC<{
  label: string;
  credits: PersonCredit[];
  sort: SortMode;
  onNavigate: (id: number, type: 'movie' | 'tv') => void;
  showHeader?: boolean;
  showRoleBadge?: boolean;
}> = ({ label, credits, sort, onNavigate, showHeader = true, showRoleBadge = true }) => {
  const sorted = sortCredits(credits, sort);
  if (sorted.length === 0) return null;

  return (
    <div>
      {showHeader && (
        <div className="pb-2 mb-1 border-b border-white/[0.06]">
          <h3 className="font-sans font-semibold text-xs uppercase tracking-widest text-white/30">
            {label}
            <span className="ml-2 text-white/50 font-semibold tabular-nums">({sorted.length})</span>
          </h3>
        </div>
      )}
      <div className="flex flex-col">
        {sorted.map((credit, i) => (
          <FilmographyRow
            key={`${credit.id}-${i}`}
            credit={credit}
            onNavigate={onNavigate}
            showRoleBadge={showRoleBadge}
          />
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// FilmographySection — full filter/sort section
// ─────────────────────────────────────────────
const FilmographySection: React.FC<{
  dramas: PersonCredit[];
  movies: PersonCredit[];
  variety: PersonCredit[];
  onNavigate: (id: number, type: 'movie' | 'tv') => void;
}> = ({ dramas, movies, variety, onNavigate }) => {
  const [tab, setTab] = useState<FilmographyTab>('drama');
  const [sort, setSort] = useState<SortMode>('year_desc');
  const filmographyRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!filmographyRef.current) return;
      const rect = filmographyRef.current.getBoundingClientRect();
      // Lock when top of filmography section reaches navbar bottom (64px)
      setIsSticky(rect.top <= 64);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs: { id: FilmographyTab; label: string; count: number }[] = [
    { id: 'drama' as FilmographyTab, label: 'Drama', count: dramas.length },
    { id: 'movies' as FilmographyTab, label: 'Movies', count: movies.length },
    { id: 'tv' as FilmographyTab, label: 'TV Shows', count: variety.length },
  ].filter(t => t.count > 0);

  const sortOptions: { id: SortMode; label: string }[] = [
    { id: 'year_desc', label: 'Year ↓' },
    { id: 'year_asc', label: 'Year ↑' },
    { id: 'rating_desc', label: 'Rating ↓' },
  ];

  const renderTabContent = () => (
    <>
      <div className="flex items-center gap-0.5 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`
              flex items-center px-4 py-1.5 rounded-full text-sm font-medium
              transition-all duration-150 cursor-pointer
              ${tab === t.id
                ? 'bg-white/10 border border-white/20 text-white font-semibold'
                : 'text-white/30 hover:text-white/60 border border-transparent'
              }
            `}
          >
            {t.label}
            <span className="ml-1 text-white/20 tabular-nums">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-0.5">
        <span className="text-[10px] uppercase tracking-wider text-white/20 mr-2 select-none">Sort:</span>
        {sortOptions.map(s => (
          <button
            key={s.id}
            onClick={() => setSort(s.id)}
            className={`
              px-2 py-1 text-sm transition-colors duration-150 cursor-pointer
              ${sort === s.id
                ? 'text-white font-medium underline underline-offset-2'
                : 'text-white/30 hover:text-white/60'
              }
            `}
          >
            {s.label}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <motion.section ref={filmographyRef} variants={itemVariants} className="mt-0 relative">
      {/* Section title */}
      <h2 className="font-sans font-medium text-sm uppercase tracking-widest text-white/30 mb-4">
        FILMOGRAPHY
      </h2>

      {/* Original Inline Filter + Sort bar — stays in normal flow always */}
      <div className={`flex flex-wrap items-center justify-between gap-2 mb-5 py-2 ${isSticky ? 'invisible pointer-events-none' : ''}`}>
        {renderTabContent()}
      </div>

      {/* Fixed Clone for Sticky Header */}
      {isSticky && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/[0.06] shadow-lg">
          <div className="w-full max-w-5xl mx-auto px-6 md:px-12 py-3 flex flex-wrap items-center justify-between gap-2">
            {renderTabContent()}
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col"
        >
          {tab === 'drama' && (
            dramas.length > 0
              ? <FilmographyListSection
                  label="Drama / Series"
                  credits={dramas}
                  sort={sort}
                  onNavigate={onNavigate}
                  showHeader={false}
                  showRoleBadge={true}
                />
              : <p className="text-white/30 text-sm text-center py-8">No credits in this category.</p>
          )}
          {tab === 'movies' && (
            movies.length > 0
              ? <FilmographyListSection
                  label="Movies"
                  credits={movies}
                  sort={sort}
                  onNavigate={onNavigate}
                  showHeader={false}
                  showRoleBadge={true}
                />
              : <p className="text-white/30 text-sm text-center py-8">No credits in this category.</p>
          )}
          {tab === 'tv' && (
            variety.length > 0
              ? <FilmographyListSection
                  label="TV Shows / Variety"
                  credits={variety}
                  sort={sort}
                  onNavigate={onNavigate}
                  showHeader={false}
                  showRoleBadge={false}
                />
              : <p className="text-white/30 text-sm text-center py-8">No credits in this category.</p>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
};

// ─────────────────────────────────────────────
// Reusable horizontal credit row (Known For)
// ─────────────────────────────────────────────
const CreditRow = ({ title, credits }: { title: string, credits: PersonCredit[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [credits]);

  const scrollByAmount = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (!credits || credits.length === 0) return null;

  return (
    <motion.section 
      variants={itemVariants} 
      className="relative mb-8 sm:mb-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2 className="font-sans font-medium text-xs uppercase tracking-widest text-white/30 mb-4">
        {title}
      </h2>

      <div className="relative group">
        {/* Navigation Arrows (Desktop only) */}
        <div 
          className={`hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 transition-opacity duration-200 ${
            showLeftArrow && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button 
            onClick={() => scrollByAmount(-600)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(7,7,13,0.85)] border border-[var(--color-border-subtle)] text-white hover:bg-[var(--color-surface)] hover:text-[#7c5cfc] transition-colors cursor-pointer shadow-lg backdrop-blur-sm"
            aria-label="Scroll Left"
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        <div 
          className={`hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 transition-opacity duration-200 ${
            showRightArrow && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button 
            onClick={() => scrollByAmount(600)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(7,7,13,0.85)] border border-[var(--color-border-subtle)] text-white hover:bg-[var(--color-surface)] hover:text-[#7c5cfc] transition-colors cursor-pointer shadow-lg backdrop-blur-sm"
            aria-label="Scroll Right"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Row */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-4 sm:gap-6 no-scrollbar pb-3 snap-x snap-mandatory"
        >
          {credits.map((credit, i) => (
            <div key={`${credit.id}-${i}`} className="flex flex-col gap-2 w-36 shrink-0 snap-start">
              <PosterCard
                id={credit.id}
                title={credit.title || credit.name}
                posterPath={credit.poster_path}
                mediaType={credit.media_type}
                voteAverage={credit.vote_average}
                className="w-36 h-52 shrink-0 rounded-xl overflow-hidden"
              />
              <span className="text-sm font-medium text-white line-clamp-2 leading-snug px-0.5">
                {credit.title || credit.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};


export const PersonPage: React.FC = () => {
  const { id } = useParams({ from: '/person/$id' });
  const navigate = useNavigate();
  const apiKey = useKeyStore((state) => state.apiKey);
  const hiddenItems = useHiddenStore((state) => state.hiddenItems);
  const dismissed = useDismissedStore((state) => state.dismissed);
  
  const [showFullBio, setShowFullBio] = useState(false);

  // Search overlay state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const personId = id ? Number(id) : NaN;

  const tmdb = apiKey ? createTMDBClient(apiKey) : null;

  const { data: details, isLoading: isLoadingDetails, error: errorDetails } = useQuery({
    queryKey: ['person', personId],
    queryFn: ({ signal }) => tmdb!.getPersonDetails(personId, { signal }),
    enabled: !!tmdb && !isNaN(personId),
    staleTime: 1000 * 60 * 5,
  });

  const { data: fallbackCredits, isLoading: isLoadingFallbackCredits } = useQuery({
    queryKey: ['person-credits', personId],
    queryFn: ({ signal }) => tmdb!.getPersonCredits(personId, { signal }),
    enabled: !!tmdb && !isNaN(personId) && !!details && !details.combined_credits,
    staleTime: 1000 * 60 * 10,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search', debouncedSearchQuery],
    queryFn: ({ signal }) => tmdb!.searchMulti(debouncedSearchQuery, 1, { signal }),
    enabled: !!apiKey && !!tmdb && isSearchOpen && debouncedSearchQuery.length > 1,
    staleTime: 1000 * 60 * 2,
  });

  if (!apiKey) {
    return null;
  }

  if (isLoadingDetails) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        <div className="relative min-h-[500px] md:h-[65vh] w-full animate-shimmer"
             style={{ 
               background: 'linear-gradient(90deg, #0f0f1a 0%, #1c1c2e 50%, #0f0f1a 100%)',
               backgroundSize: '200% 100%' 
             }}>
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end justify-center h-full max-w-[1000px] mx-auto">
            <div className="w-36 sm:w-48 aspect-[2/3] rounded-xl animate-shimmer bg-[#1c1c2e]" />
            <div className="flex-1 space-y-3 sm:space-y-4 pb-4 text-center md:text-left">
              <div className="h-8 sm:h-10 w-48 sm:w-64 mx-auto md:mx-0 rounded animate-shimmer bg-[#1c1c2e]" />
              <div className="h-4 w-32 sm:w-40 mx-auto md:mx-0 rounded animate-shimmer bg-[#1c1c2e]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorDetails || !details) {
    return (
      <div className="min-h-[60vh] bg-[var(--color-background)] flex flex-col items-center justify-center text-center px-4 py-16">
        <AlertCircle size={48} className="text-[#5a5a72] mb-4" />
        <h1 className="font-sans font-semibold text-lg sm:text-xl text-[#eeeef5] mb-2">Could not load person</h1>
        <p className="font-sans font-normal text-sm text-[#5a5a72] mb-6 max-w-sm">
          The person could not be found or there was an issue contacting TMDb.
        </p>
        <button 
          onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: '/' })}
          className="flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-full bg-[rgba(15,15,26,0.8)] backdrop-blur-md border border-[rgba(255,255,255,0.15)] text-[#eeeef5] font-sans font-medium text-sm hover:bg-[rgba(124,92,252,0.2)] hover:border-[rgba(124,92,252,0.5)] transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  const profileUrl = details.profile_path ? `${TMDB_IMAGE_BASE}original${details.profile_path}` : '';
  const avatarUrl = details.profile_path ? `${TMDB_IMAGE_BASE}w342${details.profile_path}` : '';
  
  const creditsSource = details.combined_credits || fallbackCredits;
  const isCreditsLoading = !details.combined_credits && isLoadingFallbackCredits;

  // Prepare credits safely (combining cast and crew without duplicates)
  const castCredits = creditsSource?.cast || [];
  const crewCredits = creditsSource?.crew || [];
  
  // Combine credits, deduplicating by ID and media_type
  const creditMap = new Map<string, PersonCredit>();
  [...castCredits, ...crewCredits].forEach((item) => {
    const key = `${item.media_type || 'media'}-${item.id}`;
    if (!creditMap.has(key)) {
      creditMap.set(key, item);
    }
  });
  const rawCredits = Array.from(creditMap.values());

  const knownFor = [...rawCredits]
    .sort((a, b) => {
      if (a.poster_path && !b.poster_path) return -1;
      if (!a.poster_path && b.poster_path) return 1;
      const scoreB = (b.popularity || 0) + (b.vote_average || 0) * (b.vote_count || 1);
      const scoreA = (a.popularity || 0) + (a.vote_average || 0) * (a.vote_count || 1);
      return scoreB - scoreA;
    })
    .slice(0, 20);

  const movies = rawCredits
    .filter(c => c.media_type === 'movie' || (!c.media_type && (Boolean(c.title) || Boolean(c.release_date))));

  const tvCredits = rawCredits
    .filter(c => c.media_type === 'tv' || (!c.media_type && (Boolean(c.name) || Boolean(c.first_air_date))));

  // Split TV into dramas vs variety/reality by genre_ids
  const dramas = tvCredits.filter(c => {
    if (!c.genre_ids || c.genre_ids.length === 0) return true; // default to drama
    return !c.genre_ids.some(gid => VARIETY_GENRE_IDS.has(gid));
  });

  const variety = tvCredits.filter(c => {
    if (!c.genre_ids || c.genre_ids.length === 0) return false;
    return c.genre_ids.some(gid => VARIETY_GENRE_IDS.has(gid));
  });

  const movieCount = movies.length;
  const tvCount = tvCredits.length;
  const totalCount = rawCredits.length;

  const age = calculateAge(details.birthday, details.deathday);

  const handleNavigateToDetail = (creditId: number, type: 'movie' | 'tv') => {
    navigate({ to: '/detail/$id', params: { id: creditId.toString() }, search: { type } });
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Top Left Navigation Buttons */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-3">
        <button 
          onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: '/' })}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200 cursor-pointer shadow-lg"
          title="Back"
          aria-label="Go Back"
        >
          <ArrowLeft size={18} />
        </button>
        <button 
          onClick={() => navigate({ to: '/' })}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200 cursor-pointer shadow-lg"
          title="Home"
          aria-label="Go Home"
        >
          <Home size={18} />
        </button>
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200 cursor-pointer shadow-lg"
          title="Search"
          aria-label="Search"
        >
          <SearchIcon size={18} />
        </button>
      </div>

      {/* ===================== MOBILE HERO (below md) ===================== */}
      <div className="md:hidden w-full bg-black">
        {/* Blurred background photo — 40vh */}
        <div className="relative w-full h-[40vh] bg-black overflow-hidden">
          {profileUrl ? (
            <img
              src={profileUrl}
              alt={details.name}
              className="absolute inset-0 w-full h-full object-cover object-top scale-110 blur-sm"
            />
          ) : (
            <div
              className="absolute inset-0 w-full h-full"
              style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1a2e 0%, #0d0d18 60%, #000000 100%)' }}
            />
          )}
          {/* Radial vignette */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
          {/* Bottom gradient fade */}
          <div
            className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
            style={{ background: 'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.8) 40%, transparent 100%)' }}
          />
        </div>

        {/* Circular avatar — overlapping bottom of backdrop */}
        <div className="relative z-10 flex justify-center -mt-14">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' as const }}
            className="w-32 h-44 rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.08)] bg-[#12121e] flex items-center justify-center shrink-0"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={details.name}
                className="w-full h-full object-cover block"
              />
            ) : (
              <User size={48} className="text-[#5a5a72]/60" />
            )}
          </motion.div>
        </div>

        {/* Text + meta block */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-3 px-4 pt-3 pb-6"
        >
          {/* Name */}
          <motion.h1
            variants={itemVariants}
            className="font-[Georgia,'Times_New_Roman',serif] font-bold text-white text-2xl tracking-tight leading-tight text-center break-words"
          >
            {details.name}
          </motion.h1>

          {/* Department badge */}
          {details.known_for_department && (
            <motion.div variants={itemVariants}>
              <span className="inline-block px-4 py-1.5 bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)] rounded-full font-sans text-sm tracking-wider uppercase leading-none font-semibold">
                {details.known_for_department}
              </span>
            </motion.div>
          )}

          {/* Metadata — 2×2 grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-8 text-center mt-1 w-full max-w-xs">
            {details.birthday && (
              <div className="flex flex-col">
                <span className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-0.5">Born</span>
                <span className="text-white text-base font-medium leading-snug">{formatDate(details.birthday)}</span>
              </div>
            )}
            {details.birthday && age !== null && (
              <div className="flex flex-col">
                <span className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-0.5">Age</span>
                <span className="text-white text-base font-medium">{details.deathday ? `† Age ${age}` : age}</span>
              </div>
            )}
            {details.place_of_birth && (
              <div className="flex flex-col">
                <span className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-0.5">From</span>
                <span className="text-white text-base font-medium leading-snug">{details.place_of_birth}</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-0.5">Gender</span>
              <span className="text-white text-base font-medium">
                {details.gender === 1 ? 'Female' : details.gender === 2 ? 'Male' : '—'}
              </span>
            </div>
          </motion.div>

          {/* Also Known As */}
          {details.also_known_as && details.also_known_as.length > 0 && (
            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-1.5 mt-1">
              {details.also_known_as.slice(0, 3).map(alias => (
                <span key={alias} className="px-2.5 py-1 bg-white/10 text-[#9898b0] text-xs rounded font-medium border border-white/5">
                  {alias}
                </span>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ===================== DESKTOP HERO (md and above) — UNCHANGED ===================== */}
      <div className="hidden md:block relative min-h-[75vh] w-full bg-black overflow-hidden">
        {profileUrl ? (
          <img
            src={profileUrl}
            alt={details.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full"
            style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1a2e 0%, #0d0d18 60%, #000000 100%)' }}
          />
        )}

        {/* Overlay Gradients */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.88) 100%)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, black 0%, transparent 100%)' }}
        />

        {/* Hero Content Block */}
        <div className="absolute inset-0 flex items-end justify-center pb-16">
          <div className="relative z-20 flex flex-row items-end justify-center gap-12 max-w-[1000px] w-full px-8 pointer-events-auto">

            {/* LEFT: Portrait Photo or Fallback */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' as const }}
              className="relative w-48 h-64 shrink-0 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.08)] overflow-hidden bg-[#12121e] border border-white/10 flex items-center justify-center"
            >
              {avatarUrl ? (
                <>
                  <img
                    src={avatarUrl}
                    alt={details.name}
                    className="w-full h-full object-cover rounded-2xl block"
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, black 0%, transparent 100%)' }}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center text-[#5a5a72]">
                  <User size={48} className="mb-2 text-[#5a5a72]/60" />
                  <span className="text-xs font-medium uppercase tracking-wider text-[#9898b0] line-clamp-2">
                    {details.name}
                  </span>
                </div>
              )}
            </motion.div>

            {/* RIGHT: Info */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-4 max-w-2xl text-left items-start w-full"
            >
              <motion.h1
                variants={itemVariants}
                className="font-[Georgia,'Times_New_Roman',serif] font-bold text-white text-4xl tracking-tight leading-tight break-words whitespace-normal max-w-full"
              >
                {details.name}
              </motion.h1>

              {details.known_for_department && (
                <motion.div variants={itemVariants}>
                  <span className="inline-block px-4 py-1.5 bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)] rounded-full font-sans text-sm tracking-wider uppercase leading-none font-semibold">
                    {details.known_for_department}
                  </span>
                </motion.div>
              )}

              {/* Stats Row */}
              <motion.div variants={itemVariants} className="flex flex-wrap justify-start items-center gap-8 mt-1 text-left">
                {details.birthday && (
                  <div className="flex flex-col">
                    <span className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-0.5">Born</span>
                    <span className="text-white text-base font-medium">{formatDate(details.birthday)}</span>
                  </div>
                )}
                {details.birthday && age !== null && (
                  <div className="flex flex-col">
                    <span className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-0.5">Age</span>
                    <span className="text-white text-base font-medium">{details.deathday ? `† Age ${age}` : age}</span>
                  </div>
                )}
                {details.place_of_birth && (
                  <div className="flex flex-col">
                    <span className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-0.5">From</span>
                    <span className="text-white text-base font-medium">{details.place_of_birth}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-0.5">Gender</span>
                  <span className="text-white text-base font-medium">
                    {details.gender === 1 ? 'Female' : details.gender === 2 ? 'Male' : '—'}
                  </span>
                </div>
              </motion.div>

              {/* Also Known As */}
              {details.also_known_as && details.also_known_as.length > 0 && (
                <motion.div variants={itemVariants} className="flex flex-wrap justify-start gap-2 mt-1">
                  {details.also_known_as.slice(0, 3).map(alias => (
                    <span key={alias} className="px-2.5 py-1 bg-white/10 text-[#9898b0] text-xs rounded font-medium border border-white/5">
                      {alias}
                    </span>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-16 py-8 bg-[#0a0a10] border-y border-[rgba(255,255,255,0.04)] shadow-inner w-full px-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white text-4xl font-bold font-sans">
              {isCreditsLoading ? '—' : movieCount}
            </span>
            <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">Movies</span>
          </div>
          <div className="w-px h-10 bg-[rgba(255,255,255,0.08)]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white text-4xl font-bold font-sans">
              {isCreditsLoading ? '—' : tvCount}
            </span>
            <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">TV Shows</span>
          </div>
          <div className="w-px h-10 bg-[rgba(255,255,255,0.08)]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white text-4xl font-bold font-sans">
              {isCreditsLoading ? '—' : totalCount}
            </span>
            <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">Total Credits</span>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-5xl mx-auto px-6 md:px-12 pt-8 sm:pt-10 pb-12 flex flex-col gap-8 sm:gap-12"
        >
          {/* Biography Section */}
          <motion.section variants={itemVariants} className="bg-black max-w-3xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.14em] text-[#5a5a72]">
                BIOGRAPHY
              </h2>
              {details.imdb_id && (
                <a 
                  href={`https://www.imdb.com/name/${details.imdb_id}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-full bg-black/40 border border-white/20 text-[#e2e2e2] font-sans font-semibold text-[11px] hover:bg-white/10 hover:text-white transition-all min-h-[36px] flex items-center"
                >
                  View on IMDb
                </a>
              )}
            </div>
            
            {details.biography ? (
              <div className="text-white/75 font-sans text-base leading-relaxed">
                <p className={!showFullBio ? "line-clamp-4" : ""}>
                  {details.biography}
                </p>
                {details.biography.length > 250 && (
                  <button 
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="mt-2 text-[#7c5cfc] hover:text-[#9b83fc] transition-colors text-xs sm:text-sm font-semibold py-1.5 min-h-[36px] flex items-center cursor-pointer"
                  >
                    {showFullBio ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[#5a5a72] font-sans text-sm sm:text-base">No biography available.</p>
            )}
            <div className="border-t border-[rgba(255,255,255,0.06)] mt-8 sm:mt-10 w-full" />
          </motion.section>

          {/* Filmography Sections */}
          {isCreditsLoading ? (
            <div className="space-y-8">
              <div className="h-4 w-32 rounded animate-shimmer bg-[#1c1c2e]" />
              <div className="flex gap-3 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-[130px] sm:w-[160px] aspect-[2/3] shrink-0 rounded-[var(--radius)] animate-shimmer bg-[#1c1c2e]" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {rawCredits.length > 0 ? (
                <>
                  {/* Known For — horizontal row (preserved) */}
                  {knownFor.length > 0 && <CreditRow title="KNOWN FOR" credits={knownFor} />}

                  {/* Divider */}
                  <div className="border-t border-[rgba(255,255,255,0.06)] -mt-4 sm:-mt-6" />

                  {/* Vertical filmography listing */}
                  <FilmographySection
                    dramas={dramas}
                    movies={movies}
                    variety={variety}
                    onNavigate={handleNavigateToDetail}
                  />
                </>
              ) : (
                <motion.div variants={itemVariants} className="py-12 text-center">
                  <p className="text-[#5a5a72] font-sans text-sm md:text-base">
                    No filmography data available for this person.
                  </p>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col md:items-center md:justify-center p-0 md:p-8 animate-in fade-in duration-200">
          <div className="w-full h-full md:h-[85vh] max-w-4xl bg-black/30 backdrop-blur-xl md:border md:border-white/10 md:rounded-2xl flex flex-col p-4 sm:p-6 md:p-8 md:shadow-2xl relative overflow-hidden">
            <div className="w-full mx-auto flex items-center gap-4 mb-8 shrink-0 mt-4 md:mt-0">
              <SearchIcon size={28} className="text-white/60 shrink-0" />
              <input 
                autoFocus
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-2xl sm:text-3xl text-white font-sans font-medium placeholder-white/40"
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white shrink-0 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="w-full mx-auto flex-1 overflow-y-auto no-scrollbar pb-20 md:pb-0">
            {searchLoading && debouncedSearchQuery.length > 1 && (
              <div className="text-white/60 text-center mt-12 font-sans text-lg">Searching...</div>
            )}
            
            {!searchLoading && searchResults?.results && searchResults.results.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.results.filter((item: any) => {
                  const type = item.media_type ?? 'movie';
                  return !hiddenItems.some(h => h.id === item.id && h.type === type) &&
                         !dismissed.some(d => d.id === item.id && d.type === type);
                }).map((item: any) => (
                  <div key={item.id} onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                    setDebouncedSearchQuery('');
                    if (item.media_type === 'movie' || item.media_type === 'tv') {
                      navigate({ to: '/detail/$id', params: { id: item.id.toString() }, search: { type: item.media_type } });
                    }
                  }}>
                    <PosterCard 
                      id={item.id}
                      title={item.title || item.name}
                      posterPath={item.poster_path}
                      mediaType={item.media_type as 'movie' | 'tv'}
                      voteAverage={item.vote_average}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {!searchLoading && debouncedSearchQuery.length > 1 && searchResults?.results?.length === 0 && (
              <div className="text-white/60 text-center mt-12 font-sans text-lg">No results found for "{debouncedSearchQuery}"</div>
            )}
          </div>
        </div>
        </div>
      )}

    </div>
  );
};

