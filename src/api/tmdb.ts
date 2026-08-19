import { throttledFetch } from '../lib/rateLimiter';

const BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type?: 'movie' | 'tv';
  genre_ids: number[];
  popularity: number;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBDetail {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  original_language: string;
  budget?: number;
  revenue?: number;
  status: string;
  genres: { id: number; name: string }[];
  credits: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
  videos: {
    results: { id: string; key: string; name: string; site: string; type: string }[];
  };
  similar: {
    results: TMDBMedia[];
  };
}

export const createTMDBClient = (apiKey: string) => {
  const fetchTMDB = async <T>(endpoint: string): Promise<T> => {
    const separator = endpoint.includes('?') ? '&' : '?';
    const response = await throttledFetch(`${BASE_URL}${endpoint}${separator}api_key=${apiKey}&language=en-US`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('API key invalid or expired');
      }
      throw new Error(`TMDB API Error: ${response.status}`);
    }
    return response.json();
  };

  return {
    verifyKey: async () => {
      const response = await throttledFetch(`${BASE_URL}/authentication?api_key=${apiKey}`);
      if (!response.ok) {
        throw new Error('Invalid key');
      }
      return response.json();
    },
    getTrendingWeek: () => fetchTMDB<TMDBResponse<TMDBMedia>>('/trending/all/week'),
    getPopularMovies: () => fetchTMDB<TMDBResponse<TMDBMedia>>('/movie/popular'),
    getTopRatedSeries: () => fetchTMDB<TMDBResponse<TMDBMedia>>('/tv/top_rated'),
    getMediaDetails: (id: string, type: 'movie' | 'tv') => 
      fetchTMDB<TMDBDetail>(`/${type}/${id}?append_to_response=credits,videos,similar`),
  };
};
