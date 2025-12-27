// ============================================================================
// PONG GAME PHYSICS ENGINE
// ============================================================================

export interface Ball {
  x: number; // Position X (canvas center)
  y: number; // Position Y (canvas center)
  vx: number; // Velocity X
  vy: number; // Velocity Y
  radius: number;
  speed: number; // Base speed multiplier
}

export interface Paddle {
  x: number; // Fixed X position (left or right side)
  y: number; // Position Y (center of paddle)
  width: number;
  height: number;
  speed: number; // Movement speed
  direction: "up" | "down" | "stop";
}

export interface GameCanvas {
  width: number;
  height: number;
}

export interface GamePhysicsState {
  ball: Ball;
  paddle1: Paddle; // Left paddle
  paddle2: Paddle; // Right paddle
  canvas: GameCanvas;
  score: {
    player1: number;
    player2: number;
  };
  maxScore: number; // Win condition
  paused: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 100;
export const PADDLE_SPEED = 8;
export const BALL_RADIUS = 8;
export const BALL_INITIAL_SPEED = 5;
export const BALL_SPEED_INCREMENT = 0.2; // Speed up after each hit
export const MAX_BALL_SPEED = 15;
export const FPS = 60;
export const FRAME_TIME = 1000 / FPS; // ~16.67ms
export const MAX_SCORE = 11; // First to 11 wins

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Create initial game physics state
 */
export function createGameState(maxScore: number = MAX_SCORE): GamePhysicsState {
  return {
    ball: createBall(),
    paddle1: createPaddle("left"),
    paddle2: createPaddle("right"),
    canvas: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    },
    score: {
      player1: 0,
      player2: 0,
    },
    maxScore,
    paused: false,
  };
}

/**
 * Create ball at center with random direction
 */
function createBall(): Ball {
  const angle = (Math.random() * Math.PI) / 2 - Math.PI / 4; // -45° to 45°
  const direction = Math.random() < 0.5 ? 1 : -1; // Left or right

  return {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: Math.cos(angle) * BALL_INITIAL_SPEED * direction,
    vy: Math.sin(angle) * BALL_INITIAL_SPEED,
    radius: BALL_RADIUS,
    speed: BALL_INITIAL_SPEED,
  };
}

/**
 * Create paddle on left or right side
 */
function createPaddle(side: "left" | "right"): Paddle {
  return {
    x: side === "left" ? PADDLE_WIDTH : CANVAS_WIDTH - PADDLE_WIDTH * 2,
    y: CANVAS_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: PADDLE_SPEED,
    direction: "stop",
  };
}

/**
 * Reset ball to center after score
 */
export function resetBall(state: GamePhysicsState, direction: "left" | "right"): void {
  const angle = (Math.random() * Math.PI) / 2 - Math.PI / 4;
  const dir = direction === "left" ? -1 : 1;

  state.ball.x = CANVAS_WIDTH / 2;
  state.ball.y = CANVAS_HEIGHT / 2;
  state.ball.vx = Math.cos(angle) * BALL_INITIAL_SPEED * dir;
  state.ball.vy = Math.sin(angle) * BALL_INITIAL_SPEED;
  state.ball.speed = BALL_INITIAL_SPEED;
}

// ============================================================================
// PHYSICS UPDATE (60 FPS)
// ============================================================================

/**
 * Main physics update loop - call every frame
 */
export function updatePhysics(state: GamePhysicsState): { scored: boolean; scorer?: "player1" | "player2" } {
  if (state.paused) {
    return { scored: false };
  }

  // Update paddles
  updatePaddle(state.paddle1, state.canvas);
  updatePaddle(state.paddle2, state.canvas);

  // Update ball
  state.ball.x += state.ball.vx;
  state.ball.y += state.ball.vy;

  // Check wall collisions (top/bottom)
  if (state.ball.y - state.ball.radius <= 0 || state.ball.y + state.ball.radius >= state.canvas.height) {
    state.ball.vy *= -1;
    state.ball.y = Math.max(state.ball.radius, Math.min(state.canvas.height - state.ball.radius, state.ball.y));
  }

  // Check paddle collisions
  checkPaddleCollision(state.ball, state.paddle1);
  checkPaddleCollision(state.ball, state.paddle2);

  // Check scoring (left/right walls)
  if (state.ball.x - state.ball.radius <= 0) {
    // Player 2 scored
    state.score.player2++;
    resetBall(state, "right");
    return { scored: true, scorer: "player2" };
  }

  if (state.ball.x + state.ball.radius >= state.canvas.width) {
    // Player 1 scored
    state.score.player1++;
    resetBall(state, "left");
    return { scored: true, scorer: "player1" };
  }

  return { scored: false };
}

/**
 * Update paddle position based on direction
 */
function updatePaddle(paddle: Paddle, canvas: GameCanvas): void {
  if (paddle.direction === "up") {
    paddle.y -= paddle.speed;
  } else if (paddle.direction === "down") {
    paddle.y += paddle.speed;
  }

  // Keep paddle within canvas bounds
  const halfHeight = paddle.height / 2;
  paddle.y = Math.max(halfHeight, Math.min(canvas.height - halfHeight, paddle.y));
}

