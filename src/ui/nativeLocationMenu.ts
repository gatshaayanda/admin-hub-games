export type NativeLocationAction = {
  label: string;
  accent?: string;
  value: string;
};

export type NativeLocationMenuOptions = {
  title: string;
  subtitle: string;
  body: string;
  actions: NativeLocationAction[];
};

declare global {
  interface Window {
    __AHG_LOCATION_MENU_OPEN__?: boolean;
  }
}

export function isNativeLocationMenuOpen() {
  return window.__AHG_LOCATION_MENU_OPEN__ === true;
}

export function closeNativeLocationMenu() {
  const root = document.getElementById('ahg-location-menu');
  if (!root) {
    window.__AHG_LOCATION_MENU_OPEN__ = false;
    return;
  }

  root.remove();
  window.__AHG_LOCATION_MENU_OPEN__ = false;
}

export function openNativeLocationMenu(options: NativeLocationMenuOptions): Promise<string | null> {
  closeNativeLocationMenu();

  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.id = 'ahg-location-menu';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', options.title);
    root.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:9999',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:20px',
      'padding-top:calc(20px + env(safe-area-inset-top))',
      'padding-right:calc(20px + env(safe-area-inset-right))',
      'padding-bottom:calc(20px + env(safe-area-inset-bottom))',
      'padding-left:calc(20px + env(safe-area-inset-left))',
      'box-sizing:border-box',
      'background:rgba(23,17,14,.84)',
      'font-family:monospace',
      'touch-action:manipulation',
    ].join(';');

    const panel = document.createElement('div');
    panel.style.cssText = [
      'width:min(680px,92vw)',
      'max-height:90dvh',
      'overflow:auto',
      'box-sizing:border-box',
      'display:flex',
      'flex-direction:column',
      'gap:14px',
      'padding:24px',
      'background:#eee0ba',
      'border:4px solid #5a402d',
      'border-radius:8px',
      'box-shadow:0 14px 44px rgba(0,0,0,.38)',
      'color:#493526',
      '-webkit-overflow-scrolling:touch',
    ].join(';');

    const title = document.createElement('div');
    title.textContent = options.title;
    title.style.cssText = 'font-weight:700;font-size:22px;line-height:1.2;text-align:center;';

    const subtitle = document.createElement('div');
    subtitle.textContent = options.subtitle;
    subtitle.style.cssText = 'font-size:11px;line-height:1.45;color:#73533a;text-align:center;';

    const body = document.createElement('div');
    body.textContent = options.body;
    body.style.cssText = [
      'font-size:12px',
      'line-height:1.55',
      'white-space:pre-wrap',
      'text-align:left',
      'padding:14px',
      'background:rgba(255,248,232,.72)',
      'border:1px solid #c4a875',
      'border-radius:6px',
    ].join(';');

    const actions = document.createElement('div');
    actions.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;';

    const finish = (value: string | null) => {
      if (root.dataset.finished === 'true') return;
      root.dataset.finished = 'true';
      window.removeEventListener('keydown', onKeyDown);
      root.remove();
      window.__AHG_LOCATION_MENU_OPEN__ = false;
      resolve(value);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish(null);
    };

    for (const action of options.actions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = action.label;
      button.style.cssText = [
        'min-height:52px',
        'padding:12px 14px',
        'border-radius:7px',
        'border:2px solid ' + (action.accent || '#4d9b98'),
        'background:#493526',
        'color:#fff4d4',
        'font:700 11px monospace',
        'letter-spacing:.4px',
        'touch-action:manipulation',
        'cursor:pointer',
      ].join(';');
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        finish(action.value);
      });
      actions.append(button);
    }

    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'CLOSE';
    close.style.cssText = [
      'min-height:48px',
      'padding:10px 18px',
      'border-radius:7px',
      'border:2px solid #6d5947',
      'background:#493526',
      'color:#fff4d4',
      'font:700 11px monospace',
      'touch-action:manipulation',
      'align-self:center',
      'min-width:150px',
    ].join(';');
    close.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      finish(null);
    });

    root.addEventListener('click', (event) => {
      if (event.target === root) finish(null);
    });

    panel.append(title, subtitle, body, actions, close);
    root.append(panel);
    document.body.append(root);
    window.__AHG_LOCATION_MENU_OPEN__ = true;
    window.addEventListener('keydown', onKeyDown);

    window.setTimeout(() => {
      const firstButton = actions.querySelector<HTMLButtonElement>('button');
      firstButton?.focus();
    }, 0);
  });
}
