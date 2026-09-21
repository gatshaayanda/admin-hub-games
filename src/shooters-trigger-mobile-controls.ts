import { adminHubAudio } from './audio';

type ShooterScene = {
  setMoveVector?: (x: number, y: number) => void;
  setFireHeld?: (held: boolean) => void;
  setAimVector?: (x: number, y: number) => void;
  isPhoneSession?: () => boolean;
};

type ShooterManager = {
  getScene?: (key: string) => ShooterScene | undefined;
  isActive?: (key: string) => boolean;
};

const TOUCH_DEVICE =
  window.matchMedia('(pointer: coarse)').matches ||
  navigator.maxTouchPoints > 0;

const ROOT_ID = 'shooters-trigger-mobile-controls';
const STYLE_ID = 'shooters-trigger-mobile-styles';

function getManager(): ShooterManager | undefined {
  return (window.__AHG_GAME__ as unknown as { scene?: ShooterManager } | undefined)?.scene;
}

function getScene() {
  return getManager()?.getScene?.('ShootersTriggerTrainingScene');
}

function isActive() {
  const manager = getManager();
  const scene = getScene();
  if (!scene) return false;
  return manager?.isActive
    ? manager.isActive('ShootersTriggerTrainingScene') === true
    : true;
}

function installStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID} {
      position: fixed;
      inset: 0;
      z-index: 1450;
      pointer-events: none;
      touch-action: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 120ms ease;
      font-family: monospace;
    }

    #${ROOT_ID}.is-active {
      opacity: 1;
      visibility: visible;
    }

    #${ROOT_ID} .st-joystick {
      position: absolute;
      left: max(14px, env(safe-area-inset-left));
      bottom: max(12px, env(safe-area-inset-bottom));
      width: clamp(94px, 25vw, 126px);
      height: clamp(94px, 25vw, 126px);
      border: 2px solid rgba(244, 241, 223, .76);
      border-radius: 50%;
      background: rgba(16, 32, 24, .56);
      box-shadow:
        inset 0 0 0 10px rgba(244, 241, 223, .06),
        0 6px 18px rgba(0, 0, 0, .22);
      pointer-events: auto;
      touch-action: none;
      -webkit-tap-highlight-color: transparent;
    }

    #${ROOT_ID} .st-joystick::after {
      content: "";
      position: absolute;
      inset: 15%;
      border: 1px solid rgba(244, 241, 223, .20);
      border-radius: 50%;
      pointer-events: none;
    }

    #${ROOT_ID} .st-joystick-knob {
      position: absolute;
      left: 50%;
      top: 50%;
      width: clamp(44px, 11vw, 60px);
      height: clamp(44px, 11vw, 60px);
      margin: calc(clamp(44px, 11vw, 60px) / -2) 0 0 calc(clamp(44px, 11vw, 60px) / -2);
      border: 2px solid rgba(255, 255, 255, .88);
      border-radius: 50%;
      background: rgba(31, 107, 75, .94);
      box-shadow: 0 4px 0 rgba(0, 0, 0, .34);
      transform: translate3d(0, 0, 0);
      pointer-events: none;
    }

    #${ROOT_ID} .st-joystick-label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: rgba(244, 241, 223, .45);
      font: 700 clamp(8px, 2.2vw, 10px)/1 monospace;
      letter-spacing: 1px;
      pointer-events: none;
    }

    #${ROOT_ID} .st-fire {
      position: absolute;
      right: max(16px, env(safe-area-inset-right));
      bottom: max(14px, env(safe-area-inset-bottom));
      width: clamp(72px, 19vw, 88px);
      height: clamp(72px, 19vw, 88px);
      padding: 0;
      border: 3px solid rgba(255, 255, 255, .82);
      border-radius: 50%;
      background:
        radial-gradient(circle, rgba(232, 201, 92, .95) 0 7%, rgba(16, 32, 24, .96) 8% 48%, rgba(232, 201, 92, .95) 49% 57%, rgba(16, 32, 24, .72) 58% 100%);
      box-shadow: 0 6px 0 rgba(0, 0, 0, .34);
      color: #f4f1df;
      font: 800 clamp(9px, 2.5vw, 12px)/1 monospace;
      letter-spacing: .8px;
      pointer-events: auto;
      touch-action: none;
      -webkit-tap-highlight-color: transparent;
    }

    #${ROOT_ID} .st-fire::before {
      content: "⊙";
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      color: #f4f1df;
      font: 800 30px/1 sans-serif;
      text-shadow: 0 1px 0 #102018;
    }

    #${ROOT_ID} .st-fire.is-held,
    #${ROOT_ID} .st-fire:active {
      transform: translateY(3px) scale(.97);
      box-shadow: 0 3px 0 rgba(0, 0, 0, .34);
      filter: brightness(1.14);
    }

    #${ROOT_ID} .st-hint {
      position: absolute;
      left: 50%;
      bottom: max(18px, env(safe-area-inset-bottom));
      transform: translateX(-50%);
      color: rgba(244, 241, 223, .54);
      font: 700 clamp(8px, 2vw, 10px)/1 monospace;
      letter-spacing: 1.15px;
      pointer-events: none;
      white-space: nowrap;
    }

    @media (orientation: portrait) {
      #${ROOT_ID} .st-hint { display: none; }
    }

    @media (max-height: 520px) {
      #${ROOT_ID} .st-joystick {
        width: 84px;
        height: 84px;
      }
      #${ROOT_ID} .st-fire {
        width: 62px;
        height: 62px;
      }
    }
  `;
  document.head.appendChild(style);
}

function buildJoystick() {
  const base = document.createElement('div');
  base.className = 'st-joystick';
  base.setAttribute('aria-label', 'Analog movement stick');

  const knob = document.createElement('div');
  knob.className = 'st-joystick-knob';

  const label = document.createElement('div');
  label.className = 'st-joystick-label';
  label.textContent = 'MOVE';

  base.append(knob, label);

  let pointerId: number | null = null;
  let originX = 0;
  let originY = 0;

  const reset = () => {
    pointerId = null;
    knob.style.transform = 'translate3d(0,0,0)';
    getScene()?.setMoveVector?.(0, 0);
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
    getScene()?.setMoveVector?.(x, y);
  };

  base.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isActive()) return;
    adminHubAudio.start();
    pointerId = event.pointerId;
    base.setPointerCapture?.(event.pointerId);
    update(event);
  });

  base.addEventListener('pointermove', update);
  base.addEventListener('pointerup', (event) => {
    event.preventDefault();
    if (pointerId === event.pointerId) reset();
  });
  base.addEventListener('pointercancel', (event) => {
    if (pointerId === event.pointerId) reset();
  });
  base.addEventListener('lostpointercapture', reset);

  return base;
}

function buildFireButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'st-fire';
  button.setAttribute('aria-label', 'Aim and shoot');

  let pointerId: number | null = null;
  let originX = 0;
  let originY = 0;

  const update = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    const x = event.clientX - originX;
    const y = event.clientY - originY;
    const length = Math.hypot(x, y);
    if (length >= 8) {
      getScene()?.setAimVector?.(x / length, y / length);
    }
    getScene()?.setFireHeld?.(true);
  };

  const release = (event?: Event) => {
    event?.preventDefault();
    pointerId = null;
    originX = 0;
    originY = 0;
    button.classList.remove('is-held');
    getScene()?.setFireHeld?.(false);
  };

  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isActive()) return;
    adminHubAudio.start();
    pointerId = event.pointerId;
    originX = event.clientX;
    originY = event.clientY;
    button.setPointerCapture?.(event.pointerId);
    button.classList.add('is-held');
    update(event);
  });

  button.addEventListener('pointermove', update);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', () => release());

  return button;
}

export function installShootersTriggerMobileControls() {
  if (!TOUCH_DEVICE) return () => {};

  const existing = document.getElementById(ROOT_ID);
  if (existing) existing.remove();

  installStyles();

  const root = document.createElement('div');
  root.id = ROOT_ID;

  const joystick = buildJoystick();
  const fire = buildFireButton();

  const hint = document.createElement('div');
  hint.className = 'st-hint';
  hint.textContent = 'MOVE · AIM · SHOOT';

  root.append(joystick, fire, hint);
  document.body.appendChild(root);

  const sync = () => {
    const scene = getScene();
    const active = isActive() && Boolean(scene?.isPhoneSession?.());

    root.classList.toggle('is-active', active);

    if (!active) {
      scene?.setMoveVector?.(0, 0);
      scene?.setFireHeld?.(false);
    }
  };

  sync();

  const timer = window.setInterval(sync, 120);
  window.addEventListener('resize', sync, { passive: true });

  return () => {
    window.clearInterval(timer);
    window.removeEventListener('resize', sync);
    getScene()?.setMoveVector?.(0, 0);
    getScene()?.setFireHeld?.(false);
    root.remove();
  };
}
