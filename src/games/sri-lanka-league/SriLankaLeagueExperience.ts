import * as THREE from 'three';
import { BALL_RADIUS, GOAL_LINE, applyDribbleContact, cameraRelativeMove, createFootballBall, stepFootballBall, type FootballBall } from './physics';

type PersonRig = { root: THREE.Group; leftArm: THREE.Group; rightArm: THREE.Group; leftLeg: THREE.Group; rightLeg: THREE.Group };
type Spectator = { rig: PersonRig; phase: number; wave: number };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const ease = (speed: number, dt: number) => 1 - Math.exp(-speed * dt);
const toon = (color: string) => new THREE.MeshToonMaterial({ color, flatShading: false });

function box(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], material: THREE.Material, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makePerson(shirt: string, shorts: string, skin: string, hair: string): PersonRig {
  const root = new THREE.Group();
  const shirtMat = toon(shirt);
  const shortsMat = toon(shorts);
  const skinMat = toon(skin);
  const hairMat = toon(hair);
  const shoeMat = toon('#252a31');

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.43, 5, 16), shirtMat);
  torso.position.y = 1.13;
  torso.scale.set(1, 1, 0.72);
  torso.castShadow = true;
  root.add(torso);

  const shortsMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), shortsMat);
  shortsMesh.position.y = 0.61;
  shortsMesh.scale.set(1, 0.62, 0.72);
  shortsMesh.castShadow = true;
  root.add(shortsMesh);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.255, 24, 18), skinMat);
  head.position.y = 1.78;
  head.scale.set(0.92, 1.08, 0.94);
  head.castShadow = true;
  root.add(head);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.263, 24, 16), hairMat);
  hairCap.position.set(0, 1.91, -0.015);
  hairCap.scale.set(1, 0.48, 1);
  hairCap.castShadow = true;
  root.add(hairCap);

  const eyeMat = new THREE.MeshBasicMaterial({ color: '#201914' });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.027, 8, 6), eyeMat);
    eye.position.set(side * 0.085, 1.79, -0.226);
    root.add(eye);
  }

  const makeLimb = (side: number, arm: boolean) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * (arm ? 0.39 : 0.19), arm ? 1.42 : 0.62, 0);
    const length = 0.58;
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(arm ? 0.105 : 0.13, 0.36, 4, 12), skinMat);
    limb.position.y = -0.28;
    limb.castShadow = true;
    pivot.add(limb);
    if (arm) {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 10), skinMat);
      hand.position.y = -0.55;
      pivot.add(hand);
    } else {
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 10), shoeMat);
      shoe.scale.set(1, 0.48, 1.35);
      shoe.position.set(0, -0.55, 0.075);
      shoe.castShadow = true;
      pivot.add(shoe);
    }
    root.add(pivot);
    return pivot;
  };

  return {
    root,
    leftArm: makeLimb(-1, true),
    rightArm: makeLimb(1, true),
    leftLeg: makeLimb(-1, false),
    rightLeg: makeLimb(1, false),
  };
}

export class SriLankaLeagueExperience {
  private host: HTMLElement;
  private root: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private player: PersonRig;
  private playerVelocity = new THREE.Vector3();
  private ball: FootballBall = createFootballBall();
  private ballVisual: THREE.Group;
  private spectators: Spectator[] = [];
  private controls = { x: 0, forward: 0, sprint: false };
  private keys = new Set<string>();
  private score = 0;
  private paused = false;
  private finished = false;
  private disposed = false;
  private lastFrame = 0;
  private raf = 0;
  private goalTimer = 0;
  private kickPose = 0;
  private trickPose = 0;
  private trickCooldown = 0;
  private stickPointerId: number | null = null;
  private toastTimer = 0;
  private winTimer = 0;
  private stick?: HTMLDivElement;
  private stickKnob?: HTMLSpanElement;
  private onExit: () => void;

  private onResize = () => {
    const width = Math.max(1, this.root.clientWidth);
    const height = Math.max(1, this.root.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  private onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(key)) event.preventDefault();
    if ((key === 'escape' || key === 'p') && !event.repeat) {
      this.toggleMenu();
      return;
    }
    if (key === ' ' && !event.repeat) {
      this.kickBall();
      return;
    }
    if (!this.paused) this.keys.add(key);
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
  };

  private onBlur = () => {
    this.keys.clear();
    this.controls.x = 0;
    this.controls.forward = 0;
    this.controls.sprint = false;
    this.resetStick();
  };

