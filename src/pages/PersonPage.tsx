import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ArrowLeft, AlertCircle, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useKeyStore } from '../store/keyStore';
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

// Reusable row for credits
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
      <h2 className="font-sans font-medium text-[11px] uppercase tracking-[0.14em] text-[#5a5a72] mb-3 sm:mb-4">
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
          className="flex overflow-x-auto gap-2.5 sm:gap-3.5 no-scrollbar pb-3 snap-x snap-mandatory"
        >
          {credits.map((credit, i) => (
            <PosterCard
              key={`${credit.id}-${i}`}
              id={credit.id}
              title={credit.title || credit.name}
              posterPath={credit.poster_path}
              mediaType={credit.media_type}
              voteAverage={credit.vote_average}
            />
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
  
  const [showFullBio, setShowFullBio] = useState(false);

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
    enabled: !!tmdb && !isNaN(personId) && !details?.combined_credits,
    staleTime: 1000 * 60 * 10,
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
    .filter(c => c.media_type === 'movie' || (!c.media_type && (Boolean(c.title) || Boolean(c.release_date))))
    .sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    });

  const shows = rawCredits
    .filter(c => c.media_type === 'tv' || (!c.media_type && (Boolean(c.name) || Boolean(c.first_air_date))))
    .sort((a, b) => {
      const dateA = a.first_air_date ? new Date(a.first_air_date).getTime() : 0;
      const dateB = b.first_air_date ? new Date(b.first_air_date).getTime() : 0;
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
    });

  const movieCount = movies.length;
  const tvCount = shows.length;
  const totalCount = rawCredits.length;

  const age = calculateAge(details.birthday, details.deathday);

  return (
    <div className="min-h-screen bg-black pb-20 overflow-x-hidden">
      {/* Back Button */}
      <button 
        onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: '/' })}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200 cursor-pointer shadow-lg"
        title="Back"
        aria-label="Go Back"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Hero Section */}
      <div className="relative min-h-[580px] sm:min-h-[640px] md:min-h-[75vh] w-full bg-black overflow-hidden flex items-end justify-center pb-8 sm:pb-12 md:pb-16 pt-20 sm:pt-24">
        {profileUrl ? (
          <img
            src={profileUrl}
            alt={details.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              background: 'radial-gradient(ellipse at 50% 30%, #1a1a2e 0%, #0d0d18 60%, #000000 100%)'
            }}
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
        <div className="relative z-20 flex flex-col md:flex-row items-center md:items-end justify-center gap-6 sm:gap-8 md:gap-12 max-w-[1000px] w-full px-4 sm:px-6 md:px-8 pointer-events-auto">
            
            {/* LEFT: Portrait Photo or Fallback */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" as const }}
              className="relative w-36 min-[375px]:w-44 sm:w-52 md:w-56 shrink-0 aspect-[2/3] rounded-xl shadow-2xl overflow-hidden bg-[#12121e] border border-white/10 flex items-center justify-center"
            >
              {avatarUrl ? (
                <>
                  <img 
                    src={avatarUrl} 
                    alt={details.name}
                    className="w-full h-full object-cover rounded-xl block"
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
              className="flex flex-col gap-3 sm:gap-4 max-w-2xl text-center md:text-left items-center md:items-start w-full"
            >
              <motion.h1 
                variants={itemVariants}
                className="font-[Georgia,'Times_New_Roman',serif] font-bold text-white leading-tight break-words whitespace-normal max-w-full"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}
              >
                {details.name}
              </motion.h1>

              {details.known_for_department && (
                <motion.div variants={itemVariants}>
                  <span className="inline-block px-3 py-1 bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)] rounded-full font-sans text-[10px] sm:text-[11px] tracking-wider uppercase leading-none font-semibold">
                    {details.known_for_department}
                  </span>
                </motion.div>
              )}
              
              {/* Stats Row */}
              <motion.div variants={itemVariants} className="flex flex-wrap justify-center md:justify-start items-center gap-4 sm:gap-6 mt-1 text-center md:text-left">
                {details.birthday && (
                  <div className="flex flex-col">
                    <span className="text-[#5a5a72] text-[10px] uppercase tracking-widest font-semibold mb-0.5">Born</span>
                    <span className="text-[#eeeef5] text-xs sm:text-sm font-medium">{formatDate(details.birthday)}</span>
                  </div>
                )}
                {details.birthday && age !== null && (
                  <div className="flex flex-col">
                    <span className="text-[#5a5a72] text-[10px] uppercase tracking-widest font-semibold mb-0.5">Age</span>
                    <span className="text-[#eeeef5] text-xs sm:text-sm font-medium">{details.deathday ? `† Age ${age}` : age}</span>
                  </div>
                )}
                {details.place_of_birth && (
                  <div className="flex flex-col">
                    <span className="text-[#5a5a72] text-[10px] uppercase tracking-widest font-semibold mb-0.5">From</span>
                    <span className="text-[#eeeef5] text-xs sm:text-sm font-medium">{details.place_of_birth}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[#5a5a72] text-[10px] uppercase tracking-widest font-semibold mb-0.5">Gender</span>
                  <span className="text-[#eeeef5] text-xs sm:text-sm font-medium">
                    {details.gender === 1 ? 'Female' : details.gender === 2 ? 'Male' : '—'}
                  </span>
                </div>
              </motion.div>

              {/* Also Known As */}
              {details.also_known_as && details.also_known_as.length > 0 && (
                <motion.div variants={itemVariants} className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2 mt-1">
                  {details.also_known_as.slice(0, 3).map(alias => (
                    <span key={alias} className="px-2 py-0.5 bg-white/10 text-[#9898b0] text-[10px] sm:text-[11px] rounded font-medium border border-white/5">
                      {alias}
                    </span>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-16 py-4 sm:py-5 bg-[#0a0a10] border-y border-[rgba(255,255,255,0.04)] shadow-inner w-full px-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white text-xl sm:text-2xl font-bold font-sans">
              {isCreditsLoading ? '—' : movieCount}
            </span>
            <span className="text-[#5a5a72] text-[9px] sm:text-[10px] uppercase tracking-[0.14em] font-semibold">Movies</span>
          </div>
          <div className="w-px h-8 sm:h-10 bg-[rgba(255,255,255,0.08)]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white text-xl sm:text-2xl font-bold font-sans">
              {isCreditsLoading ? '—' : tvCount}
            </span>
            <span className="text-[#5a5a72] text-[9px] sm:text-[10px] uppercase tracking-[0.14em] font-semibold">TV Shows</span>
          </div>
          <div className="w-px h-8 sm:h-10 bg-[rgba(255,255,255,0.08)]" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white text-xl sm:text-2xl font-bold font-sans">
              {isCreditsLoading ? '—' : totalCount}
            </span>
            <span className="text-[#5a5a72] text-[9px] sm:text-[10px] uppercase tracking-[0.14em] font-semibold">Total Credits</span>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 md:px-8 pt-8 sm:pt-10 pb-12 flex flex-col gap-8 sm:gap-12"
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
              <div className="text-[#e2e2e2] font-sans text-sm sm:text-base leading-[1.6]">
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
                  {knownFor.length > 0 && <CreditRow title="KNOWN FOR" credits={knownFor} />}
                  {movies.length > 0 && <CreditRow title={`MOVIES (${movieCount})`} credits={movies} />}
                  {shows.length > 0 && <CreditRow title={`TV SHOWS (${tvCount})`} credits={shows} />}
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
    </div>
  );
};

