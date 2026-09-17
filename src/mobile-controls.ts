const TOUCH_DEVICE = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

const directions = {
  ArrowUp: { key: 'ArrowUp', code: 'ArrowUp' },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown' },
  ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft' },
  ArrowRight: { key: 'ArrowRight', code: 'ArrowRight' },
} as const;

type DirectionKey = keyof typeof directions;

function dispatchKey(type: 'keydown' | 'keyup', key: DirectionKey) {
  window.dispatchEvent(new KeyboardEvent(type, {
    key,
    code: directions[key].code,
    bubbles: true,
    cancelable: true,
  }));
}

function button(label: string, key: DirectionKey, className: string) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `ahg-touch-button ${className}`;
  el.setAttribute('aria-label', label);
  el.textContent = label === 'UP' ? '▲' : label === 'DOWN' ? '▼' : label === 'LEFT' ? '◀' : '▶';

  const press = (event: PointerEvent) => {
    event.preventDefault();
    el.setPointerCapture?.(event.pointerId);
    dispatchKey('keydown', key);
    el.classList.add('is-pressed');
  };
  const release = (event: PointerEvent) => {
    event.preventDefault();
    dispatchKey('keyup', key);
    el.classList.remove('is-pressed');
  };

  el.addEventListener('pointerdown', press);
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('lostpointercapture', () => dispatchKey('keyup', key));
  return el;
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
    button('UP', 'ArrowUp', 'up'),
    button('LEFT', 'ArrowLeft', 'left'),
    button('DOWN', 'ArrowDown', 'down'),
    button('RIGHT', 'ArrowRight', 'right'),
  );

  const hint = document.createElement('div');
  hint.className = 'ahg-touch-hint';
  hint.textContent = 'MOVE';

  root.append(brand, dpad, hint);
  document.body.appendChild(root);
}

install();
window.addEventListener('resize', install, { passive: true });
