import type { Controls } from "../hooks/useControls";

interface TouchControls3DProps {
  controlsRef: React.RefObject<Controls>;
}

export function TouchControls3D({ controlsRef }: TouchControls3DProps) {
  const isMobile = "ontouchstart" in window;
  if (!isMobile) return null;

  const set = (key: keyof Controls, value: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
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
          onMouseDown={set("left", true)}
          onMouseUp={set("left", false)}
        >
          &larr;
        </button>
        <button
          style={styles.dpadBtn}
          onTouchStart={set("right", true)}
          onTouchEnd={set("right", false)}
          onMouseDown={set("right", true)}
          onMouseUp={set("right", false)}
        >
          &rarr;
        </button>
      </div>

      {/* Action buttons right side */}
      <div style={styles.actions}>
        <button
          style={styles.actionBtnA}
          onTouchStart={set("jump", true)}
          onTouchEnd={set("jump", false)}
          onMouseDown={set("jump", true)}
          onMouseUp={set("jump", false)}
        >
          A
        </button>
        <button
          style={styles.actionBtnB}
          onTouchStart={set("shoot", true)}
          onTouchEnd={set("shoot", false)}
          onMouseDown={set("shoot", true)}
          onMouseUp={set("shoot", false)}
        >
          B
        </button>
      </div>
    </div>
  );
}

const btnBase: React.CSSProperties = {
  width: 65,
  height: 65,
  borderRadius: "50%",
  border: "2px solid rgba(255,255,255,0.4)",
  color: "#fff",
  fontSize: "20px",
  fontFamily: "monospace",
  fontWeight: "bold",
  cursor: "pointer",
  touchAction: "none",
  userSelect: "none",
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    bottom: 25,
    left: 0,
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    padding: "0 20px",
    pointerEvents: "auto",
    zIndex: 20,
  },
  dpad: {
    display: "flex",
    gap: 12,
  },
  dpadBtn: {
    ...btnBase,
    background: "rgba(255,255,255,0.15)",
  },
  actions: {
    display: "flex",
    gap: 12,
    alignItems: "flex-end",
  },
  actionBtnA: {
    ...btnBase,
    background: "rgba(100,200,100,0.25)",
    border: "2px solid rgba(100,200,100,0.5)",
  },
  actionBtnB: {
    ...btnBase,
    background: "rgba(255,100,100,0.25)",
    border: "2px solid rgba(255,100,100,0.5)",
    marginBottom: 30,
  },
};
