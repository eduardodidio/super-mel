import { useEffect, useState } from "react";
import { useGameState } from "../hooks/useGameState";

interface LevelEntry {
  id: string;
  name: string;
  creatorName: string;
  background: string;
  createdAt: string;
}

export function LevelSelectOverlay() {
  const setScene = useGameState((s) => s.setScene);
  const [levels, setLevels] = useState<LevelEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/levels")
      .then((r) => r.json())
      .then((data) => setLevels(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.overlay}>
      <h2 style={styles.title}>FASES DA COMUNIDADE</h2>

      <div style={styles.list}>
        {loading ? (
          <p style={styles.empty}>Carregando...</p>
        ) : levels.length === 0 ? (
          <p style={styles.empty}>Nenhuma fase publicada ainda. Crie a primeira!</p>
        ) : (
          levels.map((level) => (
            <div key={level.id} style={styles.levelCard}>
              <div>
                <strong>{level.name}</strong>
                <br />
                <span style={styles.creator}>por {level.creatorName}</span>
              </div>
              <span style={styles.theme}>{level.background}</span>
            </div>
          ))
        )}
      </div>

      <button style={styles.backBtn} onClick={() => setScene("menu")}>
        VOLTAR
      </button>
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
    fontSize: "32px",
    color: "#ffcc00",
    marginBottom: 20,
    textShadow: "2px 2px 0 #000",
  },
  list: {
    width: 400,
    maxWidth: "90vw",
    maxHeight: "50vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  levelCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    border: "1px solid #333",
    cursor: "pointer",
    fontSize: "14px",
  },
  creator: {
    fontSize: "11px",
    color: "#888",
  },
  theme: {
    fontSize: "11px",
    color: "#aaa",
    background: "rgba(255,255,255,0.1)",
    padding: "2px 8px",
    borderRadius: 3,
  },
  empty: {
    textAlign: "center" as const,
    color: "#666",
    padding: 30,
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
    fontWeight: "bold",
  },
};
