import './style.css';
import './mobile-controls';
function startHall() {
  const boot = async () => {
    const [
      { default: Phaser },
      { registerPwa },
      { BootScene },
      { PublisherIntroScene },
      { NameEntryScene },
      { HallIntroScene },
      { GameShellScene },
      { PresidentsShoesIntroScene },
      { PresidentsShoesSetupScene },
      { PresidentsShoesGameScene },
      { ShootersTriggerIntroScene },
      { ShootersTriggerSetupScene },
      { ShootersTriggerTrainingScene },
      { ShootersTriggerLobbyScene },
      { ShootersTriggerEvasionScene },
      { ShootersTriggerMediaScene },
      { ShootersTriggerArenaScene },
      { WardrobeIntroScene },
    ] = await Promise.all([
      import('phaser'),
      import('./pwa'),
      import('./scenes/BootScene'),
      import('./scenes/PublisherIntroScene'),
      import('./scenes/NameEntryScene'),
      import('./scenes/HallIntroScene'),
      import('./scenes/GameShellScene'),
      import('./scenes/PresidentsShoesIntroScene'),
      import('./scenes/PresidentsShoesSetupScene'),
      import('./scenes/PresidentsShoesGameScene'),
      import('./scenes/ShootersTriggerIntroScene'),
      import('./scenes/ShootersTriggerSetupScene'),
      import('./scenes/ShootersTriggerTrainingScene'),
      import('./scenes/ShootersTriggerLobbyScene'),
      import('./scenes/ShootersTriggerEvasionScene'),
      import('./scenes/ShootersTriggerMediaScene'),
      import('./scenes/ShootersTriggerArenaScene'),
      import('./scenes/WardrobeIntroScene'),
    ]);

    registerPwa();

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'app',
      width: 960,
      height: 540,
      backgroundColor: '#16120f',
      input: { activePointers: 3 },
      dom: { createContainer: true },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER,
        expandParent: true,
        width: 960,
        height: 540,
        min: { width: 320, height: 180 },
        max: { width: 0, height: 0 },
      },
      scene: [BootScene, PublisherIntroScene, NameEntryScene, HallIntroScene, GameShellScene, PresidentsShoesIntroScene, PresidentsShoesSetupScene, PresidentsShoesGameScene, ShootersTriggerIntroScene, ShootersTriggerSetupScene, ShootersTriggerTrainingScene, ShootersTriggerLobbyScene, ShootersTriggerEvasionScene, ShootersTriggerMediaScene, ShootersTriggerArenaScene, WardrobeIntroScene],
    };

    const game = new Phaser.Game(config);
    (window as Window & { __AHG_GAME__?: unknown }).__AHG_GAME__ = game;
  };

  void boot().catch(() => {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '<main class="ahg-fallback"><p>ADMIN HUB GAMES COULD NOT START.</p><button type="button" id="ahg-return-menu">BACK TO GAMES</button></main>';
    document.getElementById('ahg-return-menu')?.addEventListener('click', () => {
      window.location.href = '/';
    });
  });
}

startHall();
