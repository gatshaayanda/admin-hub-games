import Phaser from 'phaser';

type Village = {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  color: number;
  note: string;
};

type Note = {
  village: string;
  text: string;
};

export class GameShellScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private speed = 170;
  private target: Phaser.Math.Vector2 | null = null;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private gamebookKey!: Phaser.Input.Keyboard.Key;
  private interactButton!: Phaser.GameObjects.Container;
  private hintText!: Phaser.GameObjects.Text;
  private playerLabel!: Phaser.GameObjects.Text;
  private gamebookOpen = false;
  private gamebookOverlay?: Phaser.GameObjects.Container;
  private activeVillage?: Village;
  private notes: Note[] = [];
  private villages: Village[] = [
    {
      id: 'story',
      name: 'STORY VILLAGE',
      subtitle: 'Where choices become games',
      x: 420,
      y: 350,
      color: 0x6e5a9b,
      note: 'Ideas for dialogue, characters, choices, quests and endings live here.',
    },
    {
      id: 'adventure',
      name: 'ADVENTURE VILLAGE',
      subtitle: 'Go somewhere and find out',
      x: 1000,
      y: 300,
      color: 0x4d7b5b,
      note: 'Exploration, maps, inventory, items, puzzles and secrets.',
    },
    {
      id: 'management',
      name: 'MANAGEMENT VILLAGE',
      subtitle: 'Build something that keeps moving',
      x: 1610,
      y: 380,
      color: 0xb67a43,
      note: 'Money, resources, schedules, people, upgrades and simulation.',
    },
    {
      id: 'strategy',
      name: 'STRATEGY VILLAGE',
      subtitle: 'Think ahead',
      x: 380,
      y: 930,
      color: 0x496a8a,
      note: 'Turns, territory, cards, resources, opponents and objectives.',
    },
    {
      id: 'arcade',
      name: 'ARCADE VILLAGE',
      subtitle: 'One more run',
      x: 980,
      y: 900,
      color: 0x8d4f58,
      note: 'Score, timers, enemies, waves, power-ups and increasingly difficult challenges.',
    },
    {
      id: 'simulation',
      name: 'SIMULATION VILLAGE',
      subtitle: 'Watch a little world live',
      x: 1610,
      y: 930,
      color: 0x6d7650,
      note: 'Virtual pets, businesses, towns, football management and living systems.',
    },
    {
      id: 'puzzle',
      name: 'PUZZLE VILLAGE',
      subtitle: 'There must be a way',
      x: 2100,
      y: 650,
      color: 0x8b6b3f,
      note: 'Grid rules, objects, logic, moves, undo, hints and satisfying solutions.',
    },
  ];

  constructor() {
    super('GameShellScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#d9c28f');
    this.drawWorld(2400, 1400);

    this.player = this.createPlayer(1180, 1120);
    this.player.setDepth(20);

    this.cameras.main.setBounds(0, 0, 2400, 1400);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(width * 0.28, height * 0.24);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.gamebookKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    this.loadNotes();
    this.createWorldInteractions();
    this.createHud();
    this.createTouchInteraction();
    this.createAmbientSound();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gamebookOpen) return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.target = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopAmbientSound());
  }

  update(_time: number, delta: number) {
    if (!this.player || this.gamebookOpen) return;

    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;

    if (dx === 0 && dy === 0 && this.target) {
      const distanceToTarget = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y);
      if (distanceToTarget < 8) {
        this.target = null;
      } else {
        dx = this.target.x - this.player.x;
        dy = this.target.y - this.player.y;
      }
    }

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy) || 1;
      const distance = this.speed * (delta / 1000);
      this.player.x = Phaser.Math.Clamp(this.player.x + (dx / length) * distance, 42, 2358);
      this.player.y = Phaser.Math.Clamp(this.player.y + (dy / length) * distance, 90, 1350);
      this.target = this.target && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y) < 8 ? null : this.target;
    }

    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) this.interact();
    if (Phaser.Input.Keyboard.JustDown(this.gamebookKey)) this.toggleGamebook();

    this.updateNearbyPrompt();
    this.playerLabel.setPosition(this.player.x, this.player.y - 48);
  }

  private drawWorld(width: number, height: number) {
    const g = this.add.graphics();
    g.fillStyle(0xe7d6a4, 1).fillRect(0, 0, width, height);
    g.fillStyle(0xc59a60, 1).fillRect(0, 360, width, height - 360);

    // A quiet central road system makes the world readable without feeling like a grid.
    g.lineStyle(56, 0xb18456, 1);
    g.beginPath();
    g.moveTo(1180, 1350);
    g.lineTo(1180, 760);
    g.lineTo(420, 350);
    g.moveTo(1180, 760);
    g.lineTo(1000, 300);
    g.moveTo(1180, 760);
    g.lineTo(1610, 380);
    g.moveTo(1180, 760);
    g.lineTo(380, 930);
    g.moveTo(1180, 760);
    g.lineTo(980, 900);
    g.moveTo(1180, 760);
    g.lineTo(1610, 930);
    g.moveTo(1180, 760);
    g.lineTo(2100, 650);
    g.strokePath();

    g.lineStyle(4, 0x9a7248, 0.7);
    g.strokeCircle(1180, 760, 125);

    // Water, scrub and small landmarks give the player visual reasons to wander.
    g.fillStyle(0x7da3a3, 0.9);
    g.fillEllipse(1980, 1160, 260, 130);
    g.fillStyle(0xd5bd84, 1);
    g.fillEllipse(1980, 1160, 190, 80);

    for (let i = 0; i < 70; i += 1) {
      const x = 45 + ((i * 173) % 2260);
      const y = 130 + ((i * 97) % 1160);
      if (Phaser.Math.Distance.Between(x, y, 1180, 760) < 180) continue;
      this.drawGrass(x, y, 0.65 + (i % 4) * 0.1);
    }

    this.drawTree(150, 180, 1.5);
    this.drawTree(2250, 180, 1.1);
    this.drawTree(2280, 1180, 1.35);
    this.drawTree(160, 1160, 1.0);

    // Home / studio.
    this.drawBuilding(1180, 1160, 190, 100, 0xeee1c2, 0x53635c, 'HOME / STUDIO');
    this.add.text(1180, 1088, 'YOUR LITTLE PLACE', {
      fontFamily: 'monospace', fontSize: '13px', color: '#4b3829', stroke: '#f0dfb6', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(6);

    // Chess House is deliberately central: it connects the world to the real thing you play.
    this.drawBuilding(1180, 585, 150, 92, 0xe9dfc4, 0x5d5548, 'CHESS HOUSE');
    this.drawChessBoard(1180, 585);

    this.add.text(1180, 505, 'CHESS HOUSE', {
      fontFamily: 'monospace', fontSize: '16px', color: '#2e241e', stroke: '#e7d6a4', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(6);
    this.add.text(1180, 526, 'you + the other you', {
      fontFamily: 'monospace', fontSize: '10px', color: '#594838',
    }).setOrigin(0.5).setDepth(6);

    this.villages.forEach((village) => this.drawVillage(village));

    this.add.text(1180, 75, 'ADMIN HUB GAMES', {
      fontFamily: 'monospace', fontSize: '22px', color: '#fff4d4', stroke: '#493526', strokeThickness: 7,
    }).setOrigin(0.5).setDepth(5);
    this.add.text(1180, 104, 'a little world for making games', {
      fontFamily: 'monospace', fontSize: '11px', color: '#fff4d4', stroke: '#493526', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);
  }

  private drawVillage(village: Village) {
    const g = this.add.graphics();
    g.fillStyle(village.color, 0.16);
    g.fillCircle(village.x, village.y, 105);
    g.lineStyle(3, village.color, 0.6);
    g.strokeCircle(village.x, village.y, 105);

    this.drawBuilding(village.x, village.y, 130, 78, 0xf0dfb6, village.color, village.name.replace(' VILLAGE', ''));

    this.add.text(village.x, village.y + 64, village.name, {
      fontFamily: 'monospace', fontSize: '14px', color: '#342a22', stroke: '#e7d6a4', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(7);
    this.add.text(village.x, village.y + 86, village.subtitle, {
      fontFamily: 'monospace', fontSize: '9px', color: '#594838', stroke: '#e7d6a4', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(7);

    // A little note marker makes discovery visible from a distance.
    this.add.text(village.x + 72, village.y - 72, '✦', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#fff1bd', stroke: '#493526', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(8);
  }

  private drawBuilding(x: number, y: number, w: number, h: number, wall: number, roof: number, label: string) {
    const g = this.add.graphics();
    g.fillStyle(0x513c2c, 0.22).fillRect(x - w / 2 + 8, y - h / 2 + 12, w, h);
    g.fillStyle(wall, 1).fillRect(x - w / 2, y - h / 2, w, h);
    g.fillStyle(roof, 1);
    g.beginPath();
    g.moveTo(x - w / 2 - 12, y - h / 2);
    g.lineTo(x, y - h / 2 - 38);
    g.lineTo(x + w / 2 + 12, y - h / 2);
    g.closePath();
    g.fillPath();
    g.fillStyle(0x5b4433, 1).fillRect(x - 15, y + 5, 30, h / 2 - 5);
    g.fillStyle(0x7d9a9b, 1).fillRect(x - w / 2 + 18, y - 5, 22, 20);
    g.fillStyle(0x7d9a9b, 1).fillRect(x + w / 2 - 40, y - 5, 22, 20);

    this.add.text(x, y - h / 2 - 16, label, {
      fontFamily: 'monospace', fontSize: '8px', color: '#fff4d4', stroke: '#493526', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);
  }

  private drawChessBoard(x: number, y: number) {
    const g = this.add.graphics();
    const size = 48;
    const startX = x - size / 2;
    const startY = y - 16;
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        g.fillStyle((row + col) % 2 === 0 ? 0xe8d4a7 : 0x73533a, 1);
        g.fillRect(startX + col * 12, startY + row * 12, 12, 12);
      }
    }
    g.fillStyle(0x2e241e, 1).fillCircle(x - 12, y - 4, 4);
    g.fillStyle(0xf0dfb6, 1).fillCircle(x + 12, y + 8, 4);
  }

  private drawGrass(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x687846, 0.75).fillRect(x, y, 12 * scale, 4 * scale);
    g.fillStyle(0x879154, 0.65).fillRect(x + 4 * scale, y - 7 * scale, 4 * scale, 7 * scale);
  }

  private drawTree(x: number, y: number, scale: number) {
    const g = this.add.graphics();
    g.fillStyle(0x65472f, 1).fillRect(x - 6 * scale, y + 18 * scale, 12 * scale, 60 * scale);
    g.fillStyle(0x405638, 1);
    g.fillRect(x - 48 * scale, y, 96 * scale, 20 * scale);
    g.fillRect(x - 34 * scale, y - 15 * scale, 68 * scale, 20 * scale);
    g.fillRect(x - 17 * scale, y - 28 * scale, 34 * scale, 16 * scale);
  }

  private createPlayer(x: number, y: number) {
    const container = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 33, 24, 9, 0x4a3524, 0.28);
    const g = this.add.graphics();

    g.fillStyle(0x2e241e, 1).fillRect(-9, -20, 18, 10);
    g.fillStyle(0x6e432c, 1).fillRect(-8, -13, 16, 13);
    g.fillStyle(0x1f6b68, 1).fillRect(-10, 0, 20, 19);
    g.fillStyle(0xd4a45d, 1).fillRect(-9, 19, 7, 12);
    g.fillStyle(0xd4a45d, 1).fillRect(2, 19, 7, 12);
    g.fillStyle(0x263b3a, 1).fillRect(-11, 29, 9, 5);
    g.fillStyle(0x263b3a, 1).fillRect(2, 29, 9, 5);
    g.fillStyle(0x5b3d2a, 1).fillRect(9, 3, 6, 16);

    container.add(shadow);
    container.add(g);
    return container;
  }

  private createHud() {
    const name = String(this.registry.get('playerName') || 'Player');
    this.playerLabel = this.add.text(this.player.x, this.player.y - 48, name, {
      fontFamily: 'monospace', fontSize: '10px', color: '#fff4d4', stroke: '#493526', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(1).setDepth(30);

    this.hintText = this.add.text(this.scale.width / 2, 20, 'WASD / ARROWS to wander  •  TAP to walk  •  E to explore  •  B for Gamebook', {
      fontFamily: 'monospace', fontSize: '10px', color: '#fff6dc', stroke: '#2c241d', strokeThickness: 4,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(40).setAlpha(0.92);

    this.add.text(18, this.scale.height - 18, 'Explore. Leave ideas behind.', {
      fontFamily: 'monospace', fontSize: '11px', color: '#fff6dc', stroke: '#2c241d', strokeThickness: 4,
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(40).setAlpha(0.8);
  }

  private createTouchInteraction() {
    this.interactButton = this.add.container(this.scale.width - 76, this.scale.height - 76).setScrollFactor(0).setDepth(50);
    const circle = this.add.circle(0, 0, 42, 0x493526, 0.82).setStrokeStyle(3, 0xf0dfb6, 0.9);
    const label = this.add.text(0, 0, 'EXPLORE', {
      fontFamily: 'monospace', fontSize: '9px', color: '#fff4d4', align: 'center',
    }).setOrigin(0.5);
    this.interactButton.add([circle, label]);
    this.interactButton.setSize(84, 84).setInteractive({ useHandCursor: false });
    this.interactButton.on('pointerdown', () => this.interact());
  }

  private createWorldInteractions() {
    this.villages.forEach((village) => {
      const zone = this.add.zone(village.x, village.y, 190, 150).setInteractive();
      zone.setData('village', village);
      zone.on('pointerdown', () => {
        this.player.x = Phaser.Math.Clamp(village.x + 145, 42, 2358);
        this.player.y = Phaser.Math.Clamp(village.y + 120, 90, 1350);
        this.activeVillage = village;
        this.showVillageNote(village);
      });
    });

    const chessZone = this.add.zone(1180, 585, 220, 160).setInteractive();
    chessZone.setData('village', {
      id: 'chess', name: 'CHESS HOUSE', subtitle: 'you + the other you', x: 1180, y: 585, color: 0x73533a,
      note: 'Your real chess life meets this little world here. One you plays on Chess.com. This one wanders, notices things and leaves ideas behind.',
    } satisfies Village);
    chessZone.on('pointerdown', () => {
      this.player.x = 1180;
      this.player.y = 690;
      this.interact();
    });
  }

  private updateNearbyPrompt() {
    const nearest = this.findNearestVillage(145);
    this.activeVillage = nearest;
    if (nearest) {
      this.hintText.setText(`${nearest.name}  •  E / EXPLORE to leave a note`);
      this.interactButton.setAlpha(1);
    } else {
      this.hintText.setText('WASD / ARROWS to wander  •  TAP to walk  •  E to explore  •  B for Gamebook');
      this.interactButton.setAlpha(0.72);
    }
  }

  private findNearestVillage(radius: number): Village | undefined {
    let nearest: Village | undefined;
    let nearestDistance = radius;

    for (const village of this.villages) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, village.x, village.y);
      if (distance < nearestDistance) {
        nearest = village;
        nearestDistance = distance;
      }
    }

    const chessDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, 1180, 585);
    if (chessDistance < nearestDistance) {
      nearest = {
        id: 'chess', name: 'CHESS HOUSE', subtitle: 'you + the other you', x: 1180, y: 585, color: 0x73533a,
        note: 'Your real chess life meets this little world here. One you plays on Chess.com. This one wanders, notices things and leaves ideas behind.',
      };
    }

    return nearest;
  }

  private interact() {
    if (this.gamebookOpen) return;
    const village = this.findNearestVillage(170);
    if (!village) {
      this.hintText.setText('Nothing here yet. Keep wandering.');
      return;
    }

    this.activeVillage = village;
    this.showVillageNote(village);
  }

  private showVillageNote(village: Village) {
    const existing = this.notes.find((note) => note.village === village.id);
    if (!existing) {
      this.notes.push({ village: village.id, text: village.note });
      this.saveNotes();
    }

    const panel = this.add.container(this.scale.width / 2, this.scale.height / 2).setScrollFactor(0).setDepth(100);
    const backdrop = this.add.rectangle(0, 0, 610, 270, 0x241b16, 0.96).setStrokeStyle(3, village.color, 1);
    const pin = this.add.text(-270, -103, '✦ DISCOVERY', {
      fontFamily: 'monospace', fontSize: '11px', color: '#f0dfb6',
    });
    const title = this.add.text(0, -68, village.name, {
      fontFamily: 'monospace', fontSize: '23px', color: '#fff4d4', stroke: '#493526', strokeThickness: 3,
    }).setOrigin(0.5);
    const subtitle = this.add.text(0, -34, village.subtitle, {
      fontFamily: 'monospace', fontSize: '10px', color: '#d9bd87',
    }).setOrigin(0.5);
    const body = this.add.text(0, 20, village.note, {
      fontFamily: 'monospace', fontSize: '13px', color: '#fff8e8', align: 'center',
      wordWrap: { width: 500 }, lineSpacing: 7,
    }).setOrigin(0.5);
    const close = this.add.text(0, 95, 'TAP / E / SPACE to close', {
      fontFamily: 'monospace', fontSize: '10px', color: '#d9bd87',
    }).setOrigin(0.5);
    panel.add([backdrop, pin, title, subtitle, body, close]);
    panel.setAlpha(0);
    this.tweens.add({ targets: panel, alpha: 1, duration: 180 });

    const closePanel = () => {
      if (!panel.active) return;
      panel.active = false;
      this.tweens.add({ targets: panel, alpha: 0, duration: 140, onComplete: () => panel.destroy() });
      this.input.keyboard?.off('keydown-E', closePanel);
      this.input.keyboard?.off('keydown-SPACE', closePanel);
      this.input.off('pointerdown', closePanel);
    };

    this.input.keyboard?.once('keydown-E', closePanel);
    this.input.keyboard?.once('keydown-SPACE', closePanel);
    this.input.once('pointerdown', closePanel);
    panel.setInteractive(new Phaser.Geom.Rectangle(-305, -135, 610, 270), Phaser.Geom.Rectangle.Contains);
    panel.on('pointerdown', closePanel);
  }

  private toggleGamebook() {
    if (this.gamebookOpen) {
      this.closeGamebook();
      return;
    }

    this.gamebookOpen = true;
    this.target = null;
    this.gamebookOverlay = this.add.container(this.scale.width / 2, this.scale.height / 2).setScrollFactor(0).setDepth(200);
    const backdrop = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x17110e, 0.72);
    const book = this.add.rectangle(0, 0, 700, 430, 0xd8bd83, 1).setStrokeStyle(6, 0x5a402d, 1);
    const inner = this.add.rectangle(0, 0, 660, 390, 0xeee0ba, 1).setStrokeStyle(2, 0x9a744c, 1);
    const title = this.add.text(0, -160, 'THE GAMEBOOK', {
      fontFamily: 'monospace', fontSize: '28px', color: '#493526',
    }).setOrigin(0.5);
    const intro = this.add.text(0, -124, 'Things discovered while wandering.', {
      fontFamily: 'monospace', fontSize: '11px', color: '#73533a',
    }).setOrigin(0.5);

    const noteLines = this.notes.length
      ? this.notes.map((note) => {
          const village = [...this.villages, { id: 'chess', name: 'CHESS HOUSE' } as Village].find((v) => v.id === note.village);
          return `✦ ${village?.name || note.village}\n  ${note.text}`;
        }).join('\n\n')
      : 'No notes yet.\n\nWalk into a village and explore it.\nYour first discoveries will stay here.';

    const notes = this.add.text(-300, -82, noteLines, {
      fontFamily: 'monospace', fontSize: '11px', color: '#493526',
      wordWrap: { width: 600 }, lineSpacing: 6,
    });
    const close = this.add.text(0, 166, 'B / ESC / TAP to return to the world', {
      fontFamily: 'monospace', fontSize: '10px', color: '#73533a',
    }).setOrigin(0.5);

    this.gamebookOverlay.add([backdrop, book, inner, title, intro, notes, close]);
    this.gamebookOverlay.setAlpha(0);
    this.tweens.add({ targets: this.gamebookOverlay, alpha: 1, duration: 180 });

    this.input.keyboard?.once('keydown-B', () => this.closeGamebook());
    this.input.keyboard?.once('keydown-ESC', () => this.closeGamebook());
    this.gamebookOverlay.setInteractive(new Phaser.Geom.Rectangle(-480, -270, 960, 540), Phaser.Geom.Rectangle.Contains);
    this.gamebookOverlay.on('pointerdown', () => this.closeGamebook());
  }

  private closeGamebook() {
    if (!this.gamebookOpen || !this.gamebookOverlay) return;
    this.gamebookOpen = false;
    const overlay = this.gamebookOverlay;
    this.gamebookOverlay = undefined;
    this.tweens.add({ targets: overlay, alpha: 0, duration: 140, onComplete: () => overlay.destroy() });
  }

  private saveNotes() {
    try {
      window.localStorage.setItem('admin-hub-games:gamebook', JSON.stringify(this.notes));
    } catch {
      // Local persistence is a convenience; gameplay must still work if storage is unavailable.
    }
  }

  private loadNotes() {
    try {
      const raw = window.localStorage.getItem('admin-hub-games:gamebook');
      if (raw) this.notes = JSON.parse(raw) as Note[];
    } catch {
      this.notes = [];
    }
  }

  private ambientOscillators: OscillatorNode[] = [];
  private ambientGain?: GainNode;

  private createAmbientSound() {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const gain = context.createGain();
      gain.gain.value = 0.018;
      gain.connect(context.destination);
      this.ambientGain = gain;

      const notes = [196, 246.94, 293.66, 246.94, 220, 261.63, 329.63, 261.63];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start(context.currentTime + index * 0.55);
        oscillator.stop(context.currentTime + 0.55 * notes.length + 0.8);
        this.ambientOscillators.push(oscillator);
      });

      context.resume().catch(() => undefined);
    } catch {
      // Audio is optional and must never block the game.
    }
  }

  private stopAmbientSound() {
    this.ambientGain?.disconnect();
    this.ambientOscillators = [];
    this.ambientGain = undefined;
  }
}
