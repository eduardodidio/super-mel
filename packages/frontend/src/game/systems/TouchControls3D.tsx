import { useState, useEffect, useCallback } from "react";
import type { Controls } from "../hooks/useControls";
import { useGameState, type GameScene } from "../hooks/useGameState";

interface TouchControls3DProps {
  controlsRef: React.RefObject<Controls>;
  scene: GameScene;
}

export function TouchControls3D({ controlsRef, scene }: TouchControls3DProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  const gamepadConnected = useGameState((s) => s.gamepadConnected);
  const setPaused = useGameState((s) => s.setPaused);

  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const handlePress = useCallback(
    (key: keyof Controls, value: boolean) => (e: React.PointerEvent | React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (controlsRef.current) controlsRef.current[key] = value;
      setPressed((prev) => ({ ...prev, [key]: value }));
      // Track touch input type
      if (value) {
        const state = useGameState.getState();
        if (state.lastInputType !== "touch") {
          state.setLastInputType("touch");
        }
      }
    },
    [controlsRef],
  );

  const handleRelease = useCallback(
    (key: keyof Controls) => () => {
      if (controlsRef.current) controlsRef.current[key] = false;
      setPressed((prev) => ({ ...prev, [key]: false }));
    },
    [controlsRef],
  );

  const preventContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handlePause = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setPaused(true);
    },
    [setPaused],
  );

  if (!isMobile || scene !== "playing" || gamepadConnected) return null;

  const btnStyle = (key: string, base: React.CSSProperties): React.CSSProperties => ({
    ...base,
    opacity: pressed[key] ? 0.6 : 0.85,
    transform: pressed[key] ? "scale(0.9)" : "scale(1)",
    transition: "opacity 0.1s, transform 0.1s",
  });

  return (
    <>
      {/* Mobile pause button — top-right, positioned relative to viewport */}
      <button
        style={styles.pauseBtn}
        onPointerDown={handlePause}
        onContextMenu={preventContextMenu}
      >
        {"\u275A\u275A"}
      </button>

      <div style={styles.container} onContextMenu={preventContextMenu}>
        {/* D-pad left side -- 4-direction cross */}
        <div style={styles.dpad}>
          <div style={styles.dpadRow}>
            <div style={styles.dpadSpacer} />
            <button
              style={btnStyle("up", styles.dpadBtn)}
              onPointerDown={handlePress("up", true)}
              onPointerUp={handlePress("up", false)}
              onPointerLeave={handleRelease("up")}
              onPointerCancel={handleRelease("up")}
              onContextMenu={preventContextMenu}
            >
              &#9650;
            </button>
            <div style={styles.dpadSpacer} />
          </div>
          <div style={styles.dpadRow}>
            <button
              style={btnStyle("left", styles.dpadBtn)}
              onPointerDown={handlePress("left", true)}
              onPointerUp={handlePress("left", false)}
              onPointerLeave={handleRelease("left")}
              onPointerCancel={handleRelease("left")}
              onContextMenu={preventContextMenu}
            >
              &#9664;
            </button>
            <div style={styles.dpadCenter} />
            <button
              style={btnStyle("right", styles.dpadBtn)}
              onPointerDown={handlePress("right", true)}
              onPointerUp={handlePress("right", false)}
              onPointerLeave={handleRelease("right")}
              onPointerCancel={handleRelease("right")}
              onContextMenu={preventContextMenu}
            >
              &#9654;
            </button>
          </div>
          <div style={styles.dpadRow}>
            <div style={styles.dpadSpacer} />
            <button
              style={btnStyle("down", styles.dpadBtn)}
              onPointerDown={handlePress("down", true)}
              onPointerUp={handlePress("down", false)}
              onPointerLeave={handleRelease("down")}
              onPointerCancel={handleRelease("down")}
              onContextMenu={preventContextMenu}
            >
              &#9660;
            </button>
            <div style={styles.dpadSpacer} />
          </div>
        </div>

        {/* Action buttons right side */}
        <div style={styles.actions}>
          <button
            style={btnStyle("bark", styles.btnC)}
            onPointerDown={handlePress("bark", true)}
            onPointerUp={handlePress("bark", false)}
            onPointerLeave={handleRelease("bark")}
            onPointerCancel={handleRelease("bark")}
            onContextMenu={preventContextMenu}
          >
            C
          </button>
          <button
            style={btnStyle("shoot", styles.btnB)}
            onPointerDown={handlePress("shoot", true)}
            onPointerUp={handlePress("shoot", false)}
            onPointerLeave={handleRelease("shoot")}
            onPointerCancel={handleRelease("shoot")}
            onContextMenu={preventContextMenu}
          >
            B
          </button>
          <button
            style={btnStyle("jump", styles.btnA)}
            onPointerDown={handlePress("jump", true)}
            onPointerUp={handlePress("jump", false)}
            onPointerLeave={handleRelease("jump")}
            onPointerCancel={handleRelease("jump")}
            onContextMenu={preventContextMenu}
          >
            A
          </button>
        </div>
      </div>
    </>
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
  touchAction: "manipulation",
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
  outline: "none",
  opacity: 0.85,
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    bottom: "max(20px, env(safe-area-inset-bottom, 20px))" as unknown as number,
    left: 0,
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    padding: "0 16px",
    pointerEvents: "auto",
    zIndex: 20,
    touchAction: "none",
    userSelect: "none",
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
  pauseBtn: {
    position: "absolute" as const,
    top: 12,
    right: 80,
    width: 40,
    height: 40,
    borderRadius: 6,
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.7)",
    fontSize: "14px",
    fontFamily: "monospace",
    fontWeight: "bold",
    cursor: "pointer",
    touchAction: "manipulation",
    userSelect: "none" as const,
    WebkitUserSelect: "none" as const,
    WebkitTouchCallout: "none" as const,
    outline: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 25,
    letterSpacing: "2px",
  },
};
