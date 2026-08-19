import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient } from '../api/tmdb';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { SectionRow } from '../components/SectionRow';
import { Footer } from '../components/Footer';
import { AlertCircle } from 'lucide-react';

export const HomePage: React.FC = () => {
  const apiKey = useKeyStore((state) => state.apiKey);
  const navigate = useNavigate();

  const tmdb = apiKey ? createTMDBClient(apiKey) : null;

  const { data: trendingWeek, isLoading: isLoadingWeek, error: errorWeek } = useQuery({
    queryKey: ['trending-week'],
    queryFn: () => tmdb!.getTrendingWeek(),
    enabled: !!apiKey,
  });

  const { data: popularMovies, isLoading: isLoadingPopular } = useQuery({
    queryKey: ['popular-movies'],
    queryFn: () => tmdb!.getPopularMovies(),
    enabled: !!apiKey,
  });

  const { data: topRatedSeries, isLoading: isLoadingSeries } = useQuery({
    queryKey: ['top-rated-series'],
    queryFn: () => tmdb!.getTopRatedSeries(),
    enabled: !!apiKey,
  });

  if (!apiKey) {
    return null;
  }


  const heroItem = trendingWeek?.results?.[0] || null;

  const hasAuthError = errorWeek?.message === 'API key invalid or expired';

  if (hasAuthError) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 sm:p-8 max-w-md text-center">
          <AlertCircle className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2 font-display tracking-wide">API key invalid or expired</h2>
          <p className="text-red-200 mb-6 text-sm">Please update your TMDb API key to continue.</p>
          <button 
            onClick={() => {
              useKeyStore.getState().clearApiKey();
              navigate({ to: '/setup' });
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors cursor-pointer min-h-[44px]"
          >
            Update Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-1">
        <HeroSection item={heroItem} isLoading={isLoadingWeek} />
        
        <div className="mt-[-2.5rem] sm:mt-[-3.5rem] md:mt-[-5rem] relative z-20 space-y-1 sm:space-y-2">
          <SectionRow 
            title="Trending This Week" 
            items={trendingWeek?.results || []} 
            isLoading={isLoadingWeek}
            showRank={true}
          />
          
          <SectionRow 
            title="Popular Movies" 
            items={popularMovies?.results || []} 
            isLoading={isLoadingPopular}
          />

          <SectionRow 
            title="Top Rated Series" 
            items={topRatedSeries?.results || []} 
            isLoading={isLoadingSeries}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

