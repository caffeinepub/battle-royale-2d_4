export type GameState = "menu" | "playing" | "gameover";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Weapon {
  name: string;
  damage: number;
  fireRate: number; // rounds per minute
  magSize: number;
  totalAmmo: number;
  currentAmmo: number;
  range: number;
  bulletSpeed: number;
  reloadTime: number; // seconds
  type: "rifle" | "pistol" | "melee" | "sniper" | "shotgun" | "smg";
  pellets?: number; // for shotguns
  spread?: number; // base spread in radians
  scopeZoom?: number; // for snipers
}

export interface Player {
  id: string;
  x: number;
  y: number;
  angle: number;
  hp: number;
  maxHp: number;
  weapons: (Weapon | null)[];
  activeWeapon: number;
  isReloading: boolean;
  reloadTimer: number;
  lastShot: number;
  kills: number;
  isAlive: boolean;
}

export type BotState = "idle" | "patrol" | "chase" | "attack";

export interface Bot extends Player {
  state: BotState;
  patrolTarget: Vec2;
  lastBotShot: number;
  stateTimer: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ownerId: string;
  damage: number;
  range: number;
  distanceTraveled: number;
  isMelee?: boolean;
  isShotgun?: boolean;
}

export type LootType =
  | "weapon_rifle"
  | "weapon_pistol"
  | "weapon_sniper"
  | "weapon_shotgun"
  | "weapon_smg"
  | "ammo"
  | "ammo_sniper"
  | "medkit"
  | "bandage";

export interface LootItem {
  id: string;
  x: number;
  y: number;
  type: LootType;
  picked: boolean;
}

export interface Tree {
  x: number;
  y: number;
  radius: number;
}

export interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Zone {
  centerX: number;
  centerY: number;
  currentRadius: number;
  targetRadius: number;
  nextShrinkTime: number;
  phase: number;
  isShrinking: boolean;
  shrinkDuration: number;
  shrinkStartRadius: number;
  shrinkStartTime: number;
}

export interface KillFeedEntry {
  text: string;
  timestamp: number;
}

export interface GameData {
  player: Player;
  bots: Bot[];
  bullets: Bullet[];
  loot: LootItem[];
  trees: Tree[];
  buildings: Building[];
  zone: Zone;
  killFeed: KillFeedEntry[];
  startTime: number;
  cameraX: number;
  cameraY: number;
  keys: Record<string, boolean>;
  mouseX: number;
  mouseY: number;
  nextBulletId: number;
  isScoping: boolean;
}

export const WORLD_SIZE = 3000;
export const TILE_SIZE = 64;

export const WEAPONS: Record<string, Weapon> = {
  M416: {
    name: "M416",
    damage: 30,
    fireRate: 600,
    magSize: 30,
    totalAmmo: 120,
    currentAmmo: 30,
    range: 600,
    bulletSpeed: 800,
    reloadTime: 2,
    type: "rifle",
    spread: 0.08,
  },
  AKM: {
    name: "AKM",
    damage: 45,
    fireRate: 400,
    magSize: 30,
    totalAmmo: 120,
    currentAmmo: 30,
    range: 650,
    bulletSpeed: 780,
    reloadTime: 2.2,
    type: "rifle",
    spread: 0.12,
  },
  SCAR_L: {
    name: "SCAR-L",
    damage: 32,
    fireRate: 550,
    magSize: 30,
    totalAmmo: 120,
    currentAmmo: 30,
    range: 580,
    bulletSpeed: 820,
    reloadTime: 1.9,
    type: "rifle",
    spread: 0.07,
  },
  UMP45: {
    name: "UMP45",
    damage: 35,
    fireRate: 700,
    magSize: 25,
    totalAmmo: 100,
    currentAmmo: 25,
    range: 400,
    bulletSpeed: 600,
    reloadTime: 1.8,
    type: "smg",
    spread: 0.1,
  },
  UZI: {
    name: "UZI",
    damage: 25,
    fireRate: 900,
    magSize: 35,
    totalAmmo: 140,
    currentAmmo: 35,
    range: 300,
    bulletSpeed: 550,
    reloadTime: 1.5,
    type: "smg",
    spread: 0.14,
  },
  SKS: {
    name: "SKS",
    damage: 65,
    fireRate: 120,
    magSize: 10,
    totalAmmo: 40,
    currentAmmo: 10,
    range: 900,
    bulletSpeed: 1100,
    reloadTime: 2.5,
    type: "sniper",
    spread: 0.03,
    scopeZoom: 2,
  },
  Kar98K: {
    name: "98K",
    damage: 120,
    fireRate: 45,
    magSize: 5,
    totalAmmo: 20,
    currentAmmo: 5,
    range: 1100,
    bulletSpeed: 1300,
    reloadTime: 3,
    type: "sniper",
    spread: 0.01,
    scopeZoom: 3,
  },
  AWM: {
    name: "AWM",
    damage: 200,
    fireRate: 30,
    magSize: 5,
    totalAmmo: 15,
    currentAmmo: 5,
    range: 1300,
    bulletSpeed: 1500,
    reloadTime: 3.5,
    type: "sniper",
    spread: 0.005,
    scopeZoom: 4,
  },
  S686: {
    name: "S686",
    damage: 22,
    fireRate: 60,
    magSize: 2,
    totalAmmo: 16,
    currentAmmo: 2,
    range: 200,
    bulletSpeed: 500,
    reloadTime: 2.2,
    type: "shotgun",
    pellets: 8,
    spread: 0.25,
  },
  S12K: {
    name: "S12K",
    damage: 18,
    fireRate: 150,
    magSize: 5,
    totalAmmo: 20,
    currentAmmo: 5,
    range: 180,
    bulletSpeed: 480,
    reloadTime: 2.5,
    type: "shotgun",
    pellets: 8,
    spread: 0.3,
  },
  P18C: {
    name: "P18C",
    damage: 40,
    fireRate: 400,
    magSize: 15,
    totalAmmo: 45,
    currentAmmo: 15,
    range: 450,
    bulletSpeed: 700,
    reloadTime: 1.5,
    type: "pistol",
    spread: 0.15,
  },
  Desert_Eagle: {
    name: "DEagle",
    damage: 70,
    fireRate: 150,
    magSize: 7,
    totalAmmo: 28,
    currentAmmo: 7,
    range: 500,
    bulletSpeed: 750,
    reloadTime: 1.8,
    type: "pistol",
    spread: 0.1,
  },
  Melee: {
    name: "FISTS",
    damage: 50,
    fireRate: 60,
    magSize: 1,
    totalAmmo: 999,
    currentAmmo: 1,
    range: 60,
    bulletSpeed: 0,
    reloadTime: 1,
    type: "melee",
  },
};

export const ZONE_PHASES = [
  { time: 60, radius: 900 },
  { time: 120, radius: 600 },
  { time: 180, radius: 350 },
  { time: 240, radius: 150 },
];

export const ZONE_DAMAGE_PER_SEC = 2;
export const INITIAL_ZONE_RADIUS = 1200;
