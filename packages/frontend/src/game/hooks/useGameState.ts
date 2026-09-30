import { create } from "zustand";
import type { BackgroundTheme } from "@super-mel/shared";

export type GameScene = "menu" | "playing" | "gameover" | "editor" | "levelselect" | "leaderboard";

interface GameState {
  scene: GameScene;
  score: number;
  lives: number;
  theme: BackgroundTheme;
  paused: boolean;
  coins: number;
  totalCoins: number;
  testMode: boolean;

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
}

export const useGameState = create<GameState>((set) => ({
  scene: "menu",
  score: 0,
  lives: 3,
  theme: "forest",
  paused: false,
  coins: 0,
  testMode: false,
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
        return { lives, scene: "gameover", testMode: false };
      }
      return { lives };
    }),
  setTheme: (theme) => set({ theme }),
  setPaused: (paused) => set({ paused }),
  healLife: () => set((s) => ({ lives: Math.min(s.lives + 1, 3) })),
  addCoin: () =>
    set((s) => {
      const totalCoins = s.totalCoins + 1;
      try {
        localStorage.setItem("supermel_total_coins", String(totalCoins));
      } catch {}
      return { coins: s.coins + 1, totalCoins };
    }),
  resetGame: () => set({ score: 0, lives: 3, coins: 0, scene: "playing", paused: false, testMode: false }),
  startTestMode: () => set({ score: 0, lives: 3, coins: 0, scene: "playing", paused: false, testMode: true }),
}));
