type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredInstallPrompt: BeforeInstallPromptEventLike | undefined;
let registration: ServiceWorkerRegistration | undefined;
let installSurfaceReady = false;

const dispatchPwaEvent = (name: string, detail?: Record<string, unknown>) => {
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

function removePwaNotice(id: string) {
  document.getElementById(id)?.remove();
}

function showUpdateNotice(waiting: ServiceWorker) {
  if (document.getElementById('ahg-pwa-update')) return;

  const notice = document.createElement('div');
  notice.id = 'ahg-pwa-update';
  notice.className = 'ahg-pwa-notice';
  notice.innerHTML = '<span>NEW VERSION READY</span><button type="button">RELOAD</button>';

  const button = notice.querySelector('button');
  button?.addEventListener('click', () => {
    waiting.postMessage({ type: 'SKIP_WAITING' });
    button.disabled = true;
    button.textContent = 'LOADING…';
  }, { once: true });

  document.body.append(notice);
}

export function showInstallNotice() {
  if (!deferredInstallPrompt || !installSurfaceReady || document.getElementById('ahg-pwa-install')) return;

  const notice = document.createElement('div');
  notice.id = 'ahg-pwa-install';
  notice.className = 'ahg-pwa-notice ahg-pwa-install';
  notice.innerHTML = '<span>KEEP ADMIN HUB GAMES ON YOUR PHONE</span><button type="button">INSTALL</button><button type="button" aria-label="Dismiss install prompt">×</button>';

  const buttons = notice.querySelectorAll('button');
  buttons[0]?.addEventListener('click', async () => {
    const prompt = deferredInstallPrompt;
    deferredInstallPrompt = undefined;
    notice.remove();
    if (!prompt) return;
    try { await prompt.prompt(); } catch { /* browser may reject a stale prompt */ }
  }, { once: true });

  buttons[1]?.addEventListener('click', () => notice.remove(), { once: true });
  document.body.append(notice);
}

function wireServiceWorkerUpdate(reg: ServiceWorkerRegistration) {
  registration = reg;

  if (reg.waiting) showUpdateNotice(reg.waiting);

  reg.addEventListener('updatefound', () => {
    const worker = reg.installing;
    if (!worker) return;

    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        showUpdateNotice(worker);
        dispatchPwaEvent('admin-hub-games:pwa-update-ready');
      }
    });
  });
}

async function registerServiceWorker() {
  try {
    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    wireServiceWorkerUpdate(registration);
    await registration.update().catch(() => undefined);
  } catch {
    dispatchPwaEvent('admin-hub-games:pwa-unavailable');
  }
}

async function requestPersistentStorage() {
  const storage = navigator.storage;
  if (!storage) return;

  try {
    const persistent = storage.persisted ? await storage.persisted() : false;
    if (!persistent && storage.persist) await storage.persist();
  } catch {
    // Persistence is an enhancement. IndexedDB and Cache Storage still work best-effort.
  }

  try {
    const estimate = storage.estimate ? await storage.estimate() : undefined;
    dispatchPwaEvent('admin-hub-games:pwa-storage', {
      persisted: storage.persisted ? await storage.persisted() : false,
      usage: estimate?.usage ?? 0,
      quota: estimate?.quota ?? 0,
    });
  } catch {
    // Storage diagnostics are deliberately non-blocking.
  }
}

export function markInstallSurfaceReady() {
  installSurfaceReady = true;
  showInstallNotice();
}

export function isInstallPromptAvailable() {
  return Boolean(deferredInstallPrompt);
}

export async function promptInstall() {
  const prompt = deferredInstallPrompt;
  if (!prompt) return false;

  deferredInstallPrompt = undefined;
  try {
    const result = await prompt.prompt();
    return result.outcome === 'accepted';
  } catch {
    return false;
  }
}

export function registerPwa() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEventLike;
    dispatchPwaEvent('admin-hub-games:pwa-install-available');
    showInstallNotice();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = undefined;
    removePwaNotice('ahg-pwa-install');
    dispatchPwaEvent('admin-hub-games:pwa-installed');
  });

  window.addEventListener('online', () => dispatchPwaEvent('admin-hub-games:connectivity', { online: true }));
  window.addEventListener('offline', () => dispatchPwaEvent('admin-hub-games:connectivity', { online: false }));

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (document.getElementById('ahg-pwa-update')) window.location.reload();
  });

  void requestPersistentStorage();

  void registerServiceWorker();

  if (navigator.serviceWorker.controller) {
    void navigator.serviceWorker.ready.then(wireServiceWorkerUpdate);
  }

  void registration;
}
