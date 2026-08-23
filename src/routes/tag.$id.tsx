import { createFileRoute, redirect } from '@tanstack/react-router';
import { useKeyStore } from '../store/keyStore';
import { TagResultsPage } from '../pages/TagResultsPage';

export const Route = createFileRoute('/tag/$id')({
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
