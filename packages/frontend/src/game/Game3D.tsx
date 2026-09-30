import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Lighting } from "./systems/Lighting";
import { Skybox } from "./systems/Skybox";
import { HUD3D } from "./systems/HUD3D";
import { MenuScene3D } from "./scenes/MenuScene3D";
import { GameScene3D } from "./scenes/GameScene3D";
import { GameOverOverlay } from "./scenes/GameOverScene3D";
import { LevelClearOverlay } from "./scenes/LevelClearOverlay";
import { EditorWrapper } from "./scenes/EditorWrapper";
import { LevelSelectOverlay } from "./scenes/LevelSelectScene3D";
import { WorldMapScene } from "./scenes/WorldMapScene";
import { useGameState } from "./hooks/useGameState";
import { useAssistMode } from "./hooks/useAssistMode";
import { TouchControls3D } from "./systems/TouchControls3D";
import { PauseOverlay } from "./systems/PauseOverlay";
import { ComoJogarScreen } from "./systems/ComoJogarScreen";
import { AssistModeUI } from "./systems/AssistModeUI";
import { useControls } from "./hooks/useControls";
import { useProgressSync, flushProgress } from "./hooks/useProgressSync";
import { playTrack, toggleMute, isMuted } from "./systems/AudioManager3D";
import { LeaderboardView } from "../components/LeaderboardView";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { getTodaySeed } from "./systems/ChunkGenerator";
import type { BackgroundTheme } from "@super-mel/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { CoinPopupLayer, type CoinPopupHandle } from "./systems/CoinPopup";
import { useLevelMissions } from "./hooks/useLevelMissions";
import { useInfiniteMissions } from "./hooks/useInfiniteMissions";
import { MissionToast } from "./systems/MissionToast";

const THEMES: BackgroundTheme[] = ["forest", "desert", "night", "space", "ocean"];

function SceneContent() {
  const scene = useGameState((s) => s.scene);
  const theme = useGameState((s) => s.theme);
  const testMode = useGameState((s) => s.testMode);
  const currentLevelData = useGameState((s) => s.currentLevelData);
  const levelId = useGameState((s) => s.levelId);
  const gameMode = useGameState((s) => s.gameMode);

  // In infinite playing mode (not test, not level), BiomeTransition inside
  // GameScene3D manages Skybox+Lighting+BackgroundDecor. Skip them here.
  const biomeHandledByScene =
    scene === "playing" &&
    gameMode === "infinite" &&
    !testMode &&
    !currentLevelData;

  return (
    <>
      {!biomeHandledByScene && (
        <>
          <Skybox theme={theme} />
          <Lighting theme={theme} />
        </>
      )}
      {scene === "menu" && <MenuScene3D />}
      {scene === "playing" && (
        <GameScene3D
          key={levelId ?? "infinite"}
          testMode={testMode}
          levelData={currentLevelData ?? undefined}
        />
      )}
    </>
  );
}

