/**
 * Procedural 3D Alien Models constructed as composite 3-12 part THREE.Groups
 * Zero external asset dependencies. Procedural canvas textures & PBR materials.
 */
import * as THREE from 'three';
import { AlienType } from '../types/game';

// Shared procedural textures
let chitinTexture: THREE.CanvasTexture | null = null;
let armorTexture: THREE.CanvasTexture | null = null;
let bioGlowTexture: THREE.CanvasTexture | null = null;

function getChitinTexture(): THREE.CanvasTexture {
  if (!chitinTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Base mottled insect carapace pattern
    ctx.fillStyle = '#0a1a12';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = Math.random() * 8 + 2;
      ctx.fillStyle = Math.random() > 0.5 ? '#123824' : '#051f11';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Micro chitin ridges
    ctx.strokeStyle = '#256d47';
    ctx.lineWidth = 1;
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 10);
      ctx.bezierCurveTo(80, i * 10 + 15, 160, i * 10 - 15, 256, i * 10);
      ctx.stroke();
    }

    chitinTexture = new THREE.CanvasTexture(canvas);
    chitinTexture.colorSpace = THREE.SRGBColorSpace;
    chitinTexture.wrapS = THREE.RepeatWrapping;
    chitinTexture.wrapT = THREE.RepeatWrapping;
  }
  return chitinTexture;
}

function getArmorTexture(): THREE.CanvasTexture {
  if (!armorTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e1014';
    ctx.fillRect(0, 0, 256, 256);

    // Hardened plate tech patterns
    ctx.strokeStyle = '#4a222a';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 216, 216);
    ctx.strokeRect(50, 50, 156, 156);

    ctx.fillStyle = '#6e1e2d';
    ctx.fillRect(90, 90, 76, 76);

    armorTexture = new THREE.CanvasTexture(canvas);
    armorTexture.colorSpace = THREE.SRGBColorSpace;
  }
  return armorTexture;
}

function getBioGlowTexture(): THREE.CanvasTexture {
  if (!bioGlowTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#00ffff');
    grad.addColorStop(0.7, '#0055ff');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    bioGlowTexture = new THREE.CanvasTexture(canvas);
  }
  return bioGlowTexture;
}

export interface AlienInstance {
  id: string;
  type: AlienType;
  group: THREE.Group;
  health: number;
  maxHealth: number;
  speed: number;
  attackPower: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  isDead: boolean;
  deathTimer: number;
  isHitFlashing: number; // flash duration timer
  animTime: number;
  legs: THREE.Object3D[];
  wings?: THREE.Object3D[];
  shieldMesh?: THREE.Mesh;
  bossPhase?: number;
  headMesh: THREE.Object3D;
  originalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
}

// Flash white material for hit confirmation
const hitFlashMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: false,
});

/**
 * 1. Bio-Crawler: 4-legged skittering arachnid
 */
