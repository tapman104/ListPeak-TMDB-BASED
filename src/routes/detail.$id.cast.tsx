import { createFileRoute, redirect } from '@tanstack/react-router';
import CastPage from '../pages/CastPage';
import { useKeyStore } from '../store/keyStore';

export const Route = createFileRoute('/detail/$id/cast')({
  beforeLoad: () => {
    const apiKey = useKeyStore.getState().apiKey;
    if (!apiKey) {
      throw redirect({
        to: '/setup',
      });
    }
  },
  validateSearch: (search: Record<string, unknown>) => {
    return {
      type: (search.type as 'movie' | 'tv') || 'movie',
    };
  },
  component: CastPage,
});
