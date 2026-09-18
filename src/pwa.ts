export function registerPwa() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
  });

  if (navigator.storage?.persist) {
    void navigator.storage.persist().catch(() => false);
  }
}
