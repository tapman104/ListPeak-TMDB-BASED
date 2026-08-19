import { createFileRoute, redirect } from '@tanstack/react-router';
import { SearchPage } from '../pages/SearchPage';
import { useKeyStore } from '../store/keyStore';

type SearchQuery = {
  q?: string;
};

export const Route = createFileRoute('/search')({
  beforeLoad: () => {
    const apiKey = useKeyStore.getState().apiKey;
    if (!apiKey) {
      throw redirect({
        to: '/setup',
      });
    }
  },
  validateSearch: (search: Record<string, unknown>): SearchQuery => {
    return {
      q: (search.q as string) || '',
    };
  },
  component: SearchPage,
});
