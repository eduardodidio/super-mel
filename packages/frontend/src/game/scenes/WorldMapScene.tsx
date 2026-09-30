import { useEffect, useState, useCallback } from "react";
import { useGameState } from "../hooks/useGameState";
import {
  loadCampaignManifest,
  loadCampaignLevel,
  type CampaignLevelMeta,
} from "../systems/LevelLoader";
import type { BackgroundTheme } from "@super-mel/shared";

// ---------------------------------------------------------------------------
// Campaign progress (localStorage)
// ---------------------------------------------------------------------------

export interface CampaignProgress {
  levelsCleared: string[];
  stars: Record<string, number>;
  bones: Record<string, number>;
}

export function loadCampaignProgress(): CampaignProgress {
  try {
    const raw = localStorage.getItem("supermel_campaign_progress");
    if (raw) return JSON.parse(raw) as CampaignProgress;
  } catch { /* ignore */ }
  return { levelsCleared: [], stars: {}, bones: {} };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorldMapScene() {
  const setScene = useGameState((s) => s.setScene);
  const setTheme = useGameState((s) => s.setTheme);
  const startCampaignLevel = useGameState((s) => s.startCampaignLevel);

  const [levels, setLevels] = useState<CampaignLevelMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLevelId, setLoadingLevelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<CampaignProgress>(loadCampaignProgress);

  // Fetch manifest on mount
  useEffect(() => {
    loadCampaignManifest()
      .then((manifest) => {
        setLevels(manifest.levels);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar campanha");
        setLoading(false);
      });
  }, []);

  // Refresh progress when scene mounts
  useEffect(() => {
    setProgress(loadCampaignProgress());
  }, []);

  const isUnlocked = useCallback(
    (index: number): boolean => {
      if (index === 0) return true;
      const prevId = levels[index - 1]?.id;
      return prevId ? progress.levelsCleared.includes(prevId) : false;
    },
    [levels, progress]
  );

  const handlePlayLevel = async (level: CampaignLevelMeta, index: number) => {
    if (!isUnlocked(index)) return;
    setLoadingLevelId(level.id);
    try {
      const levelData = await loadCampaignLevel(level.file);
      setTheme(level.theme as BackgroundTheme);
      startCampaignLevel(level.id, index, levelData);
    } catch {
      setError("Erro ao carregar fase");
      setLoadingLevelId(null);
    }
  };

  return (
    <div style={ws.overlay}>
      <h2 style={ws.title}>MUNDO 1</h2>
      <p style={ws.subtitle}>Quintal e Parque</p>

      {error && <p style={ws.error}>{error}</p>}

      <div style={ws.list}>
        {loading ? (
          <p style={ws.empty}>Carregando...</p>
        ) : (
          levels.map((level, i) => {
            const unlocked = isUnlocked(i);
            const stars = progress.stars[level.id] ?? 0;
            const bones = progress.bones[level.id] ?? 0;
            const isLoading = loadingLevelId === level.id;

            return (
              <button
                key={level.id}
                style={{
                  ...ws.levelNode,
                  opacity: unlocked ? 1 : 0.4,
                  cursor: unlocked ? "pointer" : "not-allowed",
                  borderColor: unlocked ? "#FFD700" : "#444",
                }}
                onClick={() => handlePlayLevel(level, i)}
                disabled={!unlocked || isLoading}
              >
                <div style={ws.nodeHeader}>
                  <span style={ws.levelId}>{level.id}</span>
                  <span style={ws.levelName}>{level.name}</span>
                  <span style={ws.levelTheme}>{level.theme}</span>
                </div>
                <div style={ws.nodeStats}>
                  <span style={ws.starDisplay}>
                    {Array.from({ length: 3 }, (_, si) =>
                      si < stars ? "\u2605" : "\u2606"
                    ).join("")}
                  </span>
                  <span style={ws.boneDisplay}>
                    {bones}/3
                  </span>
                  {!unlocked && <span style={ws.lockIcon}>BLOQUEADO</span>}
                  {isLoading && <span style={ws.loadingText}>...</span>}
                </div>
              </button>
            );
          })
        )}
      </div>

      <button style={ws.backBtn} onClick={() => setScene("menu")}>
        VOLTAR
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ws: Record<string, React.CSSProperties> = {
  overlay: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 30,
    background: "rgba(0,0,0,0.75)",
    fontFamily: "monospace",
    color: "#fff",
    pointerEvents: "auto",
    overflowY: "auto",
  },
  title: {
    fontSize: "32px",
    color: "#FFD700",
    margin: 0,
    textShadow: "2px 2px 0 #000",
  },
  subtitle: {
    fontSize: "14px",
    color: "#aaa",
    marginBottom: 16,
  },
  error: {
    fontSize: "13px",
    color: "#cc4444",
    marginBottom: 8,
  },
  list: {
    width: 420,
    maxWidth: "95vw",
    maxHeight: "60vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 12,
  },
  levelNode: {
    display: "flex",
    flexDirection: "column",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: 6,
    border: "2px solid #FFD700",
    fontSize: "14px",
    gap: 4,
    fontFamily: "monospace",
    color: "#fff",
    textAlign: "left" as const,
  },
  nodeHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  levelId: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#FFD700",
    minWidth: 30,
  },
  levelName: {
    fontSize: "14px",
    flex: 1,
  },
  levelTheme: {
    fontSize: "10px",
    color: "#888",
    background: "rgba(255,255,255,0.1)",
    padding: "2px 6px",
    borderRadius: 3,
  },
  nodeStats: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: "14px",
  },
  starDisplay: {
    color: "#FFD700",
    fontSize: "18px",
    letterSpacing: "2px",
  },
  boneDisplay: {
    color: "#F5F5DC",
    fontSize: "13px",
  },
  lockIcon: {
    color: "#666",
    fontSize: "10px",
    fontWeight: "bold",
    marginLeft: "auto",
  },
  loadingText: {
    color: "#FFD700",
    fontSize: "12px",
    marginLeft: "auto",
  },
  empty: {
    textAlign: "center" as const,
    color: "#666",
    padding: 30,
    fontSize: "14px",
  },
  backBtn: {
    marginTop: 8,
    marginBottom: 20,
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
