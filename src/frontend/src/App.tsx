import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import GameCanvas from "./GameCanvas";
import type { GameState } from "./types/game";

const CONTROLS = [
  { key: "WASD", action: "移动" },
  { key: "鼠标", action: "瞄准" },
  { key: "左键", action: "射击" },
  { key: "R", action: "换弹" },
  { key: "F", action: "拾取物品" },
  { key: "1/2/3", action: "切换武器" },
];

const ENEMY_POSITIONS = [
  { x: 20, y: 30 },
  { x: 80, y: 15 },
  { x: 100, y: 70 },
  { x: 30, y: 90 },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [kills, setKills] = useState(0);
  const [placement, setPlacement] = useState(1);
  const [won, setWon] = useState(false);

  const handleGameOver = useCallback((k: number, p: number, w: boolean) => {
    setKills(k);
    setPlacement(p);
    setWon(w);
    setGameState("gameover");
  }, []);

  const startGame = useCallback(() => {
    setGameState("playing");
  }, []);

  const restartGame = useCallback(() => {
    setGameState("menu");
    setTimeout(() => setGameState("playing"), 50);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#222824",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <AnimatePresence mode="wait">
        {gameState === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              background: "#222824",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Topographic background pattern */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(61,90,62,0.4) 0%, transparent 50%), " +
                  "radial-gradient(circle at 80% 70%, rgba(45,65,45,0.3) 0%, transparent 50%), " +
                  "radial-gradient(circle at 50% 50%, rgba(30,40,30,0.5) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />

            {/* Header */}
            <header
              style={{
                background: "#1F2421",
                borderBottom: "1px solid #3A4036",
                padding: "0 32px",
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                zIndex: 10,
              }}
            >
              <span
                style={{
                  color: "#6D7443",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                }}
              >
                BATTLEMAP
              </span>
              <nav
                style={{ display: "flex", gap: 24, alignItems: "center" }}
                data-ocid="nav.panel"
              >
                {["游戏模式", "排行榜", "商城", "设置"].map((label) => (
                  <NavLink key={label} label={label} />
                ))}
                <HeaderPlayButton onClick={startGame} />
              </nav>
            </header>

            {/* Main content */}
            <main
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 48,
                padding: "32px 48px",
                position: "relative",
                zIndex: 5,
              }}
            >
              {/* Title */}
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                style={{ textAlign: "center" }}
              >
                <h1
                  style={{
                    color: "#E6E2D6",
                    fontSize: "clamp(48px, 8vw, 96px)",
                    fontWeight: 900,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    margin: 0,
                    lineHeight: 1,
                    textShadow:
                      "0 0 40px rgba(109,116,67,0.5), 0 4px 20px rgba(0,0,0,0.8)",
                  }}
                >
                  BATTLE
                  <span style={{ color: "#6D7443", display: "block" }}>
                    MAP
                  </span>
                </h1>
                <p
                  style={{
                    color: "#A9A79F",
                    fontSize: 14,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    marginTop: 8,
                  }}
                >
                  100名玩家 · 1名胜者 · 顶级大逃杀
                </p>
              </motion.div>

              {/* Center content row */}
              <div
                style={{
                  display: "flex",
                  gap: 32,
                  alignItems: "flex-start",
                  width: "100%",
                  maxWidth: 1100,
                  justifyContent: "center",
                }}
              >
                {/* Left: Key features */}
                <motion.div
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  style={{
                    background: "rgba(27,30,26,0.78)",
                    border: "1px solid #3A4036",
                    padding: "24px 20px",
                    minWidth: 200,
                  }}
                >
                  <div
                    style={{
                      color: "#6D7443",
                      fontSize: 11,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      marginBottom: 16,
                      fontWeight: 700,
                    }}
                  >
                    核心特性
                  </div>
                  {[
                    { icon: "⚔", label: "激烈战斗", sub: "20名玩家对决" },
                    { icon: "🗺", label: "巨大地图", sub: "3000x3000战场" },
                    {
                      icon: "🔫",
                      label: "武器系统",
                      sub: "M416 · P18C · 近战",
                    },
                    {
                      icon: "💊",
                      label: "补给系统",
                      sub: "医疗包 · 绷带 · 弹药",
                    },
                  ].map((f) => (
                    <div
                      key={f.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 14,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{f.icon}</span>
                      <div>
                        <div
                          style={{
                            color: "#E6E2D6",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {f.label}
                        </div>
                        <div style={{ color: "#A9A79F", fontSize: 10 }}>
                          {f.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Center: Start game card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  style={{
                    background: "rgba(27,30,26,0.85)",
                    border: "1px solid #3A4036",
                    padding: 32,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 20,
                    minWidth: 340,
                    boxShadow: "0 0 60px rgba(0,0,0,0.8)",
                  }}
                >
                  {/* Game preview mockup */}
                  <div
                    style={{
                      width: "100%",
                      height: 140,
                      background:
                        "linear-gradient(135deg, #3D5A3E 0%, #2A3D2A 50%, #1F2E1F 100%)",
                      border: "1px solid #3A4036",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Mini game preview */}
                    <div
                      style={{ position: "relative", width: 120, height: 120 }}
                    >
                      {ENEMY_POSITIONS.map((pos) => (
                        <div
                          key={`${pos.x}-${pos.y}`}
                          style={{
                            position: "absolute",
                            left: pos.x,
                            top: pos.y,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#CC2222",
                            boxShadow: "0 0 6px #FF4444",
                          }}
                        />
                      ))}
                      {/* Player dot */}
                      <div
                        style={{
                          position: "absolute",
                          left: 52,
                          top: 52,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "#FFD700",
                          border: "2px solid #6D7443",
                          boxShadow: "0 0 12px rgba(255,215,0,0.8)",
                        }}
                      />
                      {/* Zone circle */}
                      <div
                        style={{
                          position: "absolute",
                          left: 8,
                          top: 8,
                          width: 100,
                          height: 100,
                          borderRadius: "50%",
                          border: "2px solid rgba(100,180,255,0.6)",
                        }}
                      />
                    </div>
                    {/* Grid lines */}
                    <svg
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      {[0, 1, 2, 3, 4].map((i) => (
                        <line
                          key={`h${i}`}
                          x1="0"
                          y1={i * 35}
                          x2="100%"
                          y2={i * 35}
                          stroke="rgba(255,255,255,0.04)"
                          strokeWidth="1"
                        />
                      ))}
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <line
                          key={`v${i}`}
                          x1={i * 50}
                          y1="0"
                          x2={i * 50}
                          y2="100%"
                          stroke="rgba(255,255,255,0.04)"
                          strokeWidth="1"
                        />
                      ))}
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 8,
                        color: "#6D7443",
                        fontSize: 9,
                        letterSpacing: "0.1em",
                      }}
                    >
                      SECTORS B4, C4
                    </div>
                  </div>

                  {/* Player stats */}
                  <div
                    style={{
                      display: "flex",
                      gap: 24,
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    {[
                      { label: "模式", value: "单人" },
                      { label: "玩家", value: "20" },
                      { label: "地图", value: "艾伦格" },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: "center" }}>
                        <div
                          style={{
                            color: "#A9A79F",
                            fontSize: 10,
                            letterSpacing: "0.1em",
                          }}
                        >
                          {s.label}
                        </div>
                        <div
                          style={{
                            color: "#E6E2D6",
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    type="button"
                    data-ocid="game.primary_button"
                    onClick={startGame}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      background: "#6D7443",
                      color: "#E6E2D6",
                      border: "none",
                      padding: "14px 64px",
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      width: "100%",
                      boxShadow: "0 0 20px rgba(109,116,67,0.4)",
                    }}
                  >
                    开始游戏
                  </motion.button>

                  {/* Controls */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px 20px",
                      width: "100%",
                    }}
                  >
                    {CONTROLS.map((c) => (
                      <div
                        key={c.key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            background: "#2A3028",
                            border: "1px solid #3A4036",
                            color: "#FFD700",
                            fontSize: 10,
                            padding: "2px 6px",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {c.key}
                        </span>
                        <span style={{ color: "#A9A79F", fontSize: 10 }}>
                          {c.action}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Right: Latest News */}
                <motion.div
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  style={{
                    background: "rgba(27,30,26,0.78)",
                    border: "1px solid #3A4036",
                    padding: "24px 20px",
                    minWidth: 200,
                  }}
                >
                  <div
                    style={{
                      color: "#6D7443",
                      fontSize: 11,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      marginBottom: 16,
                      fontWeight: 700,
                    }}
                  >
                    最新动态
                  </div>
                  {[
                    {
                      title: "新武器 M762 正式上线",
                      date: "04.03",
                      tag: "更新",
                    },
                    { title: "S18赛季通行证发布", date: "03.28", tag: "赛季" },
                    { title: "反作弊系统强化升级", date: "03.20", tag: "公告" },
                    { title: "艾伦格地图优化完成", date: "03.15", tag: "地图" },
                  ].map((n) => (
                    <div
                      key={n.title}
                      style={{
                        borderBottom: "1px solid #2A2E28",
                        paddingBottom: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 3,
                        }}
                      >
                        <span
                          style={{
                            background: "#3A4036",
                            color: "#6D7443",
                            fontSize: 9,
                            padding: "1px 5px",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {n.tag}
                        </span>
                        <span style={{ color: "#555", fontSize: 10 }}>
                          {n.date}
                        </span>
                      </div>
                      <div
                        style={{
                          color: "#E6E2D6",
                          fontSize: 11,
                          lineHeight: 1.4,
                        }}
                      >
                        {n.title}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Thumbnail cards row */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                style={{
                  display: "flex",
                  gap: 16,
                  width: "100%",
                  maxWidth: 1100,
                  justifyContent: "center",
                }}
              >
                {[
                  {
                    title: "战略拾取",
                    desc: "搜集武器弹药，优先占据有利地形",
                    color: "#4A7A4A",
                    icon: "🎒",
                  },
                  {
                    title: "载具机动",
                    desc: "快速转移缩圈，压制敌方位置",
                    color: "#7A5A2A",
                    icon: "🚗",
                  },
                  {
                    title: "精准射击",
                    desc: "掌握后坐力规律，实现精确压制",
                    color: "#7A2A2A",
                    icon: "🎯",
                  },
                ].map((card) => (
                  <ThumbnailCard key={card.title} card={card} />
                ))}
              </motion.div>
            </main>

            {/* Footer */}
            <footer
              style={{
                background: "#1A1D18",
                borderTop: "1px solid #2A2E28",
                padding: "12px 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                zIndex: 10,
              }}
            >
              <span
                style={{ color: "#555", fontSize: 10, letterSpacing: "0.05em" }}
              >
                © {new Date().getFullYear()}. Built with love using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#6D7443", textDecoration: "none" }}
                >
                  caffeine.ai
                </a>
              </span>
              <div style={{ display: "flex", gap: 20 }}>
                {["条款", "隐私", "支持", "关于"].map((l) => (
                  <span
                    key={l}
                    style={{
                      color: "#555",
                      fontSize: 10,
                      cursor: "pointer",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </footer>
          </motion.div>
        )}

        {gameState === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: "100vw", height: "100vh" }}
          >
            <GameCanvas onGameOver={handleGameOver} />
          </motion.div>
        )}

        {gameState === "gameover" && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#1A1D18",
              flexDirection: "column",
              gap: 0,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: won
                  ? "radial-gradient(circle at 50% 40%, rgba(109,116,67,0.3) 0%, transparent 60%)"
                  : "radial-gradient(circle at 50% 40%, rgba(120,30,30,0.3) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />

            <div
              data-ocid="gameover.panel"
              style={{
                background: "rgba(27,30,26,0.95)",
                border: `1px solid ${won ? "#6D7443" : "#7A2A2A"}`,
                padding: "48px 64px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 24,
                minWidth: 400,
                boxShadow: won
                  ? "0 0 60px rgba(109,116,67,0.4)"
                  : "0 0 60px rgba(120,30,30,0.4)",
                position: "relative",
                zIndex: 5,
              }}
            >
              {/* Result badge */}
              <div
                style={{
                  background: won
                    ? "rgba(109,116,67,0.2)"
                    : "rgba(120,30,30,0.2)",
                  border: `1px solid ${won ? "#6D7443" : "#7A2A2A"}`,
                  padding: "4px 16px",
                  color: won ? "#6D7443" : "#CC4444",
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                }}
              >
                {won ? "WINNER WINNER" : "GAME OVER"}
              </div>

              <h2
                style={{
                  color: "#E6E2D6",
                  fontSize: won ? 28 : 22,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textAlign: "center",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {won ? "大吉大利，晚上吃鸡！" : "本次游戏结束"}
              </h2>

              {/* Stats */}
              <div
                style={{
                  display: "flex",
                  gap: 40,
                  borderTop: "1px solid #2A2E28",
                  borderBottom: "1px solid #2A2E28",
                  padding: "20px 0",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                {[
                  { label: "击杀数", value: kills, color: "#FFD700" },
                  {
                    label: "最终排名",
                    value: `#${placement}`,
                    color: won ? "#6D7443" : "#CC4444",
                  },
                  { label: "模式", value: "单人", color: "#A9A79F" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div
                      style={{ color: s.color, fontSize: 28, fontWeight: 800 }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        color: "#A9A79F",
                        fontSize: 11,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 16 }}>
                <motion.button
                  type="button"
                  data-ocid="gameover.primary_button"
                  onClick={restartGame}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: "#6D7443",
                    color: "#E6E2D6",
                    border: "none",
                    padding: "12px 40px",
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: "0 0 20px rgba(109,116,67,0.3)",
                  }}
                >
                  再来一局
                </motion.button>
                <motion.button
                  type="button"
                  data-ocid="gameover.secondary_button"
                  onClick={() => setGameState("menu")}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: "transparent",
                    color: "#A9A79F",
                    border: "1px solid #3A4036",
                    padding: "12px 40px",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  主菜单
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavLink({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      data-ocid="nav.link"
      style={{
        color: hovered ? "#E6E2D6" : "#A9A79F",
        fontSize: 12,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "color 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </span>
  );
}

function HeaderPlayButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      data-ocid="nav.primary_button"
      onClick={onClick}
      style={{
        background: hovered ? "#8A9455" : "#6D7443",
        color: "#E6E2D6",
        border: "none",
        padding: "8px 20px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      PLAY NOW
    </button>
  );
}

function ThumbnailCard({
  card,
}: {
  card: { title: string; desc: string; color: string; icon: string };
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(27,30,26,0.78)",
        border: `1px solid ${hovered ? "#6D7443" : "#3A4036"}`,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        transition: "border-color 0.2s",
        maxWidth: 320,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 44,
          height: 44,
          background: `${card.color}44`,
          border: `1px solid ${card.color}66`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        {card.icon}
      </div>
      <div>
        <div
          style={{
            color: "#E6E2D6",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            color: "#A9A79F",
            fontSize: 10,
            marginTop: 3,
            lineHeight: 1.4,
          }}
        >
          {card.desc}
        </div>
      </div>
    </div>
  );
}
