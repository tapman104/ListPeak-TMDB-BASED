import { createFileRoute, redirect } from '@tanstack/react-router';
import { ProfilePage } from '../pages/ProfilePage';
import { useKeyStore } from '../store/keyStore';

export const Route = createFileRoute('/profile')({
  beforeLoad: () => {
    const apiKey = useKeyStore.getState().apiKey;
    if (!apiKey) {
      throw redirect({
        to: '/setup',
      });
    }
  },
  component: ProfilePage,
});