export function Game3D() {
  const scene = useGameState((s) => s.scene);
  const lives = useGameState((s) => s.lives);
  const score = useGameState((s) => s.score);
  const coins = useGameState((s) => s.coins);
  const isFlying = useGameState((s) => s.isFlying);
  const flyTimeRemaining = useGameState((s) => s.flyTimeRemaining);
  const theme = useGameState((s) => s.theme);
  const setScene = useGameState((s) => s.setScene);
  const setTheme = useGameState((s) => s.setTheme);
  const resetGame = useGameState((s) => s.resetGame);
  const testMode = useGameState((s) => s.testMode);
  const startTestMode = useGameState((s) => s.startTestMode);
  const paused = useGameState((s) => s.paused);
  const setPaused = useGameState((s) => s.setPaused);
  const startDailyMode = useGameState((s) => s.startDailyMode);
  const gameSpeed = useAssistMode((s) => s.gameSpeed);
  const controlsRef = useControls();
  useProgressSync();
  const { canInstall, triggerInstall, isInstalled } = usePWAInstall();
  const [muted, setMuted] = useState(isMuted());
  const coinPopupRef = useRef<CoinPopupHandle | null>(null);
  const [pauseSubScreen, setPauseSubScreen] = useState<"main" | "comojogar" | "opcoes">("main");
  const [canPlayDaily, setCanPlayDaily] = useState<boolean | null>(null);
  const [checkingDaily, setCheckingDaily] = useState(false);

  // Mission system hooks
  const gameMode = useGameState((s) => s.gameMode);
  const currentLevelData = useGameState((s) => s.currentLevelData);
  const melLevel = useGameState((s) => s.melLevel);

  // Campaign bone tracking (F49)
  const levelBones = useGameState((s) => s.levelBones);
  const totalBones = useMemo(() => {
    if (!currentLevelData) return 0;
    return currentLevelData.entities.filter((e) => e.type === "bone").length;
  }, [currentLevelData]);

  const levelMissions = useLevelMissions(
    currentLevelData?.missions,
    scene === "playing" && gameMode === "level",
  );

  const infiniteMissions = useInfiniteMissions(
    scene === "playing" && gameMode === "infinite",
  );

  // Check daily eligibility when on menu
  useEffect(() => {
    if (scene === "menu") {
      const playerId = localStorage.getItem("supermel_player_id");
      if (playerId) {
        setCheckingDaily(true);
        fetch(`/api/daily/can-play?playerId=${playerId}`)
          .then(r => r.json())
          .then(data => setCanPlayDaily(data.canPlay))
          .catch(() => setCanPlayDaily(true))
          .finally(() => setCheckingDaily(false));
      } else {
        setCanPlayDaily(true);
      }
    }
  }, [scene]);

  // Audio: maintheme on menu, comeco on playing
  useEffect(() => {
    if (scene === "menu" || scene === "gameover" || scene === "worldmap") {
      playTrack("maintheme", true);
    } else if (scene === "playing") {
      playTrack("comeco", true);
    } else if (scene === "levelclear") {
      // TODO: play victory fanfare SFX when available
      playTrack("maintheme", true);
    }
  }, [scene]);

  // Esc key handler for pause toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape" && scene === "playing") {
        e.preventDefault();
        const state = useGameState.getState();
        state.setPaused(!state.paused);
        if (state.paused) {
          // Was paused, now resuming — reset sub-screen
          setPauseSubScreen("main");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scene]);

  // Gamepad Start button polling for pause toggle (outside Canvas, uses RAF)
  const prevStartRef = useRef(false);
  useEffect(() => {
    let rafId: number;
    const pollStart = () => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (gp) {
        const startPressed = gp.buttons[9]?.pressed ?? false;
        if (startPressed && !prevStartRef.current && scene === "playing") {
          const state = useGameState.getState();
          state.setPaused(!state.paused);
          if (state.paused) {
            setPauseSubScreen("main");
          }
        }
        prevStartRef.current = startPressed;
      }
      rafId = requestAnimationFrame(pollStart);
    };
    rafId = requestAnimationFrame(pollStart);
    return () => cancelAnimationFrame(rafId);
  }, [scene]);

  // Pause handlers
  const handleResume = () => {
    setPaused(false);
    setPauseSubScreen("main");
  };

  const handleRestart = () => {
    setPaused(false);
    setPauseSubScreen("main");
    resetGame();
  };

  const handleMainMenu = () => {
    setPaused(false);
    setPauseSubScreen("main");
    setScene("menu");
  };

  const handleLogout = () => {
    flushProgress(); // Sync progress to backend before clearing session
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

  // Compute Physics timeStep scaled by game speed
  const physicsTimeStep = (1 / 60) * gameSpeed;

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas
        shadows
        camera={{ position: [0, 2, 15], fov: 60 }}
        style={{ background: "#1a1a2e" }}
      >
        <Physics gravity={[0, -15, 0]} paused={paused} timeStep={physicsTimeStep}>
          <SceneContent />
        </Physics>
      </Canvas>

      {/* HUD */}
      <HUD3D
        lives={lives}
        score={score}
        coins={coins}
        scene={scene}
        isFlying={isFlying}
        flyTimeRemaining={flyTimeRemaining}
        infiniteMissions={gameMode === "infinite" ? infiniteMissions.activeMissions : undefined}
        levelBones={levelBones}
        totalBones={totalBones}
      />

      {/* Coin popup overlay */}
      {scene === "playing" && <CoinPopupLayer popupRef={coinPopupRef} />}

      {/* Mission toast overlay */}
      {scene === "playing" && <MissionToast />}

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
              Jogador: {localStorage.getItem("supermel_player_name") || "???"}{" | "}Mel Lv.{melLevel}
            </p>
            <div style={styles.buttonGroup}>
              <button style={styles.btn} onClick={() => resetGame()}>
                JOGAR
              </button>
              <button
                style={{
                  ...styles.btnDaily,
                  opacity: canPlayDaily === false ? 0.4 : 1,
                }}
                disabled={canPlayDaily === false || checkingDaily}
                onClick={() => {
                  const seed = getTodaySeed();
                  startDailyMode(seed);
                }}
              >
                {canPlayDaily === false ? "JA JOGOU HOJE" : checkingDaily ? "VERIFICANDO..." : "DESAFIO DO DIA"}
              </button>
              <button style={styles.btn} onClick={() => setScene("worldmap")}>
                CAMPANHA
              </button>
              <button style={styles.btnTest} onClick={() => startTestMode()}>
                FASE TESTE
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
              {canInstall && (
                <button style={styles.btnInstall} onClick={triggerInstall}>
                  INSTALAR APP
                </button>
              )}
              {isInstalled && (
                <p
                  style={{
                    color: "#4a8a4a",
                    fontSize: "12px",
                    textAlign: "center",
                    fontFamily: "monospace",
                  }}
                >
                  App instalado!
                </p>
              )}
            </div>
          </div>
        )}

        {scene === "gameover" && <GameOverOverlay />}
        {scene === "levelclear" && <LevelClearOverlay missionStatus={levelMissions.missions} />}
        {scene === "levelselect" && <LevelSelectOverlay />}
        {scene === "worldmap" && <WorldMapScene />}
      </div>

      {/* Pause overlay and sub-screens */}
      {paused && scene === "playing" && pauseSubScreen === "main" && (
        <PauseOverlay
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          onComoJogar={() => setPauseSubScreen("comojogar")}
          onOpcoes={() => setPauseSubScreen("opcoes")}
        />
      )}
      {paused && scene === "playing" && pauseSubScreen === "comojogar" && (
        <ComoJogarScreen onBack={() => setPauseSubScreen("main")} />
      )}
      {paused && scene === "playing" && pauseSubScreen === "opcoes" && (
        <AssistModeUI onBack={() => setPauseSubScreen("main")} />
      )}

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
  btnDaily: {
    padding: "14px",
    fontSize: "18px",
    background: "#8a6a2a",
    color: "#fff",
    border: "2px solid #ffcc00",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  btnTest: {
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
  btnInstall: {
    padding: "14px",
    fontSize: "18px",
    background: "#8a4a8a",
    color: "#fff",
    border: "2px solid #ffcc00",
    borderRadius: 4,
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
};
