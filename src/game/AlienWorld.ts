/**
 * 3D Augmented Reality World & Game Loop Engine
 * Integrates WebGL with phone live rear camera or simulated AR cyber room.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { soundEffects } from '../audio/SoundEffects';
import { AlienType, ARSettings, GameMode, OffscreenIndicator, RadarBlip, Weapon } from '../types/game';
import {
  AlienInstance,
  cacheOriginalMaterials,
  createBossModel,
  createBruteModel,
  createCrawlerModel,
  createFlyingModel,
  createStalkerModel,
  createTrainingDroneModel,
  setAlienHitFlash,
} from './AlienModels';
import { ALIEN_SPECS } from './Progression';

// Reusable math vectors to prevent garbage collection in render loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _targetDir = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _screenCenter = new THREE.Vector2(0, 0);

export interface ShootResult {
  hit: boolean;
  headshot: boolean;
  alienId?: string;
  alienType?: AlienType;
  damage: number;
  remainingHealth: number;
  alienDefeated: boolean;
  scoreGained: number;
  creditsGained: number;
}

export interface WorldCallbacks {
  onAlienKilled: (alienType: AlienType, headshot: boolean, score: number, credits: number) => void;
  onPlayerDamaged: (damage: number) => void;
  onWaveCompleted: () => void;
  onRadarUpdate: (blips: RadarBlip[], offscreen: OffscreenIndicator[]) => void;
}

export class AlienWorld {
  private container: HTMLElement;
  private videoElement: HTMLVideoElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private pmremGenerator: THREE.PMREMGenerator;

  // Lighting
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private muzzleFlashLight: THREE.PointLight;

  // Simulated Environment (for when camera is disabled or unsupported)
  private simulatedRoomGroup: THREE.Group;

  // Active entities
  private aliens: Map<string, AlienInstance> = new Map();
  private projectiles: {
    mesh: THREE.Object3D;
    pos: THREE.Vector3;
    dir: THREE.Vector3;
    speed: number;
    life: number;
    isAlien: boolean;
  }[] = [];
  private particles: {
    points: THREE.Points;
    velocities: Float32Array;
    life: number;
    maxLife: number;
  }[] = [];

  // Device orientation / Gyro controls
  private targetEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private currentEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private gyroActive: boolean = false;
  private orientationOffset = { alpha: 0, beta: 0, gamma: 0 };
  private touchLookStart = { x: 0, y: 0 };
  private isTouchDragging: boolean = false;

  // Camera Shake
  private cameraShakeIntensity: number = 0;

  // Game Loop State
  private animFrameId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private callbacks: WorldCallbacks;
  private settings: ARSettings;
  private mode: GameMode = 'survival';

  // Wave / Encounter management
  private wave: number = 1;
  private waveSpawnQueue: AlienType[] = [];
  private spawnTimer: number = 0;
  private activeCameraStream: MediaStream | null = null;
  private cameraAvailable: boolean = false;

  constructor(
    container: HTMLElement,
    videoElement: HTMLVideoElement,
    settings: ARSettings,
    callbacks: WorldCallbacks
  ) {
    this.container = container;
    this.videoElement = videoElement;
    this.settings = settings;
    this.callbacks = callbacks;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Initialize Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
    this.camera.position.set(0, 1.6, 0); // eye level at 1.6m

    // 2. Initialize Three.js Renderer with alpha for transparent AR overlay
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 3. Environment map reflections
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // 4. Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0x88ccff, 0x111122, 1.2);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff0dd, 2.0);
    this.keyLight.position.set(5, 10, 7);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.scene.add(this.keyLight);

    // Muzzle Flash point light
    this.muzzleFlashLight = new THREE.PointLight(0x00f0ff, 0, 15);
    this.camera.add(this.muzzleFlashLight);
    this.scene.add(this.camera);

    // 5. Simulated AR Holodeck Environment (visible when camera is off)
    this.simulatedRoomGroup = this.createSimulatedEnvironment();
    this.scene.add(this.simulatedRoomGroup);

    // Setup input listeners
    this.setupControls();

    // Resize listener
    window.addEventListener('resize', this.onWindowResize);

    // Initial camera setup
    if (this.settings.useCamera) {
      this.startCameraStream();
    } else {
      this.simulatedRoomGroup.visible = true;
    }
  }

  private createSimulatedEnvironment(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'simulated_environment';

    // Sci-fi holographic grid floor
    const gridHelper = new THREE.GridHelper(40, 40, 0x00ffff, 0x112233);
    gridHelper.position.y = 0;
    group.add(gridHelper);

    // Ground plane with subtle reflection
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.2,
      metalness: 0.8,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    group.add(floorMesh);

    // Atmospheric holographic boundary pillars
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = Math.cos(angle) * 16;
      const z = Math.sin(angle) * 16;
      const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x0088cc,
        emissiveIntensity: 0.8,
        wireframe: true,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, 4, z);
      group.add(pillar);
    }

    // Sky dome / stars
    const starsCount = 400;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      const rad = 30 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(rad * Math.sin(phi) * Math.sin(theta));
      starPositions[i * 3 + 2] = rad * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.35,
      transparent: true,
      opacity: 0.7,
    });
    const stars = new THREE.Points(starGeo, starMat);
    group.add(stars);

    return group;
  }

  public async startCameraStream(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.cameraAvailable = false;
      this.simulatedRoomGroup.visible = true;
      return false;
    }

    try {
      if (this.activeCameraStream) {
        this.activeCameraStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Rear camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      this.activeCameraStream = stream;
      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      this.cameraAvailable = true;
      // In Camera AR mode, hide simulated walls & floor so real world is visible
      this.simulatedRoomGroup.visible = false;
      return true;
    } catch {
      // Permission denied or camera not supported
      this.cameraAvailable = false;
      this.simulatedRoomGroup.visible = true;
      return false;
    }
  }

  public stopCameraStream() {
    if (this.activeCameraStream) {
      this.activeCameraStream.getTracks().forEach((track) => track.stop());
      this.activeCameraStream = null;
    }
    this.videoElement.srcObject = null;
    this.cameraAvailable = false;
    this.simulatedRoomGroup.visible = true;
  }

  public toggleCameraMode(useCamera: boolean) {
    this.settings.useCamera = useCamera;
    if (useCamera) {
      this.startCameraStream();
    } else {
      this.stopCameraStream();
    }
  }

  /**
   * Device Orientation (Gyroscope) + Touch Drag Controls
   */
  private setupControls() {
    // Gyroscope tracking
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!this.settings.useDeviceOrientation || e.alpha === null || e.beta === null) return;
      this.gyroActive = true;

      // Convert device orientation angles into camera Euler
      const alpha = THREE.MathUtils.degToRad(e.alpha + this.orientationOffset.alpha);
      const beta = THREE.MathUtils.degToRad(e.beta + this.orientationOffset.beta);
      const gamma = THREE.MathUtils.degToRad(e.gamma || 0);

      this.targetEuler.set(
        Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, beta - Math.PI / 2)),
        -alpha - gamma * 0.2,
        0,
        'YXZ'
      );
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    // Touch drag & Mouse look fallback
    const dom = this.container;

    const onPointerDown = (e: PointerEvent) => {
      if (this.settings.touchToAim) return;
      this.isTouchDragging = true;
      this.touchLookStart = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.isTouchDragging) return;
      const dx = e.clientX - this.touchLookStart.x;
      const dy = e.clientY - this.touchLookStart.y;
      this.touchLookStart = { x: e.clientX, y: e.clientY };

      const sens = 0.003 * this.settings.sensitivity;
      this.targetEuler.y -= dx * sens;
      const pitchDelta = (this.settings.invertY ? -dy : dy) * sens;
      this.targetEuler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.targetEuler.x - pitchDelta));
    };

    const onPointerUp = () => {
      this.isTouchDragging = false;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  public calibrateGyro() {
    this.targetEuler.set(0, 0, 0);
    this.currentEuler.set(0, 0, 0);
  }

  /**
   * Start / Stop Game Loop
   */
  public start(mode: GameMode = 'survival', startWave: number = 1) {
    this.mode = mode;
    this.wave = startWave;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.clearAllAliens();
    this.setupWaveEncounter(startWave);

    const loop = (time: number) => {
      if (!this.isRunning) return;
      const dt = Math.min((time - this.lastTime) / 1000, 0.05);
      this.lastTime = time;

      this.update(dt, time);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public pause() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  public resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      const loop = (time: number) => {
        if (!this.isRunning) return;
        const dt = Math.min((time - this.lastTime) / 1000, 0.05);
        this.lastTime = time;

        this.update(dt, time);
        this.render();

        this.animFrameId = requestAnimationFrame(loop);
      };
      this.animFrameId = requestAnimationFrame(loop);
    }
  }

  /**
   * Spawning & Wave Progression
   */
  public setupWaveEncounter(waveNum: number) {
    this.wave = waveNum;
    this.waveSpawnQueue = [];

    if (this.mode === 'training') {
      // Spawn 3 holographic training drones around
      this.spawnAlien('crawler', 0, 4, true);
      this.spawnAlien('crawler', Math.PI * 0.6, 5, true);
      this.spawnAlien('crawler', -Math.PI * 0.6, 4.5, true);
      return;
    }

    if (this.mode === 'boss') {
      // Boss battle mode
      this.spawnAlien('boss', 0, 10);
      return;
    }

    // Survival / Mission wave formula
    const count = Math.min(5 + waveNum * 3, 25);
    for (let i = 0; i < count; i++) {
      if (waveNum === 1) {
        this.waveSpawnQueue.push('crawler');
      } else if (waveNum === 2) {
        this.waveSpawnQueue.push(Math.random() > 0.4 ? 'flying' : 'crawler');
      } else if (waveNum === 3) {
        this.waveSpawnQueue.push(Math.random() > 0.5 ? 'stalker' : Math.random() > 0.5 ? 'flying' : 'crawler');
      } else if (waveNum === 4) {
        this.waveSpawnQueue.push(i % 5 === 0 ? 'brute' : Math.random() > 0.5 ? 'stalker' : 'flying');
      } else {
        // High waves or boss wave
        if (waveNum % 5 === 0 && i === 0) {
          this.waveSpawnQueue.push('boss');
        } else {
          const r = Math.random();
          if (r < 0.25) this.waveSpawnQueue.push('crawler');
          else if (r < 0.5) this.waveSpawnQueue.push('stalker');
          else if (r < 0.75) this.waveSpawnQueue.push('flying');
          else this.waveSpawnQueue.push('brute');
        }
      }
    }
  }

  private spawnAlien(type: AlienType, angle?: number, dist?: number, isDrone: boolean = false): AlienInstance {
    const id = `alien_${Math.random().toString(36).substring(2, 9)}`;
    const spec = ALIEN_SPECS[type];

    let modelData: {
      group: THREE.Group;
      head: THREE.Object3D;
      legs: THREE.Object3D[];
      wings?: THREE.Object3D[];
      shieldMesh?: THREE.Mesh;
    };

    if (isDrone) {
      modelData = createTrainingDroneModel();
    } else {
      switch (type) {
        case 'crawler':
          modelData = createCrawlerModel();
          break;
        case 'stalker':
          modelData = createStalkerModel();
          break;
        case 'flying':
          modelData = createFlyingModel();
          break;
        case 'brute':
          modelData = createBruteModel();
          break;
        case 'boss':
          modelData = createBossModel();
          break;
      }
    }

    const group = modelData.group;
    group.scale.setScalar(spec.scale);

    // Compute spawn position: 360 degrees around player
    const spawnAngle = angle ?? Math.random() * Math.PI * 2;
    const distance = dist ?? (type === 'boss' ? 12 : 5 + Math.random() * 8);

    const x = Math.sin(spawnAngle) * distance;
    const z = Math.cos(spawnAngle) * distance;
    const y = spec.flying ? 1.5 + Math.random() * 2.5 : 0; // Flying aliens elevate

    group.position.set(x, y, z);
    group.lookAt(0, y, 0);

    const originalMaterials = cacheOriginalMaterials(group);

    const alien: AlienInstance = {
      id,
      type,
      group,
      health: spec.maxHealth * (1 + (this.wave - 1) * 0.15),
      maxHealth: spec.maxHealth * (1 + (this.wave - 1) * 0.15),
      speed: spec.speed,
      attackPower: spec.attackPower,
      attackRange: spec.attackRange,
      attackCooldown: spec.attackCooldown,
      lastAttackTime: 0,
      isDead: false,
      deathTimer: 0,
      isHitFlashing: 0,
      animTime: Math.random() * 10,
      legs: modelData.legs,
      wings: modelData.wings,
      shieldMesh: modelData.shieldMesh,
      bossPhase: 1,
      headMesh: modelData.head,
      originalMaterials,
    };

    this.scene.add(group);
    this.aliens.set(id, alien);
    return alien;
  }

  /**
   * Shooting Action (Player fires weapon)
   */
  public shoot(weapon: Weapon, touchScreenCoords?: { x: number; y: number }): ShootResult {
    // 1. Determine Ray direction
    if (touchScreenCoords) {
      const rect = this.container.getBoundingClientRect();
      const x = ((touchScreenCoords.x - rect.left) / rect.width) * 2 - 1;
      const y = -((touchScreenCoords.y - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    } else {
      _raycaster.setFromCamera(_screenCenter, this.camera);
    }

    // 2. Play Audio & Weapon Visuals
    switch (weapon.type) {
      case 'blaster':
        soundEffects.playBlaster();
        this.createLaserTracer(_raycaster.ray, 0x00f0ff, 0.04);
        break;
      case 'rifle':
        soundEffects.playRifle();
        this.createLaserTracer(_raycaster.ray, 0x39ff14, 0.05);
        break;
      case 'plasma':
        soundEffects.playPlasma();
        this.createPlasmaProjectile(_raycaster.ray);
        break;
      case 'railgun':
        soundEffects.playRailgun();
        this.createRailgunBeam(_raycaster.ray);
        break;
    }

    // Trigger dynamic muzzle flash
    this.triggerMuzzleFlash(weapon.color);

    // Camera recoil kick
    this.cameraShakeIntensity = Math.min(this.cameraShakeIntensity + (weapon.type === 'railgun' ? 0.35 : 0.12), 0.5);

    // 3. Raycast against living aliens
    const meshesToTest: THREE.Object3D[] = [];
    const alienMeshToId: Map<THREE.Object3D, AlienInstance> = new Map();

    this.aliens.forEach((alien) => {
      if (!alien.isDead) {
        alien.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshesToTest.push(child);
            alienMeshToId.set(child, alien);
          }
        });
      }
    });

    const intersects = _raycaster.intersectObjects(meshesToTest, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const alien = alienMeshToId.get(hit.object);

      if (alien && !alien.isDead) {
        // Check for Headshot
        let isHeadshot = false;
        let currentObj: THREE.Object3D | null = hit.object;
        while (currentObj && currentObj !== alien.group) {
          if (currentObj.name === 'head_target' || currentObj.userData.isHead) {
            isHeadshot = true;
            break;
          }
          currentObj = currentObj.parent;
        }

        // Damage calculation
        const baseDamage = weapon.damage * (1 + weapon.upgrades.damageLevel * 0.2);
        const finalDamage = isHeadshot ? baseDamage * weapon.headshotMultiplier : baseDamage;

        alien.health = Math.max(0, alien.health - finalDamage);
        alien.isHitFlashing = 0.12;
        setAlienHitFlash(alien, true);

        // Sound feedback
        if (isHeadshot) {
          soundEffects.playHeadshot();
        } else {
          soundEffects.playHitMarker();
          soundEffects.playAlienHurt();
        }

        // Create hit sparks at point
        this.createSparks(hit.point, isHeadshot ? 0xff0055 : 0x00f0ff);

        const isDefeated = alien.health <= 0;
        let scoreGained = isHeadshot ? 150 : 75;
        let creditsGained = 10;

        if (isDefeated) {
          alien.isDead = true;
          alien.deathTimer = 0.6;
          const spec = ALIEN_SPECS[alien.type];
          scoreGained = spec.scoreValue * (isHeadshot ? 2 : 1);
          creditsGained = spec.creditReward;

          soundEffects.playAlienDeath(alien.type);
          this.createDeathDisintegration(alien.group.position, alien.type);

          this.callbacks.onAlienKilled(alien.type, isHeadshot, scoreGained, creditsGained);

          // Check if training mode: auto respawn drone
          if (this.mode === 'training') {
            setTimeout(() => {
              if (this.isRunning) {
                this.spawnAlien('crawler', Math.random() * Math.PI * 2, 4 + Math.random() * 3, true);
              }
            }, 1000);
          }
        }

        return {
          hit: true,
          headshot: isHeadshot,
          alienId: alien.id,
          alienType: alien.type,
          damage: finalDamage,
          remainingHealth: alien.health,
          alienDefeated: isDefeated,
          scoreGained,
          creditsGained,
        };
      }
    }

    return {
      hit: false,
      headshot: false,
      damage: 0,
      remainingHealth: 0,
      alienDefeated: false,
      scoreGained: 0,
      creditsGained: 0,
    };
  }

  private triggerMuzzleFlash(colorHex: string) {
    this.muzzleFlashLight.color.set(colorHex);
    this.muzzleFlashLight.intensity = 4.0;
  }

  private createLaserTracer(ray: THREE.Ray, color: number, radius: number) {
    const start = ray.origin.clone().add(ray.direction.clone().multiplyScalar(0.5));
    const end = ray.origin.clone().add(ray.direction.clone().multiplyScalar(40));

    const path = new THREE.LineCurve3(start, end);
    const tubeGeo = new THREE.TubeGeometry(path, 1, radius, 4, false);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const tracer = new THREE.Mesh(tubeGeo, mat);
    this.scene.add(tracer);

    setTimeout(() => {
      this.scene.remove(tracer);
      tubeGeo.dispose();
      mat.dispose();
    }, 60);
  }

  private createPlasmaProjectile(ray: THREE.Ray) {
    const geo = new THREE.SphereGeometry(0.18, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const mesh = new THREE.Mesh(geo, mat);
    const pos = ray.origin.clone().add(ray.direction.clone().multiplyScalar(0.5));
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      pos,
      dir: ray.direction.clone(),
      speed: 35,
      life: 1.5,
      isAlien: false,
    });
  }

  private createRailgunBeam(ray: THREE.Ray) {
    const start = ray.origin.clone().add(ray.direction.clone().multiplyScalar(0.4));
    const end = ray.origin.clone().add(ray.direction.clone().multiplyScalar(50));

    const path = new THREE.LineCurve3(start, end);
    const tubeGeo = new THREE.TubeGeometry(path, 1, 0.12, 6, false);
    const mat = new THREE.MeshBasicMaterial({ color: 0xbf00ff, transparent: true, opacity: 1.0 });
    const beam = new THREE.Mesh(tubeGeo, mat);
    this.scene.add(beam);

    let fade = 1.0;
    const fadeInterval = setInterval(() => {
      fade -= 0.15;
      if (fade <= 0) {
        clearInterval(fadeInterval);
        this.scene.remove(beam);
        tubeGeo.dispose();
        mat.dispose();
      } else {
        mat.opacity = fade;
      }
    }, 20);
  }

  private createSparks(position: THREE.Vector3, color: number) {
    const count = 15;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      velocities[i * 3] = (Math.random() - 0.5) * 6;
      velocities[i * 3 + 1] = Math.random() * 4 + 1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size: 0.15,
      transparent: true,
      opacity: 1,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.particles.push({
      points,
      velocities,
      life: 0.35,
      maxLife: 0.35,
    });
  }

  private createDeathDisintegration(position: THREE.Vector3, type: AlienType) {
    const count = type === 'boss' ? 120 : 40;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 1] = position.y + Math.random() * 1.2;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.8;

      velocities[i * 3] = (Math.random() - 0.5) * 4;
      velocities[i * 3 + 1] = Math.random() * 5 + 0.5;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: type === 'boss' ? 0xff00ff : 0x00ffaa,
      size: 0.22,
      transparent: true,
      opacity: 1,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.particles.push({
      points,
      velocities,
      life: 0.65,
      maxLife: 0.65,
    });
  }

  /**
   * Main Per-Frame Update
   */
  private update(dt: number, time: number) {
    // 1. Smooth Camera Orientation (Exponential Damping)
    this.currentEuler.x = THREE.MathUtils.damp(this.currentEuler.x, this.targetEuler.x, 18, dt);
    this.currentEuler.y = THREE.MathUtils.damp(this.currentEuler.y, this.targetEuler.y, 18, dt);
    this.camera.quaternion.setFromEuler(this.currentEuler);

    // Apply camera shake if any
    if (this.cameraShakeIntensity > 0.001) {
      this.camera.position.x = (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y = 1.6 + (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.z = (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * 1.8);
    } else {
      this.camera.position.set(0, 1.6, 0);
    }

    // Decay muzzle flash light
    if (this.muzzleFlashLight.intensity > 0) {
      this.muzzleFlashLight.intensity = Math.max(0, this.muzzleFlashLight.intensity - dt * 30);
    }

    // 2. Wave Queue Spawning
    if (this.waveSpawnQueue.length > 0) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= 2.0) {
        this.spawnTimer = 0;
        const nextType = this.waveSpawnQueue.shift();
        if (nextType) {
          this.spawnAlien(nextType);
        }
      }
    } else if (this.aliens.size === 0 && this.mode !== 'training') {
      // Wave cleared!
      soundEffects.playWaveClear();
      this.callbacks.onWaveCompleted();
      this.wave++;
      this.setupWaveEncounter(this.wave);
    }

    // 3. Update Aliens
    const playerPos = this.camera.position;
    const radarBlips: RadarBlip[] = [];
    const offscreenIndicators: OffscreenIndicator[] = [];

    this.camera.getWorldDirection(_camForward);
    const camHeading = Math.atan2(_camForward.x, _camForward.z);

    this.aliens.forEach((alien, id) => {
      // Handle Hit Flash timer
      if (alien.isHitFlashing > 0) {
        alien.isHitFlashing -= dt;
        if (alien.isHitFlashing <= 0) {
          setAlienHitFlash(alien, false);
        }
      }

      // Handle Death dissolving animation
      if (alien.isDead) {
        alien.deathTimer -= dt;
        alien.group.scale.multiplyScalar(0.92);
        alien.group.position.y += dt * 0.4;
        if (alien.deathTimer <= 0) {
          this.scene.remove(alien.group);
          this.aliens.delete(id);
        }
        return;
      }

      // Alive alien logic
      alien.animTime += dt * 3;
      const alienPos = alien.group.position;
      const dist = alienPos.distanceTo(playerPos);

      // Procedural limb animations
      if (alien.type === 'crawler') {
        alien.legs.forEach((leg, idx) => {
          leg.rotation.x = Math.sin(alien.animTime * 3 + idx * Math.PI) * 0.35;
        });
      } else if (alien.type === 'stalker') {
        alien.legs.forEach((leg, idx) => {
          leg.rotation.x = Math.sin(alien.animTime * 2 + idx * Math.PI) * 0.25;
        });
      } else if (alien.type === 'flying' && alien.wings) {
        alien.wings[0].rotation.z = Math.sin(alien.animTime * 8) * 0.45;
        alien.wings[1].rotation.z = -Math.sin(alien.animTime * 8) * 0.45;
      } else if (alien.type === 'boss') {
        if (alien.shieldMesh) {
          alien.shieldMesh.rotation.y += dt * 0.6;
        }
      }

      // Move toward player if beyond attack range
      if (dist > alien.attackRange && this.mode !== 'training') {
        _targetDir.subVectors(playerPos, alienPos);
        _targetDir.y = 0;
        _targetDir.normalize();

        alienPos.addScaledVector(_targetDir, alien.speed * dt);
        alien.group.lookAt(playerPos.x, alienPos.y, playerPos.z);
      } else if (this.mode !== 'training') {
        // In attack range: attack on cooldown
        const now = time / 1000;
        if (now - alien.lastAttackTime >= alien.attackCooldown) {
          alien.lastAttackTime = now;
          this.callbacks.onPlayerDamaged(alien.attackPower);
          soundEffects.playPlayerHit();
          this.cameraShakeIntensity = 0.45;

          // Telegraph attack: lunging forward or shooting acid projectile
          if (alien.type === 'flying' || alien.type === 'boss') {
            this.spawnAlienProjectile(alienPos, playerPos, alien.type);
          }
        }
      }

      // Calculate Radar Azimuth & Offscreen Indicators
      _v1.subVectors(alienPos, playerPos);
      const alienAngle = Math.atan2(_v1.x, _v1.z);
      let relAngle = THREE.MathUtils.radToDeg(alienAngle - camHeading);
      while (relAngle > 180) relAngle -= 360;
      while (relAngle < -180) relAngle += 360;

      radarBlips.push({
        id: alien.id,
        angle: relAngle,
        distance: dist,
        type: alien.type,
        elevation: alienPos.y - playerPos.y,
      });

      // Offscreen indicator if beyond camera FOV (+- 40 deg)
      if (Math.abs(relAngle) > 35) {
        const rad = THREE.MathUtils.degToRad(relAngle);
        offscreenIndicators.push({
          id: alien.id,
          screenAngle: rad,
          distance: dist,
          isAttacking: dist <= alien.attackRange + 1,
        });
      }
    });

    this.callbacks.onRadarUpdate(radarBlips, offscreenIndicators);

    // 4. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.pos.addScaledVector(p.dir, p.speed * dt);
      p.mesh.position.copy(p.pos);

      if (p.isAlien && p.pos.distanceTo(playerPos) < 1.0) {
        // Alien projectile hit player
        this.callbacks.onPlayerDamaged(18);
        soundEffects.playPlayerHit();
        this.cameraShakeIntensity = 0.35;
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 5. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      const positions = p.points.geometry.attributes.position.array as Float32Array;

      for (let j = 0; j < positions.length / 3; j++) {
        positions[j * 3] += p.velocities[j * 3] * dt;
        positions[j * 3 + 1] += p.velocities[j * 3 + 1] * dt;
        positions[j * 3 + 2] += p.velocities[j * 3 + 2] * dt;
        p.velocities[j * 3 + 1] -= 9.8 * dt; // gravity
      }
      p.points.geometry.attributes.position.needsUpdate = true;
      (p.points.material as THREE.PointsMaterial).opacity = p.life / p.maxLife;

      if (p.life <= 0) {
        this.scene.remove(p.points);
        p.points.geometry.dispose();
        (p.points.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  private spawnAlienProjectile(from: THREE.Vector3, to: THREE.Vector3, type: AlienType) {
    const geo = new THREE.SphereGeometry(0.2, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: type === 'boss' ? 0xff00aa : 0xffaa00,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from);
    this.scene.add(mesh);

    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    this.projectiles.push({
      mesh,
      pos: from.clone(),
      dir,
      speed: 12,
      life: 3.0,
      isAlien: true,
    });
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize = () => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private clearAllAliens() {
    this.aliens.forEach((alien) => {
      this.scene.remove(alien.group);
    });
    this.aliens.clear();

    this.projectiles.forEach((p) => this.scene.remove(p.mesh));
    this.projectiles = [];

    this.particles.forEach((pt) => this.scene.remove(pt.points));
    this.particles = [];
  }

  public dispose() {
    this.pause();
    this.stopCameraStream();
    window.removeEventListener('resize', this.onWindowResize);
    this.clearAllAliens();
    this.pmremGenerator.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
