import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Lighting } from "./systems/Lighting";
import { Skybox } from "./systems/Skybox";
import { HUD3D } from "./systems/HUD3D";
import { MenuScene3D } from "./scenes/MenuScene3D";
import { GameScene3D } from "./scenes/GameScene3D";
import { GameOverOverlay } from "./scenes/GameOverScene3D";
import { EditorWrapper } from "./scenes/EditorWrapper";
import { LevelSelectOverlay } from "./scenes/LevelSelectScene3D";
import { useGameState } from "./hooks/useGameState";
import { TouchControls3D } from "./systems/TouchControls3D";
import { useControls } from "./hooks/useControls";
import { playTrack, toggleMute, isMuted } from "./systems/AudioManager3D";
import { LeaderboardView } from "../components/LeaderboardView";
import type { BackgroundTheme } from "@super-mel/shared";
import { useEffect, useState } from "react";

const THEMES: BackgroundTheme[] = ["forest", "desert", "night", "space", "ocean"];

function SceneContent() {
  const scene = useGameState((s) => s.scene);
  const theme = useGameState((s) => s.theme);

  return (
    <>
      <Skybox theme={theme} />
      <Lighting theme={theme} />
      {scene === "menu" && <MenuScene3D />}
      {scene === "playing" && <GameScene3D />}
    </>
  );
}

export function Game3D() {
  const scene = useGameState((s) => s.scene);
  const lives = useGameState((s) => s.lives);
  const score = useGameState((s) => s.score);
  const theme = useGameState((s) => s.theme);
  const setScene = useGameState((s) => s.setScene);
  const setTheme = useGameState((s) => s.setTheme);
  const resetGame = useGameState((s) => s.resetGame);
  const controlsRef = useControls();
  const [muted, setMuted] = useState(isMuted());

  // Audio: maintheme on menu, comeco on playing
  useEffect(() => {
    if (scene === "menu" || scene === "gameover") {
      playTrack("maintheme", true);
    } else if (scene === "playing") {
      playTrack("comeco", true);
    }
  }, [scene]);

  const handleLogout = () => {
    localStorage.removeItem("supermel_token");
    localStorage.removeItem("supermel_player_id");
    localStorage.removeItem("supermel_player_name");
    window.location.reload();
  };

  const cycleTheme = () => {
    const idx = THEMES.indexOf(theme);
    setTheme(THEMES[(idx + 1) % THEMES.length]);
  };

  if (scene === "leaderboard") {
    return <LeaderboardView onBack={() => setScene("menu")} />;
  }

  if (scene === "editor") {
    return <EditorWrapper />;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas
        shadows
        camera={{ position: [0, 2, 15], fov: 60 }}
        style={{ background: "#1a1a2e" }}
      >
        <Physics gravity={[0, -15, 0]}>
          <SceneContent />
        </Physics>
      </Canvas>

      {/* HUD */}
      <HUD3D lives={lives} score={score} scene={scene} />

      {/* Mute button */}
      <button
        style={styles.muteBtn}
        onClick={() => setMuted(toggleMute())}
      >
        {muted ? "MUDO" : "SOM"}
      </button>

      {/* Overlays */}
      <div style={styles.overlayContainer}>
        {scene === "menu" && (
          <div style={styles.menuOverlay}>
            <h1 style={styles.title}>SUPER MEL</h1>
            <p style={styles.subtitle}>A Yorkshire Micro Heroina — 3D Edition</p>
            <p style={styles.playerName}>
              Jogador: {localStorage.getItem("supermel_player_name") || "???"}
            </p>
            <div style={styles.buttonGroup}>
              <button style={styles.btn} onClick={() => resetGame()}>
                JOGAR
              </button>
              <button style={styles.btn} onClick={() => setScene("editor")}>
                CRIAR FASE
              </button>
              <button style={styles.btn} onClick={() => setScene("leaderboard")}>
                RANKING
              </button>
              <button style={styles.btnTheme} onClick={cycleTheme}>
                TEMA: {theme.toUpperCase()}
              </button>
              <button style={styles.btnSecondary} onClick={handleLogout}>
                SAIR
              </button>
            </div>
          </div>
        )}

        {scene === "gameover" && <GameOverOverlay />}
        {scene === "levelselect" && <LevelSelectOverlay />}
      </div>

      {/* Mobile touch controls */}
      <TouchControls3D controlsRef={controlsRef} scene={scene} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  menuOverlay: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "auto",
    background: "rgba(0,0,0,0.4)",
    fontFamily: "monospace",
    color: "#fff",
  },
  title: {
    fontSize: "56px",
    color: "#ffcc00",
    margin: 0,
    textShadow: "3px 3px 0 #000",
  },
  subtitle: {
    fontSize: "16px",
    color: "#ccc",
    marginBottom: 10,
  },
  playerName: {
    fontSize: "14px",
    color: "#aaa",
    marginBottom: 30,
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: 220,
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
  btnTheme: {
    padding: "10px",
    fontSize: "14px",
    background: "#4a4a8a",
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
    background: "transparent",
    color: "#888",
    border: "1px solid #555",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
  },
  muteBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: "6px 12px",
    fontSize: "12px",
    background: "rgba(0,0,0,0.5)",
    color: "#aaa",
    border: "1px solid #555",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    zIndex: 15,
  },
};
