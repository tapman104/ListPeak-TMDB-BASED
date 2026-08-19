import { createFileRoute } from '@tanstack/react-router';
import { DetailPage } from '../pages/DetailPage';

type DetailSearch = {
  type: 'movie' | 'tv';
};

export const Route = createFileRoute('/detail/$id')({
  validateSearch: (search: Record<string, unknown>): DetailSearch => {
    return {
      type: (search.type as 'movie' | 'tv') || 'movie',
    };
  },
  component: DetailPage,
});