  constructor(host: HTMLElement, onExit: () => void) {
    this.host = host;
    this.onExit = onExit;
    this.root = document.createElement('div');
    this.root.className = 'sll-world';
    this.host.appendChild(this.root);

    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      this.root.style.cssText = 'position:fixed;inset:0;z-index:40;display:grid;place-items:center;padding:28px;background:#30271f;color:#fff8e9;text-align:center;font:700 14px Arial';
      this.root.innerHTML = '<div><strong>3D FOOTBALL NEEDS WEBGL</strong><p>Try the latest version of Chrome or another WebGL-enabled browser.</p></div>';
      this.renderer = null as unknown as THREE.WebGLRenderer;
      this.scene = null as unknown as THREE.Scene;
      this.camera = null as unknown as THREE.PerspectiveCamera;
      this.player = makePerson('#2677b8', '#172f55', '#8d573b', '#211811');
      this.ballVisual = new THREE.Group();
      return;
    }

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight), false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.root.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f2b879');
    this.scene.fog = new THREE.Fog('#f2b879', 34, 78);
    this.camera = new THREE.PerspectiveCamera(58, Math.max(1, host.clientWidth) / Math.max(1, host.clientHeight), 0.1, 140);

    this.buildWorld();
    this.player = makePerson('#2677b8', '#172f55', '#8d573b', '#211811');
    this.player.root.position.set(0, 0, 5);
    this.scene.add(this.player.root);
    this.ballVisual = this.makeBall();
    this.scene.add(this.ballVisual);
    this.resetBall();
    // Start at the settled chase-camera position so the first rendered frame does not snap in from the origin.
    this.camera.position.set(0, 4.8, 13.4);
    this.camera.lookAt(0, 1.15, 1.7);

    this.buildInterface();
    this.onResize();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.startLoop();
    this.setToast('SRI LANKA LEAGUE · FIRST TO 3 GOALS', 2600);
  }

  private buildWorld() {
    const skyFill = new THREE.HemisphereLight('#fff1d5', '#8a633e', 2.1);
    this.scene.add(skyFill);
    const sun = new THREE.DirectionalLight('#fff0cf', 2.6);
    sun.position.set(-16, 24, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    this.scene.add(sun);

    const earth = new THREE.Mesh(new THREE.PlaneGeometry(82, 82), toon('#bd8954'));
    earth.rotation.x = -Math.PI / 2;
    earth.receiveShadow = true;
    this.scene.add(earth);

    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(28, 36), toon('#a77b4a'));
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0.012;
    pitch.receiveShadow = true;
    this.scene.add(pitch);

    const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 58), toon('#56504a'));
    road.rotation.x = -Math.PI / 2;
    road.position.set(16.6, 0.02, 0);
    road.receiveShadow = true;
    this.scene.add(road);
    for (let z = -25; z <= 25; z += 5) {
      box(this.scene, [0.12, 0.025, 2.1], [16.6, 0.04, z], toon('#e7d8b6'), false);
    }

    const grass = toon('#718d4d');
    for (let i = 0; i < 46; i += 1) {
      const x = ((i * 37) % 31) - 15.5;
      const z = ((i * 19) % 43) - 21.5;
      const patch = new THREE.Mesh(new THREE.CircleGeometry(0.25 + (i % 4) * 0.12, 7), grass);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(x, 0.028, z);
      patch.scale.set(1.2 + (i % 3) * 0.3, 0.7 + (i % 2) * 0.2, 1);
      this.scene.add(patch);
    }

    const chalk = toon('#e8d7b1');
    box(this.scene, [0.09, 0.025, 34], [-13.8, 0.035, 0], chalk, false);
    box(this.scene, [0.09, 0.025, 34], [13.8, 0.035, 0], chalk, false);
    box(this.scene, [27.6, 0.025, 0.09], [0, 0.035, -17], chalk, false);
    box(this.scene, [27.6, 0.025, 0.09], [0, 0.035, 17], chalk, false);
    box(this.scene, [27.6, 0.02, 0.055], [0, 0.032, 0], chalk, false);
    const centreCircle = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.035, 6, 48), chalk);
    centreCircle.rotation.x = Math.PI / 2;
    centreCircle.position.y = 0.04;
    this.scene.add(centreCircle);

    this.buildGoal();
    this.buildStreet();
  }

  private buildGoal() {
    const brick = toon('#a84f37');
    for (const x of [-3.2, 3.2]) {
      box(this.scene, [0.62, 0.44, 0.48], [x, 0.22, GOAL_LINE], brick);
    }
    // The two real brick markers are the whole goal: no net, frame or crossbar.
    box(this.scene, [6.4, 0.025, 0.07], [0, 0.035, GOAL_LINE], toon('#ead9b8'), false);
  }

  private buildStreet() {
    const wallMaterials = ['#d6ad79', '#d6c29a', '#b98563', '#d8c49b'];
    for (let i = 0; i < 4; i += 1) {
      this.buildHouse(-22, -15 + i * 10, wallMaterials[i]);
      this.buildHouse(25, -10 + i * 10, wallMaterials[(i + 2) % wallMaterials.length]);
    }

    const poleMat = toon('#5b5145');
    const wireMat = new THREE.MeshBasicMaterial({ color: '#3b3834' });
    for (const z of [-19, -2, 15]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 7, 7), poleMat);
      pole.position.set(12.4, 3.5, z);
      pole.castShadow = true;
      this.scene.add(pole);
      box(this.scene, [1.5, 0.16, 0.16], [12.4, 6.5, z], poleMat);
    }
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 42, 5), wireMat);
    wire.rotation.x = Math.PI / 2;
    wire.position.set(12.4, 6.8, 0);
    this.scene.add(wire);

    this.buildTree(-15.5, -14);
    this.buildTree(-15.5, 12);
    this.buildTree(10.8, 18);
    this.buildTuckshop();

    const crowdPositions: Array<[number, number, number]> = [
      [-14.7, 0, -5], [-14.7, 0, 3], [14.7, 0, -7], [14.7, 0, 2], [-7.5, 0, 19], [6.5, 0, 19],
    ];
    const shirts = ['#e6b84e', '#e6e4dc', '#4b8b5d', '#b95e49', '#5578a8', '#e0d0ae'];
    const skins = ['#8d573b', '#70432f', '#9d6948', '#b17a53', '#70432f', '#8b5a42'];
    crowdPositions.forEach((position, index) => {
      const rig = makePerson(shirts[index], '#45433d', skins[index], '#241b16');
      rig.root.position.set(position[0], position[1], position[2]);
      rig.root.rotation.y = index % 2 ? -Math.PI / 2 : Math.PI / 2;
      this.scene.add(rig.root);
      this.spectators.push({ rig, phase: index * 1.7, wave: index % 2 ? 1 : -1 });
    });
  }

  private buildHouse(x: number, z: number, wallColor: string) {
    const wall = toon(wallColor);
    const roof = toon('#65615b');
    const trim = toon('#f1d7a9');
    const door = toon('#594438');
    const window = toon('#7eb6bd');
    box(this.scene, [6.4, 3.1, 5.5], [x, 1.55, z], wall);
    box(this.scene, [6.8, 0.28, 5.9], [x, 3.18, z], roof);
    for (let rib = -2; rib <= 2; rib += 1) {
      box(this.scene, [0.09, 0.035, 5.8], [x + rib * 1.15, 3.34, z], toon('#858078'), false);
    }
    box(this.scene, [0.95, 1.9, 0.12], [x, 0.98, z + 2.81], door);
    for (const side of [-1, 1]) {
      box(this.scene, [1.05, 0.86, 0.12], [x + side * 1.85, 1.95, z + 2.82], window);
      box(this.scene, [1.2, 0.1, 0.18], [x + side * 1.85, 2.43, z + 2.83], trim);
      box(this.scene, [0.1, 0.95, 0.18], [x + side * 1.85, 1.95, z + 2.83], trim);
    }
  }

  private buildTree(x: number, z: number) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 3.4, 7), toon('#73523a'));
    trunk.position.set(x, 1.7, z);
    trunk.castShadow = true;
    this.scene.add(trunk);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.0, 9, 7), toon('#66834a'));
    canopy.position.set(x, 3.5, z);
    canopy.scale.set(1.35, 0.62, 1);
    canopy.castShadow = true;
    this.scene.add(canopy);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.35, 8, 6), toon('#78944f'));
    crown.position.set(x + 0.9, 3.7, z - 0.3);
    crown.scale.set(1.1, 0.7, 0.9);
    this.scene.add(crown);
  }

  private buildTuckshop() {
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const context = signCanvas.getContext('2d');
    if (context) {
      context.fillStyle = '#f0d08b';
      context.fillRect(0, 0, 512, 128);
      context.fillStyle = '#3c4a32';
      context.font = 'bold 62px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('TUCKSHOP', 256, 66);
    }
    const signTexture = new THREE.CanvasTexture(signCanvas);
    signTexture.colorSpace = THREE.SRGBColorSpace;
    const signMaterial = new THREE.MeshBasicMaterial({ map: signTexture });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.7, 0.16), signMaterial);
    sign.position.set(23.2, 3.9, -13);
    this.scene.add(sign);
  }

  private makeBall() {
    const root = new THREE.Group();
    const white = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 18, 14), toon('#f4f0e6'));
    white.castShadow = true;
    root.add(white);
    const black = toon('#242a30');
    const spots: Array<[number, number, number]> = [
      [0, 1, 0], [0.85, 0.3, 0.35], [-0.8, -0.25, 0.48],
      [0.1, -0.75, -0.65], [0.65, -0.3, -0.7], [-0.45, 0.55, -0.7],
    ];
    for (const direction of spots) {
      const normal = new THREE.Vector3(direction[0], direction[1], direction[2]).normalize();
      const patch = new THREE.Mesh(new THREE.SphereGeometry(0.052, 7, 5), black);
      patch.position.copy(normal.multiplyScalar(BALL_RADIUS - 0.018));
      root.add(patch);
    }
    return root;
  }

  private buildInterface() {
    const style = document.createElement('style');
    style.textContent = '.sll-world{position:fixed;inset:0;z-index:40;overflow:hidden;background:#d9a56d;color:#fff8e9;font-family:Arial,sans-serif;touch-action:none;isolation:isolate}.sll-world canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}.sll-top{position:absolute;top:max(10px,env(safe-area-inset-top));left:10px;right:10px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;pointer-events:none}.sll-card{padding:10px 12px;border:1px solid #fff2d66b;border-radius:14px;background:#34271de8;box-shadow:0 5px 18px #38241440;backdrop-filter:blur(8px)}.sll-brand{font-size:clamp(11px,2.6vw,15px);font-weight:900;letter-spacing:.11em}.sll-sub{margin-top:4px;color:#f2d9b1;font-size:9px;letter-spacing:.08em}.sll-score{text-align:center;min-width:102px;font:900 20px/1 monospace}.sll-score small{display:block;margin-top:5px;color:#f2d9b1;font-size:8px;letter-spacing:.12em}.sll-menu-button{pointer-events:auto;min-width:44px;min-height:44px;border:1px solid #fff2d688;border-radius:12px;background:#34271de8;color:#fff8e9;font-weight:900}.sll-stick{position:absolute;left:max(12px,env(safe-area-inset-left));bottom:max(14px,env(safe-area-inset-bottom));width:104px;height:104px;border:2px solid #fff0d5a8;border-radius:50%;background:#34271d9c;touch-action:none;z-index:5}.sll-stick:after{content:\"\";position:absolute;inset:16%;border:1px solid #fff3d655;border-radius:50%}.sll-stick-knob{position:absolute;left:50%;top:50%;width:42px;height:42px;margin:-21px 0 0 -21px;border:2px solid #fff6e4;border-radius:50%;background:#e5b75f;box-shadow:0 4px 0 #392b20;pointer-events:none;transform:translate3d(0,0,0)}.sll-actions{position:absolute;right:max(12px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));display:flex;align-items:flex-end;gap:10px;z-index:5}.sll-action{min-width:70px;min-height:70px;padding:8px;border:2px solid #fff0d5;border-radius:50%;background:#34271de8;color:#fff8e9;font:900 10px/1.1 monospace;box-shadow:0 5px 0 #392b20a8;touch-action:manipulation}.sll-action:active,.sll-action.is-pressed{transform:translateY(3px);box-shadow:0 2px 0 #392b20a8}.sll-tricks{min-width:62px;min-height:62px;background:#77512e;border-color:#f0c879}.sll-menu,.sll-win{position:absolute;inset:0;z-index:10;display:grid;place-items:center;padding:20px;background:#17130ed9}.sll-menu[hidden],.sll-win[hidden]{display:none}.sll-panel{width:min(92vw,420px);padding:26px;border:1px solid #e7c88777;border-radius:18px;background:#2d261f;color:#fff8e9;text-align:center;box-shadow:0 20px 70px #0008}.sll-panel h2{margin:0 0 10px;font-size:clamp(26px,7vw,38px);letter-spacing:-.04em}.sll-panel p{color:#e9d4b5;font-size:14px;line-height:1.6}.sll-panel button{display:block;width:100%;min-height:48px;margin-top:10px;border:1px solid #e7c887;border-radius:10px;background:#e7c887;color:#2d261f;font:900 11px monospace;letter-spacing:.08em}.sll-panel button.secondary{background:transparent;color:#fff8e9}.sll-fallback{position:absolute;inset:0;display:grid;align-content:center;justify-items:center;gap:12px;padding:28px;background:#30271f;text-align:center;color:#fff8e9}.sll-fallback span{max-width:320px;color:#e9d4b5;line-height:1.5}.sll-toast{position:absolute;left:50%;top:calc(82px + env(safe-area-inset-top));z-index:7;transform:translate(-50%,-8px);opacity:0;max-width:88vw;padding:10px 15px;border:1px solid #fff2d677;border-radius:999px;background:#34271de8;color:#fff8e9;font:900 10px monospace;letter-spacing:.08em;text-align:center;transition:opacity .18s,transform .18s;pointer-events:none}.sll-toast.is-visible{opacity:1;transform:translate(-50%,0)}@media(max-width:390px){.sll-stick{width:88px;height:88px}.sll-stick-knob{width:36px;height:36px;margin:-18px 0 0 -18px}.sll-action{min-width:62px;min-height:62px;font-size:9px}.sll-score{min-width:88px;font-size:17px}.sll-card{padding:8px 9px}}@media(max-height:430px) and (orientation:landscape){.sll-stick{width:72px;height:72px;bottom:8px}.sll-stick-knob{width:32px;height:32px;margin:-16px 0 0 -16px}.sll-action{min-width:56px;min-height:56px}.sll-actions{bottom:8px}.sll-top{top:6px}}';
    this.root.appendChild(style);
    this.root.insertAdjacentHTML('beforeend', '<div class="sll-top"><div class="sll-card"><div class="sll-brand">SRI LANKA LEAGUE</div><div class="sll-sub">BOTSWANA STREET FOOTBALL</div></div><div class="sll-card sll-score"><span id="sll-score">0 / 3</span><small>FIRST TO 3</small></div><button class="sll-menu-button" type="button" aria-label="Open match menu">Ⅱ</button></div><div class="sll-stick" aria-label="Movement joystick"><span class="sll-stick-knob"></span></div><div class="sll-actions"><button class="sll-action sll-sprint" type="button">RUN</button><button class="sll-action sll-tricks" type="button">TRICKS</button><button class="sll-action sll-kick" type="button">KICK</button></div><div class="sll-menu" hidden><div class="sll-panel"><h2>PAUSED</h2><p>Take a breather, Sri Lanka. The street is waiting.</p><button data-action="resume">RESUME MATCH</button><button class="secondary" data-action="restart">RESTART MATCH</button><button class="secondary" data-action="exit">RETURN TO GAME LIBRARY</button></div></div><div class="sll-win" hidden><div class="sll-panel"><h2>CHAMPION!</h2><p id="sll-win-copy">Sri Lanka wins the street challenge.</p><button data-action="again">PLAY AGAIN</button><button class="secondary" data-action="exit">RETURN TO GAME LIBRARY</button></div></div><div class="sll-toast" role="status"></div>');
    this.stick = this.root.querySelector<HTMLDivElement>('.sll-stick') ?? undefined;
    this.stickKnob = this.root.querySelector<HTMLSpanElement>('.sll-stick-knob') ?? undefined;

    this.stick?.addEventListener('pointerdown', this.onStickDown);
    this.stick?.addEventListener('pointermove', this.onStickMove);
    this.stick?.addEventListener('pointerup', this.onStickUp);
    this.stick?.addEventListener('lostpointercapture', this.onStickUp);
    this.stick?.addEventListener('pointercancel', this.onStickUp);
    this.root.querySelector<HTMLButtonElement>('.sll-menu-button')?.addEventListener('click', () => this.toggleMenu());
    this.root.querySelector<HTMLButtonElement>('.sll-tricks')?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.performTrick();
    });
    this.root.querySelector<HTMLButtonElement>('.sll-kick')?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.kickBall();
    });
    const sprint = this.root.querySelector<HTMLButtonElement>('.sll-sprint');
    sprint?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      sprint.setPointerCapture(event.pointerId);
      this.controls.sprint = true;
      sprint.classList.add('is-pressed');
    });
    const releaseSprint = () => {
      this.controls.sprint = false;
      sprint?.classList.remove('is-pressed');
    };
    sprint?.addEventListener('pointerup', releaseSprint);
    sprint?.addEventListener('pointercancel', releaseSprint);
    sprint?.addEventListener('lostpointercapture', releaseSprint);

    this.root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'resume') this.setPaused(false);
        if (action === 'restart' || action === 'again') this.resetMatch();
        if (action === 'exit') this.onExit();
      });
    });
  }

  private onStickDown = (event: PointerEvent) => {
    event.preventDefault();
    if (this.stickPointerId !== null) return;
    this.stickPointerId = event.pointerId;
    this.stick?.setPointerCapture(event.pointerId);
    this.moveStick(event);
  };

  private onStickMove = (event: PointerEvent) => {
    if (this.stickPointerId === event.pointerId && this.stick?.hasPointerCapture(event.pointerId)) this.moveStick(event);
  };

  private onStickUp = (event?: PointerEvent) => {
    if (event && this.stickPointerId !== event.pointerId) return;
    this.stickPointerId = null;
    this.resetStick();
  };

  private moveStick(event: PointerEvent) {
    if (!this.stick || !this.stickKnob) return;
    const rect = this.stick.getBoundingClientRect();
    const maxX = Math.max(1, rect.width / 2 - this.stickKnob.offsetWidth / 2 - 5);
    const maxY = Math.max(1, rect.height / 2 - this.stickKnob.offsetHeight / 2 - 5);
    const rawX = (event.clientX - rect.left - rect.width / 2) / maxX;
    const rawY = (event.clientY - rect.top - rect.height / 2) / maxY;
    const magnitude = Math.hypot(rawX, rawY);
    const active = magnitude < 0.1 ? 0 : Math.min(1, (magnitude - 0.1) / 0.9);
    const scale = magnitude > 0.001 ? active / magnitude : 0;
    this.controls.x = rawX * scale;
    this.controls.forward = -rawY * scale;
    this.stickKnob.style.transform = 'translate3d(' + (this.controls.x * maxX) + 'px,' + (-this.controls.forward * maxY) + 'px,0)';
  }

  private resetStick() {
    this.controls.x = 0;
    this.controls.forward = 0;
    this.stickPointerId = null;
    if (this.stickKnob) this.stickKnob.style.transform = 'translate3d(0,0,0)';
  }

  private kickBall() {
    if (this.paused || this.finished || this.goalTimer > 0) return;
    const playerPosition = this.player.root.position;
    const dx = this.ball.x - playerPosition.x;
    const dz = this.ball.z - playerPosition.z;
    const distance = Math.hypot(dx, dz);
    if (distance > 3.25 || this.ball.y > 2.0) {
      this.setToast('GET CLOSER TO THE BALL');
      return;
    }
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.root.rotation.y);
    const toBall = new THREE.Vector3(dx, 0, dz).normalize();
    const direction = forward.multiplyScalar(0.7).add(toBall.multiplyScalar(0.3)).normalize();
    const runPower = this.controls.sprint || this.keys.has('shift') ? 2.1 : 0;
    const runSpeed = Math.min(2.4, this.playerVelocity.length() * 0.35);
    this.ball.vx += direction.x * (12.5 + runPower + runSpeed);
    this.ball.vz += direction.z * (12.5 + runPower + runSpeed);
    this.ball.vy = Math.max(this.ball.vy, 2.0 + runPower * 0.35);
    this.kickPose = 0.34;
    this.setToast('NICE KICK!');
  }

  private performTrick() {
    if (this.paused || this.finished || this.goalTimer > 0 || this.trickCooldown > 0) return;
    this.trickPose = 0.62;
    this.trickCooldown = 0.85;
    const playerPosition = this.player.root.position;
    const dx = this.ball.x - playerPosition.x;
    const dz = this.ball.z - playerPosition.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 3.25 && this.ball.y < 2) {
      const yaw = this.player.root.rotation.y;
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      const side = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      const sideSign = Math.sign(dx * side.x + dz * side.z) || 1;
      this.ball.vx += forward.x * 8.2 + side.x * sideSign * 2.8;
      this.ball.vz += forward.z * 8.2 + side.z * sideSign * 2.8;
      this.ball.vy = Math.max(this.ball.vy, 2.8);
      this.setToast('SKILL MOVE! TOE FLICK');
    } else {
      this.setToast('STEP-OVER! GET TO THE BALL');
    }
  }

  private setPaused(paused: boolean) {
    this.paused = paused;
    const menu = this.root.querySelector<HTMLDivElement>('.sll-menu');
    if (menu) menu.hidden = !paused;
    if (paused) {
      this.controls.sprint = false;
      this.keys.clear();
      this.resetStick();
    }
  }

  private toggleMenu() {
    if (this.finished) return;
    this.setPaused(!this.paused);
  }

  private resetBall() {
    this.ball = createFootballBall(0, BALL_RADIUS, 3);
    this.ballVisual.position.set(this.ball.x, this.ball.y, this.ball.z);
  }

  private resetMatch() {
    this.score = 0;
    this.finished = false;
    this.goalTimer = 0;
    this.paused = false;
    if (this.winTimer) window.clearTimeout(this.winTimer);
    this.player.root.position.set(0, 0, 5);
    this.player.root.rotation.y = 0;
    this.playerVelocity.set(0, 0, 0);
    this.kickPose = 0;
    this.trickPose = 0;
    this.trickCooldown = 0;
    this.keys.clear();
    this.controls.sprint = false;
    this.resetBall();
    const menu = this.root.querySelector<HTMLDivElement>('.sll-menu');
    const win = this.root.querySelector<HTMLDivElement>('.sll-win');
    if (menu) menu.hidden = true;
    if (win) win.hidden = true;
    this.updateScore();
    this.setToast('NEW MATCH · FIRST TO 3');
  }

  private updateScore() {
    const score = this.root.querySelector<HTMLElement>('#sll-score');
    if (score) score.textContent = this.score + ' / 3';
  }

  private scoreGoal() {
    this.score += 1;
    this.updateScore();
    this.setToast('GOAL! ' + this.score + ' / 3', 1700);
    this.goalTimer = 1.35;
    if (this.score >= 3) {
      this.finished = true;
      this.paused = true;
      this.winTimer = window.setTimeout(() => {
        const win = this.root.querySelector<HTMLDivElement>('.sll-win');
        const copy = this.root.querySelector<HTMLElement>('#sll-win-copy');
        if (copy) copy.textContent = 'Sri Lanka wins ' + this.score + ' - 0. Happy birthday, champion!';
        if (win) win.hidden = false;
      }, 700);
    }
  }

  private setToast(message: string, duration = 1200) {
    const toast = this.root.querySelector<HTMLElement>('.sll-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), duration);
  }

  private update(dt: number, elapsed: number) {
    if (!this.paused && !this.finished) {
      const keyX = (this.keys.has('d') || this.keys.has('arrowright') ? 1 : 0) - (this.keys.has('a') || this.keys.has('arrowleft') ? 1 : 0);
      const keyForward = (this.keys.has('w') || this.keys.has('arrowup') ? 1 : 0) - (this.keys.has('s') || this.keys.has('arrowdown') ? 1 : 0);
      let moveX = this.controls.x + keyX;
      let moveForward = this.controls.forward + keyForward;
      const magnitude = Math.hypot(moveX, moveForward);
      if (magnitude > 1) {
        moveX /= magnitude;
        moveForward /= magnitude;
      }
      const sprinting = this.controls.sprint || this.keys.has('shift');
      const maxSpeed = sprinting ? 8.2 : 5.1;
      // Keep the control frame fixed to the street/camera view. Do not derive it from the
      // camera's interpolated rotation: that creates a player→camera→input feedback loop.
      const worldMove = cameraRelativeMove(moveX, moveForward, 0, -1);
      const targetX = worldMove.x * maxSpeed;
      const targetZ = worldMove.z * maxSpeed;
      this.playerVelocity.x += (targetX - this.playerVelocity.x) * ease(11, dt);
      this.playerVelocity.z += (targetZ - this.playerVelocity.z) * ease(11, dt);
      if (magnitude < 0.05) {
        this.playerVelocity.multiplyScalar(Math.exp(-7.5 * dt));
        if (this.playerVelocity.length() < 0.035) this.playerVelocity.set(0, 0, 0);
      }

      this.player.root.position.x += this.playerVelocity.x * dt;
      this.player.root.position.z += this.playerVelocity.z * dt;
      this.player.root.position.x = clamp(this.player.root.position.x, -17.2, 17.2);
      this.player.root.position.z = clamp(this.player.root.position.z, -20.4, 21.4);
      for (const postX of [-3.2, 3.2]) {
        const postDx = this.player.root.position.x - postX;
        const postDz = this.player.root.position.z - GOAL_LINE;
        if (Math.abs(postDx) < 0.72 && Math.abs(postDz) < 0.72) {
          if (Math.abs(postDx) < Math.abs(postDz)) {
            this.player.root.position.x = postX + Math.sign(postDx || 1) * 0.72;
            this.playerVelocity.x = 0;
          } else {
            this.player.root.position.z = GOAL_LINE + Math.sign(postDz || 1) * 0.72;
            this.playerVelocity.z = 0;
          }
        }
      }
      if (this.playerVelocity.length() > 0.18) {
        this.player.root.rotation.y = Math.atan2(this.playerVelocity.x, -this.playerVelocity.z);
      }

      const stride = Math.min(1, this.playerVelocity.length() / 5.5);
      const swing = Math.sin(elapsed * (sprinting ? 12 : 9)) * stride * 0.68;
      this.kickPose = Math.max(0, this.kickPose - dt);
      this.trickPose = Math.max(0, this.trickPose - dt);
      this.trickCooldown = Math.max(0, this.trickCooldown - dt);
      this.player.leftLeg.rotation.x = swing;
      this.player.rightLeg.rotation.x = -swing - (this.kickPose / 0.34) * 0.95;
      this.player.leftLeg.rotation.z = Math.sin(elapsed * 22) * (this.trickPose / 0.62) * 0.58;
      this.player.rightLeg.rotation.z = -Math.sin(elapsed * 22) * (this.trickPose / 0.62) * 0.58;
      this.player.leftArm.rotation.x = -swing * 0.65;
      this.player.rightArm.rotation.x = swing * 0.65;

      const goal = stepFootballBall(this.ball, dt);
      if (goal && this.goalTimer <= 0) this.scoreGoal();

      applyDribbleContact(
        this.ball,
        this.player.root.position.x,
        this.player.root.position.z,
        this.playerVelocity.x,
        this.playerVelocity.z,
        this.player.root.rotation.y,
        dt,
      );

      if (this.goalTimer > 0) {
        this.goalTimer -= dt;
        if (this.goalTimer <= 0 && !this.finished) {
          this.player.root.position.set(0, 0, 5);
          this.playerVelocity.set(0, 0, 0);
          this.resetBall();
        }
      }
    }

    // Stable third-person view: follow the player across the pitch, but never orbit
    // around their instantaneous facing direction. This removes camera/input oscillation.
    const cameraPosition = this.player.root.position.clone().add(new THREE.Vector3(0, 4.8, 8.4));
    this.camera.position.lerp(cameraPosition, ease(7.5, dt));
    // Keep the viewing direction fixed relative to the camera itself; only its position follows.
    this.camera.lookAt(this.camera.position.clone().add(new THREE.Vector3(0, -3.65, -11.7)));

    this.spectators.forEach((spectator) => {
      const wave = Math.sin(elapsed * 2.2 + spectator.phase) * 0.12;
      spectator.rig.root.position.y = Math.max(0, wave + 0.04);
      spectator.rig.leftArm.rotation.z = spectator.wave * (0.18 + Math.max(0, Math.sin(elapsed * 2 + spectator.phase)) * 0.55);
      spectator.rig.rightArm.rotation.z = -spectator.wave * (0.18 + Math.max(0, Math.sin(elapsed * 2 + spectator.phase + 1)) * 0.55);
    });

    this.ballVisual.position.set(this.ball.x, this.ball.y, this.ball.z);
    this.ballVisual.rotation.x += this.ball.vz * dt / BALL_RADIUS;
    this.ballVisual.rotation.z -= this.ball.vx * dt / BALL_RADIUS;
  }

  private startLoop() {
    const frame = (now: number) => {
      if (this.disposed) return;
      const dt = this.lastFrame ? Math.min((now - this.lastFrame) / 1000, 0.04) : 0;
      this.lastFrame = now;
      this.update(dt, now / 1000);
      this.renderer.render(this.scene, this.camera);
      this.raf = window.requestAnimationFrame(frame);
    };
    this.raf = window.requestAnimationFrame(frame);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    if (this.winTimer) window.clearTimeout(this.winTimer);
    this.scene?.traverse((object: any) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material: any) => material.dispose());
      }
    });
    this.renderer?.dispose();
    this.root.remove();
  }
}