export function createCrawlerModel(): { group: THREE.Group; head: THREE.Object3D; legs: THREE.Object3D[] } {
  const root = new THREE.Group();
  root.name = 'alien_crawler';

  const bodyMat = new THREE.MeshStandardMaterial({
    map: getChitinTexture(),
    color: 0x00cc44,
    roughness: 0.35,
    metalness: 0.2,
  });

  const underMat = new THREE.MeshStandardMaterial({
    color: 0x062816,
    roughness: 0.8,
    metalness: 0.1,
  });

  const glowEyeMat = new THREE.MeshStandardMaterial({
    color: 0x39ff14,
    emissive: 0x39ff14,
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });

  // 1. Thorax / Abdomen (Main body)
  const thoraxGeo = new THREE.SphereGeometry(0.35, 12, 10);
  thoraxGeo.scale(1.2, 0.65, 1.4);
  const thorax = new THREE.Mesh(thoraxGeo, bodyMat);
  thorax.position.set(0, 0.4, -0.1);
  thorax.castShadow = true;
  root.add(thorax);

  // 2. Bioluminescent abdomen sac
  const sacGeo = new THREE.SphereGeometry(0.28, 10, 8);
  sacGeo.scale(0.9, 0.7, 1.2);
  const sac = new THREE.Mesh(sacGeo, glowEyeMat);
  sac.position.set(0, 0.45, -0.5);
  root.add(sac);

  // 3. Head & Mandibles (CRITICAL: headshot target)
  const headGroup = new THREE.Group();
  headGroup.name = 'head_target';
  headGroup.position.set(0, 0.42, 0.45);

  const headGeo = new THREE.ConeGeometry(0.22, 0.4, 8);
  headGeo.rotateX(Math.PI / 2);
  const headMesh = new THREE.Mesh(headGeo, bodyMat);
  headMesh.userData = { isHead: true };
  headGroup.add(headMesh);

  // 4. Glowing cluster eyes
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, glowEyeMat);
  eyeL.position.set(-0.1, 0.08, 0.15);
  const eyeR = new THREE.Mesh(eyeGeo, glowEyeMat);
  eyeR.position.set(0.1, 0.08, 0.15);
  headGroup.add(eyeL, eyeR);

  // Mandible pincers
  const pincerGeo = new THREE.ConeGeometry(0.04, 0.2, 6);
  pincerGeo.rotateZ(Math.PI / 4);
  const pincerL = new THREE.Mesh(pincerGeo, underMat);
  pincerL.position.set(-0.12, -0.05, 0.2);
  const pincerR = new THREE.Mesh(pincerGeo, underMat);
  pincerR.position.set(0.12, -0.05, 0.2);
  pincerR.scale.set(-1, 1, 1);
  headGroup.add(pincerL, pincerR);

  root.add(headGroup);

  // 5. 4 Articulated Crawling Legs
  const legs: THREE.Object3D[] = [];
  const legPositions = [
    [-0.32, 0.35, 0.25, 0.7], // front-left
    [0.32, 0.35, 0.25, -0.7], // front-right
    [-0.35, 0.35, -0.25, 1.8], // rear-left
    [0.35, 0.35, -0.25, -1.8], // rear-right
  ];

  legPositions.forEach((pos, idx) => {
    const legJoint = new THREE.Group();
    legJoint.position.set(pos[0], pos[1], pos[2]);

    // Upper leg
    const upperGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.4, 6);
    upperGeo.translate(0, 0.2, 0);
    const upperMesh = new THREE.Mesh(upperGeo, underMat);
    upperMesh.rotation.z = pos[3] > 0 ? 0.8 : -0.8;
    upperMesh.rotation.y = pos[3];

    // Lower claw leg
    const lowerGeo = new THREE.ConeGeometry(0.03, 0.45, 6);
    lowerGeo.translate(0, 0.22, 0);
    const lowerMesh = new THREE.Mesh(lowerGeo, underMat);
    lowerMesh.position.set(pos[3] > 0 ? 0.28 : -0.28, 0.32, 0);
    lowerMesh.rotation.z = pos[3] > 0 ? -1.3 : 1.3;

    legJoint.add(upperMesh);
    legJoint.add(lowerMesh);
    legJoint.name = `crawler_leg_${idx}`;
    root.add(legJoint);
    legs.push(legJoint);
  });

  return { group: root, head: headGroup, legs };
}

/**
 * 2. Shadow Stalker: Elongated tall bipedal cloaker
 */
export function createStalkerModel(): { group: THREE.Group; head: THREE.Object3D; legs: THREE.Object3D[] } {
  const root = new THREE.Group();
  root.name = 'alien_stalker';

  const stalkerMat = new THREE.MeshStandardMaterial({
    color: 0x0a223a,
    roughness: 0.2,
    metalness: 0.6,
  });

  const glowEyeMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 3.0,
    roughness: 0.1,
  });

  const spineMat = new THREE.MeshStandardMaterial({
    color: 0x02111d,
    roughness: 0.7,
    metalness: 0.3,
  });

  // 1. Torso
  const torsoGeo = new THREE.CylinderGeometry(0.22, 0.14, 0.9, 8);
  const torso = new THREE.Mesh(torsoGeo, stalkerMat);
  torso.position.set(0, 1.25, 0);
  torso.rotation.x = 0.2; // predatory hunch
  torso.castShadow = true;
  root.add(torso);

  // 2. Spine ribs
  for (let i = 0; i < 4; i++) {
    const ribGeo = new THREE.TorusGeometry(0.24 - i * 0.02, 0.025, 6, 12, Math.PI);
    ribGeo.rotateX(Math.PI / 2);
    const rib = new THREE.Mesh(ribGeo, spineMat);
    rib.position.set(0, 1.05 + i * 0.16, -0.05);
    root.add(rib);
  }

  // 3. Head (Weak point)
  const headGroup = new THREE.Group();
  headGroup.name = 'head_target';
  headGroup.position.set(0, 1.85, 0.15);

  const headGeo = new THREE.SphereGeometry(0.22, 10, 8);
  headGeo.scale(0.8, 1.3, 1.6);
  const headMesh = new THREE.Mesh(headGeo, stalkerMat);
  headMesh.userData = { isHead: true };
  headGroup.add(headMesh);

  // Visor eye slit
  const visorGeo = new THREE.BoxGeometry(0.26, 0.06, 0.15);
  const visor = new THREE.Mesh(visorGeo, glowEyeMat);
  visor.position.set(0, 0.05, 0.22);
  headGroup.add(visor);

  root.add(headGroup);

  // 4. Twin Articulated Claw Arms
  const clawL = createClawArm(-1, stalkerMat);
  clawL.position.set(-0.35, 1.5, 0.05);
  const clawR = createClawArm(1, stalkerMat);
  clawR.position.set(0.35, 1.5, 0.05);
  root.add(clawL, clawR);

  // 5. Bipedal legs
  const legL = createStalkerLeg(-0.2, stalkerMat);
  const legR = createStalkerLeg(0.2, stalkerMat);
  root.add(legL, legR);

  return { group: root, head: headGroup, legs: [legL, legR, clawL, clawR] };
}

