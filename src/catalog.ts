type GameMenuItem = {
  title: string;
  description: string;
  status: 'PLAY NOW' | 'COMING SOON';
  playable: boolean;
};

const games: GameMenuItem[] = [
  {
    title: 'HALL',
    description: 'The Admin Hub Games world. Explore, read, leave something behind and return.',
    status: 'PLAY NOW',
    playable: true,
  },
];

export function renderCatalog(onPlay: () => void) {
  const app = document.getElementById('app');
  if (!app) return;

  app.className = 'ahg-catalog';

  // Keep Phaser's canvas mounted. Replacing #app.innerHTML would detach the
  // live game canvas, so the Hall scene could start successfully but become
  // invisible behind this menu. The library is an overlay on top of Phaser.
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
          <p>Select a world to begin. The game's own introduction will play after you enter.</p>
        </div>

        <div class="menu-grid">
          ${games.map((game, index) => `
            <article class="menu-card ${game.playable ? 'is-playable' : 'is-coming'}">
              <div class="menu-card-art" aria-hidden="true"><span>0${index + 1}</span></div>
              <div class="menu-card-content">
                <div class="menu-card-meta"><span>${game.status}</span><span>WORLD</span></div>
                <h2>${game.title}</h2>
                <p>${game.description}</p>
                ${game.playable ? '<button class="menu-play" id="play-hall" type="button">PLAY HALL <span>→</span></button>' : '<span class="menu-disabled">COMING SOON</span>'}
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <footer class="game-menu-footer">
        <span>ADMIN HUB × PHASER</span>
        <span>HALL IS READY TO PLAY</span>
      </footer>
    </main>
  `);

  const menu = app.querySelector<HTMLElement>('.game-menu');
  const playButton = menu?.querySelector<HTMLButtonElement>('#play-hall');
  playButton?.addEventListener('click', () => {
    menu?.remove();
    app.className = '';
    // Let the menu's click gesture fully finish before Phaser receives input again.
    // This prevents the same touch from immediately skipping the Hall cinematic.
    window.setTimeout(onPlay, 0);
  }, { once: true });
}
