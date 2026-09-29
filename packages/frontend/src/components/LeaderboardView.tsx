import { useEffect, useState } from "react";

interface LeaderboardEntry {
  id: string;
  playerName: string;
  distance: number;
  createdAt: string;
}

interface LeaderboardViewProps {
  onBack: () => void;
}

export function LeaderboardView({ onBack }: LeaderboardViewProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      const res = await fetch("/api/scores/leaderboard");
      if (res.ok) {
        setEntries(await res.json());
      }
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }

  const currentPlayer = localStorage.getItem("supermel_player_name") || "";

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>LEADERBOARD</h2>
      <div style={styles.table}>
        <div style={styles.headerRow}>
          <span style={styles.rank}>#</span>
          <span style={styles.name}>Jogador</span>
          <span style={styles.score}>Distancia</span>
        </div>
        {loading ? (
          <p style={styles.loading}>Carregando...</p>
        ) : entries.length === 0 ? (
          <p style={styles.loading}>Nenhum score ainda. Seja o primeiro!</p>
        ) : (
          entries.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                ...styles.row,
                backgroundColor:
                  entry.playerName === currentPlayer ? "#3a3a6a" : "transparent",
              }}
            >
              <span style={styles.rank}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
              </span>
              <span style={styles.name}>{entry.playerName}</span>
              <span style={styles.score}>{entry.distance}m</span>
            </div>
          ))
        )}
      </div>
      <button onClick={onBack} style={styles.backBtn}>
        VOLTAR
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a2e",
    fontFamily: "monospace",
    color: "#fff",
  },
  title: {
    fontSize: "36px",
    color: "#ffcc00",
    marginBottom: 20,
    textShadow: "2px 2px 0 #000",
  },
  table: {
    width: 400,
    maxWidth: "90vw",
    maxHeight: "60vh",
    overflowY: "auto",
    border: "1px solid #4a4a8a",
    borderRadius: 4,
  },
  headerRow: {
    display: "flex",
    padding: "10px 12px",
    backgroundColor: "#4a4a8a",
    fontWeight: "bold",
    fontSize: "14px",
  },
  row: {
    display: "flex",
    padding: "8px 12px",
    borderBottom: "1px solid #2a2a4e",
    fontSize: "14px",
  },
  rank: { width: 40 },
  name: { flex: 1 },
  score: { width: 80, textAlign: "right" as const },
  loading: {
    textAlign: "center" as const,
    padding: 20,
    color: "#888",
    fontSize: "14px",
  },
  backBtn: {
    marginTop: 20,
    padding: "10px 24px",
    fontSize: "16px",
    background: "#4a4a8a",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
  },
};