function createClawArm(side: number, mat: THREE.Material): THREE.Group {
  const arm = new THREE.Group();
  const upperGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.5, 6);
  upperGeo.translate(0, -0.25, 0);
  const upper = new THREE.Mesh(upperGeo, mat);
  upper.rotation.z = side * 0.3;
  upper.rotation.x = -0.4;

  const bladeGeo = new THREE.ConeGeometry(0.04, 0.6, 5);
  bladeGeo.translate(0, -0.3, 0);
  bladeGeo.rotateX(0.5);
  const blade = new THREE.Mesh(bladeGeo, mat);
  blade.position.set(side * 0.1, -0.45, 0.15);

  arm.add(upper);
  arm.add(blade);
  return arm;
}

function createStalkerLeg(xOffset: number, mat: THREE.Material): THREE.Group {
  const leg = new THREE.Group();
  leg.position.set(xOffset, 0.8, 0);

  const thighGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.5, 6);
  thighGeo.translate(0, -0.25, 0);
  const thigh = new THREE.Mesh(thighGeo, mat);
  thigh.rotation.x = -0.3;

  const shinGeo = new THREE.CylinderGeometry(0.05, 0.03, 0.55, 6);
  shinGeo.translate(0, -0.25, 0);
  const shin = new THREE.Mesh(shinGeo, mat);
  shin.position.set(0, -0.4, -0.1);
  shin.rotation.x = 0.5;

  leg.add(thigh);
  leg.add(shin);
  return leg;
}

/**
 * 3. Vortex Swarmer (Flying Bio-Drone)
 */
export function createFlyingModel(): { group: THREE.Group; head: THREE.Object3D; legs: THREE.Object3D[]; wings: THREE.Object3D[] } {
  const root = new THREE.Group();
  root.name = 'alien_flying';

  const bodyMat = new THREE.MeshStandardMaterial({
    map: getChitinTexture(),
    color: 0xffaa00,
    roughness: 0.3,
    metalness: 0.4,
  });

  const wingMat = new THREE.MeshPhysicalMaterial({
    color: 0xff6600,
    transmission: 0.7,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xff3300,
    emissive: 0xff3300,
    emissiveIntensity: 2.5,
  });

  // 1. Central fuselage body
  const bodyGeo = new THREE.ConeGeometry(0.28, 1.1, 8);
  bodyGeo.rotateX(-Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, 0, 0);
  root.add(body);

  // 2. Head & Optics (Weak point)
  const headGroup = new THREE.Group();
  headGroup.name = 'head_target';
  headGroup.position.set(0, 0.05, 0.5);

  const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
  const headMesh = new THREE.Mesh(headGeo, bodyMat);
  headMesh.userData = { isHead: true };
  headGroup.add(headMesh);

  // Glowing sensory eye
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), glowMat);
  eye.position.set(0, 0.02, 0.14);
  headGroup.add(eye);
  root.add(headGroup);

  // 3. Stinger / tail
  const tailGeo = new THREE.CylinderGeometry(0.04, 0.01, 0.6, 6);
  tailGeo.rotateX(Math.PI / 2);
  const tail = new THREE.Mesh(tailGeo, glowMat);
  tail.position.set(0, -0.05, -0.75);
  root.add(tail);

  // 4. Animated Bi-Wings
  const wingL = new THREE.Group();
  wingL.position.set(-0.25, 0.1, 0.1);
  const wingR = new THREE.Group();
  wingR.position.set(0.25, 0.1, 0.1);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(0.9, 0.4);
  wingShape.lineTo(0.7, -0.3);
  wingShape.closePath();

  const wingGeo = new THREE.ShapeGeometry(wingShape);
  const wingMeshL = new THREE.Mesh(wingGeo, wingMat);
  wingMeshL.scale.set(-1, 1, 1);
  wingL.add(wingMeshL);

  const wingMeshR = new THREE.Mesh(wingGeo, wingMat);
  wingR.add(wingMeshR);

  root.add(wingL, wingR);

  return { group: root, head: headGroup, legs: [], wings: [wingL, wingR] };
}

