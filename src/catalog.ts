type GameMenuItem = {
  id: 'hall' | 'presidents-shoes' | 'shooters-trigger';
  title: string;
  description: string;
  status: 'PLAY NOW' | 'IN DEVELOPMENT';
  playable: true;
};

const games: GameMenuItem[] = [
  {
    id: 'shooters-trigger',
    title: 'SHOOTERS TRIGGER',
    description: 'The active build: mobile-first paintball combat evolving through training, evasion, equipment, media and arena play.',
    status: 'IN DEVELOPMENT',
    playable: true,
  },
  {
    id: 'presidents-shoes',
    title: "PRESIDENT'S SHOES",
    description: 'A fictional branching decision game that helped develop the shared storytelling, consequence and state foundations.',
    status: 'PLAY NOW',
    playable: true,
  },
  {
    id: 'hall',
    title: 'HALL',
    description: 'The early playable world that helped establish the shared shell, interaction model and reusable game foundations.',
    status: 'PLAY NOW',
    playable: true,
  },
];

export function renderCatalog(onPlay: (gameId: GameMenuItem['id']) => void) {
  const app = document.getElementById('app');
  if (!app) return;

  app.className = 'ahg-catalog';
  app.querySelector('.game-menu')?.remove();
  app.insertAdjacentHTML('beforeend', `
    <main class="game-menu" aria-labelledby="game-menu-title">
      <header class="game-menu-header">
        <div class="brand">
          <span class="brand-mark">AH</span>
          <span>ADMIN HUB <b>GAMES</b></span>
        </div>
        <span class="menu-label">DEVELOPMENT LIBRARY</span>
      </header>

      <section class="game-menu-main">
        <div class="menu-intro">
          <p class="eyebrow">BUILD · PLAY · LEARN · REUSE</p>
          <h1 id="game-menu-title">The games are the work.</h1>
          <p>This is the live playground for Admin Hub Games — real browser games being built to test mechanics, interaction, storytelling and reusable foundations. Start with the current build or explore the earlier work that helped get it here.</p>
        </div>

        <div class="menu-grid">
          ${games.map((game, index) => `
            <article class="menu-card ${game.playable ? 'is-playable' : 'is-coming'}">
              <div class="menu-card-art" aria-hidden="true"><span>0${index + 1}</span></div>
              <div class="menu-card-content">
                <div class="menu-card-meta"><span>${game.status}</span><span>${index === 0 ? 'CURRENT BUILD' : 'FOUNDATION'}</span></div>
                <h2>${game.title}</h2>
                <p>${game.description}</p>
                <button class="menu-play" data-game-id="${game.id}" type="button">ENTER ${game.title} <span>→</span></button>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <footer class="game-menu-footer">
        <span>ADMIN HUB × PHASER × WEB</span>
        <span>PLAYABLE BUILDS · ACTIVE DEVELOPMENT</span>
      </footer>
    </main>
  `);

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
