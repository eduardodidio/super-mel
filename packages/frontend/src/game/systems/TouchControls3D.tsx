import { useState, useEffect } from "react";
import type { Controls } from "../hooks/useControls";
import type { GameScene } from "../hooks/useGameState";

interface TouchControls3DProps {
  controlsRef: React.RefObject<Controls>;
  scene: GameScene;
}

export function TouchControls3D({ controlsRef, scene }: TouchControls3DProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!isMobile || scene !== "playing") return null;

  const set = (key: keyof Controls, value: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (controlsRef.current) controlsRef.current[key] = value;
  };

  return (
    <div style={styles.container}>
      {/* D-pad left side */}
      <div style={styles.dpad}>
        <button
          style={styles.dpadBtn}
          onTouchStart={set("left", true)}
          onTouchEnd={set("left", false)}
        >
          &#9664;
        </button>
        <button
          style={styles.dpadBtn}
          onTouchStart={set("right", true)}
          onTouchEnd={set("right", false)}
        >
          &#9654;
        </button>
      </div>

      {/* Action buttons right side */}
      <div style={styles.actions}>
        <button
          style={styles.btnB}
          onTouchStart={set("shoot", true)}
          onTouchEnd={set("shoot", false)}
        >
          B
        </button>
        <button
          style={styles.btnA}
          onTouchStart={set("jump", true)}
          onTouchEnd={set("jump", false)}
        >
          A
        </button>
      </div>
    </div>
  );
}

const btnBase: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  color: "#fff",
  fontSize: "20px",
  fontFamily: "monospace",
  fontWeight: "bold",
  cursor: "pointer",
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
  outline: "none",
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    bottom: 20,
    left: 0,
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    padding: "0 16px",
    pointerEvents: "auto",
    zIndex: 20,
  },
  dpad: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
  },
  dpadBtn: {
    ...btnBase,
    background: "rgba(255,255,255,0.12)",
    border: "2px solid rgba(255,255,255,0.3)",
  },
  actions: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
  },
  btnA: {
    ...btnBase,
    width: 72,
    height: 72,
    background: "rgba(80,200,80,0.2)",
    border: "2px solid rgba(80,200,80,0.4)",
    fontSize: "22px",
  },
  btnB: {
    ...btnBase,
    background: "rgba(255,120,80,0.2)",
    border: "2px solid rgba(255,120,80,0.4)",
    marginBottom: 20,
  },
};
