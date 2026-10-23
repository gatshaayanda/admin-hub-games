import { describe, expect, it } from 'vitest';
import { advanceWorld, createInitialWorld, summarizeReturn } from './simulation';
import { loadWorldState, parseWorldState, serializeWorldState, WORLD_SAVE_KEY } from './save';

const DAY = 24 * 60 * 60 * 1000;

describe('living-world elapsed-time simulation', () => {
  it('creates a small seeded world without rendering dependencies', () => {
    const world = createInitialWorld(1_000);
    expect(world.animals).toHaveLength(3);
    expect(world.plantPatches.length).toBeGreaterThan(0);
    expect(world.lastSimulatedAt).toBe(1_000);
  });

  it('advances needs, plant recovery, water and the world clock after one day', () => {
    const world = createInitialWorld(1_000);
    const result = advanceWorld(world, 1_000 + DAY, { realMsPerGameDay: DAY });
    expect(result.elapsedGameDays).toBe(1);
    expect(result.state.day).toBe(2);
    expect(result.state.animals[0].hunger).toBeGreaterThan(world.animals[0].hunger);
    expect(result.state.plantPatches[0].growth).toBeGreaterThan(world.plantPatches[0].growth);
    expect(result.state.waterSources[0].level).toBeLessThan(world.waterSources[0].level);
    expect(summarizeReturn(result)[0]).toContain('1 in-game day');
  });

  it('advances seasons during a multi-week absence', () => {
    const world = createInitialWorld(0);
    const result = advanceWorld(world, 23 * DAY);
    expect(result.state.day).toBeGreaterThan(world.day + 90);
    expect(result.state.season).toBe('summer');
    expect(result.state.lastSimulatedAt).toBe(23 * DAY);
  });

  it('does not apply the same elapsed time twice when resumed at the saved timestamp', () => {
    const first = advanceWorld(createInitialWorld(0), DAY, { realMsPerGameDay: DAY });
    const second = advanceWorld(first.state, DAY);
    expect(second.elapsedGameDays).toBe(0);
    expect(second.state.animals).toEqual(first.state.animals);
    expect(second.state.plantPatches).toEqual(first.state.plantPatches);
  });

  it('does not rewind the saved clock if the device clock moves backwards', () => {
    const world = createInitialWorld(DAY);
    const result = advanceWorld(world, DAY / 2);
    expect(result.elapsedGameDays).toBe(0);
    expect(result.state.lastSimulatedAt).toBe(DAY);
  });

  it('caps a single offline resume to the configured maximum', () => {
    const result = advanceWorld(createInitialWorld(0), 10 * DAY, { maxElapsedMs: 2 * DAY, realMsPerGameDay: DAY });
    expect(result.elapsedGameDays).toBe(2);
    expect(result.state.lastSimulatedAt).toBe(10 * DAY);
  });

  it('rejects malformed or unsupported save payloads', () => {
    expect(parseWorldState('{broken')).toBeNull();
    expect(parseWorldState(JSON.stringify({ schemaVersion: 99 }))).toBeNull();
    expect(parseWorldState('x'.repeat(250_001))).toBeNull();
  });

  it('round-trips valid saves and tolerates unavailable storage keys', () => {
    const world = createInitialWorld(123);
    const raw = serializeWorldState(world);
    expect(parseWorldState(raw)).toEqual(world);
    const values = new Map<string, string>([[WORLD_SAVE_KEY, raw]]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    expect(loadWorldState(storage)).toEqual(world);
  });
});
