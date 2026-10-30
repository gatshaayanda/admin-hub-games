export type FootballBall = { x: number; y: number; z: number; vx: number; vy: number; vz: number };

export const BALL_RADIUS = 0.28;
export const GOAL_LINE = -15.4;
const FIELD_X = 18;
const FIELD_Z_MIN = -21;
const FIELD_Z_MAX = 22;
const POST_X = [-3.2, 3.2] as const;

export function cameraRelativeMove(inputX: number, inputForward: number, cameraForwardX: number, cameraForwardZ: number) {
  const length = Math.hypot(cameraForwardX, cameraForwardZ) || 1;
  const forwardX = cameraForwardX / length;
  const forwardZ = cameraForwardZ / length;
  const rightX = -forwardZ;
  const rightZ = forwardX;
  return {
    x: rightX * inputX + forwardX * inputForward,
    z: rightZ * inputX + forwardZ * inputForward,
  };
}

export function createFootballBall(x = 0, y = BALL_RADIUS, z = 3): FootballBall {
  return { x, y, z, vx: 0, vy: 0, vz: 0 };
}

/** Deterministic, frame-rate-independent arcade football physics. Returns true only on a valid goal crossing. */
export function stepFootballBall(ball: FootballBall, deltaSeconds: number): boolean {
  const dt = Math.max(0, Math.min(deltaSeconds, 0.04));
  if (dt === 0) return false;
  const previousZ = ball.z;

  ball.vy -= 9.81 * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.z += ball.vz * dt;

  if (ball.y < BALL_RADIUS) {
    ball.y = BALL_RADIUS;
    if (ball.vy < -0.65) ball.vy = -ball.vy * 0.43;
    else ball.vy = 0;
    if (Math.abs(ball.vy) < 0.8) ball.vy = 0;
    const rollingDrag = Math.exp(-0.52 * dt);
    ball.vx *= rollingDrag;
    ball.vz *= rollingDrag;
  } else {
    const airDrag = Math.exp(-0.035 * dt);
    ball.vx *= airDrag;
    ball.vz *= airDrag;
  }

  if (ball.x < -FIELD_X + BALL_RADIUS) {
    ball.x = -FIELD_X + BALL_RADIUS;
    ball.vx = Math.abs(ball.vx) * 0.62;
  } else if (ball.x > FIELD_X - BALL_RADIUS) {
    ball.x = FIELD_X - BALL_RADIUS;
    ball.vx = -Math.abs(ball.vx) * 0.62;
  }
  if (ball.z < FIELD_Z_MIN + BALL_RADIUS) {
    ball.z = FIELD_Z_MIN + BALL_RADIUS;
    ball.vz = Math.abs(ball.vz) * 0.58;
  } else if (ball.z > FIELD_Z_MAX - BALL_RADIUS) {
    ball.z = FIELD_Z_MAX - BALL_RADIUS;
    ball.vz = -Math.abs(ball.vz) * 0.58;
  }

  // One brick on the ground marks each side of the goal mouth.
  for (const postX of POST_X) {
    const dx = ball.x - postX;
    const dz = ball.z - GOAL_LINE;
    if (Math.abs(dx) < 0.59 && Math.abs(dz) < 0.52 && ball.y < 0.44 + BALL_RADIUS) {
      const pushX = 0.59 - Math.abs(dx);
      const pushZ = 0.52 - Math.abs(dz);
      if (pushX < pushZ) {
        const side = Math.sign(dx || 1);
        ball.x = postX + side * 0.59;
        ball.vx = side * Math.max(1.2, Math.abs(ball.vx) * 0.62);
      } else if (ball.vz < 0) {
        ball.z = GOAL_LINE + 0.52;
        ball.vz = Math.max(1.2, Math.abs(ball.vz) * 0.62);
      } else {
        ball.z = GOAL_LINE - 0.52;
        ball.vz = -Math.max(1.2, Math.abs(ball.vz) * 0.62);
      }
    }
  }

  return previousZ > GOAL_LINE && ball.z <= GOAL_LINE && Math.abs(ball.x) < 2.61 && ball.y < 1.82;
}


/** Soft foot contact that carries player momentum into a nearby, grounded ball. */
export function applyDribbleContact(
  ball: FootballBall,
  playerX: number,
  playerZ: number,
  playerVx: number,
  playerVz: number,
  playerYaw: number,
  deltaSeconds: number,
): boolean {
  const dx = ball.x - playerX;
  const dz = ball.z - playerZ;
  const separation = Math.hypot(dx, dz);
  if (separation >= 1.18 || ball.y >= 1.1) return false;

  const nx = separation > 0.001 ? dx / separation : Math.sin(playerYaw);
  const nz = separation > 0.001 ? dz / separation : -Math.cos(playerYaw);
  ball.x = playerX + nx * 0.9;
  ball.z = playerZ + nz * 0.9;

  const targetVx = playerVx * 0.86 + nx * 0.85;
  const targetVz = playerVz * 0.86 + nz * 0.85;
  const touch = 1 - Math.exp(-8 * Math.max(0, Math.min(deltaSeconds, 0.04)));
  ball.vx += (targetVx - ball.vx) * touch;
  ball.vz += (targetVz - ball.vz) * touch;
  return true;
}
