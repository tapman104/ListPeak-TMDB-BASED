import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useKeyStore } from '../store/keyStore';
import { createTMDBClient } from '../api/tmdb';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PosterCard } from '../components/PosterCard';

export const TrendingPage: React.FC = () => {
  const apiKey = useKeyStore((state) => state.apiKey);
  const tmdb = apiKey ? createTMDBClient(apiKey) : null;

  const { data: trendingWeek, isLoading } = useQuery({
    queryKey: ['trending-week'],
    queryFn: ({ signal }) => tmdb!.getTrendingWeek({ signal }),
    enabled: !!apiKey,
    staleTime: 1000 * 60 * 5,
  });

  if (!apiKey) return null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12 px-4 sm:px-8 md:px-12 max-w-[1600px] mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-6">
          Trending This Week
        </h1>
        
        {isLoading ? (
          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            <div className="text-white animate-pulse">Loading trending...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
            {trendingWeek?.results.map((item, index) => (
              <PosterCard
                key={item.id}
                id={item.id}
                title={item.title || item.name}
                posterPath={item.poster_path}
                rank={index + 1}
                mediaType={item.media_type}
                voteAverage={item.vote_average}
                className="w-full"
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
