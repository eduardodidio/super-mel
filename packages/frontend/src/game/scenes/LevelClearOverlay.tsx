import { useGameState } from "../hooks/useGameState";
import { useEffect, useRef } from "react";

export function LevelClearOverlay() {
  const deaths = useGameState((s) => s.deaths);
  const levelCoins = useGameState((s) => s.levelCoins);
  const lives = useGameState((s) => s.lives);
  const levelStartTime = useGameState((s) => s.levelStartTime);
  const setScene = useGameState((s) => s.setScene);
  const startLevel = useGameState((s) => s.startLevel);
  const submitted = useRef(false);

  // Calculate elapsed time
  const elapsed = levelStartTime > 0
    ? Math.floor((Date.now() - levelStartTime) / 1000)
    : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = levelStartTime > 0
    ? `${minutes}:${seconds.toString().padStart(2, "0")}`
    : "--:--";

  // Star calculation: 1 = completed, 2 = zero deaths, 3 = zero deaths + coins collected
  let stars = 1;
  if (deaths === 0) {
    stars = 2;
    if (levelCoins >= 1) {
      stars = 3;
    }
  }

  // Heart display
  const maxHearts = 3;
  const heartsDisplay = Array.from({ length: maxHearts }, (_, i) =>
    i < lives ? "\u2665" : "\u2661"
  ).join(" ");

  // Star display
  const starDisplay = Array.from({ length: 3 }, (_, i) =>
    i < stars ? "\u2605" : "\u2606"
  ).join(" ");

  // POST score on mount
  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;
    const playerId = localStorage.getItem("supermel_player_id") || "";
    const state = useGameState.getState();
    const levelId = state.levelId;
    if (playerId && levelId) {
      fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          distance: Math.floor(state.coins),
          levelId,
        }),
      }).catch(() => {});
    }
  }, []);

  const handleRepeat = () => {
    const state = useGameState.getState();
    const levelId = state.levelId || "unknown";
    const levelData = state.currentLevelData ?? undefined;
    startLevel(levelId, levelData);
  };

  const handleMenu = () => {
    setScene("menu");
  };

  return (
    <div style={styles.overlay}>
      <h1 style={styles.title}>FASE COMPLETA!</h1>
      <div style={styles.stars}>{starDisplay}</div>
      <div style={styles.statsContainer}>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Moedas:</span>
          <span style={styles.statValue}>{levelCoins}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Tempo:</span>
          <span style={styles.statValue}>{timeStr}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Coracoes:</span>
          <span style={styles.heartsValue}>{heartsDisplay}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Mortes:</span>
          <span style={styles.statValue}>{deaths}</span>
        </div>
      </div>
      <div style={styles.buttons}>
        <button style={styles.btn} onClick={handleRepeat}>
          REPETIR
        </button>
        <button style={styles.btnSecondary} onClick={handleMenu}>
          MENU
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.75)",
    fontFamily: "monospace",
    color: "#fff",
    pointerEvents: "auto",
  },
  title: {
    fontSize: "42px",
    color: "#FFD700",
    margin: 0,
    textShadow: "3px 3px 0 #000",
  },
  stars: {
    fontSize: "48px",
    color: "#FFD700",
    margin: "16px 0",
    letterSpacing: "8px",
    textShadow: "2px 2px 0 #000",
  },
  statsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 24,
    minWidth: 200,
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "18px",
    gap: 16,
  },
  statLabel: {
    color: "#aaa",
  },
  statValue: {
    color: "#fff",
    fontWeight: "bold",
  },
  heartsValue: {
    color: "#FF4444",
    fontWeight: "bold",
    fontSize: "20px",
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: 200,
  },
  btn: {
    padding: "14px",
    fontSize: "18px",
    background: "#4a8a4a",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  btnSecondary: {
    padding: "10px",
    fontSize: "14px",
    background: "#4a4a8a",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
  },
};
