/**
 * Game Engine
 * Server-authoritative game physics and logic
 */

import {
  GameMode,
  GameStatus,
  PlayerPosition,
  InputAction,
  DEFAULT_GAME_CONFIG,
  type GameState,
  type GameConfig,
  type Ball,
  type Paddle,
  type Player,
} from '../types/game.types.js';

export class GameEngine {
  private config: GameConfig;
  private state: GameState;

  constructor(roomId: string, mode: GameMode, config?: Partial<GameConfig>) {
    this.config = { ...DEFAULT_GAME_CONFIG, ...config };
    this.state = this.createInitialState(roomId, mode);
  }

  private createInitialState(roomId: string, mode: GameMode): GameState {
    const leftPaddle: Paddle = {
      position: { x: 20, y: this.config.canvasHeight / 2 - this.config.paddleHeight / 2 },
      width: this.config.paddleWidth,
      height: this.config.paddleHeight,
      speed: this.config.paddleSpeed,
      velocity: 0,
    };

    const rightPaddle: Paddle = {
      position: {
        x: this.config.canvasWidth - 30,
        y: this.config.canvasHeight / 2 - this.config.paddleHeight / 2,
      },
      width: this.config.paddleWidth,
      height: this.config.paddleHeight,
      speed: this.config.paddleSpeed,
      velocity: 0,
    };

    const ball: Ball = {
      position: { x: this.config.canvasWidth / 2, y: this.config.canvasHeight / 2 },
      radius: this.config.ballRadius,
      velocity: { x: this.config.ballSpeed, y: 0 },
      speed: this.config.ballSpeed,
    };

    return {
      roomId,
      mode,
      status: GameStatus.WAITING,
      players: {
        left: {
          id: 'player-left',
          position: PlayerPosition.LEFT,
          score: 0,
          paddle: leftPaddle,
        },
        right: {
          id: 'player-right',
          position: PlayerPosition.RIGHT,
          score: 0,
          paddle: rightPaddle,
        },
      },
      ball,
      config: this.config,
      lastUpdate: Date.now(),
    };
  }

  public getState(): GameState {
    return this.state;
  }

  public setPlayerId(position: PlayerPosition, playerId: string): void {
    if (position === PlayerPosition.LEFT) {
      this.state.players.left.id = playerId;
    } else {
      this.state.players.right.id = playerId;
    }
  }

  public handleInput(position: PlayerPosition, action: InputAction): void {
    const player = position === PlayerPosition.LEFT ? this.state.players.left : this.state.players.right;

    switch (action) {
      case InputAction.MOVE_UP:
        player.paddle.velocity = -1;
        break;
      case InputAction.MOVE_DOWN:
        player.paddle.velocity = 1;
        break;
      case InputAction.STOP:
        player.paddle.velocity = 0;
        break;
    }
  }

  public start(): void {
    this.state.status = GameStatus.PLAYING;
    this.resetBall();
  }

  public update(_deltaTime: number): void {
    if (this.state.status !== GameStatus.PLAYING) return;

    this.updatePaddle(this.state.players.left.paddle);
    this.updatePaddle(this.state.players.right.paddle);
    this.updateBall();
    this.checkScoring();

    this.state.lastUpdate = Date.now();
  }

  private updatePaddle(paddle: Paddle): void {
    paddle.position.y += paddle.velocity * paddle.speed;

    if (paddle.position.y < 0) {
      paddle.position.y = 0;
    } else if (paddle.position.y + paddle.height > this.config.canvasHeight) {
      paddle.position.y = this.config.canvasHeight - paddle.height;
    }
  }

  private updateBall(): void {
    this.state.ball.position.x += this.state.ball.velocity.x;
    this.state.ball.position.y += this.state.ball.velocity.y;

    if (
      this.state.ball.position.y - this.state.ball.radius <= 0 ||
      this.state.ball.position.y + this.state.ball.radius >= this.config.canvasHeight
    ) {
      this.state.ball.velocity.y *= -1;
    }

    this.checkPaddleCollision(this.state.players.left.paddle);
    this.checkPaddleCollision(this.state.players.right.paddle);
  }

  private checkPaddleCollision(paddle: Paddle): void {
    const ball = this.state.ball;

    if (
      ball.position.x - ball.radius <= paddle.position.x + paddle.width &&
      ball.position.x + ball.radius >= paddle.position.x &&
      ball.position.y + ball.radius >= paddle.position.y &&
      ball.position.y - ball.radius <= paddle.position.y + paddle.height
    ) {
      ball.velocity.x *= -1;

      const hitPosition = (ball.position.y - paddle.position.y) / paddle.height;
      ball.velocity.y = (hitPosition - 0.5) * ball.speed;

      const speedIncrease = 1.05;
      ball.velocity.x *= speedIncrease;
      ball.velocity.y *= speedIncrease;
    }
  }

  private checkScoring(): void {
    if (this.state.ball.position.x - this.state.ball.radius <= 0) {
      this.state.players.right.score++;
      this.resetBall();
    } else if (this.state.ball.position.x + this.state.ball.radius >= this.config.canvasWidth) {
      this.state.players.left.score++;
      this.resetBall();
    }

    if (
      this.state.players.left.score >= this.config.maxScore ||
      this.state.players.right.score >= this.config.maxScore
    ) {
      this.state.status = GameStatus.FINISHED;
    }
  }

  private resetBall(): void {
    this.state.ball.position = {
      x: this.config.canvasWidth / 2,
      y: this.config.canvasHeight / 2,
    };

    const angle = (Math.random() - 0.5) * (Math.PI / 3);
    const direction = Math.random() < 0.5 ? 1 : -1;

    this.state.ball.velocity = {
      x: direction * this.config.ballSpeed * Math.cos(angle),
      y: this.config.ballSpeed * Math.sin(angle),
    };
  }

  public getWinner(): PlayerPosition | null {
    if (this.state.status !== GameStatus.FINISHED) return null;

    return this.state.players.left.score > this.state.players.right.score
      ? PlayerPosition.LEFT
      : PlayerPosition.RIGHT;
  }
}
