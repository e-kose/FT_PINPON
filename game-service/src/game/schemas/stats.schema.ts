import { z } from 'zod';

// Stats schemas
export const statsQuerySchema = z.object({
  user_id: z.number().int().positive(),
});

export const leaderboardQuerySchema = z.object({
  sort_by: z.enum(['rank_points', 'wins', 'win_streak']).optional().default('rank_points'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export type StatsQueryInput = z.infer<typeof statsQuerySchema>;
export type LeaderboardQueryInput = z.infer<typeof leaderboardQuerySchema>;
