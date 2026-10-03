import { useState } from "react";
import type { BlockType, BackgroundTheme, EntityData, CustomAsset, EnemySubtype } from "@super-mel/shared";
import { useGameState } from "../hooks/useGameState";
import { CustomAssetPalette } from "../editor/CustomAssetPalette";

// --- EditorTool type (exported for EditorScene3D) ---
export type EditorTool =
  // Block tools (existing)
  | Exclude<BlockType, "empty">
  | "eraser"
  // Entity tools (new)
  | "entity_coin"
  | "entity_heart"
  | "entity_item_block"
  | "entity_spawn"
  | "entity_checkpoint"
  | "entity_goal"
  | "entity_bone"
  | "entity_sign"
  // Enemy tools (F56)
  | "entity_enemy"
  // Custom tools (Galeria do Rafa)
  | "custom_block"
  | "custom_sign";

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

const ITEM_PALETTE: { tool: EditorTool; label: string; color: string; symbol: string }[] = [
  { tool: "entity_coin", label: "Moeda", color: "#FFD700", symbol: "$" },
  { tool: "entity_heart", label: "Vida", color: "#FF4466", symbol: "+" },
  { tool: "entity_item_block", label: "Bloco?", color: "#FFD700", symbol: "?" },
  { tool: "entity_bone", label: "Osso", color: "#F5F5DC", symbol: "B" },
];

const SPECIAL_PALETTE: { tool: EditorTool; label: string; color: string; symbol: string }[] = [
  { tool: "entity_spawn", label: "MEL", color: "#22AA22", symbol: "M" },
  { tool: "entity_checkpoint", label: "Check", color: "#4488FF", symbol: "F" },
  { tool: "entity_goal", label: "Meta", color: "#FF8800", symbol: "G" },
  { tool: "entity_sign", label: "Placa", color: "#A0522D", symbol: "!" },
];

const ENEMY_PALETTE: { subtype: EnemySubtype; label: string; symbol: string }[] = [
  { subtype: "vacuum", label: "Aspirador", symbol: "A" },
  { subtype: "pigeon", label: "Pombo", symbol: "P" },
  { subtype: "bee", label: "Abelha", symbol: "B" },
];

const THEMES: BackgroundTheme[] = ["forest", "desert", "night", "space", "ocean"];

type PaletteTab = "blocos" | "itens" | "especiais" | "inimigos" | "custom";

interface EditorBlock {
  type: Exclude<BlockType, "empty">;
  x: number;
  y: number;
  z: number;
}

interface EditorUIProps {
  selectedTool: EditorTool;
  onSelectTool: (tool: EditorTool) => void;
  itemBlockContent: string;
  onItemBlockContentChange: (content: string) => void;
  currentZ: number;
  onChangeZ: (z: number) => void;
  blocks: EditorBlock[];
  entities: EntityData[];
  spawnPoint: { x: number; y: number };
  onTest: () => void;
  onSave: () => void;
  onPublish: () => void;
  onBack: () => void;
  // Custom assets (Galeria do Rafa)
  customAssets: CustomAsset[];
  selectedCustomAssetId: string | null;
  onUploadCustomAsset: () => void;
  onRemoveCustomAsset: (assetId: string) => void;
  onSelectCustomAsset: (assetId: string, mode: "block" | "sign") => void;
  // Enemy palette (F56)
  enemySubtype: EnemySubtype;
  onEnemySubtypeChange: (subtype: EnemySubtype) => void;
  // Camera position display (F56)
  cameraPos: { x: number; y: number; z: number };
  // Sign text (F49)
  signText: string;
  onSignTextChange: (text: string) => void;
  // F46: Clear check + publish
  levelName: string;
  onLevelNameChange: (name: string) => void;
  levelCleared: boolean;
  levelCode: string | null;
  savedLevelId: string | null;
  // Level dimensions (F56-T05)
  levelWidth: number;
  levelHeight: number;
  onResizeLevel: (width: number, height: number) => void;
  // Test from cursor (F56-T04)
  onTestFromCursor: () => void;
  hoverPos: { x: number; y: number } | null;
}

