import { useGameState } from "../hooks/useGameState";
import { useEffect, useRef, useState } from "react";

export function GameOverOverlay() {
  const score = useGameState((s) => s.score);
  const setScene = useGameState((s) => s.setScene);
  const resetGame = useGameState((s) => s.resetGame);
  const dailyMode = useGameState((s) => s.dailyMode);
  const dailySeed = useGameState((s) => s.dailySeed);
  const submitted = useRef(false);
  const [dailyResult, setDailyResult] = useState<{ rank: number; totalPlayers: number } | null>(null);

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;

    const playerId = localStorage.getItem("supermel_player_id") || "";
    if (playerId) {
      fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          distance: Math.floor(score),
          mode: dailyMode ? "daily" : "infinite",
          seed: dailyMode ? dailySeed : undefined,
        }),
      })
        .then(() => {
          if (dailyMode && playerId) {
            fetch(`/api/daily/my-result?playerId=${playerId}`)
              .then(r => r.json())
              .then(data => {
                if (data.played) {
                  setDailyResult({ rank: data.rank, totalPlayers: data.totalPlayers });
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [score, dailyMode, dailySeed]);

  return (
    <div style={styles.overlay}>
      <h1 style={styles.title}>GAME OVER</h1>
      <p style={styles.score}>Distancia: {Math.floor(score)}m</p>
      {dailyMode && (
        <div style={styles.dailyResult}>
          <h2 style={styles.dailyTitle}>DESAFIO DO DIA</h2>
          {dailyResult ? (
            <p style={styles.dailyRank}>
              Posicao: {dailyResult.rank}o de {dailyResult.totalPlayers} jogadores
            </p>
          ) : (
            <p style={styles.dailyRank}>Calculando ranking...</p>
          )}
        </div>
      )}
      <div style={styles.buttons}>
        {dailyMode ? (
          <button style={styles.btn} onClick={() => setScene("menu")}>
            MENU
          </button>
        ) : (
          <>
            <button style={styles.btn} onClick={() => resetGame()}>
              JOGAR DE NOVO
            </button>
            <button style={styles.btnSecondary} onClick={() => setScene("menu")}>
              MENU
            </button>
          </>
        )}
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
  dailyResult: {
    textAlign: "center" as const,
    marginBottom: 10,
  },
  dailyTitle: {
    fontSize: "24px",
    color: "#ffcc00",
    margin: "0 0 8px 0",
    fontFamily: "monospace",
  },
  dailyRank: {
    fontSize: "16px",
    color: "#ccc",
    margin: 0,
    fontFamily: "monospace",
  },
};
