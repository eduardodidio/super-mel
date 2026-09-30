import { useAssistMode } from "../hooks/useAssistMode";

interface AssistModeUIProps {
  onBack: () => void;
}

function ToggleButton({ active, onToggle, label, description }: {
  active: boolean;
  onToggle: () => void;
  label: string;
  description: string;
}) {
  return (
    <button onClick={onToggle} style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 16px",
      width: "100%",
      background: active ? "rgba(80,200,80,0.2)" : "rgba(255,255,255,0.05)",
      border: active ? "2px solid rgba(80,200,80,0.5)" : "1px solid rgba(255,255,255,0.15)",
      borderRadius: 6,
      cursor: "pointer",
      fontFamily: "monospace",
      color: "#fff",
      textAlign: "left" as const,
      minHeight: 44,
    }}>
      <span style={{ fontSize: 14, minWidth: 34, fontWeight: "bold", color: active ? "#50c850" : "#666" }}>
        {active ? "[ON]" : "[OFF]"}
      </span>
      <div>
        <div style={{ fontWeight: "bold", fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 11, color: "#999" }}>{description}</div>
      </div>
    </button>
  );
}

const SPEED_OPTIONS = [
  { value: 0.7, label: "70%" },
  { value: 0.85, label: "85%" },
  { value: 1.0, label: "100%" },
];

export function AssistModeUI({ onBack }: AssistModeUIProps) {
  const invincible = useAssistMode((s) => s.invincible);
  const unlimitedFlight = useAssistMode((s) => s.unlimitedFlight);
  const fiveHearts = useAssistMode((s) => s.fiveHearts);
  const gameSpeed = useAssistMode((s) => s.gameSpeed);
  const setInvincible = useAssistMode((s) => s.setInvincible);
  const setUnlimitedFlight = useAssistMode((s) => s.setUnlimitedFlight);
  const setFiveHearts = useAssistMode((s) => s.setFiveHearts);
  const setGameSpeed = useAssistMode((s) => s.setGameSpeed);

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.title}>MODO ASSISTIDO</h2>

        <p style={styles.welcomeText}>
          Cada jogador e diferente.{"\n"}
          Use estas opcoes para ajustar o jogo ao seu estilo.{"\n"}
          Nenhuma opcao bloqueia conquistas.
        </p>

        <div style={styles.toggles}>
          <ToggleButton
            active={invincible}
            onToggle={() => setInvincible(!invincible)}
            label="Invencivel"
            description="Mel nao perde vida"
          />
          <ToggleButton
            active={unlimitedFlight}
            onToggle={() => setUnlimitedFlight(!unlimitedFlight)}
            label="Voo Infinito"
            description="Sem limite de tempo voando"
          />
          <ToggleButton
            active={fiveHearts}
            onToggle={() => setFiveHearts(!fiveHearts)}
            label="5 Coracoes"
            description="Comeca com 5 vidas (em vez de 3)"
          />
        </div>

        {/* Game speed */}
        <div style={styles.speedSection}>
          <span style={styles.speedLabel}>VELOCIDADE</span>
          <div style={styles.speedButtons}>
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGameSpeed(opt.value)}
                style={{
                  ...styles.speedBtn,
                  background: gameSpeed === opt.value ? "rgba(80,200,80,0.2)" : "rgba(255,255,255,0.05)",
                  border: gameSpeed === opt.value ? "2px solid rgba(80,200,80,0.5)" : "1px solid rgba(255,255,255,0.15)",
                  color: gameSpeed === opt.value ? "#50c850" : "#888",
                  fontWeight: gameSpeed === opt.value ? "bold" : "normal",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skip level - disabled */}
        <button style={styles.skipBtn} disabled>
          PULAR FASE (em breve)
        </button>

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
    gap: 10,
    width: 340,
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
  welcomeText: {
    fontSize: "12px",
    color: "#aaa",
    fontStyle: "italic",
    textAlign: "center" as const,
    margin: "0 0 8px 0",
    lineHeight: 1.6,
    whiteSpace: "pre-line",
  },
  toggles: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%",
  },
  speedSection: {
    width: "100%",
    padding: "10px 0",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    margin: "4px 0",
  },
  speedLabel: {
    fontSize: "12px",
    color: "#aaa",
    display: "block",
    marginBottom: 8,
    textAlign: "center" as const,
    fontFamily: "monospace",
  },
  speedButtons: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
  },
  speedBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    minWidth: 60,
    minHeight: 44,
  },
  skipBtn: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    background: "rgba(255,255,255,0.03)",
    color: "#555",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 4,
    cursor: "not-allowed",
    fontFamily: "monospace",
    opacity: 0.5,
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
