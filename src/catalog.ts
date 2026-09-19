const games = [
  {
    number: '01',
    status: 'IN DEVELOPMENT',
    title: 'MHELE',
    kicker: 'TRADITIONAL STRATEGY',
    description: 'A Setswana game of placement, movement, mills and captures — reimagined for the browser.',
    tags: ['STRATEGY', 'LOCAL ROOTS', '2 PLAYER'],
    action: 'WATCH THIS SPACE',
  },
  {
    number: '02',
    status: 'IN DEVELOPMENT',
    title: 'THE NEXT RUN',
    kicker: 'ARCADE / PUZZLE',
    description: 'A compact run-and-climb world built around movement, treasure, timing and getting out alive.',
    tags: ['ARCADE', 'LEVELS', 'SPEED'],
    action: 'COMING SOON',
  },
  {
    number: '03',
    status: 'THE PIPELINE',
    title: 'MORE WORLDS',
    kicker: 'EXPERIMENTS',
    description: 'Strategy. Simulation. Stories. Strange little ideas. The catalog grows one playable slice at a time.',
    tags: ['EXPERIMENTAL', 'BROWSER', 'PHASER'],
    action: 'FOLLOW THE BUILD',
  },
];

export function renderCatalog() {
  const app = document.getElementById('app');
  if (!app) return;

  app.className = 'ahg-catalog';
  app.innerHTML = `
    <main class="catalog-page">
      <section class="catalog-hero" aria-labelledby="hero-title">
        <div class="hero-stars" aria-hidden="true"></div>
        <div class="hero-orbit orbit-one" aria-hidden="true"></div>
        <div class="hero-orbit orbit-two" aria-hidden="true"></div>
        <div class="hero-signal" aria-hidden="true"><span></span></div>

        <nav class="catalog-nav">
          <a class="brand" href="/" aria-label="Admin Hub Games home">
            <span class="brand-mark">AH</span>
            <span>ADMIN HUB <b>GAMES</b></span>
          </a>
          <a class="nav-world" href="?world=1">ENTER THE WORLD <span>↗</span></a>
        </nav>

        <div class="hero-copy">
          <p class="eyebrow">THE 11TH ITERATION OF ADMIN HUB</p>
          <h1 id="hero-title">We build worlds.<br><em>You get to play them.</em></h1>
          <p class="hero-lede">Games, experiments, stories and strange little worlds — built in Botswana and made to be played anywhere.</p>
          <div class="hero-actions">
            <a class="cta cta-primary" href="#catalog">EXPLORE THE CATALOG <span>↓</span></a>
            <a class="cta cta-quiet" href="?world=1">ENTER THE WORLD <span>↗</span></a>
          </div>
        </div>

        <div class="hero-foot">
          <span>ADMIN HUB × PHASER</span>
          <span>BUILD · PLAY · RETURN</span>
          <span>BROWSER-FIRST</span>
        </div>
      </section>

      <section class="intro-section section-shell">
        <div class="section-label">/ 01 — A NEW DIVISION</div>
        <div class="intro-grid">
          <div>
            <p class="display-copy">Admin Hub started with systems.<br><strong>Iteration 11 is different.</strong></p>
          </div>
          <div class="body-copy">
            <p>We're making games.</p>
            <p>Small games. Strategy games. Stories. Simulations. Experiments. Games rooted in where we come from and designed so anyone, anywhere can understand how to play.</p>
            <p class="accent-line">Start local → make it globally understandable.</p>
          </div>
        </div>
      </section>

      <section id="catalog" class="catalog-section section-shell">
        <div class="section-heading">
          <div>
            <div class="section-label">/ 02 — THE CATALOG</div>
            <h2>Play something.</h2>
          </div>
          <p>Every title starts as a small playable idea. Finished games earn their place here.</p>
        </div>
        <div class="game-grid">
          ${games.map((game) => `
            <article class="game-card">
              <div class="game-art art-${game.number}" aria-hidden="true">
                <span class="art-number">${game.number}</span>
                <span class="art-orbit"></span>
                <span class="art-grid"></span>
              </div>
              <div class="game-card-body">
                <div class="card-meta"><span>${game.status}</span><span>${game.kicker}</span></div>
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                <div class="tag-row">${game.tags.map((tag) => `<span>${tag}</span>`).join('')}</div>
                <button class="card-action" type="button">${game.action} <span>→</span></button>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="pipeline-section">
        <div class="section-shell">
          <div class="section-label">/ 03 — HOW WORLDS GET MADE</div>
          <div class="pipeline-intro">
            <h2>Idea → playable world.</h2>
            <p>We don't want to build infrastructure forever. We want to make games.</p>
          </div>
          <div class="pipeline">
            <div><span>01</span><strong>IDEA</strong><small>Find the hook.</small></div>
            <div><span>02</span><strong>DESIGN</strong><small>Make it playable.</small></div>
            <div><span>03</span><strong>BUILD</strong><small>Ship the slice.</small></div>
            <div><span>04</span><strong>PLAYTEST</strong><small>See what survives.</small></div>
            <div><span>05</span><strong>SHIP</strong><small>Put it in the world.</small></div>
          </div>
        </div>
      </section>

      <section class="world-section section-shell">
        <div class="world-card">
          <div class="world-copy">
            <div class="section-label">/ 04 — THE HOME WORLD</div>
            <h2>There is already a world behind the catalog.</h2>
            <p>The Admin Hub Games foundation is a living game world: a place to wander, discover ideas, write, build and return. As real games ship, their doors can appear inside it.</p>
            <a class="cta cta-primary" href="?world=1">ENTER ADMIN HUB GAMES <span>↗</span></a>
          </div>
          <div class="world-map" aria-hidden="true">
            <span class="map-star s1"></span><span class="map-star s2"></span><span class="map-star s3"></span>
            <span class="map-path"></span><span class="map-node n1">IDEA</span><span class="map-node n2">BUILD</span><span class="map-node n3">PLAY</span>
          </div>
        </div>
      </section>

      <footer class="catalog-footer">
        <div class="section-shell footer-inner">
          <div>
            <div class="brand footer-brand"><span class="brand-mark">AH</span><span>ADMIN HUB <b>GAMES</b></span></div>
            <p>The 11th iteration is now being built.</p>
          </div>
          <a class="footer-link" href="#catalog">BACK TO CATALOG ↑</a>
        </div>
      </footer>
    </main>
  `;
}
