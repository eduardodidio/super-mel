import { useGameState } from "../hooks/useGameState";
import { useEffect, useRef, useState } from "react";
import type { MissionStatus } from "../systems/MissionTracker";
import {
  loadCampaignManifest,
  loadCampaignLevel,
} from "../systems/LevelLoader";
import type { BackgroundTheme } from "@super-mel/shared";

interface LevelClearOverlayProps {
  missionStatus?: MissionStatus[];
}

// ---------------------------------------------------------------------------
// Campaign progress persistence (localStorage)
// ---------------------------------------------------------------------------

function saveCampaignProgress(levelId: string, stars: number, bones: number) {
  try {
    const raw = localStorage.getItem("supermel_campaign_progress");
    const progress = raw
      ? JSON.parse(raw)
      : { levelsCleared: [] as string[], stars: {} as Record<string, number>, bones: {} as Record<string, number> };

    // Add to levelsCleared if not already there
    if (!progress.levelsCleared.includes(levelId)) {
      progress.levelsCleared.push(levelId);
    }

    // Keep the best star rating
    progress.stars[levelId] = Math.max(progress.stars[levelId] ?? 0, stars);

    // Keep the best bone count
    progress.bones[levelId] = Math.max(progress.bones[levelId] ?? 0, bones);

    localStorage.setItem("supermel_campaign_progress", JSON.stringify(progress));
  } catch {
    // localStorage quota or access error -- ignore
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LevelClearOverlay({ missionStatus }: LevelClearOverlayProps) {
  const deaths = useGameState((s) => s.deaths);
  const levelCoins = useGameState((s) => s.levelCoins);
  const lives = useGameState((s) => s.lives);
  const levelStartTime = useGameState((s) => s.levelStartTime);
  const setScene = useGameState((s) => s.setScene);
  const startLevel = useGameState((s) => s.startLevel);
  const startCampaignLevel = useGameState((s) => s.startCampaignLevel);
  const setTheme = useGameState((s) => s.setTheme);
  const submitted = useRef(false);

  // Campaign state
  const campaignLevelId = useGameState((s) => s.campaignLevelId);
  const campaignIndex = useGameState((s) => s.campaignIndex);
  const levelBones = useGameState((s) => s.levelBones);

  // Loading state for "PROXIMA FASE" button
  const [loadingNext, setLoadingNext] = useState(false);

  // Calculate elapsed time
  const elapsed = levelStartTime > 0
    ? Math.floor((Date.now() - levelStartTime) / 1000)
    : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = levelStartTime > 0
    ? `${minutes}:${seconds.toString().padStart(2, "0")}`
    : "--:--";

  // Star calculation: if level has missions, 3 stars = all missions complete
  const hasMissions = missionStatus && missionStatus.length > 0;
  let stars = 1;
  if (deaths === 0) stars = 2;
  if (hasMissions) {
    if (missionStatus!.every((ms) => ms.completed)) stars = 3;
  } else {
    // Legacy: no missions defined -- keep old calculation
    if (deaths === 0 && levelCoins >= 1) stars = 3;
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

  // POST score on mount + persist mission completions + save campaign progress
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

    // Persist mission completions to backend for registered users
    const completedIds = missionStatus
      ?.filter((ms) => ms.completed)
      .map((ms) => ms.mission.id) ?? [];
    if (completedIds.length > 0 && levelId) {
      const token = localStorage.getItem("supermel_token");
      const pid = localStorage.getItem("supermel_player_id") || "";
      if (token && !pid.startsWith("local-")) {
        fetch("/api/progress", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              levelMissions: { [levelId]: completedIds },
            },
          }),
        }).catch(() => {});
      }
    }

    // Save campaign progress to localStorage
    if (state.campaignLevelId) {
      saveCampaignProgress(state.campaignLevelId, stars, state.levelBones);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRepeat = () => {
    const state = useGameState.getState();
    const levelId = state.levelId || "unknown";
    const levelData = state.currentLevelData ?? undefined;

    // Use startCampaignLevel to preserve campaign context when replaying a campaign level
    if (state.campaignLevelId && levelData) {
      startCampaignLevel(state.campaignLevelId, state.campaignIndex, levelData);
    } else {
      startLevel(levelId, levelData);
    }
  };

  const handleMenu = () => {
    setTheme("forest" as BackgroundTheme);
    // Clear stale campaign/level state so menu starts clean
    useGameState.setState({
      campaignLevelId: null,
      campaignIndex: -1,
      currentLevelData: null,
      gameMode: "infinite",
      levelId: null,
      levelCoins: 0,
      levelBones: 0,
      deaths: 0,
      lastCheckpoint: null,
      levelCompleting: false,
    });
    setScene("menu");
  };

  const handleWorldMap = () => {
    setTheme("forest" as BackgroundTheme);
    setScene("worldmap");
  };

  const handleNextLevel = async () => {
    setLoadingNext(true);
    try {
      const manifest = await loadCampaignManifest();
      const nextIndex = campaignIndex + 1;
      if (nextIndex >= manifest.levels.length) {
        // Last level completed -- go to world map
        setTheme("forest" as BackgroundTheme);
        setScene("worldmap");
        return;
      }
      const nextLevel = manifest.levels[nextIndex];
      const levelData = await loadCampaignLevel(nextLevel.file);
      setTheme(nextLevel.theme as BackgroundTheme);
      startCampaignLevel(nextLevel.id, nextIndex, levelData);
    } catch {
      // Fallback to world map on error
      setTheme("forest" as BackgroundTheme);
      setScene("worldmap");
    } finally {
      setLoadingNext(false);
    }
  };

  // Check if this was an editor test level
  const levelId = useGameState.getState().levelId;
  const isEditorTest = levelId?.startsWith("editor-test-") ?? false;
  const isCampaign = !!campaignLevelId;

  const handleBackToEditor = () => {
    // Signal that the editor test was cleared
    sessionStorage.setItem("supermel_editor_test_cleared", "true");
    setScene("editor");
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
        {isCampaign && (
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Ossos:</span>
            <span style={styles.boneValue}>{levelBones}/3</span>
          </div>
        )}
      </div>

      {/* Mission status section */}
      {hasMissions && (
        <div style={styles.missionsContainer}>
          <h3 style={styles.missionsTitle}>MISSOES</h3>
          {(missionStatus ?? []).map((ms, i) => (
            <div key={i} style={styles.missionRow}>
              <span style={{
                ...styles.missionCheck,
                color: ms.completed ? "#4a8a4a" : "#666",
              }}>
                {ms.completed ? "\u2713" : "\u2717"}
              </span>
              <span style={{
                ...styles.missionDesc,
                color: ms.completed ? "#fff" : "#888",
              }}>
                {ms.mission.description}
              </span>
              <span style={styles.missionProgress}>
                {ms.progressText}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={styles.buttons}>
        {/* Campaign: PROXIMA FASE */}
        {isCampaign && (
          <button style={styles.btn} onClick={handleNextLevel} disabled={loadingNext}>
            {loadingNext ? "..." : "PROXIMA FASE"}
          </button>
        )}

        {isEditorTest && (
          <button style={styles.btn} onClick={handleBackToEditor}>
            VOLTAR AO EDITOR
          </button>
        )}
        <button style={(isEditorTest || isCampaign) ? styles.btnSecondary : styles.btn} onClick={handleRepeat}>
          REPETIR
        </button>

        {/* Campaign: MAPA */}
        {isCampaign && (
          <button style={styles.btnSecondary} onClick={handleWorldMap}>
            MAPA
          </button>
        )}

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
    maxHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflowY: "auto",
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
  boneValue: {
    color: "#F5F5DC",
    fontWeight: "bold",
  },
  missionsContainer: {
    marginBottom: 16,
    minWidth: 280,
  },
  missionsTitle: {
    fontSize: "16px",
    color: "#FFD700",
    margin: "0 0 8px 0",
    textAlign: "center" as const,
  },
  missionRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    fontSize: "14px",
  },
  missionCheck: {
    fontSize: "18px",
    fontWeight: "bold",
    minWidth: 20,
  },
  missionDesc: {
    flex: 1,
  },
  missionProgress: {
    color: "#aaa",
    fontSize: "12px",
    fontFamily: "monospace",
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
