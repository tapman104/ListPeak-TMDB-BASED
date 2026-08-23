import { createFileRoute, redirect } from '@tanstack/react-router';
import { useKeyStore } from '../store/keyStore';
import { TagResultsPage } from '../pages/TagResultsPage';

export const Route = createFileRoute('/tag/$id')({
  validateSearch: (search: Record<string, unknown>) => ({
    name: typeof search.name === 'string' ? search.name : '',
    type: (['all', 'tv', 'movie'].includes(search.type as string)
      ? search.type : 'all') as 'all' | 'tv' | 'movie',
    lang: typeof search.lang === 'string' ? search.lang : 'all',
    sort: (['popularity', 'rating', 'newest'].includes(search.sort as string)
      ? search.sort
      : 'popularity') as 'popularity' | 'rating' | 'newest',
    minRating: typeof search.minRating === 'number' ? search.minRating : 0,
  }),
  beforeLoad: () => {
    const apiKey = useKeyStore.getState().apiKey;
    if (!apiKey) {
      throw redirect({
        to: '/setup',
      });
    }
  },
  component: TagResultsPage,
});