/**
 * 4. Titan Brute: Armored juggernaut
 */
export function createBruteModel(): { group: THREE.Group; head: THREE.Object3D; legs: THREE.Object3D[] } {
  const root = new THREE.Group();
  root.name = 'alien_brute';

  const armorMat = new THREE.MeshStandardMaterial({
    map: getArmorTexture(),
    color: 0xff0044,
    roughness: 0.45,
    metalness: 0.7,
  });

  const heavyMat = new THREE.MeshStandardMaterial({
    color: 0x1f0b12,
    roughness: 0.85,
    metalness: 0.3,
  });

  const magmaGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    emissive: 0xff2200,
    emissiveIntensity: 2.8,
  });

  // 1. Heavy Chest & Carapace Plates
  const chestGeo = new THREE.BoxGeometry(1.1, 0.9, 0.8);
  const chest = new THREE.Mesh(chestGeo, armorMat);
  chest.position.set(0, 1.5, 0);
  chest.castShadow = true;
  root.add(chest);

  // Glowing power vents on back
  const ventGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 6);
  ventGeo.rotateX(Math.PI / 3);
  const ventL = new THREE.Mesh(ventGeo, magmaGlowMat);
  ventL.position.set(-0.35, 1.8, -0.4);
  const ventR = new THREE.Mesh(ventGeo, magmaGlowMat);
  ventR.position.set(0.35, 1.8, -0.4);
  root.add(ventL, ventR);

  // 2. Armored Head (Crown + Glowing Visor)
  const headGroup = new THREE.Group();
  headGroup.name = 'head_target';
  headGroup.position.set(0, 2.1, 0.25);

  const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.5);
  const headMesh = new THREE.Mesh(headGeo, armorMat);
  headMesh.userData = { isHead: true };
  headGroup.add(headMesh);

  // Visor
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.1), magmaGlowMat);
  visor.position.set(0, 0.02, 0.26);
  headGroup.add(visor);
  root.add(headGroup);

  // 3. Massive Shoulders & Spiked Fists
  const armL = createBruteArm(-1, armorMat, heavyMat);
  armL.position.set(-0.8, 1.6, 0.1);
  const armR = createBruteArm(1, armorMat, heavyMat);
  armR.position.set(0.8, 1.6, 0.1);
  root.add(armL, armR);

  // 4. Sturdy Legs
  const legL = createBruteLeg(-0.35, armorMat);
  const legR = createBruteLeg(0.35, armorMat);
  root.add(legL, legR);

  return { group: root, head: headGroup, legs: [legL, legR, armL, armR] };
}

function createBruteArm(side: number, armorMat: THREE.Material, heavyMat: THREE.Material): THREE.Group {
  const arm = new THREE.Group();
  // Pauldron shoulder
  const shoulderGeo = new THREE.SphereGeometry(0.35, 8, 8);
  shoulderGeo.scale(1.2, 0.9, 1.2);
  const shoulder = new THREE.Mesh(shoulderGeo, armorMat);
  arm.add(shoulder);

  // Forearm & fist
  const fistGeo = new THREE.BoxGeometry(0.3, 0.6, 0.35);
  fistGeo.translate(0, -0.4, 0.1);
  const fist = new THREE.Mesh(fistGeo, heavyMat);
  arm.add(fist);
  return arm;
}

function createBruteLeg(xOffset: number, armorMat: THREE.Material): THREE.Group {
  const leg = new THREE.Group();
  leg.position.set(xOffset, 1.0, 0);

  const legGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.0, 8);
  legGeo.translate(0, -0.5, 0);
  const legMesh = new THREE.Mesh(legGeo, armorMat);
  leg.add(legMesh);
  return leg;
}

/**
 * 5. Hive Overlord Leviathan (Boss Titan)
 */
