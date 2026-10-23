import type { AnimalState, Season, SimulationOptions, SimulationResult, WorldEvent, WorldState } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REAL_MS_PER_GAME_DAY = DAY_MS;
const DEFAULT_MAX_ELAPSED_MS = 7 * DAY_MS;
const NEEDS_WARNING_THRESHOLD = 78;
const PLANT_RECOVERY_PER_DAY = 7;
const GRAZING_DEPLETION_PER_DAY = 3;
const WATER_USE_PER_ANIMAL_PER_DAY = 2;
const GROWTH_DAYS_PER_STAGE = 30;

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function stageForAge(ageDays: number): AnimalState['lifeStage'] {
  if (ageDays < 30) return 'kid';
  if (ageDays < 120) return 'juvenile';
  if (ageDays < 900) return 'adult';
  return 'senior';
}

function eventId(at: number, kind: WorldEvent['kind'], suffix = ''): string {
  return [Math.trunc(at), kind, suffix].filter(Boolean).join(':');
}

function nextSeason(season: Season): Season {
  return SEASONS[(SEASONS.indexOf(season) + 1) % SEASONS.length];
}

/** A deliberately small, deterministic starter world. No renderer dependency. */
export function createInitialWorld(now = Date.now()): WorldState {
  return {
    schemaVersion: 1,
    worldId: 'home-paddock',
    lastSimulatedAt: now,
    day: 1,
    season: 'spring',
    seasonDay: 1,
    animals: [
      { id: 'goat-mocha', name: 'Mocha', species: 'goat', ageDays: 18, lifeStage: 'kid', hunger: 28, thirst: 22, energy: 86, comfort: 88, trust: 38, x: 0.42, y: 0.55, herdId: 'home-herd', alive: true },
      { id: 'goat-pepper', name: 'Pepper', species: 'goat', ageDays: 210, lifeStage: 'adult', hunger: 24, thirst: 18, energy: 92, comfort: 91, trust: 55, x: 0.52, y: 0.48, herdId: 'home-herd', alive: true },
      { id: 'goat-sunrise', name: 'Sunrise', species: 'goat', ageDays: 86, lifeStage: 'juvenile', hunger: 35, thirst: 27, energy: 78, comfort: 83, trust: 44, x: 0.58, y: 0.58, herdId: 'home-herd', alive: true },
    ],
    plantPatches: [
      { id: 'north-grazing', growth: 74, grazing: 26, seasonalHealth: 92 },
      { id: 'east-grazing', growth: 58, grazing: 42, seasonalHealth: 86 },
      { id: 'shelter-grass', growth: 86, grazing: 14, seasonalHealth: 96 },
    ],
    waterSources: [{ id: 'main-trough', level: 82, capacity: 100 }],
    events: [],
  };
}

/**
 * Advances offline world state from timestamps. This is state simulation, not
 * background rendering. Repeating a resume at the same timestamp applies no
 * additional elapsed time. Clock rollback never moves the saved clock backward.
 */
