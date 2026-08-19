import { createFileRoute, redirect } from '@tanstack/react-router';
import { DetailPage } from '../pages/DetailPage';
import { useKeyStore } from '../store/keyStore';

type DetailSearch = {
  type: 'movie' | 'tv';
};

export const Route = createFileRoute('/detail/$id')({
  beforeLoad: () => {
    const apiKey = useKeyStore.getState().apiKey;
    if (!apiKey) {
      throw redirect({
        to: '/setup',
      });
    }
  },
  validateSearch: (search: Record<string, unknown>): DetailSearch => {
    return {
      type: (search.type as 'movie' | 'tv') || 'movie',
    };
  },
  component: DetailPage,
});
