import Phaser from 'phaser';

export type FieldOperatorDirection = 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';

export class FieldOperatorCharacter {
  private readonly container: Phaser.GameObjects.Container;
  private readonly body: Phaser.GameObjects.Graphics;
  private readonly weapon: Phaser.GameObjects.Graphics;
  private readonly muzzle: Phaser.GameObjects.Graphics;
  private walkClock = 0;
  private recoil = 0;
  private visible = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y).setDepth(31);
    this.body = scene.add.graphics();
    this.weapon = scene.add.graphics();
    this.muzzle = scene.add.graphics();
    this.container.add([this.body, this.weapon, this.muzzle]);

    // Visual language is deliberately assembled from the inspected free packs:
    // Pack A soldier proportions/held rifle, Pack B robot clarity, and Packs C-E
    // provide the action/gear vocabulary. No incompatible source frames are mashed
    // together; this is one coherent Shooter-specific presentation.
    this.drawBody('DOWN', false, new Phaser.Math.Vector2(1, 0));
  }

  get gameObject() {
    return this.container;
  }

  setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  get x() { return this.container.x; }
  get y() { return this.container.y; }

  setVisible(value: boolean) {
    this.visible = value;
    this.container.setVisible(value);
  }

  update(
    direction: FieldOperatorDirection,
    aim: Phaser.Math.Vector2,
    walking: boolean,
    firing: boolean,
    delta: number,
  ) {
    if (!this.visible) return;
    if (walking) this.walkClock += delta;
    this.recoil = Math.max(0, this.recoil - delta);
    const normalizedAim = aim.clone().normalize();
    this.drawBody(direction, walking, normalizedAim);
    this.drawWeapon(normalizedAim, firing);
  }

  triggerRecoil() {
    this.recoil = 85;
  }

  getMuzzlePosition(aim: Phaser.Math.Vector2) {
    const a = aim.clone().normalize();
    return new Phaser.Math.Vector2(
      this.container.x + a.x * 48,
      this.container.y - 34 + a.y * 10,
    );
  }

  destroy() {
    this.container.destroy(true);
  }

  private drawBody(
    direction: FieldOperatorDirection,
    walking: boolean,
    aim: Phaser.Math.Vector2,
  ) {
    this.body.clear();

    const bob = walking ? Math.sin(this.walkClock / 85) * 1.4 : 0;
    const stride = walking ? Math.sin(this.walkClock / 85) * 4 : 0;
    const side = direction === 'LEFT' ? -1 : direction === 'RIGHT' ? 1 : 0;
    const rear = direction === 'UP';

    // Legs/boots: compact silhouette, shared 60px visible footprint.
    this.body.fillStyle(0x566052, 1);
    this.body.fillRoundedRect(-10 + stride, 20 + bob, 8, 13, 2);
    this.body.fillRoundedRect(2 - stride, 20 - bob, 8, 13, 2);
    this.body.fillStyle(0x202522, 1);
    this.body.fillRoundedRect(-12 + stride, 30 + bob, 11, 7, 2);
    this.body.fillRoundedRect(2 - stride, 30 - bob, 11, 7, 2);

    // Utility trousers / belt.
    this.body.fillStyle(0x3e4941, 1).fillRoundedRect(-12, 15 + bob, 24, 10, 3);
    this.body.fillStyle(0xe8c95c, 1).fillRect(-2, 17 + bob, 4, 5);

    // Torso / vest.
    this.body.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15, -7 + bob, 30, 25, 8);
    this.body.fillStyle(0x4f8b65, 1).fillRoundedRect(-10, -3 + bob, 20, 15, 4);
    this.body.fillStyle(0x17201c, 1).fillRoundedRect(-13, 7 + bob, 26, 5, 2);
    this.body.fillStyle(0xe8c95c, 1).fillRoundedRect(side * 10 - 2, -2 + bob, 4, 8, 1);

    // Neck.
    this.body.fillStyle(0xd4a45d, 1).fillRoundedRect(-4, -13 + bob, 8, 8, 2);

    // Helmet + paintball mask. Rear view is darker; side view exposes one mask lens.
    this.body.fillStyle(rear ? 0x29342f : 0x5a7348, 1).fillEllipse(0, -24 + bob, 28, 18);
    this.body.fillStyle(0x17201c, 1).fillRoundedRect(-13, -25 + bob, 26, 8, 3);
    this.body.fillStyle(0x91b7ad, 0.95).fillEllipse(side * 5, -24 + bob, 12, 6);
    this.body.fillStyle(0x202522, 1).fillRoundedRect(-11, -31 + bob, 22, 5, 2);
    this.body.fillStyle(0xe8c95c, 1).fillRect(-3, -34 + bob, 6, 3);

    // Face cue for front/side readability.
    if (!rear) {
      this.body.fillStyle(0xd4a45d, 1).fillEllipse(0, -21 + bob, 11, 8);
      this.body.fillStyle(0x17201c, 1).fillRoundedRect(-8, -25 + bob, 16, 4, 2);
    }

    // Arms are drawn toward the weapon grip, so the gun reads as held, not floating.
    const shoulderY = -3 + bob;
    const grip = new Phaser.Math.Vector2(18 * aim.x, -31 + 8 * aim.y + bob);
    const support = new Phaser.Math.Vector2(7 * aim.x, -20 + 5 * aim.y + bob);

    this.body.lineStyle(7, 0x2f6b4e, 1);
    this.body.lineBetween(-11, shoulderY, support.x, support.y);
    this.body.lineBetween(11, shoulderY, grip.x, grip.y);
    this.body.fillStyle(0xd4a45d, 1);
    this.body.fillCircle(support.x, support.y, 3.2);
    this.body.fillCircle(grip.x, grip.y, 3.2);
  }

  private drawWeapon(aim: Phaser.Math.Vector2, firing: boolean) {
    this.weapon.clear();
    this.muzzle.clear();

    const a = aim.clone().normalize();
    const p = new Phaser.Math.Vector2(19 * a.x, -31 + 8 * a.y);
    const recoil = this.recoil > 0 ? 3 : 0;
    const stock = p.clone().subtract(a.clone().scale(14 + recoil));
    const barrel = p.clone().add(a.clone().scale(31 - recoil));

    this.weapon.lineStyle(8, 0x17201c, 1);
    this.weapon.lineBetween(stock.x, stock.y, barrel.x, barrel.y);
    this.weapon.lineStyle(4, 0x566052, 1);
    this.weapon.lineBetween(stock.x + a.x * 4, stock.y + a.y * 4, barrel.x - a.x * 7, barrel.y - a.y * 7);
    this.weapon.fillStyle(0xe8c95c, 1);
    this.weapon.fillRoundedRect(p.x - 3, p.y - 4, 7, 8, 2);
    this.weapon.fillStyle(0x202522, 1);
    this.weapon.fillCircle(barrel.x, barrel.y, 4);

    if (firing || this.recoil > 0) {
      const flash = barrel.clone().add(a.clone().scale(7));
      this.muzzle.fillStyle(0xf0dfb6, 0.96);
      this.muzzle.fillTriangle(
        flash.x + a.x * 14,
        flash.y + a.y * 14,
        flash.x - a.y * 8,
        flash.y + a.x * 8,
        flash.x + a.y * 8,
        flash.y - a.x * 8,
      );
      this.muzzle.fillStyle(0xd66a3d, 0.9).fillCircle(flash.x, flash.y, 4);
    }
  }
}
