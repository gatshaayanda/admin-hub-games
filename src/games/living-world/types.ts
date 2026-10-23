export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type AnimalNeed = 'hungry' | 'thirsty' | 'tired' | 'comfortable';

export interface AnimalState {
  id: string;
  name: string;
  species: 'goat';
  ageDays: number;
  lifeStage: 'kid' | 'juvenile' | 'adult' | 'senior';
  hunger: number;
  thirst: number;
  energy: number;
  comfort: number;
  trust: number;
  x: number;
  y: number;
  herdId: string;
  alive: boolean;
}

export interface PlantPatchState {
  id: string;
  growth: number;
  grazing: number;
  seasonalHealth: number;
}

export interface WaterSourceState {
  id: string;
  level: number;
  capacity: number;
}

export interface WorldEvent {
  id: string;
  at: number;
  kind: 'day-passed' | 'animal-grew' | 'plant-recovered' | 'water-low' | 'needs-attention';
  message: string;
  animalId?: string;
}

export interface WorldState {
  schemaVersion: 1;
  worldId: string;
  lastSimulatedAt: number;
  day: number;
  season: Season;
  seasonDay: number;
  animals: AnimalState[];
  plantPatches: PlantPatchState[];
  waterSources: WaterSourceState[];
  events: WorldEvent[];
}

export interface SimulationOptions {
  /** Maximum real elapsed time accepted from a single resume, in milliseconds. */
  maxElapsedMs?: number;
  /** Real milliseconds per simulated in-game day. */
  realMsPerGameDay?: number;
}

export interface SimulationResult {
  state: WorldState;
  events: WorldEvent[];
  elapsedGameDays: number;
}