export function EditorUI({
  selectedTool,
  onSelectTool,
  itemBlockContent,
  onItemBlockContentChange,
  currentZ,
  onChangeZ,
  blocks,
  entities,
  spawnPoint,
  onTest,
  onSave,
  onPublish,
  onBack,
  customAssets,
  selectedCustomAssetId,
  onUploadCustomAsset,
  onRemoveCustomAsset,
  onSelectCustomAsset,
  enemySubtype,
  onEnemySubtypeChange,
  cameraPos,
  signText,
  onSignTextChange,
  levelName,
  onLevelNameChange,
  levelCleared,
  levelCode,
  savedLevelId,
  levelWidth,
  levelHeight,
  onResizeLevel,
  onTestFromCursor,
  hoverPos,
}: EditorUIProps) {
  const theme = useGameState((s) => s.theme);
  const setTheme = useGameState((s) => s.setTheme);
  const [activeTab, setActiveTab] = useState<PaletteTab>("blocos");
  const [copied, setCopied] = useState(false);

  const cycleTheme = () => {
    const idx = THEMES.indexOf(theme);
    setTheme(THEMES[(idx + 1) % THEMES.length]);
  };

  return (
    <div style={styles.container}>
      {/* Left palette */}
      <div style={styles.palette}>
        {/* Tab bar */}
        <div style={styles.tabBar}>
          {(["blocos", "itens", "especiais", "inimigos", "custom"] as PaletteTab[]).map((tab) => {
            const tabLabels: Record<PaletteTab, string> = {
              blocos: "BLOCOS",
              itens: "ITENS",
              especiais: "ESPECIAIS",
              inimigos: "INIM",
              custom: "IMG",
            };
            return (
              <button
                key={tab}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === tab ? styles.tabBtnActive : styles.tabBtnInactive),
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab content: BLOCOS */}
        {activeTab === "blocos" && (
          <>
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
          </>
        )}

        {/* Tab content: ITENS */}
        {activeTab === "itens" && (
          <>
            {ITEM_PALETTE.map((item) => (
              <button
                key={item.tool}
                style={{
                  ...styles.paletteBtn,
                  borderColor: selectedTool === item.tool ? "#fff" : "#555",
                  backgroundColor: item.color,
                }}
                onClick={() => onSelectTool(item.tool)}
                title={item.label}
              >
                {item.symbol}
              </button>
            ))}
            {/* Item block content dropdown */}
            {selectedTool === "entity_item_block" && (
              <div style={styles.contentDropdown}>
                <label style={styles.dropdownLabel}>Conteudo:</label>
                <select
                  style={styles.dropdownSelect}
                  value={itemBlockContent}
                  onChange={(e) => onItemBlockContentChange(e.target.value)}
                >
                  <option value="coin">Moeda</option>
                  <option value="heart">Coracao</option>
                  <option value="power_up">Power-up</option>
                </select>
              </div>
            )}
          </>
        )}

        {/* Tab content: ESPECIAIS */}
        {activeTab === "especiais" && (
          <>
            {SPECIAL_PALETTE.map((item) => (
              <button
                key={item.tool}
                style={{
                  ...styles.paletteBtn,
                  borderColor: selectedTool === item.tool ? "#fff" : "#555",
                  backgroundColor: item.color,
                }}
                onClick={() => onSelectTool(item.tool)}
                title={item.label}
              >
                {item.symbol}
              </button>
            ))}
            {/* Sign text input */}
            {selectedTool === "entity_sign" && (
              <div style={styles.contentDropdown}>
                <label style={styles.dropdownLabel}>Texto:</label>
                <input
                  type="text"
                  style={styles.dropdownSelect}
                  value={signText}
                  onChange={(e) => onSignTextChange(e.target.value)}
                  maxLength={40}
                  placeholder="Texto da placa..."
                />
              </div>
            )}
          </>
        )}

        {/* Tab content: INIMIGOS (F56) */}
        {activeTab === "inimigos" && (
          <>
            {ENEMY_PALETTE.map((enemy) => (
              <button
                key={enemy.subtype}
                style={{
                  ...styles.paletteBtn,
                  borderColor:
                    selectedTool === "entity_enemy" && enemySubtype === enemy.subtype
                      ? "#fff"
                      : "#555",
                  backgroundColor: "#CC2222",
                }}
                onClick={() => {
                  onSelectTool("entity_enemy");
                  onEnemySubtypeChange(enemy.subtype);
                }}
                title={enemy.label}
              >
                {enemy.symbol}
              </button>
            ))}
          </>
        )}

        {/* Tab content: CUSTOM (Galeria do Rafa) */}
        {activeTab === "custom" && (
          <CustomAssetPalette
            assets={customAssets}
            selectedAssetId={selectedCustomAssetId}
            selectedMode={
              selectedTool === "custom_block" ? "block" :
              selectedTool === "custom_sign" ? "sign" :
              null
            }
            onSelectAsset={onSelectCustomAsset}
            onUpload={onUploadCustomAsset}
            onRemoveAsset={onRemoveCustomAsset}
          />
        )}
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

        {/* F56-T05: Level dimension controls */}
        <div style={styles.zControls}>
          <label style={{ fontSize: "10px", color: "#888" }}>W:</label>
          <input
            type="number"
            min={16} max={200}
            value={levelWidth}
            onChange={(e) => onResizeLevel(Number(e.target.value), levelHeight)}
            style={{ ...styles.smallBtn, width: 50, textAlign: "center" as const }}
          />
          <label style={{ fontSize: "10px", color: "#888" }}>H:</label>
          <input
            type="number"
            min={8} max={40}
            value={levelHeight}
            onChange={(e) => onResizeLevel(levelWidth, Number(e.target.value))}
            style={{ ...styles.smallBtn, width: 50, textAlign: "center" as const }}
          />
        </div>

        {/* F46: Level name input */}
        <input
          type="text"
          placeholder="Nome da fase"
          value={levelName}
          onChange={(e) => onLevelNameChange(e.target.value)}
          maxLength={30}
          style={styles.nameInput}
        />

        <div style={styles.info}>
          Blocos: {blocks.length} | Entidades: {entities.length} | Spawn: ({spawnPoint.x}, {spawnPoint.y}) | Cam: ({cameraPos.x.toFixed(0)}, {cameraPos.y.toFixed(0)}) Z:{cameraPos.z.toFixed(0)}
        </div>

        <div style={styles.actions}>
          <button style={styles.actionBtn} onClick={cycleTheme}>
            BG: {theme.toUpperCase()}
          </button>
          <button style={{ ...styles.actionBtn, background: "#4a8a4a" }} onClick={onTest}>
            TESTAR
          </button>
          <button
            style={{
              ...styles.actionBtn,
              background: hoverPos ? "#6a8a4a" : "#555",
              opacity: hoverPos ? 1 : 0.5,
              cursor: hoverPos ? "pointer" : "not-allowed",
            }}
            onClick={onTestFromCursor}
            disabled={!hoverPos}
            title={hoverPos ? `Testar de (${hoverPos.x}, ${hoverPos.y})` : "Passe o mouse no grid"}
          >
            DAQUI
          </button>
          <button style={{ ...styles.actionBtn, background: "#4a4aaa" }} onClick={onSave}>
            SALVAR
          </button>
          <button
            style={{
              ...styles.actionBtn,
              background: (levelCleared && savedLevelId) ? "#aa6a00" : "#555",
              opacity: (levelCleared && savedLevelId) ? 1 : 0.5,
              cursor: (levelCleared && savedLevelId) ? "pointer" : "not-allowed",
            }}
            onClick={onPublish}
            disabled={!levelCleared || !savedLevelId}
            title={!levelCleared ? "Zere a fase para publicar (TESTAR)" : !savedLevelId ? "Salve a fase primeiro" : "Publicar fase"}
          >
            PUBLICAR
          </button>
          <button style={{ ...styles.actionBtn, background: "#6a4a4a" }} onClick={onBack}>
            VOLTAR
          </button>
        </div>
      </div>

      {/* F46: Clear check status + code display */}
      <div style={styles.bottomBar}>
        {!levelCleared && (
          <span style={styles.clearCheckMsg}>
            Zere a fase para publicar (TESTAR com Meta)
          </span>
        )}
        {levelCleared && !savedLevelId && (
          <span style={{ ...styles.clearCheckMsg, color: "#88aa44" }}>
            Fase zerada! Salve para poder publicar.
          </span>
        )}
        {levelCleared && savedLevelId && !levelCode && (
          <span style={{ ...styles.clearCheckMsg, color: "#88cc44" }}>
            Pronto para publicar!
          </span>
        )}
        {levelCode && (
          <>
            <span style={styles.codeDisplay}>
              CODIGO: {levelCode}
            </span>
            <button
              style={styles.copyBtn}
              onClick={() => {
                navigator.clipboard.writeText(levelCode).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }).catch(() => {});
              }}
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
            <span style={{ ...styles.clearCheckMsg, color: "#aaa" }}>
              Compartilhe com amigos!
            </span>
          </>
        )}
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
  tabBar: {
    display: "flex",
    gap: 2,
    marginBottom: 6,
  },
  tabBtn: {
    flex: 1,
    padding: "4px 2px",
    fontSize: "9px",
    fontFamily: "monospace",
    fontWeight: "bold",
    border: "none",
    borderRadius: "3px 3px 0 0",
    cursor: "pointer",
    color: "#fff",
  },
  tabBtnActive: {
    background: "#555",
  },
  tabBtnInactive: {
    background: "#333",
    color: "#888",
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
  contentDropdown: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    marginTop: 4,
    padding: "4px 2px",
    background: "rgba(0,0,0,0.4)",
    borderRadius: 3,
  },
  dropdownLabel: {
    fontSize: "9px",
    color: "#aaa",
    textAlign: "center" as const,
  },
  dropdownSelect: {
    fontSize: "10px",
    fontFamily: "monospace",
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: 3,
    padding: "2px",
    cursor: "pointer",
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
  nameInput: {
    padding: "4px 8px",
    fontSize: "13px",
    fontFamily: "monospace",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: 4,
    minWidth: 140,
    maxWidth: 200,
  },
  bottomBar: {
    position: "absolute",
    bottom: 8,
    left: 70,
    right: 8,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "6px 12px",
    background: "rgba(0,0,0,0.6)",
    borderRadius: 6,
    pointerEvents: "auto",
    gap: 16,
  },
  clearCheckMsg: {
    fontSize: "12px",
    color: "#cc8844",
    fontFamily: "monospace",
  },
  codeDisplay: {
    fontSize: "16px",
    color: "#FFD700",
    fontFamily: "monospace",
    fontWeight: "bold",
    letterSpacing: "2px",
  },
  copyBtn: {
    padding: "3px 10px",
    fontSize: "11px",
    fontFamily: "monospace",
    fontWeight: "bold",
    background: "#4a4a8a",
    color: "#fff",
    border: "none",
    borderRadius: 3,
    cursor: "pointer",
  },
};
