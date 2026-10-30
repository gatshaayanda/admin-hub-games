import { describe, expect, it } from 'vitest';
import { BALL_RADIUS, GOAL_LINE, createFootballBall, stepFootballBall } from './physics';

describe('Sri Lanka League ball physics', () => {
  it('keeps the ball above the ground and damps its bounce', () => {
    const ball = createFootballBall(0, 1.4, 0);
    for (let frame = 0; frame < 180; frame += 1) stepFootballBall(ball, 1 / 60);
    expect(ball.y).toBeGreaterThanOrEqual(BALL_RADIUS);
    expect(Math.abs(ball.vy)).toBeLessThan(2);
  });

  it('recognises a goal only when the ball crosses between the brick posts', () => {
    const ball = createFootballBall(0, 0.45, GOAL_LINE + 0.15);
    ball.vz = -18;
    expect(stepFootballBall(ball, 0.02)).toBe(true);
  });

  it('does not award a goal for a shot outside the goal mouth', () => {
    const ball = createFootballBall(2.8, 0.45, GOAL_LINE + 0.15);
    ball.vz = -18;
    expect(stepFootballBall(ball, 0.02)).toBe(false);
  });

  it('can roll from the kick-off spot into the goal mouth', () => {
    const ball = createFootballBall(0, BALL_RADIUS, 3);
    ball.vz = -12.5;
    let scored = false;
    for (let frame = 0; frame < 240 && !scored; frame += 1) scored = stepFootballBall(ball, 1 / 60);
    expect(scored).toBe(true);
  });

  it('reflects the ball from the street-side boundary', () => {
    const ball = createFootballBall(17.6, 0.3, 0);
    ball.vx = 8;
    stepFootballBall(ball, 0.03);
    expect(ball.x).toBeLessThanOrEqual(18 - BALL_RADIUS);
    expect(ball.vx).toBeLessThan(0);
  });
});
