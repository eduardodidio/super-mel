import { create } from "zustand";
import type { BackgroundTheme, LevelDataV2 } from "@super-mel/shared";
import { useAssistMode } from "./useAssistMode";

export type GameScene = "menu" | "playing" | "gameover" | "editor" | "levelselect" | "leaderboard" | "levelclear";
export type InputType = "keyboard" | "touch" | "gamepad";

interface GameState {
  scene: GameScene;
  score: number;
  lives: number;
  theme: BackgroundTheme;
  paused: boolean;
  coins: number;
  totalCoins: number;
  testMode: boolean;
  dailyMode: boolean;
  dailySeed: number;
  isFlying: boolean;
  flyTimeRemaining: number;
  lastInputType: InputType;
  gamepadConnected: boolean;

  // Level mode fields
  gameMode: "infinite" | "level";
  levelId: string | null;
  deaths: number;
  lastCheckpoint: { x: number; y: number } | null;
  levelCompleting: boolean;
  levelStartTime: number;
  levelCoins: number;
  currentLevelData: LevelDataV2 | null;

  setScene: (scene: GameScene) => void;
  setScore: (score: number) => void;
  addScore: (delta: number) => void;
  setLives: (lives: number) => void;
  loseLife: () => void;
  setTheme: (theme: BackgroundTheme) => void;
  setPaused: (paused: boolean) => void;
  addCoin: () => void;
  healLife: () => void;
  resetGame: () => void;
  startTestMode: () => void;
  startDailyMode: (seed: number) => void;
  setFlyState: (isFlying: boolean, flyTimeRemaining: number) => void;
  setLastInputType: (type: InputType) => void;
  setGamepadConnected: (connected: boolean) => void;

  // Level mode actions
  startLevel: (levelId: string, levelData?: LevelDataV2) => void;
  setLastCheckpoint: (x: number, y: number) => void;
  incrementDeaths: () => void;
  completeLevel: () => void;
  setLevelCompleting: (completing: boolean) => void;
}

export const useGameState = create<GameState>((set) => ({
  scene: "menu",
  score: 0,
  lives: 3,
  theme: "forest",
  paused: false,
  coins: 0,
  testMode: false,
  dailyMode: false,
  dailySeed: 0,
  isFlying: false,
  flyTimeRemaining: 5,
  lastInputType: "keyboard" as InputType,
  gamepadConnected: false,
  totalCoins: (() => {
    try {
      return parseInt(localStorage.getItem("supermel_total_coins") || "0", 10);
    } catch {
      return 0;
    }
  })(),

  // Level mode defaults
  gameMode: "infinite",
  levelId: null,
  deaths: 0,
  lastCheckpoint: null,
  levelCompleting: false,
  levelStartTime: 0,
  levelCoins: 0,
  currentLevelData: null,

  setScene: (scene) => set({ scene }),
  setScore: (score) => set({ score }),
  addScore: (delta) => set((s) => ({ score: s.score + delta })),
  setLives: (lives) => set({ lives }),
  loseLife: () =>
    set((s) => {
      if (s.gameMode === "level") {
        // Level mode: respawn with full hearts, increment deaths, never gameover
        const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
        return { lives: maxHearts, deaths: s.deaths + 1 };
      }
      // Infinite mode: game over at 0 lives
      const lives = s.lives - 1;
      if (lives <= 0) {
        return { lives, scene: "gameover" as GameScene, testMode: false, paused: false };
      }
      return { lives };
    }),
  setTheme: (theme) => set({ theme }),
  setPaused: (paused) => set({ paused }),
  healLife: () => set((s) => {
    const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
    return { lives: Math.min(s.lives + 1, maxHearts) };
  }),
  addCoin: () =>
    set((s) => {
      const totalCoins = s.totalCoins + 1;
      try {
        localStorage.setItem("supermel_total_coins", String(totalCoins));
      } catch {}
      return {
        coins: s.coins + 1,
        totalCoins,
        levelCoins: s.gameMode === "level" ? s.levelCoins + 1 : s.levelCoins,
      };
    }),
  setFlyState: (isFlying, flyTimeRemaining) => set({ isFlying, flyTimeRemaining }),
  setLastInputType: (type) => set({ lastInputType: type }),
  setGamepadConnected: (connected) => set({ gamepadConnected: connected }),
  resetGame: () => {
    const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
    set({
      score: 0, lives: maxHearts, coins: 0, scene: "playing", paused: false,
      testMode: false, dailyMode: false, dailySeed: 0, isFlying: false, flyTimeRemaining: 5,
      gameMode: "infinite", levelId: null, deaths: 0, lastCheckpoint: null,
      levelCompleting: false, levelStartTime: 0, levelCoins: 0, currentLevelData: null,
    });
  },
  startTestMode: () => {
    const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
    set({
      score: 0, lives: maxHearts, coins: 0, scene: "playing", paused: false,
      testMode: true, dailyMode: false, dailySeed: 0, isFlying: false, flyTimeRemaining: 5,
      gameMode: "infinite", levelId: null, deaths: 0, lastCheckpoint: null,
      levelCompleting: false, levelStartTime: 0, levelCoins: 0, currentLevelData: null,
    });
  },
  startDailyMode: (seed) => {
    const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
    set({
      score: 0, lives: maxHearts, coins: 0, scene: "playing", paused: false,
      testMode: false, dailyMode: true, dailySeed: seed, isFlying: false, flyTimeRemaining: 5,
      gameMode: "infinite", levelId: null, deaths: 0, lastCheckpoint: null,
      levelCompleting: false, levelStartTime: 0, levelCoins: 0, currentLevelData: null,
    });
  },

  // Level mode actions
  startLevel: (levelId, levelData) => {
    const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
    set({
      gameMode: "level",
      levelId,
      currentLevelData: levelData ?? null,
      score: 0,
      lives: maxHearts,
      coins: 0,
      levelCoins: 0,
      deaths: 0,
      lastCheckpoint: null,
      levelCompleting: false,
      scene: "playing",
      paused: false,
      testMode: false,
      dailyMode: false,
      dailySeed: 0,
      isFlying: false,
      flyTimeRemaining: 5,
      levelStartTime: Date.now(),
    });
  },
  setLastCheckpoint: (x, y) => set({ lastCheckpoint: { x, y } }),
  incrementDeaths: () => set((s) => ({ deaths: s.deaths + 1 })),
  completeLevel: () => set({ scene: "levelclear", levelCompleting: false }),
  setLevelCompleting: (completing) => set({ levelCompleting: completing }),
}));
