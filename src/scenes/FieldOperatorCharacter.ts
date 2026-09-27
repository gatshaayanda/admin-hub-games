import Phaser from 'phaser';

export type FieldOperatorDirection = 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';

/**
 * Wardrobe's first Shooter character uses the exact geometric presentation
 * established by Shooters Trigger Arena/Training.
 *
 * Wardrobe changes the presentation container around this baseline; it does
 * not invent a second character style or a different weapon mount.
 */
export class FieldOperatorCharacter {
  private readonly container: Phaser.GameObjects.Container;
  private readonly poseA: Phaser.GameObjects.Graphics;
  private readonly poseB: Phaser.GameObjects.Graphics;
  private readonly arms: Phaser.GameObjects.Graphics;
  private readonly weapon: Phaser.GameObjects.Graphics;
  private readonly muzzle: Phaser.GameObjects.Graphics;
  private walkClock = 0;
  private recoil = 0;
  private visible = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y).setDepth(31);

    const makePose = (legOffset: number, bob: number) => {
      const g = scene.add.graphics();

      g.fillStyle(0x3b2f28, 1).fillEllipse(0, -20 + bob, 24, 18);
      g.fillStyle(0xd8a66b, 1).fillEllipse(0, -17 + bob, 13, 12);
      g.fillStyle(0xd4a45d, 1)
        .fillCircle(-7, -17 + bob, 2.5)
        .fillCircle(7, -17 + bob, 2.5);
      g.fillStyle(0x2f6b4e, 1).fillEllipse(0, -23 + bob, 25, 12);
      g.fillStyle(0x111715, 1).fillRoundedRect(-13, -17 + bob, 26, 10, 4);
      g.fillStyle(0x9bb9b1, 0.88).fillRoundedRect(-9, -15 + bob, 18, 6, 2);
      g.lineStyle(1, 0xe8f2dc, 0.42).strokeRoundedRect(-9, -15 + bob, 18, 6, 2);
      g.fillStyle(0xd4a45d, 1).fillRoundedRect(-4, -8 + bob, 8, 7, 2);
      g.fillStyle(0x2f6b4e, 1).fillRoundedRect(-15, -4 + bob, 30, 22, 8);
      g.fillStyle(0x4f8b65, 1).fillRoundedRect(-10, -1 + bob, 20, 14, 4);
      g.fillStyle(0x17201c, 0.9)
        .fillRoundedRect(-15, 0 + bob, 6, 13, 2)
        .fillRoundedRect(9, 0 + bob, 6, 13, 2);
      g.fillStyle(0xc1a86c, 1).fillRect(-10, 8 + bob, 20, 4);
      g.fillStyle(0x1d2923, 1).fillRect(-12, 12 + bob, 24, 5);
      g.fillStyle(0x5e4936, 1)
        .fillRoundedRect(-15, 8 + bob, 5, 8, 2)
        .fillRoundedRect(10, 8 + bob, 5, 8, 2);
      g.fillStyle(0x29372f, 1).fillRoundedRect(-11, 16 + bob, 22, 7, 3);
      g.fillStyle(0x566052, 1)
        .fillRoundedRect(-10 + legOffset, 20 + bob, 8, 13, 2)
        .fillRoundedRect(2 - legOffset, 20 + bob, 8, 13, 2);
      g.fillStyle(0x202522, 1)
        .fillRoundedRect(-12 + legOffset, 30 + bob, 10, 7, 2)
        .fillRoundedRect(2 - legOffset, 30 + bob, 10, 7, 2);
      return g;
    };

    this.poseA = makePose(0, 0);
    this.poseB = makePose(2, 1).setVisible(false);
    this.arms = scene.add.graphics();
    this.weapon = scene.add.graphics();
    this.muzzle = scene.add.graphics();
    this.container.add([this.poseA, this.poseB, this.arms, this.weapon, this.muzzle]);

    this.update('DOWN', new Phaser.Math.Vector2(1, 0), false, false, 0);
  }

  get gameObject() {
    return this.container;
  }

  setVisible(value: boolean) {
    this.visible = value;
    this.container.setVisible(value);
  }

  update(
    _direction: FieldOperatorDirection,
    aim: Phaser.Math.Vector2,
    walking: boolean,
    firing: boolean,
    delta: number,
  ) {
    if (!this.visible) return;

    if (walking) this.walkClock += delta;
    this.recoil = Math.max(0, this.recoil - delta);

    const bob = walking ? Math.sin(this.walkClock / 85) * 1 : 0;
    this.poseA.setVisible(!walking || Math.floor(this.walkClock / 85) % 2 === 0);
    this.poseB.setVisible(walking && !this.poseA.visible);

    const normalizedAim = aim.clone().normalize();
    this.updateWeaponPose(normalizedAim, firing);
    this.poseA.setY(bob);
    this.poseB.setY(bob);
  }

  triggerRecoil() {
    this.recoil = 85;
  }

  getMuzzlePosition(aim: Phaser.Math.Vector2) {
    const a = aim.clone().normalize();
    return new Phaser.Math.Vector2(
      this.container.x + a.x * 42,
      this.container.y + a.y * 3,
    );
  }

  destroy() {
    this.container.destroy(true);
  }

  private updateWeaponPose(aim: Phaser.Math.Vector2, firing: boolean) {
    const angle = Math.atan2(aim.y, aim.x);

    this.arms.setRotation(angle).setPosition(0, 0);
    this.arms.clear();
    this.arms.lineStyle(5, 0x314b3c, 1);
    this.arms.lineBetween(-8, 5, 5, 2);
    this.arms.lineBetween(8, 5, 12, 4);
    this.arms.fillStyle(0xd4a45d, 1)
      .fillCircle(5, 2, 3)
      .fillCircle(12, 4, 3);

    this.weapon.setRotation(angle).setPosition(5, 3);
    this.weapon.clear();
    this.weapon.lineStyle(3, 0x6c806f, 1).lineBetween(10, 5, 2, 12);
    this.weapon.fillStyle(0x151b18, 1).fillEllipse(13, -8, 9, 7);
    this.weapon.fillStyle(0x33423b, 1).fillRoundedRect(7, -4, 18, 9, 3);
    this.weapon.fillStyle(0x111715, 1).fillRect(22, -2, 15, 5);
    this.weapon.fillStyle(0x53635c, 1).fillRect(12, -9, 8, 4);
    this.weapon.fillStyle(0x171d1b, 1).fillRoundedRect(11, 4, 5, 10, 2);
    this.weapon.fillStyle(0x493b31, 1).fillRoundedRect(-5, 4, 10, 5, 2);
    this.weapon.lineStyle(3, 0x2a332f, 1).lineBetween(-2, 6, 8, 5);
    this.weapon.lineStyle(1, 0xe8c95c, 0.45).lineBetween(35, 0, 45, 0);

    this.muzzle.clear();
    this.muzzle.setRotation(angle).setPosition(42, 0);
    this.muzzle.fillStyle(0xf0dfb6, firing || this.recoil > 0 ? 0.72 : 0);
    this.muzzle.fillCircle(0, 0, 3);
  }
}