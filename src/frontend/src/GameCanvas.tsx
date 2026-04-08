import { useCallback, useEffect, useRef } from "react";
import {
  type Bot,
  type Building,
  type Bullet,
  type GameData,
  INITIAL_ZONE_RADIUS,
  type LootItem,
  type Player,
  type Tree,
  WEAPONS,
  WORLD_SIZE,
  ZONE_DAMAGE_PER_SEC,
  ZONE_PHASES,
  type Zone,
} from "./types/game";

interface Props {
  onGameOver: (kills: number, placement: number, won: boolean) => void;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function distance(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function circleIntersectsRect(
  cx: number,
  cy: number,
  cr: number,
  bld: Building,
) {
  const nearestX = Math.max(bld.x, Math.min(cx, bld.x + bld.width));
  const nearestY = Math.max(bld.y, Math.min(cy, bld.y + bld.height));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < cr * cr;
}

function rectContainsPoint(bld: Building, px: number, py: number) {
  return (
    px >= bld.x &&
    px <= bld.x + bld.width &&
    py >= bld.y &&
    py <= bld.y + bld.height
  );
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function circlesOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
) {
  return distance(ax, ay, bx, by) < ar + br;
}

function createInitialGameData(): GameData {
  const cx = WORLD_SIZE / 2;
  const cy = WORLD_SIZE / 2;

  // Generate trees
  const trees: Tree[] = [];
  for (let i = 0; i < 250; i++) {
    let tx = randomRange(100, WORLD_SIZE - 100);
    let ty = randomRange(100, WORLD_SIZE - 100);
    let attempts = 0;
    while (distance(tx, ty, cx, cy) < 200 && attempts < 20) {
      tx = randomRange(100, WORLD_SIZE - 100);
      ty = randomRange(100, WORLD_SIZE - 100);
      attempts++;
    }
    trees.push({ x: tx, y: ty, radius: randomRange(15, 25) });
  }

  // Generate buildings
  const buildings: Building[] = [];
  const buildingData = [
    { x: cx - 600, y: cy - 600, w: 120, h: 80 },
    { x: cx + 400, y: cy - 500, w: 100, h: 100 },
    { x: cx - 400, y: cy + 400, w: 150, h: 60 },
    { x: cx + 300, y: cy + 350, w: 120, h: 90 },
    { x: cx - 700, y: cy + 100, w: 80, h: 120 },
    { x: cx + 600, y: cy - 200, w: 110, h: 70 },
    { x: cx - 200, y: cy - 700, w: 100, h: 80 },
    { x: cx + 150, y: cy + 600, w: 130, h: 60 },
    { x: cx - 800, y: cy - 300, w: 90, h: 110 },
    { x: cx + 700, y: cy + 400, w: 100, h: 100 },
    { x: cx - 100, y: cy + 800, w: 80, h: 80 },
    { x: cx + 500, y: cy - 800, w: 120, h: 70 },
  ];
  for (const b of buildingData) {
    buildings.push({ x: b.x, y: b.y, width: b.w, height: b.h });
  }

  // Generate loot
  const loot: LootItem[] = [];
  const lootTypes: LootItem["type"][] = [
    "weapon_rifle",
    "weapon_rifle",
    "weapon_sniper",
    "weapon_shotgun",
    "weapon_pistol",
    "weapon_smg",
    "ammo",
    "ammo",
    "ammo",
    "ammo_sniper",
    "medkit",
    "medkit",
    "bandage",
    "bandage",
    "bandage",
  ];
  for (let i = 0; i < 50; i++) {
    loot.push({
      id: generateId(),
      x: randomRange(200, WORLD_SIZE - 200),
      y: randomRange(200, WORLD_SIZE - 200),
      type: lootTypes[i % lootTypes.length],
      picked: false,
    });
  }

  // Player
  const player: Player = {
    id: "player",
    x: cx,
    y: cy,
    angle: 0,
    hp: 100,
    maxHp: 100,
    weapons: [{ ...WEAPONS.M416 }, null, null, { ...WEAPONS.Melee }],
    activeWeapon: 0,
    isReloading: false,
    reloadTimer: 0,
    lastShot: 0,
    kills: 0,
    isAlive: true,
  };

  // Bots
  const bots: Bot[] = [];
  for (let i = 0; i < 19; i++) {
    let bx = randomRange(200, WORLD_SIZE - 200);
    let by = randomRange(200, WORLD_SIZE - 200);
    let attempts = 0;
    while (distance(bx, by, cx, cy) < 400 && attempts < 30) {
      bx = randomRange(200, WORLD_SIZE - 200);
      by = randomRange(200, WORLD_SIZE - 200);
      attempts++;
    }

    const botWeapon =
      i % 3 === 0
        ? { ...WEAPONS.AKM }
        : i % 3 === 1
          ? { ...WEAPONS.M416 }
          : { ...WEAPONS.S686 };

    bots.push({
      id: `Bot_${i + 1}`,
      x: bx,
      y: by,
      angle: Math.random() * Math.PI * 2,
      hp: 100,
      maxHp: 100,
      weapons: [botWeapon, null, null, { ...WEAPONS.Melee }],
      activeWeapon: 0,
      isReloading: false,
      reloadTimer: 0,
      lastShot: 0,
      kills: 0,
      isAlive: true,
      state: "patrol",
      patrolTarget: {
        x: randomRange(200, WORLD_SIZE - 200),
        y: randomRange(200, WORLD_SIZE - 200),
      },
      lastBotShot: 0,
      stateTimer: 0,
    });
  }

  const zone: Zone = {
    centerX: cx,
    centerY: cy,
    currentRadius: INITIAL_ZONE_RADIUS,
    targetRadius: INITIAL_ZONE_RADIUS,
    nextShrinkTime: ZONE_PHASES[0].time,
    phase: 0,
    isShrinking: false,
    shrinkDuration: 30,
    shrinkStartRadius: INITIAL_ZONE_RADIUS,
    shrinkStartTime: 0,
  };

  return {
    player,
    bots,
    bullets: [],
    loot,
    trees,
    buildings,
    zone,
    killFeed: [],
    startTime: performance.now(),
    cameraX: cx - window.innerWidth / 2,
    cameraY: cy - window.innerHeight / 2,
    keys: {},
    mouseX: 0,
    mouseY: 0,
    nextBulletId: 0,
    isScoping: false,
  };
}

function isPositionBlocked(
  x: number,
  y: number,
  radius: number,
  trees: Tree[],
  buildings: Building[],
) {
  for (const tree of trees) {
    if (circlesOverlap(x, y, radius, tree.x, tree.y, tree.radius)) return true;
  }
  for (const bld of buildings) {
    if (circleIntersectsRect(x, y, radius, bld)) return true;
  }
  if (x < 50 || x > WORLD_SIZE - 50 || y < 50 || y > WORLD_SIZE - 50)
    return true;
  return false;
}

const COMPASS_DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function angleToCompass(angle: number): string {
  const deg = ((angle * 180) / Math.PI + 90 + 360) % 360;
  const idx = Math.round(deg / 45) % 8;
  return COMPASS_DIRS[idx];
}

export default function GameCanvas({ onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameData | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameOverCalledRef = useRef(false);

  const drawGame = useCallback(
    (ctx: CanvasRenderingContext2D, data: GameData, W: number, H: number) => {
      const {
        player,
        bots,
        bullets,
        loot,
        trees,
        buildings,
        zone,
        killFeed,
        cameraX,
        cameraY,
      } = data;

      ctx.clearRect(0, 0, W, H);

      // --- Draw world (offset by camera) ---
      ctx.save();
      ctx.translate(-cameraX, -cameraY);

      // Background: grass
      ctx.fillStyle = "#3D5A3E";
      ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

      // Dirt patches
      const patchSeed = [
        [400, 300],
        [800, 700],
        [1200, 400],
        [1600, 900],
        [2000, 500],
        [500, 1200],
        [1100, 1500],
        [1800, 1200],
        [2400, 1600],
        [700, 2000],
        [1400, 2200],
        [2100, 2500],
        [2600, 800],
        [2800, 2000],
        [300, 2600],
      ];
      for (const [px, py] of patchSeed) {
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 180);
        grad.addColorStop(0, "rgba(139, 115, 85, 0.6)");
        grad.addColorStop(1, "rgba(61, 90, 62, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(px, py, 180, 120, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < WORLD_SIZE; gx += 200) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, WORLD_SIZE);
        ctx.stroke();
      }
      for (let gy = 0; gy < WORLD_SIZE; gy += 200) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(WORLD_SIZE, gy);
        ctx.stroke();
      }

      // Zone visual
      const { currentRadius, centerX: zx, centerY: zy } = zone;
      ctx.save();
      ctx.fillStyle = "rgba(30, 100, 200, 0.18)";
      ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(zx, zy, currentRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();

      // Zone border
      ctx.strokeStyle = "rgba(100, 180, 255, 0.9)";
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 6]);
      ctx.beginPath();
      ctx.arc(zx, zy, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Buildings
      for (const bld of buildings) {
        ctx.fillStyle = "#5A5A5A";
        ctx.fillRect(bld.x + 2, bld.y + 2, bld.width, bld.height);
        ctx.fillStyle = "#4A4A4A";
        ctx.fillRect(bld.x, bld.y, bld.width, bld.height);
        ctx.strokeStyle = "#2A2A2A";
        ctx.lineWidth = 2;
        ctx.strokeRect(bld.x, bld.y, bld.width, bld.height);
        ctx.fillStyle = "#6D5A3A";
        const doorX = bld.x + bld.width / 2 - 8;
        const doorY = bld.y + bld.height - 4;
        ctx.fillRect(doorX, doorY, 16, 4);
      }

      // Trees
      for (const tree of trees) {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(
          tree.x + 5,
          tree.y + 5,
          tree.radius,
          tree.radius * 0.7,
          0.4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.fillStyle = "#2A1F10";
        ctx.beginPath();
        ctx.arc(tree.x, tree.y, tree.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1F3B1F";
        ctx.beginPath();
        ctx.arc(tree.x, tree.y, tree.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2A5A2A";
        ctx.beginPath();
        ctx.arc(
          tree.x - tree.radius * 0.25,
          tree.y - tree.radius * 0.25,
          tree.radius * 0.6,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      // Loot items
      for (const item of loot) {
        if (item.picked) continue;
        let color = "#00FFFF";
        let label = "?";
        if (item.type === "weapon_rifle") {
          color = "#FFD700";
          label = "W";
        } else if (item.type === "weapon_pistol") {
          color = "#FFA500";
          label = "W";
        } else if (item.type === "weapon_sniper") {
          color = "#FF6600";
          label = "S";
        } else if (item.type === "weapon_shotgun") {
          color = "#AA44FF";
          label = "G";
        } else if (item.type === "weapon_smg") {
          color = "#44FFAA";
          label = "U";
        } else if (item.type === "ammo") {
          color = "#FFFF00";
          label = "A";
        } else if (item.type === "ammo_sniper") {
          color = "#FFAA00";
          label = "S";
        } else if (item.type === "medkit") {
          color = "#FF4444";
          label = "M";
        } else if (item.type === "bandage") {
          color = "#FF8888";
          label = "B";
        }

        const glowGrad = ctx.createRadialGradient(
          item.x,
          item.y,
          0,
          item.x,
          item.y,
          18,
        );
        glowGrad.addColorStop(0, `${color}66`);
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#000";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, item.x, item.y);
      }

      // Bullets
      for (const bullet of bullets) {
        // Shotgun pellets are smaller
        const bulletRadius = bullet.isShotgun ? 2 : 3;
        ctx.fillStyle = bullet.isShotgun ? "#FF9922" : "#FFE566";
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bulletRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = bullet.isShotgun
          ? "rgba(255, 153, 34, 0.4)"
          : "rgba(255, 229, 102, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.x - bullet.vx * 0.04, bullet.y - bullet.vy * 0.04);
        ctx.stroke();
      }

      // Bots
      for (const bot of bots) {
        if (!bot.isAlive) continue;
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(bot.x + 3, bot.y + 3, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#CC2222";
        ctx.beginPath();
        ctx.arc(bot.x, bot.y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#881111";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = "#FF4444";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bot.x, bot.y);
        ctx.lineTo(
          bot.x + Math.cos(bot.angle) * 18,
          bot.y + Math.sin(bot.angle) * 18,
        );
        ctx.stroke();
        const hpW = 28;
        const hpX = bot.x - hpW / 2;
        const hpY = bot.y - 20;
        ctx.fillStyle = "#333";
        ctx.fillRect(hpX, hpY, hpW, 4);
        ctx.fillStyle = bot.hp > 50 ? "#44AA44" : "#CC4444";
        ctx.fillRect(hpX, hpY, (bot.hp / bot.maxHp) * hpW, 4);
        ctx.fillStyle = "#FFAAAA";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(bot.id, bot.x, bot.y - 24);
      }

      // Player
      if (player.isAlive) {
        // Reticle ring
        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(player.x + 3, player.y + 3, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(player.x, player.y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#6D7443";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(
          player.x + Math.cos(player.angle) * 18,
          player.y + Math.sin(player.angle) * 18,
        );
        ctx.stroke();
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("STALKER_7", player.x, player.y - 22);
      }

      ctx.restore();

      // ---- HUD ----
      const hpRatio = player.hp / player.maxHp;
      const elapsedSec = (performance.now() - data.startTime) / 1000;
      const aliveBots = bots.filter((b) => b.isAlive).length;
      const aliveCount = aliveBots + (player.isAlive ? 1 : 0);
      const nextShrink = Math.max(0, zone.nextShrinkTime - elapsedSec);
      const panelBg = "rgba(27, 30, 26, 0.78)";
      const panelBorder = "#3A4036";

      // Top-Left Panel
      ctx.fillStyle = panelBg;
      ctx.strokeStyle = panelBorder;
      ctx.lineWidth = 1;
      ctx.fillRect(12, 12, 220, 90);
      ctx.strokeRect(12, 12, 220, 90);
      ctx.fillStyle = "#6D7443";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("SOLO  |  ", 20, 30);
      ctx.fillStyle = player.isReloading ? "#FFD700" : "#44EE44";
      ctx.fillText(player.isReloading ? "RELOADING" : "PLAYING", 80, 30);
      ctx.fillStyle = "#E6E2D6";
      ctx.font = "bold 13px monospace";
      ctx.fillText("STALKER_7", 20, 50);
      ctx.fillStyle = "#A9A79F";
      ctx.font = "10px monospace";
      ctx.fillText(`HP  ${player.hp}/100`, 20, 66);
      ctx.fillStyle = "#333";
      ctx.fillRect(20, 72, 190, 8);
      ctx.fillStyle =
        hpRatio > 0.5 ? "#CC3333" : hpRatio > 0.25 ? "#EE8800" : "#FF4444";
      ctx.fillRect(20, 72, 190 * hpRatio, 8);
      ctx.strokeStyle = "#555";
      ctx.strokeRect(20, 72, 190, 8);
      ctx.fillStyle = "#6D7443";
      ctx.font = "bold 11px monospace";
      ctx.fillText(`${aliveCount} ALIVE`, 20, 95);

      // Bottom-Left mini status
      ctx.fillStyle = panelBg;
      ctx.strokeStyle = panelBorder;
      ctx.lineWidth = 1;
      ctx.fillRect(12, H - 60, 160, 46);
      ctx.strokeRect(12, H - 60, 160, 46);
      ctx.fillStyle = "#E6E2D6";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("STALKER_7", 20, H - 42);
      ctx.fillStyle = "#CC3333";
      ctx.font = "bold 18px monospace";
      ctx.fillText(`\u2665 ${player.hp}`, 20, H - 24);
      ctx.fillStyle = "#A9A79F";
      ctx.font = "10px monospace";
      ctx.fillText(`${aliveCount} ALIVE`, 110, H - 24);

      // Right Panel: Weapon Inventory (4 slots)
      const invX = W - 200;
      const invY = 12;
      const invH = 160;
      ctx.fillStyle = panelBg;
      ctx.strokeStyle = panelBorder;
      ctx.lineWidth = 1;
      ctx.fillRect(invX, invY, 188, invH);
      ctx.strokeRect(invX, invY, 188, invH);
      ctx.fillStyle = "#6D7443";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("INVENTORY [1-4]", invX + 10, invY + 16);

      const wepLabels = ["主武器", "副武器", "特殊", "近战"];
      for (let wi = 0; wi < 4; wi++) {
        const wep = player.weapons[wi];
        const isActive = wi === player.activeWeapon;
        const wy = invY + 30 + wi * 32;
        if (isActive) {
          ctx.fillStyle = "rgba(109,116,67,0.3)";
          ctx.fillRect(invX + 5, wy - 3, 178, 27);
        }
        ctx.fillStyle = isActive ? "#FFD700" : "#A9A79F";
        ctx.font = isActive ? "bold 10px monospace" : "10px monospace";
        ctx.fillText(`[${wi + 1}] ${wepLabels[wi]}`, invX + 10, wy + 10);
        if (wep) {
          ctx.fillStyle = isActive ? "#E6E2D6" : "#888";
          ctx.font = isActive ? "bold 11px monospace" : "11px monospace";
          ctx.fillText(wep.name, invX + 10, wy + 22);
          if (wep.type !== "melee") {
            ctx.textAlign = "right";
            ctx.fillStyle = isActive ? "#FFD700" : "#666";
            ctx.fillText(
              `${wep.currentAmmo}/${wep.totalAmmo}`,
              invX + 183,
              wy + 22,
            );
            ctx.textAlign = "left";
          }
        } else {
          ctx.fillStyle = "#444";
          ctx.font = "10px monospace";
          ctx.fillText("---", invX + 10, wy + 22);
        }
      }

      // Zone Timer
      ctx.fillStyle = panelBg;
      ctx.strokeStyle = panelBorder;
      ctx.lineWidth = 1;
      ctx.fillRect(invX, invY + invH + 10, 188, 36);
      ctx.strokeRect(invX, invY + invH + 10, 188, 36);
      ctx.fillStyle = nextShrink < 15 ? "#FF4444" : "#6D99CC";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      const shrinkLabel = zone.isShrinking
        ? "\u6bd2\u5708\u6536\u7f29\u4e2d..."
        : `\u6bd2\u5708\u6536\u7f29 ${Math.ceil(nextShrink)}\u79d2`;
      ctx.fillText(shrinkLabel, invX + 10, invY + invH + 24);
      ctx.fillStyle = "#A9A79F";
      ctx.font = "9px monospace";
      ctx.fillText(
        `\u9636\u6bb5 ${zone.phase + 1}/4`,
        invX + 10,
        invY + invH + 36,
      );

      // Top-Right Minimap
      const mmSize = 150;
      const mmX = W - mmSize - 12;
      const mmY = H - mmSize - 12;
      const mmScale = mmSize / WORLD_SIZE;
      ctx.fillStyle = panelBg;
      ctx.strokeStyle = panelBorder;
      ctx.lineWidth = 1;
      ctx.fillRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4);
      ctx.strokeRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4);
      ctx.fillStyle = "#2A3D2A";
      ctx.fillRect(mmX, mmY, mmSize, mmSize);
      ctx.fillStyle = "#1A2E1A";
      for (const tree of trees) {
        ctx.beginPath();
        ctx.arc(
          mmX + tree.x * mmScale,
          mmY + tree.y * mmScale,
          2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.fillStyle = "#555";
      for (const bld of buildings) {
        ctx.fillRect(
          mmX + bld.x * mmScale,
          mmY + bld.y * mmScale,
          Math.max(bld.width * mmScale, 2),
          Math.max(bld.height * mmScale, 2),
        );
      }
      ctx.strokeStyle = "rgba(100,180,255,0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(
        mmX + zone.centerX * mmScale,
        mmY + zone.centerY * mmScale,
        zone.currentRadius * mmScale,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      for (const item of loot) {
        if (item.picked) continue;
        ctx.fillStyle = "#00FFFF";
        ctx.beginPath();
        ctx.arc(
          mmX + item.x * mmScale,
          mmY + item.y * mmScale,
          1.5,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      for (const bot of bots) {
        if (!bot.isAlive) continue;
        ctx.fillStyle = "#FF3333";
        ctx.beginPath();
        ctx.arc(
          mmX + bot.x * mmScale,
          mmY + bot.y * mmScale,
          2.5,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(
        mmX + player.x * mmScale,
        mmY + player.y * mmScale,
        3.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.strokeStyle = "#FFF";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#A9A79F";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Sectors B4, C4", mmX + mmSize / 2, mmY - 4);

      // Kill Feed
      const feedX = W - 260;
      const feedY = 160;
      const now = performance.now();
      const recentKills = killFeed.filter((k) => now - k.timestamp < 5000);
      for (let ki = 0; ki < recentKills.length && ki < 5; ki++) {
        const kf = recentKills[ki];
        const alpha = Math.max(0, 1 - (now - kf.timestamp) / 5000);
        ctx.fillStyle = `rgba(27, 30, 26, ${0.78 * alpha})`;
        ctx.fillRect(feedX, feedY + ki * 22, 240, 20);
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText(kf.text, feedX + 8, feedY + ki * 22 + 14);
      }

      // Bottom Compass
      const compassW = 300;
      const compassH = 28;
      const compassX = (W - compassW) / 2;
      const compassY = H - compassH - 12;
      ctx.fillStyle = panelBg;
      ctx.strokeStyle = panelBorder;
      ctx.lineWidth = 1;
      ctx.fillRect(compassX, compassY, compassW, compassH);
      ctx.strokeRect(compassX, compassY, compassW, compassH);

      const dirs = [
        { label: "N", angle: -Math.PI / 2 },
        { label: "NE", angle: -Math.PI / 4 },
        { label: "E", angle: 0 },
        { label: "SE", angle: Math.PI / 4 },
        { label: "S", angle: Math.PI / 2 },
        { label: "SW", angle: (Math.PI * 3) / 4 },
        { label: "W", angle: Math.PI },
        { label: "NW", angle: (-Math.PI * 3) / 4 },
      ];
      const playerAngle = player.angle;
      for (const dir of dirs) {
        let diff = dir.angle - playerAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const posFrac = diff / Math.PI;
        if (Math.abs(posFrac) > 1) continue;
        const posX = compassX + compassW / 2 + posFrac * (compassW / 2 - 10);
        const isMajor = dir.label.length === 1;
        ctx.strokeStyle = isMajor ? "#FFD700" : "#6D7443";
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(posX, compassY + 4);
        ctx.lineTo(posX, compassY + (isMajor ? 16 : 10));
        ctx.stroke();
        ctx.fillStyle = isMajor ? "#FFD700" : "#A9A79F";
        ctx.font = isMajor ? "bold 10px monospace" : "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(dir.label, posX, compassY + compassH - 3);
      }
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(compassX + compassW / 2, compassY + 2);
      ctx.lineTo(compassX + compassW / 2, compassY + compassH - 2);
      ctx.stroke();
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        angleToCompass(playerAngle),
        compassX + compassW / 2,
        compassY + compassH + 14,
      );

      // Reload progress
      const activeW = player.weapons[player.activeWeapon];
      if (player.isReloading && activeW) {
        const reloadProgress = 1 - player.reloadTimer / activeW.reloadTime;
        ctx.fillStyle = panelBg;
        ctx.strokeStyle = panelBorder;
        ctx.lineWidth = 1;
        const rW = 200;
        const rX = (W - rW) / 2;
        const rY = H - 120;
        ctx.fillRect(rX, rY, rW, 20);
        ctx.strokeRect(rX, rY, rW, 20);
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(rX + 2, rY + 2, (rW - 4) * reloadProgress, 16);
        ctx.fillStyle = "#E6E2D6";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("RELOADING...", W / 2, rY + 14);
      }

      // Loot pickup prompt
      if (player.isAlive) {
        for (const item of loot) {
          if (item.picked) continue;
          if (distance(player.x, player.y, item.x, item.y) < 55) {
            ctx.fillStyle = panelBg;
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 1;
            ctx.fillRect(W / 2 - 80, H / 2 + 60, 160, 24);
            ctx.strokeRect(W / 2 - 80, H / 2 + 60, 160, 24);
            ctx.fillStyle = "#FFD700";
            ctx.font = "bold 11px monospace";
            ctx.textAlign = "center";
            ctx.fillText("[F] \u62fe\u53d6\u7269\u54c1", W / 2, H / 2 + 77);
            break;
          }
        }
      }

      // Outside zone damage indicator
      const distToCenter = distance(
        player.x,
        player.y,
        zone.centerX,
        zone.centerY,
      );
      if (distToCenter > zone.currentRadius) {
        ctx.fillStyle = "rgba(200, 80, 0, 0.18)";
        ctx.fillRect(0, 0, W, H);
        const grad2 = ctx.createRadialGradient(
          W / 2,
          H / 2,
          Math.min(W, H) * 0.3,
          W / 2,
          H / 2,
          Math.max(W, H),
        );
        grad2.addColorStop(0, "transparent");
        grad2.addColorStop(1, "rgba(30, 100, 200, 0.35)");
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(100, 180, 255, 0.9)";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText("\u26a0 \u6bd2\u5708\u4f24\u5bb3 -2HP/s", W / 2, 50);
      }
    },
    [],
  );

  const updateGame = useCallback(
    (dt: number, data: GameData, W: number, H: number) => {
      const { player, bots, bullets, loot, trees, buildings, zone } = data;
      const now = performance.now();
      const elapsed = (now - data.startTime) / 1000;

      // Player movement
      if (player.isAlive) {
        const speed = 150 * dt;
        let dx = 0;
        let dy = 0;
        if (data.keys.w || data.keys.W) dy -= 1;
        if (data.keys.s || data.keys.S) dy += 1;
        if (data.keys.a || data.keys.A) dx -= 1;
        if (data.keys.d || data.keys.D) dx += 1;

        if (dx !== 0 || dy !== 0) {
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = player.x + (dx / len) * speed;
          const ny = player.y + (dy / len) * speed;
          if (!isPositionBlocked(nx, player.y, 14, trees, buildings))
            player.x = nx;
          if (!isPositionBlocked(player.x, ny, 14, trees, buildings))
            player.y = ny;
        }

        const worldMouseX = data.mouseX + data.cameraX;
        const worldMouseY = data.mouseY + data.cameraY;
        player.angle = Math.atan2(
          worldMouseY - player.y,
          worldMouseX - player.x,
        );

        if (player.isReloading) {
          player.reloadTimer -= dt;
          if (player.reloadTimer <= 0) {
            player.isReloading = false;
            const w = player.weapons[player.activeWeapon];
            if (w && w.type !== "melee") {
              const needed = w.magSize - w.currentAmmo;
              const take = Math.min(needed, w.totalAmmo);
              w.currentAmmo += take;
              w.totalAmmo -= take;
            }
          }
        }
      }

      // Camera
      data.cameraX = player.x - W / 2;
      data.cameraY = player.y - H / 2;

      // Bots AI
      for (const bot of bots) {
        if (!bot.isAlive) continue;
        bot.stateTimer -= dt;
        const distToPlayer = distance(bot.x, bot.y, player.x, player.y);

        if (!player.isAlive) {
          bot.state = "patrol";
        } else if (distToPlayer < 300) {
          bot.state = "attack";
        } else if (distToPlayer < 400) {
          bot.state = "chase";
        } else if (bot.stateTimer <= 0) {
          bot.state = "patrol";
          bot.patrolTarget = {
            x: Math.max(
              100,
              Math.min(WORLD_SIZE - 100, bot.x + randomRange(-300, 300)),
            ),
            y: Math.max(
              100,
              Math.min(WORLD_SIZE - 100, bot.y + randomRange(-300, 300)),
            ),
          };
          bot.stateTimer = randomRange(3, 8);
        }

        let targetX = bot.patrolTarget.x;
        let targetY = bot.patrolTarget.y;
        if (bot.state === "chase" || bot.state === "attack") {
          targetX = player.x;
          targetY = player.y;
        }

        const tdx = targetX - bot.x;
        const tdy = targetY - bot.y;
        const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
        bot.angle = Math.atan2(tdy, tdx);

        if (bot.state !== "attack" || tdist > 200) {
          const bspeed = 100 * dt;
          if (tdist > 5) {
            const nbx = bot.x + (tdx / tdist) * bspeed;
            const nby = bot.y + (tdy / tdist) * bspeed;
            if (!isPositionBlocked(nbx, bot.y, 14, trees, buildings))
              bot.x = nbx;
            if (!isPositionBlocked(bot.x, nby, 14, trees, buildings))
              bot.y = nby;
          }
        }

        if (bot.state === "attack" && player.isAlive) {
          const timeSinceShot = (now - bot.lastBotShot) / 1000;
          // Use rifle-like AI shooting regardless of actual weapon type for bots
          const botFireInterval = 1.5;
          if (timeSinceShot >= botFireInterval) {
            bot.lastBotShot = now;
            const spread = (Math.random() - 0.5) * 0.3;
            const angle =
              Math.atan2(player.y - bot.y, player.x - bot.x) + spread;
            // Bots always use weapon slot 0, but use rifle-like stats to keep AI simple
            const w = bot.weapons[0];
            if (w && w.type !== "melee") {
              // For shotgun bots, fire a single rifle-like bullet to keep AI simple
              const bulletDamage = w.type === "shotgun" ? 20 : w.damage;
              const bulletSpeed = w.type === "shotgun" ? 700 : w.bulletSpeed;
              const bulletRange = w.type === "shotgun" ? 500 : w.range;
              bullets.push({
                id: String(data.nextBulletId++),
                x: bot.x + Math.cos(angle) * 16,
                y: bot.y + Math.sin(angle) * 16,
                vx: Math.cos(angle) * bulletSpeed,
                vy: Math.sin(angle) * bulletSpeed,
                ownerId: bot.id,
                damage: bulletDamage,
                range: bulletRange,
                distanceTraveled: 0,
              });
            }
          }
        }
      }

      // Bullets
      const bulletsToRemove: string[] = [];
      for (const bullet of bullets) {
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        const traveled =
          Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) * dt;
        bullet.distanceTraveled += traveled;

        if (bullet.distanceTraveled > bullet.range) {
          bulletsToRemove.push(bullet.id);
          continue;
        }
        if (
          bullet.x < 0 ||
          bullet.x > WORLD_SIZE ||
          bullet.y < 0 ||
          bullet.y > WORLD_SIZE
        ) {
          bulletsToRemove.push(bullet.id);
          continue;
        }

        let hitObstacle = false;
        for (const tree of trees) {
          if (distance(bullet.x, bullet.y, tree.x, tree.y) < tree.radius) {
            hitObstacle = true;
            break;
          }
        }
        if (!hitObstacle) {
          for (const bld of buildings) {
            if (rectContainsPoint(bld, bullet.x, bullet.y)) {
              hitObstacle = true;
              break;
            }
          }
        }
        if (hitObstacle) {
          bulletsToRemove.push(bullet.id);
          continue;
        }

        if (bullet.ownerId !== "player" && player.isAlive) {
          if (distance(bullet.x, bullet.y, player.x, player.y) < 15) {
            player.hp = Math.max(0, player.hp - bullet.damage);
            bulletsToRemove.push(bullet.id);
            if (player.hp <= 0) {
              player.isAlive = false;
              player.hp = 0;
            }
            continue;
          }
        }

        if (bullet.ownerId === "player") {
          let hitBot = false;
          for (const bot of bots) {
            if (!bot.isAlive) continue;
            if (distance(bullet.x, bullet.y, bot.x, bot.y) < 15) {
              bot.hp = Math.max(0, bot.hp - bullet.damage);
              hitBot = true;
              if (bot.hp <= 0) {
                bot.isAlive = false;
                bot.hp = 0;
                player.kills++;
                data.killFeed.unshift({
                  text: `You killed ${bot.id}`,
                  timestamp: now,
                });
                if (data.killFeed.length > 10) data.killFeed.pop();
                loot.push(
                  {
                    id: generateId(),
                    x: bot.x,
                    y: bot.y,
                    type: "ammo",
                    picked: false,
                  },
                  {
                    id: generateId(),
                    x: bot.x + 20,
                    y: bot.y - 10,
                    type: "medkit",
                    picked: false,
                  },
                );
              }
              break;
            }
          }
          if (hitBot) bulletsToRemove.push(bullet.id);
        }
      }
      data.bullets = bullets.filter((b) => !bulletsToRemove.includes(b.id));

      // Zone update
      if (
        !zone.isShrinking &&
        elapsed >= zone.nextShrinkTime &&
        zone.phase < ZONE_PHASES.length
      ) {
        zone.isShrinking = true;
        zone.shrinkStartRadius = zone.currentRadius;
        zone.shrinkStartTime = now;
        zone.targetRadius = ZONE_PHASES[zone.phase].radius;
      }

      if (zone.isShrinking) {
        const shrinkElapsed = (now - zone.shrinkStartTime) / 1000;
        const progress = Math.min(1, shrinkElapsed / zone.shrinkDuration);
        zone.currentRadius =
          zone.shrinkStartRadius +
          (zone.targetRadius - zone.shrinkStartRadius) * progress;
        if (progress >= 1) {
          zone.isShrinking = false;
          zone.currentRadius = zone.targetRadius;
          zone.phase++;
          if (zone.phase < ZONE_PHASES.length) {
            zone.nextShrinkTime = ZONE_PHASES[zone.phase].time;
          }
        }
      }

      // Zone damage
      if (player.isAlive) {
        const distToCenter = distance(
          player.x,
          player.y,
          zone.centerX,
          zone.centerY,
        );
        if (distToCenter > zone.currentRadius) {
          player.hp = Math.max(0, player.hp - ZONE_DAMAGE_PER_SEC * dt);
          if (player.hp <= 0) {
            player.isAlive = false;
            player.hp = 0;
          }
        }
      }

      for (const bot of bots) {
        if (!bot.isAlive) continue;
        const distBotZone = distance(bot.x, bot.y, zone.centerX, zone.centerY);
        if (distBotZone > zone.currentRadius) {
          bot.hp = Math.max(0, bot.hp - ZONE_DAMAGE_PER_SEC * dt);
          if (bot.hp <= 0) {
            bot.isAlive = false;
            bot.hp = 0;
          }
        }
      }

      // Suppress unused param warning
      void elapsed;
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    gameOverCalledRef.current = false;
    const initialData = createInitialGameData();
    gameRef.current = initialData;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleKeyDown = (e: KeyboardEvent) => {
      const data = gameRef.current;
      if (!data) return;
      data.keys[e.key] = true;

      if (e.key === "1") data.player.activeWeapon = 0;
      if (e.key === "2") data.player.activeWeapon = 1;
      if (e.key === "3") data.player.activeWeapon = 2;
      if (e.key === "4") data.player.activeWeapon = 3;

      if (e.key === "r" || e.key === "R") {
        const w = data.player.weapons[data.player.activeWeapon];
        if (
          w &&
          w.type !== "melee" &&
          !data.player.isReloading &&
          w.currentAmmo < w.magSize &&
          w.totalAmmo > 0
        ) {
          data.player.isReloading = true;
          data.player.reloadTimer = w.reloadTime;
        }
      }

      if (e.key === "f" || e.key === "F") {
        const p = data.player;
        for (const item of data.loot) {
          if (item.picked) continue;
          if (distance(p.x, p.y, item.x, item.y) < 55) {
            item.picked = true;
            if (item.type === "weapon_rifle") {
              // 50/50 chance of M416 or AKM
              const newRifle =
                Math.random() < 0.5 ? { ...WEAPONS.M416 } : { ...WEAPONS.AKM };
              if (p.weapons[0] === null) {
                p.weapons[0] = newRifle;
              } else {
                const w = p.weapons[0];
                if (w) w.totalAmmo += 30;
              }
            } else if (item.type === "weapon_pistol") {
              if (p.weapons[1] === null) {
                p.weapons[1] = { ...WEAPONS.P18C };
              } else {
                const w = p.weapons[1];
                if (w) w.totalAmmo += 15;
              }
            } else if (item.type === "weapon_sniper") {
              if (p.weapons[0] === null || p.weapons[0].type !== "sniper") {
                // Place sniper in primary slot if empty or not already a sniper
                const hasSniperSlot = p.weapons[0] === null;
                if (hasSniperSlot) {
                  p.weapons[0] = { ...WEAPONS.Kar98K };
                } else {
                  // Add ammo to existing sniper if already has one, else replace slot 0
                  const existingSniper = p.weapons.find(
                    (w) => w && w.type === "sniper",
                  );
                  if (existingSniper) {
                    existingSniper.totalAmmo += 10;
                  } else {
                    p.weapons[0] = { ...WEAPONS.Kar98K };
                  }
                }
              } else {
                // Already has sniper — add ammo
                const w = p.weapons[0];
                if (w) w.totalAmmo += 10;
              }
            } else if (item.type === "weapon_shotgun") {
              if (p.weapons[1] === null) {
                p.weapons[1] = { ...WEAPONS.S686 };
              } else {
                const w = p.weapons[1];
                if (w) w.totalAmmo += 8;
              }
            } else if (item.type === "weapon_smg") {
              if (p.weapons[1] === null) {
                p.weapons[1] = { ...WEAPONS.UMP45 };
              } else {
                const w = p.weapons[1];
                if (w) w.totalAmmo += 25;
              }
            } else if (item.type === "ammo") {
              const w = p.weapons[p.activeWeapon];
              if (w && w.type !== "melee") w.totalAmmo += 30;
              else if (p.weapons[0]) p.weapons[0].totalAmmo += 30;
            } else if (item.type === "ammo_sniper") {
              const sniper = p.weapons.find((w) => w && w.type === "sniper");
              if (sniper) sniper.totalAmmo += 10;
            } else if (item.type === "medkit") {
              p.hp = Math.min(p.maxHp, p.hp + 40);
            } else if (item.type === "bandage") {
              p.hp = Math.min(p.maxHp, p.hp + 15);
            }
            break;
          }
        }
      }

      if (["w", "a", "s", "d", "W", "A", "S", "D", " "].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const data = gameRef.current;
      if (!data) return;
      data.keys[e.key] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const data = gameRef.current;
      if (!data) return;
      data.mouseX = e.clientX;
      data.mouseY = e.clientY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const data = gameRef.current;
      if (!data || !data.player.isAlive || data.player.isReloading) return;
      if (e.button !== 0) return;

      const { player } = data;
      const weapon = player.weapons[player.activeWeapon];
      if (!weapon) return;

      const now = performance.now();
      const fireInterval = 60000 / weapon.fireRate;
      if (now - player.lastShot < fireInterval) return;
      player.lastShot = now;

      if (weapon.type === "melee") {
        for (const bot of data.bots) {
          if (!bot.isAlive) continue;
          if (distance(player.x, player.y, bot.x, bot.y) < weapon.range) {
            bot.hp = Math.max(0, bot.hp - weapon.damage);
            if (bot.hp <= 0) {
              bot.isAlive = false;
              player.kills++;
              data.killFeed.unshift({
                text: `You killed ${bot.id}`,
                timestamp: now,
              });
              data.loot.push(
                {
                  id: generateId(),
                  x: bot.x,
                  y: bot.y,
                  type: "ammo",
                  picked: false,
                },
                {
                  id: generateId(),
                  x: bot.x + 20,
                  y: bot.y,
                  type: "medkit",
                  picked: false,
                },
              );
            }
          }
        }
        return;
      }

      if (weapon.currentAmmo <= 0) {
        if (!player.isReloading && weapon.totalAmmo > 0) {
          player.isReloading = true;
          player.reloadTimer = weapon.reloadTime;
        }
        return;
      }

      weapon.currentAmmo--;
      const angle = player.angle;

      // Shotgun: fire multiple pellets
      if (weapon.type === "shotgun") {
        const pellets = weapon.pellets ?? 8;
        for (let p = 0; p < pellets; p++) {
          const pelletSpread = (Math.random() - 0.5) * (weapon.spread ?? 0.3);
          const pelletAngle = angle + pelletSpread;
          data.bullets.push({
            id: String(data.nextBulletId++),
            x: player.x + Math.cos(pelletAngle) * 16,
            y: player.y + Math.sin(pelletAngle) * 16,
            vx: Math.cos(pelletAngle) * weapon.bulletSpeed,
            vy: Math.sin(pelletAngle) * weapon.bulletSpeed,
            ownerId: "player",
            damage: weapon.damage,
            range: weapon.range,
            distanceTraveled: 0,
            isShotgun: true,
          });
        }
        return;
      }

      const spread =
        weapon.type === "rifle" || weapon.type === "sniper"
          ? (Math.random() - 0.5) * (weapon.spread ?? 0.08)
          : (Math.random() - 0.5) * (weapon.spread ?? 0.15);
      const finalAngle = angle + spread;

      data.bullets.push({
        id: String(data.nextBulletId++),
        x: player.x + Math.cos(finalAngle) * 16,
        y: player.y + Math.sin(finalAngle) * 16,
        vx: Math.cos(finalAngle) * weapon.bulletSpeed,
        vy: Math.sin(finalAngle) * weapon.bulletSpeed,
        ownerId: "player",
        damage: weapon.damage,
        range: weapon.range,
        distanceTraveled: 0,
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;
      const data = gameRef.current;
      if (!data) return;

      const W = canvas.width;
      const H = canvas.height;

      updateGame(dt, data, W, H);
      drawGame(ctx, data, W, H);

      if (!gameOverCalledRef.current) {
        const aliveBots = data.bots.filter((b) => b.isAlive).length;
        if (!data.player.isAlive) {
          gameOverCalledRef.current = true;
          setTimeout(
            () => onGameOver(data.player.kills, aliveBots + 1, false),
            1000,
          );
        } else if (aliveBots === 0) {
          gameOverCalledRef.current = true;
          setTimeout(() => onGameOver(data.player.kills, 1, true), 1500);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
    };
  }, [drawGame, updateGame, onGameOver]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", cursor: "crosshair", background: "#222824" }}
      tabIndex={0}
    />
  );
}
