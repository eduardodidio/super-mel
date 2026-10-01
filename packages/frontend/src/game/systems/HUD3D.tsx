import { useState } from "react";
import { useGameState, type InputType, type GameScene } from "../hooks/useGameState";
import { useAssistMode } from "../hooks/useAssistMode";
import type { MissionStatus } from "./MissionTracker";

interface HUD3DProps {
  lives: number;
  score: number;
  coins: number;
  scene: GameScene;
  infiniteMissions?: MissionStatus[];
  levelBones?: number;
  totalBones?: number;
}

function getPortraitFilter(lives: number): string | undefined {
  if (lives >= 3) return undefined;
  if (lives === 2) return "sepia(0.3) saturate(1.3)";
  return "sepia(0.5) saturate(2) hue-rotate(-20deg)";
}

function getControlsHint(inputType: InputType): string {
  switch (inputType) {
    case "keyboard":
      return "A/D = andar   Space = pular   Z = atirar";
    case "touch":
      return "D-pad = andar   A = pular   B = atirar";
    case "gamepad":
      return "Stick = andar   A = pular   X = atirar   Start = pausar";
    default:
      return "A/D = andar   Space = pular   Z = atirar";
  }
}

export function HUD3D({ lives, score, coins, scene, infiniteMissions, levelBones = 0, totalBones = 0 }: HUD3DProps) {
  const [portraitError, setPortraitError] = useState(false);
  const lastInputType = useGameState((s) => s.lastInputType);
  const fiveHearts = useAssistMode((s) => s.fiveHearts);
  const anyAssist = useAssistMode((s) =>
    s.invincible || s.fiveHearts || s.gameSpeed !== 1.0
  );
  const maxHearts = fiveHearts ? 5 : 3;

  if (scene !== "playing") return null;

  const portraitFilter = getPortraitFilter(lives);

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        {!portraitError && (
          <img
            src="/sprites/mel/ui_portrait.png"
            alt="Mel portrait"
            style={{
              ...styles.portrait,
              ...(portraitFilter ? { filter: portraitFilter } : {}),
            }}
            onError={() => setPortraitError(true)}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={styles.hearts}>
              {Array.from({ length: maxHearts }, (_, i) => (
                <span key={i} style={{ opacity: i < lives ? 1 : 0.2, fontSize: "24px" }}>
                  &#9829;
                </span>
              ))}
            </span>
            <span style={styles.coins}>
              <span style={styles.coinIcon}>&#9679;</span> {coins}
            </span>
            {totalBones > 0 && (
              <span style={styles.boneStat}>
                <span style={styles.boneIcon}>OSSO</span> {levelBones}/{totalBones}
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={styles.center}>
        <span style={styles.controls}>
          {getControlsHint(lastInputType)}
        </span>
        {anyAssist && (
          <span style={styles.assistIndicator}>
            MODO ASSISTIDO ATIVO
          </span>
        )}
      </div>
      <div style={styles.right}>
        <span style={styles.score}>{Math.floor(score)}m</span>
      </div>

      {/* Infinite mission progress badges */}
      {infiniteMissions && infiniteMissions.length > 0 && (
        <div style={styles.missionsPanel}>
          {infiniteMissions.map((ms, i) => (
            <div key={i} style={styles.missionBadge}>
              <span style={{
                ...styles.missionBadgeText,
                color: ms.completed ? "#4a8a4a" : "#fff",
              }}>
                {ms.completed ? "\u2713 " : ""}{ms.mission.description}
              </span>
              {!ms.completed && (
                <div style={styles.missionProgressBar}>
                  <div style={{
                    ...styles.missionProgressFill,
                    width: `${ms.progress * 100}%`,
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    pointerEvents: "none",
    fontFamily: "monospace",
    zIndex: 10,
  },
  left: {
    display: "flex",
    alignItems: "flex-start",
    gap: 4,
  },
  portrait: {
    width: 48,
    height: 48,
    border: "2px solid #ffcc00",
    borderRadius: 4,
    imageRendering: "pixelated" as const,
    marginRight: 8,
  },
  hearts: {
    display: "flex",
    gap: 4,
    color: "#ff4444",
    filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.5))",
  },
  coins: {
    color: "#DC143C",
    fontSize: "18px",
    fontWeight: "bold",
    marginLeft: 12,
    textShadow: "1px 1px 0 #000",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  coinIcon: {
    fontSize: "14px",
    color: "#DC143C",
    filter: "drop-shadow(0 0 2px rgba(220,20,60,0.6))",
  },
  boneStat: {
    color: "#F5F5DC",
    fontSize: "16px",
    fontWeight: "bold",
    marginLeft: 12,
    textShadow: "1px 1px 0 #000",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  boneIcon: {
    fontSize: "10px",
    color: "#FFD700",
    fontWeight: "bold",
    background: "rgba(255,215,0,0.15)",
    padding: "1px 4px",
    borderRadius: 2,
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  controls: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "11px",
  },
  assistIndicator: {
    color: "#888",
    fontSize: "10px",
    marginTop: 4,
    fontFamily: "monospace",
  },
  right: {},
  score: {
    color: "#ffcc00",
    fontSize: "22px",
    fontWeight: "bold",
    textShadow: "2px 2px 0 #000",
  },
  missionsPanel: {
    position: "absolute",
    bottom: 80,
    left: 12,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    pointerEvents: "none",
  },
  missionBadge: {
    background: "rgba(0,0,0,0.5)",
    borderRadius: 4,
    padding: "4px 8px",
    maxWidth: 200,
  },
  missionBadgeText: {
    fontSize: "11px",
    fontFamily: "monospace",
  },
  missionProgressBar: {
    height: 3,
    background: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    marginTop: 2,
    overflow: "hidden",
  },
  missionProgressFill: {
    height: "100%",
    background: "#FFD700",
    borderRadius: 2,
    transition: "width 0.3s ease",
  },
};
