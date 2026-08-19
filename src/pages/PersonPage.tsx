import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ArrowLeft, AlertCircle, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient } from '../api/tmdb';
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
  hidden: { opacity: 0, y: 24 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.45, ease: "easeOut" as const } 
  }
};

export const PersonPage: React.FC = () => {
  const { id } = useParams({ from: '/person/$id' });
  const navigate = useNavigate();
  const apiKey = useKeyStore((state) => state.apiKey);
  
  const [showFullBio, setShowFullBio] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  if (!apiKey) return null;

  const tmdb = createTMDBClient(apiKey);

  const { data: details, isLoading: isLoadingDetails, error: errorDetails } = useQuery({
    queryKey: ['person', id],
    queryFn: () => tmdb.getPersonDetails(Number(id)),
  });

  const { data: credits, isLoading: isLoadingCredits } = useQuery({
    queryKey: ['person-credits', id],
    queryFn: () => tmdb.getPersonCredits(Number(id)),
  });

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
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

  if (isLoadingDetails) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        <div className="relative h-[60vh] min-h-[500px] w-full animate-shimmer"
             style={{ 
               background: 'linear-gradient(90deg, #0f0f1a 0%, #1c1c2e 50%, #0f0f1a 100%)',
               backgroundSize: '200% 100%' 
             }}>
          <div className="absolute bottom-0 left-0 right-0 px-8 pb-10 flex flex-col items-center justify-end h-full">
            <div className="w-36 h-36 rounded-full animate-shimmer mb-4"
                 style={{ 
                   background: 'linear-gradient(90deg, #0f0f1a 0%, #1c1c2e 50%, #0f0f1a 100%)',
                   backgroundSize: '200% 100%' 
                 }} />
            <div className="h-10 w-64 rounded animate-shimmer bg-[#1c1c2e] mb-2" />
            <div className="h-4 w-40 rounded animate-shimmer bg-[#1c1c2e]" />
          </div>
        </div>
      </div>
    );
  }

  if (errorDetails || !details) {
    return (
      <div className="min-h-[60vh] bg-[var(--color-background)] flex flex-col items-center justify-center text-center px-4">
        <AlertCircle size={48} className="text-[#5a5a72] mb-4" />
        <h1 className="font-sans font-semibold text-[20px] text-[#eeeef5] mb-2">Could not load person</h1>
        <p className="font-sans font-normal text-[14px] text-[#5a5a72] mb-6">
          The person may not exist or your API key may be invalid.
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

  const profileUrl = details.profile_path ? `${TMDB_IMAGE_BASE}original${details.profile_path}` : '';
  const avatarUrl = details.profile_path ? `${TMDB_IMAGE_BASE}w500${details.profile_path}` : '';
  
  // Sort and filter top 20 credits by popularity or vote average
  const sortedCredits = credits?.cast
    ? [...credits.cast]
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        .slice(0, 20)
    : [];

  return (
    <div className="min-h-screen bg-black pb-20 overflow-x-hidden">
      {/* Back Button */}
      <button 
        onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: '/' })}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-50 flex items-center justify-center w-10 h-10 rounded-full border border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-200"
        title="Back"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[500px] w-full bg-black overflow-hidden flex items-end justify-center">
        {profileUrl ? (
          <img
            src={profileUrl}
            alt={details.name}
            className="absolute inset-0 w-full h-full object-cover object-top opacity-50"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-[#0f0f1a]" />
        )}
        
        {/* Overlay Gradient */}
        <div 
          className="absolute inset-0 pointer-events-none z-10" 
          style={{ background: 'linear-gradient(to top, black 0%, black 10%, transparent 70%)' }} 
        />

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center pb-8 text-center px-4 w-full">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={details.name} 
              className="w-36 h-36 rounded-full object-cover border-2 border-white/20 mb-4 shadow-xl"
            />
          ) : (
            <div className="w-36 h-36 rounded-full border-2 border-white/20 mb-4 shadow-xl bg-[#1c1c2e] flex items-center justify-center text-[#5a5a72]">
              <User size={64} />
            </div>
          )}

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-[Georgia,'Times_New_Roman',serif] font-bold text-white text-4xl leading-tight mb-2"
          >
            {details.name}
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-1 font-sans text-sm"
          >
            <span className="text-[#9898b0]">{details.known_for_department}</span>
            <div className="flex items-center gap-2 text-[#5a5a72] text-[13px]">
              {details.birthday && <span>Born {details.birthday}</span>}
              {details.birthday && details.place_of_birth && <span>•</span>}
              {details.place_of_birth && <span>{details.place_of_birth}</span>}
            </div>
            {details.deathday && (
              <div className="text-[#5a5a72] text-[13px]">
                <span>Died {details.deathday}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="w-full max-w-[1000px] mx-auto px-16 pt-8 pb-12 flex flex-col gap-12"
      >
        {/* Biography Section */}
        <motion.section variants={itemVariants} className="bg-black">
          <h2 className="font-sans font-medium text-[11px] uppercase tracking-widest text-[#5a5a72] mb-4">
            BIOGRAPHY
          </h2>
          {details.biography ? (
            <div className="text-[#e2e2e2] font-sans text-base leading-[1.6]">
              <p className={!showFullBio ? "line-clamp-4" : ""}>
                {details.biography}
              </p>
              {details.biography.length > 300 && (
                <button 
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="mt-2 text-[#7c5cfc] hover:text-white transition-colors text-sm font-semibold"
                >
                  {showFullBio ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          ) : (
            <p className="text-[#5a5a72] font-sans text-base">No biography available.</p>
          )}
          <div className="border-t border-[rgba(255,255,255,0.06)] mt-10 w-full" />
        </motion.section>

        {/* Known For Section */}
        {!isLoadingCredits && sortedCredits.length > 0 && (
          <motion.section 
            variants={itemVariants} 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <h2 className="font-sans font-medium text-[11px] uppercase tracking-widest text-[#5a5a72] mb-4">
              KNOWN FOR
            </h2>

            <div className="relative">
              {/* Navigation Arrows */}
              <div 
                className={`absolute -left-4 top-1/2 -translate-y-1/2 z-30 transition-opacity duration-200 ${
                  showLeftArrow && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <button 
                  onClick={() => scrollByAmount(-800)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(7,7,13,0.8)] border border-[var(--color-border-subtle)] text-white hover:bg-[var(--color-surface)] hover:text-[#7c5cfc] transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
              </div>

              <div 
                className={`absolute -right-4 top-1/2 -translate-y-1/2 z-30 transition-opacity duration-200 ${
                  showRightArrow && isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <button 
                  onClick={() => scrollByAmount(800)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(7,7,13,0.8)] border border-[var(--color-border-subtle)] text-white hover:bg-[var(--color-surface)] hover:text-[#7c5cfc] transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Row */}
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto gap-3 no-scrollbar pb-2"
              >
                {sortedCredits.map((credit, i) => (
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
        )}
      </motion.div>
    </div>
  );
};
