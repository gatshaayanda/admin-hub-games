type Direction = 'up' | 'down' | 'left' | 'right';
type MovementVector = { x: number; y: number };

type PhaserGame = {
  scene?: { getScene?: (key: string) => unknown };
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
  return window.__AHG_GAME__?.scene?.getScene?.('GameShellScene') as {
    joystickVector?: { set: (x: number, y: number) => unknown };
  } | undefined;
}

function setDirection(direction: Direction | null) {
  const scene = getScene();
  if (!scene?.joystickVector) return;
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

function install() {
  if (!TOUCH_DEVICE || document.getElementById('ahg-touch-controls')) return;

  const root = document.createElement('div');
  root.id = 'ahg-touch-controls';
  root.setAttribute('aria-label', 'Admin Hub Games mobile controls');

  const brand = document.createElement('div');
  brand.className = 'ahg-touch-brand';
  brand.innerHTML = '<strong>ADMIN HUB</strong><span>GAMES</span>';

  const dpad = document.createElement('div');
  dpad.className = 'ahg-dpad';
  dpad.append(
    makeButton('up', '▲'),
    makeButton('left', '◀'),
    makeButton('down', '▼'),
    makeButton('right', '▶'),
  );

  const hint = document.createElement('div');
  hint.className = 'ahg-touch-hint';
  hint.textContent = 'HOLD TO MOVE';

  root.append(brand, dpad, hint);
  document.body.appendChild(root);
}

install();
window.addEventListener('resize', install, { passive: true });
