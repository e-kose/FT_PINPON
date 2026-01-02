import type { GameService } from '../service/game.service.js';
import type { SocketRegistry } from '../socket/socket.registry.js';
import type { WSMessage } from '../types/game.types.js';
import { DatabaseService } from '../../plugins/db.service.js';

export abstract class BaseGameHandler {
	protected gameService: GameService;
	protected socketRegistry: SocketRegistry;
	protected dbService: DatabaseService | undefined;

	constructor(gameService: GameService, socketRegistry: SocketRegistry, dbService?: DatabaseService) {
		this.gameService = gameService;
		this.socketRegistry = socketRegistry;
		this.dbService = dbService || undefined;
	}
}
