export type NativeNoteComposerOptions = {
  title: string;
  hint: string;
  placeholder: string;
  maxLength: number;
  actionLabel: string;
};

export function openNativeNoteComposer(options: NativeNoteComposerOptions): Promise<string | null> {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:10000',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:20px',
      'padding-top:calc(20px + env(safe-area-inset-top))',
      'padding-right:calc(20px + env(safe-area-inset-right))',
      'padding-bottom:calc(20px + env(safe-area-inset-bottom))',
      'padding-left:calc(20px + env(safe-area-inset-left))',
      'box-sizing:border-box',
      'background:rgba(23,17,14,.82)',
      'font-family:monospace',
      'touch-action:manipulation',
    ].join(';');

    const panel = document.createElement('div');
    panel.style.cssText = [
      'width:min(600px,92vw)',
      'max-height:90dvh',
      'box-sizing:border-box',
      'display:flex',
      'flex-direction:column',
      'gap:12px',
      'padding:22px',
      'background:#eee0ba',
      'border:4px solid #5a402d',
      'border-radius:6px',
      'box-shadow:0 12px 36px rgba(0,0,0,.35)',
    ].join(';');

    const title = document.createElement('div');
    title.textContent = options.title;
    title.style.cssText = 'font-weight:bold;font-size:20px;color:#493526;text-align:center;';

    const hint = document.createElement('div');
    hint.textContent = options.hint;
    hint.style.cssText = 'font-size:11px;line-height:1.45;color:#73533a;text-align:center;';

    const textarea = document.createElement('textarea');
    textarea.maxLength = options.maxLength;
    textarea.placeholder = options.placeholder;
    textarea.setAttribute('aria-label', options.title);
    textarea.style.cssText = [
      'width:100%',
      'min-height:180px',
      'box-sizing:border-box',
      'padding:12px',
      'background:#fff8e8',
      'color:#493526',
      'border:2px solid #9a744c',
      'border-radius:6px',
      'font:14px monospace',
      'line-height:1.45',
      'resize:none',
      'outline:none',
      'touch-action:auto',
    ].join(';');

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:center;gap:12px;flex-wrap:wrap;';

    const makeButton = (label: string, accent: string) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.style.cssText = [
        'min-width:140px',
        'min-height:48px',
        'padding:10px 18px',
        'border-radius:6px',
        'border:2px solid ' + accent,
        'background:#493526',
        'color:#fff4d4',
        'font:700 12px monospace',
        'touch-action:manipulation',
      ].join(';');
      return button;
    };

    const publish = makeButton(options.actionLabel, '#4d9b98');
    const cancel = makeButton('CANCEL', '#6d5947');
    actions.append(publish, cancel);
    panel.append(title, hint, textarea, actions);
    root.append(panel);
    document.body.append(root);

    let finished = false;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish(null);
    };
    const finish = (value: string | null) => {
      if (finished) return;
      finished = true;
      window.removeEventListener('keydown', onKeyDown);
      textarea.blur();
      root.remove();
      resolve(value);
    };

    publish.addEventListener('click', () => {
      const value = textarea.value.trim().slice(0, options.maxLength);
      finish(value || null);
    });
    cancel.addEventListener('click', () => finish(null));
    window.addEventListener('keydown', onKeyDown);
  });
}
