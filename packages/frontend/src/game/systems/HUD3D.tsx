import { useState, useEffect, useRef } from "react";
import type { GameScene } from "../hooks/useGameState";

interface HUD3DProps {
  lives: number;
  score: number;
  coins: number;
  scene: GameScene;
  isFlying?: boolean;
  flyTimeRemaining?: number;
}

function getPortraitFilter(lives: number): string | undefined {
  if (lives >= 3) return undefined;
  if (lives === 2) return "sepia(0.3) saturate(1.3)";
  return "sepia(0.5) saturate(2) hue-rotate(-20deg)";
}

function getBarColor(ratio: number): string {
  if (ratio > 0.5) return `rgb(${Math.round(255 * (1 - (ratio - 0.5) * 2))}, ${Math.round(150 + 105 * ((ratio - 0.5) * 2))}, 255)`;
  if (ratio > 0.25) return `rgb(255, ${Math.round(200 * ((ratio - 0.25) / 0.25))}, 0)`;
  return `rgb(255, ${Math.round(60 * (ratio / 0.25))}, 0)`;
}

function StaminaBar({ isFlying, flyTimeRemaining }: { isFlying: boolean; flyTimeRemaining: number }) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasFlying = useRef(false);

  useEffect(() => {
    if (isFlying) {
      setVisible(true);
      setOpacity(1);
      wasFlying.current = true;
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    } else if (wasFlying.current) {
      wasFlying.current = false;
      // Start fade-out after landing
      fadeTimerRef.current = setTimeout(() => {
        setOpacity(0);
        // Hide completely after fade transition
        fadeTimerRef.current = setTimeout(() => {
          setVisible(false);
          setOpacity(1);
        }, 1500);
      }, 100);
    }

    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [isFlying]);

  if (!visible) return null;

  const ratio = flyTimeRemaining / 5;
  const barColor = getBarColor(ratio);
  const barWidthPercent = Math.max(0, Math.min(100, ratio * 100));

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      opacity,
      transition: "opacity 1.5s ease-out",
    }}>
      {/* Cape / fly icon */}
      <span style={{
        fontSize: "16px",
        color: "#88ccff",
        filter: "drop-shadow(0 0 3px rgba(100,180,255,0.8))",
        fontWeight: "bold",
      }}>
        FLY
      </span>
      {/* Stamina bar container */}
      <div style={{
        width: 80,
        height: 10,
        background: "rgba(0,0,0,0.6)",
        borderRadius: 5,
        border: "1px solid rgba(255,255,255,0.3)",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Fill */}
        <div style={{
          width: `${barWidthPercent}%`,
          height: "100%",
          background: barColor,
          borderRadius: 4,
          transition: "width 0.1s linear, background 0.3s ease",
          boxShadow: `0 0 4px ${barColor}`,
        }} />
      </div>
      {/* Time remaining */}
      <span style={{
        fontSize: "12px",
        color: "#fff",
        fontFamily: "monospace",
        fontWeight: "bold",
        textShadow: "1px 1px 0 #000",
        minWidth: 30,
      }}>
        {flyTimeRemaining.toFixed(1)}s
      </span>
    </div>
  );
}

export function HUD3D({ lives, score, coins, scene, isFlying = false, flyTimeRemaining = 5 }: HUD3DProps) {
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
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={styles.hearts}>
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} style={{ opacity: i < lives ? 1 : 0.2, fontSize: "24px" }}>
                  &#9829;
                </span>
              ))}
            </span>
            <span style={styles.coins}>
              <span style={styles.coinIcon}>&#9679;</span> {coins}
            </span>
          </div>
          <StaminaBar isFlying={isFlying} flyTimeRemaining={flyTimeRemaining} />
        </div>
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
