import { useEffect, useState, useCallback } from "react";

interface LeaderboardEntry {
  id: string;
  playerName: string;
  distance: number;
  createdAt: string;
}

interface LeaderboardViewProps {
  onBack: () => void;
  initialTab?: "infinite" | "daily";
}

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function LeaderboardView({ onBack, initialTab = "infinite" }: LeaderboardViewProps) {
  const [tab, setTab] = useState<"infinite" | "daily">(initialTab);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [dailyEntries, setDailyEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [dailyDate, setDailyDate] = useState<string>(todayDateString);

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

  const fetchDailyLeaderboard = useCallback(async (date: string) => {
    setLoadingDaily(true);
    try {
      const res = await fetch(`/api/daily/leaderboard?date=${date}`);
      if (res.ok) {
        setDailyEntries(await res.json());
      }
    } catch {
      setDailyEntries([]);
    } finally {
      setLoadingDaily(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "daily") {
      fetchDailyLeaderboard(dailyDate);
    }
  }, [tab, dailyDate, fetchDailyLeaderboard]);

  const handlePrevDay = () => {
    setDailyDate(prev => shiftDate(prev, -1));
  };

  const handleNextDay = () => {
    const today = todayDateString();
    setDailyDate(prev => {
      const next = shiftDate(prev, 1);
      return next > today ? prev : next;
    });
  };

  const isToday = dailyDate === todayDateString();

  const currentPlayer = localStorage.getItem("supermel_player_name") || "";
  const activeEntries = tab === "infinite" ? entries : dailyEntries;
  const isLoading = tab === "infinite" ? loading : loadingDaily;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>LEADERBOARD</h2>

      <div style={styles.tabBar}>
        <button
          style={tab === "infinite" ? styles.tabActive : styles.tab}
          onClick={() => setTab("infinite")}
        >
          GERAL
        </button>
        <button
          style={tab === "daily" ? styles.tabActive : styles.tab}
          onClick={() => setTab("daily")}
        >
          DIARIO
        </button>
      </div>

      {tab === "daily" && (
        <div style={styles.dateSelector}>
          <button style={styles.dateBtn} onClick={handlePrevDay}>
            ◀
          </button>
          <span>{dailyDate}</span>
          <button
            style={{
              ...styles.dateBtn,
              opacity: isToday ? 0.3 : 1,
            }}
            disabled={isToday}
            onClick={handleNextDay}
          >
            ▶
          </button>
        </div>
      )}

      <div style={styles.table}>
        <div style={styles.headerRow}>
          <span style={styles.rank}>#</span>
          <span style={styles.name}>Jogador</span>
          <span style={styles.score}>Distancia</span>
        </div>
        {isLoading ? (
          <p style={styles.loading}>Carregando...</p>
        ) : activeEntries.length === 0 ? (
          <p style={styles.loading}>
            {tab === "daily" ? "Nenhum score neste dia." : "Nenhum score ainda. Seja o primeiro!"}
          </p>
        ) : (
          activeEntries.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                ...styles.row,
                backgroundColor:
                  entry.playerName === currentPlayer ? "#3a3a6a" : "transparent",
              }}
            >
              <span style={styles.rank}>
                {i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : `${i + 1}`}
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
  tabBar: {
    display: "flex",
    gap: 0,
    marginBottom: 10,
    width: 400,
    maxWidth: "90vw",
  },
  tab: {
    flex: 1,
    padding: "10px",
    fontSize: "14px",
    background: "#2a2a4e",
    color: "#888",
    border: "1px solid #4a4a8a",
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  tabActive: {
    flex: 1,
    padding: "10px",
    fontSize: "14px",
    background: "#4a4a8a",
    color: "#ffcc00",
    border: "1px solid #4a4a8a",
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  dateSelector: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 10,
    color: "#ccc",
    fontSize: "14px",
    fontFamily: "monospace",
  },
  dateBtn: {
    padding: "4px 10px",
    fontSize: "14px",
    background: "#2a2a4e",
    color: "#ccc",
    border: "1px solid #4a4a8a",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
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
