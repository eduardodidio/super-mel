import { useGameState } from "../hooks/useGameState";
import { useEffect, useRef } from "react";

export function GameOverOverlay() {
  const score = useGameState((s) => s.score);
  const setScene = useGameState((s) => s.setScene);
  const resetGame = useGameState((s) => s.resetGame);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;

    const playerId = localStorage.getItem("supermel_player_id") || "";
    if (playerId) {
      fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, distance: Math.floor(score) }),
      }).catch(() => {});
    }
  }, [score]);

  return (
    <div style={styles.overlay}>
      <h1 style={styles.title}>GAME OVER</h1>
      <p style={styles.score}>Distancia: {Math.floor(score)}m</p>
      <div style={styles.buttons}>
        <button style={styles.btn} onClick={() => resetGame()}>
          JOGAR DE NOVO
        </button>
        <button style={styles.btnSecondary} onClick={() => setScene("menu")}>
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
    background: "rgba(0,0,0,0.7)",
    fontFamily: "monospace",
    color: "#fff",
    pointerEvents: "auto",
  },
  title: {
    fontSize: "48px",
    color: "#ff4444",
    margin: 0,
    textShadow: "3px 3px 0 #000",
  },
  score: {
    fontSize: "24px",
    color: "#ffcc00",
    margin: "20px 0",
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
