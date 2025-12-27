import { FastifyInstance } from "fastify";
import { GameStateManager } from "./state-manager.js";
import { LocalGameHandler } from "./local-handler.js";
import { OnlineGameHandler } from "./online-handler.js";

// ============================================================================
// WEBSOCKET ROUTES
// ============================================================================

export async function websocketRoutes(fastify: FastifyInstance) {
  // Ensure a shared state manager across the app
  let stateManager: GameStateManager;
  if ((fastify as any).stateManager) {
    stateManager = (fastify as any).stateManager;
  } else {
    stateManager = new GameStateManager();
    // decorate for other parts of app to use
    try {
      fastify.decorate("stateManager", stateManager);
    } catch (e) {
      // ignore if already decorated
    }
  }

  // Ensure global WS clients map (userId -> Set<WebSocket>) for notifications
  if (!(fastify as any).wsClients) {
    try {
      fastify.decorate("wsClients", new Map<string, Set<any>>());
    } catch (e) {
      // ignore
    }
  }

  const wsClients: Map<string, Set<any>> = (fastify as any).wsClients;

  const localHandler = new LocalGameHandler(stateManager, wsClients);
  const onlineHandler = new OnlineGameHandler(stateManager, wsClients);

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
