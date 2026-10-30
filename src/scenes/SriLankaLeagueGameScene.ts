import Phaser from 'phaser';
import { SriLankaLeagueExperience } from '../games/sri-lanka-league/SriLankaLeagueExperience';

export class SriLankaLeagueGameScene extends Phaser.Scene {
  private experience?: SriLankaLeagueExperience;

  constructor() {
    super('SriLankaLeagueGameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#bd8954');
    const host = document.getElementById('app');
    if (!host) {
      this.add.text(24, 24, 'Sri Lanka League could not open its game surface.', { color: '#fff4df' });
      return;
    }
    this.experience?.dispose();
    this.experience = new SriLankaLeagueExperience(host, () => this.scene.start('PublisherIntroScene'));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.experience?.dispose();
      this.experience = undefined;
    });
  }
}
