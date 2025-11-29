import { z } from 'zod';

// Tournament schemas
export const createTournamentSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  format: z.enum(['single_elimination', 'double_elimination', 'round_robin']).default('single_elimination'),
  max_players: z.enum(['4', '8', '16', '32']),
  registration_deadline: z.number().int().positive().optional(),
  best_of: z.enum(['1', '3', '5']).default('1'),
  prize_pool: z.string().max(200).optional(),
  rules: z.string().max(1000).optional(),
});

export const joinTournamentSchema = z.object({
  user_id: z.number().int().positive(),
  nickname: z.string().min(2).max(20),
});

export const tournamentQuerySchema = z.object({
  status: z.enum(['registration', 'in_progress', 'finished', 'cancelled']).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type JoinTournamentInput = z.infer<typeof joinTournamentSchema>;
export type TournamentQueryInput = z.infer<typeof tournamentQuerySchema>;
