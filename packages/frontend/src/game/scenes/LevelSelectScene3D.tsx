import { useEffect, useState } from "react";
import { useGameState } from "../hooks/useGameState";
import { migrateLevelData } from "@super-mel/shared";
import type { LevelDataV2 } from "@super-mel/shared";

interface LevelEntry {
  id: string;
  name: string;
  creatorName: string;
  background: string;
  createdAt: string;
}

export function LevelSelectOverlay() {
  const setScene = useGameState((s) => s.setScene);
  const setTheme = useGameState((s) => s.setTheme);
  const startLevel = useGameState((s) => s.startLevel);
  const [levels, setLevels] = useState<LevelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLevelId, setLoadingLevelId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/levels")
      .then((r) => r.json())
      .then((data) => setLevels(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePlayLevel = async (level: LevelEntry) => {
    setLoadingLevelId(level.id);
    try {
      const res = await fetch(`/api/levels/${level.id}`);
      if (!res.ok) {
        alert("Erro ao carregar fase.");
        setLoadingLevelId(null);
        return;
      }
      const data = await res.json();
      // Migrate level data to v2 format
      const levelData: LevelDataV2 = migrateLevelData(data.data);
      // Set the theme from the level
      if (data.background) {
        setTheme(data.background);
      }
      // Start in level mode
      startLevel(level.id, levelData);
    } catch {
      alert("Erro de conexao.");
      setLoadingLevelId(null);
    }
  };

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
            <div
              key={level.id}
              style={styles.levelCard}
              onClick={() => handlePlayLevel(level)}
            >
              <div>
                <strong>{level.name}</strong>
                <br />
                <span style={styles.creator}>por {level.creatorName}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={styles.theme}>{level.background}</span>
                {loadingLevelId === level.id ? (
                  <span style={{ fontSize: "11px", color: "#ffcc00" }}>...</span>
                ) : (
                  <span style={styles.playBtn}>JOGAR</span>
                )}
              </div>
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
  playBtn: {
    fontSize: "11px",
    color: "#4a8a4a",
    fontWeight: "bold",
    fontFamily: "monospace",
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
