import { markInstallSurfaceReady } from './pwa';

type GameMenuItem = {
  id: 'hall' | 'presidents-shoes' | 'shooters-trigger';
  title: string;
  description: string;
  status: 'PLAY NOW' | 'IN DEVELOPMENT';
  playable: true;
};

const games: GameMenuItem[] = [
  {
    id: 'hall',
    title: 'HALL',
    description: 'The Admin Hub Games world. Explore, read, leave something behind and return.',
    status: 'PLAY NOW',
    playable: true,
  },
  {
    id: 'shooters-trigger',
    title: 'SHOOTERS TRIGGER',
    description: 'Paintball team training in development. Enter the field, play with your team and learn the arena.',
    status: 'IN DEVELOPMENT',
    playable: true,
  },
  {
    id: 'presidents-shoes',
    title: "PRESIDENT'S SHOES",
    description: 'A fictional Botswana decision story. Choose, respond to consequences and see where your first week leads.',
    status: 'PLAY NOW',
    playable: true,
  },
];

export function renderCatalog(onPlay: (gameId: GameMenuItem['id']) => void) {
  const app = document.getElementById('app');
  if (!app) return;

  app.className = 'ahg-catalog';

  // Keep Phaser's canvas mounted. Replacing #app.innerHTML would detach the
  // live game canvas, so the selected game's scene can start cleanly underneath
  // this menu. The library is an overlay on top of Phaser.
  app.querySelector('.game-menu')?.remove();
  app.insertAdjacentHTML('beforeend', `
    <main class="game-menu" aria-labelledby="game-menu-title">
      <header class="game-menu-header">
        <div class="brand">
          <span class="brand-mark">AH</span>
          <span>ADMIN HUB <b>GAMES</b></span>
        </div>
        <span class="menu-label">GAME LIBRARY</span>
      </header>

      <section class="game-menu-main">
        <div class="menu-intro">
          <p class="eyebrow">PLAY · DISCOVER · RETURN</p>
          <h1 id="game-menu-title">Choose a game.</h1>
          <p>Select a world to begin. Games marked IN DEVELOPMENT are playable foundations, not finished releases.</p>
        </div>

        <div class="menu-grid">
          ${games.map((game, index) => `
            <article class="menu-card ${game.playable ? 'is-playable' : 'is-coming'}">
              <div class="menu-card-art" aria-hidden="true"><span>0${index + 1}</span></div>
              <div class="menu-card-content">
                <div class="menu-card-meta"><span>${game.status}</span><span>WORLD</span></div>
                <h2>${game.title}</h2>
                <p>${game.description}</p>
                <button class="menu-play" data-game-id="${game.id}" type="button">PLAY ${game.title} <span>→</span></button>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <footer class="game-menu-footer">
        <span>ADMIN HUB × PHASER</span>
        <span>2 RELEASED · 1 IN DEVELOPMENT</span>
      </footer>
    </main>
  `);

  markInstallSurfaceReady();

  const menu = app.querySelector<HTMLElement>('.game-menu');
  const playButtons = Array.from(menu?.querySelectorAll<HTMLButtonElement>('.menu-play') ?? []);

  const startSelectedGame = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget as HTMLButtonElement | null;
    const gameId = button?.dataset.gameId as GameMenuItem['id'] | undefined;
    if (!menu?.isConnected || !gameId) return;

    menu.remove();
    app.className = '';

    // The library is a separate layer from Phaser. Wait for the browser's
    // pointer/click gesture to finish before starting the selected game's intro.
    window.setTimeout(() => onPlay(gameId), 120);
  };

  for (const button of playButtons) {
    button.addEventListener('click', startSelectedGame, { once: true });
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener('pointerup', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  }
}
