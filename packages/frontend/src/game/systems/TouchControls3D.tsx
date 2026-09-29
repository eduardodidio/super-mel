import { useEffect } from "react";
import type { Controls } from "../hooks/useControls";

interface TouchControls3DProps {
  controlsRef: React.RefObject<Controls>;
}

export function TouchControls3D({ controlsRef }: TouchControls3DProps) {
  const isMobile = "ontouchstart" in window;

  useEffect(() => {
    if (!isMobile) return;
    // Touch events are handled by the buttons below
  }, [isMobile]);

  if (!isMobile) return null;

  const handleFlapStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (controlsRef.current) controlsRef.current.flap = true;
  };
  const handleFlapEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (controlsRef.current) controlsRef.current.flap = false;
  };
  const handleShootStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (controlsRef.current) controlsRef.current.shoot = true;
  };
  const handleShootEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (controlsRef.current) controlsRef.current.shoot = false;
  };

  return (
    <div style={styles.container}>
      <button
        style={styles.flapBtn}
        onTouchStart={handleFlapStart}
        onTouchEnd={handleFlapEnd}
        onMouseDown={handleFlapStart}
        onMouseUp={handleFlapEnd}
      >
        VOAR
      </button>
      <button
        style={styles.shootBtn}
        onTouchStart={handleShootStart}
        onTouchEnd={handleShootEnd}
        onMouseDown={handleShootStart}
        onMouseUp={handleShootEnd}
      >
        ATIRAR
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    bottom: 30,
    left: 0,
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    padding: "0 30px",
    pointerEvents: "auto",
    zIndex: 20,
  },
  flapBtn: {
    width: 90,
    height: 90,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    border: "2px solid rgba(255,255,255,0.4)",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "monospace",
    fontWeight: "bold",
    cursor: "pointer",
    touchAction: "none",
    userSelect: "none",
  },
  shootBtn: {
    width: 90,
    height: 90,
    borderRadius: "50%",
    background: "rgba(255,100,100,0.2)",
    border: "2px solid rgba(255,100,100,0.4)",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "monospace",
    fontWeight: "bold",
    cursor: "pointer",
    touchAction: "none",
    userSelect: "none",
  },
};
