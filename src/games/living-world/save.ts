import type { WorldState } from './types';

export const WORLD_SAVE_KEY = 'admin-hub-games:living-world-save-v1';
const MAX_SAVE_CHARS = 250_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateWorldState(value: unknown): value is WorldState {
  if (!isRecord(value) || value.schemaVersion !== 1) return false;
  if (typeof value.worldId !== 'string' || typeof value.lastSimulatedAt !== 'number' || !Number.isFinite(value.lastSimulatedAt)) return false;
  if (typeof value.day !== 'number' || !Number.isFinite(value.day) || value.day < 1) return false;
  if (!['spring', 'summer', 'autumn', 'winter'].includes(String(value.season))) return false;
  if (typeof value.seasonDay !== 'number' || !Number.isFinite(value.seasonDay)) return false;
  if (!Array.isArray(value.animals) || !Array.isArray(value.plantPatches) || !Array.isArray(value.waterSources) || !Array.isArray(value.events)) return false;
  return value.animals.every((animal) => isRecord(animal)
    && typeof animal.id === 'string'
    && typeof animal.name === 'string'
    && animal.species === 'goat'
    && typeof animal.ageDays === 'number' && Number.isFinite(animal.ageDays) && animal.ageDays >= 0
    && ['kid', 'juvenile', 'adult', 'senior'].includes(String(animal.lifeStage))
    && ['hunger', 'thirst', 'energy', 'comfort', 'trust', 'x', 'y'].every((key) => typeof animal[key] === 'number' && Number.isFinite(animal[key]))
    && typeof animal.herdId === 'string'
    && typeof animal.alive === 'boolean')
    && value.plantPatches.every((patch) => isRecord(patch)
      && typeof patch.id === 'string'
      && ['growth', 'grazing', 'seasonalHealth'].every((key) => typeof patch[key] === 'number' && Number.isFinite(patch[key])))
    && value.waterSources.every((source) => isRecord(source)
      && typeof source.id === 'string'
      && typeof source.level === 'number' && Number.isFinite(source.level)
      && typeof source.capacity === 'number' && Number.isFinite(source.capacity) && source.capacity >= 0);
}

export function serializeWorldState(state: WorldState): string {
  if (!validateWorldState(state)) throw new Error('Refusing to save an invalid living-world state.');
  return JSON.stringify(state);
}

export function parseWorldState(raw: string | null): WorldState | null {
  if (!raw || raw.length > MAX_SAVE_CHARS) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validateWorldState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveWorldState(state: WorldState, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(WORLD_SAVE_KEY, serializeWorldState(state));
}

export function loadWorldState(storage: Pick<Storage, 'getItem'> = localStorage): WorldState | null {
  return parseWorldState(storage.getItem(WORLD_SAVE_KEY));
}
