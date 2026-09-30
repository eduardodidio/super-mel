import { create } from "zustand";
import type { BackgroundTheme } from "@super-mel/shared";
import { useAssistMode } from "./useAssistMode";

export type GameScene = "menu" | "playing" | "gameover" | "editor" | "levelselect" | "leaderboard";
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

  setScene: (scene) => set({ scene }),
  setScore: (score) => set({ score }),
  addScore: (delta) => set((s) => ({ score: s.score + delta })),
  setLives: (lives) => set({ lives }),
  loseLife: () =>
    set((s) => {
      const lives = s.lives - 1;
      if (lives <= 0) {
        return { lives, scene: "gameover", testMode: false, paused: false };
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
      return { coins: s.coins + 1, totalCoins };
    }),
  setFlyState: (isFlying, flyTimeRemaining) => set({ isFlying, flyTimeRemaining }),
  setLastInputType: (type) => set({ lastInputType: type }),
  setGamepadConnected: (connected) => set({ gamepadConnected: connected }),
  resetGame: () => {
    const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
    set({ score: 0, lives: maxHearts, coins: 0, scene: "playing", paused: false, testMode: false, dailyMode: false, dailySeed: 0, isFlying: false, flyTimeRemaining: 5 });
  },
  startTestMode: () => {
    const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
    set({ score: 0, lives: maxHearts, coins: 0, scene: "playing", paused: false, testMode: true, dailyMode: false, dailySeed: 0, isFlying: false, flyTimeRemaining: 5 });
  },
  startDailyMode: (seed) => {
    const maxHearts = useAssistMode.getState().fiveHearts ? 5 : 3;
    set({ score: 0, lives: maxHearts, coins: 0, scene: "playing", paused: false, testMode: false, dailyMode: true, dailySeed: seed, isFlying: false, flyTimeRemaining: 5 });
  },
}));
