import React, { useState, useEffect } from 'react';
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Star, Play, ThumbsUp, Minus, Heart, Share2, User, AlertCircle,
  ChevronDown, ChevronUp, Calendar, Clock
} from 'lucide-react';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient } from '../api/tmdb';
import { TMDB_IMAGE_BASE, TMDB_BACKDROP_SIZE, TMDB_POSTER_SIZE } from '../lib/constants';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'seasons'>('overview');
  const [selectedSeason, setSelectedSeason] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const tmdb = apiKey ? createTMDBClient(apiKey) : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['detail', type, id],
    queryFn: () => tmdb!.getMediaDetails(id, type),
    enabled: !!apiKey && !!id && !!tmdb,
  });

  const { data: seasonData, isLoading: seasonLoading } = useQuery({
    queryKey: ['season', id, selectedSeason],
    queryFn: () => tmdb!.getTVSeason(id, selectedSeason),
    enabled: !!apiKey && !!tmdb && type === 'tv' && activeTab === 'seasons',
  });

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
        <AlertCircle size={48} className="text-[#5a5a72] mb-4" />
        <h1 className="font-sans font-semibold text-lg sm:text-xl text-[#eeeef5] mb-2">Could not load title</h1>
        <p className="font-sans font-normal text-sm text-[#5a5a72] mb-6 max-w-sm">
          The title may not exist or your API key may be invalid.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-full bg-[rgba(15,15,26,0.8)] backdrop-blur-md border border-[rgba(255,255,255,0.15)] text-[#eeeef5] font-sans font-medium text-sm hover:bg-[var(--color-accent-dim)] hover:border-[var(--color-accent)] transition-all cursor-pointer"
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
  
  return (
    <div className="min-h-screen bg-[#07070d] pb-20 overflow-x-hidden">
      {/* Back Button */}
      <button 
        onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: '/' })}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200 cursor-pointer shadow-lg"
        title="Back"
        aria-label="Go Back"
      >
        <ArrowLeft size={18} />
      </button>

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
              className="font-[Georgia,'Times_New_Roman',serif] font-bold text-white leading-tight"
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
                  className="min-h-[44px] px-5 sm:px-6 rounded-full text-black bg-white font-sans font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer shadow-md"
                >
                  <Play size={16} fill="currentColor" stroke="none" />
                  Watch Trailer
                </button>
              )}
              <button 
                className="min-h-[44px] px-5 sm:px-6 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white font-sans font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Heart size={16} />
                My List
              </button>
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
                <span className="font-sans text-[10px] text-[#5a5a72] uppercase tracking-wider">Stream on</span>
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
        className="w-full max-w-[1000px] mx-auto px-4 sm:px-8 md:px-12 pt-6 md:pt-10 pb-12 flex flex-col gap-8 sm:gap-10 md:gap-12"
      >
        
        {type === 'tv' && seasons && seasons.length > 0 && (
          <div className="flex gap-1 border-b border-[rgba(255,255,255,0.07)] mb-8">
            {(['overview', 'seasons'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  font-sans text-xs font-semibold uppercase tracking-[0.12em] px-4 py-2.5
                  border-b-2 -mb-px transition-colors
                  ${activeTab === tab
                    ? 'border-[var(--color-accent)] text-[#eeeef5]'
                    : 'border-transparent text-[#5a5a72] hover:text-[#9898b0]'}
                `}
              >
                {tab === 'overview' ? 'Overview' : 'Seasons'}
              </button>
            ))}
          </div>
        )}

        <>
          {(activeTab === 'overview' || type !== 'tv') && (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8 sm:gap-10 md:gap-12">
        
              {/* OVERVIEW SECTION */}
        {data.overview && (
          <motion.section variants={itemVariants}>
            <h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.14em] text-[#5a5a72] mb-3">
              OVERVIEW
            </h2>
            <p className="font-sans font-normal text-sm sm:text-base md:text-lg text-[#e2e2e2] leading-[1.6] max-w-[840px]">
              {data.overview}
            </p>
            <div className="border-t border-[rgba(255,255,255,0.06)] mt-8 sm:mt-10 w-full" />
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
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72]">Part of</span>
                <span className="font-sans font-semibold text-sm text-[#eeeef5] mt-0.5">{collection.name}</span>
              </div>
            </div>
          </motion.section>
        )}

        {/* TOP CAST SECTION */}
        {data.credits?.cast && data.credits.cast.length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.14em] text-[#5a5a72] mb-4">
              TOP CAST
            </h2>
            <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-3 no-scrollbar snap-x snap-mandatory">
              {data.credits.cast.slice(0, 12).map(actor => (
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
                      <User size={24} className="text-[#5a5a72]" />
                    </div>
                  )}
                  <div className="flex flex-col w-full text-center">
                    <span className="font-sans font-semibold text-xs text-[#eeeef5] truncate" title={actor.name}>
                      {actor.name}
                    </span>
                    <span className="font-sans font-normal text-[10px] sm:text-[11px] text-[#5a5a72] truncate" title={actor.character}>
                      {actor.character}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[rgba(255,255,255,0.06)] mt-8 sm:mt-10 w-full" />
          </motion.section>
        )}

        {/* DETAILS GRID SECTION */}
        <motion.section variants={itemVariants}>
          <h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.14em] text-[#5a5a72] mb-4">
            DETAILS
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 sm:gap-x-8 gap-y-4 sm:gap-y-5 max-w-[840px]">
            {data.status && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">STATUS</span>
                <span className="font-sans font-medium text-xs sm:text-sm text-[#eeeef5]">{data.status}</span>
              </div>
            )}
            {director && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">DIRECTOR</span>
                <span className="font-sans font-medium text-xs sm:text-sm text-[#eeeef5]">{director.name}</span>
              </div>
            )}
            {createdBy && createdBy.length > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">CREATOR</span>
                <span className="font-sans font-medium text-xs sm:text-sm text-[#eeeef5]">{createdBy.map((c: any) => c.name).join(', ')}</span>
              </div>
            )}
            {spokenLang && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">LANGUAGE</span>
                <span className="font-sans font-medium text-xs sm:text-sm text-[#eeeef5]">{spokenLang}</span>
              </div>
            )}
            {networks.length > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">NETWORK</span>
                <span className="font-sans font-medium text-xs sm:text-sm text-[#eeeef5]">{networks.map(n => n.name).join(', ')}</span>
              </div>
            )}
            {data.budget !== undefined && data.budget > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">BUDGET</span>
                <span className="font-sans font-medium text-xs sm:text-sm text-[#eeeef5]">${data.budget.toLocaleString()}</span>
              </div>
            )}
            {data.revenue !== undefined && data.revenue > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">REVENUE</span>
                <span className="font-sans font-medium text-xs sm:text-sm text-[#eeeef5]">${data.revenue.toLocaleString()}</span>
              </div>
            )}
            {numEpisodes !== undefined && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">EPISODES</span>
                <span className="font-sans font-medium text-xs sm:text-sm text-[#eeeef5]">{numEpisodes}</span>
              </div>
            )}
            {numSeasons !== undefined && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">SEASONS</span>
                <span className="font-sans font-medium text-xs sm:text-sm text-[#eeeef5]">{numSeasons}</span>
              </div>
            )}
            {studios.length > 0 && (
              <div className="flex flex-col col-span-2">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">STUDIO</span>
                <span className="font-sans font-medium text-xs sm:text-sm text-[#eeeef5]">{studios.map(s => s.name).join(' · ')}</span>
              </div>
            )}
            {data.vote_count !== undefined && data.vote_count > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[10px] uppercase tracking-wider text-[#5a5a72] mb-1">VOTES</span>
                <span className="font-sans font-medium text-xs sm:text-sm text-[#eeeef5]">{data.vote_count.toLocaleString()} votes</span>
              </div>
            )}
          </div>
          <div className="border-t border-[rgba(255,255,255,0.06)] mt-8 sm:mt-10 w-full" />
        </motion.section>

        {/* KEYWORDS */}
        {keywords.length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.14em] text-[#5a5a72] mb-3">
              TAGS
            </h2>
            <div className="flex flex-wrap gap-2">
              {keywords.slice(0, 16).map((kw) => (
                <span
                  key={kw.id}
                  className="font-sans text-[11px] text-[#9898b0] px-2.5 py-1 rounded-full bg-[#0e0e1a] border border-[rgba(255,255,255,0.07)] hover:border-[var(--color-accent)] hover:text-[#eeeef5] transition-colors cursor-default"
                >
                  {kw.name}
                </span>
              ))}
            </div>
            <div className="border-t border-[rgba(255,255,255,0.06)] mt-8 sm:mt-10 w-full" />
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
                          : 'border-[rgba(255,255,255,0.12)] text-[#9898b0] hover:border-white/30 hover:text-[#eeeef5]'
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
                            <span className="font-sans text-[10px] font-bold text-[#5a5a72] bg-[#0e0e1a] px-2 py-0.5 rounded shrink-0">
                              E{String(ep.episode_number).padStart(2, '0')}
                            </span>
                            <span className="font-sans font-semibold text-sm text-[#eeeef5] leading-snug truncate">
                              {ep.name}
                            </span>
                            {ep.vote_average > 0 && (
                              <span className="font-sans text-[10px] font-semibold text-[#4ade80] bg-[#0e1a0e] px-2 py-0.5 rounded-full shrink-0">
                                ★ {ep.vote_average.toFixed(1)}
                              </span>
                            )}
                          </div>

                          {/* Air date + runtime */}
                          <div className="flex items-center gap-3 text-[11px] text-[#5a5a72]">
                            {ep.air_date && <span>{ep.air_date}</span>}
                            {ep.runtime && <span>{ep.runtime} min</span>}
                          </div>

                          {/* Overview */}
                          {ep.overview && (
                            <p className="font-sans text-xs text-[#9898b0] leading-relaxed line-clamp-2 mt-0.5">
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
                <p className="px-5 py-4 text-xs text-[#5a5a72] font-sans">No episode data available.</p>
              )}
            </motion.div>
          )}
        </>

        {/* YOU MAY ALSO LIKE SECTION */}
        {data.similar?.results && data.similar.results.length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.14em] text-[#5a5a72] mb-4">
              YOU MAY ALSO LIKE
            </h2>
            <div className="flex overflow-x-auto gap-2.5 sm:gap-3.5 pb-3 no-scrollbar snap-x snap-mandatory">
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
                    className="relative w-[130px] min-[375px]:w-[140px] sm:w-[160px] md:w-[180px] shrink-0 aspect-[2/3] rounded-[var(--radius)] overflow-hidden cursor-pointer group bg-[#141420] snap-start select-none shadow-md"
                  >
                    {simImageUrl ? (
                      <img 
                        src={simImageUrl} 
                        alt={simTitle}
                        loading="lazy"
                        className="w-full h-full object-cover block"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#5a5a72] p-3 text-center">
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
                          <div className="flex items-center gap-1 text-[#9898b0] font-sans text-[11px]">
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
    </div>
  );
};

