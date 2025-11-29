import { FastifyInstance } from "fastify";
import { GameStateManager } from "./state-manager.js";
import { LocalGameHandler } from "./local-handler.js";
import { OnlineGameHandler } from "./online-handler.js";

// ============================================================================
// WEBSOCKET ROUTES
// ============================================================================

export async function websocketRoutes(fastify: FastifyInstance) {
  // Create state manager (singleton)
  const stateManager = new GameStateManager();
  const localHandler = new LocalGameHandler(stateManager);
  const onlineHandler = new OnlineGameHandler(stateManager);

  // Cleanup old games every 10 minutes
  setInterval(() => {
    stateManager.cleanupOldGames();
  }, 600000);

  // ============================================================================
  // LOCAL GAME WEBSOCKET
  // ============================================================================

  fastify.get(
    "/local/ws",
    { websocket: true },
    (socket /* WebSocket */, req /* FastifyRequest */) => {
      localHandler.handleConnection(socket);
    }
  );

  // ============================================================================
  // ONLINE GAME WEBSOCKET
  // ============================================================================

  fastify.get(
    "/online/ws",
    { websocket: true },
    (socket /* WebSocket */, req /* FastifyRequest */) => {
      // Extract token from query params or headers
      const token = (req.query as any).token || req.headers.authorization?.replace("Bearer ", "");
      onlineHandler.handleConnection(socket, token);
    }
  );

  // ============================================================================
  // GAME STATE STATS (HTTP)
  // ============================================================================

  fastify.get("/ws/stats", async (request, reply) => {
    return {
      activeGames: stateManager.getActiveGames().length,
      totalGames: stateManager.getGameCount(),
      onlinePlayers: onlineHandler.getPlayerCount(),
    };
  });
}