export function advanceWorld(
  current: WorldState,
  now: number,
  options: SimulationOptions = {},
): SimulationResult {
  const realMsPerGameDay = Math.max(60_000, options.realMsPerGameDay ?? DEFAULT_REAL_MS_PER_GAME_DAY);
  const maxElapsedMs = Math.max(0, options.maxElapsedMs ?? DEFAULT_MAX_ELAPSED_MS);
  const safeNow = Number.isFinite(now) ? now : current.lastSimulatedAt;
  const rawElapsed = safeNow - current.lastSimulatedAt;
  const elapsedMs = Math.min(maxElapsedMs, Math.max(0, rawElapsed));
  const elapsedGameDays = elapsedMs / realMsPerGameDay;
  const wholeDays = Math.floor(elapsedGameDays);
  const events: WorldEvent[] = [];

  const animals = current.animals.map((animal) => {
    if (!animal.alive) return { ...animal };
    const hunger = clamp(animal.hunger + elapsedGameDays * 8);
    const thirst = clamp(animal.thirst + elapsedGameDays * 11);
    const energy = clamp(animal.energy + elapsedGameDays * 10);
    const waterAvailable = current.waterSources.some((source) => source.level > 0);
    const grazingAvailable = current.plantPatches.some((patch) => patch.growth > 15);
    const comfort = clamp(animal.comfort + (waterAvailable && grazingAvailable ? elapsedGameDays * 1.5 : -elapsedGameDays * 5));
    const updated: AnimalState = {
      ...animal,
      ageDays: animal.ageDays + elapsedGameDays,
      lifeStage: stageForAge(animal.ageDays + elapsedGameDays),
      hunger: grazingAvailable ? clamp(hunger - elapsedGameDays * 3) : hunger,
      thirst: waterAvailable ? clamp(thirst - elapsedGameDays * 4) : thirst,
      energy,
      comfort,
    };
    if (animal.lifeStage !== updated.lifeStage) {
      events.push({
        id: eventId(current.lastSimulatedAt + elapsedMs, 'animal-grew', animal.id),
        at: current.lastSimulatedAt + elapsedMs,
        kind: 'animal-grew',
        message: `${animal.name} grew into the ${updated.lifeStage} life stage.`,
        animalId: animal.id,
      });
    }
    if (updated.hunger >= NEEDS_WARNING_THRESHOLD || updated.thirst >= NEEDS_WARNING_THRESHOLD) {
      events.push({
        id: eventId(current.lastSimulatedAt + elapsedMs, 'needs-attention', animal.id),
        at: current.lastSimulatedAt + elapsedMs,
        kind: 'needs-attention',
        message: `${animal.name} may need food or water soon.`,
        animalId: animal.id,
      });
    }
    return updated;
  });

  const plantPatches = current.plantPatches.map((patch) => {
    const growth = clamp(patch.growth + elapsedGameDays * PLANT_RECOVERY_PER_DAY);
    const grazing = clamp(patch.grazing - elapsedGameDays * GRAZING_DEPLETION_PER_DAY);
    if (wholeDays > 0 && growth > patch.growth) {
      events.push({
        id: eventId(current.lastSimulatedAt + elapsedMs, 'plant-recovered', patch.id),
        at: current.lastSimulatedAt + elapsedMs,
        kind: 'plant-recovered',
        message: `Plants in ${patch.id.replaceAll('-', ' ')} recovered.`,
      });
    }
    return { ...patch, growth, grazing };
  });

  const waterSources = current.waterSources.map((source) => {
    const animalCount = animals.filter((animal) => animal.alive).length;
    const level = clamp(source.level - elapsedGameDays * WATER_USE_PER_ANIMAL_PER_DAY * animalCount, 0, source.capacity);
    if (source.level > 20 && level <= 20) {
      events.push({
        id: eventId(current.lastSimulatedAt + elapsedMs, 'water-low', source.id),
        at: current.lastSimulatedAt + elapsedMs,
        kind: 'water-low',
        message: `${source.id.replaceAll('-', ' ')} is running low.`,
      });
    }
    return { ...source, level };
  });

  let day = current.day + wholeDays;
  let season = current.season;
  let seasonDay = current.seasonDay + wholeDays;
  while (seasonDay > GROWTH_DAYS_PER_STAGE * 3) {
    seasonDay -= GROWTH_DAYS_PER_STAGE * 3;
    season = nextSeason(season);
  }
  if (wholeDays > 0) {
    events.push({
      id: eventId(current.lastSimulatedAt + elapsedMs, 'day-passed'),
      at: current.lastSimulatedAt + elapsedMs,
      kind: 'day-passed',
      message: `${wholeDays} in-game day${wholeDays === 1 ? '' : 's'} passed while you were away.`,
    });
  }

  const uniqueEvents = new Map<string, WorldEvent>();
  for (const event of [...current.events, ...events]) uniqueEvents.set(event.id, event);
  const state: WorldState = {
    ...current,
    lastSimulatedAt: Math.max(current.lastSimulatedAt, safeNow),
    day,
    season,
    seasonDay,
    animals,
    plantPatches,
    waterSources,
    events: [...uniqueEvents.values()].slice(-100),
  };

  return { state, events, elapsedGameDays };
}

export function summarizeReturn(result: SimulationResult): string[] {
  if (result.elapsedGameDays <= 0) return ['Welcome back. Your world is just as you left it.'];
  const lines = [`Welcome back — ${result.elapsedGameDays.toFixed(result.elapsedGameDays % 1 ? 1 : 0)} in-game day(s) passed.`];
  for (const event of result.events.slice(0, 4)) lines.push(event.message);
  if (result.events.length === 0) lines.push('Your animals rested and the farm continued at its own pace.');
  return lines;
}
