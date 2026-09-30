import { useState } from "react";
import { setVolume, getVolume, toggleMute, isMuted } from "./AudioManager3D";

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onComoJogar: () => void;
  onOpcoes: () => void;
}

export function PauseOverlay({ onResume, onRestart, onMainMenu, onComoJogar, onOpcoes }: PauseOverlayProps) {
  const [vol, setVol] = useState(() => Math.round(getVolume() * 100));
  const [muted, setMuted] = useState(isMuted());

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    setVol(v);
    setVolume(v / 100);
  };

  const handleMuteToggle = () => {
    setMuted(toggleMute());
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.title}>PAUSADO</h2>

        <button style={styles.btnGreen} onClick={onResume}>
          CONTINUAR
        </button>

        <button style={styles.btnBlue} onClick={onComoJogar}>
          COMO JOGAR
        </button>

        <button style={styles.btnBlue} onClick={onOpcoes}>
          OPCOES
        </button>

        {/* Volume section */}
        <div style={styles.volumeSection}>
          <label style={styles.volumeLabel}>VOLUME</label>
          <div style={styles.volumeRow}>
            <input
              type="range"
              min="0"
              max="100"
              value={vol}
              onChange={handleVolumeChange}
              style={styles.volumeSlider}
            />
            <button style={styles.muteBtn} onClick={handleMuteToggle}>
              {muted ? "MUDO" : "SOM"}
            </button>
          </div>
        </div>

        <button style={styles.btnOrange} onClick={onRestart}>
          REINICIAR
        </button>

        <button style={styles.btnOutline} onClick={onMainMenu}>
          VOLTAR AO MENU
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
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    pointerEvents: "auto",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    width: 300,
    padding: "30px 24px",
    fontFamily: "monospace",
    color: "#fff",
  },
  title: {
    fontSize: "36px",
    color: "#ffcc00",
    margin: "0 0 10px 0",
    textShadow: "3px 3px 0 #000",
    fontFamily: "monospace",
  },
  btnGreen: {
    width: "100%",
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
  btnBlue: {
    width: "100%",
    padding: "14px",
    fontSize: "18px",
    background: "#4a4a8a",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  btnOrange: {
    width: "100%",
    padding: "14px",
    fontSize: "18px",
    background: "#8a6a2a",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  btnOutline: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    background: "transparent",
    color: "#888",
    border: "1px solid #555",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
  },
  volumeSection: {
    width: "100%",
    padding: "10px 0",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    margin: "4px 0",
  },
  volumeLabel: {
    fontSize: "12px",
    color: "#aaa",
    display: "block",
    marginBottom: 6,
    textAlign: "center" as const,
    fontFamily: "monospace",
  },
  volumeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  volumeSlider: {
    flex: 1,
    height: 6,
    cursor: "pointer",
    accentColor: "#ffcc00",
  },
  muteBtn: {
    padding: "4px 10px",
    fontSize: "11px",
    background: "rgba(255,255,255,0.1)",
    color: "#ccc",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    minWidth: 44,
  },
};
