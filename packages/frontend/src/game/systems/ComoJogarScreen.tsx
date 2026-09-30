import { useState } from "react";
import { useGameState, type InputType } from "../hooks/useGameState";

interface ComoJogarScreenProps {
  onBack: () => void;
}

const TAB_LABELS: { type: InputType; label: string }[] = [
  { type: "keyboard", label: "Teclado" },
  { type: "touch", label: "Touch" },
  { type: "gamepad", label: "Gamepad" },
];

interface ControlRow {
  action: string;
  key: string;
}

const KEYBOARD_CONTROLS: ControlRow[] = [
  { action: "MOVER", key: "A / D  ou  Setas" },
  { action: "PULAR", key: "Space" },
  { action: "VOAR", key: "Segurar Space (no ar)" },
  { action: "ABAIXAR", key: "S / Seta Baixo" },
  { action: "OLHAR PRA CIMA", key: "W / Seta Cima" },
  { action: "ATIRAR", key: "Z / J" },
  { action: "LATIR", key: "X / K" },
  { action: "CAVAR", key: "Baixo + Z (terra/areia)" },
  { action: "FAREJAR", key: "Segurar Baixo (1s parada)" },
  { action: "PAUSAR", key: "Esc" },
];

const TOUCH_CONTROLS: ControlRow[] = [
  { action: "MOVER", key: "D-pad esquerdo" },
  { action: "PULAR / VOAR", key: "Botao A (segurar = voar)" },
  { action: "ATIRAR", key: "Botao B" },
  { action: "LATIR", key: "Botao C" },
  { action: "CAVAR", key: "Baixo + B (terra/areia)" },
  { action: "FAREJAR", key: "Segurar Baixo (1s parada)" },
  { action: "PAUSAR", key: "(use Esc no teclado)" },
];

const GAMEPAD_CONTROLS: ControlRow[] = [
  { action: "MOVER", key: "D-pad / Analogico esquerdo" },
  { action: "PULAR / VOAR", key: "A / X (segurar = voar)" },
  { action: "ATIRAR", key: "X / Quadrado" },
  { action: "LATIR", key: "Y / Triangulo" },
  { action: "CAVAR", key: "Baixo + X (terra/areia)" },
  { action: "FAREJAR", key: "Segurar Baixo (1s parado)" },
  { action: "PAUSAR", key: "Start" },
];

const CONTROLS_MAP: Record<InputType, ControlRow[]> = {
  keyboard: KEYBOARD_CONTROLS,
  touch: TOUCH_CONTROLS,
  gamepad: GAMEPAD_CONTROLS,
};

const TIPS = [
  "Segure Space para voar por ate 5 segundos!",
  "Atire na Bola do Infinito para destruir blocos",
  "Colete coracoes para recuperar vida",
  "Moedas vermelhas valem pontos -- pegue todas!",
  "Latir (X) atordoa inimigos e revela item_blocks",
  "Cave terra e areia (Baixo+Z) para encontrar ossos e moedas",
  "Fique parada segurando Baixo para farejar segredos por perto",
  "A Bola do Infinito volta como bumerangue coletando moedas!",
];

export function ComoJogarScreen({ onBack }: ComoJogarScreenProps) {
  const lastInputType = useGameState((s) => s.lastInputType);
  const [activeTab, setActiveTab] = useState<InputType>(lastInputType);

  const controls = CONTROLS_MAP[activeTab];

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.title}>COMO JOGAR</h2>

        {/* Tabs */}
        <div style={styles.tabs}>
          {TAB_LABELS.map((tab) => (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              style={{
                ...styles.tabBtn,
                background: activeTab === tab.type ? "rgba(255,204,0,0.2)" : "rgba(255,255,255,0.05)",
                border: activeTab === tab.type ? "2px solid rgba(255,204,0,0.5)" : "1px solid rgba(255,255,255,0.15)",
                color: activeTab === tab.type ? "#ffcc00" : "#888",
                fontWeight: activeTab === tab.type ? "bold" : "normal",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Controls table */}
        <div style={styles.controlsList}>
          {controls.map((row, i) => (
            <div key={i} style={styles.controlRow}>
              <span style={styles.actionLabel}>{row.action}</span>
              <span style={styles.keyLabel}>{row.key}</span>
            </div>
          ))}
        </div>

        {/* Tips section */}
        <div style={styles.tipsSection}>
          <span style={styles.tipsTitle}>DICAS</span>
          <ul style={styles.tipsList}>
            {TIPS.map((tip, i) => (
              <li key={i} style={styles.tipItem}>{tip}</li>
            ))}
          </ul>
        </div>

        <button style={styles.backBtn} onClick={onBack}>
          VOLTAR
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 55,
    pointerEvents: "auto",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    width: "90%",
    maxWidth: 500,
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "24px 20px",
    fontFamily: "monospace",
    color: "#fff",
  },
  title: {
    fontSize: "28px",
    color: "#ffcc00",
    margin: "0 0 4px 0",
    textShadow: "3px 3px 0 #000",
    fontFamily: "monospace",
  },
  tabs: {
    display: "flex",
    gap: 8,
    width: "100%",
    justifyContent: "center",
  },
  tabBtn: {
    padding: "8px 16px",
    fontSize: "13px",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    minWidth: 80,
    minHeight: 36,
  },
  controlsList: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  controlRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  actionLabel: {
    fontWeight: "bold",
    fontSize: "13px",
    color: "#ffcc00",
  },
  keyLabel: {
    fontSize: "13px",
    color: "#aaa",
    textAlign: "right" as const,
  },
  tipsSection: {
    width: "100%",
    padding: "10px 0",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    marginTop: 4,
  },
  tipsTitle: {
    fontSize: "12px",
    color: "#aaa",
    display: "block",
    marginBottom: 6,
    textAlign: "center" as const,
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  tipsList: {
    margin: 0,
    padding: "0 0 0 20px",
    listStyleType: "disc",
  },
  tipItem: {
    fontSize: "12px",
    color: "#888",
    lineHeight: 1.8,
  },
  backBtn: {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    background: "#4a4a8a",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
    marginTop: 4,
  },
};
