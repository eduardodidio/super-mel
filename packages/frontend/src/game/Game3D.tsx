import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Lighting } from "./systems/Lighting";
import { Skybox } from "./systems/Skybox";
import { HUD3D } from "./systems/HUD3D";
import { MenuScene3D } from "./scenes/MenuScene3D";
import { GameScene3D } from "./scenes/GameScene3D";
import { GameOverOverlay } from "./scenes/GameOverScene3D";
import { useGameState } from "./hooks/useGameState";
import { LeaderboardView } from "../components/LeaderboardView";

function SceneContent() {
  const scene = useGameState((s) => s.scene);
  const theme = useGameState((s) => s.theme);

  return (
    <>
      <Skybox theme={theme} />
      <Lighting />
      {scene === "menu" && <MenuScene3D />}
      {scene === "playing" && <GameScene3D />}
    </>
  );
}

export function Game3D() {
  const scene = useGameState((s) => s.scene);
  const lives = useGameState((s) => s.lives);
  const score = useGameState((s) => s.score);
  const setScene = useGameState((s) => s.setScene);
  const resetGame = useGameState((s) => s.resetGame);

  const handleLogout = () => {
    localStorage.removeItem("supermel_token");
    localStorage.removeItem("supermel_player_id");
    localStorage.removeItem("supermel_player_name");
    window.location.reload();
  };

  if (scene === "leaderboard") {
    return <LeaderboardView onBack={() => setScene("menu")} />;
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
              <button style={styles.btnSecondary} onClick={handleLogout}>
                SAIR
              </button>
            </div>
          </div>
        )}

        {scene === "gameover" && <GameOverOverlay />}
      </div>
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
};
