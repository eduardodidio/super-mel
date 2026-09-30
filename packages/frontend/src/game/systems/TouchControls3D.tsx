import { useState, useEffect } from "react";
import type { Controls } from "../hooks/useControls";
import { useGameState, type GameScene } from "../hooks/useGameState";

interface TouchControls3DProps {
  controlsRef: React.RefObject<Controls>;
  scene: GameScene;
}

export function TouchControls3D({ controlsRef, scene }: TouchControls3DProps) {
  const [isMobile, setIsMobile] = useState(false);
  const gamepadConnected = useGameState((s) => s.gamepadConnected);

  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!isMobile || scene !== "playing" || gamepadConnected) return null;

  const set = (key: keyof Controls, value: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (controlsRef.current) controlsRef.current[key] = value;
    // Track touch input type
    if (value) {
      const state = useGameState.getState();
      if (state.lastInputType !== "touch") {
        state.setLastInputType("touch");
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* D-pad left side — 4-direction cross */}
      <div style={styles.dpad}>
        <div style={styles.dpadRow}>
          <div style={styles.dpadSpacer} />
          <button
            style={styles.dpadBtn}
            onTouchStart={set("up", true)}
            onTouchEnd={set("up", false)}
          >
            &#9650;
          </button>
          <div style={styles.dpadSpacer} />
        </div>
        <div style={styles.dpadRow}>
          <button
            style={styles.dpadBtn}
            onTouchStart={set("left", true)}
            onTouchEnd={set("left", false)}
          >
            &#9664;
          </button>
          <div style={styles.dpadCenter} />
          <button
            style={styles.dpadBtn}
            onTouchStart={set("right", true)}
            onTouchEnd={set("right", false)}
          >
            &#9654;
          </button>
        </div>
        <div style={styles.dpadRow}>
          <div style={styles.dpadSpacer} />
          <button
            style={styles.dpadBtn}
            onTouchStart={set("down", true)}
            onTouchEnd={set("down", false)}
          >
            &#9660;
          </button>
          <div style={styles.dpadSpacer} />
        </div>
      </div>

      {/* Action buttons right side */}
      <div style={styles.actions}>
        <button
          style={styles.btnC}
          onTouchStart={set("bark", true)}
          onTouchEnd={set("bark", false)}
        >
          C
        </button>
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
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    width: 180,
    height: 180,
  },
  dpadRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dpadBtn: {
    ...btnBase,
    width: 56,
    height: 56,
    background: "rgba(255,255,255,0.12)",
    border: "2px solid rgba(255,255,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dpadSpacer: {
    width: 56,
    height: 56,
  },
  dpadCenter: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
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
  btnC: {
    ...btnBase,
    width: 56,
    height: 56,
    background: "rgba(218,165,32,0.2)",
    border: "2px solid rgba(218,165,32,0.4)",
    marginBottom: 30,
    fontSize: "18px",
  },
};
