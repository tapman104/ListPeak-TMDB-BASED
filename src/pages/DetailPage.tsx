import React, { useState } from 'react';
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Star, Play, Plus, ThumbsUp, Minus, Heart, Share2, User, AlertCircle, Clock
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
  hidden: { opacity: 0, y: 24 },
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

  if (!apiKey) return null;

  const tmdb = createTMDBClient(apiKey);

  const { data, isLoading, error } = useQuery({
    queryKey: ['detail', type, id],
    queryFn: () => tmdb.getMediaDetails(id, type),
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        {/* Backdrop Skeleton */}
        <div className="relative h-[70vh] min-h-[500px] w-full animate-shimmer"
             style={{ 
               background: 'linear-gradient(90deg, #0f0f1a 0%, #1c1c2e 50%, #0f0f1a 100%)',
               backgroundSize: '200% 100%' 
             }}>
          {/* Info Block Skeleton */}
          <div className="absolute bottom-0 left-0 right-0 px-[24px] md:px-[80px] pb-[40px] md:pb-[56px] flex flex-col md:flex-row items-start md:items-end gap-[40px]">
            <div className="w-[120px] md:w-[160px] aspect-[2/3] shrink-0 rounded-[12px] animate-shimmer"
                 style={{ 
                   background: 'linear-gradient(90deg, #0f0f1a 0%, #1c1c2e 50%, #0f0f1a 100%)',
                   backgroundSize: '200% 100%' 
                 }} />
            <div className="flex-1 w-full space-y-4">
              <div className="h-[48px] w-[60%] rounded animate-shimmer bg-[#1c1c2e]" />
              <div className="h-[24px] w-[40%] rounded animate-shimmer bg-[#1c1c2e]" />
              <div className="h-[24px] w-[80%] rounded animate-shimmer bg-[#1c1c2e]" />
            </div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="px-[24px] md:px-[80px] py-[40px] md:py-[56px] flex flex-col gap-[48px]">
          <div>
            <div className="h-[16px] w-[100px] rounded animate-shimmer bg-[#1c1c2e] mb-4" />
            <div className="space-y-2">
              <div className="h-[16px] w-full rounded animate-shimmer bg-[#1c1c2e]" />
              <div className="h-[16px] w-full rounded animate-shimmer bg-[#1c1c2e]" />
              <div className="h-[16px] w-[70%] rounded animate-shimmer bg-[#1c1c2e]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] bg-[var(--color-background)] flex flex-col items-center justify-center text-center px-4">
        <AlertCircle size={48} className="text-[#5a5a72] mb-4" />
        <h1 className="font-sans font-semibold text-[20px] text-[#eeeef5] mb-2">Could not load title</h1>
        <p className="font-sans font-normal text-[14px] text-[#5a5a72] mb-6">
          The title may not exist or your API key may be invalid.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 h-[36px] px-4 rounded-full bg-[rgba(15,15,26,0.7)] backdrop-blur-[8px] border border-[rgba(255,255,255,0.1)] text-[#eeeef5] font-sans font-medium text-[13px] hover:bg-[rgba(124,92,252,0.2)] hover:border-[rgba(124,92,252,0.5)] transition-all duration-200"
        >
          <ArrowLeft size={15} /> Back
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
  
  const matchScore = data.vote_average ? Math.round(data.vote_average * 10) : null;
  // @ts-ignore
  const tagline = data.tagline; // accessing untyped field that might exist
  // @ts-ignore
  const createdBy = data.created_by; // array
  // @ts-ignore
  const numEpisodes = data.number_of_episodes;
  // @ts-ignore
  const numSeasons = data.number_of_seasons;

  const director = type === 'movie' ? data.credits?.crew?.find(c => c.job === 'Director') : null;
  const trailer = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  
  return (
    <div className="min-h-screen bg-[#07070d] pb-20 overflow-x-hidden">
      {/* Back Button */}
      <button 
        onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: '/' })}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-50 flex items-center justify-center w-10 h-10 rounded-full border border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-200"
        title="Back"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Backdrop Section */}
      <div className="relative h-[85vh] min-h-[85vh] w-full bg-black overflow-hidden">
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover object-[center_top]"
          />
        )}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
        <div 
          className="absolute bottom-0 left-0 right-0 h-full pointer-events-none" 
          style={{ background: 'linear-gradient(to top, black 0%, black 15%, transparent 60%)' }} 
        />

        {/* Bottom Fade Overlay */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[200px] pointer-events-none z-10" 
          style={{ background: 'linear-gradient(to top, #000000 0%, transparent 100%)' }} 
        />

        {/* Main Info Block */}
        <div className="absolute inset-0 flex items-end justify-center pb-10 md:pb-14 z-20 overflow-visible pointer-events-none">
          <div className="flex flex-col md:flex-row items-end justify-center gap-[30px] md:gap-[48px] max-w-[1000px] w-full px-[24px] pointer-events-auto overflow-visible">
            
            {/* LEFT: Poster */}
            {posterUrl && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" as const }}
                className="relative w-56 md:w-64 shrink-0 rounded-xl"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
              >
                <img 
                  src={posterUrl} 
                  alt={title}
                  className="w-full h-auto object-contain rounded-xl block"
                />
                {/* Poster Bottom Fade Overlay */}
                <div 
                  className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-xl pointer-events-none" 
                  style={{ background: 'linear-gradient(to top, black 0%, transparent 40%)' }} 
                />
              </motion.div>
            )}

            {/* RIGHT: Info Content */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-[16px] max-w-2xl text-center md:text-left items-center md:items-start"
            >
              {/* Title */}
              <motion.h1 
                variants={itemVariants}
                className="font-[Georgia,'Times_New_Roman',serif] font-bold text-white text-4xl md:text-5xl leading-tight"
              >
                {title}
              </motion.h1>

              {/* Tagline */}
              {tagline && (
                <motion.p variants={itemVariants} className="font-sans font-normal text-base text-white/70">
                  {tagline}
                </motion.p>
              )}

              {/* Metadata Inline */}
              <motion.div variants={itemVariants} className="flex items-center gap-[8px] flex-wrap font-sans text-sm text-white justify-center md:justify-start">
                {data.vote_average > 0 && (
                  <span className="text-[#4ade80] flex items-center gap-1 font-medium">
                    ★ {data.vote_average.toFixed(1)} Match
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
                    <span>{numSeasons} Season{numSeasons !== 1 ? 's' : ''} {numEpisodes ? `(${numEpisodes} Episodes)` : ''}</span>
                  </>
                ) : runtime ? (
                  <>
                    <span>{formatRuntime(runtime)}</span>
                  </>
                ) : null}
                
                {(numSeasons || runtime) && data.genres?.length > 0 && <span>·</span>}
                
                {data.genres?.length > 0 && (
                  <span>
                    {data.genres.map((g: any) => g.name.toLowerCase()).join(' · ')}
                  </span>
                )}
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={itemVariants} className="flex gap-[16px] mt-2">
                {trailer && (
                  <button 
                    onClick={() => window.open(`https://youtube.com/watch?v=${trailer.key}`, '_blank')}
                    className="px-6 py-2.5 rounded text-black bg-white font-sans font-bold text-sm flex items-center gap-2 hover:bg-white/80 transition-all"
                  >
                    <Play size={18} fill="currentColor" stroke="none" />
                    Watch Trailer
                  </button>
                )}
                <button 
                  className="px-6 py-2.5 rounded bg-black/40 border border-white/20 text-white font-sans font-bold text-sm flex items-center gap-2 hover:bg-black/60 transition-all"
                >
                  <Heart size={18} />
                  My List
                </button>
              </motion.div>

              {/* Icon Action Row */}
              <motion.div variants={itemVariants} className="flex gap-[10px] mt-1">
                <button title="Like" className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 transition-all">
                  <ThumbsUp size={14} />
                </button>
                <button title="Not Interested" className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 transition-all">
                  <Minus size={14} />
                </button>
                <button title="Favorite" className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 transition-all">
                  <Heart size={14} />
                </button>
                <div className="relative">
                  <button 
                    title="Share" 
                    onClick={handleShare}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 transition-all"
                  >
                    <Share2 size={14} />
                  </button>
                  {showCopied && (
                    <div className="absolute -top-[36px] left-1/2 -translate-x-1/2 bg-[#1c1c2e] text-white text-[12px] font-sans font-semibold px-3 py-1.5 rounded">
                      Copied!
                    </div>
                  )}
                </div>
              </motion.div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Below Backdrop */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="w-full max-w-[1000px] mx-auto px-[24px] pt-6 md:pt-8 pb-12 flex flex-col gap-[36px] md:gap-[48px]"
      >
        
        {/* OVERVIEW SECTION */}
        {data.overview && (
          <motion.section variants={itemVariants}>
            <p className="font-sans font-normal text-base md:text-lg text-[#e2e2e2] leading-[1.6] max-w-[820px]">
              {data.overview}
            </p>
            <div className="border-t border-[rgba(255,255,255,0.06)] mt-8 md:mt-10 w-full" />
          </motion.section>
        )}

        {/* TOP CAST SECTION */}
        {data.credits?.cast && data.credits.cast.length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.12em] text-[#5a5a72] mb-[14px]">
              TOP CAST
            </h2>
            <div className="flex overflow-x-auto gap-[28px] pb-[8px] no-scrollbar">
              {data.credits.cast.slice(0, 10).map(actor => (
                <div key={actor.id} className="w-[88px] shrink-0 flex flex-col items-center gap-[10px]">
                  {actor.profile_path ? (
                    <img 
                      src={`${TMDB_IMAGE_BASE}w185${actor.profile_path}`} 
                      alt={actor.name}
                      className="w-[78px] h-[78px] rounded-full object-cover border-[2px] border-[rgba(255,255,255,0.1)]"
                    />
                  ) : (
                    <div className="w-[78px] h-[78px] rounded-full bg-[#1c1c2e] border-[2px] border-[rgba(255,255,255,0.1)] flex items-center justify-center">
                      <User size={26} className="text-[#5a5a72]" />
                    </div>
                  )}
                  <div className="flex flex-col w-full text-center">
                    <span className="font-sans font-semibold text-[12px] text-[#eeeef5] whitespace-nowrap overflow-hidden text-ellipsis" title={actor.name}>
                      {actor.name}
                    </span>
                    <span className="font-sans font-normal text-[11px] text-[#5a5a72] whitespace-nowrap overflow-hidden text-ellipsis" title={actor.character}>
                      {actor.character}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[rgba(255,255,255,0.06)] mt-[48px] w-full" />
          </motion.section>
        )}

        {/* DETAILS GRID SECTION */}
        <motion.section variants={itemVariants}>
          <h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.12em] text-[#5a5a72] mb-[14px]">
            DETAILS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-x-[32px] gap-y-[20px] max-w-[820px]">
            {data.status && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[11px] uppercase tracking-[0.1em] text-[#5a5a72] mb-[4px]">STATUS</span>
                <span className="font-sans font-medium text-[14px] text-[#eeeef5]">{data.status}</span>
              </div>
            )}
            {director && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[11px] uppercase tracking-[0.1em] text-[#5a5a72] mb-[4px]">DIRECTOR</span>
                <span className="font-sans font-medium text-[14px] text-[#eeeef5]">{director.name}</span>
              </div>
            )}
            {createdBy && createdBy.length > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[11px] uppercase tracking-[0.1em] text-[#5a5a72] mb-[4px]">CREATOR</span>
                <span className="font-sans font-medium text-[14px] text-[#eeeef5]">{createdBy[0].name}</span>
              </div>
            )}
            {data.original_language && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[11px] uppercase tracking-[0.1em] text-[#5a5a72] mb-[4px]">LANGUAGE</span>
                <span className="font-sans font-medium text-[14px] text-[#eeeef5] uppercase">{data.original_language}</span>
              </div>
            )}
            {data.budget !== undefined && data.budget > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[11px] uppercase tracking-[0.1em] text-[#5a5a72] mb-[4px]">BUDGET</span>
                <span className="font-sans font-medium text-[14px] text-[#eeeef5]">${data.budget.toLocaleString()}</span>
              </div>
            )}
            {data.revenue !== undefined && data.revenue > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[11px] uppercase tracking-[0.1em] text-[#5a5a72] mb-[4px]">REVENUE</span>
                <span className="font-sans font-medium text-[14px] text-[#eeeef5]">${data.revenue.toLocaleString()}</span>
              </div>
            )}
            {numEpisodes !== undefined && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[11px] uppercase tracking-[0.1em] text-[#5a5a72] mb-[4px]">EPISODES</span>
                <span className="font-sans font-medium text-[14px] text-[#eeeef5]">{numEpisodes}</span>
              </div>
            )}
            {numSeasons !== undefined && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[11px] uppercase tracking-[0.1em] text-[#5a5a72] mb-[4px]">SEASONS</span>
                <span className="font-sans font-medium text-[14px] text-[#eeeef5]">{numSeasons}</span>
              </div>
            )}
            {data.vote_count !== undefined && data.vote_count > 0 && (
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[11px] uppercase tracking-[0.1em] text-[#5a5a72] mb-[4px]">VOTES</span>
                <span className="font-sans font-medium text-[14px] text-[#eeeef5]">{data.vote_count.toLocaleString()} votes</span>
              </div>
            )}
          </div>
          <div className="border-t border-[rgba(255,255,255,0.06)] mt-[48px] w-full" />
        </motion.section>

        {/* YOU MAY ALSO LIKE SECTION */}
        {data.similar?.results && data.similar.results.length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.12em] text-[#5a5a72] mb-[14px]">
              YOU MAY ALSO LIKE
            </h2>
            <div className="flex overflow-x-auto gap-[14px] pb-[8px] no-scrollbar">
              {data.similar.results.slice(0, 12).map((item) => {
                const simImageUrl = item.poster_path ? `${TMDB_IMAGE_BASE}w342${item.poster_path}` : null;
                const simTitle = item.title || item.name;
                const simVote = item.vote_average;
                
                return (
                  <motion.div
                    key={item.id}
                    onClick={() => navigate({ to: '/detail/$id', params: { id: item.id.toString() }, search: { type: item.title ? 'movie' : 'tv' } })}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.18 }}
                    className="relative w-[185px] shrink-0 aspect-[2/3] rounded-[10px] overflow-hidden cursor-pointer group bg-[#141420]"
                  >
                    {simImageUrl ? (
                      <img 
                        src={simImageUrl} 
                        alt={simTitle}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#5a5a72] p-4 text-center">
                        <span className="text-sm font-sans">{simTitle}</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                         style={{ background: 'linear-gradient(to top, rgba(7,7,13,0.95) 0%, transparent 55%)' }}>
                      <div className="absolute bottom-[10px] left-[10px] right-[10px] flex flex-col gap-1">
                        <h3 className="text-white font-sans font-semibold text-[13px] line-clamp-2 leading-tight">
                          {simTitle}
                        </h3>
                        {simVote !== undefined && simVote > 0 && (
                          <div className="flex items-center gap-1 text-[#9898b0] font-sans text-[12px]">
                            <Star fill="#f5c518" stroke="none" size={14} />
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
