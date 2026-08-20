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
  content_ratings?: {
    results: { iso_3166_1: string; rating: string }[];
  };
  'watch/providers'?: {
    results: {
      [countryCode: string]: {
        link: string;
        flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
        rent?: { provider_id: number; provider_name: string; logo_path: string }[];
        buy?: { provider_id: number; provider_name: string; logo_path: string }[];
      };
    };
  };
  keywords?: {
    results?: { id: number; name: string }[];   // movies
    results_tv?: never;
  } | {
    results?: { id: number; name: string }[];   // tv (same shape, TMDB returns same key)
  };
  release_dates?: {
    results: {
      iso_3166_1: string;
      release_dates: { certification: string; type: number }[];
    }[];
  };
  networks?: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  next_episode_to_air?: {
    name: string;
    air_date: string;
    episode_number: number;
    season_number: number;
  } | null;
  last_episode_to_air?: {
    name: string;
    air_date: string;
    episode_number: number;
    season_number: number;
  } | null;
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  spoken_languages?: { english_name: string; iso_639_1: string }[];
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  popularity?: number;
  seasons?: {
    air_date: string | null;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    vote_average: number;
  }[];
}

export interface TMDBSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  overview: string;
  poster_path: string | null;
  episodes: TMDBEpisode[];
}

export interface TMDBEpisode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  overview: string;
  still_path: string | null;
  vote_average: number;
  runtime: number | null;
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
      fetchTMDB<TMDBDetail>(
        `/${type}/${id}?append_to_response=credits,videos,similar,content_ratings,watch/providers,keywords,release_dates`
      ),
    getTVSeason: (id: string, seasonNumber: number) =>
      fetchTMDB<TMDBSeason>(`/tv/${id}/season/${seasonNumber}`),
    getTVCredits: (id: string | number) =>
      fetchTMDB<{ cast: any[]; crew: any[] }>(`/tv/${id}/credits`),
    getMovieCredits: (id: string | number) =>
      fetchTMDB<{ cast: any[]; crew: any[] }>(`/movie/${id}/credits`),
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
