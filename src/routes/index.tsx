import { createFileRoute, redirect } from '@tanstack/react-router';
import { HomePage } from '../pages/HomePage';
import { useKeyStore } from '../store/keyStore';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const apiKey = useKeyStore.getState().apiKey;
    if (!apiKey) {
      throw redirect({
        to: '/setup',
      });
    }
  },
  component: HomePage,
});
