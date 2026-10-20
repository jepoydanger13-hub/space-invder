/**
 * Progression and persistence management for Alien Hunter: Reality Invasion
 */
import { AlienSpec, Mission, PlayerProgress, Weapon } from '../types/game';

export const INITIAL_WEAPONS: Weapon[] = [
  {
    id: 'blaster_x1',
    name: 'X-1 Tactical Blaster',
    type: 'blaster',
    description: 'Standard issue high-frequency pulse sidearm. Pinpoint precision with extreme critical headshot multiplier.',
    damage: 35,
    fireRate: 3.5,
    magSize: 12,
    currentAmmo: 12,
    reloadTime: 1.2,
    headshotMultiplier: 2.5,
    color: '#00f0ff',
    unlocked: true,
    unlockCost: 0,
    upgrades: {
      damageLevel: 0,
      magLevel: 0,
      reloadLevel: 0,
    },
  },
  {
    id: 'viper_ar',
    name: 'Viper Auto-Rifle',
    type: 'rifle',
    description: 'Rapid-cycle kinetic laser rifle. Excellent suppression against fast swarming crawlers and flying bio-drones.',
    damage: 26,
    fireRate: 7.5,
    magSize: 30,
    currentAmmo: 30,
    reloadTime: 1.8,
    headshotMultiplier: 1.8,
    color: '#39ff14',
    unlocked: true,
    unlockCost: 0,
    upgrades: {
      damageLevel: 0,
      magLevel: 0,
      reloadLevel: 0,
    },
  },
  {
    id: 'nova_plasma',
    name: 'Nova Plasma Cannon',
    type: 'plasma',
    description: 'Discharges superheated spherical plasma bolts. Searing kinetic concussive force designed to melt heavy armored brutes.',
    damage: 90,
    fireRate: 1.6,
    magSize: 8,
    currentAmmo: 8,
    reloadTime: 2.2,
    headshotMultiplier: 1.6,
    color: '#ff0055',
    unlocked: false,
    unlockCost: 450,
    upgrades: {
      damageLevel: 0,
      magLevel: 0,
      reloadLevel: 0,
    },
  },
  {
    id: 'oblivion_railgun',
    name: 'Oblivion Railgun',
    type: 'railgun',
    description: 'Experimental magnetic accelerator rifle firing hyper-density subatomic slugs. Devastating punch capable of piercing hive armor.',
    damage: 180,
    fireRate: 0.9,
    magSize: 4,
    currentAmmo: 4,
    reloadTime: 2.6,
    headshotMultiplier: 3.0,
    color: '#bf00ff',
    unlocked: false,
    unlockCost: 1000,
    upgrades: {
      damageLevel: 0,
      magLevel: 0,
      reloadLevel: 0,
    },
  },
];

export const ALIEN_SPECS: Record<string, AlienSpec> = {
  crawler: {
    type: 'crawler',
    name: 'Bio-Crawler',
    lore: 'Low-profile quad-arachnid bio-drone. Moves rapidly across floors and ground planes, leaping at close range.',
    maxHealth: 60,
    speed: 3.2,
    attackPower: 12,
    attackRange: 2.2,
    attackCooldown: 1.5,
    scoreValue: 100,
    creditReward: 15,
    scale: 0.75,
    flying: false,
    color: '#00ff66',
    emissiveColor: '#00cc44',
  },
  stalker: {
    type: 'stalker',
    name: 'Shadow Stalker',
    lore: 'Elongated predatory bipedal infiltrator with partial cloaking skin. Stalks from the flanks before striking with razor claws.',
    maxHealth: 130,
    speed: 2.2,
    attackPower: 22,
    attackRange: 2.5,
    attackCooldown: 1.8,
    scoreValue: 220,
    creditReward: 35,
    scale: 1.1,
    flying: false,
    color: '#00ccff',
    emissiveColor: '#0088ff',
  },
  flying: {
    type: 'flying',
    name: 'Vortex Swarmer',
    lore: 'Winged aerial bio-organism capable of high-velocity hovering, vertical sweeps, and spitting acidic plasma bursts.',
    maxHealth: 85,
    speed: 3.8,
    attackPower: 16,
    attackRange: 6.0,
    attackCooldown: 2.0,
    scoreValue: 180,
    creditReward: 25,
    scale: 0.9,
    flying: true,
    color: '#ffaa00',
    emissiveColor: '#ff6600',
  },
  brute: {
    type: 'brute',
    name: 'Titan Brute',
    lore: 'Gigantic, chitinous cyber-mutant. Thick hardened carapace repels standard kinetic fire. Can withstand immense firepower.',
    maxHealth: 380,
    speed: 1.5,
    attackPower: 35,
    attackRange: 3.0,
    attackCooldown: 2.2,
    scoreValue: 500,
    creditReward: 90,
    scale: 1.6,
    flying: false,
    color: '#ff0044',
    emissiveColor: '#cc0022',
  },
  boss: {
    type: 'boss',
    name: 'Hive Overlord Leviathan',
    lore: 'Massive apex extraterrestrial entity with biomechanical shield generator spires, multiple sensory eyes, and devastating plasma storm attacks.',
    maxHealth: 1200,
    speed: 1.2,
    attackPower: 45,
    attackRange: 8.0,
    attackCooldown: 2.5,
    scoreValue: 2000,
    creditReward: 350,
    scale: 2.8,
    flying: true,
    color: '#aa00ff',
    emissiveColor: '#ff00aa',
  },
};

