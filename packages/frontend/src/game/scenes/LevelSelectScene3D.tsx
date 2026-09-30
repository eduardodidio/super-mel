import { useEffect, useState, useCallback } from "react";
import { useGameState } from "../hooks/useGameState";
import { migrateLevelData } from "@super-mel/shared";
import type { LevelDataV2 } from "@super-mel/shared";

// --- Types ---
interface LevelEntry {
  id: string;
  name: string;
  creatorName: string;
  background: string;
  createdAt: string;
  code: string | null;
  plays: number;
  clears: number;
  clearRate: number;
  difficulty: string | null;
}

type SortMode = "new" | "popular";

const STAMP_LABELS: Record<string, string> = {
  paw: "\uD83D\uDC3E",
  heart: "\u2665",
  bone: "\uD83E\uDDB4",
  star: "\u2605",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Facil: "#4a8a4a",
  Normal: "#ccaa00",
  Dificil: "#cc6600",
  Extremo: "#cc2222",
};

const REPORT_REASONS = [
  { value: "nome_inadequado", label: "Nome inadequado" },
  { value: "conteudo_ofensivo", label: "Conteudo ofensivo" },
  { value: "impossivel", label: "Impossivel de passar" },
  { value: "outro", label: "Outro motivo" },
];

// --- Component ---
export function LevelSelectOverlay() {
  const setScene = useGameState((s) => s.setScene);
  const setTheme = useGameState((s) => s.setTheme);
  const startLevel = useGameState((s) => s.startLevel);

  const [levels, setLevels] = useState<LevelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLevelId, setLoadingLevelId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("new");
  const [familyMode, setFamilyMode] = useState(() => {
    const stored = localStorage.getItem("supermel_family_mode");
    return stored !== "false"; // default ON
  });

  // F46: Code search state
  const [codeInput, setCodeInput] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // F46: Reactions state per level
  const [reactions, setReactions] = useState<Record<string, { stamps: Record<string, number>; playerStamp: string | null }>>({});

  // F46: Report dropdown
  const [reportLevelId, setReportLevelId] = useState<string | null>(null);

  const playerId = localStorage.getItem("supermel_player_id") || "";

  // Fetch levels
  const fetchLevels = useCallback(() => {
    setLoading(true);
    fetch(`/api/levels?sort=${sortMode}&familyMode=${familyMode}`)
      .then((r) => r.json())
      .then((data) => {
        setLevels(Array.isArray(data) ? data : []);
        // Fetch reactions for each level
        for (const level of (Array.isArray(data) ? data : [])) {
          fetchReactions(level.id);
        }
      })
      .catch(() => setLevels([]))
      .finally(() => setLoading(false));
  }, [sortMode, familyMode]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  // Persist family mode
  useEffect(() => {
    localStorage.setItem("supermel_family_mode", String(familyMode));
  }, [familyMode]);

  // Fetch reactions for a level
  const fetchReactions = useCallback((levelId: string) => {
    fetch(`/api/levels/${levelId}/reactions?playerId=${playerId}`)
      .then((r) => r.json())
      .then((data) => {
        setReactions((prev) => ({
          ...prev,
          [levelId]: { stamps: data.stamps, playerStamp: data.playerStamp },
        }));
      })
      .catch(() => {});
  }, [playerId]);

  // Track play attempt
  const trackAttempt = useCallback((levelId: string) => {
    if (!playerId) return;
    fetch(`/api/levels/${levelId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, cleared: false }),
    }).catch(() => {});
  }, [playerId]);

  // Play a level from the list
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
      const levelData: LevelDataV2 = migrateLevelData(data.data);
      if (data.background) {
        setTheme(data.background);
      }
      trackAttempt(level.id);
      startLevel(level.id, levelData);
    } catch {
      alert("Erro de conexao.");
      setLoadingLevelId(null);
    }
  };

  // F46: Code search
  const handleCodeSearch = async () => {
    if (codeInput.length !== 6) return;
    setCodeLoading(true);
    setCodeError(null);
    try {
      const res = await fetch(`/api/levels/code/${codeInput}`);
      if (!res.ok) {
        setCodeError("Codigo nao encontrado");
        return;
      }
      const data = await res.json();
      const levelData: LevelDataV2 = migrateLevelData(data.data);
      if (data.background) {
        setTheme(data.background);
      }
      trackAttempt(data.id);
      startLevel(data.id, levelData);
    } catch {
      setCodeError("Erro de conexao");
    } finally {
      setCodeLoading(false);
    }
  };

  // F46: Stamp reaction toggle
  const handleStampClick = useCallback((levelId: string, stamp: string) => {
    if (!playerId) return;

    const current = reactions[levelId];
    const isCurrentStamp = current?.playerStamp === stamp;

    if (isCurrentStamp) {
      // Remove reaction
      fetch(`/api/levels/${levelId}/reaction`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      }).catch(() => {});

      // Optimistic update
      setReactions((prev) => ({
        ...prev,
        [levelId]: {
          stamps: { ...current.stamps, [stamp]: Math.max(0, (current.stamps[stamp] || 0) - 1) },
          playerStamp: null,
        },
      }));
    } else {
      // Add/change reaction
      fetch(`/api/levels/${levelId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, stamp }),
      }).catch(() => {});

      // Optimistic update
      const newStamps = { ...(current?.stamps || { paw: 0, heart: 0, bone: 0, star: 0 }) };
      if (current?.playerStamp) {
        newStamps[current.playerStamp] = Math.max(0, (newStamps[current.playerStamp] || 0) - 1);
      }
      newStamps[stamp] = (newStamps[stamp] || 0) + 1;

      setReactions((prev) => ({
        ...prev,
        [levelId]: { stamps: newStamps, playerStamp: stamp },
      }));
    }
  }, [playerId, reactions]);

  // F46: Report
  const handleReport = useCallback((levelId: string, reason: string) => {
    if (!playerId) return;
    fetch(`/api/levels/${levelId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, reason }),
    })
      .then((res) => {
        if (res.status === 409) {
          alert("Voce ja denunciou esta fase");
        } else if (res.ok) {
          alert("Denuncia enviada");
        } else {
          alert("Erro ao denunciar");
        }
      })
      .catch(() => alert("Erro de conexao"));
    setReportLevelId(null);
  }, [playerId]);

  // Difficulty badge
  const diffBadge = (d: string | null) => {
    const label = d || "Novo";
    const color = d ? DIFFICULTY_COLORS[d] || "#666" : "#666";
    return (
      <span style={{ ...ls.diffBadge, background: color }}>
        {label}
      </span>
    );
  };

  return (
    <div style={ls.overlay}>
      <h2 style={ls.title}>FASES DA COMUNIDADE</h2>

      {/* F46: Code search */}
      <div style={ls.codeSearch}>
        <input
          type="text"
          placeholder="CODIGO (6 letras)"
          value={codeInput}
          onChange={(e) => {
            setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
            setCodeError(null);
          }}
          maxLength={6}
          style={ls.codeInput}
        />
        <button
          onClick={handleCodeSearch}
          disabled={codeInput.length !== 6 || codeLoading}
          style={{
            ...ls.codeBtn,
            opacity: codeInput.length === 6 && !codeLoading ? 1 : 0.5,
          }}
        >
          {codeLoading ? "..." : "IR"}
        </button>
      </div>
      {codeError && <span style={ls.codeError}>{codeError}</span>}

      {/* F46: Sort tabs + Family mode */}
      <div style={ls.controls}>
        <div style={ls.sortTabs}>
          <button
            style={{ ...ls.sortBtn, ...(sortMode === "new" ? ls.sortBtnActive : {}) }}
            onClick={() => setSortMode("new")}
          >
            NOVAS
          </button>
          <button
            style={{ ...ls.sortBtn, ...(sortMode === "popular" ? ls.sortBtnActive : {}) }}
            onClick={() => setSortMode("popular")}
          >
            POPULARES
          </button>
        </div>
        <button
          style={{ ...ls.familyBtn, background: familyMode ? "#4a8a4a" : "#555" }}
          onClick={() => setFamilyMode(!familyMode)}
        >
          Familia: {familyMode ? "ON" : "OFF"}
        </button>
      </div>

      {/* Level list */}
      <div style={ls.list}>
        {loading ? (
          <p style={ls.empty}>Carregando...</p>
        ) : levels.length === 0 ? (
          <p style={ls.empty}>
            {familyMode
              ? "Nenhuma fase aprovada ainda. Desative Modo Familia ou busque por codigo."
              : "Nenhuma fase publicada ainda. Crie a primeira!"}
          </p>
        ) : (
          levels.map((level) => {
            const lr = reactions[level.id];
            return (
              <div key={level.id} style={ls.levelCard}>
                {/* Header row */}
                <div style={ls.cardHeader}>
                  <div style={{ flex: 1 }}>
                    <strong>{level.name}</strong>
                    {level.code && (
                      <span style={ls.cardCode}>{level.code}</span>
                    )}
                    {diffBadge(level.difficulty)}
                    <br />
                    <span style={ls.creator}>por {level.creatorName}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={ls.theme}>{level.background}</span>
                    {loadingLevelId === level.id ? (
                      <span style={{ fontSize: "11px", color: "#ffcc00" }}>...</span>
                    ) : (
                      <button
                        style={ls.playBtn}
                        onClick={(e) => { e.stopPropagation(); handlePlayLevel(level); }}
                      >
                        JOGAR
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div style={ls.statsRow}>
                  <span style={ls.stat}>{level.plays} jogadas</span>
                  <span style={ls.stat}>{level.clears} clears</span>
                </div>

                {/* Stamps + Report row */}
                <div style={ls.stampRow}>
                  {Object.keys(STAMP_LABELS).map((stamp) => {
                    const count = lr?.stamps?.[stamp] || 0;
                    const isActive = lr?.playerStamp === stamp;
                    return (
                      <button
                        key={stamp}
                        style={{
                          ...ls.stampBtn,
                          background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                          borderColor: isActive ? "#FFD700" : "#555",
                        }}
                        onClick={(e) => { e.stopPropagation(); handleStampClick(level.id, stamp); }}
                      >
                        {STAMP_LABELS[stamp]} {count}
                      </button>
                    );
                  })}
                  <div style={{ position: "relative" }}>
                    <button
                      style={ls.reportBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportLevelId(reportLevelId === level.id ? null : level.id);
                      }}
                      title="Denunciar"
                    >
                      !
                    </button>
                    {reportLevelId === level.id && (
                      <div style={ls.reportDropdown}>
                        {REPORT_REASONS.map((r) => (
                          <button
                            key={r.value}
                            style={ls.reportOption}
                            onClick={(e) => { e.stopPropagation(); handleReport(level.id, r.value); }}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button style={ls.backBtn} onClick={() => setScene("menu")}>
        VOLTAR
      </button>
    </div>
  );
}

// --- Styles ---
const ls: Record<string, React.CSSProperties> = {
  overlay: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 30,
    background: "rgba(0,0,0,0.7)",
    fontFamily: "monospace",
    color: "#fff",
    pointerEvents: "auto",
    overflowY: "auto",
  },
  title: {
    fontSize: "28px",
    color: "#ffcc00",
    marginBottom: 12,
    textShadow: "2px 2px 0 #000",
  },
  // Code search
  codeSearch: {
    display: "flex",
    gap: 6,
    marginBottom: 4,
  },
  codeInput: {
    width: 140,
    padding: "6px 10px",
    fontSize: "16px",
    fontFamily: "monospace",
    fontWeight: "bold",
    textAlign: "center" as const,
    letterSpacing: "4px",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "2px solid #555",
    borderRadius: 4,
    textTransform: "uppercase" as const,
  },
  codeBtn: {
    padding: "6px 16px",
    fontSize: "14px",
    fontFamily: "monospace",
    fontWeight: "bold",
    background: "#4a8a4a",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  codeError: {
    fontSize: "11px",
    color: "#cc4444",
    marginBottom: 6,
  },
  // Sort + family mode
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  sortTabs: {
    display: "flex",
    gap: 4,
  },
  sortBtn: {
    padding: "4px 12px",
    fontSize: "12px",
    fontFamily: "monospace",
    fontWeight: "bold",
    background: "#333",
    color: "#888",
    border: "none",
    borderRadius: 3,
    cursor: "pointer",
  },
  sortBtnActive: {
    background: "#4a4a8a",
    color: "#fff",
  },
  familyBtn: {
    padding: "4px 10px",
    fontSize: "11px",
    fontFamily: "monospace",
    fontWeight: "bold",
    color: "#fff",
    border: "none",
    borderRadius: 3,
    cursor: "pointer",
  },
  // Level list
  list: {
    width: 480,
    maxWidth: "95vw",
    maxHeight: "55vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 10,
  },
  levelCard: {
    display: "flex",
    flexDirection: "column",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    border: "1px solid #333",
    fontSize: "14px",
    gap: 6,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCode: {
    fontSize: "10px",
    color: "#aaa",
    background: "rgba(255,255,255,0.1)",
    padding: "1px 6px",
    borderRadius: 3,
    marginLeft: 6,
    letterSpacing: "1px",
    fontFamily: "monospace",
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
  diffBadge: {
    fontSize: "10px",
    color: "#fff",
    padding: "1px 6px",
    borderRadius: 3,
    marginLeft: 6,
    fontWeight: "bold",
  },
  statsRow: {
    display: "flex",
    gap: 12,
    fontSize: "11px",
    color: "#999",
  },
  stat: {
    fontSize: "11px",
  },
  stampRow: {
    display: "flex",
    gap: 4,
    alignItems: "center",
  },
  stampBtn: {
    padding: "2px 6px",
    fontSize: "12px",
    fontFamily: "monospace",
    background: "transparent",
    color: "#ccc",
    border: "1px solid #555",
    borderRadius: 3,
    cursor: "pointer",
    minWidth: 40,
    textAlign: "center" as const,
  },
  reportBtn: {
    padding: "2px 8px",
    fontSize: "14px",
    fontFamily: "monospace",
    fontWeight: "bold",
    background: "rgba(200,50,50,0.3)",
    color: "#cc6666",
    border: "1px solid #663333",
    borderRadius: 3,
    cursor: "pointer",
  },
  reportDropdown: {
    position: "absolute",
    right: 0,
    top: "100%",
    zIndex: 20,
    background: "#222",
    border: "1px solid #555",
    borderRadius: 4,
    padding: 4,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 160,
  },
  reportOption: {
    padding: "4px 8px",
    fontSize: "11px",
    fontFamily: "monospace",
    background: "transparent",
    color: "#ccc",
    border: "none",
    cursor: "pointer",
    textAlign: "left" as const,
    borderRadius: 2,
  },
  playBtn: {
    padding: "4px 12px",
    fontSize: "12px",
    fontFamily: "monospace",
    fontWeight: "bold",
    background: "#4a8a4a",
    color: "#fff",
    border: "none",
    borderRadius: 3,
    cursor: "pointer",
  },
  empty: {
    textAlign: "center" as const,
    color: "#666",
    padding: 30,
    fontSize: "14px",
  },
  backBtn: {
    marginTop: 10,
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
