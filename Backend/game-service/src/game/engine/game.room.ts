/**
 * Game Room
 * Represents a single game instance with server-side game loop
 */

import { EventEmitter } from 'events';
import { GameEngine } from './game.engine.js';
import {
  GameMode,
  PlayerPosition,
  InputAction,
  type GameConfig,
  type GameState,
  type GameStateUpdate,
  type GameOverData,
} from '../types/game.types.js';

export class GameRoom extends EventEmitter {
  public readonly roomId: string;
  public readonly mode: GameMode;
  public tournamentId?: string;
  public round?: number;
  private engine: GameEngine;
  private gameLoop: NodeJS.Timeout | null = null;
  private readonly fps: number;

  constructor(roomId: string, mode: GameMode, config?: Partial<GameConfig>, tournamentId?: string, round?: number) {
    super();
    this.roomId = roomId;
    this.mode = mode;
    if (tournamentId) this.tournamentId = tournamentId;
    if (round !== undefined) this.round = round;
    this.fps = config?.fps || 60;
    this.engine = new GameEngine(roomId, mode, config);
  }

  public getState(): GameState {
    return this.engine.getState();
  }

  public assignPlayer(position: PlayerPosition, userId: string): void {
    this.engine.setPlayerId(position, userId);
  }

  public handleInput(position: PlayerPosition, action: InputAction): void {
    this.engine.handleInput(position, action);
  }

  public start(): void {
    const state = this.engine.getState();
    if (state.status === 'playing') return;

    this.engine.start();
    this.emit('gameStarted', this.engine.getState());

    const frameTime = 1000 / this.fps;
    let lastTime = Date.now();

    this.gameLoop = setInterval(() => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      this.engine.update(deltaTime);
      const state = this.engine.getState();

      const update: GameStateUpdate = {
        roomId: this.roomId,
        status: state.status,
        players: {
          left: {
            score: state.players.left.score,
            paddle: { y: state.players.left.paddle.position.y },
          },
          right: {
            score: state.players.right.score,
            paddle: { y: state.players.right.paddle.position.y },
          },
        },
        ball: {
          x: state.ball.position.x,
          y: state.ball.position.y,
        },
        timestamp: Date.now(),
      };

      this.emit('stateUpdate', update);

      if (state.status === 'finished') {
        this.stop();

        const winner = this.engine.getWinner();
        const loser = winner === PlayerPosition.LEFT ? PlayerPosition.RIGHT : PlayerPosition.LEFT;
        const gameOverData: GameOverData = {
          roomId: this.roomId,
          winner: winner!,
          winnerId: state.players[winner!].id,
          loserId: state.players[loser].id,
          finalScore: {
            left: state.players.left.score,
            right: state.players.right.score,
          },
          timestamp: Date.now(),
        };

        this.emit('gameOver', gameOverData);
      }
    }, frameTime);
  }

  public stop(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  public handlePlayerDisconnect(userId: string): void {
    const state = this.engine.getState();
    let disconnectedPosition: PlayerPosition | null = null;

    if (state.players.left.id === userId) {
      disconnectedPosition = PlayerPosition.LEFT;
    } else if (state.players.right.id === userId) {
      disconnectedPosition = PlayerPosition.RIGHT;
    }

		if (!disconnectedPosition) return;

		this.stop();

		const winner = disconnectedPosition === PlayerPosition.LEFT ? PlayerPosition.RIGHT : PlayerPosition.LEFT;    const gameOverData: GameOverData = {
      roomId: this.roomId,
      winner: winner,
      winnerId: state.players[winner].id,
      loserId: userId,
      finalScore: {
        left: state.players.left.score,
        right: state.players.right.score,
      },
      timestamp: Date.now(),
    };

    this.emit('playerDisconnected', {
      userId,
      playerPosition: disconnectedPosition,
      timestamp: Date.now()
    });
    this.emit('gameOver', gameOverData);
  }

  public cleanup(): void {
    this.stop();
    this.removeAllListeners();
  }

  public getPlayerByPosition(position: PlayerPosition) {
    const state = this.engine.getState();
    return state.players[position];
  }
}