/**
 * Check and handle ball-paddle collision
 */
function checkPaddleCollision(ball: Ball, paddle: Paddle): void {
  const paddleLeft = paddle.x;
  const paddleRight = paddle.x + paddle.width;
  const paddleTop = paddle.y - paddle.height / 2;
  const paddleBottom = paddle.y + paddle.height / 2;

  // Check if ball is within paddle X range
  const ballRight = ball.x + ball.radius;
  const ballLeft = ball.x - ball.radius;

  if (ballRight >= paddleLeft && ballLeft <= paddleRight) {
    // Check if ball is within paddle Y range
    if (ball.y >= paddleTop && ball.y <= paddleBottom) {
      // Collision detected!
      ball.vx *= -1;

      // Add spin based on where ball hit paddle
      const hitPos = (ball.y - paddle.y) / (paddle.height / 2); // -1 to 1
      ball.vy += hitPos * 2;

      // Increase speed slightly
      ball.speed = Math.min(MAX_BALL_SPEED, ball.speed + BALL_SPEED_INCREMENT);
      const speedMultiplier = ball.speed / Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      ball.vx *= speedMultiplier;
      ball.vy *= speedMultiplier;

      // Move ball out of paddle to prevent double collision
      if (ball.vx > 0) {
        ball.x = paddleRight + ball.radius;
      } else {
        ball.x = paddleLeft - ball.radius;
      }
    }
  }
}

// ============================================================================
// PADDLE CONTROLS
// ============================================================================

/**
 * Set paddle movement direction
 */
export function setPaddleDirection(paddle: Paddle, direction: "up" | "down" | "stop"): void {
  paddle.direction = direction;
}

/**
 * Update paddle position from client input with speed enforcement
 * This function clamps paddle movement to PADDLE_SPEED to prevent cheating
 *
 * @param paddle The paddle to update
 * @param targetY The target Y position from client (or direction)
 * @param deltaTime Optional delta time for smooth movement
 * @returns The actual position after clamping
 */
export function updatePaddleFromInput(
  paddle: Paddle,
  input: { direction?: "up" | "down" | "stop"; targetY?: number },
  canvas: GameCanvas
): number {
  const previousY = paddle.y;
  const halfHeight = paddle.height / 2;

  if (input.direction !== undefined) {
    // Direction-based input (keyboard)
    setPaddleDirection(paddle, input.direction);

    if (input.direction === "up") {
      paddle.y -= PADDLE_SPEED;
    } else if (input.direction === "down") {
      paddle.y += PADDLE_SPEED;
    }
  } else if (input.targetY !== undefined) {
    // Direct position input (mouse/touch) - CLAMP to max speed
    const requestedMove = input.targetY - paddle.y;
    const clampedMove = Math.max(-PADDLE_SPEED, Math.min(PADDLE_SPEED, requestedMove));
    paddle.y += clampedMove;
  }

  // Enforce canvas bounds
  paddle.y = Math.max(halfHeight, Math.min(canvas.height - halfHeight, paddle.y));

  // Return actual movement (for anti-cheat logging)
  return paddle.y - previousY;
}

/**
 * Validate paddle movement for anti-cheat
 * Returns true if movement is within allowed speed
 */
export function validatePaddleMovement(
  previousY: number,
  newY: number,
  framesElapsed: number = 1
): { valid: boolean; actualSpeed: number; maxAllowed: number } {
  const actualSpeed = Math.abs(newY - previousY);
  const maxAllowed = PADDLE_SPEED * framesElapsed;

  return {
    valid: actualSpeed <= maxAllowed + 0.01, // Small tolerance for floating point
    actualSpeed,
    maxAllowed,
  };
}

/**
 * Check if game is over
 */
export function isGameOver(state: GamePhysicsState): boolean {
  return state.score.player1 >= state.maxScore || state.score.player2 >= state.maxScore;
}

/**
 * Get winner
 */
export function getWinner(state: GamePhysicsState): "player1" | "player2" | null {
  if (state.score.player1 >= state.maxScore) return "player1";
  if (state.score.player2 >= state.maxScore) return "player2";
  return null;
}

/**
 * Pause/resume game
 */
export function setPaused(state: GamePhysicsState, paused: boolean): void {
  state.paused = paused;
}

// ============================================================================
// SERIALIZATION (for WebSocket broadcast)
// ============================================================================

/**
 * Serialize game state for network transmission
 */
export function serializeGameState(state: GamePhysicsState) {
  return {
    ball: {
      x: Math.round(state.ball.x * 100) / 100,
      y: Math.round(state.ball.y * 100) / 100,
      vx: Math.round(state.ball.vx * 100) / 100,
      vy: Math.round(state.ball.vy * 100) / 100,
      radius: state.ball.radius,
    },
    paddle1: {
      y: Math.round(state.paddle1.y * 100) / 100,
      height: state.paddle1.height,
      width: state.paddle1.width,
    },
    paddle2: {
      y: Math.round(state.paddle2.y * 100) / 100,
      height: state.paddle2.height,
      width: state.paddle2.width,
    },
    score: {
      player1: state.score.player1,
      player2: state.score.player2,
    },
  };
}