export const MISSIONS: Mission[] = [
  {
    id: 1,
    title: 'First Contact: Scout Extermination',
    description: 'An advanced scouting pack of Bio-Crawlers has infiltrated the area. Eliminate 8 crawlers before they swarm the perimeter.',
    targetKills: 8,
    allowedTypes: ['crawler'],
    rewardCredits: 120,
    rewardXP: 250,
  },
  {
    id: 2,
    title: 'Air Defense: Swarmer Interception',
    description: 'Aerial Vortex Swarmers are circling overhead. Use precision anti-air marksmanship to neutralize 12 flying threats.',
    targetKills: 12,
    allowedTypes: ['crawler', 'flying'],
    rewardCredits: 200,
    rewardXP: 400,
  },
  {
    id: 3,
    title: 'Ghost Hunt: Stalker Ambush',
    description: 'Cloaked Shadow Stalkers have established an ambush. Keep your radar checked and exterminate 14 alien predators.',
    targetKills: 14,
    allowedTypes: ['stalker', 'crawler', 'flying'],
    rewardCredits: 320,
    rewardXP: 600,
  },
  {
    id: 4,
    title: 'Heavy Armor: Brute Containment',
    description: 'Armored Titan Brutes have breached the threshold. Concentrate firepower on weak spots to defeat 16 hostiles including Brutes.',
    targetKills: 16,
    allowedTypes: ['crawler', 'brute', 'stalker'],
    rewardCredits: 450,
    rewardXP: 850,
  },
  {
    id: 5,
    title: 'Reality Breach: Multi-Vector Siege',
    description: 'All alien species are descending simultaneously. Survive the full spectrum assault and take down 22 invaders.',
    targetKills: 22,
    allowedTypes: ['crawler', 'stalker', 'flying', 'brute'],
    rewardCredits: 600,
    rewardXP: 1200,
  },
  {
    id: 6,
    title: 'Apex Showdown: Overlord Leviathan',
    description: 'The Hive Overlord has entered physical space. Break through its energy barrier, withstand its plasma barrages, and slay the titan.',
    targetKills: 1,
    allowedTypes: ['boss'],
    rewardCredits: 1000,
    rewardXP: 2500,
    bossAtEnd: true,
  },
];

const STORAGE_KEY = 'alien_hunter_ar_save_v1';

export function loadProgress(): PlayerProgress {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        credits: parsed.credits ?? 200,
        xp: parsed.xp ?? 0,
        level: parsed.level ?? 1,
        highScore: parsed.highScore ?? 0,
        unlockedWeapons: parsed.unlockedWeapons ?? ['blaster_x1', 'viper_ar'],
        upgrades: parsed.upgrades ?? {},
        bestiaryDiscovered: parsed.bestiaryDiscovered ?? {
          crawler: true,
          stalker: false,
          flying: false,
          brute: false,
          boss: false,
        },
        completedMissions: parsed.completedMissions ?? [],
      };
    }
  } catch {
    // fallback if error parsing
  }

  return {
    credits: 200,
    xp: 0,
    level: 1,
    highScore: 0,
    unlockedWeapons: ['blaster_x1', 'viper_ar'],
    upgrades: {},
    bestiaryDiscovered: {
      crawler: true,
      stalker: false,
      flying: false,
      brute: false,
      boss: false,
    },
    completedMissions: [],
  };
}

export function saveProgress(progress: PlayerProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage write errors
  }
}
