export const SHOOTERS_TRIGGER_FIELD_PROFILE_VERSION = 2;

export type FieldEdge = 'PLAYER' | 'BOT' | 'TIE';

export type ShootersTriggerFieldProfile = {
  version: number;
  source: 'TRAINING_CAMP';
  completedAt: number;
  evasion: {
    player: number;
    bot: number;
    edge: FieldEdge;
  };
  shooting: {
    player: number;
    bot: number;
    edge: FieldEdge;
  };
  overall: {
    player: number;
    bot: number;
    edge: FieldEdge;
  };
};

const STORAGE_KEY = 'shooters-trigger:training-report';

const finiteScore = (value: unknown, fallback = 50) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : fallback;
};

export const fieldEdge = (player: number, bot: number): FieldEdge =>
  player > bot + 5 ? 'PLAYER' : player < bot - 5 ? 'BOT' : 'TIE';

export const fieldGrade = (score: number) =>
  score < 40 ? 1 : score < 60 ? 2 : score < 80 ? 3 : 4;

export function normalizeShootersTriggerFieldProfile(report: any): ShootersTriggerFieldProfile | null {
  if (!report || typeof report !== 'object') return null;

  const profile = report.profile || {};
  const playerEvasion = finiteScore(profile.playerEvasionScore ?? report.evasion?.playerScore ?? report.evasion?.score);
  const botEvasion = finiteScore(profile.botEvasionScore);
  const playerShooting = finiteScore(profile.playerShootingScore ?? report.shooting?.playerShootingScore ?? report.shooting?.score);
  const botShooting = finiteScore(profile.botShootingScore ?? report.evasion?.botShootingScore);

  const completedAt = Number(report.completedAt);
  if (!Number.isFinite(completedAt) || completedAt <= 0) return null;

  const evasionEdge = fieldEdge(playerEvasion, botEvasion);
  const shootingEdge = fieldEdge(playerShooting, botShooting);
  const playerOverall = Math.round((playerEvasion + playerShooting) / 2);
  const botOverall = Math.round((botEvasion + botShooting) / 2);

  return {
    version: SHOOTERS_TRIGGER_FIELD_PROFILE_VERSION,
    source: 'TRAINING_CAMP',
    completedAt,
    evasion: { player: playerEvasion, bot: botEvasion, edge: evasionEdge },
    shooting: { player: playerShooting, bot: botShooting, edge: shootingEdge },
    overall: {
      player: playerOverall,
      bot: botOverall,
      edge: fieldEdge(playerOverall, botOverall),
    },
  };
}

export function readShootersTriggerFieldProfile(): ShootersTriggerFieldProfile | null {
  try {
    return normalizeShootersTriggerFieldProfile(
      JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'),
    );
  } catch {
    return null;
  }
}

export function saveShootersTriggerFieldProfile(report: any) {
  const normalized = normalizeShootersTriggerFieldProfile(report);
  if (!normalized) return false;
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...current,
      profile: {
        ...(current.profile || {}),
        playerEvasionScore: normalized.evasion.player,
        botEvasionScore: normalized.evasion.bot,
        playerShootingScore: normalized.shooting.player,
        botShootingScore: normalized.shooting.bot,
        playerOverallScore: normalized.overall.player,
        botOverallScore: normalized.overall.bot,
      },
      edge: {
        evasion: normalized.evasion.edge,
        shooting: normalized.shooting.edge,
        overall: normalized.overall.edge,
      },
      schemaVersion: SHOOTERS_TRIGGER_FIELD_PROFILE_VERSION,
    }));
    return true;
  } catch {
    return false;
  }
}
