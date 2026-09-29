import { useState } from "react";
import type { GameScene } from "../hooks/useGameState";

interface HUD3DProps {
  lives: number;
  score: number;
  scene: GameScene;
}

function getPortraitFilter(lives: number): string | undefined {
  if (lives >= 3) return undefined;
  if (lives === 2) return "sepia(0.3) saturate(1.3)";
  return "sepia(0.5) saturate(2) hue-rotate(-20deg)";
}

export function HUD3D({ lives, score, scene }: HUD3DProps) {
  const [portraitError, setPortraitError] = useState(false);

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
        <span style={styles.hearts}>
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} style={{ opacity: i < lives ? 1 : 0.2, fontSize: "24px" }}>
              &#9829;
            </span>
          ))}
        </span>
      </div>
      <div style={styles.center}>
        <span style={styles.controls}>
          A/D = andar &nbsp; Space = pular &nbsp; Z = atirar
        </span>
      </div>
      <div style={styles.right}>
        <span style={styles.score}>{Math.floor(score)}m</span>
      </div>
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
    alignItems: "center",
    pointerEvents: "none",
    fontFamily: "monospace",
    zIndex: 10,
  },
  left: {
    display: "flex",
    alignItems: "center",
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
  center: {},
  controls: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "11px",
  },
  right: {},
  score: {
    color: "#ffcc00",
    fontSize: "22px",
    fontWeight: "bold",
    textShadow: "2px 2px 0 #000",
  },
};
