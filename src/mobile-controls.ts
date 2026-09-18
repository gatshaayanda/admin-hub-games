type Direction = 'up' | 'down' | 'left' | 'right';
type MovementVector = { x: number; y: number };

type GameShell = {
  joystickVector?: { set: (x: number, y: number) => unknown };
  interact?: () => unknown;
  toggleGamebook?: () => unknown;
};

type PhaserSceneManager = {
  getScene?: (key: string) => GameShell & { scene?: unknown };
  isActive?: (key: string) => boolean;
};

type PhaserGame = {
  scene?: PhaserSceneManager;
};

declare global {
  interface Window {
    __AHG_GAME__?: PhaserGame;
  }
}

const TOUCH_DEVICE = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const vectors: Record<Direction, MovementVector> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function getScene() {
  return window.__AHG_GAME__?.scene?.getScene?.('GameShellScene');
}

function isGameplayVisible() {
  const manager = window.__AHG_GAME__?.scene;
  if (!manager) return false;
  if (manager.isActive) {
    return manager.isActive('GameShellScene') && !manager.isActive('InteractionModalScene');
  }
  return Boolean(getScene());
}

function setDirection(direction: Direction | null) {
  const scene = getScene();
  if (!scene?.joystickVector || !isGameplayVisible()) return;
  if (!direction) {
    scene.joystickVector.set(0, 0);
    return;
  }
  const vector = vectors[direction];
  scene.joystickVector.set(vector.x, vector.y);
}

function makeButton(direction: Direction, label: string) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `ahg-touch-button ${direction}`;
  button.setAttribute('aria-label', `Move ${direction}`);
  button.textContent = label;

  const press = (event: PointerEvent) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    setDirection(direction);
    button.classList.add('is-pressed');
  };
  const release = (event: PointerEvent) => {
    event.preventDefault();
    setDirection(null);
    button.classList.remove('is-pressed');
  };

  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', () => {
    setDirection(null);
    button.classList.remove('is-pressed');
  });
  return button;
}

function makeActionButton(label: string, action: 'interact' | 'book') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ahg-action-button';
  button.setAttribute('aria-label', label);
  button.innerHTML = `<span>${label}</span>`;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (!isGameplayVisible()) return;
    const scene = getScene();
    if (action === 'interact') scene?.interact?.();
    else scene?.toggleGamebook?.();
    button.classList.add('is-pressed');
  });
  button.addEventListener('pointerup', () => button.classList.remove('is-pressed'));
  button.addEventListener('pointercancel', () => button.classList.remove('is-pressed'));
  return button;
}

function install() {
  if (!TOUCH_DEVICE || document.getElementById('ahg-touch-controls')) return;

  const root = document.createElement('div');
  root.id = 'ahg-touch-controls';
  root.setAttribute('aria-label', 'Admin Hub Games mobile controls');

  const dpad = document.createElement('div');
  dpad.className = 'ahg-dpad';
  dpad.append(
    makeButton('up', '▲'),
    makeButton('left', '◀'),
    makeButton('down', '▼'),
    makeButton('right', '▶'),
  );

  const actions = document.createElement('div');
  actions.className = 'ahg-actions';
  actions.append(makeActionButton('EXPLORE', 'interact'), makeActionButton('BOOK', 'book'));

  const hint = document.createElement('div');
  hint.className = 'ahg-touch-hint';
  hint.textContent = 'HOLD TO MOVE';

  root.append(dpad, actions, hint);
  document.body.appendChild(root);
}

function syncVisibility() {
  const root = document.getElementById('ahg-touch-controls');
  if (!root) return;
  const visible = isGameplayVisible();
  root.classList.toggle('is-hidden', !visible);
  if (!visible) setDirection(null);
}

install();
syncVisibility();
window.addEventListener('resize', syncVisibility, { passive: true });
window.setInterval(syncVisibility, 150);
