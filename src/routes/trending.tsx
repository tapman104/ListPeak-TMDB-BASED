import { createFileRoute, redirect } from '@tanstack/react-router';
import { useKeyStore } from '../store/keyStore';
import { TrendingPage } from '../pages/TrendingPage';

export const Route = createFileRoute('/trending')({
  beforeLoad: () => {
    const apiKey = useKeyStore.getState().apiKey;
    if (!apiKey) {
      throw redirect({
        to: '/setup',
      });
    }
  },
  component: TrendingPage,
});
