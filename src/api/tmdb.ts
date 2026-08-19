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

export interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  also_known_as: string[];
  gender: number;
  homepage: string | null;
  imdb_id: string | null;
  combined_credits?: {
    cast: PersonCredit[];
    crew?: PersonCredit[];
  };
  images?: {
    profiles: { file_path: string }[];
  };
}

export interface PersonCredit {
  id: number;
  title?: string;
  name?: string;
  media_type?: 'movie' | 'tv';
  character?: string;
  job?: string;
  department?: string;
  poster_path: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
}

export interface TMDBPerson {
  id: number;
  name: string;
  profile_path: string | null;
  media_type?: 'person';
  known_for_department?: string;
  known_for?: (TMDBMedia & { media_type?: 'movie' | 'tv' })[];
  popularity: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export type SearchResultItem = (TMDBMedia & { media_type?: 'movie' | 'tv' }) | (TMDBPerson & { media_type: 'person' });

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
    getPersonDetails: (id: number) => fetchTMDB<PersonDetail>(`/person/${id}?append_to_response=combined_credits,images`),
    getPersonCredits: (id: number) => fetchTMDB<{ cast: PersonCredit[]; crew?: PersonCredit[] }>(`/person/${id}/combined_credits`),
    getPersonImages: (id: number) => fetchTMDB<{ profiles: { file_path: string }[] }>(`/person/${id}/images`),
    getMovieGenres: () => fetchTMDB<{ genres: TMDBGenre[] }>('/genre/movie/list'),
    getTVGenres: () => fetchTMDB<{ genres: TMDBGenre[] }>('/genre/tv/list'),
    searchMulti: (query: string, page = 1) => 
      fetchTMDB<TMDBResponse<SearchResultItem>>(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`),
    searchMovies: (query: string, page = 1, options?: { primary_release_year?: string | number; year?: string | number }) => {
      let url = `/search/movie?query=${encodeURIComponent(query)}&page=${page}`;
      if (options?.primary_release_year) {
        url += `&primary_release_year=${options.primary_release_year}`;
      } else if (options?.year) {
        url += `&year=${options.year}`;
      }
      return fetchTMDB<TMDBResponse<TMDBMedia>>(url);
    },
    searchTV: (query: string, page = 1, options?: { first_air_date_year?: string | number; year?: string | number }) => {
      let url = `/search/tv?query=${encodeURIComponent(query)}&page=${page}`;
      if (options?.first_air_date_year) {
        url += `&first_air_date_year=${options.first_air_date_year}`;
      } else if (options?.year) {
        url += `&year=${options.year}`;
      }
      return fetchTMDB<TMDBResponse<TMDBMedia>>(url);
    },
    searchPeople: (query: string, page = 1) => 
      fetchTMDB<TMDBResponse<TMDBPerson>>(`/search/person?query=${encodeURIComponent(query)}&page=${page}`),
  };
};
