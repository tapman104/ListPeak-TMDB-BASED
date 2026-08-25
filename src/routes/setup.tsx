import { createFileRoute } from '@tanstack/react-router';
import { SetupPage } from '../pages/SetupPage';
import { z } from 'zod';

const searchSchema = z.object({
  returning: z.boolean().optional().default(false)
});

export const Route = createFileRoute('/setup')({
  validateSearch: searchSchema,
  component: SetupPage,
});
