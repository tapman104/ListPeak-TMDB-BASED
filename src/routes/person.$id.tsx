import { createFileRoute } from '@tanstack/react-router';
import { PersonPage } from '../pages/PersonPage';

export const Route = createFileRoute('/person/$id')({
  component: PersonPage,
});
