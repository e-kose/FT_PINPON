import { z } from 'zod';

// Game schemas
export const createLocalGameSchema = z.object({
  player1_nickname: z.string().min(2).max(20),
  player2_nickname: z.string().min(2).max(20),
  max_score: z.number().int().min(5).max(21).optional().default(11),
});

export const createOnlineGameSchema = z.object({
  opponent_id: z.number().int().positive().optional(),
  max_score: z.number().int().min(5).max(21).optional().default(11),
});

export const updateGameScoreSchema = z.object({
  player1_score: z.number().int().min(0),
  player2_score: z.number().int().min(0),
});

export const gameQuerySchema = z.object({
  status: z.enum(['waiting', 'ready', 'playing', 'finished', 'cancelled']).optional(),
  game_mode: z.enum(['local', 'online', 'tournament']).optional(),
  user_id: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export type CreateLocalGameInput = z.infer<typeof createLocalGameSchema>;
export type CreateOnlineGameInput = z.infer<typeof createOnlineGameSchema>;
export type UpdateGameScoreInput = z.infer<typeof updateGameScoreSchema>;
export type GameQueryInput = z.infer<typeof gameQuerySchema>;
