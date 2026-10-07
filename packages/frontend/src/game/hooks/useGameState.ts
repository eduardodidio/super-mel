import { create } from "zustand";
import type { BackgroundTheme, LevelDataV2 } from "@super-mel/shared";
import { useAssistMode } from "./useAssistMode";

export type GameScene = "menu" | "playing" | "gameover" | "editor" | "levelselect" | "leaderboard" | "levelclear" | "worldmap" | "cutscene";
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

  // Campaign fields (F49)
  campaignLevelId: string | null;
  campaignIndex: number;
  levelBones: number;

  // Cutscene fields (F54)
  cutsceneType: "end_level" | null;
  cutsceneSkipped: boolean;

  // Biome tracking (for infinite mode auto-cycling)
  currentBiome: BackgroundTheme;

  // Mel level (from infinite mission XP)
  melLevel: number;

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
  setLastInputType: (type: InputType) => void;
  setGamepadConnected: (connected: boolean) => void;

  setCurrentBiome: (biome: BackgroundTheme) => void;

  // Level mode actions
  startLevel: (levelId: string, levelData?: LevelDataV2) => void;
  setLastCheckpoint: (x: number, y: number) => void;
  incrementDeaths: () => void;
  completeLevel: () => void;
  setLevelCompleting: (completing: boolean) => void;

  // Cutscene actions (F54)
  startCutscene: (type: "end_level") => void;
  endCutscene: () => void;
  skipCutscene: () => void;

  // Campaign actions (F49)
  addBone: () => void;
  startCampaignLevel: (levelId: string, campaignIndex: number, levelData: LevelDataV2) => void;
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

  // Campaign defaults (F49)
  campaignLevelId: null,
  campaignIndex: -1,
  levelBones: 0,

  // Cutscene defaults (F54)
  cutsceneType: null,
  cutsceneSkipped: false,

  // Biome tracking
  currentBiome: "forest" as BackgroundTheme,

  // Mel level (derived from infinite mission XP in localStorage)
  melLevel: (() => {
    try {
      const data = JSON.parse(localStorage.getItem("supermel_infinite_missions") || "{}");
      return Math.floor((data.melXp || 0) / 500) + 1;
    } catch { return 1; }
  })(),

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
  setCurrentBiome: (biome) => set({ currentBiome: biome }),
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
  setLastInputType: (type) => set({ lastInputType: type }),
  setGamepadConnected: (connected) => set({ gamepadConnected: connected }),
  resetGame: () => {
    const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
    set({
      score: 0, lives: maxHearts, coins: 0, scene: "playing", paused: false,
      testMode: false, dailyMode: false, dailySeed: 0,       gameMode: "infinite", levelId: null, deaths: 0, lastCheckpoint: null,
      levelCompleting: false, levelStartTime: 0, levelCoins: 0, currentLevelData: null,
      currentBiome: "forest" as BackgroundTheme,
      campaignLevelId: null, campaignIndex: -1, levelBones: 0,
      cutsceneType: null, cutsceneSkipped: false,
    });
  },
  startTestMode: () => {
    const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
    set({
      score: 0, lives: maxHearts, coins: 0, scene: "playing", paused: false,
      testMode: true, dailyMode: false, dailySeed: 0,       gameMode: "infinite", levelId: null, deaths: 0, lastCheckpoint: null,
      levelCompleting: false, levelStartTime: 0, levelCoins: 0, currentLevelData: null,
      currentBiome: "forest" as BackgroundTheme,
      campaignLevelId: null, campaignIndex: -1, levelBones: 0,
      cutsceneType: null, cutsceneSkipped: false,
    });
  },
  startDailyMode: (seed) => {
    const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
    set({
      score: 0, lives: maxHearts, coins: 0, scene: "playing", paused: false,
      testMode: false, dailyMode: true, dailySeed: seed,       gameMode: "infinite", levelId: null, deaths: 0, lastCheckpoint: null,
      levelCompleting: false, levelStartTime: 0, levelCoins: 0, currentLevelData: null,
      currentBiome: "forest" as BackgroundTheme,
      campaignLevelId: null, campaignIndex: -1, levelBones: 0,
      cutsceneType: null, cutsceneSkipped: false,
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
      levelStartTime: Date.now(),
      currentBiome: "forest" as BackgroundTheme,
      campaignLevelId: null, campaignIndex: -1, levelBones: 0,
      cutsceneType: null, cutsceneSkipped: false,
    });
  },
  setLastCheckpoint: (x, y) => set({ lastCheckpoint: { x, y } }),
  incrementDeaths: () => set((s) => ({ deaths: s.deaths + 1 })),
  completeLevel: () => set({
    scene: "cutscene",
    cutsceneType: "end_level",
    cutsceneSkipped: false,
    levelCompleting: false,
  }),
  setLevelCompleting: (completing) => set({ levelCompleting: completing }),

  // Cutscene actions (F54)
  startCutscene: (type) => set({
    scene: "cutscene",
    cutsceneType: type,
    cutsceneSkipped: false,
    levelCompleting: false,
  }),
  endCutscene: () => set({
    scene: "levelclear",
    cutsceneType: null,
  }),
  skipCutscene: () => set({
    scene: "levelclear",
    cutsceneType: null,
    cutsceneSkipped: true,
  }),

  // Campaign actions (F49)
  addBone: () => set((s) => ({ levelBones: s.levelBones + 1 })),
  startCampaignLevel: (levelId, campaignIndex, levelData) => {
    const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
    set({
      gameMode: "level",
      levelId,
      campaignLevelId: levelId,
      campaignIndex,
      currentLevelData: levelData,
      score: 0,
      lives: maxHearts,
      coins: 0,
      levelCoins: 0,
      levelBones: 0,
      deaths: 0,
      lastCheckpoint: null,
      levelCompleting: false,
      scene: "playing",
      paused: false,
      testMode: false,
      dailyMode: false,
      dailySeed: 0,
      levelStartTime: Date.now(),
      currentBiome: "forest" as BackgroundTheme,
      cutsceneType: null, cutsceneSkipped: false,
    });
  },
}));

/** Shared cleanup for returning to menu/worldmap from campaign context. */
export function cleanupCampaignState() {
  useGameState.setState({
    campaignLevelId: null,
    campaignIndex: -1,
    currentLevelData: null,
    gameMode: "infinite" as const,
    levelId: null,
    levelCoins: 0,
    levelBones: 0,
    deaths: 0,
    lastCheckpoint: null,
    levelCompleting: false,
  });
}
