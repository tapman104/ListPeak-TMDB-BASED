import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Star, Play, ThumbsUp, Minus, Heart, Share2, User, AlertCircle,
  Home, Search as SearchIcon, X
} from 'lucide-react';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient } from '../api/tmdb';
import { TMDB_IMAGE_BASE, TMDB_BACKDROP_SIZE, TMDB_POSTER_SIZE } from '../lib/constants';
import { PosterCard } from '../components/PosterCard';
import { WatchlistButton } from '../components/WatchlistButton';

// Define container and item variants for staggering motion
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

export const DetailPage: React.FC = () => {
  const { id } = useParams({ from: '/detail/$id' });
  const { type } = useSearch({ from: '/detail/$id' });
  const navigate = useNavigate();
  const apiKey = useKeyStore((state) => state.apiKey);
  
  const [showCopied, setShowCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'seasons' | 'cast'>('overview');
  const [selectedSeason, setSelectedSeason] = useState(1);

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

  const castScrollRef = useRef<HTMLDivElement>(null);
  const [castScrollIndex, setCastScrollIndex] = useState(0);

  const CAST_CARD_WIDTH = 88; // px — approx card + gap width

  const handleCastScroll = () => {
    if (!castScrollRef.current) return;
    const index = Math.round(castScrollRef.current.scrollLeft / CAST_CARD_WIDTH);
    setCastScrollIndex(index);
  };

  const scrollCastTo = (direction: 'left' | 'right') => {
    if (!castScrollRef.current) return;
    const delta = direction === 'right' ? CAST_CARD_WIDTH * 3 : -CAST_CARD_WIDTH * 3;
    castScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const tmdb = apiKey ? createTMDBClient(apiKey) : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['detail', type, id],
    queryFn: ({ signal }) => tmdb!.getMediaDetails(id, type, { signal }),
    enabled: !!apiKey && !!id && !!tmdb && !!type,
    staleTime: 1000 * 60 * 5,
  });

  const { data: seasonData, isLoading: seasonLoading } = useQuery({
    queryKey: ['season', id, selectedSeason],
    queryFn: ({ signal }) => tmdb!.getTVSeason(id, selectedSeason, { signal }),
    enabled: !!apiKey && !!tmdb && type === 'tv' && activeTab === 'seasons',
    staleTime: 1000 * 60 * 5,
  });

  const { data: previewSeasonData } = useQuery({
    queryKey: ['season', id, 1], // Deduplicate with seasonData when selectedSeason is 1
    queryFn: ({ signal }) => tmdb!.getTVSeason(id, 1, { signal }),
    enabled: !!apiKey && !!tmdb && type === 'tv' && !!data, // Stagger after detail
    staleTime: 1000 * 60 * 5,
  });

  const { data: creditsData, isLoading: creditsLoading } = useQuery({
    queryKey: ['credits', type, id],
    queryFn: ({ signal }) => type === 'tv' ? tmdb!.getTVCredits(id, { signal }) : tmdb!.getMovieCredits(id, { signal }),
    enabled: !!id && !!apiKey && !!tmdb && !!type && !!data, // Stagger after detail
    staleTime: 1000 * 60 * 10,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search', debouncedSearchQuery],
    queryFn: ({ signal }) => tmdb!.searchMulti(debouncedSearchQuery, 1, { signal }),
    enabled: !!apiKey && !!tmdb && isSearchOpen && debouncedSearchQuery.length > 1,
    staleTime: 1000 * 60 * 2,
  });

  const previewEpisodes = previewSeasonData?.episodes?.slice(0, 8) ?? [];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  if (!apiKey) return null;


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        {/* Backdrop Skeleton */}
        <div className="relative min-h-[500px] md:h-[75vh] w-full animate-shimmer"
             style={{ 
               background: 'linear-gradient(90deg, #0f0f1a 0%, #1c1c2e 50%, #0f0f1a 100%)',
               backgroundSize: '200% 100%' 
             }}>
          {/* Info Block Skeleton */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 md:px-16 pb-8 md:pb-14 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 max-w-[1000px] mx-auto">
            <div className="w-36 sm:w-48 md:w-56 aspect-[2/3] shrink-0 rounded-xl animate-shimmer bg-[#1c1c2e]" />
            <div className="flex-1 w-full space-y-3 sm:space-y-4 text-center md:text-left">
              <div className="h-8 sm:h-12 w-[80%] md:w-[60%] mx-auto md:mx-0 rounded animate-shimmer bg-[#1c1c2e]" />
              <div className="h-5 sm:h-6 w-[50%] md:w-[40%] mx-auto md:mx-0 rounded animate-shimmer bg-[#1c1c2e]" />
              <div className="h-5 sm:h-6 w-[70%] md:w-[60%] mx-auto md:mx-0 rounded animate-shimmer bg-[#1c1c2e]" />
            </div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="px-4 sm:px-8 md:px-16 py-8 md:py-14 max-w-[1000px] mx-auto flex flex-col gap-10">
          <div>
            <div className="h-4 w-28 rounded animate-shimmer bg-[#1c1c2e] mb-4" />
            <div className="space-y-2.5">
              <div className="h-4 w-full rounded animate-shimmer bg-[#1c1c2e]" />
              <div className="h-4 w-full rounded animate-shimmer bg-[#1c1c2e]" />
              <div className="h-4 w-[75%] rounded animate-shimmer bg-[#1c1c2e]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] bg-[var(--color-background)] flex flex-col items-center justify-center text-center px-4 py-16">
        <AlertCircle size={48} className="text-white/60 mb-4" />
        <h1 className="font-sans font-semibold text-lg sm:text-xl text-white mb-2">Could not load title</h1>
        <p className="font-sans font-normal text-sm text-white/60 mb-6 max-w-sm">
          The title may not exist or your API key may be invalid.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-full bg-[rgba(15,15,26,0.8)] backdrop-blur-md border border-[rgba(255,255,255,0.15)] text-white font-sans font-medium text-sm hover:bg-[var(--color-accent-dim)] hover:border-[var(--color-accent)] transition-all cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  const title = data.title || data.name;
  const backdropUrl = data.backdrop_path ? `${TMDB_IMAGE_BASE}${TMDB_BACKDROP_SIZE}${data.backdrop_path}` : '';
  const posterUrl = data.poster_path ? `${TMDB_IMAGE_BASE}${TMDB_POSTER_SIZE}${data.poster_path}` : '';
  const releaseYear = (data.release_date || data.first_air_date || '').substring(0, 4);
  const runtime = data.runtime || (data.episode_run_time && data.episode_run_time[0]);
  
  const formatRuntime = (mins: number) => {
    if (type === 'movie') return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins}m / ep`;
  };
  
  // @ts-ignore
  const tagline = data.tagline;
  // @ts-ignore
  const createdBy = data.created_by;
  // @ts-ignore
  const numEpisodes = data.number_of_episodes;
  // @ts-ignore
  const numSeasons = data.number_of_seasons;
  const seasons = data.seasons;

  const director = type === 'movie' ? data.credits?.crew?.find(c => c.job === 'Director') : null;
  const trailer = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  
  const contentRating = type === 'tv'
    ? (data as any).content_ratings?.results?.find(
        (r: any) => r.iso_3166_1 === 'US'
      )?.rating ?? null
    : null;
  
  // Watch providers — prefer IN (India) then US fallback
  const watchProviders = (() => {
    const providerData = (data as any)['watch/providers']?.results;
    if (!providerData) return null;
    const region = providerData['IN'] || providerData['US'] || Object.values(providerData)[0] as any;
    return region?.flatrate || region?.rent || region?.buy || null;
  })();

  // Keywords/tags
  const keywords: { id: number; name: string }[] = 
    (data as any).keywords?.results ?? [];

  // MPAA rating for movies
  const mpaaRating = type === 'movie'
    ? (data as any).release_dates?.results
        ?.find((r: any) => r.iso_3166_1 === 'US')
        ?.release_dates?.find((d: any) => d.certification)
        ?.certification ?? null
    : null;

  // Networks (TV)
  const networks: { id: number; name: string; logo_path: string | null }[] =
    (data as any).networks ?? [];

  // Next episode
  const nextEp = type === 'tv' ? (data as any).next_episode_to_air ?? null : null;

  // Collection (movies)
  const collection = type === 'movie' ? (data as any).belongs_to_collection ?? null : null;

  // Spoken language full name
  const spokenLang = (data as any).spoken_languages?.[0]?.english_name ?? data.original_language?.toUpperCase();

  // Production companies (first 3)
  const studios: { id: number; name: string; logo_path: string | null }[] =
    ((data as any).production_companies ?? []).slice(0, 3);

  // Aired date range
  const airedRange = (() => {
    if (type === 'movie') return null;
    const start = (data as any).first_air_date;
    const end = (data as any).last_air_date;
    if (!start) return null;
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (data.status === 'Ended' && end && end !== start) return `${fmt(start)} – ${fmt(end)}`;
    return fmt(start);
  })();



  // Episode runtime
  const episodeRuntime = (() => {
    const rt = (data as any).episode_run_time;
    if (!rt || rt.length === 0) return null;
    const mins = rt[0];
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} hr. ${m} min.` : `${m} min.`;
  })();

  // Movie runtime
  const movieRuntime = (() => {
    if (type !== 'movie') return null;
    const mins = (data as any).runtime;
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h} hr. ${m} min.` : `${m} min.`;
  })();

  // Country of origin
  const originCountry = (() => {
    const countries = (data as any).origin_country as string[] | undefined;
    if (countries && countries.length > 0) {
      const names: Record<string, string> = {
        KR: 'South Korea', JP: 'Japan', US: 'United States',
        CN: 'China', TW: 'Taiwan', TH: 'Thailand', GB: 'United Kingdom',
      };
      return names[countries[0]] ?? countries[0];
    }
    return (data as any).production_countries?.[0]?.name ?? null;
  })();

  // Format / type label
  const formatLabel = (() => {
    if (type === 'movie') return 'Movie';
    const epCount = (data as any).number_of_episodes;
    const seasonCount = (data as any).number_of_seasons;
    if (seasonCount === 1 && epCount <= 20) return 'Mini Series';
    return 'Standard Series';
  })();

  // Genre label (first genre)
  const genreLabel = (data as any).genres?.[0]?.name ?? null;
  
  return (
    <div className="min-h-screen bg-[#07070d] pb-20 overflow-x-hidden">
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

      {/* Backdrop Section */}
      <div className="relative min-h-[580px] sm:min-h-[660px] md:min-h-[85vh] w-full bg-black overflow-hidden flex items-end justify-center pb-8 sm:pb-12 md:pb-16 pt-20 sm:pt-24">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover object-[center_top]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#141424] to-black" />
        )}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]" />
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ background: 'linear-gradient(to top, #07070d 0%, rgba(7,7,13,0.85) 25%, rgba(7,7,13,0.4) 60%, rgba(7,7,13,0.7) 100%)' }} 
        />

        {/* Main Info Block */}
        <div className="relative z-20 flex flex-col md:flex-row items-center md:items-end justify-center gap-6 sm:gap-8 md:gap-12 max-w-[1000px] w-full px-4 sm:px-6 md:px-8 pointer-events-auto">
          
          {/* LEFT: Poster */}
          {posterUrl && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" as const }}
              className="relative w-36 min-[375px]:w-44 sm:w-52 md:w-64 shrink-0 rounded-xl shadow-2xl overflow-hidden aspect-[2/3] bg-[#12121e] border border-white/10"
            >
              <img 
                src={posterUrl} 
                alt={title}
                className="w-full h-full object-cover rounded-xl block"
              />
              <div 
                className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl pointer-events-none" 
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }} 
              />
            </motion.div>
          )}

          {/* RIGHT: Info Content */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3 sm:gap-4 max-w-2xl text-center md:text-left items-center md:items-start w-full"
          >
            {/* Title */}
            <motion.h1 
              variants={itemVariants}
              className="font-[Georgia,'Times_New_Roman',serif] font-bold text-white leading-tight break-words whitespace-normal max-w-full"
              style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)' }}
            >
              {title}
            </motion.h1>

            {/* Tagline */}
            {tagline && (
              <motion.p variants={itemVariants} className="font-sans font-normal text-xs sm:text-sm md:text-base text-white/70 italic">
                "{tagline}"
              </motion.p>
            )}

            {/* Metadata Inline */}
            <motion.div variants={itemVariants} className="flex items-center gap-2 flex-wrap font-sans text-xs sm:text-sm text-white justify-center md:justify-start">
              {data.vote_average > 0 && (
                <span className="text-[#4ade80] flex items-center gap-1 font-semibold">
                  ★ {data.vote_average.toFixed(1)}
                </span>
              )}
              {data.vote_average > 0 && <span>·</span>}
              
              {releaseYear && (
                <>
                  <span>{releaseYear}</span>
                  <span>·</span>
                </>
              )}
              
              {numSeasons !== undefined && numSeasons > 0 ? (
                <>
                  <span>{numSeasons} Season{numSeasons !== 1 ? 's' : ''} {numEpisodes ? `(${numEpisodes} eps)` : ''}</span>
                </>
              ) : runtime ? (
                <>
                  <span>{formatRuntime(runtime)}</span>
                </>
              ) : null}
              
              {(numSeasons || runtime) && data.genres?.length > 0 && <span>·</span>}
              
              {data.genres?.length > 0 && (
                <span className="text-white/80">
                  {data.genres.map((g: any) => g.name).join(' · ')}
                </span>
              )}

              {(contentRating || mpaaRating) && (
                <>
                  <span>·</span>
                  <span className="font-sans text-[10px] font-bold border border-white/30 rounded px-1.5 py-0.5 text-white/70 tracking-wider">
                    {contentRating || mpaaRating}
                  </span>
                </>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div variants={itemVariants} className="flex items-center justify-center md:justify-start gap-3 mt-1 sm:mt-2 flex-wrap w-full sm:w-auto">
              {trailer && (
                <button 
                  onClick={() => window.open(`https://youtube.com/watch?v=${trailer.key}`, '_blank')}
                  className="w-full sm:w-auto flex-1 sm:flex-none min-h-[44px] px-5 sm:px-6 rounded-full text-black bg-white font-sans font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer shadow-md"
                >
                  <Play size={16} fill="currentColor" stroke="none" />
                  Watch Trailer
                </button>
              )}
              <WatchlistButton 
                id={Number(id)} 
                type={type as 'movie' | 'tv'} 
                title={title} 
                posterPath={data.poster_path} 
                year={releaseYear} 
                totalEpisodes={numEpisodes} 
              />
            </motion.div>

            {/* Icon Action Row */}
            <motion.div variants={itemVariants} className="flex items-center justify-center md:justify-start gap-2.5 mt-1">
              <button title="Like" className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 transition-all cursor-pointer">
                <ThumbsUp size={15} />
              </button>
              <button title="Not Interested" className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 transition-all cursor-pointer">
                <Minus size={15} />
              </button>
              <button title="Favorite" className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 transition-all cursor-pointer">
                <Heart size={15} />
              </button>
              <div className="relative">
                <button 
                  title="Share" 
                  onClick={handleShare}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <Share2 size={15} />
                </button>
                {showCopied && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[var(--color-surface)] text-white text-xs font-sans font-semibold px-3 py-1 rounded shadow-lg border border-[var(--color-border-subtle)] whitespace-nowrap">
                    Link copied!
                  </div>
                )}
              </div>
            </motion.div>

            {/* Watch Providers */}
            {watchProviders && watchProviders.length > 0 && (
              <motion.div variants={itemVariants} className="flex items-center gap-2 flex-wrap justify-center md:justify-start mt-1">
                <span className="font-sans text-[10px] text-white/60 uppercase tracking-wider">Stream on</span>
                {watchProviders.slice(0, 5).map((p: any) => (
                  <img
                    key={p.provider_id}
                    src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                    alt={p.provider_name}
                    title={p.provider_name}
                    className="w-7 h-7 rounded-lg object-cover border border-white/10"
                  />
                ))}
              </motion.div>
            )}

          </motion.div>
        </div>
      </div>

      {/* Content Below Backdrop */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 md:px-8 pt-6 md:pt-10 pb-12 flex flex-col gap-8 sm:gap-10"
      >
        
        <div className="flex flex-nowrap gap-1 border-b border-[rgba(255,255,255,0.07)] mb-8 overflow-x-auto no-scrollbar">
          {(type === 'tv' && seasons && seasons.length > 0
            ? ['overview', 'seasons', 'cast'] as const
            : ['overview', 'cast'] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                font-sans text-xs font-semibold uppercase tracking-[0.12em] px-4 py-2.5 whitespace-nowrap
                border-b-2 -mb-px transition-colors
                ${activeTab === tab
                  ? 'border-[var(--color-accent)] text-white'
                  : 'border-transparent text-white/60 hover:text-[#a0a0b8]'}
              `}
            >
              {tab === 'overview' ? 'Overview' : tab === 'seasons' ? 'Seasons' : 'Cast & Crew'}
            </button>
          ))}
        </div>

        <>
          {(activeTab === 'overview' || type !== 'tv') && (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8 sm:gap-10">
        
              {/* OVERVIEW SECTION */}
        {data.overview && (
          <motion.section variants={itemVariants}>
            <h2 className="font-sans font-medium text-xs uppercase tracking-[0.15em] font-semibold text-white/60 mb-3">
              OVERVIEW
            </h2>
            <p className="font-sans text-sm sm:text-base text-white/80 leading-relaxed max-w-[840px]">
              {data.overview}
            </p>
            </motion.section>
        )}

        {/* Next Episode Banner — TV ongoing only */}
        {nextEp && (
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0e1a14] border border-[#4ade80]/20">
              <div className="w-2 h-2 rounded-full bg-[#4ade80] shrink-0 animate-pulse" />
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs text-[#4ade80] uppercase tracking-wider">Next Episode</span>
                <span className="font-sans text-xs text-[#e2e2e2] mt-0.5">
                  S{nextEp.season_number}E{nextEp.episode_number} · {nextEp.name} · {nextEp.air_date}
                </span>
              </div>
            </div>
          </motion.section>
        )}

        {/* Belongs to Collection — movies */}
        {collection && (
          <motion.section variants={itemVariants}>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#12121e] border border-white/08">
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60">Part of</span>
                <span className="font-sans font-semibold text-sm text-white mt-0.5">{collection.name}</span>
              </div>
            </div>
          </motion.section>
        )}

        {/* TOP CAST SECTION */}
        {data.credits?.cast && data.credits.cast.length > 0 && (() => {
          const displayedCast = data.credits.cast.slice(0, 12);
          return (
          <motion.section variants={itemVariants}>
            <h2 className="font-sans font-semibold text-xs uppercase tracking-[0.15em] text-white/60 mb-4">
              TOP CAST
            </h2>
            <div ref={castScrollRef} onScroll={handleCastScroll} className="flex overflow-x-auto gap-4 sm:gap-6 pb-3 no-scrollbar snap-x snap-mandatory">
              {displayedCast.map(actor => (
                <div 
                  key={actor.id} 
                  className="w-20 sm:w-24 shrink-0 flex flex-col items-center gap-2 cursor-pointer snap-start group"
                  onClick={() => navigate({ to: '/person/$id', params: { id: actor.id.toString() } })}
                >
                  {actor.profile_path ? (
                    <img 
                      src={`${TMDB_IMAGE_BASE}w185${actor.profile_path}`} 
                      alt={actor.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[rgba(255,255,255,0.1)] group-hover:border-[var(--color-accent)] transition-colors shadow-md block"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1c1c2e] border-2 border-[rgba(255,255,255,0.1)] flex items-center justify-center group-hover:border-[var(--color-accent)] transition-colors shadow-md">
                      <User size={24} className="text-white/60" />
                    </div>
                  )}
                  <div className="flex flex-col w-full text-center">
                    <span className="font-sans font-medium text-[13px] text-white/90 truncate" title={actor.name}>
                      {actor.name}
                    </span>
                    <span className="font-sans font-normal text-[10px] sm:text-[11px] text-white/60 truncate" title={actor.character}>
                      {actor.character}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll controls row */}
            <div className="flex items-center justify-between mt-3">

              {/* Dot indicators */}
              <div className="flex gap-1.5">
                {displayedCast.map((_: any, i: number) => {
                  const dotsVisible = Math.min(displayedCast.length, 8);
                  const dotIndex = Math.round(castScrollIndex / 1); // 1:1 mapping
                  if (i >= dotsVisible) return null;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (!castScrollRef.current) return;
                        castScrollRef.current.scrollTo({ left: i * CAST_CARD_WIDTH, behavior: 'smooth' });
                      }}
                      className={`rounded-full transition-all duration-200 ${
                        i === Math.min(dotIndex, dotsVisible - 1)
                          ? 'w-4 h-1.5 bg-[var(--color-accent)]'
                          : 'w-1.5 h-1.5 bg-[#3a3a52]'
                      }`}
                      aria-label={`Go to cast member ${i + 1}`}
                    />
                  );
                })}
              </div>

              {/* Right side: arrows + View All */}
              <div className="flex items-center gap-3">
                {/* Prev/Next arrow buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => scrollCastTo('left')}
                    className="w-6 h-6 rounded-full bg-[#1a1a2e] flex items-center justify-center text-[#5a5a72] hover:text-white/90 hover:bg-[#252540] transition-all"
                    aria-label="Scroll cast left"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => scrollCastTo('right')}
                    className="w-6 h-6 rounded-full bg-[#1a1a2e] flex items-center justify-center text-[#5a5a72] hover:text-white/90 hover:bg-[#252540] transition-all"
                    aria-label="Scroll cast right"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                {/* View All link removed as tab replaces it */}
              </div>

            </div>

            </motion.section>
          );
        })()}

        {/* DETAILS GRID SECTION */}
        <motion.section variants={itemVariants}>
          <h2 className="font-sans font-medium text-xs uppercase tracking-[0.15em] font-semibold text-white/60 mb-4">
            DETAILS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 max-w-[720px]">
          
            {/* Title */}
            <div className="flex flex-col">
              <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">TITLE</span>
              <span className="font-sans font-medium text-[13px] text-white/90">{data.title || data.name}</span>
            </div>
          
            {/* Type/Genre */}
            {genreLabel && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">TYPE</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{genreLabel}</span>
              </div>
            )}
          
            {/* Format */}
            <div className="flex flex-col">
              <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">FORMAT</span>
              <span className="font-sans font-medium text-[13px] text-white/90">{formatLabel}</span>
            </div>
          
            {/* Country */}
            {originCountry && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">COUNTRY</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{originCountry}</span>
              </div>
            )}
          
            {/* Status */}
            {data.status && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">STATUS</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{data.status}</span>
              </div>
            )}
          
            {/* Language */}
            {spokenLang && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">LANGUAGE</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{spokenLang}</span>
              </div>
            )}
          
            {/* Network */}
            {networks.length > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">NETWORK</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{networks.map((n: any) => n.name).join(', ')}</span>
              </div>
            )}
          
            {/* Episodes */}
            {numEpisodes !== undefined && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">EPISODES</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{numEpisodes}</span>
              </div>
            )}
          
            {/* Seasons */}
            {numSeasons !== undefined && numSeasons > 1 && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">SEASONS</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{numSeasons}</span>
              </div>
            )}
          
            {/* Aired */}
            {airedRange && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">AIRED</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{airedRange}</span>
              </div>
            )}
          
            {/* Duration */}
            {(episodeRuntime || movieRuntime) && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">DURATION</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{episodeRuntime || movieRuntime}</span>
              </div>
            )}
          
            {/* Content Rating */}
            {(contentRating || mpaaRating) && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">RATING</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{contentRating || mpaaRating}</span>
              </div>
            )}
          
            {/* Director — movies */}
            {director && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">DIRECTOR</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{director.name}</span>
              </div>
            )}
          
            {/* Creator — TV */}
            {createdBy && createdBy.length > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">CREATOR</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{createdBy.map((c: any) => c.name).join(', ')}</span>
              </div>
            )}
          
            {/* Studio */}
            {studios.length > 0 && (
              <div className="flex flex-col col-span-2">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">STUDIO</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{studios.map((s: any) => s.name).join(' · ')}</span>
              </div>
            )}
          
            {/* Budget / Revenue — movies */}
            {(data as any).budget > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">BUDGET</span>
                <span className="font-sans font-medium text-[13px] text-white/90">${(data as any).budget.toLocaleString()}</span>
              </div>
            )}
            {(data as any).revenue > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">REVENUE</span>
                <span className="font-sans font-medium text-[13px] text-white/90">${(data as any).revenue.toLocaleString()}</span>
              </div>
            )}
          
            {/* Votes */}
            {data.vote_count > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-white/60 mb-1">VOTES</span>
                <span className="font-sans font-medium text-[13px] text-white/90">{data.vote_count.toLocaleString()} votes</span>
              </div>
            )}
          
          </div>
        </motion.section>

        {type === 'tv' && previewEpisodes.length > 0 && activeTab === 'overview' && (
          <motion.section variants={itemVariants}>
        
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sans font-medium text-xs uppercase tracking-[0.15em] font-semibold text-white/60">
                Episodes
              </h2>
              <button
                onClick={() => {
                  setActiveTab('seasons');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="font-sans text-[11px] text-white/60 hover:text-[var(--color-accent)] transition-colors uppercase tracking-wider cursor-pointer"
              >
                See All →
              </button>
            </div>
        
            {/* Horizontal scroll strip */}
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
              {previewEpisodes.map((ep: any) => (
                <div
                  key={ep.id}
                  className="shrink-0 w-[85vw] max-w-[260px] sm:max-w-none sm:w-[280px] snap-start flex flex-col gap-2 group"
                >
                  {/* Thumbnail with runtime badge overlay */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#0e0e1a]">
                    {ep.still_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w400${ep.still_path}`}
                        alt={ep.name}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#3a3a52]">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4 4h16v16H4z" opacity=".2"/>
                          <path d="M18 4H6L4 6v12l2 2h12l2-2V6l-2-2zM6 18V6h12v12H6z"/>
                        </svg>
                      </div>
                    )}
        
                    {/* Dark gradient at bottom for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        
                    {/* Runtime badge — bottom right */}
                    {ep.runtime && (
                      <span className="absolute bottom-2 right-2 font-sans text-[10px] font-semibold text-white bg-black/70 px-1.5 py-0.5 rounded">
                        {Math.floor(ep.runtime / 60) > 0
                          ? `${Math.floor(ep.runtime / 60)}h ${ep.runtime % 60}m`
                          : `${ep.runtime}m`}
                      </span>
                    )}
        
                    {/* Episode number badge — bottom left */}
                    <span className="absolute bottom-2 left-2 font-sans text-[10px] font-bold text-white/60">
                      E{String(ep.episode_number).padStart(2, '0')}
                    </span>
                  </div>
        
                  {/* Episode title */}
                  <div className="flex flex-col gap-0.5 px-0.5">
                    <span className="font-sans font-semibold text-xs text-white leading-snug line-clamp-1">
                      {ep.name}
                    </span>
                    {/* Overview */}
                    {ep.overview && (
                      <p className="font-sans text-[11px] text-[#a0a0b8] leading-relaxed line-clamp-2">
                        {ep.overview}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </motion.section>
        )}

        {/* KEYWORDS */}
        {keywords.length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="font-sans font-medium text-xs uppercase tracking-[0.15em] font-semibold text-white/60 mb-3">
              TAGS
            </h2>
            <div className="flex flex-wrap gap-2">
              {keywords.slice(0, 16).map((kw) => (
                <span
                  key={kw.id}
                  className="font-sans text-[11px] text-[#a0a0b8] px-2.5 py-1 rounded-full bg-[#0e0e1a] border border-[rgba(255,255,255,0.07)] hover:border-[var(--color-accent)] hover:text-white transition-colors cursor-default"
                >
                  {kw.name}
                </span>
              ))}
            </div>
            </motion.section>
        )}

            </motion.div>
          )}

          {activeTab === 'seasons' && type === 'tv' && (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8">
              {seasons && seasons.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {seasons.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeason(s.season_number)}
                      className={`font-sans text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors
                        ${selectedSeason === s.season_number
                          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-black'
                          : 'border-[rgba(255,255,255,0.12)] text-[#a0a0b8] hover:border-white/30 hover:text-white'
                        }`}
                    >
                      Season {s.season_number}
                    </button>
                  ))}
                </div>
              )}

              {seasonLoading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl">
                      <div className="shrink-0 w-40 sm:w-48 aspect-video rounded-lg bg-[#1c1c2e] animate-shimmer" />
                      <div className="flex-1 flex flex-col justify-center gap-2">
                        <div className="h-4 w-1/3 rounded bg-[#1c1c2e] animate-shimmer" />
                        <div className="h-3 w-1/4 rounded bg-[#1c1c2e] animate-shimmer" />
                        <div className="h-3 w-full rounded bg-[#1c1c2e] animate-shimmer mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : seasonData?.episodes?.length ? (
                <div className="flex flex-col">
                  {seasonData.episodes.map((ep, index) => (
                    <React.Fragment key={ep.id}>
                      <div className="flex gap-4 p-3 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-colors group">
                        {/* Still thumbnail */}
                        <div className="shrink-0 w-40 sm:w-48 aspect-video rounded-lg overflow-hidden bg-[#0e0e1a]">
                          {ep.still_path
                            ? <img
                                src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                                alt={ep.name}
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                              />
                            : <div className="w-full h-full flex items-center justify-center text-[#3a3a52]">
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M4 4h16v16H4z" opacity=".3"/><path d="M18 4H6L4 6v12l2 2h12l2-2V6l-2-2zM6 18V6h12v12H6z"/>
                                </svg>
                              </div>
                          }
                        </div>

                        {/* Episode info */}
                        <div className="flex flex-col justify-center gap-1 min-w-0">
                          {/* Number badge + title row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-sans text-[10px] font-bold text-white/60 bg-[#0e0e1a] px-2 py-0.5 rounded shrink-0">
                              E{String(ep.episode_number).padStart(2, '0')}
                            </span>
                            <span className="font-sans font-semibold text-sm text-white leading-snug truncate">
                              {ep.name}
                            </span>
                            {ep.vote_average > 0 && (
                              <span className="font-sans text-[10px] font-semibold text-[#4ade80] bg-[#0e1a0e] px-2 py-0.5 rounded-full shrink-0">
                                ★ {ep.vote_average.toFixed(1)}
                              </span>
                            )}
                          </div>

                          {/* Air date + runtime */}
                          <div className="flex items-center gap-3 text-[11px] text-white/60">
                            {ep.air_date && <span>{ep.air_date}</span>}
                            {ep.runtime && <span>{ep.runtime} min</span>}
                          </div>

                          {/* Overview */}
                          {ep.overview && (
                            <p className="font-sans text-xs text-[#a0a0b8] leading-relaxed line-clamp-2 mt-0.5">
                              {ep.overview}
                            </p>
                          )}
                        </div>
                      </div>
                      {index < seasonData.episodes.length - 1 && (
                        <div className="border-t border-[rgba(255,255,255,0.04)] mx-3" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-4 text-xs text-white/60 font-sans">No episode data available.</p>
              )}
            </motion.div>
          )}
        </>

        {activeTab === 'cast' && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-10">
            {creditsLoading ? (
              <div className="flex flex-col gap-8">
                <div>
                  <div className="h-4 w-24 rounded bg-[#1c1c2e] animate-shimmer mb-6" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1c1c2e] animate-shimmer" />
                        <div className="h-3 w-16 bg-[#1c1c2e] animate-shimmer rounded mt-1" />
                        <div className="h-2 w-12 bg-[#1c1c2e] animate-shimmer rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : creditsData ? (
              <>
                {/* Cast */}
                {creditsData.cast && creditsData.cast.length > 0 && (
                  <motion.section variants={itemVariants}>
                    <h2 className="font-sans font-medium text-xs uppercase tracking-[0.15em] text-white/60 mb-6">
                      CAST
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                      {creditsData.cast.map(actor => (
                        <div 
                          key={`cast-${actor.id}`} 
                          className="flex flex-col items-center gap-2 cursor-pointer group"
                          onClick={() => navigate({ to: '/person/$id', params: { id: actor.id.toString() } })}
                        >
                          {actor.profile_path ? (
                            <img 
                              src={`${TMDB_IMAGE_BASE}w185${actor.profile_path}`} 
                              alt={actor.name}
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-[rgba(255,255,255,0.1)] group-hover:border-[var(--color-accent)] transition-colors shadow-md block"
                            />
                          ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1c1c2e] border-2 border-[rgba(255,255,255,0.1)] flex items-center justify-center group-hover:border-[var(--color-accent)] transition-colors shadow-md">
                              <User size={28} className="text-white/60" />
                            </div>
                          )}
                          <div className="flex flex-col w-full text-center mt-1 px-2">
                            <span className="font-sans font-medium text-[13px] text-white/90 truncate" title={actor.name}>
                              {actor.name}
                            </span>
                            <span className="font-sans font-normal text-[11px] text-white/60 truncate" title={actor.character}>
                              {actor.character}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Crew */}
                {(() => {
                  if (!creditsData.crew || creditsData.crew.length === 0) return null;
                  
                  const deptMap: Record<string, any[]> = {};
                  creditsData.crew.forEach(member => {
                    if (!deptMap[member.department]) deptMap[member.department] = [];
                    const existing = deptMap[member.department].find(m => m.id === member.id);
                    if (!existing) {
                      deptMap[member.department].push({ ...member });
                    } else {
                      if (!existing.job.includes(member.job)) {
                        existing.job += `, ${member.job}`;
                      }
                    }
                  });
                  
                  return Object.entries(deptMap)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dept, members]) => (
                      <motion.section variants={itemVariants} key={dept} className="mt-8">
                        <h2 className="font-sans font-medium text-xs uppercase tracking-[0.15em] text-white/60 mb-6">
                          {dept.toUpperCase()}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                          {members.map(member => (
                            <div 
                              key={`crew-${dept}-${member.id}`} 
                              className="flex flex-col items-center gap-2 cursor-pointer group"
                              onClick={() => navigate({ to: '/person/$id', params: { id: member.id.toString() } })}
                            >
                              {member.profile_path ? (
                                <img 
                                  src={`${TMDB_IMAGE_BASE}w185${member.profile_path}`} 
                                  alt={member.name}
                                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-[rgba(255,255,255,0.1)] group-hover:border-[var(--color-accent)] transition-colors shadow-md block"
                                />
                              ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1c1c2e] border-2 border-[rgba(255,255,255,0.1)] flex items-center justify-center group-hover:border-[var(--color-accent)] transition-colors shadow-md">
                                  <User size={28} className="text-white/60" />
                                </div>
                              )}
                              <div className="flex flex-col w-full text-center mt-1 px-2">
                                <span className="font-sans font-medium text-[13px] text-white/90 truncate" title={member.name}>
                                  {member.name}
                                </span>
                                <span className="font-sans font-normal text-[11px] text-white/60 line-clamp-2" title={member.job}>
                                  {member.job}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.section>
                    ));
                })()}
              </>
            ) : null}
          </motion.div>
        )}

        {/* YOU MAY ALSO LIKE SECTION */}
        {data.similar?.results && data.similar.results.length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="font-sans font-medium text-xs uppercase tracking-[0.15em] font-semibold text-white/60 mb-4">
              YOU MAY ALSO LIKE
            </h2>
            <div className="flex md:grid overflow-x-auto md:overflow-visible gap-3 md:grid-cols-4 lg:grid-cols-5 pb-3 snap-x md:snap-none no-scrollbar">
              {data.similar.results.slice(0, 12).map((item) => {
                const simImageUrl = item.poster_path ? `${TMDB_IMAGE_BASE}w342${item.poster_path}` : null;
                const simTitle = item.title || item.name;
                const simVote = item.vote_average;
                
                return (
                  <motion.div
                    key={item.id}
                    onClick={() => navigate({ to: '/detail/$id', params: { id: item.id.toString() }, search: { type: item.title ? 'movie' : 'tv' } })}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="relative w-[130px] sm:w-[160px] md:w-full shrink-0 md:shrink aspect-[2/3] rounded-[var(--radius)] overflow-hidden cursor-pointer group bg-[#141420] snap-start md:snap-none select-none shadow-md"
                  >
                    {simImageUrl ? (
                      <img 
                        src={simImageUrl} 
                        alt={simTitle}
                        loading="lazy"
                        className="w-full h-full object-cover block"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/60 p-3 text-center">
                        <span className="text-xs font-sans">{simTitle}</span>
                      </div>
                    )}

                    {/* Mobile Rating Badge */}
                    {simVote !== undefined && simVote > 0 && (
                      <div className="md:hidden absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-sans font-bold text-white">
                        <Star fill="#f5c518" stroke="none" size={10} />
                        <span>{simVote.toFixed(1)}</span>
                      </div>
                    )}
                    
                    {/* Desktop Hover Overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden md:block"
                         style={{ background: 'linear-gradient(to top, rgba(7,7,13,0.95) 0%, transparent 55%)' }}>
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-col gap-1">
                        <h3 className="text-white font-sans font-semibold text-xs line-clamp-2 leading-tight">
                          {simTitle}
                        </h3>
                        {simVote !== undefined && simVote > 0 && (
                          <div className="flex items-center gap-1 text-[#a0a0b8] font-sans text-[11px]">
                            <Star fill="#f5c518" stroke="none" size={12} />
                            <span>{simVote.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}
        
      </motion.div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col md:items-center md:justify-center p-0 md:p-8 animate-in fade-in duration-200">
          <div className="w-full h-full md:h-[85vh] max-w-4xl bg-transparent md:bg-[#07070d] md:border md:border-white/10 md:rounded-2xl flex flex-col p-4 sm:p-6 md:p-8 md:shadow-2xl relative overflow-hidden">
            <div className="w-full mx-auto flex items-center gap-4 mb-8 shrink-0 mt-4 md:mt-0">
              <SearchIcon size={28} className="text-white/60 shrink-0" />
              <input 
                autoFocus
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-2xl sm:text-3xl text-white font-sans font-medium placeholder-white/40"
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
                {searchResults.results.map((item) => (
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
                      title={(item as any).title || item.name}
                      posterPath={(item as any).poster_path}
                      mediaType={item.media_type as 'movie' | 'tv'}
                      voteAverage={(item as any).vote_average}
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

