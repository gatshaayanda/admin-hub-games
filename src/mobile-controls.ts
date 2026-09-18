type GameShell = {
  joystickVector?: { set: (x: number, y: number) => unknown };
  interact?: () => unknown;
  toggleGamebook?: () => unknown;
  isGamebookOpen?: () => boolean;
};
type PhaserSceneManager = {
  getScene?: (key: string) => GameShell & { scene?: unknown };
  isActive?: (key: string) => boolean;
};
type PhaserGame = { scene?: PhaserSceneManager };
declare global { interface Window { __AHG_GAME__?: PhaserGame; } }

const TOUCH_DEVICE = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

function getScene() {
  return window.__AHG_GAME__?.scene?.getScene?.('GameShellScene');
}

function getManager() {
  return window.__AHG_GAME__?.scene;
}

function isGameplayVisible() {
  const manager = getManager();
  if (!manager) return false;
  return manager.isActive ? manager.isActive('GameShellScene') : Boolean(getScene());
}

function isModalVisible() {
  return Boolean(getManager()?.isActive?.('InteractionModalScene'));
}

function setVector(x: number, y: number) {
  const scene = getScene();
  if (!scene?.joystickVector || !isGameplayVisible() || isModalVisible() || scene.isGamebookOpen?.()) return;
  scene.joystickVector.set(x, y);
}

function makeJoystick() {
  const base = document.createElement('div');
  base.className = 'ahg-joystick';
  base.setAttribute('aria-label', 'Virtual movement joystick');

  const knob = document.createElement('div');
  knob.className = 'ahg-joystick-knob';

  const label = document.createElement('div');
  label.className = 'ahg-joystick-label';
  label.textContent = 'MOVE';

  base.append(knob, label);

  let pointerId: number | null = null;

  const reset = () => {
    pointerId = null;
    knob.style.transform = 'translate3d(0,0,0)';
    setVector(0, 0);
  };

  const update = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;

    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxRadius = Math.max(1, Math.min(rect.width, rect.height) * 0.34);
    const rawX = event.clientX - cx;
    const rawY = event.clientY - cy;
    const distance = Math.hypot(rawX, rawY) || 1;
    const scale = Math.min(1, maxRadius / distance);
    const knobX = rawX * scale;
    const knobY = rawY * scale;
    const deadZone = Math.min(10, maxRadius * 0.2);
    const active = Math.max(0, distance - deadZone);
    const normalized = Math.min(1, active / Math.max(1, maxRadius - deadZone));
    const x = distance <= deadZone ? 0 : (rawX / distance) * normalized;
    const y = distance <= deadZone ? 0 : (rawY / distance) * normalized;

    knob.style.transform = `translate3d(${knobX}px,${knobY}px,0)`;
    setVector(x, y);
  };

  base.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (!isGameplayVisible() || isModalVisible() || getScene()?.isGamebookOpen?.()) return;
    pointerId = event.pointerId;
    base.setPointerCapture?.(event.pointerId);
    update(event);
  });
  base.addEventListener('pointermove', update);
  base.addEventListener('pointerup', (event) => { if (pointerId === event.pointerId) reset(); });
  base.addEventListener('pointercancel', (event) => { if (pointerId === event.pointerId) reset(); });
  base.addEventListener('lostpointercapture', reset);

  return base;
}

function makeActionButton(label: string, action: 'interact' | 'book') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ahg-action-button';
  button.setAttribute('aria-label', label);
  button.innerHTML = `<span>${label}</span>`;

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isGameplayVisible() || isModalVisible()) return;

    const scene = getScene();
    if (action === 'interact') scene?.interact?.();
    else scene?.toggleGamebook?.();
  });

  button.addEventListener('pointerdown', () => button.classList.add('is-pressed'));
  button.addEventListener('pointerup', () => button.classList.remove('is-pressed'));
  button.addEventListener('pointercancel', () => button.classList.remove('is-pressed'));
  button.addEventListener('pointerleave', () => button.classList.remove('is-pressed'));
  return button;
}

function install() {
  if (!TOUCH_DEVICE || document.getElementById('ahg-touch-controls')) return;

  const root = document.createElement('div');
  root.id = 'ahg-touch-controls';
  root.setAttribute('aria-label', 'Admin Hub Games mobile controls');

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'ahg-back-button is-hidden';
  back.setAttribute('aria-label', 'Back');
  back.textContent = '‹ BACK';
  back.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.dispatchEvent(new Event('ahg:escape'));
  });

  const actions = document.createElement('div');
  actions.className = 'ahg-actions';
  actions.append(makeActionButton('EXPLORE', 'interact'), makeActionButton('BOOK', 'book'));

  const hint = document.createElement('div');
  hint.className = 'ahg-touch-hint';
  hint.textContent = 'DRAG TO MOVE';

  root.append(back, makeJoystick(), actions, hint);
  document.body.appendChild(root);
}

function syncVisibility() {
  const root = document.getElementById('ahg-touch-controls');
  if (!root) return;

  const scene = getScene();
  const gameplay = isGameplayVisible();
  const modal = isModalVisible();
  const gamebook = Boolean(scene?.isGamebookOpen?.());
  const overlay = modal || gamebook;

  root.classList.toggle('is-hidden', !gameplay && !modal);
  root.classList.toggle('is-overlay', overlay);

  const back = root.querySelector<HTMLButtonElement>('.ahg-back-button');
  back?.classList.toggle('is-hidden', !overlay);

  if (!gameplay || modal || gamebook) setVector(0, 0);
}

if (TOUCH_DEVICE) {
  install();
  syncVisibility();
  window.addEventListener('resize', syncVisibility, { passive: true });
  window.setInterval(syncVisibility, 100);
}
