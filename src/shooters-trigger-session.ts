const SESSION_KEY = 'shooters-trigger:active-session';
const ALERT_KEY = 'shooters-trigger:phone-alert';

type SessionSnapshot = {
  mode: string;
  startedAt: number;
  values: Record<string, string | null>;
};

const PROFILE_KEYS = [
  'shooters-trigger:last-shooting',
  'shooters-trigger:last-evasion',
  'shooters-trigger:last-arena',
  'shooters-trigger:budget',
  'shooters-trigger:upgrade-level',
  'admin-hub-games:shooters-trigger-player',
];

export function beginShootersTriggerSession(mode: string) {
  try {
    const values: Record<string, string | null> = {};
    for (const key of PROFILE_KEYS) values[key] = localStorage.getItem(key);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ mode, startedAt: Date.now(), values }));
  } catch {}
}

export function completeShootersTriggerSession(alert: string) {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  setShootersTriggerPhoneAlert(alert);
}

export function abandonShootersTriggerSession(message: string) {
  restoreSnapshot();
  setShootersTriggerPhoneAlert(message);
}

export function recoverInterruptedShootersTriggerSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const snapshot = JSON.parse(raw) as SessionSnapshot;
    restoreSnapshot(snapshot);
    setShootersTriggerPhoneAlert(
      (snapshot.mode || 'FIELD SESSION').toUpperCase() +
      ' QUIT · RESULTS NOT SAVED · PREVIOUS FIELD STATE RESTORED',
    );
    return true;
  } catch {
    return false;
  }
}

function restoreSnapshot(provided?: SessionSnapshot) {
  try {
    const snapshot = provided ?? JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as SessionSnapshot | null;
    if (snapshot?.values) {
      for (const key of PROFILE_KEYS) {
        const value = snapshot.values[key];
        if (value === null || value === undefined) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      }
    }
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

export function setShootersTriggerPhoneAlert(message: string) {
  try {
    localStorage.setItem(ALERT_KEY, JSON.stringify({ message, createdAt: Date.now(), unread: true }));
  } catch {}
}

export function getShootersTriggerPhoneAlert() {
  try {
    const raw = localStorage.getItem(ALERT_KEY);
    if (!raw) return null;
    const alert = JSON.parse(raw) as { message?: string; createdAt?: number; unread?: boolean };
    return alert.message && alert.unread !== false ? alert : null;
  } catch {
    return null;
  }
}

export function markShootersTriggerPhoneAlertRead() {
  try { localStorage.removeItem(ALERT_KEY); } catch {}
}
