import { useState, useCallback } from "react";
import type { BlockType, BackgroundTheme } from "@super-mel/shared";
import { useGameState } from "../hooks/useGameState";

const BLOCK_PALETTE: { type: Exclude<BlockType, "empty">; label: string; color: string }[] = [
  { type: "stone", label: "Pedra", color: "#808080" },
  { type: "dirt", label: "Terra", color: "#6B4226" },
  { type: "sand", label: "Areia", color: "#C2B280" },
  { type: "wood", label: "Madeira", color: "#8B5A2B" },
  { type: "iron", label: "Ferro", color: "#B0B0B0" },
  { type: "brick", label: "Tijolo", color: "#B22222" },
  { type: "glass", label: "Vidro", color: "#ADD8E6" },
  { type: "leaf", label: "Folha", color: "#228B22" },
  { type: "water", label: "Agua", color: "#1E90FF" },
  { type: "lava", label: "Lava", color: "#FF4500" },
  { type: "item_block", label: "Item ?", color: "#FFD700" },
];

const THEMES: BackgroundTheme[] = ["forest", "desert", "night", "space", "ocean"];

interface EditorBlock {
  type: Exclude<BlockType, "empty">;
  x: number;
  y: number;
  z: number;
}

interface EditorUIProps {
  selectedTool: Exclude<BlockType, "empty"> | "eraser" | "spawn";
  onSelectTool: (tool: Exclude<BlockType, "empty"> | "eraser" | "spawn") => void;
  currentZ: number;
  onChangeZ: (z: number) => void;
  blocks: EditorBlock[];
  spawnPoint: { x: number; y: number };
  onTest: () => void;
  onSave: () => void;
  onBack: () => void;
}

export function EditorUI({
  selectedTool,
  onSelectTool,
  currentZ,
  onChangeZ,
  blocks,
  spawnPoint,
  onTest,
  onSave,
  onBack,
}: EditorUIProps) {
  const theme = useGameState((s) => s.theme);
  const setTheme = useGameState((s) => s.setTheme);

  const cycleTheme = () => {
    const idx = THEMES.indexOf(theme);
    setTheme(THEMES[(idx + 1) % THEMES.length]);
  };

  return (
    <div style={styles.container}>
      {/* Left palette */}
      <div style={styles.palette}>
        <div style={styles.paletteTitle}>BLOCOS</div>
        {BLOCK_PALETTE.map((b) => (
          <button
            key={b.type}
            style={{
              ...styles.paletteBtn,
              borderColor: selectedTool === b.type ? "#fff" : "#555",
              backgroundColor: b.color,
            }}
            onClick={() => onSelectTool(b.type)}
            title={b.label}
          >
            {b.label.slice(0, 3)}
          </button>
        ))}
        <div style={styles.divider} />
        <button
          style={{
            ...styles.paletteBtn,
            borderColor: selectedTool === "eraser" ? "#fff" : "#555",
            backgroundColor: "#aa2222",
          }}
          onClick={() => onSelectTool("eraser")}
        >
          APG
        </button>
        <button
          style={{
            ...styles.paletteBtn,
            borderColor: selectedTool === "spawn" ? "#fff" : "#555",
            backgroundColor: "#22aa22",
          }}
          onClick={() => onSelectTool("spawn")}
        >
          MEL
        </button>
      </div>

      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.zControls}>
          <button style={styles.smallBtn} onClick={() => onChangeZ(currentZ - 1)}>
            Z-
          </button>
          <span style={styles.zLabel}>Camada: {currentZ === 0 ? "JOGO" : `FUNDO ${Math.abs(currentZ)}`}</span>
          <button style={styles.smallBtn} onClick={() => onChangeZ(Math.min(0, currentZ + 1))}>
            Z+
          </button>
        </div>

        <div style={styles.info}>
          Blocos: {blocks.length} | Spawn: ({spawnPoint.x}, {spawnPoint.y})
        </div>

        <div style={styles.actions}>
          <button style={styles.actionBtn} onClick={cycleTheme}>
            BG: {theme.toUpperCase()}
          </button>
          <button style={{ ...styles.actionBtn, background: "#4a8a4a" }} onClick={onTest}>
            TESTAR
          </button>
          <button style={{ ...styles.actionBtn, background: "#4a4aaa" }} onClick={onSave}>
            SALVAR
          </button>
          <button style={{ ...styles.actionBtn, background: "#6a4a4a" }} onClick={onBack}>
            VOLTAR
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    fontFamily: "monospace",
    color: "#fff",
    zIndex: 10,
  },
  palette: {
    position: "absolute",
    left: 8,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: 8,
    background: "rgba(0,0,0,0.7)",
    borderRadius: 6,
    pointerEvents: "auto",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  paletteTitle: {
    fontSize: "11px",
    textAlign: "center" as const,
    color: "#aaa",
    marginBottom: 4,
  },
  paletteBtn: {
    width: 48,
    height: 36,
    border: "2px solid #555",
    borderRadius: 4,
    color: "#fff",
    fontSize: "10px",
    fontFamily: "monospace",
    fontWeight: "bold",
    cursor: "pointer",
    textShadow: "1px 1px 0 #000",
  },
  divider: {
    height: 1,
    background: "#444",
    margin: "4px 0",
  },
  topBar: {
    position: "absolute",
    top: 8,
    left: 70,
    right: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    background: "rgba(0,0,0,0.7)",
    borderRadius: 6,
    pointerEvents: "auto",
    flexWrap: "wrap",
    gap: 8,
  },
  zControls: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  zLabel: {
    fontSize: "13px",
    color: "#ccc",
    minWidth: 100,
    textAlign: "center" as const,
  },
  smallBtn: {
    padding: "4px 10px",
    fontSize: "13px",
    background: "#4a4a6a",
    color: "#fff",
    border: "none",
    borderRadius: 3,
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  info: {
    fontSize: "12px",
    color: "#888",
  },
  actions: {
    display: "flex",
    gap: 6,
  },
  actionBtn: {
    padding: "6px 12px",
    fontSize: "13px",
    background: "#4a4a6a",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
};
