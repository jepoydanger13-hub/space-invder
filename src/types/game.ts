/**
 * Game types and data structures for Alien Hunter: Reality Invasion
 */

export type GameMode = 'survival' | 'mission' | 'boss' | 'training';

export type AlienType = 'crawler' | 'stalker' | 'flying' | 'brute' | 'boss';

export interface Weapon {
  id: string;
  name: string;
  type: 'blaster' | 'rifle' | 'plasma' | 'railgun';
  description: string;
  damage: number;
  fireRate: number; // shots per second
  magSize: number;
  currentAmmo: number;
  reloadTime: number; // in seconds
  headshotMultiplier: number;
  color: string;
  unlocked: boolean;
  unlockCost: number;
  upgrades: {
    damageLevel: number;
    magLevel: number;
    reloadLevel: number;
  };
}

export interface AlienSpec {
  type: AlienType;
  name: string;
  lore: string;
  maxHealth: number;
  speed: number;
  attackPower: number;
  attackRange: number;
  attackCooldown: number;
  scoreValue: number;
  creditReward: number;
  scale: number;
  flying: boolean;
  color: string;
  emissiveColor: string;
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  targetKills: number;
  allowedTypes: AlienType[];
  timeLimit?: number; // seconds
  rewardCredits: number;
  rewardXP: number;
  bossAtEnd?: boolean;
}

export interface RadarBlip {
  id: string;
  angle: number; // relative angle -180 to 180 degrees from camera forward
  distance: number; // distance in meters
  type: AlienType;
  elevation: number; // vertical delta
}

export interface OffscreenIndicator {
  id: string;
  screenAngle: number; // radians around screen center
  distance: number;
  isAttacking: boolean;
}

export interface GameStats {
  score: number;
  kills: number;
  headshots: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
  creditsEarned: number;
  waveReached: number;
}

export interface PlayerProgress {
  credits: number;
  xp: number;
  level: number;
  highScore: number;
  unlockedWeapons: string[];
  upgrades: Record<string, { damageLevel: number; magLevel: number; reloadLevel: number }>;
  bestiaryDiscovered: Record<AlienType, boolean>;
  completedMissions: number[];
}

export interface ARSettings {
  useCamera: boolean;
  useDeviceOrientation: boolean;
  touchToAim: boolean;
  invertY: boolean;
  sensitivity: number;
  haptics: boolean;
  sound: boolean;
  graphicsQuality: 'medium' | 'high';
}
