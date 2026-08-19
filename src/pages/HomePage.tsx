import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient } from '../api/tmdb';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { SectionRow } from '../components/SectionRow';
import { AlertCircle } from 'lucide-react';

export const HomePage: React.FC = () => {
  const apiKey = useKeyStore((state) => state.apiKey);
  const navigate = useNavigate();

  if (!apiKey) {
    return null;
  }

  const tmdb = createTMDBClient(apiKey);

  const { data: trendingWeek, isLoading: isLoadingWeek, error: errorWeek } = useQuery({
    queryKey: ['trending-week'],
    queryFn: tmdb.getTrendingWeek,
  });

  const { data: popularMovies, isLoading: isLoadingPopular } = useQuery({
    queryKey: ['popular-movies'],
    queryFn: tmdb.getPopularMovies,
  });

  const { data: topRatedSeries, isLoading: isLoadingSeries } = useQuery({
    queryKey: ['top-rated-series'],
    queryFn: tmdb.getTopRatedSeries,
  });

  const heroItem = trendingWeek?.results?.[0] || null;

  const hasAuthError = errorWeek?.message === 'API key invalid or expired';

  if (hasAuthError) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">API key invalid or expired</h2>
          <p className="text-red-200 mb-6">Please update your TMDb API key to continue.</p>
          <button 
            onClick={() => {
              useKeyStore.getState().clearApiKey();
              navigate({ to: '/setup' });
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Update Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-20">
      <Navbar />
      
      <main>
        <HeroSection item={heroItem} isLoading={isLoadingWeek} />
        
        <div className="mt-[-4rem] relative z-20 space-y-2">
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
    </div>
  );
};
