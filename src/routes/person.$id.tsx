import { createFileRoute, redirect } from '@tanstack/react-router';
import { PersonPage } from '../pages/PersonPage';
import { useKeyStore } from '../store/keyStore';

export const Route = createFileRoute('/person/$id')({
  beforeLoad: () => {
    const apiKey = useKeyStore.getState().apiKey;
    if (!apiKey) {
      throw redirect({
        to: '/setup',
      });
    }
  },
  component: PersonPage,
});
