import Phaser from 'phaser';
import { advanceWorld, createInitialWorld, summarizeReturn } from '../games/living-world/simulation';
import { loadWorldState, saveWorldState } from '../games/living-world/save';
import type { AnimalState, WorldEvent, WorldState } from '../games/living-world/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export class LivingWorldGameScene extends Phaser.Scene {
  private world!: WorldState;
  private report: string[] = [];
  private resizeHandler?: () => void;

  constructor() {
    super('LivingWorldGameScene');
  }

  create() {
    const now = Date.now();
    let loaded: WorldState | null = null;
    try { loaded = loadWorldState(); } catch { loaded = null; }
    const initial = loaded ?? createInitialWorld(now);
    const result = advanceWorld(initial, now);
    this.world = result.state;
    this.report = summarizeReturn(result);
    this.persist();
    this.render();
    this.resizeHandler = () => this.render();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeHandler) this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler, this);
    });
  }

  private persist() {
    try { saveWorldState(this.world); } catch { /* Keep this prototype usable if storage is unavailable. */ }
  }

  private render() {
    this.children.removeAll(true);
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#172b22');
    const compact = width < 620;
    const titleSize = Math.max(22, Math.min(36, height * 0.062));
    this.add.text(width * 0.05, height * 0.06, 'LIVING WORLD', {
      fontFamily: 'Arial, sans-serif', fontSize: `${titleSize}px`, fontStyle: 'bold',
      color: '#f3edda', letterSpacing: 1.5,
    }).setOrigin(0, 0.5);
    this.add.text(width * 0.95, height * 0.06, `DAY ${this.world.day} · ${this.world.season.toUpperCase()}`, {
      fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold', color: '#d7bd79',
    }).setOrigin(1, 0.5);
    this.add.text(width * 0.05, height * 0.13, 'WORLD SIMULATION FOUNDATION · LOCAL SAVE', {
      fontFamily: 'monospace', fontSize: '10px', color: '#a9c2a7', letterSpacing: 1,
    }).setOrigin(0, 0.5);

    const leftX = width * 0.05;
    const contentWidth = width * 0.90;
    const cardTop = height * 0.20;
    const cardHeight = Math.min(height * (compact ? 0.40 : 0.42), 290);
    const card = this.add.rectangle(width / 2, cardTop + cardHeight / 2, contentWidth, cardHeight, 0x233e30, 1)
      .setStrokeStyle(1, 0x6c896d, 0.8);
    this.add.text(leftX + 18, cardTop + 18, 'YOUR HERD', {
      fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold', color: '#d7bd79',
    });
    const rowGap = Math.min(58, (cardHeight - 60) / Math.max(1, this.world.animals.length));
    this.world.animals.forEach((animal: AnimalState, index) => {
      const y = cardTop + 52 + index * rowGap;
      const need = Math.max(animal.hunger, animal.thirst);
      const status = need >= 78 ? 'NEEDS ATTENTION' : need >= 55 ? 'CHECK SOON' : 'SETTLED';
      if (compact || cardHeight < 220) {
        this.add.text(leftX + 18, y + 2,
          `${animal.name} · ${animal.lifeStage.toUpperCase()}   H ${Math.round(animal.hunger)}  T ${Math.round(animal.thirst)}`,
          { fontFamily: 'monospace', fontSize: width < 400 ? '9px' : '10px', color: need >= 78 ? '#efb38b' : '#f3edda' });
      } else {
        this.add.text(leftX + 18, y, `${animal.name}  ·  ${animal.lifeStage.toUpperCase()}`, {
          fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#f3edda',
        });
        this.add.text(leftX + 18, y + 19,
          `Hunger ${Math.round(animal.hunger)}  /  Thirst ${Math.round(animal.thirst)}  /  Trust ${Math.round(animal.trust)}`,
          { fontFamily: 'monospace', fontSize: '10px', color: '#c4d2bd' });
        this.add.text(width * 0.94, y + 8, status, {
          fontFamily: 'monospace', fontSize: '9px', color: need >= 78 ? '#efb38b' : '#d7bd79',
        }).setOrigin(1, 0.5);
      }
    });

    const lowerY = cardTop + cardHeight + 18;
    const patchAverage = this.world.plantPatches.reduce((sum, patch) => sum + patch.growth, 0) / Math.max(1, this.world.plantPatches.length);
    const water = this.world.waterSources[0];
    this.add.text(leftX + 8, lowerY, `GRAZING ${Math.round(patchAverage)}%   ·   WATER ${Math.round(water?.level ?? 0)}%`, {
      fontFamily: 'monospace', fontSize: '11px', color: '#d7bd79',
    });

    const reportY = lowerY + 32;
    const reportText = this.report.slice(0, compact ? 2 : 3).join('\n');
    this.add.text(leftX + 8, reportY, reportText, {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#dbe5d4',
      lineSpacing: 5, wordWrap: { width: contentWidth - 16 },
    });

    const buttonY = height * 0.82;
    this.addActionButton(width * 0.24, buttonY, 'ADVANCE 1 DAY', () => this.advanceOneDay());
    this.addActionButton(width * 0.50, buttonY, 'FEED HERD', () => this.feedHerd());
    this.addActionButton(width * 0.76, buttonY, 'REFILL WATER', () => this.refillWater());
    this.add.text(width / 2, height * 0.93, 'A foundation dashboard — 3D animals and direct herding come after asset and simulation QA.', {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#a9c2a7', align: 'center',
      wordWrap: { width: width * 0.9 },
    }).setOrigin(0.5);
    const back = this.add.text(width * 0.95, height * 0.13, 'LIBRARY ↗', {
      fontFamily: 'monospace', fontSize: '10px', color: '#d7bd79',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: false });
    back.on('pointerdown', () => this.scene.start('PublisherIntroScene'));
  }

  private addActionButton(x: number, y: number, label: string, action: () => void) {
    const { width } = this.scale;
    const button = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: width < 500 ? '9px' : '11px', fontStyle: 'bold',
      color: '#172b22', backgroundColor: '#d7bd79', padding: { x: width < 500 ? 7 : 12, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: false });
    button.on('pointerdown', action);
  }

  private advanceOneDay() {
    const result = advanceWorld(this.world, this.world.lastSimulatedAt + DAY_MS);
    this.world = result.state;
    this.report = summarizeReturn(result);
    this.persist();
    this.render();
  }

  private feedHerd() {
    this.world = {
      ...this.world,
      animals: this.world.animals.map((animal: AnimalState) => ({ ...animal, hunger: Math.max(0, animal.hunger - 28), comfort: Math.min(100, animal.comfort + 5) })),
      events: [...this.world.events, { id: `feed:${Date.now()}`, at: Date.now(), kind: 'needs-attention', message: 'You fed the herd. Hunger eased and comfort improved.' } satisfies WorldEvent].slice(-100),
    };
    this.report = ['You fed the herd. Hunger eased and comfort improved.'];
    this.persist();
    this.render();
  }

  private refillWater() {
    this.world = {
      ...this.world,
      waterSources: this.world.waterSources.map((source) => ({ ...source, level: source.capacity })),
    };
    this.report = ['The trough is full. Your animals have water available.'];
    this.persist();
    this.render();
  }
}