export function createBossModel(): {
  group: THREE.Group;
  head: THREE.Object3D;
  legs: THREE.Object3D[];
  wings?: THREE.Object3D[];
  shieldMesh: THREE.Mesh;
} {
  const root = new THREE.Group();
  root.name = 'alien_boss_overlord';

  const bossMat = new THREE.MeshStandardMaterial({
    color: 0x220538,
    roughness: 0.25,
    metalness: 0.8,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    roughness: 0.15,
    metalness: 0.9,
  });

  const coreGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 3.5,
  });

  // 1. Floating Biomechanical Crystalline Core
  const coreGeo = new THREE.OctahedronGeometry(0.85, 2);
  const core = new THREE.Mesh(coreGeo, coreGlowMat);
  core.position.set(0, 2.2, 0);
  root.add(core);

  // 2. Energy Shield Mesh (Visible in Phase 1)
  const shieldGeo = new THREE.SphereGeometry(2.2, 16, 16);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00a0ff,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.45,
    wireframe: true,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.set(0, 2.4, 0);
  root.add(shieldMesh);

  // 3. Imperial Crown Head (CRITICAL BOSS WEAK POINT)
  const headGroup = new THREE.Group();
  headGroup.name = 'head_target';
  headGroup.position.set(0, 3.4, 0.4);

  const crownGeo = new THREE.ConeGeometry(0.7, 1.2, 6);
  crownGeo.scale(1.2, 1, 0.8);
  const crownMesh = new THREE.Mesh(crownGeo, bossMat);
  crownMesh.userData = { isHead: true };
  headGroup.add(crownMesh);

  // Three glowing sensory eyes
  for (let i = -1; i <= 1; i++) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), coreGlowMat);
    eye.position.set(i * 0.28, -0.15, 0.35);
    headGroup.add(eye);
  }
  root.add(headGroup);

  // 4. 4 Orbital Generator Spires
  const spires: THREE.Object3D[] = [];
  for (let i = 0; i < 4; i++) {
    const spireGroup = new THREE.Group();
    const angle = (i * Math.PI) / 2;
    spireGroup.position.set(Math.cos(angle) * 1.8, 2.2, Math.sin(angle) * 1.8);

    const spireGeo = new THREE.CylinderGeometry(0.08, 0.16, 1.5, 6);
    const spireMesh = new THREE.Mesh(spireGeo, goldTrimMat);
    spireGroup.add(spireMesh);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), coreGlowMat);
    tip.position.set(0, 0.8, 0);
    spireGroup.add(tip);

    root.add(spireGroup);
    spires.push(spireGroup);
  }

  // 5. Trailing Bio-Tentacles
  for (let i = 0; i < 6; i++) {
    const tentacleAngle = (i * Math.PI) / 3;
    const tentacleGeo = new THREE.ConeGeometry(0.12, 2.4, 6);
    tentacleGeo.translate(0, -1.2, 0);
    const tentacle = new THREE.Mesh(tentacleGeo, bossMat);
    tentacle.position.set(Math.cos(tentacleAngle) * 0.9, 1.4, Math.sin(tentacleAngle) * 0.9);
    tentacle.rotation.x = 0.2;
    root.add(tentacle);
    spires.push(tentacle);
  }

  return { group: root, head: headGroup, legs: spires, shieldMesh };
}

/**
 * 6. Holographic Training Drone
 */
export function createTrainingDroneModel(): { group: THREE.Group; head: THREE.Object3D; legs: THREE.Object3D[] } {
  const root = new THREE.Group();
  root.name = 'training_drone';

  const holoMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.5,
    wireframe: true,
  });

  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x00ffff,
    emissiveIntensity: 2.0,
  });

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), holoMat);
  root.add(sphere);

  const ringGeo = new THREE.TorusGeometry(0.65, 0.03, 8, 24);
  const ring1 = new THREE.Mesh(ringGeo, holoMat);
  const ring2 = new THREE.Mesh(ringGeo, holoMat);
  ring2.rotation.x = Math.PI / 2;
  root.add(ring1, ring2);

  // Bullseye head center
  const headGroup = new THREE.Group();
  headGroup.name = 'head_target';
  const centerEye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), coreMat);
  centerEye.userData = { isHead: true };
  headGroup.add(centerEye);
  root.add(headGroup);

  return { group: root, head: headGroup, legs: [ring1, ring2] };
}

/**
 * Store original materials for hit flash effect
 */
export function cacheOriginalMaterials(root: THREE.Object3D): Map<THREE.Mesh, THREE.Material | THREE.Material[]> {
  const map = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      map.set(child, child.material);
    }
  });
  return map;
}

/**
 * Apply hit flash
 */
export function setAlienHitFlash(alien: AlienInstance, flashing: boolean) {
  alien.group.traverse((child) => {
    if (child instanceof THREE.Mesh && alien.originalMaterials.has(child)) {
      if (flashing) {
        child.material = hitFlashMaterial;
      } else {
        child.material = alien.originalMaterials.get(child)!;
      }
    }
  });
}
